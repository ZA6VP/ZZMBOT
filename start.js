#!/usr/bin/env node

// Simple startup script for the RDC Bot
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🤖 Starting RDC Bot...\n');

// Check if .env file exists
if (!fs.existsSync('.env')) {
    console.error('❌ .env file not found!');
    console.log('📝 Please copy .env.example to .env and configure your settings.');
    console.log('   cp .env.example .env');
    process.exit(1);
}

// Check if config.json exists
if (!fs.existsSync('config.json')) {
    console.error('❌ config.json file not found!');
    process.exit(1);
}

// Check if DISCORD_TOKEN is set
require('dotenv').config();
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ DISCORD_TOKEN not found in .env file!');
    console.log('📝 Please add your Discord bot token to the .env file.');
    process.exit(1);
}

console.log('✅ Configuration files found');
console.log('✅ Discord token configured');
console.log('🚀 Starting bot...\n');

// Start the bot
const bot = spawn('node', ['src/index.js'], {
    stdio: 'inherit',
    cwd: __dirname
});

bot.on('close', (code) => {
    if (code !== 0) {
        console.log(`\n❌ Bot process exited with code ${code}`);
    } else {
        console.log('\n✅ Bot shut down gracefully');
    }
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down bot...');
    bot.kill('SIGINT');
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down bot...');
    bot.kill('SIGTERM');
});