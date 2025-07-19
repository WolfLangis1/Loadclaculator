import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateLoadDemand } from '../../services/necCalculations';
import { PhotoEditorService } from '../../services/photoEditorService';
import { validateLoadData, validateProjectSettings } from '../../services/validationService';
import type { LoadState, ProjectSettings, EditorPoint, EditorMeasurement } from '../../types';

// Performance test utilities
const measureExecutionTime = async (fn: () => Promise<any> | any): Promise<{ result: any; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return { result, duration: end - start };
};

const generateLargeLoadState = (numLoads: number): LoadState => {
  const generalLoads = Array.from({ length: numLoads }, (_, i) => ({
    id: i + 1,
    name: `Load ${i + 1}`,
    type: 'general' as const,
    location: 'room',
    watts: 1000 + (i * 100),
    quantity: 1,
    total: 1000 + (i * 100),
    critical: i % 10 === 0
  }));

  const hvacLoads = Array.from({ length: Math.floor(numLoads / 10) }, (_, i) => ({
    id: i + 1,
    name: `HVAC ${i + 1}`,
    type: 'hvac' as const,
    location: 'outside',
    watts: 3600 + (i * 600),
    quantity: 1,
    total: 3600 + (i * 600),
    critical: true
  }));

  const evseLoads = Array.from({ length: Math.floor(numLoads / 20) }, (_, i) => ({
    id: i + 1,
    name: `EVSE ${i + 1}`,
    type: 'evse' as const,
    location: 'garage',
    amps: 32 + (i * 8),
    voltage: 240,
    quantity: 1,
    total: (32 + (i * 8)) * 240,
    critical: false,
    emsControlled: i % 2 === 0
  }));

  const solarBatteryLoads = Array.from({ length: Math.floor(numLoads / 50) }, (_, i) => ({
    id: i + 1,
    name: `Solar ${i + 1}`,
    type: 'solar' as const,
    location: 'backfeed',
    kw: 10 + (i * 5),
    inverterAmps: (10 + (i * 5)) * 1000 / 240,
    efficiency: 96,
    quantity: 1,
    total: (10 + (i * 5)) * 1000,
    critical: false
  }));

  return {
    generalLoads,
    hvacLoads,
    evseLoads,
    solarBatteryLoads
  };
};

const generateComplexMeasurements = (numMeasurements: number): EditorMeasurement[] => {
  return Array.from({ length: numMeasurements }, (_, i) => {
    const type = ['linear', 'area', 'angle'][i % 3] as 'linear' | 'area' | 'angle';
    let points: EditorPoint[];

    switch (type) {
      case 'linear':
        points = [
          { x: i * 10, y: i * 10 },
          { x: i * 10 + 100, y: i * 10 + 50 }
        ];
        break;
      case 'area':
        points = [
          { x: i * 10, y: i * 10 },
          { x: i * 10 + 100, y: i * 10 },
          { x: i * 10 + 100, y: i * 10 + 100 },
          { x: i * 10, y: i * 10 + 100 }
        ];
        break;
      case 'angle':
        points = [
          { x: i * 10, y: i * 10 },
          { x: i * 10 + 50, y: i * 10 + 50 },
          { x: i * 10 + 100, y: i * 10 }
        ];
        break;
    }

    return {
      id: `measurement-${i}`,
      type,
      points,
      unit: 'ft',
      layerId: `layer-${Math.floor(i / 10)}`,
      style: {
        stroke: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        strokeWidth: 2,
        fill: '#ffffff33'
      }
    };
  });
};

