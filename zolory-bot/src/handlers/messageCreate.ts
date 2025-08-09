import { Client, Message, Partials, EmbedBuilder } from 'discord.js';
import { handleModeration } from '../commands/moderation.js';
import { detectIntent } from '../nlp/nlu.js';
import { handleTicTacToeStart, maybeHandleTicTacToeMove } from '../commands/games.js';
import { generateReply } from '../skills/chat.js';
import { Emojis } from '../skills/gifs.js';
import { isOwner, ZOLORI_NAME } from '../config/persona.js';
import { ProcessedMessages } from '../storage/db.js';
import { getRecent, pushMessage } from '../storage/memory.js';
import { handleVoiceJoin, handleVoiceLeave, handleVoiceSay } from './voice.js';

const responded = new Set<string>();
const channelBusy = new Set<string>();
const channelThrottle = new Map<string, number>();

const freeTalk = (process.env.FREETALK_CHANNELS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

function isTriggeringMessage(client: Client, message: Message): boolean {
  if (message.channel.isDMBased()) return true;
  if (message.mentions.users.has(client.user!.id)) return true;
  const content = message.content.trim().toLowerCase();
  const name = ZOLORI_NAME.toLowerCase();
  if (content.startsWith(name) || content.startsWith(`yo ${name}`) || content.startsWith(`yoo ${name}`)) return true;
  // free talk channels
  const chName = (message.channel as any).name?.toLowerCase?.();
  if (chName && freeTalk.includes(chName)) return true;
  return false;
}

export function registerMessageCreate(client: Client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (responded.has(message.id)) return;
    if (!ProcessedMessages.claim(message.id)) return; // already processed elsewhere

    const last = channelThrottle.get(message.channel.id) || 0;
    if (Date.now() - last < 1200) return;

    if (channelBusy.has(message.channel.id)) return;
    channelBusy.add(message.channel.id);

    try {
      const moved = await maybeHandleTicTacToeMove(message);
      if (moved) { responded.add(message.id); channelThrottle.set(message.channel.id, Date.now()); return; }

      const triggered = isTriggeringMessage(client, message);
      if (!triggered) return;

      // push user message into memory
      pushMessage(message.channel.id, 'user', message.content);

      // Voice intents
      const intent = detectIntent(message.content);
      if (intent.name === 'voice.join') { await handleVoiceJoin(message, intent.channel); responded.add(message.id); channelThrottle.set(message.channel.id, Date.now()); return; }
      if (intent.name === 'voice.leave') { await handleVoiceLeave(message); responded.add(message.id); channelThrottle.set(message.channel.id, Date.now()); return; }
      if (intent.name === 'voice.say') { await handleVoiceSay(message, intent.text); responded.add(message.id); channelThrottle.set(message.channel.id, Date.now()); return; }

      // Moderation intents
      const modHandled = await handleModeration(message);
      if (modHandled) { responded.add(message.id); channelThrottle.set(message.channel.id, Date.now()); return; }

      // Game start / Roblox
      if (intent.name === 'game.tictactoe.start') {
        await handleTicTacToeStart(message, intent.rounds);
        responded.add(message.id);
        channelThrottle.set(message.channel.id, Date.now());
        return;
      }
      if (intent.name === 'ask.roblox') {
        await message.reply(`I can't join Roblox, but I'm down to game here. ${Emojis.game} Say "let’s play tictactoe first to 3".`);
        responded.add(message.id);
        channelThrottle.set(message.channel.id, Date.now());
        return;
      }

      // Chat response (AI-driven) with typing indicator and short memory
      await message.channel.sendTyping();
      const allowSpicy = !isOwner(message.author.id) && /\b(fuck|stfu|dumb|idiot|trash|suck)\b/i.test(message.content);
      const display = message.member?.displayName || message.author.globalName || message.author.username;
      const reply = await generateReply(message.content, {
        guildName: message.guild?.name,
        channelName: (message.channel as any).name,
        userDisplayName: display,
        userId: message.author.id,
        ownerId: message.client.application?.owner?.id || process.env.OWNER_ID || '1219957467690172517',
        allowSpicy,
        mood: allowSpicy ? 'spicy' : 'helpful',
        recentMessages: getRecent(message.channel.id),
      });

      await message.reply(reply);
      pushMessage(message.channel.id, 'bot', reply);
      responded.add(message.id);
      channelThrottle.set(message.channel.id, Date.now());

    } catch (err) {
      console.error('messageCreate handler error', err);
      await message.reply("My brain lagged, run it back.").catch(() => {});
      responded.add(message.id);
      channelThrottle.set(message.channel.id, Date.now());
    } finally {
      channelBusy.delete(message.channel.id);
    }
  });
}