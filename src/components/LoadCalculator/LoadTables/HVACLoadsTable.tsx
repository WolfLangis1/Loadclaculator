import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLoadCalculator } from '../../../hooks/useLoadCalculator';
import { LoadTable } from './LoadTable';
import { HVACLoadRow } from './HVACLoadRow';

export const HVACLoadsTable: React.FC = React.memo(() => {
  const { state, dispatch } = useLoadCalculator();
  const { hvacLoads } = state.loads;
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUpdateLoad = (id: number, field: string, value: string | number | boolean) => {
    let processedValue = value;
    
    if (['quantity', 'amps', 'volts', 'va', 'hp'].includes(field)) {
      processedValue = value === '' || value === null || value === undefined ? 0 : parseFloat(value) || 0;
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
        payload: { id, field: updateField as keyof typeof updatedLoad, value: updateValue }
      });
    });
  };

  const addLoadRow = () => {
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

  const removeLoadRow = (id: number) => {
    dispatch({
      type: 'REMOVE_LOAD',
      payload: { 
        category: 'hvac',
        id 
      }
    });
  };

  const toggleRowExpansion = (id: number) => {
    setExpandedRows(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return newExpanded;
    });
  };

  const validateField = (value: number | string, field: string): string | undefined => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (field === 'amps') {
      if (isNaN(numValue) || numValue < 0) {
        return 'Amperage must be 0 or greater';
      }
      if (numValue > 200) {
        return 'Amperage exceeds typical range (0-200A). Check specifications.';
      }
    }
    
    if (field === 'volts' && ![120, 240, 277, 480].includes(numValue)) {
      return 'Select standard voltage: 120V, 240V, 277V, or 480V';
    }
    
    if (field === 'quantity') {
      if (isNaN(numValue) || numValue < 0) {
        return 'Quantity must be 0 or greater';
      }
      if (numValue > 1000) {
        return 'Quantity seems unusually high. Please verify.';
      }
    }
    
    return undefined;
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">HVAC Equipment</h3>
          <button
            onClick={addLoadRow}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add HVAC Load
          </button>
        </div>
        {hvacLoads.map((load) => (
          <HVACLoadRow
            key={load.id}
            load={load}
            updateLoad={handleUpdateLoad}
            removeLoadRow={removeLoadRow}
            validateField={validateField}
            isMobile={isMobile}
            toggleRowExpansion={toggleRowExpansion}
            isExpanded={expandedRows.has(load.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">HVAC Equipment</h3>
        <button
          onClick={addLoadRow}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add HVAC Load
        </button>
      </div>

      <div className="overflow-x-auto" style={{ height: 'auto', maxHeight: 'none' }}>
        <LoadTable
          loads={hvacLoads}
          updateLoad={handleUpdateLoad}
          removeLoadRow={removeLoadRow}
          validateField={validateField}
          isMobile={isMobile}
          expandedRows={expandedRows}
          toggleRowExpansion={toggleRowExpansion}
        />
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
});