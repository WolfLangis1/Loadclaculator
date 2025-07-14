import type { SLDDiagram, SLDComponent, SLDConnection } from '../types/sld';
import { SLDWireService, type WireCalculation } from './sldWireService';
import { SLDNECEngine, type NECComplianceReport } from './sldNECEngine';
import { SLDLoadFlowService, type LoadFlowAnalysis } from './sldLoadFlowService';
import { SLDExportService, type ExportOptions } from './sldExportService';
import { collaborationService, type User, type CollaborationSession } from './sldCollaborationService';
import { CommandManager, type SLDCommand } from './sldCommandService';

export interface SLDIntegrationResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: Date;
}

export interface SLDComprehensiveAnalysis {
  diagram: SLDDiagram;
  wireAnalysis: WireCalculation[];
  necCompliance: NECComplianceReport;
  loadFlow: LoadFlowAnalysis;
  recommendations: string[];
  overallScore: number;
}

export interface SLDProjectData {
  diagram: SLDDiagram;
  analysis: SLDComprehensiveAnalysis;
  collaboration?: CollaborationSession;
  exportHistory: Array<{
    format: string;
    timestamp: Date;
    filename: string;
  }>;
  versionHistory: Array<{
    version: string;
    timestamp: Date;
    changes: string[];
  }>;
}

export class SLDIntegrationService {
  private static instance: SLDIntegrationService;
  private commandManager: CommandManager | null = null;
  private currentUser: User | null = null;

  static getInstance(): SLDIntegrationService {
    if (!SLDIntegrationService.instance) {
      SLDIntegrationService.instance = new SLDIntegrationService();
    }
    return SLDIntegrationService.instance;
  }

  /**
   * Initialize the integration service with a diagram
   */
  initialize(diagram: SLDDiagram, user?: User): void {
    this.commandManager = new CommandManager(diagram);
    if (user) {
      this.currentUser = user;
    }
  }

