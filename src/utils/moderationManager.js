const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

class ModerationManager {
    constructor(client) {
        this.client = client;
        this.modActions = new Map();
    }

    async handleModerationCommand(message, args) {
        const { member, guild, channel } = message;
        
        // Check if user has moderation permissions
        if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return { success: false, message: "Yo fam, you don't have permission to do that! 😤" };
        }

        // Check if bot has moderation permissions
        if (!guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return { success: false, message: "Yo, I don't have the permissions to do that! Ask an admin to give me mod powers! 🔥" };
        }

        const action = args[0]?.toLowerCase();
        const targetUser = args[1];
        const duration = args[2];
        const reason = args.slice(3).join(' ') || 'No reason provided';

        if (!targetUser) {
            return { success: false, message: "Yo, who you tryna moderate? Give me a username or ID! 😅" };
        }

        const targetMember = await this.findMember(guild, targetUser);
        if (!targetMember) {
            return { success: false, message: "Yo, I can't find that user! Make sure the username or ID is correct! 🤔" };
        }

        // Check if target is higher in hierarchy
        if (targetMember.roles.highest.position >= member.roles.highest.position) {
            return { success: false, message: "Yo, you can't moderate someone with higher or equal role than you! 😤" };
        }

        switch (action) {
            case 'ban':
                return await this.banMember(targetMember, reason, duration);
            case 'kick':
                return await this.kickMember(targetMember, reason);
            case 'timeout':
                return await this.timeoutMember(targetMember, duration, reason);
            case 'warn':
                return await this.warnMember(targetMember, reason);
            case 'mute':
                return await this.muteMember(targetMember, duration, reason);
            case 'unban':
                return await this.unbanMember(guild, targetUser, reason);
            case 'untimeout':
                return await this.untimeoutMember(targetMember, reason);
            default:
                return { success: false, message: "Yo, that's not a valid moderation action! Try: ban, kick, timeout, warn, mute, unban, or untimeout! 🔥" };
        }
    }

    async findMember(guild, userInput) {
        // Try to find by mention
        const mentionMatch = userInput.match(/<@!?(\d+)>/);
        if (mentionMatch) {
            return await guild.members.fetch(mentionMatch[1]).catch(() => null);
        }

        // Try to find by ID
        if (/^\d+$/.test(userInput)) {
            return await guild.members.fetch(userInput).catch(() => null);
        }

        // Try to find by username or display name
        const members = await guild.members.search({ query: userInput, limit: 1 });
        return members.first() || null;
    }

    async banMember(member, reason, duration = null) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🔨 Member Banned')
                .setColor('#ff0000')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Banned by', value: `${member.guild.members.me.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            if (duration) {
                embed.addFields({ name: 'Duration', value: duration, inline: true });
            }

            await member.ban({ reason: `Banned by Zolory: ${reason}` });
            
            this.logModAction(member.guild, 'ban', member.user, reason);
            
            return { 
                success: true, 
                message: `🔨 **${member.user.tag}** has been banned!\n\n**Reason:** ${reason}${duration ? `\n**Duration:** ${duration}` : ''}`,
                embed 
            };
        } catch (error) {
            return { success: false, message: `Yo, I couldn't ban ${member.user.tag}! Error: ${error.message} 😤` };
        }
    }

    async kickMember(member, reason) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('👢 Member Kicked')
                .setColor('#ffa500')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Kicked by', value: `${member.guild.members.me.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await member.kick(`Kicked by Zolory: ${reason}`);
            
            this.logModAction(member.guild, 'kick', member.user, reason);
            
            return { 
                success: true, 
                message: `👢 **${member.user.tag}** has been kicked!\n\n**Reason:** ${reason}`,
                embed 
            };
        } catch (error) {
            return { success: false, message: `Yo, I couldn't kick ${member.user.tag}! Error: ${error.message} 😤` };
        }
    }

    async timeoutMember(member, duration, reason) {
        try {
            const timeoutDuration = this.parseDuration(duration);
            if (!timeoutDuration) {
                return { success: false, message: "Yo, give me a valid duration! (e.g., 1m, 1h, 1d) 😅" };
            }

            const embed = new EmbedBuilder()
                .setTitle('⏰ Member Timed Out')
                .setColor('#ffff00')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Timed out by', value: `${member.guild.members.me.user.tag}`, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            await member.timeout(timeoutDuration, `Timed out by Zolory: ${reason}`);
            
            this.logModAction(member.guild, 'timeout', member.user, reason);
            
            return { 
                success: true, 
                message: `⏰ **${member.user.tag}** has been timed out for **${duration}**!\n\n**Reason:** ${reason}`,
                embed 
            };
        } catch (error) {
            return { success: false, message: `Yo, I couldn't timeout ${member.user.tag}! Error: ${error.message} 😤` };
        }
    }

    async warnMember(member, reason) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Member Warned')
                .setColor('#ffff00')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Warned by', value: `${member.guild.members.me.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            this.logModAction(member.guild, 'warn', member.user, reason);
            
            return { 
                success: true, 
                message: `⚠️ **${member.user.tag}** has been warned!\n\n**Reason:** ${reason}`,
                embed 
            };
        } catch (error) {
            return { success: false, message: `Yo, I couldn't warn ${member.user.tag}! Error: ${error.message} 😤` };
        }
    }

    async muteMember(member, duration, reason) {
        try {
            const muteDuration = this.parseDuration(duration);
            if (!muteDuration) {
                return { success: false, message: "Yo, give me a valid duration! (e.g., 1m, 1h, 1d) 😅" };
            }

            // Add muted role or use timeout
            const mutedRole = member.guild.roles.cache.find(role => role.name.toLowerCase().includes('muted'));
            
            if (mutedRole) {
                await member.roles.add(mutedRole, `Muted by Zolory: ${reason}`);
            } else {
                // Fallback to timeout
                await member.timeout(muteDuration, `Muted by Zolory: ${reason}`);
            }

            const embed = new EmbedBuilder()
                .setTitle('🔇 Member Muted')
                .setColor('#808080')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Muted by', value: `${member.guild.members.me.user.tag}`, inline: true },
                    { name: 'Duration', value: duration, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            this.logModAction(member.guild, 'mute', member.user, reason);
            
            return { 
                success: true, 
                message: `🔇 **${member.user.tag}** has been muted for **${duration}**!\n\n**Reason:** ${reason}`,
                embed 
            };
        } catch (error) {
            return { success: false, message: `Yo, I couldn't mute ${member.user.tag}! Error: ${error.message} 😤` };
        }
    }

    async unbanMember(guild, userInput, reason) {
        try {
            const bans = await guild.bans.fetch();
            const bannedUser = bans.find(ban => 
                ban.user.id === userInput || 
                ban.user.tag.toLowerCase().includes(userInput.toLowerCase()) ||
                ban.user.username.toLowerCase().includes(userInput.toLowerCase())
            );

            if (!bannedUser) {
                return { success: false, message: "Yo, I can't find that banned user! Make sure the ID or username is correct! 🤔" };
            }

            await guild.members.unban(bannedUser.user, `Unbanned by Zolory: ${reason}`);

            const embed = new EmbedBuilder()
                .setTitle('🔓 Member Unbanned')
                .setColor('#00ff00')
                .setThumbnail(bannedUser.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${bannedUser.user.tag} (${bannedUser.user.id})`, inline: true },
                    { name: 'Unbanned by', value: `${guild.members.me.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            this.logModAction(guild, 'unban', bannedUser.user, reason);
            
            return { 
                success: true, 
                message: `🔓 **${bannedUser.user.tag}** has been unbanned!\n\n**Reason:** ${reason}`,
                embed 
            };
        } catch (error) {
            return { success: false, message: `Yo, I couldn't unban that user! Error: ${error.message} 😤` };
        }
    }

    async untimeoutMember(member, reason) {
        try {
            if (!member.isCommunicationDisabled()) {
                return { success: false, message: "Yo, that user isn't timed out! 😅" };
            }

            await member.timeout(null, `Timeout removed by Zolory: ${reason}`);

            const embed = new EmbedBuilder()
                .setTitle('⏰ Timeout Removed')
                .setColor('#00ff00')
                .setThumbnail(member.user.displayAvatarURL())
                .addFields(
                    { name: 'User', value: `${member.user.tag} (${member.id})`, inline: true },
                    { name: 'Removed by', value: `${member.guild.members.me.user.tag}`, inline: true },
                    { name: 'Reason', value: reason, inline: false }
                )
                .setTimestamp();

            this.logModAction(member.guild, 'untimeout', member.user, reason);
            
            return { 
                success: true, 
                message: `⏰ **${member.user.tag}**'s timeout has been removed!\n\n**Reason:** ${reason}`,
                embed 
            };
        } catch (error) {
            return { success: false, message: `Yo, I couldn't remove the timeout from ${member.user.tag}! Error: ${error.message} 😤` };
        }
    }

    parseDuration(duration) {
        if (!duration) return null;
        
        const match = duration.match(/^(\d+)(m|h|d|s)$/i);
        if (!match) return null;

        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();

        switch (unit) {
            case 's': return value * 1000;
            case 'm': return value * 60 * 1000;
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            default: return null;
        }
    }

    logModAction(guild, action, user, reason) {
        const logEntry = {
            action,
            user: user.tag,
            userId: user.id,
            reason,
            timestamp: Date.now(),
            moderator: 'Zolory'
        };

        this.modActions.set(`${guild.id}-${user.id}-${Date.now()}`, logEntry);
    }

    getModActions(guildId, userId = null) {
        const actions = Array.from(this.modActions.entries())
            .filter(([key, action]) => key.startsWith(`${guildId}-`))
            .map(([key, action]) => action);

        if (userId) {
            return actions.filter(action => action.userId === userId);
        }

        return actions;
    }
}

module.exports = { ModerationManager };