const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    // Check if user has required permissions
    hasPermission(member, permissions) {
        if (!member) return false;
        if (typeof permissions === 'string') {
            return member.permissions.has(PermissionFlagsBits[permissions]);
        }
        return permissions.every(perm => member.permissions.has(PermissionFlagsBits[perm]));
    },
    
    // Check if user has any of the mod roles
    isModerator(member, config) {
        if (!member) return false;
        const modRoles = config.modRoleNames || ['Moderator', 'Admin'];
        return member.roles.cache.some(role => modRoles.includes(role.name));
    },
    
    // Check if user is bot owner
    isOwner(userId, config) {
        return config.ownerIds.includes(userId);
    },
    
    // Check if bot has required permissions
    botHasPermission(guild, permissions) {
        const botMember = guild.members.me;
        if (!botMember) return false;
        if (typeof permissions === 'string') {
            return botMember.permissions.has(PermissionFlagsBits[permissions]);
        }
        return permissions.every(perm => botMember.permissions.has(PermissionFlagsBits[perm]));
    },
    
    // Check hierarchy (can the moderator act on the target)
    checkHierarchy(moderator, target) {
        if (!moderator || !target) return false;
        return moderator.roles.highest.position > target.roles.highest.position;
    }
};