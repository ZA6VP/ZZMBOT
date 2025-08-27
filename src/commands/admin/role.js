const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, isBotAdmin } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'role',
        description: 'Give a user a role',
        usage: '!role <@user> <role_name>',
        aliases: ['giverole'],
        cooldown: 3
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.ManageRoles) && !isBotAdmin(message.author.id)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Manage Roles" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user was mentioned
        const target = message.mentions.members.first();
        if (!target) {
            const embed = createErrorEmbed('Invalid Usage', 'Please mention a user to give a role to.\nUsage: `!role <@user> <role_name>`');
            return message.reply({ embeds: [embed] });
        }

        // Get role name
        const roleName = args.slice(1).join(' ');
        if (!roleName) {
            const embed = createErrorEmbed('Invalid Usage', 'Please specify a role name.\nUsage: `!role <@user> <role_name>`');
            return message.reply({ embeds: [embed] });
        }

        // Find the role
        const role = message.guild.roles.cache.find(r => 
            r.name.toLowerCase() === roleName.toLowerCase() || 
            r.id === roleName
        );

        if (!role) {
            const embed = createErrorEmbed('Role Not Found', `Could not find a role named "${roleName}".`);
            return message.reply({ embeds: [embed] });
        }

        // Check if bot can manage this role
        if (role.position >= message.guild.members.me.roles.highest.position) {
            const embed = createErrorEmbed('Cannot Assign Role', 'I cannot assign this role because it is higher than or equal to my highest role.');
            return message.reply({ embeds: [embed] });
        }

        // Check if user can assign this role (role hierarchy)
        if (!isBotAdmin(message.author.id) && role.position >= message.member.roles.highest.position) {
            const embed = createErrorEmbed('Cannot Assign Role', 'You cannot assign this role because it is higher than or equal to your highest role.');
            return message.reply({ embeds: [embed] });
        }

        try {
            // Check if user already has the role
            if (target.roles.cache.has(role.id)) {
                // Remove the role
                await target.roles.remove(role);
                const embed = createSuccessEmbed('Role Removed', `Successfully removed the **${role.name}** role from ${target.user.tag}.`);
                return message.reply({ embeds: [embed] });
            } else {
                // Add the role
                await target.roles.add(role);
                const embed = createSuccessEmbed('Role Added', `Successfully gave the **${role.name}** role to ${target.user.tag}.`);
                return message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error managing role:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while managing the role. Please check my permissions.');
            return message.reply({ embeds: [embed] });
        }
    }
};