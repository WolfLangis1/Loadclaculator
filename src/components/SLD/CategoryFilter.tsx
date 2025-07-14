/**
 * Category Filter Component
 * 
 * Filter components by electrical category with counts
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ComponentCategory } from '../../data/componentTemplates';

interface CategoryFilterProps {
  categories: readonly ComponentCategory[];
  selectedCategory: ComponentCategory;
  onCategoryChange: (category: ComponentCategory) => void;
  categoryCounts: Record<string, number>;
  className?: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  categoryCounts,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
        Category
      </label>
      
      <div className="relative">
        <select
          id="category-filter"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as ComponentCategory)}
          className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Filter components by category"
        >
          {categories.map(category => {
            const count = category === 'All' 
              ? Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
              : categoryCounts[category] || 0;
            
            return (
              <option key={category} value={category}>
                {category} {count > 0 && `(${count})`}
              </option>
            );
          })}
        </select>
        
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};