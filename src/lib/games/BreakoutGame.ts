interface Brick {
  x: number;
  y: number;
  hits: number;
  maxHits: number;
  powerUp?: string;
  destroyed: boolean;
}

export default class BreakoutGame {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  
  // Game objects
  private ball = { x: 0, y: 0, dx: 0, dy: 0, radius: 8 };
  private paddle = { x: 0, y: 0, width: 100, height: 10, speed: 8 };
  private bricks: Brick[][] = [];
  
  // Game state
  private score: number = 0;
  private lives: number = 3;
  private level: number = 1;
  private highScore: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private isWin: boolean = false;
  
  // Game settings
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 600;
  private readonly BRICK_ROWS = 8;
  private readonly BRICK_COLS = 10;
  private readonly BRICK_WIDTH = 75;
  private readonly BRICK_HEIGHT = 20;
  private readonly BRICK_PADDING = 2;
  private readonly BRICK_OFFSET_TOP = 60;
  private readonly BRICK_OFFSET_LEFT = 35;
  
  // Controls
  private keys = { left: false, right: false };

  constructor() {
    this.highScore = parseInt(localStorage.getItem('breakout-highscore') || '0');
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.setupGame();
    this.newGame();
  }

  unmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private setupGame() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="breakout-game" style="
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
          background: linear-gradient(135deg, #ff0066, #00ccff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">Breakout</h1>
        
        <div class="stats" style="
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
          color: white;
        ">
          <div style="text-align: center;">
            <div style="font-size: 18px; color: #00ccff;">Score</div>
            <div id="score" style="font-size: 28px; font-weight: bold;">${this.score}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; color: #ff0066;">Lives</div>
            <div id="lives" style="font-size: 28px; font-weight: bold;">${this.lives}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; color: #ffcc00;">Level</div>
            <div id="level" style="font-size: 28px; font-weight: bold;">${this.level}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; color: #00ff00;">High Score</div>
            <div id="highscore" style="font-size: 28px; font-weight: bold;">${this.highScore}</div>
          </div>
        </div>

        <canvas id="game-canvas" style="
          border: 2px solid #00ccff;
          background: linear-gradient(to bottom, #001122, #002244);
          box-shadow: 0 0 30px rgba(0, 204, 255, 0.3);
        "></canvas>

        <div style="margin-top: 20px; color: #888; text-align: center;">
          <div>← → : Move paddle</div>
          <div>Space : Pause</div>
        </div>

        <div id="game-message" style="
          display: none;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(0, 0, 0, 0.9);
          padding: 40px;
          border-radius: 10px;
          border: 2px solid #00ccff;
        ">
          <h2 id="message-title" style="font-size: 36px; margin-bottom: 20px;"></h2>
          <p id="message-text" style="color: white; font-size: 20px; margin-bottom: 30px;"></p>
          <button onclick="window.breakoutGame.restart()" style="
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #ff0066, #00ccff);
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">Play Again</button>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = this.CANVAS_WIDTH;
    this.canvas.height = this.CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    // Event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Touch controls
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas!.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      this.paddle.x = x - this.paddle.width / 2;
    });

