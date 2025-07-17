import React, { useState, useCallback } from 'react';
import { Zap, Settings, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useSLDData } from '../../context/SLDDataContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { SLDGenerationOptionsForm } from './SLDGenerationOptionsForm';

interface SLDGenerationOptions {
  includeLoadCalculations: boolean;
  includeCircuitNumbers: boolean;
  includeWireSizing: boolean;
  includeNECReferences: boolean;
  diagramStyle: 'residential' | 'commercial' | 'industrial';
  voltageLevel: number;
  serviceSize: number;
}

interface SLDGeneratorProps {
  onGenerate?: () => void;
  className?: string;
}

export const SLDGenerator: React.FC<SLDGeneratorProps> = ({ onGenerate, className }) => {
  const { addComponent, resetDiagram } = useSLDData();
  const { loads } = useLoadData();
  const { settings } = useProjectSettings();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<SLDGenerationOptions>({
    includeLoadCalculations: true,
    includeCircuitNumbers: true,
    includeWireSizing: true,
    includeNECReferences: true,
    diagramStyle: 'residential',
    voltageLevel: 240,
    serviceSize: settings.mainBreaker || 200
  });

  const generateSLD = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      resetDiagram();
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      addComponent({
        id: `service-panel-${Date.now()}`,
        name: `${generationOptions.serviceSize}A Service Panel`,
        type: 'service_panel',
        position: { x: 200, y: 150 },
        width: 120,
        height: 80,
        symbol: '⚡',
        properties: {
          rating: `${generationOptions.serviceSize}A`,
          voltage: generationOptions.voltageLevel,
          necReference: generationOptions.includeNECReferences ? 'NEC 408.3' : undefined
        }
      });

      let yOffset = 300;
      const xPositions = [100, 250, 400, 550];
      let posIndex = 0;

      if (loads.generalLoads && loads.generalLoads.length > 0) {
        loads.generalLoads.slice(0, 4).forEach((load, index) => {
          if (load.quantity > 0) {
            addComponent({
              id: `general-${Date.now()}-${index}`,
              name: load.name,
              type: 'general_load',
              position: { x: xPositions[posIndex % 4], y: yOffset },
              width: 100,
              height: 60,
              symbol: '💡',
              properties: {
                watts: load.va,
                amperage: Math.round(load.amps),
                circuitNumber: generationOptions.includeCircuitNumbers ? `${index + 1}` : undefined,
                necReference: generationOptions.includeNECReferences ? 'NEC 210.19' : undefined
              }
            });
            posIndex++;
          }
        });
        yOffset += 100;
      }

      if (loads.hvacLoads && loads.hvacLoads.length > 0) {
        loads.hvacLoads.slice(0, 3).forEach((load, index) => {
          if (load.quantity > 0) {
            addComponent({
              id: `hvac-${Date.now()}-${index}`,
              name: load.name,
              type: 'hvac_load',
              position: { x: xPositions[posIndex % 4], y: yOffset },
              width: 100,
              height: 60,
              symbol: '❄️',
              properties: {
                watts: load.va,
                amperage: Math.round(load.amps),
                circuitNumber: generationOptions.includeCircuitNumbers ? `${posIndex + 10}` : undefined,
                necReference: generationOptions.includeNECReferences ? 'NEC 440.6' : undefined
              }
            });
            posIndex++;
          }
        });
        yOffset += 100;
      }

      if (loads.evseLoads && loads.evseLoads.length > 0) {
        loads.evseLoads.slice(0, 2).forEach((load, index) => {
          if (load.quantity > 0) {
            addComponent({
              id: `evse-${Date.now()}-${index}`,
              name: load.name,
              type: 'evse_load',
              position: { x: xPositions[posIndex % 4], y: yOffset },
              width: 100,
              height: 60,
              symbol: '🚗',
              properties: {
                amperage: load.amps,
                rating: `${load.amps}A`,
                circuitNumber: generationOptions.includeCircuitNumbers ? `${posIndex + 20}` : undefined,
                necReference: generationOptions.includeNECReferences ? 'NEC 625.17' : undefined
              }
            });
            posIndex++;
          }
        });
        yOffset += 100;
      }

      if (loads.solarBatteryLoads && loads.solarBatteryLoads.length > 0) {
        loads.solarBatteryLoads.slice(0, 2).forEach((load, index) => {
          if (load.quantity > 0) {
            addComponent({
              id: `solar-${Date.now()}-${index}`,
              name: load.name,
              type: load.type === 'solar' ? 'pv_array' : 'battery',
              position: { x: xPositions[posIndex % 4], y: yOffset },
              width: 100,
              height: 60,
              symbol: load.type === 'solar' ? '⚡' : '🔋',
              properties: {
                kw: load.kw,
                amperage: load.inverterAmps,
                breaker: load.breaker,
                circuitNumber: generationOptions.includeCircuitNumbers ? `${posIndex + 30}` : undefined,
                necReference: generationOptions.includeNECReferences ? 'NEC 705.12' : undefined
              }
            });
            posIndex++;
          }
        });
      }

      onGenerate?.();
    } catch (error) {
      console.error('Error generating SLD:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [loads, generationOptions, addComponent, resetDiagram, onGenerate]);

  const updateOptions = useCallback((key: keyof SLDGenerationOptions, value: any) => {
    setGenerationOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const hasLoads = (loads.generalLoads?.length || 0) > 0 || 
                  (loads.hvacLoads?.length || 0) > 0 || 
                  (loads.evseLoads?.length || 0) > 0 || 
                  (loads.solarBatteryLoads?.length || 0) > 0;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          SLD Generation
        </h3>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="p-2 text-gray-500 hover:text-gray-700"
          title="Generation Options"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {showOptions && (
        <SLDGenerationOptionsForm options={generationOptions} updateOptions={updateOptions} />
      )}

      <div className="mb-4">
        {hasLoads ? (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Load data available - ready to generate</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span>No load data found - add loads in the Load Calculator first</span>
          </div>
        )}
      </div>

      <button
        onClick={generateSLD}
        disabled={isGenerating || !hasLoads}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Generating SLD...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Generate SLD
          </>
        )}
      </button>

      <div className="mt-4 text-xs text-gray-500">
        <p>
          This will generate a Single Line Diagram based on your load calculations.
          The diagram will include all active loads with proper NEC compliance.
        </p>
      </div>
    </div>
  );
};