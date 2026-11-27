// MiniBit 0.1: pixel-exact screens from the prototype, with tap and swipe navigation.
// Screens are pre-rendered RGB565 images in the "screens" flash partition (see tools/make_assets.py),
// tap targets come from src/hits.h (see tools/make_hits.py). Nothing is live yet (clock, timer, pet are static).
#include <Arduino.h>
#include <Wire.h>
#include <Arduino_GFX_Library.h>
#include <esp_partition.h>
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
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

// The visible panel is larger than the 368 x 448 screen image: draw the image centred in a PNL_W x PNL_H area.
#ifndef PNL_W
#define PNL_W 410
#endif
#ifndef PNL_H
#define PNL_H 502
#endif
#define GFX_W 480   // drawing area handed to the driver (larger than the glass, so nothing is clipped early)
#define GFX_H 520
static const int OX = ((PNL_W - PW) / 2) & ~1;   // even-aligned, the CO5300 needs that
static const int OY = ((PNL_H - PH) / 2) & ~1;

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
    gfx->draw16bitRGBBitmap(OX, OY + y, stripe, PW, STRIPE);
  }
}

static void show(int i);
// ---- Wi-Fi setup, the same way as POWout: MiniBit opens its own hotspot, the phone joins it by QR code and the
// ---- password is typed on a web page on the phone (not on the tiny screen).
#define AP_NAME "MiniBit-setup"
static Preferences prefs;
static WebServer web(80); static DNSServer dns;
static bool apOn = false, routesSet = false;
static volatile bool credsIn = false;
static char selSsid[33] = "", selPass[65] = "";
static int wifiState = 0;                 // 0 idle, 1 connecting, 2 connected, 3 failed
static uint32_t connT0 = 0;
static String netOptions;                 // <option> list of networks seen before the hotspot opened

static String esc(const char *t) { String o; for (; *t; t++) { if (*t == '&') o += "&amp;"; else if (*t == '<') o += "&lt;"; else if (*t == '"') o += "&quot;"; else o += *t; } return o; }
static void scanForForm() {
  netOptions = "";
  int n = WiFi.scanNetworks(), shown = 0;
  for (int i = 0; i < n && shown < 12; i++) {
    String id = WiFi.SSID(i); if (id.length() == 0) continue;
    String e = esc(id.c_str());
    if (netOptions.indexOf("\"" + e + "\"") >= 0) continue;
    netOptions += "<option value=\"" + e + "\">"; shown++;
  }
  WiFi.scanDelete();
}
static void handleRoot() {
  String h = F("<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><body style='font-family:sans-serif;background:#050608;color:#dce9ff;padding:24px;max-width:420px;margin:auto'>"
               "<h2>MiniBit Wi-Fi</h2><form method=POST action=/save>"
               "<p>Network name<br><input name=ssid list=nets autocapitalize=none autocorrect=off style='width:100%;font-size:18px;padding:8px'><datalist id=nets>");
  h += netOptions;
  h += F("</datalist></p><p>Password<br><input name=pass type=password style='width:100%;font-size:18px;padding:8px'></p>"
         "<button style='width:100%;font-size:20px;padding:12px;border-radius:24px;border:0;background:#46e6ff'>Connect</button></form></body>");
  web.send(200, "text/html", h);
}
static void handleSave() {
  strncpy(selSsid, web.arg("ssid").c_str(), 32); selSsid[32] = 0;
  strncpy(selPass, web.arg("pass").c_str(), 64); selPass[64] = 0;
  web.send(200, "text/html", F("<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'><body style='font-family:sans-serif;background:#050608;color:#dce9ff;padding:24px'><h2>Connecting...</h2><p>Look at your MiniBit.</p></body>"));
  credsIn = true;
}
static void startPortal() {
  if (apOn) return;
  WiFi.mode(WIFI_AP_STA); WiFi.disconnect();
  scanForForm();
  WiFi.softAP(AP_NAME);
  dns.start(53, "*", WiFi.softAPIP());
  if (!routesSet) { web.on("/", HTTP_GET, handleRoot); web.on("/save", HTTP_POST, handleSave); web.onNotFound(handleRoot); routesSet = true; }
  web.begin(); apOn = true; credsIn = false; wifiState = 0;
  Serial.printf("Setup portal on, ip %s\n", WiFi.softAPIP().toString().c_str());
}
static void stopPortal() {
  if (!apOn) return;
  web.stop(); dns.stop(); WiFi.softAPdisconnect(true); WiFi.mode(WIFI_STA); apOn = false;
}
static void wifiLoop() {
  if (apOn) { dns.processNextRequest(); web.handleClient(); }
  if (credsIn) {
    credsIn = false; Serial.printf("Connecting to %s\n", selSsid);
    WiFi.begin(selSsid, selPass); wifiState = 1; connT0 = millis(); show(SCR_WIFIWAIT);
  }
  if (wifiState == 1) {
    if (WiFi.status() == WL_CONNECTED) {
      wifiState = 2; prefs.begin("minibit", false); prefs.putString("ssid", selSsid); prefs.putString("pass", selPass); prefs.end();
      delay(800); stopPortal(); show(SCR_WIFIOK);
    } else if (millis() - connT0 > 20000) { wifiState = 3; WiFi.disconnect(); show(SCR_WIFIFAIL); }
  }
}
static void wifiBoot() {                  // reconnect with the saved network, in the background
  prefs.begin("minibit", true); String a = prefs.getString("ssid", ""), b = prefs.getString("pass", ""); prefs.end();
  if (a.length()) { WiFi.mode(WIFI_STA); WiFi.begin(a.c_str(), b.c_str()); Serial.printf("Wi-Fi: reconnecting to %s\n", a.c_str()); }
}

