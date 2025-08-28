import { BaseGame, GameObject } from '../core/BaseGame';

interface Obstacle extends GameObject {
  type: 'cactus' | 'bird' | 'rock';
  sprite?: number;
  passed?: boolean;
}

interface PowerUp extends GameObject {
  type: 'shield' | 'double-jump' | 'magnet' | 'slow-time';
  active: boolean;
}

interface Coin extends GameObject {
  collected: boolean;
  magnetized?: boolean;
}

interface Cloud {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export default class DinoRun extends BaseGame {
  
  // Game objects
  private dino = {
    x: 50,
    y: 200,
    width: 50,
    height: 50,
    velocityY: 0,
    jumping: false,
    ducking: false,
    jumpCount: 0,
    maxJumps: 1,
    runFrame: 0
  };
  
  private obstacles: Obstacle[] = [];
  private powerUps: PowerUp[] = [];
  private coins: Coin[] = [];
  private clouds: Cloud[] = [];
  
  // Game state
  private distance: number = 0;
  private coins_collected: number = 0;
  private gameStarted: boolean = false;
  private speed: number = 6;
  private groundY: number = 250;
  private gravity: number = 0.6;
  private jumpPower: number = -12;
  
  // Power-up states
  private shieldActive: boolean = false;
  private shieldTime: number = 0;
  private doubleJumpActive: boolean = false;
  private doubleJumpTime: number = 0;
  private magnetActive: boolean = false;
  private magnetTime: number = 0;
  private slowTimeActive: boolean = false;
  private slowTimeTime: number = 0;
  
  // Visual effects
  private nightMode: boolean = false;
  private backgroundOffset: number = 0;
  private starOffset: number = 0;
  
  // Game settings
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 400;

  constructor() {
    super({
      canvasWidth: 800,
      canvasHeight: 400,
      gameName: 'Dino Run',
      backgroundColor: '#f7f7f7'
    });
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.setupGame();
    this.generateInitialClouds();
    this.gameLoop();
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
      <div class="dino-run-game" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: #f7f7f7;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        transition: background 0.5s;
      ">
        <h1 style="
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #228B22, #32CD32);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">Dino Run</h1>
        
        <div class="stats" style="
          display: flex;
          gap: 30px;
          margin-bottom: 20px;
          color: #333;
        ">
          <div style="text-align: center;">
            <div style="font-size: 16px; color: #666;">Score</div>
            <div id="score" style="font-size: 24px; font-weight: bold;">${this.score}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 16px; color: #666;">Distance</div>
            <div id="distance" style="font-size: 24px; font-weight: bold;">${Math.floor(this.distance)}m</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 16px; color: #FFD700;">Coins</div>
            <div id="coins" style="font-size: 24px; font-weight: bold; color: #FFD700;">${this.coins_collected}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 16px; color: #FF6B6B;">Best</div>
            <div id="highscore" style="font-size: 24px; font-weight: bold; color: #FF6B6B;">${this.highScore}</div>
          </div>
        </div>

        <div style="position: relative;">
          <canvas id="game-canvas" style="
            border: 2px solid #333;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            background: white;
          "></canvas>
          
          <div id="power-ups" style="
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 10px;
          "></div>
        </div>

        <div style="margin-top: 20px; color: #666; text-align: center;">
          <div style="font-size: 18px; margin-bottom: 10px;">
            <span style="margin-right: 20px;">Space/↑: Jump</span>
            <span style="margin-right: 20px;">↓: Duck</span>
            <span>Double Jump when powered up!</span>
          </div>
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
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        ">
          <h2 style="font-size: 36px; margin-bottom: 20px; color: #FF6B6B;">Game Over!</h2>
          <p style="font-size: 24px; margin-bottom: 10px;">Score: <span id="final-score">0</span></p>
          <p style="font-size: 20px; margin-bottom: 10px;">Distance: <span id="final-distance">0</span>m</p>
          <p style="font-size: 20px; margin-bottom: 30px; color: #FFD700;">Coins: <span id="final-coins">0</span></p>
          <button onclick="window.dinoRun.restart()" style="
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #228B22, #32CD32);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Play Again</button>
        </div>

        <div id="start-screen" style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          background: rgba(255, 255, 255, 0.95);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        ">
          <h2 style="font-size: 32px; margin-bottom: 20px; color: #333;">Ready to Run?</h2>
          <div style="margin-bottom: 20px;">
            <div style="font-size: 50px; margin-bottom: 10px;">🦖</div>
            <p style="font-size: 18px; color: #666;">Help the dinosaur run as far as possible!</p>
          </div>
          <div style="text-align: left; margin-bottom: 30px; background: #f0f0f0; padding: 20px; border-radius: 10px;">
            <h3 style="margin-bottom: 10px; color: #333;">Power-ups:</h3>
            <div style="margin-bottom: 5px;">🛡️ Shield - Protects from one hit</div>
            <div style="margin-bottom: 5px;">⚡ Double Jump - Jump twice in the air</div>
            <div style="margin-bottom: 5px;">🧲 Magnet - Attracts coins</div>
            <div>⏱️ Slow Time - Slows down obstacles</div>
          </div>
          <button onclick="window.dinoRun.startGame()" style="
            padding: 15px 40px;
            font-size: 20px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #228B22, #32CD32);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Start Running!</button>
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
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas!.getBoundingClientRect();
      const y = touch.clientY - rect.top;
      
      if (y < this.CANVAS_HEIGHT / 2) {
        this.jump();
      } else {
        this.duck();
      }
    });
    
