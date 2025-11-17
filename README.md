# Aria - AI Smartwatch Assistant

An Arduino-based IoT smartwatch that integrates OpenAI's GPT API with Firebase to create an AI-powered wearable companion with cloud messaging capabilities.

## Features

- **AI Assistant Integration** - Powered by OpenAI GPT-4o-mini
- **OLED Display** - 128x64 scrolling text with typewriter animation
- **LED Matrix Emotions** - Visual feedback (happy, thinking, talking, listening, excited, sleeping)
- **Cloud Messaging** - Firebase Realtime Database for remote message delivery
- **WiFi Web Interface** - Control via browser on local network or cloud
- **Custom Personality** - "Aria" - Islamic AI assistant from Kashmir
- **Real-time Responses** - Animated loading states and visual feedback
- **PIN Authentication** - Secure access to cloud interface

## Quick Start

**TL;DR - Get Started in 5 Steps:**

1. **Firebase:** Create project at [firebase.google.com](https://firebase.google.com) → Enable Realtime Database
2. **Arduino:** Install libraries → Configure `config.h` → Upload sketch
3. **Web Interface:** Edit `aria/index.html` with your Firebase URL and PIN
4. **Deploy:** Run `vercel` in the `aria/` folder
5. **Use:** Open Vercel URL → Enter PIN → Send messages to your watch!

## Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Hardware Requirements](#hardware-requirements)
- [Firebase Setup](#firebase-setup)
- [Arduino Setup](#arduino-setup)
- [Web Interface Setup](#web-interface-setup)
- [Vercel Deployment](#vercel-deployment)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)
- [Cost Considerations](#cost-considerations)
- [Future Enhancements](#future-enhancements)

## Prerequisites

Before you begin, ensure you have:

- **Hardware:**
  - Arduino board with WiFi capability (WiFiS3 compatible)
  - 128x64 OLED display (SSD1306)
  - Arduino LED Matrix
  - USB cable for programming

- **Software:**
  - [Arduino IDE](https://www.arduino.cc/en/software) (version 1.8+ or 2.0+)
  - [Node.js](https://nodejs.org/) (for local development, optional)
  - [Git](https://git-scm.com/) (for version control)
  - [Vercel Account](https://vercel.com/) (free tier works)
  - [Firebase Account](https://firebase.google.com/) (free tier works)

- **API Keys:**
  - OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
  - Firebase project credentials (created in setup below)

## Hardware Requirements

### Components

- **Arduino Board:** Arduino Uno R4 WiFi or similar (WiFiS3 compatible)
- **OLED Display:** 128x64 I2C SSD1306
- **LED Matrix:** Arduino LED Matrix (built-in on some boards)
- **Connections:** I2C (SDA/SCL) for display

### Wiring Diagram

```
Arduino         OLED Display (I2C)
--------        ------------------
3.3V     --->   VCC
GND      --->   GND
SDA      --->   SDA
SCL      --->   SCL
```

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name (e.g., `aria-watch`) and click **Continue**
4. Disable Google Analytics (optional) and click **Create project**
5. Wait for project creation to complete

### Step 2: Setup Realtime Database

1. In Firebase Console, click **"Realtime Database"** in the left sidebar
2. Click **"Create Database"**
3. Select location closest to you
4. Choose **"Start in test mode"** (for development)
5. Click **"Enable"**

### Step 3: Configure Database Rules

1. In Realtime Database, go to **"Rules"** tab
2. Replace the rules with:

```json
  {
    "rules": {
      ".read": true,
      ".write": true,
      "messages": {
        ".indexOn": ["processed", "timestamp"]
      }
    }
  }
```

3. Click **"Publish"**

**Security Note:** These rules allow public read/write for development. For production, implement proper authentication.

### Step 4: Get Firebase URL

1. In Realtime Database, find your database URL at the top
2. It looks like: `https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com`
3. Copy the domain part: `YOUR-PROJECT-ID-default-rtdb.firebaseio.com`
4. You'll need this for the web interface

## Arduino Setup

### Step 1: Install Arduino Libraries

1. Open Arduino IDE
2. Go to **Tools > Manage Libraries**
3. Install the following libraries:
   - `WiFiS3` (for Arduino WiFi)
   - `ArduinoJson` (by Benoit Blanchon)
   - `Adafruit GFX Library`
   - `Adafruit SSD1306`

### Step 2: Clone Repository

```bash
git clone https://github.com/IstiqlalBhat/Arduino.git
cd Arduino
```

### Step 3: Configure Credentials

1. Navigate to the Arduino sketch folder:
```bash
cd sketch_nov16b
```

2. Create `config.h` from the example:
```bash
cp config.h.example config.h
```

3. Edit `config.h` with your credentials:
```cpp
#define WIFI_SSID "your-wifi-network"
#define WIFI_PASSWORD "your-wifi-password"
#define OPENAI_API_KEY "sk-your-openai-api-key"
```

Replace:
- `your-wifi-network` - Your WiFi network name
- `your-wifi-password` - Your WiFi password
- `sk-your-openai-api-key` - Your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)

### Step 4: Upload to Arduino

1. Connect Arduino to your computer via USB
2. Open `sketch_nov16b/sketch_nov16b.ino` in Arduino IDE
3. Select your board: **Tools > Board > Arduino Uno R4 WiFi** (or your board)
4. Select port: **Tools > Port > COM3** (or your port)
5. Click **Upload** button (→)
6. Wait for upload to complete

### Step 5: Verify Connection

1. Open **Serial Monitor** (Tools > Serial Monitor)
2. Set baud rate to **115200**
3. You should see:
```
Connecting to WiFi...
WiFi connected!
IP address: 192.168.1.xxx
Server started on port 80
```

4. Note the IP address - you'll use this to access the local interface

## Web Interface Setup

### Step 1: Configure Firebase URL

1. Navigate to the web interface folder:
```bash
cd aria
```

2. Open `index.html` in a text editor

3. Find this line (around line 297):
```javascript
const firebaseUrl = 'aria-58e32-default-rtdb.firebaseio.com';
```

4. Replace with your Firebase URL from [Firebase Setup Step 4](#step-4-get-firebase-url):
```javascript
const firebaseUrl = 'YOUR-PROJECT-ID-default-rtdb.firebaseio.com';
```

### Step 2: Set Your PIN

1. In the same `index.html` file, find this line (around line 340):
```javascript
if (pinInput !== '6005') {
```

2. Change `6005` to your own 4-digit PIN:
```javascript
if (pinInput !== '1234') {  // Your custom PIN
```

### Step 3: Test Locally (Optional)

You can test the web interface locally:

```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx http-server -p 8000
```

Then open http://localhost:8000 in your browser.

## Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate.

### Step 3: Deploy

1. Navigate to the `aria` folder:
```bash
cd aria
```

2. Deploy to Vercel:
```bash
vercel
```

3. Answer the prompts:
   - **Set up and deploy?** → Yes
   - **Which scope?** → Your account
   - **Link to existing project?** → No
   - **Project name?** → `aria-watch-assistant` (or your choice)
   - **Directory?** → `./` (current directory)
   - **Override settings?** → No

4. Vercel will provide a deployment URL like:
```
https://aria-watch-assistant-xxxxx.vercel.app
```

### Step 4: Production Deployment

For production deployment:

```bash
vercel --prod
```

This creates a stable production URL.

### Step 5: Custom Domain (Optional)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings > Domains**
4. Add your custom domain and follow DNS configuration steps

### Alternative: Deploy via Vercel Dashboard (No CLI)

If you prefer not to use the command line:

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Paste your GitHub repo URL: `https://github.com/IstiqlalBhat/Arduino`
4. Configure project:
   - **Framework Preset:** Other
   - **Root Directory:** `aria`
   - **Build Command:** (leave empty)
   - **Output Directory:** `./`
5. Click **"Deploy"**
6. Wait for deployment to complete
7. Visit your new deployment URL!

**Note:** Make sure you've already pushed your Firebase URL and PIN changes to GitHub before deploying.

## Usage

### Option 1: Cloud Web Interface (Recommended) 🌐

1. Open your Vercel deployment URL in any browser
2. Enter your 4-digit PIN
3. Click **"Connect"**
4. Type your message and click **"Send to Watch"**
5. The message will appear on the Arduino OLED display!

**Benefits:**
- Access from anywhere in the world
- No need to be on same WiFi network
- Secure PIN authentication

### Option 2: Local Web Interface

1. Ensure Arduino is connected to WiFi
2. Open Serial Monitor to find Arduino's IP address
3. Navigate to `http://192.168.1.xxx` (your Arduino's IP)
4. Type your message and click **"Ask"**
5. Response appears on OLED display

**Note:** You must be on the same WiFi network as the Arduino.

### Visual Feedback

The LED matrix displays different emotions:
- 😴 **Sleeping** - Device idle
- 🎉 **Excited** - Connected and ready
- 😊 **Happy** - Default state
- 👂 **Listening** - Receiving your message
- ⏳ **Loading** - Waiting for GPT response
- 💬 **Talking** - Displaying response

### How It Works

1. **User sends message** via web interface
2. **Message stored** in Firebase Realtime Database
3. **Arduino polls Firebase** every few seconds
4. **Arduino retrieves message** and sends to OpenAI API
5. **OpenAI responds** with AI-generated reply
6. **Arduino displays** response on OLED with animations
7. **LED matrix shows** corresponding emotions

## Security

**IMPORTANT:** Read [SECURITY.md](SECURITY.md) before using this project.



## Project Structure

```
Arduino/
├── README.md                    # Complete setup guide (this file)
├── .gitignore                   # Git exclusions
├── sketch_nov16b/               # Arduino firmware
│   ├── sketch_nov16b.ino       # Main Arduino sketch with GPT integration
│   ├── config.h                # Your credentials (git-ignored, create from example)
│   └── config.h.example        # Template for WiFi & OpenAI credentials
└── aria/                        # Web interface for cloud deployment
    ├── index.html              # Firebase-powered web interface
    └── vercel.json             # Vercel deployment configuration
```

### Architecture Diagram

```
┌─────────────────┐
│   User Browser  │
│  (Anywhere!)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Vercel Web App  │◄─── Deploy with: vercel --prod
│ (aria/index.html)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Firebase     │
│ Realtime DB     │◄─── Messages stored here
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Arduino WiFi  │
│   (Polling)     │◄─── Checks Firebase every few seconds
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI GPT API │◄─── Processes message
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OLED Display   │◄─── Shows response with animations
│  + LED Matrix   │
└─────────────────┘
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

### Arduino Issues

#### WiFi Connection Failed
- **Solution:** Verify SSID and password in `config.h`
- Check WiFi signal strength (Arduino must be close to router)
- Ensure 2.4GHz network (Arduino doesn't support 5GHz)
- Restart Arduino and check Serial Monitor

#### API Timeout
- **Solution:** Check internet connection
- Verify OpenAI API key is valid and active
- Check OpenAI service status at [status.openai.com](https://status.openai.com)
- Increase timeout values in code if needed

#### Display Not Working
- **Solution:** Verify I2C address (default: 0x3C)
- Check wiring connections (SDA/SCL)
- Test display with example sketch from Adafruit
- Try running I2C scanner sketch to detect address

#### Serial Monitor Shows Gibberish
- **Solution:** Set baud rate to **115200**
- Check USB connection
- Try different USB port or cable
- Restart Arduino IDE

### Firebase Issues

#### Cannot Connect to Firebase
- **Solution:** Verify Firebase URL in `aria/index.html`
- Check Firebase Realtime Database is enabled
- Ensure database rules allow read/write access
- Test Firebase URL in browser: `https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com/.json`

#### Messages Not Appearing on Watch
- **Solution:** Check Arduino is polling Firebase (check Serial Monitor logs)
- Verify Firebase URL in Arduino code matches your project
- Ensure Arduino has internet connection
- Check Firebase console to see if messages are being written

#### PIN Authentication Failed
- **Solution:** Verify PIN in `aria/index.html` line 340
- Clear browser cache and localStorage
- Try incognito/private browsing mode
- Check browser console for errors (F12)

### Vercel Deployment Issues

#### Build Failed
- **Solution:** Ensure `vercel.json` exists in `aria/` folder
- Check `vercel.json` syntax is valid
- Verify `index.html` has no syntax errors
- Try deploying from Vercel dashboard instead of CLI

#### Site Not Loading
- **Solution:** Wait 1-2 minutes after deployment
- Clear browser cache
- Check Vercel deployment logs for errors
- Verify DNS settings if using custom domain

#### CORS Errors
- **Solution:** Firebase should allow all origins by default
- Check browser console for specific CORS error
- Verify Firebase database rules are published
- Try accessing from different network/browser

### General Issues

#### High API Costs
- **Solution:** Set spending limits in OpenAI dashboard
- Reduce `MAX_TOKENS` in `config.h`
- Implement rate limiting in code
- Monitor usage at [platform.openai.com/usage](https://platform.openai.com/usage)

#### Slow Response Times
- **Solution:** Check internet connection speed
- Reduce `MAX_TOKENS` for faster responses
- Lower `TEMPERATURE` setting for deterministic responses
- Consider upgrading WiFi router if signal is weak

#### Device Crashes/Resets
- **Solution:** Check power supply (Arduino needs stable 5V)
- Reduce JSON buffer size if memory issues
- Add delays between API calls
- Monitor Serial Monitor for error messages before crash

## Cost Considerations

### OpenAI API Pricing

GPT-4o-mini API pricing (as of 2024):
- **Input:** ~$0.15 per 1M tokens
- **Output:** ~$0.60 per 1M tokens
- **Typical usage:** ~100 tokens per interaction (< $0.01 per query)

### Free Tier Limits

- **Firebase:** 1GB storage, 10GB/month download (plenty for this project)
- **Vercel:** Unlimited deployments, 100GB bandwidth/month
- **OpenAI:** Pay-as-you-go (set spending limits!)

### Recommendations

1. Set spending limits in [OpenAI dashboard](https://platform.openai.com/account/limits)
2. Monitor usage at [platform.openai.com/usage](https://platform.openai.com/usage)
3. Start with $5-10 monthly limit for testing
4. Typical monthly cost with moderate use: **$1-5**

## FAQ

### General Questions

**Q: Do I need to keep my computer on for this to work?**
A: No! Once you upload the code to Arduino and deploy to Vercel, the Arduino runs independently. Just keep it powered.

**Q: Can multiple people use my watch interface?**
A: Yes! Anyone with the PIN can send messages via your Vercel URL. The Arduino processes messages sequentially.

**Q: Does this work without WiFi?**
A: No, the Arduino needs WiFi for OpenAI API and Firebase access. Consider adding an offline mode with pre-programmed responses.

**Q: Can I use a different AI model?**
A: Yes! Edit the Arduino code to use GPT-4, GPT-3.5-turbo, or other OpenAI models. Just update the model name and adjust token limits.

### Firebase Questions

**Q: Why use Firebase instead of direct Arduino-to-web communication?**
A: Firebase allows:
- Access from anywhere (not just local network)
- Message queuing (Arduino polls when ready)
- Offline message storage
- No port forwarding or complex networking

**Q: Is my data secure on Firebase?**
A: The current setup uses open rules for development. For production, implement Firebase Authentication and secure rules.

**Q: Can I use Firestore instead of Realtime Database?**
A: Yes, but you'll need to modify the JavaScript code. Realtime Database is simpler for this use case.

### Arduino Questions

**Q: Which Arduino boards are compatible?**
A: Any Arduino with WiFi capability:
- Arduino Uno R4 WiFi (recommended)
- Arduino MKR WiFi 1010
- ESP32-based Arduino boards
- Arduino Nano 33 IoT

**Q: Can I add more features like voice or buttons?**
A: Absolutely! The code is modular. See [Future Enhancements](#future-enhancements) for ideas.

**Q: How often does Arduino check for new messages?**
A: By default, every 5 seconds. You can adjust this in the code to balance responsiveness vs. API calls.

### Deployment Questions

**Q: Can I deploy to platforms other than Vercel?**
A: Yes! Try:
- **Netlify:** Similar to Vercel
- **GitHub Pages:** Free static hosting
- **Firebase Hosting:** Keep everything in Firebase ecosystem

**Q: Do I need a custom domain?**
A: No, Vercel provides a free `.vercel.app` subdomain that works great.

**Q: Can I run the web interface locally only?**
A: Yes! Skip the Vercel deployment and just open `aria/index.html` directly or use `python -m http.server`.

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

## Contributing

This is currently a personal project, but suggestions and improvements are welcome!

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Ideas for Contributions

- Add support for more AI models (Claude, Llama, etc.)
- Implement voice recognition
- Create mobile companion app
- Add multi-language support
- Improve security with proper Firebase authentication
- Add data visualization dashboard

## Support

For issues or questions:
1. Check [FAQ](#faq) section above
2. Review [Troubleshooting](#troubleshooting) section
3. Check Arduino Serial Monitor output (115200 baud)
4. Verify all hardware connections
5. Open an issue on GitHub with:
   - Description of the problem
   - Serial Monitor output
   - Steps you've already tried

## What's Next?

Once you have everything set up and working:

1. **Customize the Personality** - Edit the AI system prompt in the Arduino code to make it your own
2. **Adjust Response Length** - Modify `MAX_TOKENS` to control how long responses are
3. **Add More Emotions** - Create new LED matrix patterns for different states
4. **Implement Wake Words** - Add a button or voice trigger to activate the assistant
5. **Build a Case** - 3D print or craft a custom enclosure for your smartwatch
6. **Share Your Build** - Post photos and improvements to inspire others!

## Acknowledgments

- **OpenAI** - For the GPT API that powers Aria's intelligence
- **Firebase** - For reliable cloud messaging infrastructure
- **Vercel** - For seamless deployment and hosting
- **Adafruit** - For excellent Arduino libraries and hardware
- **Arduino Community** - For inspiration and support

---

**Built with love from Clemson** 🚀

**Project by:** [Istiqlal Bhat](https://github.com/IstiqlalBhat)
**Institution:** Clemson University
**Program:** Master's in Computer Science
**Expected Graduation:** December 2025

*If you find this project helpful, please consider giving it a ⭐ on GitHub!*
