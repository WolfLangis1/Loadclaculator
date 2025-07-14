/**
 * Professional Layer Manager
 * 
 * CAD-style layer management for electrical drawings
 */

import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Edit3, 
  Trash2, 
  Plus,
  ChevronDown,
  ChevronRight,
  Copy,
  MoreVertical
} from 'lucide-react';

export interface DrawingLayer {
  id: string;
  name: string;
  description?: string;
  visible: boolean;
  locked: boolean;
  color: string;
  lineWeight: number;
  lineType: 'solid' | 'dashed' | 'dotted' | 'dashdot';
  opacity: number;
  printable: boolean;
  elementIds: string[];
  parentLayerId?: string;
  order: number;
  category: LayerCategory;
}

export type LayerCategory = 
  | 'electrical'
  | 'structural' 
  | 'architectural'
  | 'annotations'
  | 'dimensions'
  | 'grids'
  | 'backgrounds'
  | 'custom';

interface LayerManagerProps {
  layers: DrawingLayer[];
  onLayerChange: (layerId: string, changes: Partial<DrawingLayer>) => void;
  onLayerCreate: (layer: Omit<DrawingLayer, 'id'>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerDuplicate: (layerId: string) => void;
  onLayerReorder: (layerId: string, newOrder: number) => void;
  selectedLayerId?: string;
  onLayerSelect: (layerId: string) => void;
  className?: string;
}

const LAYER_CATEGORIES: Record<LayerCategory, { name: string; icon: string; defaultColor: string }> = {
  electrical: { name: 'Electrical', icon: '⚡', defaultColor: '#3b82f6' },
  structural: { name: 'Structural', icon: '🏗️', defaultColor: '#6b7280' },
  architectural: { name: 'Architectural', icon: '🏢', defaultColor: '#64748b' },
  annotations: { name: 'Annotations', icon: '📝', defaultColor: '#f59e0b' },
  dimensions: { name: 'Dimensions', icon: '📏', defaultColor: '#10b981' },
  grids: { name: 'Grids', icon: '⊞', defaultColor: '#8b5cf6' },
  backgrounds: { name: 'Backgrounds', icon: '🖼️', defaultColor: '#e5e7eb' },
  custom: { name: 'Custom', icon: '🎨', defaultColor: '#ef4444' }
};

const DEFAULT_LAYERS: Omit<DrawingLayer, 'id'>[] = [
  {
    name: 'Background',
    visible: true,
    locked: false,
    color: '#f8fafc',
    lineWeight: 1,
    lineType: 'solid',
    opacity: 1,
    printable: true,
    elementIds: [],
    order: 0,
    category: 'backgrounds'
  },
  {
    name: 'Grid',
    visible: true,
    locked: true,
    color: '#e2e8f0',
    lineWeight: 0.5,
    lineType: 'dotted',
    opacity: 0.5,
    printable: false,
    elementIds: [],
    order: 1,
    category: 'grids'
  },
  {
    name: 'Electrical - Power',
    visible: true,
    locked: false,
    color: '#dc2626',
    lineWeight: 2,
    lineType: 'solid',
    opacity: 1,
    printable: true,
    elementIds: [],
    order: 10,
    category: 'electrical'
  },
  {
    name: 'Electrical - Lighting',
    visible: true,
    locked: false,
    color: '#f59e0b',
    lineWeight: 1.5,
    lineType: 'solid',
    opacity: 1,
    printable: true,
    elementIds: [],
    order: 11,
    category: 'electrical'
  },
  {
    name: 'Electrical - Controls',
    visible: true,
    locked: false,
    color: '#3b82f6',
    lineWeight: 1,
    lineType: 'solid',
    opacity: 1,
    printable: true,
    elementIds: [],
    order: 12,
    category: 'electrical'
  },
  {
    name: 'Annotations',
    visible: true,
    locked: false,
    color: '#1f2937',
    lineWeight: 1,
    lineType: 'solid',
    opacity: 1,
    printable: true,
    elementIds: [],
    order: 20,
    category: 'annotations'
  },
  {
    name: 'Dimensions',
    visible: true,
    locked: false,
    color: '#059669',
    lineWeight: 0.5,
    lineType: 'solid',
    opacity: 1,
    printable: true,
    elementIds: [],
    order: 30,
    category: 'dimensions'
  }
];

export const LayerManager: React.FC<LayerManagerProps> = ({
  layers,
  onLayerChange,
  onLayerCreate,
  onLayerDelete,
  onLayerDuplicate,
  onLayerReorder,
  selectedLayerId,
  onLayerSelect,
  className = ''
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<LayerCategory, boolean>>({
    electrical: true,
    structural: false,
    architectural: false,
    annotations: false,
    dimensions: false,
    grids: false,
    backgrounds: false,
    custom: false
  });
  
  const [showCreateLayer, setShowCreateLayer] = useState(false);
  const [newLayerName, setNewLayerName] = useState('');
  const [newLayerCategory, setNewLayerCategory] = useState<LayerCategory>('electrical');

  // Group layers by category
  const layersByCategory = layers.reduce((acc, layer) => {
    if (!acc[layer.category]) {
      acc[layer.category] = [];
    }
    acc[layer.category].push(layer);
    return acc;
  }, {} as Record<LayerCategory, DrawingLayer[]>);

  // Sort layers by order within each category
  Object.keys(layersByCategory).forEach(category => {
    layersByCategory[category as LayerCategory].sort((a, b) => a.order - b.order);
  });

  const toggleCategory = (category: LayerCategory) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleCreateLayer = () => {
    if (!newLayerName.trim()) return;

    const categoryLayers = layersByCategory[newLayerCategory] || [];
    const maxOrder = categoryLayers.length > 0 
      ? Math.max(...categoryLayers.map(l => l.order))
      : LAYER_CATEGORIES[newLayerCategory] === LAYER_CATEGORIES.electrical ? 10 : 0;

    const newLayer: Omit<DrawingLayer, 'id'> = {
      name: newLayerName.trim(),
      visible: true,
      locked: false,
      color: LAYER_CATEGORIES[newLayerCategory].defaultColor,
      lineWeight: 1,
      lineType: 'solid',
      opacity: 1,
      printable: true,
      elementIds: [],
      order: maxOrder + 1,
      category: newLayerCategory
    };

    onLayerCreate(newLayer);
    setNewLayerName('');
    setShowCreateLayer(false);
  };

  const LayerItem: React.FC<{ layer: DrawingLayer }> = ({ layer }) => {
    const [showActions, setShowActions] = useState(false);
    const isSelected = selectedLayerId === layer.id;
    const hasElements = layer.elementIds.length > 0;

    return (
      <div
        className={`flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer group ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
        onClick={() => onLayerSelect(layer.id)}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Visibility toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLayerChange(layer.id, { visible: !layer.visible });
          }}
          className="p-1 hover:bg-gray-200 rounded"
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? (
            <Eye className="h-3 w-3 text-blue-600" />
          ) : (
            <EyeOff className="h-3 w-3 text-gray-400" />
          )}
        </button>

        {/* Lock toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLayerChange(layer.id, { locked: !layer.locked });
          }}
          className="p-1 hover:bg-gray-200 rounded"
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          {layer.locked ? (
            <Lock className="h-3 w-3 text-red-600" />
          ) : (
            <Unlock className="h-3 w-3 text-gray-400" />
          )}
        </button>

        {/* Color indicator */}
        <div
          className="w-4 h-4 rounded border border-gray-300"
          style={{ backgroundColor: layer.color }}
          title="Layer color"
        />

        {/* Layer name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-sm truncate ${layer.locked ? 'text-gray-500' : 'text-gray-900'}`}>
              {layer.name}
            </span>
            {hasElements && (
              <span className="text-xs text-gray-500 bg-gray-200 px-1 rounded">
                {layer.elementIds.length}
              </span>
            )}
          </div>
          {layer.description && (
            <div className="text-xs text-gray-500 truncate">
              {layer.description}
            </div>
          )}
        </div>

        {/* Layer actions */}
        {(showActions || isSelected) && (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLayerDuplicate(layer.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Duplicate layer"
            >
              <Copy className="h-3 w-3 text-gray-600" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete layer "${layer.name}"?`)) {
                  onLayerDelete(layer.id);
                }
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="Delete layer"
              disabled={hasElements}
            >
              <Trash2 className={`h-3 w-3 ${hasElements ? 'text-gray-300' : 'text-red-600'}`} />
            </button>

            <button
              className="p-1 hover:bg-gray-200 rounded"
              title="Layer properties"
            >
              <MoreVertical className="h-3 w-3 text-gray-600" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const CategorySection: React.FC<{ category: LayerCategory }> = ({ category }) => {
    const categoryLayers = layersByCategory[category] || [];
    const isExpanded = expandedCategories[category];
    const categoryInfo = LAYER_CATEGORIES[category];

    if (categoryLayers.length === 0) return null;

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center gap-2 p-2 bg-gray-50 hover:bg-gray-100 text-left"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
          <span className="text-lg">{categoryInfo.icon}</span>
          <span className="text-sm font-medium text-gray-900">{categoryInfo.name}</span>
          <span className="text-xs text-gray-500 ml-auto">({categoryLayers.length})</span>
        </button>

        {isExpanded && (
          <div className="divide-y divide-gray-100">
            {categoryLayers.map(layer => (
              <LayerItem key={layer.id} layer={layer} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Layers</h3>
        
        <button
          onClick={() => setShowCreateLayer(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      {/* Create layer form */}
      {showCreateLayer && (
        <div className="p-3 bg-blue-50 border-b border-blue-200">
          <div className="space-y-2">
            <div>
              <input
                type="text"
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                placeholder="Layer name"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateLayer();
                  if (e.key === 'Escape') setShowCreateLayer(false);
                }}
                autoFocus
              />
            </div>
            
            <div>
              <select
                value={newLayerCategory}
                onChange={(e) => setNewLayerCategory(e.target.value as LayerCategory)}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(LAYER_CATEGORIES).map(([key, info]) => (
                  <option key={key} value={key}>
                    {info.icon} {info.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleCreateLayer}
                className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!newLayerName.trim()}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateLayer(false)}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layer list */}
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(LAYER_CATEGORIES).map(([category]) => (
          <CategorySection key={category} category={category as LayerCategory} />
        ))}
      </div>

      {/* Quick actions */}
      <div className="p-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Layers: {layers.length}</span>
          <span>Visible: {layers.filter(l => l.visible).length}</span>
          <span>Locked: {layers.filter(l => l.locked).length}</span>
        </div>
      </div>
    </div>
  );
};