# RDC Bot 🤖

RDC is a comprehensive multipurpose Discord bot built around a `!` prefix. It combines moderation tools, leveling systems, giveaways, utility commands, fun features, and auto-moderation capabilities to help you manage your Discord server effectively.

## ✨ Features

### 🛡️ Moderation
- **Ban/Unban** - Ban and unban users with reason logging
- **Kick** - Kick users from the server
- **Timeout** - Temporarily timeout users
- **Mute** - Mute users with role-based system
- **Warn** - Issue warnings to users
- **Infractions** - View user's moderation history
- **Purge** - Bulk delete messages
- **Lock/Unlock** - Lock and unlock channels

### 📊 Leveling & XP System
- **XP Tracking** - Automatic XP gain from messages
- **Level Roles** - Automatic role assignment on level up
- **Leaderboard** - Server XP rankings
- **Customizable** - Configurable XP rates and level roles

### 🎉 Giveaways
- **Multiple Winners** - Support for multiple giveaway winners
- **Timed Giveaways** - Automatic ending with duration
- **Early End** - Manually end giveaways
- **Reroll** - Pick new winners from ended giveaways

### 🔧 Utility Commands
- **Ping** - Check bot latency
- **User Info** - Detailed user information
- **Server Info** - Server statistics and details
- **Help** - Command documentation
- **Suggestions** - Collect user suggestions

### 🎮 Fun Commands
- **Memes** - Random memes from Reddit
- **Dice Roll** - Roll dice with custom sides
- **Cat/Dog** - Random cute animal pictures
- **Urban Dictionary** - Look up definitions
- **Trivia** - Interactive trivia questions
- **Friendly Raid** - Boost server activity with raids

### 🔒 Admin Commands
- **Role Management** - Give/remove roles from users
- **Create Roles** - Create new roles with custom settings
- **Channel Setup** - Configure log and welcome channels
- **Server Tools** - Advanced server management (nuke, copy)

### 📝 Logging & Auto-mod
- **Moderation Logs** - All mod actions logged
- **Auto-moderation** - Bad word filtering and link blocking
- **Welcome Messages** - Configurable welcome system

## 🚀 Quick Start

### Prerequisites
- Node.js 16.0.0 or higher
- Discord Bot Token
- MongoDB (optional, for data persistence)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/rdc-bot.git
   cd rdc-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Discord bot token:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   MONGODB_URI=mongodb://localhost:27017/rdc-bot
   CLIENT_ID=your_bot_client_id_here
   ```

4. **Configure settings**
   Edit `config.json` to customize bot behavior:
   ```json
   {
     "prefix": "!",
     "modRoleNames": ["Moderator", "Admin"],
     "logChannel": "mod-logs",
     "levelUpRole": {
       "5": "Active Member",
       "10": "Veteran"
     }
   }
   ```

5. **Deploy slash commands (optional)**
   ```bash
   npm run deploy
   ```

6. **Start the bot**
   ```bash
   npm start
   ```

## 🔑 Required Permissions

### Bot Permissions
The bot needs the following permissions:
- **Administrator** (recommended) or individual permissions:
  - Manage Channels
  - Manage Roles
  - Ban Members
  - Kick Members
  - Manage Messages
  - Timeout Members
  - Send Messages
  - Embed Links
  - Read Message History
  - Add Reactions
  - Use External Emojis

### Staff Role Permissions
- **Moderator role** → Ban Members, Kick Members, Timeout Members
- **Helper role** → Manage Messages (for purge), Manage Channels (for lock/unlock)
- **Administrator** → All permissions + bot configuration commands

## 📋 Command Reference

### Moderation Commands
| Command | Permission | Description |
|---------|------------|-------------|
| `!ban <@user> [reason]` | Ban Members | Bans user and logs action |
| `!unban <userID>` | Ban Members | Unbans user by ID |
| `!kick <@user> [reason]` | Kick Members | Kicks user from server |
| `!timeout <@user> <duration>` | Timeout Members | Times out user (10m, 2h, 1d, 1w) |
| `!mute <@user> [duration]` | Manage Roles | Assigns muted role |
| `!warn <@user> [reason]` | Manage Messages | Issues warning to user |
| `!infractions <@user>` | Manage Messages | Shows user's moderation history |
| `!purge <number>` | Manage Messages | Deletes specified number of messages |
| `!lock / !unlock` | Manage Channels | Toggles channel send permissions |

### Admin Commands
| Command | Permission | Description |
|---------|------------|-------------|
| `!role <@user> <role_name>` | Manage Roles | Give/remove role from user |
| `!addrole <name> [color] [mentionable]` | Manage Roles | Create a new role |
| `!logschannel <#channel>` | Administrator | Set mod logs channel |
| `!welcomechannel <#channel>` | Administrator | Set welcome channel |
| `!nuke` | Administrator | ⚠️ Delete all server content |
| `!copy <server_id>` | Administrator | Copy server structure |
| `!friendlyraid [message]` | Send Messages | Start activity boost raid |

### Giveaway Commands
| Command | Permission | Description |
|---------|------------|-------------|
| `!gstart <duration> <prize> <winners>` | Administrator | Start a giveaway |
| `!gend <messageID>` | Administrator | End giveaway early |
| `!greroll <messageID> <winners>` | Administrator | Reroll giveaway winners |

### Leveling Commands
| Command | Permission | Description |
|---------|------------|-------------|
| `!xp [user]` | Everyone | Check XP and level |
| `!leaderboard [page]` | Everyone | View server leaderboard |
| `!setlevelrole <level> <role>` | Administrator | Set role for level |

### Utility Commands
| Command | Permission | Description |
|---------|------------|-------------|
| `!ping` | Everyone | Check bot latency |
| `!userinfo [@user]` | Everyone | User information |
| `!serverinfo` | Everyone | Server statistics |
| `!help [command]` | Everyone | Command help |
| `!suggest <text>` | Everyone | Submit suggestion |

### Fun Commands
| Command | Permission | Description |
|---------|------------|-------------|
| `!meme` | Everyone | Random meme |
| `!roll [sides]` | Everyone | Roll dice |
| `!cat / !dog` | Everyone | Random animal pics |
| `!urban <term>` | Everyone | Urban Dictionary lookup |
| `!trivia` | Everyone | Trivia question |

## ⚙️ Configuration

### Environment Variables (.env)
```env
# Required
DISCORD_TOKEN=your_discord_bot_token_here

# Optional
MONGODB_URI=mongodb://localhost:27017/rdc-bot
CLIENT_ID=your_bot_client_id_here
DEFAULT_PREFIX=!
ADMIN_USER_IDS=1219957467690172517,1378808921732550706
```

### Bot Configuration (config.json)
```json
{
  "prefix": "!",
  "modRoleNames": ["Moderator", "Admin"],
  "logChannel": "mod-logs",
  "suggestChannel": "suggestions",
  "levelUpRole": {
    "5": "Active Member",
    "10": "Veteran",
    "15": "Expert",
    "20": "Legend"
  },
  "giveaway": {
    "managerRoles": ["Administrator", "Giveaway Host"],
    "reactionEmoji": "🎉"
  },
  "xp": {
    "messageXP": {
      "min": 15,
      "max": 25
    },
    "cooldown": 60000,
    "maxLevel": 100000,
    "exponentialScaling": true
  },
  "automod": {
    "enabled": true,
    "filterBadWords": true,
    "blockLinks": false
  },
  "welcome": {
    "enabled": false,
    "channel": null
  }
}
```

## 🚀 Deployment

### Local Development
```bash
npm run dev  # Uses nodemon for auto-restart
```

### Production

#### Heroku
1. Create a new Heroku app
2. Set config vars in dashboard (DISCORD_TOKEN, etc.)
3. Deploy via Git or GitHub integration

#### Replit
1. Import GitHub repository
2. Add secrets in the Secrets tab
3. Run the project

#### VPS/Docker
1. Clone repository on server
2. Install dependencies and configure
3. Use PM2 or systemd for process management
```bash
npm install -g pm2
pm2 start src/index.js --name "rdc-bot"
pm2 save
pm2 startup
```

## 🛠️ Development

### Project Structure
```
rdc-bot/
├─ .env                  # Environment variables
├─ config.json           # Bot configuration
├─ package.json          # Dependencies and scripts
├─ src/
│   ├─ index.js          # Bot entry point
│   ├─ commands/         # Command categories
│   │   ├─ moderation/   # Moderation commands
│   │   ├─ giveaways/    # Giveaway commands
│   │   ├─ leveling/     # XP and leveling
│   │   ├─ utility/      # Utility commands
│   │   ├─ fun/          # Fun commands
│   │   └─ admin/        # Admin commands
│   ├─ events/           # Event handlers
│   ├─ models/           # Database models
│   └─ utils/            # Utility functions
└─ README.md             # This file
```

### Adding New Commands
1. Create a new file in the appropriate command category
2. Follow the existing command structure:
```javascript
module.exports = {
    data: {
        name: 'commandname',
        description: 'Command description',
        usage: '!commandname <args>',
        aliases: ['alias1', 'alias2'],
        cooldown: 5
    },
    async execute(message, args) {
        // Command logic here
    }
};
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📊 Database Schema

The bot uses MongoDB with Mongoose for data persistence:

- **Users** - XP, level, and user data
- **Guilds** - Server-specific settings
- **Infractions** - Moderation history
- **Giveaways** - Active and past giveaways

## 🔧 Troubleshooting

### Common Issues

**Bot not responding to commands:**
- Check bot permissions
- Verify token is correct
- Ensure bot is online

**Database connection failed:**
- Bot continues without database features
- Check MongoDB URI
- Verify MongoDB is running

**Slash commands not working:**
- Run `npm run deploy` to register commands
- Check CLIENT_ID in .env
- Bot needs application.commands scope

**Permission errors:**
- Verify bot role hierarchy
- Check required permissions
- Ensure bot has Administrator or specific perms

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🤝 Support

Need help? Join our Discord server or create an issue on GitHub!

- **Discord**: [Support Server](#)
- **GitHub Issues**: [Report a Bug](https://github.com/yourusername/rdc-bot/issues)

## 🎯 Roadmap

- [ ] Web dashboard for configuration
- [ ] More auto-moderation features
- [ ] Custom commands system
- [ ] Reaction roles
- [ ] Music commands enhancement
- [ ] Multi-language support

---

Made with ❤️ for the Discord community