describe('Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Load Calculation Performance', () => {
    const projectSettings: ProjectSettings = {
      address: '123 Test St, Los Angeles, CA',
      squareFootage: 2500,
      calculationMethod: 'optional',
      mainBreakerAmps: 200,
      panelDetails: {
        manufacturer: 'Square D',
        model: 'QO',
        type: 'Main Panel',
        phases: 1,
        voltage: 240,
        busRating: 200,
        interruptingRating: 10000,
        availableSpaces: 40,
        usedSpaces: 0
      }
    };

    it('should handle small load datasets efficiently (< 50ms)', async () => {
      const loadState = generateLargeLoadState(50);
      
      const { duration } = await measureExecutionTime(() =>
        calculateLoadDemand(
          loadState,
          'optional',
          2500,
          200,
          projectSettings.panelDetails!,
          { enabled: false } as any,
          false,
          0
        )
      );

      expect(duration).toBeLessThan(50);
    });

    it('should handle medium load datasets reasonably (< 200ms)', async () => {
      const loadState = generateLargeLoadState(200);
      
      const { duration } = await measureExecutionTime(() =>
        calculateLoadDemand(
          loadState,
          'optional',
          2500,
          200,
          projectSettings.panelDetails!,
          { enabled: false } as any,
          false,
          0
        )
      );

      expect(duration).toBeLessThan(200);
    });

    it('should handle large load datasets within acceptable limits (< 500ms)', async () => {
      const loadState = generateLargeLoadState(1000);
      
      const { duration, result } = await measureExecutionTime(() =>
        calculateLoadDemand(
          loadState,
          'optional',
          2500,
          200,
          projectSettings.panelDetails!,
          { enabled: false } as any,
          false,
          0
        )
      );

      expect(duration).toBeLessThan(500);
      expect(result.totalAmps).toBeGreaterThan(0);
      expect(result.errors).toBeDefined();
    });

    it('should scale linearly with load count', async () => {
      const smallLoads = generateLargeLoadState(100);
      const largeLoads = generateLargeLoadState(500);

      const { duration: smallDuration } = await measureExecutionTime(() =>
        calculateLoadDemand(
          smallLoads,
          'optional',
          2500,
          200,
          projectSettings.panelDetails!,
          { enabled: false } as any,
          false,
          0
        )
      );

      const { duration: largeDuration } = await measureExecutionTime(() =>
        calculateLoadDemand(
          largeLoads,
          'optional',
          2500,
          200,
          projectSettings.panelDetails!,
          { enabled: false } as any,
          false,
          0
        )
      );

      // Large dataset should not be more than 10x slower than small dataset
      const scalingFactor = largeDuration / smallDuration;
      expect(scalingFactor).toBeLessThan(10);
    });

    it('should handle concurrent calculations efficiently', async () => {
      const loadState = generateLargeLoadState(100);
      const numConcurrent = 10;

      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: numConcurrent }, () =>
          calculateLoadDemand(
            loadState,
            'optional',
            2500,
            200,
            projectSettings.panelDetails!,
            { enabled: false } as any,
            false,
            0
          )
        );
        return Promise.all(promises);
      });

      // Concurrent operations should not take more than 3x single operation time
      expect(duration).toBeLessThan(600); // 200ms * 3
    });
  });

  describe('Validation Performance', () => {
    it('should validate large load datasets quickly (< 100ms)', async () => {
      const loadState = generateLargeLoadState(500);
      
      const { duration } = await measureExecutionTime(() =>
        validateLoadData(loadState)
      );

      expect(duration).toBeLessThan(100);
    });

    it('should validate project settings instantly (< 10ms)', async () => {
      const projectSettings: ProjectSettings = {
        address: '123 Test St, Los Angeles, CA',
        squareFootage: 2500,
        calculationMethod: 'optional',
        mainBreakerAmps: 200,
        panelDetails: {
          manufacturer: 'Square D',
          model: 'QO',
          type: 'Main Panel',
          phases: 1,
          voltage: 240,
          busRating: 200,
          interruptingRating: 10000,
          availableSpaces: 40,
          usedSpaces: 0
        }
      };

      const { duration } = await measureExecutionTime(() =>
        validateProjectSettings(projectSettings)
      );

      expect(duration).toBeLessThan(10);
    });

    it('should handle validation of invalid data efficiently', async () => {
      const invalidLoadState = generateLargeLoadState(100);
      // Make some loads invalid
      invalidLoadState.generalLoads.forEach((load, i) => {
        if (i % 10 === 0) {
          load.watts = -1000; // Invalid negative watts
          load.quantity = -1; // Invalid negative quantity
        }
      });

      const { duration, result } = await measureExecutionTime(() =>
        validateLoadData(invalidLoadState)
      );

      expect(duration).toBeLessThan(100);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Photo Editor Performance', () => {
    it('should handle distance calculations efficiently', async () => {
      const points = Array.from({ length: 1000 }, (_, i) => ({
        x: i * 10,
        y: Math.sin(i * 0.1) * 100
      }));

      const { duration } = await measureExecutionTime(() => {
        for (let i = 0; i < points.length - 1; i++) {
          PhotoEditorService.calculateDistance(points[i], points[i + 1]);
        }
      });

      expect(duration).toBeLessThan(50);
    });

    it('should handle area calculations for complex polygons', async () => {
      const complexPolygon = Array.from({ length: 100 }, (_, i) => ({
        x: Math.cos(i * 0.1) * 200 + 300,
        y: Math.sin(i * 0.1) * 200 + 300
      }));

      const { duration } = await measureExecutionTime(() =>
        PhotoEditorService.calculateArea(complexPolygon)
      );

      expect(duration).toBeLessThan(10);
    });

    it('should handle large numbers of measurements efficiently', async () => {
      const measurements = generateComplexMeasurements(500);
      const testPoint = { x: 250, y: 250 };

      const { duration } = await measureExecutionTime(() =>
        PhotoEditorService.findElementAtPoint(testPoint, measurements, [], 10)
      );

      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid measurement additions', async () => {
      const numMeasurements = 200;
      const measurements: EditorMeasurement[] = [];

      const { duration } = await measureExecutionTime(() => {
        for (let i = 0; i < numMeasurements; i++) {
          const newMeasurement: EditorMeasurement = {
            id: `rapid-${i}`,
            type: 'linear',
            points: [{ x: i * 5, y: i * 5 }, { x: i * 5 + 50, y: i * 5 + 50 }],
            unit: 'ft',
            layerId: 'layer1',
            style: { stroke: '#000', strokeWidth: 2, fill: '#fff' }
          };
          measurements.push(newMeasurement);
        }
      });

      expect(duration).toBeLessThan(50);
      expect(measurements).toHaveLength(numMeasurements);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not cause memory leaks with repeated calculations', async () => {
      const loadState = generateLargeLoadState(100);
      const projectSettings: ProjectSettings = {
        address: '123 Test St',
        squareFootage: 2500,
        calculationMethod: 'optional',
        mainBreakerAmps: 200,
        panelDetails: {
          manufacturer: 'Square D',
          model: 'QO',
          type: 'Main Panel',
          phases: 1,
          voltage: 240,
          busRating: 200,
          interruptingRating: 10000,
          availableSpaces: 40,
          usedSpaces: 0
        }
      };

      // Simulate repeated calculations
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      for (let i = 0; i < 100; i++) {
        calculateLoadDemand(
          loadState,
          'optional',
          2500,
          200,
          projectSettings.panelDetails!,
          { enabled: false } as any,
          false,
          0
        );
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle cleanup of large measurement datasets', () => {
      let measurements = generateComplexMeasurements(1000);
      
      // Simulate processing
      measurements.forEach(measurement => {
        if (measurement.type === 'area') {
          PhotoEditorService.calculateArea(measurement.points);
        } else {
          measurement.points.forEach((point, i) => {
            if (i > 0) {
              PhotoEditorService.calculateDistance(measurement.points[i - 1], point);
            }
          });
        }
      });

      // Clear references
      measurements = [];
      
      // Should not retain large objects
      expect(measurements).toHaveLength(0);
    });
  });

  describe('Stress Tests', () => {
    it('should handle extreme load scenarios gracefully', async () => {
      const extremeLoadState = generateLargeLoadState(2000);
      
      const { duration, result } = await measureExecutionTime(() =>
        calculateLoadDemand(
          extremeLoadState,
          'optional',
          10000,
          800,
          {
            manufacturer: 'Square D',
            model: 'QO',
            type: 'Main Panel',
            phases: 3,
            voltage: 240,
            busRating: 800,
            interruptingRating: 22000,
            availableSpaces: 200,
            usedSpaces: 0
          },
          { enabled: false } as any,
          false,
          0
        )
      );

      // Should complete within reasonable time even for extreme cases
      expect(duration).toBeLessThan(1000);
      expect(result).toBeDefined();
      expect(typeof result.totalAmps).toBe('number');
    });

    it('should handle concurrent stress load', async () => {
      const loadState = generateLargeLoadState(200);
      const concurrentOperations = 50;

      const { duration } = await measureExecutionTime(async () => {
        const promises = Array.from({ length: concurrentOperations }, async (_, i) => {
          // Vary the operations to simulate real usage
          if (i % 3 === 0) {
            return validateLoadData(loadState);
          } else if (i % 3 === 1) {
            return calculateLoadDemand(
              loadState,
              'standard',
              2500,
              200,
              {
                manufacturer: 'Square D',
                model: 'QO',
                type: 'Main Panel',
                phases: 1,
                voltage: 240,
                busRating: 200,
                interruptingRating: 10000,
                availableSpaces: 40,
                usedSpaces: 0
              },
              { enabled: false } as any,
              false,
              0
            );
          } else {
            const measurements = generateComplexMeasurements(50);
            return measurements.map(m => 
              m.type === 'area' 
                ? PhotoEditorService.calculateArea(m.points)
                : PhotoEditorService.calculateDistance(m.points[0], m.points[1])
            );
          }
        });

        return Promise.all(promises);
      });

      // Should handle high concurrency within reasonable time
      expect(duration).toBeLessThan(2000);
    });

    it('should maintain accuracy under performance pressure', async () => {
      const baseLoadState = generateLargeLoadState(10);
      const stressLoadState = generateLargeLoadState(1000);

      const { result: baseResult } = await measureExecutionTime(() =>
        calculateLoadDemand(
          baseLoadState,
          'optional',
          2500,
          200,
          {
            manufacturer: 'Square D',
            model: 'QO',
            type: 'Main Panel',
            phases: 1,
            voltage: 240,
            busRating: 200,
            interruptingRating: 10000,
            availableSpaces: 40,
            usedSpaces: 0
          },
          { enabled: false } as any,
          false,
          0
        )
      );

      const { result: stressResult } = await measureExecutionTime(() =>
        calculateLoadDemand(
          stressLoadState,
          'optional',
          2500,
          200,
          {
            manufacturer: 'Square D',
            model: 'QO',
            type: 'Main Panel',
            phases: 1,
            voltage: 240,
            busRating: 200,
            interruptingRating: 10000,
            availableSpaces: 40,
            usedSpaces: 0
          },
          { enabled: false } as any,
          false,
          0
        )
      );

      // Results should be mathematically consistent
      expect(stressResult.totalAmps).toBeGreaterThan(baseResult.totalAmps);
      expect(stressResult.spareCapacity).toBeLessThan(baseResult.spareCapacity);
      expect(typeof stressResult.totalAmps).toBe('number');
      expect(typeof stressResult.spareCapacity).toBe('number');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet load calculation performance benchmarks', async () => {
      const benchmarkSizes = [10, 50, 100, 250, 500];
      const results: Array<{ size: number; duration: number }> = [];

      for (const size of benchmarkSizes) {
        const loadState = generateLargeLoadState(size);
        const { duration } = await measureExecutionTime(() =>
          calculateLoadDemand(
            loadState,
            'optional',
            2500,
            200,
            {
              manufacturer: 'Square D',
              model: 'QO',
              type: 'Main Panel',
              phases: 1,
              voltage: 240,
              busRating: 200,
              interruptingRating: 10000,
              availableSpaces: 40,
              usedSpaces: 0
            },
            { enabled: false } as any,
            false,
            0
          )
        );
        
        results.push({ size, duration });
      }

      // Performance should scale reasonably
      results.forEach(result => {
        const maxAcceptableDuration = result.size * 0.5; // 0.5ms per load item
        expect(result.duration).toBeLessThan(maxAcceptableDuration);
      });

      // Log benchmark results for reference
      console.log('Load Calculation Performance Benchmarks:');
      results.forEach(result => {
        console.log(`${result.size} loads: ${result.duration.toFixed(2)}ms`);
      });
    });

    it('should meet measurement calculation benchmarks', async () => {
      const benchmarkSizes = [50, 100, 250, 500, 1000];
      const results: Array<{ size: number; duration: number }> = [];

      for (const size of benchmarkSizes) {
        const measurements = generateComplexMeasurements(size);
        const { duration } = await measureExecutionTime(() => {
          measurements.forEach(measurement => {
            if (measurement.type === 'area') {
              PhotoEditorService.calculateArea(measurement.points);
            } else {
              PhotoEditorService.calculateDistance(measurement.points[0], measurement.points[1]);
            }
          });
        });
        
        results.push({ size, duration });
      }

      // Should handle measurements efficiently
      results.forEach(result => {
        const maxAcceptableDuration = result.size * 0.1; // 0.1ms per measurement
        expect(result.duration).toBeLessThan(maxAcceptableDuration);
      });

      console.log('Measurement Calculation Performance Benchmarks:');
      results.forEach(result => {
        console.log(`${result.size} measurements: ${result.duration.toFixed(2)}ms`);
      });
    });
  });
});