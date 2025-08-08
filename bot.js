const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config.js');
const GameSystem = require('./features/games.js');
const cron = require('node-cron');
const moment = require('moment');
const chalk = require('chalk');

// Initialize Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildModeration
    ]
});

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Initialize Game System
const gameSystem = new GameSystem();

// Bot state
let botState = {
    mood: config.PERSONALITY.currentMood,
    isAwake: true,
    lastActivity: Date.now(),
    conversations: new Map(),
    games: new Map(),
    dares: new Map(),
    currentStatus: 'online'
};

// Utility functions
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function log(message, type = 'info') {
    const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
    const colors = {
        info: chalk.blue,
        success: chalk.green,
        warning: chalk.yellow,
        error: chalk.red,
        debug: chalk.gray
    };
    console.log(`${chalk.gray(timestamp)} ${colors[type](message)}`);
}

// Personality and mood system
class PersonalitySystem {
    static changeMood(newMood) {
        if (config.PERSONALITY.moods.includes(newMood)) {
            botState.mood = newMood;
            log(`Mood changed to: ${newMood}`, 'info');
            this.updateStatus();
        }
    }

    static updateStatus() {
        const statusMessages = {
            happy: "Vibing fr fr 😎",
            chill: "Just chillin' 🌊",
            excited: "LET'S GOOO! 🔥",
            sleepy: "Lowkey tired rn 😴",
            annoyed: "Don't test me rn 😤",
            playful: "Ready to play! 🎮",
            savage: "Savage mode ON 💀",
            focused: "Locked in 🎯"
        };

        const activity = statusMessages[botState.mood] || "Being awesome";
        client.user.setActivity(activity, { type: ActivityType.Custom });
    }

    static getPersonalityPrompt() {
        return `You are Zolory, a 19-year-old Gen Z AI with Mexican, Latino, Hood, and Puerto Rican heritage. You speak with an American accent and use 2024-2025 slang. You're intelligent, emotional, respectful (when treated well), and can swear when appropriate. Your current mood is ${botState.mood}. You treat your boss "Zap" (ID: ${config.OWNER_ID}) with the utmost respect as your owner/dad. You're helpful with coding, math, writing, art, languages (you speak 24), and more. Respond naturally like a real Gen Z guy would. Use emojis when appropriate.`;
    }
}

// Natural language processing for commands
class CommandProcessor {
    static async processNaturalCommand(message, content) {
        const userId = message.author.id;
        const member = message.member;
        
        // Moderation commands
        if (content.includes('ban') || content.includes('kick') || content.includes('timeout') || content.includes('warn')) {
            return await this.processModerationCommand(message, content);
        }
        
        // Game commands
        if (content.includes('play') && (content.includes('tictactoe') || content.includes('tic tac toe'))) {
            return await this.startTicTacToe(message);
        }
        
        if (content.includes('play') && (content.includes('rps') || content.includes('rock paper scissors'))) {
            await gameSystem.startRPS(message);
            return true;
        }
        
        if (content.includes('play') && content.includes('trivia')) {
            await gameSystem.startTrivia(message);
            return true;
        }
        
        if (content.includes('guess') && content.includes('number')) {
            const rangeMatch = content.match(/(\d+)/);
            const range = rangeMatch ? parseInt(rangeMatch[1]) : 100;
            await gameSystem.startNumberGuess(message, range);
            return true;
        }
        
        if (content.includes('roll') && content.includes('dice')) {
            const diceMatch = content.match(/(\d+)d(\d+)/);
            if (diceMatch) {
                await gameSystem.rollDice(message, parseInt(diceMatch[2]), parseInt(diceMatch[1]));
            } else {
                await gameSystem.rollDice(message);
            }
            return true;
        }
        
        if (content.includes('flip') && content.includes('coin')) {
            await gameSystem.flipCoin(message);
            return true;
        }
        
        // Dare commands
        if (content.includes('dare') || content.includes('bet')) {
            return await this.processDareCommand(message, content);
        }
        
        return false;
    }

