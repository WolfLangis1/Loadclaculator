import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useLoadData } from '../../../context/LoadDataContext';
import { useCalculations } from '../../../context/CalculationContext';
import { useProjectSettings } from '../../../context/ProjectSettingsContext';
import { TooltipWrapper } from '../../UI/TooltipWrapper';

export const SolarBatteryTable: React.FC = () => {
  const { loads, updateLoad: updateLoadData, addLoad, removeLoad } = useLoadData();
  const { calculations } = useCalculations();
  const { settings } = useProjectSettings();
  const { solarBatteryLoads } = loads;
  // Show all loads in a single table
  const allLoads = (solarBatteryLoads || []);

  const updateLoad = (id: number, field: string, value: any) => {
    let processedValue = value;
    
    if (['kw', 'inverterAmps', 'breaker', 'quantity'].includes(field)) {
      // Only parse non-empty strings, keep empty strings as 0
      processedValue = value === '' || value === null || value === undefined ? 0 : parseFloat(value) || 0;
    }
    
    const updatedLoad = { [field]: processedValue };
    const load = solarBatteryLoads.find(l => l.id === id);
    if (!load) return;
    
    const volts = (field === 'volts' ? processedValue : load.volts) || 240;
    
    // Bidirectional calculations
    if (field === 'kw') {
      // KW → Inverter Amps → Breaker Size
      const inverterAmps = (processedValue * 1000) / volts;
      const recommendedBreaker = calculateRecommendedBreaker(inverterAmps);
      
      updatedLoad.inverterAmps = inverterAmps;
      updatedLoad.amps = inverterAmps;
      updatedLoad.va = inverterAmps * volts;
      updatedLoad.total = updatedLoad.va;
      updatedLoad.breaker = recommendedBreaker;
      updatedLoad.quantity = processedValue > 0 ? 1 : 0;
    } else if (field === 'breaker') {
      // Breaker Size → Inverter Amps → KW
      if (processedValue > 0) {
        // Calculate max inverter amps from breaker (80% continuous load factor)
        const maxInverterAmps = processedValue * 0.8;
        const calculatedKW = (maxInverterAmps * volts) / 1000;
        
        updatedLoad.inverterAmps = maxInverterAmps;
        updatedLoad.amps = maxInverterAmps;
        updatedLoad.kw = calculatedKW;
        updatedLoad.va = maxInverterAmps * volts;
        updatedLoad.total = updatedLoad.va;
        updatedLoad.quantity = calculatedKW > 0 ? 1 : 0;
      }
    } else if (field === 'volts' && processedValue > 0) {
      // Recalculate when voltage changes
      if (load.kw > 0) {
        const inverterAmps = (load.kw * 1000) / processedValue;
        const recommendedBreaker = calculateRecommendedBreaker(inverterAmps);
        
        updatedLoad.inverterAmps = inverterAmps;
        updatedLoad.amps = inverterAmps;
        updatedLoad.va = inverterAmps * processedValue;
        updatedLoad.total = updatedLoad.va;
        updatedLoad.breaker = recommendedBreaker;
      }
    }
    
    Object.entries(updatedLoad).forEach(([updateField, updateValue]) => {
      updateLoadData('solar', id, updateField, updateValue);
    });
  };

  // Calculate recommended breaker size based on NEC requirements
  const calculateRecommendedBreaker = (inverterAmps: number): number => {
    if (inverterAmps === 0) return 0;
    
    // NEC 705.12(D)(2)(3): Breaker rating should be 125% of inverter maximum continuous output
    const requiredBreaker = inverterAmps * 1.25;
    
    // Standard breaker sizes
    const standardBreakers = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200];
    
    // Find the next higher standard breaker size
    return standardBreakers.find(breaker => breaker >= requiredBreaker) || Math.ceil(requiredBreaker / 5) * 5;
  };

  const addSolarBatteryLoad = () => {
    const newId = Math.max(...solarBatteryLoads.map(l => l.id), 0) + 1;
    const newLoad = {
      id: newId,
      name: 'Custom Solar/Battery System',
      kw: 0,
      inverterAmps: 0,
      volts: 240,
      breaker: 0,
      type: 'solar' as const,
      location: 'backfeed' as const,
      amps: 0,
      va: 0,
      total: 0,
      quantity: 0,
      circuit: ''
    };
    addLoad('solar', newLoad);
  };

  const removeSolarBatteryLoad = (id: number) => {
    removeLoad('solar', id);
  };

  const busbarRating = settings.panelDetails.busRating || settings.mainBreaker;
  const maxAllowableBackfeed = (busbarRating * 1.2) - settings.mainBreaker;

  return (
    <div className="space-y-6">
      {/* 120% Rule Information */}
      <div className={`rounded-lg p-4 ${calculations.interconnectionCompliant ? 'bg-green-50' : 'bg-red-50'}`}>
        <h3 className={`text-sm font-medium mb-2 ${calculations.interconnectionCompliant ? 'text-green-800' : 'text-red-800'}`}>
          Solar Interconnection Analysis (NEC 705.12(B)(3)(2))
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className={calculations.interconnectionCompliant ? 'text-green-700' : 'text-red-700'}>
              Main Breaker: {settings.mainBreaker}A
            </span>
          </div>
          <div>
            <span className={calculations.interconnectionCompliant ? 'text-green-700' : 'text-red-700'}>
              Busbar Rating: {busbarRating}A
            </span>
          </div>
          <div>
            <span className={calculations.interconnectionCompliant ? 'text-green-700' : 'text-red-700'}>
              Max Backfeed: {maxAllowableBackfeed.toFixed(1)}A
            </span>
          </div>
        </div>
        <div className="mt-2">
          <span className={`font-medium ${calculations.interconnectionCompliant ? 'text-green-800' : 'text-red-800'}`}>
            Current Interconnection: {calculations.totalInterconnectionAmps?.toFixed(1) || '0.0'}A
            {calculations.interconnectionCompliant ? ' ✓ Compliant' : ' ✗ Exceeds Limit'}
          </span>
        </div>
      </div>

      {/* Solar/Battery Loads Table */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Solar/Battery Systems</h3>
        <button
          onClick={addSolarBatteryLoad}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Solar/Battery
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                System Description
              </th>
              <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <TooltipWrapper term="solar_battery_type">Type</TooltipWrapper>
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <TooltipWrapper term="solar capacity">
                  <span className="text-blue-600">Capacity (kW)</span>
                  <span className="block text-xs normal-case text-blue-500">Enter here ↓</span>
                </TooltipWrapper>
              </th>
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <TooltipWrapper term="inverter amps">
                  <span className="text-gray-600">Inverter Amps</span>
                  <span className="block text-xs normal-case text-gray-400">Auto-calculated</span>
                </TooltipWrapper>
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="text-green-600">Breaker Size</span>
                <span className="block text-xs normal-case text-green-500">Or enter here ↓</span>
              </th>
              <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <TooltipWrapper term="connection_type">Connection Type</TooltipWrapper>
              </th>
              <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volts
              </th>
              <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sr-only">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allLoads.map((load) => (
              <tr key={load.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={load.name || ''}
                    onChange={(e) => updateLoad(load.id, 'name', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="System description"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={load.type || 'solar'}
                    onChange={(e) => updateLoad(load.id, 'type', e.target.value)}
                    className="w-28 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    <option value="solar">Solar PV</option>
                    <option value="battery">Battery</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={load.kw || ''}
                    onChange={(e) => updateLoad(load.id, 'kw', e.target.value)}
                    className="w-24 text-center border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-blue-50"
                    min="0"
                    step="0.1"
                    placeholder="kW"
                    title="Enter system capacity in kW - will auto-calculate inverter amps and breaker size"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="w-28 text-center p-2 bg-gray-100 rounded-md border border-gray-300">
                    <span className="text-sm font-mono text-gray-700">
                      {load.inverterAmps?.toFixed(1) || '0.0'}A
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={load.breaker || ''}
                    onChange={(e) => updateLoad(load.id, 'breaker', e.target.value)}
                    className="w-20 text-center border-green-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 text-sm bg-green-50"
                    min="0"
                    step="5"
                    placeholder="A"
                    title="Enter breaker size in amps - will auto-calculate kW and inverter amps"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={load.location || 'backfeed'}
                    onChange={(e) => updateLoad(load.id, 'location', e.target.value)}
                    className="w-32 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    title="Choose connection type - affects NEC 705.12 compliance"
                  >
                    <option value="backfeed" title="Most common: breaker in main panel">Backfeed</option>
                    <option value="supply_side" title="Before main breaker: no 120% rule limit">Supply Side</option>
                    <option value="load_side" title="After main breaker: subject to 120% rule">Load Side</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={load.volts || 240}
                    onChange={(e) => updateLoad(load.id, 'volts', e.target.value)}
                    className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    <option value={240}>240</option>
                    <option value={120}>120</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => removeSolarBatteryLoad(load.id)}
                    className="text-red-600 hover:text-red-900 focus:outline-none"
                    aria-label="Remove solar/battery load"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
      {/* Best Practices Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center">
          <span className="mr-2">💡</span>
          Recommended Best Practices for Most Accurate Results
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="font-medium text-blue-700">Input Method (Choose One):</div>
            <div className="bg-blue-100 rounded p-2">
              <strong className="text-blue-800">Option 1 - From System Size:</strong>
              <br />1. Enter system capacity in <span className="text-blue-600 font-mono">kW</span>
              <br />2. System automatically calculates inverter amps and breaker size per NEC 705.12(D)
            </div>
            <div className="bg-green-100 rounded p-2">
              <strong className="text-green-800">Option 2 - From Breaker Size:</strong>
              <br />1. Enter available <span className="text-green-600 font-mono">breaker size</span>
              <br />2. System calculates maximum allowable kW for that breaker
            </div>
          </div>
          <div className="space-y-2">
            <div className="font-medium text-blue-700">Calculation Details:</div>
            <ul className="text-blue-600 space-y-1 text-xs">
              <li>• <strong>Inverter Amps:</strong> kW × 1000 ÷ Volts</li>
              <li>• <strong>Breaker Size:</strong> Inverter Amps × 1.25 (NEC 705.12)</li>
              <li>• <strong>Max kW from Breaker:</strong> (Breaker × 0.8) × Volts ÷ 1000</li>
              <li>• Uses standard breaker sizes: 15A, 20A, 25A, 30A, etc.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-purple-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-purple-800 mb-2">
          Solar & Battery System Requirements (NEC Article 705)
        </h4>
        <ul className="text-xs text-purple-700 space-y-1">
          <li>• Solar inverter output current must not exceed inverter nameplate rating</li>
          <li>• Breaker size typically 125% of inverter maximum output current (NEC 705.12(D)(2)(3))</li>
          <li>• Backfeed breakers must comply with 120% rule: (Busbar × 1.2) - Main Breaker</li>
          <li>• Supply-side connections are not subject to 120% rule limitations</li>
          <li>• Battery systems must include rapid shutdown and energy storage labeling</li>
          <li>• Grounding and bonding per NEC 705.50 and local AHJ requirements</li>
        </ul>
      </div>
    </div>
  );
};