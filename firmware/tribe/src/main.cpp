// TriBe POWout firmware for the Waveshare ESP32-S3-Touch-AMOLED-2.06.
// Black and white UI drawn with a 5x7 dot font, the same look as the design canvas.
// 0.3.x: every design screen. Touch to navigate, BOOT button = back.
#include <Arduino.h>
#include <Wire.h>
#include <Arduino_GFX_Library.h>
#include "version.h"
#include "dotfont.h"
#include "heart.h"
#include "qrdata.h"

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
Arduino_CO5300 *panel = new Arduino_CO5300(bus, LCD_RESET, 0, false /* ips */, LCD_W, LCD_H, 22, 0, 0, 0);
// The CO5300 only accepts even-aligned windows, so every screen is drawn into an 8-bit indexed
// frame buffer in RAM and sent to the panel in whole aligned blocks.
Arduino_Canvas_Indexed *gfx = new Arduino_Canvas_Indexed(LCD_W, LCD_H, panel, 0, 0);
static bool dirty = true;
static void flushRegion(int x, int y, int w, int h) {
  x &= ~1; y &= ~1; w = (w + 1) & ~1; h = (h + 1) & ~1;
  if (x + w > LCD_W) w = LCD_W - x; if (y + h > LCD_H) h = LCD_H - y;
  panel->drawIndexedBitmap(x, y, gfx->getFramebuffer() + y * LCD_W + x, gfx->getColorIndex(), w, h, LCD_W - w);
}

// The design is 368x448. The panel is 410 wide, so everything is scaled by S.
static const float S = 1.0f;  // smaller than the full panel width so rounded corners do not clip
static const int OFFY = (LCD_H - (int)(448 * S)) / 2;
static const int OFFX = (LCD_W - (int)(368 * S)) / 2;
#define DW ((int)(368 * S))
static inline int X(float v) { return (int)(v * S + 0.5f) + OFFX; }
static inline int Y(float v) { return (int)(v * S + 0.5f) + OFFY; }
static inline int D(float v) { return (int)(v * S + 0.5f); }

uint16_t C_BG, C_FG, C_GREY, C_PANEL, C_LINE, C_TILE;

// A region canvas for flicker-free animation (only this rectangle is sent to the panel).
static const int AW = 260, AH = 260;
static int AX0, AY0;

