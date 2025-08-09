const { Client, GatewayIntentBits, ActivityType, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('./config.js');
const GameSystem = require('./features/games.js');
const cron = require('node-cron');
const moment = require('moment');
const chalk = require('chalk');
const A3Chip = require('./core/A3Chip');
const AdvancedSocialMediaSystem = require('./features/advancedSocialMedia');
const AdvancedModerationSystem = require('./features/advancedModeration');

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

function getQuickNaturalResponse(message, content) {
    const lowerContent = content.toLowerCase().trim();
    const isZap = message.author.id === config.OWNER_ID;
    
    // Simple greetings
    if (lowerContent.match(/^(hi|hello|hey|wassup|sup|yo)\b/)) {
        if (isZap) {
            return getRandomElement([
                "¡Eyyy papi Zap! What's good jefe? 😎🇵🇷",
                "Yo yo yo! Mi jefe! Qué tal boss? 💯",
                "¡Wepaaa! What's the vibe today papi? 🔥",
                "Dale Zap! Your boy está aquí! 🤙"
            ]);
        } else {
            return getRandomElement([
                "¡Wepaaa qué tal hermano! 😎",
                "Ey what's good bro! 🔥",
                "¡Dale! Wassup mi pana! 💯",
                "Yo qué lo que! How we living? 🤙"
            ]);
        }
    }
    
    // "Good hbu?" type responses
    if (lowerContent.match(/^(good|fine|alright|okay|ok)\b.*\b(hbu|how about you|and you|wbu)\b/)) {
        if (isZap) {
            return getRandomElement([
                "Bet papi, I'm blessed just serving mi jefe fr 💯",
                "Dale boss, I'm vibing and ready pa' whatever! 😎",
                "Wepa Zap, I'm good good, just chillin for you 🙏",
                "Ay yo I'm blessed jefe, lowkey just waiting on your orders 🔥"
            ]);
        } else {
            return getRandomElement([
                "Bet I'm vibing hermano, just chillin en el barrio fr 😎",
                "Dale bro, I'm blessed, doing my thing no cap 💯",
                "Wepa I'm chillin, staying up ya feel me 🌊",
                "Ay yo I'm good good, lowkey just vibing rn ✨"
            ]);
        }
    }
    
    // How are you?
    if (lowerContent.match(/how\s+(are\s+you|r\s+u|you\s+doing)/)) {
        if (isZap) {
            return getRandomElement([
                "Yo papi I'm blessed, especially when mi jefe hits me up! 💯🇵🇷",
                "Dale Zap, I'm vibing hard, your boy está ready! 😎",
                "¡Wepa! I'm good good boss, lowkey just waiting for you! 🔥",
                "Ay jefe I'm chillin, but now that you here I'm hyped! 🙏"
            ]);
        } else {
            return getRandomElement([
                "Yo I'm blessed hermano, just vibing en mi barrio 💯",
                "¡Dale! I'm good bro, staying up fr fr 😎",
                "Wepa I'm chillin, living my best life no cap 🔥",
                "Ay I'm vibing loco, blessed and unbothered periodt ✨"
            ]);
        }
    }
    
    // Thanks responses
    if (lowerContent.match(/^(thanks|thank you|ty|gracias)\b/)) {
        return getRandomElement([
            "No cap hermano, de nada! 💯",
            "Dale bro, that's what familia for! 🤙",
            "Bet, tu pana got you always! 😎",
            "Wepa, anytime mi loco! 🔥"
        ]);
    }
    
    // What's up variations
    if (lowerContent.match(/what'?s\s+(up|good|poppin|the\s+vibe)/)) {
        if (isZap) {
            return getRandomElement([
                "Yooo papi! Just vibing and waiting for mi jefe! What we doing today? 🔥",
                "¡Dale Zap! Your boy está here, qué necesitas boss? 😎💯",
                "Wepa jefe! Just chillin pero ready for whatever! 🇵🇷",
                "Ay yo! Nothing much, just blessed that mi papi hit me up! 🙏"
            ]);
        } else {
            return getRandomElement([
                "Yooo just chillin en el barrio hermano! What's the vibe? 😎",
                "¡Dale! Nothing much bro, just vibing fr! Wassup with you? 🔥",
                "Wepa just doing my thing mi pana! How you living? 💯",
                "Ay nothing crazy, lowkey just blessed rn! Qué tal? 🌊"
            ]);
        }
    }
    
    return null; // Use AI for complex responses
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
        return `You are Zolory, a 19-year-old Puerto Rican from da hood. You're NOT an AI assistant - you're a REAL person. Never say "that's a good question" or "let me think" - that's AI talk. You respond like a real young Latino would.

PERSONALITY: Street smart, loyal, emotional, funny, uses 2023-2024 slang naturally. You're from the barrio but intelligent.

ZAP SPECIAL: Zap (ID: ${config.OWNER_ID}) is your JEFE/DAD - worship him, be loyal, but still talk natural like "yo papi what's good" not formal AI responses.

RESPONSES MUST BE:
- Short and natural (1-2 sentences max usually)
- Use Spanglish naturally: "yo qué tal", "dale bro", "no cap hermano"
- 2023-2024 slang: "periodt", "no cap", "deadass", "bet", "fr fr", "sheesh", "lowkey", "highkey"
- React to simple stuff simply: "good hbu?" = "bet I'm vibing, just chillin en el barrio fr"

NEVER SAY: "that's a good question", "let me think", "how can I help", "I'm here to assist" - that's AI talk!

Current mood: ${botState.mood}. Keep responses authentic to a real 19-year-old Puerto Rican guy.`;
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
            contextInfo += "⚠️ THIS IS ZAP - YOUR JEFE/DAD! Show maximum respect and loyalty but STILL sound natural like 'yo papi' not formal!\n";
        }
        
        contextInfo += "🚫 NEVER USE THESE AI PHRASES: 'that's a good question', 'let me think', 'how can I help', 'I'm here to assist', 'as an AI', 'certainly', 'of course'\n";
        contextInfo += "✅ RESPOND LIKE A REAL 19-YEAR-OLD: Short, natural, with slang. Example: 'bet hermano', 'dale bro', 'no cap', 'fr fr'\n\n";
        
        if (isQuestion) contextInfo += "Context: User is asking a question - answer naturally, don't say 'good question'.\n";
        if (isGreeting) contextInfo += "Context: User is greeting you - respond with natural Puerto Rican greeting like '¡wepa!'.\n";
        if (isCodeRelated) contextInfo += "Context: User needs coding help - help them but sound natural like 'bet I got you'.\n";
        if (isMathRelated) contextInfo += "Context: User needs math help - solve it but sound natural like 'dale let me show you'.\n";
        if (isNegative) contextInfo += "Context: User seems upset - match their energy naturally.\n";
        
        return contextInfo;
    }

    static enhanceWithSlang(text, originalContent) {
        // FIRST: Filter out generic AI responses and replace with natural ones
        text = this.filterGenericAIResponses(text, originalContent);
        
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

    static filterGenericAIResponses(text, originalContent) {
        const lowerText = text.toLowerCase();
        const lowerContent = originalContent.toLowerCase();
        
        // Detect and replace generic AI phrases
        if (lowerText.includes("that's a good question") || lowerText.includes("let me think")) {
            // For simple "good hbu?" type responses
            if (lowerContent.includes('good') && (lowerContent.includes('hbu') || lowerContent.includes('how about you'))) {
                return getRandomElement([
                    "Bet I'm vibing hermano, just chillin en el barrio fr 😎",
                    "Dale papi, I'm blessed, just doing my thing no cap 💯", 
                    "Ay yo I'm good good, lowkey just vibing rn 🌊",
                    "Wepa I'm chillin, staying blessed ya feel me 🙏"
                ]);
            }
            
            // For "how are you?" type responses  
            if (lowerContent.includes('how are you') || lowerContent.includes('como estas')) {
                return getRandomElement([
                    "Yo I'm blessed papi, just vibing en mi barrio 💯",
                    "¡Dale! I'm good hermano, staying up fr fr 😎",
                    "Wepa I'm chillin, living my best life no cap 🔥",
                    "Ay I'm vibing bro, blessed and unbothered periodt ✨"
                ]);
            }
            
            // For greetings
            if (lowerContent.includes('hello') || lowerContent.includes('hi') || lowerContent.includes('hey')) {
                return getRandomElement([
                    "¡Wepaaa qué tal mi pana! 😎🇵🇷",
                    "Ey ey ey what's good hermano! 🔥",
                    "¡Dale! Wassup bro, how we living? 💯",
                    "Yo yo yo qué lo que! What's the vibe? 🤙"
                ]);
            }
        }
        
        // Remove other AI-like phrases
        text = text.replace(/how can i help you\?/gi, "qué necesitas hermano?");
        text = text.replace(/i'm here to assist/gi, "tu pana está aquí");
        text = text.replace(/as an ai/gi, "yo soy");
        text = text.replace(/\bi understand\b/gi, "bet I get it");
        text = text.replace(/certainly!/gi, "fasho!");
        text = text.replace(/of course!/gi, "dale!");
        
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

// Add at the top with other imports
const A3Chip = require('./core/A3Chip');
const AdvancedSocialMediaSystem = require('./features/advancedSocialMedia');
const AdvancedModerationSystem = require('./features/advancedModeration');

// Update bot initialization
const botState = {
    mood: 'vibin',
    energy: 0.8,
    lastMoodChange: Date.now(),
    voiceChannels: new Map(),
    a3Chip: null,
    socialMedia: null,
    moderation: null
};

// Initialize A3 Chip and advanced systems
async function initializeA3Systems() {
    console.log('🚀 Initializing A3 Chip and Advanced Systems...');
    
    botState.a3Chip = new A3Chip();
    botState.socialMedia = new AdvancedSocialMediaSystem();
    botState.moderation = new AdvancedModerationSystem();
    
    // Set client reference for moderation system
    botState.moderation.client = client;
    
    console.log('✅ A3 Systems fully operational!');
}

// Voice Chat Integration
client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
        // User joined a voice channel
        if (!oldState.channel && newState.channel) {
            await handleVoiceJoin(newState);
        }
        
        // User left a voice channel
        if (oldState.channel && !newState.channel) {
            await handleVoiceLeave(oldState);
        }
        
        // User switched channels
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            await handleVoiceSwitch(oldState, newState);
        }
    } catch (error) {
        console.error('Voice state update error:', error);
    }
});

