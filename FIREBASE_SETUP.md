# Firebase Setup Guide for Aria

This guide will help you set up Firebase Realtime Database to enable public access to your Aria watch assistant.

## Why Firebase?

- **Public Access**: Anyone can send messages from anywhere
- **Secure**: PIN-protected access
- **Real-time**: Messages appear instantly
- **Free**: Generous free tier
- **Reliable**: Google infrastructure

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Add project" or "Create a project"
   - Project name: `aria-watch-assistant` (or your choice)
   - Click "Continue"

3. **Google Analytics** (Optional)
   - Enable or disable Google Analytics (your choice)
   - Click "Create project"
   - Wait for project creation (~30 seconds)

## Step 2: Set Up Realtime Database

1. **Navigate to Database**
   - In the left sidebar, click "Build" → "Realtime Database"
   - Click "Create Database"

2. **Choose Location**
   - Select a location close to you (e.g., `us-central1`)
   - Click "Next"

3. **Security Rules** (IMPORTANT)
   - Select "Start in **test mode**"
   - Click "Enable"

4. **Note Your Database URL**
   - You'll see a URL like: `https://aria-watch-assistant-default-rtdb.firebaseio.com/`
   - **Copy this URL** - you'll need it later

## Step 3: Configure Security Rules

1. **Go to Rules Tab**
   - In Realtime Database, click the "Rules" tab

2. **Update Rules**
   Replace the existing rules with:

```json
{
  "rules": {
    "messages": {
      ".read": true,
      ".write": true,
      "$messageId": {
        ".validate": "newData.hasChildren(['text', 'timestamp', 'processed'])"
      }
    },
    "responses": {
      ".read": true,
      ".write": true
    }
  }
}
```

3. **Publish Rules**
   - Click "Publish"
   - Confirm the warning (we're using PIN protection in the app)

## Step 4: Get Your Configuration

You'll need these values:

### Firebase Database URL
From the "Data" tab, copy the URL at the top:
```
https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com/
```

### Example Configuration Values

```
Firebase URL: https://aria-watch-assistant-default-rtdb.firebaseio.com/
PIN Code: 1234
```

## Step 5: Update Your Files

### Update `sketch_nov16b/config.h`

Add these lines to your config.h:

```cpp
// Firebase Configuration
#define FIREBASE_HOST "aria-watch-assistant-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH ""  // Leave empty for test mode
#define ACCESS_PIN "1234"
```

### Full config.h example:

```cpp
#ifndef CONFIG_H
#define CONFIG_H

// WiFi Credentials
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"

// OpenAI API Configuration
#define OPENAI_API_KEY "sk-your-api-key-here"

// Firebase Configuration
#define FIREBASE_HOST "aria-watch-assistant-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH ""
#define ACCESS_PIN "1234"

// Optional: Custom settings
#define MAX_TOKENS 80
#define TEMPERATURE 0.9

#endif
```

## Step 6: Test Your Setup

### Test Database Access

1. Go to Firebase Console → Realtime Database
2. Click on "Data" tab
3. Try manually adding data:
   - Click the + icon next to your database URL
   - Name: `test`
   - Value: `hello`
   - Click "Add"

If successful, you should see the data appear in the database viewer.

### Test from Browser

Open in your browser:
```
https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com/test.json
```

You should see:
```json
"hello"
```

## How It Works

### Message Flow

```
1. User opens Vercel web app
2. User enters PIN (1234)
3. User types message
4. Web app → Firebase: Stores message
5. Arduino polls Firebase every 5 seconds
6. Arduino finds new message
7. Arduino → OpenAI: Gets response
8. Arduino displays response on OLED
9. Arduino marks message as processed
```

### Database Structure

```json
{
  "messages": {
    "msg_1234567890": {
      "text": "Hello Aria!",
      "timestamp": 1234567890,
      "processed": false,
      "pin": "1234"
    }
  }
}
```

## Security Considerations

### PIN Protection
- PIN is checked client-side (basic protection)
- For better security, use Firebase Authentication
- Consider changing the PIN regularly

### Database Rules
- Current rules allow public read/write (required for simplicity)
- For production, implement Firebase Auth
- Monitor usage in Firebase Console

### Rate Limiting
- Arduino polls every 5 seconds (not aggressive)
- Consider implementing rate limiting in the future
- Monitor Firebase usage quota

## Troubleshooting

### "Permission Denied" Error

**Cause:** Security rules too restrictive

**Solution:**
1. Go to Firebase Console → Realtime Database → Rules
2. Verify rules allow read/write to "messages"
3. Publish rules

### Arduino Can't Connect

**Cause:** Wrong Firebase URL or network issue

**Solution:**
1. Check `FIREBASE_HOST` in config.h (no https://, no trailing /)
2. Test URL in browser: `https://YOUR-HOST/messages.json`
3. Verify Arduino has internet access

### Messages Not Appearing

**Cause:** Database path mismatch

**Solution:**
1. Check Firebase Console → Data tab
2. Verify "messages" node exists
3. Check Arduino Serial Monitor for errors

## Cost & Limits

### Firebase Free Tier (Spark Plan)

- **Realtime Database Storage:** 1 GB
- **Simultaneous Connections:** 100
- **GB Downloaded:** 10 GB/month

### Estimated Usage

- Each message: ~200 bytes
- 1000 messages/day = ~0.2 MB/day = ~6 MB/month
- **Well within free tier!**

### Monitoring Usage

1. Firebase Console → Usage and billing
2. Set up budget alerts
3. Enable usage notifications

## Upgrading Security (Optional)

### Use Firebase Authentication

For better security, implement Firebase Auth:

1. Enable Email/Password authentication
2. Create user accounts
3. Update security rules to require auth
4. Update web interface to use Firebase Auth

### Environment Variables

Instead of hardcoding PIN:

1. Use Firebase Remote Config
2. Store PIN server-side
3. Validate PIN server-side

## Next Steps

After completing this setup:

1. ✅ Update `sketch_nov16b/config.h` with Firebase settings
2. ✅ Upload new sketch to Arduino
3. ✅ Update web interface (automated in next steps)
4. ✅ Deploy to Vercel
5. ✅ Test end-to-end

## Support Resources

- **Firebase Documentation:** https://firebase.google.com/docs/database
- **Firebase Console:** https://console.firebase.google.com/
- **Community:** https://firebase.google.com/support

---

**Ready for the next step?** Once you've completed this Firebase setup, we'll update the Arduino sketch and web interface!
