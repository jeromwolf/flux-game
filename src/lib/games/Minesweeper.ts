interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export default class Minesweeper {
  private container: HTMLElement | null = null;
  private board: Cell[][] = [];
  private width: number = 10;
  private height: number = 10;
  private mineCount: number = 10;
  private flagCount: number = 0;
  private revealedCount: number = 0;
  private gameOver: boolean = false;
  private startTime: number = 0;
  private timerInterval: number | null = null;
  private difficulty: 'easy' | 'medium' | 'hard' = 'easy';

  constructor() {
    this.setDifficulty('easy');
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.render();
    this.newGame();
  }

  unmount() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private setDifficulty(difficulty: 'easy' | 'medium' | 'hard') {
    this.difficulty = difficulty;
    switch (difficulty) {
      case 'easy':
        this.width = 9;
        this.height = 9;
        this.mineCount = 10;
        break;
      case 'medium':
        this.width = 16;
        this.height = 16;
        this.mineCount = 40;
        break;
      case 'hard':
        this.width = 30;
        this.height = 16;
        this.mineCount = 99;
        break;
    }
  }

  private render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="minesweeper-game" style="
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
          background: linear-gradient(135deg, #ff6600, #ffcc00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">Minesweeper</h1>
        
        <div class="controls" style="
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
          color: white;
        ">
          <div style="text-align: center;">
            <div style="font-size: 18px;">💣 Mines</div>
            <div id="mine-count" style="font-size: 24px; font-weight: bold;">${this.mineCount - this.flagCount}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px;">⏱️ Time</div>
            <div id="timer" style="font-size: 24px; font-weight: bold;">000</div>
          </div>
          <div style="text-align: center;">
            <button id="new-game" style="
              padding: 10px 20px;
              font-size: 16px;
              font-weight: bold;
              color: white;
              background: linear-gradient(135deg, #ff6600, #ffcc00);
              border: none;
              border-radius: 5px;
              cursor: pointer;
            ">
              New Game
            </button>
          </div>
        </div>

        <div class="difficulty" style="
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        ">
          <button data-difficulty="easy" class="diff-btn" style="
            padding: 8px 16px;
            font-size: 14px;
            color: white;
            background: ${this.difficulty === 'easy' ? '#ff6600' : '#333'};
            border: none;
            border-radius: 3px;
            cursor: pointer;
          ">Easy</button>
          <button data-difficulty="medium" class="diff-btn" style="
            padding: 8px 16px;
            font-size: 14px;
            color: white;
            background: ${this.difficulty === 'medium' ? '#ff6600' : '#333'};
            border: none;
            border-radius: 3px;
            cursor: pointer;
          ">Medium</button>
          <button data-difficulty="hard" class="diff-btn" style="
            padding: 8px 16px;
            font-size: 14px;
            color: white;
            background: ${this.difficulty === 'hard' ? '#ff6600' : '#333'};
            border: none;
            border-radius: 3px;
            cursor: pointer;
          ">Hard</button>
        </div>

        <div id="board" style="
          display: grid;
          grid-template-columns: repeat(${this.width}, 30px);
          grid-template-rows: repeat(${this.height}, 30px);
          gap: 1px;
          background-color: #333;
          padding: 5px;
          border-radius: 5px;
        "></div>

        <div id="game-message" style="
          margin-top: 20px;
          font-size: 24px;
          font-weight: bold;
          color: white;
          min-height: 40px;
        "></div>
      </div>
    `;

    // Add event listeners
    document.getElementById('new-game')?.addEventListener('click', () => this.newGame());
    
    const diffButtons = document.querySelectorAll('.diff-btn');
    diffButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const difficulty = (e.target as HTMLElement).dataset.difficulty as 'easy' | 'medium' | 'hard';
        this.setDifficulty(difficulty);
        this.render();
        this.newGame();
      });
    });
  }

  private newGame() {
    this.board = [];
    this.flagCount = 0;
    this.revealedCount = 0;
    this.gameOver = false;
    this.startTime = 0;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Initialize board
    for (let y = 0; y < this.height; y++) {
      this.board[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.board[y][x] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0
        };
      }
    }
    
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < this.mineCount) {
      const x = Math.floor(Math.random() * this.width);
      const y = Math.floor(Math.random() * this.height);
      
      if (!this.board[y][x].isMine) {
        this.board[y][x].isMine = true;
        minesPlaced++;
      }
    }
    
    // Calculate neighbor mines
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (!this.board[y][x].isMine) {
          this.board[y][x].neighborMines = this.countNeighborMines(x, y);
        }
      }
    }
    
    this.updateBoard();
    this.updateDisplay();
    document.getElementById('game-message')!.textContent = '';
  }

  private countNeighborMines(x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
          if (this.board[ny][nx].isMine) count++;
        }
      }
    }
    return count;
  }

  private updateBoard() {
    const boardEl = document.getElementById('board');
    if (!boardEl) return;
    
    boardEl.innerHTML = '';
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.board[y][x];
        const cellEl = document.createElement('div');
        
        cellEl.style.cssText = `
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          user-select: none;
        `;
        
        if (cell.isRevealed) {
          if (cell.isMine) {
            cellEl.style.backgroundColor = '#ff0000';
            cellEl.textContent = '💣';
          } else {
            cellEl.style.backgroundColor = '#444';
            if (cell.neighborMines > 0) {
              cellEl.textContent = cell.neighborMines.toString();
              const colors = ['', '#0088ff', '#00aa00', '#ff0000', '#000088', '#880000', '#008888', '#000000', '#888888'];
              cellEl.style.color = colors[cell.neighborMines];
            }
          }
        } else {
          cellEl.style.backgroundColor = '#666';
          if (cell.isFlagged) {
            cellEl.textContent = '🚩';
          }
        }
        
        cellEl.addEventListener('click', () => this.revealCell(x, y));
        cellEl.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.toggleFlag(x, y);
        });
        
        boardEl.appendChild(cellEl);
      }
    }
  }

  private revealCell(x: number, y: number) {
    if (this.gameOver || this.board[y][x].isRevealed || this.board[y][x].isFlagged) return;
    
    if (this.startTime === 0) {
      this.startTime = Date.now();
      this.startTimer();
    }
    
    this.board[y][x].isRevealed = true;
    this.revealedCount++;
    
    if (this.board[y][x].isMine) {
      this.endGame(false);
      return;
    }
    
    if (this.board[y][x].neighborMines === 0) {
      // Reveal all adjacent cells
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
            if (!this.board[ny][nx].isRevealed && !this.board[ny][nx].isFlagged) {
              this.revealCell(nx, ny);
            }
          }
        }
      }
    }
    
    this.updateBoard();
    
    // Check win condition
    if (this.revealedCount === this.width * this.height - this.mineCount) {
      this.endGame(true);
    }
  }

  private toggleFlag(x: number, y: number) {
    if (this.gameOver || this.board[y][x].isRevealed) return;
    
    this.board[y][x].isFlagged = !this.board[y][x].isFlagged;
    this.flagCount += this.board[y][x].isFlagged ? 1 : -1;
    
    this.updateBoard();
    this.updateDisplay();
  }

  private updateDisplay() {
    const mineCountEl = document.getElementById('mine-count');
    if (mineCountEl) {
      mineCountEl.textContent = (this.mineCount - this.flagCount).toString();
    }
  }

  private startTimer() {
    this.timerInterval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const timerEl = document.getElementById('timer');
      if (timerEl) {
        timerEl.textContent = elapsed.toString().padStart(3, '0');
      }
    }, 100);
  }

  private endGame(won: boolean) {
    this.gameOver = true;
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Reveal all mines
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.board[y][x].isMine) {
          this.board[y][x].isRevealed = true;
        }
      }
    }
    
    this.updateBoard();
    
    const messageEl = document.getElementById('game-message');
    if (messageEl) {
      if (won) {
        messageEl.style.color = '#00ff00';
        messageEl.textContent = 'You Win! 🎉';
      } else {
        messageEl.style.color = '#ff0000';
        messageEl.textContent = 'Game Over! 💣';
      }
    }
  }
}