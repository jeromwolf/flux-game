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

export default class FlappyFlux {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  
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
  private score: number = 0;
  private highScore: number = 0;
  private gameStarted: boolean = false;
  private gameOver: boolean = false;
  private pipeSpeed: number = 3;
  private frameCount: number = 0;
  
  // Game settings
  private readonly CANVAS_WIDTH = 400;
  private readonly CANVAS_HEIGHT = 600;
  private readonly PIPE_WIDTH = 60;
  private readonly PIPE_GAP = 180;
  private readonly PIPE_SPACING = 250;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('flappy-flux-highscore') || '0');
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.setupGame();
    this.generateClouds();
    this.gameLoop();
  }

  unmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('click', this.handleClick);
    document.removeEventListener('touchstart', this.handleTouch);
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private setupGame() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="flappy-flux-game" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: linear-gradient(to bottom, #87CEEB, #E0F6FF);
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
          text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
        ">Flappy Flux</h1>
        
        <div class="stats" style="
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
          color: #333;
        ">
          <div style="text-align: center;">
            <div style="font-size: 18px;">Score</div>
            <div id="score" style="font-size: 32px; font-weight: bold;">${this.score}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px;">Best</div>
            <div id="highscore" style="font-size: 32px; font-weight: bold; color: #ff6b6b;">${this.highScore}</div>
          </div>
        </div>

        <canvas id="game-canvas" style="
          border: 3px solid #333;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          cursor: pointer;
        "></canvas>

        <div style="margin-top: 20px; color: #333; text-align: center;">
          <div style="font-size: 18px; font-weight: 600;">Click or Tap to Fly!</div>
          <div style="margin-top: 5px; opacity: 0.7;">Space, Click, or Tap to control</div>
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
          <h2 style="font-size: 36px; margin-bottom: 20px; color: #ff6b6b;">Game Over!</h2>
          <p style="font-size: 24px; margin-bottom: 10px;">Score: <span id="final-score">0</span></p>
          <p style="font-size: 20px; margin-bottom: 30px; color: #666;">Best: <span id="final-highscore">0</span></p>
          <button onclick="window.flappyFlux.restart()" style="
            padding: 15px 40px;
            font-size: 18px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #ff6b6b, #ffd93d);
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
          background: rgba(255, 255, 255, 0.9);
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        ">
          <h2 style="font-size: 32px; margin-bottom: 20px; color: #333;">Ready to Fly?</h2>
          <p style="font-size: 18px; margin-bottom: 30px; color: #666;">Avoid the pipes and get the highest score!</p>
          <button onclick="window.flappyFlux.startGame()" style="
            padding: 15px 40px;
            font-size: 20px;
            font-weight: bold;
            color: white;
            background: linear-gradient(135deg, #4ecdc4, #44a3aa);
            border: none;
            border-radius: 10px;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Start Game</button>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = this.CANVAS_WIDTH;
    this.canvas.height = this.CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    // Event listeners
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('click', this.handleClick);
    document.addEventListener('touchstart', this.handleTouch);

    (window as any).flappyFlux = this;
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
        color: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`
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
    this.updateStats();
  }

  private generateClouds() {
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.CANVAS_WIDTH,
        y: Math.random() * 200,
        width: 60 + Math.random() * 40
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
    
    this.frameCount++;
    
    // Update bird
    this.bird.velocity += this.bird.gravity;
    this.bird.y += this.bird.velocity;
    
    // Bird rotation based on velocity
    this.bird.rotation = Math.max(-30, Math.min(90, this.bird.velocity * 3));
    
    // Generate pipes
    if (this.frameCount > 60 && (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.CANVAS_WIDTH - this.PIPE_SPACING)) {
      const minHeight = 80;
      const maxHeight = this.CANVAS_HEIGHT - this.PIPE_GAP - 80;
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
        this.updateStats();
        
        // Create score particles
        for (let i = 0; i < 10; i++) {
          this.particles.push({
            x: this.bird.x + this.bird.width / 2,
            y: this.bird.y,
            vx: Math.random() * 6 - 3,
            vy: Math.random() * 6 - 3,
            life: 1,
            color: `hsl(${Math.random() * 360}, 80%, 60%)`
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
        cloud.x = this.CANVAS_WIDTH;
        cloud.y = Math.random() * 200;
      }
    });
    
    // Check boundaries (with a small margin at the top)
    if (this.bird.y < -10 || this.bird.y + this.bird.height > this.CANVAS_HEIGHT) {
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

  private draw() {
    if (!this.ctx) return;
    
    // Clear canvas with sky gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Draw clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    this.clouds.forEach(cloud => {
      this.drawCloud(cloud.x, cloud.y, cloud.width);
    });
    
    // Draw pipes
    this.pipes.forEach(pipe => {
      // Top pipe
      const topGradient = this.ctx!.createLinearGradient(pipe.x, 0, pipe.x + this.PIPE_WIDTH, 0);
      topGradient.addColorStop(0, '#2ecc71');
      topGradient.addColorStop(0.5, '#27ae60');
      topGradient.addColorStop(1, '#229954');
      
      this.ctx!.fillStyle = topGradient;
      this.ctx!.fillRect(pipe.x, 0, this.PIPE_WIDTH, pipe.topHeight);
      
      // Top pipe cap
      this.ctx!.fillRect(pipe.x - 5, pipe.topHeight - 30, this.PIPE_WIDTH + 10, 30);
      
      // Bottom pipe
      this.ctx!.fillStyle = topGradient;
      this.ctx!.fillRect(pipe.x, pipe.bottomY, this.PIPE_WIDTH, this.CANVAS_HEIGHT - pipe.bottomY);
      
      // Bottom pipe cap
      this.ctx!.fillRect(pipe.x - 5, pipe.bottomY, this.PIPE_WIDTH + 10, 30);
      
      // Pipe highlights
      this.ctx!.strokeStyle = '#1e8449';
      this.ctx!.lineWidth = 2;
      this.ctx!.strokeRect(pipe.x, 0, this.PIPE_WIDTH, pipe.topHeight);
      this.ctx!.strokeRect(pipe.x, pipe.bottomY, this.PIPE_WIDTH, this.CANVAS_HEIGHT - pipe.bottomY);
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
      this.ctx.fillStyle = '#ff8c00';
      this.ctx.beginPath();
      this.ctx.moveTo(15, 0);
      this.ctx.lineTo(25, 0);
      this.ctx.lineTo(20, 5);
      this.ctx.closePath();
      this.ctx.fill();
      
      // Bird wing
      const wingFlap = Math.sin(this.frameCount * 0.2) * 5;
      this.ctx.fillStyle = '#ffb347';
      this.ctx.beginPath();
      this.ctx.ellipse(-5, 0, 12, 8 + wingFlap, 0.3, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.restore();
    }
    
    // Draw start prompt
    if (!this.gameStarted) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Click to Start!', this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT / 2);
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

  private updateStats() {
    document.getElementById('score')!.textContent = this.score.toString();
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('flappy-flux-highscore', this.highScore.toString());
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
  }

  private endGame() {
    this.gameOver = true;
    document.getElementById('game-over')!.style.display = 'block';
    document.getElementById('final-score')!.textContent = this.score.toString();
    document.getElementById('final-highscore')!.textContent = this.highScore.toString();
    
    // Create explosion particles
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        x: this.bird.x + this.bird.width / 2,
        y: this.bird.y + this.bird.height / 2,
        vx: Math.random() * 10 - 5,
        vy: Math.random() * 10 - 5,
        life: 1,
        color: '#ff6b6b'
      });
    }
  }

  public restart() {
    document.getElementById('game-over')!.style.display = 'none';
    this.startGame();
  }
}