import { BaseGame, GameObject } from '../core/BaseGame';
import { PowerUpManager } from '../core/GameComponents';
import { GameUI } from '../core/GameUI';
import { GameUtils } from '../core/GameUtils';

interface Obstacle extends GameObject {
  type: 'cactus' | 'bird' | 'rock';
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

export default class DinoRunFixed extends BaseGame {
  // Game objects
  private dino: GameObject & {
    velocityY: number;
    jumping: boolean;
    ducking: boolean;
    jumpCount: number;
    runFrame: number;
  };
  
  private obstacles: Obstacle[] = [];
  private powerUps: PowerUp[] = [];
  private coins: Coin[] = [];
  private clouds: Cloud[] = [];
  
  // Game mechanics
  private distance: number = 0;
  private coins_collected: number = 0;
  private gameStarted: boolean = false;
  private speed: number = 6;
  private groundY: number = 250;
  private gravity: number = 600;
  private jumpPower: number = -400;
  
  // Power-up manager
  private powerUpManager: PowerUpManager;
  
  // Visual effects
  private nightMode: boolean = false;
  private backgroundOffset: number = 0;
  private screenShake: number = 0;

  constructor() {
    super({
      canvasWidth: 800,
      canvasHeight: 400,
      gameName: 'Dino Run'
    });
    
    this.powerUpManager = new PowerUpManager();
    
    this.dino = {
      x: 50,
      y: 200,
      width: 50,
      height: 50,
      velocityY: 0,
      jumping: false,
      ducking: false,
      jumpCount: 0,
      runFrame: 0
    };
  }

