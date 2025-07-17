import type { StoredProject, ProjectAttachment, StoredSettings } from '../types';

const PROJECT_STORAGE_KEY = 'loadCalculatorProjects';
const ATTACHMENT_STORAGE_PREFIX = 'attachments_';
const SETTINGS_STORAGE_KEY = 'loadCalculatorSettings';

export class LocalStorageHelper {
  private isLocalStorageSupported: boolean = false;

  constructor() {
    this.isLocalStorageSupported = this.checkLocalStorageSupport();
  }

  private checkLocalStorageSupport(): boolean {
    try {
      const testKey = 'test';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('localStorage is not available', e);
      return false;
    }
  }

  async saveProject(project: StoredProject): Promise<string> {
    if (!this.isLocalStorageSupported) throw new Error('LocalStorage not supported');
    const projects = this.getAllProjects();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(projects));
    return project.id;
  }

  async loadProject(projectId: string): Promise<StoredProject | null> {
    if (!this.isLocalStorageSupported) return null;
    const projects = this.getAllProjects();
    return projects.find(p => p.id === projectId) || null;
  }

  async getAllProjects(): Promise<StoredProject[]> {
    if (!this.isLocalStorageSupported) return [];
    try {
      const data = localStorage.getItem(PROJECT_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return [];
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (!this.isLocalStorageSupported) return false;
    const projects = await this.getAllProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    
    if (filteredProjects.length < projects.length) {
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(filteredProjects));
      return true;
    }
    return false;
  }

  async saveAttachments(projectId: string, attachments: ProjectAttachment[]): Promise<void> {
    if (!this.isLocalStorageSupported) throw new Error('LocalStorage not supported');
    const key = `${ATTACHMENT_STORAGE_PREFIX}${projectId}`;
    localStorage.setItem(key, JSON.stringify(attachments));
  }

  async getSetting(key: string): Promise<StoredSettings | null> {
    if (!this.isLocalStorageSupported) return null;
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      const settings = data ? JSON.parse(data) : {};
      return settings[key] || null;
    } catch (error) {
      console.error('Error parsing localStorage settings:', error);
      return null;
    }
  }

  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.isLocalStorageSupported) throw new Error('LocalStorage not supported');
    const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings = data ? JSON.parse(data) : {};
    settings[key] = value;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }
}
