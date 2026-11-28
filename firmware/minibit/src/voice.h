// Hold to ask: record from the onboard microphone (ES8311), send the audio to Google Gemini, show the answer.
// The Gemini API key (free from aistudio.google.com/apikey) is typed once on a phone page served by the device.
#pragma once
#include <ESP_I2S.h>
#include <mbedtls/base64.h>
#include "es8311.h"

#define V_PA 46
#define V_RATE 8000                       // what is sent (the codec runs at 16 kHz and is halved)
#define V_MAXSEC 4
#define V_MAXBYTES (V_RATE * 2 * V_MAXSEC)

static I2SClass vi2s;
static bool vAudioOk = false;
static uint8_t vMode = 0;                 // 0 idle, 1 recording, 2 thinking, 3 answer, 4 message
static uint8_t *vBuf = nullptr;           // 44 byte WAV header + 16 bit mono samples
static size_t vLen = 0;
static volatile bool vFull = false;
static bool vHolding = false, vArm = false;
static int vPeakNow = 0; static uint32_t vBarT = 0; static int vHist[9];
static char vTitle[24] = "Hold to ask", vText[420] = "";

static bool voiceAudioInit() {
  if (vAudioOk) return true;
  dbg(20);
  vi2s.setPins(9, 45, 8, 10, 16);         // BCLK, WS, DOUT, DIN, MCLK
  if (!vi2s.begin(I2S_MODE_STD, 16000, I2S_DATA_BIT_WIDTH_16BIT, I2S_SLOT_MODE_STEREO, I2S_STD_SLOT_BOTH)) return false;
  dbg(21);
  es8311_handle_t h = es8311_create(0, ES8311_ADDRESS_0);
  if (!h) return false;
  dbg(22);
  es8311_clock_config_t clk; clk.mclk_inverted = false; clk.sclk_inverted = false; clk.mclk_from_mclk_pin = true;
  clk.mclk_frequency = 16000 * 256; clk.sample_frequency = 16000;
  if (es8311_init(h, &clk, ES8311_RESOLUTION_16, ES8311_RESOLUTION_16) != ESP_OK) return false;
  dbg(23);
  es8311_sample_frequency_config(h, clk.mclk_frequency, clk.sample_frequency);
  es8311_microphone_config(h, false);
  es8311_microphone_gain_set(h, ES8311_MIC_GAIN_24DB);
  dbg(24);
  pinMode(V_PA, OUTPUT); digitalWrite(V_PA, LOW);        // speaker amplifier stays off
  vAudioOk = true; dbg(25); return true;
}

// ---- text helpers
static int textW(int fn, const char *s) {
  long a = 0; const FontE &f = FONTS[fn];
  for (; *s; s++) { const GlyphE *g = glyphFor(f, (uint8_t)*s); if (!g) g = glyphFor(f, '?'); if (g) a += g->adv16; }
  return (int)(a / 16);
}
static void asciiize(const char *in, char *out, size_t cap) {          // UTF-8 to the characters the font has
  size_t n = 0;
  while (*in && n + 4 < cap) {
    const char *p = in; uint32_t c = utf8Next(in); (void)p;
    if (c == 0x2018 || c == 0x2019) c = '\''; else if (c == 0x201C || c == 0x201D) c = '"'; else if (c == 0x2013 || c == 0x2014) c = '-';
    else if (c == 0x2026) { out[n++] = '.'; out[n++] = '.'; c = '.'; }
    else if (c == 0xA0) c = ' ';
    if (c == '\n' || c == '\t') c = ' ';
    if (c >= 32 && c < 127) out[n++] = (char)c;
    else if (c >= 0xC0 && c < 0x100) {                                  // accented letters: use the Latin-1 glyph, encoded as UTF-8
      out[n++] = (char)(0xC0 | (c >> 6)); out[n++] = (char)(0x80 | (c & 0x3F));
    }
  }
  out[n] = 0;
}
static int wrapLines(const char *t, char lines[6][72]) {              // returns line count (max 6)
  int n = 0, len = 0; char cur_[72] = ""; const int MAXW = 396;
  char word[72]; int wl = 0;
  auto flushLine = [&]() { strlcpy(lines[n], cur_, 72); n++; cur_[0] = 0; len = 0; };
  for (const char *p = t;; p++) {
    char ch = *p;
    if (ch == ' ' || ch == 0) {
      if (wl) {
        word[wl] = 0;
        char tryl[160]; snprintf(tryl, sizeof(tryl), len ? "%s %s" : "%s%s", cur_, word);
        if (len && textW(FN_COND, tryl) > MAXW) { if (n >= 5) { strlcat(cur_, "...", 72); flushLine(); return n; } flushLine(); strlcpy(cur_, word, 72); len = wl; }
        else { strlcpy(cur_, tryl, 72); len = strlen(cur_); }
        wl = 0;
      }
      if (!ch) break;
    } else if (wl < 70) word[wl++] = ch;
  }
  if (len || n == 0) { if (n >= 6) return 6; flushLine(); }
  return n;
}

