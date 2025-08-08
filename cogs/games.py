import discord
from discord.ext import commands

BOARD_POSITIONS = {
    "1": (0, 0), "2": (0, 1), "3": (0, 2),
    "4": (1, 0), "5": (1, 1), "6": (1, 2),
    "7": (2, 0), "8": (2, 1), "9": (2, 2),
}

WIN_STATES = [
    [(0, 0), (0, 1), (0, 2)],
    [(1, 0), (1, 1), (1, 2)],
    [(2, 0), (2, 1), (2, 2)],
    [(0, 0), (1, 0), (2, 0)],
    [(0, 1), (1, 1), (2, 1)],
    [(0, 2), (1, 2), (2, 2)],
    [(0, 0), (1, 1), (2, 2)],
    [(0, 2), (1, 1), (2, 0)],
]


def render_board(board):
    symbols = {None: ":white_large_square:", "X": ":regional_indicator_x:", "O": ":o2:"}
    rows = []
    for row in board:
        rows.append("".join(symbols[cell] for cell in row))
    return "\n".join(rows)


class TicTacToe:
    def __init__(self, player_x: int, player_o: int):
        self.players = {"X": player_x, "O": player_o}
        self.turn = "X"
        self.board = [[None] * 3 for _ in range(3)]

    def move(self, position: str):
        if position not in BOARD_POSITIONS:
            return False, "Invalid position."
        x, y = BOARD_POSITIONS[position]
        if self.board[x][y] is not None:
            return False, "Spot already taken."
        self.board[x][y] = self.turn
        self.turn = "O" if self.turn == "X" else "X"
        return True, None

    def check_winner(self):
        for combo in WIN_STATES:
            values = {self.board[x][y] for x, y in combo}
            if len(values) == 1 and None not in values:
                return values.pop()
        if all(cell for row in self.board for cell in row):
            return "Tie"
        return None


class GamesCog(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.active_games: dict[int, TicTacToe] = {}

    @commands.command(name="tictactoe", aliases=["ttt"])
    async def start_tictactoe(self, ctx: commands.Context, opponent: discord.Member):
        """Start a Tic Tac Toe game with an opponent."""
        author_id = ctx.author.id
        opponent_id = opponent.id
        game = TicTacToe(player_x=author_id, player_o=opponent_id)
        self.active_games[ctx.channel.id] = game
        await ctx.send(f"Tic Tac Toe started between {ctx.author.mention} (X) and {opponent.mention} (O)!\n" + render_board(game.board))

    @commands.command(name="place")
    async def place_ttt(self, ctx: commands.Context, position: str):
        """Place an X or O on the board."""
        game = self.active_games.get(ctx.channel.id)
        if not game:
            await ctx.send("No active Tic Tac Toe game in this channel.")
            return
        current_player_id = game.players[game.turn]
        if ctx.author.id != current_player_id:
            await ctx.send("It's not your turn, homie.")
            return

        valid, msg = game.move(position)
        if not valid:
            await ctx.send(msg)
            return
        winner = game.check_winner()
        board_render = render_board(game.board)
        if winner == "Tie":
            await ctx.send(board_render + "\nIt's a tie! 🤝")
            del self.active_games[ctx.channel.id]
        elif winner:
            winner_member = ctx.guild.get_member(game.players[winner])
            await ctx.send(board_render + f"\n{winner_member.mention} wins! 🏆")
            del self.active_games[ctx.channel.id]
        else:
            await ctx.send(board_render + f"\nIt's **{ctx.guild.get_member(game.players[game.turn]).mention}**'s turn ({game.turn}).")


async def setup(bot: commands.Bot):
    await bot.add_cog(GamesCog(bot))