'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { gameAnalytics } from '@/lib/analytics/GameAnalytics';

export default function GamePage() {
  const params = useParams();
  const router = useRouter();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const gameId = params.gameId as string;

  useEffect(() => {
    // 게임 방문 기록
    gameAnalytics.recordGameVisit(gameId);
    
    const loadGame = async () => {
      try {
        setIsLoading(true);
        
        // 게임 모듈 동적 로드
        let GameModule;
        switch (gameId) {
          case '2048':
            GameModule = await import('@/lib/games/Game2048');
            break;
          case 'tic-tac-toe':
            GameModule = await import('@/lib/games/TicTacToe');
            break;
          case 'tetris':
            GameModule = await import('@/lib/games/TetrisGame');
            break;
          case 'snake':
            GameModule = await import('@/lib/games/SnakeGame');
            break;
          case 'cookie-clicker':
            GameModule = await import('@/lib/games/CookieClicker');
            break;
          case 'flux-jump':
            GameModule = await import('@/lib/games/FluxJump');
            break;
          case 'mystery-box':
          case 'minesweeper':
            GameModule = await import('@/lib/games/Minesweeper');
            break;
          case 'breakout':
            GameModule = await import('@/lib/games/BreakoutGame');
            break;
          case 'bubble-shooter':
            GameModule = await import('@/lib/games/BubbleShooter');
            break;
          case 'flappy-flux':
            GameModule = await import('@/lib/games/FlappyFlux');
            break;
          default:
            throw new Error(`Game ${gameId} not found`);
        }

        // 게임 인스턴스 생성 및 마운트
        const game = new GameModule.default();
        if (gameContainerRef.current) {
          game.mount(gameContainerRef.current);
        }

        setIsLoading(false);

        // 클린업 함수
        return () => {
          // 게임 세션 종료 기록
          gameAnalytics.endGameSession(gameId);
          
          if (game.unmount) {
            game.unmount();
          }
        };
      } catch (err) {
        console.error('Failed to load game:', err);
        setError(err instanceof Error ? err.message : 'Failed to load game');
        setIsLoading(false);
      }
    };

    loadGame();
  }, [gameId]);

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <span className="text-6xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">게임을 불러올 수 없습니다</h2>
          <p className="text-gray-400 mb-8">{error}</p>
          <Link
            href="/"
            className="inline-block bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            {gameId.charAt(0).toUpperCase() + gameId.slice(1).replace(/-/g, ' ')}
          </h1>
          <Link
            href="/"
            className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Games
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        {isLoading && (
          <div className="text-cyan-400 text-xl flex items-center gap-3">
            <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading Game...
          </div>
        )}
        <div
          ref={gameContainerRef}
          className="w-full max-w-4xl mx-auto"
          style={{ display: isLoading ? 'none' : 'block' }}
        />
      </main>
    </div>
  );
}