// ---- drawing
static void vButton(uint16_t col) {
  Shp s[1] = {{0, 104, 296, 240, 56, col, 0}};
  drawShapes(0, 262, 448, 106, C_BG, s, 1);
}
static void vBars(bool active) {
  Shp s[9];
  for (int i = 0; i < 9; i++) { float h = 14 + (active ? vHist[i] : 0) * 1.0f; s[i] = {0, (float)(104 + i * 26), 172 - h / 2, 14, h, C_CY, 0}; }
  drawShapes(0, 86, 448, 172, C_BG, s, 9);
}
static void vLines(const char *text) {
  char a[420]; asciiize(text, a, sizeof(a));
  char lines[6][72]; int n = wrapLines(a, lines);
  for (int i = 0; i < 6; i++) {
    Txt t = {FN_COND, i < n ? lines[i] : "", COL_WHITE, 0, (int16_t)ax0(FN_COND, 24), (int16_t)(90 + 28 * i + 20)};
    drawField(FLD_VOICE_L0 + i, &t, 1);
  }
}
static void vDraw() {
  Txt t = {FN_GMSG, vTitle, vMode == 1 ? COL_CYAN : COL_WHITE, 1, 224, 74}; drawField(FLD_VOICE_T, &t, 1);
  if (vMode == 1) vBars(true);
  else if (vMode == 2) vBars(false);
  else vLines(vText);
  vButton(vMode == 1 ? C_RED : (vMode == 2 ? C_TRK : C_CY));
}
static void vSet(uint8_t mode, const char *title, const char *text) {
  vMode = mode; strlcpy(vTitle, title, sizeof(vTitle)); strlcpy(vText, text, sizeof(vText)); vDraw();
}
static void voiceEnter() {
  if (vBuf) { free(vBuf); vBuf = nullptr; }
  vHolding = false; vMode = 0;
  if (WiFi.status() != WL_CONNECTED) vSet(4, "No Wi-Fi", "Connect MiniBit to Wi-Fi first: Menu, then Wi-Fi.");
  else {
    prefs.begin("minibit", true); bool has = prefs.getString("gkey", "").length() > 10; prefs.end();
    if (!has) { char b[200]; snprintf(b, sizeof(b), "Add your free Gemini key: on your phone (same Wi-Fi) open http://minibit.local or http://%s", WiFi.localIP().toString().c_str()); vSet(4, "One time setup", b); }
    else { char b[120]; snprintf(b, sizeof(b), "Hold the button, ask your question, let go and I will answer. (free memory %uK)", (unsigned)(ESP.getMaxAllocHeap() / 1024)); vSet(0, "Hold to ask", b); }
  }
}

// ---- Gemini
static bool geminiAsk(const uint8_t *wav, size_t n, String &answer, String &err) {
  prefs.begin("minibit", true); String key = prefs.getString("gkey", ""); String model = prefs.getString("gmodel", "gemini-flash-latest"); prefs.end();
  WiFiClientSecure c; c.setInsecure(); c.setTimeout(30);
  if (!c.connect("generativelanguage.googleapis.com", 443)) { err = "Could not reach Google."; return false; }
  static const char PRE[] = "{\"system_instruction\":{\"parts\":[{\"text\":\"You are Bit, a tiny pocket bot with a small screen. Answer the question you hear in one to three short plain sentences. No markdown, no emoji. Reply in the language spoken.\"}]},"
                            "\"contents\":[{\"parts\":[{\"text\":\"Answer the question in this audio.\"},{\"inline_data\":{\"mime_type\":\"audio/wav\",\"data\":\"";
  static const char SUF[] = "\"}}]}],\"generationConfig\":{\"maxOutputTokens\":1024}}";
  size_t b64 = 4 * ((n + 2) / 3), total = strlen(PRE) + b64 + strlen(SUF);
  c.printf("POST /v1beta/models/%s:generateContent HTTP/1.0\r\nHost: generativelanguage.googleapis.com\r\nx-goog-api-key: %s\r\nContent-Type: application/json\r\nContent-Length: %u\r\nConnection: close\r\n\r\n",
           model.c_str(), key.c_str(), (unsigned)total);
  c.print(PRE);
  unsigned char out[1032];
  for (size_t i = 0; i < n; i += 768) {
    size_t k = n - i < 768 ? n - i : 768, ol = 0;
    mbedtls_base64_encode(out, sizeof(out), &ol, wav + i, k);
    c.write(out, ol);
  }
  c.print(SUF);
  String status = c.readStringUntil('\n');
  int code = status.length() > 12 ? status.substring(9, 12).toInt() : 0;
  while (c.connected() || c.available()) { String l = c.readStringUntil('\n'); if (l.length() <= 1) break; }
  String body = c.readString(); c.stop();
  JsonDocument d; DeserializationError pe = deserializeJson(d, body);
  if (code != 200 || pe) {
    const char *m = pe ? "" : (d["error"]["message"] | "");
    err = String("Gemini error ") + code + (m[0] ? ": " : "") + String(m).substring(0, 120);
    return false;
  }
  answer = "";
  for (JsonObject part : d["candidates"][0]["content"]["parts"].as<JsonArray>()) { const char *t = part["text"] | ""; answer += t; }
  if (!answer.length()) { err = "No answer came back."; return false; }
  return true;
}

