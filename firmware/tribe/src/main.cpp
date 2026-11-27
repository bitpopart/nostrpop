// TriBe POWout firmware 0.1.x: first published build.
// It only proves the flash path end to end: it boots and prints its version
// over USB serial once a second. It does not draw on the screen yet.
#include <Arduino.h>
#include "version.h"

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.printf("TriBe POWout firmware %s\n", FW_VERSION);
  Serial.printf("Chip %s rev %d, %d MHz, flash %u MB\n", ESP.getChipModel(),
                ESP.getChipRevision(), ESP.getCpuFreqMHz(),
                (unsigned)(ESP.getFlashChipSize() / (1024 * 1024)));
}

void loop() {
  static uint32_t n = 0;
  Serial.printf("TriBe %s alive %lu s\n", FW_VERSION, (unsigned long)(millis() / 1000));
  delay(1000);
  n++;
}
