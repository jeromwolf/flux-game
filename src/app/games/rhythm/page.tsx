'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RhythmGame } from '@/lib/games/RhythmGame';
import { gameAnalyticsV2 } from '@/lib/analytics/GameAnalyticsV2';

export default function RhythmGamePage() {
  const [game, setGame] = useState<RhythmGame | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    gameAnalyticsV2.trackVisit('rhythm');
    
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
      const rhythmGame = new RhythmGame('gameCanvas');
      rhythmGame.init().then(() => {
        setGame(rhythmGame);
      });
    }
    
    const scoreInterval = setInterval(() => {
      if (game) {
        setScore(game.score);
      }
    }, 100);
    
    return () => {
      clearInterval(scoreInterval);
      gameAnalyticsV2.trackPlayTime('rhythm');
      if (game) {
        game.stop();
      }
    };
  }, []);
  
  const handleStart = () => {
    if (game) {
      game.start();
      setIsPlaying(true);
    }
  };
  
  const handlePause = () => {
    if (game) {
      if (game.isPaused) {
        game.resume();
      } else {
        game.pause();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f0f1e] to-[#1a1a2e] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-[#00ff88] hover:underline flex items-center gap-2">
            <span>←</span> 메인으로
          </Link>
          <h1 className="text-4xl font-bold text-center">🎵 리듬 게임</h1>
          <div className="text-2xl font-bold text-[#00ff88]">
            점수: {score}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#16213e] rounded-lg p-4 shadow-xl">
              <canvas
                id="gameCanvas"
                width={600}
                height={600}
                className="w-full max-w-[600px] mx-auto border-2 border-[#e94560] rounded"
              />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-[#16213e] rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-[#e94560]">조작법</h2>
              <div className="space-y-2 text-gray-300">
                <p><strong className="text-[#00ff88]">D, F, J, K</strong> - 각 레인의 노트 치기</p>
                <p><strong className="text-[#00ff88]">Space</strong> - 일시정지</p>
              </div>
            </div>
            
            <div className="bg-[#16213e] rounded-lg p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4 text-[#e94560]">게임 방법</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                <li>노트가 히트라인에 도달할 때 키를 누르세요</li>
                <li>정확한 타이밍일수록 높은 점수!</li>
                <li>콤보를 유지하면 보너스 점수</li>
                <li>너무 많이 놓치면 게임 오버!</li>
              </ul>
            </div>
            
            <div className="flex gap-4">
              {!isPlaying ? (
                <button
                  onClick={handleStart}
                  className="flex-1 bg-[#00ff88] text-[#0f0f1e] py-4 px-6 rounded-lg font-bold text-xl hover:bg-[#00cc66] transition-colors"
                >
                  게임 시작
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePause}
                    className="flex-1 bg-[#e94560] text-white py-4 px-6 rounded-lg font-bold text-xl hover:bg-[#c73650] transition-colors"
                  >
                    {game?.isPaused ? '계속하기' : '일시정지'}
                  </button>
                  <button
                    onClick={handleStart}
                    className="flex-1 bg-[#00ff88] text-[#0f0f1e] py-4 px-6 rounded-lg font-bold text-xl hover:bg-[#00cc66] transition-colors"
                  >
                    다시 시작
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}