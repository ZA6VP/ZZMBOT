const { Collection } = require('discord.js');
const { createErrorEmbed } = require('../utils/embedBuilder');
const { addXP } = require('../utils/xpSystem');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        // Ignore bots and system messages
        if (message.author.bot || message.system) return;
        
        const client = message.client;
        const config = client.config;
        
        // XP System - Award XP for messages
        if (message.guild) {
            const now = Date.now();
            const cooldownAmount = config.xp.cooldown;
            
            if (!client.cooldowns.has('xp')) {
                client.cooldowns.set('xp', new Collection());
            }
            
            const timestamps = client.cooldowns.get('xp');
            const cooldownKey = `${message.author.id}-${message.guild.id}`;
            
            if (!timestamps.has(cooldownKey) || (now - timestamps.get(cooldownKey)) >= cooldownAmount) {
                const xpGain = Math.floor(Math.random() * (config.xp.messageXP.max - config.xp.messageXP.min + 1)) + config.xp.messageXP.min;
                const result = await addXP(message.author.id, message.guild.id, xpGain);
                
                if (result && result.leveledUp) {
                    const levelUpChannelId = '1375225897317175397';
                    const levelUpChannel = message.guild.channels.cache.get(levelUpChannelId);
                    
                    if (levelUpChannel) {
                        const levelRole = config.levelUpRole[result.newLevel.toString()];
                        if (levelRole && message.guild.roles.cache.find(r => r.name === levelRole)) {
                            const role = message.guild.roles.cache.find(r => r.name === levelRole);
                            await message.member.roles.add(role).catch(console.error);
                            
                            const levelUpEmbed = createInfoEmbed('🎉 Level Up! 🎉', 
                                `Congratulations ${message.author}!\nYou've reached **Level ${result.newLevel}** and earned the **${levelRole}** role!`
                            )
                            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                            .setColor('#FFD700');
                            
                            levelUpChannel.send({ embeds: [levelUpEmbed] });
                        } else {
                            const levelUpEmbed = createInfoEmbed('🎉 Level Up! 🎉', 
                                `Congratulations ${message.author}!\nYou've reached **Level ${result.newLevel}**!`
                            )
                            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                            .setColor('#FFD700');
                            
                            levelUpChannel.send({ embeds: [levelUpEmbed] });
                        }
                    }
                }
                
                timestamps.set(cooldownKey, now);
            }
        }
        
        // Command handling
        if (!message.content.startsWith(config.prefix)) return;
        
        const args = message.content.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        const command = client.commands.get(commandName) || 
                       client.commands.find(cmd => cmd.data.aliases && cmd.data.aliases.includes(commandName));
        
        if (!command) return;
        
        // Cooldown handling
        if (!client.cooldowns.has(command.data.name)) {
            client.cooldowns.set(command.data.name, new Collection());
        }
        
        const now = Date.now();
        const timestamps = client.cooldowns.get(command.data.name);
        const cooldownAmount = (command.data.cooldown || 3) * 1000;
        
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                const embed = createErrorEmbed('Cooldown', `Please wait ${timeLeft.toFixed(1)} more seconds before using \`${command.data.name}\` again.`);
                return message.reply({ embeds: [embed] });
            }
        }
        
        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
        
        // Execute command
        try {
            await command.execute(message, args);
        } catch (error) {
            console.error('Command execution error:', error);
            const embed = createErrorEmbed('Error', 'There was an error while executing this command!');
            await message.reply({ embeds: [embed] }).catch(console.error);
        }
    },
};
