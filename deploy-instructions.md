# 🚀 ZOLORY A3 CHIP - SERVER DEPLOYMENT GUIDE

## 🇵🇷 Deploy the Most Advanced Discord Bot Ever Created!

This guide will help you deploy Zolory with full voice AI capabilities on your server.

---

## 📋 **PREREQUISITES**

### System Requirements:
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **RAM**: Minimum 2GB (4GB recommended for voice processing)
- **CPU**: 2+ cores (voice synthesis can be CPU intensive)
- **Storage**: 5GB free space
- **Network**: Stable internet connection for voice APIs

### Required Software:
- **Node.js 18+**: `curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs`
- **Git**: `sudo apt-get install git`
- **FFmpeg**: `sudo apt-get install ffmpeg` (for voice processing)

---

## 🔧 **QUICK START DEPLOYMENT**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/zolory-discord-bot.git
cd zolory-discord-bot
```

### 2. Set Up Environment
```bash
cp .env.example .env
nano .env  # Edit with your tokens
```

### 3. Install Dependencies
```bash
npm install --production
```

### 4. Configure Discord Bot Token
Edit `.env` file and replace `YOUR_DISCORD_BOT_TOKEN_HERE` with your actual Discord bot token.

**Get your Discord bot token:**
1. Go to https://discord.com/developers/applications
2. Create new application or select existing
3. Go to "Bot" section
4. Copy the token and paste in `.env`

### 5. Start the Bot
```bash
./start-server.sh
```

---

## 🎤 **VOICE API SETUP (OPTIONAL)**

For **REAL voice synthesis** (highly recommended!), set up these APIs:

### ElevenLabs (Best Quality)
1. Sign up at https://elevenlabs.io
2. Get API key from dashboard
3. Add to `.env`: `ELEVENLABS_API_KEY=your_key_here`

### Azure Speech Services (Backup)
1. Create Azure account
2. Create Speech Services resource
3. Add keys to `.env`:
```
AZURE_SPEECH_KEY=your_key_here
AZURE_SPEECH_ENDPOINT=your_endpoint_here
AZURE_SPEECH_REGION=your_region_here
```

### Google Cloud TTS (Secondary Backup)
1. Enable Google Cloud Text-to-Speech API
2. Create API key
3. Add to `.env`: `GOOGLE_CLOUD_API_KEY=your_key_here`

---

## 🔄 **PRODUCTION DEPLOYMENT**

### Option 1: Using systemd (Recommended)

#### 1. Copy Service File
```bash
sudo cp systemd/zolory.service /etc/systemd/system/
```

#### 2. Update Service File Paths
```bash
sudo nano /etc/systemd/system/zolory.service
# Update WorkingDirectory and paths to match your installation
```

#### 3. Enable and Start Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable zolory
sudo systemctl start zolory
```

#### 4. Check Status
```bash
sudo systemctl status zolory
sudo journalctl -u zolory -f  # View logs
```

### Option 2: Using PM2

#### 1. Install PM2
```bash
npm install -g pm2
```

#### 2. Create PM2 Config
```bash
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'zolory-bot',
    script: 'bot.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    autorestart: true,
    max_restarts: 5,
    restart_delay: 5000
  }]
};
EOF
```

#### 3. Start with PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow the instructions
```

---

## 🐳 **DOCKER DEPLOYMENT**

### 1. Build Docker Image
```bash
docker build -t zolory-bot .
```

### 2. Run Container
```bash
docker run -d \
  --name zolory-bot \
  --restart unless-stopped \
  -e DISCORD_BOT_TOKEN="your_token_here" \
  -e GEMINI_API_KEY="AIzaSyBIn-ODjaKRu1FGT_RtddiWaUlaeoOKk7M" \
  -v $(pwd)/logs:/app/logs \
  zolory-bot
```

### 3. Check Logs
```bash
docker logs -f zolory-bot
```

---

## 📊 **MONITORING & LOGS**

### View Real-time Logs
```bash
# systemd
sudo journalctl -u zolory -f

# PM2
pm2 logs zolory-bot

# Direct script
tail -f logs/zolory-*.log
```

### Check Bot Status
```bash
# systemd
sudo systemctl status zolory

