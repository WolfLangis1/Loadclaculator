import React from 'react';
import { FolderOpen, Download, Trash2, Clock, Check } from 'lucide-react';

interface ProjectListItemProps {
  project: any; // Replace 'any' with your actual Project type
  onLoadProject: (projectId: string) => void;
  onExportProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectListItem: React.FC<ProjectListItemProps> = React.memo(
  ({ project, onLoadProject, onExportProject, onDeleteProject }) => {
    const formatDate = (date: Date | string) => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
      <div className="p-4 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{project.name}</h4>
            <div className="text-sm text-gray-600 mt-1">
              Customer: {project.state.projectInfo.customerName || 'Unknown'}
            </div>
            <div className="text-sm text-gray-600">
              Address: {project.state.projectInfo.propertyAddress || 'Not specified'}
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDate(project.updatedAt)}
              </span>
              <span>Method: {project.state.calculationMethod}</span>
              <span>{project.state.squareFootage} sq ft</span>
            </div>
          </div>

          <div className="flex items-center gap-1 ml-4">
            <button
              onClick={() => onLoadProject(project.id)}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
              title="Load project"
            >
              <FolderOpen className="h-4 w-4" />
            </button>

            <button
              onClick={() => onExportProject(project.id)}
              className="p-2 text-green-600 hover:bg-green-100 rounded transition-colors"
              title="Export project"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDeleteProject(project.id)}
              className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
              title="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }
);
