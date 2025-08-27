const { PermissionFlagsBits, ChannelType } = require('discord.js');
const { hasPermission, isBotAdmin } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'copy',
        description: 'Copy server structure from another server',
        usage: '!copy <server_id> [include_roles] [include_channels] [include_emojis]',
        aliases: ['clone', 'duplicate'],
        cooldown: 60
    },
    async execute(message, args) {
        // Check permissions - Only administrators and bot admins
        if (!hasPermission(message.member, PermissionFlagsBits.Administrator) && !isBotAdmin(message.author.id)) {
            const embed = createErrorEmbed('Permission Denied', 'You need Administrator permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        if (!args[0]) {
            const embed = createErrorEmbed('Invalid Usage', 
                'Please provide a server ID to copy from.\n' +
                'Usage: `!copy <server_id> [include_roles] [include_channels] [include_emojis]`\n\n' +
                'Optional parameters (true/false):\n' +
                '• include_roles: Copy roles (default: true)\n' +
                '• include_channels: Copy channels (default: true)\n' +
                '• include_emojis: Copy emojis (default: true)'
            );
            return message.reply({ embeds: [embed] });
        }

        const sourceServerId = args[0];
        const includeRoles = args[1] !== 'false';
        const includeChannels = args[2] !== 'false';
        const includeEmojis = args[3] !== 'false';

        // Get source server
        const sourceGuild = message.client.guilds.cache.get(sourceServerId);
        if (!sourceGuild) {
            const embed = createErrorEmbed('Server Not Found', 
                'I am not in the source server or the server ID is invalid.\n' +
                'Make sure the bot is in both servers and the ID is correct.'
            );
            return message.reply({ embeds: [embed] });
        }

        const targetGuild = message.guild;

        try {
            const statusMessage = await message.reply({ 
                embeds: [createSuccessEmbed('🔄 Copying Server', 'Starting server copy operation...')] 
            });

            let copied = {
                roles: 0,
                categories: 0,
                channels: 0,
                emojis: 0
            };

            // Copy server icon and name
            try {
                if (sourceGuild.icon) {
                    await targetGuild.setIcon(sourceGuild.iconURL({ extension: 'png', size: 1024 }));
                }
                // Don't copy name to avoid confusion
            } catch (error) {
                console.error('Failed to copy server icon:', error);
            }

            // Copy roles
            if (includeRoles) {
                await statusMessage.edit({ 
                    embeds: [createSuccessEmbed('🔄 Copying Server', 'Copying roles...')] 
                });

                const sourceRoles = sourceGuild.roles.cache
                    .filter(role => role.id !== sourceGuild.id && !role.managed)
                    .sort((a, b) => a.position - b.position);

                for (const [id, role] of sourceRoles) {
                    try {
                        // Check if role already exists
                        const existingRole = targetGuild.roles.cache.find(r => r.name === role.name);
                        if (existingRole) continue;

                        await targetGuild.roles.create({
                            name: role.name,
                            color: role.color,
                            hoist: role.hoist,
                            mentionable: role.mentionable,
                            permissions: role.permissions,
                            reason: `Copied from ${sourceGuild.name} by ${message.author.tag}`
                        });
                        copied.roles++;
                        await new Promise(resolve => setTimeout(resolve, 200)); // Rate limit protection
                    } catch (error) {
                        console.error(`Failed to copy role ${role.name}:`, error);
                    }
                }
            }

            // Copy categories and channels
            if (includeChannels) {
                await statusMessage.edit({ 
                    embeds: [createSuccessEmbed('🔄 Copying Server', 'Copying channels and categories...')] 
                });

                // First, copy categories
                const sourceCategories = sourceGuild.channels.cache
                    .filter(channel => channel.type === ChannelType.GuildCategory)
                    .sort((a, b) => a.position - b.position);

                const categoryMap = new Map();

                for (const [id, category] of sourceCategories) {
                    try {
                        const newCategory = await targetGuild.channels.create({
                            name: category.name,
                            type: ChannelType.GuildCategory,
                            permissionOverwrites: category.permissionOverwrites.cache.map(overwrite => ({
                                id: overwrite.id === sourceGuild.id ? targetGuild.id : overwrite.id,
                                allow: overwrite.allow,
                                deny: overwrite.deny,
                                type: overwrite.type
                            })),
                            reason: `Copied from ${sourceGuild.name} by ${message.author.tag}`
                        });
                        categoryMap.set(id, newCategory.id);
                        copied.categories++;
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (error) {
                        console.error(`Failed to copy category ${category.name}:`, error);
                    }
                }

                // Then, copy channels
                const sourceChannels = sourceGuild.channels.cache
                    .filter(channel => channel.type !== ChannelType.GuildCategory)
                    .sort((a, b) => a.position - b.position);

                for (const [id, channel] of sourceChannels) {
                    try {
                        const channelData = {
                            name: channel.name,
                            type: channel.type,
                            topic: channel.topic,
                            nsfw: channel.nsfw,
                            bitrate: channel.bitrate,
                            userLimit: channel.userLimit,
                            rateLimitPerUser: channel.rateLimitPerUser,
                            permissionOverwrites: channel.permissionOverwrites.cache.map(overwrite => ({
                                id: overwrite.id === sourceGuild.id ? targetGuild.id : overwrite.id,
                                allow: overwrite.allow,
                                deny: overwrite.deny,
                                type: overwrite.type
                            })),
                            reason: `Copied from ${sourceGuild.name} by ${message.author.tag}`
                        };

                        // Set parent category if it exists
                        if (channel.parentId && categoryMap.has(channel.parentId)) {
                            channelData.parent = categoryMap.get(channel.parentId);
                        }

                        await targetGuild.channels.create(channelData);
                        copied.channels++;
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (error) {
                        console.error(`Failed to copy channel ${channel.name}:`, error);
                    }
                }
            }

            // Copy emojis
            if (includeEmojis) {
                await statusMessage.edit({ 
                    embeds: [createSuccessEmbed('🔄 Copying Server', 'Copying emojis...')] 
                });

                const sourceEmojis = sourceGuild.emojis.cache;
                for (const [id, emoji] of sourceEmojis) {
                    try {
                        // Check if emoji already exists
                        const existingEmoji = targetGuild.emojis.cache.find(e => e.name === emoji.name);
                        if (existingEmoji) continue;

                        await targetGuild.emojis.create({
                            attachment: emoji.url,
                            name: emoji.name,
                            reason: `Copied from ${sourceGuild.name} by ${message.author.tag}`
                        });
                        copied.emojis++;
                        await new Promise(resolve => setTimeout(resolve, 500));
                    } catch (error) {
                        console.error(`Failed to copy emoji ${emoji.name}:`, error);
                    }
                }
            }

            const successEmbed = createSuccessEmbed('✅ Server Copy Complete', 
                `Successfully copied content from **${sourceGuild.name}**\n\n` +
                `**Copy Summary:**\n` +
                `• Roles: ${copied.roles}\n` +
                `• Categories: ${copied.categories}\n` +
                `• Channels: ${copied.channels}\n` +
                `• Emojis: ${copied.emojis}\n\n` +
                `**Note:** Permissions may need adjustment as user IDs differ between servers.`
            );

            await statusMessage.edit({ embeds: [successEmbed] });

        } catch (error) {
            console.error('Error during copy operation:', error);
            const errorEmbed = createErrorEmbed('Copy Failed', 
                'An error occurred during the copy operation. Some items may not have been copied.'
            );
            await message.reply({ embeds: [errorEmbed] });
        }
    }
};