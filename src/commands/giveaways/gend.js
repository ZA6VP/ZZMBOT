const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, hasRole } = require('../../utils/permissionChecks');
const { createInfoEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embedBuilder');
const Giveaway = require('../../models/Giveaway');

module.exports = {
    data: {
        name: 'gend',
        description: 'End a giveaway early',
        usage: '!gend <messageID>',
        aliases: ['giveawayend', 'endgiveaway'],
        cooldown: 5
    },
    async execute(message, args) {
        const config = message.client.config;
        
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.Administrator) && 
            !hasRole(message.member, config.giveaway.managerRoles)) {
            const embed = createErrorEmbed('Permission Denied', 'You need Administrator permission or a Giveaway Manager role to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check if message ID was provided
        const messageId = args[0];
        if (!messageId || !/^\d{17,19}$/.test(messageId)) {
            const embed = createErrorEmbed('Invalid Usage', 'Please provide a valid message ID.\nUsage: `!gend <messageID>`');
            return message.reply({ embeds: [embed] });
        }

        try {
            // Find the giveaway in database
            const giveaway = await Giveaway.findOne({ messageId: messageId, active: true });
            if (!giveaway) {
                const embed = createErrorEmbed('Giveaway Not Found', 'No active giveaway found with that message ID.');
                return message.reply({ embeds: [embed] });
            }

            // Get the giveaway message
            const channel = message.guild.channels.cache.get(giveaway.channelId);
            if (!channel) {
                const embed = createErrorEmbed('Channel Not Found', 'The giveaway channel could not be found.');
                return message.reply({ embeds: [embed] });
            }

            const giveawayMessage = await channel.messages.fetch(messageId);
            if (!giveawayMessage) {
                const embed = createErrorEmbed('Message Not Found', 'The giveaway message could not be found.');
                return message.reply({ embeds: [embed] });
            }

            // Check if there are participants
            if (giveaway.participants.length === 0) {
                // No participants
                const noWinnersEmbed = createInfoEmbed('🎉 GIVEAWAY ENDED 🎉', 
                    `**Prize:** ${giveaway.prize}\n**Winners:** No valid participants\n**Hosted by:** <@${giveaway.hostId}>`
                )
                .setColor('#FF0000')
                .setFooter({ text: 'This giveaway was ended early!' });

                await giveawayMessage.edit({ embeds: [noWinnersEmbed] });
                await channel.send('😢 No one participated in the giveaway!');
                
                // Update database
                giveaway.active = false;
                await giveaway.save();
                
                const embed = createSuccessEmbed('Giveaway Ended', 'The giveaway has been ended early (no participants).');
                return message.reply({ embeds: [embed] });
            }

            // Pick random winners
            const winners = [];
            const participants = [...giveaway.participants];
            
            for (let i = 0; i < Math.min(giveaway.winners, participants.length); i++) {
                const randomIndex = Math.floor(Math.random() * participants.length);
                winners.push(participants[randomIndex]);
                participants.splice(randomIndex, 1);
            }

            // Update database
            giveaway.winnersList = winners;
            giveaway.active = false;
            await giveaway.save();

            // Update embed
            const endedEmbed = createInfoEmbed('🎉 GIVEAWAY ENDED 🎉', 
                `**Prize:** ${giveaway.prize}\n**Winners:** ${winners.map(id => `<@${id}>`).join(', ')}\n**Hosted by:** <@${giveaway.hostId}>`
            )
            .setColor('#FF0000')
            .setFooter({ text: 'This giveaway was ended early!' });

            await giveawayMessage.edit({ embeds: [endedEmbed] });

            // Announce winners
            const winnersText = winners.map(id => `<@${id}>`).join(', ');
            await channel.send(`🎉 Congratulations ${winnersText}! You won **${giveaway.prize}**!`);

            // Confirm to command executor
            const embed = createSuccessEmbed('Giveaway Ended', 
                `The giveaway has been ended early.\n**Winners:** ${winnersText}`
            );
            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error ending giveaway:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while ending the giveaway.');
            message.reply({ embeds: [embed] });
        }
    },
};
