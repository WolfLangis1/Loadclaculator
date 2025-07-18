/**
 * Grid Settings Panel Component
 * 
 * UI for configuring grid system settings and snap options
 */

import React, { useState } from 'react';
import { GridSystem, GridSettings, GRID_SCALES } from './engine/GridSystem';

interface GridSettingsPanelProps {
  gridSystem: GridSystem;
  isOpen: boolean;
  onClose: () => void;
}

export const GridSettingsPanel: React.FC<GridSettingsPanelProps> = ({
  gridSystem,
  isOpen,
  onClose
}) => {
  const [settings, setSettings] = useState<GridSettings>(gridSystem.getSettings());

  // Update local state when grid system changes
  React.useEffect(() => {
    const handleSettingsChange = (newSettings: GridSettings) => {
      setSettings(newSettings);
    };

    gridSystem.setSettingsChangeCallback(handleSettingsChange);
    
    return () => {
      gridSystem.setSettingsChangeCallback(() => {});
    };
  }, [gridSystem]);

  const handleSettingChange = (key: keyof GridSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    gridSystem.updateSettings({ [key]: value });
  };

  const handleScaleChange = (scaleName: string) => {
    const scale = GRID_SCALES[scaleName];
    if (scale) {
      handleSettingChange('scale', scale);
    }
  };

  const gridInfo = gridSystem.getGridInfo();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Grid Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Grid Enable/Disable */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleSettingChange('enabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Grid</span>
            </label>
          </div>

          {/* Grid Scale */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Grid Scale
            </label>
            <select
              value={Object.keys(GRID_SCALES).find(key => GRID_SCALES[key] === settings.scale) || 'quarter_inch'}
              onChange={(e) => handleScaleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!settings.enabled}
            >
              {Object.entries(GRID_SCALES).map(([key, scale]) => (
                <option key={key} value={key}>
                  {scale.name} ({scale.unit})
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500">
              Current: {gridInfo.realWorldSize} per grid unit
            </div>
          </div>

          {/* Grid Size */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Grid Size (pixels)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={settings.size}
                onChange={(e) => handleSettingChange('size', parseInt(e.target.value))}
                className="flex-1"
                disabled={!settings.enabled}
              />
              <span className="text-sm text-gray-600 w-12">{settings.size}px</span>
            </div>
          </div>

          {/* Grid Subdivisions */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Subdivisions
            </label>
            <select
              value={settings.subdivisions}
              onChange={(e) => handleSettingChange('subdivisions', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!settings.enabled}
            >
              <option value={1}>None</option>
              <option value={2}>2 (Half)</option>
              <option value={4}>4 (Quarter)</option>
              <option value={8}>8 (Eighth)</option>
            </select>
          </div>

          {/* Grid Visibility */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Grid Visibility</h4>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showMajorGrid}
                onChange={(e) => handleSettingChange('showMajorGrid', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={!settings.enabled}
              />
              <span className="text-sm text-gray-700">Show Major Grid</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.showMinorGrid}
                onChange={(e) => handleSettingChange('showMinorGrid', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={!settings.enabled || settings.subdivisions === 1}
              />
              <span className="text-sm text-gray-700">Show Minor Grid</span>
            </label>
          </div>

          {/* Grid Colors */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Grid Colors</h4>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 w-20">Major:</label>
              <input
                type="color"
                value={settings.majorGridColor}
                onChange={(e) => handleSettingChange('majorGridColor', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300"
                disabled={!settings.enabled}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.majorGridOpacity}
                onChange={(e) => handleSettingChange('majorGridOpacity', parseFloat(e.target.value))}
                className="flex-1"
                disabled={!settings.enabled}
              />
              <span className="text-xs text-gray-500 w-8">{Math.round(settings.majorGridOpacity * 100)}%</span>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 w-20">Minor:</label>
              <input
                type="color"
                value={settings.minorGridColor}
                onChange={(e) => handleSettingChange('minorGridColor', e.target.value)}
                className="w-8 h-8 rounded border border-gray-300"
                disabled={!settings.enabled}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.minorGridOpacity}
                onChange={(e) => handleSettingChange('minorGridOpacity', parseFloat(e.target.value))}
                className="flex-1"
                disabled={!settings.enabled}
              />
              <span className="text-xs text-gray-500 w-8">{Math.round(settings.minorGridOpacity * 100)}%</span>
            </div>
          </div>

          {/* Snap Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Snap Settings</h4>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.snapEnabled}
                onChange={(e) => handleSettingChange('snapEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Enable Snap to Grid</span>
            </label>

            <div className="space-y-2">
              <label className="block text-sm text-gray-600">
                Snap Tolerance (pixels)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={settings.snapTolerance}
                  onChange={(e) => handleSettingChange('snapTolerance', parseInt(e.target.value))}
                  className="flex-1"
                  disabled={!settings.snapEnabled}
                />
                <span className="text-sm text-gray-600 w-8">{settings.snapTolerance}px</span>
              </div>
            </div>
          </div>

          {/* Grid Information */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Grid Information</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Scale: {gridInfo.scale.name}</div>
              <div>Grid Size: {gridInfo.actualSize}px = {gridInfo.realWorldSize}</div>
              <div>Minor Grid: {(gridInfo.actualSize / settings.subdivisions).toFixed(1)}px</div>
              <div>Pixels per {gridInfo.scale.unit}: {gridInfo.scale.pixelsPerUnit.toFixed(1)}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200">
          <button
            onClick={() => {
              // Reset to defaults
              gridSystem.updateSettings({
                enabled: true,
                size: 20,
                subdivisions: 4,
                snapEnabled: true,
                snapTolerance: 8,
                showMajorGrid: true,
                showMinorGrid: true,
                majorGridColor: '#cccccc',
                minorGridColor: '#eeeeee',
                majorGridOpacity: 0.8,
                minorGridOpacity: 0.4,
                scale: GRID_SCALES.quarter_inch
              });
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};