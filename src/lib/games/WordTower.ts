import { BaseGame } from '../core/BaseGame';
import { GameUI } from '../core/GameUI';
import { GameUtils } from '../core/GameUtils';
import { PowerUpManager } from '../core/GameComponents';

interface Letter {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  falling: boolean;
  landed: boolean;
  used: boolean;
  velocity: number;
  color: string;
  isSpecial?: boolean;
  points?: number;
}

interface Word {
  text: string;
  x: number;
  y: number;
  points: number;
  opacity: number;
  velocity: number;
}

export default class WordTower extends BaseGame {
  // Game objects
  private letters: Letter[] = [];
  private fallingLetters: Letter[] = [];
  private currentWord: string = '';
  private completedWords: Word[] = [];
  private towerHeight: number = 0;
  private combo: number = 0;
  private longestWord: string = '';
  
  // Game mechanics
  private letterSpawnTimer: number = 0;
  private letterSpawnInterval: number = 1.5;
  private fallSpeed: number = 100;
  private groundY: number = 500;
  private letterSize: number = 40;
  private maxTowerHeight: number = 0;
  
  // Power-ups
  private powerUpManager: PowerUpManager;
  private bombsAvailable: number = 3;
  private freezeAvailable: boolean = true;
  private doublePointsActive: boolean = false;
  
  // Word validation
  private validWords: Set<string> = new Set();
  private commonWords: string[] = [
    'CAT', 'DOG', 'RUN', 'JUMP', 'PLAY', 'GAME', 'WORD', 'TOWER', 'SCORE',
    'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER',
    'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'HAD', 'HAS', 'HIS', 'HOW', 'ITS',
    'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID',
    'HIM', 'SHE', 'TOO', 'USE', 'HER', 'FEW', 'BIG', 'BAD', 'FAR', 'OWN',
    'BACK', 'CALL', 'CAME', 'COME', 'EACH', 'FEEL', 'FIND', 'GIVE', 'GOOD',
    'HAND', 'HAVE', 'HERE', 'HOME', 'KEEP', 'KIND', 'KNOW', 'LAST', 'LATE',
    'LIFE', 'LIVE', 'LOOK', 'MADE', 'MAKE', 'MANY', 'OVER', 'SAID', 'SAME',
    'SEEM', 'TAKE', 'TELL', 'THAN', 'THAT', 'THEM', 'THEN', 'THEY', 'THIS',
    'TIME', 'VERY', 'WANT', 'WELL', 'WENT', 'WERE', 'WHAT', 'WHEN', 'WITH',
    'WORK', 'YEAR', 'ABLE', 'BEST', 'BETTER', 'BETWEEN', 'BLACK', 'BRING',
    'BUILD', 'CARRY', 'CLEAN', 'CLOSE', 'COVER', 'CROSS', 'DANCE', 'DREAM'
  ];
  
  // Visual effects
  private screenShake: number = 0;
  private starParticles: any[] = [];
  
  // Letter distribution (English frequency)
  private letterFrequency: { [key: string]: number } = {
    'E': 12, 'T': 9, 'A': 8, 'O': 7, 'I': 7, 'N': 7, 'S': 6, 'H': 6,
    'R': 6, 'D': 4, 'L': 4, 'C': 3, 'U': 3, 'M': 2, 'W': 2, 'F': 2,
    'G': 2, 'Y': 2, 'P': 2, 'B': 1, 'V': 1, 'K': 1, 'J': 1, 'X': 1,
    'Q': 1, 'Z': 1
  };

  constructor() {
    super({
      canvasWidth: 600,
      canvasHeight: 700,
      gameName: 'Word Tower',
      backgroundColor: '#2c3e50'
    });
    
    this.powerUpManager = new PowerUpManager();
    this.initializeWordList();
  }

