import { Client, ActivityType, TextChannel } from 'discord.js';
import cron from 'node-cron';
import { Emojis } from '../skills/gifs.js';
import { generateReply } from '../skills/chat.js';

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
    const a = activities[Math.floor(Math.random() * activities.length)];
    setPresence(client, a.text, a.type, 'online');

    const tz = process.env.TIMEZONE || 'America/New_York';

    cron.schedule('*/30 * * * *', () => {
      const pick = activities[Math.floor(Math.random() * activities.length)];
      setPresence(client, pick.text, pick.type, 'online');
    }, { timezone: tz });

    cron.schedule('0 15 * * *', () => {
      setPresence(client, 'taking a power nap ' + Emojis.sleepy, ActivityType.Listening, 'idle');
    }, { timezone: tz });

    cron.schedule('0 3 * * *', () => {
      setPresence(client, 'Zzz...', ActivityType.Listening, 'idle');
    }, { timezone: tz });

    // Proactive light chat every 2 hours in free-talk channels
    const freeTalk = (process.env.FREETALK_CHANNELS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    cron.schedule('0 */2 * * *', async () => {
      if (!freeTalk.length) return;
      for (const [id, guild] of client.guilds.cache) {
        const channels = guild.channels.cache.filter(c => c.isTextBased() && freeTalk.includes((c as any).name?.toLowerCase?.()));
        const first = channels.first() as TextChannel | undefined;
        if (!first) continue;
        try {
          await first.sendTyping();
          const reply = await generateReply('Start a convo naturally with the chat.', {
            guildName: guild.name,
            channelName: first.name,
            userDisplayName: 'everyone',
            userId: 'system',
            ownerId: process.env.OWNER_ID || '1219957467690172517',
            allowSpicy: false,
            mood: 'playful',
          } as any);
          await first.send(reply);
          break; // only one guild per tick
        } catch {
          // ignore
        }
      }
    }, { timezone: tz });
  });
}