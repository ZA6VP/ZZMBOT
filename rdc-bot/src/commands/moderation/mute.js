const { PermissionFlagsBits } = require('discord.js');
const { User, TempData, Guild } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');
const ms = require('ms');

module.exports = {
    name: 'mute',
    description: 'Mute a user by assigning a muted role',
    usage: '!mute <@user> [duration] [reason]',
    category: 'moderation',
    userPermissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need the Manage Roles permission to use this command.')] });
        }
        
        // Get target user
        const target = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        
        if (!target) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a user or provide a user ID to mute.')] });
        }
        
        // Check hierarchy
        if (!hasOwnerBypass && target.roles.highest.position >= message.member.roles.highest.position) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Mute', 'You cannot mute someone with an equal or higher role.')] });
        }
        
        // Get or create muted role
        let mutedRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === 'muted');
        
        if (!mutedRole) {
            try {
                mutedRole = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#808080',
                    permissions: [],
                    reason: 'Auto-created muted role'
                });
                
                // Update all channels to deny permissions for muted role
                for (const channel of message.guild.channels.cache.values()) {
                    await channel.permissionOverwrites.edit(mutedRole, {
                        SendMessages: false,
                        AddReactions: false,
                        Speak: false,
                        Stream: false
                    }).catch(() => {});
                }
                
                // Save muted role to guild settings
                await Guild.findOneAndUpdate(
                    { guildId: message.guild.id },
                    { mutedRole: mutedRole.id },
                    { upsert: true }
                );
            } catch (error) {
                console.error('Error creating muted role:', error);
                return message.reply({ embeds: [embedBuilder.error('Mute Failed', 'Failed to create muted role.')] });
            }
        }
        
        // Check if user is already muted
        if (target.roles.cache.has(mutedRole.id)) {
            return message.reply({ embeds: [embedBuilder.error('Already Muted', 'This user is already muted.')] });
        }
        
        // Parse duration and reason
        let duration = null;
        let reason = 'No reason provided';
        let durationStr = null;
        
        if (args[1]) {
            const tempDuration = ms(args[1]);
            if (tempDuration) {
                duration = tempDuration;
                durationStr = args[1];
                reason = args.slice(2).join(' ') || 'No reason provided';
            } else {
                reason = args.slice(1).join(' ');
            }
        }
        
        try {
            // Add muted role
            await target.roles.add(mutedRole, `${reason} - Muted by ${message.author.tag}`);
            
            // If duration is specified, save to database for auto-unmute
            if (duration) {
                await TempData.create({
                    userId: target.id,
                    guildId: message.guild.id,
                    type: 'mute',
                    endTime: new Date(Date.now() + duration),
                    reason
                });
                
                // Set timeout for auto-unmute
                setTimeout(async () => {
                    const member = message.guild.members.cache.get(target.id);
                    if (member && member.roles.cache.has(mutedRole.id)) {
                        await member.roles.remove(mutedRole, 'Mute duration expired');
                        await TempData.deleteOne({ userId: target.id, guildId: message.guild.id, type: 'mute' });
                    }
                }, duration);
            }
            
            // Log to database
            await User.findOneAndUpdate(
                { userId: target.id, guildId: message.guild.id },
                { 
                    $push: { 
                        infractions: {
                            type: 'mute',
                            reason,
                            moderator: message.author.id,
                            duration: durationStr,
                            timestamp: new Date()
                        }
                    }
                },
                { upsert: true }
            );
            
            // Send success message
            const successEmbed = embedBuilder.success(
                'User Muted',
                `${target.user.tag} has been muted${durationStr ? ` for ${durationStr}` : ''}.\n**Reason:** ${reason}`
            );
            message.reply({ embeds: [successEmbed] });
            
            // DM the user
            const dmEmbed = embedBuilder.warning(
                'Muted',
                `You have been muted in **${message.guild.name}**${durationStr ? ` for ${durationStr}` : ''}\n**Reason:** ${reason}`,
                `Muted by ${message.author.tag}`
            );
            
            await target.send({ embeds: [dmEmbed] }).catch(() => {});
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel) {
                const logEmbed = embedBuilder.modLog('User Muted', message.author, target.user, reason, durationStr);
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Mute error:', error);
            message.reply({ embeds: [embedBuilder.error('Mute Failed', 'An error occurred while trying to mute the user.')] });
        }
    }
};