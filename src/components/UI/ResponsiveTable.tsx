import React from 'react';

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
  caption?: string;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = React.memo(({
  children,
  className = '',
  caption
}) => {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className={`min-w-full divide-y divide-gray-300 table-auto ${className}`} style={{ height: 'auto' }}>
            {caption && (
              <caption className="sr-only">
                {caption}
              </caption>
            )}
            {children}
          </table>
        </div>
      </div>
    </div>
  );
});

ResponsiveTable.displayName = 'ResponsiveTable';

interface TableHeaderProps {
  children: React.ReactNode;
  scope?: 'col' | 'row' | 'colgroup' | 'rowgroup';
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = React.memo(({
  children,
  scope = 'col',
  className = ''
}) => {
  return (
    <th
      scope={scope}
      className={`px-3 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 ${className}`}
    >
      {children}
    </th>
  );
});

TableHeader.displayName = 'TableHeader';

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = React.memo(({
  children,
  className = '',
  colSpan
}) => {
  return (
    <td
      className={`px-3 py-4 text-sm text-gray-900 whitespace-nowrap ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
});

TableCell.displayName = 'TableCell';