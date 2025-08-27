const { User } = require('../../utils/database');

module.exports = {
    name: 'userinfo',
    aliases: ['user', 'whois', 'ui'],
    description: 'Get information about a user',
    usage: '!userinfo [@user]',
    category: 'utility',
    guildOnly: true,
    
    async execute(message, args, client) {
        // Get target user
        const target = message.mentions.members.first() || 
                      message.guild.members.cache.get(args[0]) || 
                      message.member;
        
        if (!target) {
            return message.reply('❌ User not found.');
        }
        
        // Get user flags
        const flags = target.user.flags ? target.user.flags.toArray() : [];
        const flagEmojis = {
            'Staff': '👨‍💼',
            'Partner': '🤝',
            'Hypesquad': '🏠',
            'BugHunterLevel1': '🐛',
            'BugHunterLevel2': '🐛',
            'HypeSquadOnlineHouse1': '🏠',
            'HypeSquadOnlineHouse2': '🏠',
            'HypeSquadOnlineHouse3': '🏠',
            'PremiumEarlySupporter': '💎',
            'VerifiedBot': '✅',
            'VerifiedDeveloper': '👨‍💻',
            'ActiveDeveloper': '💻'
        };
        
        const badges = flags.map(flag => flagEmojis[flag] || flag).join(' ') || 'None';
        
        // Get roles (excluding @everyone)
        const roles = target.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .join(', ') || 'None';
        
        // Get presence info
        const status = {
            online: '🟢 Online',
            idle: '🟡 Idle',
            dnd: '🔴 Do Not Disturb',
            offline: '⚫ Offline'
        };
        
        const userStatus = target.presence?.status || 'offline';
        const activity = target.presence?.activities[0];
        
        // Get database info
        const userData = await User.findOne({ 
            userId: target.id, 
            guildId: message.guild.id 
        });
        
        const level = userData ? Math.floor(0.1 * Math.sqrt(userData.xp)) : 0;
        const warnings = userData?.warnings?.length || 0;
        
        // Create embed
        const userEmbed = {
            color: target.displayColor || 0x0099ff,
            title: `👤 User Information - ${target.user.tag}`,
            thumbnail: {
                url: target.user.displayAvatarURL({ dynamic: true, size: 512 })
            },
            fields: [
                {
                    name: '📋 General',
                    value: `**Username:** ${target.user.username}\n` +
                           `**ID:** ${target.user.id}\n` +
                           `**Mention:** ${target}\n` +
                           `**Bot:** ${target.user.bot ? 'Yes' : 'No'}`,
                    inline: true
                },
                {
                    name: '📊 Server Stats',
                    value: `**Nickname:** ${target.nickname || 'None'}\n` +
                           `**Level:** ${level}\n` +
                           `**Warnings:** ${warnings}\n` +
                           `**Highest Role:** ${target.roles.highest}`,
                    inline: true
                },
                {
                    name: '📅 Dates',
                    value: `**Created:** <t:${Math.floor(target.user.createdTimestamp / 1000)}:F>\n` +
                           `**Joined:** <t:${Math.floor(target.joinedTimestamp / 1000)}:F>`,
                    inline: false
                },
                {
                    name: '🎮 Status',
                    value: `**Status:** ${status[userStatus]}\n` +
                           `**Activity:** ${activity ? `${activity.type} ${activity.name}` : 'None'}`,
                    inline: true
                },
                {
                    name: '🏅 Badges',
                    value: badges,
                    inline: true
                },
                {
                    name: `🎭 Roles [${target.roles.cache.size - 1}]`,
                    value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles,
                    inline: false
                }
            ],
            timestamp: new Date(),
            footer: { text: `Requested by ${message.author.tag}` }
        };
        
        // Add banner if user has one
        try {
            const user = await target.user.fetch();
            if (user.banner) {
                userEmbed.image = {
                    url: user.bannerURL({ dynamic: true, size: 512 })
                };
            }
        } catch (error) {
            // User might not have a banner
        }
        
        message.reply({ embeds: [userEmbed] });
    }
};