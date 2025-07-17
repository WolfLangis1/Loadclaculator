import React from 'react';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color = 'blue',
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center">
      <div className={`p-2 rounded-lg bg-${color}-100`}>
        <Icon className={`h-5 w-5 text-${color}-600`} />
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-xl font-semibold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);
