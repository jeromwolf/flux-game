/**
 * Theme System Entry Point
 * 테마 시스템의 모든 export를 한 곳에서 관리
 */

// Types
export * from './types';

// Context & Provider
export { ThemeProvider, useThemeContext } from './ThemeContext';

// Hooks
export { useTheme, useComponentTheme, useGameTheme } from './hooks/useTheme';

// Themes
export { 
  themes, 
  defaultTheme, 
  themeList, 
  getTheme, 
  getSystemTheme,
  darkTheme,
  lightTheme,
  oceanTheme,
} from './themes';

// Utils
export * from './utils/colorUtils';

// 기본 export로 useTheme 제공
import { useTheme } from './hooks/useTheme';
export default useTheme;