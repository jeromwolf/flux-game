// Types
interface Action {
  frame: number;
  type: 'keydown' | 'keyup';
  key: string;
}

interface Recording {
  actions: Action[];
  duration: number;
  color: string;
}

interface Ghost {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  recording: Recording;
  currentActionIndex: number;
  frameOffset: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'moving' | 'disappearing';
  moveSpeed?: number;
  moveRange?: number;
  initialX?: number;
}

interface Switch {
  x: number;
  y: number;
  width: number;
  height: number;
  id: number;
  activated: boolean;
  needsWeight: boolean; // Some switches need continuous pressure
  activatedBy: string[]; // Track who activated it
}

interface Door {
  x: number;
  y: number;
  width: number;
  height: number;
  switchId: number;
  open: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export default class TimeLoop {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  
  // Game state
  private gameState: 'menu' | 'playing' | 'recording' | 'replaying' | 'victory' | 'gameOver' = 'menu';
  private currentLoop = 0;
  private maxLoops = 4;
  private timeLeft = 10; // 10 seconds per loop
  private score = 0;
  private level = 1;
  private levelCompleted = false;
  
  // Player state
  private player = {
    x: 50,
    y: 300,
    vx: 0,
    vy: 0,
    width: 30,
    height: 30,
    color: '#00ff88',
    isJumping: false,
    actions: [] as Action[]
  };
  
  // Past loops recordings
  private recordings: Recording[] = [];
  private ghosts: Ghost[] = [];
  
  // Level elements
  private platforms: Platform[] = [];
  private switches: Switch[] = [];
  private doors: Door[] = [];
  private goal = { x: 700, y: 300, width: 40, height: 40, reached: false };
  
  // Controls
  private keys: { [key: string]: boolean } = {};
  private frameCount = 0;
  private recordingStartFrame = 0;
  
  // Animation
  private animationFrame: number | null = null;
  private lastTime = 0;
  private particles: Particle[] = [];
  
  // Audio
  private audioContext: AudioContext | null = null;
  private language = 'en';
  
  mount(container: HTMLElement) {
    this.container = container;
    this.language = localStorage.getItem('language') || 'en';
    this.initializeGame();
  }
  
  unmount() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.removeEventListeners();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
  
  private initializeGame() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.style.maxWidth = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.display = 'block';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.backgroundColor = '#0a0a0a';
    this.container?.appendChild(this.canvas);
    
    this.ctx = this.canvas.getContext('2d');
    
    // Initialize audio
    this.audioContext = new AudioContext();
    
    // Create UI
    this.createUI();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Load first level
    this.loadLevel(1);
    
    // Start game loop
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  private createUI() {
    const ui = document.createElement('div');
    ui.style.position = 'absolute';
    ui.style.top = '10px';
    ui.style.left = '50%';
    ui.style.transform = 'translateX(-50%)';
    ui.style.color = 'white';
    ui.style.fontFamily = 'monospace';
    ui.style.fontSize = '16px';
    ui.style.textAlign = 'center';
    ui.style.userSelect = 'none';
    ui.id = 'time-loop-ui';
    
    this.updateUI();
    this.container?.appendChild(ui);
  }
  
  private updateUI() {
    const ui = document.getElementById('time-loop-ui');
    if (!ui) return;
    
    const texts = {
      en: {
        level: 'Level',
        loop: 'Loop',
        time: 'Time',
        score: 'Score',
        menu: 'SPACE to Start',
        recording: 'Recording...',
        replaying: 'Replaying with past selves'
      },
      ko: {
        level: '레벨',
        loop: '루프',
        time: '시간',
        score: '점수',
        menu: '스페이스 키로 시작',
        recording: '녹화 중...',
        replaying: '과거의 자신들과 함께 플레이'
      }
    };
    
    const t = texts[this.language === 'ko' ? 'ko' : 'en'];
    
    if (this.gameState === 'menu') {
      ui.innerHTML = `<div style="font-size: 24px; margin-bottom: 10px;">⏰ Time Loop</div>
                      <div>${t.menu}</div>`;
    } else if (this.gameState === 'victory') {
      ui.innerHTML = `<div style="font-size: 24px; color: #00ff88;">Victory!</div>
                      <div>${t.score}: ${this.score}</div>`;
    } else {
      const stateText = this.gameState === 'recording' ? t.recording : 
                       this.gameState === 'replaying' ? t.replaying : '';
      
      ui.innerHTML = `
        <div style="display: flex; gap: 20px; align-items: center;">
          <div>${t.level}: ${this.level}</div>
          <div>${t.loop}: ${this.currentLoop + 1}/${this.maxLoops}</div>
          <div style="color: ${this.timeLeft < 3 ? '#ff6b6b' : 'white'}">
            ${t.time}: ${this.timeLeft.toFixed(1)}s
          </div>
          <div>${t.score}: ${this.score}</div>
        </div>
        <div style="font-size: 12px; margin-top: 5px; color: #00ff88">${stateText}</div>
      `;
    }
  }
  
  private loadLevel(level: number) {
    this.level = level;
    this.currentLoop = 0;
    this.recordings = [];
    this.ghosts = [];
    this.levelCompleted = false;
    
    // Clear level elements
    this.platforms = [];
    this.switches = [];
    this.doors = [];
    
    // Level designs
    if (level === 1) {
      // Tutorial level - simple switch and door
      this.platforms = [
        { x: 0, y: 400, width: 300, height: 200, type: 'normal' },
        { x: 400, y: 450, width: 100, height: 150, type: 'normal' },
        { x: 600, y: 400, width: 200, height: 200, type: 'normal' }
      ];
      
      this.switches = [
        { x: 450, y: 420, width: 30, height: 30, id: 1, activated: false, 
          needsWeight: true, activatedBy: [] }
      ];
      
      this.doors = [
        { x: 650, y: 300, width: 20, height: 100, switchId: 1, open: false }
      ];
      
      this.goal = { x: 720, y: 360, width: 40, height: 40, reached: false };
      
    } else if (level === 2) {
      // Two switches need to be pressed simultaneously
      this.platforms = [
        { x: 0, y: 400, width: 200, height: 200, type: 'normal' },
        { x: 250, y: 500, width: 100, height: 100, type: 'normal' },
        { x: 450, y: 500, width: 100, height: 100, type: 'normal' },
        { x: 600, y: 400, width: 200, height: 200, type: 'normal' },
        { x: 300, y: 300, width: 200, height: 20, type: 'normal' }
      ];
      
      this.switches = [
        { x: 280, y: 470, width: 30, height: 30, id: 1, activated: false, 
          needsWeight: true, activatedBy: [] },
        { x: 480, y: 470, width: 30, height: 30, id: 2, activated: false, 
          needsWeight: true, activatedBy: [] }
      ];
      
      this.doors = [
        { x: 390, y: 200, width: 20, height: 100, switchId: 1, open: false },
        { x: 680, y: 300, width: 20, height: 100, switchId: 2, open: false }
      ];
      
      this.goal = { x: 720, y: 360, width: 40, height: 40, reached: false };
      
    } else if (level === 3) {
      // Moving platforms and timing puzzles
      this.platforms = [
        { x: 0, y: 400, width: 150, height: 200, type: 'normal' },
        { x: 200, y: 450, width: 80, height: 20, type: 'moving', 
          moveSpeed: 2, moveRange: 150, initialX: 200 },
        { x: 450, y: 350, width: 80, height: 20, type: 'moving', 
          moveSpeed: -1.5, moveRange: 100, initialX: 450 },
        { x: 650, y: 400, width: 150, height: 200, type: 'normal' }
      ];
      
      this.switches = [
        { x: 350, y: 300, width: 30, height: 30, id: 1, activated: false, 
          needsWeight: false, activatedBy: [] }
      ];
      
      this.doors = [
        { x: 700, y: 250, width: 20, height: 150, switchId: 1, open: false }
      ];
      
      this.goal = { x: 740, y: 360, width: 40, height: 40, reached: false };
    }
    
    // Reset player position
    this.player.x = 50;
    this.player.y = 300;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isJumping = false;
  }
  
  private setupEventListeners() {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && this.gameState === 'menu') {
        this.startGame();
        return;
      }
      
      if (this.gameState === 'recording' || this.gameState === 'replaying') {
        this.keys[e.key] = true;
        
        if (this.gameState === 'recording') {
          this.player.actions.push({
            frame: this.frameCount - this.recordingStartFrame,
            type: 'keydown',
            key: e.key
          });
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (this.gameState === 'recording' || this.gameState === 'replaying') {
        this.keys[e.key] = false;
        
        if (this.gameState === 'recording') {
          this.player.actions.push({
            frame: this.frameCount - this.recordingStartFrame,
            type: 'keyup',
            key: e.key
          });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Touch controls
    let touchStartX = 0;
    let touchStartY = 0;
    
    this.canvas?.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      
      // Jump on tap
      if (this.gameState === 'recording' || this.gameState === 'replaying') {
        this.keys['ArrowUp'] = true;
        if (this.gameState === 'recording') {
          this.player.actions.push({
            frame: this.frameCount - this.recordingStartFrame,
            type: 'keydown',
            key: 'ArrowUp'
          });
        }
      } else if (this.gameState === 'menu') {
        this.startGame();
      }
    });
    
    this.canvas?.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      
      if (Math.abs(dx) > 30) {
        if (dx > 0) {
          this.keys['ArrowLeft'] = false;
          this.keys['ArrowRight'] = true;
        } else {
          this.keys['ArrowRight'] = false;
          this.keys['ArrowLeft'] = true;
        }
      }
    });
    
    this.canvas?.addEventListener('touchend', () => {
      Object.keys(this.keys).forEach(key => {
        if (this.keys[key] && this.gameState === 'recording') {
          this.player.actions.push({
            frame: this.frameCount - this.recordingStartFrame,
            type: 'keyup',
            key: key
          });
        }
        this.keys[key] = false;
      });
    });
  }
  
