import { dataStorage, type StoredProject } from './dataStorageService';
import { ProjectTemplateService, type DetailedProjectTemplate } from './projectService';
import type { LoadCalculatorState } from '../types';

export const projectDataService = {
  getAllProjects: async (): Promise<StoredProject[]> => {
    const projects = await dataStorage.getAllProjects();
    return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  saveProject: async (state: LoadCalculatorState, projectName?: string): Promise<string | null> => {
    return dataStorage.saveProject(state, projectName);
  },

  loadProject: async (projectId: string): Promise<StoredProject | null> => {
    return dataStorage.loadProject(projectId);
  },

  deleteProject: async (projectId: string): Promise<boolean> => {
    return dataStorage.deleteProject(projectId);
  },

  createProjectFromTemplate: async (template: DetailedProjectTemplate, projectName?: string): Promise<string | null> => {
    const templateState = ProjectTemplateService.applyTemplate(template.id);
    if (!templateState) {
      throw new Error('Failed to apply template');
    }
    const newState = templateState as LoadCalculatorState;
    const finalProjectName = projectName || `${template.name} - ${new Date().toLocaleDateString()}`;
    return dataStorage.saveProject(newState, finalProjectName);
  },

  exportProject: async (projectId: string): Promise<string | null> => {
    return dataStorage.exportProjectData(projectId);
  },

  importProject: async (jsonData: string): Promise<string | null> => {
    return dataStorage.importProjectData(jsonData);
  },

  getStorageStats: async () => {
    return dataStorage.getStorageStats();
  },
};
