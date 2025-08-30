// LeaderboardSystem.ts - 글로벌 리더보드 시스템
// 로컬 스토리지 기반으로 시작, 추후 서버 연동 가능

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  gameId: string;
  timestamp: number;
  metadata?: any; // 게임별 추가 정보 (레벨, 시간 등)
}

export interface GameLeaderboard {
  gameId: string;
  entries: LeaderboardEntry[];
  lastUpdated: number;
}

export class LeaderboardSystem {
  private static instance: LeaderboardSystem;
  private readonly STORAGE_KEY = 'flux-game-leaderboards';
  private readonly MAX_ENTRIES_PER_GAME = 100;
  private readonly DEFAULT_DISPLAY_COUNT = 10;

  private constructor() {}

  static getInstance(): LeaderboardSystem {
    if (!LeaderboardSystem.instance) {
      LeaderboardSystem.instance = new LeaderboardSystem();
    }
    return LeaderboardSystem.instance;
  }

  // 점수 제출
  async submitScore(
    gameId: string,
    playerName: string,
    score: number,
    metadata?: any
  ): Promise<{ rank: number; isNewHighScore: boolean }> {
    const leaderboard = this.getGameLeaderboard(gameId);
    
    const newEntry: LeaderboardEntry = {
      playerName,
      score,
      gameId,
      timestamp: Date.now(),
      metadata
    };

    // 기존 엔트리 찾기 (같은 플레이어)
    const existingIndex = leaderboard.entries.findIndex(
      entry => entry.playerName === playerName
    );

    let isNewHighScore = false;
    
    if (existingIndex !== -1) {
      // 기존 점수보다 높으면 업데이트
      if (score > leaderboard.entries[existingIndex].score) {
        leaderboard.entries[existingIndex] = newEntry;
        isNewHighScore = true;
      }
    } else {
      // 새로운 엔트리 추가
      leaderboard.entries.push(newEntry);
      isNewHighScore = true;
    }

    // 점수 내림차순 정렬
    leaderboard.entries.sort((a, b) => b.score - a.score);

    // 최대 엔트리 수 제한
    if (leaderboard.entries.length > this.MAX_ENTRIES_PER_GAME) {
      leaderboard.entries = leaderboard.entries.slice(0, this.MAX_ENTRIES_PER_GAME);
    }

    leaderboard.lastUpdated = Date.now();
    this.saveLeaderboard(gameId, leaderboard);

    // 순위 계산
    const rank = leaderboard.entries.findIndex(
      entry => entry.playerName === playerName && entry.score === score
    ) + 1;

    return { rank, isNewHighScore };
  }

  // 리더보드 조회
  getTopScores(gameId: string, count: number = this.DEFAULT_DISPLAY_COUNT): LeaderboardEntry[] {
    const leaderboard = this.getGameLeaderboard(gameId);
    return leaderboard.entries.slice(0, count);
  }

  // 특정 플레이어 주변 순위 조회
  getPlayerRankings(
    gameId: string,
    playerName: string,
    range: number = 2
  ): {
    playerRank: number;
    playerEntry: LeaderboardEntry | null;
    nearbyEntries: LeaderboardEntry[];
  } {
    const leaderboard = this.getGameLeaderboard(gameId);
    const playerIndex = leaderboard.entries.findIndex(
      entry => entry.playerName === playerName
    );

    if (playerIndex === -1) {
      return {
        playerRank: -1,
        playerEntry: null,
        nearbyEntries: this.getTopScores(gameId, range * 2 + 1)
      };
    }

    const playerRank = playerIndex + 1;
    const playerEntry = leaderboard.entries[playerIndex];
    
    // 플레이어 주변 순위 가져오기
    const startIndex = Math.max(0, playerIndex - range);
    const endIndex = Math.min(leaderboard.entries.length, playerIndex + range + 1);
    const nearbyEntries = leaderboard.entries.slice(startIndex, endIndex);

    return { playerRank, playerEntry, nearbyEntries };
  }

