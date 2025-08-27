const { Guild } = require('../utils/database');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        try {
            // Get guild settings
            const guildData = await Guild.findOne({ guildId: member.guild.id });
            
            // Send welcome message
            if (guildData?.welcomeChannel) {
                const welcomeChannel = member.guild.channels.cache.get(guildData.welcomeChannel);
                
                if (welcomeChannel) {
                    const welcomeMessage = guildData.welcomeMessage || 
                        `Welcome to **${member.guild.name}**, ${member}! 🎉\n\nYou are member #${member.guild.memberCount}!`;
                    
                    const welcomeEmbed = {
                        color: 0x00ff00,
                        title: '👋 Welcome!',
                        description: welcomeMessage,
                        thumbnail: {
                            url: member.user.displayAvatarURL({ dynamic: true, size: 512 })
                        },
                        fields: [
                            {
                                name: 'Account Created',
                                value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                                inline: true
                            },
                            {
                                name: 'Member Count',
                                value: member.guild.memberCount.toString(),
                                inline: true
                            }
                        ],
                        timestamp: new Date(),
                        footer: { text: `User ID: ${member.id}` }
                    };
                    
                    welcomeChannel.send({ embeds: [welcomeEmbed] }).catch(console.error);
                }
            }
            
            // Log to mod channel
            const logChannel = member.guild.channels.cache.find(ch => 
                ch.name === client.config.logChannel || ch.id === guildData?.logChannel
            );
            
            if (logChannel) {
                // Check account age
                const accountAge = Date.now() - member.user.createdTimestamp;
                const daysSinceCreation = Math.floor(accountAge / (1000 * 60 * 60 * 24));
                const suspicious = daysSinceCreation < 7;
                
                const logEmbed = {
                    color: suspicious ? 0xff0000 : 0x00ff00,
                    title: '📥 Member Joined',
                    thumbnail: {
                        url: member.user.displayAvatarURL({ dynamic: true })
                    },
                    fields: [
                        { name: 'User', value: `${member.user.tag} (${member})`, inline: true },
                        { name: 'ID', value: member.id, inline: true },
                        { name: 'Account Age', value: `${daysSinceCreation} days`, inline: true },
                        { 
                            name: 'Account Created', 
                            value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, 
                            inline: false 
                        }
                    ],
                    timestamp: new Date()
                };
                
                if (suspicious) {
                    logEmbed.fields.push({
                        name: '⚠️ Warning',
                        value: 'New account (less than 7 days old)',
                        inline: false
                    });
                }
                
                logChannel.send({ embeds: [logEmbed] }).catch(console.error);
            }
            
            // Auto-role assignment (if configured)
            if (guildData?.autoRole) {
                const autoRole = member.guild.roles.cache.get(guildData.autoRole);
                if (autoRole && !member.user.bot) {
                    member.roles.add(autoRole, 'Auto-role on join').catch(console.error);
                }
            }
            
        } catch (error) {
            console.error('guildMemberAdd error:', error);
        }
    }
};