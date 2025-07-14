/**
 * Device Toggle Panel (Development Only)
 * 
 * Floating panel for switching between mobile/desktop UI modes during development
 */

import React, { useState } from 'react';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  RotateCcw, 
  Settings, 
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { useDeviceToggle } from '../../hooks/useDeviceToggle';

export const DeviceTogglePanel: React.FC = () => {
  const deviceToggle = useDeviceToggle();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customWidth, setCustomWidth] = useState(deviceToggle.customDimensions.width);
  const [customHeight, setCustomHeight] = useState(deviceToggle.customDimensions.height);

  // Don't render in production
  if (!deviceToggle.isDevelopment) {
    return null;
  }

  const deviceIcons = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone
  };

  const DeviceIcon = deviceIcons[deviceToggle.deviceMode];

  const handleCustomDimensionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    deviceToggle.actions.setCustomDimensions(customWidth, customHeight);
    setShowCustom(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${deviceToggle.isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
            <DeviceIcon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-gray-900">
            Device Preview
          </span>
          {deviceToggle.isEnabled && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
              {deviceToggle.dimensions.width}×{deviceToggle.dimensions.height}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={deviceToggle.actions.toggle}
            className={`p-1 rounded hover:bg-gray-100 ${
              deviceToggle.isEnabled ? 'text-blue-600' : 'text-gray-400'
            }`}
            title={deviceToggle.isEnabled ? 'Disable device preview' : 'Enable device preview'}
          >
            {deviceToggle.isEnabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-gray-100 text-gray-600"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Device Mode Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Device Type
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['desktop', 'tablet', 'mobile'] as const).map((mode) => {
                const Icon = deviceIcons[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => deviceToggle.actions.setDeviceMode(mode)}
                    className={`flex flex-col items-center gap-1 p-2 text-xs rounded border transition-colors ${
                      deviceToggle.deviceMode === mode
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="capitalize">{mode}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preset Selection */}
          {deviceToggle.presets.length > 0 && !deviceToggle.isCustomMode && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Device Preset
              </label>
              <select
                value={deviceToggle.currentPresetIndex}
                onChange={(e) => deviceToggle.actions.setPreset(parseInt(e.target.value))}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {deviceToggle.presets.map((preset, index) => (
                  <option key={index} value={index}>
                    {preset.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Orientation Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">
              Orientation
            </span>
            <button
              onClick={deviceToggle.actions.toggleOrientation}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span className="capitalize">{deviceToggle.orientation}</span>
            </button>
          </div>

          {/* Custom Dimensions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">
                Custom Size
              </span>
              <button
                onClick={() => setShowCustom(!showCustom)}
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
              >
                <Settings className="h-3 w-3" />
              </button>
            </div>
            
            {showCustom && (
              <form onSubmit={handleCustomDimensionsSubmit} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width</label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      min="320"
                      max="3840"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height</label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                      min="240"
                      max="2160"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Apply Custom Size
                </button>
              </form>
            )}
          </div>

          {/* Current Status */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <div>
                <span className="font-medium">Breakpoint:</span> {deviceToggle.breakpointInfo.breakpoint}
              </div>
              <div>
                <span className="font-medium">Mobile:</span> {deviceToggle.breakpointInfo.isMobile ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Tablet:</span> {deviceToggle.breakpointInfo.isTablet ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};