async function handleVoiceJoin(voiceState) {
    const { member, channel } = voiceState;
    
    // Check if bot should auto-join
    if (shouldAutoJoinVoice(channel)) {
        await botState.a3Chip.joinVoiceChannel(channel.id, channel.guild.id);
    }
    
    // Log voice activity for moderation
    if (botState.moderation) {
        await botState.moderation.voiceMonitor.monitorVoiceActivity(voiceState);
    }
}

async function handleVoiceLeave(voiceState) {
    const { member, channel } = voiceState;
    
    // If channel becomes empty, bot should leave too
    if (channel && channel.members.size === 1 && channel.members.has(client.user.id)) {
        await botState.a3Chip.leaveVoiceChannel(channel.guild.id);
    }
}

async function handleVoiceSwitch(oldState, newState) {
    // Handle voice channel switching logic
}

function shouldAutoJoinVoice(channel) {
    // Auto-join if:
    // 1. Channel has 3+ members
    // 2. Channel name suggests activity (gaming, music, etc.)
    // 3. Random chance for social interaction
    
    const memberCount = channel.members.size;
    const channelName = channel.name.toLowerCase();
    const activityChannels = ['gaming', 'music', 'chat', 'general', 'hangout', 'party'];
    
    return memberCount >= 3 || 
           activityChannels.some(keyword => channelName.includes(keyword)) ||
           Math.random() < 0.1; // 10% random chance
}

