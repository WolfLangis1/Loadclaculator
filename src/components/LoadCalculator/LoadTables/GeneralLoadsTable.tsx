import React, { useState } from 'react';
import { Trash2, Plus, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useLoadCalculator } from '../../../hooks/useLoadCalculator';
import { ResponsiveTable, TableHeader, TableCell } from '../../UI/ResponsiveTable';
import { ValidatedInput } from '../../UI/ValidatedInput';

export const GeneralLoadsTable: React.FC = React.memo(() => {
  const { state, dispatch } = useLoadCalculator();
  const { generalLoads } = state.loads;
  
  // const { updateLoadField } = useLoadUpdater('general');
  // const { getValidationError } = useLoadValidation();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showAdvancedLoads, setShowAdvancedLoads] = useState(false);
  
  // Split loads into basic (first 9) and advanced (rest)
  const basicLoads = generalLoads.slice(0, 9);
  const advancedLoads = generalLoads.slice(9);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const addLoad = () => {
    const newId = Math.max(...generalLoads.map(l => l.id), 0) + 1;
    dispatch({
      type: 'ADD_LOAD',
      payload: {
        category: 'general',
        id: newId,
        name: '',
        quantity: 1,
        amps: 0,
        volts: 120,
        va: 0,
        total: 0,
        isCritical: false
      }
    });
  };

  const removeLoad = (id: number) => {
    dispatch({
      type: 'REMOVE_LOAD',
      payload: { 
        category: 'general',
        id 
      }
    });
  };

  const toggleRowExpansion = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const validateField = (value: any, field: string): string | undefined => {
    if (field === 'amps' && (value < 0 || value > 200)) {
      return 'Amperage must be between 0 and 200A';
    }
    if (field === 'volts' && ![120, 240, 277, 480].includes(value)) {
      return 'Common voltages: 120V, 240V, 277V, 480V';
    }
    // Remove quantity validation - allow any positive number including 0
    return undefined;
  };

  const renderLoadRows = (loads: typeof generalLoads) => {
    if (!loads || loads.length === 0) {
      return (
        <tr>
          <TableCell colSpan={8}>
            <div className="text-center py-4 text-gray-500">
              No loads found. Click "Add Load" to create your first load.
            </div>
          </TableCell>
        </tr>
      );
    }

    return loads.map((load) => (
      <tr key={load.id} className="hover:bg-gray-50">
        <TableCell>
          <ValidatedInput
            value={load.name || ''}
            onChange={(e) => updateLoad(load.id, 'name', e.target.value)}
            placeholder="Load description"
            className="border-gray-300 text-sm"
          />
        </TableCell>
        <TableCell>
          <ValidatedInput
            type="number"
            value={load.quantity || 0}
            onChange={(e) => updateLoad(load.id, 'quantity', e.target.value)}
            min="0"
            className="w-16 text-center border-gray-300 text-sm"
            error={validateField(load.quantity || 0, 'quantity')}
          />
        </TableCell>
        <TableCell>
          <ValidatedInput
            type="number"
            value={load.amps || 0}
            onChange={(e) => updateLoad(load.id, 'amps', e.target.value)}
            min="0"
            step="0.1"
            className="w-20 text-center border-gray-300 text-sm"
            error={validateField(load.amps || 0, 'amps')}
          />
        </TableCell>
        <TableCell>
          <select
            value={load.volts || 120}
            onChange={(e) => updateLoad(load.id, 'volts', parseInt(e.target.value))}
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
            onChange={(e) => updateLoad(load.id, 'critical', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            aria-label="Mark as critical load"
          />
        </TableCell>
        <TableCell>
          <button
            onClick={() => removeLoad(load.id)}
            className="text-red-600 hover:text-red-900 focus:outline-none"
            aria-label="Remove load"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </TableCell>
      </tr>
    ));
  };

  if (isMobile) {
    // Mobile card layout
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">General Loads</h3>
          <button
            onClick={addLoad}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Load
          </button>
        </div>

        {basicLoads.map((load) => (
          <div key={load.id} className="bg-white rounded-lg shadow border border-gray-200">
            <div 
              className="px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
              onClick={() => toggleRowExpansion(load.id)}
            >
              <div className="flex-1">
                <ValidatedInput
                  value={load.name || ''}
                  onChange={(e) => updateLoad(load.id, 'name', e.target.value)}
                  placeholder="Load description"
                  className="border-0 p-0 shadow-none focus:ring-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm font-medium text-gray-900">
                  {load.total?.toLocaleString() || '0'} VA
                </span>
                {expandedRows.has(load.id) ? 
                  <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                }
              </div>
            </div>

            {expandedRows.has(load.id) && (
              <div className="px-4 py-3 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <ValidatedInput
                    label="Quantity"
                    type="number"
                    value={load.quantity || 0}
                    onChange={(e) => updateLoad(load.id, 'quantity', e.target.value)}
                    min="0"
                    className="w-16 text-center"
                    error={validateField(load.quantity || 0, 'quantity')}
                  />
                  
                  <ValidatedInput
                    label="Amps"
                    type="number"
                    value={load.amps || 0}
                    onChange={(e) => updateLoad(load.id, 'amps', e.target.value)}
                    min="0"
                    step="0.1"
                    error={validateField(load.amps || 0, 'amps')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Voltage
                    </label>
                    <select
                      value={load.volts || 120}
                      onChange={(e) => updateLoad(load.id, 'volts', parseInt(e.target.value))}
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
                      onChange={(e) => updateLoad(load.id, 'critical', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Critical Load</span>
                  </label>

                  <button
                    onClick={() => removeLoad(load.id)}
                    className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Advanced Loads Section for Mobile */}
        {advancedLoads.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowAdvancedLoads(!showAdvancedLoads)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Advanced Loads ({advancedLoads.length} items)
                </span>
              </div>
              {showAdvancedLoads ? (
                <ChevronUp className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              )}
            </button>

            {showAdvancedLoads && (
              <div className="mt-3 space-y-3">
                {advancedLoads.map((load) => (
                  <div key={load.id} className="bg-white rounded-lg shadow border border-gray-200">
                    <div 
                      className="px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
                      onClick={() => toggleRowExpansion(load.id)}
                    >
                      <div className="flex-1">
                        <ValidatedInput
                          value={load.name || ''}
                          onChange={(e) => updateLoad(load.id, 'name', e.target.value)}
                          placeholder="Load description"
                          className="border-0 p-0 shadow-none focus:ring-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <span className="text-sm font-medium text-gray-900">
                          {load.total?.toLocaleString() || '0'} VA
                        </span>
                        {expandedRows.has(load.id) ? 
                          <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                    </div>

                    {expandedRows.has(load.id) && (
                      <div className="px-4 py-3 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <ValidatedInput
                            label="Quantity"
                            type="number"
                            value={load.quantity || 0}
                            onChange={(e) => updateLoad(load.id, 'quantity', e.target.value)}
                            min="0"
                            className="w-16 text-center"
                            error={validateField(load.quantity || 0, 'quantity')}
                          />
                          
                          <ValidatedInput
                            label="Amps"
                            type="number"
                            value={load.amps || 0}
                            onChange={(e) => updateLoad(load.id, 'amps', e.target.value)}
                            min="0"
                            step="0.1"
                            error={validateField(load.amps || 0, 'amps')}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Voltage
                            </label>
                            <select
                              value={load.volts || 120}
                              onChange={(e) => updateLoad(load.id, 'volts', parseInt(e.target.value))}
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
                              onChange={(e) => updateLoad(load.id, 'critical', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">Critical Load</span>
                          </label>

                          <button
                            onClick={() => removeLoad(load.id)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">General Loads Information</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• General lighting: 3 VA per sq ft (NEC 220.12)</li>
            <li>• Small appliances: 2 circuits @ 1500 VA each</li>
            <li>• Laundry: 1 circuit @ 1500 VA</li>
            <li>• Bathroom: 1 circuit @ 1500 VA</li>
          </ul>
        </div>
      </div>
    );
  }

  // Desktop table layout
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">General Loads</h3>
        <button
          onClick={addLoad}
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
              <TableHeader className="w-2/5">Load Description</TableHeader>
              <TableHeader className="w-16">Qty</TableHeader>
              <TableHeader className="w-20">Amps</TableHeader>
              <TableHeader className="w-20">Volts</TableHeader>
              <TableHeader className="w-24">VA</TableHeader>
              <TableHeader className="w-28">Total VA</TableHeader>
              <TableHeader className="w-20">Critical</TableHeader>
              <TableHeader className="w-20 sr-only">Actions</TableHeader>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {renderLoadRows(basicLoads)}
          </tbody>
        </ResponsiveTable>
      </div>

      {/* Advanced Loads Section for Desktop */}
      {advancedLoads.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setShowAdvancedLoads(!showAdvancedLoads)}
            className="w-full flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                Advanced Loads ({advancedLoads.length} items)
              </span>
            </div>
            {showAdvancedLoads ? (
              <ChevronUp className="h-4 w-4 text-gray-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600" />
            )}
          </button>

          {showAdvancedLoads && (
            <div className="mt-3 overflow-x-auto" style={{ height: 'auto', maxHeight: 'none' }}>
              <ResponsiveTable caption="Advanced electrical loads table">
                <thead>
                  <tr>
                    <TableHeader className="w-2/5">Load Description</TableHeader>
                    <TableHeader className="w-16">Qty</TableHeader>
                    <TableHeader className="w-20">Amps</TableHeader>
                    <TableHeader className="w-20">Volts</TableHeader>
                    <TableHeader className="w-24">VA</TableHeader>
                    <TableHeader className="w-28">Total VA</TableHeader>
                    <TableHeader className="w-20">Critical</TableHeader>
                    <TableHeader className="w-20 sr-only">Actions</TableHeader>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {renderLoadRows(advancedLoads)}
                </tbody>
              </ResponsiveTable>
            </div>
          )}
        </div>
      )}
      
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