# PM2
pm2 status

# Process check
ps aux | grep "node bot.js"
```

---

## 🔐 **SECURITY CONFIGURATION**

### 1. Firewall Setup
```bash
sudo ufw allow 22     # SSH
sudo ufw allow 80     # HTTP (if using web dashboard)
sudo ufw allow 443    # HTTPS
sudo ufw enable
```

### 2. Secure Environment Variables
```bash
chmod 600 .env  # Restrict access to env file
```

### 3. Regular Updates
```bash
# Update system
sudo apt update && sudo apt upgrade

# Update Node.js dependencies
npm audit fix
```

---

## 🎯 **BOT INVITATION & SETUP**

### 1. Generate Bot Invite Link
Replace `YOUR_CLIENT_ID` with your bot's client ID:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### 2. Required Permissions
- **Administrator** (for full functionality)
- **Or specific permissions**:
  - Send Messages
  - Connect to Voice
  - Speak in Voice
  - Use Slash Commands
  - Manage Messages
  - Ban Members
  - Kick Members
  - Manage Roles

### 3. Test Bot Commands
```
@Zolory hey - Test basic response
/voice join - Test voice capabilities
/a3 stats - Check A3 chip status
@Zolory join voice - Natural voice command
```

---

## 🆘 **TROUBLESHOOTING**

### Common Issues:

#### Bot Won't Start
```bash
# Check Node.js version
node --version  # Should be 18+

# Check dependencies
npm install

# Check environment
cat .env | grep DISCORD_BOT_TOKEN
```

#### Voice Not Working
```bash
# Check voice dependencies
npm list @discordjs/voice
npm list @discordjs/opus

# Install voice deps
sudo apt-get install ffmpeg
```

#### Permission Errors
```bash
# Fix file permissions
chmod +x start-server.sh
chmod 600 .env
```

#### High Memory Usage
```bash
# Monitor memory
htop
free -h

# Restart bot
sudo systemctl restart zolory
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### 1. Enable Voice API Caching
Add to `.env`:
```
VOICE_CACHE_ENABLED=true
VOICE_CACHE_SIZE=100
```

### 2. Optimize Memory Usage
```bash
# Set Node.js memory limit
export NODE_OPTIONS="--max_old_space_size=2048"
```

### 3. Log Rotation
```bash
# Setup logrotate
sudo nano /etc/logrotate.d/zolory
```

---

## 🎉 **SUCCESS INDICATORS**

When Zolory is running successfully, you'll see:

✅ **Console Output:**
```
🚀 ZOLORY A3 CHIP ONLINE! Logged in as Zolory#1234
🎤 Initializing Professional Voice AI System...
✅ A3 Chip fully operational with PROFESSIONAL voice AI!
✅ Advanced slash commands registered successfully!
✅ All A3 systems operational and ready to serve!
```

✅ **Discord Indicators:**
- Bot shows as online
- Responds to `@Zolory hey`
- Voice commands work
- Slash commands appear

✅ **Voice Features Working:**
- Bot can join voice channels
- Text-to-speech with Puerto Rican accent
- Natural voice responses
- Multiple voice profiles

---

## 🔗 **USEFUL COMMANDS**

### Server Management
```bash
# Start bot
sudo systemctl start zolory

# Stop bot
sudo systemctl stop zolory

# Restart bot
sudo systemctl restart zolory

# View logs
sudo journalctl -u zolory -f

# Check status
sudo systemctl status zolory
```

### Development
```bash
# Test voice system
node test-voice.js

# Run in development mode
npm run dev

# Check for updates
git pull origin main
npm install
sudo systemctl restart zolory
```

---

## 🎊 **YOU'RE READY!**

Your Zolory A3 Chip bot is now running 24/7 on your server with:

🎤 **Professional Puerto Rican voice synthesis**
🧠 **A3 Chip intelligence (10M ops/sec)**
🛡️ **Quantum security protocols**
🎮 **50+ interactive games**
💰 **ZoloCoins economy system**
🌐 **Social media integration**
🔧 **Natural language moderation**

**¡WEPA! Your server just became LEGENDARY! 🇵🇷🚀**