  protected setupGame(): void {
    if (!this.container) return;
    
    const additionalStats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #FFD700;">Coins</div>
        <div id="coins" style="font-size: 24px; font-weight: bold; color: #FFD700;">${this.coins_collected}</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #3498db;">Distance</div>
        <div id="distance" style="font-size: 24px; font-weight: bold; color: #3498db;">${Math.floor(this.distance)}m</div>
      </div>
    `;
    
    this.container.innerHTML = this.createGameHTML(additionalStats);
    
    // Add start screen
    const startScreen = GameUI.createStartScreen(
      'Dino Run',
      'Help the dinosaur run as far as possible!',
      [
        'Space/↑: Jump',
        '↓: Duck',
        'Collect coins and power-ups',
        'Avoid obstacles'
      ],
      [
        { icon: '🛡️', text: 'Shield - Protects from one hit' },
        { icon: '⚡', text: 'Double Jump - Jump twice in the air' },
        { icon: '🧲', text: 'Magnet - Attracts coins' },
        { icon: '⏱️', text: 'Slow Time - Slows down obstacles' }
      ],
      () => this.startGame()
    );
    
    this.container.appendChild(startScreen);
    
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.ctx = this.canvas.getContext('2d');
    
    // Event listeners
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Touch controls
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    (window as any).dinoRun = this;
  }

  protected initialize(): void {
    this.distance = 0;
    this.coins_collected = 0;
    this.speed = 6;
    this.obstacles = [];
    this.powerUps = [];
    this.coins = [];
    this.particles = [];
    this.powerUpManager.reset();
    this.screenShake = 0;
    
    this.dino.y = this.groundY - this.dino.height;
    this.dino.velocityY = 0;
    this.dino.jumping = false;
    this.dino.jumpCount = 0;
    
    // Generate initial clouds
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.config.canvasWidth,
        y: 30 + Math.random() * 100,
        speed: 0.5 + Math.random() * 0.5,
        size: 30 + Math.random() * 20
      });
    }
    
    this.updateUI();
  }

  protected update(deltaTime: number): void {
    if (!this.gameStarted || this.gameOver) return;
    
    // Update power-ups
    this.powerUpManager.update(deltaTime);
    
    // Update distance and speed
    const speedMultiplier = this.powerUpManager.isActive('slow-time') ? 0.5 : 1;
    this.distance += (this.speed * speedMultiplier * deltaTime * 10);
    this.speed = Math.min(12, 6 + this.distance / 500);
    
    // Update dino physics
    if (this.dino.jumping || this.dino.y < this.groundY - this.dino.height) {
      this.dino.velocityY += this.gravity * deltaTime;
      this.dino.y += this.dino.velocityY * deltaTime;
      
      if (this.dino.y >= this.groundY - this.dino.height) {
        this.dino.y = this.groundY - this.dino.height;
        this.dino.jumping = false;
        this.dino.jumpCount = 0;
        this.dino.velocityY = 0;
      }
    }
    
    // Update run animation
    if (!this.dino.jumping) {
      this.dino.runFrame = (this.dino.runFrame + deltaTime * 10) % 2;
    }
    
    // Night mode toggle
    this.nightMode = Math.floor(this.distance / 1000) % 2 === 1;
    
    // Update background
    this.backgroundOffset -= (this.speed * speedMultiplier * deltaTime * 50);
    
    // Spawn obstacles
    if (Math.random() < 0.01 + this.distance / 100000) {
      const lastObstacle = this.obstacles[this.obstacles.length - 1];
      if (!lastObstacle || lastObstacle.x < this.config.canvasWidth - 200) {
        this.spawnObstacle();
      }
    }
    
    // Spawn coins
    if (Math.random() < 0.02) {
      this.spawnCoins();
    }
    
    // Spawn power-ups
    if (Math.random() < 0.003) {
      this.spawnPowerUp();
    }
    
    // Update obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.x -= this.speed * speedMultiplier * deltaTime * 100;
      
      // Check collision
      if (this.checkCollision(this.dino, obstacle)) {
        if (this.powerUpManager.isActive('shield')) {
          this.powerUpManager.activate('shield', 0); // Deactivate shield
          this.createParticles(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 20, '#FF6B6B');
          this.screenShake = 10;
          return false;
        } else {
          this.endGame();
        }
      }
      
      // Score for avoiding
      if (!obstacle.passed && obstacle.x + obstacle.width < this.dino.x) {
        obstacle.passed = true;
        this.updateScore(10);
      }
      
      return obstacle.x + obstacle.width > 0;
    });
    
    // Update coins with magnet effect
    this.coins = this.coins.filter(coin => {
      coin.x -= this.speed * speedMultiplier * deltaTime * 100;
      
      // Magnet effect
      if (this.powerUpManager.isActive('magnet')) {
        const dx = (this.dino.x + this.dino.width / 2) - coin.x;
        const dy = (this.dino.y + this.dino.height / 2) - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 150) {
          coin.x += dx * 0.1;
          coin.y += dy * 0.1;
        }
      }
      
      // Check collection
      if (this.checkCollision(this.dino, coin, -10)) {
        coin.collected = true;
        this.coins_collected++;
        this.updateScore(5);
        this.createParticles(coin.x, coin.y, 10, '#FFD700');
      }
      
      return coin.x > -20 && !coin.collected;
    });
    
    // Update power-ups
    this.powerUps = this.powerUps.filter(powerUp => {
      powerUp.x -= this.speed * speedMultiplier * deltaTime * 100;
      
      if (powerUp.active && this.checkCollision(this.dino, powerUp)) {
        this.collectPowerUp(powerUp);
        return false;
      }
      
      return powerUp.x > -50;
    });
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Update clouds
    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * speedMultiplier * deltaTime * 100;
      if (cloud.x + cloud.size < 0) {
        cloud.x = this.config.canvasWidth + cloud.size;
        cloud.y = 30 + Math.random() * 100;
      }
    });
    
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
    }
    
    this.updateUI();
  }

  protected draw(): void {
    if (!this.ctx) return;
    
    // Apply screen shake
    if (this.screenShake > 0.1) {
      this.ctx.save();
      const shake = GameUtils.shake(this.screenShake, 10, Date.now() / 100);
      this.ctx.translate(shake.x, shake.y);
    }
    
    // Draw themed background
    this.drawThemedBackground();
    
    // Draw additional sky elements for theme
    if (this.nightMode && this.shouldShowEffect('particles')) {
      // Stars
      this.ctx.fillStyle = 'white';
      for (let i = 0; i < 50; i++) {
        const x = ((i * 73 + this.backgroundOffset * 0.1) % (this.config.canvasWidth + 20)) - 10;
        const y = (i * 37) % 200;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    
    // Draw clouds
    this.ctx.fillStyle = this.nightMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)';
    this.clouds.forEach(cloud => {
      this.drawCloud(cloud.x, cloud.y, cloud.size);
    });
    
    // Draw ground
    this.ctx.fillStyle = this.getThemeColor('surface');
    this.ctx.fillRect(0, this.groundY, this.config.canvasWidth, this.config.canvasHeight - this.groundY);
    
    // Ground details
    this.ctx.strokeStyle = this.getThemeColor('textSecondary');
    this.ctx.lineWidth = 2;
    for (let i = 0; i < 20; i++) {
      const x = ((i * 60 + this.backgroundOffset) % (this.config.canvasWidth + 60)) - 60;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.groundY);
      this.ctx.lineTo(x + 40, this.groundY);
      this.ctx.stroke();
    }
    
    // Draw coins
    this.coins.forEach(coin => {
      if (this.shouldShowEffect('glow')) {
        this.ctx!.shadowColor = '#FFD700';
        this.ctx!.shadowBlur = 10;
      }
      this.ctx!.fillStyle = '#FFD700';
      this.ctx!.beginPath();
      this.ctx!.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, 10, 0, Math.PI * 2);
      this.ctx!.fill();
      this.ctx!.shadowBlur = 0;
      
      // Inner circle
      this.ctx!.fillStyle = '#FFA500';
      this.ctx!.beginPath();
      this.ctx!.arc(coin.x + coin.width / 2, coin.y + coin.height / 2, 6, 0, Math.PI * 2);
      this.ctx!.fill();
    });
    
    // Draw power-ups
    this.powerUps.forEach(powerUp => {
      if (powerUp.active) {
        const icons: { [key: string]: string } = {
          'shield': '🛡️',
          'double-jump': '⚡',
          'magnet': '🧲',
          'slow-time': '⏱️'
        };
        
        if (this.shouldShowEffect('glow')) {
          this.ctx!.shadowColor = this.getThemeColor('accent');
          this.ctx!.shadowBlur = 15;
        }
        
        this.ctx!.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx!.beginPath();
        this.ctx!.arc(powerUp.x + 15, powerUp.y + 15, 20, 0, Math.PI * 2);
        this.ctx!.fill();
        this.ctx!.shadowBlur = 0;
        
        this.ctx!.font = '24px Arial';
        this.ctx!.fillText(icons[powerUp.type], powerUp.x, powerUp.y + 20);
      }
    });
    
    // Draw obstacles
    this.obstacles.forEach(obstacle => {
      this.ctx!.fillStyle = this.getThemeColor('error');
      
      if (obstacle.type === 'cactus') {
        GameUtils.drawRoundedRect(this.ctx!, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 5);
        this.ctx!.fill();
      } else if (obstacle.type === 'bird') {
        // Animated bird
        const wingFlap = Math.sin(Date.now() * 0.01) * 5;
        this.ctx!.beginPath();
        this.ctx!.ellipse(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2,
                          obstacle.width / 2, obstacle.height / 3, 0, 0, Math.PI * 2);
        this.ctx!.fill();
      } else if (obstacle.type === 'rock') {
        this.ctx!.beginPath();
        this.ctx!.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
        this.ctx!.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
        this.ctx!.lineTo(obstacle.x, obstacle.y + obstacle.height);
        this.ctx!.closePath();
        this.ctx!.fill();
      }
    });
    
    // Draw particles
    this.drawParticles();
    
    // Draw dino
    if (!this.gameOver || Math.floor(Date.now() / 100) % 2 === 0) {
      // Shield effect
      if (this.powerUpManager.isActive('shield') && this.shouldShowEffect('glow')) {
        this.ctx.strokeStyle = this.getThemeColor('info');
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.dino.x + this.dino.width / 2, this.dino.y + this.dino.height / 2,
                     35, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Dino body
      this.ctx.fillStyle = this.getThemeColor('success');
      GameUtils.drawRoundedRect(this.ctx, this.dino.x, this.dino.y, this.dino.width, 
                                this.dino.ducking ? 30 : this.dino.height, 10);
      this.ctx.fill();
      
      // Eye
      this.ctx.fillStyle = 'white';
      this.ctx.fillRect(this.dino.x + this.dino.width - 10, this.dino.y + 5, 8, 8);
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(this.dino.x + this.dino.width - 8, this.dino.y + 7, 4, 4);
    }
    
    // Power-up indicators
    const activePowerUps = this.powerUpManager.getActivePowerUps().map(type => {
      const icons: { [key: string]: string } = {
        'shield': '🛡️',
        'double-jump': '⚡',
        'magnet': '🧲',
        'slow-time': '⏱️'
      };
      
      return {
        icon: icons[type] || '?',
        progress: this.powerUpManager.getProgress(type)
      };
    });
    
    GameUI.updatePowerUpDisplay(activePowerUps);
    
    // Restore from screen shake
    if (this.screenShake > 0.1) {
      this.ctx.restore();
    }
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
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
  }

  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.code) {
      case 'ArrowDown':
        this.stopDuck();
        break;
    }
  }

  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas!.getBoundingClientRect();
    const y = touch.clientY - rect.top;
    
    if (y < this.config.canvasHeight / 2) {
      this.jump();
    } else {
      this.duck();
    }
  }

  private handleTouchEnd(): void {
    this.stopDuck();
  }

  private jump(): void {
    if (this.gameOver) return;
    
    const maxJumps = this.powerUpManager.isActive('double-jump') ? 2 : 1;
    
    if (this.dino.jumpCount < maxJumps) {
      this.dino.velocityY = this.jumpPower;
      this.dino.jumping = true;
      this.dino.jumpCount++;
      
      // Jump particles
      this.createParticles(
        this.dino.x + this.dino.width / 2,
        this.dino.y + this.dino.height,
        5,
        this.getThemeColor('primary')
      );
    }
  }

  private duck(): void {
    if (this.gameOver || this.dino.jumping) return;
    this.dino.ducking = true;
    this.dino.height = 30;
  }

  private stopDuck(): void {
    this.dino.ducking = false;
    this.dino.height = 50;
  }

  private startGame(): void {
    document.getElementById('start-screen')!.style.display = 'none';
    this.gameStarted = true;
    this.gameOver = false;
    this.initialize();
  }

  private spawnObstacle(): void {
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
      x: this.config.canvasWidth,
      y: y - height,
      width,
      height,
      type
    });
  }

  private spawnCoins(): void {
    const coinY = this.groundY - 60 - Math.random() * 100;
    for (let i = 0; i < 3; i++) {
      this.coins.push({
        x: this.config.canvasWidth + i * 30,
        y: coinY,
        width: 20,
        height: 20,
        collected: false
      });
    }
  }

  private spawnPowerUp(): void {
    const types: ('shield' | 'double-jump' | 'magnet' | 'slow-time')[] = 
      ['shield', 'double-jump', 'magnet', 'slow-time'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    this.powerUps.push({
      x: this.config.canvasWidth,
      y: this.groundY - 100,
      width: 30,
      height: 30,
      type,
      active: true
    });
  }

  private collectPowerUp(powerUp: PowerUp): void {
    const durations: { [key: string]: number } = {
      'shield': 10000,
      'double-jump': 8000,
      'magnet': 6000,
      'slow-time': 5000
    };
    
    this.powerUpManager.activate(powerUp.type, durations[powerUp.type]);
    this.createParticles(powerUp.x + 15, powerUp.y + 15, 15, this.getThemeColor('accent'));
  }

  private drawCloud(x: number, y: number, size: number): void {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.arc(x + size * 0.5, y, size * 0.7, 0, Math.PI * 2);
    this.ctx.arc(x + size, y, size * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private updateUI(): void {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('highscore')!.textContent = this.highScore.toString();
    document.getElementById('coins')!.textContent = this.coins_collected.toString();
    document.getElementById('distance')!.textContent = GameUtils.formatDistance(this.distance);
  }

  private endGame(): void {
    this.gameOver = true;
    
    const additionalInfo = `
      <p style="font-size: 20px; margin-bottom: 10px;">Distance: ${GameUtils.formatDistance(this.distance)}</p>
      <p style="font-size: 18px; margin-bottom: 10px; color: #FFD700;">Coins: ${this.coins_collected}</p>
    `;
    
    this.createGameOverlay('Game Over!', this.score, additionalInfo);
  }

  public restart(): void {
    super.restart();
    this.gameStarted = true;
  }
}