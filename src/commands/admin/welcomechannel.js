const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, isBotAdmin } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: {
        name: 'welcomechannel',
        description: 'Set the welcome channel for new members',
        usage: '!welcomechannel <#channel>',
        aliases: ['setwelcome', 'welcomech'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.Administrator) && !isBotAdmin(message.author.id)) {
            const embed = createErrorEmbed('Permission Denied', 'You need Administrator permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if channel was mentioned
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if (!channel) {
            const embed = createErrorEmbed('Invalid Usage', 'Please mention a channel or provide a channel ID.\nUsage: `!welcomechannel <#channel>`');
            return message.reply({ embeds: [embed] });
        }

        // Check if bot can send messages to the channel
        if (!channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
            const embed = createErrorEmbed('Permission Error', 'I do not have permission to send messages in that channel.');
            return message.reply({ embeds: [embed] });
        }

        try {
            // Read current config
            const configPath = path.join(__dirname, '../../../config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            
            // Update welcome channel
            if (!config.welcome) {
                config.welcome = {};
            }
            config.welcome.channel = channel.id;
            config.welcome.enabled = true;
            
            // Write updated config
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            // Update the bot's config in memory
            message.client.config = config;

            const embed = createSuccessEmbed('Welcome Channel Set', 
                `Successfully set ${channel} as the welcome channel.\n` +
                `New members will receive a welcome message there.`
            );
            
            // Send test message to the welcome channel
            const testEmbed = createSuccessEmbed('Welcome Channel Test', 
                `This channel has been set as the welcome channel by ${message.author.tag}.\n` +
                `New members will receive welcome messages here.`
            );
            await channel.send({ embeds: [testEmbed] });
            
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error setting welcome channel:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while setting the welcome channel.');
            return message.reply({ embeds: [embed] });
        }
    }
};