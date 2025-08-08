export type Player = 'X' | 'O';
export type Board = (Player | null)[]; // 9 cells

export type TicTacToeState = {
  board: Board;
  current: Player;
  human: Player; // human plays X or O
  bot: Player;
  humanWins: number;
  botWins: number;
  roundsToWin: number; // e.g., first to 3
  finished: boolean;
  winner: 'human' | 'bot' | 'draw' | null;
};

export function newGame(roundsToWin = 1, humanStarts = true): TicTacToeState {
  const human: Player = humanStarts ? 'X' : 'O';
  const bot: Player = human === 'X' ? 'O' : 'X';
  return {
    board: Array(9).fill(null),
    current: 'X',
    human,
    bot,
    humanWins: 0,
    botWins: 0,
    roundsToWin,
    finished: false,
    winner: null,
  };
}

export function serialize(state: TicTacToeState): string {
  return JSON.stringify(state);
}

export function deserialize(s: string): TicTacToeState {
  return JSON.parse(s) as TicTacToeState;
}

export function renderBoard(board: Board): string {
  const cell = (i: number) => board[i] ?? String(i + 1);
  return `${cell(0)} | ${cell(1)} | ${cell(2)}\n---------\n${cell(3)} | ${cell(4)} | ${cell(5)}\n---------\n${cell(6)} | ${cell(7)} | ${cell(8)}`;
}

export function playMove(state: TicTacToeState, index: number): TicTacToeState {
  if (state.board[index] || state.finished) return state;
  state.board[index] = state.current;
  state.current = state.current === 'X' ? 'O' : 'X';
  const w = evaluateWinner(state.board);
  if (w) {
    state.finished = true;
    if (w === state.human) state.humanWins++;
    else if (w === state.bot) state.botWins++;
    state.winner = w === state.human ? 'human' : 'bot';
  } else if (state.board.every(Boolean)) {
    state.finished = true;
    state.winner = 'draw';
  }
  return state;
}

export function botMove(state: TicTacToeState): number {
  // Simple AI: win > block > center > random corner > random side
  const b = state.board;
  const me = state.bot;
  const you = state.human;

  // Try winning
  const winIdx = findWinningMove(b, me);
  if (winIdx != null) return winIdx;
  // Block
  const blockIdx = findWinningMove(b, you);
  if (blockIdx != null) return blockIdx;
  // Center
  if (!b[4]) return 4;
  // Corners
  const corners = [0, 2, 6, 8].filter(i => !b[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Sides
  const sides = [1, 3, 5, 7].filter(i => !b[i]);
  return sides[Math.floor(Math.random() * sides.length)];
}

function findWinningMove(board: Board, player: Player): number | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    const line: [number, number, number] = [a, b, c];
    const values = line.map(i => board[i]);
    const count = values.filter(v => v === player).length;
    const emptyIndex = line.find(i => !board[i]);
    if (count === 2 && emptyIndex != null) return emptyIndex;
  }
  return null;
}

function evaluateWinner(board: Board): Player | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a]!;
  }
  return null;
}