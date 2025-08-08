const winston = require('winston');
const path = require('path');

class Logger {
    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service: 'zolory-bot' },
            transports: [
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../../logs/error.log'), 
                    level: 'error' 
                }),
                new winston.transports.File({ 
                    filename: path.join(__dirname, '../../logs/combined.log') 
                })
            ]
        });

        if (process.env.NODE_ENV !== 'production') {
            this.logger.add(new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }));
        }
    }

    info(message, meta = {}) {
        this.logger.info(message, meta);
    }

    error(message, meta = {}) {
        this.logger.error(message, meta);
    }

    warn(message, meta = {}) {
        this.logger.warn(message, meta);
    }

    debug(message, meta = {}) {
        this.logger.debug(message, meta);
    }

    logCommand(user, command, guild, channel) {
        this.info('Command executed', {
            user: user.tag,
            userId: user.id,
            command,
            guild: guild?.name,
            guildId: guild?.id,
            channel: channel?.name,
            channelId: channel?.id,
            timestamp: new Date().toISOString()
        });
    }

    logModeration(action, moderator, target, reason, guild) {
        this.info('Moderation action', {
            action,
            moderator: moderator.tag,
            moderatorId: moderator.id,
            target: target.tag,
            targetId: target.id,
            reason,
            guild: guild?.name,
            guildId: guild?.id,
            timestamp: new Date().toISOString()
        });
    }

    logError(error, context = {}) {
        this.error('Application error', {
            error: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = { Logger };