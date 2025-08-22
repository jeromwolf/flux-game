'use client';

import Link from 'next/link';
import { GameCard } from '@/components/games/GameCard';
import { CategoryFilter } from '@/components/ui/CategoryFilter';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { PopularGamesList } from '@/components/games/PopularGamesList';

// 게임 데이터 (나중에 DB나 CMS에서 가져올 수 있음)
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
    id: 'flux-jump',
    name: '플럭스 점프',
    description: '장애물을 피해 점프!',
    icon: '🦘',
    category: 'casual',
    status: 'coming-soon',
  },
  {
    id: 'tic-tac-toe',
    name: '틱택토',
    description: '3x3 격자에서 한 줄 만들기',
    icon: '⭕',
    category: 'strategy',
    status: 'coming-soon',
  },
  {
    id: 'snake',
    name: '스네이크',
    description: '뱀을 조종해서 먹이 먹기',
    icon: '🐍',
    category: 'action',
    status: 'coming-soon',
  },
  {
    id: 'tetris',
    name: '테트리스',
    description: '블록을 쌓아 줄 없애기',
    icon: '🧱',
    category: 'puzzle',
    status: 'coming-soon',
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
    id: 'minesweeper',
    name: '지뢰찾기',
    description: '숨겨진 지뢰 피하기',
    icon: '💣',
    category: 'puzzle',
    status: 'coming-soon',
  },
  {
    id: 'breakout',
    name: '브레이크아웃',
    description: '공으로 벽돌 깨기',
    icon: '🎾',
    category: 'action',
    status: 'coming-soon',
  },
  {
    id: 'bubble-shooter',
    name: '버블 슈터',
    description: '같은 색깔 버블 3개 이상 연결해서 터뜨리기',
    icon: '🎯',
    category: 'arcade',
    status: 'coming-soon',
  },
];

const categories = [
  { id: 'all', name: '전체', icon: '🎮' },
  { id: 'casual', name: '캐주얼', icon: '😊' },
  { id: 'puzzle', name: '퍼즐', icon: '🧩' },
  { id: 'action', name: '액션', icon: '⚡' },
  { id: 'strategy', name: '전략', icon: '🎯' },
  { id: 'arcade', name: '아케이드', icon: '🕹️' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Gaming-style background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 via-purple-900/30 to-pink-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>
      
      {/* Animated grid */}
      <div 
        className="absolute inset-0 opacity-10 animate-pulse"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      ></div>
      
      {/* Navigation */}
      <nav className="relative z-10 flex justify-between items-center p-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <span className="text-white font-bold text-lg">⚡</span>
            </div>
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg blur opacity-30 animate-pulse"></div>
          </div>
          <div>
            <div className="text-white font-bold text-xl tracking-wider">FLUX</div>
            <div className="text-cyan-400 text-xs font-medium tracking-widest">AI GAMING</div>
          </div>
        </div>
        <LanguageSelector />
      </nav>

      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Hero Section */}
        <header className="text-center mb-20">
          <div className="mb-12">
            <div className="relative inline-block">
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-8 tracking-tight">
                FLUX AI
              </h1>
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-400/20 via-blue-500/20 to-purple-600/20 blur-xl rounded-full"></div>
            </div>
            <div className="space-y-4">
              <p className="text-2xl md:text-3xl font-semibold text-white">
                Next-Gen Gaming Platform
              </p>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Experience the future of gaming with AI-powered mechanics, 
                seamless gameplay, and cutting-edge design
              </p>
            </div>
          </div>
          
          {/* Gaming Stats */}
          <div className="flex justify-center items-center space-x-8 mb-16">
            <div className="group relative">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 text-center transition-all hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/20">
                <div className="text-4xl font-black text-cyan-400 mb-2">{games.length}</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Games</div>
              </div>
            </div>
            <div className="group relative">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-purple-500/30 rounded-xl p-6 text-center transition-all hover:border-purple-400/50 hover:shadow-lg hover:shadow-purple-500/20">
                <div className="text-4xl font-black text-purple-400 mb-2">{categories.length - 1}</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Categories</div>
              </div>
            </div>
            <div className="group relative">
              <div className="bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border border-pink-500/30 rounded-xl p-6 text-center transition-all hover:border-pink-400/50 hover:shadow-lg hover:shadow-pink-500/20">
                <div className="text-4xl font-black text-pink-400 mb-2">∞</div>
                <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">Epic</div>
              </div>
            </div>
          </div>
        </header>

        {/* Category Filter */}
        <CategoryFilter categories={categories} />

        {/* Games Grid */}
        <main className="mt-12">
          <PopularGamesList games={games} />
        </main>

        {/* Footer */}
        <footer className="mt-20 text-center">
          <div className="border-t border-gray-800 pt-12">
            <div className="mb-8">
              <div className="flex justify-center items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">⚡</span>
                </div>
                <span className="text-xl font-bold text-white">FLUX AI</span>
              </div>
              <p className="text-gray-400 text-sm">
                Next-Gen Gaming Platform • Powered by AI
              </p>
            </div>
            <div className="flex justify-center space-x-8 text-sm mb-8">
              <Link href="/about" className="text-gray-400 hover:text-cyan-400 transition-colors uppercase tracking-wider font-medium">
                About
              </Link>
              <Link href="/privacy" className="text-gray-400 hover:text-cyan-400 transition-colors uppercase tracking-wider font-medium">
                Privacy
              </Link>
              <Link href="/contact" className="text-gray-400 hover:text-cyan-400 transition-colors uppercase tracking-wider font-medium">
                Contact
              </Link>
            </div>
            <p className="text-gray-600 text-xs">
              © 2024 Flux AI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}