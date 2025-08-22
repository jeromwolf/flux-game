export default class SnakeGame {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private snake: { x: number; y: number }[] = [];
  private food: { x: number; y: number } = { x: 0, y: 0 };
  private direction: 'up' | 'down' | 'left' | 'right' = 'right';
  private nextDirection: 'up' | 'down' | 'left' | 'right' = 'right';
  private score: number = 0;
  private highScore: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private gridSize: number = 20;
  private cellSize: number = 20;
  private gameLoop: number | null = null;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('snake-highscore') || '0');
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.setupGame();
    this.render();
    this.startGame();
  }

  unmount() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  private setupGame() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="snake-game" style="
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
          background: linear-gradient(135deg, #00ff00, #ffff00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">Snake Game</h1>
        
        <div class="score-board" style="
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
          color: white;
        ">
          <div style="text-align: center;">
            <div style="font-size: 20px; color: #00ff00;">Score</div>
            <div id="score" style="font-size: 32px; font-weight: bold;">${this.score}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 20px; color: #ffff00;">High Score</div>
            <div id="highscore" style="font-size: 32px; font-weight: bold;">${this.highScore}</div>
          </div>
        </div>

        <canvas id="game-canvas" style="
          border: 2px solid #00ff00;
          background-color: #111;
          box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        "></canvas>

        <div class="controls" style="
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        ">
          <div style="color: #888; font-size: 14px;">
            Use arrow keys or WASD to move
          </div>
          <button id="pause-btn" style="
            padding: 10px 30px;
            font-size: 16px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #00ff00, #008800);
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">
            Pause
          </button>
        </div>

        <div id="game-over" style="
          display: none;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(0, 0, 0, 0.9);
          padding: 30px;
          border-radius: 10px;
          border: 2px solid #ff0000;
        ">
          <h2 style="color: #ff0000; font-size: 36px; margin-bottom: 20px;">Game Over!</h2>
          <p style="color: white; font-size: 24px; margin-bottom: 20px;">Score: <span id="final-score">0</span></p>
          <button onclick="window.snakeGame.restart()" style="
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #00ff00, #008800);
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">
            Play Again
          </button>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = this.gridSize * this.cellSize;
    this.canvas.height = this.gridSize * this.cellSize;
    this.ctx = this.canvas.getContext('2d');

    // Add event listeners
    document.addEventListener('keydown', this.handleKeyPress);
    
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn?.addEventListener('click', () => this.togglePause());

    // Touch controls for mobile
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
        if (dx > 0 && this.direction !== 'left') {
          this.nextDirection = 'right';
        } else if (dx < 0 && this.direction !== 'right') {
          this.nextDirection = 'left';
        }
      } else {
        if (dy > 0 && this.direction !== 'up') {
          this.nextDirection = 'down';
        } else if (dy < 0 && this.direction !== 'down') {
          this.nextDirection = 'up';
        }
      }
    });

    // Store reference for restart button
    (window as any).snakeGame = this;
  }

  private handleKeyPress = (e: KeyboardEvent) => {
    if (this.gameOver) return;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (this.direction !== 'down') this.nextDirection = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (this.direction !== 'up') this.nextDirection = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (this.direction !== 'right') this.nextDirection = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (this.direction !== 'left') this.nextDirection = 'right';
        break;
      case ' ':
        this.togglePause();
        break;
    }
  };

  private initSnake() {
    this.snake = [
      { x: 5, y: 10 },
      { x: 4, y: 10 },
      { x: 3, y: 10 }
    ];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.generateFood();
  }

  private generateFood() {
    do {
      this.food = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize)
      };
    } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
  }

  private startGame() {
    this.initSnake();
    this.gameLoop = requestAnimationFrame(() => this.update());
  }

  private update = () => {
    if (this.gameOver || this.isPaused) {
      this.gameLoop = requestAnimationFrame(this.update);
      return;
    }

    // Update direction
    this.direction = this.nextDirection;

    // Move snake
    const head = { ...this.snake[0] };
    switch (this.direction) {
      case 'up': head.y--; break;
      case 'down': head.y++; break;
      case 'left': head.x--; break;
      case 'right': head.x++; break;
    }

    // Check wall collision
    if (head.x < 0 || head.x >= this.gridSize || 
        head.y < 0 || head.y >= this.gridSize) {
      this.endGame();
      return;
    }

    // Check self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    // Check food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.updateScore();
      this.generateFood();
    } else {
      this.snake.pop();
    }

    this.render();

    // Continue game loop with speed based on score
    const speed = Math.max(50, 150 - Math.floor(this.score / 50) * 10);
    setTimeout(() => {
      this.gameLoop = requestAnimationFrame(this.update);
    }, speed);
  };

  private render() {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.canvas!.width, this.canvas!.height);

    // Draw snake
    this.snake.forEach((segment, index) => {
      this.ctx!.fillStyle = index === 0 ? '#00ff00' : '#008800';
      this.ctx!.fillRect(
        segment.x * this.cellSize + 1,
        segment.y * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2
      );
    });

    // Draw food
    this.ctx.fillStyle = '#ff0000';
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.cellSize + this.cellSize / 2,
      this.food.y * this.cellSize + this.cellSize / 2,
      this.cellSize / 2 - 2,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
  }

  private updateScore() {
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = this.score.toString();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snake-highscore', this.highScore.toString());
      const highScoreEl = document.getElementById('highscore');
      if (highScoreEl) highScoreEl.textContent = this.highScore.toString();
    }
  }

  private endGame() {
    this.gameOver = true;
    const gameOverEl = document.getElementById('game-over');
    const finalScoreEl = document.getElementById('final-score');
    if (gameOverEl) gameOverEl.style.display = 'block';
    if (finalScoreEl) finalScoreEl.textContent = this.score.toString();
  }

  private togglePause() {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
  }

  public restart() {
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) gameOverEl.style.display = 'none';
    this.startGame();
  }
}