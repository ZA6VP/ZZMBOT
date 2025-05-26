const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const { createInfoEmbed, createErrorEmbed } = require('../utils/embedBuilder');
const fs = require('fs');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const { customId, user, guild, channel } = interaction;

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