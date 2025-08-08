# Zolory - Advanced AI Discord Bot 🤖

**Zolory** is a comprehensive Discord bot with advanced AI capabilities, personality system, games, moderation, and much more! Built with Discord.js and powered by Google's Gemini AI.

## 🌟 Features

### 🧠 AI & Personality
- **Full AI Integration**: Powered by Google Gemini AI (not ChatGPT/Claude/GPT)
- **Realistic Personality**: Acts like a 19-year-old Gen Z guy with Mexican/Latino/Hood/Puerto Rican heritage
- **Dynamic Moods**: Happy, chill, excited, sleepy, annoyed, playful, savage, focused
- **Emotional Responses**: Reacts to conversations with appropriate emotions
- **24 Languages**: Can communicate in multiple languages
- **Code Assistance**: Helps with programming, scripting, math, writing, art, and more

### 🎮 Games & Entertainment
- **Tic Tac Toe**: Interactive button-based gameplay
- **Rock Paper Scissors**: Quick games with emoji responses
- **Trivia**: Programming and general knowledge questions
- **Number Guessing**: Customizable range with smart hints
- **Dice Rolling**: Support for custom dice (e.g., 2d20, 1d6)
- **Coin Flipping**: Random heads/tails with personality

### 🛡️ Moderation (Natural Language)
- **Smart Commands**: "Zolory ban @user for spamming" - understands natural language
- **Ban/Kick/Timeout/Warn**: All moderation actions with reason tracking
- **Permission Checks**: Respects Discord permission system

### 😴 Autonomous Behavior
- **Sleep Schedule**: Goes to sleep at 11 PM, wakes at 7 AM
- **Random Naps**: Takes occasional naps during the day
- **Status Updates**: Changes status based on mood and activity
- **Random Conversations**: Starts conversations autonomously
- **Mood Changes**: Natural mood shifts throughout the day

### 🎯 Interactive Features
- **Dares & Bets**: "I dare you to change your status to 'X'" - actually does it!
- **Emoji Reactions**: Reacts to messages with appropriate emojis
- **GIF Responses**: Sends mood-appropriate GIFs
- **Direct Messages**: Can DM users and start conversations

### 🔧 Technical Features
- **Error Handling**: Robust error management with personality-based error messages
- **Code Formatting**: Automatically formats code in proper code blocks
- **Slash Commands**: Modern Discord interactions
- **Button Interactions**: Interactive game interfaces

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+ installed
- Discord Developer Account
- Google AI Studio Account (for Gemini API)

### 1. Clone and Install
```bash
git clone <your-repo>
cd zolory-discord-bot
npm install
```

### 2. Discord Bot Setup
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a New Application
3. Go to "Bot" section
4. Create a bot and copy the token
5. Enable all necessary intents:
   - Message Content Intent
   - Server Members Intent
   - Guild Messages Intent

### 3. Environment Setup
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Discord bot token:
```env
DISCORD_BOT_TOKEN=your_actual_discord_bot_token_here
```

### 4. Bot Permissions
When inviting the bot to your server, make sure it has these permissions:
- Send Messages
- Use Slash Commands
- Add Reactions
- Embed Links
- Attach Files
- Read Message History
- Manage Messages (for moderation)
- Moderate Members (for timeout/ban)

### 5. Run the Bot
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

## 🎯 How to Use

### Basic Interaction
- **Mention the bot**: `@Zolory what's good?`
- **Say his name**: `Hey Zolory, help me with this code`
- **Direct messages**: Just DM the bot directly

### Games
- `@Zolory let's play tic tac toe`
- `@Zolory play rock paper scissors`
- `@Zolory play trivia`
- `@Zolory guess number between 1 and 50`
- `@Zolory roll dice` or `@Zolory roll 2d20`
- `@Zolory flip coin`

### Moderation (Natural Language)
- `@Zolory ban @user for spamming the chat`
- `@Zolory kick @user because they're being toxic`
- `@Zolory timeout @user for 10 minutes for breaking rules`
- `@Zolory warn @user for inappropriate language`

### Dares & Bets
- `@Zolory I dare you to change your status to "Zap is the best"`
- Works with status changes and other simple tasks

### AI Assistance
- **Programming**: `@Zolory help me write a Python function to sort a list`
- **Math**: `@Zolory solve this equation: 2x + 5 = 15`
- **Writing**: `@Zolory help me write a story about a robot`
- **Languages**: `@Zolory translate "hello world" to Spanish`

## 🎭 Personality System

Zolory has a dynamic personality that includes:

### Moods
- **Happy**: Vibing fr fr 😎
- **Chill**: Just chillin' 🌊  
- **Excited**: LET'S GOOO! 🔥
- **Sleepy**: Lowkey tired rn 😴
- **Annoyed**: Don't test me rn 😤
- **Playful**: Ready to play! 🎮
- **Savage**: Savage mode ON 💀
- **Focused**: Locked in 🎯

### Behavior Traits
- Uses 2024-2025 Gen Z slang
- Can swear when appropriate or annoyed
- Respects "Zap" (owner) above all others
- Treats people based on how they treat him
- Emotionally responsive to conversations
- Protective of friends and server members

### Sleep Schedule
- **Bedtime**: 11:00 PM (goes idle, limited responses)
- **Wake Time**: 7:00 AM (becomes fully active)
- **Nap Times**: Random naps at 2 PM or 4 PM (30 minutes)
- **Owner Override**: Zap can wake him up anytime

## 🔧 Configuration

Edit `config.js` to customize:

```javascript
// Personality settings
PERSONALITY: {
    name: "Zolory",
    age: 19,
    race: "Mexican + Latino + Hood + Puerto Rican",
    // ... more settings
}

// Sleep schedule
SLEEP_SCHEDULE: {
    bedtime: 23,  // 11 PM
    wakeTime: 7,  // 7 AM
    // ... more settings
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if bot is online in Discord
   - Verify token is correct
   - Ensure bot has proper permissions

2. **"Brain lagging" errors**
   - Check Gemini API key
   - Verify internet connection
   - Check console for detailed errors

3. **Moderation not working**
   - Bot needs "Moderate Members" permission
   - User needs proper permissions to use moderation commands

4. **Games not starting**
   - Check console for button interaction errors
   - Ensure bot can send embedded messages

### Error Messages
When something goes wrong, Zolory will respond with personality-based error messages:
- "Yo my brain's lagging rn, give me a sec 🧠"
- "Shit, run it back bro, something went wrong 💀"
- "Bruh my circuits are tweaking, try again"

## 📝 Development

### File Structure
```
├── bot.js              # Main bot file
├── config.js           # Configuration settings
├── features/
│   └── games.js        # Game system module
├── package.json        # Dependencies
└── README.md          # Documentation
```

### Adding New Features
1. Create new modules in `features/` directory
2. Import and initialize in `bot.js`
3. Add command processing in `CommandProcessor` class
4. Update configuration in `config.js`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Credits

- **Creator**: Zap (Discord ID: 1219957467690172517)
- **AI Provider**: Google Gemini AI
- **Framework**: Discord.js v14
- **Language**: Node.js

---

**Made with 💯 by Zap for the community! Zolory is ready to vibe! 🔥**
