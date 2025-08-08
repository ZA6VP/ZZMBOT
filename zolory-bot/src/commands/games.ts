import { Message } from 'discord.js';
import { GameSessions } from '../storage/db.js';
import { botMove, newGame, playMove, renderBoard, serialize, deserialize } from '../games/tictactoe.js';
import { Emojis } from '../skills/gifs.js';

export async function handleTicTacToeStart(message: Message, rounds?: number) {
  const roundsToWin = Math.min(Math.max(rounds ?? 1, 1), 5);
  const state = newGame(roundsToWin, true);
  const sessionId = GameSessions.upsert({
    guildId: message.guild?.id ?? null,
    channelId: message.channel.id,
    userId: message.author.id,
    type: 'tictactoe',
    state: serialize(state),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  await message.reply(`${Emojis.game} TicTacToe started (first to ${roundsToWin}). You are ${state.human}. Send a number (1-9) to play.\n\n${'```'}\n${renderBoard(state.board)}\n${'```'}`);
}

export async function maybeHandleTicTacToeMove(message: Message): Promise<boolean> {
  const content = message.content.trim();
  if (!/^[1-9]$/.test(content)) return false;
  const session = GameSessions.findByChannelUser('tictactoe', message.channel.id, message.author.id);
  if (!session) return false;
  let state = deserialize(session.state);
  const idx = Number(content) - 1;
  if (state.finished) return false;
  if (state.current !== state.human) return false;
  if (state.board[idx]) {
    await message.reply('That spot is taken, fam. Pick another.');
    return true;
  }
  state = playMove(state, idx);
  let out = `${'```'}\n${renderBoard(state.board)}\n${'```'}`;

  if (!state.finished) {
    // Bot plays
    const botIdx = botMove(state);
    state = playMove(state, botIdx);
    out += `\nMy move: ${botIdx + 1}\n${'```'}\n${renderBoard(state.board)}\n${'```'}`;
  }

  if (state.finished) {
    if (state.winner === 'human') out += `\nYou got me this round ${Emojis.salute}`;
    else if (state.winner === 'bot') out += `\nEZ dubs ${Emojis.fire}`;
    else out += `\nDraw. Run it back?`;
  }

  GameSessions.upsert({
    id: session.id,
    guildId: session.guildId,
    channelId: session.channelId,
    userId: session.userId,
    type: 'tictactoe',
    state: serialize(state),
    createdAt: session.createdAt,
    updatedAt: Date.now(),
  });

  await message.reply(out);
  return true;
}