const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { hasPermission, isBotAdmin } = require('../../utils/permissionChecks');
const { createSuccessEmbed, createErrorEmbed, createWarningEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'nuke',
        description: '⚠️ DANGER: Deletes all server content except the current channel',
        usage: '!nuke',
        aliases: ['destroy', 'wipe'],
        cooldown: 30
    },
    async execute(message, args) {
        // Check permissions - Only administrators and bot admins
        if (!hasPermission(message.member, PermissionFlagsBits.Administrator) && !isBotAdmin(message.author.id)) {
            const embed = createErrorEmbed('Permission Denied', 'You need Administrator permission to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Create warning embed
        const warningEmbed = createWarningEmbed('⚠️ NUCLEAR OPTION ⚠️', 
            '**THIS WILL DELETE EVERYTHING IN THIS SERVER:**\n\n' +
            '• All channels (except this one)\n' +
            '• All categories\n' +
            '• All roles (except @everyone and bot roles)\n' +
            '• All emojis\n' +
            '• All stickers\n\n' +
            '**THIS ACTION CANNOT BE UNDONE!**\n\n' +
            'Are you absolutely sure you want to continue?'
        );

        // Create confirmation buttons
        const confirmButton = new ButtonBuilder()
            .setCustomId('nuke_confirm')
            .setLabel('YES, NUKE IT')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('💥');

        const cancelButton = new ButtonBuilder()
            .setCustomId('nuke_cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(confirmButton, cancelButton);

        const confirmMessage = await message.reply({ 
            embeds: [warningEmbed], 
            components: [row] 
        });

        // Create collector for button interactions
        const collector = confirmMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 30000 // 30 seconds
        });

        collector.on('collect', async (interaction) => {
            // Only allow the command user to interact
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({ 
                    content: 'Only the person who ran this command can confirm it.', 
                    ephemeral: true 
                });
            }

            if (interaction.customId === 'nuke_confirm') {
                await interaction.update({ 
                    content: '💥 **NUKING SERVER...** This may take a while...', 
                    embeds: [], 
                    components: [] 
                });

                try {
                    const currentChannel = message.channel;
                    let deletedCount = {
                        channels: 0,
                        categories: 0,
                        roles: 0,
                        emojis: 0,
                        stickers: 0
                    };

                    // Delete all channels except the current one
                    const channels = message.guild.channels.cache.filter(ch => ch.id !== currentChannel.id);
                    for (const [id, channel] of channels) {
                        try {
                            if (channel.type === 4) { // Category
                                await channel.delete();
                                deletedCount.categories++;
                            } else {
                                await channel.delete();
                                deletedCount.channels++;
                            }
                            // Small delay to avoid rate limits
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (error) {
                            console.error(`Failed to delete channel ${channel.name}:`, error);
                        }
                    }

                    // Delete all roles except @everyone and bot roles
                    const roles = message.guild.roles.cache.filter(role => 
                        role.id !== message.guild.id && // Not @everyone
                        !role.managed && // Not bot roles
                        role.position < message.guild.members.me.roles.highest.position // Bot can delete
                    );
                    for (const [id, role] of roles) {
                        try {
                            await role.delete();
                            deletedCount.roles++;
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (error) {
                            console.error(`Failed to delete role ${role.name}:`, error);
                        }
                    }

                    // Delete all emojis
                    const emojis = message.guild.emojis.cache;
                    for (const [id, emoji] of emojis) {
                        try {
                            await emoji.delete();
                            deletedCount.emojis++;
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (error) {
                            console.error(`Failed to delete emoji ${emoji.name}:`, error);
                        }
                    }

                    // Delete all stickers
                    const stickers = message.guild.stickers.cache;
                    for (const [id, sticker] of stickers) {
                        try {
                            await sticker.delete();
                            deletedCount.stickers++;
                            await new Promise(resolve => setTimeout(resolve, 100));
                        } catch (error) {
                            console.error(`Failed to delete sticker ${sticker.name}:`, error);
                        }
                    }

                    const successEmbed = createSuccessEmbed('💥 Nuclear Option Complete', 
                        `Server has been nuked by ${message.author.tag}\n\n` +
                        `**Deletion Summary:**\n` +
                        `• Channels: ${deletedCount.channels}\n` +
                        `• Categories: ${deletedCount.categories}\n` +
                        `• Roles: ${deletedCount.roles}\n` +
                        `• Emojis: ${deletedCount.emojis}\n` +
                        `• Stickers: ${deletedCount.stickers}\n\n` +
                        `This channel was preserved for the summary.`
                    );

                    await currentChannel.send({ embeds: [successEmbed] });

                } catch (error) {
                    console.error('Error during nuke operation:', error);
                    const errorEmbed = createErrorEmbed('Nuke Failed', 
                        'An error occurred during the nuke operation. Some items may not have been deleted.'
                    );
                    await message.channel.send({ embeds: [errorEmbed] });
                }

            } else if (interaction.customId === 'nuke_cancel') {
                const cancelEmbed = createSuccessEmbed('Operation Cancelled', 
                    'The nuke operation has been cancelled. Your server is safe.'
                );
                await interaction.update({ embeds: [cancelEmbed], components: [] });
            }
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                const timeoutEmbed = createErrorEmbed('Operation Timed Out', 
                    'The nuke operation has been cancelled due to timeout.'
                );
                confirmMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
        });
    }
};