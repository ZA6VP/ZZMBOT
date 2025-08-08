const { ActivityType } = require('discord.js');
const moment = require('moment-timezone');

class SleepManager {
    constructor(client) {
        this.client = client;
        this.isAsleep = false;
        this.isNapping = false;
        this.sleepStartTime = null;
        this.napStartTime = null;
        this.sleepSchedule = client.config.botPersonality.sleepSchedule;
    }

    async goToSleep(client) {
        if (this.isAsleep) return;

        this.isAsleep = true;
        this.sleepStartTime = Date.now();
        
        // Update bot status
        if (client.user) {
            client.user.setActivity('💤 Sleeping...', { type: ActivityType.Playing });
            client.user.setStatus('idle');
        }

        // Update bot state
        if (client.botState) {
            client.botState.isAwake = false;
            client.botState.currentMood = 'tired';
        }

        console.log(`😴 ${client.config.botPersonality.name} is going to sleep...`);
        
        // Send sleep message to all guilds
        for (const guild of client.guilds.cache.values()) {
            const systemChannel = guild.systemChannel;
            if (systemChannel) {
                try {
                    await systemChannel.send('😴 **Zolory is going to sleep now...** Good night everyone! 🌙');
                } catch (error) {
                    console.error(`Failed to send sleep message to ${guild.name}:`, error);
                }
            }
        }
    }

    async wakeUp(client) {
        if (!this.isAsleep) return;

        this.isAsleep = false;
        this.sleepStartTime = null;
        
        // Update bot status
        if (client.user) {
            client.user.setActivity(`${client.config.botPersonality.name} | ${client.botState?.currentMood || 'awake'}`, { type: ActivityType.Playing });
            client.user.setStatus('online');
        }

        // Update bot state
        if (client.botState) {
            client.botState.isAwake = true;
            client.botState.currentMood = 'happy';
        }

        console.log(`🌅 ${client.config.botPersonality.name} is waking up!`);
        
        // Send wake up message to all guilds
        for (const guild of client.guilds.cache.values()) {
            const systemChannel = guild.systemChannel;
            if (systemChannel) {
                try {
                    await systemChannel.send('🌅 **Good morning everyone!** Zolory is back and ready to help! ☀️');
                } catch (error) {
                    console.error(`Failed to send wake up message to ${guild.name}:`, error);
                }
            }
        }
    }

    async takeNap(client, duration = 30) {
        if (this.isAsleep || this.isNapping) {
            return { success: false, message: "Yo, I'm already sleeping or napping! 😴" };
        }

        this.isNapping = true;
        this.napStartTime = Date.now();
        
        // Update bot status
        if (client.user) {
            client.user.setActivity('😴 Taking a nap...', { type: ActivityType.Playing });
            client.user.setStatus('idle');
        }

        console.log(`😴 ${client.config.botPersonality.name} is taking a ${duration} minute nap...`);

        // Set timer to wake up from nap
        setTimeout(async () => {
            await this.wakeFromNap(client);
        }, duration * 60 * 1000);

        return { 
            success: true, 
            message: `😴 **${client.config.botPersonality.name} is taking a ${duration} minute nap...** See you soon! 💤` 
        };
    }

    async wakeFromNap(client) {
        if (!this.isNapping) return;

        this.isNapping = false;
        this.napStartTime = null;
        
        // Update bot status
        if (client.user) {
            client.user.setActivity(`${client.config.botPersonality.name} | ${client.botState?.currentMood || 'refreshed'}`, { type: ActivityType.Playing });
            client.user.setStatus('online');
        }

        // Update bot state
        if (client.botState) {
            client.botState.isAwake = true;
            client.botState.currentMood = 'refreshed';
        }

        console.log(`😊 ${client.config.botPersonality.name} woke up from nap feeling refreshed!`);
        
        // Send wake up from nap message to all guilds
        for (const guild of client.guilds.cache.values()) {
            const systemChannel = guild.systemChannel;
            if (systemChannel) {
                try {
                    await systemChannel.send('😊 **Zolory is back from his nap!** Feeling refreshed and ready to help! 💪');
                } catch (error) {
                    console.error(`Failed to send nap wake up message to ${guild.name}:`, error);
                }
            }
        }
    }

    isCurrentlyAsleep() {
        return this.isAsleep || this.isNapping;
    }

    getSleepStatus() {
        if (this.isAsleep) {
            const sleepDuration = moment.duration(Date.now() - this.sleepStartTime);
            return {
                status: 'asleep',
                duration: sleepDuration.humanize(),
                startTime: this.sleepStartTime
            };
        } else if (this.isNapping) {
            const napDuration = moment.duration(Date.now() - this.napStartTime);
            return {
                status: 'napping',
                duration: napDuration.humanize(),
                startTime: this.napStartTime
            };
        } else {
            return {
                status: 'awake',
                duration: null,
                startTime: null
            };
        }
    }

    async handleSleepCommand(client, message, args) {
        const action = args[0]?.toLowerCase();
        
        switch (action) {
            case 'nap':
                const duration = parseInt(args[1]) || 30;
                if (duration < 1 || duration > 180) {
                    return { success: false, message: "Yo, I can only nap for 1-180 minutes! 😅" };
                }
                return await this.takeNap(client, duration);
            
            case 'wake':
                if (this.isNapping) {
                    await this.wakeFromNap(client);
                    return { success: true, message: "😊 **Zolory is awake from his nap!** Ready to help! 💪" };
                } else if (this.isAsleep) {
                    await this.wakeUp(client);
                    return { success: true, message: "🌅 **Zolory is awake!** Good morning! ☀️" };
                } else {
                    return { success: false, message: "Yo, I'm already awake! 😅" };
                }
            
            case 'status':
                const status = this.getSleepStatus();
                let statusMessage = `😴 **Sleep Status:** ${status.status.toUpperCase()}`;
                if (status.duration) {
                    statusMessage += `\n⏰ **Duration:** ${status.duration}`;
                }
                return { success: true, message: statusMessage };
            
            default:
                return { success: false, message: "Yo, what you want me to do? Try 'nap', 'wake', or 'status'! 😅" };
        }
    }

    shouldBeAsleep() {
        const now = moment().tz(this.sleepSchedule.timezone);
        const bedtime = moment(now.format('YYYY-MM-DD') + ' ' + this.sleepSchedule.bedtime, 'YYYY-MM-DD HH:mm').tz(this.sleepSchedule.timezone);
        const wakeTime = moment(now.format('YYYY-MM-DD') + ' ' + this.sleepSchedule.wakeTime, 'YYYY-MM-DD HH:mm').tz(this.sleepSchedule.timezone);
        
        // If it's past bedtime or before wake time
        return now.isAfter(bedtime) || now.isBefore(wakeTime);
    }

    async checkSleepSchedule(client) {
        if (this.shouldBeAsleep() && !this.isAsleep && !this.isNapping) {
            await this.goToSleep(client);
        } else if (!this.shouldBeAsleep() && this.isAsleep) {
            await this.wakeUp(client);
        }
    }
}

module.exports = { SleepManager };