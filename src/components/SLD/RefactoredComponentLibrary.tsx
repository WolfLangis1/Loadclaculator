/**
 * Refactored Component Library
 * 
 * Clean, focused component library with extracted data and improved architecture
 */

import React, { useState } from 'react';
import { Filter, Heart, Grid, List, X } from 'lucide-react';
import { 
  COMPONENT_TEMPLATES, 
  COMPONENT_CATEGORIES, 
  MANUFACTURERS,
  type ComponentTemplate 
} from '../../data/componentTemplates';
import { useComponentFiltering } from '../../hooks/useComponentFiltering';
import { ComponentSearch } from './ComponentSearch';
import { CategoryFilter } from './CategoryFilter';
import { ComponentGrid } from './ComponentGrid';
import { createComponentLogger } from '../../services/loggingService';

interface RefactoredComponentLibraryProps {
  onComponentSelect: (template: ComponentTemplate) => void;
  onComponentDragStart?: (template: ComponentTemplate, event: React.DragEvent) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';

export const RefactoredComponentLibrary: React.FC<RefactoredComponentLibraryProps> = ({
  onComponentSelect,
  onComponentDragStart,
  className = ''
}) => {
  const logger = createComponentLogger('ComponentLibrary');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const {
    filters,
    filteredComponents,
    categoryCounts,
    totalComponents,
    filteredCount,
    favorites,
    favoritesCount,
    setSearchTerm,
    setSelectedCategory,
    setSelectedManufacturer,
    toggleFavoritesView,
    toggleFavorite,
    clearFilters,
    hasActiveFilters,
    isFavorite
  } = useComponentFiltering({ 
    components: COMPONENT_TEMPLATES 
  });

  const handleComponentSelect = (component: ComponentTemplate) => {
    logger.info('Component selected', { 
      componentId: component.id,
      componentName: component.name,
      category: component.category 
    });
    onComponentSelect(component);
  };

  const handleComponentDragStart = (component: ComponentTemplate, event: React.DragEvent) => {
    logger.info('Component drag started', { 
      componentId: component.id,
      componentName: component.name 
    });
    onComponentDragStart?.(component, event);
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Component Library</h2>
          
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="Grid view"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-sm text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-label="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              aria-label="Toggle filters"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <ComponentSearch
          searchTerm={filters.searchTerm}
          onSearchChange={setSearchTerm}
          suggestions={COMPONENT_TEMPLATES}
          className="mb-4"
        />

        {/* Quick stats */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredCount} of {totalComponents} components
          </span>
          
          {favoritesCount > 0 && (
            <button
              onClick={toggleFavoritesView}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                filters.showFavorites
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
              }`}
            >
              <Heart className={`h-3 w-3 ${filters.showFavorites ? 'fill-current' : ''}`} />
              {favoritesCount}
            </button>
          )}
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="flex-shrink-0 p-4 bg-gray-50 border-b border-gray-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Category filter */}
            <CategoryFilter
              categories={COMPONENT_CATEGORIES}
              selectedCategory={filters.selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryCounts={categoryCounts}
            />

            {/* Manufacturer filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <select
                value={filters.selectedManufacturer}
                onChange={(e) => setSelectedManufacturer(e.target.value as any)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {MANUFACTURERS.map(manufacturer => (
                  <option key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Component list */}
      <div className="flex-1 overflow-y-auto p-4">
        <ComponentGrid
          components={filteredComponents}
          favorites={favorites}
          onComponentSelect={handleComponentSelect}
          onComponentDragStart={handleComponentDragStart}
          onToggleFavorite={toggleFavorite}
        />
      </div>
    </div>
  );
};