/**
 * Theme Context
 * 테마 상태 관리를 위한 React Context
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Theme, ThemeContextType, ThemeOptions } from './types';
import { themes, defaultTheme, getTheme, getSystemTheme, isValidTheme } from './themes';

// 기본 옵션
const defaultOptions: ThemeOptions = {
  enableTransitions: true,
  transitionDuration: 300,
  persistToLocalStorage: true,
  syncWithSystem: false,
};

// Context 생성
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// LocalStorage 키
const THEME_STORAGE_KEY = 'flux-game-theme';

/**
 * 테마 프로바이더 Props
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  initialTheme?: string;
  options?: Partial<ThemeOptions>;
}

/**
 * 테마 프로바이더 컴포넌트
 */
export function ThemeProvider({ 
  children, 
  initialTheme,
  options: userOptions = {}
}: ThemeProviderProps) {
  const options = { ...defaultOptions, ...userOptions };
  
  // 초기 테마 결정
  const getInitialTheme = (): string => {
    // 1. props로 전달된 테마
    if (initialTheme && isValidTheme(initialTheme)) {
      return initialTheme;
    }
    
    // 2. localStorage에 저장된 테마
    if (options.persistToLocalStorage && typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && isValidTheme(savedTheme)) {
        return savedTheme;
      }
    }
    
    // 3. 시스템 테마
    if (options.syncWithSystem) {
      return getSystemTheme();
    }
    
    // 4. 기본 테마
    return defaultTheme;
  };
  
  const [themeName, setThemeName] = useState<string>(getInitialTheme);
  const [theme, setTheme] = useState<Theme>(getTheme(themeName));
  const [isLoading, setIsLoading] = useState(false);
  
  // 테마 변경 함수
  const changeTheme = useCallback((newThemeName: string) => {
    if (!isValidTheme(newThemeName)) {
      console.warn(`Invalid theme name: ${newThemeName}`);
      return;
    }
    
    setIsLoading(true);
    
    // 트랜지션 활성화
    if (options.enableTransitions && typeof document !== 'undefined') {
      document.documentElement.style.transition = 
        `background-color ${options.transitionDuration}ms ease-in-out,
         color ${options.transitionDuration}ms ease-in-out`;
    }
    
    // 테마 변경
    setThemeName(newThemeName);
    setTheme(getTheme(newThemeName));
    
    // localStorage에 저장
    if (options.persistToLocalStorage && typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newThemeName);
    }
    
    // CSS 변수 업데이트
    updateCSSVariables(getTheme(newThemeName));
    
    // 로딩 완료
    setTimeout(() => {
      setIsLoading(false);
      
      // 트랜지션 제거
      if (options.enableTransitions && typeof document !== 'undefined') {
        document.documentElement.style.transition = '';
      }
    }, options.transitionDuration);
  }, [options]);
  
  // CSS 변수 업데이트 함수
  const updateCSSVariables = (theme: Theme) => {
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    
    // 색상 변수
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-color-${toKebabCase(key)}`, value);
    });
    
    // 그라디언트 변수
    Object.entries(theme.gradients).forEach(([key, value]) => {
      root.style.setProperty(`--theme-gradient-${toKebabCase(key)}`, value);
    });
    
    // 간격 변수
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--theme-spacing-${key}`, value);
    });
    
    // 그림자 변수
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--theme-shadow-${toKebabCase(key)}`, value);
    });
    
    // 폰트 변수
    Object.entries(theme.typography.fontFamily).forEach(([key, value]) => {
      root.style.setProperty(`--theme-font-${toKebabCase(key)}`, value);
    });
    
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--theme-font-size-${key}`, value);
    });
    
    // 커스텀 변수
    if (theme.custom) {
      Object.entries(theme.custom).forEach(([key, value]) => {
        root.style.setProperty(`--theme-custom-${toKebabCase(key)}`, value);
      });
    }
    
    // HTML 속성 업데이트 (다른 라이브러리와의 호환성)
    root.setAttribute('data-theme', theme.id);
    root.setAttribute('data-theme-mode', theme.isDark ? 'dark' : 'light');
  };
  
  // 시스템 테마 변경 감지
  useEffect(() => {
    if (!options.syncWithSystem) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      changeTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [options.syncWithSystem, changeTheme]);
  
  // 초기 CSS 변수 설정
  useEffect(() => {
    updateCSSVariables(theme);
  }, [theme]);
  
  const contextValue: ThemeContextType = {
    theme,
    themeName,
    setTheme: changeTheme,
    availableThemes: Object.keys(themes),
    isLoading,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * 테마 컨텍스트 사용 훅
 */
export function useThemeContext(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  
  return context;
}

/**
 * 유틸리티 함수: camelCase를 kebab-case로 변환
 */
function toKebabCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}