'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { RhythmGameEnhanced } from '@/lib/games/RhythmGameEnhanced';
import { gameAnalyticsV2 } from '@/lib/analytics/GameAnalyticsV2';
import { type Language } from '@/components/ui/LanguageSelector';

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
  const [language, setLanguage] = useState<Language>('ko');

  const texts = {
    ko: {
      backToMain: '메인으로',
      title: '🎵 리듬 게임',
      score: '점수',
      selectSong: '곡 선택',
      selectDifficulty: '난이도 선택',
      startGame: '게임 시작',
      leaderboard: '리더보드',
      noRecords: '아직 기록이 없습니다',
      combo: '콤보',
      accuracy: '정확도',
      controls: '조작법',
      noteTypes: '노트 타입',
      normalNote: '일반 노트',
      holdNote: '홀드 노트',
      slideNote: '슬라이드 노트',
      normalNoteDesc: '타이밍에 맞춰 누르기',
      holdNoteDesc: '길게 누르기',
      slideNoteDesc: '특별 점수',
      pause: '일시정지',
      resume: '계속하기',
      restart: '다시 시작',
      songSelect: '곡 선택',
      lanes: '각 레인의 노트 치기',
      pauseKey: '일시정지',
      touch: '모바일에서 레인 터치',
      seconds: '초'
    },
    en: {
      backToMain: 'Back to Main',
      title: '🎵 Rhythm Game',
      score: 'Score',
      selectSong: 'Select Song',
      selectDifficulty: 'Select Difficulty',
      startGame: 'Start Game',
      leaderboard: 'Leaderboard',
      noRecords: 'No records yet',
      combo: 'Combo',
      accuracy: 'Accuracy',
      controls: 'Controls',
      noteTypes: 'Note Types',
      normalNote: 'Normal Note',
      holdNote: 'Hold Note',
      slideNote: 'Slide Note',
      normalNoteDesc: 'Press at the right timing',
      holdNoteDesc: 'Hold down',
      slideNoteDesc: 'Special points',
      pause: 'Pause',
      resume: 'Resume',
      restart: 'Restart',
      songSelect: 'Song Select',
      lanes: 'Hit notes in each lane',
      pauseKey: 'Pause',
      touch: 'Touch lanes on mobile',
      seconds: 'sec'
    }
  };

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem('flux-game-language') as Language;
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

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
            <span>←</span> {texts[language].backToMain}
          </Link>
          <h1 className="text-4xl font-bold text-center">{texts[language].title}</h1>
          <div className="text-2xl font-bold text-[#00ff88]">
            {isPlaying ? `${texts[language].score}: ${score}` : ''}
          </div>
        </div>
        
        {showSongSelect ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-[#16213e] rounded-lg p-6 shadow-xl mb-6">
              <h2 className="text-2xl font-bold mb-4 text-[#e94560]">{texts[language].selectSong}</h2>
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
                    <p className="text-xs mt-1">BPM: {song.bpm} | {Math.floor(song.duration / 1000)}{texts[language].seconds}</p>
                  </div>
                ))}
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-2 text-[#00ff88]">{texts[language].selectDifficulty}</h3>
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
                  {texts[language].startGame}
                </button>
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className="px-6 py-4 bg-[#e94560] text-white rounded-lg font-bold hover:bg-[#c73650] transition-colors"
                >
                  {texts[language].leaderboard}
                </button>
              </div>
            </div>
            
            {showLeaderboard && (
              <div className="bg-[#16213e] rounded-lg p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-[#e94560]">{texts[language].leaderboard}</h2>
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
                            {texts[language].combo}: {entry.combo} | {texts[language].accuracy}: {entry.accuracy}%
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400">{texts[language].noRecords}</p>
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
                <h2 className="text-2xl font-bold mb-4 text-[#e94560]">{texts[language].controls}</h2>
                <div className="space-y-2 text-gray-300">
                  <p><strong className="text-[#00ff88]">D, F, J, K</strong> - {texts[language].lanes}</p>
                  <p><strong className="text-[#00ff88]">Space</strong> - {texts[language].pauseKey}</p>
                  <p><strong className="text-[#00ff88]">{language === 'ko' ? '터치' : 'Touch'}</strong> - {texts[language].touch}</p>
                </div>
              </div>
              
              <div className="bg-[#16213e] rounded-lg p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-4 text-[#e94560]">{texts[language].noteTypes}</h2>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li><span className="text-[#00ff88]">{texts[language].normalNote}</span> - {texts[language].normalNoteDesc}</li>
                  <li><span className="text-[#00ff88]">{texts[language].holdNote}</span> - {texts[language].holdNoteDesc}</li>
                  <li><span className="text-[#ffd700]">{texts[language].slideNote}</span> - {texts[language].slideNoteDesc}</li>
                </ul>
              </div>
              
              <div className="flex gap-4">
                {!isPlaying ? (
                  <button
                    onClick={handleStart}
                    className="flex-1 bg-[#00ff88] text-[#0f0f1e] py-4 px-6 rounded-lg font-bold text-xl hover:bg-[#00cc66] transition-colors"
                  >
                    {texts[language].startGame}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handlePause}
                      className="flex-1 bg-[#e94560] text-white py-4 px-6 rounded-lg font-bold text-xl hover:bg-[#c73650] transition-colors"
                    >
                      {game?.isPaused ? texts[language].resume : texts[language].pause}
                    </button>
                    <button
                      onClick={handleStart}
                      className="flex-1 bg-[#00ff88] text-[#0f0f1e] py-4 px-6 rounded-lg font-bold text-xl hover:bg-[#00cc66] transition-colors"
                    >
                      {texts[language].restart}
                    </button>
                  </>
                )}
                <button
                  onClick={handleBackToMenu}
                  className="px-6 py-4 bg-[#666] text-white rounded-lg font-bold hover:bg-[#555] transition-colors"
                >
                  {texts[language].songSelect}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}