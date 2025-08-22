interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew: boolean;
  isMerged: boolean;
}

interface GameState {
  board: number[][];
  score: number;
  tiles: Map<number, Tile>;
  gameOver: boolean;
  won: boolean;
}

export default class Game2048 {
  private container: HTMLElement | null = null;
  private size = 4;
  private board: number[][] = [];
  private score = 0;
  private bestScore = 0;
  private gameOver = false;
  private won = false;
  private continueAfterWin = false;
  private tiles = new Map<number, Tile>();
  private tileId = 0;
  private previousState: GameState | null = null;
  private canUndo = true;
  private combo = 0;
  private lastMergeTime = 0;

  // DOM elements
  private boardElement: HTMLElement | null = null;
  private tileContainer: HTMLElement | null = null;
  private scoreElement: HTMLElement | null = null;
  private bestScoreElement: HTMLElement | null = null;
  private messageElement: HTMLElement | null = null;

  constructor() {
    this.bestScore = parseInt(localStorage.getItem('2048-best') || '0');
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.init();
  }

  unmount() {
    if (this.container) {
      this.container.innerHTML = '';
      document.removeEventListener('keydown', this.handleKeyPress);
    }
  }

  private init() {
    if (!this.container) return;

    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.continueAfterWin = false;
    this.tiles.clear();
    this.tileId = 0;
    this.previousState = null;
    this.canUndo = true;
    this.combo = 0;

    this.setupUI();
    this.addNewTile();
    this.addNewTile();
    this.updateDisplay();
  }

  private setupUI() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="w-full max-w-md mx-auto">
        <div class="bg-white rounded-2xl p-6 shadow-xl">
          <div class="mb-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h2 class="text-3xl font-bold text-gray-800">2048</h2>
                <p class="text-gray-600">타일을 합쳐 2048을 만드세요!</p>
              </div>
              <div class="flex gap-4">
                <div class="text-center">
                  <div class="text-sm text-gray-600">점수</div>
                  <div class="text-2xl font-bold text-gray-800" id="current-score">0</div>
                </div>
                <div class="text-center">
                  <div class="text-sm text-gray-600">최고기록</div>
                  <div class="text-2xl font-bold text-gray-800" id="best-score">${this.bestScore}</div>
                </div>
              </div>
            </div>
            
            <div class="flex gap-4">
              <button class="flex-1 bg-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-purple-700 transition" id="new-game-btn">
                새 게임
              </button>
              <button class="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50" id="undo-btn">
                되돌리기
              </button>
            </div>
          </div>
          
          <div class="relative bg-gray-700 rounded-lg p-2">
            <div class="grid grid-cols-4 gap-2" id="game-board">
              ${Array(16).fill('<div class="bg-gray-600 rounded aspect-square"></div>').join('')}
            </div>
            <div class="absolute inset-0 pointer-events-none p-2" id="tile-container"></div>
          </div>
          
