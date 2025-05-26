const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, hasRole } = require('../../utils/permissionChecks');
const { createInfoEmbed, createErrorEmbed, createSuccessEmbed } = require('../../utils/embedBuilder');
const Giveaway = require('../../models/Giveaway');

module.exports = {
    data: {
        name: 'greroll',
        description: 'Reroll winners for an ended giveaway',
        usage: '!greroll <messageID> [winners]',
        aliases: ['giveawayreroll', 'reroll'],
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
            const embed = createErrorEmbed('Invalid Usage', 'Please provide a valid message ID.\nUsage: `!greroll <messageID> [winners]`');
            return message.reply({ embeds: [embed] });
        }

        try {
            // Find the giveaway in database (including ended ones)
            const giveaway = await Giveaway.findOne({ messageId: messageId });
            if (!giveaway) {
                const embed = createErrorEmbed('Giveaway Not Found', 'No giveaway found with that message ID.');
                return message.reply({ embeds: [embed] });
            }

            // Check if giveaway has participants
            if (giveaway.participants.length === 0) {
                const embed = createErrorEmbed('No Participants', 'This giveaway has no participants to reroll from.');
                return message.reply({ embeds: [embed] });
            }

            // Get number of winners (use provided number or original)
            let winnersCount = parseInt(args[1]) || giveaway.winners;
            if (winnersCount < 1 || winnersCount > 20) {
                winnersCount = giveaway.winners;
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

            // Pick new random winners
            const winners = [];
            const participants = [...giveaway.participants];
            
            for (let i = 0; i < Math.min(winnersCount, participants.length); i++) {
                const randomIndex = Math.floor(Math.random() * participants.length);
                winners.push(participants[randomIndex]);
                participants.splice(randomIndex, 1);
            }

            // Update database
            giveaway.winnersList = winners;
            giveaway.active = false;
            await giveaway.save();

            // Update embed
            const rerolledEmbed = createInfoEmbed('🎉 GIVEAWAY REROLLED 🎉', 
                `**Prize:** ${giveaway.prize}\n**New Winners:** ${winners.map(id => `<@${id}>`).join(', ')}\n**Hosted by:** <@${giveaway.hostId}>`
            )
            .setColor('#00FF00')
            .setFooter({ text: 'This giveaway has been rerolled!' });

            await giveawayMessage.edit({ embeds: [rerolledEmbed] });

            // Announce new winners
            const winnersText = winners.map(id => `<@${id}>`).join(', ');
            await channel.send(`🎉 **REROLL!** Congratulations ${winnersText}! You are the new winners of **${giveaway.prize}**!`);

            // Confirm to command executor
            const embed = createSuccessEmbed('Giveaway Rerolled', 
                `The giveaway has been rerolled.\n**New Winners:** ${winnersText}`
            );
            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error rerolling giveaway:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while rerolling the giveaway.');
            message.reply({ embeds: [embed] });
        }
    },
};
