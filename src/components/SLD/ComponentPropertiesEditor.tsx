/**
 * Component Properties Editor
 * 
 * Editable properties panel for SLD components including amps, name, model, etc.
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { X, Save, RotateCcw, Zap, Settings, Info } from 'lucide-react';
import type { SLDComponent } from '../../types/sld';
import { useSLDData } from '../../context/SLDDataContext';

interface ComponentPropertiesEditorProps {
  component: SLDComponent | null;
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

interface EditableProperties {
  name: string;
  amperage: number;
  voltage: number;
  model: string;
  manufacturer: string;
  rating: string;
  circuitNumber: string;
  description: string;
  necReference: string;
  phase: '1' | '3';
  poles: number;
  wireSize: string;
  wireType: 'THWN' | 'XHHW' | 'USE' | 'RHH' | 'RHW';
  wireLength: number;
  conduitType: 'EMT' | 'PVC' | 'LFMC' | 'RMC' | 'RIGID';
  isGroundFaultProtected: boolean;
  isArcFaultProtected: boolean;
  isSurgeProtected: boolean;
  continuousLoad: boolean;
  loadType: 'resistive' | 'inductive' | 'motor' | 'lighting' | 'mixed';
  efficiency: number;
  powerFactor: number;
}

const DEFAULT_PROPERTIES: EditableProperties = {
  name: '',
  amperage: 20,
  voltage: 240,
  model: '',
  manufacturer: '',
  rating: '20A',
  circuitNumber: '',
  description: '',
  necReference: '',
  phase: '1',
  poles: 2,
  wireSize: '12 AWG',
  wireType: 'THWN',
  wireLength: 50,
  conduitType: 'EMT',
  isGroundFaultProtected: false,
  isArcFaultProtected: false,
  isSurgeProtected: false,
  continuousLoad: false,
  loadType: 'resistive',
  efficiency: 100,
  powerFactor: 1.0
};

export const ComponentPropertiesEditor: React.FC<ComponentPropertiesEditorProps> = ({
  component,
  isOpen,
  onClose,
  position
}) => {
  const { updateComponent } = useSLDData();
  const [properties, setProperties] = useState<EditableProperties>(DEFAULT_PROPERTIES);
  const [activeTab, setActiveTab] = useState<'basic' | 'electrical' | 'physical' | 'protection'>('basic');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize properties from component
  useEffect(() => {
    if (component) {
      setProperties({
        name: component.name || '',
        amperage: component.properties?.amperage || 20,
        voltage: component.properties?.voltage || 240,
        model: component.properties?.model || '',
        manufacturer: component.properties?.manufacturer || '',
        rating: component.properties?.rating || '20A',
        circuitNumber: component.properties?.circuitNumber || '',
        description: component.properties?.description || '',
        necReference: component.properties?.necReference || '',
        phase: component.properties?.phase || '1',
        poles: component.properties?.poles || 2,
        wireSize: component.properties?.wireSize || '12 AWG',
        wireType: component.properties?.wireType || 'THWN',
        wireLength: component.properties?.wireLength || 50,
        conduitType: component.properties?.conduitType || 'EMT',
        isGroundFaultProtected: component.properties?.isGroundFaultProtected || false,
        isArcFaultProtected: component.properties?.isArcFaultProtected || false,
        isSurgeProtected: component.properties?.isSurgeProtected || false,
        continuousLoad: component.properties?.continuousLoad || false,
        loadType: component.properties?.loadType || 'resistive',
        efficiency: component.properties?.efficiency || 100,
        powerFactor: component.properties?.powerFactor || 1.0
      });
      setHasChanges(false);
    }
  }, [component]);

  // Handle property changes
  const handlePropertyChange = useCallback((key: keyof EditableProperties, value: any) => {
    setProperties(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  }, []);

  // Calculate power based on amperage and voltage
  const calculatedPower = useMemo(() => {
    const phases = properties.phase === '3' ? Math.sqrt(3) : 1;
    return (properties.amperage * properties.voltage * phases * properties.powerFactor / 1000).toFixed(2);
  }, [properties.amperage, properties.voltage, properties.phase, properties.powerFactor]);

  // Save changes
  const handleSave = useCallback(() => {
    if (component) {
      updateComponent(component.id, {
        name: properties.name,
        properties: {
          ...component.properties,
          ...properties,
          calculatedPower: parseFloat(calculatedPower)
        }
      });
      setHasChanges(false);
    }
  }, [component, properties, calculatedPower, updateComponent]);

  // Reset changes
  const handleReset = useCallback(() => {
    if (component) {
      setProperties({
        name: component.name || '',
        amperage: component.properties?.amperage || 20,
        voltage: component.properties?.voltage || 240,
        model: component.properties?.model || '',
        manufacturer: component.properties?.manufacturer || '',
        rating: component.properties?.rating || '20A',
        circuitNumber: component.properties?.circuitNumber || '',
        description: component.properties?.description || '',
        necReference: component.properties?.necReference || '',
        phase: component.properties?.phase || '1',
        poles: component.properties?.poles || 2,
        wireSize: component.properties?.wireSize || '12 AWG',
        wireType: component.properties?.wireType || 'THWN',
        wireLength: component.properties?.wireLength || 50,
        conduitType: component.properties?.conduitType || 'EMT',
        isGroundFaultProtected: component.properties?.isGroundFaultProtected || false,
        isArcFaultProtected: component.properties?.isArcFaultProtected || false,
        isSurgeProtected: component.properties?.isSurgeProtected || false,
        continuousLoad: component.properties?.continuousLoad || false,
        loadType: component.properties?.loadType || 'resistive',
        efficiency: component.properties?.efficiency || 100,
        powerFactor: component.properties?.powerFactor || 1.0
      });
      setHasChanges(false);
    }
  }, [component]);

  if (!isOpen || !component) {
    return null;
  }

  return (
    <div 
      className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-50 min-w-96 max-w-2xl"
      style={{
        left: position?.x || '50%',
        top: position?.y || '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)',
        maxHeight: '80vh',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Component Properties</h3>
          {hasChanges && (
            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded">
              Unsaved Changes
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            title="Reset Changes"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <Save className="h-4 w-4 inline mr-1" />
            Save
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'basic', label: 'Basic', icon: Info },
          { id: 'electrical', label: 'Electrical', icon: Zap },
          { id: 'physical', label: 'Physical', icon: Settings },
          { id: 'protection', label: 'Protection', icon: Settings }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto max-h-96">
        {activeTab === 'electrical' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amperage (A)</label>
                <input
                  type="number"
                  value={properties.amperage}
                  onChange={(e) => handlePropertyChange('amperage', parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voltage (V)</label>
                <select
                  value={properties.voltage}
                  onChange={(e) => handlePropertyChange('voltage', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={120}>120V</option>
                  <option value={240}>240V</option>
                  <option value={277}>277V</option>
                  <option value={480}>480V</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <select
                  value={properties.phase}
                  onChange={(e) => handlePropertyChange('phase', e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">Single Phase</option>
                  <option value="3">Three Phase</option>
                </select>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900">Calculated Power</div>
              <div className="text-lg font-bold text-blue-700">{calculatedPower} kW</div>
              <div className="text-xs text-blue-600">
                {properties.amperage}A × {properties.voltage}V × {properties.phase === '3' ? '√3' : '1'} × {properties.powerFactor} PF
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentPropertiesEditor;