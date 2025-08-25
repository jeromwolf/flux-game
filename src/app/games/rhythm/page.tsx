'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RhythmGameEnhanced } from '@/lib/games/RhythmGameEnhanced';
import { gameAnalyticsV2 } from '@/lib/analytics/GameAnalyticsV2';

interface Song {
  id: string;
  name: string;
  artist: string;
  bpm: number;
  duration: number;
  audioUrl?: string;
  previewUrl?: string;
  difficulty: {
    easy?: any;
    normal: any;
    hard: any;
    expert?: any;
  };
}

interface LeaderboardEntry {
  name: string;
  score: number;
  combo: number;
  accuracy: number;
  date: string;
}

export default function RhythmGameEnhancedPage() {
  const [game, setGame] = useState<RhythmGameEnhanced | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'normal' | 'hard' | 'expert'>('normal');
  const [showSongSelect, setShowSongSelect] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    gameAnalyticsV2.recordGameVisit('rhythm');
    
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (canvas) {
      const rhythmGame = new RhythmGameEnhanced('gameCanvas');
      rhythmGame.init().then(() => {
        setGame(rhythmGame);
        setSongs(rhythmGame.getSongList());
        setLeaderboard(rhythmGame.getLeaderboard());
      });
    }
    
    const scoreInterval = setInterval(() => {
      if (game) {
        setScore(game.score);
      }
    }, 100);
    
    return () => {
      clearInterval(scoreInterval);
      gameAnalyticsV2.endGameSession('rhythm');
      if (game) {
        game.stop();
      }
    };
  }, []);
  
  const handleSongSelect = async (songId: string) => {
    if (game) {
      setSelectedSong(songId);
      await game.loadSong(songId, selectedDifficulty);
      setShowSongSelect(false);
    }
  };
  
  const handleStart = async () => {
    if (game && selectedSong) {
      await game.start();
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
  
  const handleBackToMenu = () => {
    if (game) {
      game.stop();
    }
    setIsPlaying(false);
    setShowSongSelect(true);
    setSelectedSong(null);
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
            {isPlaying ? `점수: ${score}` : ''}
          </div>
        </div>
        
        {showSongSelect ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#16213e] rounded-lg p-6 shadow-xl mb-6">
              <h2 className="text-2xl font-bold mb-4 text-[#e94560]">곡 선택</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {songs.map((song) => (
                  <div
                    key={song.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedSong === song.id
                        ? 'bg-[#e94560] text-white'
                        : 'bg-[#0f3460] hover:bg-[#1a4570]'
                    }`}
                    onClick={() => setSelectedSong(song.id)}
                  >
                    <h3 className="text-lg font-bold">{song.name}</h3>
                    <p className="text-sm opacity-80">{song.artist}</p>
                    <p className="text-xs mt-1">BPM: {song.bpm} | {Math.floor(song.duration / 1000)}초</p>
                  </div>
                ))}
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2 text-[#00ff88]">난이도 선택</h3>
                <div className="flex gap-2">
                  {['easy', 'normal', 'hard', 'expert'].map((diff) => {
                    const song = songs.find(s => s.id === selectedSong);
                    const isAvailable = song && song.difficulty[diff as keyof typeof song.difficulty];
                    
                    return (
                      <button
                        key={diff}
                        onClick={() => isAvailable && setSelectedDifficulty(diff as any)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 rounded transition-colors ${
                          !isAvailable
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : selectedDifficulty === diff
                            ? 'bg-[#00ff88] text-[#0f0f1e]'
                            : 'bg-[#0f3460] hover:bg-[#1a4570]'
                        }`}
                      >
                        {diff.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => selectedSong && handleSongSelect(selectedSong)}
                  disabled={!selectedSong}
                  className="flex-1 bg-[#00ff88] text-[#0f0f1e] py-4 px-6 rounded-lg font-bold text-xl hover:bg-[#00cc66] transition-colors disabled:bg-gray-600 disabled:text-gray-400"
                >
                  게임 시작
                </button>
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="px-6 py-4 bg-[#e94560] text-white rounded-lg font-bold hover:bg-[#c73650] transition-colors"
                >
                  리더보드
                </button>
              </div>
            </div>
            
            {showLeaderboard && (
              <div className="bg-[#16213e] rounded-lg p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-[#e94560]">리더보드</h2>
                <div className="space-y-2">
                  {leaderboard.length > 0 ? (
                    leaderboard.map((entry, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 bg-[#0f3460] rounded"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-[#00ff88]">#{index + 1}</span>
                          <span>{entry.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">{entry.score.toLocaleString()}</div>
                          <div className="text-sm text-gray-400">
                            콤보: {entry.combo} | 정확도: {entry.accuracy}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400">아직 기록이 없습니다</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
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
                  <p><strong className="text-[#00ff88]">터치</strong> - 모바일에서 레인 터치</p>
                </div>
              </div>
              
              <div className="bg-[#16213e] rounded-lg p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-[#e94560]">노트 타입</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li><span className="text-[#00ff88]">일반 노트</span> - 타이밍에 맞춰 누르기</li>
                  <li><span className="text-[#00ff88]">홀드 노트</span> - 길게 누르기</li>
                  <li><span className="text-[#ffd700]">슬라이드 노트</span> - 특별 점수</li>
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
                <button
                  onClick={handleBackToMenu}
                  className="px-6 py-4 bg-[#666] text-white rounded-lg font-bold hover:bg-[#555] transition-colors"
                >
                  곡 선택
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}