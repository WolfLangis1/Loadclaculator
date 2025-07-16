/**
 * Project List Item Component
 * 
 * List view representation of a project
 */

import React from 'react';
import { FolderOpen, Calendar, Star, MoreVertical } from 'lucide-react';
import type { ProjectData } from '../../services/projectService';

interface ProjectListItemProps {
  project: ProjectData;
  onLoad: (project: ProjectData) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
  onExport: (projectId: string) => void;
}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({
  project,
  onLoad,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onExport
}) => {
  const isFavorite = project.metadata.tags.includes('favorite');
  const modifiedDate = new Date(project.metadata.modified).toLocaleDateString();

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <FolderOpen className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{project.metadata.name}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {modifiedDate}
            </span>
            {project.metadata.description && (
              <span className="truncate max-w-xs">{project.metadata.description}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleFavorite(project.metadata.id)}
          className={`p-2 rounded-md transition-colors ${
            isFavorite 
              ? 'text-yellow-500 hover:text-yellow-600' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <button
          onClick={() => onLoad(project)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Load
        </button>

        <div className="relative group">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-md transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
          
          <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button
              onClick={() => onDuplicate(project.metadata.id)}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Duplicate
            </button>
            <button
              onClick={() => onExport(project.metadata.id)}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Export
            </button>
            <button
              onClick={() => onDelete(project.metadata.id)}
              className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};