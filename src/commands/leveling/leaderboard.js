const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const { getLeaderboard } = require('../../utils/xpSystem');

module.exports = {
    data: {
        name: 'leaderboard',
        description: 'View the server XP leaderboard',
        usage: '!leaderboard [page]',
        aliases: ['lb', 'top'],
        cooldown: 5
    },
    async execute(message, args) {
        // Check if command is used in the correct channel
        const allowedChannelId = '1377002851678687295';
        if (message.channel.id !== allowedChannelId) {
            const embed = createErrorEmbed('Wrong Channel', `This command can only be used in <#${allowedChannelId}>.`);
            return message.reply({ embeds: [embed] });
        }

        try {
            const page = parseInt(args[0]) || 1;
            const usersPerPage = 10;
            const skip = (page - 1) * usersPerPage;

            // Get leaderboard data
            const leaderboardData = await getLeaderboard(message.guild.id, skip + usersPerPage);
            
            if (leaderboardData.length === 0) {
                const embed = createErrorEmbed('No Data', 'No users found on the leaderboard.');
                return message.reply({ embeds: [embed] });
            }

            // Get the current page's users
            const pageUsers = leaderboardData.slice(skip, skip + usersPerPage);

            // Create leaderboard text
            let leaderboardText = '';
            for (let i = 0; i < pageUsers.length; i++) {
                const userData = pageUsers[i];
                const position = skip + i + 1;
                
                // Get user from guild
                const member = await message.guild.members.fetch(userData.userId).catch(() => null);
                const displayName = member ? member.displayName : 'Unknown User';
                
                // Add medal emojis for top 3
                let positionDisplay = `**${position}.** `;
                if (position === 1) positionDisplay = '🥇 ';
                else if (position === 2) positionDisplay = '🥈 ';
                else if (position === 3) positionDisplay = '🥉 ';

                leaderboardText += `${positionDisplay}${displayName} - **Level ${userData.level}** (${userData.xp.toLocaleString()} XP)\n`;
            }

            // Find current user's position
            const allUsers = await getLeaderboard(message.guild.id, 1000); // Get more users to find position
            const userPosition = allUsers.findIndex(u => u.userId === message.author.id) + 1;

            // Create embed
            const embed = createInfoEmbed(`🏆 XP Leaderboard - Page ${page}`, leaderboardText)
                .setFooter({ text: `${message.guild.name} • Your rank: ${userPosition > 0 ? `#${userPosition}` : 'Unranked'}` });

            // Add navigation info if there are more pages
            const totalUsers = allUsers.length;
            const totalPages = Math.ceil(totalUsers / usersPerPage);
            
            if (totalPages > 1) {
                embed.setDescription(`${leaderboardText}\n*Page ${page} of ${totalPages}*`);
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in leaderboard command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while fetching the leaderboard.');
            message.reply({ embeds: [embed] });
        }
    },
};
