class GameManager {
    constructor(client) {
        this.client = client;
        this.activeGames = new Map();
        this.gameTypes = ['tictactoe', 'hangman', 'trivia', 'rps'];
    }

    async startGame(gameType, channel, user) {
        if (!this.gameTypes.includes(gameType)) {
            return { success: false, message: "Yo fam, I don't know that game yet. Try tictactoe, hangman, trivia, or rps!" };
        }

        const gameId = `${channel.id}-${user.id}-${gameType}`;
        
        if (this.activeGames.has(gameId)) {
            return { success: false, message: "Yo, you already got a game running! Finish that one first." };
        }

        let game;
        switch (gameType) {
            case 'tictactoe':
                game = new TicTacToeGame(user, this.client.user);
                break;
            case 'hangman':
                game = new HangmanGame(user, this.client.user);
                break;
            case 'trivia':
                game = new TriviaGame(user, this.client.user);
                break;
            case 'rps':
                game = new RockPaperScissorsGame(user, this.client.user);
                break;
        }

        this.activeGames.set(gameId, game);
        
        const gameMessage = await game.start(channel);
        return { success: true, message: gameMessage, gameId };
    }

    async handleGameMove(gameId, user, move) {
        const game = this.activeGames.get(gameId);
        if (!game) {
            return { success: false, message: "Yo, I can't find that game. Maybe it expired?" };
        }

        if (game.player.id !== user.id) {
            return { success: false, message: "Yo, this ain't your game! Wait your turn." };
        }

        const result = await game.makeMove(move);
        
        if (game.isFinished()) {
            this.activeGames.delete(gameId);
        }

        return result;
    }

    getActiveGames() {
        return Array.from(this.activeGames.entries());
    }

    endGame(gameId) {
        const game = this.activeGames.get(gameId);
        if (game) {
            this.activeGames.delete(gameId);
            return true;
        }
        return false;
    }
}

class TicTacToeGame {
    constructor(player, bot) {
        this.player = player;
        this.bot = bot;
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.playerSymbol = 'X';
        this.botSymbol = 'O';
        this.finished = false;
        this.winner = null;
        this.moves = 0;
    }

    async start(channel) {
        const boardDisplay = this.displayBoard();
        return `🎮 **Tic-Tac-Toe Challenge!** 🎮\n\n${boardDisplay}\n\nYo ${this.player.displayName}, you're X! Make your move by saying a number 1-9 (top to bottom, left to right).`;
    }

    displayBoard() {
        const symbols = this.board.map(cell => cell || '⬜');
        return `\`\`\`
 ${symbols[0]} | ${symbols[1]} | ${symbols[2]} 
-----------
 ${symbols[3]} | ${symbols[4]} | ${symbols[5]} 
-----------
 ${symbols[6]} | ${symbols[7]} | ${symbols[8]} 
\`\`\``;
    }

    async makeMove(move) {
        if (this.finished) {
            return { success: false, message: "Game's already over fam!" };
        }

        const position = parseInt(move) - 1;
        if (isNaN(position) || position < 0 || position > 8 || this.board[position] !== '') {
            return { success: false, message: "Yo, that's not a valid move! Pick a number 1-9 that's empty." };
        }

        // Player move
        this.board[position] = this.playerSymbol;
        this.moves++;

        if (this.checkWinner(this.playerSymbol)) {
            this.finished = true;
            this.winner = this.player;
            return { 
                success: true, 
                message: `🎉 **${this.player.displayName} WINS!** 🎉\n\n${this.displayBoard()}\n\nGG fam! You got me this time! 😤`,
                gameOver: true 
            };
        }

        if (this.moves >= 9) {
            this.finished = true;
            return { 
                success: true, 
                message: `🤝 **It's a tie!** 🤝\n\n${this.displayBoard()}\n\nGood game! We're evenly matched! 💪`,
                gameOver: true 
            };
        }

        // Bot move
        const botMove = this.getBotMove();
        this.board[botMove] = this.botSymbol;
        this.moves++;

        if (this.checkWinner(this.botSymbol)) {
            this.finished = true;
            this.winner = this.bot;
            return { 
                success: true, 
                message: `😎 **I WIN!** 😎\n\n${this.displayBoard()}\n\nBetter luck next time! I'm just built different! 🔥`,
                gameOver: true 
            };
        }

        return { 
            success: true, 
            message: `Your move: ${move}\nMy move: ${botMove + 1}\n\n${this.displayBoard()}\n\nYour turn again!`,
            gameOver: false 
        };
    }