  protected setupGame(): void {
    if (!this.container) return;
    
    const additionalStats = `
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #e74c3c;">Combo</div>
        <div id="combo" style="font-size: 24px; font-weight: bold; color: #e74c3c;">x${this.combo}</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 16px; color: #3498db;">Height</div>
        <div id="height" style="font-size: 24px; font-weight: bold; color: #3498db;">${Math.floor(this.towerHeight)}m</div>
      </div>
    `;
    
    this.container.innerHTML = this.createGameHTML(additionalStats);
    
    // Add game-specific UI elements
    const gameContainer = this.container.querySelector('.game-container');
    if (gameContainer) {
      // Add current word display
      const wordDisplay = document.createElement('div');
      wordDisplay.id = 'current-word';
      wordDisplay.style.cssText = `
        position: absolute;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 36px;
        font-weight: bold;
        color: #f39c12;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        letter-spacing: 5px;
        min-height: 50px;
      `;
      gameContainer.appendChild(wordDisplay);
      
      // Add power-up buttons
      const powerUpContainer = document.createElement('div');
      powerUpContainer.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 20px;
      `;
      
      powerUpContainer.innerHTML = `
        <button id="bomb-btn" style="
          padding: 10px 20px;
          font-size: 18px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
        " onclick="window.currentGame.useBomb()">
          💣 Bomb (${this.bombsAvailable})
        </button>
        <button id="freeze-btn" style="
          padding: 10px 20px;
          font-size: 18px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
        " onclick="window.currentGame.useFreeze()">
          ❄️ Freeze
        </button>
        <button id="submit-btn" style="
          padding: 10px 30px;
          font-size: 20px;
          background: #27ae60;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: bold;
        " onclick="window.currentGame.submitWord()">
          Submit Word
        </button>
      `;
      
      gameContainer.appendChild(powerUpContainer);
      
      // Add instructions
      const instructions = document.createElement('div');
      instructions.style.cssText = `
        position: absolute;
        top: 100px;
        left: 20px;
        color: #ecf0f1;
        font-size: 14px;
        background: rgba(0,0,0,0.5);
        padding: 10px;
        border-radius: 5px;
      `;
      instructions.innerHTML = `
        <div>Click letters to build words</div>
        <div>Submit before tower gets too high!</div>
        <div>Longer words = More points</div>
      `;
      gameContainer.appendChild(instructions);
    }
    
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.width = this.config.canvasWidth;
    this.canvas.height = this.config.canvasHeight;
    this.ctx = this.canvas.getContext('2d');
    
    // Mouse/Touch events
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    (window as any).currentGame = this;
  }

  protected initialize(): void {
    this.letters = [];
    this.fallingLetters = [];
    this.currentWord = '';
    this.completedWords = [];
    this.towerHeight = 0;
    this.maxTowerHeight = 0;
    this.combo = 0;
    this.letterSpawnTimer = 0;
    this.screenShake = 0;
    this.bombsAvailable = 3;
    this.freezeAvailable = true;
    this.doublePointsActive = false;
    this.powerUpManager.reset();
    
    // Spawn initial letters
    for (let i = 0; i < 3; i++) {
      this.spawnLetter();
    }
    
    this.updateUI();
  }

  protected update(deltaTime: number): void {
    if (this.gameOver) return;
    
    // Update power-ups
    this.powerUpManager.update(deltaTime);
    
    // Spawn new letters
    if (!this.powerUpManager.isActive('freeze')) {
      this.letterSpawnTimer += deltaTime;
      if (this.letterSpawnTimer >= this.letterSpawnInterval) {
        this.letterSpawnTimer = 0;
        this.spawnLetter();
        
        // Increase difficulty
        this.letterSpawnInterval = Math.max(0.8, this.letterSpawnInterval - 0.01);
        this.fallSpeed = Math.min(200, this.fallSpeed + 0.5);
      }
    }
    
    // Update falling letters
    this.fallingLetters = this.fallingLetters.filter(letter => {
      if (!this.powerUpManager.isActive('freeze')) {
        letter.velocity += 200 * deltaTime; // Gravity
        letter.y += letter.velocity * deltaTime;
      }
      
      // Check collision with landed letters or ground
      let landingY = this.groundY - letter.height;
      
      // Check collision with other letters
      for (const other of this.letters) {
        if (other.landed && !other.used && 
            letter.x < other.x + other.width && 
            letter.x + letter.width > other.x) {
          landingY = Math.min(landingY, other.y - letter.height);
        }
      }
      
      if (letter.y >= landingY) {
        letter.y = landingY;
        letter.landed = true;
        letter.falling = false;
        this.letters.push(letter);
        
        // Calculate tower height
        const heightFromGround = (this.groundY - letter.y) / 40;
        this.towerHeight = Math.max(this.towerHeight, heightFromGround);
        this.maxTowerHeight = Math.max(this.maxTowerHeight, this.towerHeight);
        
        // Check if tower is too high
        if (this.towerHeight > 12) {
          this.endGame();
        }
        
        // Screen shake on landing
        this.screenShake = 5;
        
        return false;
      }
      
      return true;
    });
    
    // Update completed words animation
    this.completedWords = this.completedWords.filter(word => {
      word.y -= word.velocity * deltaTime;
      word.opacity -= deltaTime;
      word.velocity *= 0.98;
      return word.opacity > 0;
    });
    
    // Update star particles
    this.starParticles = this.starParticles.filter(star => {
      star.x += star.vx * deltaTime;
      star.y += star.vy * deltaTime;
      star.vy += 100 * deltaTime;
      star.life -= deltaTime;
      star.rotation += star.rotationSpeed * deltaTime;
      return star.life > 0;
    });
    
    // Update particles
    this.updateParticles(deltaTime);
    
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake *= 0.9;
    }
    
    this.updateUI();
  }

  protected draw(): void {
    if (!this.ctx) return;
    
    // Draw themed background
    this.drawThemedBackground();
    
    // Apply screen shake
    if (this.screenShake > 0.1) {
      this.ctx.save();
      const shake = GameUtils.shake(this.screenShake, 10, Date.now() / 100);
      this.ctx.translate(shake.x, shake.y);
    }
    
    // Draw ground with theme colors
    this.ctx.fillStyle = this.getThemeColor('surface');
    this.ctx.fillRect(0, this.groundY, this.config.canvasWidth, this.config.canvasHeight - this.groundY);
    
    // Draw danger zone
    if (this.towerHeight > 8) {
      this.ctx.fillStyle = `${this.getThemeColor('error')}33`; // 20% opacity
      this.ctx.fillRect(0, 0, this.config.canvasWidth, 200);
    }
    
    // Draw height markers
    this.ctx.strokeStyle = this.getThemeColor('textSecondary');
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    for (let i = 1; i <= 12; i++) {
      const y = this.groundY - i * 40;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.config.canvasWidth, y);
      this.ctx.stroke();
      
      this.ctx.fillStyle = this.getThemeColor('textSecondary');
      this.ctx.font = '12px Arial';
      this.ctx.fillText(`${i}m`, 10, y - 5);
    }
    this.ctx.setLineDash([]);
    
    // Draw letters
    [...this.letters, ...this.fallingLetters].forEach(letter => {
      // Letter shadow
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      this.ctx.fillRect(letter.x + 2, letter.y + 2, letter.width, letter.height);
      
      // Letter block
      const gradient = this.ctx.createLinearGradient(letter.x, letter.y, letter.x, letter.y + letter.height);
      if (letter.used) {
        gradient.addColorStop(0, '#95a5a6');
        gradient.addColorStop(1, '#7f8c8d');
      } else if (letter.isSpecial) {
        gradient.addColorStop(0, '#f39c12');
        gradient.addColorStop(1, '#e67e22');
      } else {
        gradient.addColorStop(0, letter.color);
        gradient.addColorStop(1, GameUtils.darken(letter.color, 0.2));
      }
      
      this.ctx.fillStyle = gradient;
      GameUtils.drawRoundedRect(this.ctx, letter.x, letter.y, letter.width, letter.height, 5);
      this.ctx.fill();
      
      // Letter text
      this.ctx.fillStyle = letter.used ? '#bdc3c7' : '#ffffff';
      this.ctx.font = `bold ${letter.height * 0.6}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(letter.char, letter.x + letter.width / 2, letter.y + letter.height / 2);
      
      // Points indicator for special letters
      if (letter.isSpecial && !letter.used) {
        this.ctx.fillStyle = '#f39c12';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`+${letter.points}`, letter.x + letter.width / 2, letter.y - 5);
      }
    });
    
    // Draw completed words animation
    this.completedWords.forEach(word => {
      this.ctx!.globalAlpha = word.opacity;
      this.ctx!.fillStyle = '#2ecc71';
      this.ctx!.font = 'bold 24px Arial';
      this.ctx!.textAlign = 'center';
      this.ctx!.fillText(word.text, word.x, word.y);
      this.ctx!.font = '16px Arial';
      this.ctx!.fillText(`+${word.points}`, word.x, word.y + 20);
      this.ctx!.globalAlpha = 1;
    });
    
    // Draw star particles
    this.starParticles.forEach(star => {
      this.ctx!.save();
      this.ctx!.globalAlpha = star.life;
      this.ctx!.translate(star.x, star.y);
      this.ctx!.rotate(star.rotation);
      this.ctx!.fillStyle = '#f1c40f';
      GameUtils.drawStar(this.ctx!, 0, 0, 5, star.size, star.size * 0.5);
      this.ctx!.fill();
      this.ctx!.restore();
    });
    
    // Draw particles
    this.drawParticles();
    
    // Draw power-up indicators
    if (this.powerUpManager.isActive('freeze')) {
      this.ctx.fillStyle = 'rgba(52, 152, 219, 0.3)';
      this.ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
      
      // Frost effect on edges
      const gradient = this.ctx.createLinearGradient(0, 0, 0, 50);
      gradient.addColorStop(0, 'rgba(52, 152, 219, 0.5)');
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, this.config.canvasWidth, 50);
    }
    
    if (this.doublePointsActive) {
      this.ctx.fillStyle = '#f39c12';
      this.ctx.font = 'bold 20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('DOUBLE POINTS!', this.config.canvasWidth / 2, 50);
    }
    
    // Restore from screen shake
    if (this.screenShake > 0.1) {
      this.ctx.restore();
    }
  }

  protected cleanup(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private initializeWordList(): void {
    // Add common words to valid words set
    this.commonWords.forEach(word => this.validWords.add(word.toUpperCase()));
    
    // Add more words (in a real game, you'd load from a dictionary file)
    const additionalWords = [
      'FLUX', 'TOWER', 'GAME', 'PLAY', 'SCORE', 'POINT', 'WORD', 'LETTER',
      'BUILD', 'STACK', 'HIGH', 'TALL', 'BEST', 'COOL', 'NICE', 'GREAT'
    ];
    additionalWords.forEach(word => this.validWords.add(word));
  }

  private spawnLetter(): void {
    const letter = this.getRandomLetter();
    const isSpecial = Math.random() < 0.1; // 10% chance for special letter
    
    this.fallingLetters.push({
      char: letter,
      x: Math.random() * (this.config.canvasWidth - this.letterSize),
      y: -this.letterSize,
      width: this.letterSize,
      height: this.letterSize,
      falling: true,
      landed: false,
      used: false,
      velocity: 0,
      color: isSpecial ? '#e74c3c' : '#3498db',
      isSpecial,
      points: isSpecial ? 10 : 1
    });
  }

  private getRandomLetter(): string {
    // Create weighted array
    const weightedLetters: string[] = [];
    Object.entries(this.letterFrequency).forEach(([letter, weight]) => {
      for (let i = 0; i < weight; i++) {
        weightedLetters.push(letter);
      }
    });
    
    return weightedLetters[Math.floor(Math.random() * weightedLetters.length)];
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.selectLetterAt(x, y);
  }

  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
    const rect = this.canvas!.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    this.selectLetterAt(x, y);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      this.submitWord();
    } else if (e.key === 'Backspace') {
      this.removeLetter();
    } else if (e.key >= 'a' && e.key <= 'z') {
      // Try to select letter by keyboard
      const letter = e.key.toUpperCase();
      const availableLetter = this.letters.find(l => l.char === letter && !l.used && l.landed);
      if (availableLetter) {
        this.selectLetter(availableLetter);
      }
    }
  }

  private selectLetterAt(x: number, y: number): void {
    for (const letter of this.letters) {
      if (!letter.used && letter.landed &&
          x >= letter.x && x <= letter.x + letter.width &&
          y >= letter.y && y <= letter.y + letter.height) {
        this.selectLetter(letter);
        break;
      }
    }
  }

  private selectLetter(letter: Letter): void {
    letter.used = true;
    this.currentWord += letter.char;
    
    // Create selection effect
    this.createParticles(
      letter.x + letter.width / 2,
      letter.y + letter.height / 2,
      5,
      '#2ecc71',
      3
    );
    
    this.updateCurrentWordDisplay();
  }

  private removeLetter(): void {
    if (this.currentWord.length > 0) {
      const lastChar = this.currentWord[this.currentWord.length - 1];
      this.currentWord = this.currentWord.slice(0, -1);
      
      // Find and unmark the last used letter
      for (let i = this.letters.length - 1; i >= 0; i--) {
        if (this.letters[i].used && this.letters[i].char === lastChar) {
          this.letters[i].used = false;
          break;
        }
      }
      
      this.updateCurrentWordDisplay();
    }
  }

  public submitWord(): void {
    if (this.currentWord.length < 2) return;
    
    if (this.validWords.has(this.currentWord) || this.currentWord.length >= 3) {
      // Calculate points
      let points = 0;
      const usedLetters: Letter[] = [];
      
      // Find all used letters
      for (const letter of this.letters) {
        if (letter.used) {
          points += letter.points || 1;
          usedLetters.push(letter);
        }
      }
      
      // Length bonus
      points *= this.currentWord.length;
      
      // Combo bonus
      if (this.combo > 0) {
        points *= (1 + this.combo * 0.1);
      }
      
      // Double points power-up
      if (this.doublePointsActive) {
        points *= 2;
      }
      
      this.updateScore(Math.floor(points));
      this.combo++;
      
      // Track longest word
      if (this.currentWord.length > this.longestWord.length) {
        this.longestWord = this.currentWord;
      }
      
      // Add completed word animation
      this.completedWords.push({
        text: this.currentWord,
        x: this.config.canvasWidth / 2,
        y: 300,
        points: Math.floor(points),
        opacity: 1,
        velocity: 100
      });
      
      // Remove used letters and let others fall
      this.removeUsedLetters(usedLetters);
      
      // Create star particles for good words
      if (this.currentWord.length >= 5) {
        this.createStarBurst(this.config.canvasWidth / 2, 300);
      }
      
      // Power-up rewards
      if (this.currentWord.length >= 6) {
        this.bombsAvailable++;
        this.updatePowerUpButtons();
      }
      
      if (this.currentWord.length >= 7) {
        this.doublePointsActive = true;
        setTimeout(() => { this.doublePointsActive = false; }, 10000);
      }
      
      // Sound effect would go here
      this.currentWord = '';
      this.updateCurrentWordDisplay();
    } else {
      // Invalid word
      this.combo = 0;
      this.screenShake = 10;
      
      // Unmark all letters
      this.letters.forEach(letter => {
        if (letter.used) letter.used = false;
      });
      
      this.currentWord = '';
      this.updateCurrentWordDisplay();
    }
  }

  private removeUsedLetters(usedLetters: Letter[]): void {
    // Remove letters from array
    usedLetters.forEach(letter => {
      const index = this.letters.indexOf(letter);
      if (index > -1) {
        this.letters.splice(index, 1);
      }
    });
    
    // Make letters above fall
    this.letters.forEach(letter => {
      if (letter.landed && !letter.used) {
        let shouldFall = true;
        let newLandingY = this.groundY - letter.height;
        
        // Check if there's support below
        for (const other of this.letters) {
          if (other !== letter && other.landed &&
              letter.x < other.x + other.width &&
              letter.x + letter.width > other.x &&
              other.y > letter.y) {
            shouldFall = false;
            break;
          }
        }
        
        if (shouldFall) {
          letter.landed = false;
          letter.falling = true;
          letter.velocity = 0;
          this.fallingLetters.push(letter);
          this.letters.splice(this.letters.indexOf(letter), 1);
        }
      }
    });
    
    // Recalculate tower height
    this.towerHeight = 0;
    this.letters.forEach(letter => {
      const heightFromGround = (this.groundY - letter.y) / 40;
      this.towerHeight = Math.max(this.towerHeight, heightFromGround);
    });
  }

  public useBomb(): void {
    if (this.bombsAvailable <= 0) return;
    
    this.bombsAvailable--;
    this.updatePowerUpButtons();
    
    // Remove bottom row of letters
    const bottomLetters = this.letters.filter(letter => 
      letter.y >= this.groundY - this.letterSize * 2
    );
    
    // Create explosion effect
    bottomLetters.forEach(letter => {
      this.createParticles(
        letter.x + letter.width / 2,
        letter.y + letter.height / 2,
        10,
        '#e74c3c',
        5
      );
    });
    
    this.removeUsedLetters(bottomLetters);
    this.screenShake = 20;
  }

  public useFreeze(): void {
    if (!this.freezeAvailable) return;
    
    this.freezeAvailable = false;
    this.powerUpManager.activate('freeze', 5000);
    this.updatePowerUpButtons();
    
    // Re-enable after cooldown
    setTimeout(() => {
      this.freezeAvailable = true;
      this.updatePowerUpButtons();
    }, 15000);
  }

  private createStarBurst(x: number, y: number): void {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10;
      this.starParticles.push({
        x,
        y,
        vx: Math.cos(angle) * 200,
        vy: Math.sin(angle) * 200 - 100,
        size: 10 + Math.random() * 5,
        life: 1,
        rotation: 0,
        rotationSpeed: Math.random() * 10 - 5
      });
    }
  }

  private updateCurrentWordDisplay(): void {
    const display = document.getElementById('current-word');
    if (display) {
      display.textContent = this.currentWord || ' ';
    }
  }

  private updatePowerUpButtons(): void {
    const bombBtn = document.getElementById('bomb-btn');
    if (bombBtn) {
      bombBtn.textContent = `💣 Bomb (${this.bombsAvailable})`;
      bombBtn.style.opacity = this.bombsAvailable > 0 ? '1' : '0.5';
    }
    
    const freezeBtn = document.getElementById('freeze-btn');
    if (freezeBtn) {
      freezeBtn.style.opacity = this.freezeAvailable ? '1' : '0.5';
    }
  }

  private updateUI(): void {
    document.getElementById('score')!.textContent = this.score.toString();
    document.getElementById('highscore')!.textContent = this.highScore.toString();
    document.getElementById('combo')!.textContent = `x${this.combo}`;
    document.getElementById('height')!.textContent = `${Math.floor(this.towerHeight)}m`;
  }

  private endGame(): void {
    this.gameOver = true;
    
    const additionalInfo = `
      <p style="font-size: 20px; margin-bottom: 10px;">Max Height: ${Math.floor(this.maxTowerHeight)}m</p>
      <p style="font-size: 18px; margin-bottom: 10px;">Longest Word: ${this.longestWord || 'None'}</p>
    `;
    
    this.createGameOverlay('Tower Collapsed!', this.score, additionalInfo);
  }

  public restart(): void {
    super.restart();
    this.updatePowerUpButtons();
  }
}