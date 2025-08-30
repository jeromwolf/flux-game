import { ThemeManager, ThemeConfig } from './ThemeSystem';
import { leaderboardSystem } from '../leaderboard/LeaderboardSystem';
import { shareSystem } from '../share/ShareSystem';

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX?: number;
  velocityY?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size?: number;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor?: string;
  gameName: string;
  gameId: string; // 리더보드용 고유 ID
}

export abstract class BaseGame {
  protected container: HTMLElement | null = null;
  protected canvas: HTMLCanvasElement | null = null;
  protected ctx: CanvasRenderingContext2D | null = null;
  protected animationId: number | null = null;
  
  // Common game state
  protected score: number = 0;
  protected highScore: number = 0;
  protected gameOver: boolean = false;
  protected isPaused: boolean = false;
  protected particles: Particle[] = [];
  
  // Leaderboard state
  protected playerName: string = '';
  protected hasSubmittedScore: boolean = false;
  
  // Configuration
  protected config: GameConfig;
  
  // Theme system
  protected themeManager: ThemeManager;
  protected currentTheme: ThemeConfig;
  
  constructor(config: GameConfig) {
    this.config = config;
    this.themeManager = ThemeManager.getInstance();
    this.currentTheme = this.themeManager.getCurrentTheme();
    this.loadHighScore();
    this.loadPlayerName();
    
    // Listen for theme changes
    this.themeManager.addListener(this.onThemeChange.bind(this));
  }
  
  // Lifecycle methods
  mount(container: HTMLElement): void {
    this.container = container;
    this.setupGame();
    this.initialize();
    this.startGameLoop();
  }
  
  unmount(): void {
    this.stopGameLoop();
    this.cleanup();
    this.themeManager.removeListener(this.onThemeChange.bind(this));
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
  
  // Abstract methods that games must implement
  protected abstract setupGame(): void;
  protected abstract initialize(): void;
  protected abstract update(deltaTime: number): void;
  protected abstract draw(): void;
  protected abstract cleanup(): void;
  
  // Common game loop
  private lastTime: number = 0;
  
  protected startGameLoop(): void {
    this.lastTime = performance.now();
    this.gameLoop();
  }
  
  protected stopGameLoop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  private gameLoop = (): void => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;
    
    if (!this.isPaused) {
      this.update(deltaTime);
      this.draw();
    }
    
    this.animationId = requestAnimationFrame(this.gameLoop);
  };
  
  // Common utility methods
  protected checkCollision(a: GameObject, b: GameObject, margin: number = 0): boolean {
    return a.x + margin < b.x + b.width - margin &&
           a.x + a.width - margin > b.x + margin &&
           a.y + margin < b.y + b.height - margin &&
           a.y + a.height - margin > b.y + margin;
  }
  
