const { PermissionFlagsBits } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'copy',
    aliases: ['clone', 'copyserver'],
    description: 'Copy server structure from another server',
    usage: '!copy <server_id>',
    category: 'admin',
    userPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    guildOnly: true,
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need Administrator permission to use this command.')] });
        }
        
        if (!args[0]) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please provide a server ID to copy from.')] });
        }
        
        const sourceGuildId = args[0];
        
        try {
            // Get source guild
            const sourceGuild = client.guilds.cache.get(sourceGuildId);
            
            if (!sourceGuild) {
                return message.reply({ embeds: [embedBuilder.error('Guild Not Found', 'I am not in the specified server or the ID is invalid.')] });
            }
            
            // Check if bot has admin in source guild
            const botMember = sourceGuild.members.cache.get(client.user.id);
            if (!botMember || !botMember.permissions.has(PermissionFlagsBits.Administrator)) {
                return message.reply({ embeds: [embedBuilder.error('Missing Permissions', 'I need Administrator permission in the source server.')] });
            }
            
            const statusMessage = await message.reply({ embeds: [embedBuilder.info('Copying Server', 'Starting server copy... This may take several minutes.')] });
            
            const targetGuild = message.guild;
            let copied = {
                roles: 0,
                categories: 0,
                channels: 0,
                emojis: 0,
                stickers: 0
            };
            
            // Map to store old role IDs to new role IDs
            const roleMap = new Map();
            
            // Copy roles (excluding @everyone and managed roles)
            const sortedRoles = [...sourceGuild.roles.cache.values()]
                .filter(role => role.id !== sourceGuild.id && !role.managed)
                .sort((a, b) => a.position - b.position);
                
            for (const role of sortedRoles) {
                try {
                    const newRole = await targetGuild.roles.create({
                        name: role.name,
                        color: role.color,
                        hoist: role.hoist,
                        permissions: role.permissions,
                        mentionable: role.mentionable,
                        reason: `Copied from ${sourceGuild.name}`
                    });
                    roleMap.set(role.id, newRole.id);
                    copied.roles++;
                } catch (error) {
                    console.error(`Failed to copy role ${role.name}:`, error);
                }
            }
            
            // Map to store old channel IDs to new channel IDs
            const channelMap = new Map();
            
            // Copy categories first
            const categories = sourceGuild.channels.cache.filter(ch => ch.type === 4);
            for (const [id, category] of categories) {
                try {
                    const newCategory = await targetGuild.channels.create({
                        name: category.name,
                        type: 4,
                        position: category.position,
                        permissionOverwrites: category.permissionOverwrites.cache.map(perm => ({
                            id: roleMap.get(perm.id) || perm.id,
                            allow: perm.allow,
                            deny: perm.deny,
                            type: perm.type
                        })).filter(perm => perm.id !== sourceGuild.id),
                        reason: `Copied from ${sourceGuild.name}`
                    });
                    channelMap.set(id, newCategory.id);
                    copied.categories++;
                } catch (error) {
                    console.error(`Failed to copy category ${category.name}:`, error);
                }
            }
            
            // Copy channels
            const channels = sourceGuild.channels.cache.filter(ch => ch.type !== 4);
            for (const [id, channel] of channels) {
                try {
                    const channelData = {
                        name: channel.name,
                        type: channel.type,
                        topic: channel.topic,
                        nsfw: channel.nsfw,
                        bitrate: channel.bitrate,
                        userLimit: channel.userLimit,
                        rateLimitPerUser: channel.rateLimitPerUser,
                        position: channel.position,
                        permissionOverwrites: channel.permissionOverwrites.cache.map(perm => ({
                            id: roleMap.get(perm.id) || perm.id,
                            allow: perm.allow,
                            deny: perm.deny,
                            type: perm.type
                        })).filter(perm => perm.id !== sourceGuild.id),
                        parent: channelMap.get(channel.parentId) || null,
                        reason: `Copied from ${sourceGuild.name}`
                    };
                    
                    await targetGuild.channels.create(channelData);
                    copied.channels++;
                } catch (error) {
                    console.error(`Failed to copy channel ${channel.name}:`, error);
                }
            }
            
            // Copy emojis (if possible)
            for (const emoji of sourceGuild.emojis.cache.values()) {
                try {
                    await targetGuild.emojis.create({
                        attachment: emoji.url,
                        name: emoji.name,
                        reason: `Copied from ${sourceGuild.name}`
                    });
                    copied.emojis++;
                } catch (error) {
                    console.error(`Failed to copy emoji ${emoji.name}:`, error);
                }
            }
            
            // Update server info
            try {
                await targetGuild.setName(sourceGuild.name);
                if (sourceGuild.icon) {
                    await targetGuild.setIcon(sourceGuild.iconURL({ size: 4096 }));
                }
            } catch (error) {
                console.error('Failed to update server info:', error);
            }
            
            // Send completion message
            const completionEmbed = {
                color: 0x00ff00,
                title: '✅ Server Copy Complete',
                description: `Successfully copied structure from **${sourceGuild.name}**`,
                fields: [
                    { name: 'Roles Copied', value: copied.roles.toString(), inline: true },
                    { name: 'Categories Copied', value: copied.categories.toString(), inline: true },
                    { name: 'Channels Copied', value: copied.channels.toString(), inline: true },
                    { name: 'Emojis Copied', value: copied.emojis.toString(), inline: true }
                ],
                timestamp: new Date(),
                footer: { text: `Copied by ${message.author.tag}` }
            };
            
            await statusMessage.edit({ embeds: [completionEmbed] });
            
        } catch (error) {
            console.error('Copy error:', error);
            message.reply({ embeds: [embedBuilder.error('Copy Failed', 'An error occurred while copying the server.')] });
        }
    }
};