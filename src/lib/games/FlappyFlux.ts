import { BaseGame } from '../core/BaseGame';

interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export default class FlappyFlux extends BaseGame {
  
  // Game objects
  private bird = {
    x: 100,
    y: 250,
    width: 34,
    height: 24,
    velocity: 0,
    gravity: 0.4,
    jumpPower: -7,
    rotation: 0
  };
  
  private pipes: Pipe[] = [];
  private particles: Particle[] = [];
  private clouds: { x: number; y: number; width: number }[] = [];
  
  // Game state
  private gameStarted: boolean = false;
  private pipeSpeed: number = 3;
  private frameCount: number = 0;
  
  // Game settings
  private readonly PIPE_WIDTH = 60;
  private readonly PIPE_GAP = 180;
  private readonly PIPE_SPACING = 250;

  constructor() {
    super({
      canvasWidth: 400,
      canvasHeight: 600,
      gameName: 'FlappyFlux'
    });
  }


  protected setupGame(): void {
    if (!this.container) return;

    this.container.innerHTML = this.createGameHTML();
        
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.config.canvasWidth;
      this.canvas.height = this.config.canvasHeight;
      this.ctx = this.canvas.getContext('2d');
      this.canvas.style.cursor = 'pointer';
    }

    // Add start screen overlay
    const overlaysContainer = document.getElementById('game-overlays');
    if (overlaysContainer) {
      overlaysContainer.innerHTML = `
        <div id="start-screen" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 100;
        ">
          <h2 style="
            font-size: 32px;
            margin-bottom: 20px;
            color: ${this.getThemeColor('text')};
          ">Ready to Fly?</h2>
          <p style="
            font-size: 18px;
            margin-bottom: 30px;
            color: ${this.getThemeColor('textSecondary')};
          ">Avoid the pipes and get the highest score!</p>
          <button onclick="window.currentGame.startGame()" style="
            padding: 15px 40px;
            font-size: 20px;
            font-weight: bold;
            color: white;
            background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Start Game</button>
        </div>
        
        <div style="
          margin-top: 20px;
          color: ${this.getThemeColor('textSecondary')};
          text-align: center;
          font-size: 14px;
        ">
          <div>Space / Click / Tap : Jump</div>
        </div>
      `;
    }

    // Event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('touchstart', this.handleTouch);

    // Store reference for restart
    (window as any).currentGame = this;
  }

  protected initialize(): void {
    this.generateClouds();
    this.gameStarted = false;
    this.score = 0;
    this.gameOver = false;
    this.bird = {
      x: 100,
      y: 250,
      width: 34,
      height: 24,
      velocity: 0,
      gravity: 0.4,
      jumpPower: -7,
      rotation: 0
    };
    this.pipes = [];
    this.particles = [];
    this.frameCount = 0;
    this.pipeSpeed = 2.5;
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('touchstart', this.handleTouch);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      this.jump();
    }
  };

  private handleClick = (e: MouseEvent) => {
    if ((e.target as HTMLElement).id === 'game-canvas') {
      this.jump();
    }
  };

  private handleTouch = (e: TouchEvent) => {
    if ((e.target as HTMLElement).id === 'game-canvas') {
      e.preventDefault();
      this.jump();
    }
  };

  private jump() {
    if (!this.gameStarted) {
      this.startGame();
      return;
    }
    
    if (this.gameOver) return;
    
    this.bird.velocity = this.bird.jumpPower;
    
    // Create jump particles
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.bird.x,
        y: this.bird.y + this.bird.height / 2,
        vx: Math.random() * 4 - 2,
        vy: Math.random() * 2 + 1,
        life: 1,
        color: this.getThemeColor('accent')
      });
    }
  }

  public startGame() {
    document.getElementById('start-screen')!.style.display = 'none';
    this.gameStarted = true;
    this.gameOver = false;
    this.score = 0;
    this.bird.y = 250;
    this.bird.velocity = 0;
    this.bird.rotation = 0;
    this.pipes = [];
    this.particles = [];
    this.frameCount = 0;
    this.pipeSpeed = 2.5;
    this.updateUI();
  }

  private generateClouds() {
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.config.canvasWidth,
        y: Math.random() * 200,
        width: 60 + Math.random() * 40
      });
    }
  }


  protected update(deltaTime: number): void {
    if (!this.gameStarted || this.gameOver) return;
    
    this.frameCount++;
    
    // Update bird
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;
    
    // Bird rotation based on velocity
    this.bird.rotation = Math.max(-30, Math.min(90, this.bird.velocity * 3));
    
    // Generate pipes
    if (this.frameCount > 60 && (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.config.canvasWidth - this.PIPE_SPACING)) {
      const minHeight = 80;
      const maxHeight = this.config.canvasHeight - this.PIPE_GAP - 80;
      const topHeight = minHeight + Math.random() * (maxHeight - minHeight);
      
      this.pipes.push({
        x: this.CANVAS_WIDTH,
        topHeight: topHeight,
        bottomY: topHeight + this.PIPE_GAP,
        passed: false
      });
    }
    
    // Update pipes
    this.pipes = this.pipes.filter(pipe => {
      pipe.x -= this.pipeSpeed;
      
      // Check if bird passed the pipe
      if (!pipe.passed && pipe.x + this.PIPE_WIDTH < this.bird.x) {
        pipe.passed = true;
        this.score++;
        this.updateUI();
        
        // Create score particles
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            x: this.bird.x + this.bird.width / 2,
            y: this.bird.y,
            vx: Math.random() * 6 - 3,
            vy: Math.random() * 6 - 3,
            life: 1,
            color: this.getThemeColor('success')
          });
        }
      }
      
      // Check collision
      if (this.checkCollision(pipe)) {
        this.endGame();
      }
      
      return pipe.x + this.PIPE_WIDTH > 0;
    });
    
    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.2;
      particle.life -= 0.02;
      return particle.life > 0;
    });
    
    // Update clouds
    this.clouds.forEach(cloud => {
      cloud.x -= 0.5;
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.config.canvasWidth;
        cloud.y = Math.random() * 200;
      }
    });
    
    // Check boundaries (with a small margin at the top)
    if (this.bird.y < -10 || this.bird.y + this.bird.height > this.config.canvasHeight) {
      this.endGame();
    }
    
    // Increase difficulty over time
    if (this.score > 0 && this.score % 5 === 0) {
      this.pipeSpeed = Math.min(5, 2.5 + (this.score / 10));
    }
  }

  private checkCollision(pipe: Pipe): boolean {
    // Add a small margin for more forgiving collision
    const margin = 2;
    const birdLeft = this.bird.x + margin;
    const birdRight = this.bird.x + this.bird.width - margin;
    const birdTop = this.bird.y + margin;
    const birdBottom = this.bird.y + this.bird.height - margin;
    
    const pipeLeft = pipe.x;
    const pipeRight = pipe.x + this.PIPE_WIDTH;
    
    if (birdRight > pipeLeft && birdLeft < pipeRight) {
      if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
        return true;
      }
    }
    
    return false;
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
    
    // Draw clouds
    this.ctx.fillStyle = this.getThemeColor('surface') + 'CC';
    this.clouds.forEach(cloud => {
      this.drawCloud(cloud.x, cloud.y, cloud.width);
    });
    
    // Draw pipes
    this.pipes.forEach(pipe => {
      // Top pipe
      const topGradient = this.ctx!.createLinearGradient(pipe.x, 0, pipe.x + this.PIPE_WIDTH, 0);
      topGradient.addColorStop(0, this.getThemeColor('success'));
      topGradient.addColorStop(0.5, this.adjustBrightness(this.getThemeColor('success'), -20));
      topGradient.addColorStop(1, this.adjustBrightness(this.getThemeColor('success'), -40));
      
      this.ctx!.fillStyle = topGradient;
      this.ctx!.fillRect(pipe.x, 0, this.PIPE_WIDTH, pipe.topHeight);
      
      // Top pipe cap
      this.ctx!.fillRect(pipe.x - 5, pipe.topHeight - 30, this.PIPE_WIDTH + 10, 30);
      
      // Bottom pipe
      this.ctx!.fillStyle = topGradient;
      this.ctx!.fillRect(pipe.x, pipe.bottomY, this.PIPE_WIDTH, this.config.canvasHeight - pipe.bottomY);
      
      // Bottom pipe cap
      this.ctx!.fillRect(pipe.x - 5, pipe.bottomY, this.PIPE_WIDTH + 10, 30);
      
      // Pipe highlights
      if (this.shouldShowEffect('shadows')) {
        this.ctx!.strokeStyle = this.adjustBrightness(this.getThemeColor('success'), -60);
        this.ctx!.lineWidth = 2;
        this.ctx!.strokeRect(pipe.x, 0, this.PIPE_WIDTH, pipe.topHeight);
        this.ctx!.strokeRect(pipe.x, pipe.bottomY, this.PIPE_WIDTH, this.config.canvasHeight - pipe.bottomY);
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
    
    // Draw bird
    if (!this.gameOver || this.frameCount % 10 < 5) {
      this.ctx.save();
      this.ctx.translate(this.bird.x + this.bird.width / 2, this.bird.y + this.bird.height / 2);
      this.ctx.rotate(this.bird.rotation * Math.PI / 180);
      
      // Bird body
      this.ctx.fillStyle = '#ffd93d';
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, this.bird.width / 2, this.bird.height / 2, 0, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Bird eye
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(10, -5, 8, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'black';
      this.ctx.beginPath();
      this.ctx.arc(12, -5, 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Bird beak
      this.ctx.fillStyle = this.adjustBrightness(this.getThemeColor('warning'), 20);
      this.ctx.beginPath();
      this.ctx.moveTo(15, 0);
      this.ctx.lineTo(25, 0);
      this.ctx.lineTo(20, 5);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Bird wing
      const wingFlap = Math.sin(this.frameCount * 0.2) * 5;
      this.ctx.fillStyle = this.adjustBrightness(this.getThemeColor('warning'), -20);
      this.ctx.beginPath();
      this.ctx.ellipse(-5, 0, 12, 8 + wingFlap, 0.3, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    }
    
    // Draw start prompt
    if (!this.gameStarted) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.font = 'bold 24px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Click to Start!', this.config.canvasWidth / 2, this.config.canvasHeight / 2);
    }
  }

  private drawCloud(x: number, y: number, width: number) {
    if (!this.ctx) return;
    
    const height = width * 0.6;
    this.ctx.beginPath();
    this.ctx.arc(x + width * 0.25, y, height * 0.5, 0, Math.PI * 2);
    this.ctx.arc(x + width * 0.5, y - height * 0.1, height * 0.6, 0, Math.PI * 2);
    this.ctx.arc(x + width * 0.75, y, height * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private updateUI() {
    document.getElementById('score')!.textContent = this.score.toString();
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
  }

  private endGame() {
    this.gameOver = true;
    this.createGameOverlay('Game Over!', this.score);
    
    // Create explosion particles
    if (this.shouldShowEffect('particles')) {
      for (let i = 0; i < 20; i++) {
        this.particles.push({
          x: this.bird.x + this.bird.width / 2,
          y: this.bird.y + this.bird.height / 2,
          vx: Math.random() * 10 - 5,
          vy: Math.random() * 10 - 5,
          life: 1,
          color: this.getThemeColor('error')
        });
      }
    }
  }

  public restart(): void {
    super.restart();
    this.gameStarted = false;
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.style.display = 'flex';
  }

  private adjustBrightness(color: string, amount: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
}