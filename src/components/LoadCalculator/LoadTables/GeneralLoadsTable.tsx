import React from 'react';
import { useLoadCalculator } from '../../../hooks/useLoadCalculator';
import { useLoadUpdater, useLoadValidation } from '../../../hooks/useLoadUpdater';

export const GeneralLoadsTable: React.FC = React.memo(() => {
  const { state, dispatch } = useLoadCalculator();
  const { generalLoads } = state.loads;
  const { updateLoadField } = useLoadUpdater('general');
  const { getValidationError } = useLoadValidation();

  const updateLoad = (id: number, field: string, value: any) => {
    let processedValue = value;
    
    // Handle numeric fields
    if (['quantity', 'amps', 'volts', 'va'].includes(field)) {
      processedValue = parseFloat(value) || 0;
    }
    
    // Auto-calculate dependent fields
    const updatedLoad = { [field]: processedValue };
    
    if (field === 'quantity' || field === 'amps' || field === 'volts') {
      const load = generalLoads.find(l => l.id === id);
      if (load) {
        const qty = field === 'quantity' ? processedValue : load.quantity;
        const amps = field === 'amps' ? processedValue : load.amps;
        const volts = field === 'volts' ? processedValue : load.volts;
        
        updatedLoad.va = amps * volts;
        updatedLoad.total = updatedLoad.va * qty;
      }
    }
    
    // Dispatch multiple updates if needed
    Object.entries(updatedLoad).forEach(([updateField, updateValue]) => {
      dispatch({
        type: 'UPDATE_GENERAL_LOAD',
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
              Load Description
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
              Critical
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {generalLoads.map((load) => (
            <tr key={load.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <input
                  type="text"
                  value={load.name}
                  onChange={(e) => updateLoad(load.id, 'name', e.target.value)}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  placeholder="Load description"
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
                  {load.va?.toLocaleString() || '0'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-mono font-medium text-gray-900">
                  {load.total?.toLocaleString() || '0'}
                </span>
              </td>
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={load.critical || false}
                  onChange={(e) => updateLoad(load.id, 'critical', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">General Loads Information</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• General lighting is calculated at 3 VA per square foot (NEC 220.12)</li>
          <li>• Small appliance circuits: 2 required @ 1500 VA each (NEC 220.52(A))</li>
          <li>• Laundry circuit: 1 required @ 1500 VA (NEC 220.52(B))</li>
          <li>• Bathroom circuit: 1 required @ 1500 VA (NEC 220.52)</li>
          <li>• Mark loads as "Critical" if they are essential for life safety or property protection</li>
        </ul>
      </div>
    </div>
  );
});