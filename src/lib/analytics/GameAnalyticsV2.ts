// 향상된 게임 분석 및 통계 시스템
export interface GameStats {
  gameId: string;
  visitCount: number;
  visitCountToday: number;
  totalPlayTime: number; // 초 단위
  lastVisited: Date;
  averageSessionTime: number; // 초 단위
  popularityScore: number; // 방문수와 플레이시간 기반 점수
  dailyVisits: { [date: string]: number }; // 날짜별 방문 기록
  weeklyHighScore?: number;
  monthlyHighScore?: number;
}

export interface GameSession {
  gameId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // 초 단위
}

export interface AnalyticsSummary {
  todayVisits: number;
  totalVisits: number;
  todayPlayTime: string;
  totalPlayTime: string;
  averageSessionTime: string;
  lastPlayed: string;
  popularityRank?: number;
  trendingStatus?: 'hot' | 'rising' | 'stable' | 'new';
}

class GameAnalyticsV2 {
  private storageKey = 'flux-ai-game-stats-v2';
  private sessionKey = 'flux-ai-current-session';
  private globalStatsKey = 'flux-ai-global-stats';

  // 오늘 날짜 문자열 가져오기 (YYYY-MM-DD)
  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  // 게임 방문 기록
  recordGameVisit(gameId: string): void {
    if (typeof window === 'undefined') return;
    
    const stats = this.getGameStats(gameId);
    const today = this.getTodayDateString();
    
    // 전체 방문수 증가
    stats.visitCount += 1;
    
    // 오늘 방문수 업데이트
    if (!stats.dailyVisits[today]) {
      stats.dailyVisits[today] = 0;
    }
    stats.dailyVisits[today] += 1;
    
    // 오늘 총 방문수 계산
    stats.visitCountToday = stats.dailyVisits[today];
    
    stats.lastVisited = new Date();
    
    // 7일 이상 된 기록 정리
    this.cleanupOldDailyVisits(stats);
    
    this.saveGameStats(gameId, stats);
    
    // 전역 통계 업데이트
    this.updateGlobalStats();
    
    // 새 세션 시작
    this.startGameSession(gameId);
  }

