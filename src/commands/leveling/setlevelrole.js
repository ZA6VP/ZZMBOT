const { PermissionFlagsBits } = require('discord.js');
const { hasPermission } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: {
        name: 'setlevelrole',
        description: 'Set a role to be automatically granted at a specific level',
        usage: '!setlevelrole <level> <@role>',
        aliases: ['levelrole', 'setrole'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.Administrator)) {
            const embed = createErrorEmbed('Permission Denied', 'You need the "Administrator" permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check arguments
        if (args.length < 2) {
            const embed = createErrorEmbed('Invalid Usage', 'Usage: `!setlevelrole <level> <@role>`\nExample: `!setlevelrole 10 @Veteran`');
            return message.reply({ embeds: [embed] });
        }

        const level = parseInt(args[0]);
        const role = message.mentions.roles.first();

        // Validate level
        if (!level || level < 1 || level > 100) {
            const embed = createErrorEmbed('Invalid Level', 'Please provide a valid level between 1 and 100.');
            return message.reply({ embeds: [embed] });
        }

        // Validate role
        if (!role) {
            const embed = createErrorEmbed('Invalid Role', 'Please mention a valid role.\nUsage: `!setlevelrole <level> <@role>`');
            return message.reply({ embeds: [embed] });
        }

        // Check if bot can manage the role
        if (role.position >= message.guild.members.me.roles.highest.position) {
            const embed = createErrorEmbed('Role Too High', 'I cannot manage this role because it is higher than or equal to my highest role.');
            return message.reply({ embeds: [embed] });
        }

        try {
            // Update config file
            const configPath = path.join(__dirname, '../../../config.json');
            const config = require(configPath);
            
            // Update level up roles
            if (!config.levelUpRole) {
                config.levelUpRole = {};
            }
            
            config.levelUpRole[level.toString()] = role.name;
            
            // Write back to config file
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            
            // Update client config
            message.client.config = config;

            const embed = createSuccessEmbed('Level Role Set', 
                `Level **${level}** will now automatically grant the **${role.name}** role!`
            );
            await message.reply({ embeds: [embed] });

            // Log to mod-logs channel
            const logChannel = message.guild.channels.cache.find(ch => ch.name === message.client.config.logChannel);
            if (logChannel) {
                const logEmbed = createInfoEmbed('Level Role Updated', 
                    `${message.author.tag} set level ${level} to grant the ${role.name} role`
                );
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }

        } catch (error) {
            console.error('Error setting level role:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while setting the level role. Make sure the bot has permission to write to the config file.');
            message.reply({ embeds: [embed] });
        }
    },
};
