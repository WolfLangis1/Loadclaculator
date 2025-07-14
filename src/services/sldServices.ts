// SLD Services - Unified Export
// This file provides a clean API for all SLD-related services

// Core Services
export { sldIntegrationService } from './sldIntegrationService';
export { SLDWireService } from './sldWireService';
export { SLDNECEngine } from './sldNECEngine';
export { SLDLoadFlowService } from './sldLoadFlowService';
export { SLDExportService } from './sldExportService';
export { collaborationService } from './sldCollaborationService';
export { CommandManager } from './sldCommandService';

// Types
export type {
  SLDIntegrationResult,
  SLDComprehensiveAnalysis,
  SLDProjectData
} from './sldIntegrationService';

export type {
  WireCalculation
} from './sldWireService';

export type {
  NECComplianceReport,
  NECRule
} from './sldNECEngine';

export type {
  LoadFlowAnalysis,
  CircuitPath
} from './sldLoadFlowService';

export type {
  ExportOptions,
  ExportResult
} from './sldExportService';

export type {
  User,
  CollaborationSession,
  ConflictResolution
} from './sldCollaborationService';

export type {
  SLDCommand,
  CommandHistory
} from './sldCommandService';

// Utility Functions
export const SLDServices = {
  // Integration
  initialize: (diagram: any, user?: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return sldIntegrationService.initialize(diagram, user);
  },

  // Analysis
  analyzeDiagram: async (diagram: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return await sldIntegrationService.performComprehensiveAnalysis(diagram);
  },

  optimizeDiagram: async (diagram: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return await sldIntegrationService.autoOptimizeDiagram(diagram);
  },

  // Validation
  validateDiagram: (diagram: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return sldIntegrationService.validateDiagram(diagram);
  },

  // Export
  exportDiagram: async (diagram: any, format: string, options?: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return await sldIntegrationService.exportDiagram(diagram, format as any, options);
  },

  generatePermitPackage: async (diagram: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return await sldIntegrationService.generatePermitPackage(diagram);
  },

  // Collaboration
  startCollaboration: (diagram: any, user: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return sldIntegrationService.startCollaboration(diagram, user);
  },

  joinCollaboration: (sessionId: string, user: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return sldIntegrationService.joinCollaboration(sessionId, user);
  },

  // Statistics
  getProjectStatistics: (diagram: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return sldIntegrationService.getProjectStatistics(diagram);
  },

  // Cleanup
  cleanup: () => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    return sldIntegrationService.cleanup();
  }
};

// Quick Start Functions
export const SLDQuickStart = {
  // Create a new diagram with basic components
  createBasicDiagram: (name: string, systemType: 'grid_tied' | 'grid_tied_with_battery' | 'off_grid' = 'grid_tied') => {
    return {
      id: `diagram-${Date.now()}`,
      projectId: 'default',
      name,
      systemType,
      necCodeYear: '2023' as const,
      version: '1.0',
      created: new Date(),
      lastModified: new Date(),
      components: [],
      connections: [],
      labels: [],
      designedBy: '',
      ahj: '',
      projectAddress: '',
      totalSystemSize: 0,
      gridVoltage: 240,
      gridFrequency: 60,
      zoom: 1,
      pan: { x: 0, y: 0 }
    };
  },

  // Add a basic solar system
  addBasicSolarSystem: (diagram: any) => {
    const updatedDiagram = { ...diagram };
    
    // Add solar panels
    const solarPanel = {
      id: 'solar-panel-1',
      type: 'pv_array',
      name: 'Solar Array',
      position: { x: 100, y: 100 },
      size: { width: 80, height: 40 },
      properties: {
        powerRating: 5000,
        voltage: 400,
        current: 12.5
      },
      label: 'SP1',
      notes: '5kW Solar Array'
    };

    // Add inverter
    const inverter = {
      id: 'inverter-1',
      type: 'inverter',
      name: 'Grid-Tie Inverter',
      position: { x: 300, y: 100 },
      size: { width: 60, height: 40 },
      properties: {
        powerRating: 5000,
        inputVoltage: 400,
        outputVoltage: 240,
        efficiency: 96.5
      },
      label: 'INV1',
      notes: '5kW Grid-Tie Inverter'
    };

    // Add main panel
    const mainPanel = {
      id: 'main-panel-1',
      type: 'main_panel',
      name: 'Main Electrical Panel',
      position: { x: 500, y: 100 },
      size: { width: 60, height: 40 },
      properties: {
        busRating: 200,
        mainBreaker: 200,
        availableSpaces: 20
      },
      label: 'MP1',
      notes: '200A Main Panel'
    };

    // Add connections
    const connection1 = {
      id: 'connection-1',
      fromComponentId: 'solar-panel-1',
      toComponentId: 'inverter-1',
      properties: {
        wireSize: '8',
        wireType: 'THHN',
        conduitType: 'EMT',
        length: 50,
        current: 12.5,
        voltage: 400
      },
      path: [
        { x: 180, y: 120 },
        { x: 300, y: 120 }
      ],
      label: 'W1',
      notes: 'DC Connection'
    };

    const connection2 = {
      id: 'connection-2',
      fromComponentId: 'inverter-1',
      toComponentId: 'main-panel-1',
      properties: {
        wireSize: '10',
        wireType: 'THHN',
        conduitType: 'EMT',
        length: 30,
        current: 20.8,
        voltage: 240
      },
      path: [
        { x: 360, y: 120 },
        { x: 500, y: 120 }
      ],
      label: 'W2',
      notes: 'AC Connection'
    };

    updatedDiagram.components = [solarPanel, inverter, mainPanel];
    updatedDiagram.connections = [connection1, connection2];
    updatedDiagram.totalSystemSize = 5;

    return updatedDiagram;
  },

  // Validate and optimize a diagram
  validateAndOptimize: async (diagram: any) => {
    const { sldIntegrationService } = require('./sldIntegrationService');
    
    // Initialize service
    sldIntegrationService.initialize(diagram);
    
    // Perform analysis
    const analysis = await sldIntegrationService.performComprehensiveAnalysis(diagram);
    
    // Auto-optimize if needed
    let optimizedDiagram = diagram;
    if (analysis.overallScore < 80) {
      optimizedDiagram = await sldIntegrationService.autoOptimizeDiagram(diagram);
    }
    
    return {
      originalDiagram: diagram,
      optimizedDiagram,
      analysis,
      recommendations: analysis.recommendations
    };
  }
};

// Default export for convenience
export default SLDServices; 