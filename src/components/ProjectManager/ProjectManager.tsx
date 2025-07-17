import React, { useState } from 'react';
import { 
  Save, 
  FolderOpen, 
  Plus, 
  Download, 
  Upload, 
  X,
  AlertCircle,
  Check,
  Star
} from 'lucide-react';
import { useProjectManager } from '../../hooks/useProjectManager';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { TemplateSelector } from './TemplateSelector';
import { SaveProjectDialog } from './SaveProjectDialog';
import { ProjectListItem } from './ProjectListItem';
import { type DetailedProjectTemplate } from '../../services/projectService';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ isOpen, onClose }) => {
  const { settings } = useProjectSettings();
  const {
    projects,
    currentProject,
    isLoading,
    error,
    autoSaveEnabled,
    saveProject,
    loadProject,
    deleteProject,
    createNewProject,
    createProjectFromTemplate,
    exportProject,
    importProject,
    setAutoSaveEnabled,
    clearError
  } = useProjectManager();

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const [importData, setImportData] = useState('');

  if (!isOpen) return null;

  const handleSaveProject = async (name: string) => {
    const projectId = await saveProject(name);
    if (projectId) {
      setSaveDialogOpen(false);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    const success = await loadProject(projectId);
    if (success) {
      onClose();
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        const success = await deleteProject(projectId);
        if (!success) {
          throw new Error('Delete operation returned false');
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const handleExportProject = async (projectId: string) => {
    const data = await exportProject(projectId);
    if (data) {
      downloadFile(data, `project_${projectId}.json`, 'application/json');
    }
  };

  const handleImportProject = async () => {
    if (importData) {
      const projectId = await importProject(importData);
      if (projectId) {
        setImportData('');
        alert('Project imported successfully!');
      }
    }
  };

  const handleTemplateSelect = async (template: DetailedProjectTemplate) => {
    const projectId = await createProjectFromTemplate(template);
    if (projectId) {
      onClose(); // Close the project manager
    }
  };

  const downloadFile = (content: string, filename: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateDefaultProjectName = () => {
    const customer = settings.projectInfo.customerName || 'Unnamed Project';
    const date = new Date().toLocaleDateString();
    return `${customer} - ${date}`;
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Project Manager</h2>
                <p className="text-blue-100">Save, load, and manage your electrical projects</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Sidebar */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-4">
              {/* Quick Actions */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setSaveDialogOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Save Current Project
                  </button>
                  
                  <button
                    onClick={createNewProject}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    New Blank Project
                  </button>
                  
                  <button
                    onClick={() => setTemplateSelectorOpen(true)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Star className="h-4 w-4" />
                    Use Template
                  </button>
                </div>
              </div>

              {/* Settings */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Settings</h3>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Auto-save (every 5 min)</span>
                </label>
              </div>

              {/* Import/Export */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Import/Export</h3>
                <div className="space-y-2">
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder="Paste project JSON data here..."
                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded text-xs"
                  />
                  <button
                    onClick={handleImportProject}
                    disabled={!importData}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Import Project
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-red-800">{error}</span>
                <button onClick={clearError} className="ml-auto text-red-600 hover:text-red-800">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Current Project */}
            {currentProject && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Currently Working On</span>
                </div>
                <div className="text-blue-800">
                  <div className="font-medium">{currentProject.name}</div>
                  <div className="text-sm">Last updated: {formatDate(currentProject.updatedAt)}</div>
                </div>
              </div>
            )}

            {/* Projects List */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Saved Projects ({projects.length})</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading projects...</span>
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No saved projects yet</p>
                  <p className="text-sm">Save your current project to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <ProjectListItem
                      key={project.id}
                      project={project}
                      currentProjectId={currentProject?.id}
                      onLoadProject={handleLoadProject}
                      onExportProject={handleExportProject}
                      onDeleteProject={handleDeleteProject}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Project Dialog */}
      <SaveProjectDialog
        isOpen={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        onSave={handleSaveProject}
        isLoading={isLoading}
      />

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={templateSelectorOpen}
        onClose={() => setTemplateSelectorOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />
    </div>
  );
};