const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        const { client, author, content, guild, channel } = message;

        // Ignore bot messages
        if (author.bot) return;

        // Check if bot is asleep
        if (client.botState && !client.botState.isAwake) {
            // Only respond to owner or urgent messages when asleep
            if (author.id !== client.config.ownerId && !content.toLowerCase().includes('wake')) {
                return;
            }
        }

        // Update bot stats
        if (client.botState) {
            client.botState.stats.messagesProcessed++;
            client.botState.lastActivity = Date.now();
        }

        // Check if message mentions Zolory or contains his name
        const isMentioned = message.mentions.users.has(client.user.id) || 
                           content.toLowerCase().includes('zolory') ||
                           content.toLowerCase().includes('@zolory');

        // Handle commands
        if (content.startsWith(client.config.prefix)) {
            await handleCommand(message);
            return;
        }

        // Handle natural language interactions
        if (isMentioned || Math.random() < 0.1) { // 10% chance to respond to non-mentions
            await handleNaturalLanguage(message);
            return;
        }

        // Handle moderation commands in natural language
        if (await handleNaturalModeration(message)) {
            return;
        }

        // Handle game interactions
        if (await handleGameInteraction(message)) {
            return;
        }
    }
};

async function handleCommand(message) {
    const { client, content, author, guild, channel } = message;
    const args = content.slice(client.config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || 
                   client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    try {
        await command.execute(message, args);
        client.logger.logCommand(author, commandName, guild, channel);
    } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        await message.reply("Yo, something went wrong with that command! My brain's lagging rn 😅");
    }
}

async function handleNaturalLanguage(message) {
    const { client, content, author, guild, channel } = message;
    
    // Check for rude behavior
    const isRude = client.emotionManager.isRudeMessage(content.toLowerCase());
    
    if (isRude) {
        const rudeResponse = client.emotionManager.getEmotionalResponse(content, true);
        await message.reply(rudeResponse);
        return;
    }

    // Generate AI response
    try {
        const context = {
            mood: client.botState.currentMood,
            user: author.displayName,
            guild: guild?.name,
            channel: channel?.name
        };

        const aiResponse = await client.zoloryAI.generateResponse(content, context);
        
        // Add emoji and GIF if appropriate
        const emoji = client.gifManager.getMoodEmoji(client.botState.currentMood);
        const response = `${emoji} **${author.displayName}**, ${aiResponse}`;
        
        await message.reply(response);

        // Occasionally send a GIF
        if (Math.random() < 0.3) {
            const gif = await client.gifManager.getGif('default', client.botState.currentMood);
            await message.channel.send(gif);
        }

    } catch (error) {
        console.error('Error generating AI response:', error);
        await message.reply("Yo, my brain's lagging rn 😅 Can you run that back?");
    }
}

async function handleNaturalModeration(message) {
    const { client, content, author, guild, channel } = message;
    
    const moderationPatterns = [
        /(?:yo\s+)?zolory\s+(ban|kick|timeout|warn|mute)\s+(\w+)(?:\s+for\s+(\w+))?(?:\s+because\s+(.+))?/i,
        /(?:yo\s+)?zolory\s+(ban|kick|timeout|warn|mute)\s+(\w+)(?:\s+(\w+))?(?:\s+(.+))?/i,
        /(?:yo\s+)?zolory\s+(unban|untimeout)\s+(\w+)(?:\s+(.+))?/i
    ];

    for (const pattern of moderationPatterns) {
        const match = content.match(pattern);
        if (match) {
            const [, action, target, duration, reason] = match;
            const args = [action, target];
            
            if (duration && !reason) {
                args.push(duration);
            } else if (duration && reason) {
                args.push(duration, reason);
            } else if (reason) {
                args.push(reason);
            }

            const result = await client.moderationManager.handleModerationCommand(message, args);
            if (result.success) {
                await message.reply(result.message);
                if (result.embed) {
                    await message.channel.send({ embeds: [result.embed] });
                }
            } else {
                await message.reply(result.message);
            }
            return true;
        }
    }
    return false;
}

async function handleGameInteraction(message) {
    const { client, content, author, guild, channel } = message;
    
    const gamePatterns = [
        /(?:yo\s+)?zolory\s+(?:lets?\s+)?play\s+(tictactoe|hangman|trivia|rps)(?:\s+(.+))?/i,
        /(?:yo\s+)?zolory\s+(?:wanna\s+)?play\s+(tictactoe|hangman|trivia|rps)(?:\s+(.+))?/i
    ];

    for (const pattern of gamePatterns) {
        const match = content.match(pattern);
        if (match) {
            const [, gameType, options] = match;
            const result = await client.gameManager.startGame(gameType, channel, author);
            
            if (result.success) {
                await message.reply(result.message);
            } else {
                await message.reply(result.message);
            }
            return true;
        }
    }

    // Handle game moves
    const gameId = `${channel.id}-${author.id}`;
    const activeGames = client.gameManager.getActiveGames();
    const userGame = activeGames.find(([id, game]) => id.startsWith(gameId));
    
    if (userGame) {
        const [gameId, game] = userGame;
        const result = await client.gameManager.handleGameMove(gameId, author, content);
        
        if (result.success) {
            await message.reply(result.message);
            return true;
        }
    }

    return false;
}