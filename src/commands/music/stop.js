const { createInfoEmbed } = require('../../utils/embedBuilder');
const { hasPermission } = require('../../utils/permissionChecks');
const musicManager = require('../../utils/musicManager');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: {
        name: 'stop',
        description: 'Stop music and clear queue (Admin only)',
        usage: '!stop',
        category: 'music',
        cooldown: 3
    },
    async execute(message, args) {
        // Check if user has "Deafen Users" permission
        if (!hasPermission(message.member, PermissionFlagsBits.DeafenMembers)) {
            return message.reply('You need the "Deafen Users" permission to stop music!');
        }

        try {
            musicManager.disconnect(message.guild.id);
            
            const embed = createInfoEmbed('⏹️ Music Stopped', 
                `${message.author.username} stopped the music and cleared the queue!`
            ).setColor('#FF6B6B');

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error stopping music:', error);
            message.reply('There was an error stopping the music!');
        }
    },
};