  /**
   * Perform comprehensive analysis of the diagram
   */
  async performComprehensiveAnalysis(diagram: SLDDiagram): Promise<SLDComprehensiveAnalysis> {
    try {
      // Wire sizing analysis
      const wireAnalysis = diagram.connections.map(connection => 
        SLDWireService.calculateWireSizing(connection, 50)
      );

      // NEC compliance analysis
      const necCompliance = SLDNECEngine.validateDiagram(diagram);

      // Load flow analysis
      const loadFlow = SLDLoadFlowService.analyzeCircuit(diagram);

      // Generate comprehensive recommendations
      const recommendations = this.generateComprehensiveRecommendations(
        wireAnalysis,
        necCompliance,
        loadFlow
      );

      // Calculate overall score
      const overallScore = this.calculateOverallScore(necCompliance, loadFlow);

      return {
        diagram,
        wireAnalysis,
        necCompliance,
        loadFlow,
        recommendations,
        overallScore
      };
    } catch (error) {
      throw new Error(`Comprehensive analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Auto-optimize diagram based on analysis results
   */
  async autoOptimizeDiagram(diagram: SLDDiagram): Promise<SLDDiagram> {
    try {
      let optimizedDiagram = { ...diagram };

      // Apply NEC auto-fixes
      optimizedDiagram = SLDNECEngine.autoFixViolations(optimizedDiagram);

      // Optimize layout based on load flow
      optimizedDiagram = SLDLoadFlowService.optimizeLayout(optimizedDiagram);

      // Apply wire sizing optimizations
      optimizedDiagram = this.applyWireSizingOptimizations(optimizedDiagram);

      return optimizedDiagram;
    } catch (error) {
      throw new Error(`Auto-optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate professional permit package
   */
  async generatePermitPackage(diagram: SLDDiagram): Promise<SLDIntegrationResult> {
    try {
      const analysis = await this.performComprehensiveAnalysis(diagram);
      
      const permitData = {
        diagram,
        necCompliance: analysis.necCompliance,
        loadFlow: analysis.loadFlow,
        projectInfo: {
          name: diagram.name,
          systemType: diagram.systemType,
          necCodeYear: diagram.necCodeYear,
          designedBy: diagram.designedBy,
          ahj: diagram.ahj
        },
        calculations: analysis.wireAnalysis,
        aerialView: null // Would be populated from aerial view service
      };

      const result = await SLDExportService.generatePermitPackage(permitData);
      
      return {
        success: result.success,
        data: result.data,
        error: result.error,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Start collaboration session
   */
  startCollaboration(diagram: SLDDiagram, user: User): CollaborationSession {
    this.currentUser = user;
    return collaborationService.createSession(diagram.id, user);
  }

  /**
   * Join collaboration session
   */
  joinCollaboration(sessionId: string, user: User): CollaborationSession | null {
    this.currentUser = user;
    return collaborationService.joinSession(sessionId, user);
  }

  /**
   * Execute command with integration
   */
  executeCommand(command: SLDCommand): void {
    if (!this.commandManager) {
      throw new Error('Integration service not initialized');
    }
    this.commandManager.executeCommand(command);
  }

  /**
   * Export diagram with comprehensive options
   */
  async exportDiagram(
    diagram: SLDDiagram,
    format: 'pdf' | 'svg' | 'png' | 'json' | 'dxf',
    options: Partial<ExportOptions> = {}
  ): Promise<SLDIntegrationResult> {
    try {
      let result;
      
      switch (format) {
        case 'pdf':
          result = await SLDExportService.exportToPDF(diagram, options);
          break;
        case 'svg':
          result = await SLDExportService.exportToSVG(diagram, options);
          break;
        case 'png':
          result = await SLDExportService.exportToPNG(diagram, options);
          break;
        case 'json':
          result = SLDExportService.exportToJSON(diagram, options);
          break;
        case 'dxf':
          result = await SLDExportService.exportToCAD(diagram, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      return {
        success: result.success,
        data: result.data,
        error: result.error,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate diagram for common issues
   */
  validateDiagram(diagram: SLDDiagram): Array<{ type: 'error' | 'warning' | 'info'; message: string; componentId?: string }> {
    const issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; componentId?: string }> = [];

    // Basic validation
    if (diagram.components.length === 0) {
      issues.push({
        type: 'warning',
        message: 'No components added to diagram'
      });
    }

    if (diagram.connections.length === 0) {
      issues.push({
        type: 'warning',
        message: 'No connections between components'
      });
    }

    // Component validation
    diagram.components.forEach(component => {
      if (!component.name || component.name.trim() === '') {
        issues.push({
          type: 'error',
          message: 'Component must have a name',
          componentId: component.id
        });
      }
    });

    // Connection validation
    diagram.connections.forEach(connection => {
      const fromComponent = diagram.components.find(c => c.id === connection.fromComponentId);
      const toComponent = diagram.components.find(c => c.id === connection.toComponentId);
      
      if (!fromComponent || !toComponent) {
        issues.push({
          type: 'error',
          message: 'Connection references non-existent component',
          componentId: connection.id
        });
      }
    });

    return issues;
  }

  /**
   * Get project statistics
   */
  getProjectStatistics(diagram: SLDDiagram): {
    components: number;
    connections: number;
    systemType: string;
    complexity: 'low' | 'medium' | 'high';
    estimatedCost: number;
  } {
    const componentCount = diagram.components.length;
    const connectionCount = diagram.connections.length;
    
    // Calculate complexity
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (componentCount > 20 || connectionCount > 30) {
      complexity = 'high';
    } else if (componentCount > 10 || connectionCount > 15) {
      complexity = 'medium';
    }

    // Estimate cost (simplified)
    const estimatedCost = componentCount * 100 + connectionCount * 50;

    return {
      components: componentCount,
      connections: connectionCount,
      systemType: diagram.systemType,
      complexity,
      estimatedCost
    };
  }

  /**
   * Generate comprehensive recommendations
   */
  private generateComprehensiveRecommendations(
    wireAnalysis: WireCalculation[],
    necCompliance: NECComplianceReport,
    loadFlow: LoadFlowAnalysis
  ): string[] {
    const recommendations: string[] = [];

    // Wire sizing recommendations
    const highVoltageDrop = wireAnalysis.filter(w => w.voltageDropPercent > 2);
    if (highVoltageDrop.length > 0) {
      recommendations.push(`Consider larger wire sizes for ${highVoltageDrop.length} connection(s) to reduce voltage drop`);
    }

    // NEC compliance recommendations
    if (!necCompliance.overallCompliant) {
      recommendations.push(`Fix ${necCompliance.summary.errors} NEC compliance issue(s)`);
    }

    if (necCompliance.summary.autoFixable > 0) {
      recommendations.push(`Apply auto-fixes for ${necCompliance.summary.autoFixable} issue(s)`);
    }

    // Load flow recommendations
    if (loadFlow.efficiency < 95) {
      recommendations.push('Optimize circuit layout to improve efficiency');
    }

    if (loadFlow.criticalPaths.length > 0) {
      recommendations.push(`Review ${loadFlow.criticalPaths.length} critical circuit path(s)`);
    }

    return recommendations;
  }

  /**
   * Calculate overall project score
   */
  private calculateOverallScore(necCompliance: NECComplianceReport, loadFlow: LoadFlowAnalysis): number {
    let score = 100;

    // Deduct for NEC violations
    score -= necCompliance.summary.errors * 10;
    score -= necCompliance.summary.warnings * 2;

    // Deduct for load flow issues
    if (loadFlow.efficiency < 95) {
      score -= (95 - loadFlow.efficiency) * 2;
    }

    score -= loadFlow.criticalPaths.length * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Apply wire sizing optimizations
   */
  private applyWireSizingOptimizations(diagram: SLDDiagram): SLDDiagram {
    const optimizedDiagram = { ...diagram };
    
    optimizedDiagram.connections = optimizedDiagram.connections.map(connection => {
      const wireAnalysis = SLDWireService.calculateWireSizing(connection, 50);
      
      if (wireAnalysis.voltageDropPercent > 3) {
        // Add optimization note
        return {
          ...connection,
          label: connection.label ? `${connection.label} (OPTIMIZE WIRE SIZE)` : 'OPTIMIZE WIRE SIZE'
        };
      }
      
      return connection;
    });

    return optimizedDiagram;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get command manager
   */
  getCommandManager(): CommandManager | null {
    return this.commandManager;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    collaborationService.cleanup();
    this.commandManager = null;
    this.currentUser = null;
  }
}

// Export singleton instance
export const sldIntegrationService = SLDIntegrationService.getInstance(); 