    getBotMove() {
        // Simple AI - try to win, then block, then random
        const availableMoves = this.board.map((cell, index) => cell === '' ? index : -1).filter(index => index !== -1);
        
        // Try to win
        for (const move of availableMoves) {
            const testBoard = [...this.board];
            testBoard[move] = this.botSymbol;
            if (this.checkWinner(this.botSymbol, testBoard)) {
                return move;
            }
        }

        // Try to block
        for (const move of availableMoves) {
            const testBoard = [...this.board];
            testBoard[move] = this.playerSymbol;
            if (this.checkWinner(this.playerSymbol, testBoard)) {
                return move;
            }
        }

        // Random move
        return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    checkWinner(symbol, board = this.board) {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];

        return winConditions.some(condition => 
            condition.every(index => board[index] === symbol)
        );
    }

    isFinished() {
        return this.finished;
    }
}

class HangmanGame {
    constructor(player, bot) {
        this.player = player;
        this.bot = bot;
        this.words = ['DISCORD', 'ZOLORY', 'GAMING', 'PROGRAMMING', 'ARTIFICIAL', 'INTELLIGENCE', 'BOT', 'FRIENDSHIP', 'ADVENTURE', 'MYSTERY'];
        this.word = this.words[Math.floor(Math.random() * this.words.length)];
        this.guessedLetters = new Set();
        this.wrongGuesses = 0;
        this.maxWrongGuesses = 6;
        this.finished = false;
        this.winner = null;
    }

    async start(channel) {
        const display = this.displayWord();
        return `🎯 **Hangman Challenge!** 🎯\n\n${display}\n\nYo ${this.player.displayName}, guess a letter! You got ${this.maxWrongGuesses - this.wrongGuesses} wrong guesses left.`;
    }

    displayWord() {
        return this.word.split('').map(letter => 
            this.guessedLetters.has(letter) ? letter : '_'
        ).join(' ');
    }

    async makeMove(guess) {
        if (this.finished) {
            return { success: false, message: "Game's already over fam!" };
        }

        const letter = guess.toUpperCase();
        if (!/^[A-Z]$/.test(letter)) {
            return { success: false, message: "Yo, that's not a letter! Guess A-Z." };
        }

        if (this.guessedLetters.has(letter)) {
            return { success: false, message: "You already guessed that letter! Try something else." };
        }

        this.guessedLetters.add(letter);

        if (!this.word.includes(letter)) {
            this.wrongGuesses++;
        }

        const display = this.displayWord();
        const hangman = this.getHangmanDisplay();

        if (this.checkWin()) {
            this.finished = true;
            this.winner = this.player;
            return { 
                success: true, 
                message: `🎉 **${this.player.displayName} WINS!** 🎉\n\n${display}\n\nYou guessed the word: **${this.word}**\n\nGG fam! You got skills! 🔥`,
                gameOver: true 
            };
        }

        if (this.wrongGuesses >= this.maxWrongGuesses) {
            this.finished = true;
            this.winner = this.bot;
            return { 
                success: true, 
                message: `💀 **GAME OVER!** 💀\n\n${hangman}\n\nThe word was: **${this.word}**\n\nBetter luck next time! I'm just too good! 😎`,
                gameOver: true 
            };
        }

        const status = this.wrongGuesses > 0 ? `\n${hangman}` : '';
        return { 
            success: true, 
            message: `Letter guessed: **${letter}**\n\n${display}${status}\n\nWrong guesses: ${this.wrongGuesses}/${this.maxWrongGuesses}`,
            gameOver: false 
        };
    }

    checkWin() {
        return this.word.split('').every(letter => this.guessedLetters.has(letter));
    }

    getHangmanDisplay() {
        const stages = [
            '',
            '  O  ',
            '  O  \n  |  ',
            '  O  \n /|  ',
            '  O  \n /|\\ ',
            '  O  \n /|\\ \n /   ',
            '  O  \n /|\\ \n / \\ '
        ];
        return `\`\`\`\n${stages[this.wrongGuesses]}\n\`\`\``;
    }

    isFinished() {
        return this.finished;
    }
}

class TriviaGame {
    constructor(player, bot) {
        this.player = player;
        this.bot = bot;
        this.questions = [
            {
                question: "What year was Discord founded?",
                options: ["2015", "2016", "2017", "2018"],
                correct: 0
            },
            {
                question: "What's the capital of Puerto Rico?",
                options: ["San Juan", "Ponce", "Bayamon", "Carolina"],
                correct: 0
            },
            {
                question: "How many languages does Zolory speak?",
                options: ["12", "18", "24", "30"],
                correct: 2
            },
            {
                question: "What's 2 + 2?",
                options: ["3", "4", "5", "6"],
                correct: 1
            }
        ];
        this.currentQuestion = 0;
        this.score = 0;
        this.finished = false;
    }

    async start(channel) {
        return this.getQuestionDisplay();
    }

