/**
 * Comprehensive SLD Service
 * 
 * Unified service combining manual SLD editing and intelligent auto-generation
 * Provides complete Single Line Diagram functionality for electrical systems
 */

import type { SLDComponent, SLDConnection, SLDDiagram, SLDPosition } from '../types/sld';
import type { LoadState } from '../types/load';
import { 
  generateIntelligentSLD, 
  generateCircuitNumbers, 
  generateWireSizing,
  type SLDGenerationOptions 
} from './intelligentSLDGenerator';
import { 
  generateAllWireRoutes, 
  optimizeWireRoutes,
  type WireRoute,
  type RoutingConstraints 
} from './wireRoutingEngine';
import { RealTimeNECValidator, type RealTimeValidationResult } from './realTimeNECValidator';
import { 
  generateTitleBlockFromProject, 
  type TitleBlockData 
} from './titleBlockService';

export interface SLDWorkspace {
  id: string;
  name: string;
  diagram: SLDDiagram;
  titleBlock: TitleBlockData;
  mode: 'manual' | 'intelligent' | 'hybrid';
  validation: RealTimeValidationResult;
  wireRoutes: WireRoute[];
  canvasState: {
    zoom: number;
    pan: { x: number; y: number };
    gridEnabled: boolean;
    gridSize: number;
    snapToGrid: boolean;
    selectedComponents: string[];
    selectedConnections: string[];
  };
  settings: {
    autoValidate: boolean;
    autoRoute: boolean;
    showTitleBlock: boolean;
    showWireLabels: boolean;
    showCollisionDetection: boolean;
    routingConstraints: RoutingConstraints;
    generationOptions: SLDGenerationOptions;
  };
  history: SLDHistoryEntry[];
  historyIndex: number;
}

export interface SLDHistoryEntry {
  id: string;
  timestamp: Date;
  action: string;
  diagram: SLDDiagram;
  description: string;
}

export interface ComponentTemplate {
  id: string;
  name: string;
  category: 'power' | 'protection' | 'metering' | 'load' | 'generation';
  component: Omit<SLDComponent, 'id' | 'position'>;
  description: string;
  necRequirements?: string[];
}

export class ComprehensiveSLDService {
  private workspace: SLDWorkspace;
  private necValidator: RealTimeNECValidator;
  private updateCallbacks: Set<(workspace: SLDWorkspace) => void> = new Set();

  constructor(initialWorkspace?: Partial<SLDWorkspace>) {
    this.necValidator = new RealTimeNECValidator();
    this.workspace = this.createDefaultWorkspace(initialWorkspace);
  }

  /**
   * Create default workspace configuration
   */
  private createDefaultWorkspace(initial?: Partial<SLDWorkspace>): SLDWorkspace {
    const defaultDiagram: SLDDiagram = {
      id: `sld-${Date.now()}`,
      name: 'Single Line Diagram',
      components: [],
      connections: [],
      metadata: {
        createdAt: new Date().toISOString(),
        necCompliant: true,
        diagramStyle: 'professional'
      }
    };

    return {
      id: initial?.id || `workspace-${Date.now()}`,
      name: initial?.name || 'SLD Workspace',
      diagram: initial?.diagram || defaultDiagram,
      titleBlock: initial?.titleBlock || {
        projectName: 'Electrical Project',
        drawingTitle: 'Single Line Diagram',
        drawingNumber: 'E-SLD-001',
        revision: 'A',
        date: new Date().toLocaleDateString(),
        drawnBy: 'Engineer',
        client: 'Client',
        address: 'Project Address',
        scale: 'NTS',
        sheetNumber: '1',
        totalSheets: '1',
        necCodeYear: '2023'
      },
      mode: initial?.mode || 'hybrid',
      validation: {
        overallCompliance: true,
        totalViolations: 0,
        criticalViolations: 0,
        warningViolations: 0,
        componentViolations: new Map(),
        connectionViolations: new Map(),
        systemViolations: [],
        recommendations: [],
        complianceScore: 100,
        lastValidated: new Date()
      },
      wireRoutes: [],
      canvasState: {
        zoom: 1.0,
        pan: { x: 0, y: 0 },
        gridEnabled: true,
        gridSize: 20,
        snapToGrid: true,
        selectedComponents: [],
        selectedConnections: []
      },
      settings: {
        autoValidate: true,
        autoRoute: true,
        showTitleBlock: true,
        showWireLabels: true,
        showCollisionDetection: true,
        routingConstraints: {
          minBendRadius: 10,
          maxBends: 4,
          preferredDirection: 'auto',
          avoidanceMargin: 20,
          gridSnap: true,
          gridSize: 20,
          wireSpacing: 15,
          bundleWires: true,
          routingMethod: 'manhattan'
        },
        generationOptions: {
          includeLoadCalculations: true,
          includeCircuitNumbers: true,
          includeWireSizing: true,
          includeNECReferences: true,
          diagramStyle: 'residential',
          voltageLevel: 240,
          serviceSize: 200
        }
      },
      history: [],
      historyIndex: -1,
      ...initial
    };
  }

