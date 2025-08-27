const { User } = require('../../utils/database');
const embedBuilder = require('../../utils/embedBuilder');

module.exports = {
    name: 'xp',
    aliases: ['level', 'rank', 'experience'],
    description: 'View your or another user\'s XP and level',
    usage: '!xp [@user]',
    category: 'leveling',
    guildOnly: true,
    
    async execute(message, args, client) {
        // Get target user
        const target = message.mentions.users.first() || message.author;
        
        try {
            // Get user data
            const userData = await User.findOne({ 
                userId: target.id, 
                guildId: message.guild.id 
            });
            
            if (!userData) {
                const noDataEmbed = {
                    color: 0xff0000,
                    title: '❌ No Data',
                    description: `${target.tag} hasn't earned any XP yet.`,
                    timestamp: new Date()
                };
                return message.reply({ embeds: [noDataEmbed] });
            }
            
            // Calculate level from XP
            const level = Math.floor(0.1 * Math.sqrt(userData.xp));
            const xpNeeded = Math.pow((level + 1) / 0.1, 2);
            const xpProgress = userData.xp;
            const xpRemaining = Math.floor(xpNeeded - xpProgress);
            
            // Calculate rank
            const allUsers = await User.find({ guildId: message.guild.id })
                .sort({ xp: -1 })
                .select('userId');
            
            const rank = allUsers.findIndex(u => u.userId === target.id) + 1;
            
            // Create progress bar
            const progressPercentage = ((xpProgress - Math.pow(level / 0.1, 2)) / (xpNeeded - Math.pow(level / 0.1, 2))) * 100;
            const progressBar = createProgressBar(progressPercentage);
            
            // Create embed
            const xpEmbed = {
                color: 0x0099ff,
                title: `📊 ${target.username}'s Level Stats`,
                thumbnail: {
                    url: target.displayAvatarURL({ dynamic: true })
                },
                fields: [
                    { name: '🏆 Level', value: level.toString(), inline: true },
                    { name: '⭐ Total XP', value: xpProgress.toLocaleString(), inline: true },
                    { name: '📈 Server Rank', value: `#${rank}`, inline: true },
                    { name: '💬 Messages', value: (userData.messages || 0).toLocaleString(), inline: true },
                    { name: '🎯 XP to Next Level', value: xpRemaining.toLocaleString(), inline: true },
                    { name: '📊 Progress', value: `${progressBar} ${Math.floor(progressPercentage)}%`, inline: false }
                ],
                timestamp: new Date(),
                footer: { text: `User ID: ${target.id}` }
            };
            
            // Add next role reward if applicable
            const nextLevelRole = Object.entries(client.config.levelUpRole || {})
                .map(([lvl, role]) => ({ level: parseInt(lvl), role }))
                .filter(r => r.level > level)
                .sort((a, b) => a.level - b.level)[0];
                
            if (nextLevelRole) {
                xpEmbed.fields.push({
                    name: '🎁 Next Role Reward',
                    value: `**${nextLevelRole.role}** at level ${nextLevelRole.level}`,
                    inline: false
                });
            }
            
            message.reply({ embeds: [xpEmbed] });
            
        } catch (error) {
            console.error('XP command error:', error);
            message.reply({ embeds: [embedBuilder.error('Error', 'An error occurred while fetching XP data.')] });
        }
    }
};

// Helper function to create progress bar
function createProgressBar(percentage) {
    const filled = Math.floor(percentage / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}