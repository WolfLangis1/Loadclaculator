/**
 * Professional Revision Control Service
 * 
 * Version control system for electrical drawings with change tracking and approval workflow
 */

import { createComponentLogger } from './loggingService';
import type { SLDDiagram } from '../types/sld';

export interface DrawingRevision {
  id: string;
  diagramId: string;
  revisionNumber: string; // A, B, C... or 0.1, 0.2, etc.
  description: string;
  date: Date;
  author: string;
  approvedBy?: string;
  approvalDate?: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'superseded';
  
  // Change tracking
  changes: RevisionChange[];
  comments: RevisionComment[];
  
  // Diagram snapshot
  diagramSnapshot: SLDDiagram;
  
  // Metadata
  metadata: {
    checkedBy?: string;
    checkDate?: Date;
    necCompliance: string;
    drawingStandard: string;
    fileSize: number;
    exportFormats: string[];
  };
}

export interface RevisionChange {
  id: string;
  type: 'added' | 'modified' | 'deleted' | 'moved';
  elementType: 'component' | 'connection' | 'annotation' | 'layer';
  elementId: string;
  description: string;
  before?: any;
  after?: any;
  position?: { x: number; y: number };
  author: string;
  timestamp: Date;
}

export interface RevisionComment {
  id: string;
  author: string;
  timestamp: Date;
  comment: string;
  position?: { x: number; y: number };
  resolved: boolean;
  resolvedBy?: string;
  resolvedDate?: Date;
  type: 'note' | 'issue' | 'suggestion' | 'approval' | 'rejection';
}

export interface RevisionWorkflow {
  stages: RevisionStage[];
  currentStage: number;
  requiresApproval: boolean;
  approvers: string[];
  notifications: boolean;
}

export interface RevisionStage {
  name: string;
  description: string;
  requiredRole: 'drafter' | 'checker' | 'approver' | 'engineer';
  actions: string[];
  timeLimit?: number; // hours
}

export class RevisionControlService {
  private static logger = createComponentLogger('RevisionControlService');
  private static revisions: Map<string, DrawingRevision[]> = new Map();
  private static workflows: Map<string, RevisionWorkflow> = new Map();

  // Standard professional workflow templates
  private static STANDARD_WORKFLOWS = {
    residential: {
      stages: [
        {
          name: 'Draft',
          description: 'Initial drawing creation and development',
          requiredRole: 'drafter' as const,
          actions: ['create', 'edit', 'save'],
          timeLimit: 24
        },
        {
          name: 'Review',
          description: 'Technical review and checking',
          requiredRole: 'checker' as const,
          actions: ['review', 'comment', 'request_changes', 'approve'],
          timeLimit: 8
        },
        {
          name: 'Approval',
          description: 'Final approval for permit submission',
          requiredRole: 'engineer' as const,
          actions: ['approve', 'reject', 'stamp'],
          timeLimit: 4
        }
      ],
      currentStage: 0,
      requiresApproval: true,
      approvers: ['licensed_engineer'],
      notifications: true
    },

    commercial: {
      stages: [
        {
          name: 'Draft',
          description: 'Initial drawing creation',
          requiredRole: 'drafter' as const,
          actions: ['create', 'edit', 'save'],
          timeLimit: 48
        },
        {
          name: 'Self-Check',
          description: 'Drafter self-review and verification',
          requiredRole: 'drafter' as const,
          actions: ['self_check', 'validate_nec', 'run_calculations'],
          timeLimit: 4
        },
        {
          name: 'Peer Review',
          description: 'Peer technical review',
          requiredRole: 'checker' as const,
          actions: ['review', 'comment', 'request_changes'],
          timeLimit: 12
        },
        {
          name: 'Senior Review',
          description: 'Senior engineer review',
          requiredRole: 'engineer' as const,
          actions: ['review', 'approve', 'reject'],
          timeLimit: 8
        },
        {
          name: 'Final Approval',
          description: 'PE stamp and final approval',
          requiredRole: 'approver' as const,
          actions: ['stamp', 'approve', 'issue'],
          timeLimit: 2
        }
      ],
      currentStage: 0,
      requiresApproval: true,
      approvers: ['senior_engineer', 'professional_engineer'],
      notifications: true
    }
  };

