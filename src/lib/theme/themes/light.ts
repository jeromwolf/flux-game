/**
 * Light Theme
 * 밝고 깔끔한 라이트 테마
 */

import { Theme } from '../types';
import { createTheme, createShadow } from './base';

export const lightTheme: Theme = createTheme({
  id: 'light',
  name: 'Light Mode',
  description: '밝고 깔끔한 라이트 테마',
  isDark: false,
  
  colors: {
    // Primary - 빨간색 계열
    primary: '#d32f2f',
    primaryLight: '#ff5252',
    primaryDark: '#b71c1c',
    
    // Secondary - 초록색
    secondary: '#00c853',
    secondaryLight: '#5efc82',
    secondaryDark: '#009624',
    
    // Background - 밝은 회색
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    surface: '#ffffff',
    surfaceLight: '#fafafa',
    
    // Text
    text: '#212121',
    textSecondary: '#757575',
    textDisabled: '#bdbdbd',
    
    // State colors
    error: '#d32f2f',
    warning: '#f57c00',
    success: '#388e3c',
    info: '#1976d2',
    
    // Game specific
    gameCanvas: '#fafafa',
    gameCanvasSecondary: '#f5f5f5',
    gameBorder: '#d32f2f',
    gameHighlight: '#00c853',
    
    // Effects
    shadow: '#000000',
    shadowLight: '#e0e0e0',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #d32f2f 0%, #ff5252 100%)',
    secondary: 'linear-gradient(135deg, #00c853 0%, #5efc82 100%)',
    background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f5 100%)',
    surface: 'linear-gradient(180deg, #ffffff 0%, #fafafa 100%)',
  },
  
  shadows: createShadow('#000000', 0.1),
  
  games: {
    snake: {
      headColor: '#d32f2f',
      bodyColor: '#ff5252',
      foodColor: '#00c853',
      gridColor: 'rgba(0, 0, 0, 0.05)',
      borderColor: '#d32f2f',
    },
    
    tetris: {
      blockColors: [
        '#d32f2f', // I - 빨강
        '#00c853', // O - 초록
        '#f57c00', // T - 주황
        '#1976d2', // J - 파랑
        '#ff5252', // L - 연빨강
        '#5efc82', // S - 연초록
        '#7c4dff', // Z - 보라
      ],
      gridLineColor: 'rgba(0, 0, 0, 0.1)',
      ghostColor: 'rgba(0, 0, 0, 0.1)',
      flashColor: '#212121',
    },
    
    rhythm: {
      noteColors: ['#00c853', '#1976d2', '#f57c00', '#d32f2f'],
      laneColors: ['#fafafa', '#f5f5f5', '#fafafa', '#f5f5f5'],
      hitLineColor: '#d32f2f',
      judgmentColors: {
        perfect: '#ffc107',
        good: '#00c853',
        bad: '#f57c00',
        miss: '#d32f2f',
      },
    },
    
    game2048: {
      tileColors: {
        2: { bg: '#eee4da', text: '#776e65' },
        4: { bg: '#ede0c8', text: '#776e65' },
        8: { bg: '#f2b179', text: '#f9f6f2' },
        16: { bg: '#f59563', text: '#f9f6f2' },
        32: { bg: '#f67c5f', text: '#f9f6f2' },
        64: { bg: '#f65e3b', text: '#f9f6f2' },
        128: { bg: '#edcf72', text: '#f9f6f2' },
        256: { bg: '#edcc61', text: '#f9f6f2' },
        512: { bg: '#edc850', text: '#f9f6f2' },
        1024: { bg: '#edc53f', text: '#f9f6f2' },
        2048: { bg: '#edc22e', text: '#f9f6f2' },
      },
      gridColor: '#bbada0',
      borderColor: '#cdc1b4',
    },
  },
});