  // 일간/주간/월간 리더보드
  getTimeBasedLeaderboard(
    gameId: string,
    timeFrame: 'daily' | 'weekly' | 'monthly',
    count: number = this.DEFAULT_DISPLAY_COUNT
  ): LeaderboardEntry[] {
    const leaderboard = this.getGameLeaderboard(gameId);
    const now = Date.now();
    const timeFrameMs = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    };

    const cutoffTime = now - timeFrameMs[timeFrame];
    
    return leaderboard.entries
      .filter(entry => entry.timestamp >= cutoffTime)
      .slice(0, count);
  }

  // 플레이어 통계
  getPlayerStats(playerName: string): {
    totalGames: number;
    topScores: Array<{ gameId: string; score: number; rank: number }>;
    totalScore: number;
    averageRank: number;
  } {
    const allLeaderboards = this.getAllLeaderboards();
    const topScores: Array<{ gameId: string; score: number; rank: number }> = [];
    let totalScore = 0;
    let totalRanks = 0;
    let gameCount = 0;

    Object.entries(allLeaderboards).forEach(([gameId, leaderboard]) => {
      const playerIndex = leaderboard.entries.findIndex(
        entry => entry.playerName === playerName
      );
      
      if (playerIndex !== -1) {
        const entry = leaderboard.entries[playerIndex];
        const rank = playerIndex + 1;
        
        topScores.push({
          gameId,
          score: entry.score,
          rank
        });
        
        totalScore += entry.score;
        totalRanks += rank;
        gameCount++;
      }
    });

    // 점수 기준 내림차순 정렬
    topScores.sort((a, b) => b.score - a.score);

    return {
      totalGames: gameCount,
      topScores: topScores.slice(0, 5), // 상위 5개 게임
      totalScore,
      averageRank: gameCount > 0 ? totalRanks / gameCount : 0
    };
  }

  // 리더보드 초기화 (개발/테스트용)
  clearGameLeaderboard(gameId: string): void {
    const leaderboards = this.getAllLeaderboards();
    delete leaderboards[gameId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leaderboards));
  }

  // Private 메서드들
  private getGameLeaderboard(gameId: string): GameLeaderboard {
    const leaderboards = this.getAllLeaderboards();
    
    if (!leaderboards[gameId]) {
      leaderboards[gameId] = {
        gameId,
        entries: [],
        lastUpdated: Date.now()
      };
    }
    
    return leaderboards[gameId];
  }

  private saveLeaderboard(gameId: string, leaderboard: GameLeaderboard): void {
    const leaderboards = this.getAllLeaderboards();
    leaderboards[gameId] = leaderboard;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leaderboards));
  }

  private getAllLeaderboards(): Record<string, GameLeaderboard> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load leaderboards:', error);
      return {};
    }
  }

  // 서버 동기화를 위한 훅 (추후 구현)
  async syncWithServer(): Promise<void> {
    // TODO: 서버 API와 동기화
    console.log('Server sync not implemented yet');
  }

  // 플레이어 이름 검증
  validatePlayerName(name: string): { valid: boolean; error?: string } {
    if (!name || name.trim().length === 0) {
      return { valid: false, error: '이름을 입력해주세요' };
    }
    
    if (name.length > 20) {
      return { valid: false, error: '이름은 20자 이내로 입력해주세요' };
    }
    
    // 부적절한 단어 필터링 (기본적인 것만)
    const bannedWords = ['admin', 'system', 'flux', 'game'];
    const nameLower = name.toLowerCase();
    
    if (bannedWords.some(word => nameLower.includes(word))) {
      return { valid: false, error: '사용할 수 없는 이름입니다' };
    }
    
    return { valid: true };
  }
}

// 싱글톤 인스턴스 export
export const leaderboardSystem = LeaderboardSystem.getInstance();