// ---- Dot font ----
static const uint8_t *glyphFor(char c) {
  if (c >= 'a' && c <= 'z' && c != 'o' && c != 't' && c != 'u') c -= 32;
  for (int i = 0; i < DOT_GLYPH_COUNT; i++) if (DOT_GLYPHS[i].ch == c) return DOT_GLYPHS[i].row;
  for (int i = 0; i < DOT_GLYPH_COUNT; i++) if (DOT_GLYPHS[i].ch == '?') return DOT_GLYPHS[i].row;
  return nullptr;
}
// Dot text, left edge at x0Px.
static void dotTextLeft(Arduino_GFX *g, const char *s, int x0Px, int topPx, float cellPx, uint16_t col) {
  int n = strlen(s);
  int r = max(1, (int)(cellPx * 0.43f + 0.5f));
  for (int i = 0; i < n; i++) {
    if (s[i] == ' ') continue;
    const uint8_t *gl = glyphFor(s[i]);
    if (!gl) continue;
    for (int row = 0; row < 7; row++)
      for (int c = 0; c < 5; c++)
        if (gl[row] & (1 << (4 - c)))
          g->fillCircle((int)(x0Px + (i * 6 + c + 0.5f) * cellPx), topPx + (int)((row + 0.5f) * cellPx), r, col);
  }
}
static void dotTextPx(Arduino_GFX *g, const char *s, int cxPx, int topPx, float cellPx, uint16_t col) {
  int n = strlen(s);
  float total = (n * 6 - 1) * cellPx;
  dotTextLeft(g, s, (int)(cxPx - total / 2), topPx, cellPx, col);
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
// Centred text line at a design y. size 2 = main line, size 1 = small grey line.
static void line(const char *s, float dy, uint8_t size, uint16_t col) { smallText(gfx, s, LCD_W / 2, Y(dy), size, col); }

// ---- Shapes ----
static void thickLine(Arduino_GFX *g, int x0, int y0, int x1, int y1, int w, uint16_t col) {
  int n = max(abs(x1 - x0), abs(y1 - y0)); if (n < 1) n = 1;
  int r = max(1, w / 2);
  for (int i = 0; i <= n; i++) g->fillCircle(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, r, col);
}
static void quadStroke(float x0, float y0, float cx, float cy, float x1, float y1, float w, uint16_t col) {
  int steps = 28, px = 0, py = 0;
  for (int i = 0; i <= steps; i++) {
    float t = (float)i / steps, u = 1 - t;
    int x = X(u * u * x0 + 2 * u * t * cx + t * t * x1), y = Y(u * u * y0 + 2 * u * t * cy + t * t * y1);
    if (i) thickLine(gfx, px, py, x, y, D(w), col); else gfx->fillCircle(x, y, D(w) / 2, col);
    px = x; py = y;
  }
}
static void pill(int x, int y, int w, int h, uint16_t fill, uint16_t line) {
  gfx->fillRoundRect(x, y, w, h, h / 2, fill);
  if (line != fill) { gfx->drawRoundRect(x, y, w, h, h / 2, line); gfx->drawRoundRect(x + 1, y + 1, w - 2, h - 2, h / 2 - 1, line); }
}

// ---- Screens ----
enum Screen {
  HOME, MENU, PICK, PICKMORE, REPS, INTERVALS, TIMER, WEATHER, BMODE, CALM, BOX, B478, DONE,
  FOOD, LOGGED, LISTEN, HEARD, MISSED, VOICESET, PROOF, SHARE, SHARED, LOADING,
  READY, PUMPED, PROUD, SAD, STREAK, REST, SETUP1, SETUP2, SETUP3, SETUP4, SETUP5, SETUP6
};
Screen cur = LOADING;
void go(Screen s);
static bool tour = false;  // Moods tour: tapping a face shows the next face

// What the back button / BOOT goes to from each screen.
static Screen parentOf(Screen s) {
  switch (s) {
    case PICKMORE: return PICK;
    case REPS: case INTERVALS: case TIMER: return PICK;
    case CALM: case BOX: case B478: case DONE: return BMODE;
    case BMODE: return HOME;
    case LOGGED: return FOOD;
    case HEARD: case MISSED: case VOICESET: return LISTEN;
    case SHARE: return PROOF;
    case SHARED: return PROOF;
    case PUMPED: return REPS;
    case PROUD: return HOME;
    case SETUP2: return SETUP1;
    case SETUP3: return SETUP2;
    case SETUP4: return SETUP3;
    case SETUP5: return SETUP4;
    case SETUP6: return SETUP5;
    case HOME: return HOME;
    default: return HOME;
  }
}

// ---- Touch zones ----
struct Btn { int x0, y0, x1, y1; Screen go; };
Btn btns[16]; int nbtn = 0;
static void addBtn(int x0, int y0, int x1, int y1, Screen go) { if (nbtn < 16) btns[nbtn++] = {x0, y0, x1, y1, go}; }

// ---- Session state ----
struct Workout { const char *name; bool counts; int target; };
Workout wk = {"PUSH-UPS", true, 20};
int reps = 0, setNo = 1, setsTotal = 4, totalReps = 0;
uint32_t wkStart = 0;
int foodItems = 0, waterMl = 0, streakDays = 5;
const char *lastFood = "Meal";

// ---- Clock and battery (status bar) ----
static uint8_t bcd2(uint8_t v) { return (v >> 4) * 10 + (v & 15); }
static uint8_t tobcd(int v) { return ((v / 10) << 4) | (v % 10); }
static bool rtcOk = false;
static int clkH = 0, clkM = 0, batt = -1;
static uint32_t swBase = 0; static int swMin0 = 0;
static bool i2cRead(uint8_t addr, uint8_t reg, uint8_t *buf, int n) {
  Wire.beginTransmission(addr); Wire.write(reg);
  if (Wire.endTransmission(false) != 0) return false;
  if (Wire.requestFrom((int)addr, n) != n) return false;
  for (int i = 0; i < n; i++) buf[i] = Wire.read();
  return true;
}
static void clockInit() {
  // Until Wi-Fi time sync exists the clock starts from the firmware build time (CET = UTC+1).
  int bh = (((__TIME__[0] - '0') * 10 + (__TIME__[1] - '0')) + 1) % 24, bm = (__TIME__[3] - '0') * 10 + (__TIME__[4] - '0');
  uint8_t r[7];
  if (i2cRead(0x51, 0x04, r, 7)) {
    rtcOk = true;
    if (r[0] & 0x80) {  // oscillator stopped: the RTC has no valid time, set it
      Wire.beginTransmission(0x51); Wire.write(0x04);
      Wire.write(tobcd(0)); Wire.write(tobcd(bm)); Wire.write(tobcd(bh)); Wire.write(tobcd(1)); Wire.write(tobcd(1)); Wire.write(tobcd(1)); Wire.write(tobcd(26));
      Wire.endTransmission();
    }
  }
  swMin0 = bh * 60 + bm; swBase = millis();
}
static void clockUpdate() {
  uint8_t r[3];
  if (rtcOk && i2cRead(0x51, 0x04, r, 3) && !(r[0] & 0x80)) { clkM = bcd2(r[1] & 0x7F); clkH = bcd2(r[2] & 0x3F); }
  else { int m = (swMin0 + (millis() - swBase) / 60000) % 1440; clkH = m / 60; clkM = m % 60; }
  uint8_t b;
  if (i2cRead(0x34, 0xA4, &b, 1) && b <= 100) batt = b;
}
static void statusBar() {
  char t[8]; snprintf(t, sizeof t, "%02d:%02d", clkH, clkM);
  float cell = 2.9f * S;
  dotTextLeft(gfx, t, OFFX + D(22), Y(12), cell, C_GREY);
  if (batt >= 0) {
    char b[6]; snprintf(b, sizeof b, "%d", batt);
    int w = (int)((strlen(b) * 6 - 1) * cell);
    dotTextLeft(gfx, b, LCD_W - OFFX - D(22) - w - D(14), Y(12), cell, C_GREY);
    gfx->setTextSize(2); gfx->setTextColor(C_GREY); gfx->setCursor(LCD_W - OFFX - D(22) - 11, Y(12) + 4); gfx->print("%");
  }
}
static void menuIcon(bool mic) {
  // Bright, thick icons at the top centre: hamburger (menu) and, on Home, a microphone.
  int hx = LCD_W / 2 - D(12) - (mic ? D(26) : 0), hy = Y(14);
  for (int i = 0; i < 3; i++) gfx->fillRoundRect(hx, hy + i * D(8), D(24), max(3, D(3)), 2, C_FG);
  addBtn(hx - D(14), Y(0), hx + D(38), Y(54), MENU);
  if (mic) {
    int mx = LCD_W / 2 + D(26), top = Y(10);
    gfx->fillRoundRect(mx - D(5), top, D(10), D(18), D(5), C_FG);
    gfx->drawRoundRect(mx - D(9), top + D(8), D(18), D(14), D(7), C_FG);
    gfx->fillRect(mx - 1, top + D(22), 3, D(6), C_FG);
    gfx->fillRect(mx - D(7), top + D(28), D(14), 3, C_FG);
    addBtn(mx - D(24), Y(0), mx + D(28), Y(54), LISTEN);
  }
}

// ---- Common pieces ----
static void header(const char *title, const char *sub, bool mic = false) {
  statusBar();
  menuIcon(mic);
  dotText(title, 5.0f, 54, C_FG);
  if (sub) line(sub, 98, 1, C_GREY);
}
static void bigBtnAt(const char *label, bool filled, Screen go, float dyTop) {
  int w = D(272), h = D(44), x = (LCD_W - w) / 2, y = Y(dyTop);
  pill(x, y, w, h, filled ? C_FG : C_BG, filled ? C_FG : C_LINE);
  dotTextPx(gfx, label, LCD_W / 2, y + (h - (int)(4.0f * S * 7)) / 2, 4.0f * S, filled ? C_BG : C_FG);
  addBtn(x, y, x + w, y + h, go);
}
static void bigButton(const char *label, bool filled, Screen go) { bigBtnAt(label, filled, go, 448 - 28 - 44.2f - 12); }
static void backPill(Screen to) {
  int w = D(44), h = D(18), y = Y(428);
  pill(LCD_W / 2 - w / 2, y, w, h, C_PANEL, C_PANEL);
  gfx->setTextColor(C_GREY); gfx->setTextSize(1); gfx->setCursor(LCD_W / 2 - 3, y + h / 2 - 3); gfx->print("<");
  addBtn(LCD_W / 2 - w, y - 10, LCD_W / 2 + w, LCD_H, to);
}
static void rowAt(float dy, float dh, const char *tag, const char *name, const char *desc, bool on, Screen go) {
  int y = Y(dy), x = OFFX + D(22), w = DW - 2 * D(22), h = D(dh);
  gfx->fillRoundRect(x, y, w, h, D(12), C_PANEL);
  if (on) { gfx->drawRoundRect(x, y, w, h, D(12), C_FG); gfx->drawRoundRect(x + 1, y + 1, w - 2, h - 2, D(12) - 1, C_FG); }
  gfx->fillRoundRect(x + D(10), y + (h - D(30)) / 2, D(44), D(30), D(8), C_TILE);
  smallText(gfx, tag, x + D(10) + D(22), y + h / 2 - 3, 1, C_FG);
  gfx->setTextSize(2); gfx->setTextColor(C_FG); gfx->setCursor(x + D(66), y + h / 2 - D(14)); gfx->print(name);
  gfx->setTextSize(1); gfx->setTextColor(C_GREY); gfx->setCursor(x + D(66), y + h / 2 + D(6)); gfx->print(desc);
  addBtn(x, y, x + w, y + h, go);
}
static void chip(int cxPx, float dy, const char *s) {
  int16_t x1, y1; uint16_t w, h; gfx->setTextSize(1); gfx->getTextBounds(s, 0, 0, &x1, &y1, &w, &h);
  int cw = w + D(24), ch = D(26);
  gfx->fillRoundRect(cxPx - cw / 2, Y(dy), cw, ch, ch / 2, C_PANEL);
  smallText(gfx, s, cxPx, Y(dy) + ch / 2 - 4, 1, C_FG);
}
static void check(int cx, int cy, int sz, uint16_t col) {
  thickLine(gfx, cx - sz * 4 / 10, cy, cx - sz / 10, cy + sz * 3 / 10, max(3, sz / 8), col);
  thickLine(gfx, cx - sz / 10, cy + sz * 3 / 10, cx + sz * 4 / 10, cy - sz * 3 / 10, max(3, sz / 8), col);
}
static void fmtTime(char *b, size_t n, uint32_t sec) { snprintf(b, n, "%02u:%02u", (unsigned)(sec / 60), (unsigned)(sec % 60)); }

// ---- Heart logo ----
static void drawHeart(bool large, int ox, int oy) {
  const HRun *r = large ? HEART_L : HEART_S; int n = large ? HEART_L_N : HEART_S_N;
  for (int i = 0; i < n; i++) { HRun h; memcpy_P(&h, &r[i], sizeof h); gfx->drawFastHLine(ox + h.x, oy + h.y, h.n, C_FG); }
}
static void drawRays(bool large, int ox, int oy, uint16_t col) {
  dirty = true;
  float k = (large ? HEART_L_W : HEART_S_W) / 172.4f;
  for (int i = 0; i < 12; i++)
    thickLine(gfx, ox + (int)((HEART_RAYS[i][0] + 6) * k), oy + (int)((HEART_RAYS[i][1] + 6) * k),
              ox + (int)((HEART_RAYS[i][2] + 6) * k), oy + (int)((HEART_RAYS[i][3] + 6) * k), large ? 5 : 4, col);
}

// ---- Faces ----
static void faceEyes(Screen s, bool open) {
  dirty = true;
  // Clear and redraw only the eye band so a blink does not flicker the whole screen.
  gfx->fillRect(X(70), Y(40), D(230), Y(200) - Y(40), C_BG);
  if (s == READY || s == PUMPED || s == SAD || s == STREAK) {
    float y = s == READY ? 74 : s == PUMPED ? 60 : 107, h = s == READY ? 96 : s == PUMPED ? 118 : 72;
    float eh = open ? h : 8;
    float ey = open ? y : y + (h - 8) / 2;
    for (int e = 0; e < 2; e++) gfx->fillRoundRect(X(e ? 224 : 96), Y(ey), D(48), D(eh), min(D(24), D(eh) / 2), C_FG);
  } else if (s == PROUD) {
    quadStroke(92, 150, 120, 96, 148, 150, 24, C_FG);
    quadStroke(220, 150, 248, 96, 276, 150, 24, C_FG);
  }
}
static void drawFace(Screen s) {
  if (s == REST) {
    thickLine(gfx, X(88), Y(160), X(152), Y(160), D(36), C_FG); thickLine(gfx, X(216), Y(160), X(280), Y(160), D(36), C_FG);
    thickLine(gfx, X(154), Y(282), X(214), Y(282), D(15), C_FG);
    smallText(gfx, "Z", X(296), Y(150), 3, C_GREY); smallText(gfx, "z", X(318), Y(128), 2, C_GREY);
    return;
  }
  faceEyes(s, true);
  switch (s) {
    case READY: quadStroke(111, 262, 184, 322, 257, 262, 24, C_FG); break;
    case PUMPED: quadStroke(111, 252, 184, 352, 257, 252, 24, C_FG); break;
    case PROUD: quadStroke(101, 252, 184, 336, 267, 252, 24, C_FG); break;
    default:
      quadStroke(114, 306, 184, 252, 254, 306, 24, C_FG);
      if (s == STREAK) { // tear
        gfx->fillCircle(X(268), Y(246), D(17), C_FG);
        gfx->fillTriangle(X(268), Y(206), X(251), Y(246), X(285), Y(246), C_FG);
      }
  }
}
static void faceScreen(Screen s, const char *t1, const char *t2) {
  drawFace(s);
  dotText(t1, s == STREAK ? 4.0f : 5.0f, 336, C_FG);
  line(t2, 392, 2, C_GREY);
}

// ---- Draw each screen ----
static void drawHome() {
  header("", nullptr, true);
  drawHeart(false, (LCD_W - HEART_S_W) / 2, Y(58)); drawRays(false, (LCD_W - HEART_S_W) / 2, Y(58), C_FG);
  dotText("READY?", 8.2f, 208, C_FG);
  chip(LCD_W / 2, 283, "STREAK 5 DAYS");
  bigButton("START", true, PICK);
}
static void drawMenu() {
  statusBar();
  dotText("MENU", 5.0f, 46, C_FG);
  struct T { const char *n; Screen go; } t[9] = {
    {"WEATHER", WEATHER}, {"WORKOUTS", PICK}, {"BREATHE", BMODE},
    {"FOOD", FOOD}, {"PROOF", PROOF}, {"MOODS", READY},
    {"REST", REST}, {"SETUP", SETUP1}, {"HOME", HOME}};
  int gap = D(10), tw = (DW - 2 * D(22) - 2 * gap) / 3, th = D(96);
  for (int i = 0; i < 9; i++) {
    int x = OFFX + D(22) + (i % 3) * (tw + gap), y = Y(100) + (i / 3) * (th + gap);
    gfx->fillRoundRect(x, y, tw, th, D(12), C_PANEL);
    gfx->drawRoundRect(x, y, tw, th, D(12), C_LINE);
    smallText(gfx, t[i].n, x + tw / 2, y + th / 2 - 3, 1, C_FG);
    addBtn(x, y, x + tw, y + th, t[i].go);
  }
  backPill(HOME);
}
static int pickPage = 0;
static void drawPick(bool more) {
  header("PICK ONE", nullptr);
  struct P { const char *tag, *name, *desc; Screen go; };
  static const P a[6] = {
    {"12", "Reps", "count with motion", REPS}, {"0:30", "Intervals", "work and rest rounds", INTERVALS},
    {"5K", "Run or walk", "steps and distance", TIMER}, {"SQ", "Squats", "count each dip", REPS},
    {"1:00", "Plank", "hold and count seconds", TIMER}, {"~", "Breathing", "in for 4, out for 6", BMODE}};
  static const P b[6] = {
    {"JJ", "Jumping jacks", "up, out, repeat", REPS}, {"JR", "Jump rope", "count the skips", REPS},
    {"BK", "Cycle", "ride time and distance", TIMER}, {"SW", "Swim", "laps and time", TIMER},
    {"YG", "Yoga", "breathe and hold", TIMER}, {"inf", "Free", "just a timer", TIMER}};
  const P *p = more ? b : a;
  for (int i = 0; i < 6; i++) rowAt(100 + 48 * i, 42, p[i].tag, p[i].name, p[i].desc, i == 0 && !more, p[i].go);
  int cx = LCD_W / 2;
  gfx->fillCircle(cx - D(8), Y(392), D(4), more ? C_LINE : C_FG);
  gfx->fillCircle(cx + D(8), Y(392), D(4), more ? C_FG : C_LINE);
  line("Swipe for more", 412, 1, C_GREY);
  addBtn(cx - D(30), Y(380), cx + D(30), Y(404), more ? PICK : PICKMORE);
  backPill(HOME);
}
static void repsBody(bool full) {
  dirty = true;
  char b[24];
  if (full) gfx->fillRect(0, Y(100), LCD_W, Y(420) - Y(100), C_BG);
  snprintf(b, sizeof b, "%d", reps);
  dotText(b, 14.0f, 112, C_FG);
  line("REPS", 262, 2, C_GREY);
  snprintf(b, sizeof b, "SET %d / %d", setNo, setsTotal); chip(X(135), 324, b);
  char t[8]; fmtTime(t, sizeof t, (millis() - wkStart) / 1000); chip(X(262), 324, t);
  int bw = DW - 2 * D(25.8f), bh = D(11), bx = OFFX + D(25.8f), by = Y(448 - 25.8f - 11 - 26);
  gfx->fillRoundRect(bx, by, bw, bh, bh / 2, C_LINE);
  int fw = bw * min(reps, wk.target) / wk.target; if (fw > bh) gfx->fillRoundRect(bx, by, fw, bh, bh / 2, C_FG);
  line("Tap to count a rep", 358, 1, C_GREY);
}
static void drawReps() {
  header(wk.name, nullptr);
  repsBody(false);
  bigBtnAt("FINISH", false, PROUD, 448 - 28 - 44.2f - 12 - 26);
  backPill(PICK);
}
// Interval timer
static const int WORK_S = 30, REST_S = 10, ROUNDS = 8;
static bool ivWork = true; static int ivRound = 1, ivLeft = WORK_S, ivDrawn = 0;
static const int RING_CX = 0;  // set at draw time
static void ringStep(int idx, int total, uint16_t col) {
  dirty = true;  // draw one ring segment (idx of total)
  float a = -1.5708f + 6.28318f * idx / total;
  int cx = LCD_W / 2, cy = Y(58.9f + 121.4f), R = D(115);
  gfx->fillCircle(cx + (int)(cosf(a) * R), cy + (int)(sinf(a) * R), D(7), col);
}
static void ivInfo() {
  dirty = true;
  gfx->fillRect(D(70), Y(120), LCD_W - 2 * D(70), D(120), C_BG);
  line(ivWork ? "WORK" : "REST", 140, 2, C_FG);
  char b[8]; snprintf(b, sizeof b, "%d", ivLeft);
  dotText(b, 9.0f, 166, C_FG);
  gfx->fillRect(0, Y(325), LCD_W, D(60), C_BG);
  char r[20]; snprintf(r, sizeof r, "Round %d / %d", ivRound, ROUNDS);
  line(r, 335, 2, C_FG);
  char n[24]; snprintf(n, sizeof n, "Next: %s 0:%02d", ivWork ? "rest" : "work", ivWork ? REST_S : WORK_S);
  line(n, 372, 1, C_GREY);
}
static void drawIntervals() {
  statusBar(); menuIcon(false);
  ivWork = true; ivRound = 1; ivLeft = WORK_S; ivDrawn = 0;
  for (int i = 0; i < 120; i++) ringStep(i, 120, C_LINE);
  ivInfo();
  bigBtnAt("STOP", false, PROUD, 448 - 28 - 44.2f - 12 + 4);
  backPill(PICK);
}
static uint32_t ivT0 = 0;
static void tickIntervals() {
  uint32_t el = (millis() - ivT0) / 1000;
  int span = ivWork ? WORK_S : REST_S;
  int left = span - (int)el;
  if (left <= 0) {
    if (!ivWork) ivRound++;
    if (ivRound > ROUNDS) { go(PROUD); return; }
    ivWork = !ivWork; ivT0 = millis(); ivDrawn = 0; left = ivWork ? WORK_S : REST_S;
    for (int i = 0; i < 120; i++) ringStep(i, 120, C_LINE);
    ivLeft = left; ivInfo(); return;
  }
  int want = (int)(120.0f * (span - left) / span);
  for (; ivDrawn < want; ivDrawn++) ringStep(ivDrawn, 120, C_FG);
  if (left != ivLeft) { ivLeft = left; ivInfo(); }
}
static void drawTimer() {
  header(wk.name, nullptr);
  line("elapsed", 268, 2, C_GREY);
  bigBtnAt("FINISH", true, PROUD, 448 - 28 - 44.2f - 12);
  backPill(PICK);
}
static void timerTick() {
  static uint32_t last = 0; if (millis() - last < 500) return; last = millis();
  dirty = true;
  char t[8]; fmtTime(t, sizeof t, (millis() - wkStart) / 1000);
  gfx->fillRect(0, Y(140), LCD_W, D(110), C_BG);
  dotText(t, 9.0f, 150, C_FG);
}
static void drawWeather() {
  header("OUTDOOR RUN", nullptr);
  line("Your city", 98, 1, C_GREY);
  dotText("14", 17.0f, 120, C_FG);
  // sun and cloud icon
  int ix = LCD_W / 2 + D(100), iy = Y(150);
  gfx->drawCircle(ix - D(8), iy - D(6), D(11), C_FG); gfx->drawCircle(ix - D(8), iy - D(6), D(10), C_FG);
  gfx->fillRoundRect(ix - D(18), iy + D(2), D(40), D(18), D(9), C_FG);
  gfx->fillRoundRect(ix - D(11), iy - D(4), D(22), D(18), D(9), C_FG);
  line("Cloudy", 252, 2, C_FG);
  const char *tn[3] = {"RAIN", "WIND", "FEELS"}, *tv[3] = {"10%", "18 km/h", "12 C"};
  for (int i = 0; i < 3; i++) {
    int x = OFFX + D(22.1f + i * 112.2f), y = Y(272.3f), w = D(99.4f), h = D(62.6f);
    gfx->fillRoundRect(x, y, w, h, D(13), C_PANEL);
    smallText(gfx, tn[i], x + w / 2, y + D(10), 1, C_GREY);
    smallText(gfx, tv[i], x + w / 2, y + D(32), 2, C_FG);
  }
  bigBtnAt("GOOD TO GO", true, PICK, 448 - 28 - 44.2f - 22);
  line("Sample data. No Wi-Fi yet.", 412, 1, C_GREY);
  backPill(HOME);
}
static void drawBMode() {
  header("BREATHE", "PICK A RHYTHM");
  rowAt(128, 52, "4/6", "Calm", "in 4, out 6", true, CALM);
  rowAt(188, 52, "4x4", "Box breathing", "in, hold, out, hold: 4 each", false, BOX);
  rowAt(248, 52, "478", "4-7-8 breathing", "in 4, hold 7, out 8", false, B478);
  line("Box keeps every side equal.", 322, 1, C_GREY);
  line("4-7-8 slows you down for sleep.", 338, 1, C_GREY);
  bigButton("BACK", false, HOME);
}
static void drawSessionFrame(const char *title, const char *sub) {
  header(title, sub);
  bigButton("FINISH", true, DONE);
  backPill(BMODE);
}
int sessionRounds = 0, roundsTotal = 6;
static void drawDone() {
  statusBar();
  dotText("NICE!", 8.2f, 150, C_FG);
  char b[40]; snprintf(b, sizeof b, "%d rounds of breathing", sessionRounds);
  line(b, 238, 1, C_GREY);
  bigButton("HOME", true, HOME);
}
static void drawFood() {
  header("FOOD", "LOG WHAT YOU ATE");
  rowAt(112, 52, "ML", "Meal", "log a full meal", false, LOGGED);
  rowAt(172, 52, "SN", "Snack", "something small", false, LOGGED);
  rowAt(232, 52, "H2O", "Water", "+250 ml", false, LOGGED);
  rowAt(292, 52, "PRO", "Protein shake", "after the workout", false, LOGGED);
  bigBtnAt("SKIP", false, HOME, 448 - 28 - 44.2f - 4);
  backPill(HOME);
}
static void drawLogged() {
  statusBar();
  dotText("LOGGED", 6.0f, 60, C_FG);
  line("food", 106, 1, C_GREY);
  check(LCD_W / 2, Y(190), D(110), C_FG);
  line("Saved to today", 268, 2, C_FG);
  char b[40]; snprintf(b, sizeof b, "%d items, water %d ml", foodItems, waterMl);
  line(b, 296, 1, C_GREY);
  line("Food stays on this device.", 320, 1, C_GREY);
  line("Nothing is posted.", 336, 1, C_GREY);
  bigButton("DONE", true, HOME);
}
static uint32_t listenT0 = 0;
static void drawListen() {
  header("LISTEN", "SAY A COMMAND");
  line("Try saying", 222, 2, C_FG);
  line("\"Hey POW, start push-ups\"", 246, 1, C_GREY);
  line("\"How many today?\"", 262, 1, C_GREY);
  line("\"Share my proof\"", 278, 1, C_GREY);
  bigButton("CANCEL", false, HOME);
  addBtn(D(60), Y(140), LCD_W - D(60), Y(210), HEARD);
  listenT0 = millis();
}
static void tickListen() {
  static uint32_t last = 0; if (millis() - last < 90) return; last = millis();
  dirty = true;
  gfx->fillRect(D(40), Y(120), LCD_W - D(80), D(100), C_BG);
  float t = millis() / 1000.0f;
  for (int i = 0; i < 9; i++) {
    float h = 12 + 56 * (0.5f + 0.5f * sinf(t * 5 + i * 0.9f)) * (0.5f + 0.5f * sinf(t * 1.7f + i));
    int cx = LCD_W / 2 + (i - 4) * D(22), hh = D(h);
    gfx->fillRoundRect(cx - D(4), Y(170) - hh / 2, D(8), hh, D(4), C_FG);
  }
  if (millis() - listenT0 > 6000) go(MISSED);
}
static void drawHeard() {
  header("HEARD", "IS THIS RIGHT?");
  dotText("START", 5.0f, 128, C_FG);
  dotText("PUSH-UPS", 5.0f, 168, C_FG);
  line("Matched: Reps", 210, 2, C_FG);
  line("Offline, on the device.", 232, 1, C_GREY);
  line("Nothing was sent.", 248, 1, C_GREY);
  bigBtnAt("START", true, REPS, 448 - 82 - 44.2f);
  bigBtnAt("TRY AGAIN", false, LISTEN, 448 - 28 - 44.2f);
}
static void drawMissed() {
  header("NO MATCH", "DIDN'T CATCH THAT");
  dotText("?", 12.0f, 124, C_FG);
  line("Speak closer, one command", 242, 2, C_FG);
  line("or pick from the menu.", 264, 1, C_GREY);
  bigBtnAt("TRY AGAIN", true, LISTEN, 448 - 82 - 44.2f);
  bigBtnAt("CANCEL", false, HOME, 448 - 28 - 44.2f);
}
static void drawVoiceSet() {
  header("VOICE", "SETTINGS");
  rowAt(112, 52, "ON", "Voice control", "say a command", true, VOICESET);
  rowAt(172, 52, "HEY", "Wake word", "starts listening", false, VOICESET);
  rowAt(232, 52, "MIC", "Mic mute", "hardware switch", false, VOICESET);
  rowAt(292, 52, "LOC", "Audio", "never leaves the device", false, VOICESET);
  bigBtnAt("TEST MIC", true, LISTEN, 448 - 28 - 44.2f - 4);
  backPill(LISTEN);
}
static void drawProof() {
  statusBar(); menuIcon(false);
  dotText("PROOF", 5.0f, 50, C_FG);
  check(X(60), Y(140), D(44), C_FG);
  chip(X(298), 114, "+21 SATS");
  line("of workout", 98, 1, C_GREY);
  smallText(gfx, wk.name, LCD_W / 2, Y(150), 2, C_GREY);
  const char *l[3] = {"Reps", "Sets", "Time"};
  char v[3][8]; snprintf(v[0], 8, "%d", totalReps); snprintf(v[1], 8, "%d", setNo > setsTotal ? setsTotal : setNo);
  uint32_t el = (millis() - wkStart) / 60000; snprintf(v[2], 8, "%u", (unsigned)el);
  for (int i = 0; i < 3; i++) {
    int cx = D(61 + i * 123);
    smallText(gfx, l[i], cx, Y(212), 1, C_GREY);
    dotTextPx(gfx, v[i], cx, Y(232), 3.6f * S, C_FG);
  }
  line("Signed npub1gwa2...ta2sz", 331, 1, C_GREY);
  bigBtnAt("SHARE", true, SHARE, 448 - 28 - 44.2f);
  backPill(HOME);
}
static void drawShare() {
  header("SHARE", "TO NOSTR");
  rowAt(112, 48, "N1", "Public note", "kind 1, everyone sees it", false, SHARED);
  rowAt(166, 48, "PRF", "Proof only", "signed proof, no text", false, SHARED);
  rowAt(220, 48, "ZAP", "Note + zap button", "your lightning address", false, SHARED);
  rowAt(274, 48, "IMG", "Note + photo", "pick a pic on your phone", false, SHARED);
  bigBtnAt("KEEP PRIVATE", false, PROOF, 448 - 28 - 44.2f);
}
static void drawShared() {
  header("POSTED", "TO NOSTR");
  check(LCD_W / 2, Y(170), D(110), C_FG);
  line("Sent to 3 relays", 244, 2, C_FG);
  line("Signed by your signer app.", 270, 1, C_GREY);
  line("Note id a3f9...c21e", 286, 1, C_GREY);
  bigButton("DONE", true, HOME);
}
static void drawLoading() { drawHeart(true, (LCD_W - HEART_L_W) / 2, Y(139)); drawRays(true, (LCD_W - HEART_L_W) / 2, Y(139), C_FG); }
// Setup
static void qr(const uint32_t *rows, int n, float dtop, float dsize) {
  int sz = D(dsize), m = sz / (n + 4), full = m * (n + 4);
  int x0 = (LCD_W - full) / 2, y0 = Y(dtop);
  gfx->fillRect(x0, y0, full, full, C_FG);
  for (int y = 0; y < n; y++) for (int x = 0; x < n; x++)
    if (rows[y] & (1u << x)) gfx->fillRect(x0 + (x + 2) * m, y0 + (y + 2) * m, m, m, C_BG);
}
static void drawSetup(Screen s) {
  statusBar();
  switch (s) {
    case SETUP1:
      dotText("HELLO", 6.0f, 110, C_FG);
      line("Let us set up your POWout.", 230, 2, C_FG);
      line("Wi-Fi first, then Nostr.", 256, 1, C_GREY);
      line("About two minutes.", 272, 1, C_GREY);
      bigButton("BEGIN", true, SETUP2);
      backPill(HOME);
      break;
    case SETUP2:
      dotText("WI-FI", 5.0f, 46, C_FG);
      line("Step 1 / 3 - Pick a network", 88, 1, C_GREY);
      rowAt(112, 50, "W1", "Home Wi-Fi", "Secured - strong", true, SETUP3);
      rowAt(170, 50, "W2", "Phone hotspot", "Hotspot - good", false, SETUP3);
      rowAt(228, 50, "W3", "Gym guest", "Secured - fair", false, SETUP3);
      rowAt(286, 50, "W4", "Other network", "Hidden - type on phone", false, SETUP3);
      line("Side button to rescan", 410, 1, C_GREY);
      backPill(SETUP1);
      break;
    case SETUP3:
      dotText("PASSWORD", 4.5f, 46, C_FG);
      line("Step 1 / 3 - Wi-Fi", 88, 1, C_GREY);
      qr(QR_WIFI, QR_WIFI_N, 110, 150);
      line("Scan with your phone.", 280, 2, C_FG);
      line("Type the Wi-Fi password there,", 302, 1, C_GREY);
      line("not on this tiny screen.", 316, 1, C_GREY);
      bigBtnAt("NEXT", true, SETUP4, 448 - 26 - 48);
      break;
    case SETUP4:
      dotText("WI-FI", 5.0f, 46, C_FG);
      line("Step 1 / 3 - Wi-Fi", 88, 1, C_GREY);
      check(LCD_W / 2, Y(170), D(110), C_FG);
      dotText("CONNECTED", 4.4f, 240, C_FG);
      line("Home Wi-Fi", 292, 2, C_FG);
      line("Signal good", 316, 1, C_GREY);
      bigButton("CONTINUE", true, SETUP5);
      break;
    case SETUP5:
      dotText("ADD NOSTR", 4.5f, 46, C_FG);
      line("Step 2 / 3 - Nostr", 88, 1, C_GREY);
      qr(QR_NOSTR, QR_NOSTR_N, 106, 140);
      line("Scan with your signer app.", 272, 2, C_FG);
      line("Your nsec stays in the signer.", 293, 1, C_GREY);
      chip(LCD_W / 2, 318, "NO NSEC ON THE DEVICE");
      bigBtnAt("NEXT", true, SETUP6, 448 - 26 - 48);
      break;
    default:
      dotText("ALL SET", 5.0f, 46, C_FG);
      line("Step 3 / 3 - Done", 88, 1, C_GREY);
      check(LCD_W / 2, Y(170), D(110), C_FG);
      dotText("SIGNER LINKED", 3.6f, 240, C_FG);
      line("npub1gwa2...ta2sz", 292, 2, C_FG);
      line("Proofs are signed in your app.", 316, 1, C_GREY);
      bigButton("FINISH", true, HOME);
  }
}

// ---- Screen switching ----
uint32_t sessionStart = 0, screenAt = 0;
Screen sessionKind = CALM;
static void startWorkout(const char *name, bool counts, int target) {
  wk = {name, counts, target}; reps = 0; setNo = 1; totalReps = 0; wkStart = millis();
}
void go(Screen s) {
  cur = s; nbtn = 0; screenAt = millis();
  clockUpdate();
  gfx->fillScreen(C_BG);
  switch (s) {
    case HOME: drawHome(); break;
    case MENU: drawMenu(); break;
    case PICK: drawPick(false); pickPage = 0; break;
    case PICKMORE: drawPick(true); pickPage = 1; break;
    case REPS: drawReps(); break;
    case INTERVALS: ivT0 = millis(); wkStart = millis(); wk = {"INTERVALS", false, 1}; drawIntervals(); break;
    case TIMER: drawTimer(); break;
    case WEATHER: drawWeather(); break;
    case BMODE: drawBMode(); break;
    case CALM: drawSessionFrame("BREATHE", "SLOW AND CALM"); roundsTotal = 6; break;
    case BOX: drawSessionFrame("BOX", "BOX BREATHING"); roundsTotal = 6; break;
    case B478: drawSessionFrame("4-7-8", "RELAX AND SLEEP"); roundsTotal = 4; break;
    case DONE: drawDone(); break;
    case FOOD: drawFood(); break;
    case LOGGED: drawLogged(); break;
    case LISTEN: drawListen(); break;
    case HEARD: drawHeard(); break;
    case MISSED: drawMissed(); break;
    case VOICESET: drawVoiceSet(); break;
    case PROOF: drawProof(); break;
    case SHARE: drawShare(); break;
    case SHARED: drawShared(); break;
    case LOADING: drawLoading(); break;
    case READY: faceScreen(s, "READY", "Good morning"); break;
    case PUMPED: { char b[28]; snprintf(b, sizeof b, "%d reps and counting", reps); faceScreen(s, "KEEP GOING", b); break; }
    case PROUD: faceScreen(s, "NICE ONE", "Proof signed"); break;
    case SAD: faceScreen(s, "MISS YOU", "No workout yet today"); break;
    case STREAK: { char b[32]; snprintf(b, sizeof b, "%d days. Start a new one.", streakDays); faceScreen(s, "STREAK LOST", b); break; }
    case REST: faceScreen(s, "REST DAY", "Recovery counts too"); break;
    default: drawSetup(s); break;
  }
  bool face = (s >= READY && s <= REST);
  if (face) {
    Screen nx = tour ? (s == REST ? HOME : (Screen)(s + 1)) : (s == PUMPED ? REPS : s == PROUD ? PROOF : HOME);
    addBtn(0, Y(60), LCD_W, Y(420), nx);
  } else tour = false;
  dirty = true;
  if (s == CALM || s == BOX || s == B478) { sessionKind = s; sessionStart = millis(); sessionRounds = 0; }
}

// ---- Breathing animation ----
static void renderAnim(float scale, const char *word) {
  gfx->fillRect(AX0, AY0, AW, AH, C_BG);
  int cx = AX0 + AW / 2, cy = AY0 + AH / 2;
  int R = (int)(D(85) * scale);
  gfx->fillCircle(cx, cy, R, C_FG);
  gfx->fillCircle(cx, cy, max(1, R - max(2, D(3.7f))), C_PANEL);
  if (R > D(28)) dotTextPx(gfx, word, cx, cy - (int)(2.5f * S * 7 / 2 * 1.4f), 2.6f * S, C_FG);
  flushRegion(AX0, AY0, AW, AH);
}
static void renderBox(float t16, const char *word) {
  gfx->fillRect(AX0, AY0, AW, AH, C_BG);
  int side = D(150), x0 = AX0 + AW / 2 - side / 2, y0 = AY0 + AH / 2 - side / 2;
  gfx->fillRect(x0, y0, side, side, C_FG);
  int bw = max(2, D(3.7f));
  gfx->fillRect(x0 + bw, y0 + bw, side - 2 * bw, side - 2 * bw, C_PANEL);
  float p = t16 * 4.0f; int seg = (int)p; float f = p - seg;
  int px, py;
  switch (seg & 3) {
    case 0: px = x0; py = y0 + side - (int)(f * side); break;
    case 1: px = x0 + (int)(f * side); py = y0; break;
    case 2: px = x0 + side; py = y0 + (int)(f * side); break;
    default: px = x0 + side - (int)(f * side); py = y0 + side; break;
  }
  gfx->fillCircle(px, py, D(9), C_FG);
  gfx->drawCircle(px, py, D(9), C_BG);
  dotTextPx(gfx, word, AX0 + AW / 2, AY0 + AH / 2 - (int)(2.8f * S * 7 / 2), 2.8f * S, C_FG);
  flushRegion(AX0, AY0, AW, AH);
}
static void sessionInfo(int round, int total, const char *ln) {
  dirty = true;
  gfx->fillRect(0, Y(300), LCD_W, D(60), C_BG);
  char b[32]; snprintf(b, sizeof b, "Round %d of %d", round, total);
  line(b, 312, 2, C_FG);
  line(ln, 338, 1, C_GREY);
}
uint32_t lastFrame = 0; int lastRound = -1;
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
    const char *ln = sessionKind == CALM ? "In 4 sec, out 6 sec" : sessionKind == BOX ? "4 in, 4 hold, 4 out, 4 hold" : "in 4 sec, hold 7, out 8";
    if (round >= roundsTotal) { go(DONE); lastRound = -1; return; }
    sessionInfo(round + 1, roundsTotal, ln);
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
bool wasDown = false; uint32_t lastBtn = 0; int downX = 0, downY = 0, lastX = 0, lastY = 0;

static void handleTap(int x, int y) {
  for (int i = 0; i < nbtn; i++)
    if (x >= btns[i].x0 && x <= btns[i].x1 && y >= btns[i].y0 && y <= btns[i].y1) {
      Screen t = btns[i].go;
      // Entering a screen from a tap may need state set up first.
      if (cur == PICK || cur == PICKMORE) {
        // Which row was tapped decides the workout.
        int row = (y - Y(100)) / D(48);
        static const char *na[6] = {"PUSH-UPS", "INTERVALS", "RUN", "SQUATS", "PLANK", "BREATHE"};
        static const char *nb[6] = {"JACKS", "JUMP ROPE", "CYCLE", "SWIM", "YOGA", "FREE"};
        if (t == REPS || t == TIMER) {
          const char *nm = (cur == PICK ? na : nb)[constrain(row, 0, 5)];
          startWorkout(nm, t == REPS, t == REPS ? (row == 0 && cur == PICK ? 20 : 25) : 1);
        }
      } else if (cur == FOOD && t == LOGGED) {
        int row = (y - Y(112)) / D(60);
        if (row == 2) waterMl += 250; else if (row == 3) foodItems++, lastFood = "Shake"; else foodItems++;
      } else if (cur == HEARD && t == REPS) {
        startWorkout("PUSH-UPS", true, 20);
      }
      if (cur == MENU && t == READY) { go(t); tour = true; return; }
      go(t);
      return;
    }
  // Taps with no button
  if (cur == REPS) {
    reps++; totalReps++;
    if (reps >= wk.target) { reps = 0; setNo++; if (setNo > setsTotal) { go(PROUD); return; } }
    if (reps == wk.target / 2) { go(PUMPED); return; }
    repsBody(true);
  }
}
static void handleSwipe(int dx) {
  if (cur == PICK && dx < -70) go(PICKMORE);
  else if (cur == PICKMORE && dx > 70) go(PICK);
  else if (abs(dx) > 120) go(parentOf(cur));
}

// ---- Diagnostics over USB serial ----
static uint8_t axpRead(uint8_t reg, bool &ok) {
  uint8_t v = 0; ok = i2cRead(0x34, reg, &v, 1); return v;
}
static void probePower() {
  bool ok; uint8_t v = axpRead(0x03, ok);
  if (!ok) { Serial.println("AXP2101: no answer at 0x34"); return; }
  Serial.printf("AXP2101 chip id reg 0x03 = 0x%02X, battery %d%%\n", v, batt);
}
static void i2cScan() {
  Serial.print("I2C devices:");
  for (uint8_t a = 1; a < 127; a++) { Wire.beginTransmission(a); if (Wire.endTransmission() == 0) Serial.printf(" 0x%02X", a); }
  Serial.println();
}
static const char *stageName = "boot";
static void report() {
  Serial.printf("TriBe %s | stage %s | screen %d | up %lu s | heap %u | clock %02d:%02d | batt %d\n", FW_VERSION, stageName, (int)cur,
                (unsigned long)(millis() / 1000), (unsigned)ESP.getFreeHeap(), clkH, clkM, batt);
}

void setup() {
  Serial.begin(115200);
  delay(2500);
  Serial.printf("TriBe POWout firmware %s\n", FW_VERSION);
  Wire.begin(I2C_SDA, I2C_SCL); Wire.setClock(400000);
  pinMode(BTN_BOOT, INPUT_PULLUP);
  if (!gfx->begin()) { Serial.println("Display init failed"); while (true) { stageName = "display-FAILED"; report(); delay(3000); } }
  stageName = "display-up";
  Serial.printf("Frame buffer ready, heap %u\n", (unsigned)ESP.getFreeHeap());
  panel->setBrightness(200);
  C_BG = gfx->color565(0, 0, 0); C_FG = gfx->color565(242, 241, 236); C_GREY = gfx->color565(138, 138, 138);
  C_PANEL = gfx->color565(21, 21, 21); C_LINE = gfx->color565(58, 58, 58); C_TILE = gfx->color565(38, 38, 38);
  AX0 = ((LCD_W - AW) / 2) & ~1; AY0 = (Y(122) - D(20)) & ~1;
  pinMode(TP_RESET, OUTPUT); digitalWrite(TP_RESET, LOW); delay(20); digitalWrite(TP_RESET, HIGH); delay(60);
  pinMode(TP_INT, INPUT);
  clockInit(); clockUpdate();
  probePower(); i2cScan();
  stageName = "ui";
  go(LOADING);  // heartbeat splash, then Home
}

void loop() {
  static uint32_t lastRep = 0, lastClk = 0, lastFace = 0;
  if (millis() - lastRep > 10000) { lastRep = millis(); report(); }
  if (cur == CALM || cur == BOX || cur == B478) tickSession();
  else if (cur == INTERVALS) tickIntervals();
  else if (cur == TIMER) timerTick();
  else if (cur == LISTEN) tickListen();
  else if (cur == REPS) { static uint32_t lt = 0; if (millis() - lt > 1000) { lt = millis(); repsBody(false); } }
  else if (cur == LOADING) {
    uint32_t e = millis() - screenAt;
    static int ph = -1; int p = (e / 300) & 1;
    if (p != ph) { ph = p; drawRays(true, (LCD_W - HEART_L_W) / 2, Y(139), p ? C_FG : C_LINE); }
    if (e > 2600) { ph = -1; go(HOME); }
  } else if (cur == HOME) {
    static int ph = -1; int p = ((millis() - screenAt) / 600) & 1;
    if (p != ph) { ph = p; drawRays(false, (LCD_W - HEART_S_W) / 2, Y(58), p ? C_FG : C_LINE); }
  } else if (cur >= READY && cur <= STREAK) {
    // Blink every ~4 s
    uint32_t e = (millis() - screenAt) % 4000;
    static int bs = 0; int want = (e > 3700 && e < 3850) ? 1 : 0;
    if (cur == PROUD) want = 0;
    if (!tour && (cur == PROUD || cur == PUMPED) && millis() - screenAt > 2500) { go(cur == PROUD ? PROOF : REPS); return; }
    if (want != bs) { bs = want; faceEyes(cur, !bs); }
  }
  if (millis() - lastClk > 30000) { lastClk = millis(); clockUpdate(); }
  (void)lastFace;
  int x, y;
  bool down = ftRead(x, y);
  if (down) {
    if (!wasDown) { downX = x; downY = y; }
    lastX = x; lastY = y;
  }
  if (!down && wasDown) {  // finger lifted: tap or swipe
    int dx = lastX - downX, dy = lastY - downY;
    Serial.printf("touch %d,%d d=%d,%d\n", downX, downY, dx, dy);
    if (abs(dx) > 70 && abs(dx) > abs(dy)) handleSwipe(dx);
    else handleTap(downX, downY);
  }
  wasDown = down;
  if (digitalRead(BTN_BOOT) == LOW && millis() - lastBtn > 400) {
    lastBtn = millis();
    Serial.println("BOOT pressed: back");
    go(parentOf(cur));
  }
  static uint32_t lastFlush = 0;
  if (dirty && millis() - lastFlush > 30) { dirty = false; lastFlush = millis(); flushRegion(0, 0, LCD_W, LCD_H); }
  delay(5);
}
