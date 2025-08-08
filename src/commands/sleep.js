const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'sleep',
    aliases: ['nap', 'rest'],
    description: 'Handle Zolory\'s sleep schedule',
    async execute(message, args) {
        const { client } = message;
        
        if (args.length === 0) {
            // Show sleep status
            const status = client.sleepManager.getSleepStatus();
            const embed = new EmbedBuilder()
                .setTitle('😴 Sleep Status')
                .setColor('#00ff00')
                .addFields(
                    { name: '😴 Status', value: status.status.toUpperCase(), inline: true },
                    { name: '⏰ Duration', value: status.duration || 'N/A', inline: true },
                    { name: '🌙 Bedtime', value: client.config.botPersonality.sleepSchedule.bedtime, inline: true },
                    { name: '🌅 Wake Time', value: client.config.botPersonality.sleepSchedule.wakeTime, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag}` })
                .setTimestamp();

            await message.reply({ embeds: [embed] });
        } else {
            // Handle sleep commands
            const result = await client.sleepManager.handleSleepCommand(client, message, args);
            await message.reply(result.message);
        }
    }
};