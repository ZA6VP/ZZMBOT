# 🚀 Getting Started with RDC Bot

Welcome to RDC Bot! This guide will help you get your bot up and running in just a few minutes.

## 🎯 Quick Setup (Recommended)

### Option 1: Automated Setup
```bash
npm run setup
```
This will guide you through the configuration process step by step.

### Option 2: Manual Setup
1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Discord bot token:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_bot_client_id_here
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Deploy slash commands (optional):
   ```bash
   npm run deploy
   ```

5. Start the bot:
   ```bash
   npm start
   ```

## 🔧 Configuration

Your bot behavior is controlled by two main files:

### `.env` - Sensitive Configuration
- `DISCORD_TOKEN` - Your bot's secret token
- `CLIENT_ID` - Your bot's client ID (for slash commands)
- `MONGODB_URI` - Database connection (optional)
- `ADMIN_USER_IDS` - User IDs with full bot access

### `config.json` - Bot Settings
- `prefix` - Command prefix (default: !)
- `modRoleNames` - Role names that can use moderation commands
- `logChannel` - Channel name for mod logs
- `levelUpRole` - Automatic role rewards for leveling
- `giveaway` - Giveaway manager roles and emoji
- `xp` - XP system configuration
- `automod` - Auto-moderation settings
- `welcome` - Welcome message settings

## 🤖 Creating Your Discord Bot

If you don't have a Discord bot yet:

1. Go to https://discord.com/developers/applications
2. Click "New Application" and give it a name
3. Go to the "Bot" section
4. Click "Add Bot"
5. Copy the token and add it to your `.env` file
6. Copy the Application ID (Client ID) for slash commands

## 🔗 Inviting Your Bot

Use this invite link (replace YOUR_CLIENT_ID):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

### Required Permissions
Your bot needs these permissions to function properly:
- ✅ **Administrator** (easiest option)
- OR individual permissions:
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

## 🎮 First Commands to Try

Once your bot is running, try these commands:

### Basic Commands
- `!ping` - Check if the bot is responding
- `!help` - See all available commands
- `!serverinfo` - Get server information

### Setup Commands (Admin only)
- `!logschannel #mod-logs` - Set moderation logs channel
- `!welcomechannel #welcome` - Set welcome messages channel
- `!setlevelrole 5 @Active Member` - Set role reward for level 5

### Fun Commands
- `!meme` - Get a random meme
- `!roll` - Roll a dice
- `!trivia` - Start a trivia question
- `!friendlyraid` - Start an activity boost

### Moderation Commands
- `!warn @user reason` - Warn a user
- `!timeout @user 10m` - Timeout for 10 minutes
- `!purge 10` - Delete 10 messages

## 🎉 Giveaway Example
```
!gstart 1h Discord Nitro 1
```
This creates a 1-hour giveaway for Discord Nitro with 1 winner.

## 📊 XP System

The bot automatically tracks user activity:
- Users gain 15-25 XP per message (with 1-minute cooldown)
- Level up rewards can be configured with `!setlevelrole`
- View leaderboard with `!leaderboard`
- Check XP with `!xp`

## 🛠️ Troubleshooting

### Bot not responding?
1. Check the console for errors
2. Verify your token is correct
3. Make sure the bot has proper permissions
4. Check if the bot is online in your server

### Commands not working?
1. Make sure you're using the correct prefix (`!` by default)
2. Check if you have the required permissions
3. Try `!help commandname` for usage info

### Database errors?
- The bot works without a database, but some features are limited
- Make sure MongoDB is running if you configured it
- Check the MONGODB_URI in your `.env` file

### Slash commands not appearing?
1. Make sure CLIENT_ID is in your `.env` file
2. Run `npm run deploy` to register commands
3. Wait a few minutes for Discord to update
4. Re-invite the bot with the `applications.commands` scope

## 🔒 Admin User Setup

The bot recognizes these user IDs as super admins (configured in permission checks):
- `1219957467690172517`
- `1378808921732550706`

These users have access to all commands regardless of server permissions.

## 📚 Additional Resources

- **Full Documentation**: See `README.md`
- **Command List**: Use `!help` in Discord
- **Configuration**: Edit `config.json` for customization
- **Support**: Check the GitHub issues page

## 🎯 Next Steps

1. ✅ Get the bot running
2. ✅ Set up mod logs channel
3. ✅ Configure role rewards
4. ✅ Test moderation commands
5. ✅ Set up giveaways
6. ✅ Customize welcome messages
7. ✅ Explore fun commands

---

**Need Help?** Check the README.md for detailed documentation or create an issue on GitHub!

Happy botting! 🤖✨