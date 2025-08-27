const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, isBotAdmin } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'addrole',
        description: 'Create a new role',
        usage: '!addrole <role_name> [color] [mentionable]',
        aliases: ['createrole'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.ManageRoles) && !isBotAdmin(message.author.id)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Manage Roles" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Get role name
        if (!args[0]) {
            const embed = createErrorEmbed('Invalid Usage', 'Please specify a role name.\nUsage: `!addrole <role_name> [color] [mentionable]`');
            return message.reply({ embeds: [embed] });
        }

        const roleName = args[0];
        const color = args[1] || null;
        const mentionable = args[2] ? args[2].toLowerCase() === 'true' : false;

        // Check if role already exists
        const existingRole = message.guild.roles.cache.find(r => r.name.toLowerCase() === roleName.toLowerCase());
        if (existingRole) {
            const embed = createErrorEmbed('Role Already Exists', `A role named "${roleName}" already exists.`);
            return message.reply({ embeds: [embed] });
        }

        try {
            // Create role options
            const roleOptions = {
                name: roleName,
                mentionable: mentionable,
                reason: `Role created by ${message.author.tag}`
            };

            // Add color if provided
            if (color) {
                // Validate color format
                const colorRegex = /^#?[0-9A-Fa-f]{6}$/;
                if (colorRegex.test(color)) {
                    roleOptions.color = color.startsWith('#') ? color : `#${color}`;
                } else {
                    const embed = createErrorEmbed('Invalid Color', 'Color must be in hex format (e.g., #FF0000 or FF0000).');
                    return message.reply({ embeds: [embed] });
                }
            }

            // Create the role
            const newRole = await message.guild.roles.create(roleOptions);

            const embed = createSuccessEmbed('Role Created', 
                `Successfully created the role **${newRole.name}** (ID: ${newRole.id})\n` +
                `Color: ${newRole.hexColor}\n` +
                `Mentionable: ${newRole.mentionable ? 'Yes' : 'No'}`
            );
            
            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error creating role:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while creating the role. Please check my permissions.');
            return message.reply({ embeds: [embed] });
        }
    }
};