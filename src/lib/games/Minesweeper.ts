import { ThemedDOMGame } from '../core/ThemedDOMGame';

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export default class Minesweeper extends ThemedDOMGame {
  private board: Cell[][] = [];
  private width: number = 10;
  private height: number = 10;
  private mineCount: number = 10;
  private flagCount: number = 0;
  private revealedCount: number = 0;
  private startTime: number = 0;
  private timerInterval: number | null = null;
  private difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  private isFirstClick: boolean = true;

  constructor() {
    super('Minesweeper');
    this.setDifficulty('easy');
    this.highScore = parseInt(localStorage.getItem(`minesweeper-${this.difficulty}-bestscore`) || '999999');
  }

  protected setupGame(): void {
    if (!this.container) return;
    this.render();
  }

  protected initialize(): void {
    this.newGame();
  }

  protected cleanup(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  protected applyTheme(): void {
    // Re-render to apply new theme
    this.render();
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
    this.highScore = parseInt(localStorage.getItem(`minesweeper-${this.difficulty}-bestscore`) || '999999');
  }

  private render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="minesweeper-game" style="${this.getThemedContainerStyles()}">
        <div class="game-content" style="max-width: 900px; margin: 0 auto;">
          <h1 style="
            font-size: 3rem;
            font-weight: 800;
            margin-bottom: 1rem;
            text-align: center;
            background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          ">Minesweeper</h1>
          
          <div class="game-card" style="${this.getThemedCardStyles()}">
            <div class="controls" style="
              display: flex;
              justify-content: space-around;
              margin-bottom: 20px;
              gap: 20px;
            ">
              <div style="text-align: center;">
                <div style="font-size: 18px; color: ${this.getThemeColor('textSecondary')};">💣 Mines</div>
                <div id="mine-count" style="font-size: 24px; font-weight: bold; color: ${this.getThemeColor('error')};">${this.mineCount - this.flagCount}</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 18px; color: ${this.getThemeColor('textSecondary')};">⏱️ Time</div>
                <div id="timer" style="font-size: 24px; font-weight: bold; color: ${this.getThemeColor('text')};">
                  ${this.startTime === 0 ? '000' : Math.floor((Date.now() - this.startTime) / 1000).toString().padStart(3, '0')}
                </div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 18px; color: ${this.getThemeColor('textSecondary')};">🏆 Best</div>
                <div id="best-score" style="font-size: 24px; font-weight: bold; color: ${this.getThemeColor('warning')};">
                  ${this.highScore === 999999 ? '---' : this.highScore}
                </div>
              </div>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
              <button id="new-game" style="${this.getThemedButtonStyles('primary')}">
                🔄 New Game
              </button>
            </div>

            <div class="difficulty" style="
              display: flex;
              gap: 10px;
              margin-bottom: 20px;
              justify-content: center;
            ">
              <button data-difficulty="easy" class="diff-btn" style="${
                this.difficulty === 'easy' 
                  ? this.getThemedButtonStyles('primary')
                  : this.getThemedButtonStyles('secondary')
              }">Easy (9x9)</button>
              <button data-difficulty="medium" class="diff-btn" style="${
                this.difficulty === 'medium' 
                  ? this.getThemedButtonStyles('primary')
                  : this.getThemedButtonStyles('secondary')
              }">Medium (16x16)</button>
              <button data-difficulty="hard" class="diff-btn" style="${
                this.difficulty === 'hard' 
                  ? this.getThemedButtonStyles('primary')
                  : this.getThemedButtonStyles('secondary')
              }">Hard (30x16)</button>
            </div>

            <div id="board" style="
              display: grid;
              grid-template-columns: repeat(${this.width}, 30px);
              grid-template-rows: repeat(${this.height}, 30px);
              gap: 1px;
              background-color: ${this.getThemeColor('background')};
              padding: 5px;
              border-radius: 8px;
              ${this.shouldShowEffect('shadows') ? 'box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);' : ''}
              margin: 0 auto;
              width: fit-content;
            "></div>

            <div id="game-message" style="
              margin-top: 20px;
              font-size: 24px;
              font-weight: bold;
              color: ${this.getThemeColor('text')};
              min-height: 40px;
              text-align: center;
            "></div>
          </div>
        </div>
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
    this.isFirstClick = true;
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
          border-radius: 4px;
          transition: all 0.1s;
        `;
        
        if (cell.isRevealed) {
          if (cell.isMine) {
            cellEl.style.backgroundColor = this.getThemeColor('error');
            cellEl.textContent = '💣';
            if (this.shouldShowEffect('glow')) {
              cellEl.style.boxShadow = `0 0 10px ${this.getThemeColor('error')}`;
            }
          } else {
            cellEl.style.backgroundColor = this.getThemeColor('background');
            if (cell.neighborMines > 0) {
              cellEl.textContent = cell.neighborMines.toString();
              const numberColors = [
                '',
                this.getThemeColor('info'),      // 1 - blue
                this.getThemeColor('success'),   // 2 - green
                this.getThemeColor('error'),     // 3 - red
                this.getThemeColor('primary'),   // 4 - dark blue
                this.getThemeColor('secondary'), // 5 - dark red
                this.getThemeColor('accent'),    // 6 - cyan
                this.getThemeColor('text'),      // 7 - black/white
                this.getThemeColor('textSecondary') // 8 - gray
              ];
              cellEl.style.color = numberColors[cell.neighborMines];
            }
          }
        } else {
          cellEl.style.backgroundColor = this.getThemeColor('surface');
          if (this.shouldShowEffect('gradients')) {
            cellEl.style.background = this.getThemeGradient('135deg', 'surface', 'background');
          }
          if (this.shouldShowEffect('shadows')) {
            cellEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          }
          if (cell.isFlagged) {
            cellEl.textContent = '🚩';
          }
          
          // Hover effect
          cellEl.onmouseenter = () => {
            if (!cell.isRevealed && !this.gameOver) {
              cellEl.style.backgroundColor = this.adjustBrightness(this.getThemeColor('surface'), 20);
              cellEl.style.transform = 'scale(1.05)';
            }
          };
          cellEl.onmouseleave = () => {
            if (!cell.isRevealed) {
              cellEl.style.backgroundColor = this.getThemeColor('surface');
              cellEl.style.transform = 'scale(1)';
            }
          };
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
    
    // First click - ensure no mine is hit
    if (this.isFirstClick) {
      this.isFirstClick = false;
      if (this.board[y][x].isMine) {
        // Move the mine to a different location
        this.board[y][x].isMine = false;
        let placed = false;
        while (!placed) {
          const newX = Math.floor(Math.random() * this.width);
          const newY = Math.floor(Math.random() * this.height);
          if (!this.board[newY][newX].isMine && (newX !== x || newY !== y)) {
            this.board[newY][newX].isMine = true;
            placed = true;
          }
        }
        // Recalculate neighbor mines
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            if (!this.board[y][x].isMine) {
              this.board[y][x].neighborMines = this.countNeighborMines(x, y);
            }
          }
        }
      }
    }
    
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
        const time = Math.floor((Date.now() - this.startTime) / 1000);
        messageEl.style.color = this.getThemeColor('success');
        messageEl.textContent = `You Win! 🎉 Time: ${time}s`;
        
        // Save best score
        if (time < this.highScore) {
          this.highScore = time;
          localStorage.setItem(`minesweeper-${this.difficulty}-bestscore`, this.highScore.toString());
          const bestScoreEl = document.getElementById('best-score');
          if (bestScoreEl) {
            bestScoreEl.textContent = this.highScore.toString();
          }
        }
      } else {
        messageEl.style.color = this.getThemeColor('error');
        messageEl.textContent = 'Game Over! 💣';
      }
    }
  }

  private adjustBrightness(color: string, amount: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}