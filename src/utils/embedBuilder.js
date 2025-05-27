const { EmbedBuilder } = require('discord.js');

function createSuccessEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}

function createErrorEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}

function createInfoEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}

function createWarningEmbed(title, description) {
    return new EmbedBuilder()
        .setColor('#FFAA00')
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
}

function createModerationEmbed(action, user, moderator, reason, duration = null) {
    const embed = new EmbedBuilder()
        .setColor('#FF6B35')
        .setTitle(`User ${action}`)
        .addFields(
            { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
            { name: 'Moderator', value: `${moderator.tag}`, inline: true },
            { name: 'Reason', value: reason || 'No reason provided', inline: false }
        )
        .setTimestamp();

    if (duration) {
        embed.addFields({ name: 'Duration', value: duration, inline: true });
    }

    return embed;
}

module.exports = {
    createSuccessEmbed,
    createErrorEmbed,
    createInfoEmbed,
    createWarningEmbed,
    createModerationEmbed
};