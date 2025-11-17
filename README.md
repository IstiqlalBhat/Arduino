# Aria - AI Smartwatch Assistant

An Arduino-based IoT smartwatch that integrates OpenAI's GPT API to create an AI-powered wearable companion with personality.

## Features

- **AI Assistant Integration** - Powered by OpenAI GPT-4o-mini
- **OLED Display** - 128x64 scrolling text with typewriter animation
- **LED Matrix Emotions** - Visual feedback (happy, thinking, talking, listening, excited, sleeping)
- **WiFi Web Interface** - Control via browser on local network
- **Custom Personality** - "Aria" - Islamic AI assistant from Kashmir
- **Real-time Responses** - Animated loading states and visual feedback

## Hardware Requirements

- Arduino board with WiFi capability (WiFiS3 compatible)
- 128x64 OLED display (SSD1306)
- Arduino LED Matrix
- I2C connection for display

## Software Dependencies

Required Arduino libraries:
```cpp
#include <WiFiS3.h>
#include <WiFiSSLClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "Arduino_LED_Matrix.h"
```

## Setup Instructions

### 1. Configure Credentials

```bash
cd sketch_nov16b
cp config.h.example config.h
```

Edit `config.h` with your credentials:
```cpp
#define WIFI_SSID "your-wifi-network"
#define WIFI_PASSWORD "your-wifi-password"
#define OPENAI_API_KEY "sk-your-openai-api-key"
```

### 2. Install Dependencies

Open Arduino IDE and install required libraries:
- WiFiS3
- ArduinoJson
- Adafruit GFX Library
- Adafruit SSD1306

### 3. Upload to Arduino

1. Open `sketch_nov16b/sketch_nov16b.ino` in Arduino IDE
2. Select your board and port
3. Click Upload
4. Monitor serial output for WiFi connection and IP address

### 4. Access Web Interface

1. Open Serial Monitor (115200 baud)
2. Note the IP address shown (e.g., `http://192.168.1.xxx`)
3. Open that URL in your browser
4. Start chatting with Aria!

## Usage

### Option 1: Vercel Web Interface (Recommended) 🌐

**Live URL:** https://aria-watch-assistant-gdpeel2pa-istiqlal1234-8053s-projects.vercel.app

1. Open the URL in any browser (works from anywhere!)
2. Enter your Arduino's local IP address (find it in Serial Monitor)
3. Click "Save & Test Connection"
4. Start chatting with Aria!

**Note:** You must be on the same WiFi network as your Arduino for communication to work.

See [aria/DEPLOYMENT.md](aria/DEPLOYMENT.md) for detailed deployment guide.

### Option 2: Local Web Interface

1. Navigate to the device's IP address in your browser (e.g., `http://192.168.1.100`)
2. Type your message in the input field
3. Click "Ask" or press Enter
4. Watch the OLED display for the response!

### Visual Feedback

The LED matrix displays different emotions:
- **Sleeping** - Device idle
- **Excited** - Connected and ready
- **Happy** - Default state
- **Listening** - Receiving your message
- **Loading** - Waiting for GPT response
- **Talking** - Displaying response

## Security

**IMPORTANT:** Read [SECURITY.md](SECURITY.md) before using this project.



## Project Structure

```
Arduino/
├── README.md                    # This file
├── SECURITY.md                  # Security guidelines
├── .gitignore                   # Git exclusions
├── sketch_nov16b/
│   ├── sketch_nov16b.ino       # Main Arduino sketch
│   ├── config.h                # Your credentials (git-ignored)
│   └── config.h.example        # Template for config.h
├── aria/
│   ├── index.html              # (Future web deployment)
│   └── vercel.json             # (Future web deployment)
├── index.html                   # (Root placeholder)
└── vercel.json                  # (Root placeholder)
```

## Customization

### Modify AI Personality

Edit the system message in `sketch_nov16b.ino:252`:
```cpp
String systemMsg = "You are Aria, ...";
```

### Adjust Response Length

Edit `config.h`:
```cpp
#define MAX_TOKENS 80        // Increase for longer responses
#define TEMPERATURE 0.9      // Adjust creativity (0.0-2.0)
```

### Add New Emotions

Define new LED matrix patterns:
```cpp
const uint32_t myEmotion[] = {
  0x19819,
  0x80000001,
  0x81f8000
};
```

## Troubleshooting

### WiFi Connection Failed
- Verify SSID and password in `config.h`
- Check WiFi signal strength
- Ensure 2.4GHz network (not 5GHz)

### API Timeout
- Check internet connection
- Verify API key is valid
- Check OpenAI service status

### Display Not Working
- Verify I2C address (default: 0x3C)
- Check wiring connections
- Test display with example sketch

### Serial Monitor Shows Gibberish
- Set baud rate to 115200
- Check USB connection
- Try different USB port

## Cost Considerations

GPT-4o-mini API pricing (as of 2024):
- Input: ~$0.15 per 1M tokens
- Output: ~$0.60 per 1M tokens

Typical usage: ~100 tokens per interaction (< $0.01 per query)

**Recommendation:** Set spending limits in OpenAI dashboard.

## Future Enhancements

- [ ] Add voice input via microphone
- [ ] Implement wake word detection
- [ ] Add multiple language support
- [ ] Create mobile companion app
- [ ] Add data logging and analytics
- [ ] Implement offline mode with cached responses
- [ ] Add reminder and notification features

## Credits

**Developer:** Istiqlal
**Project:** Personal AI Watch Assistant
**Institution:** Clemson University
**Degree:** Master's in Computer Science
**Specialization:** AI, Blockchain, Construction Tech
**Expected Graduation:** December 2025

## License

Personal project - All rights reserved.

## Support

For issues or questions:
1. Check [SECURITY.md](SECURITY.md) for security concerns
2. Review troubleshooting section above
3. Check Arduino serial monitor output
4. Verify all hardware connections

---

**Built with dedication from Kashmir to Clemson** 🚀
