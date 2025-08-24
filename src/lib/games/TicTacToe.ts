import { ThemedDOMGame } from '../core/ThemedDOMGame';

export default class TicTacToe extends ThemedDOMGame {
  private board: (string | null)[][] = [];
  private currentPlayer: 'X' | 'O' = 'X';
  private playerScore: number = 0;
  private aiScore: number = 0;
  private draws: number = 0;
  private isPlayerTurn: boolean = true;
  private winningLine: number[] = [];
  private difficulty: 'easy' | 'medium' | 'hard' = 'hard';

  constructor() {
    super('Tic Tac Toe');
    this.loadScores();
  }

  protected setupGame(): void {
    if (!this.container) return;
    this.resetBoard();
    this.render();
  }

  protected initialize(): void {
    this.resetBoard();
    this.render();
  }

  protected cleanup(): void {
    // No event listeners to clean up
  }

  protected applyTheme(): void {
    // Re-render to apply new theme
    this.render();
  }

  private loadScores(): void {
    this.playerScore = parseInt(localStorage.getItem('tictactoe-player-score') || '0');
    this.aiScore = parseInt(localStorage.getItem('tictactoe-ai-score') || '0');
    this.draws = parseInt(localStorage.getItem('tictactoe-draws') || '0');
  }

  private saveScores(): void {
    localStorage.setItem('tictactoe-player-score', this.playerScore.toString());
    localStorage.setItem('tictactoe-ai-score', this.aiScore.toString());
    localStorage.setItem('tictactoe-draws', this.draws.toString());
  }

