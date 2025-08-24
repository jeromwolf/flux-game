/**
 * Theme Collection
 * 모든 테마를 모아서 export
 */

import { Theme } from '../types';
import { darkTheme } from './dark';
import { lightTheme } from './light';
import { oceanTheme } from './ocean';

// 테마 컬렉션
export const themes: Record<string, Theme> = {
  dark: darkTheme,
  light: lightTheme,
  ocean: oceanTheme,
};

// 기본 테마
export const defaultTheme = 'dark';

// 테마 목록
export const themeList = Object.keys(themes);

// 테마 가져오기 함수
export function getTheme(themeName: string): Theme {
  return themes[themeName] || themes[defaultTheme];
}

// 시스템 다크모드 감지
export function getSystemTheme(): string {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return defaultTheme;
}

// Export individual themes
export { darkTheme, lightTheme, oceanTheme };

// 테마 검증 함수
export function isValidTheme(themeName: string): boolean {
  return themeName in themes;
}