    (window as any).breakoutGame = this;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        this.keys.left = true;
        break;
      case 'ArrowRight':
        this.keys.right = true;
        break;
      case ' ':
        this.togglePause();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowLeft':
        this.keys.left = false;
        break;
      case 'ArrowRight':
        this.keys.right = false;
        break;
    }
  };

  private newGame() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.isWin = false;
    this.isPaused = false;
    
    this.initLevel();
    this.updateStats();
    this.gameLoop();
  }

  private initLevel() {
    // Reset ball
    this.ball.x = this.CANVAS_WIDTH / 2;
    this.ball.y = this.CANVAS_HEIGHT - 100;
    this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    this.ball.dy = -4;
    
    // Reset paddle
    this.paddle.x = this.CANVAS_WIDTH / 2 - this.paddle.width / 2;
    this.paddle.y = this.CANVAS_HEIGHT - 30;
    
    // Create bricks
    this.bricks = [];
    for (let r = 0; r < this.BRICK_ROWS; r++) {
      this.bricks[r] = [];
      for (let c = 0; c < this.BRICK_COLS; c++) {
        const maxHits = Math.floor(r / 2) + 1;
        this.bricks[r][c] = {
          x: c * (this.BRICK_WIDTH + this.BRICK_PADDING) + this.BRICK_OFFSET_LEFT,
          y: r * (this.BRICK_HEIGHT + this.BRICK_PADDING) + this.BRICK_OFFSET_TOP,
          hits: 0,
          maxHits: Math.min(maxHits, 3),
          destroyed: false
        };
      }
    }
  }

  private gameLoop = () => {
    if (this.gameOver) return;
    
    if (!this.isPaused) {
      this.update();
      this.draw();
    }
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update() {
    // Move paddle
    if (this.keys.left && this.paddle.x > 0) {
      this.paddle.x -= this.paddle.speed;
    }
    if (this.keys.right && this.paddle.x < this.CANVAS_WIDTH - this.paddle.width) {
      this.paddle.x += this.paddle.speed;
    }
    
    // Move ball
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
    
    // Ball collision with walls
    if (this.ball.x + this.ball.radius > this.CANVAS_WIDTH || this.ball.x - this.ball.radius < 0) {
      this.ball.dx = -this.ball.dx;
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.dy = -this.ball.dy;
    }
    
    // Ball collision with paddle
    if (this.ball.y + this.ball.radius > this.paddle.y &&
        this.ball.y - this.ball.radius < this.paddle.y + this.paddle.height &&
        this.ball.x > this.paddle.x &&
        this.ball.x < this.paddle.x + this.paddle.width) {
      
      this.ball.dy = -this.ball.dy;
      
      // Add spin based on where ball hits paddle
      const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
      this.ball.dx = 8 * (hitPos - 0.5);
    }
    
    // Ball collision with bricks
    for (let r = 0; r < this.BRICK_ROWS; r++) {
      for (let c = 0; c < this.BRICK_COLS; c++) {
        const brick = this.bricks[r][c];
        if (brick.destroyed) continue;
        
        if (this.ball.x > brick.x &&
            this.ball.x < brick.x + this.BRICK_WIDTH &&
            this.ball.y > brick.y &&
            this.ball.y < brick.y + this.BRICK_HEIGHT) {
          
          this.ball.dy = -this.ball.dy;
          brick.hits++;
          
          if (brick.hits >= brick.maxHits) {
            brick.destroyed = true;
            this.score += (brick.maxHits * 10);
            
            // Check if level complete
            if (this.bricks.every(row => row.every(b => b.destroyed))) {
              this.nextLevel();
            }
          }
          
          this.updateStats();
          break;
        }
      }
    }
    
    // Ball out of bounds
    if (this.ball.y - this.ball.radius > this.CANVAS_HEIGHT) {
      this.lives--;
      this.updateStats();
      
      if (this.lives === 0) {
        this.endGame();
      } else {
        this.ball.x = this.CANVAS_WIDTH / 2;
        this.ball.y = this.CANVAS_HEIGHT - 100;
        this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = -4;
      }
    }
  }

  private draw() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Draw bricks
    for (let r = 0; r < this.BRICK_ROWS; r++) {
      for (let c = 0; c < this.BRICK_COLS; c++) {
        const brick = this.bricks[r][c];
        if (brick.destroyed) continue;
        
        const colors = ['#ff0066', '#ff6600', '#ffcc00', '#00ff00'];
        const color = colors[brick.maxHits - brick.hits - 1] || '#00ccff';
        
        this.ctx.fillStyle = color;
        this.ctx.fillRect(brick.x, brick.y, this.BRICK_WIDTH, this.BRICK_HEIGHT);
        
        // Add shine effect
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(brick.x, brick.y, this.BRICK_WIDTH, 4);
      }
    }
    
    // Draw paddle
    const gradient = this.ctx.createLinearGradient(
      this.paddle.x, 0,
      this.paddle.x + this.paddle.width, 0
    );
    gradient.addColorStop(0, '#0088ff');
    gradient.addColorStop(0.5, '#00ccff');
    gradient.addColorStop(1, '#0088ff');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    
    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    this.ctx.closePath();
    
    // Add glow effect to ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 4, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.closePath();
  }

  private updateStats() {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('lives')!.textContent = this.lives.toString();
    document.getElementById('level')!.textContent = this.level.toString();
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('breakout-highscore', this.highScore.toString());
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
  }

  private nextLevel() {
    this.level++;
    this.ball.dx *= 1.1;
    this.ball.dy *= 1.1;
    this.initLevel();
  }

  private togglePause() {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
  }

  private endGame() {
    this.gameOver = true;
    const messageEl = document.getElementById('game-message')!;
    const titleEl = document.getElementById('message-title')!;
    const textEl = document.getElementById('message-text')!;
    
    messageEl.style.display = 'block';
    titleEl.style.color = '#ff0066';
    titleEl.textContent = 'Game Over!';
    textEl.textContent = `Final Score: ${this.score}`;
  }

  public restart() {
    document.getElementById('game-message')!.style.display = 'none';
    this.newGame();
  }
}