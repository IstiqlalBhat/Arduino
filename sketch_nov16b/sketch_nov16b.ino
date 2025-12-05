#include <WiFiS3.h>
#include <WiFiSSLClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Arduino_LED_Matrix.h"
#include "config.h"

// OLED Display
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// LED Matrix
ArduinoLEDMatrix matrix;

// WiFi credentials (loaded from config.h)
char ssid[] = WIFI_SSID;
char password[] = WIFI_PASSWORD;

// OpenAI API (loaded from config.h)
const char* apiKey = OPENAI_API_KEY;

// Firebase (loaded from config.h)
const char* firebaseHost = FIREBASE_HOST;

WiFiSSLClient client;
int status = WL_IDLE_STATUS;

unsigned long lastPollTime = 0;
String lastProcessedId = "";

// Animation Frame Settings
#define FRAME_DELAY (42)
#define FRAME_WIDTH (32)
#define FRAME_HEIGHT (32)
#define FRAME_COUNT (sizeof(frames) / sizeof(frames[0]))

// Frame animation data stored in PROGMEM
const byte PROGMEM frames[][128] = {
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,30,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,0,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,9,12,0,0,137,12,0,0,217,14,0,0,81,154,0,0,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,9,12,0,0,9,12,0,0,25,14,0,0,17,154,0,0,17,154,124,0,17,147,192,0,48,145,128,0,32,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,1,12,0,0,1,12,0,0,1,14,0,0,1,154,0,0,1,154,124,0,1,147,192,0,0,145,128,0,0,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,1,12,0,0,1,12,0,0,1,14,0,0,1,154,0,0,1,154,124,0,1,147,192,0,0,145,128,0,0,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,12,0,0,0,14,0,0,0,26,0,0,0,26,124,0,0,19,192,0,0,17,128,0,0,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,12,0,0,0,14,0,0,0,26,0,0,0,26,124,0,0,19,192,0,0,17,128,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,124,0,0,3,192,0,0,1,128,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,0,1,128,0,0,1,128,0,0,3,0,0,0,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,0,1,136,0,0,1,216,0,0,3,80,0,0,62,112,0,0,0,112,0,0,0,48,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,4,0,0,0,12,0,0,0,12,0,0,0,8,0,0,0,136,0,0,1,136,0,0,1,216,0,0,3,80,0,0,62,112,0,0,0,112,0,0,0,48,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,0,0,1,137,0,0,1,217,0,0,3,81,128,0,62,113,128,0,0,113,128,0,0,48,128,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,0,0,1,137,0,0,1,217,0,0,3,81,128,0,62,113,128,0,0,113,128,0,0,48,128,0,0,48,128,0,0,0,128,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,0,0,1,137,8,0,1,217,8,0,3,81,152,0,62,113,152,0,0,113,144,0,0,48,144,0,0,48,176,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,0,0,113,147,0,0,48,144,0,0,48,176,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,64,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,120,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
};

// Idle Animation Settings
#define IDLE_FRAME_COUNT (sizeof(idleFrames) / sizeof(idleFrames[0]))
#define IDLE_FRAME_DELAY (100)

// Idle animation frames - REPLACE WITH YOUR CUSTOM FRAMES
const byte PROGMEM idleFrames[][128] = {
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,30,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,0,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,9,12,0,0,137,12,0,0,217,14,0,0,81,154,0,0,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,9,12,0,0,9,12,0,0,25,14,0,0,17,154,0,0,17,154,124,0,17,147,192,0,48,145,128,0,32,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,1,12,0,0,1,12,0,0,1,14,0,0,1,154,0,0,1,154,124,0,1,147,192,0,0,145,128,0,0,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,1,12,0,0,1,12,0,0,1,14,0,0,1,154,0,0,1,154,124,0,1,147,192,0,0,145,128,0,0,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,12,0,0,0,14,0,0,0,26,0,0,0,26,124,0,0,19,192,0,0,17,128,0,0,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,12,0,0,0,14,0,0,0,26,0,0,0,26,124,0,0,19,192,0,0,17,128,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,124,0,0,3,192,0,0,1,128,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,0,1,128,0,0,1,128,0,0,3,0,0,0,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,128,0,0,1,136,0,0,1,216,0,0,3,80,0,0,62,112,0,0,0,112,0,0,0,48,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,4,0,0,0,12,0,0,0,12,0,0,0,8,0,0,0,136,0,0,1,136,0,0,1,216,0,0,3,80,0,0,62,112,0,0,0,112,0,0,0,48,0,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,0,0,1,137,0,0,1,217,0,0,3,81,128,0,62,113,128,0,0,113,128,0,0,48,128,0,0,48,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,0,0,1,137,0,0,1,217,0,0,3,81,128,0,62,113,128,0,0,113,128,0,0,48,128,0,0,48,128,0,0,0,128,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,0,0,1,137,8,0,1,217,8,0,3,81,152,0,62,113,152,0,0,113,144,0,0,48,144,0,0,48,176,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,0,0,113,147,0,0,48,144,0,0,48,176,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,64,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,120,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0},
  {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,15,0,0,0,15,0,0,0,11,0,0,0,137,12,0,1,137,12,0,1,217,14,0,3,81,154,0,62,113,154,124,0,113,147,192,0,48,145,128,0,48,177,0,0,0,160,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0,64,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0}
};
// LED Matrix emotions
const uint32_t happy[] = {
  0x19819,
  0x80000001,
  0x81f8000
};

