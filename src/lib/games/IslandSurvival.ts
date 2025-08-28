interface Resources {
  wood: number;
  stone: number;
  food: number;
  water: number;
}

interface CraftableItem {
  name: string;
  cost: Partial<Resources>;
  effect: () => void;
  crafted?: boolean;
}

// Sound effects
const SOUNDS = {
  collect: { frequency: 440, duration: 100, type: 'sine' as OscillatorType },
  craft: { frequency: 600, duration: 200, type: 'square' as OscillatorType },
  eat: { frequency: 800, duration: 150, type: 'sine' as OscillatorType },
  damage: { frequency: 200, duration: 300, type: 'sawtooth' as OscillatorType },
  success: { frequency: 880, duration: 400, type: 'sine' as OscillatorType },
  danger: { frequency: 150, duration: 500, type: 'triangle' as OscillatorType }
};

export default class IslandSurvival {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number | null = null;
  private audioCtx: AudioContext | null = null;
  
  private gameState: 'menu' | 'playing' | 'gameOver' = 'menu';
  private day: number = 1;
  private timeOfDay: 'day' | 'night' = 'day';
  private weather: 'sunny' | 'rainy' | 'stormy' = 'sunny';
  
  // Player stats
  private health: number = 100;
  private hunger: number = 100;
  private thirst: number = 100;
  
  // Resources
  private resources: Resources = {
    wood: 0,
    stone: 0,
    food: 5,
    water: 5
  };
  
  // Crafted items
  private hasShelter: boolean = false;
  private hasFire: boolean = false;
  private hasTools: boolean = false;
  private hasRaft: boolean = false;
  
  // UI elements
  private selectedAction: string | null = null;
  private message: string = 'Welcome to the island. Survive until rescue arrives!';
  private messageTimer: number = 0;
  
  // Difficulty
  private hungerRate: number = 5;
  private thirstRate: number = 7;
  private stormDamage: number = 10;
  
