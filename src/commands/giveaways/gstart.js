const { PermissionFlagsBits } = require('discord.js');
const { hasPermission, hasRole } = require('../../utils/permissionChecks');
const { createInfoEmbed, createErrorEmbed } = require('../../utils/embedBuilder');
const Giveaway = require('../../models/Giveaway');

function parseDuration(duration) {
    const regex = /^(\d+)([smhdw])$/;
    const match = duration.toLowerCase().match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const multipliers = {
        's': 1000,
        'm': 60 * 1000,
        'h': 60 * 60 * 1000,
        'd': 24 * 60 * 60 * 1000,
        'w': 7 * 24 * 60 * 60 * 1000
    };
    
    return value * multipliers[unit];
}

module.exports = {
    data: {
        name: 'gstart',
        description: 'Start a giveaway',
        usage: '!gstart <duration> <winners> <prize>',
        aliases: ['giveaway', 'gcreate'],
        cooldown: 10
    },
    async execute(message, args) {
        const config = message.client.config;
        
        // Check permissions
        if (!hasPermission(message.member, PermissionFlagsBits.Administrator) && 
            !hasRole(message.member, config.giveaway.managerRoles)) {
            const embed = createErrorEmbed('Permission Denied', 'You need Administrator permission or a Giveaway Manager role to use this command.');
            return message.reply({ embeds: [embed] });
        }

        // Check arguments
        if (args.length < 3) {
            const embed = createErrorEmbed('Invalid Usage', 'Usage: `!gstart <duration> <winners> <prize>`\nExample: `!gstart 1h 2 Discord Nitro`');
            return message.reply({ embeds: [embed] });
        }

        const duration = args[0];
        const winnersCount = parseInt(args[1]);
        const prize = args.slice(2).join(' ');

        // Validate duration
        const durationMs = parseDuration(duration);
        if (!durationMs) {
            const embed = createErrorEmbed('Invalid Duration', 'Please provide a valid duration (e.g., 30m, 2h, 1d, 1w).');
            return message.reply({ embeds: [embed] });
        }

        // Validate winners count
        if (!winnersCount || winnersCount < 1 || winnersCount > 20) {
            const embed = createErrorEmbed('Invalid Winners Count', 'Please provide a valid number of winners (1-20).');
            return message.reply({ embeds: [embed] });
        }

        // Validate prize
        if (prize.length < 1 || prize.length > 256) {
            const embed = createErrorEmbed('Invalid Prize', 'Prize description must be between 1 and 256 characters.');
            return message.reply({ embeds: [embed] });
        }

        try {
            const endTime = new Date(Date.now() + durationMs);
            
            // Create giveaway embed
            const giveawayEmbed = createInfoEmbed('🎉 GIVEAWAY 🎉', 
                `**Prize:** ${prize}\n**Winners:** ${winnersCount}\n**Ends:** <t:${Math.floor(endTime.getTime() / 1000)}:R>\n**Hosted by:** ${message.author}`
            )
            .setColor('#FFD700')
            .setFooter({ text: `React with ${config.giveaway.reactionEmoji} to enter!` });

            // Send giveaway message
            const giveawayMessage = await message.channel.send({ embeds: [giveawayEmbed] });
            
            // Add reaction
            await giveawayMessage.react(config.giveaway.reactionEmoji);

            // Save to database
            const giveaway = new Giveaway({
                messageId: giveawayMessage.id,
                channelId: message.channel.id,
                guildId: message.guild.id,
                hostId: message.author.id,
                prize: prize,
                winners: winnersCount,
                endTime: endTime,
                participants: [],
                winnersList: [],
                active: true
            });
            await giveaway.save();

            // Confirm to host
            const confirmEmbed = createSuccessEmbed('Giveaway Started', 
                `Giveaway for **${prize}** has been started!\nEnds: <t:${Math.floor(endTime.getTime() / 1000)}:R>`
            );
            await message.reply({ embeds: [confirmEmbed] });

            // Auto-end giveaway when time expires
            setTimeout(async () => {
                try {
                    const giveawayData = await Giveaway.findOne({ messageId: giveawayMessage.id, active: true });
                    if (giveawayData && giveawayData.participants.length > 0) {
                        // Pick random winners
                        const winners = [];
                        const participants = [...giveawayData.participants];
                        
                        for (let i = 0; i < Math.min(winnersCount, participants.length); i++) {
                            const randomIndex = Math.floor(Math.random() * participants.length);
                            winners.push(participants[randomIndex]);
                            participants.splice(randomIndex, 1);
                        }

                        // Update database
                        giveawayData.winnersList = winners;
                        giveawayData.active = false;
                        await giveawayData.save();

                        // Update embed
                        const endedEmbed = createInfoEmbed('🎉 GIVEAWAY ENDED 🎉', 
                            `**Prize:** ${prize}\n**Winners:** ${winners.map(id => `<@${id}>`).join(', ')}\n**Hosted by:** ${message.author}`
                        )
                        .setColor('#FF0000')
                        .setFooter({ text: 'This giveaway has ended!' });

                        await giveawayMessage.edit({ embeds: [endedEmbed] });

                        // Announce winners
                        const winnersText = winners.map(id => `<@${id}>`).join(', ');
                        await message.channel.send(`🎉 Congratulations ${winnersText}! You won **${prize}**!`);
                    } else {
                        // No participants
                        const noWinnersEmbed = createInfoEmbed('🎉 GIVEAWAY ENDED 🎉', 
                            `**Prize:** ${prize}\n**Winners:** No valid participants\n**Hosted by:** ${message.author}`
                        )
                        .setColor('#FF0000')
                        .setFooter({ text: 'This giveaway has ended!' });

                        await giveawayMessage.edit({ embeds: [noWinnersEmbed] });
                        await message.channel.send('😢 No one participated in the giveaway!');
                        
                        await Giveaway.updateOne({ messageId: giveawayMessage.id }, { active: false });
                    }
                } catch (error) {
                    console.error('Error ending giveaway:', error);
                }
            }, durationMs);

        } catch (error) {
            console.error('Error starting giveaway:', error);
            const embed = createErrorEmbed('Error', 'An error occurred while starting the giveaway.');
            message.reply({ embeds: [embed] });
        }
    },
};
