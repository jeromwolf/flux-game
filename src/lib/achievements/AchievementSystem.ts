// AchievementSystem.ts - 게임 성취도/업적 시스템

export interface Achievement {
  id: string;
  gameId: string;
  name: string;
  description: string;
  icon: string; // Emoji or icon class
  category: 'score' | 'skill' | 'collection' | 'special' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  hidden?: boolean; // Hidden until unlocked
  progress?: {
    current: number;
    target: number;
  };
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: number;
  gameId: string;
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  lastUpdated: number;
}

// 게임별 업적 정의
export const GAME_ACHIEVEMENTS: Record<string, Achievement[]> = {
  '2048': [
    {
      id: '2048-first-512',
      gameId: '2048',
      name: '첫 512 타일',
      description: '512 타일을 만드세요',
      icon: '🎯',
      category: 'milestone',
      rarity: 'common',
      points: 10
    },
    {
      id: '2048-reach-2048',
      gameId: '2048',
      name: '2048 마스터',
      description: '2048 타일을 만드세요',
      icon: '🏆',
      category: 'milestone',
      rarity: 'rare',
      points: 50
    },
    {
      id: '2048-reach-4096',
      gameId: '2048',
      name: '4096 전설',
      description: '4096 타일을 만드세요',
      icon: '👑',
      category: 'milestone',
      rarity: 'epic',
      points: 100
    },
    {
      id: '2048-no-undo',
      gameId: '2048',
      name: '완벽주의자',
      description: '되돌리기 없이 2048 달성',
      icon: '💎',
      category: 'skill',
      rarity: 'legendary',
      points: 200
    }
  ],
  'snake': [
    {
      id: 'snake-first-10',
      gameId: 'snake',
      name: '뱀 초보자',
      description: '길이 10 달성',
      icon: '🐍',
      category: 'milestone',
      rarity: 'common',
      points: 10
    },
    {
      id: 'snake-length-50',
      gameId: 'snake',
      name: '긴 뱀',
      description: '길이 50 달성',
      icon: '🐉',
      category: 'milestone',
      rarity: 'rare',
      points: 30
    },
    {
      id: 'snake-speed-demon',
      gameId: 'snake',
      name: '스피드 데몬',
      description: '최고 속도에서 100점 달성',
      icon: '⚡',
      category: 'skill',
      rarity: 'epic',
      points: 75
    }
  ],
  'tetris': [
    {
      id: 'tetris-first-tetris',
      gameId: 'tetris',
      name: '첫 테트리스',
      description: '4줄 동시 제거',
      icon: '🎮',
      category: 'skill',
      rarity: 'common',
      points: 15
    },
    {
      id: 'tetris-level-10',
      gameId: 'tetris',
      name: '레벨 10',
      description: '레벨 10 도달',
      icon: '📈',
      category: 'milestone',
      rarity: 'rare',
      points: 40
    },
    {
      id: 'tetris-100-lines',
      gameId: 'tetris',
      name: '라인 클리어러',
      description: '한 게임에서 100줄 제거',
      icon: '💯',
      category: 'milestone',
      rarity: 'epic',
      points: 80
    }
  ],
  'color-memory': [
    {
      id: 'color-memory-level-10',
      gameId: 'color-memory',
      name: '기억력 좋아요',
      description: '레벨 10 도달',
      icon: '🧠',
      category: 'milestone',
      rarity: 'common',
      points: 20
    },
    {
      id: 'color-memory-level-20',
      gameId: 'color-memory',
      name: '천재적 기억력',
      description: '레벨 20 도달',
      icon: '🎓',
      category: 'milestone',
      rarity: 'rare',
      points: 50
    },
    {
      id: 'color-memory-perfect-10',
      gameId: 'color-memory',
      name: '완벽주의자',
      description: '실수 없이 레벨 10 달성',
      icon: '💎',
      category: 'skill',
      rarity: 'epic',
      points: 100
    },
    {
      id: 'color-memory-combo-master',
      gameId: 'color-memory',
      name: '콤보 마스터',
      description: '10 콤보 달성',
      icon: '🔥',
      category: 'skill',
      rarity: 'rare',
      points: 60
    }
  ],
  'piano-memory': [
    {
      id: 'piano-memory-5-songs',
      gameId: 'piano-memory',
      name: '피아니스트',
      description: '5곡 완주',
      icon: '🎹',
      category: 'milestone',
      rarity: 'common',
      points: 25
    },
    {
      id: 'piano-memory-level-10',
      gameId: 'piano-memory',
      name: '음악 천재',
      description: '레벨 10 도달',
      icon: '🎼',
      category: 'milestone',
      rarity: 'rare',
      points: 60
    },
    {
      id: 'piano-memory-combo-20',
      gameId: 'piano-memory',
      name: '완벽한 연주',
      description: '20 콤보 달성',
      icon: '🎵',
      category: 'skill',
      rarity: 'epic',
      points: 100
    },
    {
      id: 'piano-memory-classical',
      gameId: 'piano-memory',
      name: '클래식 마스터',
      description: '모든 클래식 곡 완주',
      icon: '👑',
      category: 'collection',
      rarity: 'legendary',
      points: 200
    }
  ],
  'word-memory': [
    {
      id: 'word-memory-50-words',
      gameId: 'word-memory',
      name: '단어 수집가',
      description: '50개 단어 완성',
      icon: '📚',
      category: 'milestone',
      rarity: 'common',
      points: 30
    },
    {
      id: 'word-memory-level-10',
      gameId: 'word-memory',
      name: '기억력 천재',
      description: '레벨 10 도달',
      icon: '🧠',
      category: 'milestone',
      rarity: 'rare',
      points: 60
    },
    {
      id: 'word-memory-perfect',
      gameId: 'word-memory',
      name: '완벽한 기억',
      description: '실수 없이 5000점',
      icon: '💎',
      category: 'skill',
      rarity: 'epic',
      points: 120
    },
    {
      id: 'word-memory-pattern-master',
      gameId: 'word-memory',
      name: '패턴 마스터',
      description: '모든 패턴으로 성공',
      icon: '🎯',
      category: 'skill',
      rarity: 'legendary',
      points: 150
    }
  ]
};

