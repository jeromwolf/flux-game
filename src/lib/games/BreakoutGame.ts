import { BaseGame, GameObject } from '../core/BaseGame';

interface Brick extends GameObject {
  hits: number;
  maxHits: number;
  powerUp?: string;
  destroyed: boolean;
}

interface Ball extends GameObject {
  radius: number;
  dx: number;
  dy: number;
}

interface Paddle extends GameObject {
  speed: number;
}

export default class BreakoutGame extends BaseGame {
  // Game objects
  private ball: Ball = { x: 0, y: 0, width: 16, height: 16, radius: 8, dx: 0, dy: 0 };
  private paddle: Paddle = { x: 0, y: 0, width: 100, height: 10, speed: 8 };
  private bricks: Brick[][] = [];
  
  // Game state
  private lives: number = 3;
  private level: number = 1;
  private isWin: boolean = false;
  
  // Game settings
  private readonly BRICK_ROWS = 8;
  private readonly BRICK_COLS = 10;
  private readonly BRICK_WIDTH = 75;
  private readonly BRICK_HEIGHT = 20;
  private readonly BRICK_PADDING = 2;
  private readonly BRICK_OFFSET_TOP = 60;
  private readonly BRICK_OFFSET_LEFT = 35;
  
  // Controls
  private keys = { left: false, right: false };
  
  // Power-ups
  private powerUps: Array<{ x: number, y: number, type: string, active: boolean }> = [];
  private activePowerUps: { [key: string]: number } = {};

  constructor() {
    super({
      canvasWidth: 800,
      canvasHeight: 600,
      gameName: 'Breakout'
    });
  }

