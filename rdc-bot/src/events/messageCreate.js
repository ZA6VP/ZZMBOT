const { PermissionFlagsBits } = require('discord.js');
const User = require('../utils/database').User;
const ms = require('ms');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        // Ignore bots
        if (message.author.bot) return;
        
        // XP System (for guild messages only)
        if (message.guild) {
            const xpCooldowns = client.cooldowns.get('xp') || new Map();
            const now = Date.now();
            const cooldownAmount = (client.config.xp.cooldown || 60) * 1000;
            
            if (!xpCooldowns.has(message.author.id) || now - xpCooldowns.get(message.author.id) > cooldownAmount) {
                // Award XP
                const xpToAdd = Math.floor(Math.random() * (client.config.xp.maxXp - client.config.xp.minXp + 1)) + client.config.xp.minXp;
                
                try {
                    const user = await User.findOneAndUpdate(
                        { userId: message.author.id, guildId: message.guild.id },
                        { 
                            $inc: { xp: xpToAdd, messages: 1 },
                            $set: { username: message.author.username }
                        },
                        { upsert: true, new: true }
                    );
                    
                    // Check for level up
                    const oldLevel = Math.floor(0.1 * Math.sqrt(user.xp - xpToAdd));
                    const newLevel = Math.floor(0.1 * Math.sqrt(user.xp));
                    
                    if (newLevel > oldLevel) {
                        user.level = newLevel;
                        await user.save();
                        
                        // Send level up message
                        const levelUpEmbed = {
                            color: 0x00ff00,
                            title: '🎉 Level Up!',
                            description: `Congratulations ${message.author}! You've reached level **${newLevel}**!`,
                            timestamp: new Date(),
                            footer: { text: 'Keep chatting to level up!' }
                        };
                        
                        message.channel.send({ embeds: [levelUpEmbed] }).catch(() => {});
                        
                        // Award level roles
                        if (client.config.levelUpRole[newLevel]) {
                            const roleName = client.config.levelUpRole[newLevel];
                            const role = message.guild.roles.cache.find(r => r.name === roleName);
                            if (role && message.member) {
                                message.member.roles.add(role).catch(() => {});
                            }
                        }
                    }
                    
                    xpCooldowns.set(message.author.id, now);
                    client.cooldowns.set('xp', xpCooldowns);
                } catch (error) {
                    console.error('XP system error:', error);
                }
            }
        }
        
        // Auto-moderation
        if (message.guild && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            // Bad word filter
            const badWords = client.config.automod.badWords || [];
            const containsBadWord = badWords.some(word => 
                message.content.toLowerCase().includes(word.toLowerCase())
            );
            
            if (containsBadWord) {
                await message.delete().catch(() => {});
                const warnEmbed = {
                    color: 0xff0000,
                    title: '⚠️ Warning',
                    description: 'Your message was deleted for containing inappropriate content.',
                    timestamp: new Date()
                };
                message.author.send({ embeds: [warnEmbed] }).catch(() => {});
                return;
            }
            
            // Link filter (if not whitelisted)
            const linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
            const links = message.content.match(linkRegex);
            
            if (links) {
                const whitelist = client.config.automod.linkWhitelist || [];
                const hasUnauthorizedLink = links.some(link => 
                    !whitelist.some(domain => link.includes(domain))
                );
                
                if (hasUnauthorizedLink) {
                    await message.delete().catch(() => {});
                    const warnEmbed = {
                        color: 0xff0000,
                        title: '⚠️ Warning',
                        description: 'External links are not allowed in this server.',
                        timestamp: new Date()
                    };
                    message.author.send({ embeds: [warnEmbed] }).catch(() => {});
                    return;
                }
            }
        }
        
        // Command handling
        const prefix = client.config.prefix || process.env.DEFAULT_PREFIX || '!';
        if (!message.content.startsWith(prefix)) return;
        
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = client.commands.get(commandName) 
            || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
        
        if (!command) return;
        
        // Owner only commands
        if (command.ownerOnly && !client.config.ownerIds.includes(message.author.id)) {
            return message.reply('This command is only available to bot owners.');
        }
        
        // Guild only commands
        if (command.guildOnly && message.channel.type === 'DM') {
            return message.reply('This command can only be used in a server.');
        }
        
        // Permission check
        if (command.userPermissions && message.guild) {
            const authorPerms = message.channel.permissionsFor(message.author);
            if (!authorPerms || !command.userPermissions.every(perm => authorPerms.has(perm))) {
                return message.reply('You don\'t have the required permissions to use this command.');
            }
        }
        
        // Bot permission check
        if (command.botPermissions && message.guild) {
            const botPerms = message.channel.permissionsFor(client.user);
            if (!botPerms || !command.botPermissions.every(perm => botPerms.has(perm))) {
                return message.reply('I don\'t have the required permissions to execute this command.');
            }
        }
        
        // Cooldowns
        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Map());
        }
        
        const timestamps = client.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 3) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (Date.now() < expirationTime) {
                const timeLeft = (expirationTime - Date.now()) / 1000;
                return message.reply(`Please wait ${timeLeft.toFixed(1)} more seconds before using this command again.`);
            }
        }
        
        timestamps.set(message.author.id, Date.now());
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        // Execute command
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(`Error executing command ${commandName}:`, error);
            message.reply('There was an error executing this command.');
        }
    }
};