// ---- recording
static void voiceStart() {
  dbg(10); netPause = true;
  if (!voiceAudioInit()) { vSet(4, "Microphone", "The microphone did not start."); return; }
  if (!vBuf) vBuf = (uint8_t *)malloc(44 + V_MAXBYTES);
  dbg(11);
  if (!vBuf) { netPause = false; vSet(4, "Memory", "Not enough free memory for recording."); return; }
  vLen = 0; vFull = false; vPeakNow = 0; memset(vHist, 0, sizeof(vHist)); vBarT = millis();
  dbg(12);
  vSet(1, "Listening", "");
  dbg(13);
}
static void voiceTick() {
  if (vMode != 1 || !vBuf) return;
  int16_t tmp[512];
  dbg(14);
  size_t got = vi2s.readBytes((char *)tmp, sizeof(tmp));
  dbg(15);
  int frames = got / 4, peak = 0;
  int16_t *pcm = (int16_t *)(vBuf + 44);
  for (int f = 0; f + 1 < frames; f += 2) {
    int m0 = (tmp[2 * f] >> 1) + (tmp[2 * f + 1] >> 1), m1 = (tmp[2 * f + 2] >> 1) + (tmp[2 * f + 3] >> 1);
    int v = (m0 + m1) / 2;
    if (vLen + 2 <= V_MAXBYTES) { pcm[vLen / 2] = (int16_t)v; vLen += 2; }
    int a = v < 0 ? -v : v; if (a > peak) peak = a;
  }
  if (peak > vPeakNow) vPeakNow = peak;
  if (vLen + 2 > V_MAXBYTES) vFull = true;
  static int chunkPeak = 0; if (peak > chunkPeak) chunkPeak = peak;
  if (millis() - vBarT > 110) {
    vBarT = millis(); for (int i = 0; i < 8; i++) vHist[i] = vHist[i + 1];
    int h = chunkPeak / 60; vHist[8] = h > 110 ? 110 : h; chunkPeak = 0; vBars(true);
  }
}
static void voiceStop() {
  netPause = false;
  if (vMode != 1) return;
  dbg(30);
  if (vLen < V_RATE) { vSet(4, "Too short", "Hold the button while you speak."); return; }          // under half a second
  int16_t *pcm = (int16_t *)(vBuf + 44); size_t ns = vLen / 2; int peak = 1;
  for (size_t i = 0; i < ns; i++) { int a = pcm[i] < 0 ? -pcm[i] : pcm[i]; if (a > peak) peak = a; }
  if (peak < 250) { vSet(4, "Silence", "I did not hear anything. Hold closer and try again."); return; }
  float g = 24000.0f / peak; if (g > 12) g = 12;
  for (size_t i = 0; i < ns; i++) { int v = (int)(pcm[i] * g); pcm[i] = (int16_t)(v > 32767 ? 32767 : (v < -32768 ? -32768 : v)); }
  uint8_t *h = vBuf; uint32_t dl = vLen, rate = V_RATE, br = V_RATE * 2, rl = 36 + vLen;
  memcpy(h, "RIFF", 4); memcpy(h + 4, &rl, 4); memcpy(h + 8, "WAVEfmt ", 8);
  uint32_t fl = 16; uint16_t fmt = 1, ch = 1, ba = 2, bits = 16;
  memcpy(h + 16, &fl, 4); memcpy(h + 20, &fmt, 2); memcpy(h + 22, &ch, 2); memcpy(h + 24, &rate, 4); memcpy(h + 28, &br, 4);
  memcpy(h + 32, &ba, 2); memcpy(h + 34, &bits, 2); memcpy(h + 36, "data", 4); memcpy(h + 40, &dl, 4);
  vSet(2, "Thinking", "");
  String ans, err;
  dbg(31); netPause = true;
  bool ok = geminiAsk(vBuf, 44 + vLen, ans, err);
  netPause = false; dbg(32);
  free(vBuf); vBuf = nullptr;
  if (ok) vSet(3, "Bit says", ans.c_str()); else vSet(4, "Oops", err.c_str());
}
