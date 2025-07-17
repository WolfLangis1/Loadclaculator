import { useState, useCallback, useEffect } from 'react';
import { projectDataService } from '../services/projectDataService';
import { useProjectSettings } from '../context/ProjectSettingsContext';
import { useLoadData } from '../context/LoadDataContext';
import type { StoredProject } from '../services/dataStorageService';
import type { DetailedProjectTemplate } from '../services/projectService';
import type { LoadCalculatorState } from '../types';

export interface ProjectManagerState {
  projects: StoredProject[];
  currentProject: StoredProject | null;
  isLoading: boolean;
  error: string | null;
  autoSaveEnabled: boolean;
}

export const useProjectManager = () => {
  const { settings, updateProjectInfo, updateCalculationSettings, updatePanelDetails, updateLoadManagement, updateActualDemandData } = useProjectSettings();
  const { loads, resetLoads } = useLoadData();
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [currentProject, setCurrentProject] = useState<StoredProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const savedProjects = await projectDataService.getAllProjects();
      setProjects(savedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
      console.error('Error loading projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProject = useCallback(async (projectName?: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentState: LoadCalculatorState = { ...settings, loads };
      const projectId = await projectDataService.saveProject(currentState, projectName);
      
      await loadProjects();
      
      const savedProject = await projectDataService.loadProject(projectId);
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

  const loadProject = useCallback(async (projectId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const project = await projectDataService.loadProject(projectId);
      
      if (!project) {
        setError('Project not found');
        return false;
      }

      const projectState = project.state;
      
      updateProjectInfo(projectState.projectInfo);
      
      if (projectState.loads) {
        resetLoads(projectState.loads);
      }
      
      updateCalculationSettings({
        squareFootage: projectState.squareFootage,
        codeYear: projectState.codeYear,
        calculationMethod: projectState.calculationMethod,
        mainBreaker: projectState.mainBreaker,
      });
      updatePanelDetails(projectState.panelDetails);
      updateActualDemandData(projectState.actualDemandData);
      updateLoadManagement({
        useEMS: projectState.useEMS,
        emsMaxLoad: projectState.emsMaxLoad,
        loadManagementType: projectState.loadManagementType,
        loadManagementMaxLoad: projectState.loadManagementMaxLoad,
        simpleSwitchMode: projectState.simpleSwitchMode,
        simpleSwitchLoadA: projectState.simpleSwitchLoadA,
        simpleSwitchLoadB: projectState.simpleSwitchLoadB,
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
  }, [updateProjectInfo, updateCalculationSettings, updatePanelDetails, updateActualDemandData, updateLoadManagement, resetLoads]);

  const deleteProject = useCallback(async (projectId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const success = await projectDataService.deleteProject(projectId);
      
      if (success) {
        await loadProjects();
        
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

  const createNewProject = useCallback(() => {
    setCurrentProject(null);
    window.location.reload();
  }, []);

  const createProjectFromTemplate = useCallback(async (template: DetailedProjectTemplate, projectName?: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectId = await projectDataService.createProjectFromTemplate(template, projectName);
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

  const autoSave = useCallback(async () => {
    if (!autoSaveEnabled || !currentProject) return;
    
    try {
      const currentState: LoadCalculatorState = { ...settings, loads };
      await projectDataService.saveProject(currentState, currentProject.name + ' (Auto-saved)');
    } catch (err) {
      console.error('Auto-save failed:', err);
    }
  }, [settings, loads, currentProject, autoSaveEnabled]);

  const exportProject = useCallback(async (projectId: string): Promise<string | null> => {
    try {
      return await projectDataService.exportProject(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export project');
      return null;
    }
  }, []);

  const importProject = useCallback(async (jsonData: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const projectId = await projectDataService.importProject(jsonData);
      await loadProjects();
      return projectId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjects]);

  const getStorageStats = useCallback(async () => {
    try {
      return await projectDataService.getStorageStats();
    } catch (err) {
      console.error('Error getting storage stats:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (!autoSaveEnabled) return;

    const interval = setInterval(() => {
      autoSave();
    }, 5 * 60 * 1000); // Auto-save every 5 minutes

    return () => clearInterval(interval);
  }, [autoSave, autoSaveEnabled]);

  return {
    projects,
    currentProject,
    isLoading,
    error,
    autoSaveEnabled,

    loadProjects,
    saveProject,
    loadProject,
    deleteProject,
    createNewProject,
    createProjectFromTemplate,
    exportProject,
    importProject,
    getStorageStats,

    setAutoSaveEnabled,
    
    clearError: () => setError(null)
  };
};