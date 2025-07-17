/**
 * Consolidated SLD Service
 * 
 * Main facade service that consolidates all SLD functionality into logical modules:
 * - Core SLD operations (create, update, delete diagrams)
 * - Layer management and organization
 * - Template management and application
 * - Measurement and annotation tools
 * - Command/undo system
 * - Performance monitoring
 * - Collaboration features
 * 
 * This service acts as the primary interface for all SLD operations,
 * providing a clean API while delegating to specialized modules.
 */

import { createComponentLogger } from './loggingService';
import { ErrorHandlingService } from './errorHandlingService';
import { SLDLayerService } from './sldLayerService';
import { SLDMeasurementService } from './sldMeasurementService';
import { SLDTemplateService } from './sldTemplateService';
import { CommandManager } from './sldCommandService';
import { SLDPerformanceService } from './sldPerformanceService';
import { SLDCollaborationService } from './sldCollaborationService';
import { SLDWireService } from './sldWireService';
import type { SLDDiagram, SLDComponent, SLDConnection } from '../types/sld';

const logger = createComponentLogger('SLDService');

export interface SLDServiceConfig {
  enableCollaboration?: boolean;
  enablePerformanceMonitoring?: boolean;
  maxHistorySize?: number;
  autoSaveInterval?: number;
}

export class SLDService {
  private layerService: SLDLayerService;
  private measurementService: SLDMeasurementService;
  private commandManager: CommandManager | null = null;
  private performanceService: SLDPerformanceService | null = null;
  private collaborationService: SLDCollaborationService | null = null;
  private wireService: SLDWireService;
  private config: SLDServiceConfig;

  constructor(config: SLDServiceConfig = {}) {
    this.config = {
      enableCollaboration: false,
      enablePerformanceMonitoring: false,
      maxHistorySize: 50,
      autoSaveInterval: 30000,
      ...config
    };

    // Initialize core services
    this.layerService = new SLDLayerService();
    this.measurementService = new SLDMeasurementService();
    this.wireService = new SLDWireService();

    // Initialize optional services based on config
    if (this.config.enablePerformanceMonitoring) {
      this.performanceService = new SLDPerformanceService();
    }

    if (this.config.enableCollaboration) {
      this.collaborationService = new SLDCollaborationService();
    }

    logger.info('SLD Service initialized', { config: this.config });
  }

  // ============== CORE DIAGRAM OPERATIONS ==============

