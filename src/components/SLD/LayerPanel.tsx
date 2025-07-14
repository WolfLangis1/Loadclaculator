import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  Plus, 
  Settings, 
  ChevronDown, 
  ChevronRight,
  Trash2,
  Edit3,
  Printer,
  Filter
} from 'lucide-react';
import type { LayerDefinition, LayerGroup, SLDLayerService } from '../../services/sldLayerService';

interface LayerPanelProps {
  layerService: SLDLayerService;
  onLayerChange?: (layerId: string) => void;
  onLayerUpdate?: () => void;
  className?: string;
}

interface LayerItemProps {
  layer: LayerDefinition;
  isActive: boolean;
  onToggleVisibility: (layerId: string) => void;
  onToggleLock: (layerId: string) => void;
  onSetActive: (layerId: string) => void;
  onEdit: (layerId: string) => void;
  onDelete?: (layerId: string) => void;
  componentCount: number;
}

const LayerItem: React.FC<LayerItemProps> = ({
  layer,
  isActive,
  onToggleVisibility,
  onToggleLock,
  onSetActive,
  onEdit,
  onDelete,
  componentCount
}) => {
  const handleVisibilityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleVisibility(layer.id);
  };

  const handleLockClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleLock(layer.id);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm(`Delete layer "${layer.name}"? All components will be moved to the default layer.`)) {
      onDelete(layer.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(layer.id);
  };

  return (
    <div
      className={`
        flex items-center gap-2 px-2 py-1 text-sm rounded cursor-pointer
        ${isActive ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50'}
        ${!layer.visible ? 'opacity-50' : ''}
      `}
      onClick={() => onSetActive(layer.id)}
    >
      {/* Layer Color Indicator */}
      <div
        className="w-3 h-3 rounded border border-gray-300"
        style={{ backgroundColor: layer.color }}
      />

      {/* Visibility Toggle */}
      <button
        onClick={handleVisibilityClick}
        className="p-0.5 hover:bg-gray-200 rounded"
        title={layer.visible ? 'Hide layer' : 'Show layer'}
      >
        {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* Lock Toggle */}
      <button
        onClick={handleLockClick}
        className="p-0.5 hover:bg-gray-200 rounded"
        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
      >
        {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
      </button>

      {/* Layer Name and Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{layer.name}</span>
          {!layer.printable && <span className="text-xs text-gray-400">(No Print)</span>}
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span>SW: {layer.strokeWidth}</span>
          <span>Op: {Math.round(layer.opacity * 100)}%</span>
          <span>{componentCount} items</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleEditClick}
          className="p-0.5 hover:bg-gray-200 rounded"
          title="Edit layer"
        >
          <Edit3 size={12} />
        </button>
        {onDelete && layer.category === 'custom' && (
          <button
            onClick={handleDeleteClick}
            className="p-0.5 hover:bg-red-100 rounded text-red-600"
            title="Delete layer"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

interface LayerGroupItemProps {
  group: LayerGroup;
  layers: LayerDefinition[];
  activeLayerId: string;
  onToggleGroupVisibility: (groupId: string) => void;
  onToggleGroupCollapse: (groupId: string) => void;
  onLayerAction: (action: string, layerId: string) => void;
  componentCounts: Record<string, number>;
}

const LayerGroupItem: React.FC<LayerGroupItemProps> = ({
  group,
  layers,
  activeLayerId,
  onToggleGroupVisibility,
  onToggleGroupCollapse,
  onLayerAction,
  componentCounts
}) => {
  const groupLayers = layers.filter(layer => group.layerIds.includes(layer.id));
  const visibleLayersCount = groupLayers.filter(layer => layer.visible).length;

  return (
    <div className="border border-gray-200 rounded-md mb-2">
      {/* Group Header */}
      <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded-t-md">
        <button
          onClick={() => onToggleGroupCollapse(group.id)}
          className="p-0.5 hover:bg-gray-200 rounded"
        >
          {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>
        
        <button
          onClick={() => onToggleGroupVisibility(group.id)}
          className="p-0.5 hover:bg-gray-200 rounded"
          title={group.visible ? 'Hide group' : 'Show group'}
        >
          {group.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>

        <div className="flex-1">
          <div className="font-medium text-sm">{group.name}</div>
          <div className="text-xs text-gray-500">
            {visibleLayersCount}/{groupLayers.length} visible
          </div>
        </div>
      </div>

      {/* Group Layers */}
      {!group.collapsed && (
        <div className="p-1 space-y-1">
          {groupLayers.map(layer => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={layer.id === activeLayerId}
              onToggleVisibility={() => onLayerAction('toggleVisibility', layer.id)}
              onToggleLock={() => onLayerAction('toggleLock', layer.id)}
              onSetActive={() => onLayerAction('setActive', layer.id)}
              onEdit={() => onLayerAction('edit', layer.id)}
              onDelete={layer.category === 'custom' ? () => onLayerAction('delete', layer.id) : undefined}
              componentCount={componentCounts[layer.id] || 0}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const LayerPanel: React.FC<LayerPanelProps> = ({
  layerService,
  onLayerChange,
  onLayerUpdate,
  className = ''
}) => {
  const [showLayerEditor, setShowLayerEditor] = useState(false);
  const [editingLayer, setEditingLayer] = useState<LayerDefinition | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showPrintableOnly, setShowPrintableOnly] = useState(false);

  const layers = layerService.getAllLayers();
  const layerGroups = layerService.getAllLayerGroups();
  const activeLayer = layerService.getActiveLayer();
  const statistics = layerService.getLayerStatistics();

  const filteredLayers = layers.filter(layer => {
    if (filterCategory !== 'all' && layer.category !== filterCategory) return false;
    if (showPrintableOnly && !layer.printable) return false;
    return true;
  });

  const categories = [...new Set(layers.map(layer => layer.category))];

  const handleLayerAction = (action: string, layerId: string) => {
    switch (action) {
      case 'toggleVisibility':
        layerService.toggleLayerVisibility(layerId);
        break;
      case 'toggleLock':
        layerService.toggleLayerLock(layerId);
        break;
      case 'setActive':
        layerService.setActiveLayer(layerId);
        onLayerChange?.(layerId);
        break;
      case 'edit':
        const layer = layers.find(l => l.id === layerId);
        if (layer) {
          setEditingLayer(layer);
          setShowLayerEditor(true);
        }
        break;
      case 'delete':
        if (layerService.deleteLayer(layerId)) {
          onLayerUpdate?.();
        }
        break;
    }
    onLayerUpdate?.();
  };

  const handleGroupAction = (action: string, groupId: string) => {
    switch (action) {
      case 'toggleVisibility':
        layerService.toggleLayerGroupVisibility(groupId);
        break;
      case 'toggleCollapse':
        const group = layerGroups.find(g => g.id === groupId);
        if (group) {
          group.collapsed = !group.collapsed;
        }
        break;
    }
    onLayerUpdate?.();
  };

  const handleCreateLayer = () => {
    setEditingLayer(null);
    setShowLayerEditor(true);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Layers</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateLayer}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Create new layer"
          >
            <Plus size={16} />
          </button>
          <button
            className="p-1.5 hover:bg-gray-100 rounded"
            title="Layer settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Active Layer Info */}
      <div className="p-3 bg-blue-50 border-b border-gray-200">
        <div className="text-sm font-medium text-blue-900">Active Layer</div>
        {activeLayer ? (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-3 h-3 rounded border border-gray-300"
              style={{ backgroundColor: activeLayer.color }}
            />
            <span className="text-sm text-blue-800">{activeLayer.name}</span>
          </div>
        ) : (
          <div className="text-sm text-blue-600">No active layer</div>
        )}
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-gray-200 space-y-2">
        <div className="flex items-center gap-2">
          <Filter size={14} />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showPrintableOnly}
            onChange={(e) => setShowPrintableOnly(e.target.checked)}
            className="rounded"
          />
          <Printer size={14} />
          Printable only
        </label>
      </div>

      {/* Statistics */}
      <div className="p-3 border-b border-gray-200 text-xs text-gray-600">
        <div className="grid grid-cols-2 gap-2">
          <div>Total: {statistics.totalLayers}</div>
          <div>Visible: {statistics.visibleLayers}</div>
          <div>Locked: {statistics.lockedLayers}</div>
          <div>Components: {Object.values(statistics.componentsByLayer).reduce((a, b) => a + b, 0)}</div>
        </div>
      </div>

      {/* Layer Groups */}
      <div className="p-3 max-h-96 overflow-y-auto">
        {layerGroups.map(group => (
          <LayerGroupItem
            key={group.id}
            group={group}
            layers={filteredLayers}
            activeLayerId={activeLayer?.id || ''}
            onToggleGroupVisibility={(groupId) => handleGroupAction('toggleVisibility', groupId)}
            onToggleGroupCollapse={(groupId) => handleGroupAction('toggleCollapse', groupId)}
            onLayerAction={handleLayerAction}
            componentCounts={statistics.componentsByLayer}
          />
        ))}

        {/* Ungrouped Layers */}
        {(() => {
          const groupedLayerIds = new Set(
            layerGroups.flatMap(group => group.layerIds)
          );
          const ungroupedLayers = filteredLayers.filter(
            layer => !groupedLayerIds.has(layer.id)
          );

          if (ungroupedLayers.length > 0) {
            return (
              <div className="mt-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Other Layers</div>
                <div className="space-y-1">
                  {ungroupedLayers.map(layer => (
                    <LayerItem
                      key={layer.id}
                      layer={layer}
                      isActive={layer.id === activeLayer?.id}
                      onToggleVisibility={() => handleLayerAction('toggleVisibility', layer.id)}
                      onToggleLock={() => handleLayerAction('toggleLock', layer.id)}
                      onSetActive={() => handleLayerAction('setActive', layer.id)}
                      onEdit={() => handleLayerAction('edit', layer.id)}
                      onDelete={layer.category === 'custom' ? () => handleLayerAction('delete', layer.id) : undefined}
                      componentCount={statistics.componentsByLayer[layer.id] || 0}
                    />
                  ))}
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>

      {/* Layer Editor Modal */}
      {showLayerEditor && (
        <LayerEditor
          layer={editingLayer}
          onSave={(layer) => {
            if (editingLayer) {
              layerService.updateLayer(editingLayer.id, layer);
            } else {
              layerService.createLayer({
                id: `custom_${Date.now()}`,
                ...layer
              });
            }
            setShowLayerEditor(false);
            setEditingLayer(null);
            onLayerUpdate?.();
          }}
          onCancel={() => {
            setShowLayerEditor(false);
            setEditingLayer(null);
          }}
        />
      )}
    </div>
  );
};

interface LayerEditorProps {
  layer?: LayerDefinition | null;
  onSave: (layer: Omit<LayerDefinition, 'id' | 'order'>) => void;
  onCancel: () => void;
}

const LayerEditor: React.FC<LayerEditorProps> = ({ layer, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: layer?.name || '',
    description: layer?.description || '',
    color: layer?.color || '#1f2937',
    strokeWidth: layer?.strokeWidth || 2,
    visible: layer?.visible ?? true,
    locked: layer?.locked ?? false,
    printable: layer?.printable ?? true,
    opacity: layer?.opacity || 1.0,
    lineType: layer?.lineType || 'solid',
    category: layer?.category || 'custom'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Omit<LayerDefinition, 'id' | 'order'>);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">
          {layer ? 'Edit Layer' : 'Create New Layer'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Layer Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2 h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full h-10 border border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stroke Width
              </label>
              <input
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={formData.strokeWidth}
                onChange={(e) => setFormData(prev => ({ ...prev, strokeWidth: parseFloat(e.target.value) }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.opacity}
                onChange={(e) => setFormData(prev => ({ ...prev, opacity: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 text-center">
                {Math.round(formData.opacity * 100)}%
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Line Type
              </label>
              <select
                value={formData.lineType}
                onChange={(e) => setFormData(prev => ({ ...prev, lineType: e.target.value as any }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="dashdot">Dash-Dot</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="power">Power</option>
              <option value="control">Control</option>
              <option value="communication">Communication</option>
              <option value="safety">Safety</option>
              <option value="grounding">Grounding</option>
              <option value="annotation">Annotation</option>
              <option value="dimension">Dimension</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.visible}
                onChange={(e) => setFormData(prev => ({ ...prev, visible: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Visible</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.locked}
                onChange={(e) => setFormData(prev => ({ ...prev, locked: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Locked</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.printable}
                onChange={(e) => setFormData(prev => ({ ...prev, printable: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">Printable</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {layer ? 'Update' : 'Create'} Layer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LayerPanel;