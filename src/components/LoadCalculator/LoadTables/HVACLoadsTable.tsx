import React from 'react';
import { Plus } from 'lucide-react';
import { useLoadCalculator } from '../../../hooks/useLoadCalculator';

export const HVACLoadsTable: React.FC = () => {
  const { state, dispatch } = useLoadCalculator();
  const { hvacLoads } = state.loads;

  const updateLoad = (id: number, field: string, value: any) => {
    let processedValue = value;
    
    if (['quantity', 'amps', 'volts', 'va', 'hp'].includes(field)) {
      processedValue = parseFloat(value) || 0;
    }
    
    const updatedLoad = { [field]: processedValue };
    
    if (field === 'quantity' || field === 'amps' || field === 'volts') {
      const load = hvacLoads.find(l => l.id === id);
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
        type: 'UPDATE_HVAC_LOAD',
        payload: { id, field: updateField as any, value: updateValue }
      });
    });
  };

  const addLoad = () => {
    const newId = Math.max(...hvacLoads.map(l => l.id), 0) + 1;
    dispatch({
      type: 'ADD_LOAD',
      payload: {
        category: 'hvac',
        id: newId,
        name: 'Custom HVAC Load',
        quantity: 0,
        amps: 0,
        volts: 240,
        va: 0,
        total: 0,
        type: 'other' as const,
        critical: false,
        circuit: ''
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">HVAC Equipment</h3>
        <button
          onClick={addLoad}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add HVAC Load
        </button>
      </div>

      <div className="overflow-x-auto" style={{ height: 'auto', maxHeight: 'none' }}>
      <table className="min-w-full divide-y divide-gray-200 table-fixed" style={{ height: 'auto' }}>
        <thead className="bg-gray-50">
          <tr>
            <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              HVAC Equipment
            </th>
            <th className="w-16 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Qty
            </th>
            <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amps
            </th>
            <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Volts
            </th>
            <th className="w-24 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              VA
            </th>
            <th className="w-28 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total VA
            </th>
            <th className="w-32 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="w-20 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              HP
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {hvacLoads.map((load) => (
            <tr key={load.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={load.name || ''}
                  onChange={(e) => updateLoad(load.id, 'name', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="HVAC equipment description"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  value={load.quantity || 0}
                  onChange={(e) => updateLoad(load.id, 'quantity', e.target.value)}
                  className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  min="0"
                />
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  value={load.amps || 0}
                  onChange={(e) => updateLoad(load.id, 'amps', e.target.value)}
                  className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  min="0"
                  step="0.1"
                />
              </td>
              <td className="px-4 py-3">
                <select
                  value={load.volts || 240}
                  onChange={(e) => updateLoad(load.id, 'volts', e.target.value)}
                  className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value={120}>120</option>
                  <option value={240}>240</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-mono text-gray-700">
                  {load.va?.toLocaleString() || '0'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-mono font-medium text-gray-900">
                  {load.total?.toLocaleString() || '0'}
                </span>
              </td>
              <td className="px-4 py-3">
                <select
                  value={load.type || 'hvac'}
                  onChange={(e) => updateLoad(load.id, 'type', e.target.value)}
                  className="w-32 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="hvac">AC/Heat Pump</option>
                  <option value="resistance_heat">Electric Heat</option>
                  <option value="motor">Motor</option>
                  <option value="other">Other</option>
                </select>
              </td>
              <td className="px-4 py-3">
                <input
                  type="number"
                  value={load.hp || 0}
                  onChange={(e) => updateLoad(load.id, 'hp', e.target.value)}
                  className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  min="0"
                  step="0.25"
                  placeholder="HP"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">HVAC Load Guidelines</h4>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Air conditioning and heat pump loads must include compressor and fan motor loads</li>
          <li>• Electric heating loads are typically calculated at 100% demand factor</li>
          <li>• Motor loads require 125% factor for the largest motor (NEC 430.24)</li>
          <li>• Only the larger of heating or cooling loads is used in calculations</li>
          <li>• Continuously operating equipment (&gt;3 hours) requires 125% factor</li>
        </ul>
      </div>
    </div>
  );
};