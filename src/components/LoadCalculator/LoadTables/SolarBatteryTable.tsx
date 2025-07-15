import React, { useState } from 'react';
import { Plus, ChevronDown, ChevronUp, Settings, Trash2 } from 'lucide-react';
import { useLoadData } from '../../../context/LoadDataContext';
import { useCalculations } from '../../../context/CalculationContext';
import { useProjectSettings } from '../../../context/ProjectSettingsContext';
import { TooltipWrapper } from '../../UI/TooltipWrapper';

export const SolarBatteryTable: React.FC = () => {
  const { loads, updateLoad: updateLoadData, addLoad, removeLoad } = useLoadData();
  const { calculations } = useCalculations();
  const { settings } = useProjectSettings();
  const { solarBatteryLoads } = loads;
  const [showAdvancedLoads, setShowAdvancedLoads] = useState(false);
  
  // Split loads into basic (first 4) and advanced (rest)
  const basicLoads = solarBatteryLoads.slice(0, 4);
  const advancedLoads = solarBatteryLoads.slice(4);

  const updateLoad = (id: number, field: string, value: any) => {
    let processedValue = value;
    
    if (['kw', 'inverterAmps', 'breaker', 'quantity'].includes(field)) {
      processedValue = parseFloat(value) || 0;
    }
    
    const updatedLoad = { [field]: processedValue };
    
    // Auto-calculate inverter amps from kW
    if (field === 'kw') {
      const load = solarBatteryLoads.find(l => l.id === id);
      if (load) {
        // Calculate inverter amps: kW * 1000 / volts
        updatedLoad.inverterAmps = (processedValue * 1000) / (load.volts || 240);
        updatedLoad.amps = updatedLoad.inverterAmps;
        updatedLoad.va = updatedLoad.inverterAmps * (load.volts || 240);
        updatedLoad.total = updatedLoad.va;
        // Auto-set quantity to 1 when kW > 0, or 0 when kW = 0
        updatedLoad.quantity = processedValue > 0 ? 1 : 0;
      }
    }
    
    Object.entries(updatedLoad).forEach(([updateField, updateValue]) => {
      updateLoadData('solar', id, updateField, updateValue);
    });
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
                <TooltipWrapper term="solar capacity">Capacity (kW)</TooltipWrapper>
              </th>
              <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <TooltipWrapper term="inverter amps">Inverter Amps</TooltipWrapper>
              </th>
              <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Breaker Size
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
            {basicLoads.map((load) => (
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
                    value={load.kw || 0}
                    onChange={(e) => updateLoad(load.id, 'kw', e.target.value)}
                    className="w-24 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    min="0"
                    step="0.1"
                    placeholder="kW"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-gray-700">
                    {load.inverterAmps?.toFixed(1) || '0.0'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={load.breaker || 0}
                    onChange={(e) => updateLoad(load.id, 'breaker', e.target.value)}
                    className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    min="0"
                    step="5"
                    placeholder="A"
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

      {/* Advanced Solar/Battery Loads Section */}
      {advancedLoads.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowAdvancedLoads(!showAdvancedLoads)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Additional Solar/Battery Systems ({advancedLoads.length} items)
              </span>
            </div>
            {showAdvancedLoads ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>

          {showAdvancedLoads && (
            <div className="mt-3 overflow-x-auto">
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
                      <TooltipWrapper term="solar capacity">Capacity (kW)</TooltipWrapper>
                    </th>
                    <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <TooltipWrapper term="inverter amps">Inverter Amps</TooltipWrapper>
                    </th>
                    <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Breaker Size
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
                  {advancedLoads.map((load) => (
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
                          value={load.kw || 0}
                          onChange={(e) => updateLoad(load.id, 'kw', e.target.value)}
                          className="w-24 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          min="0"
                          step="0.1"
                          placeholder="kW"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-700">
                          {load.inverterAmps?.toFixed(1) || '0.0'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={load.breaker || 0}
                          onChange={(e) => updateLoad(load.id, 'breaker', e.target.value)}
                          className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          min="0"
                          step="5"
                          placeholder="A"
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
          )}
        </div>
      )}
      
      <div className="bg-purple-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-purple-800 mb-2">
          Solar & Battery System Requirements (NEC Article 705)
        </h4>
        <ul className="text-xs text-purple-700 space-y-1">
          <li>• Solar inverter output current must not exceed inverter nameplate rating</li>
          <li>• Breaker size typically 125% of inverter maximum output current</li>
          <li>• Backfeed breakers must comply with 120% rule: (Busbar × 1.2) - Main Breaker</li>
          <li>• Supply-side connections are not subject to 120% rule limitations</li>
          <li>• Battery systems must include rapid shutdown and energy storage labeling</li>
          <li>• Grounding and bonding per NEC 705.50 and local AHJ requirements</li>
        </ul>
      </div>
    </div>
  );
};