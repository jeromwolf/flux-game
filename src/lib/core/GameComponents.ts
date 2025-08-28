// Common game components that can be reused across games

export class PowerUpManager {
  private powerUps: Map<string, { active: boolean; duration: number; maxDuration: number }> = new Map();
  
  activate(type: string, duration: number): void {
    this.powerUps.set(type, { active: true, duration, maxDuration: duration });
  }
  
  update(deltaTime: number): void {
    this.powerUps.forEach((powerUp, type) => {
      if (powerUp.active) {
        powerUp.duration -= deltaTime * 1000; // Convert to ms
        if (powerUp.duration <= 0) {
          powerUp.active = false;
        }
      }
    });
  }
  
  isActive(type: string): boolean {
    return this.powerUps.get(type)?.active || false;
  }
  
  getProgress(type: string): number {
    const powerUp = this.powerUps.get(type);
    if (!powerUp || !powerUp.active) return 0;
    return powerUp.duration / powerUp.maxDuration;
  }
  
  reset(): void {
    this.powerUps.clear();
  }
  
  getActivePowerUps(): string[] {
    return Array.from(this.powerUps.entries())
      .filter(([_, powerUp]) => powerUp.active)
      .map(([type, _]) => type);
  }
}

export class CollectibleManager<T extends { x: number; y: number; collected: boolean }> {
  private items: T[] = [];
  private collectedCount: number = 0;
  
  add(item: T): void {
    this.items.push(item);
  }
  
  addMultiple(items: T[]): void {
    this.items.push(...items);
  }
  
  update(
    playerX: number, 
    playerY: number, 
    playerWidth: number, 
    playerHeight: number,
    collectRadius: number,
    onCollect?: (item: T) => void
  ): number {
    let collected = 0;
    
    this.items = this.items.filter(item => {
      if (item.collected) return false;
      
      // Check collection
      const dx = (item.x - (playerX + playerWidth / 2));
      const dy = (item.y - (playerY + playerHeight / 2));
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < collectRadius) {
        item.collected = true;
        this.collectedCount++;
        collected++;
        if (onCollect) onCollect(item);
        return false;
      }
      
      return true;
    });
    
    return collected;
  }
  
  getItems(): T[] {
    return this.items;
  }
  
  getCollectedCount(): number {
    return this.collectedCount;
  }
  
  clear(): void {
    this.items = [];
  }
  
  reset(): void {
    this.items = [];
    this.collectedCount = 0;
  }
}

export class ObstacleSpawner<T> {
  private spawnChance: number;
  private minDistance: number;
  private lastSpawnX: number = 0;
  
  constructor(spawnChance: number = 0.02, minDistance: number = 200) {
    this.spawnChance = spawnChance;
    this.minDistance = minDistance;
  }
  
  shouldSpawn(currentX: number): boolean {
    if (currentX - this.lastSpawnX < this.minDistance) return false;
    if (Math.random() < this.spawnChance) {
      this.lastSpawnX = currentX;
      return true;
    }
    return false;
  }
  
  setSpawnChance(chance: number): void {
    this.spawnChance = Math.max(0, Math.min(1, chance));
  }
  
  increaseFrequency(factor: number): void {
    this.spawnChance *= factor;
    this.spawnChance = Math.min(this.spawnChance, 0.1); // Cap at 10%
  }
}

export class ScrollingBackground {
  private elements: { x: number; y: number; width: number; speed: number }[] = [];
  
  constructor(
    private canvasWidth: number,
    private elementCount: number,
    private minY: number,
    private maxY: number,
    private minSpeed: number,
    private maxSpeed: number,
    private minWidth: number,
    private maxWidth: number
  ) {
    this.initialize();
  }
  
  private initialize(): void {
    for (let i = 0; i < this.elementCount; i++) {
      this.elements.push({
        x: Math.random() * this.canvasWidth,
        y: this.minY + Math.random() * (this.maxY - this.minY),
        width: this.minWidth + Math.random() * (this.maxWidth - this.minWidth),
        speed: this.minSpeed + Math.random() * (this.maxSpeed - this.minSpeed)
      });
    }
  }
  
  update(deltaTime: number, speedMultiplier: number = 1): void {
    this.elements.forEach(element => {
      element.x -= element.speed * speedMultiplier * deltaTime * 100;
      
      if (element.x + element.width < 0) {
        element.x = this.canvasWidth + element.width;
        element.y = this.minY + Math.random() * (this.maxY - this.minY);
      }
    });
  }
  
  getElements(): { x: number; y: number; width: number }[] {
    return this.elements.map(e => ({ x: e.x, y: e.y, width: e.width }));
  }
}

export class GameTimer {
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPaused: boolean = false;
  
  start(): void {
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.isPaused = false;
  }
  
  pause(): void {
    if (!this.isPaused) {
      this.pausedTime = this.getElapsedTime();
      this.isPaused = true;
    }
  }
  
  resume(): void {
    if (this.isPaused) {
      this.startTime = Date.now() - this.pausedTime;
      this.isPaused = false;
    }
  }
  
  getElapsedTime(): number {
    if (this.isPaused) return this.pausedTime;
    return Date.now() - this.startTime;
  }
  
  getElapsedSeconds(): number {
    return this.getElapsedTime() / 1000;
  }
  
  reset(): void {
    this.start();
  }
}