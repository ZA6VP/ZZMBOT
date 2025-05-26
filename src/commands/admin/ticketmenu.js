const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createInfoEmbed } = require('../../utils/embedBuilder');
const { isAdmin } = require('../../utils/permissionChecks');

module.exports = {
    data: {
        name: 'ticketmenu',
        description: 'Set up the ticket menu with buttons',
        usage: '!ticketmenu',
        category: 'admin',
        cooldown: 5
    },
    async execute(message, args) {
        if (!isAdmin(message.member)) {
            return message.reply('You need administrator permissions to use this command!');
        }

        const ticketChannelId = '1374528951527149659';
        const ticketChannel = message.guild.channels.cache.get(ticketChannelId);

        if (!ticketChannel) {
            return message.reply('Could not find the ticket channel!');
        }

        // Create embed
        const embed = createInfoEmbed('Ticket Menu', 
            'Open a new Ticket using the button below this message!'
        )
        .setImage('https://i.ibb.co/Zv7zDJ8/20250215-034332.jpg')
        .setColor('#0099ff');

        // Create buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('report_ticket')
                    .setLabel('Report')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('feedback_ticket')
                    .setLabel('FeedBack')
                    .setStyle(ButtonStyle.Secondary)
            );

        await ticketChannel.send({ embeds: [embed], components: [row] });
        message.reply('Ticket menu has been set up successfully!');
    },
};