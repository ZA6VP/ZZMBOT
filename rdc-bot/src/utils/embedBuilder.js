module.exports = {
    // Success embed
    success(title, description, footer = null) {
        const embed = {
            color: 0x00ff00,
            title: `✅ ${title}`,
            description,
            timestamp: new Date()
        };
        if (footer) embed.footer = { text: footer };
        return embed;
    },
    
    // Error embed
    error(title, description, footer = null) {
        const embed = {
            color: 0xff0000,
            title: `❌ ${title}`,
            description,
            timestamp: new Date()
        };
        if (footer) embed.footer = { text: footer };
        return embed;
    },
    
    // Warning embed
    warning(title, description, footer = null) {
        const embed = {
            color: 0xffff00,
            title: `⚠️ ${title}`,
            description,
            timestamp: new Date()
        };
        if (footer) embed.footer = { text: footer };
        return embed;
    },
    
    // Info embed
    info(title, description, footer = null) {
        const embed = {
            color: 0x0099ff,
            title: `ℹ️ ${title}`,
            description,
            timestamp: new Date()
        };
        if (footer) embed.footer = { text: footer };
        return embed;
    },
    
    // Moderation log embed
    modLog(action, moderator, target, reason = 'No reason provided', duration = null) {
        const embed = {
            color: 0xff9900,
            title: `🔨 ${action}`,
            fields: [
                { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag}`, inline: true },
                { name: 'Reason', value: reason, inline: false }
            ],
            timestamp: new Date(),
            footer: { text: `User ID: ${target.id}` }
        };
        
        if (duration) {
            embed.fields.push({ name: 'Duration', value: duration, inline: true });
        }
        
        if (target.avatarURL()) {
            embed.thumbnail = { url: target.avatarURL({ dynamic: true }) };
        }
        
        return embed;
    },
    
    // Giveaway embed
    giveaway(prize, hostedBy, winners, endTime, ended = false, winnerList = []) {
        const embed = {
            color: ended ? 0xff0000 : 0x00ff00,
            title: '🎉 GIVEAWAY 🎉',
            description: `**Prize:** ${prize}\n**Winners:** ${winners}\n**Hosted by:** ${hostedBy}`,
            timestamp: endTime,
            footer: { text: ended ? 'Ended' : 'Ends' }
        };
        
        if (ended && winnerList.length > 0) {
            embed.fields = [{
                name: 'Winners',
                value: winnerList.map(w => `<@${w}>`).join('\n')
            }];
        } else if (ended) {
            embed.fields = [{
                name: 'Winners',
                value: 'No valid participants'
            }];
        } else {
            embed.fields = [{
                name: 'How to Enter',
                value: 'React with 🎉 to enter!'
            }];
        }
        
        return embed;
    }
};