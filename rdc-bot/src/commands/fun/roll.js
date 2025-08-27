module.exports = {
    name: 'roll',
    aliases: ['dice', 'rolldice'],
    description: 'Roll a dice',
    usage: '!roll [sides]',
    category: 'fun',
    
    async execute(message, args, client) {
        // Parse number of sides (default 6)
        let sides = 6;
        if (args[0]) {
            sides = parseInt(args[0]);
            if (!sides || sides < 2 || sides > 1000) {
                return message.reply('❌ Please provide a valid number of sides between 2 and 1000.');
            }
        }
        
        // Roll the dice
        const result = Math.floor(Math.random() * sides) + 1;
        
        // Determine dice emoji
        const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const diceEmoji = sides === 6 && result <= 6 ? diceEmojis[result - 1] : '🎲';
        
        // Create embed
        const rollEmbed = {
            color: 0x0099ff,
            title: `${diceEmoji} Dice Roll`,
            description: `You rolled a **${result}**!`,
            fields: [
                { name: 'Dice Type', value: `D${sides}`, inline: true },
                { name: 'Range', value: `1-${sides}`, inline: true }
            ],
            footer: { text: `Rolled by ${message.author.tag}` },
            timestamp: new Date()
        };
        
        // Add special messages for certain results
        if (result === 1 && sides > 6) {
            rollEmbed.description += '\n😢 Critical fail!';
            rollEmbed.color = 0xff0000;
        } else if (result === sides && sides > 6) {
            rollEmbed.description += '\n🎉 Critical success!';
            rollEmbed.color = 0x00ff00;
        } else if (result === 69 || result === 420) {
            rollEmbed.description += '\n😏 Nice!';
        }
        
        message.reply({ embeds: [rollEmbed] });
    }
};