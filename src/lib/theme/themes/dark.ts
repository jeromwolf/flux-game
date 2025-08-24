/**
 * Dark Theme
 * 기본 다크 테마 - 눈의 피로를 줄이는 어두운 색상 구성
 */

import { Theme } from '../types';
import { createTheme, createShadow } from './base';

export const darkTheme: Theme = createTheme({
  id: 'dark',
  name: 'Dark Mode',
  description: '눈의 피로를 줄이는 다크 테마',
  isDark: true,
  
  colors: {
    // Primary - 빨간색 계열
    primary: '#e94560',
    primaryLight: '#ff6b85',
    primaryDark: '#c72e47',
    
    // Secondary - 민트 그린
    secondary: '#00ff88',
    secondaryLight: '#4dffb3',
    secondaryDark: '#00cc66',
    
    // Background - 어두운 네이비
    background: '#0f0f1e',
    backgroundSecondary: '#1a1a2e',
    surface: '#16213e',
    surfaceLight: '#1f2b47',
    
    // Text
    text: '#ffffff',
    textSecondary: '#b8b8b8',
    textDisabled: '#666666',
    
    // State colors
    error: '#ff4757',
    warning: '#ffa502',
    success: '#32ff7e',
    info: '#18dcff',
    
    // Game specific
    gameCanvas: '#1a1a2e',
    gameCanvasSecondary: '#0f0f1e',
    gameBorder: '#e94560',
    gameHighlight: '#00ff88',
    
    // Effects
    shadow: '#000000',
    shadowLight: '#1a1a2e',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #e94560 0%, #ff6b85 100%)',
    secondary: 'linear-gradient(135deg, #00ff88 0%, #4dffb3 100%)',
    background: 'linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%)',
    surface: 'linear-gradient(180deg, #16213e 0%, #1f2b47 100%)',
  },
  
  shadows: createShadow('#000000', 0.3),
  
  games: {
    snake: {
      headColor: '#e94560',
      bodyColor: '#ff6b85',
      foodColor: '#00ff88',
      gridColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: '#e94560',
    },
    
    tetris: {
      blockColors: [
        '#e94560', // I - 빨강
        '#00ff88', // O - 초록
        '#ffa502', // T - 주황
        '#18dcff', // J - 하늘색
        '#ff6348', // L - 연빨강
        '#7bed9f', // S - 연초록
        '#a29bfe', // Z - 보라
      ],
      gridLineColor: 'rgba(255, 255, 255, 0.1)',
      ghostColor: 'rgba(255, 255, 255, 0.1)',
      flashColor: '#ffffff',
    },
    
    rhythm: {
      noteColors: ['#00ff88', '#18dcff', '#ffa502', '#e94560'],
      laneColors: ['#16213e', '#0f3460', '#16213e', '#0f3460'],
      hitLineColor: '#e94560',
      judgmentColors: {
        perfect: '#ffd700',
        good: '#00ff88',
        bad: '#ffa502',
        miss: '#ff4757',
      },
    },
    
    game2048: {
      tileColors: {
        2: { bg: '#2d3561', text: '#ffffff' },
        4: { bg: '#5d54a4', text: '#ffffff' },
        8: { bg: '#e94560', text: '#ffffff' },
        16: { bg: '#ff6b85', text: '#ffffff' },
        32: { bg: '#00ff88', text: '#0f0f1e' },
        64: { bg: '#4dffb3', text: '#0f0f1e' },
        128: { bg: '#ffa502', text: '#ffffff' },
        256: { bg: '#ff6348', text: '#ffffff' },
        512: { bg: '#18dcff', text: '#ffffff' },
        1024: { bg: '#7bed9f', text: '#0f0f1e' },
        2048: { bg: '#a29bfe', text: '#ffffff' },
      },
      gridColor: '#1a1a2e',
      borderColor: '#0f0f1e',
    },
  },
});