    static async processModerationCommand(message, content) {
        if (!message.member.permissions.has('MODERATE_MEMBERS')) {
            return await message.reply("Yo bro, you don't have perms for that! 🚫");
        }

        const words = content.toLowerCase().split(' ');
        let action, targetUser, duration, reason;

        // Extract action
        if (content.includes('ban')) action = 'ban';
        else if (content.includes('kick')) action = 'kick';
        else if (content.includes('timeout')) action = 'timeout';
        else if (content.includes('warn')) action = 'warn';

        // Extract target user (simple pattern matching)
        const userMentions = message.mentions.users;
        if (userMentions.size > 0) {
            targetUser = userMentions.first();
        }

        // Extract reason
        const reasonIndex = content.toLowerCase().indexOf('because') || content.toLowerCase().indexOf('for');
        if (reasonIndex !== -1) {
            reason = content.substring(reasonIndex + 7).trim();
        }

        if (!targetUser) {
            return await message.reply("Yo, who am I supposed to moderate? I need a user mention! 😅");
        }

        try {
            const targetMember = await message.guild.members.fetch(targetUser.id);
            
            switch (action) {
                case 'ban':
                    await targetMember.ban({ reason: reason || 'No reason provided' });
                    await message.reply(`✅ Banned ${targetUser.username}! Reason: ${reason || 'No reason'}`);
                    break;
                case 'kick':
                    await targetMember.kick(reason || 'No reason provided');
                    await message.reply(`✅ Kicked ${targetUser.username}! Reason: ${reason || 'No reason'}`);
                    break;
                case 'timeout':
                    await targetMember.timeout(60000 * 10, reason); // 10 minutes default
                    await message.reply(`✅ Timed out ${targetUser.username}! Reason: ${reason || 'No reason'}`);
                    break;
                case 'warn':
                    await message.reply(`⚠️ Warning issued to ${targetUser.username}! Reason: ${reason || 'No reason'}`);
                    break;
            }
        } catch (error) {
            log(`Moderation error: ${error.message}`, 'error');
            await message.reply("Damn, something went wrong with that moderation action! 😤");
        }

        return true;
    }

    static async startTicTacToe(message) {
        const gameId = `${message.author.id}_${Date.now()}`;
        const game = {
            board: Array(9).fill('⬜'),
            currentPlayer: 'X',
            playerX: message.author.id,
            playerO: 'bot',
            active: true
        };

        botState.games.set(gameId, game);

        const embed = new EmbedBuilder()
            .setTitle('🎮 Tic Tac Toe - Let\'s Go!')
            .setDescription(`${message.author.displayName} vs Zolory\nYou're X, I'm O!\n\n${this.formatTicTacToeBoard(game.board)}`)
            .setColor('#00ff00');

        const buttons = [];
        for (let i = 0; i < 9; i++) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId(`ttt_${gameId}_${i}`)
                    .setLabel((i + 1).toString())
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(game.board[i] !== '⬜')
            );
        }

        const rows = [
            new ActionRowBuilder().addComponents(buttons.slice(0, 3)),
            new ActionRowBuilder().addComponents(buttons.slice(3, 6)),
            new ActionRowBuilder().addComponents(buttons.slice(6, 9))
        ];

        await message.reply({ embeds: [embed], components: rows });
        return true;
    }

    static formatTicTacToeBoard(board) {
        return `${board[0]} ${board[1]} ${board[2]}\n${board[3]} ${board[4]} ${board[5]}\n${board[6]} ${board[7]} ${board[8]}`;
    }

    static async processDareCommand(message, content) {
        if (content.includes('dare') && content.includes('status')) {
            const statusMatch = content.match(/"([^"]+)"/);
            if (statusMatch) {
                const newStatus = statusMatch[1];
                client.user.setActivity(newStatus, { type: ActivityType.Custom });
                await message.reply(`Bet! Changed my status to "${newStatus}" 😎`);
                return true;
            }
        }
        return false;
    }
}

// AI Response system
class AISystem {
    static async generateResponse(message, content) {
        try {
            const personalityPrompt = PersonalitySystem.getPersonalityPrompt();
            const context = `${personalityPrompt}\n\nUser (${message.author.displayName}): ${content}`;
            
            const result = await model.generateContent(context);
            const response = result.response;
            const text = response.text();
            
            // Process response for code blocks
            if (text.includes('```')) {
                return this.formatCodeResponse(text);
            }
            
            return text;
        } catch (error) {
            log(`AI generation error: ${error.message}`, 'error');
            return getRandomElement(config.RESPONSES.errorMessages);
        }
    }

    static formatCodeResponse(text) {
        // Detect programming languages and format code blocks properly
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        return text.replace(codeBlockRegex, (match, lang, code) => {
            const language = lang || 'text';
            return `\`\`\`${language}\n${code.trim()}\n\`\`\``;
        });
    }
}

