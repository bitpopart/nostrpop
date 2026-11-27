// TriBe POWout firmware for the Waveshare ESP32-S3-Touch-AMOLED-2.06.
// Black and white UI drawn with a 5x7 dot font, the same look as the design screens.
// 0.2.x screens: Home, Menu, Breathe picker, Calm 4-6, Box 4-4-4-4, 4-7-8, Done.
// Navigation: touch, plus the BOOT button as "back".
#include <Arduino.h>
#include <Wire.h>
#include <Arduino_GFX_Library.h>
#include "version.h"
#include "dotfont.h"

// ---- Board pins (Waveshare ESP32-S3-Touch-AMOLED-2.06 docs) ----
#define LCD_SDIO0 4
#define LCD_SDIO1 5
#define LCD_SDIO2 6
#define LCD_SDIO3 7
#define LCD_SCLK 11
#define LCD_CS 12
#define LCD_RESET 8
#define LCD_W 410
#define LCD_H 502
#define TP_RESET 9
#define TP_INT 38
#define I2C_SDA 15
#define I2C_SCL 14
#define BTN_BOOT 0
#define FT_ADDR 0x38

Arduino_DataBus *bus = new Arduino_ESP32QSPI(LCD_CS, LCD_SCLK, LCD_SDIO0, LCD_SDIO1, LCD_SDIO2, LCD_SDIO3);
Arduino_CO5300 *gfx = new Arduino_CO5300(bus, LCD_RESET, 0, false /* ips */, LCD_W, LCD_H, 22, 0, 0, 0);

// The design is 368x448. The panel is 410 wide, so everything is scaled by S.
static const float S = 410.0f / 368.0f;
static const int OFFY = (LCD_H - (int)(448 * S)) / 2;
static inline int X(float v) { return (int)(v * S + 0.5f); }
static inline int Y(float v) { return (int)(v * S + 0.5f) + OFFY; }
static inline int D(float v) { return (int)(v * S + 0.5f); }

uint16_t C_BG, C_FG, C_GREY, C_PANEL, C_LINE;

// A region canvas for flicker-free animation (only this rectangle is sent to the panel).
static const int AW = 260, AH = 260;
static int AX0, AY0;
Arduino_Canvas *anim = nullptr;

// ---- Dot font ----
static const uint8_t *glyphFor(char c) {
  if (c >= 'a' && c <= 'z' && c != 'o' && c != 't' && c != 'u') c -= 32;
  for (int i = 0; i < DOT_GLYPH_COUNT; i++) if (DOT_GLYPHS[i].ch == c) return DOT_GLYPHS[i].row;
  for (int i = 0; i < DOT_GLYPH_COUNT; i++) if (DOT_GLYPHS[i].ch == '?') return DOT_GLYPHS[i].row;
  return nullptr;
}
// Width in design px of a string at a given cell size.
static float dotWidth(const char *s, float cell) {
  int n = strlen(s);
  return n ? (n * 6 - 1) * cell : 0;
}
// Draw into any Arduino_GFX. cx,cy are the centre (top) in target pixels, cellPx in target pixels.
static void dotTextPx(Arduino_GFX *g, const char *s, int cxPx, int topPx, float cellPx, uint16_t col) {
  int n = strlen(s);
  float total = (n * 6 - 1) * cellPx;
  float x0 = cxPx - total / 2;
  int r = max(1, (int)(cellPx * 0.43f + 0.5f));
  for (int i = 0; i < n; i++) {
    if (s[i] == ' ') continue;
    const uint8_t *gl = glyphFor(s[i]);
    if (!gl) continue;
    for (int row = 0; row < 7; row++)
      for (int c = 0; c < 5; c++)
        if (gl[row] & (1 << (4 - c)))
          g->fillCircle((int)(x0 + (i * 6 + c + 0.5f) * cellPx), topPx + (int)((row + 0.5f) * cellPx), r, col);
  }
}
static void dotText(const char *s, float designCell, float designTop, uint16_t col) {
  dotTextPx(gfx, s, LCD_W / 2, Y(designTop), designCell * S, col);
}
static void smallText(Arduino_GFX *g, const char *s, int cxPx, int topPx, uint8_t size, uint16_t col) {
  int16_t x1, y1; uint16_t w, h;
  g->setTextSize(size);
  g->getTextBounds(s, 0, 0, &x1, &y1, &w, &h);
  g->setTextColor(col);
  g->setCursor(cxPx - w / 2, topPx);
  g->print(s);
}