  private removeEventListeners() {
    // Remove keyboard event listeners
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  }
  
  private startGame() {
    this.gameState = 'recording';
    this.currentLoop = 0;
    this.timeLeft = 10;
    this.recordingStartFrame = this.frameCount;
    this.player.actions = [];
    this.playSound('start');
  }
  
  private startNewLoop() {
    if (this.currentLoop < this.maxLoops - 1) {
      // Save current recording
      const ghostColors = ['#ff6b6b', '#4ecdc4', '#45aaf2', '#f7b731'];
      this.recordings.push({
        actions: [...this.player.actions],
        duration: 10,
        color: ghostColors[this.currentLoop % ghostColors.length]
      });
      
      // Create ghosts from recordings
      this.createGhosts();
      
      // Reset for new loop
      this.currentLoop++;
      this.timeLeft = 10;
      this.player.x = 50;
      this.player.y = 300;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.actions = [];
      this.recordingStartFrame = this.frameCount;
      
      // Reset level state
      this.resetLevelState();
      
      this.gameState = this.currentLoop === 0 ? 'recording' : 'replaying';
      this.playSound('loop');
    } else {
      this.gameState = 'gameOver';
      this.playSound('gameover');
    }
  }
  
  private createGhosts() {
    this.ghosts = [];
    
    for (const recording of this.recordings) {
      this.ghosts.push({
        x: 50,
        y: 300,
        vx: 0,
        vy: 0,
        color: recording.color,
        recording: recording,
        currentActionIndex: 0,
        frameOffset: this.frameCount
      });
    }
  }
  
