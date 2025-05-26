# PDW Bot - Multipurpose Discord Bot

A comprehensive Discord bot built with Node.js featuring moderation tools, leveling system, giveaways, utility commands, and fun features. Perfect for managing Discord servers of any size.

## 🌟 Features

### 🛡️ Moderation
- **Ban/Unban** - Permanently ban or unban users with reasons
- **Kick** - Remove users from the server temporarily  
- **Timeout** - Apply temporary timeouts to users
- **Mute/Unmute** - Role-based muting system with auto-unmute
- **Warn** - Issue warnings to users with infraction tracking
- **Infractions** - View user's moderation history
- **Purge** - Bulk delete messages (up to 100)
- **Lock/Unlock** - Lock channels to prevent messaging

### 📈 Leveling & XP System
- **Automatic XP** - Gain XP by sending messages (15-25 XP per message)
- **Level Roles** - Automatically assign roles when users reach certain levels
- **Leaderboard** - View top users by XP in the server
- **XP Command** - Check your or another user's level and progress
- **Configurable** - Customize XP rates and cooldowns

### 🎉 Giveaways
- **Create Giveaways** - Start giveaways with custom duration and prizes
- **Multiple Winners** - Support for multiple winners per giveaway
- **Auto-End** - Automatically picks winners when time expires
- **Manual Control** - End giveaways early or reroll winners
- **Reaction-Based** - Users enter by reacting with 🎉

### 🔧 Utility Commands
- **Ping** - Check bot latency and connection status
- **User Info** - Detailed information about users
- **Server Info** - Comprehensive server statistics
- **Help** - Complete command documentation
- **Suggestions** - Collect user suggestions with voting
- **Announcements** - Send formatted announcements

### 🎮 Fun Commands
- **Memes** - Random memes from Reddit
- **Dice Roll** - Roll dice with custom sides
- **Cat/Dog** - Random cute animal pictures
- **Trivia** - Interactive trivia questions with multiple categories

### 📊 Logging & Monitoring
- **Moderation Logs** - All mod actions logged to designated channel
- **Member Events** - Log member joins and message deletions
- **Auto-moderation** - Configurable bad word filtering (coming soon)

## 🚀 Quick Start

### Prerequisites
- Node.js 16.9.0 or higher
- MongoDB database (local or cloud)
- Discord Bot Token

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pdw-bot.git
cd pdw-bot
