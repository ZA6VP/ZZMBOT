const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'serverinfo',
        description: 'Get information about the server',
        usage: '!serverinfo',
        aliases: ['server', 'guild', 'si'],
        cooldown: 5
    },
    async execute(message, args) {
        try {
            const guild = message.guild;

            // Get various counts
            const totalMembers = guild.memberCount;
            const humans = guild.members.cache.filter(member => !member.user.bot).size;
            const bots = guild.members.cache.filter(member => member.user.bot).size;
            
            const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
            const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
            const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
            
            const totalRoles = guild.roles.cache.size - 1; // Exclude @everyone
            const totalEmojis = guild.emojis.cache.size;

            // Get server boosts
            const boostLevel = guild.premiumTier;
            const boostCount = guild.premiumSubscriptionCount;

            // Get verification level
            const verificationLevels = {
                0: 'None',
                1: 'Low',
                2: 'Medium',
                3: 'High',
                4: 'Very High'
            };

            // Get explicit content filter
            const contentFilters = {
                0: 'Disabled',
                1: 'Members without roles',
                2: 'All members'
            };

            // Calculate server age
            const serverCreated = Math.floor(guild.createdTimestamp / 1000);

            // Create embed
            const embed = createInfoEmbed(`${guild.name} Server Information`, 
                `**Server ID:** ${guild.id}\n**Owner:** <@${guild.ownerId}>`
            )
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '📅 Created', value: `<t:${serverCreated}:F>\n(<t:${serverCreated}:R>)`, inline: true },
                { name: '👥 Members', value: `**Total:** ${totalMembers}\n**Humans:** ${humans}\n**Bots:** ${bots}`, inline: true },
                { name: '📊 Channels', value: `**Text:** ${textChannels}\n**Voice:** ${voiceChannels}\n**Categories:** ${categories}`, inline: true },
                { name: '🛡️ Security', value: `**Verification:** ${verificationLevels[guild.verificationLevel]}\n**Content Filter:** ${contentFilters[guild.explicitContentFilter]}`, inline: true },
                { name: '🎭 Server Stats', value: `**Roles:** ${totalRoles}\n**Emojis:** ${totalEmojis}`, inline: true },
                { name: '💎 Boosts', value: `**Level:** ${boostLevel}\n**Boosts:** ${boostCount}`, inline: true }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` });

            // Add server banner if available
            if (guild.bannerURL()) {
                embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
            }

            // Add server description if available
            if (guild.description) {
                embed.setDescription(`${guild.description}\n\n**Server ID:** ${guild.id}\n**Owner:** <@${guild.ownerId}>`);
            }

            await message.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error in serverinfo command:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while fetching server information.');
            message.reply({ embeds: [embed] });
        }
    },
};
