// 게임 분석 및 통계 시스템
export interface GameStats {
  gameId: string;
  visitCount: number;
  totalPlayTime: number; // 초 단위
  lastVisited: Date;
  averageSessionTime: number; // 초 단위
  popularityScore: number; // 방문수와 플레이시간 기반 점수
}

export interface GameSession {
  gameId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // 초 단위
}

class GameAnalytics {
  private storageKey = 'flux-ai-game-stats';
  private sessionKey = 'flux-ai-current-session';

  // 게임 방문 기록
  recordGameVisit(gameId: string): void {
    if (typeof window === 'undefined') return;
    
    const stats = this.getGameStats(gameId);
    stats.visitCount += 1;
    stats.lastVisited = new Date();
    this.saveGameStats(gameId, stats);
    
    // 새 세션 시작
    this.startGameSession(gameId);
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
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);
    
    // 세션 정보 업데이트
    session.endTime = endTime;
    session.duration = duration;

    // 게임 통계 업데이트
    const stats = this.getGameStats(gameId);
    stats.totalPlayTime += duration;
    
    // 평균 세션 시간 계산
    stats.averageSessionTime = stats.totalPlayTime / stats.visitCount;
    
    // 인기도 점수 계산 (방문수 * 0.3 + 평균 세션시간(분) * 0.7)
    stats.popularityScore = (stats.visitCount * 0.3) + (stats.averageSessionTime / 60 * 0.7);
    
    this.saveGameStats(gameId, stats);
    
    // 세션 데이터 제거
    localStorage.removeItem(this.sessionKey);
    
    return duration;
  }

  // 특정 게임 통계 가져오기
  getGameStats(gameId: string): GameStats {
    const allStats = this.getAllStats();
    return allStats[gameId] || {
      gameId,
      visitCount: 0,
      totalPlayTime: 0,
      lastVisited: new Date(),
      averageSessionTime: 0,
      popularityScore: 0,
    };
  }

  // 모든 게임 통계 가져오기
  getAllStats(): Record<string, GameStats> {
    // 서버 사이드에서는 빈 객체 반환
    if (typeof window === 'undefined') {
      return {};
    }
    
    const data = localStorage.getItem(this.storageKey);
    if (!data) return {};
    
    try {
      const parsed = JSON.parse(data);
      // Date 객체 복원
      Object.keys(parsed).forEach(gameId => {
        parsed[gameId].lastVisited = new Date(parsed[gameId].lastVisited);
      });
      return parsed;
    } catch {
      return {};
    }
  }

  // 인기도 순으로 정렬된 게임 ID 목록 반환
  getGamesByPopularity(): string[] {
    const allStats = this.getAllStats();
    return Object.values(allStats)
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .map(stat => stat.gameId);
  }

  // 게임 통계 저장
  private saveGameStats(gameId: string, stats: GameStats): void {
    if (typeof window === 'undefined') return;
    
    const allStats = this.getAllStats();
    allStats[gameId] = stats;
    localStorage.setItem(this.storageKey, JSON.stringify(allStats));
  }

  // 통계 초기화 (개발/테스트용)
  clearAllStats(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.sessionKey);
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

  // 게임 통계 요약 정보
  getGameStatsSummary(gameId: string) {
    const stats = this.getGameStats(gameId);
    return {
      visits: stats.visitCount,
      totalTime: this.formatTime(stats.totalPlayTime),
      averageTime: this.formatTime(stats.averageSessionTime),
      lastPlayed: this.formatDate(stats.lastVisited),
      popularity: Math.round(stats.popularityScore * 10) / 10,
    };
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
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  }
}

// 싱글톤 인스턴스
export const gameAnalytics = new GameAnalytics();