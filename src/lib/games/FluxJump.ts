import { BaseGame } from '../core/BaseGame';

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'block';
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Star {
  x: number;
  y: number;
  collected: boolean;
}

export default class FluxJump extends BaseGame {
  
  // Game objects
  private player = {
    x: 100,
    y: 300,
    width: 40,
    height: 40,
    velocityY: 0,
    jumping: false,
    jumpPower: -12,
    gravity: 0.5
  };
  
  private obstacles: Obstacle[] = [];
  private platforms: Platform[] = [];
  private stars: Star[] = [];
  private backgroundX: number = 0;
  
  // Game state
  private distance: number = 0;
  private gameSpeed: number = 5;
  
  
  // Controls
  private keys = { space: false, up: false };

  constructor() {
    super({
      canvasWidth: 800,
      canvasHeight: 400,
      gameName: 'FluxJump'
    });
  }


  protected setupGame(): void {
    if (!this.container) return;

    const additionalStats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">Distance</div>
        <div id="distance" style="font-size: 24px; font-weight: bold;">0m</div>
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
          <div>Space / ↑ : Jump</div>
          <div>P : Pause</div>
        </div>
      `;
    }

    // Event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Touch controls
    if (this.canvas) {
      this.canvas.addEventListener('touchstart', this.handleTouch);
    }

    // Store reference for restart
    (window as any).currentGame = this;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'ArrowUp':
        e.preventDefault();
        this.jump();
        break;
      case 'p':
      case 'P':
        this.togglePause();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.key) {
      case ' ':
      case 'ArrowUp':
        this.keys.space = false;
        this.keys.up = false;
        break;
    }
  };

  private jump() {
    if (!this.player.jumping && !this.gameOver) {
      this.player.velocityY = this.player.jumpPower;
      this.player.jumping = true;
    }
  }

  private newGame() {
    this.score = 0;
    this.distance = 0;
    this.gameSpeed = 5;
    this.gameOver = false;
    this.isPaused = false;
    
    this.player.y = 300;
    this.player.velocityY = 0;
    this.player.jumping = false;
    
    this.obstacles = [];
    this.platforms = [];
    this.stars = [];
    
    // Create initial platform
    this.platforms.push({
      x: 0,
      y: 350,
      width: this.CANVAS_WIDTH,
      height: 50
    });
    
    this.updateStats();
    this.gameLoop();
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
    // Update distance and speed
    this.distance += this.gameSpeed / 10;
    this.gameSpeed = Math.min(15, 5 + this.distance / 100);
    
    // Update player
    this.player.velocityY += this.player.gravity;
    this.player.y += this.player.velocityY;
    
    // Background parallax
    this.backgroundX -= this.gameSpeed * 0.5;
    if (this.backgroundX <= -this.CANVAS_WIDTH) {
      this.backgroundX = 0;
    }
    
    // Update platforms
    this.platforms = this.platforms.filter(platform => {
      platform.x -= this.gameSpeed;
      return platform.x + platform.width > 0;
    });
    
    // Generate new platforms
    if (this.platforms.length === 0 || this.platforms[this.platforms.length - 1].x < this.CANVAS_WIDTH - 300) {
      const lastPlatform = this.platforms[this.platforms.length - 1] || { x: this.CANVAS_WIDTH, y: 350 };
      const gap = 150 + Math.random() * 100;
      const yVariation = Math.random() * 100 - 50;
      
      this.platforms.push({
        x: lastPlatform.x + gap + 100 + Math.random() * 100,
        y: Math.max(200, Math.min(350, lastPlatform.y + yVariation)),
        width: 100 + Math.random() * 100,
        height: 20
      });
    }
    
    // Update obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.x -= this.gameSpeed;
      return obstacle.x + obstacle.width > 0;
    });
    
    // Generate obstacles
    if (Math.random() < 0.02 && this.distance > 50) {
      const platform = this.platforms[this.platforms.length - 1];
      if (platform && platform.x > this.config.canvasWidth) {
        this.obstacles.push({
          x: platform.x + Math.random() * platform.width,
          y: platform.y - 30,
          width: 30,
          height: 30,
          type: Math.random() > 0.5 ? 'spike' : 'block'
        });
      }
    }
    
    // Update stars
    this.stars = this.stars.filter(star => {
      star.x -= this.gameSpeed;
      
      // Check collection
      if (!star.collected && 
          Math.abs(star.x - (this.player.x + this.player.width / 2)) < 20 &&
          Math.abs(star.y - (this.player.y + this.player.height / 2)) < 20) {
        star.collected = true;
        this.score += 10;
      }
      
      return star.x > -20 && !star.collected;
    });
    
    // Generate stars
    if (Math.random() < 0.03) {
      this.stars.push({
        x: this.config.canvasWidth + 20,
        y: 100 + Math.random() * 200,
        collected: false
      });
    }
    
    // Check platform collisions
    this.player.jumping = true;
    for (const platform of this.platforms) {
      if (this.player.x < platform.x + platform.width &&
          this.player.x + this.player.width > platform.x &&
          this.player.y + this.player.height > platform.y &&
          this.player.y + this.player.height < platform.y + platform.height + 10) {
        
        if (this.player.velocityY > 0) {
          this.player.y = platform.y - this.player.height;
          this.player.velocityY = 0;
          this.player.jumping = false;
        }
      }
    }
    
    // Check obstacle collisions
    for (const obstacle of this.obstacles) {
      if (this.player.x < obstacle.x + obstacle.width &&
          this.player.x + this.player.width > obstacle.x &&
          this.player.y < obstacle.y + obstacle.height &&
          this.player.y + this.player.height > obstacle.y) {
        this.endGame();
        return;
      }
    }
    
    // Check game over (fall off screen)
    if (this.player.y > this.config.canvasHeight) {
      this.endGame();
    }
    
    this.updateUI();
  }

  protected draw(): void {
    if (!this.ctx) return;
    
    // Draw themed background
    this.drawThemedBackground();
    
    // Add sky gradient overlay
    const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.config.canvasHeight);
    skyGradient.addColorStop(0, this.getThemeColor('info') + '40');
    skyGradient.addColorStop(1, this.getThemeColor('accent') + '20');
    this.ctx.fillStyle = skyGradient;
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
    
    // Draw clouds (background)
    this.ctx.fillStyle = this.getThemeColor('surface') + 'B3';
    for (let i = 0; i < 3; i++) {
      const x = (this.backgroundX + i * 300) % (this.config.canvasWidth + 100);
      this.drawCloud(x, 50 + i * 40);
    }
    
    // Draw platforms
    for (const platform of this.platforms) {
      // Platform gradient
      if (this.shouldShowEffect('gradients')) {
        const platformGradient = this.ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
        platformGradient.addColorStop(0, this.getThemeColor('secondary'));
        platformGradient.addColorStop(1, this.adjustBrightness(this.getThemeColor('secondary'), -40));
        this.ctx.fillStyle = platformGradient;
      } else {
        this.ctx.fillStyle = this.getThemeColor('secondary');
      }
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Grass on top
      this.ctx.fillStyle = this.getThemeColor('success');
      this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
    }
    
    // Draw obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.type === 'spike') {
        this.ctx.fillStyle = this.getThemeColor('error');
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = this.getThemeColor('textSecondary');
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add highlight effect
        if (this.shouldShowEffect('shadows')) {
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 4);
        }
      }
    }
    
    // Draw stars
    for (const star of this.stars) {
      // Star glow effect
      if (this.shouldShowEffect('glow')) {
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, 15, 0, Math.PI * 2);
        this.ctx.fillStyle = this.getThemeColor('warning') + '40';
        this.ctx.fill();
      }
      
      this.ctx.fillStyle = this.getThemeColor('warning');
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Star shine
      this.ctx.strokeStyle = this.adjustBrightness(this.getThemeColor('warning'), 20);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    // Draw player
    if (this.shouldShowEffect('gradients')) {
      const playerGradient = this.ctx.createLinearGradient(
        this.player.x, this.player.y,
        this.player.x, this.player.y + this.player.height
      );
      playerGradient.addColorStop(0, this.getThemeColor('primary'));
      playerGradient.addColorStop(1, this.adjustBrightness(this.getThemeColor('primary'), -30));
      this.ctx.fillStyle = playerGradient;
    } else {
      this.ctx.fillStyle = this.getThemeColor('primary');
    }
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Player face
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(this.player.x + 8, this.player.y + 8, 8, 8);
    this.ctx.fillRect(this.player.x + 24, this.player.y + 8, 8, 8);
    
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(this.player.x + 10, this.player.y + 10, 4, 4);
    this.ctx.fillRect(this.player.x + 26, this.player.y + 10, 4, 4);
    
    // Smile
    this.ctx.strokeStyle = '#000';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.player.x + 20, this.player.y + 25, 8, 0, Math.PI);
    this.ctx.stroke();
  }

  private drawCloud(x: number, y: number) {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, 25, 0, Math.PI * 2);
    this.ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
    this.ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private updateUI() {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('distance')!.textContent = Math.floor(this.distance) + 'm';
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
  }

  private togglePause() {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
  }

  private endGame() {
    this.gameOver = true;
    this.createGameOverlay('Game Over!', this.score, `
      <p style="font-size: 18px; margin-bottom: 10px;">Distance: ${Math.floor(this.distance)}m</p>
    `);
  }

  public restart(): void {
    super.restart();
    this.updateUI();
  }

  private adjustBrightness(color: string, amount: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}