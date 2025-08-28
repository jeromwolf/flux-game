import { BaseGame } from '../core/BaseGame';

interface Piece {
  shape: number[][];
  x: number;
  y: number;
  type: number;
}

export default class TetrisGame extends BaseGame {
  private board: number[][] = [];
  private currentPiece: Piece | null = null;
  private nextPiece: { shape: number[][], type: number } | null = null;
  
  private lines: number = 0;
  private level: number = 1;
  
  private dropCounter: number = 0;
  private dropInterval: number = 1000;
  private lastTime: number = 0;
  
  private readonly BOARD_WIDTH = 10;
  private readonly BOARD_HEIGHT = 20;
  private readonly BLOCK_SIZE = 30;
  
  // Preview canvas
  private nextCanvas: HTMLCanvasElement | null = null;
  private nextCtx: CanvasRenderingContext2D | null = null;
  
  private readonly SHAPES = [
    [[1, 1, 1, 1]],           // I
    [[1, 1], [1, 1]],         // O
    [[0, 1, 0], [1, 1, 1]],   // T
    [[1, 0, 0], [1, 1, 1]],   // L
    [[0, 0, 1], [1, 1, 1]],   // J
    [[0, 1, 1], [1, 1, 0]],   // S
    [[1, 1, 0], [0, 1, 1]]    // Z
  ];

  constructor() {
    super({
      canvasWidth: 300, // 10 * 30
      canvasHeight: 600, // 20 * 30
      gameName: 'Tetris'
    });
  }