    this.canvas.addEventListener('touchend', () => {
      this.stopDuck();
    });

    (window as any).dinoRun = this;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.gameStarted && (e.code === 'Space' || e.code === 'ArrowUp')) {
      this.startGame();
      return;
    }
    
    switch (e.code) {
      case 'Space':
      case 'ArrowUp':
        e.preventDefault();
        this.jump();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.duck();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    switch (e.code) {
      case 'ArrowDown':
        this.stopDuck();
        break;
    }
  };

  private jump() {
    if (this.gameOver) return;
    
    const maxJumps = this.doubleJumpActive ? 2 : 1;
    
    if (this.dino.jumpCount < maxJumps) {
      this.dino.velocityY = this.jumpPower;
      this.dino.jumping = true;
      this.dino.jumpCount++;
      
      // Jump particles
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          x: this.dino.x + this.dino.width / 2,
          y: this.dino.y + this.dino.height,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 2,
          life: 1,
          color: '#8B7355'
        });
      }
    }
  }

  private duck() {
    if (this.gameOver || this.dino.jumping) return;
    this.dino.ducking = true;
    this.dino.height = 30;
  }

  private stopDuck() {
    this.dino.ducking = false;
    this.dino.height = 50;
  }

  public startGame() {
    document.getElementById('start-screen')!.style.display = 'none';
    this.gameStarted = true;
    this.gameOver = false;
    this.score = 0;
    this.distance = 0;
    this.coins_collected = 0;
    this.speed = 6;
    this.obstacles = [];
    this.powerUps = [];
    this.coins = [];
    this.resetPowerUps();
    this.dino.y = this.groundY - this.dino.height;
    this.dino.velocityY = 0;
    this.dino.jumpCount = 0;
    this.updateStats();
  }

  private resetPowerUps() {
    this.shieldActive = false;
    this.doubleJumpActive = false;
    this.magnetActive = false;
    this.slowTimeActive = false;
    this.shieldTime = 0;
    this.doubleJumpTime = 0;
    this.magnetTime = 0;
    this.slowTimeTime = 0;
    this.dino.maxJumps = 1;
  }

  private generateInitialClouds() {
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.CANVAS_WIDTH,
        y: 30 + Math.random() * 100,
        speed: 0.5 + Math.random() * 0.5,
        size: 30 + Math.random() * 20
      });
    }
  }

  private gameLoop = () => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update() {
    if (!this.gameStarted || this.gameOver) return;
    
    // Update distance and speed
    const speedMultiplier = this.slowTimeActive ? 0.5 : 1;
    this.distance += (this.speed * speedMultiplier) / 10;
    this.speed = Math.min(12, 6 + this.distance / 500);
    
    // Update dino
    if (this.dino.jumping || this.dino.y < this.groundY - this.dino.height) {
      this.dino.velocityY += this.gravity;
      this.dino.y += this.dino.velocityY;
      
      if (this.dino.y >= this.groundY - this.dino.height) {
        this.dino.y = this.groundY - this.dino.height;
        this.dino.jumping = false;
        this.dino.jumpCount = 0;
        this.dino.velocityY = 0;
      }
    }
    
    // Update run animation
    if (!this.dino.jumping) {
      this.dino.runFrame = (this.dino.runFrame + 0.2) % 2;
    }
    
    // Night mode
    this.nightMode = Math.floor(this.distance / 1000) % 2 === 1;
    
    // Update background
    this.backgroundOffset -= (this.speed * speedMultiplier) * 0.5;
    if (this.nightMode) {
      this.starOffset -= (this.speed * speedMultiplier) * 0.1;
    }
    
    // Generate obstacles
    if (Math.random() < 0.015 + this.distance / 10000) {
      const lastObstacle = this.obstacles[this.obstacles.length - 1];
      if (!lastObstacle || lastObstacle.x < this.CANVAS_WIDTH - 200) {
        const types: ('cactus' | 'bird' | 'rock')[] = ['cactus', 'bird', 'rock'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        let y = this.groundY;
        let height = 40;
        let width = 30;
        
        if (type === 'bird') {
          y = this.groundY - 60 - Math.random() * 60;
          height = 30;
          width = 40;
        } else if (type === 'rock') {
          height = 30;
          width = 40;
        }
        
        this.obstacles.push({
          x: this.CANVAS_WIDTH,
          y: y - height,
          width,
          height,
          type,
          sprite: Math.floor(Math.random() * 3)
        });
      }
    }
    
    // Generate coins
    if (Math.random() < 0.02) {
      const coinY = this.groundY - 60 - Math.random() * 100;
      for (let i = 0; i < 3; i++) {
        this.coins.push({
          x: this.CANVAS_WIDTH + i * 30,
          y: coinY,
          collected: false
        });
      }
    }
    
    // Generate power-ups
    if (Math.random() < 0.003) {
      const types: ('shield' | 'double-jump' | 'magnet' | 'slow-time')[] = ['shield', 'double-jump', 'magnet', 'slow-time'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      this.powerUps.push({
        x: this.CANVAS_WIDTH,
        y: this.groundY - 100,
        type,
        active: true
      });
    }
    
    // Update obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.x -= this.speed * speedMultiplier;
      
      // Check collision
      if (this.checkCollision(this.dino, obstacle)) {
        if (this.shieldActive) {
          this.shieldActive = false;
          this.shieldTime = 0;
          this.createExplosion(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
          return false;
        } else {
          this.endGame();
        }
      }
      
      // Score point for avoiding obstacle
      if (!obstacle.passed && obstacle.x + obstacle.width < this.dino.x) {
        obstacle.passed = true;
        this.score += 10;
      }
      
      return obstacle.x + obstacle.width > 0;
    });
    
    // Update coins
    this.coins = this.coins.filter(coin => {
      coin.x -= this.speed * speedMultiplier;
      
      // Magnet effect
      if (this.magnetActive) {
        const dx = (this.dino.x + this.dino.width / 2) - coin.x;
        const dy = (this.dino.y + this.dino.height / 2) - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          coin.magnetized = true;
          coin.x += dx * 0.1;
          coin.y += dy * 0.1;
        }
      }
      
      // Check collection
      if (this.checkCoinCollision(this.dino, coin)) {
        coin.collected = true;
        this.coins_collected++;
        this.score += 5;
        this.createCoinParticles(coin.x, coin.y);
      }
      
      return coin.x > -20 && !coin.collected;
    });
    
    // Update power-ups
    this.powerUps = this.powerUps.filter(powerUp => {
      powerUp.x -= this.speed * speedMultiplier;
      
      // Check collection
      if (powerUp.active && this.checkPowerUpCollision(this.dino, powerUp)) {
        this.activatePowerUp(powerUp.type);
        powerUp.active = false;
        return false;
      }
      
      return powerUp.x > -50;
    });
    
    // Update power-up timers
    this.updatePowerUps();
    
    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3;
      particle.life -= 0.02;
      return particle.life > 0;
    });
    
    // Update clouds
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * speedMultiplier;
      if (cloud.x + cloud.size < 0) {
        cloud.x = this.CANVAS_WIDTH + cloud.size;
        cloud.y = 30 + Math.random() * 100;
      }
    });
    
    this.updateStats();
  }

  private checkCollision(dino: any, obstacle: Obstacle): boolean {
    const margin = 5;
    return dino.x + margin < obstacle.x + obstacle.width &&
           dino.x + dino.width - margin > obstacle.x &&
           dino.y + margin < obstacle.y + obstacle.height &&
           dino.y + dino.height - margin > obstacle.y;
  }

  private checkCoinCollision(dino: any, coin: Coin): boolean {
    const coinRadius = 10;
    const centerX = coin.x;
    const centerY = coin.y;
    
    return dino.x < centerX + coinRadius &&
           dino.x + dino.width > centerX - coinRadius &&
           dino.y < centerY + coinRadius &&
           dino.y + dino.height > centerY - coinRadius;
  }

  private checkPowerUpCollision(dino: any, powerUp: PowerUp): boolean {
    return dino.x < powerUp.x + 30 &&
           dino.x + dino.width > powerUp.x &&
           dino.y < powerUp.y + 30 &&
           dino.y + dino.height > powerUp.y;
  }

  private activatePowerUp(type: string) {
    switch (type) {
      case 'shield':
        this.shieldActive = true;
        this.shieldTime = 300;
        break;
      case 'double-jump':
        this.doubleJumpActive = true;
        this.doubleJumpTime = 500;
        break;
      case 'magnet':
        this.magnetActive = true;
        this.magnetTime = 400;
        break;
      case 'slow-time':
        this.slowTimeActive = true;
        this.slowTimeTime = 300;
        break;
    }
    
    this.updatePowerUpDisplay();
  }

  private updatePowerUps() {
    if (this.shieldTime > 0) {
      this.shieldTime--;
      if (this.shieldTime === 0) this.shieldActive = false;
    }
    
    if (this.doubleJumpTime > 0) {
      this.doubleJumpTime--;
      if (this.doubleJumpTime === 0) this.doubleJumpActive = false;
    }
    
    if (this.magnetTime > 0) {
      this.magnetTime--;
      if (this.magnetTime === 0) this.magnetActive = false;
    }
    
    if (this.slowTimeTime > 0) {
      this.slowTimeTime--;
      if (this.slowTimeTime === 0) this.slowTimeActive = false;
    }
  }

  private updatePowerUpDisplay() {
    const container = document.getElementById('power-ups');
    if (!container) return;
    
    let html = '';
    if (this.shieldActive) html += '<div style="font-size: 24px;">🛡️</div>';
    if (this.doubleJumpActive) html += '<div style="font-size: 24px;">⚡</div>';
    if (this.magnetActive) html += '<div style="font-size: 24px;">🧲</div>';
    if (this.slowTimeActive) html += '<div style="font-size: 24px;">⏱️</div>';
    
    container.innerHTML = html;
  }

  private createExplosion(x: number, y: number) {
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 5,
        vy: Math.sin(angle) * 5,
        life: 1,
        color: '#FF6B6B'
      });
    }
  }

  private createCoinParticles(x: number, y: number) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: -Math.random() * 6,
        life: 1,
        color: '#FFD700'
      });
    }
  }

  private draw() {
    if (!this.ctx) return;
    
    // Sky
    if (this.nightMode) {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#16213e');
      this.ctx.fillStyle = gradient;
    } else {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98D8E8');
      this.ctx.fillStyle = gradient;
    }
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Stars (night mode)
    if (this.nightMode) {
      this.ctx.fillStyle = 'white';
      for (let i = 0; i < 50; i++) {
        const x = ((i * 73 + this.starOffset) % (this.CANVAS_WIDTH + 20)) - 10;
        const y = (i * 37) % 200;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // Clouds
    this.ctx.fillStyle = this.nightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)';
    this.clouds.forEach(cloud => {
      this.drawCloud(cloud.x, cloud.y, cloud.size);
    });
    
    // Ground
    this.ctx.fillStyle = this.nightMode ? '#3d3d3d' : '#8B7355';
    this.ctx.fillRect(0, this.groundY, this.CANVAS_WIDTH, this.CANVAS_HEIGHT - this.groundY);
    
    // Ground lines
    this.ctx.strokeStyle = this.nightMode ? '#5d5d5d' : '#654321';
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const x = ((i * 60 + this.backgroundOffset) % (this.CANVAS_WIDTH + 60)) - 60;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.groundY);
      this.ctx.lineTo(x + 40, this.groundY);
      this.ctx.stroke();
    }
    
    // Draw coins
    this.coins.forEach(coin => {
      this.ctx!.fillStyle = '#FFD700';
      this.ctx!.beginPath();
      this.ctx!.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
      this.ctx!.fill();
      
      // Inner circle
      this.ctx!.fillStyle = '#FFA500';
      this.ctx!.beginPath();
      this.ctx!.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
      this.ctx!.fill();
    });
    
    // Draw power-ups
    this.powerUps.forEach(powerUp => {
      if (powerUp.active) {
        const icons = {
          'shield': '🛡️',
          'double-jump': '⚡',
          'magnet': '🧲',
          'slow-time': '⏱️'
        };
        
        // Glow effect
        this.ctx!.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx!.beginPath();
        this.ctx!.arc(powerUp.x + 15, powerUp.y + 15, 20, 0, Math.PI * 2);
        this.ctx!.fill();
        
        this.ctx!.font = '24px Arial';
        this.ctx!.fillText(icons[powerUp.type], powerUp.x, powerUp.y + 20);
      }
    });
    
    // Draw obstacles
    this.obstacles.forEach(obstacle => {
      if (obstacle.type === 'cactus') {
        this.ctx!.fillStyle = '#228B22';
        this.ctx!.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Spikes
        this.ctx!.beginPath();
        this.ctx!.moveTo(obstacle.x - 5, obstacle.y + 10);
        this.ctx!.lineTo(obstacle.x, obstacle.y + 5);
        this.ctx!.lineTo(obstacle.x, obstacle.y + 15);
        this.ctx!.closePath();
        this.ctx!.fill();
        
        this.ctx!.beginPath();
        this.ctx!.moveTo(obstacle.x + obstacle.width + 5, obstacle.y + 20);
        this.ctx!.lineTo(obstacle.x + obstacle.width, obstacle.y + 15);
        this.ctx!.lineTo(obstacle.x + obstacle.width, obstacle.y + 25);
        this.ctx!.closePath();
        this.ctx!.fill();
      } else if (obstacle.type === 'bird') {
        // Bird body
        this.ctx!.fillStyle = '#4B0082';
        this.ctx!.beginPath();
        this.ctx!.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 
                          obstacle.width / 2, obstacle.height / 3, 0, 0, Math.PI * 2);
        this.ctx!.fill();
        
        // Wings
        const wingFlap = Math.sin(Date.now() * 0.01) * 5;
        this.ctx!.beginPath();
        this.ctx!.moveTo(obstacle.x + 10, obstacle.y + obstacle.height / 2);
        this.ctx!.lineTo(obstacle.x - 5, obstacle.y + obstacle.height / 2 - wingFlap);
        this.ctx!.lineTo(obstacle.x + 10, obstacle.y + obstacle.height / 2 - 5);
        this.ctx!.closePath();
        this.ctx!.fill();
        
        this.ctx!.beginPath();
        this.ctx!.moveTo(obstacle.x + obstacle.width - 10, obstacle.y + obstacle.height / 2);
        this.ctx!.lineTo(obstacle.x + obstacle.width + 5, obstacle.y + obstacle.height / 2 - wingFlap);
        this.ctx!.lineTo(obstacle.x + obstacle.width - 10, obstacle.y + obstacle.height / 2 - 5);
        this.ctx!.closePath();
        this.ctx!.fill();
      } else if (obstacle.type === 'rock') {
        this.ctx!.fillStyle = '#808080';
        this.ctx!.beginPath();
        this.ctx!.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx!.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx!.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx!.closePath();
        this.ctx!.fill();
      }
    });
    
    // Draw particles
    this.particles.forEach(particle => {
      this.ctx!.globalAlpha = particle.life;
      this.ctx!.fillStyle = particle.color;
      this.ctx!.beginPath();
      this.ctx!.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
      this.ctx!.fill();
    });
    this.ctx.globalAlpha = 1;
    
    // Draw dino
    if (!this.gameOver || Math.floor(Date.now() / 100) % 2 === 0) {
      // Shield effect
      if (this.shieldActive) {
        this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.dino.x + this.dino.width / 2, this.dino.y + this.dino.height / 2, 
                     35, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Dino body
      this.ctx.fillStyle = '#228B22';
      this.ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height);
      
      // Dino details
      // Head
      this.ctx.fillRect(this.dino.x + this.dino.width - 15, this.dino.y - 10, 20, 20);
      
      // Eye
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(this.dino.x + this.dino.width - 5, this.dino.y - 5, 5, 5);
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(this.dino.x + this.dino.width - 3, this.dino.y - 3, 2, 2);
      
      // Tail
      this.ctx.fillStyle = '#228B22';
      this.ctx.beginPath();
      this.ctx.moveTo(this.dino.x, this.dino.y + 10);
      this.ctx.lineTo(this.dino.x - 10, this.dino.y + 5);
      this.ctx.lineTo(this.dino.x - 10, this.dino.y + 20);
      this.ctx.lineTo(this.dino.x, this.dino.y + 25);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Legs
      if (!this.dino.jumping) {
        const legOffset = Math.floor(this.dino.runFrame) * 5;
        this.ctx.fillRect(this.dino.x + 10, this.dino.y + this.dino.height, 5, 10 + legOffset);
        this.ctx.fillRect(this.dino.x + 30, this.dino.y + this.dino.height, 5, 10 - legOffset);
      } else {
        this.ctx.fillRect(this.dino.x + 10, this.dino.y + this.dino.height, 5, 8);
        this.ctx.fillRect(this.dino.x + 30, this.dino.y + this.dino.height, 5, 8);
      }
    }
    
    // Slow time effect
    if (this.slowTimeActive) {
      this.ctx.fillStyle = 'rgba(100, 100, 255, 0.1)';
      this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    }
  }

  private drawCloud(x: number, y: number, size: number) {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.5, y, size * 0.7, 0, Math.PI * 2);
    this.ctx.arc(x + size, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private updateStats() {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('distance')!.textContent = Math.floor(this.distance) + 'm';
    document.getElementById('coins')!.textContent = this.coins_collected.toString();
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('dino-run-highscore', this.highScore.toString());
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
    
    this.updatePowerUpDisplay();
  }

  private endGame() {
    this.gameOver = true;
    document.getElementById('game-over')!.style.display = 'block';
    document.getElementById('final-score')!.textContent = this.score.toString();
    document.getElementById('final-distance')!.textContent = Math.floor(this.distance).toString();
    document.getElementById('final-coins')!.textContent = this.coins_collected.toString();
  }

  public restart() {
    document.getElementById('game-over')!.style.display = 'none';
    this.startGame();
  }
}