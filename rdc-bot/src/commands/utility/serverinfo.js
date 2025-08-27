module.exports = {
    name: 'serverinfo',
    aliases: ['server', 'guild', 'si'],
    description: 'Get information about the server',
    usage: '!serverinfo',
    category: 'utility',
    guildOnly: true,
    
    async execute(message, args, client) {
        const guild = message.guild;
        
        // Get member counts
        const totalMembers = guild.memberCount;
        const humans = guild.members.cache.filter(member => !member.user.bot).size;
        const bots = guild.members.cache.filter(member => member.user.bot).size;
        const onlineMembers = guild.members.cache.filter(member => member.presence?.status !== 'offline').size;
        
        // Get channel counts
        const textChannels = guild.channels.cache.filter(ch => ch.type === 0).size;
        const voiceChannels = guild.channels.cache.filter(ch => ch.type === 2).size;
        const categories = guild.channels.cache.filter(ch => ch.type === 4).size;
        const totalChannels = guild.channels.cache.size;
        
        // Get boost info
        const boostTier = {
            0: 'None',
            1: 'Tier 1',
            2: 'Tier 2',
            3: 'Tier 3'
        };
        
        // Get features
        const features = guild.features.length > 0 
            ? guild.features.map(f => f.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())).join(', ')
            : 'None';
        
        // Get verification level
        const verificationLevels = {
            0: 'None',
            1: 'Low',
            2: 'Medium',
            3: 'High',
            4: 'Very High'
        };
        
        // Create embed
        const serverEmbed = {
            color: 0x0099ff,
            title: `🏛️ ${guild.name}`,
            thumbnail: {
                url: guild.iconURL({ dynamic: true, size: 512 })
            },
            fields: [
                {
                    name: '👑 Owner',
                    value: `<@${guild.ownerId}>`,
                    inline: true
                },
                {
                    name: '🆔 Server ID',
                    value: guild.id,
                    inline: true
                },
                {
                    name: '📅 Created',
                    value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
                    inline: true
                },
                {
                    name: '👥 Members',
                    value: `**Total:** ${totalMembers}\n` +
                           `**Humans:** ${humans}\n` +
                           `**Bots:** ${bots}\n` +
                           `**Online:** ${onlineMembers}`,
                    inline: true
                },
                {
                    name: '💬 Channels',
                    value: `**Total:** ${totalChannels}\n` +
                           `**Text:** ${textChannels}\n` +
                           `**Voice:** ${voiceChannels}\n` +
                           `**Categories:** ${categories}`,
                    inline: true
                },
                {
                    name: '🎭 Other Stats',
                    value: `**Roles:** ${guild.roles.cache.size}\n` +
                           `**Emojis:** ${guild.emojis.cache.size}\n` +
                           `**Stickers:** ${guild.stickers.cache.size}`,
                    inline: true
                },
                {
                    name: '💎 Boost Status',
                    value: `**Tier:** ${boostTier[guild.premiumTier]}\n` +
                           `**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
                    inline: true
                },
                {
                    name: '🔒 Security',
                    value: `**Verification:** ${verificationLevels[guild.verificationLevel]}\n` +
                           `**2FA Required:** ${guild.mfaLevel ? 'Yes' : 'No'}`,
                    inline: true
                },
                {
                    name: '🌍 Other',
                    value: `**Region:** Auto\n` +
                           `**System Channel:** ${guild.systemChannel || 'None'}`,
                    inline: true
                }
            ],
            timestamp: new Date(),
            footer: { text: `Requested by ${message.author.tag}` }
        };
        
        // Add features if any
        if (features !== 'None') {
            serverEmbed.fields.push({
                name: '✨ Features',
                value: features.length > 1024 ? features.substring(0, 1021) + '...' : features,
                inline: false
            });
        }
        
        // Add description if exists
        if (guild.description) {
            serverEmbed.description = guild.description;
        }
        
        // Add banner if exists
        if (guild.banner) {
            serverEmbed.image = {
                url: guild.bannerURL({ size: 512 })
            };
        }
        
        message.reply({ embeds: [serverEmbed] });
    }
};