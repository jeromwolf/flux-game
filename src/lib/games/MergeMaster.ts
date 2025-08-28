export default class MergeMaster {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private gridSize = 5; // 5x5 hexagonal grid
  private hexRadius = 50;
  private tiles: (Tile | null)[][] = [];
  private score = 0;
  private highScore = 0;
  private combo = 0;
  private animations: Animation[] = [];
  private particles: Particle[] = [];
  private gameState: 'playing' | 'gameOver' = 'playing';
  private selectedTile: { row: number; col: number } | null = null;
  private moveTimer = 0;
  private autoMergeEnabled = false;
  private specialTiles = {
    bomb: { chance: 0.05, color: '#FF6B6B' },
    wildcard: { chance: 0.03, color: '#4ECDC4' },
    multiplier: { chance: 0.04, color: '#FFD93D' }
  };

  private touchStartX = 0;
  private touchStartY = 0;
  private language = 'en';

  private animationFrame: number | null = null;

  mount(container: HTMLElement) {
    this.container = container;
    this.language = localStorage.getItem('language') || 'en';
    this.highScore = parseInt(localStorage.getItem('merge-master-highscore') || '0');
    this.initializeGame();
  }

  unmount() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.canvas) {
      this.canvas.removeEventListener('click', this.handleClick);
      this.canvas.removeEventListener('touchstart', this.handleTouchStart);
      this.canvas.removeEventListener('touchmove', this.handleTouchMove);
      this.canvas.removeEventListener('touchend', this.handleTouchEnd);
    }
    window.removeEventListener('resize', this.handleResize);
  }

  private initializeGame() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column; background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%);">
        <div style="padding: 8px 15px; background: rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; min-height: 50px;">
          <div>
            <div style="color: #4ECDC4; font-size: 14px; font-weight: bold;">MERGE MASTER</div>
            <div style="color: #fff; font-size: 12px; margin-top: 3px;">
              ${this.language === 'ko' ? '점수' : 'Score'}: <span id="score">${this.score}</span>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: #FFD93D; font-size: 12px;">
              ${this.language === 'ko' ? '최고점수' : 'Best'}: ${this.highScore}
            </div>
            <div id="combo" style="color: #FF6B6B; font-size: 14px; font-weight: bold; height: 20px; margin-top: 3px;">
              ${this.combo > 1 ? `${this.combo}x COMBO!` : ''}
            </div>
          </div>
        </div>
        <div style="flex: 1; display: flex; justify-content: center; align-items: center; padding: 10px; position: relative; overflow: hidden;">
          <canvas id="game-canvas" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>
        <div style="padding: 10px; background: rgba(255,255,255,0.05); display: flex; justify-content: center; gap: 10px; min-height: 60px; flex-wrap: wrap;">
          <button id="help-btn" style="padding: 8px 16px; background: #4ECDC4; color: #1a1a2e; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
            ${this.language === 'ko' ? '도움말' : 'Help'} 📖
          </button>
          <button id="undo-btn" style="padding: 8px 16px; background: #4ECDC4; color: #1a1a2e; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
            ${this.language === 'ko' ? '되돌리기' : 'Undo'}
          </button>
          <button id="auto-btn" style="padding: 8px 16px; background: ${this.autoMergeEnabled ? '#FF6B6B' : '#FFD93D'}; color: #1a1a2e; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
            ${this.language === 'ko' ? '자동 병합' : 'Auto'} ${this.autoMergeEnabled ? 'ON' : 'OFF'}
          </button>
          <button id="new-btn" style="padding: 8px 16px; background: #9B59B6; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer;">
            ${this.language === 'ko' ? '새 게임' : 'New Game'}
          </button>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d');

    // Set up event listeners
    this.handleClick = this.handleClick.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleResize = this.handleResize.bind(this);

    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    window.addEventListener('resize', this.handleResize);

    // Button event listeners
    const helpBtn = document.getElementById('help-btn');
    const undoBtn = document.getElementById('undo-btn');
    const autoBtn = document.getElementById('auto-btn');
    const newBtn = document.getElementById('new-btn');

    helpBtn?.addEventListener('click', () => this.showTutorial());
    undoBtn?.addEventListener('click', () => this.undo());
    autoBtn?.addEventListener('click', () => this.toggleAutoMerge());
    newBtn?.addEventListener('click', () => this.newGame());

    // Initial setup with delay to ensure proper sizing
    setTimeout(() => {
      this.handleResize();
      this.newGame();
      this.gameLoop();
    }, 100);
  }

  private handleResize() {
    if (!this.canvas || !this.container) return;
    
    // Find the canvas container
    const canvasContainer = this.canvas.parentElement;
    if (!canvasContainer) return;
    
    const containerRect = canvasContainer.getBoundingClientRect();
    const availableWidth = containerRect.width;
    const availableHeight = containerRect.height;
    
    // Use more of the available space
    const size = Math.min(availableWidth * 0.95, availableHeight * 0.95, 800);
    
    this.canvas.width = size;
    this.canvas.height = size;
    
    // Adjust hex radius based on canvas size - make hexagons bigger
    this.hexRadius = size / 8;
  }

  private newGame() {
    this.tiles = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
    this.score = 0;
    this.combo = 0;
    this.gameState = 'playing';
    this.animations = [];
    this.particles = [];
    
    // Add initial tiles
    for (let i = 0; i < 8; i++) {
      this.addRandomTile();
    }
    
    this.updateScore();
    
    // Show tutorial on first play
    const hasPlayed = localStorage.getItem('merge-master-tutorial-shown');
    if (!hasPlayed) {
      this.showTutorial();
      localStorage.setItem('merge-master-tutorial-shown', 'true');
    }
  }

  private addRandomTile() {
    const emptySpots: { row: number; col: number }[] = [];
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (!this.tiles[row][col]) {
          emptySpots.push({ row, col });
        }
      }
    }
    
    if (emptySpots.length === 0) {
      this.checkGameOver();
      return;
    }
    
    const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    
    // Check for special tiles
    let type: TileType = 'normal';
    const rand = Math.random();
    if (rand < this.specialTiles.bomb.chance) {
      type = 'bomb';
    } else if (rand < this.specialTiles.bomb.chance + this.specialTiles.wildcard.chance) {
      type = 'wildcard';
    } else if (rand < this.specialTiles.bomb.chance + this.specialTiles.wildcard.chance + this.specialTiles.multiplier.chance) {
      type = 'multiplier';
    }
    
    this.tiles[spot.row][spot.col] = {
      value,
      type,
      x: 0,
      y: 0,
      scale: 0
    };
    
    // Add spawn animation
    this.animations.push({
      type: 'spawn',
      tile: this.tiles[spot.row][spot.col]!,
      progress: 0,
      duration: 300
    });
    
    this.playSound('spawn');
  }

  private getHexCenter(row: number, col: number): { x: number; y: number } {
    const hexWidth = this.hexRadius * Math.sqrt(3);
    const offsetX = row % 2 === 0 ? 0 : hexWidth / 2;
    const x = this.canvas!.width / 2 - (hexWidth * 2) + (col * hexWidth) + offsetX;
    const y = this.canvas!.height / 2 - (this.hexRadius * 3) + (row * this.hexRadius * 1.5);
    return { x, y };
  }

  private drawHexagon(x: number, y: number, radius: number, fillColor: string, strokeColor: string) {
    if (!this.ctx) return;
    
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const hx = x + radius * Math.cos(angle);
      const hy = y + radius * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(hx, hy);
      } else {
        this.ctx.lineTo(hx, hy);
      }
    }
    this.ctx.closePath();
    
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();
    
    this.ctx.strokeStyle = strokeColor;
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  private handleClick(e: MouseEvent) {
    if (this.gameState !== 'playing') return;
    
    const rect = this.canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.handleTileSelection(x, y);
  }

  private handleTouchStart(e: TouchEvent) {
    e.preventDefault();
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  }

  private handleTouchMove(e: TouchEvent) {
    e.preventDefault();
  }

  private handleTouchEnd(e: TouchEvent) {
    e.preventDefault();
    
    const rect = this.canvas!.getBoundingClientRect();
    const x = this.touchStartX - rect.left;
    const y = this.touchStartY - rect.top;
    
    this.handleTileSelection(x, y);
  }

  private handleTileSelection(x: number, y: number) {
    // Find which hex was clicked
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const { x: hx, y: hy } = this.getHexCenter(row, col);
        const distance = Math.sqrt((x - hx) ** 2 + (y - hy) ** 2);
        
        if (distance < this.hexRadius * 0.866) { // Inside hex
          if (this.selectedTile) {
            // Try to merge
            if (this.canMerge(this.selectedTile, { row, col })) {
              this.mergeTiles(this.selectedTile, { row, col });
              this.selectedTile = null;
            } else {
              this.selectedTile = { row, col };
            }
          } else if (this.tiles[row][col]) {
            this.selectedTile = { row, col };
          }
          return;
        }
      }
    }
  }

  private canMerge(from: { row: number; col: number }, to: { row: number; col: number }): boolean {
    const fromTile = this.tiles[from.row][from.col];
    const toTile = this.tiles[to.row][to.col];
    
    if (!fromTile || !toTile) return false;
    if (from.row === to.row && from.col === to.col) return false;
    
    // Check if tiles are adjacent
    const neighbors = this.getNeighbors(from.row, from.col);
    const isAdjacent = neighbors.some(n => n.row === to.row && n.col === to.col);
    if (!isAdjacent) return false;
    
    // Special tile rules
    if (fromTile.type === 'wildcard' || toTile.type === 'wildcard') return true;
    if (fromTile.type === 'bomb' || toTile.type === 'bomb') return true;
    
    return fromTile.value === toTile.value;
  }

  private getNeighbors(row: number, col: number): { row: number; col: number }[] {
    const neighbors: { row: number; col: number }[] = [];
    const offsets = row % 2 === 0 ? 
      [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]] :
      [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    
    for (const [dr, dc] of offsets) {
      const newRow = row + dr;
      const newCol = col + dc;
      if (newRow >= 0 && newRow < this.gridSize && newCol >= 0 && newCol < this.gridSize) {
        neighbors.push({ row: newRow, col: newCol });
      }
    }
    
    return neighbors;
  }

  private mergeTiles(from: { row: number; col: number }, to: { row: number; col: number }) {
    const fromTile = this.tiles[from.row][from.col]!;
    const toTile = this.tiles[to.row][to.col]!;
    
    // Handle bomb tiles
    if (fromTile.type === 'bomb' || toTile.type === 'bomb') {
      this.explodeBomb(to.row, to.col);
      this.tiles[from.row][from.col] = null;
      this.combo++;
      this.playSound('explosion');
      return;
    }
    
    // Calculate merged value
    let mergedValue = fromTile.value + toTile.value;
    if (fromTile.type === 'multiplier' || toTile.type === 'multiplier') {
      mergedValue *= 2;
    }
    
    // Create merged tile
    this.tiles[to.row][to.col] = {
      value: mergedValue,
      type: mergedValue >= 128 && Math.random() < 0.3 ? 'multiplier' : 'normal',
      x: 0,
      y: 0,
      scale: 1
    };
    
    this.tiles[from.row][from.col] = null;
    
    // Add merge animation
    const { x, y } = this.getHexCenter(to.row, to.col);
    this.animations.push({
      type: 'merge',
      tile: this.tiles[to.row][to.col]!,
      progress: 0,
      duration: 400
    });
    
    // Add particles
    this.createMergeParticles(x, y, mergedValue);
    
    // Update score and combo
    this.score += mergedValue * (1 + this.combo * 0.5);
    this.combo++;
    
    // Play sound with pitch based on value
    this.playSound('merge', Math.min(1 + Math.log2(mergedValue) * 0.1, 2));
    
    // Add new tile after delay
    setTimeout(() => {
      this.addRandomTile();
      this.checkGameOver();
    }, 200);
    
    this.updateScore();
  }

  private explodeBomb(row: number, col: number) {
    const neighbors = this.getNeighbors(row, col);
    const { x, y } = this.getHexCenter(row, col);
    
    // Clear center tile
    this.tiles[row][col] = null;
    
    // Clear neighbors and add score
    for (const neighbor of neighbors) {
      const tile = this.tiles[neighbor.row][neighbor.col];
      if (tile) {
        this.score += tile.value;
        this.tiles[neighbor.row][neighbor.col] = null;
        
        const { x: nx, y: ny } = this.getHexCenter(neighbor.row, neighbor.col);
        this.createExplosionParticles(nx, ny);
      }
    }
    
    // Big explosion at center
    this.createExplosionParticles(x, y, true);
  }

  private createMergeParticles(x: number, y: number, value: number) {
    const colors = ['#FFD93D', '#FF6B6B', '#4ECDC4', '#9B59B6', '#3498DB'];
    const particleCount = Math.min(20 + Math.log2(value) * 5, 50);
    
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 4 + 2,
        life: 1,
        decay: 0.02
      });
    }
  }

  private createExplosionParticles(x: number, y: number, isBig = false) {
    const particleCount = isBig ? 50 : 20;
    const speed = isBig ? 15 : 8;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
        vy: Math.sin(angle) * speed * (0.5 + Math.random() * 0.5),
        color: `hsl(${Math.random() * 60}, 100%, 50%)`, // Orange to red
        size: isBig ? Math.random() * 6 + 3 : Math.random() * 4 + 2,
        life: 1,
        decay: 0.015
      });
    }
  }

  private checkGameOver() {
    // Check if any moves are possible
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (!this.tiles[row][col]) return; // Empty space exists
        
        const neighbors = this.getNeighbors(row, col);
        for (const neighbor of neighbors) {
          if (this.canMerge({ row, col }, neighbor)) return; // Move exists
        }
      }
    }
    
    this.gameState = 'gameOver';
    this.saveHighScore();
    this.showGameOver();
  }

  private saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('merge-master-highscore', this.highScore.toString());
    }
  }

  private showGameOver() {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 36px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.language === 'ko' ? '게임 오버!' : 'Game Over!', this.canvas.width / 2, this.canvas.height / 2 - 40);
    
    this.ctx.font = '24px Arial';
    this.ctx.fillText(`${this.language === 'ko' ? '점수' : 'Score'}: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
    
    if (this.score === this.highScore) {
      this.ctx.fillStyle = '#FFD93D';
      this.ctx.fillText(this.language === 'ko' ? '신기록!' : 'New Record!', this.canvas.width / 2, this.canvas.height / 2 + 60);
    }
  }

  private toggleAutoMerge() {
    this.autoMergeEnabled = !this.autoMergeEnabled;
    const autoBtn = document.getElementById('auto-btn');
    if (autoBtn) {
      autoBtn.style.background = this.autoMergeEnabled ? '#FF6B6B' : '#FFD93D';
      autoBtn.textContent = `${this.language === 'ko' ? '자동 병합' : 'Auto'} ${this.autoMergeEnabled ? 'ON' : 'OFF'}`;
    }
  }

  private undo() {
    // Implementation for undo functionality
    this.playSound('undo');
  }

  private updateScore() {
    const scoreElement = document.getElementById('score');
    const comboElement = document.getElementById('combo');
    
    if (scoreElement) {
      scoreElement.textContent = this.score.toString();
    }
    
    if (comboElement) {
      if (this.combo > 1) {
        comboElement.textContent = `${this.combo}x COMBO!`;
        comboElement.style.animation = 'pulse 0.3s';
      } else {
        comboElement.textContent = '';
      }
    }
  }

  private gameLoop = () => {
    this.update();
    this.render();
    this.animationFrame = requestAnimationFrame(this.gameLoop);
  };

  private update() {
    // Update animations
    this.animations = this.animations.filter(anim => {
      anim.progress += 16 / anim.duration;
      
      if (anim.type === 'spawn') {
        anim.tile.scale = this.easeOutBack(anim.progress);
      } else if (anim.type === 'merge') {
        anim.tile.scale = 1 + Math.sin(anim.progress * Math.PI) * 0.3;
      }
      
      return anim.progress < 1;
    });
    
    // Update particles
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.5; // Gravity
      particle.life -= particle.decay;
      
      return particle.life > 0;
    });
    
    // Reset combo if no action for 2 seconds
    this.moveTimer++;
    if (this.moveTimer > 120) {
      this.combo = 0;
      this.updateScore();
    }
    
    // Auto merge logic
    if (this.autoMergeEnabled && this.gameState === 'playing' && this.animations.length === 0) {
      this.performAutoMerge();
    }
  }

  private performAutoMerge() {
    // Find best merge
    let bestMerge: { from: { row: number; col: number }; to: { row: number; col: number }; score: number } | null = null;
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        if (!this.tiles[row][col]) continue;
        
        const neighbors = this.getNeighbors(row, col);
        for (const neighbor of neighbors) {
          if (this.canMerge({ row, col }, neighbor)) {
            const score = this.evaluateMerge({ row, col }, neighbor);
            if (!bestMerge || score > bestMerge.score) {
              bestMerge = { from: { row, col }, to: neighbor, score };
            }
          }
        }
      }
    }
    
    if (bestMerge && Math.random() < 0.02) { // 2% chance per frame
      this.selectedTile = bestMerge.from;
      setTimeout(() => {
        this.mergeTiles(bestMerge!.from, bestMerge!.to);
        this.selectedTile = null;
      }, 100);
    }
  }

  private evaluateMerge(from: { row: number; col: number }, to: { row: number; col: number }): number {
    const fromTile = this.tiles[from.row][from.col]!;
    const toTile = this.tiles[to.row][to.col]!;
    
    let score = fromTile.value + toTile.value;
    
    // Prefer special tiles
    if (fromTile.type !== 'normal' || toTile.type !== 'normal') score *= 2;
    
    // Prefer higher values
    score *= Math.log2(fromTile.value + toTile.value);
    
    return score;
  }

  private render() {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.fillStyle = '#0f0f1e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add subtle gradient background
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, this.canvas.width / 2
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1e');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const { x, y } = this.getHexCenter(row, col);
        const isSelected = this.selectedTile?.row === row && this.selectedTile?.col === col;
        
        this.drawHexagon(
          x, y, 
          this.hexRadius * 0.95,
          'rgba(255, 255, 255, 0.08)',
          isSelected ? '#FFD93D' : 'rgba(255, 255, 255, 0.2)'
        );
        
        // Draw tile
        const tile = this.tiles[row][col];
        if (tile) {
          this.drawTile(x, y, tile);
        }
      }
    }
    
    // Draw particles
    this.particles.forEach(particle => {
      this.ctx!.save();
      this.ctx!.globalAlpha = particle.life;
      this.ctx!.fillStyle = particle.color;
      this.ctx!.beginPath();
      this.ctx!.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      this.ctx!.fill();
      this.ctx!.restore();
    });
    
    // Draw game over overlay
    if (this.gameState === 'gameOver') {
      this.showGameOver();
    }
  }

  private drawTile(x: number, y: number, tile: Tile) {
    if (!this.ctx) return;
    
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.scale(tile.scale || 1, tile.scale || 1);
    
    // Tile background
    let fillColor = this.getTileColor(tile.value);
    if (tile.type !== 'normal') {
      fillColor = this.specialTiles[tile.type as keyof typeof this.specialTiles].color;
    }
    
    this.drawHexagon(0, 0, this.hexRadius * 0.9, fillColor, 'rgba(0, 0, 0, 0.4)');
    
    // Draw value or special icon
    this.ctx.fillStyle = tile.value >= 8 ? '#fff' : '#1a1a2e';
    this.ctx.font = `bold ${this.hexRadius * 0.6}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    if (tile.type === 'normal' || tile.type === 'multiplier') {
      this.ctx.fillText(tile.value.toString(), 0, 0);
      if (tile.type === 'multiplier') {
        this.ctx.font = `${this.hexRadius * 0.3}px Arial`;
        this.ctx.fillText('x2', 0, this.hexRadius * 0.35);
      }
    } else if (tile.type === 'bomb') {
      this.ctx.font = `${this.hexRadius * 0.7}px Arial`;
      this.ctx.fillText('💣', 0, 0);
    } else if (tile.type === 'wildcard') {
      this.ctx.font = `${this.hexRadius * 0.7}px Arial`;
      this.ctx.fillText('✨', 0, 0);
    }
    
    this.ctx.restore();
  }

  private getTileColor(value: number): string {
    const colors: { [key: number]: string } = {
      2: '#64B5F6',
      4: '#4FC3F7',
      8: '#4DD0E1',
      16: '#4DB6AC',
      32: '#66BB6A',
      64: '#9CCC65',
      128: '#D4E157',
      256: '#FFEE58',
      512: '#FFCA28',
      1024: '#FFA726',
      2048: '#FF7043',
      4096: '#F4511E',
      8192: '#E53935'
    };
    
    return colors[value] || '#C2185B';
  }

  private easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  private showTutorial() {
    if (!this.ctx || !this.canvas) return;
    
    // Create tutorial overlay
    const tutorialDiv = document.createElement('div');
    tutorialDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.95);
      padding: 30px;
      border-radius: 10px;
      color: white;
      text-align: center;
      max-width: 90%;
      z-index: 1000;
      box-shadow: 0 0 30px rgba(0,0,0,0.8);
    `;
    
    tutorialDiv.innerHTML = `
      <h2 style="color: #4ECDC4; margin-bottom: 20px; font-size: 24px;">
        ${this.language === 'ko' ? '머지 마스터 게임 방법' : 'How to Play Merge Master'}
      </h2>
      <div style="text-align: left; margin-bottom: 20px; font-size: 16px; line-height: 1.6;">
        <p>🎯 <strong>${this.language === 'ko' ? '목표' : 'Goal'}:</strong> ${this.language === 'ko' ? '인접한 같은 숫자를 병합하여 높은 점수를 얻으세요!' : 'Merge adjacent matching numbers to score high!'}</p>
        
        <p style="margin-top: 15px;">📖 <strong>${this.language === 'ko' ? '게임 방법' : 'How to Play'}:</strong></p>
        <ol style="margin-left: 20px;">
          <li>${this.language === 'ko' ? '숫자가 있는 육각형을 클릭/터치하세요 (노란 테두리가 생깁니다)' : 'Click/touch a hexagon with a number (it will get a yellow border)'}</li>
          <li>${this.language === 'ko' ? '인접한 같은 숫자를 클릭하면 병합됩니다' : 'Click an adjacent hexagon with the same number to merge them'}</li>
          <li>${this.language === 'ko' ? '병합하면 숫자가 더해집니다 (2+2=4, 4+4=8...)' : 'Numbers add up when merged (2+2=4, 4+4=8...)'}</li>
          <li>${this.language === 'ko' ? '병합할 때마다 새 타일이 나타납니다' : 'A new tile appears after each merge'}</li>
        </ol>
        
        <p style="margin-top: 15px;">🎁 <strong>${this.language === 'ko' ? '특수 타일' : 'Special Tiles'}:</strong></p>
        <ul style="margin-left: 20px;">
          <li>💣 ${this.language === 'ko' ? '폭탄: 주변 6개 타일을 모두 제거하고 점수 획득' : 'Bomb: Clears all 6 surrounding tiles for points'}</li>
          <li>✨ ${this.language === 'ko' ? '와일드카드: 어떤 숫자와도 병합 가능' : 'Wildcard: Can merge with any number'}</li>
          <li>x2 ${this.language === 'ko' ? '배수: 병합 시 결과값이 2배가 됩니다' : 'Multiplier: Doubles the result when merging'}</li>
        </ul>
        
        <p style="margin-top: 15px;">💡 <strong>${this.language === 'ko' ? '팁' : 'Tips'}:</strong> ${this.language === 'ko' ? '연속으로 병합하면 콤보 보너스를 받습니다!' : 'Chain merges for combo bonuses!'}</p>
      </div>
      <button style="padding: 12px 35px; background: #4ECDC4; color: #1a1a2e; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 16px;">
        ${this.language === 'ko' ? '시작하기!' : 'Start Playing!'}
      </button>
    `;
    
    this.container?.appendChild(tutorialDiv);
    
    // Close tutorial on button click
    const button = tutorialDiv.querySelector('button');
    button?.addEventListener('click', () => {
      tutorialDiv.remove();
    });
  }

  private playSound(type: string, pitch: number = 1) {
    // Sound implementation using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      switch (type) {
        case 'merge':
          oscillator.frequency.setValueAtTime(440 * pitch, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(880 * pitch, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
        case 'spawn':
          oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          break;
        case 'explosion':
          // Create noise for explosion
          const bufferSize = audioContext.sampleRate * 0.3;
          const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const output = buffer.getChannelData(0);
          
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          
          const noise = audioContext.createBufferSource();
          noise.buffer = buffer;
          
          const filter = audioContext.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1000, audioContext.currentTime);
          filter.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.3);
          
          noise.connect(filter);
          filter.connect(gainNode);
          
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          noise.start(audioContext.currentTime);
          noise.stop(audioContext.currentTime + 0.3);
          return;
        case 'undo':
          oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
          oscillator.frequency.linearRampToValueAtTime(440, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          break;
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // Audio not available
    }
  }
}

interface Tile {
  value: number;
  type: TileType;
  x: number;
  y: number;
  scale: number;
}

type TileType = 'normal' | 'bomb' | 'wildcard' | 'multiplier';

interface Animation {
  type: 'spawn' | 'merge' | 'explode';
  tile: Tile;
  progress: number;
  duration: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  decay: number;
}