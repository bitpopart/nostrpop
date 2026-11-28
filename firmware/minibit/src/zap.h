// Incoming zaps: MiniBit listens on Nostr relays for zap receipts (kind 9735) addressed to the BitPopArt pubkey,
// shows an animation with the amount and counts the sats of today on the zap screen.
#pragma once
#include <WebSocketsClient.h>

static const char ZAP_PK[] = "43baaf0c28e6cfb195b17ee083e19eb3a4afdfac54d9b6baf170270ed193e34c";   // npub1gwa27rpg... of bitpopart
static const char *ZR_HOST[2] = {"relay.damus.io", "nos.lol"};
static WebSocketsClient zws[2];
static volatile bool zapNew = false;
static volatile int zapAmt = 0;
static char zapCmt[44] = "";
static char zapSeen[8][17]; static int zapSeenN = 0;

static long bolt11Sats(const char *inv) {
  if (!inv || strlen(inv) < 6 || (inv[0] | 32) != 'l' || (inv[1] | 32) != 'n') return -1;
  const char *p = inv + 2;
  while (*p && !isdigit((unsigned char)*p)) p++;
  double v = 0; int nd = 0;
  while (isdigit((unsigned char)*p)) { v = v * 10 + (*p - '0'); p++; nd++; }
  if (!nd) return -1;
  switch (*p | 32) {
    case 'm': v *= 100000.0; break;
    case 'u': v *= 100.0; break;
    case 'n': v /= 10.0; break;
    case 'p': v /= 10000.0; break;
    default: return -1;
  }
  return (long)(v + 0.5);
}

static void zapHandle(uint8_t *payload, size_t len) {
  JsonDocument d;
  if (deserializeJson(d, (const char *)payload, len)) return;
  if (strcmp(d[0] | "", "EVENT") != 0) return;
  JsonObject ev = d[2];
  if ((ev["kind"] | 0) != 9735) return;
  const char *id = ev["id"] | "";
  if (strlen(id) < 16) return;
  for (int i = 0; i < zapSeenN && i < 8; i++) if (strncmp(zapSeen[i], id, 16) == 0) return;       // same receipt from the other relay
  strncpy(zapSeen[zapSeenN % 8], id, 16); zapSeen[zapSeenN % 8][16] = 0; zapSeenN++;
  const char *inv = nullptr, *desc = nullptr;
  for (JsonArray t : ev["tags"].as<JsonArray>()) {
    const char *k = t[0] | "";
    if (!strcmp(k, "bolt11")) inv = t[1] | "";
    else if (!strcmp(k, "description")) desc = t[1] | "";
  }
  long sats = bolt11Sats(inv);
  if (sats <= 0) return;
  char cm[44] = "";
  if (desc) {
    JsonDocument z;
    if (!deserializeJson(z, desc)) {
      const char *c = z["content"] | ""; int n = 0;
      for (; *c && n < 40; c++) if (*c >= 32 && *c < 127) cm[n++] = *c;
      cm[n] = 0;
    }
  }
  strlcpy(zapCmt, cm, sizeof(zapCmt)); zapAmt = (int)sats; zapNew = true;
  Serial.printf("zap received: %ld sats\n", sats);
}

static void zapTask(void *) {
  bool started = false;
  for (;;) {
    if (WiFi.status() == WL_CONNECTED) {
      if (!started) {
        started = true;
        for (int i = 0; i < 2; i++) {
          zws[i].beginSSL(ZR_HOST[i], 443, "/");
          zws[i].onEvent([i](WStype_t type, uint8_t *p, size_t n) {
            if (type == WStype_CONNECTED) {
              char req[200]; snprintf(req, sizeof(req), "[\"REQ\",\"mz\",{\"kinds\":[9735],\"#p\":[\"%s\"],\"limit\":0}]", ZAP_PK);
              zws[i].sendTXT(req); Serial.printf("zap relay %s connected\n", ZR_HOST[i]);
            } else if (type == WStype_TEXT) zapHandle(p, n);
          });
          zws[i].setReconnectInterval(8000);
          zws[i].enableHeartbeat(20000, 5000, 2);
          vTaskDelay(pdMS_TO_TICKS(4000));                   // one TLS handshake at a time
        }
      }
      zws[0].loop(); zws[1].loop();
    }
    vTaskDelay(pdMS_TO_TICKS(5));
  }
}
static void zapBegin() { xTaskCreatePinnedToCore(zapTask, "zap", 12288, nullptr, 1, nullptr, 0); }

