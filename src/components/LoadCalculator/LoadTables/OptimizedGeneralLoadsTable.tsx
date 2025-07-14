import React, { useState } from 'react';
import { Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useLoadData } from '../../../context/LoadDataContext';
import { useCalculations } from '../../../context/CalculationContext';
import { ResponsiveTable, TableHeader, TableCell } from '../../UI/ResponsiveTable';
import { ValidatedInput } from '../../UI/ValidatedInput';

// Memoized load row component for better performance
const LoadRow = React.memo<{
  load: any;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  validateField: (value: any, field: string) => string | undefined;
}>(({ load, onUpdate, onRemove, validateField }) => {

  return (
    <tr className="hover:bg-gray-50">
      <TableCell>
        <ValidatedInput
          value={load.name || ''}
          onChange={(e) => onUpdate('name', e.target.value)}
          placeholder="Load description"
          className="border-gray-300 text-sm"
        />
      </TableCell>
      <TableCell>
        <ValidatedInput
          type="number"
          value={load.quantity || 0}
          onChange={(e) => onUpdate('quantity', e.target.value)}
          min="0"
          className="w-16 text-center border-gray-300 text-sm"
          error={validateField(load.quantity, 'quantity')}
        />
      </TableCell>
      <TableCell>
        <ValidatedInput
          type="number"
          value={load.amps || 0}
          onChange={(e) => onUpdate('amps', e.target.value)}
          min="0"
          step="0.1"
          className="w-20 text-center border-gray-300 text-sm"
          error={validateField(load.amps, 'amps')}
        />
      </TableCell>
      <TableCell>
        <select
          value={load.volts || 120}
          onChange={(e) => onUpdate('volts', parseInt(e.target.value))}
          className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
        >
          <option value={120}>120</option>
          <option value={240}>240</option>
          <option value={277}>277</option>
          <option value={480}>480</option>
        </select>
      </TableCell>
      <TableCell>
        <span className="text-sm font-mono text-gray-700">
          {load.va?.toLocaleString() || '0'}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm font-mono font-medium text-gray-900">
          {load.total?.toLocaleString() || '0'}
        </span>
      </TableCell>
      <TableCell>
        <input
          type="checkbox"
          checked={load.critical || false}
          onChange={(e) => onUpdate('critical', e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          aria-label="Mark as critical load"
        />
      </TableCell>
      <TableCell>
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-900 focus:outline-none"
          aria-label="Remove load"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </TableCell>
    </tr>
  );
});

LoadRow.displayName = 'LoadRow';

// Memoized mobile card component
const MobileLoadCard = React.memo<{
  load: any;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  validateField: (value: any, field: string) => string | undefined;
}>(({ load, isExpanded, onToggle, onUpdate, onRemove, validateField }) => {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div 
        className="px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex-1">
          <ValidatedInput
            value={load.name || ''}
            onChange={(e) => onUpdate('name', e.target.value)}
            placeholder="Load description"
            className="border-0 p-0 shadow-none focus:ring-0"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
        <div className="flex items-center space-x-2 ml-4">
          <span className="text-sm font-medium text-gray-900">
            {load.total?.toLocaleString() || '0'} VA
          </span>
          {isExpanded ? 
            <ChevronUp className="h-5 w-5 text-gray-400" /> : 
            <ChevronDown className="h-5 w-5 text-gray-400" />
          }
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 py-3 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Quantity"
              type="number"
              value={load.quantity || 0}
              onChange={(e) => onUpdate('quantity', e.target.value)}
              min="0"
              className="w-16 text-center"
              error={validateField(load.quantity, 'quantity')}
            />
            
            <ValidatedInput
              label="Amps"
              type="number"
              value={load.amps || 0}
              onChange={(e) => onUpdate('amps', e.target.value)}
              min="0"
              step="0.1"
              error={validateField(load.amps, 'amps')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voltage
              </label>
              <select
                value={load.volts || 120}
                onChange={(e) => onUpdate('volts', parseInt(e.target.value))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value={120}>120V</option>
                <option value={240}>240V</option>
                <option value={277}>277V</option>
                <option value={480}>480V</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VA (Calculated)
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                <span className="text-sm font-mono text-gray-700">
                  {load.va?.toLocaleString() || '0'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={load.critical || false}
                onChange={(e) => onUpdate('critical', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Critical Load</span>
            </label>

            <button
              onClick={onRemove}
              className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

MobileLoadCard.displayName = 'MobileLoadCard';

export const OptimizedGeneralLoadsTable: React.FC = React.memo(() => {
  const { loads, updateLoad, addLoad, removeLoad } = useLoadData();
  const { generalLoadCalculations } = useCalculations();
  
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Responsive handler
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoized validation function
  const validateField = React.useCallback((value: any, field: string): string | undefined => {
    if (field === 'amps' && (value < 0 || value > 200)) {
      return 'Amperage must be between 0 and 200A';
    }
    if (field === 'volts' && ![120, 240, 277, 480].includes(value)) {
      return 'Common voltages: 120V, 240V, 277V, 480V';
    }
    return undefined;
  }, []);

  // Memoized handlers
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
    
    // Handle numeric fields
    if (['quantity', 'amps', 'volts', 'va'].includes(field)) {
      processedValue = parseFloat(value) || 0;
    }
    
    updateLoad('general', id, field, processedValue);
    
    // Auto-calculate dependent fields
    if (field === 'quantity' || field === 'amps' || field === 'volts') {
      // Get current load values directly from state to avoid dependency
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

  // Remove performance warning for now

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
            <MobileLoadCard
              key={load.id}
              load={load}
              isExpanded={expandedRows.has(load.id)}
              onToggle={() => toggleRowExpansion(load.id)}
              onUpdate={(field, value) => handleUpdateLoad(load.id, field, value)}
              onRemove={() => handleRemoveLoad(load.id)}
              validateField={validateField}
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

  // Desktop view with virtual scrolling for large datasets
  // const renderLoadRow = React.useCallback((load: any) => (
  //   <LoadRow
  //     key={load.id}
  //     load={load}
  //     onUpdate={(field, value) => handleUpdateLoad(load.id, field, value)}
  //     onRemove={() => handleRemoveLoad(load.id)}
  //     validateField={validateField}
  //   />
  // ), [handleUpdateLoad, handleRemoveLoad, validateField]);

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
        <ResponsiveTable caption="General electrical loads table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <TableHeader key={index} className={index === headers.length - 1 ? 'sr-only' : ''}>
                  {header}
                </TableHeader>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(!loads.generalLoads || loads.generalLoads.length === 0) ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-sm text-gray-500 text-center">
                  No loads found. Click "Add Load" to create your first load.
                </td>
              </tr>
            ) : loads.generalLoads.map((load) => (
              <LoadRow
                key={load.id}
                load={load}
                onUpdate={(field, value) => handleUpdateLoad(load.id, field, value)}
                onRemove={() => handleRemoveLoad(load.id)}
                validateField={validateField}
              />
            ))}
          </tbody>
        </ResponsiveTable>
      </div>
      
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-2">General Loads Information</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• General lighting: 3 VA per sq ft (NEC 220.12)</li>
              <li>• Small appliances: 2 circuits @ 1500 VA each</li>
              <li>• Laundry: 1 circuit @ 1500 VA</li>
              <li>• Bathroom: 1 circuit @ 1500 VA</li>
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