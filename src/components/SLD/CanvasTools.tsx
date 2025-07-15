/**
 * Canvas Tools - Professional editing tools for SLD canvas
 * 
 * Provides pan, zoom, select, multi-select, and measurement tools
 * Professional CAD-style interaction patterns
 */

import React, { useState, useCallback } from 'react';
import { 
  MousePointer2, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Square, 
  Ruler, 
  RotateCw, 
  Copy, 
  Trash2,
  Home,
  Focus,
  Grid3X3
} from 'lucide-react';

export type CanvasTool = 'select' | 'pan' | 'zoom_in' | 'zoom_out' | 'rectangle_select' | 'measure' | 'rotate' | 'copy';

export interface CanvasToolsProps {
  activeTool: CanvasTool;
  onToolChange: (tool: CanvasTool) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomFit: () => void;
  onZoomReset: () => void;
  selectedComponents: string[];
  onDeleteSelected: () => void;
  onCopySelected: () => void;
  onRotateSelected: () => void;
  gridEnabled: boolean;
  onGridToggle: () => void;
  snapToGrid: boolean;
  onSnapToggle: () => void;
}

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];

export const CanvasTools: React.FC<CanvasToolsProps> = ({
  activeTool,
  onToolChange,
  zoom,
  onZoomChange,
  onZoomFit,
  onZoomReset,
  selectedComponents,
  onDeleteSelected,
  onCopySelected,
  onRotateSelected,
  gridEnabled,
  onGridToggle,
  snapToGrid,
  onSnapToggle
}) => {
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const tools = [
    {
      id: 'select' as CanvasTool,
      icon: MousePointer2,
      label: 'Select',
      shortcut: 'V',
      description: 'Select and move components'
    },
    {
      id: 'pan' as CanvasTool,
      icon: Move,
      label: 'Pan',
      shortcut: 'H',
      description: 'Pan the canvas view'
    },
    {
      id: 'zoom_in' as CanvasTool,
      icon: ZoomIn,
      label: 'Zoom In',
      shortcut: 'Z',
      description: 'Zoom in on canvas'
    },
    {
      id: 'zoom_out' as CanvasTool,
      icon: ZoomOut,
      label: 'Zoom Out',
      shortcut: 'Alt+Z',
      description: 'Zoom out from canvas'
    },
    {
      id: 'rectangle_select' as CanvasTool,
      icon: Square,
      label: 'Rectangle Select',
      shortcut: 'R',
      description: 'Select multiple components with rectangle'
    },
    {
      id: 'measure' as CanvasTool,
      icon: Ruler,
      label: 'Measure',
      shortcut: 'M',
      description: 'Measure distances and dimensions'
    }
  ];

  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(level => level >= zoom);
    const nextIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
    onZoomChange(ZOOM_LEVELS[nextIndex]);
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex(level => level >= zoom);
    const prevIndex = Math.max(currentIndex - 1, 0);
    onZoomChange(ZOOM_LEVELS[prevIndex]);
  };

  const handleZoomSelect = (level: number) => {
    onZoomChange(level);
    setShowZoomMenu(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex flex-col gap-2">
      {/* Main Tools */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-gray-600 mb-1">Tools</div>
        {tools.map(tool => (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
              activeTool === tool.id 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title={`${tool.description} (${tool.shortcut})`}
          >
            <tool.icon className="h-4 w-4" />
            <span className="text-xs">{tool.label}</span>
          </button>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="border-t pt-2">
        <div className="text-xs font-medium text-gray-600 mb-1">Zoom</div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 min-w-16 text-center"
            >
              {Math.round(zoom * 100)}%
            </button>
            
            {showZoomMenu && (
              <div className="absolute bottom-full mb-1 left-0 bg-white border border-gray-200 rounded shadow-lg z-10">
                <div className="p-1 max-h-40 overflow-y-auto">
                  {ZOOM_LEVELS.map(level => (
                    <button
                      key={level}
                      onClick={() => handleZoomSelect(level)}
                      className={`block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded ${
                        level === zoom ? 'bg-blue-100 text-blue-700' : ''
                      }`}
                    >
                      {Math.round(level * 100)}%
                    </button>
                  ))}
                  <div className="border-t border-gray-200 mt-1 pt-1">
                    <button
                      onClick={() => {
                        onZoomFit();
                        setShowZoomMenu(false);
                      }}
                      className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                    >
                      Fit to Screen
                    </button>
                    <button
                      onClick={() => {
                        onZoomReset();
                        setShowZoomMenu(false);
                      }}
                      className="block w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                    >
                      Reset (100%)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleZoomIn}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </button>
        </div>

        <div className="flex gap-1 mt-1">
          <button
            onClick={onZoomReset}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Reset Zoom"
          >
            <Home className="h-3 w-3" />
          </button>
          
          <button
            onClick={onZoomFit}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            title="Fit to Screen"
          >
            <Focus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Selection Tools */}
      {selectedComponents.length > 0 && (
        <div className="border-t pt-2">
          <div className="text-xs font-medium text-gray-600 mb-1">
            Selection ({selectedComponents.length})
          </div>
          
          <div className="flex flex-col gap-1">
            <button
              onClick={onCopySelected}
              className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
              title="Copy Selected (Ctrl+C)"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
            
            <button
              onClick={onRotateSelected}
              className="flex items-center gap-2 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
              title="Rotate Selected (R)"
            >
              <RotateCw className="h-3 w-3" />
              Rotate
            </button>
            
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-2 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
              title="Delete Selected (Delete)"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Grid and Snap Controls */}
      <div className="border-t pt-2">
        <div className="text-xs font-medium text-gray-600 mb-1">Grid</div>
        
        <div className="flex flex-col gap-1">
          <button
            onClick={onGridToggle}
            className={`flex items-center gap-2 px-2 py-1 text-xs rounded transition-colors ${
              gridEnabled 
                ? 'bg-green-100 text-green-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Toggle Grid"
          >
            <Grid3X3 className="h-3 w-3" />
            {gridEnabled ? 'Hide Grid' : 'Show Grid'}
          </button>
          
          <button
            onClick={onSnapToggle}
            className={`flex items-center gap-2 px-2 py-1 text-xs rounded transition-colors ${
              snapToGrid 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            title="Toggle Snap to Grid"
          >
            <div className="w-3 h-3 border border-current rounded-sm flex items-center justify-center">
              <div className="w-1 h-1 bg-current rounded-full" />
            </div>
            {snapToGrid ? 'Snap On' : 'Snap Off'}
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className="border-t pt-2">
        <div className="text-xs text-gray-500">
          <div className="font-medium mb-1">Shortcuts:</div>
          <div className="space-y-0.5">
            <div>V - Select</div>
            <div>H - Pan</div>
            <div>Z - Zoom</div>
            <div>R - Rectangle</div>
            <div>M - Measure</div>
            <div>Del - Delete</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasTools;