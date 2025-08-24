/**
 * Base theme configuration
 * 모든 테마가 공유하는 기본 설정
 */

import { Theme, ThemeAnimations, ThemeTypography, ThemeSpacing } from '../types';

/**
 * 공통 애니메이션 설정
 */
export const baseAnimations: ThemeAnimations = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

/**
 * 공통 타이포그래피 설정
 */
export const baseTypography: ThemeTypography = {
  fontFamily: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    secondary: 'Georgia, serif',
    mono: 'Menlo, Monaco, "Courier New", monospace',
    pixel: '"Press Start 2P", monospace', // Google Fonts에서 로드 필요
  },
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    md: '1rem',      // 16px
    lg: '1.125rem',  // 18px
    xl: '1.5rem',    // 24px
    xxl: '2rem',     // 32px
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    bold: 700,
  },
};

/**
 * 공통 간격 설정
 */
export const baseSpacing: ThemeSpacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  xxl: '3rem',     // 48px
};

/**
 * 그림자 생성 유틸리티
 */
export const createShadow = (color: string, opacity: number = 0.1) => ({
  none: 'none',
  sm: `0 1px 2px 0 rgba(${hexToRgb(color)}, ${opacity})`,
  md: `0 4px 6px -1px rgba(${hexToRgb(color)}, ${opacity}), 0 2px 4px -1px rgba(${hexToRgb(color)}, ${opacity * 0.6})`,
  lg: `0 10px 15px -3px rgba(${hexToRgb(color)}, ${opacity}), 0 4px 6px -2px rgba(${hexToRgb(color)}, ${opacity * 0.5})`,
  xl: `0 20px 25px -5px rgba(${hexToRgb(color)}, ${opacity}), 0 10px 10px -5px rgba(${hexToRgb(color)}, ${opacity * 0.4})`,
  inner: `inset 0 2px 4px 0 rgba(${hexToRgb(color)}, ${opacity * 0.6})`,
  glow: `0 0 20px rgba(${hexToRgb(color)}, ${opacity * 3})`,
});

/**
 * 색상 유틸리티 함수
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '0, 0, 0';
}

export function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16)
    .slice(1);
}

/**
 * 테마 생성 헬퍼
 */
export function createTheme(overrides: Partial<Theme>): Theme {
  const baseTheme: Theme = {
    id: 'base',
    name: 'Base Theme',
    isDark: false,
    colors: {
      primary: '#000000',
      primaryLight: '#333333',
      primaryDark: '#000000',
      secondary: '#666666',
      secondaryLight: '#999999',
      secondaryDark: '#333333',
      background: '#ffffff',
      backgroundSecondary: '#f5f5f5',
      surface: '#ffffff',
      surfaceLight: '#fafafa',
      text: '#000000',
      textSecondary: '#666666',
      textDisabled: '#999999',
      error: '#f44336',
      warning: '#ff9800',
      success: '#4caf50',
      info: '#2196f3',
      gameCanvas: '#000000',
      gameCanvasSecondary: '#1a1a1a',
      gameBorder: '#333333',
      gameHighlight: '#ffffff',
      shadow: '#000000',
      shadowLight: '#666666',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    gradients: {
      primary: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
      secondary: 'linear-gradient(135deg, #666666 0%, #999999 100%)',
      background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
      surface: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
    },
    animations: baseAnimations,
    typography: baseTypography,
    spacing: baseSpacing,
    shadows: createShadow('#000000'),
  };
  
  return deepMerge(baseTheme, overrides) as Theme;
}

/**
 * 깊은 병합 유틸리티
 */
function deepMerge(target: any, source: any): any {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}