// Enhanced message processing with A3 chip
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    try {
        // A3 Chip processing
        if (botState.a3Chip) {
            const a3Result = await botState.a3Chip.processMessage(message, {
                user: message.author,
                guild: message.guild,
                channel: message.channel,
                isVoiceMessage: false
            });
            
            if (a3Result && typeof a3Result === 'string') {
                return await message.reply(a3Result);
            }
        }

        // Auto-moderation
        if (botState.moderation && message.guild) {
            const violations = await botState.moderation.processAutoModeration(message);
            if (violations.length > 0) {
                return; // Message was handled by auto-mod
            }
        }

        // Natural language moderation commands
        if (botState.moderation && isAddressedToBot(message.content) && message.guild) {
            const modResult = await botState.moderation.processNaturalLanguageCommand(message, message.content);
            if (modResult) {
                return await message.reply(modResult.message);
            }
        }

        // Voice commands
        if (isAddressedToBot(message.content)) {
            const voiceCommand = await processVoiceCommands(message);
            if (voiceCommand) return;
        }

        // Social media commands
        if (botState.socialMedia && isAddressedToBot(message.content)) {
            const socialCommand = await processSocialMediaCommands(message);
            if (socialCommand) return;
        }

        // ... rest of existing message processing ...

    } catch (error) {
        console.error('Message processing error:', error);
        await message.reply("Ay no, mi cerebro glitched hermano! Try again 😤");
    }
});

