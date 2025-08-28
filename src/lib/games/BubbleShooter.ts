import { BaseGame } from '../core/BaseGame';

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

export default class BubbleShooter extends BaseGame {
  
  // Game objects
  private bubbles: Bubble[][] = [];
  private currentBubble: Bubble | null = null;
  private nextBubble: Bubble | null = null;
  private shootingBubble: Bubble | null = null;
  private aimAngle: number = -Math.PI / 2;
  
  // Game state
  private combo: number = 0;
  
  // Game settings
  private readonly BUBBLE_RADIUS = 20;
  private readonly ROWS = 12;
  private readonly COLS = 15;
  private readonly SHOOT_SPEED = 15;
  
  // Mouse position
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor() {
    super({
      canvasWidth: 600,
      canvasHeight: 700,
      gameName: 'BubbleShooter'
    });
  }


  protected setupGame(): void {
    if (!this.container) return;

    const additionalStats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">Combo</div>
        <div id="combo" style="font-size: 24px; font-weight: bold;">x${this.combo}</div>
      </div>
    `;

    this.container.innerHTML = this.createGameHTML(additionalStats);

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.config.canvasWidth;
      this.canvas.height = this.config.canvasHeight;
      this.ctx = this.canvas.getContext('2d');
      this.canvas.style.cursor = 'crosshair';
    }

    // Add controls info
    const overlaysContainer = document.getElementById('game-overlays');
    if (overlaysContainer) {
      overlaysContainer.innerHTML = `
        <div style="
          margin-top: 20px;
          color: ${this.getThemeColor('textSecondary')};
          text-align: center;
          font-size: 14px;
        ">
          <div>Move mouse to aim, click to shoot</div>
        </div>
      `;
    }

    // Event listeners
    if (this.canvas) {
      this.canvas.addEventListener('mousemove', this.handleMouseMove);
      this.canvas.addEventListener('click', this.handleClick);
      this.canvas.addEventListener('touchmove', this.handleTouchMove);
      this.canvas.addEventListener('touchend', this.handleClick);
    }

    // Store reference for restart
    (window as any).currentGame = this;
  }

  protected initialize(): void {
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
            color: this.getThemeBubbleColors()[Math.floor(Math.random() * this.getThemeBubbleColors().length)],
            row,
            col
          };
        }
      }
    }
    
    // Create shooter bubbles
    this.createNewBubble();
    this.updateUI();
  }

  private getThemeBubbleColors(): string[] {
    return [
      this.getThemeColor('error'),     // Red
      this.getThemeColor('success'),   // Green
      this.getThemeColor('info'),      // Blue
      this.getThemeColor('warning'),   // Yellow
      this.getThemeColor('secondary'), // Magenta
      this.getThemeColor('accent')     // Cyan
    ];
  }

  private createNewBubble() {
    const colors = this.getThemeBubbleColors();
    
    this.currentBubble = {
      x: this.config.canvasWidth / 2,
      y: this.config.canvasHeight - 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      row: -1,
      col: -1
    };
    
    this.nextBubble = {
      x: this.config.canvasWidth - 50,
      y: this.config.canvasHeight - 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      row: -1,
      col: -1
    };
  }

  private updateAimAngle() {
    const dx = this.mouseX - this.config.canvasWidth / 2;
    const dy = this.mouseY - (this.config.canvasHeight - 50);
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
    this.currentBubble!.x = this.config.canvasWidth / 2;
    
    const colors = this.getThemeBubbleColors();
    this.nextBubble = {
      x: this.config.canvasWidth - 50,
      y: this.config.canvasHeight - 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      row: -1,
      col: -1
    };
  }


  protected update(deltaTime: number): void {
    if (this.gameOver) return;
    
    // Update shooting bubble
    if (this.shootingBubble) {
      this.shootingBubble.x += this.shootingBubble.dx!;
      this.shootingBubble.y += this.shootingBubble.dy!;
      
      // Wall collision
      if (this.shootingBubble.x - this.BUBBLE_RADIUS <= 0 || 
          this.shootingBubble.x + this.BUBBLE_RADIUS >= this.config.canvasWidth) {
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
          
          if (bubble.y > this.config.canvasHeight + this.BUBBLE_RADIUS) {
            this.bubbles[row][col] = null as any;
          }
        }
      }
    }
    
    // Update particles
    this.updateParticles(deltaTime);
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
      
      // Create particle effects for matched bubbles
      if (this.shouldShowEffect('particles')) {
        for (const bubble of matches) {
          this.createParticles(
            bubble.x,
            bubble.y,
            10,
            bubble.color,
            5
          );
        }
      }
    } else {
      this.combo = 0;
      
      // Check game over
      if (nearestRow >= this.ROWS - 2) {
        this.endGame();
      }
    }
    
    this.updateUI();
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
      this.updateScore(10 * this.combo);
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
          this.updateScore(20 * this.combo);
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

  protected draw(): void {
    if (!this.ctx) return;
    
    // Draw themed background
    this.drawThemedBackground();
    
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
      this.ctx.fillStyle = this.getThemeColor('text');
      this.ctx.font = '14px sans-serif';
      this.ctx.fillText('Next:', this.config.canvasWidth - 80, this.config.canvasHeight - 80);
      this.drawBubble(this.nextBubble.x, this.nextBubble.y, this.nextBubble.color, 15);
    }
    
    // Draw aim line
    if (!this.gameOver && !this.shootingBubble) {
      this.ctx.strokeStyle = this.getThemeColor('text') + '80';
      this.ctx.lineWidth = 2;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(this.config.canvasWidth / 2, this.config.canvasHeight - 50);
      this.ctx.lineTo(
        this.config.canvasWidth / 2 + Math.cos(this.aimAngle) * 100,
        this.config.canvasHeight - 50 + Math.sin(this.aimAngle) * 100
      );
      this.ctx.stroke();
      this.ctx.setLineDash([]);
    }
    
    // Draw particles
    if (this.shouldShowEffect('particles')) {
      this.drawParticles();
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
    if (this.shouldShowEffect('gradients')) {
      const gradient = this.ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
    }
    
    // Add border
    if (this.shouldShowEffect('shadows')) {
      this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
    
    // Add glow effect to bubble
    if (this.shouldShowEffect('glow')) {
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
      this.ctx.strokeStyle = color + '40';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  private updateUI() {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('combo')!.textContent = `x${this.combo}`;
    
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
      document.getElementById('highscore')!.textContent = this.highScore.toString();
    }
  }

  private endGame() {
    this.gameOver = true;
    this.createGameOverlay('Game Over!', this.score);
  }

  public restart(): void {
    super.restart();
    this.updateUI();
  }

  protected cleanup(): void {
    if (this.canvas) {
      this.canvas.removeEventListener('mousemove', this.handleMouseMove);
      this.canvas.removeEventListener('click', this.handleClick);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
      this.canvas.removeEventListener('touchend', this.handleClick);
    }
  }

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas!.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
    this.updateAimAngle();
  };

  private handleTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.canvas!.getBoundingClientRect();
    this.mouseX = touch.clientX - rect.left;
    this.mouseY = touch.clientY - rect.top;
    this.updateAimAngle();
  };

  private handleClick = () => {
    this.shoot();
  };
}