  protected createParticles(x: number, y: number, count: number, color: string, speed: number = 5): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
        vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
        life: 1,
        color,
        size: 3 + Math.random() * 3
      });
    }
  }
  
  protected updateParticles(deltaTime: number, gravity: number = 300): void {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx * deltaTime;
      particle.y += particle.vy * deltaTime;
      particle.vy += gravity * deltaTime;
      particle.life -= deltaTime * 2;
      
      return particle.life > 0;
    });
  }
  
  protected drawParticles(): void {
    if (!this.ctx) return;
    
    this.particles.forEach(particle => {
      this.ctx!.globalAlpha = particle.life;
      this.ctx!.fillStyle = particle.color;
      this.ctx!.beginPath();
      this.ctx!.arc(particle.x, particle.y, particle.size || 3, 0, Math.PI * 2);
      this.ctx!.fill();
    });
    
    this.ctx.globalAlpha = 1;
  }
  
  // Score management
  protected updateScore(points: number): void {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }
  
  // Leaderboard methods
  protected loadPlayerName(): void {
    this.playerName = localStorage.getItem('flux-game-player-name') || '';
  }
  
  protected savePlayerName(name: string): void {
    this.playerName = name;
    localStorage.setItem('flux-game-player-name', name);
  }
  
  protected async submitScoreToLeaderboard(): Promise<void> {
    if (!this.playerName || this.hasSubmittedScore) return;
    
    try {
      const result = await leaderboardSystem.submitScore(
        this.config.gameId,
        this.playerName,
        this.score
      );
      
      this.hasSubmittedScore = true;
      
      // 리더보드 모달 표시
      this.showLeaderboard();
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
  }
  
  protected showLeaderboard(): void {
    // 게임별로 구현하거나 공통 모달 사용
    console.log('Showing leaderboard for', this.config.gameName);
  }
  
  protected loadHighScore(): void {
    const key = `${this.config.gameName.toLowerCase().replace(/\s+/g, '-')}-highscore`;
    this.highScore = parseInt(localStorage.getItem(key) || '0');
  }
  
  protected saveHighScore(): void {
    const key = `${this.config.gameName.toLowerCase().replace(/\s+/g, '-')}-highscore`;
    localStorage.setItem(key, this.highScore.toString());
  }
  
  // Common UI creation
  protected createGameHTML(additionalStats: string = ''): string {
    return `
      <div class="game-container" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        background: ${this.config.backgroundColor || '#f0f0f0'};
        min-height: 100vh;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h1 style="
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        ">${this.config.gameName}</h1>
        
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
            <div style="font-size: 16px; color: #ff6b6b;">Best</div>
            <div id="highscore" style="font-size: 24px; font-weight: bold; color: #ff6b6b;">${this.highScore}</div>
          </div>
          <button id="leaderboard-btn" style="
            padding: 8px 16px;
            font-size: 14px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          ">🏆 Leaderboard</button>
          <button id="share-btn" style="
            padding: 8px 16px;
            font-size: 14px;
            background: linear-gradient(135deg, #4ecdc4, #44a08d);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
          ">📤 Share</button>
          ${additionalStats}
        </div>

        <canvas id="game-canvas" style="
          border: 2px solid #333;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          cursor: pointer;
        "></canvas>
        
        <div id="game-overlays"></div>
      </div>
    `;
  }
  
  protected createGameOverlay(title: string, score: number, additionalInfo: string = ''): void {
    const overlay = document.createElement('div');
    overlay.id = 'game-over';
    overlay.style.cssText = `
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    // 플레이어 이름 입력 또는 점수 제출
    const nameInputSection = !this.playerName ? `
      <div style="margin: 20px 0;">
        <input type="text" id="player-name-input" placeholder="이름을 입력하세요" style="
          padding: 10px 20px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 8px;
          width: 200px;
          margin-right: 10px;
        ">
        <button onclick="window.currentGame.submitScore()" style="
          padding: 10px 20px;
          font-size: 16px;
          font-weight: bold;
          color: white;
          background: linear-gradient(135deg, #ff6b6b, #ff8787);
          border: none;
          border-radius: 8px;
          cursor: pointer;
        ">점수 등록</button>
      </div>
    ` : `
      <button onclick="window.currentGame.submitScoreWithName()" style="
        padding: 10px 20px;
        font-size: 16px;
        font-weight: bold;
        color: white;
        background: linear-gradient(135deg, #ff6b6b, #ff8787);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        margin: 20px 0;
      ">리더보드에 등록 (${this.playerName})</button>
    `;
    
    overlay.innerHTML = `
      <h2 style="font-size: 36px; margin-bottom: 20px; color: #ff6b6b;">${title}</h2>
      <p style="font-size: 24px; margin-bottom: 10px;">Score: ${score}</p>
      ${additionalInfo}
      ${!this.hasSubmittedScore ? nameInputSection : ''}
      <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
        <button onclick="window.currentGame.shareScore()" style="
          padding: 15px 30px;
          font-size: 18px;
          font-weight: bold;
          color: white;
          background: linear-gradient(135deg, #4ecdc4, #44a08d);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">📤 Share</button>
        <button onclick="window.currentGame.restart()" style="
          padding: 15px 40px;
          font-size: 18px;
          font-weight: bold;
          color: white;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">Play Again</button>
      </div>
    `;
    
    const overlaysContainer = document.getElementById('game-overlays');
    if (overlaysContainer) {
      overlaysContainer.appendChild(overlay);
    }
  }
  
  protected removeGameOverlay(): void {
    const overlay = document.getElementById('game-over');
    if (overlay) {
      overlay.remove();
    }
  }
  
  // Common restart functionality
  public restart(): void {
    this.removeGameOverlay();
    this.score = 0;
    this.gameOver = false;
    this.particles = [];
    this.hasSubmittedScore = false;
    this.initialize();
  }
  
  // Score submission methods
  public submitScore(): void {
    const input = document.getElementById('player-name-input') as HTMLInputElement;
    if (!input) return;
    
    const name = input.value.trim();
    const validation = leaderboardSystem.validatePlayerName(name);
    
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    
    this.savePlayerName(name);
    this.submitScoreToLeaderboard();
  }
  
  public submitScoreWithName(): void {
    this.submitScoreToLeaderboard();
  }
  
  // Share functionality
  public async shareScore(): Promise<void> {
    const language = (localStorage.getItem('flux-game-language') as 'ko' | 'en') || 'ko';
    
    await shareSystem.shareGame({
      gameId: this.config.gameId,
      gameName: this.config.gameName,
      score: this.score
    }, {
      platforms: ['native', 'twitter', 'facebook', 'kakao', 'clipboard'],
      language
    });
  }
  
  // Share button handler for main UI
  protected setupShareButton(): void {
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareScore());
    }
  }
  
  // Theme change handler
  protected onThemeChange(theme: ThemeConfig): void {
    this.currentTheme = theme;
    // Redraw the game with new theme
    if (this.ctx) {
      this.draw();
    }
  }
  
  // Theme helper methods
  protected getThemeColor(colorKey: keyof ThemeConfig['colors']): string {
    return this.currentTheme.colors[colorKey];
  }
  
  protected getThemeGradient(direction: string, color1Key: keyof ThemeConfig['colors'], color2Key: keyof ThemeConfig['colors']): string {
    return this.themeManager.getGradient(direction, color1Key, color2Key);
  }
  
  protected shouldShowEffect(effect: keyof NonNullable<ThemeConfig['effects']>): boolean {
    return this.themeManager.shouldShowEffect(effect);
  }
  
  protected drawThemedBackground(): void {
    if (!this.ctx) return;
    
    const bgColor = this.getThemeColor('background');
    const surfaceColor = this.getThemeColor('surface');
    
    if (this.shouldShowEffect('gradients')) {
      const gradient = this.ctx.createLinearGradient(0, 0, 0, this.config.canvasHeight);
      gradient.addColorStop(0, bgColor);
      gradient.addColorStop(1, surfaceColor);
      this.ctx.fillStyle = gradient;
    } else {
      this.ctx.fillStyle = bgColor;
    }
    
    this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
  }
}