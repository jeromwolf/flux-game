import { ThemeManager, ThemeConfig } from './ThemeSystem';

export abstract class ThemedDOMGame {
  protected container: HTMLElement | null = null;
  protected score: number = 0;
  protected highScore: number = 0;
  protected gameOver: boolean = false;
  protected isPaused: boolean = false;
  
  // Theme system
  protected themeManager: ThemeManager;
  protected currentTheme: ThemeConfig;
  
  // Configuration
  protected gameName: string;
  
  constructor(gameName: string) {
    this.gameName = gameName;
    this.themeManager = ThemeManager.getInstance();
    this.currentTheme = this.themeManager.getCurrentTheme();
    this.loadHighScore();
    
    // Listen for theme changes
    this.themeManager.addListener(this.onThemeChange.bind(this));
  }
  
  // Lifecycle methods
  mount(container: HTMLElement): void {
    this.container = container;
    this.setupGame();
    this.initialize();
  }
  
  unmount(): void {
    this.cleanup();
    this.themeManager.removeListener(this.onThemeChange.bind(this));
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
  
  // Abstract methods that games must implement
  protected abstract setupGame(): void;
  protected abstract initialize(): void;
  protected abstract cleanup(): void;
  
  // Score management
  protected updateScore(points: number): void {
    this.score += points;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.saveHighScore();
    }
  }
  
  protected loadHighScore(): void {
    const key = `${this.gameName.toLowerCase().replace(/\s+/g, '-')}-highscore`;
    this.highScore = parseInt(localStorage.getItem(key) || '0');
  }
  
  protected saveHighScore(): void {
    const key = `${this.gameName.toLowerCase().replace(/\s+/g, '-')}-highscore`;
    localStorage.setItem(key, this.highScore.toString());
  }
  
  // Theme change handler
  protected onThemeChange(theme: ThemeConfig): void {
    this.currentTheme = theme;
    this.applyTheme();
  }
  
  // Apply theme to DOM elements
  protected abstract applyTheme(): void;
  
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
  
  // Apply theme styles to an element
  protected applyThemedStyles(element: HTMLElement, styles: {[key: string]: string}): void {
    Object.entries(styles).forEach(([key, value]) => {
      element.style.setProperty(key, value);
    });
  }
  
  // Create themed button styles
  protected getThemedButtonStyles(variant: 'primary' | 'secondary' | 'ghost' = 'primary'): string {
    const baseStyles = `
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    switch (variant) {
      case 'primary':
        return baseStyles + `
          background: ${this.getThemeGradient('135deg', 'primary', 'secondary')};
          color: white;
        `;
      case 'secondary':
        return baseStyles + `
          background: ${this.getThemeColor('surface')};
          color: ${this.getThemeColor('text')};
          border: 2px solid ${this.getThemeColor('primary')};
        `;
      case 'ghost':
        return baseStyles + `
          background: transparent;
          color: ${this.getThemeColor('primary')};
        `;
    }
  }
  
  // Create themed container styles
  protected getThemedContainerStyles(): string {
    return `
      background: ${this.getThemeColor('background')};
      color: ${this.getThemeColor('text')};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      padding: 20px;
    `;
  }
  
  // Create themed card styles
  protected getThemedCardStyles(): string {
    return `
      background: ${this.getThemeColor('surface')};
      border-radius: 16px;
      padding: 24px;
      ${this.shouldShowEffect('shadows') ? 'box-shadow: 0 4px 20px rgba(0,0,0,0.15);' : ''}
    `;
  }
  
  // Common restart functionality
  public restart(): void {
    this.score = 0;
    this.gameOver = false;
    this.initialize();
  }
}