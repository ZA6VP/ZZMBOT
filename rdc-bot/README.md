# RDC Discord Bot

A comprehensive multi-purpose Discord bot with moderation, leveling, giveaways, and more!

## Features

- **🔨 Moderation**: Ban, kick, timeout, mute, warn users with a complete infraction tracking system
- **📊 Leveling System**: XP-based progression with role rewards and leaderboards
- **🎉 Giveaways**: Create and manage giveaways with multiple winners
- **🛡️ Auto-Moderation**: Bad word filtering and link blocking
- **📝 Logging**: Comprehensive logging of all server events
- **🎮 Fun Commands**: Memes, trivia, dice rolls, and more
- **🔧 Utility**: Server info, user info, suggestions system

## Setup

### Prerequisites
- Node.js v16.9.0 or higher
- MongoDB database
- Discord Bot Token

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/rdc-bot.git
cd rdc-bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env and add your bot token and MongoDB URI
```

4. Configure bot settings in `config.json`

5. Start the bot:
```bash
npm start
```

## Commands Reference

### Moderation Commands
| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `!ban <@user> [reason]` | Ban a user | Ban Members |
| `!unban <userID>` | Unban a user | Ban Members |
| `!kick <@user> [reason]` | Kick a user | Kick Members |
| `!timeout <@user> <duration>` | Timeout a user | Timeout Members |
| `!mute <@user> [duration]` | Mute a user | Manage Roles |
| `!warn <@user> [reason]` | Warn a user | Manage Messages |
| `!infractions <@user>` | View user's infractions | Manage Messages |
| `!purge <number>` | Delete messages | Manage Messages |
| `!lock` / `!unlock` | Lock/unlock channel | Manage Channels |

### Admin Commands
| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `!role <@user> <role>` | Give/remove role | Manage Roles |
| `!createrole <name> [color]` | Create new role | Manage Roles |
| `!logschannel <#channel>` | Set logs channel | Administrator |
| `!welcomechannel <#channel>` | Set welcome channel | Administrator |
| `!announce <#channel> <message>` | Send announcement | Administrator |
| `!nuke` | **DANGEROUS**: Delete all server content | Administrator |
| `!copy <serverID>` | Copy another server's structure | Administrator |
| `!friendlyraid <message>` | Spam messages (for fun) | Send Messages |

### Giveaway Commands
| Command | Description | Required Permission |
|---------|-------------|-------------------|
| `!gstart <duration> <winners> <prize>` | Start giveaway | Manage Server |
| `!gend <messageID>` | End giveaway early | Manage Server |
| `!greroll <messageID> [winners]` | Reroll giveaway | Manage Server |

### Leveling Commands
| Command | Description |
|---------|-------------|
| `!xp [@user]` | View XP and level |
| `!leaderboard [page]` | View server leaderboard |
| `!setlevelrole <level> <role>` | Set role reward for level |

### Utility Commands
| Command | Description |
|---------|-------------|
| `!ping` | Check bot latency |
| `!userinfo [@user]` | View user information |
| `!serverinfo` | View server information |
| `!help [command]` | View command help |
| `!suggest <text>` | Submit a suggestion |

### Fun Commands
| Command | Description |
|---------|-------------|
| `!meme` | Get random meme |
| `!roll [sides]` | Roll dice |
| `!cat` | Random cat picture |
| `!dog` | Random dog picture |
| `!urban <term>` | Urban Dictionary lookup |
| `!trivia` | Start trivia question |

## Configuration

### config.json
```json
{
  "prefix": "!",
  "ownerIds": ["YOUR_ID_HERE"],
  "modRoleNames": ["Moderator", "Admin"],
  "logChannel": "mod-logs",
  "levelUpRole": {
    "5": "Active Member",
    "10": "Veteran"
  },
  "giveaway": {
    "managerRoles": ["Administrator", "Giveaway Host"],
    "reactionEmoji": "🎉"
  }
}
```

### Environment Variables
- `DISCORD_TOKEN`: Your bot's token
- `MONGODB_URI`: MongoDB connection string
- `DEFAULT_PREFIX`: Default command prefix

## Bot Permissions

The bot requires the following permissions:
- Administrator (recommended) OR:
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
  - Manage Emojis and Stickers

## Owner Privileges

Users with IDs `1219957467690172517` and `1378808921732550706` have full access to all commands regardless of server permissions.

## Support

For support, feature requests, or bug reports, please open an issue on GitHub or join our support server.

## License

This project is licensed under the MIT License.