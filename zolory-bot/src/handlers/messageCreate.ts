import { Client, Message, Partials, EmbedBuilder } from 'discord.js';
import { handleModeration } from '../commands/moderation.js';
import { detectIntent } from '../nlp/nlu.js';
import { handleTicTacToeStart, maybeHandleTicTacToeMove } from '../commands/games.js';
import { generateReply } from '../skills/chat.js';
import { Emojis } from '../skills/gifs.js';
import { isOwner, ZOLORI_NAME } from '../config/persona.js';

const responded = new Set<string>();
const channelBusy = new Set<string>();

function isTriggeringMessage(client: Client, message: Message): boolean {
  if (message.channel.isDMBased()) return true;
  if (message.mentions.users.has(client.user!.id)) return true;
  if (message.reference?.messageId) {
    const refUserId = message.mentions.repliedUser?.id;
    if (refUserId && refUserId === client.user?.id) return true;
  }
  const content = message.content.trim().toLowerCase();
  const name = ZOLORI_NAME.toLowerCase();
  if (content.startsWith(name) || content.startsWith(`yo ${name}`) || content.startsWith(`yoo ${name}`)) return true;
  return false;
}

export function registerMessageCreate(client: Client) {
  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (responded.has(message.id)) return;
    if (channelBusy.has(message.channel.id)) return;
    channelBusy.add(message.channel.id);

    try {
      // tic-tac-toe move handler
      const moved = await maybeHandleTicTacToeMove(message);
      if (moved) { responded.add(message.id); return; }

      const triggered = isTriggeringMessage(client, message);
      if (!triggered) return;

      // First try moderation intents
      const modHandled = await handleModeration(message);
      if (modHandled) { responded.add(message.id); return; }

      // Game start / Roblox
      const intent = detectIntent(message.content);
      if (intent.name === 'game.tictactoe.start') {
        await handleTicTacToeStart(message, intent.rounds);
        responded.add(message.id);
        return;
      }
      if (intent.name === 'ask.roblox') {
        await message.reply(`I can't join Roblox, but I'm down to game here. ${Emojis.game} Say "let’s play tictactoe first to 3".`);
        responded.add(message.id);
        return;
      }

      // Chat response (AI-driven)
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
      });

      await message.reply(reply);
      responded.add(message.id);

    } catch (err) {
      console.error('messageCreate handler error', err);
      await message.reply("My brain lagged, run it back.").catch(() => {});
      responded.add(message.id);
    } finally {
      channelBusy.delete(message.channel.id);
    }
  });
}