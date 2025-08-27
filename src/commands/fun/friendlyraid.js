const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { createSuccessEmbed, createErrorEmbed } = require('../../utils/embedBuilder');

module.exports = {
    data: {
        name: 'friendlyraid',
        description: 'Start a friendly raid to boost activity',
        usage: '!friendlyraid [message]',
        aliases: ['raid', 'boost'],
        cooldown: 30
    },
    async execute(message, args) {
        const customMessage = args.join(' ') || `${message.author.username} started a friendly raid! 🎉`;
        
        // Create raid embed
        const raidEmbed = createSuccessEmbed('🎉 FRIENDLY RAID INCOMING! 🎉', 
            `${customMessage}\n\n` +
            '**What is a friendly raid?**\n' +
            'A fun way to boost server activity and show support!\n\n' +
            '**How to participate:**\n' +
            '1. Click the "Join Raid!" button below\n' +
            '2. Click "RAID AGAIN!" to send another message\n' +
            '3. Spread positivity and have fun!\n\n' +
            '**Current raiders: 0**'
        );

        // Create raid buttons
        const joinButton = new ButtonBuilder()
            .setCustomId('raid_join')
            .setLabel('Join Raid!')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎉');

        const raidAgainButton = new ButtonBuilder()
            .setCustomId('raid_again')
            .setLabel('RAID AGAIN!')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💥');

        const stopButton = new ButtonBuilder()
            .setCustomId('raid_stop')
            .setLabel('Stop Raid')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('⛔');

        const row = new ActionRowBuilder().addComponents(joinButton, raidAgainButton, stopButton);

        const raidMessage = await message.reply({ 
            embeds: [raidEmbed], 
            components: [row] 
        });

        // Track raiders and raid count
        const raiders = new Set();
        let raidCount = 0;
        const raidMessages = [
            '🎉 FRIENDLY RAID ACTIVATED!',
            '💥 THE RAID CONTINUES!',
            '🚀 RAID MOMENTUM BUILDING!',
            '⚡ RAID ENERGY INTENSIFYING!',
            '🔥 RAID FEVER IS CONTAGIOUS!',
            '🌟 RAID SQUAD ASSEMBLED!',
            '💫 RAID POWER OVERWHELMING!',
            '🎊 RAID CELEBRATION MODE!',
            '🎈 RAID PARTY IN PROGRESS!',
            '🎭 RAID ENTERTAINMENT ACTIVATED!'
        ];

        // Create collector for button interactions
        const collector = raidMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutes
        });

        collector.on('collect', async (interaction) => {
            try {
                if (interaction.customId === 'raid_join') {
                    raiders.add(interaction.user.id);
                    raidCount++;

                    // Send raid message
                    const randomMessage = raidMessages[Math.floor(Math.random() * raidMessages.length)];
                    await interaction.reply({ 
                        content: `${randomMessage} ${interaction.user} joined the raid! 🎉`, 
                        ephemeral: false 
                    });

                    // Update embed with new raider count
                    const updatedEmbed = createSuccessEmbed('🎉 FRIENDLY RAID INCOMING! 🎉', 
                        `${customMessage}\n\n` +
                        '**What is a friendly raid?**\n' +
                        'A fun way to boost server activity and show support!\n\n' +
                        '**How to participate:**\n' +
                        '1. Click the "Join Raid!" button below\n' +
                        '2. Click "RAID AGAIN!" to send another message\n' +
                        '3. Spread positivity and have fun!\n\n' +
                        `**Current raiders: ${raiders.size}**\n` +
                        `**Total raid messages: ${raidCount}**`
                    );

                    await raidMessage.edit({ embeds: [updatedEmbed] });

                } else if (interaction.customId === 'raid_again') {
                    if (!raiders.has(interaction.user.id)) {
                        return interaction.reply({ 
                            content: 'You need to join the raid first! Click "Join Raid!" button.', 
                            ephemeral: true 
                        });
                    }

                    raidCount++;
                    const randomMessage = raidMessages[Math.floor(Math.random() * raidMessages.length)];
                    await interaction.reply({ 
                        content: `${randomMessage} ${interaction.user} raids again! Count: ${raidCount} 💥`, 
                        ephemeral: false 
                    });

                    // Update embed with new raid count
                    const updatedEmbed = createSuccessEmbed('🎉 FRIENDLY RAID INCOMING! 🎉', 
                        `${customMessage}\n\n` +
                        '**What is a friendly raid?**\n' +
                        'A fun way to boost server activity and show support!\n\n' +
                        '**How to participate:**\n' +
                        '1. Click the "Join Raid!" button below\n' +
                        '2. Click "RAID AGAIN!" to send another message\n' +
                        '3. Spread positivity and have fun!\n\n' +
                        `**Current raiders: ${raiders.size}**\n` +
                        `**Total raid messages: ${raidCount}**`
                    );

                    await raidMessage.edit({ embeds: [updatedEmbed] });

                } else if (interaction.customId === 'raid_stop') {
                    // Only allow the original user or admins to stop
                    if (interaction.user.id !== message.author.id && !interaction.member.permissions.has('ADMINISTRATOR')) {
                        return interaction.reply({ 
                            content: 'Only the raid starter or admins can stop the raid.', 
                            ephemeral: true 
                        });
                    }

                    const endEmbed = createSuccessEmbed('🎊 Friendly Raid Ended!', 
                        `Thanks to all ${raiders.size} raiders!\n` +
                        `Total raid messages sent: ${raidCount}\n\n` +
                        `Raid started by: ${message.author}\n` +
                        `Raid ended by: ${interaction.user}`
                    );

                    await interaction.update({ embeds: [endEmbed], components: [] });
                    collector.stop();
                }
            } catch (error) {
                console.error('Error in friendly raid interaction:', error);
                try {
                    await interaction.reply({ 
                        content: 'An error occurred during the raid. Please try again.', 
                        ephemeral: true 
                    });
                } catch (replyError) {
                    console.error('Error sending error reply:', replyError);
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = createSuccessEmbed('🎊 Friendly Raid Ended!', 
                    `Raid timed out after 5 minutes.\n` +
                    `Thanks to all ${raiders.size} raiders!\n` +
                    `Total raid messages sent: ${raidCount}`
                );
                raidMessage.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
        });
    }
};