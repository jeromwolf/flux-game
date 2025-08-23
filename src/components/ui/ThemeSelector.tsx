'use client';

import { useState, useEffect } from 'react';
import { ThemeManager } from '@/lib/core/ThemeSystem';

export default function ThemeSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState('default');
  const [themes, setThemes] = useState<any[]>([]);

  useEffect(() => {
    const themeManager = ThemeManager.getInstance();
    setThemes(themeManager.getAllThemes());
    setCurrentThemeId(themeManager.getCurrentTheme().id);

    const handleThemeChange = (theme: any) => {
      setCurrentThemeId(theme.id);
    };

    themeManager.addListener(handleThemeChange);
    
    return () => {
      themeManager.removeListener(handleThemeChange);
    };
  }, []);

  const selectTheme = (themeId: string) => {
    const themeManager = ThemeManager.getInstance();
    themeManager.setTheme(themeId);
    setIsOpen(false);
  };

  const currentTheme = themes.find(t => t.id === currentThemeId);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <span className="text-2xl">🎨</span>
        <span className="text-white font-medium">{currentTheme?.name || 'Theme'}</span>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          <div className="p-4">
            <h3 className="text-white font-bold mb-4">게임 테마 선택</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => selectTheme(theme.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    theme.id === currentThemeId 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex gap-1 mt-1">
                      {/* Color preview circles */}
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{theme.name}</div>
                      <div className="text-gray-300 text-sm">{theme.description}</div>
                    </div>
                    {theme.id === currentThemeId && (
                      <svg className="w-5 h-5 text-white mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop to close menu */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}