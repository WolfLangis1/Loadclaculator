import React from 'react';

interface SLDGenerationOptions {
  includeLoadCalculations: boolean;
  includeCircuitNumbers: boolean;
  includeWireSizing: boolean;
  includeNECReferences: boolean;
  diagramStyle: 'residential' | 'commercial' | 'industrial';
  voltageLevel: number;
  serviceSize: number;
}

interface SLDGenerationOptionsFormProps {
  options: SLDGenerationOptions;
  updateOptions: (key: keyof SLDGenerationOptions, value: any) => void;
}

export const SLDGenerationOptionsForm: React.FC<SLDGenerationOptionsFormProps> = React.memo(
  ({ options, updateOptions }) => {
    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeLoadCalculations}
              onChange={(e) => updateOptions('includeLoadCalculations', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Load Calculations</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeCircuitNumbers}
              onChange={(e) => updateOptions('includeCircuitNumbers', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Circuit Numbers</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeWireSizing}
              onChange={(e) => updateOptions('includeWireSizing', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Wire Sizing</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.includeNECReferences}
              onChange={(e) => updateOptions('includeNECReferences', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">NEC References</span>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagram Style
            </label>
            <select
              value={options.diagramStyle}
              onChange={(e) => updateOptions('diagramStyle', e.target.value as any)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Voltage Level
            </label>
            <select
              value={options.voltageLevel}
              onChange={(e) => updateOptions('voltageLevel', parseInt(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value={120}>120V</option>
              <option value={240}>240V</option>
              <option value={480}>480V</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Size (A)
            </label>
            <input
              type="number"
              value={options.serviceSize}
              onChange={(e) => updateOptions('serviceSize', parseInt(e.target.value) || 200)}
              min="100"
              max="4000"
              step="100"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    );
  }
);
