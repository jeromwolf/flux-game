import { ThemedDOMGame } from '../core/ThemedDOMGame';
import { LeaderboardSystem } from '../leaderboard/LeaderboardSystem';
import { TutorialSystem, TutorialConfig } from '../tutorial/TutorialSystem';
import { AchievementSystem } from '../achievements/AchievementSystem';

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

export default class Game2048 extends ThemedDOMGame {
  private size = 4;
  private board: number[][] = [];
  private won = false;
  private continueAfterWin = false;
  private tiles = new Map<number, Tile>();
  private tileId = 0;
  private previousState: GameState | null = null;
  private canUndo = true;
  private combo = 0;
  private lastMergeTime = 0;
  private language: 'ko' | 'en' = 'ko';
  private hasUsedUndo = false;
  private highestTile = 0;
  private leaderboardSystem: LeaderboardSystem;
  private tutorialSystem: TutorialSystem;
  private achievementSystem: AchievementSystem;
  private playerName: string = '';
  
  // 다국어 텍스트
  private texts = {
    ko: {
      newGame: '새 게임',
      undo: '되돌리기',
      score: '점수',
      best: '최고기록',
      gameOver: '게임 오버!',
      won: '승리!',
      continue: '계속하기',
      tryAgain: '다시 도전',
      instruction: '타일을 합쳐 2048을 만드세요!',
      controlHint: '화살표 또는 스와이프로 타일을 이동하세요',
      leaderboard: '리더보드',
      submitScore: '점수 제출',
      enterName: '이름을 입력하세요',
      tutorialTitle: '게임 방법',
      tutorialStep1: '화살표 키나 스와이프로 타일을 이동하세요',
      tutorialStep2: '같은 숫자의 타일을 합쳐 더 큰 숫자를 만드세요',
      tutorialStep3: '2048 타일을 만들면 승리합니다!',
      achievementUnlocked: '업적 달성!'
    },
    en: {
      newGame: 'New Game',
      undo: 'Undo',
      score: 'Score',
      best: 'Best',
      gameOver: 'Game Over!',
      won: 'You Win!',
      continue: 'Continue',
      tryAgain: 'Try Again',
      instruction: 'Join the tiles to get 2048!',
      controlHint: 'Use arrow keys or swipe to move tiles',
      leaderboard: 'Leaderboard',
      submitScore: 'Submit Score',
      enterName: 'Enter your name',
      tutorialTitle: 'How to Play',
      tutorialStep1: 'Use arrow keys or swipe to move tiles',
      tutorialStep2: 'Merge tiles with the same number to create larger numbers',
      tutorialStep3: 'Create a 2048 tile to win!',
      achievementUnlocked: 'Achievement Unlocked!'
    }
  };

  // DOM elements
  private boardElement: HTMLElement | null = null;
  private tileContainer: HTMLElement | null = null;
  private scoreElement: HTMLElement | null = null;
  private bestScoreElement: HTMLElement | null = null;
  private messageElement: HTMLElement | null = null;

  // Touch tracking
  private touchStartX = 0;
  private touchStartY = 0;

  constructor() {
    super('2048');
    this.leaderboardSystem = LeaderboardSystem.getInstance();
    this.tutorialSystem = TutorialSystem.getInstance();
    this.achievementSystem = AchievementSystem.getInstance();
  }

  protected setupGame(): void {
    if (!this.container) return;
    
    // Load language preference
    const savedLanguage = localStorage.getItem('flux-game-language');
    if (savedLanguage === 'ko' || savedLanguage === 'en') {
      this.language = savedLanguage;
    }

    // Load player name
    this.playerName = localStorage.getItem('flux-game-player-name') || '';

    this.createGameHTML();
    this.bindElements();
    this.bindEvents();
    this.applyTheme();
    
    // Start tutorial on first play
    const hasPlayedBefore = localStorage.getItem('2048-tutorial-completed') === 'true';
    if (!hasPlayedBefore) {
      this.startTutorial();
    }
  }