  /**
   * Create a new SLD diagram
   */
  async createDiagram(name: string, templateId?: string): Promise<SLDDiagram> {
    try {
      logger.info('Creating new SLD diagram', { name, templateId });
      
      let diagram: SLDDiagram;
      
      if (templateId) {
        const template = SLDTemplateService.getTemplateById(templateId);
        if (template) {
          diagram = { ...template.diagram, name };
        } else {
          throw new Error(`Template ${templateId} not found`);
        }
      } else {
        diagram = {
          id: `sld-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          components: [],
          connections: [],
          properties: {
            title: name,
            scale: 1,
            gridSize: 20,
            showGrid: true,
            width: 1200,
            height: 800
          },
          layers: this.layerService.getDefaultLayers(),
          measurements: [],
          annotations: [],
          metadata: {
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            version: '1.0.0',
            author: 'SLD Service'
          }
        };
      }

      // Initialize command manager for this diagram
      this.commandManager = new CommandManager(diagram);

      logger.info('SLD diagram created successfully', { diagramId: diagram.id });
      return diagram;
    } catch (error) {
      throw ErrorHandlingService.handleApiError(error, 'SLDService.createDiagram');
    }
  }

  /**
   * Load an existing diagram
   */
  async loadDiagram(diagramId: string): Promise<SLDDiagram> {
    try {
      logger.info('Loading SLD diagram', { diagramId });
      
      // This would typically load from a data store
      // For now, return a placeholder
      const diagram: SLDDiagram = {
        id: diagramId,
        name: 'Loaded Diagram',
        components: [],
        connections: [],
        properties: {
          title: 'Loaded Diagram',
          scale: 1,
          gridSize: 20,
          showGrid: true,
          width: 1200,
          height: 800
        },
        layers: this.layerService.getDefaultLayers(),
        measurements: [],
        annotations: [],
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
          version: '1.0.0',
          author: 'SLD Service'
        }
      };

      this.commandManager = new CommandManager(diagram);
      
      logger.info('SLD diagram loaded successfully', { diagramId });
      return diagram;
    } catch (error) {
      throw ErrorHandlingService.handleApiError(error, 'SLDService.loadDiagram');
    }
  }

  /**
   * Save diagram changes
   */
  async saveDiagram(diagram: SLDDiagram): Promise<void> {
    try {
      logger.info('Saving SLD diagram', { diagramId: diagram.id });
      
      // Update metadata
      diagram.metadata.modified = new Date().toISOString();
      
      // This would typically save to a data store
      // For now, just log the save operation
      
      logger.info('SLD diagram saved successfully', { diagramId: diagram.id });
    } catch (error) {
      throw ErrorHandlingService.handleApiError(error, 'SLDService.saveDiagram');
    }
  }

  // ============== COMPONENT OPERATIONS ==============

  /**
   * Add a component to the diagram
   */
  addComponent(diagram: SLDDiagram, component: SLDComponent): void {
    try {
      if (this.commandManager) {
        const command = {
          execute: () => {
            diagram.components.push(component);
            this.layerService.assignComponentToLayer(component.id, 'default');
          },
          undo: () => {
            const index = diagram.components.findIndex(c => c.id === component.id);
            if (index > -1) {
              diagram.components.splice(index, 1);
              this.layerService.removeComponentFromLayer(component.id);
            }
          },
          redo: () => {
            diagram.components.push(component);
            this.layerService.assignComponentToLayer(component.id, 'default');
          },
          description: `Add component ${component.label}`,
          timestamp: new Date()
        };
        
        this.commandManager.executeCommand(command);
      } else {
        diagram.components.push(component);
        this.layerService.assignComponentToLayer(component.id, 'default');
      }

      logger.debug('Component added', { componentId: component.id, type: component.type });
    } catch (error) {
      logger.error('Failed to add component', error, { componentId: component.id });
      throw ErrorHandlingService.handleApiError(error, 'SLDService.addComponent');
    }
  }

  /**
   * Update a component in the diagram
   */
  updateComponent(diagram: SLDDiagram, componentId: string, updates: Partial<SLDComponent>): void {
    try {
      const component = diagram.components.find(c => c.id === componentId);
      if (!component) {
        throw new Error(`Component ${componentId} not found`);
      }

      const originalComponent = { ...component };

      if (this.commandManager) {
        const command = {
          execute: () => {
            Object.assign(component, updates);
          },
          undo: () => {
            Object.assign(component, originalComponent);
          },
          redo: () => {
            Object.assign(component, updates);
          },
          description: `Update component ${component.label}`,
          timestamp: new Date()
        };
        
        this.commandManager.executeCommand(command);
      } else {
        Object.assign(component, updates);
      }

      logger.debug('Component updated', { componentId, updates });
    } catch (error) {
      logger.error('Failed to update component', error, { componentId });
      throw ErrorHandlingService.handleApiError(error, 'SLDService.updateComponent');
    }
  }

  /**
   * Remove a component from the diagram
   */
  removeComponent(diagram: SLDDiagram, componentId: string): void {
    try {
      const componentIndex = diagram.components.findIndex(c => c.id === componentId);
      if (componentIndex === -1) {
        throw new Error(`Component ${componentId} not found`);
      }

      const component = diagram.components[componentIndex];
      const relatedConnections = diagram.connections.filter(
        conn => conn.from === componentId || conn.to === componentId
      );

      if (this.commandManager) {
        const command = {
          execute: () => {
            diagram.components.splice(componentIndex, 1);
            // Remove related connections
            relatedConnections.forEach(conn => {
              const connIndex = diagram.connections.findIndex(c => c.id === conn.id);
              if (connIndex > -1) {
                diagram.connections.splice(connIndex, 1);
              }
            });
            this.layerService.removeComponentFromLayer(componentId);
          },
          undo: () => {
            diagram.components.splice(componentIndex, 0, component);
            diagram.connections.push(...relatedConnections);
            this.layerService.assignComponentToLayer(componentId, 'default');
          },
          redo: () => {
            diagram.components.splice(componentIndex, 1);
            relatedConnections.forEach(conn => {
              const connIndex = diagram.connections.findIndex(c => c.id === conn.id);
              if (connIndex > -1) {
                diagram.connections.splice(connIndex, 1);
              }
            });
            this.layerService.removeComponentFromLayer(componentId);
          },
          description: `Remove component ${component.label}`,
          timestamp: new Date()
        };
        
        this.commandManager.executeCommand(command);
      } else {
        diagram.components.splice(componentIndex, 1);
        relatedConnections.forEach(conn => {
          const connIndex = diagram.connections.findIndex(c => c.id === conn.id);
          if (connIndex > -1) {
            diagram.connections.splice(connIndex, 1);
          }
        });
        this.layerService.removeComponentFromLayer(componentId);
      }

      logger.debug('Component removed', { componentId });
    } catch (error) {
      logger.error('Failed to remove component', error, { componentId });
      throw ErrorHandlingService.handleApiError(error, 'SLDService.removeComponent');
    }
  }

  // ============== CONNECTION OPERATIONS ==============

  /**
   * Add a connection between components
   */
  addConnection(diagram: SLDDiagram, connection: SLDConnection): void {
    try {
      // Use wire service for intelligent routing
      const routedConnection = this.wireService.routeConnection(diagram, connection);
      
      if (this.commandManager) {
        const command = {
          execute: () => {
            diagram.connections.push(routedConnection);
          },
          undo: () => {
            const index = diagram.connections.findIndex(c => c.id === connection.id);
            if (index > -1) {
              diagram.connections.splice(index, 1);
            }
          },
          redo: () => {
            diagram.connections.push(routedConnection);
          },
          description: `Add connection ${connection.id}`,
          timestamp: new Date()
        };
        
        this.commandManager.executeCommand(command);
      } else {
        diagram.connections.push(routedConnection);
      }

      logger.debug('Connection added', { connectionId: connection.id });
    } catch (error) {
      logger.error('Failed to add connection', error, { connectionId: connection.id });
      throw ErrorHandlingService.handleApiError(error, 'SLDService.addConnection');
    }
  }

  // ============== LAYER OPERATIONS ==============

  /**
   * Get layer service for direct layer management
   */
  getLayerService(): SLDLayerService {
    return this.layerService;
  }

  // ============== MEASUREMENT OPERATIONS ==============

  /**
   * Get measurement service for direct measurement management
   */
  getMeasurementService(): SLDMeasurementService {
    return this.measurementService;
  }

  // ============== TEMPLATE OPERATIONS ==============

  /**
   * Get all available templates
   */
  getAllTemplates() {
    return SLDTemplateService.getAllTemplates();
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: string) {
    return SLDTemplateService.getTemplatesByCategory(category as any);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string) {
    return SLDTemplateService.searchTemplates(query);
  }

  // ============== COMMAND OPERATIONS ==============

  /**
   * Undo last operation
   */
  undo(): boolean {
    if (this.commandManager) {
      return this.commandManager.undo();
    }
    return false;
  }

  /**
   * Redo last undone operation
   */
  redo(): boolean {
    if (this.commandManager) {
      return this.commandManager.redo();
    }
    return false;
  }

  /**
   * Get command history
   */
  getCommandHistory(): any[] {
    if (this.commandManager) {
      return this.commandManager.getHistory();
    }
    return [];
  }

  // ============== PERFORMANCE MONITORING ==============

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): any {
    if (this.performanceService) {
      return this.performanceService.getMetrics();
    }
    return null;
  }

  // ============== COLLABORATION FEATURES ==============

  /**
   * Enable collaboration for a diagram
   */
  enableCollaboration(diagramId: string): void {
    if (this.collaborationService) {
      this.collaborationService.enableCollaboration(diagramId);
    }
  }

  /**
   * Disable collaboration for a diagram
   */
  disableCollaboration(diagramId: string): void {
    if (this.collaborationService) {
      this.collaborationService.disableCollaboration(diagramId);
    }
  }

  // ============== UTILITY METHODS ==============

  /**
   * Validate diagram integrity
   */
  validateDiagram(diagram: SLDDiagram): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for orphaned connections
    diagram.connections.forEach(connection => {
      const fromComponent = diagram.components.find(c => c.id === connection.from);
      const toComponent = diagram.components.find(c => c.id === connection.to);
      
      if (!fromComponent) {
        errors.push(`Connection ${connection.id} references non-existent component ${connection.from}`);
      }
      if (!toComponent) {
        errors.push(`Connection ${connection.id} references non-existent component ${connection.to}`);
      }
    });

    // Check for duplicate component IDs
    const componentIds = new Set();
    diagram.components.forEach(component => {
      if (componentIds.has(component.id)) {
        errors.push(`Duplicate component ID: ${component.id}`);
      }
      componentIds.add(component.id);
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get service statistics
   */
  getServiceStats(): any {
    return {
      layerService: this.layerService.getStats?.() || null,
      measurementService: this.measurementService.getStats?.() || null,
      templateService: { totalTemplates: SLDTemplateService.getAllTemplates().length },
      wireService: this.wireService.getStats?.() || null,
      performanceService: this.performanceService?.getStats() || null,
      collaborationService: this.collaborationService?.getStats() || null
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    logger.info('Disposing SLD Service');
    
    this.layerService.dispose?.();
    this.measurementService.dispose?.();
    this.wireService.dispose?.();
    this.performanceService?.dispose?.();
    this.collaborationService?.dispose?.();
  }
}

// Export singleton instance
export const sldService = new SLDService();
export default sldService;