const { PermissionFlagsBits, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const embedBuilder = require('../../utils/embedBuilder');
const { isOwner } = require('../../utils/permissionChecks');

module.exports = {
    name: 'friendlyraid',
    aliases: ['raid', 'spam'],
    description: 'Send repeated messages (for friendly raids/trolling streamers)',
    usage: '!friendlyraid <message>',
    category: 'admin',
    userPermissions: ['SendMessages'],
    botPermissions: ['SendMessages'],
    guildOnly: true,
    
    async execute(message, args, client) {
        if (!args[0]) {
            return message.reply({ embeds: [embedBuilder.error('Invalid Usage', 'Please provide a message to send.')] });
        }
        
        const raidMessage = args.join(' ');
        
        // Create control embed
        const controlEmbed = {
            color: 0x0099ff,
            title: '🎉 Friendly Raid Controller',
            description: `**Message:** ${raidMessage}\n\nClick the button below to send the message 4 times!`,
            fields: [
                { name: 'Channel', value: message.channel.toString(), inline: true },
                { name: 'Started By', value: message.author.tag, inline: true }
            ],
            timestamp: new Date(),
            footer: { text: 'Great for trolling streamers!' }
        };
        
        // Create button
        const raidButton = new ButtonBuilder()
            .setCustomId('raid_send')
            .setLabel('Send Messages (4x)')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📢');
            
        const stopButton = new ButtonBuilder()
            .setCustomId('raid_stop')
            .setLabel('Stop Raid')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🛑');
            
        const row = new ActionRowBuilder()
            .addComponents(raidButton, stopButton);
        
        const controlMessage = await message.reply({ 
            embeds: [controlEmbed], 
            components: [row] 
        });
        
        // Create collector
        const collector = controlMessage.createMessageComponentCollector({ 
            time: 300000 // 5 minutes
        });
        
        let totalSent = 0;
        
        collector.on('collect', async (interaction) => {
            // Allow anyone to use the raid button
            if (interaction.customId === 'raid_send') {
                await interaction.deferUpdate();
                
                // Send 4 messages
                for (let i = 0; i < 4; i++) {
                    await message.channel.send(raidMessage);
                    totalSent++;
                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // Update embed
                controlEmbed.fields = [
                    { name: 'Channel', value: message.channel.toString(), inline: true },
                    { name: 'Started By', value: message.author.tag, inline: true },
                    { name: 'Messages Sent', value: totalSent.toString(), inline: true },
                    { name: 'Last Used By', value: interaction.user.tag, inline: true }
                ];
                
                await controlMessage.edit({ embeds: [controlEmbed], components: [row] });
            }
            
            if (interaction.customId === 'raid_stop') {
                // Only original user or admins can stop
                if (interaction.user.id !== message.author.id && 
                    !interaction.member.permissions.has(PermissionFlagsBits.Administrator) &&
                    !isOwner(interaction.user.id, client.config)) {
                    return interaction.reply({ 
                        content: 'Only the original user or administrators can stop the raid.', 
                        ephemeral: true 
                    });
                }
                
                await interaction.update({ 
                    embeds: [embedBuilder.success('Raid Stopped', `Friendly raid has been stopped. Total messages sent: ${totalSent}`)], 
                    components: [] 
                });
                collector.stop();
            }
        });
        
        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                controlMessage.edit({ 
                    embeds: [embedBuilder.info('Raid Ended', `Friendly raid timed out. Total messages sent: ${totalSent}`)], 
                    components: [] 
                }).catch(() => {});
            }
        });
    }
};