          <div class="mt-4 text-center text-gray-600 text-sm">
            <p>화살표 키 또는 스와이프로 타일을 이동하세요</p>
          </div>
        </div>
      </div>
    `;

    this.boardElement = document.getElementById('game-board');
    this.tileContainer = document.getElementById('tile-container');
    this.scoreElement = document.getElementById('current-score');
    this.bestScoreElement = document.getElementById('best-score');

    this.bindEvents();
  }

  private bindEvents() {
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.init());
    }

    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undo());
    }

    document.addEventListener('keydown', this.handleKeyPress);

    // Touch events
    let touchStartX = 0;
    let touchStartY = 0;

    if (this.boardElement) {
      this.boardElement.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      });

      this.boardElement.addEventListener('touchend', (e) => {
        if (this.gameOver && !this.continueAfterWin) return;

        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
          let direction: string;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else {
            direction = dy > 0 ? 'down' : 'up';
          }
          
          this.makeMove(direction);
        }
      });
    }
  }

  private handleKeyPress = (e: KeyboardEvent) => {
    if (this.gameOver && !this.continueAfterWin) return;

    let direction: string | null = null;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        direction = 'left';
        break;
      case 'ArrowRight':
        e.preventDefault();
        direction = 'right';
        break;
      case 'ArrowUp':
        e.preventDefault();
        direction = 'up';
        break;
      case 'ArrowDown':
        e.preventDefault();
        direction = 'down';
        break;
    }

    if (direction) {
      this.makeMove(direction);
    }
  }

  private makeMove(direction: string) {
    this.saveState();
    
    const moved = this.move(direction);
    
    if (moved) {
      setTimeout(() => {
        this.addNewTile();
        this.updateDisplay();
        
        if (this.checkWin() && !this.won) {
          this.won = true;
          this.showWinMessage();
        } else if (this.checkGameOver()) {
          this.gameOver = true;
          this.showGameOverMessage();
        }
      }, 150);
    }
  }

  private saveState() {
    this.previousState = {
      board: this.board.map(row => [...row]),
      score: this.score,
      tiles: new Map(this.tiles),
      gameOver: this.gameOver,
      won: this.won
    };
    this.canUndo = true;
    
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.removeAttribute('disabled');
  }

  private undo() {
    if (!this.canUndo || !this.previousState) return;

    this.board = this.previousState.board.map(row => [...row]);
    this.score = this.previousState.score;
    this.tiles = new Map(this.previousState.tiles);
    this.gameOver = this.previousState.gameOver;
    this.won = this.previousState.won;

    this.canUndo = false;
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) undoBtn.setAttribute('disabled', 'true');

    this.updateDisplay();
  }

  private addNewTile() {
    const emptyCells: { row: number; col: number }[] = [];
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) {
          emptyCells.push({ row: i, col: j });
        }
      }
    }

    if (emptyCells.length > 0) {
      const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      this.board[randomCell.row][randomCell.col] = value;

      const tile: Tile = {
        id: this.tileId++,
        value: value,
        row: randomCell.row,
        col: randomCell.col,
        isNew: true,
        isMerged: false
      };
      this.tiles.set(tile.id, tile);
    }
  }

  private move(direction: string): boolean {
    let moved = false;
    const newBoard = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    const newTiles = new Map<number, Tile>();
    this.tileId = 0;

    if (direction === 'left') {
      for (let row = 0; row < this.size; row++) {
        const values = this.board[row].filter(val => val !== 0);
        const merged: number[] = [];
        
        for (let i = 0; i < values.length - 1; i++) {
          if (values[i] === values[i + 1]) {
            values[i] *= 2;
            values[i + 1] = 0;
            this.score += values[i];
            merged.push(i);
          }
        }
        
        const finalValues = values.filter(val => val !== 0);
        for (let col = 0; col < finalValues.length; col++) {
          newBoard[row][col] = finalValues[col];
          if (this.board[row][col] !== newBoard[row][col]) moved = true;
          
          const tile: Tile = {
            id: this.tileId++,
            value: finalValues[col],
            row: row,
            col: col,
            isNew: false,
            isMerged: merged.includes(col)
          };
          newTiles.set(tile.id, tile);
        }
      }
    } else if (direction === 'right') {
      for (let row = 0; row < this.size; row++) {
        const values = this.board[row].filter(val => val !== 0);
        const merged: number[] = [];
        
        for (let i = values.length - 1; i > 0; i--) {
          if (values[i] === values[i - 1]) {
            values[i] *= 2;
            values[i - 1] = 0;
            this.score += values[i];
            merged.push(values.length - 1 - i);
          }
        }
        
        const finalValues = values.filter(val => val !== 0);
        const startCol = this.size - finalValues.length;
        for (let i = 0; i < finalValues.length; i++) {
          const col = startCol + i;
          newBoard[row][col] = finalValues[i];
          if (this.board[row][col] !== newBoard[row][col]) moved = true;
          
          const tile: Tile = {
            id: this.tileId++,
            value: finalValues[i],
            row: row,
            col: col,
            isNew: false,
            isMerged: merged.includes(i)
          };
          newTiles.set(tile.id, tile);
        }
      }
    } else if (direction === 'up') {
      for (let col = 0; col < this.size; col++) {
        const values: number[] = [];
        for (let row = 0; row < this.size; row++) {
          if (this.board[row][col] !== 0) values.push(this.board[row][col]);
        }
        
        const merged: number[] = [];
        for (let i = 0; i < values.length - 1; i++) {
          if (values[i] === values[i + 1]) {
            values[i] *= 2;
            values[i + 1] = 0;
            this.score += values[i];
            merged.push(i);
          }
        }
        
        const finalValues = values.filter(val => val !== 0);
        for (let row = 0; row < finalValues.length; row++) {
          newBoard[row][col] = finalValues[row];
          if (this.board[row][col] !== newBoard[row][col]) moved = true;
          
          const tile: Tile = {
            id: this.tileId++,
            value: finalValues[row],
            row: row,
            col: col,
            isNew: false,
            isMerged: merged.includes(row)
          };
          newTiles.set(tile.id, tile);
        }
      }
    } else if (direction === 'down') {
      for (let col = 0; col < this.size; col++) {
        const values: number[] = [];
        for (let row = 0; row < this.size; row++) {
          if (this.board[row][col] !== 0) values.push(this.board[row][col]);
        }
        
        const merged: number[] = [];
        for (let i = values.length - 1; i > 0; i--) {
          if (values[i] === values[i - 1]) {
            values[i] *= 2;
            values[i - 1] = 0;
            this.score += values[i];
            merged.push(values.length - 1 - i);
          }
        }
        
        const finalValues = values.filter(val => val !== 0);
        const startRow = this.size - finalValues.length;
        for (let i = 0; i < finalValues.length; i++) {
          const row = startRow + i;
          newBoard[row][col] = finalValues[i];
          if (this.board[row][col] !== newBoard[row][col]) moved = true;
          
          const tile: Tile = {
            id: this.tileId++,
            value: finalValues[i],
            row: row,
            col: col,
            isNew: false,
            isMerged: merged.includes(i)
          };
          newTiles.set(tile.id, tile);
        }
      }
    }

    if (moved) {
      this.board = newBoard;
      this.tiles = newTiles;
    }

    return moved;
  }

  private updateDisplay() {
    if (!this.tileContainer || !this.scoreElement) return;

    // Update score
    this.scoreElement.textContent = this.score.toString();
    
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('2048-best', this.bestScore.toString());
      if (this.bestScoreElement) {
        this.bestScoreElement.textContent = this.bestScore.toString();
      }
    }

    // Update tiles
    this.tileContainer.innerHTML = '';
    
    this.tiles.forEach(tile => {
      const tileElement = document.createElement('div');
      tileElement.className = `absolute rounded flex items-center justify-center font-bold transition-all duration-150`;
      tileElement.style.width = 'calc((100% - 24px) / 4)';
      tileElement.style.height = 'calc((100% - 24px) / 4)';
      tileElement.style.left = `${tile.col * 25 + 2}%`;
      tileElement.style.top = `${tile.row * 25 + 2}%`;
      
      // Tile colors based on value
      const colors: { [key: number]: string } = {
        2: 'bg-gray-100 text-gray-700',
        4: 'bg-gray-200 text-gray-700',
        8: 'bg-orange-300 text-white',
        16: 'bg-orange-400 text-white',
        32: 'bg-orange-500 text-white',
        64: 'bg-orange-600 text-white',
        128: 'bg-yellow-400 text-white text-2xl',
        256: 'bg-yellow-500 text-white text-2xl',
        512: 'bg-yellow-600 text-white text-2xl',
        1024: 'bg-yellow-700 text-white text-xl',
        2048: 'bg-yellow-800 text-white text-xl'
      };
      
      tileElement.className += ' ' + (colors[tile.value] || 'bg-gray-800 text-white text-xl');
      tileElement.textContent = tile.value.toString();
      
      if (tile.isNew) {
        tileElement.style.transform = 'scale(0)';
        setTimeout(() => {
          tileElement.style.transform = 'scale(1)';
        }, 10);
      }
      
      if (tile.isMerged) {
        setTimeout(() => {
          tileElement.style.transform = 'scale(1.1)';
          setTimeout(() => {
            tileElement.style.transform = 'scale(1)';
          }, 100);
        }, 10);
      }
      
      this.tileContainer?.appendChild(tileElement);
    });
  }

  private checkWin(): boolean {
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.board[row][col] === 2048) {
          return true;
        }
      }
    }
    return false;
  }

  private checkGameOver(): boolean {
    // Check for empty cells
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.board[row][col] === 0) return false;
      }
    }

    // Check for possible merges
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const current = this.board[row][col];
        
        // Check right
        if (col < this.size - 1 && current === this.board[row][col + 1]) return false;
        
        // Check down
        if (row < this.size - 1 && current === this.board[row + 1][col]) return false;
      }
    }

    return true;
  }

  private showWinMessage() {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <h2 class="text-3xl font-bold mb-4">축하합니다!</h2>
        <p class="text-xl mb-6">2048을 만들었습니다!</p>
        <div class="flex gap-4 justify-center">
          <button class="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700" id="continue-btn">
            계속하기
          </button>
          <button class="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300" id="new-game-win-btn">
            새 게임
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('continue-btn')?.addEventListener('click', () => {
      this.continueAfterWin = true;
      document.body.removeChild(overlay);
    });
    
    document.getElementById('new-game-win-btn')?.addEventListener('click', () => {
      document.body.removeChild(overlay);
      this.init();
    });
  }

  private showGameOverMessage() {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    overlay.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <h2 class="text-3xl font-bold mb-4 text-red-600">게임 오버!</h2>
        <p class="text-xl mb-6">최종 점수: ${this.score}</p>
        <button class="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700" id="new-game-over-btn">
          새 게임
        </button>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    document.getElementById('new-game-over-btn')?.addEventListener('click', () => {
      document.body.removeChild(overlay);
      this.init();
    });
  }
}