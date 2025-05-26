const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'userinfo',
        description: 'Get information about a user',
        usage: '!userinfo [@user]',
        aliases: ['user', 'whois', 'ui'],
        cooldown: 3
    },
    async execute(message, args) {
        try {
            // Get target user (mentioned user or message author)
            const target = message.mentions.members.first() || message.member;
            const user = target.user;

            // Calculate account age
            const accountCreated = Math.floor(user.createdTimestamp / 1000);
            const joinedServer = Math.floor(target.joinedTimestamp / 1000);

            // Get user's roles (excluding @everyone)
            const roles = target.roles.cache
                .filter(role => role.name !== '@everyone')
                .map(role => role.toString())
                .slice(0, 10); // Limit to 10 roles to avoid embed field limits

            const rolesText = roles.length > 0 ? roles.join(', ') : 'No roles';
            
            // Determine user status
            const status = target.presence?.status || 'offline';
            const statusEmoji = {
                online: '🟢',
                idle: '🟡',
                dnd: '🔴',
                offline: '⚫'
            };

            // Create embed
            const embed = createInfoEmbed(`User Info - ${user.tag}`, 
                `**ID:** ${user.id}\n**Status:** ${statusEmoji[status]} ${status.charAt(0).toUpperCase() + status.slice(1)}`
            )
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: 'Account Created', value: `<t:${accountCreated}:F>\n(<t:${accountCreated}:R>)`, inline: true },
                { name: 'Joined Server', value: `<t:${joinedServer}:F>\n(<t:${joinedServer}:R>)`, inline: true },
                { name: 'Nickname', value: target.nickname || 'None', inline: true },
                { name: `Roles [${target.roles.cache.size - 1}]`, value: rolesText, inline: false }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` });

            // Add activity if present
            if (target.presence?.activities && target.presence.activities.length > 0) {
                const activity = target.presence.activities[0];
                let activityText = `**${activity.type === 0 ? 'Playing' : activity.type === 1 ? 'Streaming' : activity.type === 2 ? 'Listening to' : activity.type === 3 ? 'Watching' : 'Custom'}** ${activity.name}`;
                
                if (activity.details) activityText += `\n${activity.details}`;
                if (activity.state) activityText += `\n${activity.state}`;
                
                embed.addFields({ name: 'Activity', value: activityText, inline: false });
            }

            // Add highest role
            const highestRole = target.roles.highest;
            if (highestRole.name !== '@everyone') {
                embed.addFields({ name: 'Highest Role', value: highestRole.toString(), inline: true });
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in userinfo command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while fetching user information.');
            message.reply({ embeds: [embed] });
        }
    },
};
