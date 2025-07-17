import React from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { ValidatedInput } from '../../UI/ValidatedInput';
import { TableCell } from '../../UI/ResponsiveTable';

interface EVSELoadRowProps {
  load: any; // Replace 'any' with your actual EVSELoad type
  updateLoad: (id: number, field: string, value: string | number | boolean) => void;
  removeLoadRow: (id: number) => void;
  validateField: (value: number | string, field: string) => string | undefined;
  isMobile?: boolean;
  toggleRowExpansion?: (id: number) => void;
  isExpanded?: boolean;
}

export const EVSELoadRow: React.FC<EVSELoadRowProps> = React.memo(
  ({ load, updateLoad, removeLoadRow, validateField, isMobile, toggleRowExpansion, isExpanded }) => {
    const handleUpdate = (field: string, value: string | number | boolean) => {
      updateLoad(load.id, field, value);
    };

    if (isMobile) {
      return (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div
            className="px-4 py-3 border-b border-gray-200 flex justify-between items-center cursor-pointer"
            onClick={() => toggleRowExpansion && toggleRowExpansion(load.id)}
          >
            <div className="flex-1">
              <ValidatedInput
                value={load.name || ''}
                onChange={(e) => handleUpdate('name', e.target.value)}
                placeholder="EVSE description"
                className="border-0 p-0 shadow-none focus:ring-0"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex items-center space-x-2 ml-4">
              <span className="text-sm font-medium text-gray-900">
                {load.total?.toLocaleString() || '0'} VA
              </span>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {isExpanded && (
            <div className="px-4 py-3 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ValidatedInput
                  label="Quantity"
                  type="number"
                  value={load.quantity || ''}
                  onChange={(e) => handleUpdate('quantity', e.target.value)}
                  min="0"
                  error={validateField(load.quantity || 0, 'quantity')}
                />

                <ValidatedInput
                  label="Amps"
                  type="number"
                  value={load.amps || ''}
                  onChange={(e) => handleUpdate('amps', e.target.value)}
                  min="0"
                  step="1"
                  error={validateField(load.amps || 0, 'amps')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voltage
                  </label>
                  <select
                    value={load.volts || 240}
                    onChange={(e) => handleUpdate('volts', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value={240}>240</option>
                    <option value={120}>120</option>
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
                    checked={load.continuous || false}
                    onChange={(e) => handleUpdate('continuous', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Continuous Load</span>
                </label>

                <button
                  onClick={() => removeLoadRow(load.id)}
                  className="inline-flex items-center px-2 py-1 border border-transparent text-sm leading-4 font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <tr key={load.id} className="hover:bg-gray-50">
        <TableCell className="load-description-cell">
          <ValidatedInput
            value={load.name || ''}
            onChange={(e) => handleUpdate('name', e.target.value)}
            placeholder="EVSE description"
            className="border-gray-300 text-sm w-full"
          />
        </TableCell>
        <TableCell className="load-number-cell">
          <ValidatedInput
            type="number"
            value={load.quantity || ''}
            onChange={(e) => handleUpdate('quantity', e.target.value)}
            min="0"
            className="w-full text-center border-gray-300 text-sm"
            error={validateField(load.quantity || 0, 'quantity')}
          />
        </TableCell>
        <TableCell className="load-amps-cell">
          <ValidatedInput
            type="number"
            value={load.amps || ''}
            onChange={(e) => handleUpdate('amps', e.target.value)}
            min="0"
            step="1"
            className="w-full text-center border-gray-300 text-sm"
            error={validateField(load.amps || 0, 'amps')}
          />
        </TableCell>
        <TableCell>
          <select
            value={load.volts || 240}
            onChange={(e) => handleUpdate('volts', parseInt(e.target.value))}
            className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value={240}>240</option>
            <option value={120}>120</option>
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
            checked={load.continuous || false}
            onChange={(e) => handleUpdate('continuous', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            aria-label="Mark as continuous load"
          />
        </TableCell>
        <TableCell>
          <button
            onClick={() => removeLoadRow(load.id)}
            className="text-red-600 hover:text-red-900 focus:outline-none"
            aria-label="Remove EVSE load"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </TableCell>
      </tr>
    );
  }
);
