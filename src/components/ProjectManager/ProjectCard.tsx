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
  Settings,
  Edit3
} from 'lucide-react';
import type { ProjectData } from '../../services/projectService';

interface ProjectCardProps {
  project: ProjectData;
  onLoad: (project: ProjectData) => void;
  onEdit: (project: ProjectData) => void;
  onDuplicate: (projectId: string) => void;
  onDelete: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
  onExport: (projectId: string) => void;
  onCreateTemplate: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onLoad,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavorite,
  onExport,
  onCreateTemplate
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const isFavorite = project.metadata.tags.includes('favorite');
  const isTemplate = project.metadata.isTemplate;
  const modifiedDate = new Date(project.metadata.modified);
  const createdDate = new Date(project.metadata.created);

  // Calculate project stats
  const getProjectStats = () => {
    const loads = project.loads || {};
    const settings = project.settings || {};
    const calculations = project.calculations || {};
    
    const generalCount = loads.generalLoads?.filter((l: any) => l.quantity > 0).length || 0;
    const hvacCount = loads.hvacLoads?.filter((l: any) => l.quantity > 0).length || 0;
    const evseCount = loads.evseLoads?.filter((l: any) => l.quantity > 0).length || 0;
    const solarCount = loads.solarBatteryLoads?.filter((l: any) => l.quantity > 0).length || 0;
    
    const totalLoads = generalCount + hvacCount + evseCount + solarCount;
    const mainBreaker = settings.mainBreaker || 0;
    const totalAmps = calculations.totalAmps || 0;
    const utilization = mainBreaker > 0 ? (totalAmps / mainBreaker) * 100 : 0;
    const isCompliant = utilization <= 100;
    
    return {
      totalLoads,
      loadBreakdown: { generalCount, hvacCount, evseCount, solarCount },
      mainBreaker,
      totalAmps,
      utilization,
      isCompliant,
      totalVA: calculations.totalVA || 0
    };
  };

  const stats = getProjectStats();

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showMenu]);

  const handleQuickAction = (action: () => void, event: React.MouseEvent) => {
    event.stopPropagation();
    action();
    setShowMenu(false);
  };

  const handleMenuToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    setShowMenu(prev => !prev);
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
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuToggle}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreVertical className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-36">
                <div className="py-1">
                  <button
                    onClick={(e) => handleQuickAction(() => onEdit(project), e)}
                    className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit Details
                  </button>
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

      {/* Enhanced Project Stats with Calc Results */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-2">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-medium text-gray-700">Active Loads</div>
            <div className="text-gray-600">{stats.totalLoads} items</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Service Size</div>
            <div className="text-gray-600">{stats.mainBreaker || '—'}A</div>
          </div>
        </div>
        
        {stats.totalAmps > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-medium text-gray-700">Calculated Load</div>
                <div className="text-gray-600">{stats.totalAmps.toFixed(1)}A</div>
              </div>
              <div>
                <div className="font-medium text-gray-700">Utilization</div>
                <div className={`font-medium ${
                  stats.isCompliant ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.utilization.toFixed(1)}%
                </div>
              </div>
            </div>
            
            {/* Compliance Indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              stats.isCompliant 
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                stats.isCompliant ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              {stats.isCompliant ? 'NEC Compliant' : 'Service Upgrade Needed'}
            </div>
            
            {/* Load Breakdown */}
            {stats.totalLoads > 0 && (
              <div className="flex gap-1 text-xs">
                {stats.loadBreakdown.generalCount > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    General: {stats.loadBreakdown.generalCount}
                  </span>
                )}
                {stats.loadBreakdown.hvacCount > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                    HVAC: {stats.loadBreakdown.hvacCount}
                  </span>
                )}
                {stats.loadBreakdown.evseCount > 0 && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                    EVSE: {stats.loadBreakdown.evseCount}
                  </span>
                )}
                {stats.loadBreakdown.solarCount > 0 && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                    Solar: {stats.loadBreakdown.solarCount}
                  </span>
                )}
              </div>
            )}
          </>
        )}
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
            onClick={(e) => handleQuickAction(() => onEdit(project), e)}
            className="px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 flex items-center justify-center"
            title="Edit Details"
          >
            <Edit3 className="h-3 w-3" />
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