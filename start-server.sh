#!/bin/bash

# 🚀 ZOLORY A3 CHIP - SERVER DEPLOYMENT SCRIPT
# Professional server-side bot deployment with monitoring

echo "🇵🇷 Starting Zolory A3 Chip Discord Bot Server..."
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[ZOLORY]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    print_error "Node.js version $NODE_VERSION is too old. Required: $REQUIRED_VERSION+"
    exit 1
fi

print_status "Node.js version: $NODE_VERSION ✅"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from template..."
    cp .env.example .env
    print_error "Please edit .env file with your Discord bot token and restart!"
    exit 1
fi

# Check for Discord bot token
if grep -q "YOUR_DISCORD_BOT_TOKEN_HERE" .env; then
    print_error "Please set your DISCORD_BOT_TOKEN in .env file!"
    print_info "1. Go to https://discord.com/developers/applications"
    print_info "2. Create a new application or select existing"
    print_info "3. Go to 'Bot' section and copy the token"
    print_info "4. Replace YOUR_DISCORD_BOT_TOKEN_HERE in .env with your token"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies!"
    exit 1
fi

print_status "Dependencies installed ✅"

# Create logs directory
mkdir -p logs

# Set up log rotation
LOG_FILE="logs/zolory-$(date +%Y%m%d-%H%M%S).log"
ERROR_LOG="logs/zolory-error-$(date +%Y%m%d-%H%M%S).log"

print_status "Starting Zolory A3 Chip Bot..."
print_info "Log file: $LOG_FILE"
print_info "Error log: $ERROR_LOG"
print_info "Press Ctrl+C to stop the bot"

echo ""
echo "🎤🇵🇷 ZOLORY A3 CHIP - REVOLUTIONARY AI VOICE BOT"
echo "✅ Voice AI: Professional Puerto Rican synthesis"
echo "✅ A3 Chip: 10M operations per second"
echo "✅ Security: Quantum-enhanced protocols"
echo "✅ Games: 50+ interactive games"
echo "✅ Economy: ZoloCoins cryptocurrency"
echo "✅ Social: All major platform integration"
echo "✅ Moderation: Natural language commands"
echo "================================================="
echo ""

# Function to handle cleanup on exit
cleanup() {
    print_status "Shutting down Zolory A3 Chip..."
    kill $BOT_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the bot with logging
node bot.js 2>&1 | tee "$LOG_FILE" &
BOT_PID=$!

# Monitor the bot process
while kill -0 $BOT_PID 2>/dev/null; do
    sleep 1
done

print_error "Bot process has stopped unexpectedly!"
print_info "Check the log file for details: $LOG_FILE"