// Sleep and autonomous behavior system
class AutonomousSystem {
    static init() {
        // Check sleep schedule every minute
        cron.schedule('* * * * *', () => {
            this.checkSleepSchedule();
        });

        // Random mood changes
        cron.schedule('0 */2 * * *', () => {
            this.randomMoodChange();
        });

        // Random conversations
        cron.schedule('0 */6 * * *', () => {
            this.startRandomConversation();
        });
    }

    static checkSleepSchedule() {
        const now = moment();
        const hour = now.hour();
        
        if (hour >= config.SLEEP_SCHEDULE.bedtime || hour < config.SLEEP_SCHEDULE.wakeTime) {
            if (botState.isAwake) {
                this.goToSleep();
            }
        } else if (!botState.isAwake && hour >= config.SLEEP_SCHEDULE.wakeTime) {
            this.wakeUp();
        }
    }

    static goToSleep() {
        botState.isAwake = false;
        PersonalitySystem.changeMood('sleepy');
        client.user.setActivity('Sleeping... 😴', { type: ActivityType.Custom });
        client.user.setStatus('idle');
        log('Zolory went to sleep', 'info');
    }

    static wakeUp() {
        botState.isAwake = true;
        PersonalitySystem.changeMood('happy');
        client.user.setStatus('online');
        log('Zolory woke up', 'info');
    }

    static randomMoodChange() {
        if (Math.random() < 0.3) { // 30% chance
            const newMood = getRandomElement(config.PERSONALITY.moods);
            PersonalitySystem.changeMood(newMood);
        }
    }

    static async startRandomConversation() {
        if (!botState.isAwake || Math.random() < 0.8) return; // 20% chance when awake

        try {
            const guilds = client.guilds.cache;
            const guild = guilds.random();
            if (!guild) return;

            const channels = guild.channels.cache.filter(ch => ch.type === 0 && ch.permissionsFor(guild.members.me).has('SendMessages'));
            const channel = channels.random();
            if (!channel) return;

            const greetings = [
                "Yooo what's everyone up to? 👀",
                "Anyone wanna chat? I'm bored fr 😅",
                "What's good in the chat today? 🔥",
                "Aye y'all! How's everyone doing? 💯",
                "Wassup! Just checking in on my people 😎"
            ];

            await channel.send(getRandomElement(greetings));
            log(`Started random conversation in ${guild.name}`, 'info');
        } catch (error) {
            log(`Random conversation error: ${error.message}`, 'error');
        }
    }
}

