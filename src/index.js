const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./utils/database');
const { loadCommands } = require('./utils/commandHandler');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildModeration
    ]
});

// Initialize collections
client.commands = new Collection();
client.cooldowns = new Collection();
client.giveaways = new Map();

// Load configuration
try {
    client.config = require('../config.json');
} catch (error) {
    console.error('Failed to load config.json:', error);
    process.exit(1);
}

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
});

process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Connect to database and start bot
async function startBot() {
    try {
        // Try to connect to database (non-critical)
        const dbConnected = await connectDB();
        if (dbConnected) {
            console.log('Connected to MongoDB');
        } else {
            console.log('Continuing without database - some features may be limited');
        }

        // Connect to Discord (critical)
        await client.login(process.env.DISCORD_TOKEN);
        console.log('Bot logged in successfully and is now online!');
    } catch (error) {
        console.error('Failed to start bot:', error);
        process.exit(1);
    }
}

startBot();

module.exports = client;