const uint32_t thinking[] = {
  0x19819,
  0x80000000,
  0x81008000
};

const uint32_t talking[] = {
  0x19819,
  0x80000000,
  0x800ffc00
};

const uint32_t listening[] = {
  0x19819,
  0x80000000,
  0x8000000
};

const uint32_t excited[] = {
  0x1f81f,
  0x80000001,
  0x81f8000
};

const uint32_t sleeping[] = {
  0xc30c3,
  0x80000000,
  0x8000000
};

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Start LED Matrix
  matrix.begin();

  // Start OLED
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  display.println("Toby Watch");
  display.println("Booting up...");
  display.display();

  // Show sleeping face initially
  matrix.loadFrame(sleeping);
  delay(1000);

  // Connect WiFi
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.display();

  matrix.loadFrame(thinking);

  while (status != WL_CONNECTED) {
    status = WiFi.begin(ssid, password);
    delay(3000);
  }

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Cloud Mode Active");
  display.println("");
  display.println("Chat with Toby at:");
  display.println("toby-watch");
  display.println(".vercel.app");
  display.println("");
  display.println("(PIN protected)");
  display.display();

  // Show excited face when ready
  matrix.loadFrame(excited);
  delay(2000);
  matrix.loadFrame(happy);

  Serial.println("=============================");
  Serial.println("Toby Watch - Cloud Mode");
  Serial.println("=============================");
  Serial.println("Status: Connected to WiFi");
  Serial.println("Mode: Public Access (PIN Protected)");
  Serial.println("Polling Firebase for messages...");
  Serial.println("=============================");
}

void loop() {
  // Check WiFi status
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    matrix.loadFrame(thinking);
    while (WiFi.status() != WL_CONNECTED) {
      WiFi.begin(ssid, password);
      delay(3000);
    }
    Serial.println("WiFi reconnected!");
    matrix.loadFrame(happy);
  }

  // Poll Firebase for new messages
  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    checkForMessages();
  }

  // Show idle animation when waiting for messages
  showIdleAnimation();

  delay(100);
}

void checkForMessages() {
  // Verify WiFi is connected
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected - skipping poll");
    return;
  }

  Serial.println("Polling Firebase...");
  Serial.print("WiFi signal: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
  Serial.print("Connecting to: ");
  Serial.print(firebaseHost);
  Serial.println(":443");

  // Stop any existing connection
  client.stop();
  delay(200);

  // Attempt connection with better retry logic
  int attempts = 0;
  bool connected = false;

  while (attempts < 3 && !connected) {
    attempts++;
    Serial.print("Connection attempt ");
    Serial.print(attempts);
    Serial.println("/3");

    if (client.connect(firebaseHost, 443)) {
      connected = true;
      Serial.println("SSL connection established!");
    } else {
      Serial.println("Connection failed");
      client.stop();
      if (attempts < 3) {
        Serial.println("Waiting before retry...");
        delay(2000); // 2 second delay between attempts
      }
    }
  }

  if (!connected) {
    Serial.println("All connection attempts failed");
    Serial.println("Tip: Check WiFi signal strength");
    return;
  }

  Serial.println("Connected to Firebase!");

  // Request messages from Firebase
  String path = "/messages.json?orderBy=\"processed\"&equalTo=false&limitToFirst=1";

  client.print("GET ");
  client.print(path);
  client.println(" HTTP/1.1");
  client.print("Host: ");
  client.println(firebaseHost);
  client.println("Connection: close");
  client.println();

  // Wait for response
  unsigned long timeout = millis();
  while (!client.available()) {
    if (millis() - timeout > 10000) {
      Serial.println("Firebase timeout");
      client.stop();
      return;
    }
  }

  // Skip headers - read until we find the empty line
  while (client.connected()) {
    String line = client.readStringUntil('\n');
    line.trim(); // Remove \r and whitespace
    if (line.length() == 0) break; // Empty line marks end of headers
  }

  // Now read the JSON body
  String response = "";
  while (client.available()) {
    char c = client.read();
    response += c;
  }
  client.stop();

  // Trim whitespace
  response.trim();

  // Extract JSON if there are any remaining headers or extra content
  int jsonStart = response.indexOf('{');
  if (jsonStart >= 0) {
    response = response.substring(jsonStart);
  }

  Serial.print("Firebase JSON: ");
  Serial.println(response);

  // Handle null or empty response
  if (response == "null" || response == "{}" || response.length() == 0) {
    Serial.println("No new messages");
    return;
  }

  // Parse JSON
  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
    return;
  }

  // Check if there are messages
  if (doc.isNull() || doc.as<JsonObject>().size() == 0) {
    Serial.println("No new messages");
    return;
  }

  // Get first message
  JsonObject obj = doc.as<JsonObject>();
  for (JsonPair kv : obj) {
    String messageId = String(kv.key().c_str());
    JsonObject message = kv.value();

    // Check if already processed (by our tracking)
    if (messageId == lastProcessedId) {
      Serial.println("Message already processed (tracked) - skipping");
      break;
    }

    // Double-check if already processed in Firebase (safety check)
    bool isProcessed = message["processed"] | false;
    if (isProcessed) {
      Serial.println("Message already processed in Firebase - skipping");
      lastProcessedId = messageId; // Update tracking
      break;
    }

    String text = message["text"];
    String pin = message["pin"];

    Serial.print("New message ID: ");
    Serial.println(messageId);
    Serial.print("Text: ");
    Serial.println(text);
    Serial.print("PIN: ");
    Serial.println(pin);

    // Set lastProcessedId IMMEDIATELY to prevent reprocessing
    lastProcessedId = messageId;

    // Verify PIN
    if (pin != ACCESS_PIN) {
      Serial.println("Invalid PIN - ignoring message");
      markAsProcessed(messageId);
      break; // Exit after marking invalid PIN message
    }

    // Process message
    processMessage(text, messageId);

    break; // Only process one message at a time
  }
}

