import React from 'react';
import type { LoadState, ProjectInformation, CalculationResults } from '../types';

interface ProjectData {
  id: string;
  name: string;
  lastModified: Date;
  projectInfo: ProjectInformation;
  loads: LoadState;
  calculations?: CalculationResults;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'offline-only';
}

interface OfflineStorageStats {
  totalProjects: number;
  storageUsed: number;
  storageQuota: number;
  lastSync: Date | null;
}

class OfflineService {
  private dbName = 'LoadCalculatorDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // Initialize IndexedDB
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('name', 'name', { unique: false });
          projectStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Calculations cache store
        if (!db.objectStoreNames.contains('calculations')) {
          const calcStore = db.createObjectStore('calculations', { keyPath: 'projectId' });
          calcStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Save project data offline
  async saveProject(projectData: Omit<ProjectData, 'id' | 'lastModified'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const project: ProjectData = {
      ...projectData,
      id,
      lastModified: new Date(),
      syncStatus: 'offline-only'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.add(project);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  // Load project data
  async loadProject(id: string): Promise<ProjectData | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Update existing project
  async updateProject(id: string, updates: Partial<ProjectData>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const existing = await this.loadProject(id);
    if (!existing) throw new Error('Project not found');

    const updated: ProjectData = {
      ...existing,
      ...updates,
      lastModified: new Date(),
      syncStatus: existing.syncStatus === 'synced' ? 'pending' : existing.syncStatus
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // List all projects
  async listProjects(): Promise<ProjectData[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const index = store.index('lastModified');
      const request = index.openCursor(null, 'prev'); // Most recent first

      const projects: ProjectData[] = [];
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          projects.push(cursor.value);
          cursor.continue();
        } else {
          resolve(projects);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Delete project
  async deleteProject(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cache calculations for offline use
  async cacheCalculations(projectId: string, calculations: CalculationResults): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cacheData = {
      projectId,
      calculations,
      timestamp: new Date()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calculations'], 'readwrite');
      const store = transaction.objectStore('calculations');
      const request = store.put(cacheData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get cached calculations
  async getCachedCalculations(projectId: string): Promise<CalculationResults | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['calculations'], 'readonly');
      const store = transaction.objectStore('calculations');
      const request = store.get(projectId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.calculations : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get storage statistics
  async getStorageStats(): Promise<OfflineStorageStats> {
    if (!this.db) throw new Error('Database not initialized');

    const projects = await this.listProjects();
    
    // Estimate storage usage (rough calculation)
    const storageUsed = JSON.stringify(projects).length;
    
    // Get storage quota if available
    let storageQuota = 0;
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      storageQuota = estimate.quota || 0;
    }

    return {
      totalProjects: projects.length,
      storageUsed,
      storageQuota,
      lastSync: null // Would be implemented with sync service
    };
  }

  // Export project data for backup
  async exportProject(id: string): Promise<string> {
    const project = await this.loadProject(id);
    if (!project) throw new Error('Project not found');

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      project: {
        ...project,
        syncStatus: undefined // Don't export sync status
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import project data from backup
  async importProject(jsonData: string): Promise<string> {
    try {
      const importData = JSON.parse(jsonData);
      const project = importData.project;
      
      // Generate new ID to avoid conflicts
      const newId = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const projectData: ProjectData = {
        ...project,
        id: newId,
        lastModified: new Date(),
        syncStatus: 'offline-only'
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(['projects'], 'readwrite');
        const store = transaction.objectStore('projects');
        const request = store.add(projectData);

        request.onsuccess = () => resolve(newId);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw new Error('Invalid project data format');
    }
  }

  // Check if offline mode is available
  static isOfflineAvailable(): boolean {
    return 'indexedDB' in window && 'serviceWorker' in navigator;
  }

  // Register service worker for offline caching
  async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

// Singleton instance
export const offlineService = new OfflineService();

// React hook for offline functionality
export const useOfflineStorage = () => {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);
  const [storageStats, setStorageStats] = React.useState<OfflineStorageStats | null>(null);

  // Initialize offline service
  React.useEffect(() => {
    const init = async () => {
      try {
        await offlineService.initialize();
        await offlineService.registerServiceWorker();
        setIsInitialized(true);
        
        // Update storage stats
        const stats = await offlineService.getStorageStats();
        setStorageStats(stats);
      } catch (error) {
        console.error('Failed to initialize offline service:', error);
      }
    };

    if (OfflineService.isOfflineAvailable()) {
      init();
    }
  }, []);

  // Monitor online/offline status
  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveProject = React.useCallback(async (
    projectInfo: ProjectInformation,
    loads: LoadState,
    calculations?: CalculationResults
  ) => {
    if (!isInitialized) throw new Error('Offline storage not initialized');
    
    return offlineService.saveProject({
      name: projectInfo.projectName || 'Untitled Project',
      projectInfo,
      loads,
      calculations,
      syncStatus: 'offline-only'
    });
  }, [isInitialized]);

  const loadProject = React.useCallback(async (id: string) => {
    if (!isInitialized) throw new Error('Offline storage not initialized');
    return offlineService.loadProject(id);
  }, [isInitialized]);

  const listProjects = React.useCallback(async () => {
    if (!isInitialized) throw new Error('Offline storage not initialized');
    return offlineService.listProjects();
  }, [isInitialized]);

  return {
    isInitialized,
    isOffline,
    storageStats,
    saveProject,
    loadProject,
    listProjects,
    exportProject: offlineService.exportProject.bind(offlineService),
    importProject: offlineService.importProject.bind(offlineService),
    deleteProject: offlineService.deleteProject.bind(offlineService)
  };
};