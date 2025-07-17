/**
 * Drawing Tool Palette Component
 * 
 * Professional tool palette with categorized tools and keyboard shortcuts
 */

import React, { useState, useEffect } from 'react';
import { DrawingToolSystem, DrawingTool } from './tools/DrawingToolSystem';

interface DrawingToolPaletteProps {
  toolSystem: DrawingToolSystem;
  onToolChange?: (tool: DrawingTool | null) => void;
  compact?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

interface ToolCategory {
  id: string;
  name: string;
  icon: string;
  tools: DrawingTool[];
  expanded: boolean;
}

export const DrawingToolPalette: React.FC<DrawingToolPaletteProps> = ({
  toolSystem,
  onToolChange,
  compact = false,
  orientation = 'vertical'
}) => {
  const [activeTool, setActiveTool] = useState<DrawingTool | null>(null);
  const [categories, setCategories] = useState<ToolCategory[]>([]);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    // Initialize tool categories
    const allTools = toolSystem.getAllTools();
    const categoryMap = new Map<string, DrawingTool[]>();

    allTools.forEach(tool => {
      if (!categoryMap.has(tool.category)) {
        categoryMap.set(tool.category, []);
      }
      categoryMap.get(tool.category)!.push(tool);
    });

    const categoryConfigs = [
      { id: 'selection', name: 'Selection', icon: '↖️', expanded: true },
      { id: 'drawing', name: 'Drawing', icon: '✏️', expanded: true },
      { id: 'annotation', name: 'Annotation', icon: '📝', expanded: false },
      { id: 'measurement', name: 'Measurement', icon: '📏', expanded: false }
    ];

    const newCategories = categoryConfigs.map(config => ({
      ...config,
      tools: categoryMap.get(config.id) || []
    }));

    setCategories(newCategories);

    // Set up tool change callback
    toolSystem.setToolChangeCallback((tool) => {
      setActiveTool(tool);
      onToolChange?.(tool);
    });

    // Set default tool
    toolSystem.setActiveTool('selection');
  }, [toolSystem, onToolChange]);

  const handleToolSelect = (toolId: string) => {
    toolSystem.setActiveTool(toolId);
  };

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, expanded: !cat.expanded }
        : cat
    ));
  };

  const renderToolButton = (tool: DrawingTool) => {
    const isActive = activeTool?.id === tool.id;
    
    return (
      <button
        key={tool.id}
        onClick={() => handleToolSelect(tool.id)}
        className={`
          relative flex items-center justify-center p-2 rounded transition-colors
          ${isActive 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
          }
          ${compact ? 'w-8 h-8' : 'w-10 h-10'}
        `}
        title={`${tool.name}${tool.shortcut ? ` (${tool.shortcut.toUpperCase()})` : ''}`}
      >
        <span className={compact ? 'text-sm' : 'text-base'}>
          {tool.icon}
        </span>
        
        {tool.shortcut && showShortcuts && (
          <span className="absolute -bottom-1 -right-1 bg-gray-800 text-white text-xs px-1 rounded">
            {tool.shortcut.toUpperCase()}
          </span>
        )}
      </button>
    );
  };

  const renderCategory = (category: ToolCategory) => {
    if (compact && !category.expanded) {
      return (
        <div key={category.id} className="relative group">
          <button
            onClick={() => toggleCategory(category.id)}
            className="flex items-center justify-center w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            title={category.name}
          >
            <span className="text-sm">{category.icon}</span>
          </button>
          
          {/* Tooltip with tools */}
          <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-50">
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2">
              <div className="text-xs font-medium text-gray-600 mb-2">{category.name}</div>
              <div className="flex flex-col gap-1">
                {category.tools.map(renderToolButton)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={category.id} className="mb-4">
        <button
          onClick={() => toggleCategory(category.id)}
          className="flex items-center gap-2 w-full p-2 text-left text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          <span>{category.icon}</span>
          <span>{category.name}</span>
          <span className={`ml-auto transition-transform ${category.expanded ? 'rotate-90' : ''}`}>
            ▶
          </span>
        </button>
        
        {category.expanded && (
          <div className={`
            grid gap-1 mt-2 pl-2
            ${orientation === 'horizontal' ? 'grid-flow-col' : 'grid-cols-2'}
          `}>
            {category.tools.map(renderToolButton)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`
      bg-white border border-gray-200 rounded-lg shadow-sm
      ${orientation === 'horizontal' ? 'flex items-center gap-4 p-2' : 'p-3'}
      ${compact ? 'min-w-0' : 'min-w-48'}
    `}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-800">Tools</h3>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="text-xs text-gray-500 hover:text-gray-700"
            title="Toggle keyboard shortcuts"
          >
            {showShortcuts ? 'Hide' : 'Show'} Keys
          </button>
        </div>
      )}

      {/* Tool Categories */}
      <div className={orientation === 'horizontal' ? 'flex gap-4' : ''}>
        {categories.map(renderCategory)}
      </div>

      {/* Active Tool Info */}
      {!compact && activeTool && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            <div className="font-medium">{activeTool.name}</div>
            {activeTool.shortcut && (
              <div className="text-gray-500">Press {activeTool.shortcut.toUpperCase()}</div>
            )}
          </div>
        </div>
      )}

      {/* Tool Options */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">Options</div>
          
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={toolSystem.getOptions().snapToGrid}
                onChange={(e) => toolSystem.setOptions({ snapToGrid: e.target.checked })}
                className="w-3 h-3"
              />
              <span>Snap to Grid (G)</span>
            </label>
            
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={toolSystem.getOptions().orthoMode}
                onChange={(e) => toolSystem.setOptions({ orthoMode: e.target.checked })}
                className="w-3 h-3"
              />
              <span>Orthogonal Mode (O)</span>
            </label>
            
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={toolSystem.getOptions().showGuides}
                onChange={(e) => toolSystem.setOptions({ showGuides: e.target.checked })}
                className="w-3 h-3"
              />
              <span>Show Guides</span>
            </label>
          </div>
          
          <div className="mt-3">
            <label className="block text-xs text-gray-600 mb-1">Grid Size</label>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={toolSystem.getOptions().gridSize}
              onChange={(e) => toolSystem.setOptions({ gridSize: parseInt(e.target.value) })}
              className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-500 text-center">
              {toolSystem.getOptions().gridSize}px
            </div>
          </div>
        </div>
      )}
    </div>
  );
};