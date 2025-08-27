const { PermissionFlagsBits } = require('discord.js');
const { User } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'infractions',
    aliases: ['warnings', 'history'],
    description: 'View a user\'s infractions history',
    usage: '!infractions <@user>',
    category: 'moderation',
    userPermissions: ['ManageMessages'],
    botPermissions: ['SendMessages', 'EmbedLinks'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need the Manage Messages permission to use this command.')] });
        }
        
        // Get target user
        const target = message.mentions.users.first() || 
                      await client.users.fetch(args[0]).catch(() => null) ||
                      message.author;
        
        if (!target) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a user or provide a valid user ID.')] });
        }
        
        try {
            // Get user data from database
            const userData = await User.findOne({ userId: target.id, guildId: message.guild.id });
            
            if (!userData || (!userData.infractions?.length && !userData.warnings?.length)) {
                const noInfractionsEmbed = {
                    color: 0x00ff00,
                    title: `📋 Infractions for ${target.tag}`,
                    description: 'This user has no infractions.',
                    timestamp: new Date()
                };
                return message.reply({ embeds: [noInfractionsEmbed] });
            }
            
            // Build infractions list
            const infractions = userData.infractions || [];
            const infractionList = infractions.slice(-10).reverse(); // Show last 10
            
            const infractionsEmbed = {
                color: 0x0099ff,
                title: `📋 Infractions for ${target.tag}`,
                description: `Total infractions: **${infractions.length}**`,
                fields: [],
                timestamp: new Date(),
                footer: { text: `User ID: ${target.id}` }
            };
            
            if (target.avatarURL()) {
                infractionsEmbed.thumbnail = { url: target.avatarURL({ dynamic: true }) };
            }
            
            // Add infraction fields
            for (const [index, infraction] of infractionList.entries()) {
                const moderator = await client.users.fetch(infraction.moderator).catch(() => ({ tag: 'Unknown' }));
                const date = new Date(infraction.timestamp).toLocaleDateString();
                
                let typeEmoji = '';
                switch (infraction.type) {
                    case 'warn': typeEmoji = '⚠️'; break;
                    case 'mute': typeEmoji = '🔇'; break;
                    case 'kick': typeEmoji = '👢'; break;
                    case 'ban': typeEmoji = '🔨'; break;
                    case 'timeout': typeEmoji = '⏰'; break;
                }
                
                infractionsEmbed.fields.push({
                    name: `${typeEmoji} ${infraction.type.toUpperCase()} - ${date}`,
                    value: `**Reason:** ${infraction.reason}\n**Moderator:** ${moderator.tag}${infraction.duration ? `\n**Duration:** ${infraction.duration}` : ''}`,
                    inline: false
                });
            }
            
            // Add summary field
            const summary = {
                warn: infractions.filter(i => i.type === 'warn').length,
                mute: infractions.filter(i => i.type === 'mute').length,
                kick: infractions.filter(i => i.type === 'kick').length,
                ban: infractions.filter(i => i.type === 'ban').length,
                timeout: infractions.filter(i => i.type === 'timeout').length
            };
            
            infractionsEmbed.fields.push({
                name: '📊 Summary',
                value: `Warns: ${summary.warn} | Mutes: ${summary.mute} | Kicks: ${summary.kick} | Bans: ${summary.ban} | Timeouts: ${summary.timeout}`,
                inline: false
            });
            
            if (infractions.length > 10) {
                infractionsEmbed.fields.push({
                    name: 'ℹ️ Note',
                    value: `Showing last 10 infractions. Total: ${infractions.length}`,
                    inline: false
                });
            }
            
            message.reply({ embeds: [infractionsEmbed] });
            
        } catch (error) {
            console.error('Infractions error:', error);
            message.reply({ embeds: [embedBuilder.error('Error', 'An error occurred while fetching infractions.')] });
        }
    }
};