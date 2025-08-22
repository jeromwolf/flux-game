export default class TicTacToe {
  private container: HTMLElement | null = null;
  private board: (string | null)[][] = [];
  private currentPlayer: 'X' | 'O' = 'X';
  private gameOver: boolean = false;
  private playerScore: number = 0;
  private aiScore: number = 0;
  private draws: number = 0;
  private isPlayerTurn: boolean = true;

  constructor() {
    this.resetBoard();
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  unmount() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private resetBoard() {
    this.board = [
      [null, null, null],
      [null, null, null],
      [null, null, null]
    ];
    this.currentPlayer = 'X';
    this.gameOver = false;
    this.isPlayerTurn = true;
  }

  private render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="tic-tac-toe-game" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background-color: #0a0a0a;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h1 style="
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #00ffff, #ff00ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">Tic Tac Toe</h1>
        
        <div class="scoreboard" style="
          display: flex;
          gap: 40px;
          margin-bottom: 30px;
          color: white;
        ">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #00ffff;">Player (X)</div>
            <div style="font-size: 32px; font-weight: bold;">${this.playerScore}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #888;">Draws</div>
            <div style="font-size: 32px; font-weight: bold;">${this.draws}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #ff00ff;">AI (O)</div>
            <div style="font-size: 32px; font-weight: bold;">${this.aiScore}</div>
          </div>
        </div>

        <div class="game-board" style="
          display: grid;
          grid-template-columns: repeat(3, 120px);
          grid-template-rows: repeat(3, 120px);
          gap: 10px;
          background-color: #1a1a1a;
          padding: 10px;
          border-radius: 10px;
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
        ">
          ${this.renderBoard()}
        </div>

        <div class="game-status" style="
          margin-top: 30px;
          font-size: 24px;
          color: white;
          text-align: center;
          min-height: 40px;
        ">
          ${this.getStatusMessage()}
        </div>

        ${this.gameOver ? `
          <button onclick="window.game.newGame()" style="
            margin-top: 20px;
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #00ffff, #ff00ff);
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            New Game
          </button>
        ` : ''}
      </div>
    `;

    // Add click handlers
    const cells = this.container.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
      cell.addEventListener('click', () => this.handleCellClick(index));
    });

    // Store reference for button
    (window as any).game = this;
  }

  private renderBoard(): string {
    return this.board.flat().map((cell, index) => {
      const row = Math.floor(index / 3);
      const col = index % 3;
      const value = this.board[row][col];
      
      return `
        <div class="cell" data-index="${index}" style="
          background-color: ${value ? '#2a2a2a' : '#333'};
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
          cursor: ${!value && !this.gameOver && this.isPlayerTurn ? 'pointer' : 'default'};
          transition: all 0.2s;
          color: ${value === 'X' ? '#00ffff' : '#ff00ff'};
          ${!value && !this.gameOver && this.isPlayerTurn ? 'hover: background-color: #444;' : ''}
        ">
          ${value || ''}
        </div>
      `;
    }).join('');
  }

  private getStatusMessage(): string {
    if (this.gameOver) {
      const winner = this.checkWinner();
      if (winner) {
        return winner === 'X' ? 
          '<span style="color: #00ffff;">You Win! 🎉</span>' : 
          '<span style="color: #ff00ff;">AI Wins! 🤖</span>';
      } else {
        return '<span style="color: #888;">It\'s a Draw! 🤝</span>';
      }
    }
    return this.isPlayerTurn ? 
      '<span style="color: #00ffff;">Your Turn</span>' : 
      '<span style="color: #ff00ff;">AI is thinking...</span>';
  }

  private handleCellClick(index: number) {
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

    // AI turn
    setTimeout(() => {
      this.makeAIMove();
    }, 500);
  }

  private makeAIMove() {
    const bestMove = this.minimax(this.board, 'O');
    if (bestMove.row !== -1 && bestMove.col !== -1) {
      this.board[bestMove.row][bestMove.col] = 'O';
    }
    
    this.isPlayerTurn = true;
    this.render();

    const winner = this.checkWinner();
    if (winner || this.isBoardFull()) {
      this.endGame(winner);
    }
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
        return this.board[row][0] as 'X' | 'O';
      }
    }

    // Check columns
    for (let col = 0; col < 3; col++) {
      if (this.board[0][col] && 
          this.board[0][col] === this.board[1][col] && 
          this.board[0][col] === this.board[2][col]) {
        return this.board[0][col] as 'X' | 'O';
      }
    }

    // Check diagonals
    if (this.board[1][1]) {
      if (this.board[0][0] === this.board[1][1] && this.board[1][1] === this.board[2][2]) {
        return this.board[1][1] as 'X' | 'O';
      }
      if (this.board[0][2] === this.board[1][1] && this.board[1][1] === this.board[2][0]) {
        return this.board[1][1] as 'X' | 'O';
      }
    }

    return null;
  }

  private isBoardFull(): boolean {
    return this.board.every(row => row.every(cell => cell !== null));
  }

  private endGame(winner: 'X' | 'O' | null) {
    this.gameOver = true;
    if (winner === 'X') {
      this.playerScore++;
    } else if (winner === 'O') {
      this.aiScore++;
    } else {
      this.draws++;
    }
    this.render();
  }

  public newGame() {
    this.resetBoard();
    this.render();
  }
}