import { BaseGame, GameObject } from '../core/BaseGame';

interface SnakeSegment extends GameObject {
  x: number;
  y: number;
}

export default class SnakeGame extends BaseGame {
  private snake: SnakeSegment[] = [];
  private food: { x: number; y: number } = { x: 0, y: 0 };
  private direction: 'up' | 'down' | 'left' | 'right' = 'right';
  private nextDirection: 'up' | 'down' | 'left' | 'right' = 'right';
  private gridSize: number = 20;
  private cellSize: number = 20;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 150; // Start speed
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  constructor() {
    super({
      canvasWidth: 400,
      canvasHeight: 400,
      gameName: 'Snake Game'
    });
  }

  protected setupGame(): void {
    if (!this.container) return;

    const additionalStats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">Speed</div>
        <div id="speed" style="font-size: 24px; font-weight: bold;">1x</div>
      </div>
    `;

    this.container.innerHTML = this.createGameHTML(additionalStats);

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.config.canvasWidth;
      this.canvas.height = this.config.canvasHeight;
      this.ctx = this.canvas.getContext('2d');
      
      this.cellSize = this.config.canvasWidth / this.gridSize;

      // Add touch controls
      this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
      this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    // Add control buttons
    const overlaysContainer = document.getElementById('game-overlays');
    if (overlaysContainer) {
      overlaysContainer.innerHTML = `
        <div style="
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        ">
          <div style="color: ${this.getThemeColor('textSecondary')}; font-size: 14px;">
            Use arrow keys or WASD to move
          </div>
          <button id="pause-btn" style="
            padding: 10px 30px;
            font-size: 16px;
            font-weight: bold;
            color: white;
            background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
            border: none;
            border-radius: 5px;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Pause
          </button>
        </div>
      `;

      const pauseBtn = document.getElementById('pause-btn');
      pauseBtn?.addEventListener('click', () => this.togglePause());
    }

    // Add keyboard controls
    document.addEventListener('keydown', this.handleKeyPress.bind(this));

    // Store reference for restart
    (window as any).currentGame = this;
  }

  protected initialize(): void {
    this.initSnake();
    this.updateUI();
  }

  private initSnake(): void {
    this.snake = [
      { x: 5, y: 10, width: 1, height: 1 },
      { x: 4, y: 10, width: 1, height: 1 },
      { x: 3, y: 10, width: 1, height: 1 }
    ];
    this.direction = 'right';
    this.nextDirection = 'right';
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.lastUpdateTime = 0;
    this.updateInterval = 150;
    this.generateFood();
  }

  private generateFood(): void {
    do {
      this.food = {
        x: Math.floor(Math.random() * this.gridSize),
        y: Math.floor(Math.random() * this.gridSize)
      };
    } while (this.snake.some(segment => segment.x === this.food.x && segment.y === this.food.y));
  }

  protected update(deltaTime: number): void {
    if (this.gameOver) return;

    this.lastUpdateTime += deltaTime * 1000;
    
    if (this.lastUpdateTime < this.updateInterval) return;
    
    this.lastUpdateTime = 0;

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
      this.updateScore(10);
      this.generateFood();
      
      // Create particle effect at food location
      const foodPixelX = this.food.x * this.cellSize + this.cellSize / 2;
      const foodPixelY = this.food.y * this.cellSize + this.cellSize / 2;
      this.createParticles(foodPixelX, foodPixelY, 10, this.getThemeColor('success'), 3);
      
      // Increase speed
      this.updateInterval = Math.max(50, 150 - Math.floor(this.score / 50) * 10);
      this.updateUI();
    } else {
      this.snake.pop();
    }

    // Update particles
    this.updateParticles(deltaTime);
  }

  protected draw(): void {
    if (!this.ctx) return;

    // Draw themed background
    this.drawThemedBackground();

    // Draw grid lines if effect is enabled
    if (this.shouldShowEffect('shadows')) {
      this.ctx.strokeStyle = this.getThemeColor('surface');
      this.ctx.lineWidth = 0.5;
      for (let i = 0; i <= this.gridSize; i++) {
        // Vertical lines
        this.ctx.beginPath();
        this.ctx.moveTo(i * this.cellSize, 0);
        this.ctx.lineTo(i * this.cellSize, this.config.canvasHeight);
        this.ctx.stroke();
        
        // Horizontal lines
        this.ctx.beginPath();
        this.ctx.moveTo(0, i * this.cellSize);
        this.ctx.lineTo(this.config.canvasWidth, i * this.cellSize);
        this.ctx.stroke();
      }
    }

    // Draw snake with gradient
    this.snake.forEach((segment, index) => {
      const x = segment.x * this.cellSize;
      const y = segment.y * this.cellSize;
      
      if (index === 0) {
        // Head with gradient
        if (this.shouldShowEffect('gradients')) {
          const gradient = this.ctx!.createRadialGradient(
            x + this.cellSize / 2, y + this.cellSize / 2, 0,
            x + this.cellSize / 2, y + this.cellSize / 2, this.cellSize / 2
          );
          gradient.addColorStop(0, this.getThemeColor('success'));
          gradient.addColorStop(1, this.getThemeColor('primary'));
          this.ctx!.fillStyle = gradient;
        } else {
          this.ctx!.fillStyle = this.getThemeColor('success');
        }
      } else {
        // Body segments
        this.ctx!.fillStyle = this.getThemeColor('primary');
        this.ctx!.globalAlpha = 1 - (index / this.snake.length) * 0.3;
      }
      
      this.ctx!.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
      this.ctx!.globalAlpha = 1;
      
      // Add glow effect to head
      if (index === 0 && this.shouldShowEffect('glow')) {
        this.ctx!.shadowColor = this.getThemeColor('success');
        this.ctx!.shadowBlur = 10;
        this.ctx!.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
        this.ctx!.shadowBlur = 0;
      }
    });

    // Draw food with animation
    const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 0.8;
    this.ctx.fillStyle = this.getThemeColor('error');
    
    if (this.shouldShowEffect('glow')) {
      this.ctx.shadowColor = this.getThemeColor('error');
      this.ctx.shadowBlur = 15 * pulse;
    }
    
    this.ctx.beginPath();
    this.ctx.arc(
      this.food.x * this.cellSize + this.cellSize / 2,
      this.food.y * this.cellSize + this.cellSize / 2,
      (this.cellSize / 2 - 4) * pulse,
      0,
      Math.PI * 2
    );
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Draw particles
    if (this.shouldShowEffect('particles')) {
      this.drawParticles();
    }

    // Draw pause overlay
    if (this.isPaused && !this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
      
      this.ctx.fillStyle = this.getThemeColor('text');
      this.ctx.font = 'bold 36px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('PAUSED', this.config.canvasWidth / 2, this.config.canvasHeight / 2);
    }
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    }
  }

  private handleKeyPress(e: KeyboardEvent): void {
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
  }

  private handleTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (this.gameOver) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - this.touchStartX;
    const dy = touchEndY - this.touchStartY;
    
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
  }

  private togglePause(): void {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.textContent = this.isPaused ? 'Resume' : 'Pause';
  }

  private endGame(): void {
    this.gameOver = true;
    this.createGameOverlay('Game Over!', this.score, `
      <p style="font-size: 18px; margin-bottom: 10px;">Speed: ${this.getSpeedMultiplier()}x</p>
    `);
  }

  private updateUI(): void {
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('highscore');
    const speedEl = document.getElementById('speed');
    
    if (scoreEl) scoreEl.textContent = this.score.toString();
    if (highScoreEl) highScoreEl.textContent = this.highScore.toString();
    if (speedEl) speedEl.textContent = this.getSpeedMultiplier() + 'x';
  }

  private getSpeedMultiplier(): string {
    const baseSpeed = 150;
    const currentSpeed = this.updateInterval;
    return ((baseSpeed / currentSpeed).toFixed(1));
  }

  public restart(): void {
    super.restart();
    this.updateUI();
  }
}