  /**
   * Subscribe to workspace updates
   */
  subscribe(callback: (workspace: SLDWorkspace) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Notify subscribers of workspace changes
   */
  private notifyUpdate(): void {
    this.updateCallbacks.forEach(callback => callback(this.workspace));
  }

  /**
   * Add entry to history for undo/redo
   */
  private addToHistory(action: string, description: string): void {
    const entry: SLDHistoryEntry = {
      id: `history-${Date.now()}`,
      timestamp: new Date(),
      action,
      diagram: JSON.parse(JSON.stringify(this.workspace.diagram)),
      description
    };

    // Remove future history if we're not at the end
    if (this.workspace.historyIndex < this.workspace.history.length - 1) {
      this.workspace.history = this.workspace.history.slice(0, this.workspace.historyIndex + 1);
    }

    this.workspace.history.push(entry);
    this.workspace.historyIndex = this.workspace.history.length - 1;

    // Limit history size
    if (this.workspace.history.length > 50) {
      this.workspace.history = this.workspace.history.slice(-50);
      this.workspace.historyIndex = this.workspace.history.length - 1;
    }
  }

  /**
   * Generate intelligent SLD from load data
   */
  async generateIntelligentSLD(
    loads: LoadState,
    projectInfo: any,
    options?: Partial<SLDGenerationOptions>
  ): Promise<void> {
    const generationOptions = { ...this.workspace.settings.generationOptions, ...options };
    
    try {
      const { diagram } = generateIntelligentSLD(loads, projectInfo, generationOptions);
      
      this.addToHistory('generate_intelligent', 'Generated intelligent SLD from load data');
      this.workspace.diagram = diagram;
      this.workspace.mode = 'intelligent';
      
      // Update title block with project info
      this.workspace.titleBlock = generateTitleBlockFromProject(
        projectInfo, 
        loads, 
        'professional-commercial'
      );

      await this.updateValidation();
      await this.updateWireRoutes();
      
      this.notifyUpdate();
    } catch (error) {
      console.error('Failed to generate intelligent SLD:', error);
      throw error;
    }
  }

  /**
   * Add component to diagram
   */
  addComponent(
    componentType: string,
    position: SLDPosition,
    specifications?: Record<string, any>
  ): string {
    const component: SLDComponent = {
      id: `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: componentType as any,
      name: `${componentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      position,
      width: 80,
      height: 60,
      specifications: specifications || {}
    };

    this.addToHistory('add_component', `Added ${component.name}`);
    this.workspace.diagram.components.push(component);
    this.workspace.mode = this.workspace.mode === 'intelligent' ? 'hybrid' : 'manual';

    if (this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    this.notifyUpdate();
    return component.id;
  }

  /**
   * Update component properties
   */
  updateComponent(componentId: string, updates: Partial<SLDComponent>): void {
    const componentIndex = this.workspace.diagram.components.findIndex(c => c.id === componentId);
    if (componentIndex === -1) return;

    this.addToHistory('update_component', `Updated component ${componentId}`);
    this.workspace.diagram.components[componentIndex] = {
      ...this.workspace.diagram.components[componentIndex],
      ...updates
    };

    if (this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    if (this.workspace.settings.autoRoute && updates.position) {
      this.updateWireRoutes();
    }

    this.notifyUpdate();
  }

  /**
   * Remove component from diagram
   */
  removeComponent(componentId: string): void {
    const component = this.workspace.diagram.components.find(c => c.id === componentId);
    if (!component) return;

    this.addToHistory('remove_component', `Removed component ${component.name}`);
    
    // Remove component
    this.workspace.diagram.components = this.workspace.diagram.components.filter(
      c => c.id !== componentId
    );

    // Remove related connections
    this.workspace.diagram.connections = this.workspace.diagram.connections?.filter(
      c => c.from !== componentId && c.to !== componentId
    ) || [];

    // Remove from selection
    this.workspace.canvasState.selectedComponents = this.workspace.canvasState.selectedComponents.filter(
      id => id !== componentId
    );

    if (this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    if (this.workspace.settings.autoRoute) {
      this.updateWireRoutes();
    }

    this.notifyUpdate();
  }

  /**
   * Add connection between components
   */
  addConnection(fromId: string, toId: string, specifications?: Record<string, any>): string {
    const connection: SLDConnection = {
      id: `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      from: fromId,
      to: toId,
      type: 'power',
      specifications: specifications || {}
    };

    this.addToHistory('add_connection', `Added connection ${fromId} to ${toId}`);
    
    if (!this.workspace.diagram.connections) {
      this.workspace.diagram.connections = [];
    }
    this.workspace.diagram.connections.push(connection);

    if (this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    if (this.workspace.settings.autoRoute) {
      this.updateWireRoutes();
    }

    this.notifyUpdate();
    return connection.id;
  }

  /**
   * Remove connection from diagram
   */
  removeConnection(connectionId: string): void {
    if (!this.workspace.diagram.connections) return;

    this.addToHistory('remove_connection', `Removed connection ${connectionId}`);
    this.workspace.diagram.connections = this.workspace.diagram.connections.filter(
      c => c.id !== connectionId
    );

    this.workspace.canvasState.selectedConnections = this.workspace.canvasState.selectedConnections.filter(
      id => id !== connectionId
    );

    if (this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    if (this.workspace.settings.autoRoute) {
      this.updateWireRoutes();
    }

    this.notifyUpdate();
  }

  /**
   * Update real-time NEC validation
   */
  async updateValidation(): Promise<void> {
    if (!this.workspace.settings.autoValidate) return;

    try {
      this.workspace.validation = this.necValidator.validateDiagram(this.workspace.diagram);
      this.notifyUpdate();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }

  /**
   * Update wire routing
   */
  async updateWireRoutes(): Promise<void> {
    if (!this.workspace.settings.autoRoute || !this.workspace.diagram.connections) return;

    try {
      const routes = generateAllWireRoutes(
        this.workspace.diagram.connections,
        this.workspace.diagram.components,
        this.workspace.settings.routingConstraints
      );

      this.workspace.wireRoutes = optimizeWireRoutes(routes);
      this.notifyUpdate();
    } catch (error) {
      console.error('Wire routing failed:', error);
    }
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.workspace.historyIndex <= 0) return false;

    this.workspace.historyIndex--;
    const entry = this.workspace.history[this.workspace.historyIndex];
    this.workspace.diagram = JSON.parse(JSON.stringify(entry.diagram));

    if (this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    if (this.workspace.settings.autoRoute) {
      this.updateWireRoutes();
    }

    this.notifyUpdate();
    return true;
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.workspace.historyIndex >= this.workspace.history.length - 1) return false;

    this.workspace.historyIndex++;
    const entry = this.workspace.history[this.workspace.historyIndex];
    this.workspace.diagram = JSON.parse(JSON.stringify(entry.diagram));

    if (this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    if (this.workspace.settings.autoRoute) {
      this.updateWireRoutes();
    }

    this.notifyUpdate();
    return true;
  }

  /**
   * Update canvas state
   */
  updateCanvasState(updates: Partial<SLDWorkspace['canvasState']>): void {
    this.workspace.canvasState = {
      ...this.workspace.canvasState,
      ...updates
    };

    if (updates.gridEnabled !== undefined || updates.gridSize !== undefined) {
      this.workspace.settings.routingConstraints.gridSnap = updates.gridEnabled ?? this.workspace.canvasState.gridEnabled;
      this.workspace.settings.routingConstraints.gridSize = updates.gridSize ?? this.workspace.canvasState.gridSize;
      
      if (this.workspace.settings.autoRoute) {
        this.updateWireRoutes();
      }
    }

    this.notifyUpdate();
  }

  /**
   * Update workspace settings
   */
  updateSettings(updates: Partial<SLDWorkspace['settings']>): void {
    this.workspace.settings = {
      ...this.workspace.settings,
      ...updates
    };

    // Trigger updates based on changed settings
    if (updates.autoValidate && this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    if (updates.autoRoute && this.workspace.settings.autoRoute) {
      this.updateWireRoutes();
    }

    this.notifyUpdate();
  }

  /**
   * Export workspace to JSON
   */
  exportWorkspace(): string {
    return JSON.stringify(this.workspace, null, 2);
  }

  /**
   * Import workspace from JSON
   */
  importWorkspace(json: string): void {
    try {
      const imported = JSON.parse(json);
      this.workspace = this.createDefaultWorkspace(imported);
      
      if (this.workspace.settings.autoValidate) {
        this.updateValidation();
      }

      if (this.workspace.settings.autoRoute) {
        this.updateWireRoutes();
      }

      this.notifyUpdate();
    } catch (error) {
      console.error('Failed to import workspace:', error);
      throw new Error('Invalid workspace format');
    }
  }

  /**
   * Get current workspace
   */
  getWorkspace(): SLDWorkspace {
    return this.workspace;
  }

  /**
   * Get validation summary
   */
  getValidationSummary(): string {
    return this.necValidator.getValidationSummary(this.workspace.validation);
  }

  /**
   * Clear workspace and start fresh
   */
  clearWorkspace(): void {
    this.addToHistory('clear_workspace', 'Cleared workspace');
    this.workspace.diagram.components = [];
    this.workspace.diagram.connections = [];
    this.workspace.wireRoutes = [];
    this.workspace.canvasState.selectedComponents = [];
    this.workspace.canvasState.selectedConnections = [];

    if (this.workspace.settings.autoValidate) {
      this.updateValidation();
    }

    this.notifyUpdate();
  }
}

export default ComprehensiveSLDService;