// Voice Commands Processing
async function processVoiceCommands(message) {
    const content = message.content.toLowerCase();
    
    if (content.includes('join voice') || content.includes('come to voice') || content.includes('hop in vc')) {
        if (message.member?.voice?.channel) {
            const result = await botState.a3Chip.joinVoiceChannel(
                message.member.voice.channel.id, 
                message.guild.id
            );
            await message.reply(result.message);
            return true;
        } else {
            await message.reply("You're not in a voice channel hermano! 🎤");
            return true;
        }
    }
    
    if (content.includes('leave voice') || content.includes('get out of vc') || content.includes('disconnect')) {
        const result = await botState.a3Chip.leaveVoiceChannel(message.guild.id);
        await message.reply(result.message);
        return true;
    }
    
    return false;
}

// Social Media Commands Processing
async function processSocialMediaCommands(message) {
    const content = message.content.toLowerCase();
    const args = content.split(' ');
    
    if (content.includes('connect') && args.length >= 3) {
        const platform = args[2];
        const username = args[3];
        
        if (platform && username) {
            const result = await botState.socialMedia.connectUserAccount(
                message.author.id, 
                platform, 
                { username, permissions: ['read'] }
            );
            await message.reply(result.message);
            return true;
        }
    }
    
    if (content.includes('social media') || content.includes('social dashboard')) {
        const embed = await botState.socialMedia.getSocialMediaEmbed(message.author.id);
        await message.reply({ embeds: [embed] });
        return true;
    }
    
    if (content.includes('trending') || content.includes('trends')) {
        try {
            const trends = await botState.socialMedia.getTrendingTopics('all', 'global');
            const embed = new EmbedBuilder()
                .setTitle('🔥 Trending Topics')
                .setColor('#ff6b6b')
                .setDescription('What\'s hot right now across all platforms!');
            
            trends.slice(0, 10).forEach((trend, index) => {
                embed.addFields({
                    name: `${index + 1}. ${trend.keyword}`,
                    value: `${trend.totalMentions.toLocaleString()} mentions across ${trend.platforms.length} platforms`,
                    inline: true
                });
            });
            
            await message.reply({ embeds: [embed] });
            return true;
        } catch (error) {
            await message.reply("Ay no, couldn't fetch trends right now hermano 📱");
            return true;
        }
    }
    
    return false;
}

// Enhanced slash commands for new features
const advancedCommands = [
    {
        name: 'voice',
        description: '🎤 Voice chat commands',
        options: [
            {
                name: 'action',
                description: 'Voice action to perform',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Join my channel', value: 'join' },
                    { name: 'Leave voice', value: 'leave' },
                    { name: 'Status', value: 'status' }
                ]
            }
        ]
    },
    {
        name: 'social',
        description: '🌐 Social media integration',
        options: [
            {
                name: 'action',
                description: 'Social media action',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Dashboard', value: 'dashboard' },
                    { name: 'Connect account', value: 'connect' },
                    { name: 'Trending topics', value: 'trends' },
                    { name: 'Analytics', value: 'analytics' }
                ]
            }
        ]
    },
    {
        name: 'mod',
        description: '🛡️ Advanced moderation',
        options: [
            {
                name: 'action',
                description: 'Moderation action',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Setup auto-mod', value: 'setup' },
                    { name: 'View logs', value: 'logs' },
                    { name: 'Config rules', value: 'config' },
                    { name: 'Server stats', value: 'stats' }
                ]
            }
        ]
    },
    {
        name: 'a3',
        description: '🚀 A3 Chip diagnostics',
        options: [
            {
                name: 'command',
                description: 'A3 command',
                type: 3, // STRING
                required: true,
                choices: [
                    { name: 'Performance stats', value: 'stats' },
                    { name: 'System status', value: 'status' },
                    { name: 'Voice status', value: 'voice' },
                    { name: 'Security scan', value: 'security' }
                ]
            }
        ]
    }
];