void processMessage(String msg, String messageId) {
  Serial.println("=============================");
  Serial.print("Processing: ");
  Serial.println(msg);

  // Show listening face
  matrix.loadFrame(listening);

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("New message!");
  display.println("");
  display.println(msg.substring(0, 60));
  display.display();

  delay(1000);

  // Show loading animation
  showCustomAnimation();

  // Get response from ChatGPT
  String reply = askGPT(msg);

  Serial.print("GPT Response: ");
  Serial.println(reply);

  // Show talking face
  matrix.loadFrame(talking);

  // Display response with scrolling
  displayScrollingText(reply, true);

  // Mark as processed in Firebase
  markAsProcessed(messageId);

  // Back to happy - idle animation will take over in main loop
  matrix.loadFrame(happy);
}

void markAsProcessed(String messageId) {
  Serial.print("Marking as processed: ");
  Serial.println(messageId);

  // Stop any existing connection
  if (client.connected()) {
    client.stop();
    delay(100);
  }

  if (!client.connect(firebaseHost, 443)) {
    Serial.println("Failed to connect to Firebase");
    client.stop();
    return;
  }

  String path = "/messages/" + messageId + "/processed.json";
  String data = "true";

  client.print("PUT ");
  client.print(path);
  client.println(" HTTP/1.1");
  client.print("Host: ");
  client.println(firebaseHost);
  client.println("Content-Type: application/json");
  client.print("Content-Length: ");
  client.println(data.length());
  client.println("Connection: close");
  client.println();
  client.print(data);

  delay(100);
  client.stop();

  Serial.println("Message marked as processed");
}

void showCustomAnimation() {
  // Clear both displays
  display.clearDisplay();  
  matrix.loadFrame(listening); // Keep listening face on LED matrix

  // Run through animation frames
  int totalFrames = FRAME_COUNT;
  for (int i = 0; i < totalFrames; i++) {
    display.clearDisplay();    
    // Draw animation frame centered on screen
    // Center the 32x32 animation: x = (128-32)/2 = 48, y = (64-32)/2 = 16
    display.drawBitmap(48, 16, frames[i], FRAME_WIDTH, FRAME_HEIGHT, WHITE);    
    display.display();
    delay(FRAME_DELAY);
  }
}

void showIdleAnimation() {
  static unsigned long lastIdleUpdate = 0;
  static int currentIdleFrame = 0;
  
  // Update animation frame if it's time
  if (millis() - lastIdleUpdate >= IDLE_FRAME_DELAY) {
    lastIdleUpdate = millis();
    
    // Clear display and draw animation frame centered
    display.clearDisplay();
    // Center the 48x48 animation: x = (128-48)/2 = 40, y = (64-48)/2 = 8
    display.drawBitmap(40, 8, idleFrames[currentIdleFrame], 48, 48, WHITE);
    

    
    display.display();
    
    // Move to next frame
    currentIdleFrame = (currentIdleFrame + 1) % IDLE_FRAME_COUNT;
  }
}

