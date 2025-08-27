#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🤖 RDC Bot Setup Wizard\n');
console.log('This script will help you configure your bot for first-time use.\n');

async function setup() {
    try {
        // Check if .env already exists
        if (fs.existsSync('.env')) {
            const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/N): ');
            if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
                console.log('✅ Setup cancelled. Your existing .env file was preserved.');
                process.exit(0);
            }
        }

        console.log('\n📝 Please provide the following information:\n');

        // Get Discord token
        const token = await question('🔑 Discord Bot Token: ');
        if (!token) {
            console.log('❌ Discord token is required!');
            process.exit(1);
        }

        // Get client ID
        const clientId = await question('🆔 Bot Client ID (for slash commands, optional): ');

        // Get MongoDB URI
        const mongoUri = await question('🗄️  MongoDB URI (optional, press Enter to skip): ');

        // Get prefix
        const prefix = await question('⚡ Command prefix (default: !): ') || '!';

        // Create .env file
        const envContent = `# Discord Bot Configuration
DISCORD_TOKEN=${token}
${clientId ? `CLIENT_ID=${clientId}` : '# CLIENT_ID=your_bot_client_id_here'}

# Database Configuration (optional)
${mongoUri ? `MONGODB_URI=${mongoUri}` : '# MONGODB_URI=mongodb://localhost:27017/rdc-bot'}

# Bot Configuration
DEFAULT_PREFIX=${prefix}

# Admin User IDs (have permission for all commands)
ADMIN_USER_IDS=1219957467690172517,1378808921732550706

# API Keys (optional, for fun commands)
# REDDIT_CLIENT_ID=your_reddit_client_id
# REDDIT_CLIENT_SECRET=your_reddit_client_secret
`;

        fs.writeFileSync('.env', envContent);
        console.log('\n✅ .env file created successfully!');

        // Update config.json prefix if different
        if (prefix !== '!') {
            const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
            config.prefix = prefix;
            fs.writeFileSync('config.json', JSON.stringify(config, null, 2));
            console.log(`✅ Updated prefix to "${prefix}" in config.json`);
        }

        console.log('\n🎉 Setup complete! Here are your next steps:\n');
        console.log('1. Invite your bot to a server with proper permissions');
        console.log('2. Install dependencies: npm install');
        
        if (clientId) {
            console.log('3. Deploy slash commands: npm run deploy');
            console.log('4. Start the bot: npm start');
        } else {
            console.log('3. Start the bot: npm start');
            console.log('\n💡 To enable slash commands later:');
            console.log('   - Add CLIENT_ID to your .env file');
            console.log('   - Run: npm run deploy');
        }

        console.log('\n📖 For more information, check the README.md file.');
        console.log('\n🔗 Bot Invite Link (replace CLIENT_ID):');
        console.log(`   https://discord.com/api/oauth2/authorize?client_id=${clientId || 'YOUR_CLIENT_ID'}&permissions=8&scope=bot%20applications.commands`);

    } catch (error) {
        console.error('\n❌ Setup failed:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

setup();