  protected setupGame(): void {
    if (!this.container) return;

    const additionalStats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">Lives</div>
        <div id="lives" style="font-size: 24px; font-weight: bold;">${this.lives}</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">Level</div>
        <div id="level" style="font-size: 24px; font-weight: bold;">${this.level}</div>
      </div>
    `;

    this.container.innerHTML = this.createGameHTML(additionalStats);

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.config.canvasWidth;
      this.canvas.height = this.config.canvasHeight;
      this.ctx = this.canvas.getContext('2d');
    }

    // Add controls info
    const overlaysContainer = document.getElementById('game-overlays');
    if (overlaysContainer) {
      overlaysContainer.innerHTML = `
        <div style="
          margin-top: 20px;
          color: ${this.getThemeColor('textSecondary')};
          text-align: center;
          font-size: 14px;
        ">
          <div>← → : Move paddle</div>
          <div>Space : Pause</div>
        </div>
      `;
    }

    // Event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Touch controls
    if (this.canvas) {
      this.canvas.addEventListener('touchmove', this.handleTouchMove);
    }

    // Store reference for restart
    (window as any).currentGame = this;
  }

  protected initialize(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.gameOver = false;
    this.isWin = false;
    this.isPaused = false;
    this.powerUps = [];
    this.activePowerUps = {};
    
    this.initLevel();
    this.updateUI();
  }

  private initLevel(): void {
    // Reset ball
    this.ball.x = this.config.canvasWidth / 2;
    this.ball.y = this.config.canvasHeight - 100;
    this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    this.ball.dy = -4;
    
    // Reset paddle
    this.paddle.x = this.config.canvasWidth / 2 - this.paddle.width / 2;
    this.paddle.y = this.config.canvasHeight - 30;
    
    // Create bricks with theme colors
    this.bricks = [];
    for (let r = 0; r < this.BRICK_ROWS; r++) {
      this.bricks[r] = [];
      for (let c = 0; c < this.BRICK_COLS; c++) {
        const maxHits = Math.floor(r / 2) + 1;
        
        // Random power-up
        let powerUp = undefined;
        if (Math.random() < 0.1) {
          powerUp = ['expand', 'multi', 'slow', 'life'][Math.floor(Math.random() * 4)];
        }
        
        this.bricks[r][c] = {
          x: c * (this.BRICK_WIDTH + this.BRICK_PADDING) + this.BRICK_OFFSET_LEFT,
          y: r * (this.BRICK_HEIGHT + this.BRICK_PADDING) + this.BRICK_OFFSET_TOP,
          width: this.BRICK_WIDTH,
          height: this.BRICK_HEIGHT,
          hits: 0,
          maxHits: Math.min(maxHits, 3),
          destroyed: false,
          powerUp
        };
      }
    }
  }

  protected update(deltaTime: number): void {
    if (this.gameOver || this.isPaused) return;

    // Move paddle
    if (this.keys.left && this.paddle.x > 0) {
      this.paddle.x -= this.paddle.speed;
    }
    if (this.keys.right && this.paddle.x < this.config.canvasWidth - this.paddle.width) {
      this.paddle.x += this.paddle.speed;
    }
    
    // Move ball
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;
    
    // Ball collision with walls
    if (this.ball.x + this.ball.radius > this.config.canvasWidth || this.ball.x - this.ball.radius < 0) {
      this.ball.dx = -this.ball.dx;
    }
    if (this.ball.y - this.ball.radius < 0) {
      this.ball.dy = -this.ball.dy;
    }
    
    // Ball collision with paddle
    if (this.checkCollision(this.ball, this.paddle, -this.ball.radius)) {
      this.ball.dy = -Math.abs(this.ball.dy);
      
      // Add spin based on where ball hits paddle
      const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
      this.ball.dx = 8 * (hitPos - 0.5);
      
      // Create particles
      if (this.shouldShowEffect('particles')) {
        this.createParticles(this.ball.x, this.ball.y, 5, this.getThemeColor('primary'));
      }
    }
    
    // Ball collision with bricks
    for (let r = 0; r < this.BRICK_ROWS; r++) {
      for (let c = 0; c < this.BRICK_COLS; c++) {
        const brick = this.bricks[r][c];
        if (brick.destroyed) continue;
        
        if (this.checkCollision(this.ball, brick, -this.ball.radius)) {
          this.ball.dy = -this.ball.dy;
          brick.hits++;
          
          if (brick.hits >= brick.maxHits) {
            brick.destroyed = true;
            this.updateScore((brick.maxHits * 10) * this.level);
            
            // Create destruction particles
            if (this.shouldShowEffect('particles')) {
              this.createParticles(
                brick.x + brick.width / 2,
                brick.y + brick.height / 2,
                15,
                this.getBrickColor(brick),
                10
              );
            }
            
            // Drop power-up
            if (brick.powerUp) {
              this.powerUps.push({
                x: brick.x + brick.width / 2,
                y: brick.y + brick.height / 2,
                type: brick.powerUp,
                active: true
              });
            }
            
            // Check if level complete
            if (this.bricks.every(row => row.every(b => b.destroyed))) {
              this.nextLevel();
            }
          }
          
          this.updateUI();
          break;
        }
      }
    }
    
    // Update power-ups
    this.powerUps = this.powerUps.filter(powerUp => {
      if (!powerUp.active) return false;
      
      powerUp.y += 3;
      
      // Check collection
      if (powerUp.y > this.paddle.y - 20 && 
          powerUp.y < this.paddle.y + this.paddle.height &&
          powerUp.x > this.paddle.x &&
          powerUp.x < this.paddle.x + this.paddle.width) {
        this.activatePowerUp(powerUp.type);
        return false;
      }
      
      return powerUp.y < this.config.canvasHeight;
    });
    
    // Update active power-ups
    Object.keys(this.activePowerUps).forEach(type => {
      this.activePowerUps[type] -= deltaTime;
      if (this.activePowerUps[type] <= 0) {
        this.deactivatePowerUp(type);
        delete this.activePowerUps[type];
      }
    });
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Ball out of bounds
    if (this.ball.y - this.ball.radius > this.config.canvasHeight) {
      this.lives--;
      this.updateUI();
      
      if (this.lives === 0) {
        this.endGame();
      } else {
        this.ball.x = this.config.canvasWidth / 2;
        this.ball.y = this.config.canvasHeight - 100;
        this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = -4;
      }
    }
  }

  protected draw(): void {
    if (!this.ctx) return;

    // Draw themed background
    this.drawThemedBackground();
    
    // Draw bricks
    for (let r = 0; r < this.BRICK_ROWS; r++) {
      for (let c = 0; c < this.BRICK_COLS; c++) {
        const brick = this.bricks[r][c];
        if (brick.destroyed) continue;
        
        const color = this.getBrickColor(brick);
        
        if (this.shouldShowEffect('gradients')) {
          const gradient = this.ctx.createLinearGradient(
            brick.x, brick.y,
            brick.x + brick.width, brick.y + brick.height
          );
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, this.adjustBrightness(color, -30));
          this.ctx.fillStyle = gradient;
        } else {
          this.ctx.fillStyle = color;
        }
        
        this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Add highlight
        if (this.shouldShowEffect('shadows')) {
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          this.ctx.fillRect(brick.x, brick.y, brick.width, 4);
        }
        
        // Show power-up indicator
        if (brick.powerUp) {
          this.ctx.fillStyle = this.getThemeColor('warning');
          this.ctx.font = '16px sans-serif';
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText('?', brick.x + brick.width / 2, brick.y + brick.height / 2);
        }
      }
    }
    
    // Draw paddle
    if (this.shouldShowEffect('gradients')) {
      const gradient = this.ctx.createLinearGradient(
        this.paddle.x, 0,
        this.paddle.x + this.paddle.width, 0
      );
      gradient.addColorStop(0, this.getThemeColor('primary'));
      gradient.addColorStop(0.5, this.getThemeColor('accent'));
      gradient.addColorStop(1, this.getThemeColor('primary'));
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = this.getThemeColor('primary');
    }
    
    this.ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height);
    
    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.getThemeColor('text');
    this.ctx.fill();
    this.ctx.closePath();
    
    // Add glow effect to ball
    if (this.shouldShowEffect('glow')) {
      this.ctx.beginPath();
      this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius + 4, 0, Math.PI * 2);
      this.ctx.strokeStyle = this.getThemeColor('text') + '40';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.closePath();
    }
    
    // Draw power-ups
    this.powerUps.forEach(powerUp => {
      this.ctx!.beginPath();
      this.ctx!.arc(powerUp.x, powerUp.y, 15, 0, Math.PI * 2);
      this.ctx!.fillStyle = this.getPowerUpColor(powerUp.type);
      this.ctx!.fill();
      
      this.ctx!.fillStyle = this.getThemeColor('text');
      this.ctx!.font = 'bold 14px sans-serif';
      this.ctx!.textAlign = 'center';
      this.ctx!.textBaseline = 'middle';
      this.ctx!.fillText(this.getPowerUpSymbol(powerUp.type), powerUp.x, powerUp.y);
    });
    
    // Draw particles
    if (this.shouldShowEffect('particles')) {
      this.drawParticles();
    }
    
    // Draw pause overlay
    if (this.isPaused && !this.gameOver) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
      
      this.ctx.fillStyle = this.getThemeColor('text');
      this.ctx.font = 'bold 48px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('PAUSED', this.config.canvasWidth / 2, this.config.canvasHeight / 2);
    }
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    if (this.canvas) {
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    }
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

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas!.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    this.paddle.x = x - this.paddle.width / 2;
  };

  private getBrickColor(brick: Brick): string {
    const colorMap: { [key: number]: keyof typeof this.currentTheme.colors } = {
      0: 'error',
      1: 'warning', 
      2: 'success',
      3: 'info'
    };
    const colorIndex = brick.maxHits - brick.hits - 1;
    return this.getThemeColor(colorMap[colorIndex] || 'primary');
  }

  private getPowerUpColor(type: string): string {
    const colorMap: { [key: string]: keyof typeof this.currentTheme.colors } = {
      'expand': 'success',
      'multi': 'warning',
      'slow': 'info',
      'life': 'error'
    };
    return this.getThemeColor(colorMap[type] || 'primary');
  }

  private getPowerUpSymbol(type: string): string {
    const symbolMap: { [key: string]: string } = {
      'expand': '↔',
      'multi': '3',
      'slow': '⏰',
      'life': '♥'
    };
    return symbolMap[type] || '?';
  }

  private activatePowerUp(type: string): void {
    switch (type) {
      case 'expand':
        this.paddle.width = 150;
        this.activePowerUps[type] = 10; // 10 seconds
        break;
      case 'slow':
        this.ball.dx *= 0.5;
        this.ball.dy *= 0.5;
        this.activePowerUps[type] = 8;
        break;
      case 'life':
        this.lives++;
        this.updateUI();
        break;
    }
  }

  private deactivatePowerUp(type: string): void {
    switch (type) {
      case 'expand':
        this.paddle.width = 100;
        break;
      case 'slow':
        this.ball.dx *= 2;
        this.ball.dy *= 2;
        break;
    }
  }

  private adjustBrightness(color: string, amount: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  private togglePause(): void {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
  }

  private updateUI(): void {
    const scoreEl = document.getElementById('score');
    const highScoreEl = document.getElementById('highscore');
    const livesEl = document.getElementById('lives');
    const levelEl = document.getElementById('level');
    
    if (scoreEl) scoreEl.textContent = this.score.toString();
    if (highScoreEl) highScoreEl.textContent = this.highScore.toString();
    if (livesEl) livesEl.textContent = this.lives.toString();
    if (levelEl) levelEl.textContent = this.level.toString();
  }

  private nextLevel(): void {
    this.level++;
    this.ball.dx *= 1.1;
    this.ball.dy *= 1.1;
    this.updateScore(1000 * this.level); // Level complete bonus
    this.initLevel();
  }

  private endGame(): void {
    this.gameOver = true;
    const title = this.isWin ? 'You Win!' : 'Game Over';
    this.createGameOverlay(title, this.score, `
      <p style="font-size: 18px; margin-bottom: 10px;">Level: ${this.level}</p>
    `);
  }

  public restart(): void {
    super.restart();
    this.updateUI();
  }
}