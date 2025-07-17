import React from 'react';
import { ResponsiveTable, TableHeader, TableCell } from '../../UI/ResponsiveTable';
import { LoadRow } from './LoadRow';

interface LoadTableProps {
  loads: any[]; // Replace 'any' with your actual Load type
  updateLoad: (id: number, field: string, value: string | number | boolean) => void;
  removeLoadRow: (id: number) => void;
  validateField: (value: number | string, field: string) => string | undefined;
  isMobile: boolean;
  expandedRows: Set<number>;
  toggleRowExpansion: (id: number) => void;
}

export const LoadTable: React.FC<LoadTableProps> = React.memo(
  ({ loads, updateLoad, removeLoadRow, validateField, isMobile, expandedRows, toggleRowExpansion }) => {
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

    return (
      <ResponsiveTable caption="General electrical loads table">
        <thead>
          <tr>
            <TableHeader className="w-4/12 min-w-48">Load Description</TableHeader>
            <TableHeader className="w-1/12 min-w-16">Qty</TableHeader>
            <TableHeader className="w-2/12 min-w-20">Amps</TableHeader>
            <TableHeader className="w-1/12 min-w-16">Volts</TableHeader>
            <TableHeader className="w-2/12 min-w-20">VA</TableHeader>
            <TableHeader className="w-1/12 min-w-20">Total VA</TableHeader>
            <TableHeader className="w-1/12 min-w-16">Critical</TableHeader>
            <TableHeader className="w-1/12 min-w-12 sr-only">Actions</TableHeader>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {loads.map((load) => (
            <LoadRow
              key={load.id}
              load={load}
              updateLoad={updateLoad}
              removeLoadRow={removeLoadRow}
              validateField={validateField}
              isMobile={isMobile}
              toggleRowExpansion={toggleRowExpansion}
              isExpanded={expandedRows.has(load.id)}
            />
          ))}
        </tbody>
      </ResponsiveTable>
    );
  }
);