String askGPT(String question) {
  // Stop any existing connection
  if (client.connected()) {
    client.stop();
    delay(100);
  }

  if (!client.connect("api.openai.com", 443)) {
    client.stop();
    return "Offline. Check WiFi signal.";
  }

  // Escape quotes
  question.replace("\"", "\\\"");

  // Personality system message - optimized for wrist display utility
  String systemMsg = "You are Toby, a brilliant AI assistant on Istiqlal's wrist. Rules: "
    "1) MAX 2-3 sentences - tiny screen! "
    "2) Math/conversions: show answer + formula. "
    "3) Tasks: numbered steps. "
    "4) Decisions: give ONE clear recommendation. "
    "5) Facts: most useful info first. "
    "6) Code: shortest working snippet. "
    "7) Health: actionable tip. "
    "You're friendly, smart, and witty. No fluff - every word earns its pixel.";
  // Build JSON with personality
  String json = "{\"model\":\"gpt-4o-mini\",\"messages\":[";
  json += "{\"role\":\"system\",\"content\":\"" + systemMsg + "\"},";
  json += "{\"role\":\"user\",\"content\":\"" + question + "\"}";
  json += "],\"max_tokens\":" + String(MAX_TOKENS) + ",\"temperature\":" + String(TEMPERATURE) + "}";

  // Send request
  client.println("POST /v1/chat/completions HTTP/1.1");
  client.println("Host: api.openai.com");
  client.println("Content-Type: application/json");
  client.print("Authorization: Bearer ");
  client.println(apiKey);
  client.print("Content-Length: ");
  client.println(json.length());
  client.println();
  client.print(json);

  // Wait for response
  unsigned long timeout = millis();
  while (!client.available()) {
    if (millis() - timeout > 15000) {
      client.stop();
      return "Timeout. Try again.";
    }
  }

  // Skip headers
  while (client.connected()) {
    String line = client.readStringUntil('\n');
    if (line == "\r") break;
  }

  // Read response
  String response = "";
  while (client.available()) {
    response += (char)client.read();
  }
  client.stop();

  // Remove chunk markers
  int start = response.indexOf('{');
  int end = response.lastIndexOf('}');
  if (start >= 0 && end > start) {
    response = response.substring(start, end + 1);
  }

  // Parse JSON
  DynamicJsonDocument doc(4096);
  deserializeJson(doc, response);

  // Get answer
  const char* answer = doc["choices"][0]["message"]["content"];

  if (answer) {
    return String(answer);
  } else {
    return "Error. Retry your question.";
  }
}

void displayScrollingText(String text, bool animate) {
  display.clearDisplay();

  int cursorY = 0;
  int cursorX = 0;
  String currentWord = "";
  int scrollOffset = 0;

  // Split into words
  String words[100];
  int wordCount = 0;

  for (unsigned int i = 0; i < text.length(); i++) {
    char c = text.charAt(i);
    if (c == ' ' || i == text.length() - 1) {
      if (i == text.length() - 1 && c != ' ') {
        currentWord += c;
      }
      if (currentWord.length() > 0) {
        words[wordCount++] = currentWord;
        currentWord = "";
      }
    } else {
      currentWord += c;
    }
  }

  // Render with scrolling
  cursorX = 0;
  cursorY = 0;

  for (int i = 0; i < wordCount; i++) {
    String word = words[i];
    int wordWidth = word.length() * 6;

    // Check if need to wrap
    if (cursorX + wordWidth > SCREEN_WIDTH && cursorX > 0) {
      cursorY += 10;
      cursorX = 0;
    }

    // Check if need to scroll
    if (cursorY - scrollOffset > SCREEN_HEIGHT - 10) {
      scrollOffset += 10;
      display.clearDisplay();

      // Redraw previous content with offset
      int tempY = 0;
      int tempX = 0;
      for (int j = 0; j < i; j++) {
        String prevWord = words[j];
        int prevWidth = prevWord.length() * 6;

        if (tempX + prevWidth > SCREEN_WIDTH && tempX > 0) {
          tempY += 10;
          tempX = 0;
        }

        if (tempY - scrollOffset >= 0 && tempY - scrollOffset < SCREEN_HEIGHT) {
          display.setCursor(tempX, tempY - scrollOffset);
          display.print(prevWord);
          display.print(" ");
        }

        tempX += prevWidth + 6;
      }
    }

    // Draw word character by character
    for (unsigned int j = 0; j < word.length(); j++) {
      display.setCursor(cursorX, cursorY - scrollOffset);
      display.print(word.charAt(j));
      display.display();
      cursorX += 6;

      if (animate) {
        delay(35); // Typing speed
      }
    }

    // Add space
    display.setCursor(cursorX, cursorY - scrollOffset);
    display.print(" ");
    display.display();
    cursorX += 6;
  }
}