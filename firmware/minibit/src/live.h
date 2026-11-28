// Live data over Wi-Fi: Bitcoin price, weather, location, clock, and the Wi-Fi icon in the top bar.
// Text is drawn natively (anti-aliased glyph atlas from live_assets.h) over the pre-rendered screens, one field at a time.
#pragma once
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include "live_assets.h"

static const uint8_t *extrasBase = nullptr;     // set in setup(): the extras blob that follows the screens in the partition
static uint16_t *fbuf = nullptr;                // 128 x 16 x 2 bytes, DMA capable

#define CHUNK 16

static inline int imin(int a, int b) { return a < b ? a : b; }
static inline int imax(int a, int b) { return a > b ? a : b; }
static constexpr uint16_t c565(int r, int g, int b) { return (uint16_t)(((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)); }
static const uint16_t COL_WHITE = c565(220, 233, 255), COL_GREY = c565(124, 139, 165), COL_GREEN = c565(91, 229, 132),
                      COL_RED = c565(255, 107, 90), COL_ORANGE = c565(255, 150, 30), COL_CYAN = c565(70, 230, 255);

static inline uint16_t mix565(uint16_t bg, uint16_t fg, uint8_t a) {
  if (a == 0) return bg;
  if (a == 255) return fg;
  int br = (bg >> 11) & 31, bgc = (bg >> 5) & 63, bb = bg & 31;
  int fr = (fg >> 11) & 31, fgc = (fg >> 5) & 63, fb = fg & 31;
  int r = br + ((fr - br) * a + 127) / 255, g = bgc + ((fgc - bgc) * a + 127) / 255, b = bb + ((fb - bb) * a + 127) / 255;
  return (uint16_t)((r << 11) | (g << 5) | b);
}

// ---------------------------------------------------------------- text fields
struct Run { const GlyphE *g; int16_t x; };
struct Txt { uint8_t fn; const char *s; uint16_t col; int8_t align; int16_t ax; int16_t by; };   // align 0 left (ax = shift), 1 centre at ax, 2 right at ax; by < 0: font default baseline

static const GlyphE *glyphFor(const FontE &f, uint32_t code) {
  int lo = 0, hi = (int)f.n - 1;
  while (lo <= hi) {
    int m = (lo + hi) / 2; uint16_t c = f.g[m].code;
    if (c == code) return &f.g[m];
    if (c < code) lo = m + 1; else hi = m - 1;
  }
  return nullptr;
}
static uint32_t utf8Next(const char *&s) {
  uint8_t c = (uint8_t)*s++;
  if (c < 0x80) return c;
  if ((c & 0xE0) == 0xC0 && *s) { uint32_t r = ((c & 0x1F) << 6) | ((uint8_t)*s++ & 0x3F); return r; }
  if ((c & 0xF0) == 0xE0 && s[0] && s[1]) { uint32_t r = ((c & 0x0F) << 12) | (((uint8_t)s[0] & 0x3F) << 6) | ((uint8_t)s[1] & 0x3F); s += 2; return r; }
  while (((uint8_t)*s & 0xC0) == 0x80) s++;
  return '?';
}
static int layoutRuns(const Txt &t, Run *out, int maxn) {
  const FontE &f = FONTS[t.fn];
  const GlyphE *gl[48]; int n = 0; long adv = 0;
  for (const char *p = t.s; *p && n < 48 && n < maxn;) {
    uint32_t cp = utf8Next(p);
    const GlyphE *g = glyphFor(f, cp);
    if (!g) g = glyphFor(f, '?');
    if (!g) continue;
    gl[n++] = g; adv += g->adv16;
  }
  int x0 = t.align == 0 ? f.penx + t.ax : (t.align == 1 ? t.ax - (int)(adv / 32) : t.ax - (int)(adv / 16));
  long acc = 0;
  for (int i = 0; i < n; i++) { out[i].g = gl[i]; out[i].x = (int16_t)(x0 + (int)(acc / 16)); acc += gl[i]->adv16; }
  return n;
}

// Draws one field: flat background, optional icon, sparkline and up to two texts, pushed in 16-column chunks (design x) so the buffer stays tiny.
static void drawField(int fi, const Txt *tx, int nt, const float *sp = nullptr, int nsp = 0, int icon = -1) {
  const FieldE &f = FIELDS[fi];
  Run runs[2][48]; int nr[2] = {0, 0};
  for (int k = 0; k < nt && k < 2; k++) nr[k] = layoutRuns(tx[k], runs[k], 48);
  int16_t yl[256];
  if (sp && nsp >= 2 && f.w <= 256) {
    float mn = sp[0], mx = sp[0];
    for (int i = 1; i < nsp; i++) { if (sp[i] < mn) mn = sp[i]; if (sp[i] > mx) mx = sp[i]; }
    if (mx - mn < 1e-6f) mx = mn + 1;
    for (int k = 0; k < f.w; k++) {
      float pos = (float)k * (nsp - 1) / (f.w - 1); int i0 = (int)pos; if (i0 >= nsp - 1) i0 = nsp - 2;
      float v = sp[i0] + (sp[i0 + 1] - sp[i0]) * (pos - i0);
      yl[k] = (int16_t)(f.y + f.h - 4 - (int)((v - mn) / (mx - mn) * (f.h - 8)));
    }
  } else sp = nullptr;
  const uint8_t *atlas = extrasBase + ATLAS_OFF;
  for (int c = 0; c < f.w; c += CHUNK) {
    int cw = imin(CHUNK, f.w - c);
    uint16_t *buf = fbuf;
    if (icon >= 0) memcpy(buf, extrasBase + ICON_OFF[icon] + (size_t)c * f.h * 2, (size_t)cw * f.h * 2);
    else for (int i = 0; i < cw * f.h; i++) buf[i] = f.bg;
    if (sp) {
      for (int dx = f.x + c; dx < f.x + c + cw; dx++) {
        int k = dx - f.x, a = yl[k], b = k ? yl[k - 1] : yl[k];
        for (int dy = imin(a, b); dy <= imax(a, b) + 1; dy++) if (dy >= f.y && dy < f.y + f.h) buf[(dx - f.x - c) * f.h + (f.y + f.h - 1 - dy)] = COL_ORANGE;
      }
    }
    for (int k = 0; k < nt && k < 2; k++) {
      int by = tx[k].by >= 0 ? tx[k].by : FONTS[tx[k].fn].basey;
      for (int r = 0; r < nr[k]; r++) {
        const GlyphE *g = runs[k][r].g; if (!g->w) continue;
        int gx0 = runs[k][r].x + g->xo, gy0 = by + g->yo;
        int ix0 = imax(gx0, f.x + c), ix1 = imin(gx0 + g->w, f.x + c + cw);
        int iy0 = imax(gy0, f.y), iy1 = imin(gy0 + g->h, f.y + f.h);
        if (ix0 >= ix1 || iy0 >= iy1) continue;
        const uint8_t *al = atlas + g->off;
        for (int dy = iy0; dy < iy1; dy++) {
          for (int dx = ix0; dx < ix1; dx++) {
            uint8_t a = al[(dy - gy0) * g->w + (dx - gx0)];
            if (!a) continue;
            uint16_t &px = buf[(dx - f.x - c) * f.h + (f.y + f.h - 1 - dy)];
            px = mix565(px, tx[k].col, a);
          }
        }
      }
    }
    gfx->draw16bitRGBBitmap(OX + PW - (f.y + f.h), OY + f.x + c, buf, f.h, cw);
  }
}

// ---------------------------------------------------------------- Wi-Fi icon next to the mic
static bool iconShown = false;
static void drawWifiIcon(int scr, bool on) {
  if (scr < 0 || BAR_TYPE[scr] < 0) return;
  const int X0 = 266, Y0 = 8, S = WIFI_ICON_W;
  uint16_t bg = BAR_BG[scr];
  for (int r = 0; r < S; r++)
    for (int bx = 0; bx < S; bx++) {
      int j = S - 1 - bx;                                  // design y offset
      fbuf[r * S + bx] = on ? mix565(bg, COL_CYAN, WIFI_ALPHA[j * S + r]) : bg;
    }
  gfx->draw16bitRGBBitmap(OX + PW - (Y0 + S), OY + X0, fbuf, S, S);
}

// ---------------------------------------------------------------- data
struct LiveData {
  bool btc, haveSpark, wx, haveLoc, haveOff;
  float eur, chg; uint32_t btcAt; uint32_t block; int fee; float spark[32]; int nSpark;
  char city[40], country[40]; float lat, lon;
  int temp, code, isDay, hi, lo; int hrT[4], hrH[4]; int off; uint32_t wxAt;
};
static LiveData LD;
static SemaphoreHandle_t lmx = nullptr;
static volatile bool dirtyBtc = false, dirtyWx = false;

static bool httpGet(const char *url, String &out) {
  if (ESP.getMaxAllocHeap() < 50000) return false;      // keep room for the zap listener's connections
  WiFiClientSecure sc; sc.setInsecure();
  WiFiClient pc;
  HTTPClient h; h.setTimeout(9000); h.setFollowRedirects(HTTPC_STRICT_FOLLOW_REDIRECTS); h.setUserAgent("MiniBit");
  bool tls = strncmp(url, "https", 5) == 0;
  if (!(tls ? h.begin(sc, url) : h.begin(pc, url))) return false;
  int code = h.GET();
  if (code != 200) { Serial.printf("GET %s -> %d\n", url, code); h.end(); return false; }
  out = h.getString(); h.end();
  return true;
}
static void lock() { xSemaphoreTake(lmx, portMAX_DELAY); }
static void unlock() { xSemaphoreGive(lmx); }

static bool fetchPrice() {
  String b;
  if (!httpGet("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur&include_24hr_change=true", b)) return false;
  JsonDocument d; if (deserializeJson(d, b)) return false;
  float eur = d["bitcoin"]["eur"] | 0.0f, chg = d["bitcoin"]["eur_24h_change"] | 0.0f;
  if (eur <= 0) return false;
  lock(); LD.eur = eur; LD.chg = chg; LD.btc = true; LD.btcAt = millis(); unlock();
  dirtyBtc = true; return true;
}
static bool fetchOhlc() {
  String b;
  if (!httpGet("https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=eur&days=1", b)) return false;
  JsonDocument d; if (deserializeJson(d, b)) return false;
  JsonArray a = d.as<JsonArray>(); int n = a.size(); if (n < 4) return false;
  float tmp[32]; int m = 0, stride = (n + 31) / 32;
  for (int i = 0; i < n && m < 32; i += stride) tmp[m++] = a[i][4] | 0.0f;
  lock(); memcpy(LD.spark, tmp, sizeof(tmp)); LD.nSpark = m; LD.haveSpark = true; unlock();
  dirtyBtc = true; return true;
}
static bool fetchChain() {
  String h, f;
  bool ok = false;
  if (httpGet("https://mempool.space/api/blocks/tip/height", h)) { lock(); LD.block = (uint32_t)h.toInt(); unlock(); ok = true; }
  if (httpGet("https://mempool.space/api/v1/fees/recommended", f)) {
    JsonDocument d; if (!deserializeJson(d, f)) { lock(); LD.fee = d["halfHourFee"] | 0; unlock(); ok = true; }
  }
  if (ok) dirtyBtc = true;
  return ok;
}
static bool fetchLoc() {
  String b;
  if (!httpGet("http://ip-api.com/json/?fields=status,country,city,lat,lon,offset", b)) return false;
  JsonDocument d; if (deserializeJson(d, b)) return false;
  if (strcmp(d["status"] | "", "success") != 0) return false;
  lock();
  strlcpy(LD.city, d["city"] | "", sizeof(LD.city)); strlcpy(LD.country, d["country"] | "", sizeof(LD.country));
  LD.lat = d["lat"] | 0.0f; LD.lon = d["lon"] | 0.0f; LD.haveLoc = true;
  if (!LD.haveOff) { LD.off = d["offset"] | 0; LD.haveOff = true; }
  unlock();
  return true;
}
static bool fetchWeather() {
  char url[300]; float la, lo;
  lock(); la = LD.lat; lo = LD.lon; unlock();
  snprintf(url, sizeof(url), "https://api.open-meteo.com/v1/forecast?latitude=%.3f&longitude=%.3f&current=temperature_2m,weather_code,is_day"
           "&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2", la, lo);
  String b;
  if (!httpGet(url, b)) return false;
  JsonDocument d; if (deserializeJson(d, b)) return false;
  const char *ct = d["current"]["time"] | "";
  if (strlen(ct) < 13) return false;
  int h0 = atoi(ct + 11);
  int t0 = (h0 / 3 + 1) * 3;
  lock();
  LD.temp = lroundf(d["current"]["temperature_2m"] | 0.0f); LD.code = d["current"]["weather_code"] | 0; LD.isDay = d["current"]["is_day"] | 1;
  LD.hi = lroundf(d["daily"]["temperature_2m_max"][0] | 0.0f); LD.lo = lroundf(d["daily"]["temperature_2m_min"][0] | 0.0f);
  for (int j = 0; j < 4; j++) { int idx = t0 + 3 * j; LD.hrT[j] = lroundf(d["hourly"]["temperature_2m"][idx] | 0.0f); LD.hrH[j] = idx % 24; }
  LD.off = d["utc_offset_seconds"] | LD.off; LD.haveOff = true;
  LD.wx = true; LD.wxAt = millis();
  unlock();
  dirtyWx = true; return true;
}

static void liveTask(void *) {
  uint32_t tLoc = 0, tBtc = 0, tOhlc = 0, tChain = 0, tWx = 0; bool wasUp = false, ntp = false;
  for (;;) {
    bool up = WiFi.status() == WL_CONNECTED;
    if (up && !wasUp) { tLoc = tBtc = tOhlc = tChain = tWx = 0; if (!ntp) { configTime(0, 0, "pool.ntp.org", "time.google.com"); ntp = true; } }
    wasUp = up;
    if (up) {
      uint32_t n = millis();
      bool haveLoc; lock(); haveLoc = LD.haveLoc; unlock();
      if (!tBtc || n - tBtc > 60000) { tBtc = fetchPrice() ? n : n - 45000; if (!tBtc) tBtc = 1; }
      if (!tChain || n - tChain > 60000) { tChain = fetchChain() ? millis() : millis() - 45000; if (!tChain) tChain = 1; }
      if (!tOhlc || n - tOhlc > 600000) { tOhlc = fetchOhlc() ? millis() : millis() - 585000; if (!tOhlc) tOhlc = 1; }
      if (!haveLoc || !tLoc || millis() - tLoc > 6UL * 3600000UL) { tLoc = fetchLoc() ? millis() : millis() - 3600000UL * 6 + 20000; if (!tLoc) tLoc = 1; }
      lock(); haveLoc = LD.haveLoc; unlock();
      if (haveLoc && (!tWx || millis() - tWx > 900000)) { tWx = fetchWeather() ? millis() : millis() - 885000; if (!tWx) tWx = 1; }
    }
    vTaskDelay(pdMS_TO_TICKS(2000));
  }
}

// ---------------------------------------------------------------- screens
static const char *wmoText(int c, int day) {
  if (c == 0) return day ? "clear sky" : "clear night";
  if (c == 1) return "mostly clear";
  if (c == 2) return "partly cloudy";
  if (c == 3) return "overcast";
  if (c == 45 || c == 48) return "fog";
  if (c >= 51 && c <= 55) return "drizzle";
  if (c == 56 || c == 57 || c == 66 || c == 67) return "freezing rain";
  if (c == 61) return "light rain";
  if (c == 63) return "rain";
  if (c == 65) return "heavy rain";
  if (c == 71 || c == 73 || c == 75 || c == 77) return "snow";
  if (c >= 80 && c <= 82) return "rain showers";
  if (c == 85 || c == 86) return "snow showers";
  if (c >= 95) return "thunderstorm";
  return "unknown";
}
static int wmoIcon(int c, int day) {
  if (c == 0) return day ? 0 : 1;
  if (c <= 2) return 2;
  if (c == 3) return 3;
  if (c == 45 || c == 48) return 7;
  if (c >= 95) return 6;
  if ((c >= 71 && c <= 77) || c == 85 || c == 86) return 5;
  if (c >= 51) return 4;
  return 3;
}
static void fmtInt(char *o, long v) {
  char t[16]; snprintf(t, sizeof(t), "%ld", v < 0 ? -v : v);
  int n = strlen(t), k = 0;
  if (v < 0) o[k++] = '-';
  for (int i = 0; i < n; i++) { if (i && (n - i) % 3 == 0) o[k++] = ','; o[k++] = t[i]; }
  o[k] = 0;
}

static void drawBtcUpdated(const LiveData &s) {
  char b[64];
  if (s.btc) {
    int m = (millis() - s.btcAt) / 60000;
    if (m < 1) snprintf(b, sizeof(b), "updated just now \xC2\xB7 coingecko");
    else snprintf(b, sizeof(b), "updated %d min ago \xC2\xB7 coingecko", m);
  } else snprintf(b, sizeof(b), WiFi.status() == WL_CONNECTED ? "loading ..." : "no Wi-Fi. Menu > Wi-Fi to connect");
  Txt t = {FN_SMALL, b, COL_GREY, 0, 0, -1};
  drawField(FLD_BTC_UPD, &t, 1);
}
static void drawBtc() {
  LiveData s; lock(); s = LD; unlock();
  char p[32], q[40], c[16], blk[16], fee[24];
  if (s.btc) { fmtInt(p, lroundf(s.eur)); snprintf(q, sizeof(q), "\xE2\x82\xAC" "%s", p); snprintf(c, sizeof(c), "%+.1f%%", s.chg); }
  else { snprintf(q, sizeof(q), "\xE2\x82\xAC" "---"); snprintf(c, sizeof(c), "--"); }
  Txt tp = {FN_PRICE, q, COL_WHITE, 0, 0, -1};
  drawField(FLD_BTC_PRICE, &tp, 1);
  Txt tc = {FN_CHG, c, s.btc && s.chg < 0 ? COL_RED : (s.btc ? COL_GREEN : COL_GREY), 0, 0, -1};
  drawField(FLD_BTC_CHG, &tc, 1);
  drawField(FLD_BTC_SPARK, nullptr, 0, s.haveSpark ? s.spark : nullptr, s.nSpark);
  if (s.block) fmtInt(blk, s.block); else snprintf(blk, sizeof(blk), "---");
  if (s.fee) snprintf(fee, sizeof(fee), "%d sat/vB", s.fee); else snprintf(fee, sizeof(fee), "---");
  Txt tb = {FN_CARD, blk, COL_WHITE, 0, 0, -1};
  drawField(FLD_BTC_BLOCK, &tb, 1);
  Txt tf = {FN_CARD, fee, COL_WHITE, 0, 215, -1};
  drawField(FLD_BTC_FEES, &tf, 1);
  drawBtcUpdated(s);
}
static void drawWeather() {
  LiveData s; lock(); s = LD; unlock();
  char tmp[16], hl[32], ct[64];
  bool ok = s.wx;
  Txt none = {0, "", 0, 0, 0, -1};
  drawField(FLD_WEATHER_ICON, &none, 0, nullptr, 0, ok ? wmoIcon(s.code, s.isDay) : 3);
  if (ok) snprintf(tmp, sizeof(tmp), "%d\xC2\xB0", s.temp); else snprintf(tmp, sizeof(tmp), "--\xC2\xB0");
  Txt tt = {FN_TEMP, tmp, COL_WHITE, 0, 0, -1};
  drawField(FLD_WEATHER_TEMP, &tt, 1);
  Txt tc = {FN_COND, ok ? wmoText(s.code, s.isDay) : (WiFi.status() == WL_CONNECTED ? "loading" : "no Wi-Fi"), COL_GREY, 0, 0, -1};
  drawField(FLD_WEATHER_COND, &tc, 1);
  if (ok) snprintf(hl, sizeof(hl), "%d\xC2\xB0 / %d\xC2\xB0", s.hi, s.lo); else snprintf(hl, sizeof(hl), "-- / --");
  Txt th = {FN_HILO, hl, COL_WHITE, 0, 0, -1};
  drawField(FLD_WEATHER_HILO, &th, 1);
  char lab[5][8], val[5][8];
  for (int i = 0; i < 5; i++) {
    if (!ok) { snprintf(lab[i], 8, "-"); snprintf(val[i], 8, "--"); }
    else if (i == 0) { snprintf(lab[i], 8, "now"); snprintf(val[i], 8, "%d\xC2\xB0", s.temp); }
    else { snprintf(lab[i], 8, "%02dh", s.hrH[i - 1]); snprintf(val[i], 8, "%d\xC2\xB0", s.hrT[i - 1]); }
    Txt a = {FN_HOUR, lab[i], COL_GREY, 1, (int16_t)(69 + 80 * i), -1};
    drawField(FLD_WEATHER_HL0 + i, &a, 1);
    Txt b = {FN_HOURT, val[i], COL_WHITE, 1, (int16_t)(69 + 80 * i), -1};
    drawField(FLD_WEATHER_HT0 + i, &b, 1);
  }
  if (ok && s.city[0]) snprintf(ct, sizeof(ct), "%s, %s", s.city, s.country);
  else snprintf(ct, sizeof(ct), WiFi.status() == WL_CONNECTED ? "finding your location ..." : "no Wi-Fi. Menu > Wi-Fi to connect");
  Txt tf = {FN_SMALL, ct, COL_GREY, 0, 9, (int16_t)(FONTS[FN_SMALL].basey - 2)};
  drawField(FLD_WEATHER_FOOT, &tf, 1);
}

static int lastMinute = -1;
static bool clockNow(struct tm &tmv) {
  lock(); bool ok = LD.haveOff; int off = LD.off; unlock();
  time_t t = time(nullptr);
  if (!ok || t < 1700000000) return false;
  t += off; gmtime_r(&t, &tmv); return true;
}
static void drawClock() {
  static const char *days[] = {"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"};
  static const char *mons[] = {"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"};
  struct tm t; char a[16], b[40];
  if (clockNow(t)) { snprintf(a, sizeof(a), "%02d:%02d", t.tm_hour, t.tm_min); snprintf(b, sizeof(b), "%s %d %s", days[t.tm_wday], t.tm_mday, mons[t.tm_mon]); lastMinute = t.tm_min; }
  else { snprintf(a, sizeof(a), "--:--"); snprintf(b, sizeof(b), WiFi.status() == WL_CONNECTED ? "setting the time ..." : "no Wi-Fi. Menu > Wi-Fi to connect"); }
  Txt ta = {FN_TIME, a, COL_WHITE, 1, 224, -1};
  drawField(FLD_CLOCK_TIME, &ta, 1);
  Txt tb = {FN_DATE, b, COL_GREY, 1, 224, -1};
  drawField(FLD_CLOCK_DATE, &tb, 1);
}

static void liveOnShow(int scr) {
  bool up = WiFi.status() == WL_CONNECTED;
  drawWifiIcon(scr, up); iconShown = up;
  if (scr == SCR_BTC) drawBtc();
  else if (scr == SCR_WEATHER) drawWeather();
  else if (scr == SCR_CLOCK) drawClock();
}
static void liveLoop(int scr) {
  static uint32_t lastAge = 0;
  bool up = WiFi.status() == WL_CONNECTED;
  if (up != iconShown) { iconShown = up; drawWifiIcon(scr, up); if (scr == SCR_BTC) drawBtc(); else if (scr == SCR_WEATHER) drawWeather(); else if (scr == SCR_CLOCK) drawClock(); }
  bool b = dirtyBtc, w = dirtyWx; dirtyBtc = dirtyWx = false;
  if (b && scr == SCR_BTC) drawBtc();
  if (w && scr == SCR_WEATHER) drawWeather();
  if (scr == SCR_BTC && millis() - lastAge > 30000) { lastAge = millis(); LiveData s; lock(); s = LD; unlock(); drawBtcUpdated(s); }
  if (scr == SCR_CLOCK || w) {
    struct tm t;
    if (scr == SCR_CLOCK && clockNow(t) && t.tm_min != lastMinute) drawClock();
  }
}
static void liveBegin() {
  lmx = xSemaphoreCreateMutex();
  memset(&LD, 0, sizeof(LD));
  fbuf = (uint16_t *)heap_caps_malloc(256 * CHUNK * 2, MALLOC_CAP_DMA | MALLOC_CAP_INTERNAL);
  xTaskCreatePinnedToCore(liveTask, "live", 16384, nullptr, 1, nullptr, 0);
}
