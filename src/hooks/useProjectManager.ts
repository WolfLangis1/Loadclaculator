import { useState, useCallback, useEffect } from 'react';
import { dataStorage, type StoredProject } from '../services/dataStorageService';
import { useProjectSettings } from '../context/ProjectSettingsContext';
import { useLoadData } from '../context/LoadDataContext';
import { ProjectTemplateService, type ProjectTemplate } from '../services/projectTemplateService';

export interface ProjectManagerState {
  projects: StoredProject[];
  currentProject: StoredProject | null;
  isLoading: boolean;
  error: string | null;
  autoSaveEnabled: boolean;
}

export const useProjectManager = () => {
  const { settings, updateProjectInfo, updateCalculationSettings } = useProjectSettings();
  const { loads, resetLoads } = useLoadData();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [currentProject, setCurrentProject] = useState<StoredProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  /**
   * Load all saved projects
   */
  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const savedProjects = await dataStorage.getAllProjects();
      setProjects(savedProjects.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save current project
   */
  const saveProject = useCallback(async (projectName?: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentState = { ...settings, loads };
      const projectId = await dataStorage.saveProject(currentState, projectName);
      
      // Update projects list
      await loadProjects();
      
      // Update current project
      const savedProject = await dataStorage.loadProject(projectId);
      setCurrentProject(savedProject);
      
      return projectId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
      console.error('Error saving project:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [settings, loads, loadProjects]);

  /**
   * Load a specific project
   */
  const loadProject = useCallback(async (projectId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const project = await dataStorage.loadProject(projectId);
      
      if (!project) {
        setError('Project not found');
        return false;
      }

      // Update the current application state with the loaded project
      const projectState = project.state;
      
      // Update project information
      updateProjectInfo(projectState.projectInfo);
      
      // Update loads
      if (projectState.loads) {
        resetLoads(projectState.loads);
      }
      
      // Update settings (excluding loads and projectInfo which are handled separately)
      updateCalculationSettings({
        squareFootage: projectState.squareFootage,
        codeYear: projectState.codeYear,
        calculationMethod: projectState.calculationMethod,
        mainBreaker: projectState.mainBreaker,
        panelDetails: projectState.panelDetails,
        actualDemandData: projectState.actualDemandData,
        useEMS: projectState.useEMS,
        emsMaxLoad: projectState.emsMaxLoad,
        loadManagementType: projectState.loadManagementType,
        loadManagementMaxLoad: projectState.loadManagementMaxLoad,
        simpleSwitchMode: projectState.simpleSwitchMode,
        simpleSwitchLoadA: projectState.simpleSwitchLoadA,
        simpleSwitchLoadB: projectState.simpleSwitchLoadB,
        showAdvanced: projectState.showAdvanced,
        activeTab: projectState.activeTab,
        attachments: projectState.attachments || [],
        attachmentStats: projectState.attachmentStats || {
          total: 0,
          byType: {},
          bySource: {},
          markedForExport: 0,
          totalFileSize: 0
        }
      });

      setCurrentProject(project);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      console.error('Error loading project:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [updateProjectInfo, updateCalculationSettings, resetLoads]);

  /**
   * Delete a project
   */
  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await dataStorage.deleteProject(projectId);
      
      if (success) {
        await loadProjects();
        
        // Clear current project if it was deleted
        if (currentProject?.id === projectId) {
          setCurrentProject(null);
        }
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      console.error('Error deleting project:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjects, currentProject]);

  /**
   * Create a new project (reset current state)
   */
  const createNewProject = useCallback(() => {
    setCurrentProject(null);
    // Reset to default state would be handled by the context
    window.location.reload(); // Simple reset for now
  }, []);

  /**
   * Create a new project from template
   */
  const createProjectFromTemplate = useCallback(async (template: ProjectTemplate, projectName?: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Apply template to get initial state
      const templateState = ProjectTemplateService.applyTemplate(template.id);
      if (!templateState) {
        throw new Error('Failed to apply template');
      }

      // Create the new state from template (template service provides complete state)
      const newState = templateState as LoadCalculatorState;

      // Generate project name if not provided
      const finalProjectName = projectName || `${template.name} - ${new Date().toLocaleDateString()}`;

      // Save the new project
      const projectId = await dataStorage.saveProject(newState, finalProjectName);
      
      // Load the saved project to apply it to current state
      const success = await loadProject(projectId);
      
      return success ? projectId : null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project from template');
      console.error('Error creating project from template:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadProject]);

  /**
   * Auto-save current project
   */
  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled || !currentProject) return;
    
    try {
      const currentState = { ...settings, loads };
      await dataStorage.saveProject(currentState, currentProject.name + ' (Auto-saved)');
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [settings, loads, currentProject, autoSaveEnabled]);

  /**
   * Export project to JSON
   */
  const exportProject = useCallback(async (projectId: string): Promise<string | null> => {
    try {
      return await dataStorage.exportProjectData(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export project');
      return null;
    }
  }, []);

  /**
   * Import project from JSON
   */
  const importProject = useCallback(async (jsonData: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectId = await dataStorage.importProjectData(jsonData);
      await loadProjects();
      return projectId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjects]);

  /**
   * Get storage statistics
   */
  const getStorageStats = useCallback(async () => {
    try {
      return await dataStorage.getStorageStats();
    } catch (err) {
      console.error('Error getting storage stats:', err);
      return null;
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Set up auto-save
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      autoSave();
    }, 5 * 60 * 1000); // Auto-save every 5 minutes

    return () => clearInterval(interval);
  }, [autoSave, autoSaveEnabled]);

  return {
    // State
    projects,
    currentProject,
    isLoading,
    error,
    autoSaveEnabled,

    // Actions
    loadProjects,
    saveProject,
    loadProject,
    deleteProject,
    createNewProject,
    createProjectFromTemplate,
    exportProject,
    importProject,
    getStorageStats,

    // Settings
    setAutoSaveEnabled,
    
    // Utility
    clearError: () => setError(null)
  };
};