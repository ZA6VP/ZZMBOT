const { Client, GatewayIntentBits, Collection, ActivityType, Status } = require('discord.js');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const moment = require('moment-timezone');
require('dotenv').config();

const { connectDatabase } = require('./utils/database');
const { loadCommands } = require('./utils/commandHandler');
const { ZoloryAI } = require('./utils/zoloryAI');
const { EmotionManager } = require('./utils/emotionManager');
const { GameManager } = require('./utils/gameManager');
const { ModerationManager } = require('./utils/moderationManager');
const { SleepManager } = require('./utils/sleepManager');
const { GifManager } = require('./utils/gifManager');
const { Logger } = require('./utils/logger');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions
    ]
});

// Initialize collections and managers
client.commands = new Collection();
client.cooldowns = new Collection();
client.giveaways = new Map();
client.activeGames = new Map();
client.userConversations = new Map();
client.bets = new Map();
client.dares = new Map();

// Load configuration
try {
    client.config = require('../config.json');
} catch (error) {
    console.error('Failed to load config.json:', error);
    process.exit(1);
}

// Initialize managers
client.zoloryAI = new ZoloryAI(client.config.ai);
client.emotionManager = new EmotionManager(client.config.botPersonality);
client.gameManager = new GameManager(client);
client.moderationManager = new ModerationManager(client);
client.sleepManager = new SleepManager(client);
client.gifManager = new GifManager();
client.logger = new Logger();

// Bot personality and state
client.botState = {
    name: client.config.botPersonality.name,
    age: client.config.botPersonality.age,
    ethnicity: client.config.botPersonality.ethnicity,
    accent: client.config.botPersonality.accent,
    currentMood: client.config.botPersonality.currentMood,
    isAwake: true,
    isInConversation: false,
    lastActivity: Date.now(),
    stats: {
        messagesProcessed: 0,
        commandsExecuted: 0,
        gamesPlayed: 0,
        moderationsPerformed: 0
    }
};

// Load commands
loadCommands(client);

// Load events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);

    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
    client.logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    client.logger.error('Uncaught exception:', error);
    process.exit(1);
});

// Sleep schedule management
cron.schedule('0 23 * * *', () => {
    client.sleepManager.goToSleep(client);
}, {
    timezone: client.config.botPersonality.sleepSchedule.timezone
});

cron.schedule('0 8 * * *', () => {
    client.sleepManager.wakeUp(client);
}, {
    timezone: client.config.botPersonality.sleepSchedule.timezone
});

// Mood updates every 30 minutes
cron.schedule('*/30 * * * *', () => {
    client.emotionManager.updateMood(client);
});

// Status updates every 5 minutes
cron.schedule('*/5 * * * *', () => {
    updateBotStatus(client);
});

// Function to update bot status
function updateBotStatus(client) {
    if (!client.user) return;
    
    const activities = [
        { name: `${client.botState.name} | ${client.botState.currentMood}`, type: ActivityType.Playing },
        { name: 'with emotions', type: ActivityType.Playing },
        { name: '24 languages', type: ActivityType.Playing },
        { name: 'AI conversations', type: ActivityType.Watching },
        { name: 'the server', type: ActivityType.Watching }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    client.user.setActivity(randomActivity.name, { type: randomActivity.type });
}

// Connect to database and start bot
async function startBot() {
    try {
        // Try to connect to database (non-critical)
        const dbConnected = await connectDatabase();
        if (dbConnected) {
            console.log('✅ Connected to MongoDB');
        } else {
            console.log('⚠️ Continuing without database - some features may be limited');
        }

        // Connect to Discord (critical)
        await client.login(process.env.DISCORD_TOKEN);
        console.log(`🤖 ${client.config.botPersonality.name} is now online and ready to serve!`);
        console.log(`👤 Owner: ${client.config.ownerName} (${client.config.ownerId})`);
        console.log(`🌍 Languages: ${client.config.botPersonality.languages.length}`);
        console.log(`😊 Current mood: ${client.botState.currentMood}`);
        
        // Set initial status
        updateBotStatus(client);
        
    } catch (error) {
        console.error('❌ Failed to start bot:', error);
        client.logger.error('Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();

module.exports = client;