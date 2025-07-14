/**
 * Wire Sizing Panel Component
 * 
 * Displays intelligent wire sizing calculations and allows manual adjustments
 * for SLD connections with real-time NEC compliance checking
 */

import React, { useState, useMemo } from 'react';
import { 
  Cable, 
  Calculator, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Settings,
  Zap,
  Ruler,
  Thermometer,
  Shield
} from 'lucide-react';
import { IntelligentWireSizingService } from '../../services/intelligentWireSizingService';
import type { SLDConnection } from '../../types/sld';

interface WireSizingPanelProps {
  connection: SLDConnection;
  onWireSizeChange: (connectionId: string, wireData: {
    wireGauge: string;
    conduitSize: string;
    metadata: any;
  }) => void;
  className?: string;
}

interface WireSizingInputs {
  amperage: number;
  voltage: number;
  length: number;
  ambientTemp: number;
  installationMethod: 'conduit' | 'cable_tray' | 'direct_burial' | 'free_air';
  conductorCount: number;
  conduitFill: number;
  maxVoltageDrop: number;
  wireType: 'copper' | 'aluminum';
  temperatureRating: '60C' | '75C' | '90C';
  continuous: boolean;
}

export const WireSizingPanel: React.FC<WireSizingPanelProps> = ({
  connection,
  onWireSizeChange,
  className = ''
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [inputs, setInputs] = useState<WireSizingInputs>({
    amperage: parseFloat(connection.label?.replace('A', '') || '20'),
    voltage: connection.voltage || 240,
    length: 50, // Default to 50 feet
    ambientTemp: 30,
    installationMethod: 'conduit',
    conductorCount: 3,
    conduitFill: 40,
    maxVoltageDrop: 3,
    wireType: 'copper',
    temperatureRating: '75C',
    continuous: false
  });

  // Calculate wire sizing options
  const wireSizingResults = useMemo(() => {
    try {
      return IntelligentWireSizingService.getWireSizingOptions(inputs);
    } catch (error) {
      console.error('Wire sizing calculation error:', error);
      return null;
    }
  }, [inputs]);

  const handleInputChange = (field: keyof WireSizingInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyWireSize = (result: any) => {
    const conduitSize = getConduitSize(result.recommendedAwg);
    
    onWireSizeChange(connection.id, {
      wireGauge: `${result.recommendedAwg} AWG`,
      conduitSize,
      metadata: {
        ...connection.metadata,
        voltageDrop: `${result.voltageDropPercent.toFixed(1)}%`,
        ampacity: `${result.ampacity}A`,
        necCompliant: result.necCompliance.compliant,
        autoSized: true,
        calculationInputs: inputs,
        calculationResults: result
      }
    });
  };

  const getConduitSize = (awg: string): string => {
    const wireSize = parseInt(awg.replace(/[^\d]/g, ''));
    if (isNaN(wireSize)) {
      if (awg.includes('4/0')) return '2"';
      if (awg.includes('3/0')) return '1.5"';
      if (awg.includes('2/0')) return '1.25"';
      if (awg.includes('1/0')) return '1"';
      return '0.75"';
    }
    if (wireSize <= 12) return '0.5"';
    if (wireSize <= 8) return '0.75"';
    if (wireSize <= 4) return '1"';
    if (wireSize <= 2) return '1.25"';
    return '1.5"';
  };

  const getComplianceIcon = (compliant: boolean) => {
    return compliant ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-red-600" />
    );
  };

  const getComplianceColor = (compliant: boolean) => {
    return compliant ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  };

  if (!wireSizingResults) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span className="font-medium">Wire Sizing Error</span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          Unable to calculate wire sizing. Please check input parameters.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cable className="h-5 w-5" />
            <span className="font-medium">Intelligent Wire Sizing</span>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 rounded text-sm hover:bg-opacity-30 transition-colors"
          >
            <Settings className="h-3 w-3" />
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Amperage (A)
            </label>
            <input
              type="number"
              value={inputs.amperage}
              onChange={(e) => handleInputChange('amperage', Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Length (ft)
            </label>
            <input
              type="number"
              value={inputs.length}
              onChange={(e) => handleInputChange('length', Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Wire Type
            </label>
            <select
              value={inputs.wireType}
              onChange={(e) => handleInputChange('wireType', e.target.value)}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="copper">Copper</option>
              <option value="aluminum">Aluminum</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Max VD (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={inputs.maxVoltageDrop}
              onChange={(e) => handleInputChange('maxVoltageDrop', Number(e.target.value))}
              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900">Advanced Parameters</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Voltage (V)
                </label>
                <input
                  type="number"
                  value={inputs.voltage}
                  onChange={(e) => handleInputChange('voltage', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ambient Temp (°C)
                </label>
                <input
                  type="number"
                  value={inputs.ambientTemp}
                  onChange={(e) => handleInputChange('ambientTemp', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Installation Method
                </label>
                <select
                  value={inputs.installationMethod}
                  onChange={(e) => handleInputChange('installationMethod', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="conduit">Conduit</option>
                  <option value="cable_tray">Cable Tray</option>
                  <option value="direct_burial">Direct Burial</option>
                  <option value="free_air">Free Air</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Temperature Rating
                </label>
                <select
                  value={inputs.temperatureRating}
                  onChange={(e) => handleInputChange('temperatureRating', e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="60C">60°C</option>
                  <option value="75C">75°C</option>
                  <option value="90C">90°C</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Conductor Count
                </label>
                <input
                  type="number"
                  value={inputs.conductorCount}
                  onChange={(e) => handleInputChange('conductorCount', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Conduit Fill (%)
                </label>
                <input
                  type="number"
                  value={inputs.conduitFill}
                  onChange={(e) => handleInputChange('conduitFill', Number(e.target.value))}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={inputs.continuous}
                onChange={(e) => handleInputChange('continuous', e.target.checked)}
                className="rounded"
              />
              Continuous Load (125% factor)
            </label>
          </div>
        )}

        {/* Results */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Wire Sizing Results
          </h4>

          {/* Copper Option */}
          {wireSizingResults.copper && (
            <div className={`p-3 rounded-lg border ${getComplianceColor(wireSizingResults.copper.necCompliance.compliant)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                  <span className="font-medium text-gray-900">Copper</span>
                  {getComplianceIcon(wireSizingResults.copper.necCompliance.compliant)}
                </div>
                <button
                  onClick={() => handleApplyWireSize(wireSizingResults.copper)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Cable className="h-3 w-3 text-gray-500" />
                  <span className="font-medium">{wireSizingResults.copper.recommendedAwg} AWG</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-gray-500" />
                  <span>{wireSizingResults.copper.ampacity}A</span>
                </div>
                <div className="flex items-center gap-1">
                  <Ruler className="h-3 w-3 text-gray-500" />
                  <span>{wireSizingResults.copper.voltageDropPercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-gray-500" />
                  <span>{Math.round(wireSizingResults.copper.deratingFactor * 100)}%</span>
                </div>
              </div>

              {wireSizingResults.copper.necCompliance.violations.length > 0 && (
                <div className="mt-2 space-y-1">
                  {wireSizingResults.copper.necCompliance.violations.map((violation, index) => (
                    <div key={index} className="flex items-start gap-1 text-xs text-red-700">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{violation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aluminum Option */}
          {wireSizingResults.aluminum && (
            <div className={`p-3 rounded-lg border ${getComplianceColor(wireSizingResults.aluminum.necCompliance.compliant)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                  <span className="font-medium text-gray-900">Aluminum</span>
                  {getComplianceIcon(wireSizingResults.aluminum.necCompliance.compliant)}
                </div>
                <button
                  onClick={() => handleApplyWireSize(wireSizingResults.aluminum)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <Cable className="h-3 w-3 text-gray-500" />
                  <span className="font-medium">{wireSizingResults.aluminum.recommendedAwg} AWG</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-gray-500" />
                  <span>{wireSizingResults.aluminum.ampacity}A</span>
                </div>
                <div className="flex items-center gap-1">
                  <Ruler className="h-3 w-3 text-gray-500" />
                  <span>{wireSizingResults.aluminum.voltageDropPercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Thermometer className="h-3 w-3 text-gray-500" />
                  <span>{Math.round(wireSizingResults.aluminum.deratingFactor * 100)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Recommended Option */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Recommended</span>
            </div>
            <div className="text-sm text-blue-800">
              <p>
                <span className="font-medium">{wireSizingResults.recommended.recommendedAwg} AWG</span> 
                {` ${inputs.wireType} - ${wireSizingResults.recommended.ampacity}A @ ${inputs.temperatureRating}`}
              </p>
              <p className="text-xs mt-1">
                Voltage drop: {wireSizingResults.recommended.voltageDropPercent.toFixed(1)}% 
                {wireSizingResults.recommended.necCompliance.compliant ? ' ✓ NEC Compliant' : ' ⚠ NEC Violations'}
              </p>
            </div>
            
            <button
              onClick={() => handleApplyWireSize(wireSizingResults.recommended)}
              className="mt-2 w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Apply Recommended Size
            </button>
          </div>
        </div>

        {/* Cost Analysis */}
        {wireSizingResults.recommended.costAnalysis && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <h5 className="text-sm font-medium text-gray-900 mb-2">Cost Analysis</h5>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Copper Cost:</span>
                <span>${wireSizingResults.recommended.costAnalysis.copperCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Aluminum Cost:</span>
                <span>${wireSizingResults.recommended.costAnalysis.aluminumCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Recommended:</span>
                <span className="capitalize">{wireSizingResults.recommended.costAnalysis.recommendation}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WireSizingPanel;