// ---- Screens ----
enum Screen { HOME, MENU, BMODE, CALM, BOX, B478, DONE };
Screen cur = HOME, prev = HOME;
Screen sessionKind = CALM;
uint32_t sessionStart = 0;
int sessionRounds = 0, roundsTotal = 6;

struct Btn { int x0, y0, x1, y1; Screen go; };
Btn btns[12]; int nbtn = 0;
static void addBtn(int x0, int y0, int x1, int y1, Screen go) { if (nbtn < 12) btns[nbtn++] = {x0, y0, x1, y1, go}; }

static void pill(int x, int y, int w, int h, uint16_t fill, uint16_t line) {
  gfx->fillRoundRect(x, y, w, h, h / 2, fill);
  if (line != fill) { gfx->drawRoundRect(x, y, w, h, h / 2, line); gfx->drawRoundRect(x + 1, y + 1, w - 2, h - 2, h / 2 - 1, line); }
}
static void header(const char *title, const char *sub) {
  // menu icon (hamburger), light grey
  int hx = X(184) - D(10);
  for (int i = 0; i < 3; i++) gfx->fillRect(hx, Y(14 + i * 6), D(20), max(2, D(2.2f)), C_GREY);
  addBtn(X(150), Y(0), X(220), Y(50), MENU);
  dotText(title, 5.0f, 54, C_FG);
  if (sub) smallText(gfx, sub, LCD_W / 2, Y(98), 1, C_GREY);
}
static void bigButton(const char *label, bool filled, Screen go) {
  int w = D(272), h = D(44), x = (LCD_W - w) / 2, y = Y(448 - 28 - 44.2f - 12);
  pill(x, y, w, h, filled ? C_FG : C_BG, filled ? C_FG : C_LINE);
  dotTextPx(gfx, label, LCD_W / 2, y + (h - (int)(4.2f * S * 7)) / 2, 4.2f * S, filled ? C_BG : C_FG);
  addBtn(x, y, x + w, y + h, go);
}
static void backPill(Screen to) {
  int w = D(44), h = D(18), y = Y(430);
  pill(LCD_W / 2 - w - D(4), y, w, h, C_PANEL, C_PANEL);
  gfx->setTextColor(C_GREY); gfx->setTextSize(1); gfx->setCursor(LCD_W / 2 - w / 2 - D(4) - 3, y + h / 2 - 3); gfx->print("<");
  addBtn(LCD_W / 2 - w - D(4) - 10, y - 14, LCD_W / 2 - D(4) + 10, LCD_H, to);
}
static void row(int i, const char *tag, const char *name, const char *desc, bool on, Screen go) {
  int y = Y(128 + 60 * i), x = D(22), w = LCD_W - 2 * D(22), h = D(52);
  gfx->fillRoundRect(x, y, w, h, D(12), C_PANEL);
  if (on) { gfx->drawRoundRect(x, y, w, h, D(12), C_FG); gfx->drawRoundRect(x + 1, y + 1, w - 2, h - 2, D(12) - 1, C_FG); }
  gfx->fillRoundRect(x + D(10), y + (h - D(30)) / 2, D(44), D(30), D(8), gfx->color565(38, 38, 38));
  smallText(gfx, tag, x + D(10) + D(22), y + h / 2 - 3, 1, C_FG);
  gfx->setTextSize(2); gfx->setTextColor(C_FG); gfx->setCursor(x + D(66), y + D(9)); gfx->print(name);
  gfx->setTextSize(1); gfx->setTextColor(C_GREY); gfx->setCursor(x + D(66), y + D(33)); gfx->print(desc);
  addBtn(x, y, x + w, y + h, go);
}

