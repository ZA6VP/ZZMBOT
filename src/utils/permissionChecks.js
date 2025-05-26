const { PermissionFlagsBits } = require('discord.js');

function hasPermission(member, permission) {
    return member.permissions.has(permission);
}

function hasRole(member, roleNames) {
    return member.roles.cache.some(role => roleNames.includes(role.name));
}

function isModerator(member, config) {
    return hasRole(member, config.modRoleNames) || hasPermission(member, PermissionFlagsBits.Administrator);
}

function isAdmin(member) {
    return hasPermission(member, PermissionFlagsBits.Administrator);
}

function canModerate(executor, target) {
    // Bot owner can moderate anyone
    if (executor.id === executor.guild.ownerId) return true;
    
    // Can't moderate yourself
    if (executor.id === target.id) return false;
    
    // Can't moderate someone with higher or equal role
    if (target.roles.highest.position >= executor.roles.highest.position) return false;
    
    // Can't moderate administrators unless you're the owner
    if (target.permissions.has(PermissionFlagsBits.Administrator)) return false;
    
    return true;
}

module.exports = {
    hasPermission,
    hasRole,
    isModerator,
    isAdmin,
    canModerate
};
