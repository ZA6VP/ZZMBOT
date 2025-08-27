const { User } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'top', 'levels'],
    description: 'View the server XP leaderboard',
    usage: '!leaderboard [page]',
    category: 'leveling',
    guildOnly: true,
    
    async execute(message, args, client) {
        try {
            // Get page number
            const page = parseInt(args[0]) || 1;
            const perPage = 10;
            
            if (page < 1) {
                return message.reply({ embeds: [embedBuilder.error('Invalid Page', 'Page number must be 1 or higher.')] });
            }
            
            // Get total users count
            const totalUsers = await User.countDocuments({ 
                guildId: message.guild.id,
                xp: { $gt: 0 }
            });
            
            if (totalUsers === 0) {
                const noDataEmbed = {
                    color: 0xff0000,
                    title: '📊 Leaderboard',
                    description: 'No users have earned XP yet.',
                    timestamp: new Date()
                };
                return message.reply({ embeds: [noDataEmbed] });
            }
            
            const totalPages = Math.ceil(totalUsers / perPage);
            
            if (page > totalPages) {
                return message.reply({ 
                    embeds: [embedBuilder.error('Invalid Page', `There are only ${totalPages} pages available.`)] 
                });
            }
            
            // Get users for this page
            const users = await User.find({ 
                guildId: message.guild.id,
                xp: { $gt: 0 }
            })
            .sort({ xp: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage);
            
            // Build leaderboard
            let leaderboardText = '';
            const startRank = (page - 1) * perPage;
            
            for (let i = 0; i < users.length; i++) {
                const user = users[i];
                const rank = startRank + i + 1;
                const level = Math.floor(0.1 * Math.sqrt(user.xp));
                
                // Get user tag
                let userTag = 'Unknown User';
                try {
                    const discordUser = await client.users.fetch(user.userId);
                    userTag = discordUser.tag;
                } catch (error) {
                    userTag = user.username || 'Unknown User';
                }
                
                // Add medal for top 3 (only on first page)
                let medal = '';
                if (page === 1) {
                    if (rank === 1) medal = '🥇 ';
                    else if (rank === 2) medal = '🥈 ';
                    else if (rank === 3) medal = '🥉 ';
                }
                
                leaderboardText += `${medal}**${rank}.** ${userTag}\n`;
                leaderboardText += `   Level ${level} • ${user.xp.toLocaleString()} XP • ${(user.messages || 0).toLocaleString()} messages\n\n`;
            }
            
            // Get requester's rank
            const requesterData = await User.findOne({ 
                userId: message.author.id, 
                guildId: message.guild.id 
            });
            
            let requesterRank = 'Unranked';
            if (requesterData && requesterData.xp > 0) {
                const higherUsers = await User.countDocuments({
                    guildId: message.guild.id,
                    xp: { $gt: requesterData.xp }
                });
                requesterRank = `#${higherUsers + 1}`;
            }
            
            // Create embed
            const leaderboardEmbed = {
                color: 0x0099ff,
                title: `🏆 ${message.guild.name} Leaderboard`,
                description: leaderboardText || 'No data available.',
                fields: [
                    {
                        name: 'Your Rank',
                        value: requesterRank,
                        inline: true
                    },
                    {
                        name: 'Page',
                        value: `${page}/${totalPages}`,
                        inline: true
                    },
                    {
                        name: 'Total Users',
                        value: totalUsers.toString(),
                        inline: true
                    }
                ],
                timestamp: new Date(),
                footer: { text: `Use ${client.config.prefix}leaderboard [page] to view other pages` }
            };
            
            // Add thumbnail
            if (message.guild.iconURL()) {
                leaderboardEmbed.thumbnail = { url: message.guild.iconURL({ dynamic: true }) };
            }
            
            message.reply({ embeds: [leaderboardEmbed] });
            
        } catch (error) {
            console.error('Leaderboard error:', error);
            message.reply({ embeds: [embedBuilder.error('Error', 'An error occurred while fetching the leaderboard.')] });
        }
    }
};