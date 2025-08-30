import { BaseGame } from '../core/BaseGame';
import { leaderboardSystem } from '../leaderboard/LeaderboardSystem';
import { tutorialSystem, TutorialConfig } from '../tutorial/TutorialSystem';
import { achievementSystem, Achievement } from '../achievements/AchievementSystem';

interface ColorButton {
  color: string;
  sound: number; // Frequency for Web Audio
  position: { x: number; y: number };
  isActive: boolean;
}

export default class ColorMemory extends BaseGame {
  // Game state
  private sequence: number[] = [];
  private playerSequence: number[] = [];
  private currentLevel: number = 1;
  private isShowingSequence: boolean = false;
  private isPlayerTurn: boolean = false;
  private lives: number = 3;
  private combo: number = 0;
  private sequenceSpeed: number = 600; // ms between colors
  
  // Color buttons
  private buttons: ColorButton[] = [
    { color: '#ff6b6b', sound: 261.63, position: { x: 150, y: 150 }, isActive: false }, // Red - C4
    { color: '#4ecdc4', sound: 329.63, position: { x: 450, y: 150 }, isActive: false }, // Blue - E4
    { color: '#ffe66d', sound: 392.00, position: { x: 150, y: 450 }, isActive: false }, // Yellow - G4
    { color: '#95e1d3', sound: 523.25, position: { x: 450, y: 450 }, isActive: false }, // Green - C5
  ];
  
  // Audio context
  private audioContext: AudioContext | null = null;
  
  // Animation
  private buttonAnimations: Map<number, number> = new Map();
  
  // Language support
  private language: 'ko' | 'en' = 'ko';
  private texts = {
    ko: {
      ready: '준비하세요!',
      watch: '패턴을 보세요',
      yourTurn: '당신 차례!',
      correct: '정답!',
      wrong: '틀렸어요!',
      gameOver: '게임 오버!',
      newRecord: '신기록!',
      level: '레벨',
      score: '점수',
      lives: '생명',
      combo: '콤보'
    },
    en: {
      ready: 'Get Ready!',
      watch: 'Watch the pattern',
      yourTurn: 'Your turn!',
      correct: 'Correct!',
      wrong: 'Wrong!',
      gameOver: 'Game Over!',
      newRecord: 'New Record!',
      level: 'Level',
      score: 'Score',
      lives: 'Lives',
      combo: 'Combo'
    }
  };

  constructor() {
    super({
      canvasWidth: 600,
      canvasHeight: 600,
      backgroundColor: '#2d3436',
      gameName: 'Color Memory',
      gameId: 'color-memory'
    });
    
    // Set window reference for restart
    (window as any).currentGame = this;
  }

  protected setupGame(): void {
    if (!this.container) return;
    
    // Load language preference
    const savedLanguage = localStorage.getItem('flux-game-language');
    if (savedLanguage === 'ko' || savedLanguage === 'en') {
      this.language = savedLanguage;
    }
    
    // Setup game HTML
    this.container.innerHTML = this.createGameHTML();
    
    // Get canvas and context
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.canvas.width = this.config.canvasWidth;
      this.canvas.height = this.config.canvasHeight;
      this.ctx = this.canvas.getContext('2d');
      
      // Add click handler
      this.canvas.addEventListener('click', this.handleClick.bind(this));
    }
    
