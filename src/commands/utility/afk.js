
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const { createErrorEmbed, createSuccessEmbed } = require('../../utils/embedBuilder');
const AFK = require('../../models/AFK');

module.exports = {
    data: {
        name: 'afk',
        description: 'Set your status to AFK',
        usage: '!afk [reason]',
        aliases: ['away'],
        cooldown: 300 // 5 minutes cooldown
    },
    async execute(message, args) {
        try {
            const reason = args.join(' ') || 'No reason provided';
            const userId = message.author.id;
            const guildId = message.guild.id;

            // Check if user is already AFK
            const existingAFK = await AFK.findOne({ userId, guildId });
            if (existingAFK) {
                const embed = createErrorEmbed('Already AFK', 'You are already AFK! Send any message to remove your AFK status.');
                return message.reply({ embeds: [embed] });
            }

            // Store original nickname
            const member = message.member;
            const originalNickname = member.nickname || member.user.username;

            // Create AFK record
            const afkRecord = new AFK({
                userId,
                guildId,
                reason,
                originalNickname,
                mentions: []
            });
            await afkRecord.save();

            // Update nickname
            try {
                const newNickname = `${originalNickname} [AFK]`;
                if (newNickname.length <= 32) { // Discord nickname limit
                    await member.setNickname(newNickname);
                }
            } catch (error) {
                console.error('Could not update nickname:', error);
            }

            const embed = createSuccessEmbed('AFK Status Set', 
                `Ok ${message.author}, I've set your status to AFK!\n**Reason:** ${reason}\n\nSend any message to remove your AFK status.`
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in AFK command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while setting your AFK status.');
            message.reply({ embeds: [embed] });
        }
    }
};
