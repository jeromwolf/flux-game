'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ThemeSelector from '@/components/ui/ThemeSelector';
import { LanguageSelector, type Language } from '@/components/ui/LanguageSelector';
import { gameAnalyticsV2 } from '@/lib/analytics/GameAnalyticsV2';

// 게임 데이터 (다국어 지원)
const gameTranslations = {
  ko: {
    'cookie-clicker': { name: '쿠키 클리커', description: '쿠키를 클릭해서 부자되기!' },
    '2048': { name: '2048', description: '숫자 타일 합치기' },
    'tetris': { name: '테트리스', description: '블록을 쌓아 줄 없애기' },
    'snake': { name: '스네이크', description: '뱀을 조종해서 먹이 먹기' },
    'tic-tac-toe': { name: '틱택토', description: '3x3 격자에서 한 줄 만들기' },
    'minesweeper': { name: '지뢰찾기', description: '숨겨진 지뢰 피하기' },
    'breakout': { name: '브레이크아웃', description: '공으로 벽돌 깨기' },
    'bubble-shooter': { name: '버블 슈터', description: '같은 색깔 버블 터뜨리기' },
    'flux-jump': { name: '플럭스 점프', description: '장애물을 피해 점프!' },
    'flappy-flux': { name: '플래피 플럭스', description: '파이프를 피해 날아가기!' },
    'dino-run': { name: '다이노 런', description: '공룡과 함께 달리기!' },
    'word-tower': { name: '워드 타워', description: '단어로 탑을 쌓아보세요!' },
    'island-survival': { name: '무인도 서바이벌', description: '무인도에서 생존하고 탈출하기!' },
    'rhythm': { name: '리듬 게임', description: '다양한 곡과 난이도로 즐기는 리듬 게임!' },
    'stack-tower': { name: '스택 타워', description: '블록을 완벽하게 쌓아 최고의 타워를 만드세요!' },
    'cube-collector-3d': { name: '큐브 수집가 3D', description: '3D 공간에서 큐브를 모으세요!' },
    'liquid-robot': { name: '리퀴드 로봇', description: '변신하며 미션을 완성하세요!' },
    'k-food-rush': { name: 'K-Food Rush', description: '한국 음식을 만들어 전 세계 손님들을 만족시키세요!' },
    'seoul-runner': { name: 'Seoul Runner', description: '서울의 거리를 달리며 한국 문화를 경험하세요!' },
    'space-shooter': { name: '스페이스 슈터', description: '우주에서 적을 물리치고 살아남으세요!' },
    'merge-master': { name: '머지 마스터', description: '같은 아이템을 합쳐 더 높은 가치를 만드세요!' },
  },
  en: {
    'cookie-clicker': { name: 'Cookie Clicker', description: 'Click cookies to get rich!' },
    '2048': { name: '2048', description: 'Merge number tiles' },
    'tetris': { name: 'Tetris', description: 'Stack blocks and clear lines' },
    'snake': { name: 'Snake', description: 'Control snake to eat food' },
    'tic-tac-toe': { name: 'Tic Tac Toe', description: 'Make a line in 3x3 grid' },
    'minesweeper': { name: 'Minesweeper', description: 'Avoid hidden mines' },
    'breakout': { name: 'Breakout', description: 'Break bricks with ball' },
    'bubble-shooter': { name: 'Bubble Shooter', description: 'Pop same color bubbles' },
    'flux-jump': { name: 'Flux Jump', description: 'Jump over obstacles!' },
    'flappy-flux': { name: 'Flappy Flux', description: 'Fly through pipes!' },
    'dino-run': { name: 'Dino Run', description: 'Run with dinosaur!' },
    'word-tower': { name: 'Word Tower', description: 'Build a tower with words!' },
    'island-survival': { name: 'Island Survival', description: 'Survive and escape from island!' },
    'rhythm': { name: 'Rhythm Game', description: 'Enjoy rhythm game with various songs!' },
    'stack-tower': { name: 'Stack Tower', description: 'Stack blocks perfectly to build the highest tower!' },
    'cube-collector-3d': { name: 'Cube Collector 3D', description: 'Collect cubes in 3D space!' },
    'liquid-robot': { name: 'Liquid Robot', description: 'Transform and complete missions!' },
    'k-food-rush': { name: 'K-Food Rush', description: 'Cook Korean food for global customers!' },
    'seoul-runner': { name: 'Seoul Runner', description: 'Run through Seoul collecting Korean cultural items!' },
    'space-shooter': { name: 'Space Shooter', description: 'Defeat enemies and survive in space!' },
    'merge-master': { name: 'Merge Master', description: 'Merge same items to create higher values!' },
  }
};

