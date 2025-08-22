interface Bubble {
  x: number;
  y: number;
  color: string;
  row: number;
  col: number;
  falling?: boolean;
  dx?: number;
  dy?: number;
}

export default class BubbleShooter {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  
  // Game objects
  private bubbles: Bubble[][] = [];
  private currentBubble: Bubble | null = null;
  private nextBubble: Bubble | null = null;
  private shootingBubble: Bubble | null = null;
  private aimAngle: number = -Math.PI / 2;
  
  // Game state
  private score: number = 0;
  private highScore: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private combo: number = 0;
  
  // Game settings
  private readonly CANVAS_WIDTH = 600;
  private readonly CANVAS_HEIGHT = 700;
  private readonly BUBBLE_RADIUS = 20;
  private readonly ROWS = 12;
  private readonly COLS = 15;
  private readonly COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  private readonly SHOOT_SPEED = 15;
  
  // Mouse position
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor() {
    this.highScore = parseInt(localStorage.getItem('bubble-shooter-highscore') || '0');
  }

  mount(container: HTMLElement) {
    this.container = container;
    this.setupGame();
    this.newGame();
    this.gameLoop();
  }

  unmount() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  private setupGame() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="bubble-shooter-game" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background-color: #0a0a0a;
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h1 style="
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #ff00ff, #00ffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">Bubble Shooter</h1>
        
        <div class="stats" style="
          display: flex;
          gap: 40px;
          margin-bottom: 20px;
          color: white;
        ">
          <div style="text-align: center;">
            <div style="font-size: 18px; color: #00ffff;">Score</div>
            <div id="score" style="font-size: 28px; font-weight: bold;">${this.score}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; color: #ff00ff;">Combo</div>
            <div id="combo" style="font-size: 28px; font-weight: bold;">x${this.combo}</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 18px; color: #ffff00;">High Score</div>
            <div id="highscore" style="font-size: 28px; font-weight: bold;">${this.highScore}</div>
          </div>
        </div>

        <div style="position: relative;">
          <canvas id="game-canvas" style="
            border: 2px solid #00ffff;
            background-color: #111;
            box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
            cursor: crosshair;
          "></canvas>
          
