import { Client, Message, Partials, EmbedBuilder } from 'discord.js';
import { handleModeration } from '../commands/moderation.js';
import { detectIntent } from '../nlp/nlu.js';
import { handleTicTacToeStart, maybeHandleTicTacToeMove } from '../commands/games.js';
import { generateReply } from '../skills/chat.js';
import { Emojis, randomGif } from '../skills/gifs.js';
import { isOwner, ZOLORI_NAME } from '../config/persona.js';

function isTriggeringMessage(client: Client, message: Message): boolean {
  if (message.mentions.users.has(client.user!.id)) return true;
  if (message.channel.isDMBased()) return true;
  const name = ZOLORI_NAME.toLowerCase();
  return message.content.toLowerCase().includes(name);
}

export function registerMessageCreate(client: Client) {
  client.on('messageCreate', async (message) => {
    try {
      if (message.author.bot) return;

      // small reactive emojis
      if (/\b(lol|lmao|rofl)\b/i.test(message.content)) await message.react(Emojis.laugh).catch(() => {});

      // tic-tac-toe move handler
      const moved = await maybeHandleTicTacToeMove(message);
      if (moved) return;

      const triggered = isTriggeringMessage(client, message);
      if (!triggered) return;

      // First try moderation intents
      const modHandled = await handleModeration(message);
      if (modHandled) return;

      // Game start / Roblox
      const intent = detectIntent(message.content);
      if (intent.name === 'game.tictactoe.start') {
        await handleTicTacToeStart(message, intent.rounds);
        return;
      }
      if (intent.name === 'ask.roblox') {
        await message.reply(`I can't join Roblox, but I'm down to game here. ${Emojis.game} Say "let’s play tictactoe first to 3".`);
        return;
      }

      // Chat response
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

      // Occasionally add a gif
      const extra = Math.random() < 0.2 ? `\n${randomGif('greet')}` : '';
      await message.reply(reply + extra);

    } catch (err) {
      console.error('messageCreate handler error', err);
      await message.reply("My brain lagged, run it back.").catch(() => {});
    }
  });
}