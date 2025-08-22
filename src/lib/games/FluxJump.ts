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
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  
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
  private score: number = 0;
  private highScore: number = 0;
  private distance: number = 0;
  private gameSpeed: number = 5;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  
  // Game settings
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 400;
  
  // Controls
  private keys = { space: false, up: false };

  constructor() {
    this.highScore = parseInt(localStorage.getItem('flux-jump-highscore') || '0');
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
      <div class="flux-jump-game" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: linear-gradient(to bottom, #87CEEB, #98D8E8);
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h1 style="
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ff6b6b, #ffd93d);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">Flux Jump</h1>
        
        <div class="stats" style="
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
          color: #333;
        ">
          <div style="text-align: center;">
            <div style="font-size: 18px;">Score</div>
            <div id="score" style="font-size: 28px; font-weight: bold;">${this.score}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px;">Distance</div>
            <div id="distance" style="font-size: 28px; font-weight: bold;">${Math.floor(this.distance)}m</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px;">High Score</div>
            <div id="highscore" style="font-size: 28px; font-weight: bold;">${this.highScore}</div>
          </div>
        </div>

        <canvas id="game-canvas" style="
          border: 3px solid #333;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        "></canvas>

        <div style="margin-top: 20px; color: #333; text-align: center;">
          <div>Space or ↑ : Jump</div>
          <div>P : Pause</div>
        </div>

        <div id="game-over" style="
          display: none;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(255, 255, 255, 0.95);
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        ">
          <h2 style="font-size: 36px; margin-bottom: 20px; color: #ff6b6b;">Game Over!</h2>
          <p style="font-size: 24px; margin-bottom: 10px;">Score: <span id="final-score">0</span></p>
          <p style="font-size: 20px; margin-bottom: 30px;">Distance: <span id="final-distance">0</span>m</p>
          <button onclick="window.fluxJump.restart()" style="
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #ff6b6b, #ffd93d);
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
    this.canvas.addEventListener('touchstart', () => {
      this.jump();
    });

    (window as any).fluxJump = this;
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
      if (this.player.x < obstacle.x + obstacle.width &&
          this.player.x + this.player.width > obstacle.x &&
          this.player.y < obstacle.y + obstacle.height &&
          this.player.y + this.player.height > obstacle.y) {
        this.endGame();
        return;
      }
    }
    
    // Check game over (fall off screen)
    if (this.player.y > this.CANVAS_HEIGHT) {
      this.endGame();
    }
    
    this.updateStats();
  }

  private draw() {
    if (!this.ctx) return;
    
    // Clear canvas with sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98D8E8');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Draw clouds (background)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 3; i++) {
      const x = (this.backgroundX + i * 300) % (this.CANVAS_WIDTH + 100);
      this.drawCloud(x, 50 + i * 40);
    }
    
    // Draw platforms
    for (const platform of this.platforms) {
      this.ctx.fillStyle = '#8B4513';
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      
      // Grass on top
      this.ctx.fillStyle = '#228B22';
      this.ctx.fillRect(platform.x, platform.y, platform.width, 5);
    }
    
    // Draw obstacles
    for (const obstacle of this.obstacles) {
      if (obstacle.type === 'spike') {
        this.ctx.fillStyle = '#ff0000';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        this.ctx.fillStyle = '#666';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
    }
    
    // Draw stars
    for (const star of this.stars) {
      this.ctx.fillStyle = '#ffd700';
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, 10, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Star shine
      this.ctx.strokeStyle = '#ffed4e';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
    
    // Draw player
    this.ctx.fillStyle = '#ff6b6b';
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

  private updateStats() {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('distance')!.textContent = Math.floor(this.distance) + 'm';
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('flux-jump-highscore', this.highScore.toString());
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
  }

  private togglePause() {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
  }

  private endGame() {
    this.gameOver = true;
    document.getElementById('game-over')!.style.display = 'block';
    document.getElementById('final-score')!.textContent = this.score.toString();
    document.getElementById('final-distance')!.textContent = Math.floor(this.distance).toString();
  }

  public restart() {
    document.getElementById('game-over')!.style.display = 'none';
    this.newGame();
  }
}