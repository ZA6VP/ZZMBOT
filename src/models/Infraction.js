const mongoose = require('mongoose');

const infractionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    moderatorId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['warn', 'kick', 'ban', 'timeout', 'mute']
    },
    reason: {
        type: String,
        default: 'No reason provided'
    },
    duration: {
        type: String,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
infractionSchema.index({ userId: 1, guildId: 1 });
infractionSchema.index({ guildId: 1, type: 1 });

module.exports = mongoose.model('Infraction', infractionSchema);
