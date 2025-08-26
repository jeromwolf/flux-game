'use client';

import { useState, useEffect } from 'react';

export type Language = 'ko' | 'en';

interface LanguageSelectorProps {
  onLanguageChange?: (language: Language) => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps = {}) {
  const [language, setLanguage] = useState<Language>('ko');
  const [mounted, setMounted] = useState(false);

  // 컴포넌트 마운트 시 저장된 언어 설정 불러오기
  useEffect(() => {
    setMounted(true);
    const savedLanguage = localStorage.getItem('flux-game-language') as Language;
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
      // 초기 언어 설정을 부모 컴포넌트에 알림
      if (onLanguageChange) {
        onLanguageChange(savedLanguage);
      }
    }
  }, [onLanguageChange]);

  const toggleLanguage = () => {
    const newLanguage: Language = language === 'ko' ? 'en' : 'ko';
    setLanguage(newLanguage);
    localStorage.setItem('flux-game-language', newLanguage);
    
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  // Hydration 문제 방지
  if (!mounted) {
    return (
      <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
        <span className="text-sm font-semibold text-cyan-400">KO</span>
        <div className="w-px h-4 bg-gray-600" />
        <span className="text-sm font-semibold text-gray-500">EN</span>
      </div>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors duration-200 border border-gray-700"
      aria-label={language === 'ko' ? '영어로 전환' : 'Switch to Korean'}
    >
      <span className={`text-sm font-semibold transition-colors ${language === 'ko' ? 'text-cyan-400' : 'text-gray-500'}`}>
        KO
      </span>
      <div className="w-px h-4 bg-gray-600" />
      <span className={`text-sm font-semibold transition-colors ${language === 'en' ? 'text-cyan-400' : 'text-gray-500'}`}>
        EN
      </span>
    </button>
  );
}