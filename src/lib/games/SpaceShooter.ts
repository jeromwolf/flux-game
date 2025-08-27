import { BaseGame } from '../core/BaseGame';
import { ThemeManager } from '../core/ThemeSystem';

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  damage: number;
  type: 'player' | 'enemy';
  velocityX?: number;
  velocityY?: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  type: 'basic' | 'fast' | 'tank' | 'boss';
  pattern: 'straight' | 'zigzag' | 'circle' | 'dive';
  patternTime: number;
  shootCooldown: number;
  lastShot: number;
  points: number;
  bossPhase?: number;
  laserCharging?: boolean;
  laserTimer?: number;
}

interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'rapidfire' | 'spread' | 'shield' | 'health' | 'laser' | 'homing' | 'timeslow';
  duration: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: string;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
}

interface BackgroundObject {
  type: 'planet' | 'asteroid' | 'station';
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  color?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  requirement: number;
  progress: number;
  unlocked: boolean;
}

export default class SpaceShooter extends BaseGame {
  private audioContext: AudioContext | null = null;
  private bgmGainNode: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private isBgmPlaying: boolean = false;
  private playerX: number = 0;
  private playerY: number = 0;
  private playerWidth: number = 60;
  private playerHeight: number = 80;
  private playerSpeed: number = 8;
  private playerHealth: number = 100;
  private playerMaxHealth: number = 100;
  
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private powerUps: PowerUp[] = [];
  private stars: Star[] = [];
  private backgroundObjects: BackgroundObject[] = [];
  
  private wave: number = 1;
  private enemiesInWave: number = 5;
  private enemiesSpawned: number = 0;
  private waveComplete: boolean = false;
  private gameState: 'playing' | 'paused' | 'gameover' | 'waveComplete' = 'playing';
  
  private shootCooldown: number = 200;
  private lastShot: number = 0;
  private rapidFire: boolean = false;
  private spreadShot: boolean = false;
  private shield: boolean = false;
  private laserBeam: boolean = false;
  private homingMissiles: boolean = false;
  private timeSlow: boolean = false;
  private powerUpTimer: number = 0;
  private timeSlowFactor: number = 1;
  
  private keys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private isMobile: boolean = false;
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  
  private enemySpawnTimer: number = 0;
  private enemySpawnDelay: number = 2000;
  
  private lastTime: number = 0;

  // Mobile controls
  private joystickActive: boolean = false;
  private joystickBaseX: number = 0;
  private joystickBaseY: number = 0;
  private joystickX: number = 0;
  private joystickY: number = 0;
  private autoFire: boolean = false;
  private controlsContainer: HTMLDivElement | null = null;

  // Achievement tracking
  private totalKills: number = 0;
  private bossKills: number = 0;
  private damageTaken: number = 0;
  private maxCombo: number = 0;
  private currentCombo: number = 0;
  private lastKillTime: number = 0;
  private achievements: Achievement[] = [];
  private newUnlocks: Achievement[] = [];

  constructor() {
    super({
      canvasWidth: 800,
      canvasHeight: 600,
      gameName: 'spaceshooter'
    });
    this.initAchievements();
  }

  protected setupGame(): void {
    // Clear any existing content first
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = this.config.canvasWidth;
    canvas.height = this.config.canvasHeight;
    canvas.style.cursor = 'none';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    this.container?.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  protected initialize(): void {
    // Initialize audio context
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
      this.startBackgroundMusic();
    }
    this.init();
    this.setupEventListeners();
    if (this.isMobile) {
      this.setupMobileControls();
    }
  }

  private init(): void {
    this.playerX = this.canvas!.width / 2 - this.playerWidth / 2;
    this.playerY = this.canvas!.height - this.playerHeight - 20;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Initialize stars
    for (let i = 0; i < 100; i++) {
      this.stars.push({
        x: Math.random() * this.canvas!.width,
        y: Math.random() * this.canvas!.height,
        speed: Math.random() * 2 + 0.5,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
    
    // Initialize background objects
    this.spawnBackgroundObject();
  }

  private setupMobileControls(): void {
    // Create controls container
    this.controlsContainer = document.createElement('div');
    this.controlsContainer.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 0;
      right: 0;
      height: 150px;
      pointer-events: none;
      z-index: 10;
    `;
    this.container?.appendChild(this.controlsContainer);

    // Create joystick
    const joystickBase = document.createElement('div');
    joystickBase.style.cssText = `
      position: absolute;
      left: 50px;
      bottom: 0;
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      pointer-events: auto;
    `;
    
    const joystickKnob = document.createElement('div');
    joystickKnob.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 50px;
      height: 50px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: none;
    `;
    joystickBase.appendChild(joystickKnob);
    this.controlsContainer.appendChild(joystickBase);

    // Create auto-fire button
    const autoFireBtn = document.createElement('button');
    autoFireBtn.textContent = '🔥 AUTO';
    autoFireBtn.style.cssText = `
      position: absolute;
      right: 50px;
      bottom: 35px;
      width: 80px;
      height: 80px;
      background: rgba(255, 100, 100, 0.3);
      border: 2px solid rgba(255, 100, 100, 0.5);
      border-radius: 50%;
      color: white;
      font-size: 14px;
      font-weight: bold;
      pointer-events: auto;
      touch-action: none;
    `;
    this.controlsContainer.appendChild(autoFireBtn);

    // Joystick events
    const rect = joystickBase.getBoundingClientRect();
    this.joystickBaseX = rect.left + rect.width / 2;
    this.joystickBaseY = rect.top + rect.height / 2;

    const handleJoystickMove = (clientX: number, clientY: number) => {
      const dx = clientX - this.joystickBaseX;
      const dy = clientY - this.joystickBaseY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 60;

      if (distance <= maxDistance) {
        this.joystickX = dx / maxDistance;
        this.joystickY = dy / maxDistance;
        joystickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      } else {
        const angle = Math.atan2(dy, dx);
        this.joystickX = Math.cos(angle);
        this.joystickY = Math.sin(angle);
        joystickKnob.style.transform = `translate(calc(-50% + ${Math.cos(angle) * maxDistance}px), calc(-50% + ${Math.sin(angle) * maxDistance}px))`;
      }
    };

    joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.joystickActive = true;
      const touch = e.touches[0];
      handleJoystickMove(touch.clientX, touch.clientY);
    });

    joystickBase.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (this.joystickActive) {
        const touch = e.touches[0];
        handleJoystickMove(touch.clientX, touch.clientY);
      }
    });

    joystickBase.addEventListener('touchend', () => {
      this.joystickActive = false;
      this.joystickX = 0;
      this.joystickY = 0;
      joystickKnob.style.transform = 'translate(-50%, -50%)';
    });

