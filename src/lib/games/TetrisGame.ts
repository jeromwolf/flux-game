export default class TetrisGame {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private nextCanvas: HTMLCanvasElement | null = null;
  private nextCtx: CanvasRenderingContext2D | null = null;
  
  private board: number[][] = [];
  private currentPiece: { shape: number[][], x: number, y: number, type: number } | null = null;
  private nextPiece: { shape: number[][], type: number } | null = null;
  
  private score: number = 0;
  private lines: number = 0;
  private level: number = 1;
  private highScore: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  
  private dropCounter: number = 0;
  private dropInterval: number = 1000;
  private lastTime: number = 0;
  private animationId: number | null = null;
  
  private readonly BOARD_WIDTH = 10;
  private readonly BOARD_HEIGHT = 20;
  private readonly BLOCK_SIZE = 30;
  
  private readonly SHAPES = [
    [[1, 1, 1, 1]],           // I
    [[1, 1], [1, 1]],         // O
    [[0, 1, 0], [1, 1, 1]],   // T
    [[1, 0, 0], [1, 1, 1]],   // L
    [[0, 0, 1], [1, 1, 1]],   // J
    [[0, 1, 1], [1, 1, 0]],   // S
    [[1, 1, 0], [0, 1, 1]]    // Z
  ];
  
  private readonly COLORS = [
    '#000000',
    '#00ffff', // I - Cyan
    '#ffff00', // O - Yellow
    '#ff00ff', // T - Magenta
    '#ff8800', // L - Orange
    '#0000ff', // J - Blue
    '#00ff00', // S - Green
    '#ff0000'  // Z - Red
  ];

  constructor() {
    this.highScore = parseInt(localStorage.getItem('tetris-highscore') || '0');
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.setupGame();
    this.initBoard();
    this.newPiece();
    this.gameLoop(0);
  }

  unmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    document.removeEventListener('keydown', this.handleKeyPress);
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private setupGame() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="tetris-game" style="
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #0a0a0a;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
      ">
        <div style="display: flex; gap: 30px; align-items: flex-start;">
          <div>
            <canvas id="board" style="
              border: 2px solid #333;
              background-color: #111;
              box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
            "></canvas>
          </div>
          
          <div style="color: white; min-width: 200px;">
            <h1 style="
              font-size: 2.5rem;
              font-weight: 800;
              margin-bottom: 2rem;
              background: linear-gradient(135deg, #00ffff, #ff00ff);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            ">TETRIS</h1>
            
            <div style="margin-bottom: 20px;">
              <div style="font-size: 14px; color: #888;">SCORE</div>
              <div id="score" style="font-size: 24px; font-weight: bold;">${this.score}</div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <div style="font-size: 14px; color: #888;">LINES</div>
              <div id="lines" style="font-size: 24px; font-weight: bold;">${this.lines}</div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <div style="font-size: 14px; color: #888;">LEVEL</div>
              <div id="level" style="font-size: 24px; font-weight: bold;">${this.level}</div>
            </div>
            
            <div style="margin-bottom: 30px;">
              <div style="font-size: 14px; color: #888;">HIGH SCORE</div>
              <div id="highscore" style="font-size: 24px; font-weight: bold; color: #ffff00;">${this.highScore}</div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <div style="font-size: 14px; color: #888; margin-bottom: 10px;">NEXT</div>
              <canvas id="next" style="
                border: 1px solid #333;
                background-color: #111;
              "></canvas>
            </div>
            
            <div style="margin-top: 30px;">
              <div style="font-size: 12px; color: #888; line-height: 1.6;">
                ← → : Move<br>
                ↓ : Soft Drop<br>
                ↑ : Rotate<br>
                Space : Hard Drop<br>
                P : Pause
              </div>
            </div>
            
            <button id="pause-btn" style="
              margin-top: 20px;
              padding: 10px 30px;
              font-size: 16px;
              font-weight: bold;
              color: white;
              background: linear-gradient(135deg, #00ffff, #0088ff);
              border: none;
              border-radius: 5px;
              cursor: pointer;
              width: 100%;
            ">
              Pause
            </button>
          </div>
        </div>
        
        <div id="game-over" style="
          display: none;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(0, 0, 0, 0.95);
          padding: 40px;
          border-radius: 10px;
          border: 2px solid #ff0000;
        ">
          <h2 style="color: #ff0000; font-size: 36px; margin-bottom: 20px;">GAME OVER</h2>
          <p style="color: white; font-size: 24px; margin-bottom: 10px;">Score: <span id="final-score">0</span></p>
          <p style="color: white; font-size: 20px; margin-bottom: 30px;">Lines: <span id="final-lines">0</span></p>
          <button onclick="window.tetrisGame.restart()" style="
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #00ffff, #0088ff);
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">
            Play Again
          </button>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('board') as HTMLCanvasElement;
    this.canvas.width = this.BOARD_WIDTH * this.BLOCK_SIZE;
    this.canvas.height = this.BOARD_HEIGHT * this.BLOCK_SIZE;
    this.ctx = this.canvas.getContext('2d');

    this.nextCanvas = document.getElementById('next') as HTMLCanvasElement;
    this.nextCanvas.width = 4 * this.BLOCK_SIZE;
    this.nextCanvas.height = 4 * this.BLOCK_SIZE;
    this.nextCtx = this.nextCanvas.getContext('2d');

    document.addEventListener('keydown', this.handleKeyPress);
    document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());

    // Touch controls
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    this.canvas.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;
      
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 30) this.movePiece(1);
        else if (dx < -30) this.movePiece(-1);
      } else {
        if (dy > 30) this.softDrop();
        else if (dy < -30) this.rotatePiece();
      }
    });

    (window as any).tetrisGame = this;
  }

  private initBoard() {
    this.board = Array(this.BOARD_HEIGHT).fill(null).map(() => 
      Array(this.BOARD_WIDTH).fill(0)
    );
  }

  private handleKeyPress = (e: KeyboardEvent) => {
    if (this.gameOver) return;

    switch (e.key) {
      case 'ArrowLeft':
        this.movePiece(-1);
        break;
      case 'ArrowRight':
        this.movePiece(1);
        break;
      case 'ArrowDown':
        this.softDrop();
        break;
      case 'ArrowUp':
        this.rotatePiece();
        break;
      case ' ':
        this.hardDrop();
        break;
      case 'p':
      case 'P':
        this.togglePause();
        break;
    }
  };

  private newPiece() {
    const type = Math.floor(Math.random() * this.SHAPES.length) + 1;
    const shape = this.SHAPES[type - 1];
    
    if (this.nextPiece) {
      this.currentPiece = {
        shape: this.SHAPES[this.nextPiece.type - 1],
        x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(this.SHAPES[this.nextPiece.type - 1][0].length / 2),
        y: 0,
        type: this.nextPiece.type
      };
    } else {
      this.currentPiece = {
        shape: shape,
        x: Math.floor(this.BOARD_WIDTH / 2) - Math.floor(shape[0].length / 2),
        y: 0,
        type: type
      };
    }

    const nextType = Math.floor(Math.random() * this.SHAPES.length) + 1;
    this.nextPiece = {
      shape: this.SHAPES[nextType - 1],
      type: nextType
    };

    this.drawNext();

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

  private merge() {
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

  private movePiece(dir: number) {
    if (!this.currentPiece || this.isPaused) return;
    
    this.currentPiece.x += dir;
    if (this.collision()) {
      this.currentPiece.x -= dir;
    }
  }

  private rotatePiece() {
    if (!this.currentPiece || this.isPaused) return;
    
    const rotated = this.currentPiece.shape[0].map((_, i) =>
      this.currentPiece!.shape.map(row => row[i]).reverse()
    );
    
    const previousShape = this.currentPiece.shape;
    this.currentPiece.shape = rotated;
    
    if (this.collision()) {
      this.currentPiece.shape = previousShape;
    }
  }

  private softDrop() {
    if (!this.currentPiece || this.isPaused) return;
    
    this.currentPiece.y++;
    if (this.collision()) {
      this.currentPiece.y--;
      this.merge();
      this.clearLines();
      this.newPiece();
    }
    this.dropCounter = 0;
  }

  private hardDrop() {
    if (!this.currentPiece || this.isPaused) return;
    
    while (!this.collision()) {
      this.currentPiece.y++;
    }
    this.currentPiece.y--;
    this.merge();
    this.clearLines();
    this.newPiece();
    this.dropCounter = 0;
  }

  private clearLines() {
    let linesCleared = 0;
    
    for (let y = this.BOARD_HEIGHT - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(this.BOARD_WIDTH).fill(0));
        linesCleared++;
        y++;
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += [40, 100, 300, 1200][linesCleared - 1] * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
      this.updateUI();
    }
  }

  private updateUI() {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('lines')!.textContent = this.lines.toString();
    document.getElementById('level')!.textContent = this.level.toString();
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('tetris-highscore', this.highScore.toString());
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
  }

  private draw() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);

    // Draw board
    for (let y = 0; y < this.BOARD_HEIGHT; y++) {
      for (let x = 0; x < this.BOARD_WIDTH; x++) {
        if (this.board[y][x]) {
          this.drawBlock(x, y, this.COLORS[this.board[y][x]]);
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
              this.COLORS[this.currentPiece.type]
            );
          }
        }
      }
    }

    // Draw grid
    this.ctx.strokeStyle = '#222';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.BOARD_WIDTH; x++) {
      this.ctx.beginPath();
      this.ctx.moveTo(x * this.BLOCK_SIZE, 0);
      this.ctx.lineTo(x * this.BLOCK_SIZE, this.canvas!.height);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.BOARD_HEIGHT; y++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y * this.BLOCK_SIZE);
      this.ctx.lineTo(this.canvas!.width, y * this.BLOCK_SIZE);
      this.ctx.stroke();
    }
  }

  private drawBlock(x: number, y: number, color: string) {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      x * this.BLOCK_SIZE + 1,
      y * this.BLOCK_SIZE + 1,
      this.BLOCK_SIZE - 2,
      this.BLOCK_SIZE - 2
    );
    
    // Add shine effect
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(
      x * this.BLOCK_SIZE + 2,
      y * this.BLOCK_SIZE + 2,
      this.BLOCK_SIZE - 4,
      4
    );
  }

  private drawNext() {
    if (!this.nextCtx || !this.nextPiece) return;

    this.nextCtx.fillStyle = '#111';
    this.nextCtx.fillRect(0, 0, this.nextCanvas!.width, this.nextCanvas!.height);

    const offsetX = (4 - this.nextPiece.shape[0].length) / 2;
    const offsetY = (4 - this.nextPiece.shape.length) / 2;

    for (let y = 0; y < this.nextPiece.shape.length; y++) {
      for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
        if (this.nextPiece.shape[y][x]) {
          this.nextCtx.fillStyle = this.COLORS[this.nextPiece.type];
          this.nextCtx.fillRect(
            (offsetX + x) * this.BLOCK_SIZE + 1,
            (offsetY + y) * this.BLOCK_SIZE + 1,
            this.BLOCK_SIZE - 2,
            this.BLOCK_SIZE - 2
          );
        }
      }
    }
  }

  private gameLoop = (time: number) => {
    if (this.gameOver) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    if (!this.isPaused) {
      this.dropCounter += deltaTime;
      if (this.dropCounter > this.dropInterval) {
        this.softDrop();
      }
    }

    this.draw();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private togglePause() {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
    document.getElementById('pause-btn')!.textContent = this.isPaused ? 'Resume' : 'Pause';
  }

  private endGame() {
    this.gameOver = true;
    document.getElementById('game-over')!.style.display = 'block';
    document.getElementById('final-score')!.textContent = this.score.toString();
    document.getElementById('final-lines')!.textContent = this.lines.toString();
  }

  public restart() {
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.dropCounter = 0;
    this.dropInterval = 1000;
    
    document.getElementById('game-over')!.style.display = 'none';
    this.initBoard();
    this.newPiece();
    this.updateUI();
    this.gameLoop(0);
  }
}