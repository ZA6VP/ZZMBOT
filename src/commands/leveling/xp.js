const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const { getUser } = require('../../utils/xpSystem');

module.exports = {
    data: {
        name: 'xp',
        description: 'View your or another user\'s XP and level',
        usage: '!xp [@user]',
        aliases: ['level', 'rank'],
        cooldown: 3
    },
    async execute(message, args) {
        try {
            // Get target user (mentioned user or message author)
            const target = message.mentions.members.first() || message.member;
            const user = target.user;

            // Get user data from database
            const userData = await getUser(user.id, message.guild.id);
            if (!userData) {
                const embed = createErrorEmbed('Error', 'Could not retrieve user data.');
                return message.reply({ embeds: [embed] });
            }

            // Calculate XP needed for next level
            const currentLevel = userData.level;
            const currentXP = userData.xp;
            const { getXPForLevel, getXPToNextLevel } = require('../../utils/xpSystem');
            const xpForCurrentLevel = getXPForLevel(currentLevel);
            const xpForNextLevel = getXPForLevel(currentLevel + 1);
            const xpToNextLevel = getXPToNextLevel(currentXP, currentLevel);

            // Create progress bar
            const progressBarLength = 20;
            const progressPercentage = (currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);
            const filledBars = Math.floor(progressPercentage * progressBarLength);
            const emptyBars = progressBarLength - filledBars;
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

            // Create embed
            const embed = createInfoEmbed(`${target.id === message.author.id ? 'Your' : `${user.username}'s`} Level & XP`, 
                `**Level:** ${currentLevel}\n**XP:** ${currentXP.toLocaleString()}\n**Next Level:** ${xpToNextLevel.toLocaleString()} XP needed\n\n**Progress to Level ${currentLevel + 1}:**\n[${progressBar}] ${Math.floor(progressPercentage * 100)}%`
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Total Messages', value: userData.totalMessages.toString(), inline: true },
                { name: 'Last Active', value: `<t:${Math.floor(userData.lastXPGain.getTime() / 1000)}:R>`, inline: true }
            );

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in XP command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while fetching XP data.');
            message.reply({ embeds: [embed] });
        }
    },
};
