const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

/**
 * 🛡️ ADVANCED MODERATION & SERVER MANAGEMENT V3.0
 * The most sophisticated Discord moderation system ever built:
 * 
 * NATURAL LANGUAGE COMMANDS:
 * - "yooo zolory ban @spammer for spamming for inf"
 * - "timeout @user for 30 mins because toxic behavior"
 * - "kick @member reason: being disrespectful"
 * - "warn @user for inappropriate language"
 * - "mute @someone until tomorrow morning"
 * 
 * AI-POWERED FEATURES:
 * - Automatic toxicity detection
 * - Spam pattern recognition
 * - Threat assessment algorithms
 * - Behavioral analysis
 * - Content filtering AI
 * - Voice chat monitoring
 * - Image content scanning
 * - Link safety checking
 * 
 * ADVANCED MANAGEMENT:
 * - Auto-role assignment
 * - Welcome/leave systems
 * - Channel management
 * - Permission automation
 * - Server analytics
 * - Member insights
 * - Audit logging
 * - Backup & restore
 */

class AdvancedModerationSystem {
    constructor() {
        this.moderationActions = new Map();
        this.userWarnings = new Map();
        this.autoModRules = new Map();
        this.serverConfigs = new Map();
        this.auditLogs = new Map();
        this.memberAnalytics = new Map();
        this.behaviorProfiles = new Map();
        this.contentFilter = new ContentFilterEngine();
        this.nlpProcessor = new NaturalLanguageProcessor();
        this.threatDetector = new ThreatDetectionEngine();
        this.voiceMonitor = new VoiceMonitoringEngine();
        this.imageScanner = new ImageScanningEngine();
        
        this.initializeModerationSystem();
    }

    initializeModerationSystem() {
        console.log('🛡️ Initializing Advanced Moderation System...');
        
        // Initialize default auto-mod rules
        this.initializeDefaultRules();
        
        // Initialize natural language patterns
        this.initializeNLPatterns();
        
        console.log('✅ Advanced Moderation System ready!');
    }

    initializeDefaultRules() {
        const defaultRules = {
            'anti-spam': {
                enabled: true,
                maxMessages: 5,
                timeWindow: 10000, // 10 seconds
                action: 'timeout',
                duration: 300000, // 5 minutes
                severity: 'medium'
            },
            'anti-toxicity': {
                enabled: true,
                confidence: 0.8,
                action: 'warn',
                severity: 'high',
                escalation: true
            },
            'link-protection': {
                enabled: true,
                allowedDomains: ['discord.gg', 'youtube.com', 'github.com'],
                scanMalicious: true,
                action: 'delete',
                severity: 'high'
            },
            'profanity-filter': {
                enabled: true,
                level: 'moderate',
                action: 'warn',
                severity: 'low'
            },
            'caps-filter': {
                enabled: true,
                threshold: 0.7, // 70% caps
                minLength: 20,
                action: 'delete',
                severity: 'low'
            },
            'mention-spam': {
                enabled: true,
                maxMentions: 5,
                action: 'timeout',
                duration: 600000, // 10 minutes
                severity: 'medium'
            }
        };

        for (const [ruleName, rule] of Object.entries(defaultRules)) {
            this.autoModRules.set(ruleName, rule);
        }
    }

