const { createInfoEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'kiss',
        description: 'Give someone a cute kiss',
        usage: '!kiss <user>',
        category: 'fun',
        cooldown: 3
    },
    async execute(message, args) {
        if (!args[0]) {
            return message.reply('You need to mention someone to kiss! Usage: `!kiss @user`');
        }

        // Get the target user
        const target = message.mentions.users.first() || 
                      message.guild.members.cache.get(args[0])?.user;

        if (!target) {
            return message.reply('I couldn\'t find that user! Please mention someone valid.');
        }

        if (target.id === message.author.id) {
            return message.reply('You can\'t kiss yourself! Find someone else to kiss! 💋');
        }

        // Create embed with kiss gif
        const embed = createInfoEmbed('KISS', 
            `**${message.author.username}** giving a cute kiss to **${target.username}**`
        )
        .setImage('https://cdn.discordapp.com/emojis/1350670501344968714.gif')
        .setColor('#ff69b4');

        message.channel.send({ embeds: [embed] });
    },
};