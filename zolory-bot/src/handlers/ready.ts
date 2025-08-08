import { Client, ActivityType } from 'discord.js';
import cron from 'node-cron';
import { Emojis } from '../skills/gifs.js';

function setPresence(client: Client, status: string, type: ActivityType = ActivityType.Playing) {
  client.user?.setPresence({ activities: [{ name: status, type }], status: 'online' });
}

export function registerReady(client: Client) {
  client.once('ready', () => {
    setPresence(client, 'with the homies ' + Emojis.game);

    const tz = process.env.TIMEZONE || 'America/New_York';

    // Nap times: every day at 3pm (15:00) and 3am (03:00)
    cron.schedule('0 15 * * *', () => {
      setPresence(client, 'taking a power nap ' + Emojis.sleepy, ActivityType.Listening);
    }, { timezone: tz });

    cron.schedule('0 3 * * *', () => {
      setPresence(client, 'Zzz...', ActivityType.Listening);
    }, { timezone: tz });
  });
}