/**
 * Component Grid Component
 * 
 * Grid layout for displaying electrical component cards with virtualization
 */

import React, { useMemo } from 'react';
import { ComponentCard } from './ComponentCard';
import type { ComponentTemplate } from '../../data/componentTemplates';

interface ComponentGridProps {
  components: ComponentTemplate[];
  favorites: Set<string>;
  onComponentSelect: (component: ComponentTemplate) => void;
  onComponentDragStart?: (component: ComponentTemplate, event: React.DragEvent) => void;
  onToggleFavorite: (componentId: string) => void;
  onShowDetails?: (component: ComponentTemplate) => void;
  className?: string;
}

export const ComponentGrid: React.FC<ComponentGridProps> = ({
  components,
  favorites,
  onComponentSelect,
  onComponentDragStart,
  onToggleFavorite,
  onShowDetails,
  className = ''
}) => {
  // Group components by category for better organization
  const groupedComponents = useMemo(() => {
    const groups: Record<string, ComponentTemplate[]> = {};
    
    components.forEach(component => {
      if (!groups[component.category]) {
        groups[component.category] = [];
      }
      groups[component.category].push(component);
    });
    
    // Sort categories alphabetically, but keep 'Solar' and 'Energy Storage' first
    const sortedCategories = Object.keys(groups).sort((a, b) => {
      if (a === 'Solar') return -1;
      if (b === 'Solar') return 1;
      if (a === 'Energy Storage') return -1;
      if (b === 'Energy Storage') return 1;
      return a.localeCompare(b);
    });
    
    return sortedCategories.map(category => ({
      category,
      components: groups[category]
    }));
  }, [components]);

  if (components.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No components found</div>
          <div className="text-sm">Try adjusting your search or filter criteria</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {groupedComponents.map(({ category, components: categoryComponents }) => (
        <div key={category} className="space-y-3">
          {/* Category header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              {category}
            </h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {categoryComponents.length} component{categoryComponents.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Component grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {categoryComponents.map(component => (
              <ComponentCard
                key={component.id}
                component={component}
                isFavorite={favorites.has(component.id)}
                onSelect={onComponentSelect}
                onDragStart={onComponentDragStart}
                onToggleFavorite={onToggleFavorite}
                onShowDetails={onShowDetails}
                className="aspect-square"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};