    // Auto-fire button events
    autoFireBtn.addEventListener('click', () => {
      this.autoFire = !this.autoFire;
      autoFireBtn.style.background = this.autoFire 
        ? 'rgba(255, 100, 100, 0.6)' 
        : 'rgba(255, 100, 100, 0.3)';
    });
  }

  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;
  private boundKeyUp: ((e: KeyboardEvent) => void) | null = null;

  private setupEventListeners(): void {
    // Keyboard controls
    this.boundKeyDown = (e: KeyboardEvent) => {
      this.keys.add(e.key);
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (this.gameState === 'gameover') {
          this.restartGame();
        } else if (this.gameState === 'waveComplete') {
          this.nextWave();
        }
      }
      if (e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }
    };

    this.boundKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key);
    };

    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    // Mouse controls
    this.canvas!.addEventListener('mousemove', (e) => {
      const rect = this.canvas!.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    });

    this.canvas!.addEventListener('click', () => {
      this.shoot();
    });

    // Touch controls (disabled if mobile controls are active)
    if (!this.isMobile) {
      this.canvas!.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas!.getBoundingClientRect();
        this.touchStartX = touch.clientX - rect.left;
        this.touchStartY = touch.clientY - rect.top;
        this.shoot();
      });

      this.canvas!.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = this.canvas!.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        const deltaX = touchX - this.touchStartX;
        const deltaY = touchY - this.touchStartY;
        
        this.playerX = Math.max(0, Math.min(this.canvas!.width - this.playerWidth, this.playerX + deltaX));
        this.playerY = Math.max(0, Math.min(this.canvas!.height - this.playerHeight, this.playerY + deltaY));
        
        this.touchStartX = touchX;
        this.touchStartY = touchY;
      });
    }
  }

  private handleMovement(): void {
    if (this.gameState !== 'playing') return;

    // Mobile joystick movement
    if (this.isMobile && this.joystickActive) {
      this.playerX += this.joystickX * this.playerSpeed;
      this.playerY += this.joystickY * this.playerSpeed;
      this.playerX = Math.max(0, Math.min(this.canvas!.width - this.playerWidth, this.playerX));
      this.playerY = Math.max(0, Math.min(this.canvas!.height - this.playerHeight, this.playerY));
    } else {
      // Keyboard movement
      if (this.keys.has('ArrowLeft') || this.keys.has('a')) {
        this.playerX = Math.max(0, this.playerX - this.playerSpeed);
      }
      if (this.keys.has('ArrowRight') || this.keys.has('d')) {
        this.playerX = Math.min(this.canvas!.width - this.playerWidth, this.playerX + this.playerSpeed);
      }
      if (this.keys.has('ArrowUp') || this.keys.has('w')) {
        this.playerY = Math.max(0, this.playerY - this.playerSpeed);
      }
      if (this.keys.has('ArrowDown') || this.keys.has('s')) {
        this.playerY = Math.min(this.canvas!.height - this.playerHeight, this.playerY + this.playerSpeed);
      }

      // Mouse movement (follow cursor)
      if (!this.isMobile && this.mouseX && this.mouseY) {
        const targetX = this.mouseX - this.playerWidth / 2;
        const targetY = this.mouseY - this.playerHeight / 2;
        const dx = targetX - this.playerX;
        const dy = targetY - this.playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 5) {
          this.playerX += (dx / distance) * this.playerSpeed * 0.8;
          this.playerY += (dy / distance) * this.playerSpeed * 0.8;
          this.playerX = Math.max(0, Math.min(this.canvas!.width - this.playerWidth, this.playerX));
          this.playerY = Math.max(0, Math.min(this.canvas!.height - this.playerHeight, this.playerY));
        }
      }
    }

    // Auto-shoot
    if (this.keys.has(' ') || (this.isMobile && this.autoFire)) {
      this.shoot();
    }
  }

  private shoot(): void {
    if (this.gameState !== 'playing') return;
    
    const now = Date.now();
    const cooldown = this.rapidFire ? this.shootCooldown / 3 : this.shootCooldown;
    
    if (now - this.lastShot > cooldown) {
      if (this.laserBeam) {
        // Continuous laser beam (visual effect only, damage in collision detection)
        this.bullets.push({
          x: this.playerX + this.playerWidth / 2 - 10,
          y: 0,
          width: 20,
          height: this.playerY,
          speed: 0,
          damage: 100,
          type: 'player'
        });
      } else if (this.homingMissiles) {
        // Find nearest enemy
        let nearestEnemy: Enemy | null = null;
        let minDistance = Infinity;
        this.enemies.forEach(enemy => {
          const dx = enemy.x + enemy.width / 2 - (this.playerX + this.playerWidth / 2);
          const dy = enemy.y + enemy.height / 2 - (this.playerY + this.playerHeight / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < minDistance) {
            minDistance = distance;
            nearestEnemy = enemy;
          }
        });
        
        // Homing missile
        this.bullets.push({
          x: this.playerX + this.playerWidth / 2 - 6,
          y: this.playerY,
          width: 12,
          height: 24,
          speed: 10,
          damage: 50,
          type: 'player'
        });
      } else if (this.spreadShot) {
        // Triple shot
        for (let i = -1; i <= 1; i++) {
          this.bullets.push({
            x: this.playerX + this.playerWidth / 2 - 4 + i * 10,
            y: this.playerY,
            width: 8,
            height: 20,
            speed: 12,
            damage: 25,
            type: 'player'
          });
        }
      } else {
        // Single shot
        this.bullets.push({
          x: this.playerX + this.playerWidth / 2 - 4,
          y: this.playerY,
          width: 8,
          height: 20,
          speed: 15,
          damage: 35,
          type: 'player'
        });
      }
      this.lastShot = now;
      this.playSound('shoot');
    }
  }

  private spawnEnemy(): void {
    if (this.enemiesSpawned >= this.enemiesInWave) return;

    const types = this.getEnemyTypesForWave();
    const type = types[Math.floor(Math.random() * types.length)];
    
    let enemy: Enemy;
    switch (type) {
      case 'basic':
        enemy = {
          x: Math.random() * (this.canvas!.width - 40),
          y: -50,
          width: 40,
          height: 40,
          speed: 2 + this.wave * 0.3,
          health: 50,
          maxHealth: 50,
          type: 'basic',
          pattern: 'straight',
          patternTime: 0,
          shootCooldown: 2000,
          lastShot: Date.now(),
          points: 100
        };
        break;
      case 'fast':
        enemy = {
          x: Math.random() * (this.canvas!.width - 30),
          y: -50,
          width: 30,
          height: 30,
          speed: 4 + this.wave * 0.5,
          health: 30,
          maxHealth: 30,
          type: 'fast',
          pattern: 'zigzag',
          patternTime: 0,
          shootCooldown: 3000,
          lastShot: Date.now(),
          points: 150
        };
        break;
      case 'tank':
        enemy = {
          x: Math.random() * (this.canvas!.width - 60),
          y: -80,
          width: 60,
          height: 60,
          speed: 1 + this.wave * 0.2,
          health: 150,
          maxHealth: 150,
          type: 'tank',
          pattern: 'straight',
          patternTime: 0,
          shootCooldown: 1500,
          lastShot: Date.now(),
          points: 300
        };
        break;
      default:
        enemy = {
          x: this.canvas!.width / 2 - 50,
          y: -100,
          width: 100,
          height: 80,
          speed: 0.5,
          health: 500 + this.wave * 50,
          maxHealth: 500 + this.wave * 50,
          type: 'boss',
          pattern: 'circle',
          patternTime: 0,
          shootCooldown: 800,
          lastShot: Date.now(),
          points: 1000
        };
    }
    
    this.enemies.push(enemy);
    this.enemiesSpawned++;
  }

  private getEnemyTypesForWave(): ('basic' | 'fast' | 'tank' | 'boss')[] {
    if (this.wave < 3) return ['basic'];
    if (this.wave < 5) return ['basic', 'fast'];
    if (this.wave < 8) return ['basic', 'fast', 'tank'];
    if (this.wave % 5 === 0) return ['boss'];
    return ['basic', 'fast', 'tank'];
  }

  private updateBullets(): void {
    this.bullets = this.bullets.filter(bullet => {
      if (bullet.velocityX !== undefined && bullet.velocityY !== undefined) {
        // Bullets with custom velocity (circular patterns)
        bullet.x += bullet.velocityX;
        bullet.y += bullet.velocityY;
      } else if (bullet.type === 'player') {
        bullet.y -= bullet.speed;
      } else {
        bullet.y += bullet.speed;
      }
      
      // Remove off-screen bullets
      return bullet.x > -20 && bullet.x < this.canvas!.width + 20 &&
             bullet.y > -20 && bullet.y < this.canvas!.height + 20;
    });
  }

  private updateEnemies(deltaTime: number): void {
    this.enemies = this.enemies.filter(enemy => {
      enemy.patternTime += deltaTime;
      
      // Update movement based on pattern
      switch (enemy.pattern) {
        case 'straight':
          enemy.y += enemy.speed;
          break;
        case 'zigzag':
          enemy.y += enemy.speed;
          enemy.x += Math.sin(enemy.patternTime * 0.003) * 3;
          break;
        case 'circle':
          enemy.y += enemy.speed * 0.5;
          enemy.x = this.canvas!.width / 2 + Math.sin(enemy.patternTime * 0.002) * 200 - enemy.width / 2;
          break;
        case 'dive':
          enemy.y += enemy.speed * 2;
          if (enemy.y > this.canvas!.height / 2) {
            enemy.pattern = 'straight';
          }
          break;
      }
      
      // Enemy shooting
      const now = Date.now();
      if (now - enemy.lastShot > enemy.shootCooldown && enemy.y > 0) {
        this.enemyShoot(enemy);
        enemy.lastShot = now;
      }
      
      // Remove off-screen enemies
      return enemy.y < this.canvas!.height + 50;
    });
  }

  private enemyShoot(enemy: Enemy): void {
    if (enemy.type === 'boss') {
      // Determine boss phase based on health
      const healthPercent = enemy.health / enemy.maxHealth;
      if (healthPercent > 0.7) {
        enemy.bossPhase = 1;
      } else if (healthPercent > 0.4) {
        enemy.bossPhase = 2;
      } else {
        enemy.bossPhase = 3;
      }

      switch (enemy.bossPhase) {
        case 1:
          // Phase 1: Basic spread shot
          for (let i = -2; i <= 2; i++) {
            this.bullets.push({
              x: enemy.x + enemy.width / 2 - 4 + i * 15,
              y: enemy.y + enemy.height,
              width: 6,
              height: 15,
              speed: 5,
              damage: 20,
              type: 'enemy'
            });
          }
          break;
          
        case 2:
          // Phase 2: Homing missiles + spread shot
          // Spread shot
          for (let i = -1; i <= 1; i++) {
            this.bullets.push({
              x: enemy.x + enemy.width / 2 - 4 + i * 20,
              y: enemy.y + enemy.height,
              width: 6,
              height: 15,
              speed: 6,
              damage: 20,
              type: 'enemy'
            });
          }
          
          // Homing missiles (targeted at player)
          const dx = this.playerX + this.playerWidth / 2 - (enemy.x + enemy.width / 2);
          const dy = this.playerY + this.playerHeight / 2 - (enemy.y + enemy.height / 2);
          const angle = Math.atan2(dy, dx);
          
          this.bullets.push({
            x: enemy.x + enemy.width / 2 - 5,
            y: enemy.y + enemy.height,
            width: 10,
            height: 20,
            speed: 8,
            damage: 30,
            type: 'enemy'
          });
          break;
          
        case 3:
          // Phase 3: Laser beam warning + circular barrage
          if (!enemy.laserCharging) {
            enemy.laserCharging = true;
            enemy.laserTimer = Date.now();
          }
          
          // Circular barrage
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 3;
            this.bullets.push({
              x: enemy.x + enemy.width / 2 - 4,
              y: enemy.y + enemy.height / 2,
              width: 8,
              height: 8,
              speed: speed,
              damage: 25,
              type: 'enemy',
              velocityX: Math.cos(angle) * speed,
              velocityY: Math.sin(angle) * speed
            });
          }
          break;
      }
    } else {
      // Regular enemy single shot
      this.bullets.push({
        x: enemy.x + enemy.width / 2 - 3,
        y: enemy.y + enemy.height,
        width: 6,
        height: 15,
        speed: 4 + enemy.speed * 0.5,
        damage: 15,
        type: 'enemy'
      });
    }
  }

  private checkCollisions(): void {
    // Player bullets vs enemies
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (bullet.type === 'player') {
        let bulletHit = false;
        
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          if (this.isColliding(bullet, enemy)) {
            enemy.health -= bullet.damage;
            this.createHitParticles(bullet.x + bullet.width / 2, bullet.y);
            bulletHit = true;
            
            if (enemy.health <= 0) {
              this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.type === 'boss' ? 50 : 20);
              this.score += enemy.points;
              this.enemies.splice(j, 1);
              this.playSound('explosion');
              
              // Update achievements
              this.totalKills++;
              this.updateAchievement('first_blood');
              this.updateAchievement('centurion');
              
              if (enemy.type === 'boss') {
                this.bossKills++;
                this.updateAchievement('boss_slayer');
              }
              
              // Combo tracking
              const now = Date.now();
              if (now - this.lastKillTime < 2000) {
                this.currentCombo++;
                if (this.currentCombo > this.maxCombo) {
                  this.maxCombo = this.currentCombo;
                  if (this.currentCombo >= 10) {
                    this.updateAchievement('combo_master');
                  }
                }
              } else {
                this.currentCombo = 1;
              }
              this.lastKillTime = now;
              
              // Chance to drop power-up
              if (Math.random() < 0.2) {
                this.spawnPowerUp(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
              }
            } else {
              this.playSound('hit');
            }
            break; // One bullet can only hit one enemy
          }
        }
        
        if (bulletHit) {
          this.bullets.splice(i, 1);
        }
      }
    }

    // Enemy bullets vs player
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      if (bullet.type === 'enemy' && !this.shield) {
        const player = {
          x: this.playerX,
          y: this.playerY,
          width: this.playerWidth,
          height: this.playerHeight
        };
        
        if (this.isColliding(bullet, player)) {
          this.playerHealth -= bullet.damage;
          this.damageTaken += bullet.damage;
          this.createHitParticles(bullet.x + bullet.width / 2, bullet.y);
          this.bullets.splice(i, 1);
          this.playSound('hurt');
          
          if (this.playerHealth <= 0) {
            this.gameOver();
          }
        }
      }
    }

    // Player vs enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      const player = {
        x: this.playerX,
        y: this.playerY,
        width: this.playerWidth,
        height: this.playerHeight
      };
      
      if (this.isColliding(enemy, player) && !this.shield) {
        this.playerHealth -= 30;
        this.damageTaken += 30;
        enemy.health = 0;
        this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 20);
        this.enemies.splice(i, 1);
        this.playSound('hurt');
        
        if (this.playerHealth <= 0) {
          this.gameOver();
        }
      }
    }

    // Player vs power-ups
    this.powerUps = this.powerUps.filter(powerUp => {
      const player = {
        x: this.playerX,
        y: this.playerY,
        width: this.playerWidth,
        height: this.playerHeight
      };
      
      if (this.isColliding(powerUp, player)) {
        this.activatePowerUp(powerUp);
        this.updateAchievement('power_collector');
        return false;
      }
      return true;
    });
  }

  private isColliding(a: {x: number, y: number, width: number, height: number}, 
                      b: {x: number, y: number, width: number, height: number}): boolean {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  }

  private spawnPowerUp(x: number, y: number): void {
    const types: PowerUp['type'][] = ['rapidfire', 'spread', 'shield', 'health', 'laser', 'homing', 'timeslow'];
    const weights = [20, 20, 15, 20, 10, 10, 5]; // Rarity weights
    
    // Weighted random selection
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let type: PowerUp['type'] = 'health';
    
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        type = types[i];
        break;
      }
    }
    
    this.powerUps.push({
      x: x - 15,
      y: y - 15,
      width: 30,
      height: 30,
      type,
      duration: type === 'health' ? 0 : type === 'timeslow' ? 3000 : 5000
    });
  }

  private activatePowerUp(powerUp: PowerUp): void {
    // Reset all power-ups before activating new one
    this.rapidFire = false;
    this.spreadShot = false;
    this.shield = false;
    this.laserBeam = false;
    this.homingMissiles = false;
    this.timeSlow = false;
    
    switch (powerUp.type) {
      case 'rapidfire':
        this.rapidFire = true;
        this.powerUpTimer = powerUp.duration;
        break;
      case 'spread':
        this.spreadShot = true;
        this.powerUpTimer = powerUp.duration;
        break;
      case 'shield':
        this.shield = true;
        this.powerUpTimer = powerUp.duration;
        break;
      case 'laser':
        this.laserBeam = true;
        this.powerUpTimer = powerUp.duration;
        break;
      case 'homing':
        this.homingMissiles = true;
        this.powerUpTimer = powerUp.duration;
        break;
      case 'timeslow':
        this.timeSlow = true;
        this.timeSlowFactor = 0.3;
        this.powerUpTimer = powerUp.duration;
        break;
      case 'health':
        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 50);
        break;
    }
    this.playSound('powerup');
  }

  private updatePowerUps(deltaTime: number): void {
    if (this.powerUpTimer > 0) {
      this.powerUpTimer -= deltaTime;
      if (this.powerUpTimer <= 0) {
        this.rapidFire = false;
        this.spreadShot = false;
        this.shield = false;
        this.laserBeam = false;
        this.homingMissiles = false;
        this.timeSlow = false;
        this.timeSlowFactor = 1;
      }
    }
    
    // Move power-ups down
    this.powerUps = this.powerUps.filter(powerUp => {
      powerUp.y += 2;
      return powerUp.y < this.canvas!.height + 30;
    });
  }

  private createHitParticles(x: number, y: number): void {
    const colors = this.currentTheme.colors;
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        size: Math.random() * 3 + 1,
        life: 1,
        color: colors.warning
      });
    }
  }

  private createExplosion(x: number, y: number, particleCount: number): void {
    const colors = this.currentTheme.colors;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        life: 1,
        color: Math.random() > 0.5 ? colors.primary : colors.accent
      });
    }
  }

  private updateGameParticles(deltaTime: number): void {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2; // gravity
      particle.life -= deltaTime / 1000;
      particle.size *= 0.98;
      return particle.life > 0 && particle.size > 0.5;
    });
  }

  private updateStars(): void {
    this.stars.forEach(star => {
      star.y += star.speed;
      if (star.y > this.canvas!.height) {
        star.y = -10;
        star.x = Math.random() * this.canvas!.width;
      }
    });
  }

  private checkWaveComplete(): void {
    if (!this.waveComplete && this.enemies.length === 0 && this.enemiesSpawned >= this.enemiesInWave) {
      this.waveComplete = true;
      this.gameState = 'waveComplete';
      this.checkWaveAchievements();
      setTimeout(() => {
        if (this.gameState === 'waveComplete') {
          this.nextWave();
        }
      }, 3000);
    }
  }

  private nextWave(): void {
    this.wave++;
    this.enemiesInWave = Math.floor(5 + this.wave * 2);
    this.enemiesSpawned = 0;
    this.waveComplete = false;
    this.enemySpawnDelay = Math.max(500, 2000 - this.wave * 100);
    this.gameState = 'playing';
    this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + 25); // Health bonus
  }

  private togglePause(): void {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      if (this.bgmGainNode) {
        this.bgmGainNode.gain.exponentialRampToValueAtTime(0.01, (this.audioContext?.currentTime || 0) + 0.1);
      }
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      if (this.bgmGainNode && this.audioContext) {
        this.bgmGainNode.gain.exponentialRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
      }
    }
  }

  private gameOver(): void {
    this.gameState = 'gameover';
    this.createExplosion(this.playerX + this.playerWidth / 2, this.playerY + this.playerHeight / 2, 50);
    this.playSound('gameover');
    
    // Save high score
    const highScore = parseInt(localStorage.getItem('spaceshooter-highscore') || '0');
    if (this.score > highScore) {
      localStorage.setItem('spaceshooter-highscore', this.score.toString());
    }
  }

  private restartGame(): void {
    this.playerHealth = this.playerMaxHealth;
    this.score = 0;
    this.wave = 1;
    this.enemiesInWave = 5;
    this.enemiesSpawned = 0;
    this.waveComplete = false;
    this.bullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.particles = [];
    this.rapidFire = false;
    this.spreadShot = false;
    this.shield = false;
    this.powerUpTimer = 0;
    this.gameState = 'playing';
    this.playerX = this.canvas!.width / 2 - this.playerWidth / 2;
    this.playerY = this.canvas!.height - this.playerHeight - 20;
  }

  protected update(deltaTime: number): void {
    if (!this.canvas || !this.ctx) return;
    
    if (this.gameState === 'playing') {
      // Apply time slow effect
      const effectiveDelta = this.timeSlow ? deltaTime * this.timeSlowFactor : deltaTime;
      
      this.handleMovement();
      this.updateBullets();
      this.updateEnemies(effectiveDelta * 1000); // Convert back to milliseconds
      this.updatePowerUps(deltaTime * 1000); // Power-ups timer not affected by time slow
      this.updateGameParticles(effectiveDelta * 1000);
      this.updateStars();
      this.updateBackgroundObjects();
      this.checkCollisions();
      this.checkWaveComplete();
      
      // Spawn enemies (also affected by time slow)
      const spawnDelay = this.timeSlow ? this.enemySpawnDelay / this.timeSlowFactor : this.enemySpawnDelay;
      if (Date.now() - this.enemySpawnTimer > spawnDelay && !this.waveComplete) {
        this.spawnEnemy();
        this.enemySpawnTimer = Date.now();
      }
    } else if (this.gameState === 'paused') {
      // Just update visuals
      this.updateStars();
    }
  }

  protected draw(): void {
    this.render();
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;
    
    const colors = this.currentTheme.colors;
    
    // Clear and background
    this.ctx.fillStyle = colors.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Stars
    this.ctx.fillStyle = colors.textSecondary;
    this.stars.forEach(star => {
      this.ctx!.globalAlpha = star.opacity;
      this.ctx!.fillRect(star.x, star.y, star.size, star.size);
    });
    this.ctx.globalAlpha = 1;
    
    // Background objects
    this.renderBackgroundObjects();
    
    // Power-ups
    this.powerUps.forEach(powerUp => {
      this.ctx!.save();
      this.ctx!.translate(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
      this.ctx!.rotate(Date.now() * 0.002);
      
      switch (powerUp.type) {
        case 'rapidfire':
          this.ctx!.fillStyle = colors.warning;
          break;
        case 'spread':
          this.ctx!.fillStyle = colors.info;
          break;
        case 'shield':
          this.ctx!.fillStyle = colors.success;
          break;
        case 'health':
          this.ctx!.fillStyle = colors.error;
          break;
        case 'laser':
          this.ctx!.fillStyle = '#FF00FF';
          this.ctx!.shadowBlur = 10;
          this.ctx!.shadowColor = '#FF00FF';
          break;
        case 'homing':
          this.ctx!.fillStyle = '#00FFFF';
          this.ctx!.shadowBlur = 10;
          this.ctx!.shadowColor = '#00FFFF';
          break;
        case 'timeslow':
          this.ctx!.fillStyle = '#FFFFFF';
          this.ctx!.shadowBlur = 15;
          this.ctx!.shadowColor = '#FFFFFF';
          break;
      }
      
      this.ctx!.fillRect(-powerUp.width / 2, -powerUp.height / 2, powerUp.width, powerUp.height);
      this.ctx!.shadowBlur = 0;
      this.ctx!.restore();
    });
    
    // Player
    if (this.gameState !== 'gameover') {
      this.ctx.save();
      
      // Shield effect
      if (this.shield) {
        this.ctx.strokeStyle = colors.success;
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.5 + Math.sin(Date.now() * 0.005) * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(
          this.playerX + this.playerWidth / 2,
          this.playerY + this.playerHeight / 2,
          Math.max(this.playerWidth, this.playerHeight) * 0.7,
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
      }
      
      // Draw spaceship
      this.ctx.fillStyle = colors.primary;
      this.ctx.beginPath();
      this.ctx.moveTo(this.playerX + this.playerWidth / 2, this.playerY);
      this.ctx.lineTo(this.playerX, this.playerY + this.playerHeight);
      this.ctx.lineTo(this.playerX + this.playerWidth / 2, this.playerY + this.playerHeight * 0.7);
      this.ctx.lineTo(this.playerX + this.playerWidth, this.playerY + this.playerHeight);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Cockpit
      this.ctx.fillStyle = colors.accent;
      this.ctx.beginPath();
      this.ctx.arc(
        this.playerX + this.playerWidth / 2,
        this.playerY + this.playerHeight * 0.3,
        this.playerWidth * 0.15,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      
      this.ctx.restore();
    }
    
    // Enemies
    this.enemies.forEach(enemy => {
      this.ctx!.save();
      
      // Enemy ship
      switch (enemy.type) {
        case 'basic':
          this.ctx!.fillStyle = colors.error;
          this.ctx!.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          break;
        case 'fast':
          this.ctx!.fillStyle = colors.warning;
          this.ctx!.beginPath();
          this.ctx!.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
          this.ctx!.lineTo(enemy.x, enemy.y);
          this.ctx!.lineTo(enemy.x + enemy.width, enemy.y);
          this.ctx!.closePath();
          this.ctx!.fill();
          break;
        case 'tank':
          this.ctx!.fillStyle = colors.surface;
          this.ctx!.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          this.ctx!.strokeStyle = colors.error;
          this.ctx!.lineWidth = 3;
          this.ctx!.strokeRect(enemy.x, enemy.y, enemy.width, enemy.height);
          break;
        case 'boss':
          // Boss gradient
          const gradient = this.ctx!.createLinearGradient(enemy.x, enemy.y, enemy.x, enemy.y + enemy.height);
          
          // Different colors based on phase
          if (enemy.bossPhase === 3) {
            // Phase 3 - Red/Purple gradient with glow
            gradient.addColorStop(0, '#FF00FF');
            gradient.addColorStop(1, '#FF0000');
            
            // Glow effect
            this.ctx!.shadowBlur = 20;
            this.ctx!.shadowColor = '#FF00FF';
          } else if (enemy.bossPhase === 2) {
            // Phase 2 - Orange/Red gradient
            gradient.addColorStop(0, colors.warning);
            gradient.addColorStop(1, colors.error);
          } else {
            // Phase 1 - Normal
            gradient.addColorStop(0, colors.error);
            gradient.addColorStop(1, colors.warning);
          }
          
          this.ctx!.fillStyle = gradient;
          this.ctx!.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
          
          // Boss details
          this.ctx!.fillStyle = colors.background;
          this.ctx!.fillRect(enemy.x + enemy.width * 0.2, enemy.y + enemy.height * 0.3, enemy.width * 0.2, enemy.height * 0.4);
          this.ctx!.fillRect(enemy.x + enemy.width * 0.6, enemy.y + enemy.height * 0.3, enemy.width * 0.2, enemy.height * 0.4);
          
          // Reset shadow
          this.ctx!.shadowBlur = 0;
          
          // Laser charging indicator
          if (enemy.laserCharging && enemy.laserTimer) {
            const chargeTime = Date.now() - enemy.laserTimer;
            if (chargeTime < 2000) { // 2 seconds charge time
              const chargePercent = chargeTime / 2000;
              this.ctx!.strokeStyle = `rgba(255, 0, 0, ${chargePercent})`;
              this.ctx!.lineWidth = 5;
              this.ctx!.beginPath();
              this.ctx!.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height);
              this.ctx!.lineTo(enemy.x + enemy.width / 2, this.canvas!.height);
              this.ctx!.stroke();
            }
          }
          break;
      }
      
      // Health bar for damaged enemies
      if (enemy.health < enemy.maxHealth) {
        this.ctx!.fillStyle = colors.error;
        this.ctx!.fillRect(enemy.x, enemy.y - 10, enemy.width, 4);
        this.ctx!.fillStyle = colors.success;
        this.ctx!.fillRect(enemy.x, enemy.y - 10, enemy.width * (enemy.health / enemy.maxHealth), 4);
      }
      
      this.ctx!.restore();
    });
    
    // Bullets
    this.bullets.forEach(bullet => {
      if (bullet.type === 'player') {
        // Check for laser beam
        if (bullet.speed === 0 && bullet.damage === 100) {
          // Laser beam effect
          const gradient = this.ctx!.createLinearGradient(
            bullet.x, this.playerY,
            bullet.x, 0
          );
          gradient.addColorStop(0, '#FF00FF');
          gradient.addColorStop(0.5, '#FF88FF');
          gradient.addColorStop(1, '#FFFFFF');
          this.ctx!.fillStyle = gradient;
          this.ctx!.globalAlpha = 0.8;
          this.ctx!.shadowBlur = 20;
          this.ctx!.shadowColor = '#FF00FF';
          this.ctx!.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
          this.ctx!.shadowBlur = 0;
          this.ctx!.globalAlpha = 1;
        } else {
          // Normal player bullets
          const gradient = this.ctx!.createLinearGradient(
            bullet.x, bullet.y + bullet.height,
            bullet.x, bullet.y
          );
          gradient.addColorStop(0, colors.primary);
          gradient.addColorStop(1, colors.accent);
          this.ctx!.fillStyle = gradient;
          this.ctx!.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        }
      } else {
        this.ctx!.fillStyle = colors.error;
        this.ctx!.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      }
    });
    
    // Particles
    this.particles.forEach(particle => {
      this.ctx!.globalAlpha = particle.life;
      this.ctx!.fillStyle = particle.color;
      this.ctx!.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size);
    });
    this.ctx.globalAlpha = 1;
    
    // UI
    this.renderUI();
    
    // Achievement notifications
    this.renderAchievements();
    
    // Game state overlays
    if (this.gameState === 'paused') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = colors.text;
      this.ctx.font = 'bold 48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Press P to continue', this.canvas.width / 2, this.canvas.height / 2 + 40);
    } else if (this.gameState === 'gameover') {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = colors.error;
      this.ctx.font = 'bold 48px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.fillStyle = colors.text;
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Final Score: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
      this.ctx.fillText('Press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 80);
    } else if (this.gameState === 'waveComplete') {
      this.ctx.fillStyle = colors.success;
      this.ctx.font = 'bold 36px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Wave ${this.wave - 1} Complete!`, this.canvas.width / 2, this.canvas.height / 2);
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Get ready for Wave ${this.wave}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
    }
  }

  private renderUI(): void {
    const colors = this.currentTheme;
    
    // Score
    this.ctx!.fillStyle = colors.text;
    this.ctx!.font = 'bold 20px Arial';
    this.ctx!.textAlign = 'left';
    this.ctx!.fillText(`Score: ${this.score}`, 10, 30);
    this.ctx!.fillText(`Wave: ${this.wave}`, 10, 55);
    
    // Health bar
    const healthBarWidth = 200;
    const healthBarHeight = 20;
    const healthBarX = this.canvas!.width - healthBarWidth - 10;
    const healthBarY = 10;
    
    this.ctx!.fillStyle = colors.surface;
    this.ctx!.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    const healthPercentage = this.playerHealth / this.playerMaxHealth;
    const healthColor = healthPercentage > 0.5 ? colors.success : healthPercentage > 0.25 ? colors.warning : colors.error;
    this.ctx!.fillStyle = healthColor;
    this.ctx!.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercentage, healthBarHeight);
    
    this.ctx!.strokeStyle = colors.text;
    this.ctx!.lineWidth = 2;
    this.ctx!.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    
    // Power-up indicator
    if (this.powerUpTimer > 0) {
      let powerUpText = '';
      if (this.rapidFire) powerUpText = 'RAPID FIRE';
      else if (this.spreadShot) powerUpText = 'SPREAD SHOT';
      else if (this.shield) powerUpText = 'SHIELD';
      else if (this.laserBeam) powerUpText = 'LASER BEAM';
      else if (this.homingMissiles) powerUpText = 'HOMING MISSILES';
      else if (this.timeSlow) powerUpText = 'TIME SLOW';
      
      const timerWidth = 180;
      const timerX = this.canvas!.width / 2 - timerWidth / 2;
      const timerY = 10;
      
      this.ctx!.fillStyle = colors.surface;
      this.ctx!.fillRect(timerX, timerY, timerWidth, 25);
      
      this.ctx!.fillStyle = colors.info;
      this.ctx!.fillRect(timerX, timerY, timerWidth * (this.powerUpTimer / 5000), 25);
      
      this.ctx!.strokeStyle = colors.text;
      this.ctx!.strokeRect(timerX, timerY, timerWidth, 25);
      
      this.ctx!.fillStyle = colors.text;
      this.ctx!.font = 'bold 14px Arial';
      this.ctx!.textAlign = 'center';
      this.ctx!.fillText(powerUpText, this.canvas!.width / 2, timerY + 18);
    }
    
    // High score
    const highScore = parseInt(localStorage.getItem('spaceshooter-highscore') || '0');
    this.ctx!.fillStyle = colors.textSecondary;
    this.ctx!.font = '16px Arial';
    this.ctx!.textAlign = 'right';
    this.ctx!.fillText(`High Score: ${highScore}`, this.canvas!.width - 10, this.canvas!.height - 10);
  }

  private playSound(type: string): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    switch (type) {
      case 'shoot':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;

      case 'explosion':
        // Create noise for explosion
        const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();
        
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);
        
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(3000, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.2);
        
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        noiseSource.start(now);
        noiseSource.stop(now + 0.3);
        break;

      case 'hit':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;

      case 'hurt':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;

      case 'powerup':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        
        // Second tone
        const osc2 = this.audioContext.createOscillator();
        const gain2 = this.audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(this.audioContext.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, now + 0.05);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        gain2.gain.setValueAtTime(0.15, now + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.2);
        break;

      case 'gameover':
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
    }
  }

  protected cleanup(): void {
    this.stopBackgroundMusic();
    if (this.controlsContainer) {
      this.controlsContainer.remove();
      this.controlsContainer = null;
    }
    
    // Remove event listeners properly
    if (this.boundKeyDown) {
      window.removeEventListener('keydown', this.boundKeyDown);
      this.boundKeyDown = null;
    }
    if (this.boundKeyUp) {
      window.removeEventListener('keyup', this.boundKeyUp);
      this.boundKeyUp = null;
    }
    
    // Reset game state
    this.bullets = [];
    this.enemies = [];
    this.powerUps = [];
    this.particles = [];
    this.backgroundObjects = [];
  }

  private initAchievements(): void {
    this.achievements = [
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Destroy your first enemy',
        requirement: 1,
        progress: 0,
        unlocked: false
      },
      {
        id: 'centurion',
        name: 'Centurion',
        description: 'Destroy 100 enemies',
        requirement: 100,
        progress: 0,
        unlocked: false
      },
      {
        id: 'boss_slayer',
        name: 'Boss Slayer',
        description: 'Defeat your first boss',
        requirement: 1,
        progress: 0,
        unlocked: false
      },
      {
        id: 'untouchable',
        name: 'Untouchable',
        description: 'Complete a wave without taking damage',
        requirement: 1,
        progress: 0,
        unlocked: false
      },
      {
        id: 'combo_master',
        name: 'Combo Master',
        description: 'Achieve a 10x kill combo',
        requirement: 10,
        progress: 0,
        unlocked: false
      },
      {
        id: 'wave_10',
        name: 'Wave Warrior',
        description: 'Reach wave 10',
        requirement: 10,
        progress: 0,
        unlocked: false
      },
      {
        id: 'power_collector',
        name: 'Power Collector',
        description: 'Collect 20 power-ups',
        requirement: 20,
        progress: 0,
        unlocked: false
      }
    ];

    // Load saved progress
    this.loadAchievements();
  }

  private loadAchievements(): void {
    const saved = localStorage.getItem('spaceshooter-achievements');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.achievements.forEach(achievement => {
          if (data[achievement.id]) {
            achievement.progress = data[achievement.id].progress || 0;
            achievement.unlocked = data[achievement.id].unlocked || false;
          }
        });
      } catch (e) {
        // Invalid data, start fresh
      }
    }
  }

  private saveAchievements(): void {
    const data: any = {};
    this.achievements.forEach(achievement => {
      data[achievement.id] = {
        progress: achievement.progress,
        unlocked: achievement.unlocked
      };
    });
    localStorage.setItem('spaceshooter-achievements', JSON.stringify(data));
  }

  private updateAchievement(id: string, progress: number = 1): void {
    const achievement = this.achievements.find(a => a.id === id);
    if (achievement && !achievement.unlocked) {
      achievement.progress = Math.min(achievement.progress + progress, achievement.requirement);
      
      if (achievement.progress >= achievement.requirement) {
        achievement.unlocked = true;
        this.newUnlocks.push(achievement);
        this.saveAchievements();
        this.playSound('powerup'); // Special sound for achievement
      }
    }
  }

  private checkWaveAchievements(): void {
    // Untouchable achievement
    if (this.damageTaken === 0) {
      this.updateAchievement('untouchable');
    }
    
    // Wave achievement
    if (this.wave >= 10) {
      this.updateAchievement('wave_10');
    }
    
    // Reset damage taken for next wave
    this.damageTaken = 0;
  }

  private startBackgroundMusic(): void {
    if (!this.audioContext || this.isBgmPlaying) return;
    
    this.bgmGainNode = this.audioContext.createGain();
    this.bgmGainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    this.bgmGainNode.connect(this.audioContext.destination);
    
    // Bass line - 저음 베이스 라인
    const bass = this.createBassLine();
    
    // Melody - 멜로디 라인
    const melody = this.createMelodyLine();
    
    // Ambient pad - 분위기 패드
    const pad = this.createAmbientPad();
    
    this.bgmOscillators = [bass, melody, pad];
    this.isBgmPlaying = true;
  }

  private createBassLine(): OscillatorNode {
    if (!this.audioContext || !this.bgmGainNode) throw new Error('Audio context not initialized');
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.bgmGainNode);
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    
    // Bass pattern
    const bassNotes = [55, 55, 55, 55, 58.27, 58.27, 58.27, 58.27]; // A1, A1, A1, A1, Bb1, Bb1, Bb1, Bb1
    const startTime = this.audioContext.currentTime;
    
    let noteTime = startTime;
    for (let i = 0; i < 100; i++) { // Loop for ~2 minutes
      for (const note of bassNotes) {
        oscillator.frequency.setValueAtTime(note, noteTime);
        noteTime += 0.25; // 16th notes
      }
    }
    
    oscillator.start(startTime);
    return oscillator;
  }

  private createMelodyLine(): OscillatorNode {
    if (!this.audioContext || !this.bgmGainNode) throw new Error('Audio context not initialized');
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'square';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.bgmGainNode);
    
    gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    
    // Mysterious space melody
    const melodyNotes = [
      0, 220, 0, 233.08, 0, 246.94, 0, 220, // Silence, A3, silence, Bb3, silence, B3, silence, A3
      0, 196, 0, 220, 0, 196, 0, 174.61     // Silence, G3, silence, A3, silence, G3, silence, F3
    ];
    const startTime = this.audioContext.currentTime;
    
    let noteTime = startTime;
    for (let i = 0; i < 50; i++) { // Loop
      for (const note of melodyNotes) {
        if (note === 0) {
          gainNode.gain.setValueAtTime(0, noteTime);
        } else {
          gainNode.gain.setValueAtTime(0.15, noteTime);
          oscillator.frequency.setValueAtTime(note, noteTime);
        }
        noteTime += 0.5; // 8th notes
      }
    }
    
    oscillator.start(startTime);
    return oscillator;
  }

  private createAmbientPad(): OscillatorNode {
    if (!this.audioContext || !this.bgmGainNode) throw new Error('Audio context not initialized');
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'triangle';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
    filter.Q.setValueAtTime(10, this.audioContext.currentTime);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.bgmGainNode);
    
    // Slow LFO for ambient effect
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.setValueAtTime(0.1, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime(50, this.audioContext.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime); // A2
    
    oscillator.start(this.audioContext.currentTime);
    return oscillator;
  }

  private stopBackgroundMusic(): void {
    if (!this.isBgmPlaying) return;
    
    this.bgmOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    
    if (this.bgmGainNode) {
      this.bgmGainNode.disconnect();
      this.bgmGainNode = null;
    }
    
    this.bgmOscillators = [];
    this.isBgmPlaying = false;
  }

  private spawnBackgroundObject(): void {
    const types: BackgroundObject['type'][] = ['planet', 'asteroid', 'station'];
    const weights = [30, 60, 10]; // More asteroids, fewer stations
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    let type: BackgroundObject['type'] = 'asteroid';
    
    for (let i = 0; i < types.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        type = types[i];
        break;
      }
    }
    
    let obj: BackgroundObject;
    switch (type) {
      case 'planet':
        obj = {
          type: 'planet',
          x: Math.random() * this.canvas!.width,
          y: -200,
          size: 80 + Math.random() * 120,
          speed: 0.3 + Math.random() * 0.5,
          rotation: Math.random() * Math.PI * 2,
          color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][Math.floor(Math.random() * 5)]
        };
        break;
      case 'asteroid':
        obj = {
          type: 'asteroid',
          x: Math.random() * this.canvas!.width,
          y: -50,
          size: 20 + Math.random() * 40,
          speed: 1 + Math.random() * 2,
          rotation: Math.random() * Math.PI * 2
        };
        break;
      case 'station':
        obj = {
          type: 'station',
          x: Math.random() * this.canvas!.width,
          y: -150,
          size: 100 + Math.random() * 50,
          speed: 0.5,
          rotation: 0
        };
        break;
    }
    
    this.backgroundObjects.push(obj);
  }

  private updateBackgroundObjects(): void {
    this.backgroundObjects = this.backgroundObjects.filter(obj => {
      obj.y += obj.speed;
      obj.rotation += 0.01;
      return obj.y < this.canvas!.height + 200;
    });
    
    // Spawn new objects occasionally
    if (Math.random() < 0.01) {
      this.spawnBackgroundObject();
    }
  }

  private renderBackgroundObjects(): void {
    if (!this.ctx) return;
    const colors = this.currentTheme.colors;
    
    this.backgroundObjects.forEach(obj => {
      this.ctx!.save();
      this.ctx!.translate(obj.x, obj.y);
      this.ctx!.rotate(obj.rotation);
      
      switch (obj.type) {
        case 'planet':
          // Planet with gradient
          const gradient = this.ctx!.createRadialGradient(0, 0, 0, 0, 0, obj.size / 2);
          gradient.addColorStop(0, obj.color || colors.primary);
          gradient.addColorStop(1, this.adjustColor(obj.color || colors.primary, -50));
          this.ctx!.fillStyle = gradient;
          this.ctx!.globalAlpha = 0.7;
          this.ctx!.beginPath();
          this.ctx!.arc(0, 0, obj.size / 2, 0, Math.PI * 2);
          this.ctx!.fill();
          
          // Ring for some planets
          if (Math.random() > 0.7) {
            this.ctx!.strokeStyle = colors.textSecondary;
            this.ctx!.globalAlpha = 0.3;
            this.ctx!.lineWidth = 5;
            this.ctx!.beginPath();
            this.ctx!.ellipse(0, 0, obj.size * 0.8, obj.size * 0.3, 0, 0, Math.PI * 2);
            this.ctx!.stroke();
          }
          break;
          
        case 'asteroid':
          // Irregular asteroid shape
          this.ctx!.fillStyle = colors.textSecondary;
          this.ctx!.globalAlpha = 0.5;
          this.ctx!.beginPath();
          const points = 8;
          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = obj.size / 2 + Math.sin(i * 3) * obj.size * 0.2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) {
              this.ctx!.moveTo(x, y);
            } else {
              this.ctx!.lineTo(x, y);
            }
          }
          this.ctx!.closePath();
          this.ctx!.fill();
          break;
          
        case 'station':
          // Space station
          this.ctx!.fillStyle = colors.surface;
          this.ctx!.globalAlpha = 0.6;
          
          // Main body
          this.ctx!.fillRect(-obj.size / 2, -obj.size / 6, obj.size, obj.size / 3);
          
          // Solar panels
          this.ctx!.fillStyle = colors.info;
          this.ctx!.fillRect(-obj.size * 0.8, -obj.size / 12, obj.size * 0.25, obj.size / 6);
          this.ctx!.fillRect(obj.size * 0.55, -obj.size / 12, obj.size * 0.25, obj.size / 6);
          
          // Lights
          this.ctx!.fillStyle = colors.warning;
          for (let i = 0; i < 5; i++) {
            const x = -obj.size / 2 + (i + 0.5) * (obj.size / 5);
            this.ctx!.fillRect(x - 2, -obj.size / 12, 4, 4);
          }
          break;
      }
      
      this.ctx!.restore();
    });
    
    this.ctx!.globalAlpha = 1;
  }

  private adjustColor(color: string, amount: number): string {
    // Simple color adjustment function
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, ((num >> 16) & 0xFF) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0xFF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0xFF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  private renderAchievements(): void {
    const colors = this.currentTheme.colors;
    
    // Show new unlock notifications
    if (this.newUnlocks.length > 0) {
      const achievement = this.newUnlocks[0];
      const timeSinceUnlock = 3000; // Show for 3 seconds
      
      // Achievement popup
      const popupWidth = 300;
      const popupHeight = 80;
      const popupX = this.canvas!.width / 2 - popupWidth / 2;
      const popupY = 100;
      
      this.ctx!.save();
      
      // Background with glow
      this.ctx!.shadowBlur = 20;
      this.ctx!.shadowColor = colors.warning;
      this.ctx!.fillStyle = colors.surface;
      this.ctx!.fillRect(popupX, popupY, popupWidth, popupHeight);
      
      // Border
      this.ctx!.strokeStyle = colors.warning;
      this.ctx!.lineWidth = 3;
      this.ctx!.strokeRect(popupX, popupY, popupWidth, popupHeight);
      
      // Trophy icon
      this.ctx!.fillStyle = colors.warning;
      this.ctx!.font = '30px Arial';
      this.ctx!.fillText('🏆', popupX + 20, popupY + 45);
      
      // Text
      this.ctx!.fillStyle = colors.text;
      this.ctx!.font = 'bold 18px Arial';
      this.ctx!.fillText('ACHIEVEMENT UNLOCKED!', popupX + 70, popupY + 30);
      this.ctx!.font = '16px Arial';
      this.ctx!.fillText(achievement.name, popupX + 70, popupY + 50);
      this.ctx!.font = '12px Arial';
      this.ctx!.fillStyle = colors.textSecondary;
      this.ctx!.fillText(achievement.description, popupX + 70, popupY + 65);
      
      this.ctx!.restore();
      
      // Remove after display time
      setTimeout(() => {
        this.newUnlocks.shift();
      }, timeSinceUnlock);
    }
    
    // Show combo counter
    if (this.currentCombo > 1) {
      this.ctx!.save();
      this.ctx!.fillStyle = colors.warning;
      this.ctx!.font = 'bold 24px Arial';
      this.ctx!.textAlign = 'left';
      this.ctx!.fillText(`${this.currentCombo}x COMBO!`, 10, 85);
      this.ctx!.restore();
    }
  }

  private renderAchievementList(): void {
    // This could be called from a menu or pause screen
    const colors = this.currentTheme.colors;
    const startY = 100;
    const itemHeight = 60;
    
    this.achievements.forEach((achievement, index) => {
      const y = startY + index * itemHeight;
      
      // Background
      this.ctx!.fillStyle = achievement.unlocked ? colors.surface : 'rgba(128, 128, 128, 0.3)';
      this.ctx!.fillRect(100, y, 600, 50);
      
      // Icon
      this.ctx!.fillStyle = achievement.unlocked ? colors.warning : colors.textSecondary;
      this.ctx!.font = '30px Arial';
      this.ctx!.fillText(achievement.unlocked ? '🏆' : '🔒', 110, y + 35);
      
      // Name and description
      this.ctx!.fillStyle = achievement.unlocked ? colors.text : colors.textSecondary;
      this.ctx!.font = 'bold 16px Arial';
      this.ctx!.fillText(achievement.name, 160, y + 20);
      this.ctx!.font = '14px Arial';
      this.ctx!.fillText(achievement.description, 160, y + 38);
      
      // Progress bar
      if (!achievement.unlocked) {
        const barWidth = 100;
        const barX = 580;
        const progress = achievement.progress / achievement.requirement;
        
        this.ctx!.fillStyle = colors.surface;
        this.ctx!.fillRect(barX, y + 20, barWidth, 10);
        this.ctx!.fillStyle = colors.success;
        this.ctx!.fillRect(barX, y + 20, barWidth * progress, 10);
        
        this.ctx!.font = '12px Arial';
        this.ctx!.fillStyle = colors.textSecondary;
        this.ctx!.textAlign = 'center';
        this.ctx!.fillText(`${achievement.progress}/${achievement.requirement}`, barX + barWidth / 2, y + 15);
      }
    });
  }
}