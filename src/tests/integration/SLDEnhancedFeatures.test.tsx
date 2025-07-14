import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SLDProvider } from '../../context/SLDContext';
import { sldIntegrationService } from '../../services/sldIntegrationService';
import { SLDWireService } from '../../services/sldWireService';
import { SLDNECEngine } from '../../services/sldNECEngine';
import { SLDLoadFlowService } from '../../services/sldLoadFlowService';
import { SLDExportService } from '../../services/sldExportService';
import type { SLDDiagram, SLDComponent, SLDConnection } from '../../types/sld';

// Mock services
vi.mock('../../services/sldWireService');
vi.mock('../../services/sldNECEngine');
vi.mock('../../services/sldLoadFlowService');
vi.mock('../../services/sldExportService');

describe('Enhanced SLD Features Integration', () => {
  let mockDiagram: SLDDiagram;
  let mockComponent: SLDComponent;
  let mockConnection: SLDConnection;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock diagram
    mockDiagram = {
      id: 'test-diagram',
      projectId: 'test-project',
      name: 'Test Solar System',
      systemType: 'grid_tied' as const,
      necCodeYear: '2023' as const,
      version: '1.0',
      created: new Date(),
      lastModified: new Date(),
      components: [],
      connections: [],
      labels: [],
      notes: [],
      designedBy: 'Test Engineer',
      ahj: 'Test City',
      projectAddress: '123 Test St',
      totalSystemSize: 10,
      gridVoltage: 240,
      gridFrequency: 60,
      zoom: 1,
      pan: { x: 0, y: 0 }
    };

    // Create mock component
    mockComponent = {
      id: 'test-component',
      type: 'solar_panel',
      name: 'Solar Panel 1',
      position: { x: 100, y: 100 },
      size: { width: 50, height: 30 },
      properties: {
        powerRating: 400,
        voltage: 48,
        current: 8.33
      },
      label: 'SP1',
      notes: 'Test solar panel'
    };

    // Create mock connection
    mockConnection = {
      id: 'test-connection',
      fromComponentId: 'test-component',
      toComponentId: 'test-component-2',
      type: 'wire',
      properties: {
        wireSize: '10',
        wireType: 'THHN',
        conduitType: 'EMT',
        length: 50,
        current: 8.33,
        voltage: 48
      },
      path: [
        { x: 100, y: 100 },
        { x: 200, y: 200 }
      ],
      label: 'W1',
      notes: 'Test wire connection'
    };

    // Initialize integration service
    sldIntegrationService.initialize(mockDiagram);
  });

  afterEach(() => {
    sldIntegrationService.cleanup();
  });

  describe('Integration Service', () => {
    it('should initialize with diagram', () => {
      expect(sldIntegrationService.getCommandManager()).toBeTruthy();
    });

    it('should perform comprehensive analysis', async () => {
      // Mock service responses
      const mockWireAnalysis = [{
        conductorSize: '10',
        conduitSize: '3/4"',
        voltageDrop: 2.1,
        voltageDropPercent: 0.88,
        ampacity: 35,
        necCompliance: true,
        recommendations: ['Use larger wire for better efficiency']
      }];

      const mockNECCompliance = {
        overallCompliant: true,
        summary: { errors: 0, warnings: 2, autoFixable: 1 },
        violations: [],
        recommendations: ['Consider adding labels']
      };

      const mockLoadFlow = {
        efficiency: 97.5,
        criticalPaths: [],
        circuitPaths: [],
        recommendations: ['Optimize layout']
      };

      vi.mocked(SLDWireService.calculateWireSizing).mockReturnValue(mockWireAnalysis[0]);
      vi.mocked(SLDNECEngine.validateDiagram).mockReturnValue(mockNECCompliance);
      vi.mocked(SLDLoadFlowService.analyzeCircuit).mockReturnValue(mockLoadFlow);

      const analysis = await sldIntegrationService.performComprehensiveAnalysis(mockDiagram);

      expect(analysis).toEqual({
        diagram: mockDiagram,
        wireAnalysis: mockWireAnalysis,
        necCompliance: mockNECCompliance,
        loadFlow: mockLoadFlow,
        recommendations: expect.arrayContaining([
          expect.stringContaining('Consider larger wire sizes'),
          expect.stringContaining('Apply auto-fixes')
        ]),
        overallScore: expect.any(Number)
      });
    });

    it('should validate diagram for issues', () => {
      const issues = sldIntegrationService.validateDiagram(mockDiagram);

      expect(issues).toEqual([
        {
          type: 'warning',
          message: 'No components added to diagram'
        },
        {
          type: 'warning',
          message: 'No connections between components'
        }
      ]);
    });

    it('should get project statistics', () => {
      const stats = sldIntegrationService.getProjectStatistics(mockDiagram);

      expect(stats).toEqual({
        components: 0,
        connections: 0,
        systemType: 'grid_tied',
        complexity: 'low',
        estimatedCost: 0
      });
    });
  });

  describe('Command Management', () => {
    it('should execute commands', () => {
      const commandManager = sldIntegrationService.getCommandManager();
      expect(commandManager).toBeTruthy();

      // Test command execution
      const mockCommand = {
        execute: vi.fn(),
        undo: vi.fn(),
        description: 'Test command'
      };

      commandManager?.executeCommand(mockCommand);
      expect(mockCommand.execute).toHaveBeenCalled();
    });

    it('should support undo/redo', () => {
      const commandManager = sldIntegrationService.getCommandManager();
      expect(commandManager).toBeTruthy();

      // Test undo/redo state
      expect(commandManager?.canUndo()).toBe(false);
      expect(commandManager?.canRedo()).toBe(false);
    });
  });

  describe('Wire Sizing Service', () => {
    it('should calculate wire sizing', () => {
      const mockResult = {
        conductorSize: '10',
        conduitSize: '3/4"',
        voltageDrop: 2.1,
        voltageDropPercent: 0.88,
        ampacity: 35,
        necCompliance: true,
        recommendations: ['Use larger wire for better efficiency']
      };

      vi.mocked(SLDWireService.calculateWireSizing).mockReturnValue(mockResult);

      const result = SLDWireService.calculateWireSizing(mockConnection, 50);
      expect(result).toEqual(mockResult);
    });

    it('should validate wire sizing', () => {
      const mockValidation = {
        isValid: true,
        issues: [],
        recommendations: ['Consider larger wire size']
      };

      vi.mocked(SLDWireService.validateWireSizing).mockReturnValue(mockValidation);

      const validation = SLDWireService.validateWireSizing(mockConnection);
      expect(validation).toEqual(mockValidation);
    });
  });

  describe('NEC Compliance Engine', () => {
    it('should validate diagram compliance', () => {
      const mockCompliance = {
        overallCompliant: true,
        summary: { errors: 0, warnings: 2, autoFixable: 1 },
        violations: [],
        recommendations: ['Add component labels']
      };

      vi.mocked(SLDNECEngine.validateDiagram).mockReturnValue(mockCompliance);

      const compliance = SLDNECEngine.validateDiagram(mockDiagram);
      expect(compliance).toEqual(mockCompliance);
    });

    it('should auto-fix violations', () => {
      const mockFixedDiagram = { ...mockDiagram, components: [mockComponent] };
      vi.mocked(SLDNECEngine.autoFixViolations).mockReturnValue(mockFixedDiagram);

      const fixedDiagram = SLDNECEngine.autoFixViolations(mockDiagram);
      expect(fixedDiagram).toEqual(mockFixedDiagram);
    });
  });

  describe('Load Flow Analysis', () => {
    it('should analyze circuit', () => {
      const mockAnalysis = {
        efficiency: 97.5,
        criticalPaths: [],
        circuitPaths: [],
        recommendations: ['Optimize layout']
      };

      vi.mocked(SLDLoadFlowService.analyzeCircuit).mockReturnValue(mockAnalysis);

      const analysis = SLDLoadFlowService.analyzeCircuit(mockDiagram);
      expect(analysis).toEqual(mockAnalysis);
    });

    it('should optimize layout', () => {
      const mockOptimizedDiagram = { ...mockDiagram, components: [mockComponent] };
      vi.mocked(SLDLoadFlowService.optimizeLayout).mockReturnValue(mockOptimizedDiagram);

      const optimizedDiagram = SLDLoadFlowService.optimizeLayout(mockDiagram);
      expect(optimizedDiagram).toEqual(mockOptimizedDiagram);
    });
  });

  describe('Export Service', () => {
    it('should export to PDF', async () => {
      const mockResult = {
        success: true,
        data: new Blob(['PDF content'], { type: 'application/pdf' }),
        error: undefined
      };

      vi.mocked(SLDExportService.exportToPDF).mockResolvedValue(mockResult);

      const result = await SLDExportService.exportToPDF(mockDiagram);
      expect(result).toEqual(mockResult);
    });

    it('should export to SVG', async () => {
      const mockResult = {
        success: true,
        data: '<svg>...</svg>',
        error: undefined
      };

      vi.mocked(SLDExportService.exportToSVG).mockResolvedValue(mockResult);

      const result = await SLDExportService.exportToSVG(mockDiagram);
      expect(result).toEqual(mockResult);
    });

    it('should generate permit package', async () => {
      const mockPermitData = {
        diagram: mockDiagram,
        necCompliance: { overallCompliant: true, summary: { errors: 0, warnings: 0, autoFixable: 0 }, violations: [], recommendations: [] },
        loadFlow: { efficiency: 98, criticalPaths: [], circuitPaths: [], recommendations: [] },
        projectInfo: {
          name: 'Test System',
          systemType: 'grid_tied',
          necCodeYear: '2023',
          designedBy: 'Test Engineer',
          ahj: 'Test City'
        },
        calculations: [],
        aerialView: null
      };

      const mockResult = {
        success: true,
        data: new Blob(['Permit package'], { type: 'application/pdf' }),
        error: undefined
      };

      vi.mocked(SLDExportService.generatePermitPackage).mockResolvedValue(mockResult);

      const result = await SLDExportService.generatePermitPackage(mockPermitData);
      expect(result).toEqual(mockResult);
    });
  });

  describe('Collaboration Features', () => {
    it('should start collaboration session', () => {
      const user = {
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
        color: '#3b82f6',
        isOnline: true,
        lastActivity: new Date()
      };

      const session = sldIntegrationService.startCollaboration(mockDiagram, user);
      expect(session).toBeTruthy();
      expect(session.diagramId).toBe(mockDiagram.id);
      expect(session.users).toContain(user);
    });

    it('should join collaboration session', () => {
      const user = {
        id: 'user_456',
        name: 'Another User',
        email: 'another@example.com',
        color: '#ef4444',
        isOnline: true,
        lastActivity: new Date()
      };

      // First create a session
      const session = sldIntegrationService.startCollaboration(mockDiagram, user);
      
      // Then join it
      const joinedSession = sldIntegrationService.joinCollaboration(session.id, user);
      expect(joinedSession).toBeTruthy();
      expect(joinedSession?.users).toContain(user);
    });
  });

  describe('Error Handling', () => {
    it('should handle analysis errors gracefully', async () => {
      vi.mocked(SLDWireService.calculateWireSizing).mockImplementation(() => {
        throw new Error('Wire sizing calculation failed');
      });

      await expect(sldIntegrationService.performComprehensiveAnalysis(mockDiagram))
        .rejects.toThrow('Comprehensive analysis failed: Wire sizing calculation failed');
    });

    it('should handle export errors gracefully', async () => {
      vi.mocked(SLDExportService.exportToPDF).mockRejectedValue(new Error('PDF generation failed'));

      const result = await sldIntegrationService.exportDiagram(mockDiagram, 'pdf');
      expect(result.success).toBe(false);
      expect(result.error).toBe('PDF generation failed');
    });
  });

  describe('Performance Features', () => {
    it('should optimize rendering for large diagrams', () => {
      const largeDiagram = {
        ...mockDiagram,
        components: Array.from({ length: 100 }, (_, i) => ({
          ...mockComponent,
          id: `component-${i}`,
          name: `Component ${i}`
        }))
      };

      const stats = sldIntegrationService.getProjectStatistics(largeDiagram);
      expect(stats.complexity).toBe('high');
      expect(stats.components).toBe(100);
    });

    it('should validate large diagrams efficiently', () => {
      const largeDiagram = {
        ...mockDiagram,
        components: Array.from({ length: 50 }, (_, i) => ({
          ...mockComponent,
          id: `component-${i}`,
          name: `Component ${i}`
        }))
      };

      const issues = sldIntegrationService.validateDiagram(largeDiagram);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues.some(issue => issue.type === 'warning')).toBe(true);
    });
  });

  describe('Integration with React Context', () => {
    const TestComponent = () => {
      return (
        <div>
          <h1>SLD Test Component</h1>
          <button data-testid="analyze-btn">Analyze</button>
          <button data-testid="export-btn">Export</button>
        </div>
      );
    };

    it('should provide SLD context', () => {
      render(
        <SLDProvider>
          <TestComponent />
        </SLDProvider>
      );

      expect(screen.getByText('SLD Test Component')).toBeInTheDocument();
      expect(screen.getByTestId('analyze-btn')).toBeInTheDocument();
      expect(screen.getByTestId('export-btn')).toBeInTheDocument();
    });

    it('should handle user interactions', async () => {
      const mockAnalysis = {
        diagram: mockDiagram,
        wireAnalysis: [],
        necCompliance: { overallCompliant: true, summary: { errors: 0, warnings: 0, autoFixable: 0 }, violations: [], recommendations: [] },
        loadFlow: { efficiency: 98, criticalPaths: [], circuitPaths: [], recommendations: [] },
        recommendations: [],
        overallScore: 95
      };

      vi.mocked(sldIntegrationService.performComprehensiveAnalysis).mockResolvedValue(mockAnalysis);

      render(
        <SLDProvider>
          <TestComponent />
        </SLDProvider>
      );

      const analyzeBtn = screen.getByTestId('analyze-btn');
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(sldIntegrationService.performComprehensiveAnalysis).toHaveBeenCalled();
      });
    });
  });
}); 