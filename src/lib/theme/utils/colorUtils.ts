/**
 * Color Utilities
 * 색상 관련 유틸리티 함수들
 */

/**
 * HEX to RGB 변환
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * RGB to HEX 변환
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * HEX to RGBA 변환
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/**
 * 색상 밝기 조절
 */
export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  const adjust = (value: number) => {
    const adjusted = value + (value * percent / 100);
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };
  
  return rgbToHex(adjust(rgb.r), adjust(rgb.g), adjust(rgb.b));
}

/**
 * 색상 어둡게
 */
export function darken(hex: string, percent: number = 10): string {
  return adjustBrightness(hex, -percent);
}

/**
 * 색상 밝게
 */
export function lighten(hex: string, percent: number = 10): string {
  return adjustBrightness(hex, percent);
}

/**
 * 색상 투명도 설정
 */
export function alpha(hex: string, opacity: number): string {
  return hexToRgba(hex, opacity);
}

/**
 * 색상 혼합
 */
export function mixColors(color1: string, color2: string, weight: number = 0.5): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  const w1 = weight;
  const w2 = 1 - weight;
  
  const r = Math.round(rgb1.r * w1 + rgb2.r * w2);
  const g = Math.round(rgb1.g * w1 + rgb2.g * w2);
  const b = Math.round(rgb1.b * w1 + rgb2.b * w2);
  
  return rgbToHex(r, g, b);
}

/**
 * 대비 색상 계산
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#000000';
  
  // YIQ 공식 사용
  const yiq = ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
  
  return yiq >= 128 ? '#000000' : '#ffffff';
}

/**
 * 그라디언트 생성
 */
export function createGradient(
  colors: string[],
  direction: 'horizontal' | 'vertical' | 'diagonal' = 'vertical'
): string {
  if (colors.length === 0) return '';
  if (colors.length === 1) return colors[0];
  
  const directionMap = {
    horizontal: '90deg',
    vertical: '180deg',
    diagonal: '135deg',
  };
  
  const angle = directionMap[direction];
  const colorStops = colors.map((color, index) => {
    const position = (index / (colors.length - 1)) * 100;
    return `${color} ${position}%`;
  }).join(', ');
  
  return `linear-gradient(${angle}, ${colorStops})`;
}

/**
 * 색상이 어두운지 확인
 */
export function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  
  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return brightness < 128;
}

/**
 * 색상 팔레트 생성
 */
export function generateColorPalette(baseColor: string, count: number = 5): string[] {
  const palette: string[] = [];
  const step = 100 / (count - 1);
  
  for (let i = 0; i < count; i++) {
    const percent = (i * step) - 50;
    palette.push(adjustBrightness(baseColor, percent));
  }
  
  return palette;
}

/**
 * 보색 계산
 */
export function getComplementaryColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  
  return rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);
}

/**
 * 캔버스용 색상 변환
 */
export function toCanvasColor(color: string, opacity?: number): string {
  if (opacity !== undefined && opacity < 1) {
    return hexToRgba(color, opacity);
  }
  return color;
}