const { PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'createrole',
    aliases: ['makerole', 'newrole'],
    description: 'Create a new role',
    usage: '!createrole <name> [color]',
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
        
        if (!args[0]) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please provide a name for the role.')] });
        }
        
        // Parse role name and color
        let roleName, color;
        
        // Check if last argument is a color
        const lastArg = args[args.length - 1];
        const colorRegex = /^#?[0-9A-Fa-f]{6}$/;
        
        if (colorRegex.test(lastArg)) {
            roleName = args.slice(0, -1).join(' ');
            color = lastArg.startsWith('#') ? lastArg : `#${lastArg}`;
        } else {
            roleName = args.join(' ');
            color = '#99AAB5'; // Default Discord role color
        }
        
        if (!roleName) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please provide a name for the role.')] });
        }
        
        try {
            // Create the role
            const role = await message.guild.roles.create({
                name: roleName,
                color: color,
                reason: `Created by ${message.author.tag}`
            });
            
            const successEmbed = embedBuilder.success(
                'Role Created',
                `Successfully created role ${role} with color \`${color}\``
            );
            message.reply({ embeds: [successEmbed] });
            
            // Log to mod channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === client.config.logChannel);
            if (logChannel) {
                const logEmbed = {
                    color: 0x00ff00,
                    title: '🎨 Role Created',
                    fields: [
                        { name: 'Role Name', value: role.name, inline: true },
                        { name: 'Color', value: color, inline: true },
                        { name: 'Created By', value: message.author.tag, inline: true }
                    ],
                    timestamp: new Date()
                };
                logChannel.send({ embeds: [logEmbed] });
            }
            
        } catch (error) {
            console.error('Create role error:', error);
            message.reply({ embeds: [embedBuilder.error('Role Creation Failed', 'An error occurred while trying to create the role.')] });
        }
    }
};