static void show(int i) {
  cur = i; drawScreen(i); Serial.printf("screen %s\n", SCR_NAMES[i]);
  if (i == SCR_WIFIJOIN) startPortal();
  else if (i != SCR_WIFIWAIT && i != SCR_WIFIOK && apOn) stopPortal();
}
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

static bool hitAt(int dx, int dy, int pad) {
  for (int k = NHITS[cur] - 1; k >= 0; k--) {          // last one drawn wins
    const Hit &h = HITS[cur][k];
    if (dx >= h.x - pad && dx < h.x + h.w + pad && dy >= h.y - pad && dy < h.y + h.h + pad) {
      if (h.to == S_BACK) goBack(); else if (h.to == S_HOME) goHome(); else if (h.to >= 0) go(h.to);
      return true;
    }
  }
  return false;
}
static void tap(int dx, int dy) {
  if (hitAt(dx, dy, 0)) return;
  // near miss: take the closest button within reach (a little more room along the top bar)
  int reach = dy < 48 ? 18 : 12, best = -1, bd = 1 << 30;
  for (int k = 0; k < NHITS[cur]; k++) {
    const Hit &h = HITS[cur][k];
    int ex = dx < h.x ? h.x - dx : (dx > h.x + h.w - 1 ? dx - (h.x + h.w - 1) : 0);
    int ey = dy < h.y ? h.y - dy : (dy > h.y + h.h - 1 ? dy - (h.y + h.h - 1) : 0);
    int d = ex * ex + ey * ey;
    if (d <= reach * reach && d < bd) { bd = d; best = k; }
  }
  if (best >= 0) { int to = HITS[cur][best].to; if (to == S_BACK) goBack(); else if (to == S_HOME) goHome(); else if (to >= 0) go(to); }
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
  gfx = new Arduino_CO5300(bus, GFX_NOT_DEFINED, 0, false /* ips */, GFX_W, GFX_H, v2 ? 16 : 0, 0, 0, 0);
  if (!gfx->begin()) { Serial.println("display init failed"); while (true) delay(1000); }
  gfx->setBrightness(220);
  gfx->fillScreen(0x0000);

  stripe = (uint16_t *)heap_caps_malloc(PW * STRIPE * 2, MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL);
  const esp_partition_t *p = esp_partition_find_first(ESP_PARTITION_TYPE_DATA, (esp_partition_subtype_t)0x40, "screens");
  const void *ptr = nullptr; esp_partition_mmap_handle_t hnd;
  if (!p || (size_t)SCR_COUNT * PW * PH * 2 > p->size || esp_partition_mmap(p, 0, (size_t)SCR_COUNT * PW * PH * 2, ESP_PARTITION_MMAP_DATA, &ptr, &hnd) != ESP_OK) {
    message("Screens missing.", "Flash with New install.");
    while (true) delay(1000);
  }
  screens = (const uint8_t *)ptr;
  wifiBoot();
  show(SCR_BOOT); delay(2500); show(SCR_HOME);
}


