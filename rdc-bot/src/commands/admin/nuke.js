const { PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'nuke',
    description: 'DANGEROUS: Delete all roles, channels, categories, emojis, and stickers',
    usage: '!nuke',
    category: 'admin',
    userPermissions: ['Administrator'],
    botPermissions: ['Administrator'],
    guildOnly: true,
    ownerOnly: false, // Can be used by server admins
    
    async execute(message, args, client) {
        // Check if user is owner (bypass permission check)
        const hasOwnerBypass = isOwner(message.author.id, client.config);
        
        if (!hasOwnerBypass && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply({ embeds: [embedBuilder.error('Permission Denied', 'You need Administrator permission to use this command.')] });
        }
        
        // Create confirmation embed
        const warningEmbed = {
            color: 0xff0000,
            title: '⚠️ EXTREME WARNING - SERVER NUKE ⚠️',
            description: '**This action is EXTREMELY DANGEROUS and IRREVERSIBLE!**\n\n' +
                        'This will DELETE:\n' +
                        '• All channels (except this one)\n' +
                        '• All categories\n' +
                        '• All roles (except @everyone and bot roles)\n' +
                        '• All emojis\n' +
                        '• All stickers\n\n' +
                        '**ARE YOU ABSOLUTELY SURE YOU WANT TO DO THIS?**',
            fields: [
                { name: '⚠️ Final Warning', value: 'This action CANNOT be undone!', inline: false }
            ],
            timestamp: new Date(),
            footer: { text: 'You have 30 seconds to decide' }
        };
        
        // Create buttons
        const confirmButton = new ButtonBuilder()
            .setCustomId('nuke_confirm')
            .setLabel('YES, NUKE THE SERVER')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('💥');
            
        const cancelButton = new ButtonBuilder()
            .setCustomId('nuke_cancel')
            .setLabel('CANCEL')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌');
            
        const row = new ActionRowBuilder()
            .addComponents(confirmButton, cancelButton);
        
        const warningMessage = await message.reply({ 
            embeds: [warningEmbed], 
            components: [row] 
        });
        
        // Create collector
        const collector = warningMessage.createMessageComponentCollector({ 
            time: 30000,
            filter: i => i.user.id === message.author.id
        });
        
        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'nuke_cancel') {
                await interaction.update({ 
                    embeds: [embedBuilder.success('Cancelled', 'Server nuke has been cancelled.')], 
                    components: [] 
                });
                collector.stop();
                return;
            }
            
            if (interaction.customId === 'nuke_confirm') {
                await interaction.update({ 
                    embeds: [embedBuilder.warning('Nuking Server', 'Starting server nuke... This may take a while.')], 
                    components: [] 
                });
                
                const currentChannelId = message.channel.id;
                let deletedCount = {
                    channels: 0,
                    categories: 0,
                    roles: 0,
                    emojis: 0,
                    stickers: 0
                };
                
                try {
                    // Delete all channels except current
                    for (const channel of message.guild.channels.cache.values()) {
                        if (channel.id !== currentChannelId) {
                            await channel.delete('Server nuke').catch(() => {});
                            if (channel.type === 4) deletedCount.categories++;
                            else deletedCount.channels++;
                        }
                    }
                    
                    // Delete all roles except @everyone and bot roles
                    for (const role of message.guild.roles.cache.values()) {
                        if (role.id !== message.guild.id && !role.managed && role.editable) {
                            await role.delete('Server nuke').catch(() => {});
                            deletedCount.roles++;
                        }
                    }
                    
                    // Delete all emojis
                    for (const emoji of message.guild.emojis.cache.values()) {
                        await emoji.delete('Server nuke').catch(() => {});
                        deletedCount.emojis++;
                    }
                    
                    // Delete all stickers
                    for (const sticker of message.guild.stickers.cache.values()) {
                        await sticker.delete('Server nuke').catch(() => {});
                        deletedCount.stickers++;
                    }
                    
                    // Send completion message
                    const completionEmbed = {
                        color: 0x00ff00,
                        title: '💥 Server Nuke Complete',
                        description: 'The server has been nuked successfully.',
                        fields: [
                            { name: 'Channels Deleted', value: deletedCount.channels.toString(), inline: true },
                            { name: 'Categories Deleted', value: deletedCount.categories.toString(), inline: true },
                            { name: 'Roles Deleted', value: deletedCount.roles.toString(), inline: true },
                            { name: 'Emojis Deleted', value: deletedCount.emojis.toString(), inline: true },
                            { name: 'Stickers Deleted', value: deletedCount.stickers.toString(), inline: true }
                        ],
                        timestamp: new Date(),
                        footer: { text: `Nuked by ${message.author.tag}` }
                    };
                    
                    await message.channel.send({ embeds: [completionEmbed] });
                    
                } catch (error) {
                    console.error('Nuke error:', error);
                    await message.channel.send({ 
                        embeds: [embedBuilder.error('Nuke Failed', 'An error occurred during the nuke process.')] 
                    });
                }
                
                collector.stop();
            }
        });
        
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                warningMessage.edit({ 
                    embeds: [embedBuilder.error('Timed Out', 'Server nuke cancelled due to timeout.')], 
                    components: [] 
                }).catch(() => {});
            }
        });
    }
};