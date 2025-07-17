import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useLoadCalculator } from '../../../hooks/useLoadCalculator';
import { LoadManagementSection } from '../LoadManagementSection';
import { LoadTable } from './LoadTable';
import { EVSELoadRow } from './EVSELoadRow';

export const EVSELoadsTable: React.FC = React.memo(() => {
  const { state, dispatch, updateSettings } = useLoadCalculator();
  const { evseLoads, generalLoads, hvacLoads } = state.loads;
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLoadManagementExpanded, setIsLoadManagementExpanded] = useState(false);

  const activeEvseCount = (evseLoads || []).filter(load => load.quantity > 0).length;
  const totalEvseAmps = (evseLoads || []).reduce((sum, load) => sum + (load.amps * load.quantity), 0);

  useEffect(() => {
    if (state.loadManagementType !== 'none') {
      setIsLoadManagementExpanded(true);
    }
  }, [state.loadManagementType]);

  useEffect(() => {
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
        payload: { id, field: updateField as keyof typeof updatedLoad, value: updateValue }
      });
    });
  };

  const addLoadRow = () => {
    const newId = Math.max(...evseLoads.map(l => l.id), 0) + 1;
    dispatch({
      type: 'ADD_LOAD',
      payload: {
        category: 'evse',
        id: newId,
        name: 'Custom EV Charger',
        quantity: 0,
        amps: 40,
        volts: 240,
        va: 9600,
        total: 0,
        continuous: true as const,
        circuit: ''
      }
    });
  };

  const removeLoadRow = (id: number) => {
    dispatch({
      type: 'REMOVE_LOAD',
      payload: { 
        category: 'evse',
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
    
    if (field === 'volts' && ![120, 240].includes(numValue)) {
      return 'Select standard voltage: 120V or 240V';
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
      <div className="space-y-6">
        <LoadManagementSection
          isLoadManagementExpanded={isLoadManagementExpanded}
          setIsLoadManagementExpanded={setIsLoadManagementExpanded}
          activeEvseCount={activeEvseCount}
          totalEvseAmps={totalEvseAmps}
        />

        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">EV Charging Equipment</h3>
          <button
            onClick={addLoadRow}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add EV Charger
          </button>
        </div>

        {evseLoads.map((load) => (
          <EVSELoadRow
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
    <div className="space-y-6">
      <LoadManagementSection
        isLoadManagementExpanded={isLoadManagementExpanded}
        setIsLoadManagementExpanded={setIsLoadManagementExpanded}
        activeEvseCount={activeEvseCount}
        totalEvseAmps={totalEvseAmps}
      />

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">EV Charging Equipment</h3>
        <button
          onClick={addLoadRow}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add EV Charger
        </button>
      </div>

      <div className="overflow-x-auto">
        <LoadTable
          loads={evseLoads}
          updateLoad={handleUpdateLoad}
          removeLoadRow={removeLoadRow}
          validateField={validateField}
          isMobile={isMobile}
          expandedRows={expandedRows}
          toggleRowExpansion={toggleRowExpansion}
        />
      </div>

      <div className="bg-green-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-green-800 mb-2">EVSE Load Requirements (NEC Article 625)</h4>
        <ul className="text-xs text-green-700 space-y-1">
          <li>• <strong>EVSE Demand Calculation</strong>: NEC 625.42(B) requires 100% of nameplate rating for service/feeder sizing</li>
          <li>• <strong>Circuit Protection</strong>: Individual EVSE circuits sized at 125% for continuous operation (NEC 625.42)</li>
          <li>• <strong>Load Management Benefit</strong>: Reduces actual simultaneous operating load, not calculation factors</li>
          <li>• <strong>EMS</strong>: Limits total load to prevent exceeding electrical capacity (NEC 750.30)</li>
          <li>• <strong>SimpleSwitch/DCC</strong>: Prevents simultaneous full-power operation of multiple EVSE (NEC 625.42)</li>
          <li>• Level 2 chargers typically operate at 240V with amperage from 16A to 80A</li>
        </ul>
      </div>
    </div>
  );
});