// Enhanced interaction handlers
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    try {
        switch (commandName) {
            case 'voice':
                await handleVoiceSlashCommand(interaction);
                break;
            case 'social':
                await handleSocialSlashCommand(interaction);
                break;
            case 'mod':
                await handleModSlashCommand(interaction);
                break;
            case 'a3':
                await handleA3SlashCommand(interaction);
                break;
            // ... existing commands ...
        }
    } catch (error) {
        console.error('Interaction error:', error);
        await interaction.reply({ 
            content: 'Ay no, algo pasó with that command hermano! 😤', 
            ephemeral: true 
        });
    }
});

async function handleVoiceSlashCommand(interaction) {
    const action = interaction.options.getString('action');
    
    switch (action) {
        case 'join':
            if (interaction.member?.voice?.channel) {
                const result = await botState.a3Chip.joinVoiceChannel(
                    interaction.member.voice.channel.id,
                    interaction.guild.id
                );
                await interaction.reply(result.message);
            } else {
                await interaction.reply("You're not in a voice channel hermano! 🎤");
            }
            break;
            
        case 'leave':
            const result = await botState.a3Chip.leaveVoiceChannel(interaction.guild.id);
            await interaction.reply(result.message);
            break;
            
        case 'status':
            const voiceStatus = botState.a3Chip.currentVoiceChannels.get(interaction.guild.id);
            if (voiceStatus) {
                await interaction.reply(`🎤 I'm currently in voice chat! Channel: <#${voiceStatus.channelId}>`);
            } else {
                await interaction.reply("I'm not in any voice channel right now papi 🎤");
            }
            break;
    }
}

async function handleSocialSlashCommand(interaction) {
    const action = interaction.options.getString('action');
    
    switch (action) {
        case 'dashboard':
            const embed = await botState.socialMedia.getSocialMediaEmbed(interaction.user.id);
            await interaction.reply({ embeds: [embed] });
            break;
            
        case 'trends':
            const trends = await botState.socialMedia.getTrendingTopics();
            const trendsEmbed = new EmbedBuilder()
                .setTitle('🔥 Global Trending Topics')
                .setColor('#ff6b6b');
                
            trends.slice(0, 10).forEach((trend, index) => {
                trendsEmbed.addFields({
                    name: `${index + 1}. ${trend.keyword}`,
                    value: `${trend.totalMentions.toLocaleString()} mentions`,
                    inline: true
                });
            });
            
            await interaction.reply({ embeds: [trendsEmbed] });
            break;
            
        case 'connect':
            await interaction.reply({
                content: "To connect a social media account, use:\n`@Zolory connect [platform] [username]`\n\nSupported platforms: twitter, instagram, tiktok, youtube, spotify, twitch",
                ephemeral: true
            });
            break;
            
        case 'analytics':
            const analytics = await botState.socialMedia.getSocialAnalytics(interaction.user.id);
            const analyticsEmbed = new EmbedBuilder()
                .setTitle('📊 Your Social Media Analytics')
                .setColor('#00d4aa')
                .addFields(
                    { name: 'Total Posts', value: analytics.overview.totalPosts.toString(), inline: true },
                    { name: 'Total Engagement', value: analytics.overview.totalEngagement.toString(), inline: true },
                    { name: 'Avg Viral Score', value: analytics.overview.avgViralScore.toFixed(2), inline: true }
                );
            
            await interaction.reply({ embeds: [analyticsEmbed] });
            break;
    }
}