          <div id="game-over" style="
            display: none;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            background: rgba(0, 0, 0, 0.9);
            padding: 40px;
            border-radius: 10px;
            border: 2px solid #ff0000;
          ">
            <h2 style="color: #ff0000; font-size: 36px; margin-bottom: 20px;">Game Over!</h2>
            <p style="color: white; font-size: 24px; margin-bottom: 30px;">Score: <span id="final-score">0</span></p>
            <button onclick="window.bubbleShooter.restart()" style="
              padding: 15px 40px;
              font-size: 18px;
              font-weight: bold;
              color: white;
              background: linear-gradient(135deg, #ff00ff, #00ffff);
              border: none;
              border-radius: 5px;
              cursor: pointer;
            ">Play Again</button>
          </div>
        </div>

        <div style="margin-top: 20px; color: #888; text-align: center;">
          <div>Move mouse to aim, click to shoot</div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = this.CANVAS_WIDTH;
    this.canvas.height = this.CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');

    // Event listeners
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas!.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.updateAimAngle();
    });

    this.canvas.addEventListener('click', () => this.shoot());

    // Touch controls
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas!.getBoundingClientRect();
      this.mouseX = touch.clientX - rect.left;
      this.mouseY = touch.clientY - rect.top;
      this.updateAimAngle();
    });

    this.canvas.addEventListener('touchend', () => this.shoot());

    (window as any).bubbleShooter = this;
  }

  private newGame() {
    this.score = 0;
    this.combo = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.shootingBubble = null;
    
    // Initialize bubble grid
    this.bubbles = [];
    for (let row = 0; row < 8; row++) {
      this.bubbles[row] = [];
      for (let col = 0; col < this.COLS; col++) {
        if ((row % 2 === 0 && col < this.COLS) || (row % 2 === 1 && col < this.COLS - 1)) {
          const x = col * this.BUBBLE_RADIUS * 2 + this.BUBBLE_RADIUS + (row % 2 === 1 ? this.BUBBLE_RADIUS : 0);
          const y = row * this.BUBBLE_RADIUS * 1.7 + this.BUBBLE_RADIUS * 2;
          
          this.bubbles[row][col] = {
            x,
            y,
            color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
            row,
            col
          };
        }
      }
    }
    
    // Create shooter bubbles
    this.createNewBubble();
    this.updateStats();
  }

  private createNewBubble() {
    this.currentBubble = {
      x: this.CANVAS_WIDTH / 2,
      y: this.CANVAS_HEIGHT - 50,
      color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      row: -1,
      col: -1
    };
    
    this.nextBubble = {
      x: this.CANVAS_WIDTH - 50,
      y: this.CANVAS_HEIGHT - 50,
      color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      row: -1,
      col: -1
    };
  }

  private updateAimAngle() {
    const dx = this.mouseX - this.CANVAS_WIDTH / 2;
    const dy = this.mouseY - (this.CANVAS_HEIGHT - 50);
    this.aimAngle = Math.atan2(dy, dx);
    
    // Limit angle
    const minAngle = -Math.PI + 0.2;
    const maxAngle = -0.2;
    this.aimAngle = Math.max(minAngle, Math.min(maxAngle, this.aimAngle));
  }

  private shoot() {
    if (this.gameOver || this.shootingBubble || !this.currentBubble) return;
    
    this.shootingBubble = {
      ...this.currentBubble,
      dx: Math.cos(this.aimAngle) * this.SHOOT_SPEED,
      dy: Math.sin(this.aimAngle) * this.SHOOT_SPEED
    };
    
    this.currentBubble = this.nextBubble;
    this.currentBubble!.x = this.CANVAS_WIDTH / 2;
    
    this.nextBubble = {
      x: this.CANVAS_WIDTH - 50,
      y: this.CANVAS_HEIGHT - 50,
      color: this.COLORS[Math.floor(Math.random() * this.COLORS.length)],
      row: -1,
      col: -1
    };
  }

  private gameLoop = () => {
    if (!this.isPaused) {
      this.update();
      this.draw();
    }
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private update() {
    if (this.gameOver) return;
    
    // Update shooting bubble
    if (this.shootingBubble) {
      this.shootingBubble.x += this.shootingBubble.dx!;
      this.shootingBubble.y += this.shootingBubble.dy!;
      
      // Wall collision
      if (this.shootingBubble.x - this.BUBBLE_RADIUS <= 0 || 
          this.shootingBubble.x + this.BUBBLE_RADIUS >= this.CANVAS_WIDTH) {
        this.shootingBubble.dx! = -this.shootingBubble.dx!;
      }
      
      // Top collision
      if (this.shootingBubble.y - this.BUBBLE_RADIUS <= 0) {
        this.attachBubble(this.shootingBubble);
        this.shootingBubble = null;
        return;
      }
      
      // Check collision with other bubbles
      for (let row = 0; row < this.bubbles.length; row++) {
        for (let col = 0; col < this.bubbles[row].length; col++) {
          const bubble = this.bubbles[row][col];
          if (bubble && this.checkCollision(this.shootingBubble, bubble)) {
            this.attachBubble(this.shootingBubble);
            this.shootingBubble = null;
            return;
          }
        }
      }
    }
    
    // Update falling bubbles
    for (let row = 0; row < this.bubbles.length; row++) {
      for (let col = 0; col < this.bubbles[row].length; col++) {
        const bubble = this.bubbles[row][col];
        if (bubble && bubble.falling) {
          bubble.y += bubble.dy!;
          bubble.dy! += 0.5; // gravity
          
          if (bubble.y > this.CANVAS_HEIGHT + this.BUBBLE_RADIUS) {
            this.bubbles[row][col] = null as any;
          }
        }
      }
    }
  }

  private checkCollision(b1: Bubble, b2: Bubble): boolean {
    const dx = b1.x - b2.x;
    const dy = b1.y - b2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < this.BUBBLE_RADIUS * 2;
  }

  private attachBubble(bubble: Bubble) {
    // Find nearest grid position
    let nearestRow = 0;
    let nearestCol = 0;
    let minDistance = Infinity;
    
    for (let row = 0; row < this.ROWS; row++) {
      const maxCol = row % 2 === 0 ? this.COLS : this.COLS - 1;
      for (let col = 0; col < maxCol; col++) {
        const x = col * this.BUBBLE_RADIUS * 2 + this.BUBBLE_RADIUS + (row % 2 === 1 ? this.BUBBLE_RADIUS : 0);
        const y = row * this.BUBBLE_RADIUS * 1.7 + this.BUBBLE_RADIUS * 2;
        
        const dx = bubble.x - x;
        const dy = bubble.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance && !this.bubbles[row]?.[col]) {
          minDistance = distance;
          nearestRow = row;
          nearestCol = col;
        }
      }
    }
    
    // Place bubble
    if (!this.bubbles[nearestRow]) {
      this.bubbles[nearestRow] = [];
    }
    
    const x = nearestCol * this.BUBBLE_RADIUS * 2 + this.BUBBLE_RADIUS + (nearestRow % 2 === 1 ? this.BUBBLE_RADIUS : 0);
    const y = nearestRow * this.BUBBLE_RADIUS * 1.7 + this.BUBBLE_RADIUS * 2;
    
    this.bubbles[nearestRow][nearestCol] = {
      x,
      y,
      color: bubble.color,
      row: nearestRow,
      col: nearestCol
    };
    
    // Check for matches
    const matches = this.findMatches(nearestRow, nearestCol);
    if (matches.length >= 3) {
      this.removeMatches(matches);
      this.checkFloatingBubbles();
      this.combo++;
    } else {
      this.combo = 0;
      
      // Check game over
      if (nearestRow >= this.ROWS - 2) {
        this.endGame();
      }
    }
    
    this.updateStats();
  }

  private findMatches(row: number, col: number): Bubble[] {
    const color = this.bubbles[row][col].color;
    const matches: Bubble[] = [];
    const visited = new Set<string>();
    
    const dfs = (r: number, c: number) => {
      const key = `${r},${c}`;
      if (visited.has(key)) return;
      visited.add(key);
      
      if (!this.bubbles[r]?.[c] || this.bubbles[r][c].color !== color) return;
      
      matches.push(this.bubbles[r][c]);
      
      // Check neighbors
      const neighbors = this.getNeighbors(r, c);
      for (const [nr, nc] of neighbors) {
        dfs(nr, nc);
      }
    };
    
    dfs(row, col);
    return matches;
  }

  private getNeighbors(row: number, col: number): [number, number][] {
    const neighbors: [number, number][] = [];
    const offsets = row % 2 === 0
      ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
      : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    
    for (const [dr, dc] of offsets) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < this.ROWS && nc >= 0 && nc < this.COLS) {
        neighbors.push([nr, nc]);
      }
    }
    
    return neighbors;
  }

  private removeMatches(matches: Bubble[]) {
    for (const bubble of matches) {
      this.bubbles[bubble.row][bubble.col] = null as any;
      this.score += 10 * this.combo;
    }
  }

  private checkFloatingBubbles() {
    const connected = new Set<string>();
    
    // Find all bubbles connected to the top
    for (let col = 0; col < this.COLS; col++) {
      if (this.bubbles[0]?.[col]) {
        this.markConnected(0, col, connected);
      }
    }
    
    // Remove floating bubbles
    for (let row = 0; row < this.bubbles.length; row++) {
      for (let col = 0; col < this.bubbles[row].length; col++) {
        const bubble = this.bubbles[row][col];
        if (bubble && !connected.has(`${row},${col}`)) {
          bubble.falling = true;
          bubble.dy = 0;
          this.score += 20 * this.combo;
        }
      }
    }
  }

  private markConnected(row: number, col: number, connected: Set<string>) {
    const key = `${row},${col}`;
    if (connected.has(key) || !this.bubbles[row]?.[col]) return;
    
    connected.add(key);
    
    const neighbors = this.getNeighbors(row, col);
    for (const [nr, nc] of neighbors) {
      this.markConnected(nr, nc, connected);
    }
  }

  private draw() {
    if (!this.ctx) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Draw bubbles
    for (let row = 0; row < this.bubbles.length; row++) {
      for (let col = 0; col < this.bubbles[row].length; col++) {
        const bubble = this.bubbles[row][col];
        if (bubble) {
          this.drawBubble(bubble.x, bubble.y, bubble.color);
        }
      }
    }
    
    // Draw shooting bubble
    if (this.shootingBubble) {
      this.drawBubble(this.shootingBubble.x, this.shootingBubble.y, this.shootingBubble.color);
    }
    
    // Draw current bubble
    if (this.currentBubble) {
      this.drawBubble(this.currentBubble.x, this.currentBubble.y, this.currentBubble.color);
    }
    
    // Draw next bubble
    if (this.nextBubble) {
      this.ctx.fillStyle = 'white';
      this.ctx.font = '14px Arial';
      this.ctx.fillText('Next:', this.CANVAS_WIDTH - 80, this.CANVAS_HEIGHT - 80);
      this.drawBubble(this.nextBubble.x, this.nextBubble.y, this.nextBubble.color, 15);
    }
    
    // Draw aim line
    if (!this.gameOver && !this.shootingBubble) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.CANVAS_WIDTH / 2, this.CANVAS_HEIGHT - 50);
      this.ctx.lineTo(
        this.CANVAS_WIDTH / 2 + Math.cos(this.aimAngle) * 100,
        this.CANVAS_HEIGHT - 50 + Math.sin(this.aimAngle) * 100
      );
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
  }

  private drawBubble(x: number, y: number, color: string, radius: number = this.BUBBLE_RADIUS) {
    if (!this.ctx) return;
    
    // Draw bubble
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = color;
    this.ctx.fill();
    
    // Add shine effect
    const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    
    // Add border
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private updateStats() {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('combo')!.textContent = `x${this.combo}`;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('bubble-shooter-highscore', this.highScore.toString());
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
  }

  private endGame() {
    this.gameOver = true;
    document.getElementById('game-over')!.style.display = 'block';
    document.getElementById('final-score')!.textContent = this.score.toString();
  }

  public restart() {
    document.getElementById('game-over')!.style.display = 'none';
    this.newGame();
  }
}