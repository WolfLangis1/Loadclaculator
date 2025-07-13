import React from 'react';
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              HVAC Equipment
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
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                  value={load.name}
                  onChange={(e) => updateLoad(load.id, 'name', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="HVAC equipment description"
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
                  step="0.1"
                />
              </td>
              <td className="px-4 py-3">
                <select
                  value={load.volts}
                  onChange={(e) => updateLoad(load.id, 'volts', e.target.value)}
                  className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value={120}>120</option>
                  <option value={240}>240</option>
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
                  value={load.hp || ''}
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