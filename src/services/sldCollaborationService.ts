import type { SLDDiagram, SLDComponent, SLDConnection } from '../types/sld';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isOnline: boolean;
  lastActivity: Date;
}

export interface SLDChange {
  id: string;
  type: 'component_add' | 'component_remove' | 'component_move' | 'component_resize' | 'component_update' | 'connection_add' | 'connection_remove' | 'diagram_update';
  componentId?: string;
  connectionId?: string;
  data: any;
  timestamp: Date;
  userId: string;
  version: number;
  conflictResolution?: 'local' | 'remote' | 'merged';
}

export interface CollaborationSession {
  id: string;
  diagramId: string;
  participants: User[];
  changes: SLDChange[];
  version: number;
  lastSync: Date;
  isActive: boolean;
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
    canExport: boolean;
  };
}

export interface ConflictResolution {
  changeId: string;
  resolution: 'local' | 'remote' | 'merged';
  mergedData?: any;
  resolvedBy: string;
  resolvedAt: Date;
}

export class SLDCollaborationService {
  private static instance: SLDCollaborationService;
  private sessions: Map<string, CollaborationSession> = new Map();
  private currentUser: User | null = null;
  private changeQueue: SLDChange[] = [];
  private syncInterval: NodeJS.Timeout | null = null;

  static getInstance(): SLDCollaborationService {
    if (!SLDCollaborationService.instance) {
      SLDCollaborationService.instance = new SLDCollaborationService();
    }
    return SLDCollaborationService.instance;
  }

  // Session Management
  createSession(diagramId: string, user: User): CollaborationSession {
    const session: CollaborationSession = {
      id: this.generateSessionId(),
      diagramId,
      participants: [user],
      changes: [],
      version: 1,
      lastSync: new Date(),
      isActive: true,
      permissions: {
        canEdit: true,
        canInvite: true,
        canExport: true
      }
    };

    this.sessions.set(session.id, session);
    this.currentUser = user;
    return session;
  }

  joinSession(sessionId: string, user: User): CollaborationSession | null {
    const session = this.sessions.get(sessionId);
    if (session && session.isActive) {
      if (!session.participants.find(p => p.id === user.id)) {
        session.participants.push(user);
        session.lastSync = new Date();
      }
      this.currentUser = user;
      return session;
    }
    return null;
  }

  leaveSession(sessionId: string, userId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants = session.participants.filter(p => p.id !== userId);
      if (session.participants.length === 0) {
        this.sessions.delete(sessionId);
      }
    }
  }

  // Change Management
  addChange(sessionId: string, change: Omit<SLDChange, 'id' | 'timestamp' | 'version'>): SLDChange {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const newChange: SLDChange = {
      ...change,
      id: this.generateChangeId(),
      timestamp: new Date(),
      version: session.version + 1
    };

    session.changes.push(newChange);
    session.version = newChange.version;
    session.lastSync = new Date();

    // Add to sync queue
    this.changeQueue.push(newChange);

    return newChange;
  }

  // Conflict Resolution
  detectConflicts(sessionId: string, incomingChanges: SLDChange[]): SLDChange[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    const conflicts: SLDChange[] = [];
    const localChanges = session.changes.filter(c => c.userId === this.currentUser?.id);

    for (const incomingChange of incomingChanges) {
      for (const localChange of localChanges) {
        if (this.isConflicting(incomingChange, localChange)) {
          conflicts.push(incomingChange);
          break;
        }
      }
    }

    return conflicts;
  }

  private isConflicting(change1: SLDChange, change2: SLDChange): boolean {
    // Same component/connection being modified
    if (change1.componentId && change1.componentId === change2.componentId) {
      return true;
    }
    if (change1.connectionId && change1.connectionId === change2.connectionId) {
      return true;
    }

    // Same diagram-level changes
    if (change1.type === 'diagram_update' && change2.type === 'diagram_update') {
      return true;
    }

    return false;
  }

  resolveConflict(changeId: string, resolution: 'local' | 'remote' | 'merged', mergedData?: any): ConflictResolution {
    const resolutionResult: ConflictResolution = {
      changeId,
      resolution,
      mergedData,
      resolvedBy: this.currentUser?.id || 'unknown',
      resolvedAt: new Date()
    };

    // Apply resolution logic here
    // This would typically involve updating the change and notifying other participants

    return resolutionResult;
  }

  // Synchronization
  startSync(sessionId: string, intervalMs: number = 5000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncChanges(sessionId);
    }, intervalMs);
  }

  stopSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async syncChanges(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || this.changeQueue.length === 0) return;

    const changesToSync = [...this.changeQueue];
    this.changeQueue = [];

    try {
      // In a real implementation, this would send changes to a server
      // For now, we'll simulate the sync process
      await this.simulateServerSync(sessionId, changesToSync);
    } catch (error) {
      console.error('Failed to sync changes:', error);
      // Re-queue failed changes
      this.changeQueue.unshift(...changesToSync);
    }
  }

  private async simulateServerSync(sessionId: string, changes: SLDChange[]): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    const session = this.sessions.get(sessionId);
    if (session) {
      // Simulate receiving changes from other participants
      const remoteChanges = changes.filter(c => c.userId !== this.currentUser?.id);
      if (remoteChanges.length > 0) {
        this.handleRemoteChanges(sessionId, remoteChanges);
      }
    }
  }

  private handleRemoteChanges(sessionId: string, remoteChanges: SLDChange[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Check for conflicts
    const conflicts = this.detectConflicts(sessionId, remoteChanges);
    
    if (conflicts.length > 0) {
      // Handle conflicts - in a real app, this would trigger UI for user resolution
      console.warn('Conflicts detected:', conflicts);
    }

    // Apply non-conflicting changes
    const nonConflictingChanges = remoteChanges.filter(change => 
      !conflicts.find(conflict => conflict.id === change.id)
    );

    for (const change of nonConflictingChanges) {
      this.applyChange(sessionId, change);
    }
  }

  private applyChange(sessionId: string, change: SLDChange): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Apply the change to the diagram
    // This would typically involve updating the actual diagram object
    // For now, we'll just log the change
    console.log('Applying change:', change);

    // Update session
    session.changes.push(change);
    session.version = Math.max(session.version, change.version);
    session.lastSync = new Date();
  }

  // Utility Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChangeId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getSession(sessionId: string): CollaborationSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  // Cleanup
  cleanup(): void {
    this.stopSync();
    this.sessions.clear();
    this.changeQueue = [];
    this.currentUser = null;
  }
}

// Export singleton instance
export const collaborationService = SLDCollaborationService.getInstance(); 