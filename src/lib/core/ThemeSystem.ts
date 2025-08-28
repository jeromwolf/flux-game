export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  colors: ColorPalette;
  fonts?: {
    primary?: string;
    secondary?: string;
  };
  effects?: {
    glow?: boolean;
    particles?: boolean;
    shadows?: boolean;
    gradients?: boolean;
  };
  sounds?: {
    volume?: number;
    style?: 'retro' | 'modern' | 'minimal';
  };
  animations?: {
    speed?: number;
    style?: 'smooth' | 'snappy' | 'bouncy';
  };
}

export class ThemeManager {
  private static instance: ThemeManager;
  private currentTheme: ThemeConfig;
  private themes: Map<string, ThemeConfig> = new Map();
  private listeners: ((theme: ThemeConfig) => void)[] = [];
  
  private constructor() {
    this.initializeDefaultThemes();
    this.currentTheme = this.themes.get('default')!;
    this.loadSavedTheme();
  }
  
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }
  
  private initializeDefaultThemes(): void {
    // Default Theme
    this.themes.set('default', {
      id: 'default',
      name: 'Classic',
      description: '클래식한 게임 테마',
      colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        accent: '#f093fb',
        background: '#1a1a2e',
        surface: '#16213e',
        text: '#ffffff',
        textSecondary: '#a0a0a0',
        success: '#4ade80',
        warning: '#fbbf24',
        error: '#ef4444',
        info: '#3b82f6'
      },
      effects: {
        glow: true,
        particles: true,
        shadows: true,
        gradients: true
      }
    });
    
    // Neon Theme
    this.themes.set('neon', {
      id: 'neon',
      name: 'Neon Nights',
      description: '네온 사이버펑크 스타일',
      colors: {
        primary: '#00ffff',
        secondary: '#ff00ff',
        accent: '#ffff00',
        background: '#0a0a0a',
        surface: '#1a1a1a',
        text: '#ffffff',
        textSecondary: '#cccccc',
        success: '#00ff00',
        warning: '#ff9900',
        error: '#ff0066',
        info: '#0099ff'
      },
      effects: {
        glow: true,
        particles: true,
        shadows: true,
        gradients: true
      },
      animations: {
        style: 'snappy'
      }
    });
    
    // Retro Theme
    this.themes.set('retro', {
      id: 'retro',
      name: 'Retro Arcade',
      description: '80년대 아케이드 감성',
      colors: {
        primary: '#ff6b6b',
        secondary: '#4ecdc4',
        accent: '#45b7d1',
        background: '#2c2c54',
        surface: '#40407a',
        text: '#f5f3f4',
        textSecondary: '#b2bec3',
        success: '#6ab04c',
        warning: '#f9ca24',
        error: '#eb4d4b',
        info: '#22a6b3'
      },
      fonts: {
        primary: '"Press Start 2P", monospace'
      },
      sounds: {
        style: 'retro'
      },
      effects: {
        glow: false,
        particles: true,
        shadows: false,
        gradients: false
      }
    });
    
    // Nature Theme
    this.themes.set('nature', {
      id: 'nature',
      name: 'Forest',
      description: '자연 친화적인 편안한 테마',
      colors: {
        primary: '#52c41a',
        secondary: '#389e0d',
        accent: '#95de64',
        background: '#f0f2f5',
        surface: '#ffffff',
        text: '#262626',
        textSecondary: '#595959',
        success: '#52c41a',
        warning: '#faad14',
        error: '#f5222d',
        info: '#1890ff'
      },
      effects: {
        glow: false,
        particles: true,
        shadows: true,
        gradients: true
      },
      animations: {
        style: 'smooth'
      }
    });
    
    // Dark Mode
    this.themes.set('dark', {
      id: 'dark',
      name: 'Dark Mode',
      description: '눈이 편안한 다크 모드',
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#ec4899',
        background: '#0f172a',
        surface: '#1e293b',
        text: '#f1f5f9',
        textSecondary: '#94a3b8',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      effects: {
        glow: true,
        particles: false,
        shadows: true,
        gradients: true
      }
    });
    
    // Candy Theme
    this.themes.set('candy', {
      id: 'candy',
      name: 'Candy Pop',
      description: '달콤한 캔디 테마',
      colors: {
        primary: '#ff6ec7',
        secondary: '#ff9472',
        accent: '#ffd93d',
        background: '#ffe5ec',
        surface: '#fff0f5',
        text: '#4a0e2e',
        textSecondary: '#8b5a8c',
        success: '#95e1d3',
        warning: '#ffd93d',
        error: '#ff6b6b',
        info: '#74b9ff'
      },
      effects: {
        glow: true,
        particles: true,
        shadows: false,
        gradients: true
      },
      animations: {
        style: 'bouncy'
      }
    });
    
    // Minimalist Theme
    this.themes.set('minimal', {
      id: 'minimal',
      name: 'Minimalist',
      description: '깔끔한 미니멀 디자인',
      colors: {
        primary: '#000000',
        secondary: '#666666',
        accent: '#000000',
        background: '#ffffff',
        surface: '#f5f5f5',
        text: '#000000',
        textSecondary: '#666666',
        success: '#000000',
        warning: '#666666',
        error: '#000000',
        info: '#666666'
      },
      effects: {
        glow: false,
        particles: false,
        shadows: false,
        gradients: false
      },
      sounds: {
        style: 'minimal'
      }
    });
    
    // Ocean Theme
    this.themes.set('ocean', {
      id: 'ocean',
      name: 'Deep Ocean',
      description: '깊은 바다의 신비로움',
      colors: {
        primary: '#006994',
        secondary: '#0099cc',
        accent: '#00d4ff',
        background: '#001f3f',
        surface: '#003366',
        text: '#e0f7ff',
        textSecondary: '#80d8ff',
        success: '#00e676',
        warning: '#ffab00',
        error: '#ff5252',
        info: '#40c4ff'
      },
      effects: {
        glow: true,
        particles: true,
        shadows: true,
        gradients: true
      },
      animations: {
        style: 'smooth'
      }
    });
  }
  
  private loadSavedTheme(): void {
    const savedThemeId = localStorage.getItem('selected-theme');
    if (savedThemeId && this.themes.has(savedThemeId)) {
      this.currentTheme = this.themes.get(savedThemeId)!;
    }
  }
  
  private saveTheme(): void {
    localStorage.setItem('selected-theme', this.currentTheme.id);
  }
  
  getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }
  
  getTheme(id: string): ThemeConfig | undefined {
    return this.themes.get(id);
  }
  
  getAllThemes(): ThemeConfig[] {
    return Array.from(this.themes.values());
  }
  
  setTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (theme) {
      this.currentTheme = theme;
      this.saveTheme();
      this.notifyListeners();
      this.applyThemeToDOM();
      return true;
    }
    return false;
  }
  
  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.id, theme);
  }
  
  addListener(listener: (theme: ThemeConfig) => void): void {
    this.listeners.push(listener);
  }
  
  removeListener(listener: (theme: ThemeConfig) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }
  
  private applyThemeToDOM(): void {
    const root = document.documentElement;
    const theme = this.currentTheme;
    
    // Apply CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Apply font if specified
    if (theme.fonts?.primary) {
      root.style.setProperty('--theme-font-primary', theme.fonts.primary);
    }
    
    // Apply theme class
    document.body.className = `theme-${theme.id}`;
  }
  
  // Helper methods for games
  getColor(colorKey: keyof ColorPalette): string {
    return this.currentTheme.colors[colorKey];
  }
  
  getGradient(direction: string, color1Key: keyof ColorPalette, color2Key: keyof ColorPalette): string {
    const color1 = this.getColor(color1Key);
    const color2 = this.getColor(color2Key);
    return `linear-gradient(${direction}, ${color1}, ${color2})`;
  }
  
  shouldShowEffect(effect: keyof NonNullable<ThemeConfig['effects']>): boolean {
    return this.currentTheme.effects?.[effect] ?? true;
  }
  
  getAnimationStyle(): string {
    return this.currentTheme.animations?.style || 'smooth';
  }
  
  getSoundStyle(): string {
    return this.currentTheme.sounds?.style || 'modern';
  }
}