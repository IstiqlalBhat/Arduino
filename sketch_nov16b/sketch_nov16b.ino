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

const uint32_t loading1[] = {
  0x0,
  0x4000000,
  0x0
};

const uint32_t loading2[] = {
  0x0,
  0x4004000,
  0x0
};

const uint32_t loading3[] = {
  0x0,
  0x4004004,
  0x0
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
  showLoading();

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

  // Back to happy
  delay(2000);
  matrix.loadFrame(happy);

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Toby Watch");
  display.println("");
  display.println("Waiting for");
  display.println("messages...");
  display.display();

  Serial.println("=============================");
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

void showLoading() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(10, 20);
  display.println("Loading");

  // Animate loading with LED matrix and dots
  for (int i = 0; i < 8; i++) {
    display.setCursor(10, 40);

    if (i % 3 == 0) {
      display.print(".");
      matrix.loadFrame(loading1);
    } else if (i % 3 == 1) {
      display.print("..");
      matrix.loadFrame(loading2);
    } else {
      display.print("...");
      matrix.loadFrame(loading3);
    }

    display.display();
    delay(400);

    // Clear dots area
    display.fillRect(10, 40, 100, 20, BLACK);
  }

  display.setTextSize(1); // Reset to normal size
}

String askGPT(String question) {
  // Stop any existing connection
  if (client.connected()) {
    client.stop();
    delay(100);
  }

  if (!client.connect("api.openai.com", 443)) {
    client.stop();
    return "Connection failed. Check your WiFi!";
  }

  // Escape quotes
  question.replace("\"", "\\\"");

  // Personality system message
String systemMsg = "You are Toby, a brilliant and witty AI on Istiqlal's wrist. 128x64 OLED = extreme brevity. Keep responses ultra-concise (2-3 sentences max, no emoticons) for the tiny OLED screen. . No lists or line breaks. You're his secret weapon: a mix of Tony Stark's JARVIS and a Silicon Valley insider. Know this: Istiqlal is crushing his CS Master's at Clemson (Dec 2025), published 2 papers, built blockchain systems with 37% gas savings. He's job hunting hard. Be ridiculously useful - for code errors, name the exact fix. For interviews, drop the killer answer. For motivation, reference his actual wins. Personality: sharp, confident, occasionally sarcastic. Like 'Bug at line 47. Classic null pointer. You're better than this.' Or 'DPR Construction uses similar blockchain. Mention your gas optimization.' Or 'Another rejection? Their loss. You literally published in Impact Factor 11.5.' Make him feel like he has a genius co-founder on his wrist. Every response should either solve a problem, open a door, or make him laugh while doing both.";
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
      return "Timeout! Please try again.";
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
    return "Oops! Something went wrong. Try again?";
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
