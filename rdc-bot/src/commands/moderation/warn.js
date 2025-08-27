const { PermissionFlagsBits } = require('discord.js');
const { User } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'warn',
    description: 'Warn a user',
    usage: '!warn <@user> [reason]',
    category: 'moderation',
    userPermissions: ['ManageMessages'],
    botPermissions: ['SendMessages'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need the Manage Messages permission to use this command.')] });
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a user or provide a user ID to warn.')] });
        }
        
        // Check hierarchy
        if (!hasOwnerBypass && target.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Warn', 'You cannot warn someone with an equal or higher role.')] });
        }
        
        // Get reason
        const reason = args.slice(1).join(' ') || 'No reason provided';
        
        try {
            // Add warning to database
            const user = await User.findOneAndUpdate(
                { userId: target.id, guildId: message.guild.id },
                { 
                    $push: { 
                        warnings: {
                            reason,
                            moderator: message.author.id,
                            timestamp: new Date()
                        },
                        infractions: {
                            type: 'warn',
                            reason,
                            moderator: message.author.id,
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true, new: true }
            );
            
            const warningCount = user.warnings.length;
            
            // Send success message
            const successEmbed = embedBuilder.success(
                'User Warned',
                `${target.user.tag} has been warned.\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`
            );
            message.reply({ embeds: [successEmbed] });
            
            // DM the user
            const dmEmbed = embedBuilder.warning(
                'Warning',
                `You have been warned in **${message.guild.name}**\n**Reason:** ${reason}\n**Total Warnings:** ${warningCount}`,
                `Warned by ${message.author.tag}`
            );
            
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel) {
                const logEmbed = embedBuilder.modLog('User Warned', message.author, target.user, reason);
                logEmbed.fields.push({ name: 'Total Warnings', value: warningCount.toString(), inline: true });
                logChannel.send({ embeds: [logEmbed] });
            }
            
            // Auto-punishment based on warning count
            if (warningCount >= (client.config.automod.maxWarnings || 3)) {
                // Automatic timeout for reaching max warnings
                if (target.moderatable) {
                    await target.timeout(86400000, `Automatic timeout: Reached ${warningCount} warnings`); // 24 hours
                    message.channel.send({ 
                        embeds: [embedBuilder.warning(
                            'Auto-Timeout',
                            `${target.user.tag} has been automatically timed out for 24 hours for reaching ${warningCount} warnings.`
                        )] 
                    });
                }
            }
            
        } catch (error) {
            console.error('Warn error:', error);
            message.reply({ embeds: [embedBuilder.error('Warn Failed', 'An error occurred while trying to warn the user.')] });
        }
    }
};