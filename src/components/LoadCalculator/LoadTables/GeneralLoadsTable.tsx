import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLoadData } from '../../../context/LoadDataContext';
import { LoadTable } from './LoadTable';
import { LoadRow } from './LoadRow';

export const GeneralLoadsTable: React.FC = React.memo(() => {
  const { loads, updateLoad, addLoad, removeLoad } = useLoadData();
  const { generalLoads } = loads;
  
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleUpdateLoad = (id: number, field: string, value: string | number | boolean) => {
    let processedValue = value;
    
    if (['quantity', 'amps', 'volts', 'va'].includes(field)) {
      processedValue = value === '' || value === null || value === undefined ? 0 : parseFloat(value) || 0;
    }
    
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
    
    Object.entries(updatedLoad).forEach(([updateField, updateValue]) => {
      updateLoad('general', id, updateField, updateValue);
    });
  };

  const addLoadRow = () => {
    const newId = Math.max(...generalLoads.map(l => l.id), 0) + 1;
    addLoad('general', {
      id: newId,
      name: '',
      quantity: 1,
      amps: 0,
      volts: 120,
      va: 0,
      total: 0,
      isCritical: false
    });
  };

  const removeLoadRow = (id: number) => {
    removeLoad('general', id);
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
          <h3 className="text-lg font-medium text-gray-900">General Loads</h3>
          <button
            onClick={addLoadRow}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Load
          </button>
        </div>
        {generalLoads.map((load) => (
          <LoadRow
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
        <h3 className="text-lg font-medium text-gray-900">General Loads</h3>
        <button
          onClick={addLoadRow}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Load
        </button>
      </div>

      <div className="overflow-x-auto" style={{ height: 'auto', maxHeight: 'none' }}>
        <LoadTable
          loads={generalLoads}
          updateLoad={handleUpdateLoad}
          removeLoadRow={removeLoadRow}
          validateField={validateField}
          isMobile={isMobile}
          expandedRows={expandedRows}
          toggleRowExpansion={toggleRowExpansion}
        />
      </div>
      
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
