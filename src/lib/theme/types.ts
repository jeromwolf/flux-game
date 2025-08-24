/**
 * Theme System Core Types
 * 테마 시스템의 핵심 타입 정의
 */

/**
 * 색상 팔레트 인터페이스
 */
export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Secondary colors
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  
  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceLight: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textDisabled: string;
  
  // State colors
  error: string;
  warning: string;
  success: string;
  info: string;
  
  // Game specific
  gameCanvas: string;
  gameCanvasSecondary: string;
  gameBorder: string;
  gameHighlight: string;
  
  // Effects
  shadow: string;
  shadowLight: string;
  overlay: string;
}

/**
 * 그라디언트 정의
 */
export interface ThemeGradients {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
}

/**
 * 애니메이션 설정
 */
export interface ThemeAnimations {
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  easing: {
    linear: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
  };
}

/**
 * 타이포그래피 설정
 */
export interface ThemeTypography {
  fontFamily: {
    primary: string;
    secondary: string;
    mono: string;
    pixel?: string; // 레트로 테마용
  };
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    bold: number;
  };
}

/**
 * 간격 설정
 */
export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

/**
 * 그림자 효과
 */
export interface ThemeShadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
  glow: string;
}

/**
 * 게임별 테마 설정
 */
export interface GameThemeConfig {
  // Snake game
  snake?: {
    headColor: string;
    bodyColor: string;
    foodColor: string;
    gridColor: string;
    borderColor: string;
  };
  
  // Tetris
  tetris?: {
    blockColors: string[]; // 7 colors for 7 pieces
    gridLineColor: string;
    ghostColor: string;
    flashColor: string;
  };
  
  // Rhythm game
  rhythm?: {
    noteColors: string[];
    laneColors: string[];
    hitLineColor: string;
    judgmentColors: {
      perfect: string;
      good: string;
      bad: string;
      miss: string;
    };
  };
  
  // 2048
  game2048?: {
    tileColors: Record<number, { bg: string; text: string }>;
    gridColor: string;
    borderColor: string;
  };
}

/**
 * 전체 테마 인터페이스
 */
export interface Theme {
  // 메타 정보
  id: string;
  name: string;
  description?: string;
  isDark: boolean;
  
  // 색상
  colors: ThemeColors;
  
  // 그라디언트
  gradients: ThemeGradients;
  
  // 애니메이션
  animations: ThemeAnimations;
  
  // 타이포그래피
  typography: ThemeTypography;
  
  // 간격
  spacing: ThemeSpacing;
  
  // 그림자
  shadows: ThemeShadows;
  
  // 게임별 설정 (선택적)
  games?: GameThemeConfig;
  
  // 커스텀 CSS 변수 (확장성을 위해)
  custom?: Record<string, string>;
}

/**
 * 테마 컨텍스트 타입
 */
export interface ThemeContextType {
  theme: Theme;
  themeName: string;
  setTheme: (themeName: string) => void;
  availableThemes: string[];
  isLoading: boolean;
}

/**
 * 테마 설정 옵션
 */
export interface ThemeOptions {
  enableTransitions?: boolean;
  transitionDuration?: number;
  persistToLocalStorage?: boolean;
  syncWithSystem?: boolean;
}

/**
 * 캔버스 테마 설정
 */
export interface CanvasThemeConfig {
  backgroundColor: string;
  gridColor?: string;
  borderColor?: string;
  borderWidth?: number;
  shadowBlur?: number;
  shadowColor?: string;
}

/**
 * 컴포넌트 변형 타입
 */
export type ComponentVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * 테마 적용 대상
 */
export type ThemeTarget = 'global' | 'game' | 'component';

/**
 * 색상 유틸리티 타입
 */
export type ColorFormat = 'hex' | 'rgb' | 'hsl';
export type ColorOpacity = number; // 0 to 1

/**
 * 테마 생성 도우미 타입
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ThemeCreator = (baseTheme: Theme, overrides?: DeepPartial<Theme>) => Theme;