// 게임 기본 데이터
const games = [
  {
    id: 'cookie-clicker',
    icon: '🍪',
    category: 'casual',
    status: 'available',
    releaseDate: '2025-07-15',
  },
  {
    id: '2048',
    icon: '🔢',
    category: 'puzzle',
    status: 'available',
    releaseDate: '2025-07-16',
  },
  {
    id: 'tetris',
    icon: '🧱',
    category: 'puzzle',
    status: 'available',
    releaseDate: '2025-07-18',
  },
  {
    id: 'snake',
    icon: '🐍',
    category: 'action',
    status: 'available',
    releaseDate: '2025-07-20',
  },
  {
    id: 'tic-tac-toe',
    icon: '⭕',
    category: 'strategy',
    status: 'available',
    releaseDate: '2025-07-22',
  },
  {
    id: 'minesweeper',
    icon: '💣',
    category: 'puzzle',
    status: 'available',
    releaseDate: '2025-07-25',
  },
  {
    id: 'breakout',
    icon: '🎾',
    category: 'action',
    status: 'available',
    releaseDate: '2025-07-27',
  },
  {
    id: 'bubble-shooter',
    icon: '🎯',
    category: 'arcade',
    status: 'available',
    releaseDate: '2025-07-29',
  },
  {
    id: 'flux-jump',
    icon: '🦘',
    category: 'casual',
    status: 'available',
    releaseDate: '2025-08-02',
  },
  {
    id: 'flappy-flux',
    icon: '🐤',
    category: 'arcade',
    status: 'available',
    releaseDate: '2025-08-05',
  },
  {
    id: 'dino-run',
    icon: '🦖',
    category: 'action',
    status: 'available',
    releaseDate: '2025-08-08',
  },
  {
    id: 'word-tower',
    icon: '📚',
    category: 'puzzle',
    status: 'available',
    releaseDate: '2025-08-10',
  },
  {
    id: 'island-survival',
    icon: '🏝️',
    category: 'strategy',
    status: 'available',
    releaseDate: '2025-08-15',
  },
  {
    id: 'rhythm',
    icon: '🎵',
    category: 'arcade',
    status: 'available',
    releaseDate: '2025-08-17',
  },
  {
    id: 'stack-tower',
    icon: '🏗️',
    category: 'arcade',
    status: 'available',
    releaseDate: '2025-08-19',
  },
  {
    id: 'cube-collector-3d',
    icon: '🎲',
    category: 'arcade',
    status: 'available',
    releaseDate: '2025-08-22',
  },
  {
    id: 'liquid-robot',
    icon: '🤖',
    category: 'action',
    status: 'available',
    releaseDate: '2025-08-24',
  },
  {
    id: 'k-food-rush',
    icon: '🍜',
    category: 'casual',
    status: 'available',
    releaseDate: '2025-08-26',
  },
  {
    id: 'seoul-runner',
    icon: '🏃',
    category: 'action',
    status: 'available',
    releaseDate: '2025-08-26',
  },
  {
    id: 'space-shooter',
    icon: '🚀',
    category: 'action',
    status: 'available',
    releaseDate: '2025-08-27',
  },
  {
    id: 'merge-master',
    icon: '🔀',
    category: 'puzzle',
    status: 'available',
    releaseDate: '2025-08-27',
  },
];