// ---- sats today (kept across reboots)
static int satsDay() { struct tm t; return clockNow(t) ? t.tm_year * 400 + t.tm_yday : -1; }
static long satsToday() {
  Preferences p; p.begin("mbzap", true); int day = p.getInt("day", -1); long s = p.getLong("sats", 0); p.end();
  int now = satsDay(); if (now >= 0 && day != now) return 0;
  return s;
}
static void satsAdd(int a) {
  long s = satsToday(); int now = satsDay();
  Preferences p; p.begin("mbzap", false); p.putLong("sats", s + a); if (now >= 0) p.putInt("day", now); p.end();
}
static void drawZapNum() {
  char n[24]; fmtInt(n, satsToday());
  Txt t = {FN_ZBIG, n, COL_WHITE, 0, 0, -1};
  drawField(FLD_ZAP_NUM, &t, 1);
}

// ---- the animation: bolt pulse, rings and sparks, with the amount
static void playZap(int amt, const char *cmt) {
  drawShapes(0, 0, 448, 88, C_BG, nullptr, 0); drawShapes(0, 258, 448, 110, C_BG, nullptr, 0);
  Txt t0 = {FN_GMSG, "Zap received", COL_WHITE, 1, 224, 76}; drawField(FLD_ZAPA_TITLE, &t0, 1);
  char n[24], a[32]; fmtInt(n, amt); snprintf(a, sizeof(a), "+%s sats", n);
  Txt t1 = {FN_ZAMT, a, c565(249, 233, 78), 1, 224, 312, }; drawField(FLD_ZAPA_AMT, &t1, 1);
  Txt t2 = {FN_COND, cmt, COL_GREY, 1, 224, 354}; drawField(FLD_ZAPA_MSG, &t2, cmt[0] ? 1 : 0);
  uint32_t t = millis();
  while (millis() - t < 4200) {
    float f = (millis() - t) / 40.0f;
    Shp s[12]; int k = 0;
    for (int r = 0; r < 3; r++) {
      float rad = 22 + fmodf(f * 3.5f + r * 38, 114);
      uint8_t al = (uint8_t)(255 * (1 - (rad - 22) / 114));
      s[k++] = {1, 224 - rad, 173 - rad, rad * 2, rad * 2, mix565(C_BG, C_YEL, al), 4};
    }
    float pul = 1 + 0.12f * sinf(f * 0.55f), bw = 60 * pul, bh = 84 * pul;
    s[k++] = {4, 224 - bw / 2, 173 - bh / 2, bw, bh, c565(255, 200, 40), 0};
    for (int i = 0; i < 6; i++) {
      float ang = i * 1.0472f + f * 0.06f, dist = 52 + fmodf(f * 2.2f + i * 17, 60);
      s[k++] = {3, 224 + cosf(ang) * dist - 4, 173 + sinf(ang) * dist * 0.8f - 4, 8, 8, C_YEL, 0};
    }
    drawShapes(0, 88, 448, 170, C_BG, s, k > 12 ? 12 : k);
  }
}
static void zapLoop() {
  if (!zapNew || apOn) return;
  zapNew = false;
  int a = zapAmt; char c[44]; strlcpy(c, zapCmt, sizeof(c));
  satsAdd(a);
  playZap(a, c);
  show(cur);
}
