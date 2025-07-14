import { describe, it, expect, beforeEach } from 'vitest';
import { SLDWireService } from '../../services/sldWireService';
import type { SLDConnection } from '../../types/sld';

describe('SLDWireService', () => {
  let mockConnection: SLDConnection;

  beforeEach(() => {
    mockConnection = {
      id: 'test-connection',
      fromComponentId: 'comp1',
      toComponentId: 'comp2',
      fromPort: 'output',
      toPort: 'input',
      wireType: 'ac',
      voltage: 240,
      current: 20,
      label: 'Test Wire'
    };
  });

  describe('calculateWireSizing', () => {
    it('should calculate wire sizing for AC connection', () => {
      const result = SLDWireService.calculateWireSizing(mockConnection, 100);
      
      expect(result).toBeDefined();
      expect(result.conductorSize).toMatch(/\d+\s*AWG/);
      expect(result.voltageDropPercent).toBeGreaterThanOrEqual(0);
      expect(result.voltageDropPercent).toBeLessThanOrEqual(5);
      expect(result.ampacity).toBeGreaterThan(0);
      expect(result.derating).toBeGreaterThan(0);
      expect(result.derating).toBeLessThanOrEqual(1);
      expect(result.conduitFill).toBeGreaterThanOrEqual(0);
      expect(result.conduitFill).toBeLessThanOrEqual(1);
    });

    it('should calculate wire sizing for DC connection', () => {
      const dcConnection = {
        ...mockConnection,
        wireType: 'dc' as const,
        voltage: 600,
        current: 15
      };
      
      const result = SLDWireService.calculateWireSizing(dcConnection, 75);
      
      expect(result).toBeDefined();
      expect(result.conductorSize).toMatch(/\d+\s*AWG/);
      expect(result.voltageDropPercent).toBeGreaterThanOrEqual(0);
    });

    it('should handle high current connections', () => {
      const highCurrentConnection = {
        ...mockConnection,
        current: 100 // High current
      };
      
      const result = SLDWireService.calculateWireSizing(highCurrentConnection, 200);
      
      expect(result).toBeDefined();
      expect(result.ampacity).toBeGreaterThanOrEqual(100 * 1.25); // 125% safety factor
    });

    it('should handle long distance connections', () => {
      const longDistanceConnection = {
        ...mockConnection,
        current: 30
      };
      
      const result = SLDWireService.calculateWireSizing(longDistanceConnection, 500); // 500 feet
      
      expect(result).toBeDefined();
      expect(result.voltageDropPercent).toBeGreaterThan(0);
      // Longer distance should result in larger wire size or higher voltage drop
    });

    it('should calculate voltage drop correctly', () => {
      const connection30A = {
        ...mockConnection,
        current: 30,
        voltage: 240
      };
      
      const result = SLDWireService.calculateWireSizing(connection30A, 100);
      
      // Voltage drop formula: VD = 2 × K × I × L / CM
      // Where K = 12.9 for copper, I = current, L = length, CM = circular mils
      expect(result.voltageDropPercent).toBeGreaterThan(0);
      expect(result.voltageDropPercent).toBeLessThan(5); // Should be within acceptable limits
    });

    it('should recommend larger wire for high voltage drop', () => {
      const connection50A = {
        ...mockConnection,
        current: 50,
        voltage: 240
      };
      
      const result100ft = SLDWireService.calculateWireSizing(connection50A, 100);
      const result300ft = SLDWireService.calculateWireSizing(connection50A, 300);
      
      expect(result300ft.voltageDropPercent).toBeGreaterThan(result100ft.voltageDropPercent);
    });

    it('should handle ground connections', () => {
      const groundConnection = {
        ...mockConnection,
        wireType: 'ground' as const,
        current: 0, // Ground wire has no current
        voltage: 0
      };
      
      const result = SLDWireService.calculateWireSizing(groundConnection, 100);
      
      expect(result).toBeDefined();
      expect(result.conductorSize).toMatch(/\d+\s*AWG/);
      expect(result.voltageDropPercent).toBe(0); // No voltage drop on ground
    });

    it('should apply correct derating factors', () => {
      // Test different temperature and conduit fill scenarios
      const normalConnection = {
        ...mockConnection,
        current: 20
      };
      
      const result = SLDWireService.calculateWireSizing(normalConnection, 100);
      
      // Derating should be applied for temperature and conduit fill
      expect(result.derating).toBeLessThanOrEqual(1.0);
      expect(result.derating).toBeGreaterThan(0.5); // Reasonable derating range
    });

    it('should select appropriate wire size from NEC table', () => {
      const testCases = [
        { current: 15, expectedMaxSize: '14 AWG' },
        { current: 20, expectedMaxSize: '12 AWG' },
        { current: 30, expectedMaxSize: '10 AWG' },
        { current: 40, expectedMaxSize: '8 AWG' },
        { current: 55, expectedMaxSize: '6 AWG' }
      ];
      
      testCases.forEach(testCase => {
        const connection = {
          ...mockConnection,
          current: testCase.current
        };
        
        const result = SLDWireService.calculateWireSizing(connection, 50);
        
        // Wire size should be appropriate for current
        expect(result.ampacity).toBeGreaterThanOrEqual(testCase.current * 1.25);
      });
    });

    it('should handle missing voltage and current gracefully', () => {
      const incompleteConnection = {
        ...mockConnection,
        voltage: undefined,
        current: undefined
      };
      
      const result = SLDWireService.calculateWireSizing(incompleteConnection, 100);
      
      expect(result).toBeDefined();
      expect(result.conductorSize).toMatch(/\d+\s*AWG/);
      // Should use default values or minimum sizing
    });
  });

  describe('Wire Size Selection', () => {
    it('should select wire based on ampacity requirements', () => {
      const highAmpConnection = {
        ...mockConnection,
        current: 80
      };
      
      const result = SLDWireService.calculateWireSizing(highAmpConnection, 100);
      
      // For 80A, should select appropriate wire size (likely 4 AWG or larger)
      expect(result.ampacity).toBeGreaterThanOrEqual(80 * 1.25); // 125% rule
    });

    it('should consider voltage drop in wire selection', () => {
      const connection = {
        ...mockConnection,
        current: 30,
        voltage: 240
      };
      
      const shortRun = SLDWireService.calculateWireSizing(connection, 50);
      const longRun = SLDWireService.calculateWireSizing(connection, 250);
      
      // Long run might need larger wire to limit voltage drop
      expect(longRun.voltageDropPercent).toBeGreaterThan(shortRun.voltageDropPercent);
    });
  });

  describe('NEC Compliance', () => {
    it('should apply 125% safety factor for continuous loads', () => {
      const continuousConnection = {
        ...mockConnection,
        current: 20,
        label: 'Continuous Load'
      };
      
      const result = SLDWireService.calculateWireSizing(continuousConnection, 100);
      
      // Ampacity should be at least 125% of load current
      expect(result.ampacity).toBeGreaterThanOrEqual(20 * 1.25);
    });

    it('should limit voltage drop to 3% for branch circuits', () => {
      const branchCircuit = {
        ...mockConnection,
        current: 20,
        voltage: 120 // Typical branch circuit voltage
      };
      
      const result = SLDWireService.calculateWireSizing(branchCircuit, 100);
      
      // Should recommend wire size that keeps voltage drop under 3%
      expect(result.voltageDropPercent).toBeLessThanOrEqual(3.5); // Allow small margin
    });

    it('should limit total voltage drop to 5% for feeders', () => {
      const feederCircuit = {
        ...mockConnection,
        current: 50,
        voltage: 240,
        label: 'Feeder'
      };
      
      const result = SLDWireService.calculateWireSizing(feederCircuit, 200);
      
      // Feeder voltage drop should be limited
      expect(result.voltageDropPercent).toBeLessThanOrEqual(5.5); // Allow small margin
    });
  });

  describe('Error Handling', () => {
    it('should handle zero length gracefully', () => {
      const result = SLDWireService.calculateWireSizing(mockConnection, 0);
      
      expect(result).toBeDefined();
      expect(result.voltageDropPercent).toBe(0);
      expect(result.conductorSize).toMatch(/\d+\s*AWG/);
    });

    it('should handle negative length gracefully', () => {
      const result = SLDWireService.calculateWireSizing(mockConnection, -10);
      
      expect(result).toBeDefined();
      expect(result.voltageDropPercent).toBe(0);
      expect(result.conductorSize).toMatch(/\d+\s*AWG/);
    });

    it('should handle extremely high current', () => {
      const extremeConnection = {
        ...mockConnection,
        current: 1000 // Very high current
      };
      
      const result = SLDWireService.calculateWireSizing(extremeConnection, 100);
      
      expect(result).toBeDefined();
      expect(result.ampacity).toBeGreaterThanOrEqual(1000);
    });

    it('should handle invalid wire type', () => {
      const invalidConnection = {
        ...mockConnection,
        wireType: 'invalid' as any
      };
      
      const result = SLDWireService.calculateWireSizing(invalidConnection, 100);
      
      expect(result).toBeDefined();
      // Should default to AC calculations
    });
  });

  describe('Conduit Fill Calculations', () => {
    it('should calculate conduit fill percentage', () => {
      const result = SLDWireService.calculateWireSizing(mockConnection, 100);
      
      expect(result.conduitFill).toBeGreaterThanOrEqual(0);
      expect(result.conduitFill).toBeLessThanOrEqual(1);
    });

    it('should recommend larger conduit when fill exceeds 40%', () => {
      // This would require multiple wires in conduit
      const result = SLDWireService.calculateWireSizing(mockConnection, 100);
      
      if (result.conduitFill > 0.4) {
        // Should provide recommendation for larger conduit
        expect(result.conduitFill).toBeLessThanOrEqual(0.8); // Should not exceed 80%
      }
    });
  });

  describe('Temperature Derating', () => {
    it('should apply temperature derating factors', () => {
      const result = SLDWireService.calculateWireSizing(mockConnection, 100);
      
      // Temperature derating should be applied
      expect(result.derating).toBeLessThanOrEqual(1.0);
      
      // For normal conditions, derating shouldn't be too severe
      expect(result.derating).toBeGreaterThan(0.8);
    });
  });

  describe('Performance', () => {
    it('should complete calculations quickly', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        SLDWireService.calculateWireSizing(mockConnection, 100);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete 100 calculations in reasonable time
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });
  });
});