export default function Home() {
  const [sortedGames, setSortedGames] = useState(games);
  const [visitStats, setVisitStats] = useState<{[key: string]: {today: number, total: number}}>({});
  const [globalStats, setGlobalStats] = useState({ todayVisits: 0, totalVisits: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [language, setLanguage] = useState<Language>('ko');

  useEffect(() => {
    // Load analytics data
    const loadAnalytics = () => {
      const popularGames = gameAnalyticsV2.getGamesByPopularity();
      const allStats = gameAnalyticsV2.getAllStats();
      const global = gameAnalyticsV2.getGlobalStats();
      
      // Create visit stats map
      const stats: {[key: string]: {today: number, total: number}} = {};
      Object.values(allStats).forEach(stat => {
        stats[stat.gameId] = {
          today: stat.visitCountToday,
          total: stat.visitCount
        };
      });
      
      setVisitStats(stats);
      setGlobalStats({
        todayVisits: global.totalVisitsToday,
        totalVisits: global.totalVisitsAllTime
      });
      
      // Sort games: Today's releases first, then by popularity
      const today = new Date().toISOString().split('T')[0]; // 2025-08-26 format
      const sorted = [...games].sort((a, b) => {
        // Check if games are released today
        const aIsToday = a.releaseDate === today;
        const bIsToday = b.releaseDate === today;
        
        // Today's games always come first
        if (aIsToday && !bIsToday) return -1;
        if (!aIsToday && bIsToday) return 1;
        
        // If both are today's games or both are not, sort by popularity
        const aIndex = popularGames.indexOf(a.id);
        const bIndex = popularGames.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      
      setSortedGames(sorted);
      setIsLoaded(true);
    };

    loadAnalytics();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">⚡</span>
          </div>
          <div>
            <div className="text-white font-bold text-xl">FLUX</div>
            <div className="text-cyan-400 text-xs">AI GAMING</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSelector onLanguageChange={setLanguage} />
          <ThemeSelector />
        </div>
      </nav>

      {/* Hero Section */}
      <header className="text-center py-16">
        <h1 className="text-6xl md:text-7xl font-black mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
            FLUX AI
          </span>
        </h1>
        <p className="text-2xl text-gray-300 mb-4">
          {language === 'ko' ? '차세대 게임 플랫폼' : 'Next-Gen Gaming Platform'}
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
          {language === 'ko' ? 'AI 기반 메커닉으로 게임의 미래를 경험하세요' : 'Experience the future of gaming with AI-powered mechanics'}
        </p>
        
        {/* Global Stats */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-4 min-w-[120px]">
            <div className="text-3xl font-bold text-cyan-400 h-10 flex items-center justify-center">
              {isLoaded ? globalStats.todayVisits : '0'}
            </div>
            <div className="text-sm text-gray-400">{language === 'ko' ? '오늘 방문' : 'Today Visits'}</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg px-6 py-4 min-w-[120px]">
            <div className="text-3xl font-bold text-purple-500 h-10 flex items-center justify-center">
              {isLoaded ? globalStats.totalVisits : '0'}
            </div>
            <div className="text-sm text-gray-400">{language === 'ko' ? '전체 방문' : 'Total Visits'}</div>
          </div>
        </div>
      </header>

      {/* Games Grid */}
      <main className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">
          {language === 'ko' ? '사용 가능한 게임' : 'Available Games'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedGames.map((game) => {
            const stats = visitStats[game.id] || { today: 0, total: 0 };
            const trending = isLoaded ? gameAnalyticsV2.getTrendingStatus(game.id) : null;
            const isNewToday = game.releaseDate === new Date().toISOString().split('T')[0];
            
            return (
            <Link
              key={game.id}
              href={game.status === 'available' ? `/games/${game.id}` : '#'}
              className={`
                block p-6 rounded-xl border transition-all duration-300
                ${game.status === 'available' 
                  ? 'bg-gray-900 border-gray-700 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-1' 
                  : 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed'
                }
              `}
              onClick={(e) => game.status !== 'available' && e.preventDefault()}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{game.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{gameTranslations[language][game.id]?.name || game.id}</h3>
                    {isNewToday && <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded animate-pulse">🆕 NEW TODAY!</span>}
                    {isLoaded && !isNewToday && trending === 'hot' && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">🔥 HOT</span>}
                    {isLoaded && !isNewToday && trending === 'rising' && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded">📈 RISING</span>}
                    {isLoaded && !isNewToday && trending === 'new' && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">✨ NEW</span>}
                  </div>
                  {game.status !== 'available' && (
                    <span className="text-xs text-gray-500 uppercase">Coming Soon</span>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-3">{gameTranslations[language][game.id]?.description || ''}</p>
              {game.status === 'available' && isLoaded && (
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{language === 'ko' ? '오늘' : 'Today'}: {stats.today}</span>
                  <span>{language === 'ko' ? '전체' : 'Total'}: {stats.total}</span>
                </div>
              )}
            </Link>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-12 mt-20 border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          © 2025 Flux AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}