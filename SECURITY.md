# Security Guide

## URGENT: Exposed Credentials

**CRITICAL ACTION REQUIRED:** The OpenAI API key previously hardcoded in this repository has been exposed and must be rotated immediately.

### Immediate Steps:

1. **Rotate OpenAI API Key**
   - Visit https://platform.openai.com/api-keys
   - Revoke the old key: `sk-proj-d0h4SCASwLTV...`
   - Generate a new API key
   - Update `sketch_nov16b/config.h` with the new key

2. **Update WiFi Password**
   - If this code was pushed to a public repository, consider changing your WiFi password
   - Update `sketch_nov16b/config.h` with new credentials

3. **Verify Git History**
   ```bash
   # Check if sensitive data was committed
   git log --all --full-history -- "*config.h"

   # If you need to remove sensitive data from git history:
   # WARNING: This rewrites history and requires force push
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch sketch_nov16b/config.h" \
     --prune-empty --tag-name-filter cat -- --all
   ```

## Configuration Setup

### First Time Setup

1. **Copy the template file:**
   ```bash
   cd sketch_nov16b
   cp config.h.example config.h
   ```

2. **Edit config.h with your credentials:**
   ```cpp
   #define WIFI_SSID "your-wifi-network"
   #define WIFI_PASSWORD "your-wifi-password"
   #define OPENAI_API_KEY "sk-your-new-api-key"
   ```

3. **Verify .gitignore is working:**
   ```bash
   git status
   # config.h should NOT appear in the list
   ```

### What's Protected

The `.gitignore` file prevents these sensitive files from being committed:
- `sketch_nov16b/config.h` - Your actual credentials
- Build artifacts (`.elf`, `.hex`, etc.)
- Environment files (`.env`)
- Private keys (`.pem`, `.key`)

### What's Safe to Commit

- `sketch_nov16b/config.h.example` - Template with placeholder values
- `sketch_nov16b/sketch_nov16b.ino` - Main code (now uses config.h)
- `.gitignore` - File exclusion rules
- `SECURITY.md` - This file

## Best Practices

### API Key Security

1. **Use environment-specific keys**
   - Development key for testing
   - Production key for deployed devices
   - Set spending limits in OpenAI dashboard

2. **Monitor API usage**
   - Check https://platform.openai.com/usage regularly
   - Set up usage alerts
   - Review suspicious activity

3. **Key rotation schedule**
   - Rotate keys every 90 days
   - Rotate immediately if exposure is suspected
   - Keep a key rotation log

### WiFi Security

1. **Network isolation**
   - Consider using a guest network for IoT devices
   - Enable WPA3 if available
   - Use strong, unique passwords

2. **Device security**
   - Change default Arduino passwords
   - Keep firmware updated
   - Monitor connected devices

### Code Security

1. **Never commit secrets**
   - Always use config files
   - Review commits before pushing: `git diff --cached`
   - Use pre-commit hooks to scan for secrets

2. **Input validation**
   - The current code has basic URL decoding
   - Consider adding rate limiting
   - Validate user input length

3. **HTTPS/SSL**
   - The code uses WiFiSSLClient for OpenAI (good!)
   - Consider adding SSL to the web server
   - Validate SSL certificates

## Incident Response

### If Credentials Are Exposed:

1. **Immediate containment**
   - Revoke compromised keys immediately
   - Change WiFi password
   - Disconnect device from network

2. **Assess impact**
   - Check OpenAI usage logs
   - Review router logs for unauthorized access
   - Check for unauthorized API calls

3. **Remediation**
   - Generate new credentials
   - Update all devices
   - Review and improve security practices

4. **Documentation**
   - Document what was exposed
   - Record timeline of events
   - Update security procedures

## Additional Resources

- [OpenAI API Security Best Practices](https://platform.openai.com/docs/guides/safety-best-practices)
- [Arduino Security Guide](https://docs.arduino.cc/learn/programming/security)
- [Git Secret Scanning Tools](https://github.com/trufflesecurity/trufflehog)

## Questions?

If you discover a security vulnerability, please:
1. Do NOT create a public issue
2. Rotate compromised credentials immediately
3. Document the vulnerability privately
4. Implement fixes before disclosure