static void drawHome() {
  header("", nullptr);
  dotText("READY?", 8.2f, 150, C_FG);
  smallText(gfx, "Breathe is live. More soon.", LCD_W / 2, Y(238), 1, C_GREY);
  bigButton("START", true, BMODE);
}
static void drawMenu() {
  dotText("MENU", 5.0f, 46, C_FG);
  struct T { const char *n; Screen go; bool live; } t[9] = {
    {"WEATHER", HOME, false}, {"WORKOUT", BMODE, false}, {"BREATHE", BMODE, true},
    {"FOOD", HOME, false}, {"PROOF", HOME, false}, {"READY", HOME, true},
    {"REST", HOME, false}, {"SETUP", HOME, false}, {"HOME", HOME, true}};
  int cols = 3, gap = D(10), tw = (LCD_W - 2 * D(22) - 2 * gap) / 3, th = D(96);
  for (int i = 0; i < 9; i++) {
    int cx = i % cols, cy = i / cols;
    int x = D(22) + cx * (tw + gap), y = Y(100) + cy * (th + gap);
    gfx->fillRoundRect(x, y, tw, th, D(12), C_PANEL);
    if (t[i].live) { gfx->drawRoundRect(x, y, tw, th, D(12), C_FG); }
    smallText(gfx, t[i].n, x + tw / 2, y + th / 2 - 3, 1, t[i].live ? C_FG : C_GREY);
    if (t[i].live) addBtn(x, y, x + tw, y + th, t[i].go);
  }
  backPill(HOME);
}
static void drawBMode() {
  header("BREATHE", "PICK A RHYTHM");
  row(0, "4/6", "Calm", "in 4, out 6", true, CALM);
  row(1, "4x4", "Box breathing", "in, hold, out, hold: 4 each", false, BOX);
  row(2, "478", "4-7-8 breathing", "in 4, hold 7, out 8", false, B478);
  smallText(gfx, "Box keeps every side equal.", LCD_W / 2, Y(322), 1, C_GREY);
  smallText(gfx, "4-7-8 slows you down for sleep.", LCD_W / 2, Y(338), 1, C_GREY);
  bigButton("BACK", false, HOME);
}
static void drawSessionFrame(const char *title, const char *sub) {
  header(title, sub);
  bigButton("FINISH", true, DONE);
  backPill(BMODE);
}
static void drawDone() {
  header("", nullptr);
  dotText("NICE!", 8.2f, 150, C_FG);
  char b[40]; snprintf(b, sizeof b, "%d rounds of breathing", sessionRounds);
  smallText(gfx, b, LCD_W / 2, Y(238), 1, C_GREY);
  bigButton("HOME", true, HOME);
}

// Per-session info line (static text under the animation).
static void sessionInfo(int round, int total, const char *line) {
  gfx->fillRect(0, Y(300), LCD_W, D(60), C_BG);
  char b[32]; snprintf(b, sizeof b, "Round %d of %d", round, total);
  smallText(gfx, b, LCD_W / 2, Y(312), 2, C_FG);
  smallText(gfx, line, LCD_W / 2, Y(338), 1, C_GREY);
}

void go(Screen s) {
  prev = cur; cur = s; nbtn = 0;
  gfx->fillScreen(C_BG);
  switch (s) {
    case HOME: drawHome(); break;
    case MENU: drawMenu(); break;
    case BMODE: drawBMode(); break;
    case CALM: drawSessionFrame("BREATHE", "SLOW AND CALM"); roundsTotal = 6; break;
    case BOX: drawSessionFrame("BOX", "BOX BREATHING"); roundsTotal = 6; break;
    case B478: drawSessionFrame("4-7-8", "RELAX AND SLEEP"); roundsTotal = 4; break;
    case DONE: drawDone(); break;
  }
  if (s == CALM || s == BOX || s == B478) { sessionKind = s; sessionStart = millis(); sessionRounds = 0; }
}