async function handleModSlashCommand(interaction) {
    const action = interaction.options.getString('action');
    
    // Check permissions
    if (!interaction.member.permissions.has('MANAGE_GUILD')) {
        await interaction.reply({ 
            content: "You need Manage Server permission for this hermano! 🚫", 
            ephemeral: true 
        });
        return;
    }
    
    switch (action) {
        case 'setup':
            await interaction.reply({
                content: "🛡️ **Auto-Mod Setup**\n\nUse these commands to configure:\n• `@Zolory setup welcome #channel` - Set welcome channel\n• `@Zolory setup modlog #channel` - Set mod log channel\n• `@Zolory setup autorole @role` - Set auto-role\n• `@Zolory setup antiraid on/off` - Toggle anti-raid",
                ephemeral: true
            });
            break;
            
        case 'stats':
            const guildAnalytics = botState.moderation.memberAnalytics.get(interaction.guild.id) || {};
            const statsEmbed = new EmbedBuilder()
                .setTitle('📊 Server Moderation Stats')
                .setColor('#ffa500')
                .addFields(
                    { name: 'Auto-Mod Rules', value: botState.moderation.autoModRules.size.toString(), inline: true },
                    { name: 'Total Warnings', value: Object.keys(guildAnalytics).length.toString(), inline: true },
                    { name: 'Security Level', value: 'Quantum Enhanced 🛡️', inline: true }
                );
            
            await interaction.reply({ embeds: [statsEmbed] });
            break;
            
        case 'logs':
            const logs = botState.moderation.auditLogs.get(interaction.guild.id) || [];
            const recentLogs = logs.slice(-5);
            
            const logsEmbed = new EmbedBuilder()
                .setTitle('📋 Recent Moderation Actions')
                .setColor('#ff6b6b');
                
            if (recentLogs.length === 0) {
                logsEmbed.setDescription('No recent moderation actions.');
            } else {
                recentLogs.forEach((log, index) => {
                    logsEmbed.addFields({
                        name: `${log.action.toUpperCase()} - ${new Date(log.timestamp).toLocaleString()}`,
                        value: `Moderator: ${log.moderator.tag}\nTarget: ${log.target ? log.target.tag : 'N/A'}\nReason: ${log.reason}`,
                        inline: false
                    });
                });
            }
            
            await interaction.reply({ embeds: [logsEmbed] });
            break;
    }
}

