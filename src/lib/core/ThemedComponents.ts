import { ThemeConfig } from './ThemeSystem';
import { GameUtils } from './GameUtils';

export class ThemedParticleEffects {
  static createStarBurst(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    theme: ThemeConfig,
    particleCount: number = 20
  ): void {
    if (!theme.effects?.particles) return;
    
    const colors = [theme.colors.primary, theme.colors.secondary, theme.colors.accent];
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 100 + Math.random() * 100;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Draw particle
      ctx.fillStyle = color;
      if (theme.effects?.glow) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
      }
      
      const px = x + Math.cos(angle) * speed * 0.1;
      const py = y + Math.sin(angle) * speed * 0.1;
      
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    }
  }
  
  static drawThemedGlow(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    theme: ThemeConfig
  ): void {
    if (!theme.effects?.glow) return;
    
    ctx.save();
    
    // Create multiple layers of glow
    const glowLayers = [
      { blur: radius * 2, alpha: 0.1 },
      { blur: radius * 1.5, alpha: 0.2 },
      { blur: radius, alpha: 0.3 },
      { blur: radius * 0.5, alpha: 0.4 }
    ];
    
    glowLayers.forEach(layer => {
      ctx.globalAlpha = layer.alpha;
      ctx.shadowColor = color;
      ctx.shadowBlur = layer.blur;
      ctx.fillStyle = color;
      
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.restore();
  }
}

export class ThemedUI {
  static drawThemedButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    theme: ThemeConfig,
    isHovered: boolean = false,
    isPressed: boolean = false
  ): void {
    ctx.save();
    
    // Button background
    if (theme.effects?.gradients) {
      const gradient = ctx.createLinearGradient(x, y, x, y + height);
      gradient.addColorStop(0, isHovered ? theme.colors.secondary : theme.colors.primary);
      gradient.addColorStop(1, isHovered ? theme.colors.accent : theme.colors.secondary);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = isHovered ? theme.colors.secondary : theme.colors.primary;
    }
    
    // Shadow effect
    if (theme.effects?.shadows && !isPressed) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
    }
    
    // Draw button shape
    const radius = theme.id === 'minimal' ? 0 : 10;
    GameUtils.drawRoundedRect(ctx, x, y + (isPressed ? 2 : 0), width, height, radius);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Button text
    ctx.fillStyle = theme.colors.text;
    ctx.font = `bold 16px ${theme.fonts?.primary || 'Arial'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2 + (isPressed ? 2 : 0));
    
    ctx.restore();
  }
  
  static drawThemedProgressBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    theme: ThemeConfig,
    showPercentage: boolean = true
  ): void {
    ctx.save();
    
    // Background
    ctx.fillStyle = theme.colors.surface;
    GameUtils.drawRoundedRect(ctx, x, y, width, height, height / 2);
    ctx.fill();
    
    // Progress fill
    const fillWidth = width * Math.max(0, Math.min(1, progress));
    if (fillWidth > 0) {
      if (theme.effects?.gradients) {
        const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, theme.colors.primary);
        gradient.addColorStop(1, theme.colors.accent);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = theme.colors.primary;
      }
      
      GameUtils.drawRoundedRect(ctx, x, y, fillWidth, height, height / 2);
      ctx.fill();
      
      // Glow effect
      if (theme.effects?.glow) {
        ctx.shadowColor = theme.colors.primary;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    
    // Percentage text
    if (showPercentage) {
      ctx.fillStyle = theme.colors.text;
      ctx.font = `bold ${height * 0.6}px ${theme.fonts?.primary || 'Arial'}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${Math.floor(progress * 100)}%`, x + width / 2, y + height / 2);
    }
    
    ctx.restore();
  }
  
  static getThemedTextStyle(theme: ThemeConfig, size: 'small' | 'medium' | 'large' | 'huge'): {
    font: string;
    color: string;
    shadowColor?: string;
    shadowBlur?: number;
  } {
    const sizes = {
      small: 12,
      medium: 16,
      large: 24,
      huge: 36
    };
    
    const fontSize = sizes[size];
    const font = `${fontSize}px ${theme.fonts?.primary || 'Arial'}`;
    
    const style: any = {
      font,
      color: theme.colors.text
    };
    
    if (theme.effects?.glow && (size === 'large' || size === 'huge')) {
      style.shadowColor = theme.colors.primary;
      style.shadowBlur = fontSize / 4;
    }
    
    return style;
  }
}

export class ThemedAnimations {
  static getEasingFunction(theme: ThemeConfig): (t: number) => number {
    const style = theme.animations?.style || 'smooth';
    
    switch (style) {
      case 'smooth':
        return GameUtils.easeInOutQuad;
      case 'snappy':
        return (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      case 'bouncy':
        return GameUtils.easeOutBounce;
      default:
        return (t: number) => t;
    }
  }
  
  static getAnimationSpeed(theme: ThemeConfig): number {
    return theme.animations?.speed || 1;
  }
  
  static drawThemedTransition(
    ctx: CanvasRenderingContext2D,
    progress: number,
    theme: ThemeConfig,
    type: 'fade' | 'slide' | 'zoom' = 'fade'
  ): void {
    ctx.save();
    
    const easing = ThemedAnimations.getEasingFunction(theme);
    const easedProgress = easing(progress);
    
    switch (type) {
      case 'fade':
        ctx.globalAlpha = easedProgress;
        break;
      case 'slide':
        ctx.translate(0, ctx.canvas.height * (1 - easedProgress));
        break;
      case 'zoom':
        const scale = easedProgress;
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
        break;
    }
    
    ctx.restore();
  }
}