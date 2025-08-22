'use client';

import { useState } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryFilterProps {
  categories: Category[];
  onCategoryChange?: (categoryId: string) => void;
}

export function CategoryFilter({ categories, onCategoryChange }: CategoryFilterProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <div className="flex justify-center mb-12">
      <div className="flex flex-wrap justify-center gap-3 bg-gray-900/50 backdrop-blur-sm 
                      border border-gray-700/50 rounded-xl p-3">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg 
                       font-semibold transition-all duration-200 text-sm uppercase tracking-wider
                       ${
                         selectedCategory === category.id
                           ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 scale-105'
                           : 'text-gray-300 hover:text-white hover:bg-gray-800/50 border border-transparent hover:border-gray-600/50'
                       }`}
          >
            <span className="text-lg">{category.icon}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}