'use client';

import { useEffect, useState } from 'react';
import { GameCard } from './GameCard';
import { gameAnalytics } from '@/lib/analytics/GameAnalytics';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: string;
}

interface PopularGamesListProps {
  games: Game[];
}

export function PopularGamesList({ games }: PopularGamesListProps) {
  const [sortedGames, setSortedGames] = useState<Game[]>(games);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    // 클라이언트 사이드에서만 실행
    const popularGameIds = gameAnalytics.getGamesByPopularity();
    
    if (popularGameIds.length === 0) {
      // 통계가 없으면 원본 순서 유지
      setSortedGames(games);
      return;
    }

    // 인기도 순으로 정렬
    const sorted = [...games].sort((a, b) => {
      const aIndex = popularGameIds.indexOf(a.id);
      const bIndex = popularGameIds.indexOf(b.id);
      
      // 둘 다 통계가 있는 경우
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // 하나만 통계가 있는 경우 (통계가 있는 것이 앞으로)
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // 둘 다 통계가 없으면 원본 순서 유지
      return 0;
    });

    setSortedGames(sorted);
  }, [games, isClient]);

  const toggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
  };

  return (
    <div>
      {/* 개발용 분석 정보 토글 */}
      <div className="mb-6 flex justify-center">
        <button
          onClick={toggleAnalytics}
          className="text-gray-400 hover:text-cyan-400 text-sm font-medium uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analytics {showAnalytics ? 'Hide' : 'Show'}
        </button>
      </div>

      {/* 분석 정보 패널 */}
      {showAnalytics && (
        <div className="mb-8 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6">
          <h3 className="text-cyan-400 font-bold text-xl mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Game Analytics Dashboard
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedGames.slice(0, 6).map((game, index) => {
              const stats = gameAnalytics.getGameStatsSummary(game.id);
              return (
                <div
                  key={game.id}
                  className="bg-black/50 rounded-lg p-4 border border-gray-700/50 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{game.icon}</span>
                      <span className="text-white font-semibold">{game.name}</span>
                    </div>
                    {index < 3 && stats.visits > 0 && (
                      <span className="text-xs bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-2 py-1 rounded-full font-bold">
                        TOP {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400">Visits</div>
                      <div className="text-white font-bold">{stats.visits}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400">Play Time</div>
                      <div className="text-white font-bold">{stats.totalTime}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400">Avg Session</div>
                      <div className="text-white font-bold">{stats.averageTime}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded p-2">
                      <div className="text-gray-400">Score</div>
                      <div className="text-cyan-400 font-bold">{stats.popularity}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-xs text-gray-500 text-center">
            Popularity score calculated based on visit count and average play time
          </div>
        </div>
      )}

      {/* 게임 목록 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sortedGames.map((game, index) => (
          <div key={game.id} className="relative">
            {/* 인기 게임 배지 */}
            {isClient && index < 3 && gameAnalytics.getGameStats(game.id).visitCount > 0 && (
              <div className="absolute -top-3 -right-3 z-10">
                <div className="relative">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                    TOP {index + 1}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full blur-md opacity-50"></div>
                </div>
              </div>
            )}
            <GameCard game={game} />
          </div>
        ))}
      </div>

      {/* 통계 요약 */}
      {isClient && (
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-8 bg-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-xl px-8 py-6">
            <div className="text-center">
              <div className="text-3xl font-black text-cyan-400 mb-1">
                {Object.keys(gameAnalytics.getAllStats()).length}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Games Played</div>
            </div>
            <div className="w-px h-12 bg-gray-700"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-purple-400 mb-1">
                {Object.values(gameAnalytics.getAllStats()).reduce(
                  (total, stats) => total + stats.visitCount,
                  0
                )}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Total Visits</div>
            </div>
            <div className="w-px h-12 bg-gray-700"></div>
            <div className="text-center">
              <div className="text-3xl font-black text-pink-400 mb-1">
                {Math.floor(
                  Object.values(gameAnalytics.getAllStats()).reduce(
                    (total, stats) => total + stats.totalPlayTime,
                    0
                  ) / 60
                )}m
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider">Play Time</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}