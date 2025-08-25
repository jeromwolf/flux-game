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

export default class FluxJump {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  
  // Canvas dimensions
  private CANVAS_WIDTH = 480;
  private CANVAS_HEIGHT = 854;
  
  // Game objects
  private player = {
    x: 100,
    y: 300,
    width: 40,
    height: 40,
    velocityY: 0,
    jumping: false,
    jumpPower: -15,
    gravity: 0.8
  };
  
  private obstacles: Obstacle[] = [];
  private platforms: Platform[] = [];
  private stars: Star[] = [];
  private backgroundX: number = 0;
  
  // Game state
  private distance: number = 0;
  private gameSpeed: number = 5;
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  
  // Theme colors
  private theme = {
    colors: {
      primary: '#06b6d4',
      secondary: '#8b5cf6',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      border: '#374151',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.width = this.CANVAS_WIDTH;
    this.canvas.height = this.CANVAS_HEIGHT;
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = '480px';
    this.canvas.style.height = 'auto';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.display = 'block';
    this.canvas.style.border = '1px solid #374151';
    this.canvas.style.borderRadius = '8px';
  }

  mount(container: HTMLElement): void {
    this.container = container;
    container.appendChild(this.canvas);
    
    this.setupEventListeners();
    this.newGame();
  }

  private setupEventListeners(): void {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.jump();
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
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
  }

  private handleKeyUp(e: KeyboardEvent): void {
    // No action needed on key up
  }

  private handleClick(e: MouseEvent): void {
    if (this.gameOver) {
      this.newGame();
    } else {
      this.jump();
    }
  }

  private jump(): void {
    if (!this.player.jumping && !this.gameOver && !this.isPaused) {
      this.player.velocityY = this.player.jumpPower;
      this.player.jumping = true;
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;
  }

  private newGame(): void {
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
    
    this.gameLoop();
  }

  private gameLoop = (): void => {
    if (!this.gameOver) {
      if (!this.isPaused) {
        this.update();
      }
      this.draw();
      this.animationId = requestAnimationFrame(this.gameLoop);
    }
  };

  private update(): void {
    // Update distance and speed
    this.distance += this.gameSpeed / 10;
    this.gameSpeed = Math.min(12, 5 + this.distance / 200);
    
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
      if (platform && platform.x > this.CANVAS_WIDTH) {
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
          Math.abs(star.x - (this.player.x + this.player.width / 2)) < 30 &&
          Math.abs(star.y - (this.player.y + this.player.height / 2)) < 30) {
        star.collected = true;
        this.score += 10;
      }
      
      return star.x > -20 && !star.collected;
    });
    
    // Generate stars
    if (Math.random() < 0.03) {
      this.stars.push({
        x: this.CANVAS_WIDTH + 20,
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
      if (this.player.x < obstacle.x + obstacle.width - 5 &&
          this.player.x + this.player.width > obstacle.x + 5 &&
          this.player.y < obstacle.y + obstacle.height - 5 &&
          this.player.y + this.player.height > obstacle.y + 5) {
        this.endGame();
        return;
      }
    }
    
    // Check game over (fall off screen)
    if (this.player.y > this.CANVAS_HEIGHT) {
      this.endGame();
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = this.theme.colors.background;
    ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT / 2);
    skyGradient.addColorStop(0, '#1a1a2e');
    skyGradient.addColorStop(1, '#3d3d5c');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT / 2);
    
    // Draw clouds (parallax background)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 3; i++) {
      const x = (this.backgroundX + i * 200) % (this.CANVAS_WIDTH + 100);
      this.drawCloud(x, 50 + i * 60);
    }
    
    // Draw platforms
    for (const platform of this.platforms) {
      const gradient = ctx.createLinearGradient(0, platform.y, 0, platform.y + platform.height);
      gradient.addColorStop(0, this.theme.colors.secondary);
      gradient.addColorStop(1, '#6d3eb5');
      ctx.fillStyle = gradient;
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Grass on top
      ctx.fillStyle = this.theme.colors.success;
      ctx.fillRect(platform.x, platform.y, platform.width, 5);
    }
    
    // Draw obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.type === 'spike') {
        ctx.fillStyle = this.theme.colors.error;
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = '#666';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, 4);
      }
    }
    
    // Draw stars
    for (const star of this.stars) {
      // Star glow
      ctx.beginPath();
      ctx.arc(star.x, star.y, 15, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
      ctx.fill();
      
      // Star
      ctx.beginPath();
      ctx.arc(star.x, star.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = this.theme.colors.warning;
      ctx.fill();
    }
    
    // Draw player
    const playerGradient = ctx.createLinearGradient(
      this.player.x, 
      this.player.y, 
      this.player.x + this.player.width, 
      this.player.y + this.player.height
    );
    playerGradient.addColorStop(0, this.theme.colors.primary);
    playerGradient.addColorStop(1, '#0891b2');
    ctx.fillStyle = playerGradient;
    ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Player eyes
    ctx.fillStyle = '#fff';
    ctx.fillRect(this.player.x + 8, this.player.y + 10, 8, 8);
    ctx.fillRect(this.player.x + 24, this.player.y + 10, 8, 8);
    ctx.fillStyle = '#000';
    ctx.fillRect(this.player.x + 10, this.player.y + 12, 4, 4);
    ctx.fillRect(this.player.x + 26, this.player.y + 12, 4, 4);
    
    // Draw UI
    this.drawUI();
    
    // Draw pause overlay
    if (this.isPaused) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
      ctx.font = '24px Arial';
      ctx.fillText('Press P to continue', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 50);
    }
    
    // Draw game over
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
      
      ctx.fillStyle = this.theme.colors.error;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 - 50);
      
      ctx.fillStyle = '#fff';
      ctx.font = '24px Arial';
      ctx.fillText(`Distance: ${Math.floor(this.distance)}m`, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 10);
      ctx.fillText(`Score: ${this.score}`, this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 40);
      
      ctx.font = '18px Arial';
      ctx.fillText('Click to play again', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2 + 100);
    }
  }

  private drawUI(): void {
    const ctx = this.ctx;
    
    // Score background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(10, 10, 200, 80);
    
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.score}`, 20, 35);
    
    // Distance
    ctx.font = '16px Arial';
    ctx.fillText(`Distance: ${Math.floor(this.distance)}m`, 20, 60);
    
    // Speed indicator
    ctx.fillText(`Speed: ${this.gameSpeed.toFixed(1)}`, 20, 80);
    
    // Controls hint
    if (this.distance < 50) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Tap or Press Space to Jump!', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT - 50);
    }
  }

  private drawCloud(x: number, y: number): void {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
    ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
    ctx.fill();
  }

  private endGame(): void {
    this.gameOver = true;
    
    // Save high score
    const highScore = parseInt(localStorage.getItem('flux-jump-highscore') || '0');
    if (this.score > highScore) {
      localStorage.setItem('flux-jump-highscore', this.score.toString());
    }
  }

  unmount(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('click', this.handleClick);
    if (this.container) {
      this.container.removeChild(this.canvas);
    }
  }
}