  /**
   * Initialize revision control for a diagram
   */
  static initializeRevisionControl(
    diagramId: string, 
    initialDiagram: SLDDiagram,
    workflowType: 'residential' | 'commercial' = 'residential'
  ): string {
    const revisionId = `rev_${diagramId}_${Date.now()}`;
    
    const initialRevision: DrawingRevision = {
      id: revisionId,
      diagramId,
      revisionNumber: 'A',
      description: 'Initial drawing release',
      date: new Date(),
      author: 'System',
      status: 'draft',
      changes: [],
      comments: [],
      diagramSnapshot: JSON.parse(JSON.stringify(initialDiagram)),
      metadata: {
        necCompliance: '2023',
        drawingStandard: 'IEEE 315',
        fileSize: JSON.stringify(initialDiagram).length,
        exportFormats: []
      }
    };

    // Initialize revision history
    this.revisions.set(diagramId, [initialRevision]);
    
    // Set up workflow
    this.workflows.set(diagramId, JSON.parse(JSON.stringify(this.STANDARD_WORKFLOWS[workflowType])));

    this.logger.info('Revision control initialized', { 
      diagramId, 
      revisionId, 
      workflowType 
    });

    return revisionId;
  }

  /**
   * Create new revision from current diagram state
   */
  static createRevision(
    diagramId: string,
    currentDiagram: SLDDiagram,
    description: string,
    author: string,
    changes: RevisionChange[] = []
  ): string {
    const revisionHistory = this.revisions.get(diagramId) || [];
    const lastRevision = revisionHistory[revisionHistory.length - 1];
    
    if (!lastRevision) {
      throw new Error('No revision history found. Initialize revision control first.');
    }

    const revisionId = `rev_${diagramId}_${Date.now()}`;
    const nextRevisionNumber = this.getNextRevisionNumber(lastRevision.revisionNumber);

    const newRevision: DrawingRevision = {
      id: revisionId,
      diagramId,
      revisionNumber: nextRevisionNumber,
      description,
      date: new Date(),
      author,
      status: 'draft',
      changes: changes.length > 0 ? changes : this.detectChanges(lastRevision.diagramSnapshot, currentDiagram),
      comments: [],
      diagramSnapshot: JSON.parse(JSON.stringify(currentDiagram)),
      metadata: {
        necCompliance: currentDiagram.metadata?.necCompliance || '2023',
        drawingStandard: currentDiagram.metadata?.drawingStandard || 'IEEE 315',
        fileSize: JSON.stringify(currentDiagram).length,
        exportFormats: []
      }
    };

    // Add to revision history
    revisionHistory.push(newRevision);
    this.revisions.set(diagramId, revisionHistory);

    this.logger.info('New revision created', { 
      diagramId, 
      revisionId, 
      revisionNumber: nextRevisionNumber,
      changesCount: newRevision.changes.length
    });

    return revisionId;
  }

  /**
   * Get next revision number following professional standards
   */
  private static getNextRevisionNumber(currentNumber: string): string {
    // Handle alphabetic revisions (A, B, C...)
    if (currentNumber.match(/^[A-Z]$/)) {
      const nextChar = String.fromCharCode(currentNumber.charCodeAt(0) + 1);
      return nextChar;
    }

    // Handle numeric revisions (0.1, 0.2, 1.0...)
    if (currentNumber.match(/^\d+\.\d+$/)) {
      const [major, minor] = currentNumber.split('.').map(Number);
      return `${major}.${minor + 1}`;
    }

    // Default to next letter
    return 'B';
  }

