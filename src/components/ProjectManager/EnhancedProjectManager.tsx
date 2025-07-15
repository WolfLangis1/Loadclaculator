/**
 * Enhanced Project Manager
 * 
 * Comprehensive project management with templates, persistence, and caching
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Copy, 
  Trash2, 
  Star, 
  Calendar,
  Tag,
  FolderOpen,
  Save,
  Settings,
  Image as ImageIcon,
  FileText as TemplateIcon,
  BarChart3,
  FileText,
  ChevronDown,
  ChevronRight,
  Eye,
  Edit3,
  Share2
} from 'lucide-react';
import { projectService, type ProjectData, type ProjectTemplate } from '../../services/projectService';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useSLDData } from '../../context/SLDDataContext';

interface EnhancedProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectLoad?: (project: ProjectData) => void;
}

type ViewMode = 'grid' | 'list' | 'timeline';
type SortBy = 'modified' | 'created' | 'name' | 'size';
type FilterBy = 'all' | 'recent' | 'templates' | 'favorites';

export const EnhancedProjectManager: React.FC<EnhancedProjectManagerProps> = ({
  isOpen,
  onClose,
  onProjectLoad
}) => {
  const { settings, updateSettings } = useProjectSettings();
  const { loads, updateLoads } = useLoadData();
  const { state: sldState, updateDiagram } = useSLDData();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('modified');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'projects' | 'templates' | 'statistics'>('projects');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  // Load data on mount
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = useCallback(() => {
    setProjects(projectService.getAllProjects());
    setTemplates(projectService.getAllTemplates());
    setStatistics(projectService.getProjectStatistics());
  }, []);

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = projects;

    // Apply search filter
    if (searchQuery) {
      filtered = projectService.searchProjects(searchQuery);
    }

    // Apply category filter
    switch (filterBy) {
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(p => new Date(p.metadata.modified) > weekAgo);
        break;
      case 'templates':
        filtered = filtered.filter(p => p.metadata.isTemplate);
        break;
      case 'favorites':
        filtered = filtered.filter(p => p.metadata.tags.includes('favorite'));
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.metadata.name.localeCompare(b.metadata.name);
        case 'created':
          return new Date(b.metadata.created).getTime() - new Date(a.metadata.created).getTime();
        case 'modified':
          return new Date(b.metadata.modified).getTime() - new Date(a.metadata.modified).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, searchQuery, filterBy, sortBy]);

  // Template categories
  const templateCategories = useMemo(() => {
    const categories = new Map<string, ProjectTemplate[]>();
    templates.forEach(template => {
      const category = template.category;
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(template);
    });
    return categories;
  }, [templates]);

  // Handlers
  const handleCreateProject = useCallback((name: string, templateId?: string) => {
    const newProject = projectService.createProject(name, templateId);
    refreshData();
    setShowCreateModal(false);
    if (onProjectLoad) {
      onProjectLoad(newProject);
    }
  }, [refreshData, onProjectLoad]);

  const handleLoadProject = useCallback((project: ProjectData) => {
    if (onProjectLoad) {
      onProjectLoad(project);
    }
    onClose();
  }, [onProjectLoad, onClose]);

  const handleDuplicateProject = useCallback((projectId: string) => {
    const original = projectService.getProject(projectId);
    if (original) {
      projectService.duplicateProject(projectId, `${original.metadata.name} (Copy)`);
      refreshData();
    }
  }, [refreshData]);

  const handleDeleteProject = useCallback((projectId: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      projectService.deleteProject(projectId);
      refreshData();
    }
  }, [refreshData]);

  const handleToggleFavorite = useCallback((projectId: string) => {
    const project = projectService.getProject(projectId);
    if (project) {
      const tags = project.metadata.tags;
      const isFavorite = tags.includes('favorite');
      const newTags = isFavorite 
        ? tags.filter(tag => tag !== 'favorite')
        : [...tags, 'favorite'];
      
      projectService.updateProject(projectId, {
        metadata: { ...project.metadata, tags: newTags }
      });
      refreshData();
    }
  }, [refreshData]);

  const handleExportProject = useCallback((projectId: string) => {
    const exportData = projectService.exportProject(projectId);
    if (exportData) {
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-${projectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  const handleImportProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (projectService.importProject(content)) {
          refreshData();
        } else {
          alert('Failed to import project. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  }, [refreshData]);

  const handleCreateTemplate = useCallback((projectId: string, templateName: string, category: ProjectTemplate['category']) => {
    const template = projectService.createTemplateFromProject(projectId, templateName, category);
    if (template) {
      refreshData();
      setShowTemplateModal(false);
    }
  }, [refreshData]);

  // Save current project state
  const handleSaveCurrentProject = useCallback(() => {
    const currentProjectId = settings.currentProjectId || `project-${Date.now()}`;
    
    const projectData: ProjectData = {
      metadata: {
        id: currentProjectId,
        name: settings.projectName || 'Untitled Project',
        description: '',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        version: '1.0.0',
        author: 'Load Calculator User',
        isTemplate: false,
        tags: []
      },
      settings,
      loads,
      sldDiagram: sldState.diagram,
      aerialView: null,
      calculations: {},
      reports: {},
      assets: {
        logos: {},
        images: {},
        documents: {}
      }
    };

    if (projectService.getProject(currentProjectId)) {
      projectService.updateProject(currentProjectId, projectData);
    } else {
      projectService.createProject(projectData.metadata.name);
      projectService.updateProject(currentProjectId, projectData);
    }

    refreshData();
  }, [settings, loads, sldState.diagram]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Project Manager</h2>
            <span className="text-sm text-gray-500">
              {statistics?.totalProjects || 0} projects, {statistics?.totalTemplates || 0} templates
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCurrentProject}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Current
            </button>
            
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImportProject}
                className="hidden"
              />
            </label>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'projects', label: 'Projects', icon: FolderOpen },
            { id: 'templates', label: 'Templates', icon: TemplateIcon },
            { id: 'statistics', label: 'Statistics', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'projects' && (
            <div className="h-full flex flex-col">
              {/* Toolbar */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value as FilterBy)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Projects</option>
                    <option value="recent">Recent</option>
                    <option value="favorites">Favorites</option>
                    <option value="templates">Templates</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="modified">Last Modified</option>
                    <option value="created">Date Created</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {(['grid', 'list'] as ViewMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`px-3 py-2 text-sm capitalize ${
                          viewMode === mode
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    New Project
                  </button>
                </div>
              </div>

              {/* Projects Grid/List */}
              <div className="flex-1 overflow-auto p-4">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredAndSortedProjects.map(project => (
                      <ProjectCard
                        key={project.metadata.id}
                        project={project}
                        onLoad={handleLoadProject}
                        onDuplicate={handleDuplicateProject}
                        onDelete={handleDeleteProject}
                        onToggleFavorite={handleToggleFavorite}
                        onExport={handleExportProject}
                        onCreateTemplate={() => setShowTemplateModal(true)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAndSortedProjects.map(project => (
                      <ProjectListItem
                        key={project.metadata.id}
                        project={project}
                        onLoad={handleLoadProject}
                        onDuplicate={handleDuplicateProject}
                        onDelete={handleDeleteProject}
                        onToggleFavorite={handleToggleFavorite}
                        onExport={handleExportProject}
                      />
                    ))}
                  </div>
                )}

                {filteredAndSortedProjects.length === 0 && (
                  <div className="text-center py-12">
                    <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery ? 'Try adjusting your search criteria.' : 'Create your first project to get started.'}
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create New Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="h-full overflow-auto p-4">
              <div className="space-y-6">
                {Array.from(templateCategories.entries()).map(([category, categoryTemplates]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 capitalize flex items-center gap-2">
                      <span className="text-2xl">
                        {category === 'residential' && '🏠'}
                        {category === 'commercial' && '🏢'}
                        {category === 'industrial' && '🏭'}
                        {category === 'solar' && '☀️'}
                        {category === 'evse' && '🚗'}
                        {category === 'custom' && '📋'}
                      </span>
                      {category} Templates
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {categoryTemplates.map(template => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onUse={(templateId) => {
                            setSelectedTemplate(templateId);
                            setShowCreateModal(true);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="h-full overflow-auto p-6">
              <StatisticsView statistics={statistics} />
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTemplate('');
          }}
          onCreate={handleCreateProject}
          templates={templates}
          preselectedTemplate={selectedTemplate}
        />
      )}

      {/* Create Template Modal */}
      {showTemplateModal && (
        <CreateTemplateModal
          isOpen={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          projects={projects}
          onCreate={handleCreateTemplate}
        />
      )}
    </div>
  );
};

// Sub-components would go here (ProjectCard, ProjectListItem, TemplateCard, etc.)
// Due to length constraints, I'll create these as separate files

export default EnhancedProjectManager;