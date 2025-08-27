const { PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'role',
    aliases: ['giverole', 'addrole'],
    description: 'Give or remove a role from a user',
    usage: '!role <@user> <@role or role name>',
    category: 'admin',
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
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please mention a user or provide a user ID.')] });
        }
        
        // Get role
        const roleArg = args.slice(1).join(' ');
        const role = message.mentions.roles.first() || 
                     message.guild.roles.cache.find(r => r.name.toLowerCase() === roleArg.toLowerCase()) ||
                     message.guild.roles.cache.get(roleArg);
        
        if (!role) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Role', 'Please mention a role or provide a valid role name/ID.')] });
        }
        
        // Check if role is manageable
        if (!role.editable) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Manage Role', 'I cannot manage this role. It may be higher than my role.')] });
        }
        
        // Check hierarchy
        if (!hasOwnerBypass && role.position >= message.member.roles.highest.position) {
            return message.reply({ embeds: [embedBuilder.error('Cannot Manage Role', 'You cannot manage roles that are equal or higher than your highest role.')] });
        }
        
        try {
            if (target.roles.cache.has(role.id)) {
                // Remove role
                await target.roles.remove(role, `Removed by ${message.author.tag}`);
                
                const successEmbed = embedBuilder.success(
                    'Role Removed',
                    `Removed role ${role} from ${target.user.tag}`
                );
                message.reply({ embeds: [successEmbed] });
                
                // Log to mod channel
                const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
                if (logChannel) {
                    const logEmbed = {
                        color: 0xff9900,
                        title: '👤 Role Removed',
                        fields: [
                            { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
                            { name: 'Role', value: role.name, inline: true },
                            { name: 'Moderator', value: message.author.tag, inline: true }
                        ],
                        timestamp: new Date()
                    };
                    logChannel.send({ embeds: [logEmbed] });
                }
            } else {
                // Add role
                await target.roles.add(role, `Added by ${message.author.tag}`);
                
                const successEmbed = embedBuilder.success(
                    'Role Added',
                    `Added role ${role} to ${target.user.tag}`
                );
                message.reply({ embeds: [successEmbed] });
                
                // Log to mod channel
                const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
                if (logChannel) {
                    const logEmbed = {
                        color: 0x00ff00,
                        title: '👤 Role Added',
                        fields: [
                            { name: 'User', value: `${target.user.tag} (${target.id})`, inline: true },
                            { name: 'Role', value: role.name, inline: true },
                            { name: 'Moderator', value: message.author.tag, inline: true }
                        ],
                        timestamp: new Date()
                    };
                    logChannel.send({ embeds: [logEmbed] });
                }
            }
        } catch (error) {
            console.error('Role error:', error);
            message.reply({ embeds: [embedBuilder.error('Role Management Failed', 'An error occurred while trying to manage the role.')] });
        }
    }
};