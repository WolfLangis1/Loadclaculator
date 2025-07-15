/**
 * Project Card Component
 * 
 * Visual card representation of a project with actions
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Star, 
  Copy, 
  Trash2, 
  Download, 
  Eye, 
  MoreVertical,
  Tag,
  FileText,
  Settings
} from 'lucide-react';
import type { ProjectData } from '../../services/projectService';

interface ProjectCardProps {
  project: ProjectData;
  onLoad: (project: ProjectData) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
  onExport: (projectId: string) => void;
  onCreateTemplate: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onLoad,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onExport,
  onCreateTemplate
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const isFavorite = project.metadata.tags.includes('favorite');
  const isTemplate = project.metadata.isTemplate;
  const modifiedDate = new Date(project.metadata.modified);
  const createdDate = new Date(project.metadata.created);

  const handleQuickAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    action();
    setShowMenu(false);
  };

  return (
    <div
      className={`relative bg-white rounded-lg border-2 p-4 cursor-pointer transition-all duration-200 ${
        isHovering
          ? 'border-blue-300 shadow-lg transform -translate-y-1'
          : 'border-gray-200 shadow-sm hover:border-gray-300'
      }`}
      onClick={() => onLoad(project)}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{project.metadata.name}</h3>
          <p className="text-sm text-gray-500 truncate mt-1">
            {project.metadata.description || 'No description'}
          </p>
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          {/* Favorite Star */}
          <button
            onClick={(e) => handleQuickAction(() => onToggleFavorite(project.metadata.id), e)}
            className={`p-1 rounded transition-colors ${
              isFavorite
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-400 hover:text-yellow-500'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => handleQuickAction(() => setShowMenu(!showMenu), e)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-36">
                <div className="py-1">
                  <button
                    onClick={(e) => handleQuickAction(() => onDuplicate(project.metadata.id), e)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={(e) => handleQuickAction(() => onExport(project.metadata.id), e)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                  <button
                    onClick={(e) => handleQuickAction(() => onCreateTemplate(project.metadata.id), e)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Create Template
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={(e) => handleQuickAction(() => onDelete(project.metadata.id), e)}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Badge */}
      {isTemplate && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-2">
          <FileText className="h-3 w-3" />
          Template
        </div>
      )}

      {/* Template Used Badge */}
      {project.metadata.templateUsed && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-2">
          <Settings className="h-3 w-3" />
          From Template
        </div>
      )}

      {/* Tags */}
      {project.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {project.metadata.tags.slice(0, 3).map(tag => (
            tag !== 'favorite' && (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            )
          ))}
          {project.metadata.tags.filter(tag => tag !== 'favorite').length > 3 && (
            <span className="text-xs text-gray-500">
              +{project.metadata.tags.filter(tag => tag !== 'favorite').length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Thumbnail/Preview Area */}
      <div className="bg-gray-100 rounded-lg h-32 mb-3 flex items-center justify-center">
        {project.metadata.thumbnail ? (
          <img
            src={project.metadata.thumbnail}
            alt="Project thumbnail"
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="text-center">
            <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <span className="text-sm text-gray-500">No preview</span>
          </div>
        )}
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
        <div>
          <div className="font-medium">Loads</div>
          <div>
            {(project.loads?.generalLoads?.length || 0) + 
             (project.loads?.hvacLoads?.length || 0) + 
             (project.loads?.evseLoads?.length || 0) + 
             (project.loads?.solarBatteryLoads?.length || 0)} items
          </div>
        </div>
        <div>
          <div className="font-medium">Service</div>
          <div>{project.settings?.mainBreaker || '—'}A</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Modified {modifiedDate.toLocaleDateString()}
        </div>
        <div className="text-right">
          <div>{project.metadata.author}</div>
          <div>v{project.metadata.version}</div>
        </div>
      </div>

      {/* Hover Actions */}
      {isHovering && (
        <div className="absolute inset-x-4 bottom-16 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex gap-2">
          <button
            onClick={(e) => handleQuickAction(() => onLoad(project), e)}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1"
          >
            <Eye className="h-3 w-3" />
            Open
          </button>
          <button
            onClick={(e) => handleQuickAction(() => onDuplicate(project.metadata.id), e)}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
            title="Duplicate"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => handleQuickAction(() => onExport(project.metadata.id), e)}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
            title="Export"
          >
            <Download className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ProjectCard;