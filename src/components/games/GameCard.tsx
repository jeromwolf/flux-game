import Link from 'next/link';

interface Game {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status?: string;
}

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const isAvailable = game.status === 'available';
  
  return (
    <Link
      href={isAvailable ? `/games/${game.id}` : '#'}
      className={`
        group relative block overflow-hidden rounded-xl
        bg-gradient-to-br from-gray-900 to-gray-800
        border border-gray-700/50 
        transition-all duration-300
        ${isAvailable 
          ? 'hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20 hover:scale-105 cursor-pointer' 
          : 'opacity-50 cursor-not-allowed'
        }
      `}
      onClick={(e) => !isAvailable && e.preventDefault()}
    >
      {/* Glow effect on hover */}
      {isAvailable && (
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Content */}
      <div className="relative p-6 z-10">
        {/* Icon and Title */}
        <div className="flex items-center mb-4">
          <div className="text-5xl mr-4 group-hover:scale-110 transition-transform duration-300">
            {game.icon}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">
              {game.name}
            </h3>
            {!isAvailable && (
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Coming Soon
              </span>
            )}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed">
          {game.description}
        </p>
        
        {/* Category Badge */}
        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700/50 text-gray-300">
            {game.category}
          </span>
          {isAvailable && (
            <div className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}