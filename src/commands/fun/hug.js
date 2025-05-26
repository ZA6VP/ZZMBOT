const { createInfoEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'hug',
        description: 'Give someone a warm hug',
        usage: '!hug <user>',
        category: 'fun',
        cooldown: 3
    },
    async execute(message, args) {
        if (!args[0]) {
            return message.reply('You need to mention someone to hug! Usage: `!hug @user`');
        }

        // Get the target user
        const target = message.mentions.users.first() || 
                      message.guild.members.cache.get(args[0])?.user;

        if (!target) {
            return message.reply('I couldn\'t find that user! Please mention someone valid.');
        }

        if (target.id === message.author.id) {
            return message.reply('You can\'t hug yourself! Find someone else to hug! 🤗');
        }

        // Create embed with hug gif
        const embed = createInfoEmbed('HUG', 
            `**${message.author.username}** giving a warm hug to **${target.username}**`
        )
        .setImage('https://cdn.discordapp.com/emojis/1350670133533736981.gif')
        .setColor('#ffa500');

        message.channel.send({ embeds: [embed] });
    },
};