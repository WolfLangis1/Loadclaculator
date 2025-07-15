/**
 * Draggable Component for SLD Canvas
 * 
 * Individual draggable component with consistent styling between library and canvas
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { IEEESymbolRenderer } from './IEEESymbolsSimple';
import { useSLDData } from '../../context/SLDDataContext';
import type { SLDComponent } from '../../types/sld';

interface DraggableComponentProps {
  component: SLDComponent;
  isSelected: boolean;
  isDragging: boolean;
  onDragStart: (id: string, event: React.MouseEvent) => void;
  onDragEnd: () => void;
  onClick: (id: string, event: React.MouseEvent) => void;
  onDoubleClick?: (id: string) => void;
  style?: React.CSSProperties;
  gridSize?: number;
  snapToGrid?: boolean;
}

export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  isSelected,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
  onDoubleClick,
  style,
  gridSize = 20,
  snapToGrid = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(component.name);
  const dragRef = useRef<HTMLDivElement>(null);

  // Handle mouse down for drag start
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (event.detail === 2) {
      // Double click - start editing
      if (onDoubleClick) {
        onDoubleClick(component.id);
      } else {
        setIsEditing(true);
        setEditValue(component.name);
      }
    } else {
      // Single click - start drag or select
      onDragStart(component.id, event);
    }
  }, [component.id, component.name, onDragStart, onDoubleClick]);

  // Handle click for selection
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onClick(component.id, event);
  }, [component.id, onClick]);

  // Handle edit save
  const handleEditSave = useCallback(() => {
    // TODO: Update component name through context
    setIsEditing(false);
  }, [editValue]);

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(component.name);
  }, [component.name]);

  // Handle key press during editing
  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleEditSave();
    } else if (event.key === 'Escape') {
      handleEditCancel();
    }
  }, [handleEditSave, handleEditCancel]);

  return (
    <div
      ref={dragRef}
      className={`absolute cursor-pointer select-none transition-all duration-150 ${
        isSelected
          ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg z-20'
          : 'shadow-sm hover:shadow-md z-10'
      } ${
        isDragging ? 'opacity-80 scale-105' : ''
      }`}
      style={{
        left: component.position.x,
        top: component.position.y,
        width: component.width,
        height: component.height,
        ...style
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      title={`${component.name} - ${component.properties?.rating || ''}`}
    >
      {/* Component Background */}
      <div
        className={`w-full h-full bg-white border-2 rounded-lg flex flex-col items-center justify-center p-2 ${
          isSelected
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        {/* IEEE Symbol or Icon */}
        {component.properties?.ieeeSymbolId ? (
          <div className="mb-1">
            <IEEESymbolRenderer 
              symbolId={component.properties.ieeeSymbolId} 
              size={Math.min(component.width, component.height) * 0.4}
              color={isSelected ? '#2563eb' : '#4b5563'}
            />
          </div>
        ) : (
          <div className={`text-2xl mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
            {component.symbol}
          </div>
        )}

        {/* Component Name */}
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSave}
            onKeyDown={handleKeyPress}
            className="text-xs font-medium text-center border border-blue-300 rounded px-1 w-full max-w-full"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className={`text-xs font-medium text-center truncate w-full ${
            isSelected ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {component.name}
          </div>
        )}

        {/* Component Rating */}
        {component.properties?.rating && (
          <div className={`text-xs font-mono text-center mt-1 ${
            isSelected ? 'text-blue-700' : 'text-blue-600'
          }`}>
            {component.properties.rating}
          </div>
        )}

        {/* Circuit Number */}
        {component.properties?.circuitNumber && (
          <div className={`text-xs font-mono text-center ${
            isSelected ? 'text-green-700' : 'text-green-600'
          }`}>
            Ckt: {component.properties.circuitNumber}
          </div>
        )}

        {/* NEC Reference */}
        {component.properties?.necReference && (
          <div className="text-xs text-gray-500 text-center mt-1 opacity-75">
            {component.properties.necReference}
          </div>
        )}
      </div>

      {/* Selection Handles */}
      {isSelected && (
        <>
          {/* Corner handles for resizing */}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-se-resize" />
          
          {/* Edge handles for resizing */}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-n-resize" />
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-s-resize" />
          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-w-resize" />
          <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-e-resize" />
        </>
      )}
    </div>
  );
};

export default DraggableComponent;