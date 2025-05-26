const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createInfoEmbed, createErrorEmbed } = require('../utils/embedBuilder');
const musicManager = require('../utils/musicManager');
const fs = require('fs');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const { customId, user, guild, channel } = interaction;

        // Handle track selection
        if (customId.startsWith('select_track_')) {
            await interaction.deferReply({ ephemeral: true });

            const trackIndex = parseInt(customId.split('_')[2]);
            
            console.log(`Track selection attempt: ${trackIndex}, message ID: ${interaction.message.id}`);
            console.log(`Available selections:`, interaction.client.trackSelections?.size || 0);
            
            const selectionData = interaction.client.trackSelections?.get(interaction.message.id);

            if (!selectionData) {
                console.log('No selection data found for message:', interaction.message.id);
                return interaction.editReply({ content: 'This track selection has expired! Please search again.' });
            }

            console.log(`Selection data found for user: ${selectionData.requesterId}`);

            // Check if selection has expired
            if (Date.now() > selectionData.expiresAt) {
                console.log('Selection has expired');
                interaction.client.trackSelections.delete(interaction.message.id);
                return interaction.editReply({ content: 'This track selection has expired! Please search again.' });
            }

            if (selectionData.requesterId !== user.id) {
                return interaction.editReply({ content: 'Only the person who requested the search can select a track!' });
            }

            const selectedTrack = selectionData.tracks[trackIndex];
            if (!selectedTrack) {
                return interaction.editReply({ content: 'Invalid track selection!' });
            }

            try {
                // Join voice channel if not already connected
                let connection = musicManager.connections.get(guild.id);
                if (!connection) {
                    connection = await musicManager.joinChannel(selectionData.voiceChannel);
                    if (!connection) {
                        return interaction.editReply({ content: 'Failed to join the voice channel!' });
                    }
                }

                // Add to queue
                const position = musicManager.addToQueue(guild.id, selectedTrack);
                
                // If this is the first track, start playing
                const queueStatus = musicManager.getQueueStatus(guild.id);
                if (!queueStatus.isPlaying) {
                    await musicManager.playTrack(guild.id, selectedTrack);
                    
                    const embed = createInfoEmbed('🎵 Now Playing', 
                        `**${selectedTrack.name}**\nby ${selectedTrack.artist}`
                    ).setColor('#1DB954');

                    if (selectedTrack.image) {
                        embed.setThumbnail(selectedTrack.image);
                    }

                    await channel.send({ embeds: [embed] });
                    await interaction.editReply({ content: `Now playing: **${selectedTrack.name}** by ${selectedTrack.artist}!` });
                } else {
                    await interaction.editReply({ content: `**${selectedTrack.name}** by ${selectedTrack.artist} has been added to the queue! (Position: ${position})` });
                }

                // Clean up the selection
                interaction.client.trackSelections.delete(interaction.message.id);
                await interaction.message.edit({ components: [] });

            } catch (error) {
                console.error('Error handling track selection:', error);
                await interaction.editReply({ content: 'There was an error playing the track!' });
            }
            return;
        }

        // Handle ticket creation
        if (customId === 'report_ticket' || customId === 'feedback_ticket') {
            await interaction.deferReply({ ephemeral: true });

            try {
                // Find the category where the ticket channel is located
                const ticketChannel = guild.channels.cache.get('1374528951527149659');
                const category = ticketChannel?.parent;

                if (!category) {
                    return interaction.editReply({ content: 'Could not find the ticket category!' });
                }

                // Generate ticket number
                const ticketNumber = Math.floor(Math.random() * 10000);
                const ticketType = customId === 'report_ticket' ? 'report' : 'feedback';
                const channelName = `${ticketType}-ticket-${ticketNumber}`;

                // Create ticket channel
                const ticketChannelCreated = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                    ],
                });

                // Add permissions for roles with "Manage Channels" and "Timeout Users"
                const staffRoles = guild.roles.cache.filter(role => 
                    role.permissions.has(PermissionFlagsBits.ManageChannels) || 
                    role.permissions.has(PermissionFlagsBits.ModerateMembers)
                );

                for (const [roleId, role] of staffRoles) {
                    await ticketChannelCreated.permissionOverwrites.create(role, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true,
                    });
                }

                // Create appropriate embed and button
                let embed, buttonLabel;
                
                if (ticketType === 'report') {
                    embed = createInfoEmbed('User Report', 
                        'Send details related to your report below like:\n\n• User your reporting\n• Report reason\n• Proof of accusation'
                    ).setColor('#ff0000');
                    buttonLabel = 'Close';
                } else {
                    embed = createInfoEmbed('Server Feedback', 
                        'Send your feedback below:\n\n• Positive, Negative or Neutral?\n• Your feedback.'
                    ).setColor('#00ff00');
                    buttonLabel = 'Close';
                }

                const closeButton = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`close_ticket_${ticketNumber}`)
                            .setLabel(buttonLabel)
                            .setStyle(ButtonStyle.Danger)
                    );

                await ticketChannelCreated.send({ 
                    content: `<@${user.id}>`,
                    embeds: [embed], 
                    components: [closeButton] 
                });

                await interaction.editReply({ 
                    content: `Your ${ticketType} ticket has been created! Check ${ticketChannelCreated}` 
                });

            } catch (error) {
                console.error('Error creating ticket:', error);
                await interaction.editReply({ content: 'There was an error creating your ticket!' });
            }
        }

        // Handle ticket closing
        if (customId.startsWith('close_ticket_')) {
            await interaction.deferReply();

            try {
                // Get all messages in the channel for transcript
                const messages = await channel.messages.fetch({ limit: 100 });
                const transcript = messages.reverse().map(msg => 
                    `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
                ).join('\n');

                // Send transcript to logs channel
                const logsChannelId = '1374516222166569080';
                const logsChannel = guild.channels.cache.get(logsChannelId);

                if (logsChannel) {
                    const transcriptEmbed = createInfoEmbed(
                        `Ticket Closed - ${channel.name}`,
                        `Closed by: ${user.tag}\nChannel: ${channel.name}\nClosed at: ${new Date().toLocaleString()}`
                    ).setColor('#ff0000');

                    await logsChannel.send({ embeds: [transcriptEmbed] });

                    // Send transcript as file if there are messages
                    if (transcript.length > 0) {
                        const fs = require('fs');
                        const transcriptFile = `transcript-${channel.name}-${Date.now()}.txt`;
                        fs.writeFileSync(transcriptFile, transcript);
                        
                        await logsChannel.send({ 
                            content: 'Ticket transcript:',
                            files: [transcriptFile] 
                        });

                        // Clean up the file
                        fs.unlinkSync(transcriptFile);
                    }
                }

                await interaction.editReply({ content: 'Ticket is being closed...' });

                // Delete the channel after a short delay
                setTimeout(async () => {
                    await channel.delete();
                }, 3000);

            } catch (error) {
                console.error('Error closing ticket:', error);
                await interaction.editReply({ content: 'There was an error closing the ticket!' });
            }
        }
    },
};