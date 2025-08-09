# 🚀 Quick Installation Guide - Zolory Discord Bot

## Prerequisites Check ✅
- [ ] Node.js 16+ installed (`node --version`)
- [ ] Discord account with server admin permissions
- [ ] 5 minutes of setup time

## 1. Get Your Discord Bot Token 🔑

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" → Name it "Zolory"
3. Go to "Bot" section → Click "Add Bot"
4. Copy the **Token** (keep this secret!)
5. Enable these intents:
   - ✅ Message Content Intent
   - ✅ Server Members Intent

## 2. Install the Bot 📦

```bash
# Clone or download this project
cd zolory-discord-bot

# Run the easy installer
./start.sh
```

**Or manually:**
```bash
npm install
cp .env.example .env
# Edit .env with your token
node bot.js
```

## 3. Add to Your Server 🎯

1. In Discord Developer Portal → "OAuth2" → "URL Generator"
2. Select scopes: `bot`, `applications.commands`
3. Select permissions:
   - ✅ Send Messages
   - ✅ Use Slash Commands  
   - ✅ Add Reactions
   - ✅ Embed Links
   - ✅ Read Message History
   - ✅ Moderate Members
   - ✅ Manage Messages
4. Copy the generated URL and open it
5. Select your server and authorize

## 4. Test It Out 🎮

In your Discord server, try:
- `@Zolory what's good?`
- `@Zolory let's play tic tac toe`
- `@Zolory help me code`

## Troubleshooting 🔧

**Bot not responding?**
- Check console for errors
- Verify token in `.env` file
- Make sure bot has permissions

**"Brain lagging" messages?**
- Gemini API key is built-in, should work automatically
- Check internet connection

**Need help?** Contact Zap (Discord ID: 1219957467690172517)

---
🔥 **That's it! Zolory should now be vibing in your server!** 🔥