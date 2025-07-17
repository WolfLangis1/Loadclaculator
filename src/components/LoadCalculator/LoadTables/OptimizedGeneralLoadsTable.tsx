import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLoadData } from '../../../context/LoadDataContext';
import { useCalculations } from '../../../context/CalculationContext';
import { ResponsiveTable, TableHeader } from '../../UI/ResponsiveTable';
import { LoadRow } from './LoadRow';
import { LoadTable } from './LoadTable';

export const OptimizedGeneralLoadsTable: React.FC = React.memo(() => {
  const { loads, updateLoad, addLoad, removeLoad } = useLoadData();
  const { generalLoadCalculations } = useCalculations();
  
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validateField = React.useCallback((value: any, field: string): string | undefined => {
    if (field === 'amps' && (value < 0 || value > 200)) {
      return 'Amperage must be between 0 and 200A';
    }
    if (field === 'volts' && ![120, 240, 277, 480].includes(value)) {
      return 'Common voltages: 120V, 240V, 277V, 480V';
    }
    return undefined;
  }, []);

  const handleAddLoad = React.useCallback(() => {
    addLoad('general', {
      name: '',
      quantity: 1,
      amps: 0,
      volts: 120,
      va: 0,
      total: 0,
      critical: false
    });
  }, [addLoad]);

  const handleUpdateLoad = React.useCallback((id: number, field: string, value: any) => {
    let processedValue = value;
    
    if (['quantity', 'amps', 'volts', 'va'].includes(field)) {
      processedValue = parseFloat(value) || 0;
    }
    
    updateLoad('general', id, field, processedValue);
    
    if (field === 'quantity' || field === 'amps' || field === 'volts') {
      const currentLoads = loads.generalLoads;
      const load = currentLoads.find(l => l.id === id);
      if (load) {
        const qty = field === 'quantity' ? processedValue : load.quantity;
        const amps = field === 'amps' ? processedValue : load.amps;
        const volts = field === 'volts' ? processedValue : load.volts;
        
        const va = amps * volts;
        const total = va * qty;
        
        updateLoad('general', id, 'va', va);
        updateLoad('general', id, 'total', total);
      }
    }
  }, [updateLoad, loads]);

  const handleRemoveLoad = React.useCallback((id: number) => {
    removeLoad('general', id);
  }, [removeLoad]);

  const toggleRowExpansion = React.useCallback((id: number) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">General Loads</h3>
          </div>
          <button
            onClick={handleAddLoad}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Load
          </button>
        </div>

        <div className="space-y-3">
          {loads.generalLoads.map((load) => (
            <LoadRow
              key={load.id}
              load={load}
              isExpanded={expandedRows.has(load.id)}
              onToggle={() => toggleRowExpansion(load.id)}
              onUpdate={(field, value) => handleUpdateLoad(load.id, field, value)}
              onRemove={() => handleRemoveLoad(load.id)}
              validateField={validateField}
              isMobile={isMobile}
            />
          ))}
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            General Loads Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Total VA:</span>
              <span className="font-mono font-medium ml-2">
                {generalLoadCalculations.totalVA.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Demand Amps:</span>
              <span className="font-mono font-medium ml-2">
                {generalLoadCalculations.demandAmps.toFixed(1)}A
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const headers = ['Description', 'Qty', 'Amps', 'Volts', 'VA', 'Total VA', 'Critical', 'Actions'];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">General Loads</h3>
        </div>
        <button
          onClick={handleAddLoad}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Load
        </button>
      </div>

      <div className="overflow-x-auto" style={{ height: 'auto', maxHeight: 'none' }}>
        <LoadTable
          loads={loads.generalLoads}
          updateLoad={handleUpdateLoad}
          removeLoadRow={handleRemoveLoad}
          validateField={validateField}
          isMobile={isMobile}
          expandedRows={expandedRows}
          toggleRowExpansion={toggleRowExpansion}
        />
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">General Loads Information</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• General lighting: 3 VA per sq ft (NEC 220.12)</li>
              <li>• Small appliances: 2 circuits @ 1500 VA each</li>
              <li>• Laundry: 1 circuit @ 1500 VA</li>
              <li>• Bathroom circuit: 1 circuit @ 1500 VA</li>
            </ul>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-800">
              <div>Total VA: <span className="font-mono font-medium">{generalLoadCalculations.totalVA.toLocaleString()}</span></div>
              <div>Demand VA: <span className="font-mono font-medium">{generalLoadCalculations.demandVA.toLocaleString()}</span></div>
              <div>Demand Amps: <span className="font-mono font-medium">{generalLoadCalculations.demandAmps.toFixed(1)}A</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

OptimizedGeneralLoadsTable.displayName = 'OptimizedGeneralLoadsTable';