  /**
   * Detect changes between two diagram versions
   */
  private static detectChanges(
    previousDiagram: SLDDiagram, 
    currentDiagram: SLDDiagram
  ): RevisionChange[] {
    const changes: RevisionChange[] = [];
    const changeId = () => `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Compare components
    const prevComponentIds = new Set(previousDiagram.components.map(c => c.id));
    const currComponentIds = new Set(currentDiagram.components.map(c => c.id));

    // Added components
    currentDiagram.components.forEach(component => {
      if (!prevComponentIds.has(component.id)) {
        changes.push({
          id: changeId(),
          type: 'added',
          elementType: 'component',
          elementId: component.id,
          description: `Added ${component.type}: ${component.name}`,
          after: component,
          position: component.position,
          author: 'System',
          timestamp: new Date()
        });
      }
    });

    // Deleted components
    previousDiagram.components.forEach(component => {
      if (!currComponentIds.has(component.id)) {
        changes.push({
          id: changeId(),
          type: 'deleted',
          elementType: 'component',
          elementId: component.id,
          description: `Deleted ${component.type}: ${component.name}`,
          before: component,
          position: component.position,
          author: 'System',
          timestamp: new Date()
        });
      }
    });

    // Modified components
    currentDiagram.components.forEach(currComponent => {
      const prevComponent = previousDiagram.components.find(c => c.id === currComponent.id);
      if (prevComponent) {
        // Check for position changes
        if (prevComponent.position.x !== currComponent.position.x || 
            prevComponent.position.y !== currComponent.position.y) {
          changes.push({
            id: changeId(),
            type: 'moved',
            elementType: 'component',
            elementId: currComponent.id,
            description: `Moved ${currComponent.type}: ${currComponent.name}`,
            before: prevComponent.position,
            after: currComponent.position,
            position: currComponent.position,
            author: 'System',
            timestamp: new Date()
          });
        }

        // Check for specification changes
        if (JSON.stringify(prevComponent.specifications) !== JSON.stringify(currComponent.specifications)) {
          changes.push({
            id: changeId(),
            type: 'modified',
            elementType: 'component',
            elementId: currComponent.id,
            description: `Modified ${currComponent.type} specifications`,
            before: prevComponent.specifications,
            after: currComponent.specifications,
            position: currComponent.position,
            author: 'System',
            timestamp: new Date()
          });
        }
      }
    });

    // Compare connections (similar logic)
    const prevConnectionIds = new Set(previousDiagram.connections.map(c => c.id));
    const currConnectionIds = new Set(currentDiagram.connections.map(c => c.id));

    // Added connections
    currentDiagram.connections.forEach(connection => {
      if (!prevConnectionIds.has(connection.id)) {
        changes.push({
          id: changeId(),
          type: 'added',
          elementType: 'connection',
          elementId: connection.id,
          description: `Added connection: ${connection.fromComponentId} to ${connection.toComponentId}`,
          after: connection,
          author: 'System',
          timestamp: new Date()
        });
      }
    });

    // Deleted connections
    previousDiagram.connections.forEach(connection => {
      if (!currConnectionIds.has(connection.id)) {
        changes.push({
          id: changeId(),
          type: 'deleted',
          elementType: 'connection',
          elementId: connection.id,
          description: `Deleted connection: ${connection.fromComponentId} to ${connection.toComponentId}`,
          before: connection,
          author: 'System',
          timestamp: new Date()
        });
      }
    });

    return changes;
  }

  /**
   * Submit revision for approval
   */
  static submitForApproval(
    diagramId: string, 
    revisionId: string,
    submitter: string
  ): boolean {
    const revisionHistory = this.revisions.get(diagramId);
    const revision = revisionHistory?.find(r => r.id === revisionId);
    
    if (!revision) {
      this.logger.error('Revision not found', { diagramId, revisionId });
      return false;
    }

    if (revision.status !== 'draft') {
      this.logger.warn('Revision not in draft status', { status: revision.status });
      return false;
    }

    revision.status = 'submitted';
    
    // Advance workflow
    const workflow = this.workflows.get(diagramId);
    if (workflow && workflow.currentStage < workflow.stages.length - 1) {
      workflow.currentStage++;
    }

    this.logger.info('Revision submitted for approval', { 
      diagramId, 
      revisionId, 
      submitter 
    });

    return true;
  }

  /**
   * Approve revision
   */
  static approveRevision(
    diagramId: string,
    revisionId: string,
    approver: string,
    comments?: string
  ): boolean {
    const revisionHistory = this.revisions.get(diagramId);
    const revision = revisionHistory?.find(r => r.id === revisionId);
    
    if (!revision) return false;

    revision.status = 'approved';
    revision.approvedBy = approver;
    revision.approvalDate = new Date();

    if (comments) {
      this.addComment(diagramId, revisionId, {
        author: approver,
        comment: comments,
        type: 'approval'
      });
    }

    // Mark previous revisions as superseded
    revisionHistory.forEach(rev => {
      if (rev.id !== revisionId && rev.status === 'approved') {
        rev.status = 'superseded';
      }
    });

    this.logger.info('Revision approved', { 
      diagramId, 
      revisionId, 
      approver 
    });

    return true;
  }

  /**
   * Reject revision
   */
  static rejectRevision(
    diagramId: string,
    revisionId: string,
    rejector: string,
    reason: string
  ): boolean {
    const revisionHistory = this.revisions.get(diagramId);
    const revision = revisionHistory?.find(r => r.id === revisionId);
    
    if (!revision) return false;

    revision.status = 'rejected';

    this.addComment(diagramId, revisionId, {
      author: rejector,
      comment: reason,
      type: 'rejection'
    });

    this.logger.info('Revision rejected', { 
      diagramId, 
      revisionId, 
      rejector, 
      reason 
    });

    return true;
  }

  /**
   * Add comment to revision
   */
  static addComment(
    diagramId: string,
    revisionId: string,
    commentData: {
      author: string;
      comment: string;
      type?: 'note' | 'issue' | 'suggestion' | 'approval' | 'rejection';
      position?: { x: number; y: number };
    }
  ): string {
    const revisionHistory = this.revisions.get(diagramId);
    const revision = revisionHistory?.find(r => r.id === revisionId);
    
    if (!revision) {
      throw new Error('Revision not found');
    }

    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const comment: RevisionComment = {
      id: commentId,
      author: commentData.author,
      timestamp: new Date(),
      comment: commentData.comment,
      position: commentData.position,
      resolved: false,
      type: commentData.type || 'note'
    };

    revision.comments.push(comment);

    this.logger.info('Comment added to revision', { 
      diagramId, 
      revisionId, 
      commentId,
      author: commentData.author
    });

    return commentId;
  }

  /**
   * Get revision history for diagram
   */
  static getRevisionHistory(diagramId: string): DrawingRevision[] {
    return this.revisions.get(diagramId) || [];
  }

  /**
   * Get current approved revision
   */
  static getCurrentRevision(diagramId: string): DrawingRevision | null {
    const revisionHistory = this.revisions.get(diagramId) || [];
    return revisionHistory.find(r => r.status === 'approved') || 
           revisionHistory[revisionHistory.length - 1] || 
           null;
  }

  /**
   * Get specific revision
   */
  static getRevision(diagramId: string, revisionId: string): DrawingRevision | null {
    const revisionHistory = this.revisions.get(diagramId) || [];
    return revisionHistory.find(r => r.id === revisionId) || null;
  }

  /**
   * Compare two revisions
   */
  static compareRevisions(
    diagramId: string,
    revisionId1: string,
    revisionId2: string
  ): {
    added: any[];
    deleted: any[];
    modified: any[];
    statistics: {
      totalChanges: number;
      componentChanges: number;
      connectionChanges: number;
    };
  } {
    const revision1 = this.getRevision(diagramId, revisionId1);
    const revision2 = this.getRevision(diagramId, revisionId2);
    
    if (!revision1 || !revision2) {
      throw new Error('One or both revisions not found');
    }

    const changes = this.detectChanges(revision1.diagramSnapshot, revision2.diagramSnapshot);
    
    const added = changes.filter(c => c.type === 'added');
    const deleted = changes.filter(c => c.type === 'deleted');
    const modified = changes.filter(c => c.type === 'modified' || c.type === 'moved');

    return {
      added,
      deleted,
      modified,
      statistics: {
        totalChanges: changes.length,
        componentChanges: changes.filter(c => c.elementType === 'component').length,
        connectionChanges: changes.filter(c => c.elementType === 'connection').length
      }
    };
  }

  /**
   * Export revision data for archival
   */
  static exportRevisionData(diagramId: string): {
    diagramId: string;
    revisionHistory: DrawingRevision[];
    workflow: RevisionWorkflow | undefined;
    exportDate: Date;
  } {
    return {
      diagramId,
      revisionHistory: this.getRevisionHistory(diagramId),
      workflow: this.workflows.get(diagramId),
      exportDate: new Date()
    };
  }

  /**
   * Generate revision summary report
   */
  static generateRevisionReport(diagramId: string): {
    summary: {
      totalRevisions: number;
      currentRevision: string;
      status: string;
      lastModified: Date;
      approvedBy?: string;
    };
    changesSummary: {
      totalChanges: number;
      componentChanges: number;
      connectionChanges: number;
      recentChanges: RevisionChange[];
    };
    commentsSummary: {
      totalComments: number;
      unresolvedIssues: number;
      recentComments: RevisionComment[];
    };
  } {
    const revisionHistory = this.getRevisionHistory(diagramId);
    const currentRevision = this.getCurrentRevision(diagramId);
    
    if (!currentRevision) {
      throw new Error('No revisions found for diagram');
    }

    // Aggregate all changes
    const allChanges = revisionHistory.flatMap(r => r.changes);
    const allComments = revisionHistory.flatMap(r => r.comments);

    return {
      summary: {
        totalRevisions: revisionHistory.length,
        currentRevision: currentRevision.revisionNumber,
        status: currentRevision.status,
        lastModified: currentRevision.date,
        approvedBy: currentRevision.approvedBy
      },
      changesSummary: {
        totalChanges: allChanges.length,
        componentChanges: allChanges.filter(c => c.elementType === 'component').length,
        connectionChanges: allChanges.filter(c => c.elementType === 'connection').length,
        recentChanges: allChanges.slice(-10) // Last 10 changes
      },
      commentsSummary: {
        totalComments: allComments.length,
        unresolvedIssues: allComments.filter(c => !c.resolved && c.type === 'issue').length,
        recentComments: allComments.slice(-5) // Last 5 comments
      }
    };
  }
}