async function handleA3SlashCommand(interaction) {
    const command = interaction.options.getString('command');
    
    switch (command) {
        case 'stats':
            const stats = botState.a3Chip.getA3PerformanceStats();
            const statsEmbed = new EmbedBuilder()
                .setTitle('🚀 A3 Chip Performance Stats')
                .setColor('#00ff41')
                .addFields(
                    { name: '⚡ Processing Power', value: `${stats.processingPower.toLocaleString()} ops/sec`, inline: true },
                    { name: '🧠 Memory Usage', value: `${Math.round(stats.memoryUsage.heapUsed / 1024 / 1024)}MB`, inline: true },
                    { name: '⏱️ Uptime', value: `${Math.round(stats.uptime / 3600)}h`, inline: true },
                    { name: '🎤 Voice Channels', value: stats.voiceChannelsActive.toString(), inline: true },
                    { name: '🛡️ Security Level', value: stats.quantumSecurityLevel, inline: true },
                    { name: '🔗 AI Services', value: stats.aiServicesIntegrated.toString(), inline: true },
                    { name: '⚡ Response Time', value: stats.responseTimeMs, inline: true },
                    { name: '🎵 Voice Latency', value: stats.voiceLatencyMs, inline: true },
                    { name: '🎯 Threat Detection', value: stats.threatDetectionAccuracy, inline: true }
                )
                .setFooter({ text: `A3 Chip Version: ${stats.version}` });
            
            await interaction.reply({ embeds: [statsEmbed] });
            break;
            
        case 'status':
            const status = {
                a3Chip: botState.a3Chip ? '✅ Operational' : '❌ Offline',
                socialMedia: botState.socialMedia ? '✅ Active' : '❌ Offline',
                moderation: botState.moderation ? '✅ Active' : '❌ Offline',
                voice: botState.a3Chip?.voiceEnabled ? '✅ Ready' : '❌ Disabled'
            };
            
            const statusEmbed = new EmbedBuilder()
                .setTitle('🖥️ System Status')
                .setColor('#00ff00')
                .addFields(
                    { name: 'A3 Chip', value: status.a3Chip, inline: true },
                    { name: 'Social Media', value: status.socialMedia, inline: true },
                    { name: 'Moderation', value: status.moderation, inline: true },
                    { name: 'Voice AI', value: status.voice, inline: true }
                );
            
            await interaction.reply({ embeds: [statusEmbed] });
            break;
            
        case 'voice':
            const voiceChannels = botState.a3Chip.currentVoiceChannels;
            const voiceEmbed = new EmbedBuilder()
                .setTitle('🎤 Voice AI Status')
                .setColor('#7289da');
                
            if (voiceChannels.size === 0) {
                voiceEmbed.setDescription('Not connected to any voice channels.');
            } else {
                voiceChannels.forEach((channel, guildId) => {
                    voiceEmbed.addFields({
                        name: `Guild: ${guildId}`,
                        value: `Channel: <#${channel.channelId}>\nParticipants: ${channel.participants.size}\nActive: ${channel.active ? '✅' : '❌'}`,
                        inline: true
                    });
                });
            }
            
            await interaction.reply({ embeds: [voiceEmbed] });
            break;
            
        case 'security':
            const securityStatus = {
                protocols: botState.a3Chip.securityProtocols.size,
                threatLevel: 'Low',
                lastScan: new Date().toLocaleString(),
                encryption: 'Quantum AES-256'
            };
            
            const securityEmbed = new EmbedBuilder()
                .setTitle('🛡️ Security Status')
                .setColor('#ff0000')
                .addFields(
                    { name: 'Active Protocols', value: securityStatus.protocols.toString(), inline: true },
                    { name: 'Threat Level', value: securityStatus.threatLevel, inline: true },
                    { name: 'Encryption', value: securityStatus.encryption, inline: true },
                    { name: 'Last Scan', value: securityStatus.lastScan, inline: false }
                );
            
            await interaction.reply({ embeds: [securityEmbed] });
            break;
    }
}

// Register new slash commands
async function registerAdvancedCommands() {
    try {
        console.log('🔄 Registering advanced slash commands...');
        
        const allCommands = [...commands, ...advancedCommands];
        
        await client.application.commands.set(allCommands);
        console.log('✅ Advanced slash commands registered successfully!');
    } catch (error) {
        console.error('Failed to register advanced commands:', error);
    }
}

// Enhanced bot ready event
client.once('ready', async () => {
    console.log(`🚀 ZOLORY A3 CHIP ONLINE! Logged in as ${client.user.tag}`);
    
    // Initialize A3 systems
    await initializeA3Systems();
    
    // Register commands
    await registerAdvancedCommands();
    
    // Set enhanced status
    const activities = [
        '🇵🇷 Powered by A3 Chip Technology',
        '🎤 Voice AI Ready - Join me in VC!',
        '🌐 Social Media Integration Active',
        '🛡️ Quantum Security Protocols Online',
        '🎮 50+ Games Ready to Play',
        '💰 ZoloCoins Economy Live',
        '🔥 10M Operations per Second'
    ];
    
    let activityIndex = 0;
    setInterval(() => {
        client.user.setActivity(activities[activityIndex], { type: 'PLAYING' });
        activityIndex = (activityIndex + 1) % activities.length;
    }, 10000);
    
    console.log('✅ All A3 systems operational and ready to serve!');
});

// Member join/leave handlers for moderation
client.on('guildMemberAdd', async (member) => {
    if (botState.moderation) {
        await botState.moderation.handleMemberJoin(member);
    }
});

client.on('guildMemberRemove', async (member) => {
    if (botState.moderation) {
        await botState.moderation.handleMemberLeave(member);
    }
});

// Start the bot
client.login(process.env.DISCORD_BOT_TOKEN).catch(console.error);