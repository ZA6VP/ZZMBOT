const { PermissionFlagsBits } = require('discord.js');

// Admin user IDs that have access to all commands
const ADMIN_USER_IDS = ['1219957467690172517', '1378808921732550706'];

function hasPermission(member, permission) {
    return member.permissions.has(permission);
}

function hasRole(member, roleNames) {
    return member.roles.cache.some(role => roleNames.includes(role.name));
}

function isBotAdmin(userId) {
    return ADMIN_USER_IDS.includes(userId);
}

function isModerator(member, config) {
    return isBotAdmin(member.id) || hasRole(member, config.modRoleNames) || hasPermission(member, PermissionFlagsBits.Administrator);
}

function isAdmin(member) {
    return isBotAdmin(member.id) || hasPermission(member, PermissionFlagsBits.Administrator);
}

function canModerate(executor, target) {
    // Bot admins can moderate anyone
    if (isBotAdmin(executor.id)) return true;
    
    // Bot owner can moderate anyone
    if (executor.id === executor.guild.ownerId) return true;
    
    // Can't moderate yourself
    if (executor.id === target.id) return false;
    
    // Can't moderate bot admins
    if (isBotAdmin(target.id)) return false;
    
    // Can't moderate someone with higher or equal role
    if (target.roles.highest.position >= executor.roles.highest.position) return false;
    
    // Can't moderate administrators unless you're the owner or bot admin
    if (target.permissions.has(PermissionFlagsBits.Administrator)) return false;
    
    return true;
}

module.exports = {
    hasPermission,
    hasRole,
    isBotAdmin,
    isModerator,
    isAdmin,
    canModerate
};