export class AchievementSystem {
  private static instance: AchievementSystem;
  private readonly STORAGE_KEY = 'flux-game-achievements';
  private readonly PROGRESS_KEY = 'flux-game-achievement-progress';
  private unlockedAchievements: UnlockedAchievement[] = [];
  private achievementProgress: Record<string, AchievementProgress> = {};
  private notificationQueue: Achievement[] = [];
  private isShowingNotification = false;

  private constructor() {
    this.loadAchievements();
  }

  static getInstance(): AchievementSystem {
    if (!AchievementSystem.instance) {
      AchievementSystem.instance = new AchievementSystem();
    }
    return AchievementSystem.instance;
  }

  // 업적 확인 및 잠금 해제
  checkAchievement(achievementId: string, value?: number): boolean {
    const achievement = this.getAchievementById(achievementId);
    if (!achievement) return false;

    // 이미 잠금 해제된 경우
    if (this.isUnlocked(achievementId)) return false;

    // 진행도가 있는 업적인 경우
    if (achievement.progress && value !== undefined) {
      this.updateProgress(achievementId, value);
      
      const progress = this.achievementProgress[achievementId];
      if (progress && progress.current >= progress.target) {
        this.unlockAchievement(achievement);
        return true;
      }
      return false;
    }

    // 즉시 잠금 해제되는 업적
    this.unlockAchievement(achievement);
    return true;
  }

  // 업적 진행도 업데이트
  updateProgress(achievementId: string, current: number): void {
    const achievement = this.getAchievementById(achievementId);
    if (!achievement || !achievement.progress) return;

    this.achievementProgress[achievementId] = {
      achievementId,
      current: Math.min(current, achievement.progress.target),
      target: achievement.progress.target,
      lastUpdated: Date.now()
    };

    this.saveProgress();
  }

  // 업적 잠금 해제
  private unlockAchievement(achievement: Achievement): void {
    const unlockedAchievement: UnlockedAchievement = {
      achievementId: achievement.id,
      gameId: achievement.gameId,
      unlockedAt: Date.now()
    };

    this.unlockedAchievements.push(unlockedAchievement);
    this.saveAchievements();

    // 알림 표시
    this.showAchievementNotification(achievement);
  }

  // 업적 알림 표시
  private showAchievementNotification(achievement: Achievement): void {
    this.notificationQueue.push(achievement);
    
    if (!this.isShowingNotification) {
      this.processNotificationQueue();
    }
  }

