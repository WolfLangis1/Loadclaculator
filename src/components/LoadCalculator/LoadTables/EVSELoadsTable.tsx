import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useLoadCalculator } from '../../../hooks/useLoadCalculator';

export const EVSELoadsTable: React.FC = () => {
  const { state, dispatch, updateSettings } = useLoadCalculator();
  const { evseLoads } = state.loads;
  
  const activeEvseCount = evseLoads.filter(load => load.quantity > 0).length;

  const updateLoad = (id: number, field: string, value: any) => {
    let processedValue = value;
    
    if (['quantity', 'amps', 'volts', 'va'].includes(field)) {
      processedValue = parseFloat(value) || 0;
    }
    
    const updatedLoad = { [field]: processedValue };
    
    if (field === 'quantity' || field === 'amps' || field === 'volts') {
      const load = evseLoads.find(l => l.id === id);
      if (load) {
        const qty = field === 'quantity' ? processedValue : load.quantity;
        const amps = field === 'amps' ? processedValue : load.amps;
        const volts = field === 'volts' ? processedValue : load.volts;
        
        updatedLoad.va = amps * volts;
        updatedLoad.total = updatedLoad.va * qty;
      }
    }
    
    Object.entries(updatedLoad).forEach(([updateField, updateValue]) => {
      dispatch({
        type: 'UPDATE_EVSE_LOAD',
        payload: { id, field: updateField as any, value: updateValue }
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* EMS Settings */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-3">Energy Management System (EMS)</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="use-ems"
              checked={state.useEMS}
              onChange={(e) => updateSettings({ useEMS: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="use-ems" className="text-sm text-blue-700">
              Use Energy Management System (NEC 750.30)
            </label>
          </div>
          
          {state.useEMS && (
            <div className="flex items-center gap-3">
              <label htmlFor="ems-max-load" className="text-sm text-blue-700 whitespace-nowrap">
                EMS Max Load:
              </label>
              <input
                id="ems-max-load"
                type="number"
                value={state.emsMaxLoad}
                onChange={(e) => updateSettings({ emsMaxLoad: parseFloat(e.target.value) || 0 })}
                className="w-24 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                min="0"
                step="1"
              />
              <span className="text-sm text-blue-700">A</span>
            </div>
          )}
        </div>
      </div>

      {/* Warning for multiple EVSE without EMS */}
      {activeEvseCount > 1 && !state.useEMS && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Multiple EVSE Warning</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Multiple EVSEs without EMS require full capacity calculation per NEC 625.42. 
                Consider enabling EMS to allow load management and reduce electrical demand.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* EVSE Loads Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                EV Charging Equipment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amps
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Volts
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                VA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total VA
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Continuous
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {evseLoads.map((load) => (
              <tr key={load.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={load.name}
                    onChange={(e) => updateLoad(load.id, 'name', e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    placeholder="EVSE description"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={load.quantity}
                    onChange={(e) => updateLoad(load.id, 'quantity', e.target.value)}
                    className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    min="0"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    value={load.amps}
                    onChange={(e) => updateLoad(load.id, 'amps', e.target.value)}
                    className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    min="0"
                    step="1"
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={load.volts}
                    onChange={(e) => updateLoad(load.id, 'volts', e.target.value)}
                    className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  >
                    <option value={240}>240</option>
                    <option value={120}>120</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-gray-700">
                    {load.va.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-mono font-medium text-gray-900">
                    {load.total.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={load.continuous}
                    onChange={(e) => updateLoad(load.id, 'continuous', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">EVSE Load Requirements (NEC Article 625)</h4>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• EVSE loads are considered continuous and require 125% calculation factor</li>
          <li>• Level 2 chargers typically operate at 240V with amperage from 16A to 80A</li>
          <li>• Energy Management Systems can reduce total electrical demand</li>
          <li>• EMS must comply with NEC 750.30 and UL 2089 standards</li>
          <li>• Multiple EVSE without EMS calculate at full nameplate rating</li>
        </ul>
      </div>
    </div>
  );
};