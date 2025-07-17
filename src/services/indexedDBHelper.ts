import type { StoredProject, ProjectAttachment, StoredSettings } from '../types';

const DB_NAME = 'LoadCalculatorDB';
const DB_VERSION = 1;
const PROJECT_STORE = 'projects';
const ATTACHMENT_STORE = 'attachments';
const SETTINGS_STORE = 'settings';

export class IndexedDBHelper {
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(PROJECT_STORE)) {
          const projectStore = db.createObjectStore(PROJECT_STORE, { keyPath: 'id' });
          projectStore.createIndex('name', 'name', { unique: false });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(ATTACHMENT_STORE)) {
          const attachmentStore = db.createObjectStore(ATTACHMENT_STORE, { keyPath: 'id' });
          attachmentStore.createIndex('projectId', 'projectId', { unique: false });
          attachmentStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  async saveProject(project: StoredProject): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('IndexedDB not initialized');
      const transaction = this.db.transaction([PROJECT_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.put(project);

      request.onsuccess = () => resolve(project.id);
      request.onerror = () => reject(request.error);
    });
  }

  async loadProject(projectId: string): Promise<StoredProject | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('IndexedDB not initialized');
      const transaction = this.db.transaction([PROJECT_STORE], 'readonly');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.get(projectId);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllProjects(): Promise<StoredProject[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('IndexedDB not initialized');
      const transaction = this.db.transaction([PROJECT_STORE], 'readonly');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('IndexedDB not initialized');
      const transaction = this.db.transaction([PROJECT_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECT_STORE);
      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveAttachments(projectId: string, attachments: ProjectAttachment[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('IndexedDB not initialized');
      const transaction = this.db.transaction([ATTACHMENT_STORE], 'readwrite');
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

  async getSetting(key: string): Promise<StoredSettings | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('IndexedDB not initialized');
      const transaction = this.db.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSetting(key: string, value: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('IndexedDB not initialized');
      const transaction = this.db.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