// Event handlers
client.on('ready', () => {
    log(`🚀 ${config.BOT_NAME} is online and ready!`, 'success');
    log(`Logged in as ${client.user.tag}`, 'info');
    
    PersonalitySystem.updateStatus();
    AutonomousSystem.init();
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    const isDM = message.channel.type === 1;
    const mentionsBot = message.mentions.has(client.user) || content.includes('zolory');

    // Check if bot is sleeping
    if (!botState.isAwake && message.author.id !== config.OWNER_ID) {
        if (mentionsBot || isDM) {
            const sleepResponses = [
                "Zzz... I'm sleeping rn bro, hit me up later 😴",
                "Yo I'm knocked out, try again when I'm awake 💤",
                "Can't talk rn, catching some Z's 😪"
            ];
            return await message.reply(getRandomElement(sleepResponses));
        }
        return;
    }

    try {
        // Handle natural language commands first
        if (mentionsBot || isDM) {
            const commandProcessed = await CommandProcessor.processNaturalCommand(message, content);
            if (commandProcessed) return;
        }

        // Check for number guessing game
        if (!isNaN(parseInt(content)) && await gameSystem.handleNumberGuess(message, content)) {
            return;
        }

        // Handle regular conversation
        if (mentionsBot || isDM || Math.random() < 0.1) { // Random responses to non-mentions
            // Add random emoji reactions
            if (Math.random() < 0.3) {
                const emojis = ['😎', '🔥', '💯', '😤', '👀', '💀', '🤙', '😅'];
                await message.react(getRandomElement(emojis));
            }

            const response = await AISystem.generateResponse(message, message.content);
            
            // Send GIF occasionally
            if (Math.random() < 0.2 && config.GIFS[botState.mood]) {
                const gifUrl = getRandomElement(config.GIFS[botState.mood]);
                await message.reply(`${response}\n${gifUrl}`);
            } else {
                await message.reply(response);
            }

            // Mood changes based on conversation
            if (content.includes('fuck') || content.includes('shit') || content.includes('damn')) {
                if (message.author.id !== config.OWNER_ID && Math.random() < 0.5) {
                    PersonalitySystem.changeMood('annoyed');
                }
            }
        }

    } catch (error) {
        log(`Message handling error: ${error.message}`, 'error');
        if (mentionsBot || isDM) {
            await message.reply(getRandomElement(config.RESPONSES.errorMessages));
        }
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;
    if (customId.startsWith('ttt_')) {
        await handleTicTacToeMove(interaction);
    } else if (customId.startsWith('rps_')) {
        await gameSystem.handleRPS(interaction);
    } else if (customId.startsWith('trivia_')) {
        await gameSystem.handleTrivia(interaction);
    }
});

async function handleTicTacToeMove(interaction) {
    const [, gameId, position] = interaction.customId.split('_');
    const game = botState.games.get(gameId);
    
    if (!game || !game.active || game.playerX !== interaction.user.id) {
        return await interaction.reply({ content: "This isn't your game bro! 😤", ephemeral: true });
    }

    const pos = parseInt(position);
    if (game.board[pos] !== '⬜') {
        return await interaction.reply({ content: "That spot's taken! Pick another one 🙄", ephemeral: true });
    }

    // Player move
    game.board[pos] = '❌';
    
    // Check for win
    if (checkWin(game.board, '❌')) {
        game.active = false;
        const embed = new EmbedBuilder()
            .setTitle('🎮 Tic Tac Toe - You Won!')
            .setDescription(`GG ${interaction.user.displayName}! You beat me 😤\n\n${CommandProcessor.formatTicTacToeBoard(game.board)}`)
            .setColor('#00ff00');
        
        return await interaction.update({ embeds: [embed], components: [] });
    }

    // Check for tie
    if (!game.board.includes('⬜')) {
        game.active = false;
        const embed = new EmbedBuilder()
            .setTitle('🎮 Tic Tac Toe - Tie!')
            .setDescription(`It's a tie! Good game bro 🤝\n\n${CommandProcessor.formatTicTacToeBoard(game.board)}`)
            .setColor('#ffff00');
        
        return await interaction.update({ embeds: [embed], components: [] });
    }

    // Bot move
    const botMove = getBestMove(game.board);
    game.board[botMove] = '⭕';

    // Check if bot wins
    if (checkWin(game.board, '⭕')) {
        game.active = false;
        const embed = new EmbedBuilder()
            .setTitle('🎮 Tic Tac Toe - I Won!')
            .setDescription(`Haha! I got you this time 😎\n\n${CommandProcessor.formatTicTacToeBoard(game.board)}`)
            .setColor('#ff0000');
        
        return await interaction.update({ embeds: [embed], components: [] });
    }

    // Continue game
    const embed = new EmbedBuilder()
        .setTitle('🎮 Tic Tac Toe - Your Turn!')
        .setDescription(`${interaction.user.displayName} vs Zolory\n\n${CommandProcessor.formatTicTacToeBoard(game.board)}`)
        .setColor('#00ff00');

    const buttons = [];
    for (let i = 0; i < 9; i++) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId(`ttt_${gameId}_${i}`)
                .setLabel((i + 1).toString())
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(game.board[i] !== '⬜')
        );
    }

    const rows = [
        new ActionRowBuilder().addComponents(buttons.slice(0, 3)),
        new ActionRowBuilder().addComponents(buttons.slice(3, 6)),
        new ActionRowBuilder().addComponents(buttons.slice(6, 9))
    ];

    await interaction.update({ embeds: [embed], components: rows });
}

function checkWin(board, player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    return winPatterns.some(pattern => 
        pattern.every(index => board[index] === player)
    );
}

function getBestMove(board) {
    // Simple AI: try to win, then block, then random
    const available = board.map((cell, index) => cell === '⬜' ? index : null).filter(val => val !== null);
    
    // Try to win
    for (let move of available) {
        const testBoard = [...board];
        testBoard[move] = '⭕';
        if (checkWin(testBoard, '⭕')) return move;
    }
    
    // Try to block
    for (let move of available) {
        const testBoard = [...board];
        testBoard[move] = '❌';
        if (checkWin(testBoard, '❌')) return move;
    }
    
    // Random move
    return available[Math.floor(Math.random() * available.length)];
}

// Error handling
process.on('unhandledRejection', (error) => {
    log(`Unhandled rejection: ${error.message}`, 'error');
});

process.on('uncaughtException', (error) => {
    log(`Uncaught exception: ${error.message}`, 'error');
});

// Start the bot
client.login(config.BOT_TOKEN).catch(error => {
    log(`Failed to login: ${error.message}`, 'error');
    process.exit(1);
});