// ---- Breathing animation ----
static void renderAnim(float scale, const char *word) {
  anim->fillScreen(C_BG);
  int cx = AW / 2, cy = AH / 2;
  int R = (int)(D(85) * scale);
  anim->fillCircle(cx, cy, R, C_FG);
  anim->fillCircle(cx, cy, max(1, R - max(2, D(3.7f))), C_PANEL);
  if (R > D(28)) dotTextPx(anim, word, cx, cy - (int)(2.5f * S * 7 / 2 * 1.4f), 2.6f * S, C_FG);
  anim->flush();
}
static void renderBox(float t16, const char *word) {
  anim->fillScreen(C_BG);
  int side = D(150), x0 = AW / 2 - side / 2, y0 = AH / 2 - side / 2;
  anim->fillRect(x0, y0, side, side, C_FG);
  int bw = max(2, D(3.7f));
  anim->fillRect(x0 + bw, y0 + bw, side - 2 * bw, side - 2 * bw, C_PANEL);
  float p = t16 * 4.0f; int seg = (int)p; float f = p - seg;
  int px, py;
  switch (seg & 3) {
    case 0: px = x0; py = y0 + side - (int)(f * side); break;      // up the left side
    case 1: px = x0 + (int)(f * side); py = y0; break;             // across the top
    case 2: px = x0 + side; py = y0 + (int)(f * side); break;      // down the right side
    default: px = x0 + side - (int)(f * side); py = y0 + side; break; // back along the bottom
  }
  anim->fillCircle(px, py, D(9), C_FG);
  anim->drawCircle(px, py, D(9), C_BG);
  dotTextPx(anim, word, AW / 2, AH / 2 - (int)(2.8f * S * 7 / 2), 2.8f * S, C_FG);
  anim->flush();
}

uint32_t lastFrame = 0; int lastWordIdx = -1, lastRound = -1;
static void tickSession() {
  uint32_t now = millis();
  if (now - lastFrame < 45) return;
  lastFrame = now;
  float t = (now - sessionStart) / 1000.0f;
  float cyc, ph; const char *word = "";
  if (sessionKind == CALM) {
    cyc = 10.0f; ph = fmodf(t, cyc);
    bool in = ph < 4.0f; word = in ? "IN" : "OUT";
    float sc = in ? 0.5f + 0.5f * (ph / 4.0f) : 1.0f - 0.5f * ((ph - 4.0f) / 6.0f);
    renderAnim(sc, word);
  } else if (sessionKind == B478) {
    cyc = 19.0f; ph = fmodf(t, cyc);
    float sc; if (ph < 4.0f) { word = "IN"; sc = 0.5f + 0.5f * (ph / 4.0f); }
    else if (ph < 11.0f) { word = "HOLD"; sc = 1.0f; }
    else { word = "OUT"; sc = 1.0f - 0.5f * ((ph - 11.0f) / 8.0f); }
    renderAnim(sc, word);
  } else {
    cyc = 16.0f; ph = fmodf(t, cyc);
    static const char *W[4] = {"IN", "HOLD", "OUT", "HOLD"};
    word = W[(int)(ph / 4.0f) & 3];
    renderBox(ph / cyc, word);
  }
  int round = (int)(t / cyc);
  if (round != lastRound) {
    lastRound = round; sessionRounds = round;
    const char *line = sessionKind == CALM ? "In 4 sec, out 6 sec" : sessionKind == BOX ? "4 in, 4 hold, 4 out, 4 hold" : "in 4 sec, hold 7, out 8";
    if (round >= roundsTotal) { go(DONE); lastRound = -1; return; }
    sessionInfo(round + 1, roundsTotal, line);
  }
}

// ---- Touch (FT3168 at 0x38, FocalTech register layout) ----
static bool ftRead(int &x, int &y) {
  Wire.beginTransmission(FT_ADDR); Wire.write(0x02);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom(FT_ADDR, 5) != 5) return false;
  uint8_t n = Wire.read() & 0x0F, xh = Wire.read(), xl = Wire.read(), yh = Wire.read(), yl = Wire.read();
  if (n == 0 || n > 2) return false;
  x = ((xh & 0x0F) << 8) | xl; y = ((yh & 0x0F) << 8) | yl;
  return true;
}
bool wasDown = false; uint32_t lastBtn = 0;

// Read-only probe of the AXP2101 power chip (I2C 0x34), printed over serial for diagnosis.
static uint8_t axpRead(uint8_t reg, bool &ok) {
  Wire.beginTransmission(0x34); Wire.write(reg);
  if (Wire.endTransmission(false) != 0) { ok = false; return 0; }
  if (Wire.requestFrom(0x34, 1) != 1) { ok = false; return 0; }
  ok = true; return Wire.read();
}
static void probePower() {
  bool ok; uint8_t v = axpRead(0x03, ok);
  if (!ok) { Serial.println("AXP2101: no answer at 0x34"); return; }
  Serial.printf("AXP2101 chip id reg 0x03 = 0x%02X\n", v);
  static const uint8_t regs[] = {0x90, 0x91, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99};
  for (uint8_t r : regs) { v = axpRead(r, ok); Serial.printf("AXP2101 reg 0x%02X = 0x%02X\n", r, v); }
}

