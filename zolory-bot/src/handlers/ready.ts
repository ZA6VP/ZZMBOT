import { Client, ActivityType } from 'discord.js';
import cron from 'node-cron';
import { Emojis } from '../skills/gifs.js';

function setPresence(client: Client, status: string, type: ActivityType = ActivityType.Playing, overall: 'online'|'idle'|'dnd'|'invisible' = 'online') {
  client.user?.setPresence({ activities: [{ name: status, type }], status: overall });
}

const activities = [
  { type: ActivityType.Playing, text: 'with the homies ' + Emojis.game },
  { type: ActivityType.Listening, text: 'the streets ' + Emojis.fire },
  { type: ActivityType.Watching, text: 'the timeline ' + Emojis.laugh },
  { type: ActivityType.Competing, text: 'mini-games' },
];

export function registerReady(client: Client) {
  client.once('ready', () => {
    // initial
    const a = activities[Math.floor(Math.random() * activities.length)];
    setPresence(client, a.text, a.type, 'online');

    const tz = process.env.TIMEZONE || 'America/New_York';

    // Rotate every 30m
    cron.schedule('*/30 * * * *', () => {
      const pick = activities[Math.floor(Math.random() * activities.length)];
      setPresence(client, pick.text, pick.type, 'online');
    }, { timezone: tz });

    // Nap times: every day at 3pm and 3am
    cron.schedule('0 15 * * *', () => {
      setPresence(client, 'taking a power nap ' + Emojis.sleepy, ActivityType.Listening, 'idle');
    }, { timezone: tz });

    cron.schedule('0 3 * * *', () => {
      setPresence(client, 'Zzz...', ActivityType.Listening, 'idle');
    }, { timezone: tz });
  });
}