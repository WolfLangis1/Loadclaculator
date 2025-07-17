import type { LoadCalculatorState } from '../types';
import type { ProjectAttachment } from '../types/attachment';
import { IndexedDBHelper } from './indexedDBHelper';
import { LocalStorageHelper } from './localStorageHelper';

export interface StoredProject {
  id: string;
  name: string;
  state: LoadCalculatorState;
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export interface StoredSettings {
  theme: 'light' | 'dark';
  defaultCodeYear: string;
  defaultCalculationMethod: string;
  autoSave: boolean;
  autoSaveInterval: number; // minutes
}

export class DataStorageService {
  private indexedDBHelper: IndexedDBHelper;
  private localStorageHelper: LocalStorageHelper;
  private isIndexedDBPreferred: boolean = false;

  constructor() {
    this.indexedDBHelper = new IndexedDBHelper();
    this.localStorageHelper = new LocalStorageHelper();
    this.checkIndexedDBSupport();
  }

  private async checkIndexedDBSupport(): Promise<void> {
    try {
      await this.indexedDBHelper.initializeDB();
      this.isIndexedDBPreferred = true;
      console.log('IndexedDB is supported and preferred.');
    } catch (error) {
      this.isIndexedDBPreferred = false;
      console.warn('IndexedDB not fully supported or initialized, falling back to localStorage.', error);
    }
  }

  async saveProject(projectState: LoadCalculatorState, projectName?: string): Promise<string> {
    const projectId = this.generateProjectId(projectState);
    const now = new Date();
    
    const project: StoredProject = {
      id: projectId,
      name: projectName || this.generateProjectName(projectState),
      state: projectState,
      createdAt: now,
      updatedAt: now,
      version: '1.0'
    };

    if (this.isIndexedDBPreferred) {
      try {
        return await this.indexedDBHelper.saveProject(project);
      } catch (error) {
        console.warn('IndexedDB save failed, falling back to localStorage:', error);
      }
    }
    return this.localStorageHelper.saveProject(project);
  }

  async loadProject(projectId: string): Promise<StoredProject | null> {
    if (this.isIndexedDBPreferred) {
      try {
        const project = await this.indexedDBHelper.loadProject(projectId);
        if (project) return project;
      } catch (error) {
        console.warn('IndexedDB load failed, trying localStorage:', error);
      }
    }
    return this.localStorageHelper.loadProject(projectId);
  }

  async getAllProjects(): Promise<StoredProject[]> {
    if (this.isIndexedDBPreferred) {
      try {
        return await this.indexedDBHelper.getAllProjects();
      } catch (error) {
        console.warn('IndexedDB getAll failed, trying localStorage:', error);
      }
    }
    return this.localStorageHelper.getAllProjects();
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (this.isIndexedDBPreferred) {
      try {
        await this.indexedDBHelper.deleteProject(projectId);
        return true;
      } catch (error) {
        console.warn('IndexedDB delete failed, trying localStorage:', error);
      }
    }
    return this.localStorageHelper.deleteProject(projectId);
  }

  async saveAttachments(projectId: string, attachments: ProjectAttachment[]): Promise<void> {
    if (this.isIndexedDBPreferred) {
      try {
        return await this.indexedDBHelper.saveAttachments(projectId, attachments);
      } catch (error) {
        console.warn('IndexedDB save attachments failed, falling back to localStorage:', error);
      }
    }
    return this.localStorageHelper.saveAttachments(projectId, attachments);
  }

  setupAutoSave(projectState: LoadCalculatorState, interval: number = 5): void {
    setInterval(() => {
      this.saveProject(projectState, 'Auto-saved Project');
    }, interval * 60 * 1000);
  }

  private generateProjectId(projectState: LoadCalculatorState): string {
    const customer = projectState.projectInfo.customerName || 'Unknown';
    const address = projectState.projectInfo.propertyAddress || 'Unknown';
    const timestamp = Date.now();
    return `${customer}_${address}_${timestamp}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private generateProjectName(projectState: LoadCalculatorState): string {
    const customer = projectState.projectInfo.customerName || 'Unnamed Project';
    const date = new Date().toLocaleDateString();
    return `${customer} - ${date}`;
  }

  async exportProjectData(projectId: string): Promise<string> {
    const project = await this.loadProject(projectId);
    if (!project) throw new Error('Project not found');
    return JSON.stringify(project, null, 2);
  }

  async importProjectData(jsonData: string): Promise<string> {
    try {
      const project: StoredProject = JSON.parse(jsonData);
      return await this.saveProject(project.state, project.name);
    } catch (error) {
      throw new Error('Invalid project data format');
    }
  }

  async getStorageStats(): Promise<{
    projectCount: number;
    totalSize: number;
    storageType: 'IndexedDB' | 'localStorage';
  }> {
    const projects = await this.getAllProjects();
    const totalSize = JSON.stringify(projects).length;

    return {
      projectCount: projects.length,
      totalSize,
      storageType: this.isIndexedDBPreferred ? 'IndexedDB' : 'localStorage'
    };
  }
}

export const dataStorage = new DataStorageService();