static void i2cScan() {
  Serial.print("I2C devices:");
  for (uint8_t a = 1; a < 127; a++) { Wire.beginTransmission(a); if (Wire.endTransmission() == 0) Serial.printf(" 0x%02X", a); }
  Serial.println();
}
static const char *stageName = "boot";
static void report() {
  Serial.printf("TriBe %s | stage %s | up %lu s | heap %u | psram %u | display %dx%d\n", FW_VERSION, stageName,
                (unsigned long)(millis() / 1000), (unsigned)ESP.getFreeHeap(), (unsigned)ESP.getFreePsram(), gfx->width(), gfx->height());
  i2cScan();
  probePower();
}

void setup() {
  Serial.begin(115200);
  delay(2500);  // time for the USB serial monitor to attach
  Serial.printf("TriBe POWout firmware %s\n", FW_VERSION);
  Serial.printf("Heap %u, PSRAM %u bytes\n", (unsigned)ESP.getFreeHeap(), (unsigned)ESP.getPsramSize());
  Wire.begin(I2C_SDA, I2C_SCL); Wire.setClock(400000);
  probePower();
  pinMode(BTN_BOOT, INPUT_PULLUP);
  if (!gfx->begin()) { Serial.println("Display init failed"); while (true) { stageName = "display-FAILED"; report(); delay(3000); } }
  stageName = "display-up";
  Serial.printf("Display ready %dx%d\n", gfx->width(), gfx->height());
  gfx->setBrightness(255);
  { const char *nm[4] = {"red", "green", "blue", "white"};
    uint16_t col[4] = {gfx->color565(255, 0, 0), gfx->color565(0, 255, 0), gfx->color565(0, 0, 255), gfx->color565(255, 255, 255)};
    for (int i = 0; i < 4; i++) { Serial.printf("test fill %s\n", nm[i]); gfx->fillScreen(col[i]); delay(700); } }
  gfx->setBrightness(200);
  C_BG = gfx->color565(0, 0, 0); C_FG = gfx->color565(242, 241, 236); C_GREY = gfx->color565(138, 138, 138);
  C_PANEL = gfx->color565(21, 21, 21); C_LINE = gfx->color565(58, 58, 58);
  AX0 = (LCD_W - AW) / 2; AY0 = Y(122) - D(20) + 0;
  anim = new Arduino_Canvas(AW, AH, gfx, AX0, AY0);
  if (!anim->begin(GFX_SKIP_OUTPUT_BEGIN)) Serial.println("Canvas init failed (PSRAM?)"); else Serial.println("Canvas ready");
  pinMode(TP_RESET, OUTPUT); digitalWrite(TP_RESET, LOW); delay(20); digitalWrite(TP_RESET, HIGH); delay(60);
  pinMode(TP_INT, INPUT);
  stageName = "ui";
  go(HOME);
}

void loop() {
  static uint32_t lastRep = 0;
  if (millis() - lastRep > 3000) { lastRep = millis(); report(); }
  if (cur == CALM || cur == BOX || cur == B478) tickSession();
  int x, y;
  bool down = ftRead(x, y);
  if (down && !wasDown) {
    Serial.printf("touch %d,%d\n", x, y);
    for (int i = 0; i < nbtn; i++)
      if (x >= btns[i].x0 && x <= btns[i].x1 && y >= btns[i].y0 && y <= btns[i].y1) { go(btns[i].go); break; }
  }
  wasDown = down;
  if (digitalRead(BTN_BOOT) == LOW && millis() - lastBtn > 400) {
    lastBtn = millis();
    Serial.println("BOOT pressed: back");
    go(cur == HOME ? BMODE : (cur == CALM || cur == BOX || cur == B478) ? BMODE : HOME);
  }
  delay(5);
}
