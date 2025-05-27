
const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const { getUser, getLeaderboard } = require('../../utils/xpSystem');

module.exports = {
    data: {
        name: 'stats',
        description: 'View detailed stats for a user',
        usage: '!stats [@user]',
        aliases: ['profile', 'userrank'],
        cooldown: 3
    },
    async execute(message, args) {
        // Check if command is used in the correct channel
        const allowedChannelId = '1377002851678687295';
        if (message.channel.id !== allowedChannelId) {
            const embed = createErrorEmbed('Wrong Channel', `This command can only be used in <#${allowedChannelId}>.`);
            return message.reply({ embeds: [embed] });
        }

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

            // Get user's rank on leaderboard
            const leaderboard = await getLeaderboard(message.guild.id, 1000);
            const userRank = leaderboard.findIndex(u => u.userId === user.id) + 1;

            // Calculate XP for current and next level
            const currentLevel = userData.level;
            const currentXP = userData.xp;
            const xpForCurrentLevel = currentLevel * 100;
            const xpForNextLevel = (currentLevel + 1) * 100;
            const xpToNextLevel = xpForNextLevel - currentXP;

            // Create progress bar
            const progressBarLength = 20;
            const progressPercentage = (currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);
            const filledBars = Math.floor(progressPercentage * progressBarLength);
            const emptyBars = progressBarLength - filledBars;
            const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

            // Create embed
            const embed = createInfoEmbed(`📊 ${target.id === message.author.id ? 'Your' : `${user.username}'s`} Stats`, 
                `**User:** ${user.tag}\n**Level:** ${currentLevel}\n**XP:** ${currentXP.toLocaleString()}\n**Rank:** ${userRank > 0 ? `#${userRank}` : 'Unranked'}\n\n**Progress to Level ${currentLevel + 1}:**\n[${progressBar}] ${Math.floor(progressPercentage * 100)}%\n\n**Next Level:** ${xpToNextLevel.toLocaleString()} XP needed`
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '📨 Total Messages', value: userData.totalMessages.toString(), inline: true },
                { name: '⏰ Last Active', value: `<t:${Math.floor(userData.lastXPGain.getTime() / 1000)}:R>`, inline: true },
                { name: '📅 Joined Server', value: `<t:${Math.floor(target.joinedAt.getTime() / 1000)}:R>`, inline: true }
            )
            .setColor('#00FF00')
            .setFooter({ text: `${message.guild.name} • Stats` });

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in stats command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while fetching user stats.');
            message.reply({ embeds: [embed] });
        }
    },
};
