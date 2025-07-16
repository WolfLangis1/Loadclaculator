/**
 * Statistics View Component
 * 
 * Displays project statistics and analytics
 */

import React from 'react';
import { BarChart3, FolderOpen, Clock, Star, TrendingUp } from 'lucide-react';

interface ProjectStatistics {
  totalProjects: number;
  recentProjects: number;
  favoriteProjects: number;
  templateProjects: number;
  totalSizeKB: number;
  averageProjectSize: number;
  mostUsedTemplate: string;
  projectsByCategory: { [key: string]: number };
}

interface StatisticsViewProps {
  statistics: ProjectStatistics | null;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ statistics }) => {
  if (!statistics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No statistics available</p>
        </div>
      </div>
    );
  }

  const StatCard: React.FC<{ 
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }> = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => (
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

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          title="Total Projects"
          value={statistics.totalProjects}
          color="blue"
        />
        <StatCard
          icon={Clock}
          title="Recent Projects"
          value={statistics.recentProjects}
          subtitle="Last 7 days"
          color="green"
        />
        <StatCard
          icon={Star}
          title="Favorites"
          value={statistics.favoriteProjects}
          color="yellow"
        />
        <StatCard
          icon={TrendingUp}
          title="Templates"
          value={statistics.templateProjects}
          color="purple"
        />
      </div>

      {/* Storage Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Storage Usage</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Total Size</p>
            <p className="text-xl font-semibold text-gray-900">
              {(statistics.totalSizeKB / 1024).toFixed(1)} MB
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Average Project Size</p>
            <p className="text-xl font-semibold text-gray-900">
              {statistics.averageProjectSize.toFixed(1)} KB
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Most Used Template</p>
            <p className="text-xl font-semibold text-gray-900">
              {statistics.mostUsedTemplate || 'None'}
            </p>
          </div>
        </div>
      </div>

      {/* Projects by Category */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects by Category</h3>
        <div className="space-y-3">
          {Object.entries(statistics.projectsByCategory).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${(count / Math.max(1, Math.max(...Object.values(statistics.projectsByCategory)))) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};