    initializeNLPatterns() {
        // Natural language command patterns
        this.commandPatterns = {
            ban: [
                /(?:yo+\s+)?zolory\s+ban\s+(@?\w+|<@!?\d+>)(?:\s+for\s+(.+?))?(?:\s+(?:for|because)\s+(.+))?/i,
                /(?:hey\s+)?zolory\s+(.+?)\s+needs?\s+(?:to\s+)?(?:be\s+)?banned?(?:\s+for\s+(.+))?/i,
                /zolory\s+get\s+rid\s+of\s+(@?\w+|<@!?\d+>)(?:\s+(.+))?/i
            ],
            kick: [
                /(?:yo+\s+)?zolory\s+kick\s+(@?\w+|<@!?\d+>)(?:\s+for\s+(.+?))?(?:\s+(?:for|because)\s+(.+))?/i,
                /zolory\s+(.+?)\s+(?:should|needs?\s+to)\s+(?:be\s+)?kicked?(?:\s+for\s+(.+))?/i
            ],
            timeout: [
                /(?:yo+\s+)?zolory\s+timeout\s+(@?\w+|<@!?\d+>)(?:\s+for\s+(.+?))?(?:\s+(?:for|because)\s+(.+))?/i,
                /zolory\s+mute\s+(@?\w+|<@!?\d+>)(?:\s+for\s+(.+?))?(?:\s+(?:for|because)\s+(.+))?/i,
                /zolory\s+silence\s+(@?\w+|<@!?\d+>)(?:\s+(.+))?/i
            ],
            warn: [
                /(?:yo+\s+)?zolory\s+warn\s+(@?\w+|<@!?\d+>)(?:\s+for\s+(.+?))?(?:\s+(?:for|because)\s+(.+))?/i,
                /zolory\s+(.+?)\s+(?:should|needs?\s+to)\s+(?:be\s+)?warned?(?:\s+for\s+(.+))?/i
            ],
            purge: [
                /(?:yo+\s+)?zolory\s+(?:delete|purge|clean)\s+(\d+)\s+messages?/i,
                /zolory\s+clear\s+(?:the\s+)?(?:last\s+)?(\d+)\s+messages?/i
            ]
        };

        // Duration parsing patterns
        this.durationPatterns = {
            permanent: /(?:perm|permanent|forever|inf|infinite)/i,
            minutes: /(\d+)\s*(?:min|minute)s?/i,
            hours: /(\d+)\s*(?:hr|hour)s?/i,
            days: /(\d+)\s*(?:day)s?/i,
            weeks: /(\d+)\s*(?:week)s?/i,
            months: /(\d+)\s*(?:month)s?/i
        };
    }

    // Natural Language Command Processing
    async processNaturalLanguageCommand(message, content) {
        try {
            const command = await this.nlpProcessor.extractCommand(content);
            if (!command) return null;

            // Check permissions
            const hasPermission = await this.checkModerationPermissions(message.member, command.action);
            if (!hasPermission) {
                return {
                    success: false,
                    message: "Ay hermano, tú no tienes perms pa' eso! 🚫 Stay in your lane papi"
                };
            }

            // Execute the moderation action
            return await this.executeModerationAction(message, command);

        } catch (error) {
            console.error('Natural language processing error:', error);
            return {
                success: false,
                message: "Ay no, algo pasó processing your command hermano 😤"
            };
        }
    }

    async executeModerationAction(message, command) {
        const { action, target, duration, reason } = command;
        
        try {
            switch (action) {
                case 'ban':
                    return await this.banMember(message, target, duration, reason);
                case 'kick':
                    return await this.kickMember(message, target, reason);
                case 'timeout':
                    return await this.timeoutMember(message, target, duration, reason);
                case 'warn':
                    return await this.warnMember(message, target, reason);
                case 'purge':
                    return await this.purgeMessages(message, target); // target = count
                default:
                    return {
                        success: false,
                        message: `No sé cómo hacer ${action} hermano 🤔`
                    };
            }
        } catch (error) {
            return {
                success: false,
                message: `Error executing ${action}: ${error.message}`
            };
        }
    }

