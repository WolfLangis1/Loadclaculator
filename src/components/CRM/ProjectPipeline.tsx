import React, { useState, useEffect, useRef } from 'react';
import { Plus, DollarSign, Calendar, User, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import type { CRMProject, CRMStage, ProjectPriority } from '../../types/crm';

interface ProjectCardProps {
  project: CRMProject;
  onEdit: (project: CRMProject) => void;
  onDelete: (project: CRMProject) => void;
  onDragStart: (e: React.DragEvent, project: CRMProject) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onEdit, onDelete, onDragStart }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const getPriorityColor = (priority: ProjectPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, project)}
      className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {project.customer?.name || 'Unknown Customer'}
          </h4>
          {project.customer?.company && (
            <p className="text-sm text-gray-600 truncate">{project.customer.company}</p>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="h-3 w-3" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {project.value && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-600">
              ${project.value.toLocaleString()}
            </span>
          </div>
        )}

        {project.expected_close_date && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Due {formatDate(project.expected_close_date)}</span>
          </div>
        )}

        {project.assigned_user && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{project.assigned_user.name}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(project.priority)}`}>
            {project.priority}
          </span>
          
          {project.probability && (
            <span className="text-xs text-gray-500">
              {project.probability}% probability
            </span>
          )}
        </div>

        {project.tags && project.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {project.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 2 && (
              <span className="px-2 py-1 text-xs text-gray-500">
                +{project.tags.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface StageColumnProps {
  stage: CRMStage;
  projects: CRMProject[];
  onAddProject: (stageId: string) => void;
  onEditProject: (project: CRMProject) => void;
  onDeleteProject: (project: CRMProject) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onProjectDragStart: (e: React.DragEvent, project: CRMProject) => void;
}

const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  projects,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onDrop,
  onDragOver,
  onProjectDragStart
}) => {
  const totalValue = projects.reduce((sum, project) => sum + (project.value || 0), 0);

  return (
    <div className="flex-shrink-0 w-80 bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            {stage.name}
            <span className="text-sm text-gray-500">({projects.length})</span>
          </h3>
          {totalValue > 0 && (
            <p className="text-sm text-gray-600">
              ${totalValue.toLocaleString()} total
            </p>
          )}
        </div>
        
        <button
          onClick={() => onAddProject(stage.id)}
          className="p-1 text-gray-400 hover:text-gray-600 rounded"
          title="Add project to this stage"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div
        className="space-y-3 min-h-96"
        onDrop={(e) => onDrop(e, stage.id)}
        onDragOver={onDragOver}
      >
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onEdit={onEditProject}
            onDelete={onDeleteProject}
            onDragStart={onProjectDragStart}
          />
        ))}
        
        {projects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">No projects in this stage</p>
            <button
              onClick={() => onAddProject(stage.id)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Add first project
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectPipeline: React.FC = () => {
  const { 
    stages, 
    projects, 
    loading, 
    loadStages, 
    loadProjects,
    moveProjectStage,
    deleteProject 
  } = useCRM();
  
  const [draggedProject, setDraggedProject] = useState<CRMProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStages();
    loadProjects();
  }, [loadStages, loadProjects]);

  const handleProjectDragStart = (e: React.DragEvent, project: CRMProject) => {
    setDraggedProject(project);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, newStageId: string) => {
    e.preventDefault();
    
    if (!draggedProject || draggedProject.stage_id === newStageId) {
      setDraggedProject(null);
      return;
    }

    try {
      setError(null);
      await moveProjectStage(draggedProject.id, newStageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move project');
    } finally {
      setDraggedProject(null);
    }
  };

  const handleAddProject = (stageId: string) => {
    // TODO: Open project creation modal with pre-selected stage
    console.log('Add project to stage:', stageId);
  };

  const handleEditProject = (project: CRMProject) => {
    // TODO: Open project edit modal
    console.log('Edit project:', project);
  };

  const handleDeleteProject = async (project: CRMProject) => {
    if (window.confirm(`Are you sure you want to delete this project for ${project.customer?.name}?`)) {
      try {
        await deleteProject(project.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete project');
      }
    }
  };

  const getProjectsByStage = (stageId: string) => {
    return projects.filter(project => project.stage_id === stageId);
  };

  if (loading.projects || loading.dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Project Pipeline</h2>
          <p className="text-sm text-gray-600">
            Drag and drop projects between stages to update their status
          </p>
        </div>
        
        <button
          onClick={() => handleAddProject(stages[0]?.id)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Pipeline */}
      <div className="overflow-x-auto">
        <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              projects={getProjectsByStage(stage.id)}
              onAddProject={handleAddProject}
              onEditProject={handleEditProject}
              onDeleteProject={handleDeleteProject}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onProjectDragStart={handleProjectDragStart}
            />
          ))}
        </div>
      </div>

      {stages.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pipeline stages</h3>
          <p className="text-gray-600 mb-4">
            Pipeline stages will be created automatically when you first access the CRM system.
          </p>
          <button
            onClick={() => loadStages()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Initialize Pipeline
          </button>
        </div>
      )}

      {projects.length === 0 && stages.length > 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-600 mb-4">
            Start by creating your first project to begin tracking your sales pipeline.
          </p>
        </div>
      )}
    </div>
  );
};