  protected initialize(): void {
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
    this.hasUsedUndo = false;
    this.highestTile = 0;

    this.addNewTile();
    this.addNewTile();
    this.updateDisplay();
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyPress);
    if (this.boardElement) {
      this.boardElement.removeEventListener('touchstart', this.handleTouchStart);
      this.boardElement.removeEventListener('touchend', this.handleTouchEnd);
    }
  }

  private createGameHTML(): void {
    if (!this.container) return;
    
    const t = this.texts[this.language];

    this.container.innerHTML = `
      <div class="game-2048" style="${this.getThemedContainerStyles()}">
        <div class="game-content" style="max-width: 500px; margin: 0 auto;">
          <div class="game-card" style="${this.getThemedCardStyles()}">
            <div class="game-header" style="margin-bottom: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
                <div>
                  <h1 style="
                    font-size: 48px;
                    font-weight: 800;
                    margin: 0 0 8px 0;
                    background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                  ">2048</h1>
                  <p style="margin: 0; color: ${this.getThemeColor('textSecondary')};">
                    ${t.instruction}
                  </p>
                </div>
                <div style="display: flex; gap: 16px;">
                  <div style="text-align: center;">
                    <div style="font-size: 14px; color: ${this.getThemeColor('textSecondary')};">${t.score}</div>
                    <div id="current-score" style="font-size: 24px; font-weight: bold; color: ${this.getThemeColor('text')};">0</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-size: 14px; color: ${this.getThemeColor('textSecondary')};">${t.best}</div>
                    <div id="best-score" style="font-size: 24px; font-weight: bold; color: ${this.getThemeColor('primary')};">${this.highScore}</div>
                  </div>
                </div>
              </div>
              
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button id="new-game-btn" style="${this.getThemedButtonStyles('primary')}">
                  ${t.newGame}
                </button>
                <button id="undo-btn" style="${this.getThemedButtonStyles('secondary')}">
                  ${t.undo}
                </button>
                <button id="leaderboard-btn" style="${this.getThemedButtonStyles('accent')}">
                  ${t.leaderboard}
                </button>
                <button id="tutorial-btn" style="${this.getThemedButtonStyles('info')}">
                  ?                </button>
              </div>
            </div>
            
            <div class="game-board-wrapper" style="
              position: relative;
              background: ${this.getThemeColor('background')};
              border-radius: 12px;
              padding: 8px;
              ${this.shouldShowEffect('shadows') ? 'box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);' : ''}
            ">
              <div id="game-board" style="
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 8px;
              ">
                ${Array(16).fill(`<div style="
                  background: ${this.getThemeColor('surface')};
                  border-radius: 6px;
                  aspect-ratio: 1;
                "></div>`).join('')}
              </div>
              <div id="tile-container" style="
                position: absolute;
                inset: 8px;
                pointer-events: none;
              "></div>
            </div>
            
            <div id="game-message" style="
              display: none;
              position: absolute;
              inset: 0;
              background: rgba(0, 0, 0, 0.7);
              border-radius: 16px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              z-index: 100;
            ">
              <h2 id="message-title" style="
                font-size: 48px;
                font-weight: bold;
                color: white;
                margin-bottom: 16px;
              "></h2>
              <p id="message-text" style="
                font-size: 20px;
                color: white;
                margin-bottom: 24px;
              "></p>
              <button id="continue-btn" style="${this.getThemedButtonStyles('primary')}">
                ${t.continue}
              </button>
            </div>
            
            <div style="
              margin-top: 16px;
              text-align: center;
              color: ${this.getThemeColor('textSecondary')};
              font-size: 14px;
            ">
              ${t.controlHint}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindElements(): void {
    this.boardElement = document.getElementById('game-board');
    this.tileContainer = document.getElementById('tile-container');
    this.scoreElement = document.getElementById('current-score');
    this.bestScoreElement = document.getElementById('best-score');
    this.messageElement = document.getElementById('game-message');
  }

  private bindEvents(): void {
    const newGameBtn = document.getElementById('new-game-btn');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.restart());
    }

    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => this.undo());
    }

    const continueBtn = document.getElementById('continue-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => this.hideMessage());
    }

    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) {
      leaderboardBtn.addEventListener('click', () => this.showLeaderboard());
    }

    const tutorialBtn = document.getElementById('tutorial-btn');
    if (tutorialBtn) {
      tutorialBtn.addEventListener('click', () => this.startTutorial());
    }

    document.addEventListener('keydown', this.handleKeyPress);

    if (this.boardElement) {
      this.boardElement.addEventListener('touchstart', this.handleTouchStart);
      this.boardElement.addEventListener('touchend', this.handleTouchEnd);
    }
  }

  protected applyTheme(): void {
    // Re-apply theme colors to dynamic elements
    if (this.tileContainer) {
      const tiles = this.tileContainer.querySelectorAll('.game-tile');
      tiles.forEach((tile) => {
        const value = parseInt(tile.getAttribute('data-value') || '0');
        (tile as HTMLElement).style.background = this.getTileColor(value);
        (tile as HTMLElement).style.color = value > 4 ? 'white' : this.getThemeColor('text');
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
  };

  private handleTouchStart = (e: TouchEvent) => {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (this.gameOver && !this.continueAfterWin) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;

    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
      let direction: string;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        direction = dx > 0 ? 'right' : 'left';
      } else {
        direction = dy > 0 ? 'down' : 'up';
      }
      
      this.makeMove(direction);
    }
  };

  private addNewTile() {
    const emptyCells: {row: number, col: number}[] = [];
    
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.board[row][col] === 0) {
          emptyCells.push({row, col});
        }
      }
    }

    if (emptyCells.length > 0) {
      const {row, col} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const value = Math.random() < 0.9 ? 2 : 4;
      this.board[row][col] = value;
      
      const tile: Tile = {
        id: this.tileId++,
        value,
        row,
        col,
        isNew: true,
        isMerged: false
      };
      
      this.tiles.set(tile.id, tile);
    }
  }

  private makeMove(direction: string) {
    this.saveState();
    
    const moved = this.moveTiles(direction);
    
    if (moved) {
      this.addNewTile();
      this.updateDisplay();
      
      if (this.checkWin() && !this.continueAfterWin) {
        const t = this.texts[this.language];
        this.showMessage(t.won, `${t.score}: ${this.score}`);
        this.won = true;
        this.submitToLeaderboard();
      } else if (this.checkGameOver()) {
        const t = this.texts[this.language];
        this.showMessage(t.gameOver, `${t.score}: ${this.score}`);
        this.gameOver = true;
        this.submitToLeaderboard();
      }
    } else {
      this.previousState = null;
    }
  }

  private moveTiles(direction: string): boolean {
    let moved = false;
    const newBoard = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    const newTiles = new Map<number, Tile>();
    let newTileId = this.tileId;

    const vectors: {[key: string]: {x: number, y: number}} = {
      up: {x: 0, y: -1},
      down: {x: 0, y: 1},
      left: {x: -1, y: 0},
      right: {x: 1, y: 0}
    };

    const vector = vectors[direction];
    const traversals = this.buildTraversals(vector);

    traversals.x.forEach((x) => {
      traversals.y.forEach((y) => {
        const cell = {x, y};
        const tile = this.board[y][x];

        if (tile) {
          const positions = this.findFarthestPosition(cell, vector, newBoard);
          const next = positions.next;

          if (next && newBoard[next.y][next.x] === tile && !this.hasMerged(next, newTiles)) {
            // Merge
            const merged = tile * 2;
            newBoard[next.y][next.x] = merged;
            
            const mergedTile: Tile = {
              id: newTileId++,
              value: merged,
              row: next.y,
              col: next.x,
              isNew: false,
              isMerged: true
            };
            
            newTiles.set(mergedTile.id, mergedTile);
            
            this.updateScore(merged);
            
            // Track highest tile and check achievements
            if (merged > this.highestTile) {
              this.highestTile = merged;
              this.checkAchievements();
            }
            
            if (positions.farthest.x !== x || positions.farthest.y !== y) {
              moved = true;
            }
          } else {
            // Move
            newBoard[positions.farthest.y][positions.farthest.x] = tile;
            
            const movedTile: Tile = {
              id: newTileId++,
              value: tile,
              row: positions.farthest.y,
              col: positions.farthest.x,
              isNew: false,
              isMerged: false
            };
            
            newTiles.set(movedTile.id, movedTile);
            
            if (positions.farthest.x !== x || positions.farthest.y !== y) {
              moved = true;
            }
          }
        }
      });
    });

    if (moved) {
      this.board = newBoard;
      this.tiles = newTiles;
      this.tileId = newTileId;
      
      const now = Date.now();
      if (now - this.lastMergeTime < 1000) {
        this.combo++;
      } else {
        this.combo = 0;
      }
      this.lastMergeTime = now;
    }

    return moved;
  }

  private buildTraversals(vector: {x: number, y: number}) {
    const traversals = {x: [] as number[], y: [] as number[]};

    for (let pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }

    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();

    return traversals;
  }

  private findFarthestPosition(cell: {x: number, y: number}, vector: {x: number, y: number}, board: number[][]) {
    let previous;
    
    do {
      previous = cell;
      cell = {x: previous.x + vector.x, y: previous.y + vector.y};
    } while (this.withinBounds(cell) && board[cell.y][cell.x] === 0);

    return {
      farthest: previous,
      next: this.withinBounds(cell) ? cell : null
    };
  }

  private hasMerged(position: {x: number, y: number}, tiles: Map<number, Tile>): boolean {
    for (const tile of tiles.values()) {
      if (tile.row === position.y && tile.col === position.x && tile.isMerged) {
        return true;
      }
    }
    return false;
  }

  private withinBounds(position: {x: number, y: number}): boolean {
    return position.x >= 0 && position.x < this.size &&
           position.y >= 0 && position.y < this.size;
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
        if (this.board[row][col] === 0) {
          return false;
        }
      }
    }

    // Check for possible merges
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        const value = this.board[row][col];
        
        if ((row > 0 && this.board[row - 1][col] === value) ||
            (row < this.size - 1 && this.board[row + 1][col] === value) ||
            (col > 0 && this.board[row][col - 1] === value) ||
            (col < this.size - 1 && this.board[row][col + 1] === value)) {
          return false;
        }
      }
    }

    return true;
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
  }

  private undo() {
    if (!this.canUndo || !this.previousState) return;
    
    this.board = this.previousState.board.map(row => [...row]);
    this.score = this.previousState.score;
    this.tiles = new Map(this.previousState.tiles);
    this.gameOver = this.previousState.gameOver;
    this.won = this.previousState.won;
    this.canUndo = false;
    this.hasUsedUndo = true;
    
    this.updateDisplay();
  }

  private updateDisplay() {
    if (this.scoreElement) {
      this.scoreElement.textContent = this.score.toString();
    }
    
    if (this.bestScoreElement && this.score > this.highScore) {
      this.highScore = this.score;
      this.bestScoreElement.textContent = this.highScore.toString();
      this.saveHighScore();
    }

    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
      undoBtn.style.opacity = this.canUndo && this.previousState ? '1' : '0.5';
    }

    this.renderTiles();
  }

  private renderTiles() {
    if (!this.tileContainer) return;

    this.tileContainer.innerHTML = '';

    this.tiles.forEach((tile) => {
      const tileElement = document.createElement('div');
      tileElement.className = 'game-tile';
      tileElement.setAttribute('data-value', tile.value.toString());
      tileElement.style.cssText = `
        position: absolute;
        width: calc(25% - 6px);
        height: calc(25% - 6px);
        background: ${this.getTileColor(tile.value)};
        color: ${tile.value > 4 ? 'white' : this.getThemeColor('text')};
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${tile.value > 999 ? '28px' : tile.value > 99 ? '36px' : '48px'};
        font-weight: bold;
        border-radius: 6px;
        transition: all 0.15s ease-in-out;
        left: ${tile.col * 25}%;
        top: ${tile.row * 25}%;
        ${tile.isNew ? 'animation: appear 0.2s ease-in-out;' : ''}
        ${tile.isMerged ? 'animation: merge 0.2s ease-in-out;' : ''}
        ${this.shouldShowEffect('shadows') ? 'box-shadow: 0 2px 10px rgba(0,0,0,0.2);' : ''}
      `;
      tileElement.textContent = tile.value.toString();
      
      this.tileContainer.appendChild(tileElement);
    });

    // Add CSS animations
    if (!document.getElementById('game-2048-styles')) {
      const style = document.createElement('style');
      style.id = 'game-2048-styles';
      style.textContent = `
        @keyframes appear {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes merge {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  private getTileColor(value: number): string {
    const colors: {[key: number]: string} = {
      2: this.getThemeColor('surface'),
      4: this.getThemeColor('info'),
      8: this.getThemeColor('success'),
      16: this.getThemeColor('warning'),
      32: this.getThemeColor('error'),
      64: this.getThemeColor('primary'),
      128: this.getThemeGradient('135deg', 'primary', 'secondary'),
      256: this.getThemeGradient('135deg', 'secondary', 'accent'),
      512: this.getThemeGradient('135deg', 'accent', 'primary'),
      1024: this.getThemeGradient('135deg', 'warning', 'error'),
      2048: this.getThemeGradient('135deg', 'success', 'primary')
    };
    
    return colors[value] || this.getThemeColor('primary');
  }

  private showMessage(title: string, text: string) {
    if (!this.messageElement) return;
    
    const titleEl = document.getElementById('message-title');
    const textEl = document.getElementById('message-text');
    
    if (titleEl) titleEl.textContent = title;
    if (textEl) textEl.textContent = text;
    
    this.messageElement.style.display = 'flex';
  }

  private hideMessage() {
    if (!this.messageElement) return;
    
    this.messageElement.style.display = 'none';
    this.continueAfterWin = true;
  }

  public restart(): void {
    super.restart();
    this.hasUsedUndo = false;
    this.highestTile = 0;
    this.updateDisplay();
  }

  private startTutorial(): void {
    const t = this.texts[this.language];
    const tutorialConfig: TutorialConfig = {
      gameId: '2048',
      steps: [
        {
          id: 'welcome',
          title: t.tutorialTitle,
          description: t.instruction,
          position: 'center',
          nextTrigger: 'click'
        },
        {
          id: 'controls',
          title: t.tutorialTitle,
          description: t.tutorialStep1,
          highlightElement: '#game-board',
          position: 'top',
          nextTrigger: 'click'
        },
        {
          id: 'merge',
          title: t.tutorialTitle,
          description: t.tutorialStep2,
          highlightElement: '#game-board',
          position: 'center',
          nextTrigger: 'click'
        },
        {
          id: 'goal',
          title: t.tutorialTitle,
          description: t.tutorialStep3,
          position: 'center',
          nextTrigger: 'click'
        }
      ],
      showOnFirstPlay: true,
      version: 1
    };

    this.tutorialSystem.startTutorial(tutorialConfig, true);
    
    // Mark tutorial as completed when user finishes it
    // The tutorial system will handle marking it as seen internally
  }

  private showLeaderboard(): void {
    // Create and show leaderboard modal
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    `;

    const topScores = this.leaderboardSystem.getTopScores('2048', 10);
    const t = this.texts[this.language];

    modal.innerHTML = `
      <div style="
        background: ${this.getThemeColor('surface')};
        border-radius: 16px;
        padding: 24px;
        max-width: 400px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      ">
        <h2 style="
          margin: 0 0 20px 0;
          text-align: center;
          color: ${this.getThemeColor('primary')};
          font-size: 28px;
        ">${t.leaderboard} 🏆</h2>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${topScores.map((entry, index) => `
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 16px;
              background: ${index < 3 ? this.getThemeGradient('135deg', 'primary', 'secondary') : this.getThemeColor('background')};
              border-radius: 8px;
              color: ${index < 3 ? 'white' : this.getThemeColor('text')};
            ">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="
                  font-size: 20px;
                  font-weight: bold;
                  width: 30px;
                ">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</span>
                <span style="font-weight: ${index < 3 ? 'bold' : 'normal'};">${entry.playerName}</span>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: bold; font-size: 18px;">${entry.score.toLocaleString()}</div>
                ${entry.metadata?.highestTile ? `
                  <div style="font-size: 12px; opacity: 0.8;">Max: ${entry.metadata.highestTile}</div>
                ` : ''}
              </div>
            </div>
          `).join('')}
          
          ${topScores.length === 0 ? `
            <div style="
              text-align: center;
              padding: 40px;
              color: ${this.getThemeColor('textSecondary')};
            ">
              ${this.language === 'ko' ? '아직 기록이 없습니다!' : 'No scores yet!'}
            </div>
          ` : ''}
        </div>
        
        <button style="
          ${this.getThemedButtonStyles('primary')}
          width: 100%;
          margin-top: 20px;
        " onclick="this.parentElement.parentElement.remove()">
          ${this.language === 'ko' ? '닫기' : 'Close'}
        </button>
      </div>
    `;

    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  private async submitToLeaderboard(): Promise<void> {
    if (this.score === 0) return;

    if (!this.playerName) {
      const t = this.texts[this.language];
      const name = prompt(t.enterName);
      if (name) {
        this.playerName = name;
        localStorage.setItem('flux-game-player-name', name);
      } else {
        return;
      }
    }

    const result = await this.leaderboardSystem.submitScore(
      '2048',
      this.playerName,
      this.score,
      {
        highestTile: this.highestTile,
        hasUsedUndo: this.hasUsedUndo
      }
    );

    if (result.isNewHighScore) {
      const t = this.texts[this.language];
      // Show celebration animation using a simple notification
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      `;
      notification.textContent = `🏆 ${t.leaderboard} #${result.rank}!`;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  }

  private checkAchievements(): void {
    const achievements = [
      { tile: 512, id: '2048-first-512' },
      { tile: 2048, id: '2048-reach-2048' },
      { tile: 4096, id: '2048-reach-4096' }
    ];

    achievements.forEach(achievement => {
      if (this.highestTile >= achievement.tile) {
        const wasUnlocked = this.achievementSystem.checkAchievement(achievement.id);
        if (wasUnlocked) {
          // Achievement will be shown by the system's notification queue
        }
      }
    });

    // Check for no-undo achievement
    if (this.highestTile >= 2048 && !this.hasUsedUndo) {
      const wasUnlocked = this.achievementSystem.checkAchievement('2048-no-undo');
      if (wasUnlocked) {
        // Achievement will be shown by the system's notification queue
      }
    }
  }
}