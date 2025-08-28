/**
 * Ocean Theme
 * 시원한 바다 느낌의 블루 테마
 */

import { Theme } from '../types';
import { createTheme, createShadow } from './base';

export const oceanTheme: Theme = createTheme({
  id: 'ocean',
  name: 'Ocean Theme',
  description: '시원한 바다 느낌의 블루 테마',
  isDark: true,
  
  colors: {
    // Primary - 시안 블루
    primary: '#00bcd4',
    primaryLight: '#62efff',
    primaryDark: '#008ba3',
    
    // Secondary - 코랄
    secondary: '#ff7043',
    secondaryLight: '#ffa270',
    secondaryDark: '#c63f17',
    
    // Background - 깊은 바다
    background: '#004d7a',
    backgroundSecondary: '#008793',
    surface: '#00628b',
    surfaceLight: '#007ea7',
    
    // Text
    text: '#ffffff',
    textSecondary: '#b2ebf2',
    textDisabled: '#4dd0e1',
    
    // State colors
    error: '#ff5252',
    warning: '#ffb300',
    success: '#00e676',
    info: '#00b0ff',
    
    // Game specific
    gameCanvas: '#005577',
    gameCanvasSecondary: '#003d5b',
    gameBorder: '#00bcd4',
    gameHighlight: '#ff7043',
    
    // Effects
    shadow: '#001f3f',
    shadowLight: '#004d7a',
    overlay: 'rgba(0, 77, 122, 0.7)',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #00bcd4 0%, #62efff 100%)',
    secondary: 'linear-gradient(135deg, #ff7043 0%, #ffa270 100%)',
    background: 'linear-gradient(180deg, #004d7a 0%, #008793 100%)',
    surface: 'linear-gradient(180deg, #00628b 0%, #007ea7 100%)',
  },
  
  shadows: createShadow('#001f3f', 0.2),
  
  games: {
    snake: {
      headColor: '#00bcd4',
      bodyColor: '#62efff',
      foodColor: '#ff7043',
      gridColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: '#00bcd4',
    },
    
    tetris: {
      blockColors: [
        '#00bcd4', // I - 시안
        '#ff7043', // O - 코랄
        '#ffb300', // T - 앰버
        '#00b0ff', // J - 라이트블루
        '#4dd0e1', // L - 연시안
        '#00e676', // S - 그린
        '#7c4dff', // Z - 퍼플
      ],
      gridLineColor: 'rgba(255, 255, 255, 0.15)',
      ghostColor: 'rgba(255, 255, 255, 0.15)',
      flashColor: '#ffffff',
    },
    
    rhythm: {
      noteColors: ['#00bcd4', '#00b0ff', '#ff7043', '#ffb300'],
      laneColors: ['#005577', '#004466', '#005577', '#004466'],
      hitLineColor: '#00bcd4',
      judgmentColors: {
        perfect: '#ffd700',
        good: '#00e676',
        bad: '#ffb300',
        miss: '#ff5252',
      },
    },
    
    game2048: {
      tileColors: {
        2: { bg: '#006994', text: '#ffffff' },
        4: { bg: '#0077a3', text: '#ffffff' },
        8: { bg: '#0086b3', text: '#ffffff' },
        16: { bg: '#0095c4', text: '#ffffff' },
        32: { bg: '#00a4d5', text: '#ffffff' },
        64: { bg: '#00b3e6', text: '#ffffff' },
        128: { bg: '#ff7043', text: '#ffffff' },
        256: { bg: '#ff8a65', text: '#ffffff' },
        512: { bg: '#ffab91', text: '#004d7a' },
        1024: { bg: '#ffccbc', text: '#004d7a' },
        2048: { bg: '#ffd700', text: '#004d7a' },
      },
      gridColor: '#005577',
      borderColor: '#003d5b',
    },
  },
});