  // Theme colors
  private theme = {
    colors: {
      primary: '#06b6d4',
      secondary: '#8b5cf6',
      background: '#0a0a0a',
      surface: '#1a1a1a',
      text: '#ffffff',
      textSecondary: '#9ca3af',
      border: '#374151'
    }
  };

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.width = 480;
    this.canvas.height = 854;
    this.canvas.style.width = '100%';
    this.canvas.style.maxWidth = '480px';
    this.canvas.style.height = 'auto';
    this.canvas.style.margin = '0 auto';
    this.canvas.style.display = 'block';
    this.canvas.style.border = '1px solid #374151';
    this.canvas.style.borderRadius = '8px';
  }

  mount(container: HTMLElement): void {
    this.container = container;
    container.appendChild(this.canvas);
    
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.setupEventListeners();
    this.loadGame();
    
    if (this.gameState === 'menu') {
      this.showMenu();
    } else {
      this.startGameLoop();
    }
  }

  private setupEventListeners(): void {
    this.handleClick = this.handleClick.bind(this);
    this.canvas.addEventListener('click', this.handleClick);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      this.handleClickAt(x, y);
    });
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.handleClickAt(x, y);
  }

  private handleClickAt(x: number, y: number): void {
    const scaleX = this.canvas.width / this.canvas.offsetWidth;
    const scaleY = this.canvas.height / this.canvas.offsetHeight;
    x *= scaleX;
    y *= scaleY;

    if (this.gameState === 'menu') {
      this.startGame();
    } else if (this.gameState === 'gameOver') {
      this.gameState = 'menu';
      this.showMenu();
    } else if (this.gameState === 'playing') {
      this.handleGameClick(x, y);
    }
  }

  private handleGameClick(x: number, y: number): void {
    const buttonWidth = 180;
    const buttonHeight = 50;
    const buttonSpacing = 60;
    const startY = this.canvas.height - 320;
    
    // Action buttons
    const actions = [
      { name: 'explore', label: 'Explore' },
      { name: 'craft', label: 'Craft' },
      { name: 'rest', label: 'Rest' },
      { name: 'eat', label: 'Eat' },
      { name: 'drink', label: 'Drink' }
    ];
    
    actions.forEach((action, index) => {
      const buttonX = this.canvas.width / 2 - buttonWidth / 2;
      const buttonY = startY + index * buttonSpacing;
      
      if (x >= buttonX && x <= buttonX + buttonWidth &&
          y >= buttonY && y <= buttonY + buttonHeight) {
        this.performAction(action.name);
      }
    });
    
    // Craft menu
    if (this.selectedAction === 'craft') {
      this.handleCraftClick(x, y);
    }
  }

  private handleCraftClick(x: number, y: number): void {
    const items = this.getCraftableItems();
    const itemHeight = 60;
    const startY = 200;
    
    items.forEach((item, index) => {
      const itemY = startY + index * itemHeight;
      if (x >= 50 && x <= this.canvas.width - 50 &&
          y >= itemY && y <= itemY + itemHeight - 10) {
        this.craftItem(item);
      }
    });
    
    // Back button
    if (x >= this.canvas.width - 100 && x <= this.canvas.width - 20 &&
        y >= 20 && y <= 60) {
      this.selectedAction = null;
    }
  }

  private getCraftableItems(): CraftableItem[] {
    return [
      {
        name: 'Tools',
        cost: { wood: 5, stone: 3 },
        effect: () => { this.hasTools = true; },
        crafted: this.hasTools
      },
      {
        name: 'Shelter',
        cost: { wood: 10, stone: 5 },
        effect: () => { this.hasShelter = true; },
        crafted: this.hasShelter
      },
      {
        name: 'Fire',
        cost: { wood: 3, stone: 2 },
        effect: () => { this.hasFire = true; },
        crafted: this.hasFire
      },
      {
        name: 'Raft',
        cost: { wood: 20, stone: 10 },
        effect: () => { 
          this.hasRaft = true;
          this.showMessage('You built a raft and escaped the island!');
          this.playSound(SOUNDS.success);
          setTimeout(() => this.endGame(true), 2000);
        },
        crafted: this.hasRaft
      }
    ];
  }

  private performAction(action: string): void {
    switch (action) {
      case 'explore':
        this.explore();
        break;
      case 'craft':
        this.selectedAction = 'craft';
        break;
      case 'rest':
        this.rest();
        break;
      case 'eat':
        this.eat();
        break;
      case 'drink':
        this.drink();
        break;
    }
    
    if (action !== 'craft') {
      this.advanceTime();
    }
  }

  private explore(): void {
    const roll = Math.random();
    
    if (roll < 0.3) {
      const wood = this.hasTools ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 3) + 1;
      this.resources.wood += wood;
      this.showMessage(`Found ${wood} wood`);
      this.playSound(SOUNDS.collect);
    } else if (roll < 0.5) {
      const stone = this.hasTools ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 2) + 1;
      this.resources.stone += stone;
      this.showMessage(`Found ${stone} stone`);
      this.playSound(SOUNDS.collect);
    } else if (roll < 0.7) {
      const food = Math.floor(Math.random() * 3) + 1;
      this.resources.food += food;
      this.showMessage(`Found ${food} food`);
      this.playSound(SOUNDS.collect);
    } else if (roll < 0.85) {
      const water = Math.floor(Math.random() * 3) + 1;
      this.resources.water += water;
      this.showMessage(`Found ${water} water`);
      this.playSound(SOUNDS.collect);
    } else if (roll < 0.95) {
      this.showMessage('Found nothing useful');
    } else {
      // Danger!
      const damage = Math.floor(Math.random() * 15) + 5;
      this.health -= damage;
      this.showMessage(`Attacked by wild animal! -${damage} health`);
      this.playSound(SOUNDS.damage);
    }
    
    // Exploring costs hunger and thirst
    this.hunger -= 3;
    this.thirst -= 4;
  }

  private rest(): void {
    if (this.hasShelter) {
      this.health = Math.min(100, this.health + 20);
      this.showMessage('Rested in shelter. +20 health');
    } else {
      this.health = Math.min(100, this.health + 10);
      this.showMessage('Rested under a tree. +10 health');
    }
  }

  private eat(): void {
    if (this.resources.food > 0) {
      this.resources.food--;
      this.hunger = Math.min(100, this.hunger + 30);
      this.showMessage('Ate food. +30 hunger');
      this.playSound(SOUNDS.eat);
    } else {
      this.showMessage('No food available!');
    }
  }

  private drink(): void {
    if (this.resources.water > 0) {
      this.resources.water--;
      this.thirst = Math.min(100, this.thirst + 30);
      this.showMessage('Drank water. +30 thirst');
      this.playSound(SOUNDS.eat);
    } else {
      this.showMessage('No water available!');
    }
  }

  private craftItem(item: CraftableItem): void {
    if (item.crafted) {
      this.showMessage(`Already crafted ${item.name}`);
      return;
    }
    
    // Check resources
    for (const [resource, amount] of Object.entries(item.cost)) {
      if (this.resources[resource as keyof Resources] < amount!) {
        this.showMessage(`Not enough ${resource}! Need ${amount}`);
        return;
      }
    }
    
    // Consume resources
    for (const [resource, amount] of Object.entries(item.cost)) {
      this.resources[resource as keyof Resources] -= amount!;
    }
    
    // Apply effect
    item.effect();
    this.showMessage(`Crafted ${item.name}!`);
    this.playSound(SOUNDS.craft);
    this.selectedAction = null;
    this.advanceTime();
  }

  private advanceTime(): void {
    // Update stats
    this.hunger -= this.hungerRate;
    this.thirst -= this.thirstRate;
    
    // Weather effects
    if (this.weather === 'stormy' && !this.hasShelter) {
      this.health -= this.stormDamage;
      this.showMessage('Storm damage! Build shelter for protection');
      this.playSound(SOUNDS.danger);
    }
    
    // Night effects
    if (this.timeOfDay === 'night' && !this.hasFire) {
      this.health -= 5;
    }
    
    // Check death conditions
    if (this.hunger <= 0) {
      this.health -= 10;
      this.hunger = 0;
    }
    if (this.thirst <= 0) {
      this.health -= 15;
      this.thirst = 0;
    }
    
    // Advance time
    if (this.timeOfDay === 'day') {
      this.timeOfDay = 'night';
    } else {
      this.timeOfDay = 'day';
      this.day++;
      
      // Random weather
      const weatherRoll = Math.random();
      if (weatherRoll < 0.6) {
        this.weather = 'sunny';
      } else if (weatherRoll < 0.85) {
        this.weather = 'rainy';
      } else {
        this.weather = 'stormy';
      }
      
      // Increase difficulty
      if (this.day % 5 === 0) {
        this.hungerRate += 1;
        this.thirstRate += 1;
        this.stormDamage += 5;
      }
    }
    
    // Check game over
    if (this.health <= 0) {
      this.endGame(false);
    }
    
    this.saveGame();
  }

  private showMessage(msg: string): void {
    this.message = msg;
    this.messageTimer = 120; // 2 seconds at 60fps
  }

  private startGame(): void {
    this.gameState = 'playing';
    this.day = 1;
    this.timeOfDay = 'day';
    this.weather = 'sunny';
    this.health = 100;
    this.hunger = 100;
    this.thirst = 100;
    this.resources = { wood: 0, stone: 0, food: 5, water: 5 };
    this.hasShelter = false;
    this.hasFire = false;
    this.hasTools = false;
    this.hasRaft = false;
    this.hungerRate = 5;
    this.thirstRate = 7;
    this.stormDamage = 10;
    this.selectedAction = null;
    this.showMessage('Survive and build a raft to escape!');
    this.startGameLoop();
  }

  private endGame(escaped: boolean): void {
    this.gameState = 'gameOver';
    
    const highScore = this.getHighScore();
    if (this.day > highScore) {
      this.saveHighScore(this.day);
    }
    
    this.message = escaped ? 
      `You escaped after ${this.day} days!` : 
      `You survived ${this.day} days. Best: ${highScore} days`;
  }

  private showMenu(): void {
    const ctx = this.ctx;
    ctx.fillStyle = this.theme.colors.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title
    ctx.fillStyle = this.theme.colors.primary;
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Island Survival', this.canvas.width / 2, 100);
    
    // High score
    const highScore = this.getHighScore();
    if (highScore > 0) {
      ctx.font = '20px Arial';
      ctx.fillText(`Best: ${highScore} days`, this.canvas.width / 2, 150);
    }
    
    // Instructions
    ctx.font = '18px Arial';
    ctx.fillStyle = this.theme.colors.text;
    const instructions = [
      'Survive on a deserted island',
      'Manage health, hunger, and thirst',
      'Gather resources and craft items',
      'Build a raft to escape!',
      '',
      'Tap to start'
    ];
    
    instructions.forEach((line, i) => {
      ctx.fillText(line, this.canvas.width / 2, 220 + i * 30);
    });
  }

  private startGameLoop(): void {
    const gameLoop = () => {
      this.update();
      this.draw();
      this.animationId = requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }

  private update(): void {
    if (this.messageTimer > 0) {
      this.messageTimer--;
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    
    if (this.gameState === 'menu') {
      this.showMenu();
      return;
    }
    
    // Background
    ctx.fillStyle = this.theme.colors.background;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Sky gradient based on time
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height / 2);
    if (this.timeOfDay === 'day') {
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(1, '#98D8E8');
    } else {
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#2d2d44');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);
    
    // Island
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);
    
    // Weather effects
    if (this.weather === 'rainy' || this.weather === 'stormy') {
      ctx.strokeStyle = 'rgba(200, 200, 255, 0.3)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2, y + 10);
        ctx.stroke();
      }
    }
    
    if (this.gameState === 'playing') {
      if (this.selectedAction === 'craft') {
        this.drawCraftMenu();
      } else {
        this.drawGameUI();
      }
    } else if (this.gameState === 'gameOver') {
      this.drawGameOver();
    }
  }

  private drawGameUI(): void {
    const ctx = this.ctx;
    
    // Day and time with theme gradient
    const gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, this.theme.colors.primary);
    gradient.addColorStop(1, this.theme.colors.secondary);
    ctx.fillStyle = gradient;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Day ${this.day}`, 20, 40);
    ctx.font = '18px Arial';
    ctx.fillStyle = this.theme.colors.text;
    ctx.fillText(`${this.timeOfDay === 'day' ? '☀️' : '🌙'} ${this.weather}`, 20, 65);
    
    // Stats
    this.drawStat('Health', this.health, 100, 20, 100, '#ff6b6b');
    this.drawStat('Hunger', this.hunger, 100, 20, 130, '#ffa502');
    this.drawStat('Thirst', this.thirst, 100, 20, 160, '#3498db');
    
    // Resources
    ctx.font = '16px Arial';
    ctx.fillStyle = this.theme.colors.text;
    ctx.textAlign = 'right';
    ctx.fillText(`🪵 ${this.resources.wood}`, this.canvas.width - 20, 100);
    ctx.fillText(`🪨 ${this.resources.stone}`, this.canvas.width - 20, 125);
    ctx.fillText(`🍖 ${this.resources.food}`, this.canvas.width - 20, 150);
    ctx.fillText(`💧 ${this.resources.water}`, this.canvas.width - 20, 175);
    
    // Crafted items
    const items = [];
    if (this.hasTools) items.push('🔧');
    if (this.hasShelter) items.push('🏠');
    if (this.hasFire) items.push('🔥');
    if (this.hasRaft) items.push('⛵');
    
    if (items.length > 0) {
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(items.join(' '), this.canvas.width / 2, 220);
    }
    
    // Message
    if (this.messageTimer > 0) {
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = this.theme.colors.primary;
      ctx.fillText(this.message, this.canvas.width / 2, 260);
    }
    
    // Action buttons
    const buttons = [
      { name: 'explore', label: 'Explore' },
      { name: 'craft', label: 'Craft' },
      { name: 'rest', label: 'Rest' },
      { name: 'eat', label: `Eat (${this.resources.food})` },
      { name: 'drink', label: `Drink (${this.resources.water})` }
    ];
    
    const buttonWidth = 180;
    const buttonHeight = 50;
    const buttonSpacing = 60;
    const startY = this.canvas.height - 320;
    
    buttons.forEach((button, index) => {
      const x = this.canvas.width / 2 - buttonWidth / 2;
      const y = startY + index * buttonSpacing;
      
      ctx.fillStyle = this.theme.colors.surface;
      ctx.fillRect(x, y, buttonWidth, buttonHeight);
      ctx.strokeStyle = this.theme.colors.primary;
      ctx.strokeRect(x, y, buttonWidth, buttonHeight);
      
      ctx.fillStyle = this.theme.colors.text;
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(button.label, this.canvas.width / 2, y + 30);
    });
  }

  private drawStat(name: string, value: number, max: number, x: number, y: number, color: string): void {
    const ctx = this.ctx;
    const barWidth = 150;
    const barHeight = 20;
    
    // Label
    ctx.font = '14px Arial';
    ctx.fillStyle = this.theme.colors.text;
    ctx.textAlign = 'left';
    ctx.fillText(name, x, y - 5);
    
    // Bar background
    ctx.fillStyle = this.theme.colors.surface;
    ctx.fillRect(x + 60, y - 15, barWidth, barHeight);
    
    // Bar fill
    ctx.fillStyle = color;
    ctx.fillRect(x + 60, y - 15, (value / max) * barWidth, barHeight);
    
    // Bar border
    ctx.strokeStyle = this.theme.colors.border;
    ctx.strokeRect(x + 60, y - 15, barWidth, barHeight);
    
    // Value text
    ctx.font = '12px Arial';
    ctx.fillStyle = this.theme.colors.text;
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.floor(value)}`, x + 60 + barWidth / 2, y - 2);
  }

  private drawCraftMenu(): void {
    const ctx = this.ctx;
    
    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Title
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = this.theme.colors.primary;
    ctx.textAlign = 'center';
    ctx.fillText('Craft Items', this.canvas.width / 2, 50);
    
    // Back button
    ctx.fillStyle = this.theme.colors.surface;
    ctx.fillRect(this.canvas.width - 100, 20, 80, 40);
    ctx.font = '16px Arial';
    ctx.fillStyle = this.theme.colors.text;
    ctx.textAlign = 'center';
    ctx.fillText('Back', this.canvas.width - 60, 45);
    
    // Current resources
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Resources: 🪵${this.resources.wood} 🪨${this.resources.stone}`, 50, 100);
    
    // Craftable items
    const items = this.getCraftableItems();
    const itemHeight = 60;
    const startY = 200;
    
    items.forEach((item, index) => {
      const y = startY + index * itemHeight;
      
      // Item background
      ctx.fillStyle = item.crafted ? 'rgba(100, 100, 100, 0.5)' : this.theme.colors.surface;
      ctx.fillRect(50, y, this.canvas.width - 100, itemHeight - 10);
      
      // Item name
      ctx.font = 'bold 18px Arial';
      ctx.fillStyle = item.crafted ? '#666' : this.theme.colors.text;
      ctx.textAlign = 'left';
      ctx.fillText(item.name + (item.crafted ? ' ✓' : ''), 70, y + 25);
      
      // Cost
      ctx.font = '14px Arial';
      const costText = Object.entries(item.cost)
        .map(([res, amt]) => `${res === 'wood' ? '🪵' : '🪨'}${amt}`)
        .join(' ');
      ctx.fillText(`Cost: ${costText}`, 70, y + 45);
    });
  }

  private drawGameOver(): void {
    const ctx = this.ctx;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = this.theme.colors.primary;
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', this.canvas.width / 2, 150);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = this.theme.colors.text;
    ctx.fillText(this.message, this.canvas.width / 2, 200);
    
    ctx.font = '18px Arial';
    ctx.fillText('Tap to return to menu', this.canvas.width / 2, 300);
  }

  private getHighScore(): number {
    return parseInt(localStorage.getItem('island-survival-highscore') || '0');
  }

  private saveHighScore(days: number): void {
    localStorage.setItem('island-survival-highscore', days.toString());
  }

  private saveGame(): void {
    const gameData = {
      gameState: this.gameState,
      day: this.day,
      timeOfDay: this.timeOfDay,
      weather: this.weather,
      health: this.health,
      hunger: this.hunger,
      thirst: this.thirst,
      resources: this.resources,
      hasShelter: this.hasShelter,
      hasFire: this.hasFire,
      hasTools: this.hasTools,
      hasRaft: this.hasRaft,
      hungerRate: this.hungerRate,
      thirstRate: this.thirstRate,
      stormDamage: this.stormDamage
    };
    localStorage.setItem('island-survival-save', JSON.stringify(gameData));
  }

  private loadGame(): void {
    const saved = localStorage.getItem('island-survival-save');
    if (saved) {
      try {
        const gameData = JSON.parse(saved);
        this.gameState = gameData.gameState || 'menu';
        this.day = gameData.day || 1;
        this.timeOfDay = gameData.timeOfDay || 'day';
        this.weather = gameData.weather || 'sunny';
        this.health = gameData.health || 100;
        this.hunger = gameData.hunger || 100;
        this.thirst = gameData.thirst || 100;
        this.resources = gameData.resources || { wood: 0, stone: 0, food: 5, water: 5 };
        this.hasShelter = gameData.hasShelter || false;
        this.hasFire = gameData.hasFire || false;
        this.hasTools = gameData.hasTools || false;
        this.hasRaft = gameData.hasRaft || false;
        this.hungerRate = gameData.hungerRate || 5;
        this.thirstRate = gameData.thirstRate || 7;
        this.stormDamage = gameData.stormDamage || 10;
      } catch (e) {
        console.error('Failed to load save:', e);
      }
    }
  }

  private playSound(sound: { frequency: number; duration: number; type: OscillatorType }): void {
    if (!this.audioCtx) return;
    
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    
    oscillator.frequency.value = sound.frequency;
    oscillator.type = sound.type;
    
    gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + sound.duration / 1000);
    
    oscillator.start(this.audioCtx.currentTime);
    oscillator.stop(this.audioCtx.currentTime + sound.duration / 1000);
  }

  unmount(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.canvas.removeEventListener('click', this.handleClick);
    if (this.audioCtx) {
      this.audioCtx.close();
    }
    if (this.container) {
      this.container.removeChild(this.canvas);
    }
  }
}