  protected setupGame(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="tetris-game" style="
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: ${this.getThemeColor('background')};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
      ">
        <div style="display: flex; gap: 30px; align-items: flex-start;">
          <div>
            <canvas id="game-canvas" style="
              border: 2px solid ${this.getThemeColor('primary')};
              background-color: ${this.getThemeColor('surface')};
              ${this.shouldShowEffect('shadows') ? 'box-shadow: 0 0 30px ' + this.getThemeColor('primary') + '40;' : ''}
            "></canvas>
          </div>
          
          <div style="color: ${this.getThemeColor('text')}; min-width: 200px;">
            <h1 style="
              font-size: 2.5rem;
              font-weight: 800;
              margin-bottom: 2rem;
              background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            ">TETRIS</h1>
            
            <div style="
              background: ${this.getThemeColor('surface')};
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 20px;
              ${this.shouldShowEffect('shadows') ? 'box-shadow: 0 2px 10px rgba(0,0,0,0.2);' : ''}
            ">
              <div style="margin-bottom: 20px;">
                <div style="font-size: 14px; color: ${this.getThemeColor('textSecondary')};">SCORE</div>
                <div id="score" style="font-size: 24px; font-weight: bold;">${this.score}</div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <div style="font-size: 14px; color: ${this.getThemeColor('textSecondary')};">LINES</div>
                <div id="lines" style="font-size: 24px; font-weight: bold;">${this.lines}</div>
              </div>
              
              <div style="margin-bottom: 20px;">
                <div style="font-size: 14px; color: ${this.getThemeColor('textSecondary')};">LEVEL</div>
                <div id="level" style="font-size: 24px; font-weight: bold;">${this.level}</div>
              </div>
              
              <div>
                <div style="font-size: 14px; color: ${this.getThemeColor('textSecondary')};">HIGH SCORE</div>
                <div id="highscore" style="font-size: 24px; font-weight: bold; color: ${this.getThemeColor('warning')};">${this.highScore}</div>
              </div>
            </div>
            
            <div style="
              background: ${this.getThemeColor('surface')};
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 20px;
              ${this.shouldShowEffect('shadows') ? 'box-shadow: 0 2px 10px rgba(0,0,0,0.2);' : ''}
            ">
              <div style="font-size: 14px; color: ${this.getThemeColor('textSecondary')}; margin-bottom: 10px;">NEXT</div>
              <canvas id="next" style="
                border: 1px solid ${this.getThemeColor('primary')}40;
                background-color: ${this.getThemeColor('background')};
              "></canvas>
            </div>
            
            <div style="
              background: ${this.getThemeColor('surface')};
              padding: 20px;
              border-radius: 12px;
              ${this.shouldShowEffect('shadows') ? 'box-shadow: 0 2px 10px rgba(0,0,0,0.2);' : ''}
            ">
              <div style="font-size: 12px; color: ${this.getThemeColor('textSecondary')}; line-height: 1.8;">
                <div>← → : Move</div>
                <div>↓ : Soft Drop</div>
                <div>↑ : Rotate</div>
                <div>Space : Hard Drop</div>
                <div>P : Pause</div>
              </div>
            </div>
            
            <button id="pause-btn" onclick="window.currentGame.togglePause()" style="
              margin-top: 20px;
              padding: 12px 30px;
              font-size: 16px;
              font-weight: bold;
              color: white;
              background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
              border: none;
              border-radius: 8px;
              cursor: pointer;
              width: 100%;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              Pause
            </button>
          </div>
        </div>
        
        <div id="game-overlays"></div>
      </div>
    `;

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.config.canvasWidth;
      this.canvas.height = this.config.canvasHeight;
      this.ctx = this.canvas.getContext('2d');
    }

    this.nextCanvas = document.getElementById('next') as HTMLCanvasElement;
    if (this.nextCanvas) {
      this.nextCanvas.width = 4 * this.BLOCK_SIZE;
      this.nextCanvas.height = 4 * this.BLOCK_SIZE;
      this.nextCtx = this.nextCanvas.getContext('2d');
    }

    document.addEventListener('keydown', this.handleKeyPress);
    
    // Store reference for buttons
    (window as any).currentGame = this;
  }

  protected initialize(): void {
    this.initBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.dropInterval = 1000;
    this.gameOver = false;
    this.isPaused = false;
    this.newPiece();
    this.updateUI();
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  private initBoard(): void {
    this.board = Array(this.BOARD_HEIGHT).fill(null).map(() => 
      Array(this.BOARD_WIDTH).fill(0)
    );
  }

  protected update(deltaTime: number): void {
    if (this.gameOver || this.isPaused) return;

    this.dropCounter += deltaTime * 1000;
    
    if (this.dropCounter > this.dropInterval) {
      this.dropPiece();
      this.dropCounter = 0;
    }
  }

  protected draw(): void {
    if (!this.ctx) return;

    // Clear canvas with themed background
    this.ctx.fillStyle = this.getThemeColor('surface');
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    // Draw board grid
    if (this.shouldShowEffect('shadows')) {
      this.ctx.strokeStyle = this.getThemeColor('background');
      this.ctx.lineWidth = 0.5;
      for (let y = 0; y < this.BOARD_HEIGHT; y++) {
        for (let x = 0; x < this.BOARD_WIDTH; x++) {
          this.ctx.strokeRect(
            x * this.BLOCK_SIZE,
            y * this.BLOCK_SIZE,
            this.BLOCK_SIZE,
            this.BLOCK_SIZE
          );
        }
      }
    }

    // Draw board
    for (let y = 0; y < this.BOARD_HEIGHT; y++) {
      for (let x = 0; x < this.BOARD_WIDTH; x++) {
        if (this.board[y][x]) {
          this.drawBlock(x, y, this.board[y][x]);
        }
      }
    }

    // Draw current piece
    if (this.currentPiece) {
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
          if (this.currentPiece.shape[y][x]) {
            this.drawBlock(
              this.currentPiece.x + x,
              this.currentPiece.y + y,
              this.currentPiece.type
            );
          }
        }
      }
    }

    // Draw ghost piece
    if (this.currentPiece && this.shouldShowEffect('glow')) {
      const ghostY = this.getGhostPosition();
      this.ctx.globalAlpha = 0.3;
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
          if (this.currentPiece.shape[y][x]) {
            this.drawBlock(
              this.currentPiece.x + x,
              ghostY + y,
              this.currentPiece.type
            );
          }
        }
      }
      this.ctx.globalAlpha = 1;
    }

    // Draw pause overlay
    if (this.isPaused && !this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
      
      this.ctx.fillStyle = this.getThemeColor('text');
      this.ctx.font = 'bold 36px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('PAUSED', this.config.canvasWidth / 2, this.config.canvasHeight / 2);
    }

    // Draw next piece
    if (this.nextPiece && this.nextCtx) {
      this.nextCtx.fillStyle = this.getThemeColor('background');
      this.nextCtx.fillRect(0, 0, this.nextCanvas!.width, this.nextCanvas!.height);
      
      const offsetX = (4 - this.nextPiece.shape[0].length) / 2;
      const offsetY = (4 - this.nextPiece.shape.length) / 2;
      
      for (let y = 0; y < this.nextPiece.shape.length; y++) {
        for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
          if (this.nextPiece.shape[y][x]) {
            this.drawBlockOnCanvas(
              this.nextCtx,
              (offsetX + x) * this.BLOCK_SIZE,
              (offsetY + y) * this.BLOCK_SIZE,
              this.BLOCK_SIZE,
              this.nextPiece.type
            );
          }
        }
      }
    }
  }

  private drawBlock(x: number, y: number, type: number): void {
    if (!this.ctx) return;
    
    const pixelX = x * this.BLOCK_SIZE;
    const pixelY = y * this.BLOCK_SIZE;
    
    this.drawBlockOnCanvas(this.ctx, pixelX, pixelY, this.BLOCK_SIZE, type);
  }

  private drawBlockOnCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, type: number): void {
    // Get color based on piece type
    const colors = this.getBlockColors(type);
    
    // Main block
    if (this.shouldShowEffect('gradients')) {
      const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
      gradient.addColorStop(0, colors.light);
      gradient.addColorStop(1, colors.dark);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = colors.main;
    }
    
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    
    // Inner highlight
    if (this.shouldShowEffect('shadows')) {
      ctx.fillStyle = colors.light;
      ctx.fillRect(x + 4, y + 4, size - 8, 2);
      ctx.fillRect(x + 4, y + 4, 2, size - 8);
      
      // Shadow
      ctx.fillStyle = colors.dark;
      ctx.fillRect(x + size - 6, y + 4, 2, size - 8);
      ctx.fillRect(x + 4, y + size - 6, size - 8, 2);
    }
  }

  private getBlockColors(type: number): { main: string, light: string, dark: string } {
    const colorMappings: { [key: number]: { main: keyof typeof this.currentTheme.colors, light: string, dark: string } } = {
      1: { main: 'info', light: '#66ffff', dark: '#006666' },      // I - Cyan
      2: { main: 'warning', light: '#ffff66', dark: '#666600' },   // O - Yellow
      3: { main: 'secondary', light: '#ff66ff', dark: '#660066' }, // T - Magenta
      4: { main: 'accent', light: '#ffaa66', dark: '#663300' },    // L - Orange
      5: { main: 'primary', light: '#6666ff', dark: '#000066' },   // J - Blue
      6: { main: 'success', light: '#66ff66', dark: '#006600' },   // S - Green
      7: { main: 'error', light: '#ff6666', dark: '#660000' }      // Z - Red
    };
    
    const mapping = colorMappings[type] || colorMappings[1];
    return {
      main: this.getThemeColor(mapping.main),
      light: mapping.light,
      dark: mapping.dark
    };
  }

  private newPiece(): void {
    const shapes = this.SHAPES;
    
    if (this.nextPiece) {
      const shape = this.nextPiece.shape;
      this.currentPiece = {
        shape: shape,
        x: Math.floor((this.BOARD_WIDTH - shape[0].length) / 2),
        y: 0,
        type: this.nextPiece.type
      };
    } else {
      const type = Math.floor(Math.random() * shapes.length) + 1;
      const shape = shapes[type - 1];
      this.currentPiece = {
        shape: shape,
        x: Math.floor((this.BOARD_WIDTH - shape[0].length) / 2),
        y: 0,
        type: type
      };
    }
    
    // Generate next piece
    const nextType = Math.floor(Math.random() * shapes.length) + 1;
    this.nextPiece = {
      shape: shapes[nextType - 1],
      type: nextType
    };
    
    // Check game over
    if (this.collision()) {
      this.endGame();
    }
  }

  private collision(): boolean {
    if (!this.currentPiece) return false;
    
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const boardX = this.currentPiece.x + x;
          const boardY = this.currentPiece.y + y;
          
          if (boardX < 0 || boardX >= this.BOARD_WIDTH || 
              boardY >= this.BOARD_HEIGHT ||
              (boardY >= 0 && this.board[boardY][boardX])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  private merge(): void {
    if (!this.currentPiece) return;
    
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const boardY = this.currentPiece.y + y;
          const boardX = this.currentPiece.x + x;
          if (boardY >= 0) {
            this.board[boardY][boardX] = this.currentPiece.type;
          }
        }
      }
    }
  }

  private rotate(): void {
    if (!this.currentPiece) return;
    
    const rotated: number[][] = [];
    for (let i = 0; i < this.currentPiece.shape[0].length; i++) {
      const row: number[] = [];
      for (let j = this.currentPiece.shape.length - 1; j >= 0; j--) {
        row.push(this.currentPiece.shape[j][i]);
      }
      rotated.push(row);
    }
    
    const previousShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;
    
    if (this.collision()) {
      this.currentPiece.shape = previousShape;
    }
  }

  private move(dir: number): void {
    if (!this.currentPiece) return;
    
    this.currentPiece.x += dir;
    if (this.collision()) {
      this.currentPiece.x -= dir;
    }
  }

  private dropPiece(): void {
    if (!this.currentPiece) return;
    
    this.currentPiece.y++;
    if (this.collision()) {
      this.currentPiece.y--;
      this.merge();
      this.clearLines();
      this.newPiece();
    }
  }

  private hardDrop(): void {
    if (!this.currentPiece) return;
    
    while (!this.collision()) {
      this.currentPiece.y++;
      this.updateScore(2);
    }
    this.currentPiece.y--;
    this.merge();
    this.clearLines();
    this.newPiece();
  }

  private getGhostPosition(): number {
    if (!this.currentPiece) return 0;
    
    const originalY = this.currentPiece.y;
    while (!this.collision()) {
      this.currentPiece.y++;
    }
    const ghostY = this.currentPiece.y - 1;
    this.currentPiece.y = originalY;
    return ghostY;
  }

  private clearLines(): void {
    let linesCleared = 0;
    
    for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(new Array(this.BOARD_WIDTH).fill(0));
        linesCleared++;
        y++; // Check the same row again
        
        // Create particle effects for cleared line
        if (this.shouldShowEffect('particles')) {
          for (let x = 0; x < this.BOARD_WIDTH; x++) {
            this.createParticles(
              x * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
              y * this.BLOCK_SIZE + this.BLOCK_SIZE / 2,
              5,
              this.getThemeColor('success'),
              8
            );
          }
        }
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      const points = [0, 100, 300, 500, 800][linesCleared] * this.level;
      this.updateScore(points);
      
      // Update level
      const newLevel = Math.floor(this.lines / 10) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      }
      
      this.updateUI();
    }
  }

  private updateUI(): void {
    const elements = {
      score: document.getElementById('score'),
      lines: document.getElementById('lines'),
      level: document.getElementById('level'),
      highscore: document.getElementById('highscore')
    };
    
    if (elements.score) elements.score.textContent = this.score.toString();
    if (elements.lines) elements.lines.textContent = this.lines.toString();
    if (elements.level) elements.level.textContent = this.level.toString();
    if (elements.highscore) elements.highscore.textContent = this.highScore.toString();
  }

  private handleKeyPress = (e: KeyboardEvent): void => {
    if (this.gameOver) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        this.move(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        this.move(1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.dropPiece();
        this.updateScore(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.rotate();
        break;
      case ' ':
        e.preventDefault();
        this.hardDrop();
        break;
      case 'p':
      case 'P':
        this.togglePause();
        break;
    }
  };

  public togglePause(): void {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
  }

  private endGame(): void {
    this.gameOver = true;
    this.createGameOverlay('GAME OVER', this.score, `
      <p style="font-size: 20px; margin-bottom: 10px;">Lines: ${this.lines}</p>
      <p style="font-size: 18px; margin-bottom: 10px;">Level: ${this.level}</p>
    `);
  }

  public restart(): void {
    super.restart();
    this.updateUI();
  }
}