    // Initialize audio context
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.error('Web Audio API not supported');
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyPress.bind(this));
    
    // Setup share button
    this.setupShareButton();
    
    // Show tutorial on first play
    this.showTutorial();
  }

  protected initialize(): void {
    this.sequence = [];
    this.playerSequence = [];
    this.currentLevel = 1;
    this.score = 0;
    this.lives = 3;
    this.combo = 0;
    this.isShowingSequence = false;
    this.isPlayerTurn = false;
    this.sequenceSpeed = 600;
    this.gameOver = false;
    this.particles = [];
    
    // Clear animations
    this.buttonAnimations.clear();
    
    // Start first level after delay
    setTimeout(() => this.startLevel(), 1000);
  }

  private startLevel(): void {
    if (this.gameOver) return;
    
    // Add new color to sequence
    this.sequence.push(Math.floor(Math.random() * 4));
    this.playerSequence = [];
    this.isShowingSequence = true;
    this.isPlayerTurn = false;
    
    // Calculate speed based on level
    this.sequenceSpeed = Math.max(200, 600 - (this.currentLevel - 1) * 20);
    
    // Show sequence after delay
    setTimeout(() => this.showSequence(), 500);
  }

  private async showSequence(): Promise<void> {
    for (let i = 0; i < this.sequence.length; i++) {
      if (this.gameOver) return;
      
      await this.flashButton(this.sequence[i]);
      await this.delay(this.sequenceSpeed / 2);
    }
    
    this.isShowingSequence = false;
    this.isPlayerTurn = true;
  }

  private async flashButton(index: number): Promise<void> {
    this.buttons[index].isActive = true;
    this.playSound(this.buttons[index].sound);
    this.buttonAnimations.set(index, 1);
    
    await this.delay(this.sequenceSpeed);
    
    this.buttons[index].isActive = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleClick(event: MouseEvent): void {
    if (!this.canvas || !this.isPlayerTurn || this.gameOver) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check which button was clicked
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];
      const distance = Math.sqrt(
        Math.pow(x - button.position.x, 2) + 
        Math.pow(y - button.position.y, 2)
      );
      
      if (distance < 100) {
        this.handleButtonPress(i);
        break;
      }
    }
  }

  private handleKeyPress(event: KeyboardEvent): void {
    if (!this.isPlayerTurn || this.gameOver) return;
    
    // Map keys to buttons: Q, W, A, S or Arrow keys
    const keyMap: { [key: string]: number } = {
      'q': 0, 'Q': 0, 'ArrowLeft': 0,
      'w': 1, 'W': 1, 'ArrowUp': 1,
      'a': 2, 'A': 2, 'ArrowDown': 2,
      's': 3, 'S': 3, 'ArrowRight': 3
    };
    
    if (keyMap.hasOwnProperty(event.key)) {
      this.handleButtonPress(keyMap[event.key]);
    }
  }

  private async handleButtonPress(index: number): Promise<void> {
    if (!this.isPlayerTurn) return;
    
    // Visual and audio feedback
    await this.flashButton(index);
    
    // Add to player sequence
    this.playerSequence.push(index);
    
    // Check if correct
    const currentIndex = this.playerSequence.length - 1;
    if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
      // Wrong!
      this.handleMistake();
    } else if (this.playerSequence.length === this.sequence.length) {
      // Completed the sequence!
      this.handleLevelComplete();
    }
  }

  private handleMistake(): void {
    this.lives--;
    this.combo = 0;
    this.isPlayerTurn = false;
    
    // Play error sound
    this.playErrorSound();
    
    // Create error particles
    for (const button of this.buttons) {
      this.createParticles(button.position.x, button.position.y, 5, '#ff6b6b', 3);
    }
    
    // Update UI
    this.updateUI();
    
    if (this.lives <= 0) {
      this.endGame();
    } else {
      // Retry the same sequence
      this.playerSequence = [];
      setTimeout(() => {
        this.isPlayerTurn = true;
      }, 1000);
    }
  }

  private handleLevelComplete(): void {
    this.currentLevel++;
    this.combo++;
    
    // Calculate score
    const levelScore = 100 * this.currentLevel;
    const comboBonus = this.combo > 1 ? 50 * (this.combo - 1) : 0;
    this.updateScore(levelScore + comboBonus);
    
    // Play success sound
    this.playSuccessSound();
    
    // Create success particles
    for (const button of this.buttons) {
      this.createParticles(button.position.x, button.position.y, 8, button.color, 4);
    }
    
    // Check achievements
    this.checkAchievements();
    
    // Update UI
    this.updateUI();
    
    // Start next level
    this.isPlayerTurn = false;
    setTimeout(() => this.startLevel(), 1500);
  }

  private checkAchievements(): void {
    // Define achievements for Color Memory
    const achievements = [
      { id: 'color-memory-level-10', level: 10 },
      { id: 'color-memory-level-20', level: 20 },
      { id: 'color-memory-perfect-10', level: 10, condition: () => this.lives === 3 },
      { id: 'color-memory-combo-master', condition: () => this.combo >= 10 }
    ];
    
    achievements.forEach(achievement => {
      if (achievement.level && this.currentLevel >= achievement.level) {
        if (!achievement.condition || achievement.condition()) {
          achievementSystem.checkAchievement(achievement.id);
        }
      } else if (achievement.condition && achievement.condition()) {
        achievementSystem.checkAchievement(achievement.id);
      }
    });
  }

  protected update(deltaTime: number): void {
    if (this.gameOver) return;
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Update button animations
    this.buttonAnimations.forEach((scale, index) => {
      const newScale = scale - deltaTime * 2;
      if (newScale <= 0) {
        this.buttonAnimations.delete(index);
      } else {
        this.buttonAnimations.set(index, newScale);
      }
    });
  }

  protected draw(): void {
    if (!this.ctx) return;
    
    // Clear and draw background
    this.drawThemedBackground();
    
    // Draw game board
    this.drawBoard();
    
    // Draw buttons
    this.drawButtons();
    
    // Draw particles
    this.drawParticles();
    
    // Draw UI text
    this.drawUI();
  }

  private drawBoard(): void {
    if (!this.ctx) return;
    
    // Draw center circle
    this.ctx.strokeStyle = this.getThemeColor('primary');
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(300, 300, 200, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Draw dividing lines
    this.ctx.beginPath();
    this.ctx.moveTo(300, 100);
    this.ctx.lineTo(300, 500);
    this.ctx.moveTo(100, 300);
    this.ctx.lineTo(500, 300);
    this.ctx.stroke();
  }

  private drawButtons(): void {
    if (!this.ctx) return;
    
    this.buttons.forEach((button, index) => {
      const scale = this.buttonAnimations.get(index) || 0;
      const radius = 80 + scale * 20;
      
      // Draw button shadow
      if (this.shouldShowEffect('shadows')) {
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 10;
        this.ctx.shadowOffsetY = 5;
      }
      
      // Draw button
      this.ctx.fillStyle = button.isActive ? button.color : this.adjustColor(button.color, -30);
      this.ctx.beginPath();
      this.ctx.arc(button.position.x, button.position.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Reset shadow
      this.ctx.shadowColor = 'transparent';
      this.ctx.shadowBlur = 0;
      this.ctx.shadowOffsetY = 0;
      
      // Draw button glow when active
      if (button.isActive && this.shouldShowEffect('glow')) {
        this.ctx.strokeStyle = button.color;
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(button.position.x, button.position.y, radius + 10, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
      }
      
      // Draw button label (keyboard hint)
      const labels = ['Q', 'W', 'A', 'S'];
      this.ctx.fillStyle = this.getThemeColor('textSecondary');
      this.ctx.font = 'bold 24px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(labels[index], button.position.x, button.position.y);
    });
  }

  private drawUI(): void {
    if (!this.ctx) return;
    
    const t = this.texts[this.language];
    
    // Draw status message
    this.ctx.fillStyle = this.getThemeColor('text');
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    
    let message = '';
    if (this.isShowingSequence) {
      message = t.watch;
    } else if (this.isPlayerTurn) {
      message = t.yourTurn;
    } else if (!this.gameOver) {
      message = t.ready;
    }
    
    this.ctx.fillText(message, 300, 50);
    
    // Draw combo indicator
    if (this.combo > 1) {
      this.ctx.fillStyle = this.getThemeColor('success');
      this.ctx.font = 'bold 20px Arial';
      this.ctx.fillText(`${t.combo} x${this.combo}!`, 300, 80);
    }
  }

  private updateUI(): void {
    // Update score
    const scoreElement = document.getElementById('score');
    if (scoreElement) scoreElement.textContent = this.score.toString();
    
    // Update high score
    const highScoreElement = document.getElementById('highscore');
    if (highScoreElement) highScoreElement.textContent = this.highScore.toString();
    
    // Update additional stats
    const levelElement = document.getElementById('level');
    if (levelElement) levelElement.textContent = this.currentLevel.toString();
    
    const livesElement = document.getElementById('lives');
    if (livesElement) livesElement.textContent = '❤️'.repeat(this.lives);
  }

  private adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private playSound(frequency: number): void {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.3);
  }

  private playSuccessSound(): void {
    if (!this.audioContext) return;
    
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      setTimeout(() => this.playSound(freq), i * 100);
    });
  }

  private playErrorSound(): void {
    if (!this.audioContext) return;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = 150;
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  private endGame(): void {
    this.gameOver = true;
    
    // Submit score to leaderboard
    this.submitScoreToLeaderboard();
    
    // Show game over overlay
    const t = this.texts[this.language];
    const additionalInfo = this.score > this.highScore ? 
      `<p style="color: #4ecdc4; font-size: 20px; margin: 10px 0;">${t.newRecord}!</p>` : '';
    
    this.createGameOverlay(t.gameOver, this.score, additionalInfo);
  }

  private showTutorial(): void {
    const t = this.texts[this.language];
    
    const tutorialConfig: TutorialConfig = {
      gameId: 'color-memory',
      showOnFirstPlay: true,
      version: 1,
      steps: [
        {
          id: 'welcome',
          title: this.language === 'ko' ? '컬러 메모리에 오신 것을 환영합니다!' : 'Welcome to Color Memory!',
          description: this.language === 'ko' ? 
            '색상 패턴을 기억하고 따라하는 게임입니다.' : 
            'Remember and repeat the color patterns.',
          position: 'center',
          nextTrigger: 'click'
        },
        {
          id: 'controls',
          title: this.language === 'ko' ? '조작 방법' : 'How to Play',
          description: this.language === 'ko' ? 
            '마우스 클릭이나 키보드(Q, W, A, S)를 사용하세요.' : 
            'Use mouse clicks or keyboard (Q, W, A, S) to play.',
          position: 'bottom',
          nextTrigger: 'click'
        },
        {
          id: 'lives',
          title: this.language === 'ko' ? '생명과 콤보' : 'Lives and Combos',
          description: this.language === 'ko' ? 
            '3번의 기회가 있으며, 연속 성공 시 콤보 보너스를 받습니다.' : 
            'You have 3 lives. Get combo bonuses for consecutive successes.',
          position: 'top',
          nextTrigger: 'click'
        }
      ]
    };
    
    tutorialSystem.startTutorial(tutorialConfig);
  }

  protected createGameHTML(additionalStats: string = ''): string {
    const t = this.texts[this.language];
    
    const stats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">${t.level}</div>
        <div id="level" style="font-size: 24px; font-weight: bold;">1</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #666;">${t.lives}</div>
        <div id="lives" style="font-size: 24px; font-weight: bold;">❤️❤️❤️</div>
      </div>
    `;
    
    return super.createGameHTML(stats);
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyPress.bind(this));
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}