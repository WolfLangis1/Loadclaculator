/**
 * Component Filtering Hook
 * 
 * Provides filtering and search functionality for electrical component templates
 */

import { useState, useMemo } from 'react';
import type { ComponentTemplate, ComponentCategory, Manufacturer } from '../data/componentTemplates';

interface FilterState {
  searchTerm: string;
  selectedCategory: ComponentCategory;
  selectedManufacturer: Manufacturer;
  showFavorites: boolean;
}

interface UseComponentFilteringProps {
  components: ComponentTemplate[];
  initialFilters?: Partial<FilterState>;
}

export const useComponentFiltering = ({ 
  components, 
  initialFilters = {} 
}: UseComponentFilteringProps) => {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    selectedCategory: 'All',
    selectedManufacturer: 'All',
    showFavorites: false,
    ...initialFilters
  });

  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filtered components based on current filters
  const filteredComponents = useMemo(() => {
    return components.filter(component => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch = 
          component.name.toLowerCase().includes(searchLower) ||
          component.description.toLowerCase().includes(searchLower) ||
          component.type.toLowerCase().includes(searchLower) ||
          (component.manufacturer && component.manufacturer.toLowerCase().includes(searchLower)) ||
          (component.model && component.model.toLowerCase().includes(searchLower));
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filters.selectedCategory !== 'All' && component.category !== filters.selectedCategory) {
        return false;
      }

      // Manufacturer filter
      if (filters.selectedManufacturer !== 'All' && component.manufacturer !== filters.selectedManufacturer) {
        return false;
      }

      // Favorites filter
      if (filters.showFavorites && !favorites.has(component.id)) {
        return false;
      }

      return true;
    });
  }, [components, filters, favorites]);

  // Component count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    components.forEach(component => {
      counts[component.category] = (counts[component.category] || 0) + 1;
    });

    return counts;
  }, [components]);

  // Update search term
  const setSearchTerm = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm }));
  };

  // Update selected category
  const setSelectedCategory = (category: ComponentCategory) => {
    setFilters(prev => ({ ...prev, selectedCategory: category }));
  };

  // Update selected manufacturer
  const setSelectedManufacturer = (manufacturer: Manufacturer) => {
    setFilters(prev => ({ ...prev, selectedManufacturer: manufacturer }));
  };

  // Toggle favorites view
  const toggleFavoritesView = () => {
    setFilters(prev => ({ ...prev, showFavorites: !prev.showFavorites }));
  };

  // Add/remove component from favorites
  const toggleFavorite = (componentId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(componentId)) {
        newFavorites.delete(componentId);
      } else {
        newFavorites.add(componentId);
      }
      return newFavorites;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      selectedCategory: 'All',
      selectedManufacturer: 'All',
      showFavorites: false
    });
  };

  // Check if any filters are active
  const hasActiveFilters = 
    filters.searchTerm !== '' ||
    filters.selectedCategory !== 'All' ||
    filters.selectedManufacturer !== 'All' ||
    filters.showFavorites;

  return {
    // Current filter state
    filters,
    
    // Filtered results
    filteredComponents,
    
    // Statistics
    categoryCounts,
    totalComponents: components.length,
    filteredCount: filteredComponents.length,
    
    // Favorites
    favorites,
    favoritesCount: favorites.size,
    
    // Filter actions
    setSearchTerm,
    setSelectedCategory,
    setSelectedManufacturer,
    toggleFavoritesView,
    toggleFavorite,
    clearFilters,
    
    // State checks
    hasActiveFilters,
    isFavorite: (componentId: string) => favorites.has(componentId)
  };
};