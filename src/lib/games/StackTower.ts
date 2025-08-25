interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  moving?: boolean;
  direction?: number;
  speed?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

export default class StackTower {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  
  // Canvas dimensions
  private WIDTH = 480;
  private HEIGHT = 854;
  
  // Game state
  private blocks: Block[] = [];
  private currentBlock: Block | null = null;
  private score: number = 0;
  private combo: number = 0;
  private gameOver: boolean = false;
  private gameStarted: boolean = false;
  private particles: Particle[] = [];
  
  // Game settings
  private blockHeight: number = 50;
  private baseWidth: number = 200;
  private moveSpeed: number = 3;
  private perfectMargin: number = 5;
  private cameraY: number = 0;
  private targetCameraY: number = 0;
  
  // Colors
  private colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
  ];
  
  // Audio context for sounds
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.width = this.WIDTH;
    this.canvas.height = this.HEIGHT;
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = '480px';
    this.canvas.style.height = 'auto';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.display = 'block';
    this.canvas.style.borderRadius = '8px';
    this.canvas.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  }

  mount(container: HTMLElement): void {
    this.container = container;
    
    // Clear any existing content
    container.innerHTML = '';
    
    container.appendChild(this.canvas);
    
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.setupEventListeners();
    this.initGame();
    this.gameLoop();
  }

  private setupEventListeners(): void {
    this.handleClick = this.handleClick.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('touchstart', this.handleTouchStart);
  }
  
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.handleClick();
  }

  private handleClick(): void {
    if (!this.gameStarted) {
      this.gameStarted = true;
      this.spawnNewBlock();
    } else if (this.gameOver) {
      this.initGame();
    } else if (this.currentBlock) {
      this.dropBlock();
    }
  }

  private initGame(): void {
    this.blocks = [];
    this.score = 0;
    this.combo = 0;
    this.gameOver = false;
    this.gameStarted = false;
    this.particles = [];
    this.moveSpeed = 3;
    this.cameraY = 0;
    this.targetCameraY = 0;
    
    // Create base block
    this.blocks.push({
      x: this.WIDTH / 2 - this.baseWidth / 2,
      y: this.HEIGHT - 100,
      width: this.baseWidth,
      height: this.blockHeight,
      color: this.colors[0]
    });
  }

  private spawnNewBlock(): void {
    if (this.gameOver) return;
    
    const lastBlock = this.blocks[this.blocks.length - 1];
    const colorIndex = this.blocks.length % this.colors.length;
    
    this.currentBlock = {
      x: -this.baseWidth,
      y: lastBlock.y - this.blockHeight - 1,
      width: lastBlock.width,
      height: this.blockHeight,
      color: this.colors[colorIndex],
      moving: true,
      direction: 1,
      speed: this.moveSpeed
    };
    
    // Increase speed every 5 blocks
    if (this.blocks.length % 5 === 0) {
      this.moveSpeed = Math.min(this.moveSpeed + 0.5, 8);
    }
  }

  private dropBlock(): void {
    if (!this.currentBlock || !this.currentBlock.moving) return;
    
    this.currentBlock.moving = false;
    const lastBlock = this.blocks[this.blocks.length - 1];
    
    // Calculate overlap
    const overlapLeft = Math.max(this.currentBlock.x, lastBlock.x);
    const overlapRight = Math.min(
      this.currentBlock.x + this.currentBlock.width,
      lastBlock.x + lastBlock.width
    );
    const overlapWidth = overlapRight - overlapLeft;
    
    if (overlapWidth <= 0) {
      // No overlap - game over
      this.gameOver = true;
      this.playSound('fail');
      return;
    }
    
    // Check for perfect placement
    const isPerfect = Math.abs(this.currentBlock.x - lastBlock.x) <= this.perfectMargin &&
                      Math.abs(this.currentBlock.width - lastBlock.width) <= this.perfectMargin;
    
    if (isPerfect) {
      // Perfect placement!
      this.combo++;
      this.score += 50 * this.combo;
      this.playSound('perfect');
      this.createPerfectEffect(this.currentBlock);
      
      // Keep full width for perfect placement
      this.currentBlock.x = lastBlock.x;
      this.currentBlock.width = lastBlock.width;
    } else {
      // Cut off hanging parts
      const hangingLeft = overlapLeft - this.currentBlock.x;
      const hangingRight = (this.currentBlock.x + this.currentBlock.width) - overlapRight;
      
      // Create falling pieces
      if (hangingLeft > 0) {
        this.createFallingPiece(
          this.currentBlock.x,
          this.currentBlock.y,
          hangingLeft,
          this.currentBlock.height,
          this.currentBlock.color
        );
      }
      
      if (hangingRight > 0) {
        this.createFallingPiece(
          overlapRight,
          this.currentBlock.y,
          hangingRight,
          this.currentBlock.height,
          this.currentBlock.color
        );
      }
      
      // Update block position and width
      this.currentBlock.x = overlapLeft;
      this.currentBlock.width = overlapWidth;
      this.combo = 0;
      this.score += 10;
      this.playSound('place');
    }
    
    this.blocks.push(this.currentBlock);
    this.currentBlock = null;
    
    // Update camera
    if (this.blocks.length > 5) {
      this.targetCameraY = (this.blocks.length - 5) * (this.blockHeight + 1);
    }
    
    // Spawn next block
    setTimeout(() => this.spawnNewBlock(), 300);
  }

  private createFallingPiece(x: number, y: number, width: number, height: number, color: string): void {
    // Create particles for falling piece
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x + Math.random() * width,
        y: y + Math.random() * height,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        size: Math.random() * 5 + 3,
        color: color,
        life: 1
      });
    }
  }

  private createPerfectEffect(block: Block): void {
    const centerX = block.x + block.width / 2;
    const centerY = block.y + block.height / 2;
    
    // Create starburst effect
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 5 + Math.random() * 3;
      
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: '#FFD700', // Gold color
        life: 1
      });
    }
  }

  private updateParticles(): void {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.3; // Gravity
      particle.life -= 0.02;
      particle.size *= 0.98;
      
      return particle.life > 0 && particle.size > 0.5;
    });
  }

  private gameLoop = (): void => {
    this.update();
    this.draw();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update(): void {
    // Update current block position
    if (this.currentBlock && this.currentBlock.moving) {
      this.currentBlock.x += this.currentBlock.speed! * this.currentBlock.direction!;
      
      // Bounce off edges
      if (this.currentBlock.x <= 0 || 
          this.currentBlock.x + this.currentBlock.width >= this.WIDTH) {
        this.currentBlock.direction! *= -1;
        this.currentBlock.x = Math.max(0, 
          Math.min(this.WIDTH - this.currentBlock.width, this.currentBlock.x));
      }
    }
    
    // Update camera
    this.cameraY += (this.targetCameraY - this.cameraY) * 0.1;
    
    // Update particles
    this.updateParticles();
  }

  private draw(): void {
    const ctx = this.ctx;
    
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    
    // Save context state
    ctx.save();
    
    // Apply camera transform
    ctx.translate(0, this.cameraY);
    
    // Draw blocks
    this.blocks.forEach((block, index) => {
      // Create gradient for block
      const blockGradient = ctx.createLinearGradient(
        block.x, block.y, 
        block.x + block.width, block.y + block.height
      );
      blockGradient.addColorStop(0, block.color);
      blockGradient.addColorStop(1, this.adjustBrightness(block.color, -20));
      
      ctx.fillStyle = blockGradient;
      ctx.fillRect(block.x, block.y, block.width, block.height);
      
      // Add highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(block.x, block.y, block.width, 4);
      
      // Add shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(block.x, block.y + block.height - 4, block.width, 4);
    });
    
    // Draw current block
    if (this.currentBlock) {
      const blockGradient = ctx.createLinearGradient(
        this.currentBlock.x, this.currentBlock.y,
        this.currentBlock.x + this.currentBlock.width, this.currentBlock.y + this.currentBlock.height
      );
      blockGradient.addColorStop(0, this.currentBlock.color);
      blockGradient.addColorStop(1, this.adjustBrightness(this.currentBlock.color, -20));
      
      ctx.fillStyle = blockGradient;
      ctx.fillRect(this.currentBlock.x, this.currentBlock.y, 
                   this.currentBlock.width, this.currentBlock.height);
      
      // Add highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(this.currentBlock.x, this.currentBlock.y, this.currentBlock.width, 4);
    }
    
    // Draw particles
    this.particles.forEach(particle => {
      ctx.globalAlpha = particle.life;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    
    // Restore context state
    ctx.restore();
    
    // Draw UI
    this.drawUI();
  }

  private drawUI(): void {
    const ctx = this.ctx;
    
    // Score background
    const scoreGradient = ctx.createLinearGradient(0, 0, 0, 100);
    scoreGradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
    scoreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = scoreGradient;
    ctx.fillRect(0, 0, this.WIDTH, 100);
    
    // Score
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.score.toString(), this.WIDTH / 2, 50);
    
    // Combo
    if (this.combo > 0) {
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`COMBO x${this.combo}`, this.WIDTH / 2, 80);
    }
    
    // Start/Game Over screen
    if (!this.gameStarted || this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      
      if (!this.gameStarted) {
        ctx.fillText('STACK TOWER', this.WIDTH / 2, this.HEIGHT / 2 - 50);
        ctx.font = '24px Arial';
        ctx.fillText('Tap to Start', this.WIDTH / 2, this.HEIGHT / 2 + 20);
        
        // Instructions
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Stack the blocks perfectly!', this.WIDTH / 2, this.HEIGHT / 2 + 80);
      } else if (this.gameOver) {
        ctx.fillText('GAME OVER', this.WIDTH / 2, this.HEIGHT / 2 - 50);
        ctx.font = '28px Arial';
        ctx.fillText(`Score: ${this.score}`, this.WIDTH / 2, this.HEIGHT / 2 + 20);
        
        const highScore = this.getHighScore();
        if (this.score > highScore) {
          ctx.fillStyle = '#FFD700';
          ctx.font = '24px Arial';
          ctx.fillText('NEW RECORD!', this.WIDTH / 2, this.HEIGHT / 2 + 60);
          this.saveHighScore();
        } else {
          ctx.font = '20px Arial';
          ctx.fillStyle = '#ccc';
          ctx.fillText(`Best: ${highScore}`, this.WIDTH / 2, this.HEIGHT / 2 + 60);
        }
        
        ctx.font = '20px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('Tap to Play Again', this.WIDTH / 2, this.HEIGHT / 2 + 120);
      }
    }
  }

  private adjustBrightness(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private playSound(type: 'place' | 'perfect' | 'fail'): void {
    if (!this.audioCtx) return;
    
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    switch (type) {
      case 'place':
        oscillator.frequency.value = 400;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.1);
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.1);
        break;
        
      case 'perfect':
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.3);
        
        // Add harmony
        const oscillator2 = this.audioCtx.createOscillator();
        oscillator2.frequency.value = 1200;
        oscillator2.connect(gainNode);
        oscillator2.start();
        oscillator2.stop(this.audioCtx.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.3);
        break;
        
      case 'fail':
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(0.4, this.audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
        oscillator.start();
        oscillator.stop(this.audioCtx.currentTime + 0.5);
        break;
    }
  }

  private getHighScore(): number {
    return parseInt(localStorage.getItem('stack-tower-highscore') || '0');
  }

  private saveHighScore(): void {
    localStorage.setItem('stack-tower-highscore', this.score.toString());
  }

  unmount(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    if (this.audioCtx) {
      this.audioCtx.close();
    }
    if (this.container && this.container.contains(this.canvas)) {
      this.container.removeChild(this.canvas);
    }
  }
}