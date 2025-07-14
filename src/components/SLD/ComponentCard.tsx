/**
 * Component Card Component
 * 
 * Individual card for displaying electrical component with drag support
 */

import React from 'react';
import { Heart, Info } from 'lucide-react';
import type { ComponentTemplate } from '../../data/componentTemplates';

interface ComponentCardProps {
  component: ComponentTemplate;
  isFavorite: boolean;
  onSelect: (component: ComponentTemplate) => void;
  onDragStart?: (component: ComponentTemplate, event: React.DragEvent) => void;
  onToggleFavorite: (componentId: string) => void;
  onShowDetails?: (component: ComponentTemplate) => void;
  className?: string;
}

export const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  isFavorite,
  onSelect,
  onDragStart,
  onToggleFavorite,
  onShowDetails,
  className = ''
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    onDragStart?.(component, e);
  };

  const handleClick = () => {
    onSelect(component);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(component.id);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowDetails?.(component);
  };

  return (
    <div
      className={`
        group relative bg-white border border-gray-200 rounded-lg p-3 cursor-pointer
        hover:border-blue-300 hover:shadow-md transition-all duration-200
        ${className}
      `}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
      role="button"
      tabIndex={0}
      aria-label={`${component.name} - ${component.description}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Favorite button */}
      <button
        onClick={handleFavoriteClick}
        className={`
          absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 
          transition-opacity duration-200 z-10
          ${isFavorite 
            ? 'text-red-500 opacity-100' 
            : 'text-gray-400 hover:text-red-500'
          }
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart 
          className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`}
        />
      </button>

      {/* Component icon */}
      <div className="flex items-center justify-center mb-3">
        <div 
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${component.color}15` }}
        >
          <component.icon 
            className="h-8 w-8"
            style={{ color: component.color }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Component info */}
      <div className="text-center space-y-1">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2">
          {component.name}
        </h3>
        
        {component.manufacturer && (
          <p className="text-xs text-gray-500">
            {component.manufacturer}
          </p>
        )}
        
        <p className="text-xs text-gray-600 line-clamp-2">
          {component.description}
        </p>
        
        {/* Key specifications */}
        <div className="pt-2 space-y-1">
          {component.specifications?.maxPower && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Power:</span> {component.specifications.maxPower}kW
            </div>
          )}
          
          {component.specifications?.ampRating && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Rating:</span> {component.specifications.ampRating}A
            </div>
          )}
          
          {component.specifications?.voltage && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Voltage:</span> {component.specifications.voltage}V
            </div>
          )}
        </div>
      </div>

      {/* Details button */}
      {onShowDetails && (
        <button
          onClick={handleDetailsClick}
          className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label={`View details for ${component.name}`}
        >
          <Info className="h-4 w-4" />
        </button>
      )}

      {/* Drag indicator */}
      <div className="absolute inset-0 border-2 border-dashed border-blue-300 rounded-lg opacity-0 group-hover:opacity-50 pointer-events-none transition-opacity duration-200" />
    </div>
  );
};