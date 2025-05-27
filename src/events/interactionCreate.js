const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createInfoEmbed, createErrorEmbed } = require('../utils/embedBuilder');
const musicManager = require('../utils/musicManager');
const fs = require('fs');
const Giveaway = require('../models/Giveaway');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        // Handle button interactions
        if (interaction.isButton()) {
            if (interaction.customId === 'giveaway_enter') {
                try {
                    let giveawayData;

                    // Try to get from database first
                    try {
                        if (require('mongoose').connection.readyState === 1) {
                            giveawayData = await Giveaway.findOne({ 
                                messageId: interaction.message.id, 
                                active: true 
                            });
                        }
                    } catch (dbError) {
                        console.error('Database error fetching giveaway:', dbError);
                    }

                    // Fallback to client cache
                    if (!giveawayData) {
                        giveawayData = interaction.client.giveaways?.get(interaction.message.id);
                    }

                    if (!giveawayData || !giveawayData.active) {
                        return interaction.reply({ 
                            content: '❌ This giveaway is no longer active!', 
                            ephemeral: true 
                        });
                    }

                    // Check if user already entered
                    if (giveawayData.participants.includes(interaction.user.id)) {
                        return interaction.reply({ 
                            content: '❌ You have already entered this giveaway!', 
                            ephemeral: true 
                        });
                    }

                    // Add user to participants
                    giveawayData.participants.push(interaction.user.id);

                    // Update database if available
                    try {
                        if (require('mongoose').connection.readyState === 1 && giveawayData.save) {
                            await giveawayData.save();
                        }
                    } catch (dbError) {
                        console.error('Database error saving giveaway participant:', dbError);
                    }

                    // Update client cache
                    if (interaction.client.giveaways?.has(interaction.message.id)) {
                        interaction.client.giveaways.get(interaction.message.id).participants = giveawayData.participants;
                    }

                    // Update embed with new participant count
                    const currentEmbed = interaction.message.embeds[0];
                    const updatedEmbed = createInfoEmbed('🎉 GIVEAWAY 🎉',
                        currentEmbed.description.replace(
                            /\*\*Participants:\*\* \d+/,
                            `**Participants:** ${giveawayData.participants.length}`
                        )
                    )
                    .setColor('#FFD700')
                    .setFooter({ text: 'Click the button below to enter!' });

                    await interaction.update({ embeds: [updatedEmbed] });

                    // Send confirmation
                    await interaction.followUp({ 
                        content: '✅ You have successfully entered the giveaway! Good luck!', 
                        ephemeral: true 
                    });

                } catch (error) {
                    console.error('Error handling giveaway entry:', error);
                    await interaction.reply({ 
                        content: '❌ An error occurred while entering the giveaway.', 
                        ephemeral: true 
                    });
                }
            }
        }

        // Handle track selection
        if (interaction.isButton() && interaction.customId.startsWith('select_track_')) {
            await interaction.deferReply({ ephemeral: true });

            const trackIndex = parseInt(interaction.customId.split('_')[2]);
            
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

            if (selectionData.requesterId !== interaction.user.id) {
                return interaction.editReply({ content: 'Only the person who requested the search can select a track!' });
            }

            const selectedTrack = selectionData.tracks[trackIndex];
            if (!selectedTrack) {
                return interaction.editReply({ content: 'Invalid track selection!' });
            }

            try {
                console.log(`User selected track: ${selectedTrack.name} by ${selectedTrack.artist}`);
                
                // Join voice channel if not already connected
                let connection = musicManager.connections.get(interaction.guild.id);
                if (!connection) {
                    console.log(`Joining voice channel: ${selectionData.voiceChannel.name}`);
                    connection = await musicManager.joinChannel(selectionData.voiceChannel);
                    if (!connection) {
                        return interaction.editReply({ 
                            content: 'Failed to join the voice channel! Please try again.' 
                        });
                    }
                }

                // Check if anything is currently playing
                const queueStatus = musicManager.getQueueStatus(interaction.guild.id);
                
                if (!queueStatus.isPlaying && queueStatus.queueLength === 0) {
                    // Start playing immediately
                    console.log('Starting to play track immediately');
                    const success = await musicManager.playTrack(interaction.guild.id, selectedTrack);
                    
                    if (success) {
                        const embed = createInfoEmbed('🎵 Now Playing', 
                            `**${selectedTrack.name}**\nby ${selectedTrack.artist}\n\nFrom album: ${selectedTrack.album || 'Unknown'}`
                        ).setColor('#1DB954');

                        if (selectedTrack.image) {
                            embed.setThumbnail(selectedTrack.image);
                        }

                        await interaction.editReply({ embeds: [embed] });
                    } else {
                        await interaction.editReply({ 
                            content: 'Failed to play the track. The song might not be available on YouTube.' 
                        });
                    }
                } else {
                    // Add to queue
                    const position = musicManager.addToQueue(interaction.guild.id, selectedTrack);
                    
                    const embed = createInfoEmbed('🎵 Added to Queue', 
                        `**${selectedTrack.name}**\nby ${selectedTrack.artist}\n\nPosition in queue: #${position}`
                    ).setColor('#1DB954');

                    if (selectedTrack.image) {
                        embed.setThumbnail(selectedTrack.image);
                    }

                    await interaction.channel.send({ embeds: [embed] });
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
        if (interaction.isButton() && (interaction.customId === 'report_ticket' || interaction.customId === 'feedback_ticket')) {
            await interaction.deferReply({ ephemeral: true });

            try {
                // Find the category where the ticket channel is located
                const ticketChannel = interaction.guild.channels.cache.get('1374528951527149659');
                const category = ticketChannel?.parent;

                if (!category) {
                    return interaction.editReply({ content: 'Could not find the ticket category!' });
                }

                // Generate ticket number
                const ticketNumber = Math.floor(Math.random() * 10000);
                const ticketType = interaction.customId === 'report_ticket' ? 'report' : 'feedback';
                const channelName = `${ticketType}-ticket-${ticketNumber}`;

                // Create ticket channel
                const ticketChannelCreated = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                        },
                    ],
                });

                // Add permissions for roles with "Manage Channels" and "Timeout Users"
                const staffRoles = interaction.guild.roles.cache.filter(role => 
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
                    content: `<@${interaction.user.id}>`,
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
        if (interaction.isButton() && interaction.customId.startsWith('close_ticket_')) {
            await interaction.deferReply();

            try {
                // Get all messages in the channel for transcript
                const messages = await interaction.channel.messages.fetch({ limit: 100 });
                const transcript = messages.reverse().map(msg => 
                    `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
                ).join('\n');

                // Send transcript to logs channel
                const logsChannelId = '1374516222166569080';
                const logsChannel = interaction.guild.channels.cache.get(logsChannelId);

                if (logsChannel) {
                    const transcriptEmbed = createInfoEmbed(
                        `Ticket Closed - ${interaction.channel.name}`,
                        `Closed by: ${interaction.user.tag}\nChannel: ${interaction.channel.name}\nClosed at: ${new Date().toLocaleString()}`
                    ).setColor('#ff0000');

                    await logsChannel.send({ embeds: [transcriptEmbed] });

                    // Send transcript as file if there are messages
                    if (transcript.length > 0) {
                        const fs = require('fs');
                        const transcriptFile = `transcript-${interaction.channel.name}-${Date.now()}.txt`;
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
                    await interaction.channel.delete();
                }, 3000);

            } catch (error) {
                console.error('Error closing ticket:', error);
                await interaction.editReply({ content: 'There was an error closing the ticket!' });
            }
        }

        // Handle slash commands if needed
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        }
    },
};