    getQuestionDisplay() {
        const question = this.questions[this.currentQuestion];
        const options = question.options.map((option, index) => `${index + 1}. ${option}`).join('\n');
        return `🧠 **Trivia Challenge!** 🧠\n\n**Question ${this.currentQuestion + 1}/${this.questions.length}:**\n${question.question}\n\n${options}\n\nYo ${this.player.displayName}, pick 1-4!`;
    }

    async makeMove(answer) {
        if (this.finished) {
            return { success: false, message: "Game's already over fam!" };
        }

        const choice = parseInt(answer) - 1;
        if (isNaN(choice) || choice < 0 || choice > 3) {
            return { success: false, message: "Yo, pick 1-4! That's not a valid answer." };
        }

        const question = this.questions[this.currentQuestion];
        const correct = choice === question.correct;

        if (correct) {
            this.score++;
        }

        const result = correct ? "✅ Correct!" : "❌ Wrong!";
        const correctAnswer = question.options[question.correct];

        this.currentQuestion++;

        if (this.currentQuestion >= this.questions.length) {
            this.finished = true;
            const percentage = (this.score / this.questions.length) * 100;
            let message = `🎯 **Game Over!** 🎯\n\nFinal Score: ${this.score}/${this.questions.length} (${percentage}%)\n\n`;
            
            if (percentage >= 80) {
                message += "🔥 **AMAZING!** You're a trivia master! 🔥";
            } else if (percentage >= 60) {
                message += "💪 **Good job!** You know your stuff! 💪";
            } else if (percentage >= 40) {
                message += "😅 **Not bad!** Room for improvement though! 😅";
            } else {
                message += "😬 **Oof!** Maybe study up a bit! 😬";
            }

            return { success: true, message, gameOver: true };
        }

        return { 
            success: true, 
            message: `${result} The correct answer was: **${correctAnswer}**\n\nScore: ${this.score}/${this.currentQuestion}\n\n${this.getQuestionDisplay()}`,
            gameOver: false 
        };
    }

    isFinished() {
        return this.finished;
    }
}

class RockPaperScissorsGame {
    constructor(player, bot) {
        this.player = player;
        this.bot = bot;
        this.choices = ['rock', 'paper', 'scissors'];
        this.playerScore = 0;
        this.botScore = 0;
        this.rounds = 0;
        this.maxRounds = 3;
        this.finished = false;
    }

    async start(channel) {
        return `✂️ **Rock, Paper, Scissors!** ✂️\n\nYo ${this.player.displayName}, first to ${this.maxRounds} wins!\n\nSay 'rock', 'paper', or 'scissors'!`;
    }

    async makeMove(choice) {
        if (this.finished) {
            return { success: false, message: "Game's already over fam!" };
        }

        const playerChoice = choice.toLowerCase();
        if (!this.choices.includes(playerChoice)) {
            return { success: false, message: "Yo, that's not a valid choice! Say 'rock', 'paper', or 'scissors'." };
        }

        const botChoice = this.choices[Math.floor(Math.random() * this.choices.length)];
        const result = this.determineWinner(playerChoice, botChoice);

        this.rounds++;

        let message = `**Round ${this.rounds}:**\n`;
        message += `You: ${this.getEmoji(playerChoice)} ${playerChoice}\n`;
        message += `Me: ${this.getEmoji(botChoice)} ${botChoice}\n\n`;

        if (result === 'win') {
            this.playerScore++;
            message += "🎉 **You win this round!** 🎉";
        } else if (result === 'lose') {
            this.botScore++;
            message += "😎 **I win this round!** 😎";
        } else {
            message += "🤝 **It's a tie!** 🤝";
        }

        message += `\n\nScore: You ${this.playerScore} - ${this.botScore} Me`;

        if (this.playerScore >= this.maxRounds || this.botScore >= this.maxRounds) {
            this.finished = true;
            const winner = this.playerScore >= this.maxRounds ? this.player : this.bot;
            const winnerName = winner === this.player ? this.player.displayName : 'Zolory';
            
            message += `\n\n🏆 **${winnerName} WINS THE GAME!** 🏆`;
            if (winner === this.bot) {
                message += "\n\nI'm just built different! 🔥";
            } else {
                message += "\n\nGG fam! You got me! 💪";
            }

            return { success: true, message, gameOver: true };
        }

        message += `\n\nNext round! Say 'rock', 'paper', or 'scissors'!`;
        return { success: true, message, gameOver: false };
    }

    determineWinner(player, bot) {
        if (player === bot) return 'tie';
        if ((player === 'rock' && bot === 'scissors') ||
            (player === 'paper' && bot === 'rock') ||
            (player === 'scissors' && bot === 'paper')) {
            return 'win';
        }
        return 'lose';
    }

    getEmoji(choice) {
        const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
        return emojis[choice] || '❓';
    }

    isFinished() {
        return this.finished;
    }
}

module.exports = { GameManager };