'use client';

import Link from 'next/link';

// 게임 데이터
const games = [
  {
    id: 'cookie-clicker',
    name: '쿠키 클리커',
    description: '쿠키를 클릭해서 부자되기!',
    icon: '🍪',
    category: 'casual',
    status: 'available',
  },
  {
    id: '2048',
    name: '2048',
    description: '숫자 타일 합치기',
    icon: '🔢',
    category: 'puzzle',
    status: 'available',
  },
  {
    id: 'tetris',
    name: '테트리스',
    description: '블록을 쌓아 줄 없애기',
    icon: '🧱',
    category: 'puzzle',
    status: 'available',
  },
  {
    id: 'snake',
    name: '스네이크',
    description: '뱀을 조종해서 먹이 먹기',
    icon: '🐍',
    category: 'action',
    status: 'available',
  },
  {
    id: 'tic-tac-toe',
    name: '틱택토',
    description: '3x3 격자에서 한 줄 만들기',
    icon: '⭕',
    category: 'strategy',
    status: 'available',
  },
  {
    id: 'minesweeper',
    name: '지뢰찾기',
    description: '숨겨진 지뢰 피하기',
    icon: '💣',
    category: 'puzzle',
    status: 'available',
  },
  {
    id: 'breakout',
    name: '브레이크아웃',
    description: '공으로 벽돌 깨기',
    icon: '🎾',
    category: 'action',
    status: 'available',
  },
  {
    id: 'bubble-shooter',
    name: '버블 슈터',
    description: '같은 색깔 버블 터뜨리기',
    icon: '🎯',
    category: 'arcade',
    status: 'available',
  },
  {
    id: 'flux-jump',
    name: '플럭스 점프',
    description: '장애물을 피해 점프!',
    icon: '🦘',
    category: 'casual',
    status: 'available',
  },
  {
    id: 'flappy-flux',
    name: '플래피 플럭스',
    description: '파이프를 피해 날아가기!',
    icon: '🐤',
    category: 'arcade',
    status: 'available',
  },
];

export default function Home() {
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
      </nav>

      {/* Hero Section */}
      <header className="text-center py-16">
        <h1 className="text-6xl md:text-7xl font-black mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
            FLUX AI
          </span>
        </h1>
        <p className="text-2xl text-gray-300 mb-4">
          Next-Gen Gaming Platform
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Experience the future of gaming with AI-powered mechanics
        </p>
      </header>

      {/* Games Grid */}
      <main className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center text-white">
          Available Games
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
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
                <div>
                  <h3 className="text-xl font-bold text-white">{game.name}</h3>
                  {game.status !== 'available' && (
                    <span className="text-xs text-gray-500 uppercase">Coming Soon</span>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm">{game.description}</p>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-12 mt-20 border-t border-gray-800">
        <p className="text-gray-500 text-sm">
          © 2024 Flux AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}