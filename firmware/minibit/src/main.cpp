// MiniBit 0.1: pixel-exact screens from the prototype, with tap and swipe navigation.
// Screens are pre-rendered RGB565 images in the "screens" flash partition (see tools/make_assets.py),
// tap targets come from src/hits.h (see tools/make_hits.py). Nothing is live yet (clock, timer, pet are static).
#include <Arduino.h>
#include <Wire.h>
#include <Arduino_GFX_Library.h>
#include <esp_partition.h>
#include "hits.h"
#include "version.h"

#define PW 368            // panel is portrait 368 x 448
#define PH 448
#define STRIPE 16         // rows per transfer (CO5300 wants even-aligned windows)
#define LCD_CS 12
#define LCD_SCLK 11
#define LCD_SDIO0 4
#define LCD_SDIO1 5
#define LCD_SDIO2 6
#define LCD_SDIO3 7
#define I2C_SDA 15
#define I2C_SCL 14
#define EXP_ADDR 0x20     // XCA9554 I/O expander on board revision V2 (powers/reset display and touch)
#define TP_CST816 0x15    // touch on V2
#define TP_FT3168 0x38    // touch on the original revision

static Arduino_DataBus *bus = nullptr;
static Arduino_CO5300 *gfx = nullptr;
static uint8_t tpAddr = 0;
static const uint8_t *screens = nullptr;
static uint16_t *stripe = nullptr;
static int cur = -1;
static int8_t stack_[16]; static int sp = 0;

static bool i2cProbe(uint8_t a) { Wire.beginTransmission(a); return Wire.endTransmission() == 0; }
static void i2cWrite(uint8_t a, uint8_t r, uint8_t v) { Wire.beginTransmission(a); Wire.write(r); Wire.write(v); Wire.endTransmission(); }

static void drawScreen(int i) {
  const uint16_t *src = (const uint16_t *)(screens + (size_t)i * PW * PH * 2);
  for (int y = 0; y < PH; y += STRIPE) {
    memcpy(stripe, src + (size_t)y * PW, PW * STRIPE * 2);
    gfx->draw16bitRGBBitmap(0, y, stripe, PW, STRIPE);
  }
}
static void show(int i) { cur = i; drawScreen(i); Serial.printf("screen %s\n", SCR_NAMES[i]); }
static void go(int i) { if (i == cur) return; if (sp < 16) stack_[sp++] = cur; show(i); }
static void goBack() {
  int t = BACKS[cur];
  if (t >= 0) { sp = 0; show(t); return; }
  if (sp > 0) { show(stack_[--sp]); return; }
  show(SCR_HOME);
}
static void goHome() { sp = 0; show(SCR_HOME); }

// Touch: both controllers share the register layout (0x02 = touch count, then X/Y high+low).
static bool touchRead(int &x, int &y) {
  Wire.beginTransmission(tpAddr); Wire.write(0x02);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((int)tpAddr, 5) != 5) return false;
  uint8_t n = Wire.read() & 0x0F, xh = Wire.read(), xl = Wire.read(), yh = Wire.read(), yl = Wire.read();
  if (n == 0 || n > 2) return false;
  x = ((xh & 0x0F) << 8) | xl; y = ((yh & 0x0F) << 8) | yl;
  return true;
}
// Panel pixel (px,py) to design coordinates (448 x 368 landscape).
static void toDesign(int px, int py, int &dx, int &dy) {
#ifdef MB_FLIP
  dx = (PH - 1) - py; dy = px;           // USB-C on the left
#else
  dx = py; dy = (PW - 1) - px;           // USB-C on the right (default)
#endif
}

static void tap(int dx, int dy) {
  for (int k = NHITS[cur] - 1; k >= 0; k--) {          // last one drawn wins
    const Hit &h = HITS[cur][k];
    if (dx >= h.x && dx < h.x + h.w && dy >= h.y && dy < h.y + h.h) {
      if (h.to == S_BACK) goBack(); else if (h.to == S_HOME) goHome(); else if (h.to >= 0) go(h.to);
      return;
    }
  }
}

static void message(const char *l1, const char *l2) {
  gfx->fillScreen(0x0000); gfx->setTextColor(0xFFFF); gfx->setTextSize(2);
  gfx->setCursor(16, 180); gfx->println(l1); gfx->setCursor(16, 220); gfx->println(l2);
}

