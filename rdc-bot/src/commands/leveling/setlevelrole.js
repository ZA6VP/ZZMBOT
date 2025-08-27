const { PermissionFlagsBits } = require('discord.js');
const { Guild } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'setlevelrole',
    aliases: ['levelrole', 'addlevelrole'],
    description: 'Set a role to be awarded at a specific level',
    usage: '!setlevelrole <level> <@role or role name>',
    category: 'leveling',
    userPermissions: ['Administrator'],
    botPermissions: ['ManageRoles'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need Administrator permission to use this command.')] });
        }
        
        if (args.length < 2) {
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Usage', 'Please use: !setlevelrole <level> <@role or role name>')] 
            });
        }
        
        // Parse level
        const level = parseInt(args[0]);
        if (!level || level < 1 || level > 100) {
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Level', 'Please provide a level between 1 and 100.')] 
            });
        }
        
        // Get role
        const roleArg = args.slice(1).join(' ');
        const role = message.mentions.roles.first() || 
                     message.guild.roles.cache.find(r => r.name.toLowerCase() === roleArg.toLowerCase()) ||
                     message.guild.roles.cache.get(roleArg);
        
        if (!role) {
            return message.reply({ 
                embeds: [embedBuilder.error('Invalid Role', 'Please mention a role or provide a valid role name/ID.')] 
            });
        }
        
        // Check if role is manageable
        if (!role.editable) {
            return message.reply({ 
                embeds: [embedBuilder.error('Cannot Manage Role', 'I cannot manage this role. It may be higher than my role.')] 
            });
        }
        
        try {
            // Update guild settings
            const guildData = await Guild.findOne({ guildId: message.guild.id }) || { levelRoles: new Map() };
            
            if (!guildData.levelRoles) {
                guildData.levelRoles = new Map();
            }
            
            // Set the level role
            guildData.levelRoles.set(level.toString(), role.id);
            
            await Guild.findOneAndUpdate(
                { guildId: message.guild.id },
                { levelRoles: guildData.levelRoles },
                { upsert: true }
            );
            
            // Update config
            if (!client.config.levelUpRole) {
                client.config.levelUpRole = {};
            }
            client.config.levelUpRole[level] = role.name;
            
            const successEmbed = embedBuilder.success(
                'Level Role Set',
                `Users will now receive the ${role} role when they reach level ${level}.`
            );
            
            message.reply({ embeds: [successEmbed] });
            
        } catch (error) {
            console.error('Set level role error:', error);
            message.reply({ embeds: [embedBuilder.error('Failed', 'An error occurred while setting the level role.')] });
        }
    }
};