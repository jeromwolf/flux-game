export class GameUtils {
  // Math utilities
  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
  
  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  static randomRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
  
  static randomInt(min: number, max: number): number {
    return Math.floor(this.randomRange(min, max + 1));
  }
  
  static randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
  
  // Physics utilities
  static applyGravity(velocityY: number, gravity: number, deltaTime: number): number {
    return velocityY + gravity * deltaTime;
  }
  
  static applyFriction(velocity: number, friction: number, deltaTime: number): number {
    return velocity * Math.pow(friction, deltaTime);
  }
  
  // Collision utilities
  static circleCollision(
    x1: number, y1: number, r1: number,
    x2: number, y2: number, r2: number
  ): boolean {
    const distance = this.distance(x1, y1, x2, y2);
    return distance < r1 + r2;
  }
  
  static pointInRectangle(
    pointX: number, pointY: number,
    rectX: number, rectY: number, rectWidth: number, rectHeight: number
  ): boolean {
    return pointX >= rectX && pointX <= rectX + rectWidth &&
           pointY >= rectY && pointY <= rectY + rectHeight;
  }
  
  // Drawing utilities
  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, width: number, height: number, radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  
  static drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number
  ): void {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }
  
  // Animation utilities
  static easeOutBounce(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }
  
  static easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  static shake(amplitude: number, frequency: number, time: number): { x: number; y: number } {
    return {
      x: Math.sin(time * frequency) * amplitude,
      y: Math.cos(time * frequency * 0.8) * amplitude
    };
  }
  
  // Score formatting
  static formatScore(score: number): string {
    return score.toLocaleString();
  }
  
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.floor(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }
  
  // Color utilities - moved to GameUtils
  static darken(color: string, amount: number): string {
    // Simple darken for non-hex colors
    if (!color.startsWith('#')) {
      return color; // Return as-is for named colors
    }
    
    const rgb = ColorUtils.hexToRgb(color);
    const r = Math.max(0, Math.floor(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.floor(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.floor(rgb.b * (1 - amount)));
    return ColorUtils.rgbToHex(r, g, b);
  }
}

// Color utilities
export class ColorUtils {
  static hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }
  
  static rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  
  static lighten(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * amount));
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * amount));
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * amount));
    return this.rgbToHex(r, g, b);
  }
  
  static darken(color: string, amount: number): string {
    const rgb = this.hexToRgb(color);
    const r = Math.max(0, Math.floor(rgb.r * (1 - amount)));
    const g = Math.max(0, Math.floor(rgb.g * (1 - amount)));
    const b = Math.max(0, Math.floor(rgb.b * (1 - amount)));
    return this.rgbToHex(r, g, b);
  }
}

// Touch controls helper
export class TouchControls {
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchEndX: number = 0;
  private touchEndY: number = 0;
  
  constructor(
    private element: HTMLElement,
    private callbacks: {
      onSwipeUp?: () => void;
      onSwipeDown?: () => void;
      onSwipeLeft?: () => void;
      onSwipeRight?: () => void;
      onTap?: () => void;
    }
  ) {
    this.setupListeners();
  }
  
  private setupListeners(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
  }
  
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }
  
  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    this.touchEndX = e.changedTouches[0].clientX;
    this.touchEndY = e.changedTouches[0].clientY;
    
    this.handleGesture();
  }
  
  private handleGesture(): void {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const minSwipeDistance = 50;
    
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      if (this.callbacks.onTap) this.callbacks.onTap();
      return;
    }
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && this.callbacks.onSwipeRight) {
          this.callbacks.onSwipeRight();
        } else if (deltaX < 0 && this.callbacks.onSwipeLeft) {
          this.callbacks.onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0 && this.callbacks.onSwipeDown) {
          this.callbacks.onSwipeDown();
        } else if (deltaY < 0 && this.callbacks.onSwipeUp) {
          this.callbacks.onSwipeUp();
        }
      }
    }
  }
  
  destroy(): void {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}