void setup() {
  Serial.begin(115200);
  delay(1500);
  Serial.printf("MiniBit firmware %s\n", FW_VERSION);
  Wire.begin(I2C_SDA, I2C_SCL); Wire.setClock(400000);
  if (i2cProbe(EXP_ADDR)) {                 // V2: pulse display and touch reset through the expander
    i2cWrite(EXP_ADDR, 0x03, 0xF8);         // pins 0-2 as outputs
    i2cWrite(EXP_ADDR, 0x01, 0x00); delay(20);
    i2cWrite(EXP_ADDR, 0x01, 0x07); delay(60);
  }
  bool v2 = i2cProbe(TP_CST816);
  tpAddr = v2 ? TP_CST816 : (i2cProbe(TP_FT3168) ? TP_FT3168 : 0);
  Serial.printf("board %s, touch 0x%02X\n", v2 ? "V2" : "original", tpAddr);

  bus = new Arduino_ESP32QSPI(LCD_CS, LCD_SCLK, LCD_SDIO0, LCD_SDIO1, LCD_SDIO2, LCD_SDIO3);
  gfx = new Arduino_CO5300(bus, GFX_NOT_DEFINED, 0, false /* ips */, PW, PH, v2 ? 16 : 0, 0, 0, 0);
  if (!gfx->begin()) { Serial.println("display init failed"); while (true) delay(1000); }
  gfx->setBrightness(220);

  stripe = (uint16_t *)heap_caps_malloc(PW * STRIPE * 2, MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL);
  const esp_partition_t *p = esp_partition_find_first(ESP_PARTITION_TYPE_DATA, (esp_partition_subtype_t)0x40, "screens");
  const void *ptr = nullptr; esp_partition_mmap_handle_t hnd;
  if (!p || (size_t)SCR_COUNT * PW * PH * 2 > p->size || esp_partition_mmap(p, 0, (size_t)SCR_COUNT * PW * PH * 2, ESP_PARTITION_MMAP_DATA, &ptr, &hnd) != ESP_OK) {
    message("Screens missing.", "Flash with New install.");
    while (true) delay(1000);
  }
  screens = (const uint8_t *)ptr;
  show(SCR_BOOT); delay(2500); show(SCR_HOME);
}


// Hidden calibration mode (hold a finger 3 s on any screen): panel border, grid, corner markers and raw touch values.
static void calibrate() {
  gfx->fillScreen(0xF800); delay(1500);                       // solid red: any area that stays green/black is not covered by the window
  gfx->fillScreen(0x0000);
  for (int x = 0; x < PW; x += 50) gfx->drawFastVLine(x, 0, PH, 0x4208);
  for (int y = 0; y < PH; y += 50) gfx->drawFastHLine(0, y, PW, 0x4208);
  gfx->drawRect(0, 0, PW, PH, 0xFFFF); gfx->drawRect(1, 1, PW - 2, PH - 2, 0xFFFF);
  gfx->fillRect(2, 2, 24, 24, 0xF800); gfx->fillRect(PW - 26, 2, 24, 24, 0x07E0);
  gfx->fillRect(2, PH - 26, 24, 24, 0x001F); gfx->fillRect(PW - 26, PH - 26, 24, 24, 0xFFE0);
  gfx->setTextSize(2); gfx->setTextColor(0xFFFF, 0x0000);
  gfx->setCursor(40, 40); gfx->printf("%dx%d", PW, PH);
  gfx->setCursor(40, 64); gfx->print("red=TL grn=TR");
  gfx->setCursor(40, 88); gfx->print("blu=BL yel=BR");
  gfx->setCursor(40, 112); gfx->print("touch the screen");
  uint32_t idle = millis();
  while (true) {
    int px, py;
    if (tpAddr && touchRead(px, py)) {
      idle = millis();
      int dx, dy; toDesign(px, py, dx, dy);
      gfx->fillRect(40, 200, 300, 70, 0x0000);
      gfx->setCursor(40, 204); gfx->printf("raw  %d,%d", px, py);
      gfx->setCursor(40, 228); gfx->printf("map  %d,%d", dx, dy);
      gfx->drawFastHLine(px - 12, py, 25, 0xFFFF); gfx->drawFastVLine(px, py - 12, 25, 0xFFFF);
      Serial.printf("cal raw %d,%d map %d,%d\n", px, py, dx, dy);
    }
    if (millis() - idle > 30000) ESP.restart();
    delay(20);
  }
}

static bool down = false; static int sx, sy, lx, ly; static uint32_t t0; static bool longDone = false;

void loop() {
  int px, py;
  bool t = tpAddr && touchRead(px, py);
  if (t) {
    int dx, dy; toDesign(px, py, dx, dy);
    if (!down) { down = true; sx = lx = dx; sy = ly = dy; t0 = millis(); longDone = false; }
    lx = dx; ly = dy;
    if (millis() - t0 > 3000 && abs(lx - sx) < 20 && abs(ly - sy) < 20) calibrate();
    if (!longDone && cur == SCR_HOME && millis() - t0 > 700 && abs(lx - sx) < 20 && abs(ly - sy) < 20) { longDone = true; go(SCR_MENU); }
  } else if (down) {
    down = false;
    int mx = lx - sx, my = ly - sy;
    if (!longDone) {
      if (cur == SCR_HOME || cur == SCR_HOME2) {
        if (abs(mx) > 40 && abs(mx) > abs(my)) show(cur == SCR_HOME ? SCR_HOME2 : SCR_HOME);
        else if (my < -40) go(SCR_MENU);
        else if (abs(mx) < 20 && abs(my) < 20) tap(sx, sy);
      } else if (mx > 60 && abs(mx) > abs(my) * 2) goBack();
      else if (abs(mx) < 20 && abs(my) < 20) tap(sx, sy);
    }
  }
  delay(8);
}