// Hidden calibration mode (hold a finger 3 s on any screen): panel border, grid, corner markers and raw touch values.
static void calibrate() {
  gfx->fillScreen(0xF800); delay(1500);                       // solid red over the whole drawing area
  gfx->fillScreen(0x0000);
  for (int x = 0; x < GFX_W; x += 50) gfx->drawFastVLine(x, 0, GFX_H, 0x4208);
  for (int y = 0; y < GFX_H; y += 50) gfx->drawFastHLine(0, y, GFX_W, 0x4208);
  gfx->setTextSize(1); gfx->setTextColor(0xFFE0, 0x0000);
  for (int x = 50; x < GFX_W; x += 50) { gfx->setCursor(x + 2, 4); gfx->print(x); gfx->setCursor(x + 2, 300); gfx->print(x); }
  for (int y = 50; y < GFX_H; y += 50) { gfx->setCursor(4, y + 2); gfx->print(y); gfx->setCursor(300, y + 2); gfx->print(y); }
  gfx->drawRect(OX, OY, PW, PH, 0xFFFF);                      // where the screen image goes
  gfx->drawRect(0, 0, PNL_W, PNL_H, 0x07E0);                  // assumed glass size
  gfx->setTextSize(2); gfx->setTextColor(0xFFFF, 0x0000);
  gfx->setCursor(30, 30); gfx->printf("img %d,%d", OX, OY);
  gfx->setCursor(30, 54); gfx->printf("glass %dx%d", PNL_W, PNL_H);
  uint32_t idle = millis();
  while (true) {
    int px, py;
    if (tpAddr && touchRead(px, py)) {
      idle = millis();
      gfx->fillRect(30, 380, 250, 50, 0x0000);
      gfx->setCursor(30, 384); gfx->printf("raw %d,%d", px, py);
      gfx->drawFastHLine(px - 12, py, 25, 0xFFFF); gfx->drawFastVLine(px, py - 12, 25, 0xFFFF);
      Serial.printf("cal raw %d,%d\n", px, py);
    }
    if (millis() - idle > 30000) ESP.restart();
    delay(20);
  }
}

static bool down = false; static int sx, sy, lx, ly; static uint32_t t0; static bool longDone = false;

void loop() {
  wifiLoop();
  int px, py;
  bool t = tpAddr && touchRead(px, py);
  if (t) {
    px -= OX; py -= OY;
    if (px < 0) px = 0; if (py < 0) py = 0; if (px >= PW) px = PW - 1; if (py >= PH) py = PH - 1;
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
        if (abs(mx) > 35 && abs(mx) > abs(my)) show(cur == SCR_HOME ? SCR_HOME2 : SCR_HOME);
        else if (my < -40) go(SCR_MENU);
        else if (abs(mx) < 24 && abs(my) < 24) tap(sx, sy);
      } else if (mx > 45 && abs(mx) > abs(my)) goBack();
      else if (abs(mx) < 24 && abs(my) < 24) tap(sx, sy);
    }
  }
  delay(8);
}