  private resetBoard(): void {
    this.board = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.isPlayerTurn = true;
    this.winningLine = [];
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="tic-tac-toe-game" style="${this.getThemedContainerStyles()}">
        <div class="game-content" style="max-width: 500px; margin: 0 auto;">
          <h1 style="
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-align: center;
            background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">Tic Tac Toe</h1>
          
          <div class="game-card" style="${this.getThemedCardStyles()}">
            <div class="scoreboard" style="
              display: flex;
              justify-content: space-around;
              margin-bottom: 30px;
            ">
              <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: ${this.getThemeColor('primary')};">Player (X)</div>
                <div style="font-size: 32px; font-weight: bold; color: ${this.getThemeColor('text')};">${this.playerScore}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: ${this.getThemeColor('textSecondary')};">Draws</div>
                <div style="font-size: 32px; font-weight: bold; color: ${this.getThemeColor('text')};">${this.draws}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 20px; font-weight: bold; color: ${this.getThemeColor('secondary')};">AI (O)</div>
                <div style="font-size: 32px; font-weight: bold; color: ${this.getThemeColor('text')};">${this.aiScore}</div>
              </div>
            </div>

            <div class="game-board" style="
              display: grid;
              grid-template-columns: repeat(3, 120px);
              grid-template-rows: repeat(3, 120px);
              gap: 8px;
              background-color: ${this.getThemeColor('background')};
              padding: 8px;
              border-radius: 12px;
              margin: 0 auto;
              width: fit-content;
              ${this.shouldShowEffect('shadows') ? 'box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);' : ''}
            ">
              ${this.renderBoard()}
            </div>

            <div class="game-status" style="
              margin-top: 30px;
              font-size: 24px;
              text-align: center;
              min-height: 40px;
            ">
              ${this.getStatusMessage()}
            </div>

            <div style="
              display: flex;
              gap: 12px;
              margin-top: 24px;
              justify-content: center;
            ">
              ${this.gameOver ? `
                <button onclick="window.currentGame.newGame()" style="${this.getThemedButtonStyles('primary')}">
                  New Game
                </button>
              ` : ''}
              <button onclick="window.currentGame.resetScores()" style="${this.getThemedButtonStyles('ghost')}">
                Reset Scores
              </button>
            </div>

            <div style="
              margin-top: 20px;
              text-align: center;
            ">
              <label style="color: ${this.getThemeColor('textSecondary')}; margin-right: 10px;">
                Difficulty:
              </label>
              <select id="difficulty" onchange="window.currentGame.setDifficulty(this.value)" style="
                padding: 8px 16px;
                border-radius: 6px;
                background: ${this.getThemeColor('surface')};
                color: ${this.getThemeColor('text')};
                border: 1px solid ${this.getThemeColor('primary')};
                cursor: pointer;
              ">
                <option value="easy" ${this.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                <option value="medium" ${this.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="hard" ${this.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add click handlers
    const cells = this.container.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
      cell.addEventListener('click', () => this.handleCellClick(index));
    });

    // Store reference for buttons
    (window as any).currentGame = this;
  }

  private renderBoard(): string {
    return this.board.flat().map((cell, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const value = this.board[row][col];
      const isWinningCell = this.winningLine.includes(index);
      
      return `
        <div class="cell" data-index="${index}" style="
          background-color: ${isWinningCell ? this.getThemeColor('success') : value ? this.getThemeColor('surface') : this.getThemeColor('background')};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
          cursor: ${!value && !this.gameOver && this.isPlayerTurn ? 'pointer' : 'default'};
          transition: all 0.2s;
          position: relative;
          color: ${value === 'X' ? this.getThemeColor('primary') : this.getThemeColor('secondary')};
          ${!value && !this.gameOver && this.isPlayerTurn ? `
            border: 2px solid transparent;
          ` : ''}
          ${this.shouldShowEffect('shadows') && value ? 'box-shadow: 0 2px 8px rgba(0,0,0,0.2);' : ''}
        " 
        onmouseover="
          if (!this.textContent && !${this.gameOver} && ${this.isPlayerTurn}) {
            this.style.backgroundColor = '${this.getThemeColor('surface')}';
            this.style.borderColor = '${this.getThemeColor('primary')}';
          }
        "
        onmouseout="
          if (!this.textContent && !${this.gameOver} && ${this.isPlayerTurn}) {
            this.style.backgroundColor = '${this.getThemeColor('background')}';
            this.style.borderColor = 'transparent';
          }
        ">
          ${value ? `
            <span style="
              ${this.shouldShowEffect('glow') && isWinningCell ? `
                text-shadow: 0 0 20px ${value === 'X' ? this.getThemeColor('primary') : this.getThemeColor('secondary')};
              ` : ''}
              ${value && !isWinningCell ? 'animation: popIn 0.3s ease-out;' : ''}
            ">${value}</span>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  private getStatusMessage(): string {
    if (this.gameOver) {
      const winner = this.checkWinner();
      if (winner) {
        return winner === 'X' ? 
          `<span style="color: ${this.getThemeColor('success')};">You Win! 🎉</span>` : 
          `<span style="color: ${this.getThemeColor('error')};">AI Wins! 🤖</span>`;
      } else {
        return `<span style="color: ${this.getThemeColor('warning')};">It's a Draw! 🤝</span>`;
      }
    }
    return this.isPlayerTurn ? 
      `<span style="color: ${this.getThemeColor('primary')};">Your Turn</span>` : 
      `<span style="color: ${this.getThemeColor('secondary')};">AI is thinking...</span>`;
  }

  private handleCellClick(index: number): void {
    if (this.gameOver || !this.isPlayerTurn) return;

    const row = Math.floor(index / 3);
    const col = index % 3;

    if (this.board[row][col] !== null) return;

    this.board[row][col] = 'X';
    this.isPlayerTurn = false;
    this.render();

    const winner = this.checkWinner();
    if (winner || this.isBoardFull()) {
      this.endGame(winner);
      return;
    }

    // AI turn with delay
    setTimeout(() => {
      this.makeAIMove();
    }, 300 + Math.random() * 200); // Variable delay for more natural feel
  }

  private makeAIMove(): void {
    let move: { row: number; col: number };

    if (this.difficulty === 'easy') {
      // Random move
      move = this.getRandomMove();
    } else if (this.difficulty === 'medium') {
      // 50% chance of best move, 50% random
      if (Math.random() < 0.5) {
        move = this.minimax(this.board, 'O');
      } else {
        move = this.getRandomMove();
      }
    } else {
      // Always best move
      move = this.minimax(this.board, 'O');
    }

    if (move.row !== -1 && move.col !== -1) {
      this.board[move.row][move.col] = 'O';
    }
    
    this.isPlayerTurn = true;
    this.render();

    const winner = this.checkWinner();
    if (winner || this.isBoardFull()) {
      this.endGame(winner);
    }
  }

  private getRandomMove(): { row: number; col: number } {
    const emptyCells: { row: number; col: number }[] = [];
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (this.board[row][col] === null) {
          emptyCells.push({ row, col });
        }
      }
    }

    if (emptyCells.length > 0) {
      return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
    
    return { row: -1, col: -1 };
  }

  private minimax(board: (string | null)[][], player: 'X' | 'O'): { row: number; col: number; score: number } {
    const winner = this.checkWinner();
    
    if (winner === 'O') return { row: -1, col: -1, score: 10 };
    if (winner === 'X') return { row: -1, col: -1, score: -10 };
    if (this.isBoardFull()) return { row: -1, col: -1, score: 0 };

    const moves: { row: number; col: number; score: number }[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (board[row][col] === null) {
          board[row][col] = player;
          
          const score = this.minimax(board, player === 'X' ? 'O' : 'X').score;
          moves.push({ row, col, score });
          
          board[row][col] = null;
        }
      }
    }

    let bestMove;
    if (player === 'O') {
      let bestScore = -Infinity;
      for (const move of moves) {
        if (move.score > bestScore) {
          bestScore = move.score;
          bestMove = move;
        }
      }
    } else {
      let bestScore = Infinity;
      for (const move of moves) {
        if (move.score < bestScore) {
          bestScore = move.score;
          bestMove = move;
        }
      }
    }

    return bestMove || { row: -1, col: -1, score: 0 };
  }

  private checkWinner(): 'X' | 'O' | null {
    // Check rows
    for (let row = 0; row < 3; row++) {
      if (this.board[row][0] && 
          this.board[row][0] === this.board[row][1] && 
          this.board[row][0] === this.board[row][2]) {
        this.winningLine = [row * 3, row * 3 + 1, row * 3 + 2];
        return this.board[row][0] as 'X' | 'O';
      }
    }

    // Check columns
    for (let col = 0; col < 3; col++) {
      if (this.board[0][col] && 
          this.board[0][col] === this.board[1][col] && 
          this.board[0][col] === this.board[2][col]) {
        this.winningLine = [col, col + 3, col + 6];
        return this.board[0][col] as 'X' | 'O';
      }
    }

    // Check diagonals
    if (this.board[1][1]) {
      if (this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) {
        this.winningLine = [0, 4, 8];
        return this.board[1][1] as 'X' | 'O';
      }
      if (this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) {
        this.winningLine = [2, 4, 6];
        return this.board[1][1] as 'X' | 'O';
      }
    }

    return null;
  }

  private isBoardFull(): boolean {
    return this.board.every(row => row.every(cell => cell !== null));
  }

  private endGame(winner: 'X' | 'O' | null): void {
    this.gameOver = true;
    if (winner === 'X') {
      this.playerScore++;
    } else if (winner === 'O') {
      this.aiScore++;
    } else {
      this.draws++;
    }
    this.saveScores();
    
    // Add CSS animation if not already added
    if (!document.getElementById('tictactoe-animations')) {
      const style = document.createElement('style');
      style.id = 'tictactoe-animations';
      style.textContent = `
        @keyframes popIn {
          from {
            transform: scale(0) rotate(180deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    this.render();
  }

  public newGame(): void {
    this.resetBoard();
    this.render();
  }

  public resetScores(): void {
    this.playerScore = 0;
    this.aiScore = 0;
    this.draws = 0;
    this.saveScores();
    this.render();
  }

  public setDifficulty(difficulty: string): void {
    this.difficulty = difficulty as 'easy' | 'medium' | 'hard';
    this.newGame();
  }
}