  private resetLevelState() {
    // Reset switches and doors
    this.switches.forEach(sw => {
      sw.activated = false;
      sw.activatedBy = [];
    });
    
    this.doors.forEach(door => {
      door.open = false;
    });
    
    // Reset moving platforms
    this.platforms.forEach(platform => {
      if (platform.type === 'moving' && platform.initialX !== undefined) {
        platform.x = platform.initialX;
      }
    });
    
    this.goal.reached = false;
  }
  
  private gameLoop = () => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    this.animationFrame = requestAnimationFrame(this.gameLoop);
  };
  
  private update(deltaTime: number) {
    if (this.gameState === 'menu' || this.gameState === 'gameOver' || this.gameState === 'victory') {
      return;
    }
    
    this.frameCount++;
    
    // Update timer
    if (this.gameState === 'recording' || this.gameState === 'replaying') {
      this.timeLeft -= deltaTime;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.startNewLoop();
        return;
      }
    }
    
    // Update player
    this.updatePlayer(deltaTime);
    
    // Update ghosts
    this.updateGhosts(deltaTime);
    
    // Update level elements
    this.updatePlatforms(deltaTime);
    this.updateSwitches();
    this.updateDoors();
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Check goal
    if (this.checkGoalReached()) {
      if (this.level < 3) {
        this.level++;
        this.score += 1000 * this.level;
        this.loadLevel(this.level);
        this.playSound('levelComplete');
      } else {
        this.gameState = 'victory';
        this.score += 5000;
        this.playSound('victory');
      }
    }
    
    this.updateUI();
  }
  
  private updatePlayer(deltaTime: number) {
    // Apply controls
    if (this.keys['ArrowLeft']) {
      this.player.vx = -200;
    } else if (this.keys['ArrowRight']) {
      this.player.vx = 200;
    } else {
      this.player.vx *= 0.8; // Friction
    }
    
    if (this.keys['ArrowUp'] && !this.player.isJumping) {
      this.player.vy = -400;
      this.player.isJumping = true;
      this.playSound('jump');
    }
    
    // Apply gravity
    this.player.vy += 800 * deltaTime;
    
    // Update position
    this.player.x += this.player.vx * deltaTime;
    this.player.y += this.player.vy * deltaTime;
    
    // Keep player in bounds
    this.player.x = Math.max(0, Math.min(this.canvas!.width - this.player.width, this.player.x));
    
    // Platform collision
    this.handlePlatformCollision(this.player);
    
    // Create trail particles
    if (Math.abs(this.player.vx) > 50) {
      this.createParticle(
        this.player.x + this.player.width / 2,
        this.player.y + this.player.height,
        -this.player.vx * 0.1,
        0,
        this.player.color
      );
    }
  }
  
  private updateGhosts(deltaTime: number) {
    for (const ghost of this.ghosts) {
      const recording = ghost.recording;
      const currentFrame = this.frameCount - ghost.frameOffset;
      
      // Apply recorded actions
      while (ghost.currentActionIndex < recording.actions.length) {
        const action = recording.actions[ghost.currentActionIndex];
        if (action.frame <= currentFrame) {
          // Create a ghost-specific keys object
          const ghostKeys: { [key: string]: boolean } = {};
          
          if (action.type === 'keydown') {
            ghostKeys[action.key] = true;
          } else {
            ghostKeys[action.key] = false;
          }
          
          // Apply movement based on ghost's keys
          if (action.key === 'ArrowLeft') {
            ghost.vx = ghostKeys['ArrowLeft'] ? -200 : ghost.vx * 0.8;
          } else if (action.key === 'ArrowRight') {
            ghost.vx = ghostKeys['ArrowRight'] ? 200 : ghost.vx * 0.8;
          } else if (action.key === 'ArrowUp' && action.type === 'keydown') {
            const isOnGround = this.platforms.some(platform => 
              ghost.y + 30 === platform.y &&
              ghost.x + 30 > platform.x &&
              ghost.x < platform.x + platform.width
            );
            
            if (isOnGround) {
              ghost.vy = -400;
            }
          }
          
          ghost.currentActionIndex++;
        } else {
          break;
        }
      }
      
      // Update ghost physics
      if (!ghostKeys || (!ghostKeys['ArrowLeft'] && !ghostKeys['ArrowRight'])) {
        ghost.vx *= 0.8;
      }
      
      ghost.vy += 800 * deltaTime;
      ghost.x += ghost.vx * deltaTime;
      ghost.y += ghost.vy * deltaTime;
      
      // Bounds and collision
      ghost.x = Math.max(0, Math.min(this.canvas!.width - 30, ghost.x));
      this.handlePlatformCollision(ghost);
      
      // Ghost trail
      if (Math.abs(ghost.vx) > 50) {
        this.createParticle(
          ghost.x + 15,
          ghost.y + 30,
          -ghost.vx * 0.05,
          0,
          ghost.color + '40'
        );
      }
    }
  }
  
  private handlePlatformCollision(entity: any) {
    let isOnGround = false;
    
    for (const platform of this.platforms) {
      // Check collision
      if (entity.x < platform.x + platform.width &&
          entity.x + (entity.width || 30) > platform.x &&
          entity.y < platform.y + platform.height &&
          entity.y + (entity.height || 30) > platform.y) {
        
        // Calculate overlap
        const overlapLeft = (entity.x + (entity.width || 30)) - platform.x;
        const overlapRight = (platform.x + platform.width) - entity.x;
        const overlapTop = (entity.y + (entity.height || 30)) - platform.y;
        const overlapBottom = (platform.y + platform.height) - entity.y;
        
        // Find smallest overlap
        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        
        // Resolve collision
        if (minOverlap === overlapTop && entity.vy > 0) {
          entity.y = platform.y - (entity.height || 30);
          entity.vy = 0;
          if (entity.isJumping !== undefined) {
            entity.isJumping = false;
          }
          isOnGround = true;
        } else if (minOverlap === overlapBottom && entity.vy < 0) {
          entity.y = platform.y + platform.height;
          entity.vy = 0;
        } else if (minOverlap === overlapLeft) {
          entity.x = platform.x - (entity.width || 30);
          entity.vx = 0;
        } else if (minOverlap === overlapRight) {
          entity.x = platform.x + platform.width;
          entity.vx = 0;
        }
      }
    }
    
    // Check ground
    if (entity.y + (entity.height || 30) >= this.canvas!.height) {
      entity.y = this.canvas!.height - (entity.height || 30);
      entity.vy = 0;
      if (entity.isJumping !== undefined) {
        entity.isJumping = false;
      }
      isOnGround = true;
    }
    
    return isOnGround;
  }
  
  private updatePlatforms(deltaTime: number) {
    for (const platform of this.platforms) {
      if (platform.type === 'moving' && platform.moveSpeed && platform.moveRange && platform.initialX !== undefined) {
        platform.x += platform.moveSpeed;
        
        if (platform.x < platform.initialX || platform.x > platform.initialX + platform.moveRange) {
          platform.moveSpeed = -platform.moveSpeed;
        }
      }
    }
  }
  
  private updateSwitches() {
    for (const switchObj of this.switches) {
      const wasActivated = switchObj.activated;
      switchObj.activatedBy = [];
      
      // Check player collision
      if (this.checkCollision(this.player, switchObj)) {
        switchObj.activatedBy.push('player');
      }
      
      // Check ghost collisions
      this.ghosts.forEach((ghost, index) => {
        if (this.checkCollision(ghost, switchObj)) {
          switchObj.activatedBy.push(`ghost${index}`);
        }
      });
      
      // Update activation state
      if (switchObj.needsWeight) {
        switchObj.activated = switchObj.activatedBy.length > 0;
      } else {
        // Toggle switches stay activated once pressed
        if (switchObj.activatedBy.length > 0 && !wasActivated) {
          switchObj.activated = true;
          this.playSound('switch');
        }
      }
      
      // Create particles when state changes
      if (wasActivated !== switchObj.activated) {
        for (let i = 0; i < 10; i++) {
          this.createParticle(
            switchObj.x + switchObj.width / 2,
            switchObj.y + switchObj.height / 2,
            (Math.random() - 0.5) * 200,
            -Math.random() * 200,
            switchObj.activated ? '#00ff88' : '#ff6b6b'
          );
        }
      }
    }
  }
  
  private updateDoors() {
    for (const door of this.doors) {
      const switchObj = this.switches.find(s => s.id === door.switchId);
      if (switchObj) {
        const wasOpen = door.open;
        door.open = switchObj.activated;
        
        if (wasOpen !== door.open) {
          this.playSound(door.open ? 'doorOpen' : 'doorClose');
        }
      }
    }
  }
  
  private checkCollision(entity1: any, entity2: any): boolean {
    return entity1.x < entity2.x + entity2.width &&
           entity1.x + (entity1.width || 30) > entity2.x &&
           entity1.y < entity2.y + entity2.height &&
           entity1.y + (entity1.height || 30) > entity2.y;
  }
  
  private checkGoalReached(): boolean {
    if (!this.goal.reached && this.checkCollision(this.player, this.goal)) {
      this.goal.reached = true;
      
      // Celebration particles
      for (let i = 0; i < 30; i++) {
        this.createParticle(
          this.goal.x + this.goal.width / 2,
          this.goal.y + this.goal.height / 2,
          (Math.random() - 0.5) * 400,
          -Math.random() * 400,
          `hsl(${Math.random() * 360}, 100%, 50%)`
        );
      }
      
      this.playSound('goal');
      return true;
    }
    return false;
  }
  
  private createParticle(x: number, y: number, vx: number, vy: number, color: string) {
    this.particles.push({
      x, y, vx, vy,
      life: 1,
      color,
      size: Math.random() * 4 + 2
    });
  }
  
  private updateParticles(deltaTime: number) {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.vy += 300 * deltaTime; // Gravity
      particle.life -= deltaTime * 2;
      particle.size *= 0.98;
      
      return particle.life > 0;
    });
  }
  
  private render() {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid pattern
    this.ctx.strokeStyle = '#1a1a1a';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.canvas.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }
    
    if (this.gameState === 'menu') {
      this.renderMenu();
      return;
    }
    
    // Draw platforms
    this.renderPlatforms();
    
    // Draw switches
    this.renderSwitches();
    
    // Draw doors
    this.renderDoors();
    
    // Draw goal
    this.renderGoal();
    
    // Draw particles
    this.renderParticles();
    
    // Draw ghosts
    this.renderGhosts();
    
    // Draw player
    this.renderPlayer();
    
    // Draw time loop indicator
    this.renderTimeLoopIndicator();
  }
  
  private renderMenu() {
    if (!this.ctx) return;
    
    const centerX = this.canvas!.width / 2;
    const centerY = this.canvas!.height / 2;
    
    // Title
    this.ctx.fillStyle = '#00ff88';
    this.ctx.font = 'bold 48px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⏰ TIME LOOP', centerX, centerY - 50);
    
    // Instructions
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px monospace';
    
    const instructions = this.language === 'ko' ? [
      '10초 동안의 행동을 녹화하고',
      '과거의 자신과 협력하여 퍼즐을 해결하세요!',
      '',
      '조작: ← → ↑ 키',
      '스페이스바로 시작'
    ] : [
      'Record your actions for 10 seconds',
      'Then cooperate with your past selves!',
      '',
      'Controls: ← → ↑ keys',
      'Press SPACE to start'
    ];
    
    instructions.forEach((line, index) => {
      this.ctx!.fillText(line, centerX, centerY + index * 30);
    });
  }
  
  private renderPlatforms() {
    if (!this.ctx) return;
    
    this.ctx.fillStyle = '#2a2a2a';
    this.ctx.strokeStyle = '#00ff88';
    this.ctx.lineWidth = 2;
    
    for (const platform of this.platforms) {
      this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
      this.ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
      
      // Draw movement indicators
      if (platform.type === 'moving') {
        this.ctx.fillStyle = '#00ff8840';
        this.ctx.fillRect(platform.x - 5, platform.y - 5, platform.width + 10, platform.height + 10);
        this.ctx.fillStyle = '#2a2a2a';
      }
    }
  }
  
  private renderSwitches() {
    if (!this.ctx) return;
    
    for (const switchObj of this.switches) {
      // Draw switch base
      this.ctx.fillStyle = switchObj.activated ? '#00ff88' : '#666666';
      this.ctx.fillRect(switchObj.x, switchObj.y, switchObj.width, switchObj.height);
      
      // Draw switch border
      this.ctx.strokeStyle = switchObj.activated ? '#00ff88' : '#999999';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(switchObj.x, switchObj.y, switchObj.width, switchObj.height);
      
      // Draw activation indicator
      if (switchObj.activated) {
        this.ctx.beginPath();
        this.ctx.arc(
          switchObj.x + switchObj.width / 2,
          switchObj.y + switchObj.height / 2,
          10,
          0,
          Math.PI * 2
        );
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
      }
      
      // Draw who's activating it
      if (switchObj.activatedBy.length > 0) {
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = '#00ff88';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
          switchObj.activatedBy.join('+'),
          switchObj.x + switchObj.width / 2,
          switchObj.y - 5
        );
      }
    }
  }
  
  private renderDoors() {
    if (!this.ctx) return;
    
    for (const door of this.doors) {
      if (!door.open) {
        // Draw closed door
        this.ctx.fillStyle = '#ff6b6b';
        this.ctx.fillRect(door.x, door.y, door.width, door.height);
        
        // Draw lock symbol
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🔒', door.x + door.width / 2, door.y + door.height / 2 + 5);
      } else {
        // Draw open door frame
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(door.x, door.y, door.width, door.height);
        this.ctx.setLineDash([]);
      }
    }
  }
  
  private renderGoal() {
    if (!this.ctx) return;
    
    // Draw goal with pulsing effect
    const pulse = Math.sin(Date.now() * 0.003) * 0.2 + 0.8;
    
    this.ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
    this.ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
    
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
    
    // Draw star
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '24px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⭐', this.goal.x + this.goal.width / 2, this.goal.y + this.goal.height / 2 + 8);
  }
  
  private renderParticles() {
    if (!this.ctx) return;
    
    for (const particle of this.particles) {
      this.ctx.fillStyle = particle.color;
      this.ctx.globalAlpha = particle.life;
      this.ctx.fillRect(
        particle.x - particle.size / 2,
        particle.y - particle.size / 2,
        particle.size,
        particle.size
      );
    }
    this.ctx.globalAlpha = 1;
  }
  
  private renderGhosts() {
    if (!this.ctx) return;
    
    for (const ghost of this.ghosts) {
      // Draw ghost with transparency
      this.ctx.fillStyle = ghost.color + '80';
      this.ctx.fillRect(ghost.x, ghost.y, 30, 30);
      
      // Draw ghost outline
      this.ctx.strokeStyle = ghost.color;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(ghost.x, ghost.y, 30, 30);
      
      // Draw ghost trail
      this.ctx.fillStyle = ghost.color + '20';
      for (let i = 1; i <= 3; i++) {
        this.ctx.fillRect(
          ghost.x - ghost.vx * 0.01 * i,
          ghost.y - ghost.vy * 0.01 * i,
          30,
          30
        );
      }
    }
  }
  
  private renderPlayer() {
    if (!this.ctx) return;
    
    // Draw player
    this.ctx.fillStyle = this.player.color;
    this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Draw player outline
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.player.x, this.player.y, this.player.width, this.player.height);
    
    // Draw recording indicator
    if (this.gameState === 'recording') {
      this.ctx.beginPath();
      this.ctx.arc(
        this.player.x + this.player.width / 2,
        this.player.y - 10,
        5,
        0,
        Math.PI * 2
      );
      this.ctx.fillStyle = '#ff0000';
      this.ctx.fill();
    }
  }
  
  private renderTimeLoopIndicator() {
    if (!this.ctx) return;
    
    // Draw loop timeline
    const timelineY = 30;
    const timelineWidth = 200;
    const timelineX = this.canvas!.width - timelineWidth - 20;
    
    // Background
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(timelineX - 10, timelineY - 10, timelineWidth + 20, 40);
    
    // Timeline bar
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(timelineX, timelineY, timelineWidth, 20);
    
    // Time progress
    const progress = (10 - this.timeLeft) / 10;
    this.ctx.fillStyle = '#00ff88';
    this.ctx.fillRect(timelineX, timelineY, timelineWidth * progress, 20);
    
    // Loop markers
    for (let i = 0; i <= this.currentLoop; i++) {
      const markerX = timelineX + (i / this.maxLoops) * timelineWidth;
      this.ctx.beginPath();
      this.ctx.arc(markerX, timelineY + 10, 8, 0, Math.PI * 2);
      this.ctx.fillStyle = i === this.currentLoop ? '#ffffff' : '#00ff88';
      this.ctx.fill();
      
      if (i < this.currentLoop) {
        this.ctx.font = '10px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('✓', markerX, timelineY + 14);
      }
    }
  }
  
  private playSound(type: string) {
    if (!this.audioContext) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    switch (type) {
      case 'jump':
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
        
      case 'switch':
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.linearRampToValueAtTime(1200, now + 0.05);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
        break;
        
      case 'doorOpen':
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.linearRampToValueAtTime(400, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
        
      case 'goal':
        // Victory fanfare
        const notes = [523, 659, 784, 1047]; // C, E, G, high C
        notes.forEach((freq, index) => {
          const osc = this.audioContext!.createOscillator();
          const gain = this.audioContext!.createGain();
          osc.connect(gain);
          gain.connect(this.audioContext!.destination);
          
          osc.frequency.setValueAtTime(freq, now + index * 0.1);
          gain.gain.setValueAtTime(0.2, now + index * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.1 + 0.3);
          
          osc.start(now + index * 0.1);
          osc.stop(now + index * 0.1 + 0.3);
        });
        break;
        
      case 'loop':
        // Time rewind sound
        oscillator.frequency.setValueAtTime(1000, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
        
      case 'start':
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.2);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;
    }
  }
}