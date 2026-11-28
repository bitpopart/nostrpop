// Moods (the face screen) and the two games, drawn natively with anti-aliased shapes (no pre-rendered images needed).
#pragma once
#include <Preferences.h>
#include <math.h>

struct Shp { uint8_t t; float x, y, w, h; uint16_t col; float k; };   // t: 0 pill/bar, 1 ring (k = thickness), 2 heart, 3 ellipse, 4 bolt
static const float BOLT[7][2] = {{0.50f, 0}, {0.12f, 0.56f}, {0.44f, 0.56f}, {0.30f, 1}, {0.90f, 0.38f}, {0.56f, 0.38f}, {0.76f, 0}};

static float clamp01(float v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
static float covSD(float d) { return clamp01(0.5f - d); }
static bool inBolt(const Shp &s, float px, float py) {
  float u = (px - s.x) / s.w, v = (py - s.y) / s.h; bool in = false;
  for (int i = 0, j = 6; i < 7; j = i++)
    if (((BOLT[i][1] > v) != (BOLT[j][1] > v)) && (u < (BOLT[j][0] - BOLT[i][0]) * (v - BOLT[i][1]) / (BOLT[j][1] - BOLT[i][1]) + BOLT[i][0])) in = !in;
  return in;
}
static bool inHeart(const Shp &s, float px, float py) {
  float u = (px - (s.x + s.w / 2)) / (s.w / 2) * 1.14f, v = 0.135f + ((s.y + s.h / 2) - py) / (s.h / 2) * 1.135f;
  float a = u * u + v * v - 1; return a * a * a - u * u * v * v * v <= 0;
}
static float coverage(const Shp &s, float px, float py) {
  if (px < s.x - 1 || py < s.y - 1 || px > s.x + s.w + 1 || py > s.y + s.h + 1) return 0;
  float cx = s.x + s.w / 2, cy = s.y + s.h / 2;
  switch (s.t) {
    case 0: {
      float r = (s.w < s.h ? s.w : s.h) / 2, qx = fabsf(px - cx) - (s.w / 2 - r), qy = fabsf(py - cy) - (s.h / 2 - r);
      float mx = qx > 0 ? qx : 0, my = qy > 0 ? qy : 0, m = qx > qy ? qx : qy;
      return covSD(sqrtf(mx * mx + my * my) + (m < 0 ? m : 0) - r);
    }
    case 1: { float d = sqrtf((px - cx) * (px - cx) + (py - cy) * (py - cy)); return covSD(fabsf(d - (s.w / 2 - s.k / 2)) - s.k / 2); }
    case 3: { float ex = (px - cx) / (s.w / 2), ey = (py - cy) / (s.h / 2); float m = s.w < s.h ? s.w : s.h; return covSD((sqrtf(ex * ex + ey * ey) - 1) * m / 2); }
    default: {
      int n = 0;
      for (int i = 0; i < 4; i++) { float sx = px + (i & 1 ? 0.25f : -0.25f), sy = py + (i & 2 ? 0.25f : -0.25f); if (s.t == 2 ? inHeart(s, sx, sy) : inBolt(s, sx, sy)) n++; }
      return n / 4.0f;
    }
  }
}
// Draws shapes into a region (x, y, w, h all even, h <= 256) on a flat background.
static void drawShapes(int x, int y, int w, int h, uint16_t bg, const Shp *sh, int n) {
  for (int c = 0; c < w; c += CHUNK) {
    int cw = imin(CHUNK, w - c);
    for (int dx = 0; dx < cw; dx++) {
      for (int dy = 0; dy < h; dy++) {
        uint16_t px = bg; float fx = x + c + dx + 0.5f, fy = y + dy + 0.5f;
        for (int k = 0; k < n; k++) { float a = coverage(sh[k], fx, fy); if (a > 0.01f) px = mix565(px, sh[k].col, (uint8_t)(a * 255)); }
        fbuf[dx * h + (h - 1 - dy)] = px;
      }
    }
    gfx->draw16bitRGBBitmap(OX + PW - (y + h), OY + x + c, fbuf, h, cw);
  }
}

static const uint16_t C_BG = c565(5, 6, 8), C_CY = c565(70, 230, 255), C_RED = c565(255, 107, 90), C_PINK = c565(255, 77, 141),
                      C_BLUE = c565(90, 170, 255), C_YEL = c565(249, 233, 78), C_DIM = c565(28, 80, 90), C_TRK = c565(28, 38, 54), C_BOLT = c565(240, 106, 30);
static inline int ax0(int fn, int x) { return x - FONTS[fn].penx; }

// ---------------------------------------------------------------- moods
static int curMood = 0;
static const char *MOOD_NAMES[8] = {"happy", "sleepy", "surprised", "sad", "angry", "love", "wink", "hungry"};
static void moodTiles(int m, Shp *o, int &n) {          // shapes from the mood tiles (absolute design coordinates of the tile preview)
  n = 0;
  auto add = [&](uint8_t t, float x, float y, float w, float h, uint16_t col, float k = 4) { o[n++] = {t, x, y, w, h, col, k}; };
  switch (m) {
    case 0: add(0, 39, 70, 18, 52, C_CY); add(0, 73, 70, 18, 52, C_CY); break;
    case 1: add(0, 143, 98, 24, 7, C_CY); add(0, 179, 98, 24, 7, C_CY); break;
    case 2: add(1, 247, 82, 30, 30, C_CY, 5); add(1, 285, 82, 30, 30, C_CY, 5); break;
    case 3: add(0, 363, 84, 16, 40, C_CY); add(0, 399, 84, 16, 40, C_CY); add(3, 367, 128, 8, 11, C_BLUE); break;
    case 4: add(0, 33, 206, 28, 6, C_RED); add(0, 69, 206, 28, 6, C_RED); add(0, 39, 220, 18, 34, C_RED); add(0, 73, 220, 18, 34, C_RED); break;
    case 5: add(2, 133, 214, 36, 34, C_PINK); add(2, 177, 214, 36, 34, C_PINK); break;
    case 6: add(0, 255, 200, 18, 52, C_CY); add(0, 285, 228, 28, 7, C_CY); break;
    default: add(0, 365, 200, 15, 34, C_CY); add(0, 398, 200, 15, 34, C_CY); add(3, 377, 246, 24, 20, C_CY); break;
  }
}
static void faceDraw() {
  Shp t[4], o[4]; int n;
  moodTiles(curMood, t, n);
  float x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (int i = 0; i < n; i++) { if (t[i].x < x0) x0 = t[i].x; if (t[i].y < y0) y0 = t[i].y; if (t[i].x + t[i].w > x1) x1 = t[i].x + t[i].w; if (t[i].y + t[i].h > y1) y1 = t[i].y + t[i].h; }
  float S = 3.2f; if ((x1 - x0) * S > 380) S = 380 / (x1 - x0); if ((y1 - y0) * S > 220) S = 220 / (y1 - y0);
  float cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  for (int i = 0; i < n; i++) { o[i] = t[i]; o[i].x = 224 + (t[i].x - cx) * S; o[i].y = 168 + (t[i].y - cy) * S; o[i].w = t[i].w * S; o[i].h = t[i].h * S; o[i].k = t[i].k * S * 0.8f; }
  drawShapes(0, 44, 448, 250, C_BG, o, n);
  char b[32]; snprintf(b, sizeof(b), "mood: %s", MOOD_NAMES[curMood]);
  Txt tx = {FN_SMALL, b, COL_GREY, 1, 224, 324};
  drawField(FLD_FACE_LABEL, &tx, 1);
}
static void moodTap(int dx, int dy) {
  int best = -1, bd = 1 << 30;
  for (int i = 0; i < 8; i++) {
    int x = 16 + 108 * (i % 4), y = 48 + 130 * (i / 4);
    int ex = dx < x ? x - dx : (dx > x + 97 ? dx - (x + 97) : 0), ey = dy < y ? y - dy : (dy > y + 117 ? dy - (y + 117) : 0);
    int d = ex * ex + ey * ey; if (d < bd) { bd = d; best = i; }
  }
  if (best >= 0 && bd <= 14 * 14) curMood = best, go(SCR_FACE);
}

// ---------------------------------------------------------------- games
static uint8_t gMode = 0;                  // 0 ready, 1 playing, 2 over
static int gScore = 0, gBest[2] = {0, 0}, gEye = 0, gLives = 3;
static uint32_t gDeadline = 0, gLast = 0, gBoltAt = 0, gOverAt = 0, gLife = 1500;
static float gBx = 200, gBy = 120;
static Preferences gp;
static void gScores() {
  int g = cur == SCR_GAME2 ? 1 : 0; char a[12], b[12];
  snprintf(a, sizeof(a), "%d", gScore); snprintf(b, sizeof(b), "%d", gBest[g]);
  Txt s[2] = {{FN_SMALL, "score", COL_GREY, 0, (int16_t)ax0(FN_SMALL, 30), 292}, {FN_GSCORE, a, COL_WHITE, 0, 30, 330}};
  drawField(FLD_GAME_SC, s, 2);
  Txt e[2] = {{FN_SMALL, "best", COL_GREY, 2, 418, 292}, {FN_GSCORE, b, c565(249, 233, 78), 2, 418, 330}};
  drawField(FLD_GAME_BE, e, 2);
}
static void gMsg(const char *m) { Txt t = {FN_GMSG, m, COL_WHITE, 1, 224, 82}; drawField(FLD_GAME_MSG, &t, 1); }
static void g1Eyes() {
  Shp s[2] = {{0, 96, 100, 80, 150, gEye == 0 ? C_YEL : C_DIM, 0}, {0, 272, 100, 80, 150, gEye == 1 ? C_YEL : C_DIM, 0}};
  drawShapes(0, 92, 448, 166, C_BG, s, 2);
}
static void g1Bar(int ms) {
  float f = clamp01(ms / 15000.0f); Shp s[2] = {{0, 110, 262, 228, 8, C_TRK, 0}, {0, 110, 262, 228 * f < 8 ? 8 : 228 * f, 8, C_CY, 0}};
  drawShapes(110, 258, 228, 16, C_BG, s, f > 0 ? 2 : 1);
}
static void g2Bolt(bool show) {
  Shp s[1] = {{4, gBx, gBy, 44, 60, C_BOLT, 0}};
  drawShapes(24, 92, 400, 166, C_BG, s, show ? 1 : 0);
}
static void g2Lives() {
  Shp s[3]; for (int i = 0; i < 3; i++) s[i] = {0, (float)(194 + i * 24), 262, 12, 12, i < gLives ? C_BOLT : C_TRK, 0};
  drawShapes(110, 258, 228, 16, C_BG, s, 3);
}
static void g2Spawn() { gBx = 44 + (esp_random() % 320); gBy = 96 + (esp_random() % 90); gBoltAt = millis(); g2Bolt(true); }
static void gameEnter() {
  int g = cur == SCR_GAME2 ? 1 : 0;
  gp.begin("mbgames", true); gBest[g] = gp.getInt(g ? "b2" : "b1", 0); gp.end();
  gScore = 0; gMode = 0; gLives = 3; gLife = 1500;
  if (g == 0) { gEye = esp_random() & 1; gMsg("Tap the yellow eye!"); g1Eyes(); g1Bar(15000); }
  else { gMsg("Catch the bolt!"); g2Lives(); g2Spawn(); }
  gScores();
}
static void gameOver() {
  int g = cur == SCR_GAME2 ? 1 : 0; gMode = 2; gOverAt = millis();
  if (gScore > gBest[g]) { gBest[g] = gScore; gp.begin("mbgames", false); gp.putInt(g ? "b2" : "b1", gScore); gp.end(); }
  gMsg("Game over, tap to retry"); gScores();
  if (g == 1) g2Bolt(false);
}
static void gameTap(int dx, int dy) {
  if (gMode == 2) { if (millis() - gOverAt > 500) gameEnter(); return; }
  if (cur == SCR_GAME) {
    int side = dx < 224 ? 0 : 1;
    if (side != gEye) return;
    if (gMode == 0) { gMode = 1; gDeadline = millis() + 15000; }
    else { gDeadline += 500; if (gDeadline > millis() + 15000) gDeadline = millis() + 15000; }
    gScore++; gEye = 1 - gEye; g1Eyes(); gScores();
  } else {
    if (dx < gBx - 28 || dx > gBx + 72 || dy < gBy - 28 || dy > gBy + 88) return;
    gMode = 1; gScore++; gLife = gScore * 40 >= 800 ? 700 : 1500 - gScore * 40; g2Spawn(); gScores();
  }
}
static void gameTick() {
  if (cur != SCR_GAME && cur != SCR_GAME2) return;
  if (gMode != 1 || millis() - gLast < 120) return;
  gLast = millis();
  if (cur == SCR_GAME) {
    int rem = (int)(gDeadline - millis());
    if (rem <= 0) { g1Bar(0); gameOver(); } else g1Bar(rem);
  } else if (millis() - gBoltAt > gLife) {
    gLives--; g2Lives();
    if (gLives <= 0) gameOver(); else g2Spawn();
  }
}