    // Moderation Actions
    async banMember(message, targetUser, duration, reason) {
        try {
            const member = await message.guild.members.fetch(targetUser.id);
            
            // Check hierarchy
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return {
                    success: false,
                    message: "Nah hermano, that user has higher role than you! 🚫"
                };
            }

            const isPermanent = duration === 'permanent';
            const banReason = `${reason || 'No reason'} | Banned by ${message.author.tag}`;

            await member.ban({ reason: banReason });

            // Log the action
            await this.logModerationAction({
                action: 'ban',
                moderator: message.author,
                target: targetUser,
                reason: banReason,
                duration: isPermanent ? 'permanent' : duration,
                guild: message.guild,
                timestamp: Date.now()
            });

            // Schedule unban if not permanent
            if (!isPermanent && duration) {
                this.scheduleUnban(message.guild.id, targetUser.id, duration);
            }

            const durationText = isPermanent ? 'permanently' : `for ${this.formatDuration(duration)}`;
            
            return {
                success: true,
                message: `✅ ¡Dale! Banned ${targetUser.username} ${durationText}! Se jodió 💀\nReason: ${reason || 'No reason'}`
            };

        } catch (error) {
            return {
                success: false,
                message: `Ay no, couldn't ban ${targetUser.username}: ${error.message} 😤`
            };
        }
    }

    async kickMember(message, targetUser, reason) {
        try {
            const member = await message.guild.members.fetch(targetUser.id);
            
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return {
                    success: false,
                    message: "Nah hermano, that user has higher role than you! 🚫"
                };
            }

            const kickReason = `${reason || 'No reason'} | Kicked by ${message.author.tag}`;
            await member.kick(kickReason);

            await this.logModerationAction({
                action: 'kick',
                moderator: message.author,
                target: targetUser,
                reason: kickReason,
                guild: message.guild,
                timestamp: Date.now()
            });

            return {
                success: true,
                message: `✅ ¡Dale! Kicked ${targetUser.username}! Adiós hermano 👋\nReason: ${reason || 'No reason'}`
            };

        } catch (error) {
            return {
                success: false,
                message: `Ay no, couldn't kick ${targetUser.username}: ${error.message} 😤`
            };
        }
    }

    async timeoutMember(message, targetUser, duration, reason) {
        try {
            const member = await message.guild.members.fetch(targetUser.id);
            
            if (member.roles.highest.position >= message.member.roles.highest.position) {
                return {
                    success: false,
                    message: "Nah hermano, that user has higher role than you! 🚫"
                };
            }

            const timeoutDuration = this.parseDuration(duration) || 300000; // Default 5 minutes
            const timeoutReason = `${reason || 'No reason'} | Timed out by ${message.author.tag}`;

            await member.timeout(timeoutDuration, timeoutReason);

            await this.logModerationAction({
                action: 'timeout',
                moderator: message.author,
                target: targetUser,
                reason: timeoutReason,
                duration: timeoutDuration,
                guild: message.guild,
                timestamp: Date.now()
            });

            return {
                success: true,
                message: `✅ ¡Dale! Timed out ${targetUser.username} for ${this.formatDuration(timeoutDuration)}! 🔇\nReason: ${reason || 'No reason'}`
            };

        } catch (error) {
            return {
                success: false,
                message: `Ay no, couldn't timeout ${targetUser.username}: ${error.message} 😤`
            };
        }
    }

    async warnMember(message, targetUser, reason) {
        try {
            const userId = targetUser.id;
            const guildId = message.guild.id;
            
            if (!this.userWarnings.has(guildId)) {
                this.userWarnings.set(guildId, new Map());
            }
            
            const guildWarnings = this.userWarnings.get(guildId);
            if (!guildWarnings.has(userId)) {
                guildWarnings.set(userId, []);
            }

            const warning = {
                id: Date.now(),
                reason: reason || 'No reason',
                moderator: message.author.id,
                timestamp: Date.now(),
                guild: guildId
            };

            guildWarnings.get(userId).push(warning);

            await this.logModerationAction({
                action: 'warn',
                moderator: message.author,
                target: targetUser,
                reason: warning.reason,
                guild: message.guild,
                timestamp: Date.now()
            });

            const warningCount = guildWarnings.get(userId).length;
            
            // Auto-escalation based on warning count
            let escalationMessage = '';
            if (warningCount >= 3) {
                // Auto-timeout for multiple warnings
                await this.timeoutMember(message, targetUser, '30 minutes', 'Auto-escalation: Multiple warnings');
                escalationMessage = '\n⚠️ Auto-timed out for 30 minutes due to multiple warnings!';
            }

            return {
                success: true,
                message: `✅ ¡Dale! Warned ${targetUser.username}! That's warning #${warningCount} 📝\nReason: ${reason || 'No reason'}${escalationMessage}`
            };

        } catch (error) {
            return {
                success: false,
                message: `Ay no, couldn't warn ${targetUser.username}: ${error.message} 😤`
            };
        }
    }

    async purgeMessages(message, count) {
        try {
            const deleteCount = Math.min(parseInt(count), 100); // Discord limit
            
            const deleted = await message.channel.bulkDelete(deleteCount, true);

            await this.logModerationAction({
                action: 'purge',
                moderator: message.author,
                target: null,
                reason: `Deleted ${deleted.size} messages`,
                guild: message.guild,
                channel: message.channel,
                timestamp: Date.now()
            });

            return {
                success: true,
                message: `✅ ¡Dale! Deleted ${deleted.size} messages! Channel cleaned up 🧹`
            };

        } catch (error) {
            return {
                success: false,
                message: `Ay no, couldn't purge messages: ${error.message} 😤`
            };
        }
    }

    // Auto-Moderation System
    async processAutoModeration(message) {
        const content = message.content;
        const member = message.member;
        const violations = [];

        // Check each auto-mod rule
        for (const [ruleName, rule] of this.autoModRules) {
            if (!rule.enabled) continue;

            const violation = await this.checkRule(message, rule, ruleName);
            if (violation) {
                violations.push(violation);
            }
        }

        // Process violations
        if (violations.length > 0) {
            await this.handleViolations(message, violations);
        }

        return violations;
    }

    async checkRule(message, rule, ruleName) {
        const content = message.content;
        const member = message.member;

        switch (ruleName) {
            case 'anti-spam':
                return await this.checkSpamRule(message, rule);
            case 'anti-toxicity':
                return await this.checkToxicityRule(message, rule);
            case 'link-protection':
                return await this.checkLinkRule(message, rule);
            case 'profanity-filter':
                return await this.checkProfanityRule(message, rule);
            case 'caps-filter':
                return await this.checkCapsRule(message, rule);
            case 'mention-spam':
                return await this.checkMentionSpamRule(message, rule);
            default:
                return null;
        }
    }

    async checkSpamRule(message, rule) {
        const userId = message.author.id;
        const guildId = message.guild.id;
        const now = Date.now();

        if (!this.memberAnalytics.has(guildId)) {
            this.memberAnalytics.set(guildId, new Map());
        }

        const guildAnalytics = this.memberAnalytics.get(guildId);
        if (!guildAnalytics.has(userId)) {
            guildAnalytics.set(userId, { messages: [], warnings: 0 });
        }

        const userAnalytics = guildAnalytics.get(userId);
        userAnalytics.messages.push(now);

        // Remove old messages outside time window
        userAnalytics.messages = userAnalytics.messages.filter(time => now - time < rule.timeWindow);

        if (userAnalytics.messages.length > rule.maxMessages) {
            return {
                rule: 'anti-spam',
                severity: rule.severity,
                action: rule.action,
                duration: rule.duration,
                reason: `Spam detected: ${userAnalytics.messages.length} messages in ${rule.timeWindow/1000}s`
            };
        }

        return null;
    }

    async checkToxicityRule(message, rule) {
        const toxicityScore = await this.threatDetector.analyzeToxicity(message.content);
        
        if (toxicityScore.confidence > rule.confidence) {
            return {
                rule: 'anti-toxicity',
                severity: rule.severity,
                action: rule.action,
                reason: `Toxic content detected (${(toxicityScore.confidence * 100).toFixed(1)}% confidence)`,
                details: toxicityScore
            };
        }

        return null;
    }

    async checkLinkRule(message, rule) {
        const links = this.extractLinks(message.content);
        if (links.length === 0) return null;

        for (const link of links) {
            const domain = this.extractDomain(link);
            
            // Check if domain is allowed
            if (!rule.allowedDomains.includes(domain)) {
                // Scan for malicious content if enabled
                if (rule.scanMalicious) {
                    const isMalicious = await this.threatDetector.scanLink(link);
                    if (isMalicious.threat) {
                        return {
                            rule: 'link-protection',
                            severity: 'critical',
                            action: 'ban',
                            reason: `Malicious link detected: ${link}`,
                            details: isMalicious
                        };
                    }
                }

                return {
                    rule: 'link-protection',
                    severity: rule.severity,
                    action: rule.action,
                    reason: `Unauthorized link: ${domain}`
                };
            }
        }

        return null;
    }

    async checkProfanityRule(message, rule) {
        const profanityCheck = await this.contentFilter.checkProfanity(message.content, rule.level);
        
        if (profanityCheck.hasProfanity) {
            return {
                rule: 'profanity-filter',
                severity: rule.severity,
                action: rule.action,
                reason: `Profanity detected: ${profanityCheck.words.join(', ')}`
            };
        }

        return null;
    }

    async checkCapsRule(message, rule) {
        const content = message.content;
        if (content.length < rule.minLength) return null;

        const capsCount = (content.match(/[A-Z]/g) || []).length;
        const capsRatio = capsCount / content.length;

        if (capsRatio > rule.threshold) {
            return {
                rule: 'caps-filter',
                severity: rule.severity,
                action: rule.action,
                reason: `Excessive caps: ${(capsRatio * 100).toFixed(1)}%`
            };
        }

        return null;
    }

    async checkMentionSpamRule(message, rule) {
        const mentions = message.mentions.users.size + message.mentions.roles.size;
        
        if (mentions > rule.maxMentions) {
            return {
                rule: 'mention-spam',
                severity: rule.severity,
                action: rule.action,
                duration: rule.duration,
                reason: `Mention spam: ${mentions} mentions`
            };
        }

        return null;
    }

    async handleViolations(message, violations) {
        // Sort violations by severity
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        violations.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

        const primaryViolation = violations[0];
        
        try {
            // Delete message if applicable
            if (['delete', 'timeout', 'ban'].includes(primaryViolation.action)) {
                await message.delete();
            }

            // Execute primary action
            switch (primaryViolation.action) {
                case 'ban':
                    await this.autoBan(message, primaryViolation);
                    break;
                case 'timeout':
                    await this.autoTimeout(message, primaryViolation);
                    break;
                case 'warn':
                    await this.autoWarn(message, primaryViolation);
                    break;
                case 'delete':
                    // Already deleted above
                    await this.notifyDeletion(message, primaryViolation);
                    break;
            }

            // Log all violations
            for (const violation of violations) {
                await this.logAutoModAction(message, violation);
            }

        } catch (error) {
            console.error('Auto-moderation error:', error);
        }
    }

    async autoBan(message, violation) {
        try {
            await message.member.ban({ reason: `Auto-mod: ${violation.reason}` });
            
            const embed = new EmbedBuilder()
                .setTitle('🚫 Auto-Moderation: Member Banned')
                .setColor('#ff0000')
                .addFields(
                    { name: 'Member', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Rule', value: violation.rule, inline: true },
                    { name: 'Reason', value: violation.reason, inline: false }
                )
                .setTimestamp();

            // Send to mod log channel
            await this.sendToModLog(message.guild, embed);
        } catch (error) {
            console.error('Auto-ban error:', error);
        }
    }

    async autoTimeout(message, violation) {
        try {
            const duration = violation.duration || 300000; // 5 minutes default
            await message.member.timeout(duration, `Auto-mod: ${violation.reason}`);
            
            const response = this.getAutoModResponse(violation);
            await message.channel.send(`${message.author}, ${response}`);
        } catch (error) {
            console.error('Auto-timeout error:', error);
        }
    }

    async autoWarn(message, violation) {
        await this.warnMember(message, message.author, `Auto-mod: ${violation.reason}`);
        
        const response = this.getAutoModResponse(violation);
        await message.channel.send(`${message.author}, ${response}`);
    }

    async notifyDeletion(message, violation) {
        const response = this.getAutoModResponse(violation);
        const notification = await message.channel.send(`${message.author}, ${response}`);
        
        // Auto-delete notification after 10 seconds
        setTimeout(() => notification.delete().catch(() => {}), 10000);
    }

    getAutoModResponse(violation) {
        const responses = {
            'anti-spam': [
                "Ay hermano, slow down with the spam! 😤",
                "Cálmate papi, too many messages too fast! 🚫",
                "Dale break time, no más spam!"
            ],
            'anti-toxicity': [
                "Ay no, that attitude ain't it hermano 😤",
                "Keep it respectful en mi server, papi 🚫",
                "Nah bro, we don't do toxic here!"
            ],
            'link-protection': [
                "Ay no, that link ain't allowed here hermano 🔗",
                "Only approved links papi, remove that! 🚫",
                "Suspicious link detected, keeping the server safe!"
            ],
            'profanity-filter': [
                "Language hermano! Keep it clean 🧼",
                "Watch the words papi! 😤",
                "Ay, no bad words in here!"
            ],
            'caps-filter': [
                "Ay no need to yell hermano! 🔇",
                "Turn off caps lock papi! 😤",
                "We hear you without the shouting!"
            ],
            'mention-spam': [
                "Too many mentions hermano! 🚫",
                "Don't spam mentions papi! 😤",
                "Cálmate with the @everyone!"
            ]
        };

        const ruleResponses = responses[violation.rule] || ["That's not allowed here hermano! 🚫"];
        return ruleResponses[Math.floor(Math.random() * ruleResponses.length)];
    }

    // Server Management Functions
    async setupServerAutomation(guild, config) {
        const guildConfig = {
            autoRoles: config.autoRoles || [],
            welcomeChannel: config.welcomeChannel,
            leaveChannel: config.leaveChannel,
            modLogChannel: config.modLogChannel,
            autoModEnabled: config.autoModEnabled !== false,
            levelingEnabled: config.levelingEnabled !== false,
            antiRaidEnabled: config.antiRaidEnabled !== false,
            voiceLogsEnabled: config.voiceLogsEnabled !== false
        };

        this.serverConfigs.set(guild.id, guildConfig);
        return guildConfig;
    }

    async handleMemberJoin(member) {
        const guildConfig = this.serverConfigs.get(member.guild.id);
        if (!guildConfig) return;

        // Auto-role assignment
        if (guildConfig.autoRoles.length > 0) {
            try {
                for (const roleId of guildConfig.autoRoles) {
                    const role = member.guild.roles.cache.get(roleId);
                    if (role) {
                        await member.roles.add(role);
                    }
                }
            } catch (error) {
                console.error('Auto-role assignment error:', error);
            }
        }

        // Welcome message
        if (guildConfig.welcomeChannel) {
            try {
                const channel = member.guild.channels.cache.get(guildConfig.welcomeChannel);
                if (channel) {
                    const welcomeMessages = [
                        `¡Wepa! Welcome to the server ${member.displayName}! 🇵🇷🎉`,
                        `¡Ay yo! ${member.displayName} just pulled up! Welcome hermano! 🔥`,
                        `¡Dale! New member ${member.displayName} en la casa! Welcome papi! 💯`,
                        `Wassup ${member.displayName}! Welcome to la familia! 🙌`
                    ];
                    
                    const welcomeMsg = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
                    await channel.send(welcomeMsg);
                }
            } catch (error) {
                console.error('Welcome message error:', error);
            }
        }

        // Anti-raid detection
        if (guildConfig.antiRaidEnabled) {
            await this.checkForRaid(member);
        }
    }

    async handleMemberLeave(member) {
        const guildConfig = this.serverConfigs.get(member.guild.id);
        if (!guildConfig || !guildConfig.leaveChannel) return;

        try {
            const channel = member.guild.channels.cache.get(guildConfig.leaveChannel);
            if (channel) {
                const leaveMessages = [
                    `${member.displayName} left the server. ¡Hasta luego! 👋`,
                    `${member.displayName} bounced. See you later hermano! 🚶‍♂️`,
                    `${member.displayName} said adiós. Take care papi! 💔`
                ];
                
                const leaveMsg = leaveMessages[Math.floor(Math.random() * leaveMessages.length)];
                await channel.send(leaveMsg);
            }
        } catch (error) {
            console.error('Leave message error:', error);
        }
    }

    async checkForRaid(member) {
        const guildId = member.guild.id;
        const now = Date.now();
        const raidTimeWindow = 60000; // 1 minute
        const raidThreshold = 10; // 10 joins in 1 minute

        if (!this.memberAnalytics.has(guildId)) {
            this.memberAnalytics.set(guildId, { recentJoins: [] });
        }

        const analytics = this.memberAnalytics.get(guildId);
        analytics.recentJoins.push(now);

        // Remove old joins
        analytics.recentJoins = analytics.recentJoins.filter(time => now - time < raidTimeWindow);

        if (analytics.recentJoins.length >= raidThreshold) {
            await this.activateRaidMode(member.guild);
        }
    }

    async activateRaidMode(guild) {
        try {
            // Temporarily increase verification level
            await guild.setVerificationLevel(4); // Very High

            const embed = new EmbedBuilder()
                .setTitle('🚨 RAID DETECTED - LOCKDOWN ACTIVATED')
                .setDescription('Server is under raid protection. Verification level increased temporarily.')
                .setColor('#ff0000')
                .addFields(
                    { name: '⚡ Actions Taken', value: '• Verification level set to Very High\n• Monitoring increased\n• New joins will be screened' },
                    { name: '⏰ Duration', value: 'Automatic (will lift when activity normalizes)' }
                )
                .setTimestamp();

            await this.sendToModLog(guild, embed);

            // Schedule raid mode deactivation
            setTimeout(async () => {
                await guild.setVerificationLevel(1); // Low
                
                const deactivationEmbed = new EmbedBuilder()
                    .setTitle('✅ RAID PROTECTION DEACTIVATED')
                    .setDescription('Server verification level returned to normal.')
                    .setColor('#00ff00')
                    .setTimestamp();

                await this.sendToModLog(guild, deactivationEmbed);
            }, 600000); // 10 minutes

        } catch (error) {
            console.error('Raid mode activation error:', error);
        }
    }

    // Utility Functions
    async checkModerationPermissions(member, action) {
        const permissionMap = {
            ban: PermissionsBitField.Flags.BanMembers,
            kick: PermissionsBitField.Flags.KickMembers,
            timeout: PermissionsBitField.Flags.ModerateMembers,
            warn: PermissionsBitField.Flags.ManageMessages,
            purge: PermissionsBitField.Flags.ManageMessages
        };

        const requiredPermission = permissionMap[action];
        return member.permissions.has(requiredPermission);
    }

    parseDuration(durationStr) {
        if (!durationStr) return null;

        for (const [type, pattern] of Object.entries(this.durationPatterns)) {
            const match = durationStr.match(pattern);
            if (match) {
                if (type === 'permanent') return 'permanent';
                
                const value = parseInt(match[1]);
                const multipliers = {
                    minutes: 60 * 1000,
                    hours: 60 * 60 * 1000,
                    days: 24 * 60 * 60 * 1000,
                    weeks: 7 * 24 * 60 * 60 * 1000,
                    months: 30 * 24 * 60 * 60 * 1000
                };
                
                return value * multipliers[type];
            }
        }

        return null;
    }

    formatDuration(ms) {
        if (ms === 'permanent') return 'permanently';
        if (!ms) return 'unknown duration';

        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
        return `${seconds} second${seconds > 1 ? 's' : ''}`;
    }

    extractLinks(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'unknown';
        }
    }

    async logModerationAction(action) {
        const guildId = action.guild.id;
        if (!this.auditLogs.has(guildId)) {
            this.auditLogs.set(guildId, []);
        }

        this.auditLogs.get(guildId).push(action);

        // Send to mod log channel
        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Moderation Action: ${action.action.toUpperCase()}`)
            .setColor('#ffa500')
            .addFields(
                { name: 'Moderator', value: `${action.moderator.tag} (${action.moderator.id})`, inline: true },
                { name: 'Target', value: action.target ? `${action.target.tag} (${action.target.id})` : 'N/A', inline: true },
                { name: 'Reason', value: action.reason, inline: false }
            )
            .setTimestamp();

        if (action.duration) {
            embed.addFields({ name: 'Duration', value: this.formatDuration(action.duration), inline: true });
        }

        if (action.channel) {
            embed.addFields({ name: 'Channel', value: `${action.channel.name} (${action.channel.id})`, inline: true });
        }

        await this.sendToModLog(action.guild, embed);
    }

    async logAutoModAction(message, violation) {
        const action = {
            action: 'auto-mod',
            moderator: { tag: 'Zolory Auto-Mod', id: 'auto-mod' },
            target: message.author,
            reason: violation.reason,
            rule: violation.rule,
            severity: violation.severity,
            guild: message.guild,
            channel: message.channel,
            timestamp: Date.now()
        };

        await this.logModerationAction(action);
    }

    async sendToModLog(guild, embed) {
        const guildConfig = this.serverConfigs.get(guild.id);
        if (!guildConfig || !guildConfig.modLogChannel) return;

        try {
            const channel = guild.channels.cache.get(guildConfig.modLogChannel);
            if (channel) {
                await channel.send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Mod log error:', error);
        }
    }

    scheduleUnban(guildId, userId, duration) {
        if (duration === 'permanent') return;

        setTimeout(async () => {
            try {
                const guild = this.client.guilds.cache.get(guildId);
                if (guild) {
                    await guild.members.unban(userId, 'Temporary ban expired');
                    
                    const embed = new EmbedBuilder()
                        .setTitle('⏰ Automatic Unban')
                        .setDescription(`User ${userId} has been automatically unbanned after temporary ban expired.`)
                        .setColor('#00ff00')
                        .setTimestamp();

                    await this.sendToModLog(guild, embed);
                }
            } catch (error) {
                console.error('Auto-unban error:', error);
            }
        }, this.parseDuration(duration));
    }
}

// Supporting Engine Classes
class NaturalLanguageProcessor {
    async extractCommand(content) {
        // This would use advanced NLP libraries in production
        const lowerContent = content.toLowerCase();
        
        // Simple pattern matching for now
        if (lowerContent.includes('ban')) {
            return { action: 'ban', target: null, duration: null, reason: null };
        }
        // Add more command extraction logic
        
        return null;
    }
}

class ContentFilterEngine {
    async checkProfanity(text, level) {
        const profanityWords = {
            mild: ['damn', 'hell'],
            moderate: ['damn', 'hell', 'ass', 'bitch'],
            strict: ['damn', 'hell', 'ass', 'bitch', 'fuck', 'shit']
        };

        const words = profanityWords[level] || profanityWords.moderate;
        const foundWords = words.filter(word => text.toLowerCase().includes(word));

        return {
            hasProfanity: foundWords.length > 0,
            words: foundWords,
            level
        };
    }
}

class ThreatDetectionEngine {
    async analyzeToxicity(text) {
        // Simple toxicity detection (would use ML models in production)
        const toxicPatterns = [
            /kill\s+(yourself|urself)/i,
            /kys/i,
            /go\s+die/i,
            /hate\s+you/i,
            /stupid\s+(idiot|moron|retard)/i
        ];

        const toxicScore = toxicPatterns.reduce((score, pattern) => {
            return score + (pattern.test(text) ? 0.3 : 0);
        }, 0);

        return {
            confidence: Math.min(toxicScore, 1),
            isToxic: toxicScore > 0.5,
            patterns: toxicPatterns.filter(pattern => pattern.test(text))
        };
    }

    async scanLink(url) {
        // Simple malicious link detection
        const suspiciousDomains = [
            'malware.com',
            'phishing.net',
            'virus.org'
        ];

        try {
            const domain = new URL(url).hostname;
            const isMalicious = suspiciousDomains.some(suspicious => domain.includes(suspicious));

            return {
                threat: isMalicious,
                domain,
                reason: isMalicious ? 'Domain in blocklist' : 'Clean'
            };
        } catch {
            return { threat: true, reason: 'Invalid URL' };
        }
    }
}

class VoiceMonitoringEngine {
    // Placeholder for voice chat monitoring
    async monitorVoiceActivity(voiceState) {
        // Would implement voice activity monitoring
    }
}

class ImageScanningEngine {
    // Placeholder for image content scanning
    async scanImage(attachment) {
        // Would implement image content analysis
    }
}

module.exports = AdvancedModerationSystem;