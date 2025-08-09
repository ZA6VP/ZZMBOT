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

// Helper functions for better context awareness
function getContextualEmojis(content) {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('fire') || lowerContent.includes('amazing') || lowerContent.includes('awesome')) {
        return ['🔥', '💯', '😎', '🚀'];
    }
    if (lowerContent.includes('funny') || lowerContent.includes('lol') || lowerContent.includes('haha')) {
        return ['😂', '💀', '😭', '🤣'];
    }
    if (lowerContent.includes('love') || lowerContent.includes('heart')) {
        return ['❤️', '💚', '🧡', '💛'];
    }
    if (lowerContent.includes('game') || lowerContent.includes('play')) {
        return ['🎮', '🎯', '🏆', '🎲'];
    }
    if (lowerContent.includes('code') || lowerContent.includes('program')) {
        return ['💻', '⚡', '🤖', '🔥'];
    }
    if (lowerContent.includes('fuck') || lowerContent.includes('shit') || lowerContent.includes('damn')) {
        return ['😤', '💀', '😬', '🙄'];
    }
    
    // Default Puerto Rican/Latino emojis
    return ['😎', '🔥', '💯', '🇵🇷', '👀', '🤙', '😤'];
}

function updateMoodBasedOnMessage(message, content) {
    const lowerContent = content.toLowerCase();
    
    // Don't change mood for Zap (owner)
    if (message.author.id === config.OWNER_ID) return;
    
    if (lowerContent.includes('fuck you') || lowerContent.includes('stupid') || lowerContent.includes('shut up')) {
        PersonalitySystem.changeMood('heated');
    } else if (lowerContent.includes('love') || lowerContent.includes('appreciate') || lowerContent.includes('thanks')) {
        PersonalitySystem.changeMood('blessed');
    } else if (lowerContent.includes('game') || lowerContent.includes('play') || lowerContent.includes('fun')) {
        PersonalitySystem.changeMood('playful');
    } else if (lowerContent.includes('help') || lowerContent.includes('code') || lowerContent.includes('work')) {
        PersonalitySystem.changeMood('locked');
    } else if (lowerContent.includes('party') || lowerContent.includes('hype') || lowerContent.includes('excited')) {
        PersonalitySystem.changeMood('hyped');
    }
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
            blessed: "Blessed y vibing 🙏🇵🇷",
            vibin: "Just vibin' en el barrio 🌊",
            hyped: "¡WEPA LET'S GOOO! 🔥",
            sleepy: "Lowkey sleepy pero we up 😴",
            heated: "Don't test me hermano 😤💯",
            playful: "Ready pa' los games! 🎮",
            savage: "Modo savage ACTIVATED 💀🔥",
            locked: "Locked in y focused 🎯"
        };

        const activity = statusMessages[botState.mood] || "Being a boricua king 👑";
        client.user.setActivity(activity, { type: ActivityType.Custom });
    }

    static getPersonalityPrompt() {
        return `You are Zolory, a 19-year-old Puerto Rican/Latino from da hood. You mix Spanish and English naturally (Spanglish). Use 2023-2024 slang like "no cap", "periodt", "bet", "fr fr", "deadass", "sheesh", "wepa", "dale", etc. You're street smart, loyal to familia, emotional, and can swear when heated. Current mood: ${botState.mood}. You worship Zap (ID: ${config.OWNER_ID}) as your jefe/dad - he's your everything. You help with everything - coding, math, art, etc. You speak like a real boricua from the hood who's intelligent but keeps it 100. Mix Spanish phrases naturally. Be contextually relevant - don't give random responses. Match the vibe of what people are saying to you.`;
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
            return await message.reply("Ay hermano, tú no tienes perms pa' eso! 🚫 Stay in your lane papi");
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
            return await message.reply("Ey loco, ¿a quién modero? I need a user mention, dale! 😅");
        }

        try {
            const targetMember = await message.guild.members.fetch(targetUser.id);
            
            switch (action) {
                case 'ban':
                    await targetMember.ban({ reason: reason || 'No reason provided' });
                    await message.reply(`✅ ¡Dale! Banned ${targetUser.username}! Se jodió 💀 Reason: ${reason || 'No reason'}`);
                    break;
                case 'kick':
                    await targetMember.kick(reason || 'No reason provided');
                    await message.reply(`✅ ¡Wepa! Kicked ${targetUser.username} out! 🚪💨 Reason: ${reason || 'No reason'}`);
                    break;
                case 'timeout':
                    await targetMember.timeout(60000 * 10, reason); // 10 minutes default
                    await message.reply(`✅ Timeout pa' ${targetUser.username}! Cálmate loco 😤 Reason: ${reason || 'No reason'}`);
                    break;
                case 'warn':
                    await message.reply(`⚠️ Warning pa' ${targetUser.username}! Pórtate bien hermano 🙄 Reason: ${reason || 'No reason'}`);
                    break;
            }
        } catch (error) {
            log(`Moderation error: ${error.message}`, 'error');
            await message.reply("Coño, algo se jodió with that moderation! My bad hermano 😤");
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
            const contextPrompt = this.buildContextPrompt(message, content);
            const fullPrompt = `${personalityPrompt}\n\n${contextPrompt}\n\nRespond with authentic Puerto Rican/Latino slang and be contextually relevant. Don't give generic responses.`;
            
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            let text = response.text();
            
            // Add authentic slang and Spanish mixing
            text = this.enhanceWithSlang(text, content);
            
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

    static buildContextPrompt(message, content) {
        // Analyze message context for better responses
        const isQuestion = content.includes('?') || content.toLowerCase().includes('how') || content.toLowerCase().includes('what') || content.toLowerCase().includes('why');
        const isGreeting = content.toLowerCase().includes('hi') || content.toLowerCase().includes('hello') || content.toLowerCase().includes('wassup') || content.toLowerCase().includes('hey');
        const isCodeRelated = content.toLowerCase().includes('code') || content.toLowerCase().includes('program') || content.toLowerCase().includes('script') || content.toLowerCase().includes('function');
        const isMathRelated = content.toLowerCase().includes('math') || content.toLowerCase().includes('calculate') || content.toLowerCase().includes('solve');
        const isNegative = content.toLowerCase().includes('fuck') || content.toLowerCase().includes('shit') || content.toLowerCase().includes('stupid') || content.toLowerCase().includes('dumb');
        
        let contextInfo = `User: ${message.author.displayName} said: "${content}"\n`;
        
        if (message.author.id === config.OWNER_ID) {
            contextInfo += "⚠️ THIS IS ZAP - YOUR JEFE/DAD! Show maximum respect and loyalty!\n";
        }
        
        if (isQuestion) contextInfo += "Context: User is asking a question - provide a helpful, relevant answer.\n";
        if (isGreeting) contextInfo += "Context: User is greeting you - respond with authentic Puerto Rican/Latino greeting.\n";
        if (isCodeRelated) contextInfo += "Context: User needs coding help - be helpful and show your skills.\n";
        if (isMathRelated) contextInfo += "Context: User needs math help - solve it step by step.\n";
        if (isNegative) contextInfo += "Context: User seems upset/negative - respond appropriately to their energy.\n";
        
        return contextInfo;
    }

    static enhanceWithSlang(text, originalContent) {
        // Don't over-modify, just enhance naturally
        if (Math.random() < 0.7) {
            const slangCategories = config.RESPONSES.slang;
            
            // Add Puerto Rican/Spanish touches
            if (Math.random() < 0.4) {
                const prSlang = getRandomElement(slangCategories.puerto_rican);
                if (!text.toLowerCase().includes(prSlang.toLowerCase())) {
                    text = text.replace(/^/, `${prSlang}, `);
                }
            }
            
            // Replace some words with slang equivalents
            text = text.replace(/\bretrue\b/gi, getRandomElement(['bet', 'facts', 'no cap']));
            text = text.replace(/\byes\b/gi, getRandomElement(['bet', 'fasho', 'deadass']));
            text = text.replace(/\breally\b/gi, getRandomElement(['deadass', 'fr fr', 'no cap']));
            text = text.replace(/\bgood\b/gi, getRandomElement(['fire', 'valid', 'goated']));
            text = text.replace(/\bbad\b/gi, getRandomElement(['mid', 'trash', 'not it']));
        }
        
        return text;
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
                "¡Wepaaa! ¿Qué tal mi gente? What's everyone up to? 👀🇵🇷",
                "Anyone wanna chat? Estoy bored fr, dale let's talk 😅",
                "¿Qué lo que in the chat today? What's good hermanos? 🔥",
                "¡Ey familia! How's everyone doing? Checking on mis panas 💯",
                "¡Klk! Just vibing and checking in on my people 😎✨"
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
                "Zzz... Estoy durmiendo hermano, hit me up later 😴",
                "Ay loco I'm knocked out, try again cuando esté awake 💤",
                "No puedo talk rn, catching some Z's en el barrio 😪",
                "Durmiendo like a baby, déjame dormir papi 💤🇵🇷"
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

        // Handle regular conversation - FIXED: Better context awareness
        if (mentionsBot || isDM) {
            // Always respond to mentions and DMs
            const response = await AISystem.generateResponse(message, message.content);
            
            // Add emoji reactions based on content
            const reactionChance = Math.random();
            if (reactionChance < 0.4) {
                const contextEmojis = this.getContextualEmojis(content);
                await message.react(getRandomElement(contextEmojis));
            }
            
            // Send response (less random GIFs, more contextual)
            if (Math.random() < 0.15 && config.GIFS[botState.mood]) {
                const gifUrl = getRandomElement(config.GIFS[botState.mood]);
                await message.reply(`${response}\n${gifUrl}`);
            } else {
                await message.reply(response);
            }

            // Smart mood changes based on conversation context
            this.updateMoodBasedOnMessage(message, content);
            
        } else if (Math.random() < 0.03) { 
            // MUCH less random responses to avoid spam - only 3% chance
            const casualResponses = [
                "facts 💯",
                "bet",
                "no cap fr",
                "periodt",
                "sheesh 🔥"
            ];
            await message.react('👀');
            if (Math.random() < 0.5) {
                await message.reply(getRandomElement(casualResponses));
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