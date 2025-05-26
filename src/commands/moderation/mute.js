const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, canModerate } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed, createModerationEmbed } = require('../../utils/embedBuilder');
const User = require('../../models/User');
const Infraction = require('../../models/Infraction');

function parseDuration(duration) {
    if (!duration) return null;
    
    const regex = /^(\d+)([smhdw])$/;
    const match = duration.toLowerCase().match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000
    };
    
    return value * multipliers[unit];
}

module.exports = {
    data: {
        name: 'mute',
        description: 'Mute a user by assigning the Muted role',
        usage: '!mute <@user> [duration] [reason]',
        aliases: ['m'],
        cooldown: 3
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.ManageRoles)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Manage Roles" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user was mentioned
        const target = message.mentions.members.first();
        if (!target) {
            const embed = createErrorEmbed('Invalid Usage', 'Please mention a user to mute.\nUsage: `!mute <@user> [duration] [reason]`');
            return message.reply({ embeds: [embed] });
        }

        // Check if user can be moderated
        if (!canModerate(message.member, target)) {
            const embed = createErrorEmbed('Cannot Mute User', 'You cannot mute this user due to role hierarchy or permissions.');
            return message.reply({ embeds: [embed] });
        }

        // Find or create muted role
        let mutedRole = message.guild.roles.cache.find(role => role.name === 'Muted');
        if (!mutedRole) {
            try {
                mutedRole = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#808080',
                    reason: 'Auto-created muted role'
                });

                // Set permissions for the muted role in all channels
                message.guild.channels.cache.forEach(async (channel) => {
                    await channel.permissionOverwrites.edit(mutedRole, {
                        SendMessages: false,
                        Speak: false,
                        AddReactions: false
                    }).catch(console.error);
                });
            } catch (error) {
                console.error('Error creating muted role:', error);
                const embed = createErrorEmbed('Error', 'Could not create or find the Muted role.');
                return message.reply({ embeds: [embed] });
            }
        }

        // Check if user is already muted
        if (target.roles.cache.has(mutedRole.id)) {
            const embed = createErrorEmbed('Already Muted', 'This user is already muted.');
            return message.reply({ embeds: [embed] });
        }

        // Parse duration and reason
        let duration = null;
        let reason = '';
        
        if (args[1] && /^\d+[smhdw]$/.test(args[1])) {
            duration = args[1];
            reason = args.slice(2).join(' ') || 'No reason provided';
        } else {
            reason = args.slice(1).join(' ') || 'No reason provided';
        }

        const durationMs = duration ? parseDuration(duration) : null;

        try {
            // Add muted role
            await target.roles.add(mutedRole, `${message.author.tag}: ${reason}`);

            // Update user in database
            let user = await User.findOne({ userId: target.id, guildId: message.guild.id });
            if (!user) {
                user = new User({ userId: target.id, guildId: message.guild.id });
            }
            
            user.isMuted = true;
            if (durationMs) {
                user.muteExpires = new Date(Date.now() + durationMs);
            }
            await user.save();

            // Log the infraction
            const infraction = new Infraction({
                userId: target.user.id,
                guildId: message.guild.id,
                moderatorId: message.author.id,
                type: 'mute',
                reason: reason,
                duration: duration
            });
            await infraction.save();

            // Send DM to user
            try {
                const dmEmbed = createModerationEmbed('Muted', target.user, message.author, reason, duration)
                    .setTitle('You have been muted')
                    .setDescription(`You have been muted in **${message.guild.name}**${duration ? ` for ${duration}` : ''}.`)
                    .setColor('#808080');
                
                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log('Could not send DM to user');
            }

            // Success message
            const embed = createSuccessEmbed('User Muted', 
                `**${target.user.tag}** has been muted${duration ? ` for ${duration}` : ''}.\n**Reason:** ${reason}`
            );
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel) {
                const logEmbed = createModerationEmbed('Muted', target.user, message.author, reason, duration);
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

            // Auto-unmute after duration
            if (durationMs) {
                setTimeout(async () => {
                    try {
                        const member = await message.guild.members.fetch(target.id);
                        if (member && member.roles.cache.has(mutedRole.id)) {
                            await member.roles.remove(mutedRole, 'Mute duration expired');
                            
                            // Update database
                            await User.updateOne(
                                { userId: target.id, guildId: message.guild.id },
                                { isMuted: false, muteExpires: null }
                            );
                            
                            // Log unmute
                            if (logChannel) {
                                const unmuteEmbed = createModerationEmbed('Auto-Unmuted', target.user, message.client.user, 'Mute duration expired');
                                logChannel.send({ embeds: [unmuteEmbed] }).catch(console.error);
                            }
                        }
                    } catch (error) {
                        console.error('Error auto-unmuting user:', error);
                    }
                }, durationMs);
            }

        } catch (error) {
            console.error('Error muting user:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while trying to mute the user.');
            message.reply({ embeds: [embed] });
        }
    },
};
