import React from 'react';
import { Trash2 } from 'lucide-react';
import { TooltipWrapper } from '../../UI/TooltipWrapper';

interface SolarBatteryLoadRowProps {
  load: any; // Replace 'any' with your actual Load type
  updateLoad: (id: number, field: string, value: string | number | boolean) => void;
  removeLoadRow: (id: number) => void;
}

export const SolarBatteryLoadRow: React.FC<SolarBatteryLoadRowProps> = React.memo(
  ({ load, updateLoad, removeLoadRow }) => {
    const handleUpdate = (field: string, value: string | number | boolean) => {
      updateLoad(load.id, field, value);
    };

    return (
      <tr key={load.id} className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <input
            type="text"
            value={load.name || ''}
            onChange={(e) => handleUpdate('name', e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="System description"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={load.type || 'solar'}
            onChange={(e) => handleUpdate('type', e.target.value)}
            className="w-28 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="solar">Solar PV</option>
            <option value="battery">Battery</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={load.kw || ''}
            onChange={(e) => handleUpdate('kw', e.target.value)}
            className="w-24 text-center border-blue-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-blue-50"
            min="0"
            step="0.1"
            placeholder="kW"
            title="Enter system capacity in kW - will auto-calculate inverter amps and breaker size"
          />
        </td>
        <td className="px-4 py-3">
          <div className="w-28 text-center p-2 bg-gray-100 rounded-md border border-gray-300">
            <span className="text-sm font-mono text-gray-700">
              {load.inverterAmps?.toFixed(1) || '0.0'}A
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <input
            type="number"
            value={load.breaker || ''}
            onChange={(e) => handleUpdate('breaker', e.target.value)}
            className="w-20 text-center border-green-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500 text-sm bg-green-50"
            min="0"
            step="5"
            placeholder="A"
            title="Enter breaker size in amps - will auto-calculate kW and inverter amps"
          />
        </td>
        <td className="px-4 py-3">
          <select
            value={load.location || 'backfeed'}
            onChange={(e) => handleUpdate('location', e.target.value)}
            className="w-32 border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            title="Choose connection type - affects NEC 705.12 compliance"
          >
            <option value="backfeed" title="Most common: breaker in main panel">Backfeed</option>
            <option value="supply_side" title="Before main breaker: no 120% rule limit">Supply Side</option>
            <option value="load_side" title="After main breaker: subject to 120% rule">Load Side</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <select
            value={load.volts || 240}
            onChange={(e) => handleUpdate('volts', e.target.value)}
            className="w-20 text-center border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value={240}>240</option>
            <option value={120}>120</option>
          </select>
        </td>
        <td className="px-4 py-3">
          <button
            onClick={() => removeLoadRow(load.id)}
            className="text-red-600 hover:text-red-900 focus:outline-none"
            aria-label="Remove solar/battery load"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </td>
      </tr>
    );
  }
);