  private processNotificationQueue(): void {
    if (this.notificationQueue.length === 0) {
      this.isShowingNotification = false;
      return;
    }

    this.isShowingNotification = true;
    const achievement = this.notificationQueue.shift()!;

    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 15px;
      max-width: 350px;
      z-index: 10000;
      animation: slideInRight 0.5s ease-out;
    `;

    const rarityColors = {
      common: '#94a3b8',
      rare: '#3b82f6',
      epic: '#a855f7',
      legendary: '#f59e0b'
    };

    notification.innerHTML = `
      <div style="
        font-size: 48px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
      ">${achievement.icon}</div>
      <div style="flex: 1;">
        <div style="
          font-size: 12px;
          text-transform: uppercase;
          opacity: 0.9;
          margin-bottom: 4px;
        ">업적 달성!</div>
        <div style="
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        ">${achievement.name}</div>
        <div style="
          font-size: 14px;
          opacity: 0.9;
        ">${achievement.description}</div>
        <div style="
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
        ">
          <span style="
            background: ${rarityColors[achievement.rarity]};
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          ">${this.getRarityText(achievement.rarity)}</span>
          <span style="
            font-size: 14px;
            font-weight: bold;
          ">+${achievement.points} 포인트</span>
        </div>
      </div>
    `;

    // Add animation styles
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    
    if (!document.querySelector('#achievement-animation-styles')) {
      style.id = 'achievement-animation-styles';
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.5s ease-in';
      setTimeout(() => {
        notification.remove();
        this.processNotificationQueue(); // Process next in queue
      }, 500);
    }, 4000);
  }

  // 게임별 업적 목록 가져오기
  getGameAchievements(gameId: string): Achievement[] {
    return GAME_ACHIEVEMENTS[gameId] || [];
  }

  // 잠금 해제된 업적 가져오기
  getUnlockedAchievements(gameId?: string): UnlockedAchievement[] {
    if (gameId) {
      return this.unlockedAchievements.filter(a => a.gameId === gameId);
    }
    return this.unlockedAchievements;
  }

  // 업적 통계
  getAchievementStats(gameId?: string): {
    total: number;
    unlocked: number;
    points: number;
    percentage: number;
  } {
    let achievements: Achievement[] = [];
    
    if (gameId) {
      achievements = this.getGameAchievements(gameId);
    } else {
      Object.values(GAME_ACHIEVEMENTS).forEach(gameAchievements => {
        achievements.push(...gameAchievements);
      });
    }

    const unlockedIds = new Set(
      this.getUnlockedAchievements(gameId).map(a => a.achievementId)
    );

    const unlockedAchievements = achievements.filter(a => unlockedIds.has(a.id));
    const points = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

    return {
      total: achievements.length,
      unlocked: unlockedAchievements.length,
      points,
      percentage: achievements.length > 0 
        ? Math.round((unlockedAchievements.length / achievements.length) * 100)
        : 0
    };
  }

  // 업적 진행도 가져오기
  getProgress(achievementId: string): AchievementProgress | null {
    return this.achievementProgress[achievementId] || null;
  }

  // 업적 잠금 해제 여부 확인
  isUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements.some(a => a.achievementId === achievementId);
  }

  // 업적 ID로 업적 정보 가져오기
  private getAchievementById(achievementId: string): Achievement | null {
    for (const achievements of Object.values(GAME_ACHIEVEMENTS)) {
      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement) return achievement;
    }
    return null;
  }

  // 희귀도 텍스트
  private getRarityText(rarity: Achievement['rarity']): string {
    const rarityTexts = {
      common: '일반',
      rare: '희귀',
      epic: '영웅',
      legendary: '전설'
    };
    return rarityTexts[rarity];
  }

  // 저장/로드
  private saveAchievements(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.unlockedAchievements));
  }

  private loadAchievements(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      this.unlockedAchievements = data ? JSON.parse(data) : [];
      
      const progressData = localStorage.getItem(this.PROGRESS_KEY);
      this.achievementProgress = progressData ? JSON.parse(progressData) : {};
    } catch (error) {
      console.error('Failed to load achievements:', error);
      this.unlockedAchievements = [];
      this.achievementProgress = {};
    }
  }

  private saveProgress(): void {
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(this.achievementProgress));
  }

  // 모든 업적 초기화 (개발/테스트용)
  resetAllAchievements(): void {
    this.unlockedAchievements = [];
    this.achievementProgress = {};
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.PROGRESS_KEY);
  }

  // 특정 게임 업적 초기화
  resetGameAchievements(gameId: string): void {
    this.unlockedAchievements = this.unlockedAchievements.filter(
      a => a.gameId !== gameId
    );
    
    const gameAchievements = this.getGameAchievements(gameId);
    gameAchievements.forEach(achievement => {
      delete this.achievementProgress[achievement.id];
    });
    
    this.saveAchievements();
    this.saveProgress();
  }
}

// 싱글톤 인스턴스 export
export const achievementSystem = AchievementSystem.getInstance();