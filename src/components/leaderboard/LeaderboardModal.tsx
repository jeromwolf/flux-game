'use client';

import React, { useState, useEffect } from 'react';
import { leaderboardSystem, LeaderboardEntry } from '@/lib/leaderboard/LeaderboardSystem';

interface LeaderboardModalProps {
  gameId: string;
  gameName: string;
  isOpen: boolean;
  onClose: () => void;
  currentPlayerName?: string;
  currentScore?: number;
}

export default function LeaderboardModal({
  gameId,
  gameName,
  isOpen,
  onClose,
  currentPlayerName,
  currentScore
}: LeaderboardModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'daily' | 'weekly'>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadLeaderboard();
    }
  }, [isOpen, activeTab, gameId]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      let leaderboardEntries: LeaderboardEntry[];
      
      if (activeTab === 'all') {
        leaderboardEntries = leaderboardSystem.getTopScores(gameId, 20);
      } else {
        leaderboardEntries = leaderboardSystem.getTimeBasedLeaderboard(
          gameId,
          activeTab,
          20
        );
      }
      
      setEntries(leaderboardEntries);

      // 현재 플레이어 순위 확인
      if (currentPlayerName) {
        const { playerRank: rank } = leaderboardSystem.getPlayerRankings(
          gameId,
          currentPlayerName
        );
        setPlayerRank(rank);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatScore = (score: number): string => {
    return score.toLocaleString();
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}일 전`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {gameName} 리더보드
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 탭 */}
          <div className="flex mt-4 space-x-2">
            {(['all', 'daily', 'weekly'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {tab === 'all' ? '전체' : tab === 'daily' ? '일간' : '주간'}
              </button>
            ))}
          </div>
        </div>

        {/* 현재 점수 (있을 경우) */}
        {currentScore !== undefined && currentPlayerName && (
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">현재 점수</p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {formatScore(currentScore)}
                </p>
              </div>
              {playerRank > 0 && (
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">내 순위</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    #{playerRank}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 리더보드 목록 */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              아직 기록이 없습니다. 첫 번째 기록을 세워보세요!
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => {
                const isCurrentPlayer = entry.playerName === currentPlayerName;
                const rank = index + 1;
                
                return (
                  <div
                    key={`${entry.playerName}-${entry.timestamp}`}
                    className={`flex items-center p-3 rounded-lg ${
                      isCurrentPlayer
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700'
                        : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                  >
                    {/* 순위 */}
                    <div className="w-12 text-center">
                      {rank <= 3 ? (
                        <span className="text-2xl">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-lg font-bold text-gray-600 dark:text-gray-400">
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* 플레이어 정보 */}
                    <div className="flex-1 ml-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-medium ${
                            isCurrentPlayer ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'
                          }`}>
                            {entry.playerName}
                            {isCurrentPlayer && ' (나)'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(entry.timestamp)}
                          </p>
                        </div>
                        <p className={`text-lg font-bold ${
                          isCurrentPlayer ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'
                        }`}>
                          {formatScore(entry.score)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}