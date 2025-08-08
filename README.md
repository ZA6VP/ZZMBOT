# 🤖 Zolory - Advanced AI Discord Bot

**Zolory** is a 19-year-old Mexican + Latino + Da Hoodian + Puerto Rican AI assistant with an American accent, designed to be your ultimate Discord companion! 

## 🌟 Features

### 🤖 AI Capabilities
- **Natural Language Processing** - Understands and responds to natural conversations
- **Code Generation** - Generates code in multiple programming languages
- **Story Writing** - Creates creative stories in various genres
- **Language Translation** - Translates between 24 languages
- **Math Problem Solving** - Solves complex mathematical problems
- **Image Generation** - Creates images from descriptions (coming soon)

### 🎮 Interactive Games
- **Tic-Tac-Toe** - Play against Zolory
- **Hangman** - Word guessing game
- **Trivia** - Test your knowledge
- **Rock, Paper, Scissors** - Classic game

### 🛡️ Moderation Tools
- **Ban/Kick** - Moderate members
- **Timeout/Mute** - Temporary restrictions
- **Warning System** - Track member warnings
- **Natural Language Commands** - "Yo Zolory, ban user123 for 1h because spam"

### 😊 Personality & Emotions
- **Dynamic Moods** - Happy, sad, angry, excited, playful, focused, serious, calm
- **Emotional Responses** - Reacts to user interactions
- **Sleep Schedule** - Goes to sleep at night and takes naps
- **Realistic Personality** - Speaks like a Gen Z male with 2024-2025 slang

### 🎯 Fun Features
- **Bets & Dares** - Make bets and dares with Zolory
- **Roasting** - Fun roasts (all in good fun!)
- **Compliments** - Spread positivity
- **GIF Responses** - Sends relevant GIFs and emojis

## 🚀 Quick Start

### Prerequisites
- Node.js 16.9.0 or higher
- Discord Bot Token
- MongoDB (optional, for database features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zolory-discord-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Discord bot token
   ```

4. **Start the bot**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables
- `DISCORD_TOKEN` - Your Discord bot token (required)
- `MONGODB_URI` - MongoDB connection string (optional)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/error)

### Bot Configuration
Edit `config.json` to customize:
- Bot personality and traits
- Sleep schedule
- Game settings
- Moderation features
- AI parameters

## 🎮 Commands

### Basic Commands
- `!help` - Show all commands and features
- `!ping` - Check bot latency and status
- `!stats` - Show bot statistics
- `!mood` - Check or change Zolory's mood

### AI Commands
- `!code <language> <description>` - Generate code
- `!story <genre> [length]` - Write a story
- `!translate <language> <text>` - Translate text
- `!math <problem>` - Solve math problems

### Games
- `!tictactoe` - Play Tic-Tac-Toe
- `!hangman` - Play Hangman
- `!trivia` - Play Trivia
- `!rps` - Rock, Paper, Scissors

### Moderation
- `!ban <user> [duration] [reason]` - Ban a member
- `!kick <user> [reason]` - Kick a member
- `!timeout <user> <duration> [reason]` - Timeout a member
- `!warn <user> [reason]` - Warn a member

### Fun Commands
- `!bet <description>` - Make a bet
- `!dare <description>` - Give a dare
- `!roast [user]` - Roast someone (fun!)
- `!sleep [nap/wake/status]` - Sleep management

## 💬 Natural Language

Zolory understands natural language! Just mention him or say his name:

- "Yo Zolory, ban user123 for 1h because spam"
- "Zolory, let's play tictactoe"
- "Zolory, write me a fantasy story"
- "Zolory, translate hello to Spanish"

## 🎭 Personality

**Zolory** is a 19-year-old AI with a unique personality:
- **Ethnicity**: Mexican + Latino + Da Hoodian + Puerto Rican
- **Accent**: American
- **Languages**: 24 languages
- **Personality**: Friendly, witty, sarcastic, emotional, protective
- **Communication**: Gen Z slang, emojis, expressive

## 🔄 Sleep Schedule

Zolory has a realistic sleep schedule:
- **Bedtime**: 11:00 PM EST
- **Wake Time**: 8:00 AM EST
- **Naps**: Can take naps during the day
- **Status**: Changes status when sleeping

## 🛠️ Development

### Project Structure
```
src/
├── commands/          # Bot commands
├── events/           # Discord events
├── utils/            # Utility functions
│   ├── zoloryAI.js   # AI integration
│   ├── emotionManager.js # Emotion system
│   ├── gameManager.js    # Game management
│   ├── moderationManager.js # Moderation tools
│   └── ...
└── index.js          # Main bot file
```

### Adding New Features
1. Create new command in `src/commands/`
2. Add utility functions in `src/utils/`
3. Update `config.json` if needed
4. Test thoroughly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- **Owner**: Zap (ID: 1219957467690172517)
- **AI Integration**: Google Gemini API
- **Framework**: Discord.js
- **Community**: All the amazing Discord users who test and provide feedback

## 🆘 Support

If you need help:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Join our Discord server
3. Contact the owner: Zap

---

**Made with ❤️ by Zap**