  // 오래된 일별 방문 기록 정리 (30일 이상)
  private cleanupOldDailyVisits(stats: GameStats): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    Object.keys(stats.dailyVisits).forEach(dateStr => {
      const date = new Date(dateStr);
      if (date < thirtyDaysAgo) {
        delete stats.dailyVisits[dateStr];
      }
    });
  }

  // 게임 세션 시작
  startGameSession(gameId: string): void {
    if (typeof window === 'undefined') return;
    
    const session: GameSession = {
      gameId,
      startTime: new Date(),
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  // 게임 세션 종료
  endGameSession(gameId: string): number {
    if (typeof window === 'undefined') return 0;
    
    const sessionData = localStorage.getItem(this.sessionKey);
    if (!sessionData) return 0;

    const session: GameSession = JSON.parse(sessionData);
    if (session.gameId !== gameId) return 0;

    const endTime = new Date();
    const startTime = new Date(session.startTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    // 세션 정보 업데이트
    session.endTime = endTime;
    session.duration = duration;

    // 게임 통계 업데이트
    const stats = this.getGameStats(gameId);
    stats.totalPlayTime += duration;
    
    // 평균 세션 시간 계산
    stats.averageSessionTime = Math.floor(stats.totalPlayTime / stats.visitCount);
    
    // 인기도 점수 계산 (방문수 * 0.3 + 평균 세션시간(분) * 0.7)
    const visitScore = stats.visitCount * 0.3;
    const timeScore = (stats.averageSessionTime / 60) * 0.7;
    const todayBonus = stats.visitCountToday * 0.1; // 오늘 방문수 보너스
    stats.popularityScore = visitScore + timeScore + todayBonus;
    
    this.saveGameStats(gameId, stats);
    
    // 세션 데이터 제거
    localStorage.removeItem(this.sessionKey);
    
    return duration;
  }

  // 특정 게임 통계 가져오기
  getGameStats(gameId: string): GameStats {
    const allStats = this.getAllStats();
    const today = this.getTodayDateString();
    
    const existingStats = allStats[gameId];
    if (existingStats) {
      // 오늘 방문수 업데이트
      existingStats.visitCountToday = existingStats.dailyVisits[today] || 0;
      return existingStats;
    }
    
    return {
      gameId,
      visitCount: 0,
      visitCountToday: 0,
      totalPlayTime: 0,
      lastVisited: new Date(),
      averageSessionTime: 0,
      popularityScore: 0,
      dailyVisits: {},
    };
  }

  // 모든 게임 통계 가져오기
  getAllStats(): Record<string, GameStats> {
    if (typeof window === 'undefined') {
      return {};
    }
    
    const data = localStorage.getItem(this.storageKey);
    if (!data) return {};
    
    try {
      const parsed = JSON.parse(data);
      // Date 객체 복원 및 오늘 방문수 업데이트
      const today = this.getTodayDateString();
      Object.keys(parsed).forEach(gameId => {
        parsed[gameId].lastVisited = new Date(parsed[gameId].lastVisited);
        parsed[gameId].visitCountToday = parsed[gameId].dailyVisits[today] || 0;
      });
      return parsed;
    } catch {
      return {};
    }
  }

  // 전역 통계 가져오기
  getGlobalStats(): { totalVisitsToday: number; totalVisitsAllTime: number } {
    if (typeof window === 'undefined') {
      return { totalVisitsToday: 0, totalVisitsAllTime: 0 };
    }

    const allStats = this.getAllStats();
    const today = this.getTodayDateString();
    
    let totalVisitsToday = 0;
    let totalVisitsAllTime = 0;
    
    Object.values(allStats).forEach(stats => {
      totalVisitsToday += stats.dailyVisits[today] || 0;
      totalVisitsAllTime += stats.visitCount;
    });
    
    return { totalVisitsToday, totalVisitsAllTime };
  }

  // 전역 통계 업데이트
  private updateGlobalStats(): void {
    const globalStats = this.getGlobalStats();
    localStorage.setItem(this.globalStatsKey, JSON.stringify({
      ...globalStats,
      lastUpdated: new Date()
    }));
  }

  // 인기도 순으로 정렬된 게임 ID 목록 반환
  getGamesByPopularity(): string[] {
    const allStats = this.getAllStats();
    return Object.values(allStats)
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .map(stat => stat.gameId);
  }

  // 오늘 인기 게임 (오늘 방문수 기준)
  getTodayPopularGames(): string[] {
    const allStats = this.getAllStats();
    return Object.values(allStats)
      .filter(stat => stat.visitCountToday > 0)
      .sort((a, b) => b.visitCountToday - a.visitCountToday)
      .map(stat => stat.gameId);
  }

  // 트렌딩 상태 계산
  getTrendingStatus(gameId: string): 'hot' | 'rising' | 'stable' | 'new' {
    const stats = this.getGameStats(gameId);
    const today = this.getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const todayVisits = stats.dailyVisits[today] || 0;
    const yesterdayVisits = stats.dailyVisits[yesterdayStr] || 0;
    
    if (stats.visitCount <= 5) return 'new';
    if (todayVisits > yesterdayVisits * 2) return 'hot';
    if (todayVisits > yesterdayVisits * 1.2) return 'rising';
    return 'stable';
  }

  // 게임 통계 저장
  private saveGameStats(gameId: string, stats: GameStats): void {
    if (typeof window === 'undefined') return;
    
    const allStats = this.getAllStats();
    allStats[gameId] = stats;
    localStorage.setItem(this.storageKey, JSON.stringify(allStats));
  }

  // 게임 통계 요약 정보
  getGameStatsSummary(gameId: string): AnalyticsSummary {
    const stats = this.getGameStats(gameId);
    const popularGames = this.getGamesByPopularity();
    const rank = popularGames.indexOf(gameId) + 1;
    
    return {
      todayVisits: stats.visitCountToday,
      totalVisits: stats.visitCount,
      todayPlayTime: this.formatTime(this.getTodayPlayTime(gameId)),
      totalPlayTime: this.formatTime(stats.totalPlayTime),
      averageSessionTime: this.formatTime(stats.averageSessionTime),
      lastPlayed: this.formatDate(stats.lastVisited),
      popularityRank: rank > 0 ? rank : undefined,
      trendingStatus: this.getTrendingStatus(gameId),
    };
  }

  // 오늘 플레이 시간 계산
  private getTodayPlayTime(gameId: string): number {
    // 현재 세션이 해당 게임인 경우 현재 세션 시간 포함
    const currentSessionTime = this.getCurrentSessionTime(gameId);
    return currentSessionTime; // 실제 구현에서는 오늘 모든 세션의 합계를 계산해야 함
  }

  // 현재 세션 시간 가져오기 (실시간)
  getCurrentSessionTime(gameId: string): number {
    if (typeof window === 'undefined') return 0;
    
    const sessionData = localStorage.getItem(this.sessionKey);
    if (!sessionData) return 0;

    const session: GameSession = JSON.parse(sessionData);
    if (session.gameId !== gameId) return 0;

    const now = new Date();
    return Math.floor((now.getTime() - new Date(session.startTime).getTime()) / 1000);
  }

  // 시간 포맷팅 (초 -> "5분 30초" 형태)
  private formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}초`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return remainingSeconds > 0 ? `${minutes}분 ${remainingSeconds}초` : `${minutes}분`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}시간 ${remainingMinutes}분`;
  }

  // 날짜 포맷팅
  private formatDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes === 0) return '방금 전';
        return `${diffMinutes}분 전`;
      }
      return `${diffHours}시간 전`;
    }
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  }

  // 통계 초기화 (개발/테스트용)
  clearAllStats(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem(this.globalStatsKey);
  }
}

// 싱글톤 인스턴스
export const gameAnalyticsV2 = new GameAnalyticsV2();