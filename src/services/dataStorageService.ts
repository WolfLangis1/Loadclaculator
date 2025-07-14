/**
 * Data Storage Service
 * Provides offline-first data persistence using IndexedDB with localStorage fallback
 * Supports project data, attachments, and user preferences
 */

import type { LoadCalculatorState } from '../context/LoadCalculatorContext';
import type { ProjectAttachment } from '../types';

// IndexedDB configuration
const DB_NAME = 'LoadCalculatorDB';
const DB_VERSION = 1;
const PROJECT_STORE = 'projects';
const ATTACHMENT_STORE = 'attachments';
const SETTINGS_STORE = 'settings';

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
  private db: IDBDatabase | null = null;
  private isIndexedDBSupported: boolean = false;

  constructor() {
    this.isIndexedDBSupported = this.checkIndexedDBSupport();
    this.initializeDB();
  }

  /**
   * Check if IndexedDB is supported in the current browser
   */
  private checkIndexedDBSupport(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window && indexedDB !== null;
  }

  /**
   * Initialize IndexedDB database
   */
  private async initializeDB(): Promise<void> {
    if (!this.isIndexedDBSupported) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      return;
    }

    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.error('Error opening IndexedDB:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('IndexedDB initialized successfully');
          resolve();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;

          // Create project store
          if (!db.objectStoreNames.contains(PROJECT_STORE)) {
            const projectStore = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
            projectStore.createIndex('name', 'name', { unique: false });
            projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // Create attachment store
          if (!db.objectStoreNames.contains(ATTACHMENT_STORE)) {
            const attachmentStore = db.createObjectStore(ATTACHMENT_STORE, { keyPath: 'id' });
            attachmentStore.createIndex('projectId', 'projectId', { unique: false });
            attachmentStore.createIndex('type', 'type', { unique: false });
          }

          // Create settings store
          if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
            db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
          }
        };
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
    }
  }

  /**
   * Save project to IndexedDB or localStorage
   */
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

    if (this.isIndexedDBSupported && this.db) {
      try {
        return await this.saveProjectToIndexedDB(project);
      } catch (error) {
        console.warn('Failed to save to IndexedDB, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.saveProjectToLocalStorage(project);
  }

  /**
   * Load project by ID
   */
  async loadProject(projectId: string): Promise<StoredProject | null> {
    if (this.isIndexedDBSupported && this.db) {
      try {
        return await this.loadProjectFromIndexedDB(projectId);
      } catch (error) {
        console.warn('Failed to load from IndexedDB, trying localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.loadProjectFromLocalStorage(projectId);
  }

  /**
   * Get all saved projects
   */
  async getAllProjects(): Promise<StoredProject[]> {
    if (this.isIndexedDBSupported && this.db) {
      try {
        return await this.getAllProjectsFromIndexedDB();
      } catch (error) {
        console.warn('Failed to load from IndexedDB, trying localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.getAllProjectsFromLocalStorage();
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<boolean> {
    if (this.isIndexedDBSupported && this.db) {
      try {
        await this.deleteProjectFromIndexedDB(projectId);
        return true;
      } catch (error) {
        console.warn('Failed to delete from IndexedDB, trying localStorage:', error);
      }
    }

    // Fallback to localStorage
    return this.deleteProjectFromLocalStorage(projectId);
  }

  /**
   * Save attachments
   */
  async saveAttachments(projectId: string, attachments: ProjectAttachment[]): Promise<void> {
    if (this.isIndexedDBSupported && this.db) {
      try {
        return await this.saveAttachmentsToIndexedDB(projectId, attachments);
      } catch (error) {
        console.warn('Failed to save attachments to IndexedDB:', error);
      }
    }

    // Fallback to localStorage
    return this.saveAttachmentsToLocalStorage(projectId, attachments);
  }

  /**
   * Auto-save functionality
   */
  setupAutoSave(projectState: LoadCalculatorState, interval: number = 5): void {
    setInterval(() => {
      this.saveProject(projectState, 'Auto-saved Project');
    }, interval * 60 * 1000); // Convert minutes to milliseconds
  }

  // === IndexedDB Implementation ===

  private async saveProjectToIndexedDB(project: StoredProject): Promise<string> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECT_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.put(project);

      request.onsuccess = () => resolve(project.id);
      request.onerror = () => reject(request.error);
    });
  }

  private async loadProjectFromIndexedDB(projectId: string): Promise<StoredProject | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECT_STORE], 'readonly');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.get(projectId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllProjectsFromIndexedDB(): Promise<StoredProject[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECT_STORE], 'readonly');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteProjectFromIndexedDB(projectId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PROJECT_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async saveAttachmentsToIndexedDB(projectId: string, attachments: ProjectAttachment[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([ATTACHMENT_STORE], 'readwrite');
      const store = transaction.objectStore(ATTACHMENT_STORE);

      let completed = 0;
      const total = attachments.length;

      if (total === 0) {
        resolve();
        return;
      }

      attachments.forEach(attachment => {
        const request = store.put({ ...attachment, projectId });
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  // === localStorage Fallback Implementation ===

  private saveProjectToLocalStorage(project: StoredProject): string {
    const projects = this.getAllProjectsFromLocalStorage();
    const existingIndex = projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      projects[existingIndex] = project;
    } else {
      projects.push(project);
    }

    localStorage.setItem('loadCalculatorProjects', JSON.stringify(projects));
    return project.id;
  }

  private loadProjectFromLocalStorage(projectId: string): StoredProject | null {
    const projects = this.getAllProjectsFromLocalStorage();
    return projects.find(p => p.id === projectId) || null;
  }

  private getAllProjectsFromLocalStorage(): StoredProject[] {
    try {
      const data = localStorage.getItem('loadCalculatorProjects');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error parsing localStorage data:', error);
      return [];
    }
  }

  private deleteProjectFromLocalStorage(projectId: string): boolean {
    const projects = this.getAllProjectsFromLocalStorage();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    
    if (filteredProjects.length < projects.length) {
      localStorage.setItem('loadCalculatorProjects', JSON.stringify(filteredProjects));
      return true;
    }
    
    return false;
  }

  private saveAttachmentsToLocalStorage(projectId: string, attachments: ProjectAttachment[]): void {
    const key = `attachments_${projectId}`;
    localStorage.setItem(key, JSON.stringify(attachments));
  }

  // === Utility Methods ===

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

  /**
   * Export project data for backup
   */
  async exportProjectData(projectId: string): Promise<string> {
    const project = await this.loadProject(projectId);
    if (!project) throw new Error('Project not found');

    return JSON.stringify(project, null, 2);
  }

  /**
   * Import project data from backup
   */
  async importProjectData(jsonData: string): Promise<string> {
    try {
      const project: StoredProject = JSON.parse(jsonData);
      return await this.saveProject(project.state, project.name);
    } catch (error) {
      throw new Error('Invalid project data format');
    }
  }

  /**
   * Get storage statistics
   */
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
      storageType: this.isIndexedDBSupported && this.db ? 'IndexedDB' : 'localStorage'
    };
  }
}

// Singleton instance
export const dataStorage = new DataStorageService();