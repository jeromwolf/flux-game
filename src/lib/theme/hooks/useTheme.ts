/**
 * useTheme Hook
 * 테마를 쉽게 사용하기 위한 커스텀 훅
 */

'use client';

import { useMemo } from 'react';
import { useThemeContext } from '../ThemeContext';
import { Theme, ThemeColors, ComponentVariant, ComponentSize } from '../types';

/**
 * 메인 테마 훅
 */
export function useTheme() {
  const { theme, themeName, setTheme, availableThemes, isLoading } = useThemeContext();
  
  // 자주 사용하는 색상들을 바로 접근할 수 있도록
  const colors = useMemo(() => theme.colors, [theme.colors]);
  const gradients = useMemo(() => theme.gradients, [theme.gradients]);
  const spacing = useMemo(() => theme.spacing, [theme.spacing]);
  const shadows = useMemo(() => theme.shadows, [theme.shadows]);
  
  // 테마 토글 함수
  const toggleTheme = () => {
    const currentIndex = availableThemes.indexOf(themeName);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    setTheme(availableThemes[nextIndex]);
  };
  
  // 다크모드 여부
  const isDark = theme.isDark;
  
  return {
    // 전체 테마 객체
    theme,
    
    // 현재 테마 이름
    themeName,
    
    // 테마 변경 함수
    setTheme,
    
    // 테마 토글
    toggleTheme,
    
    // 사용 가능한 테마 목록
    availableThemes,
    
    // 로딩 상태
    isLoading,
    
    // 다크모드 여부
    isDark,
    
    // 자주 사용하는 속성들
    colors,
    gradients,
    spacing,
    shadows,
    
    // 유틸리티 함수들
    utils: {
      getContrastText,
      getVariantColors,
      getSizeStyles,
    },
  };
}

/**
 * 컴포넌트 전용 테마 훅
 */
export function useComponentTheme(componentName: string) {
  const { theme } = useTheme();
  
  return {
    colors: theme.colors,
    spacing: theme.spacing,
    shadows: theme.shadows,
    typography: theme.typography,
    animations: theme.animations,
    
    // 컴포넌트별 스타일 생성 함수
    getStyles: (variant?: ComponentVariant, size?: ComponentSize) => {
      return createComponentStyles(theme, componentName, variant, size);
    },
  };
}

/**
 * 게임 전용 테마 훅
 */
export function useGameTheme(gameName: keyof NonNullable<Theme['games']>) {
  const { theme } = useTheme();
  
  const gameTheme = theme.games?.[gameName];
  
  return {
    // 전체 테마
    theme,
    
    // 게임별 테마 설정
    gameConfig: gameTheme,
    
    // 게임 캔버스 색상
    canvas: {
      background: theme.colors.gameCanvas,
      secondary: theme.colors.gameCanvasSecondary,
      border: theme.colors.gameBorder,
      highlight: theme.colors.gameHighlight,
    },
    
    // 기본 색상
    colors: theme.colors,
    
    // 유틸리티
    utils: {
      getGameColor: (key: string) => getGameSpecificColor(theme, gameName, key),
    },
  };
}

/**
 * 대비 색상 계산
 */
function getContrastText(backgroundColor: string): string {
  // 간단한 명도 계산
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return brightness > 128 ? '#000000' : '#ffffff';
}

/**
 * Variant별 색상 가져오기
 */
function getVariantColors(theme: Theme, variant: ComponentVariant = 'primary') {
  const variantMap = {
    primary: {
      background: theme.colors.primary,
      text: getContrastText(theme.colors.primary),
      hover: theme.colors.primaryDark,
      active: theme.colors.primaryDark,
      border: theme.colors.primary,
    },
    secondary: {
      background: theme.colors.secondary,
      text: getContrastText(theme.colors.secondary),
      hover: theme.colors.secondaryDark,
      active: theme.colors.secondaryDark,
      border: theme.colors.secondary,
    },
    ghost: {
      background: 'transparent',
      text: theme.colors.primary,
      hover: theme.colors.surface,
      active: theme.colors.surfaceLight,
      border: 'transparent',
    },
    outline: {
      background: 'transparent',
      text: theme.colors.primary,
      hover: theme.colors.surface,
      active: theme.colors.surfaceLight,
      border: theme.colors.primary,
    },
    danger: {
      background: theme.colors.error,
      text: getContrastText(theme.colors.error),
      hover: theme.colors.error,
      active: theme.colors.error,
      border: theme.colors.error,
    },
    success: {
      background: theme.colors.success,
      text: getContrastText(theme.colors.success),
      hover: theme.colors.success,
      active: theme.colors.success,
      border: theme.colors.success,
    },
  };
  
  return variantMap[variant] || variantMap.primary;
}

/**
 * Size별 스타일 가져오기
 */
function getSizeStyles(theme: Theme, size: ComponentSize = 'md') {
  const sizeMap = {
    xs: {
      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
      fontSize: theme.typography.fontSize.xs,
      height: '24px',
    },
    sm: {
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.sm,
      height: '32px',
    },
    md: {
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      fontSize: theme.typography.fontSize.md,
      height: '40px',
    },
    lg: {
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      fontSize: theme.typography.fontSize.lg,
      height: '48px',
    },
    xl: {
      padding: `${theme.spacing.lg} ${theme.spacing.xxl}`,
      fontSize: theme.typography.fontSize.xl,
      height: '56px',
    },
  };
  
  return sizeMap[size] || sizeMap.md;
}

/**
 * 컴포넌트 스타일 생성
 */
function createComponentStyles(
  theme: Theme,
  componentName: string,
  variant?: ComponentVariant,
  size?: ComponentSize
) {
  const variantColors = getVariantColors(theme, variant);
  const sizeStyles = getSizeStyles(theme, size);
  
  return {
    ...variantColors,
    ...sizeStyles,
    transition: `all ${theme.animations.duration.fast}ms ${theme.animations.easing.easeInOut}`,
  };
}

/**
 * 게임별 색상 가져오기
 */
function getGameSpecificColor(
  theme: Theme,
  gameName: keyof NonNullable<Theme['games']>,
  key: string
): string {
  const gameConfig = theme.games?.[gameName];
  if (!gameConfig) return theme.colors.primary;
  
  // @ts-ignore - 동적 접근
  return gameConfig[key] || theme.colors.primary;
}