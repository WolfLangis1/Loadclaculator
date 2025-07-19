import { describe, it, expect } from 'vitest';
import { PhotoEditorService } from '../services/photoEditorService';
import type { EditorPoint, EditorMeasurement, EditorAnnotation } from '../context/PhotoEditorContext';

describe('PhotoEditorService', () => {
  describe('Distance Calculations', () => {
    it('should calculate pixel distance correctly', () => {
      const p1: EditorPoint = { x: 0, y: 0 };
      const p2: EditorPoint = { x: 3, y: 4 };
      
      const distance = PhotoEditorService.calculateDistance(p1, p2);
      expect(distance).toBe(5); // 3-4-5 triangle
    });

    it('should convert pixels to real-world units with scale', () => {
      const p1: EditorPoint = { x: 0, y: 0 };
      const p2: EditorPoint = { x: 100, y: 0 }; // 100 pixels
      const scale = 10; // 10 pixels per foot
      
      const distance = PhotoEditorService.calculateDistance(p1, p2, scale, 'ft');
      expect(distance).toBe(10); // 100 pixels / 10 pixels per foot = 10 feet
    });

    it('should handle different units correctly', () => {
      const p1: EditorPoint = { x: 0, y: 0 };
      const p2: EditorPoint = { x: 100, y: 0 };
      const scale = 5; // 5 pixels per meter
      
      const distance = PhotoEditorService.calculateDistance(p1, p2, scale, 'm');
      expect(distance).toBe(20); // 100 pixels / 5 pixels per meter = 20 meters
    });

    it('should return pixel distance when scale is invalid', () => {
      const p1: EditorPoint = { x: 0, y: 0 };
      const p2: EditorPoint = { x: 50, y: 0 };
      
      const distanceNoScale = PhotoEditorService.calculateDistance(p1, p2, 0);
      const distanceNegativeScale = PhotoEditorService.calculateDistance(p1, p2, -5);
      
      expect(distanceNoScale).toBe(50);
      expect(distanceNegativeScale).toBe(50);
    });
  });

  describe('Area Calculations', () => {
    it('should calculate area of a rectangle using shoelace formula', () => {
      const points: EditorPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 20 },
        { x: 0, y: 20 }
      ];
      
      const area = PhotoEditorService.calculateArea(points);
      expect(area).toBe(200); // 10 * 20 = 200 square pixels
    });

    it('should convert pixel area to real-world units', () => {
      const points: EditorPoint[] = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 }
      ];
      const scale = 10; // 10 pixels per foot
      
      const area = PhotoEditorService.calculateArea(points, scale, 'ft');
      expect(area).toBe(100); // (100*100) / (10*10) = 100 square feet
    });

    it('should handle triangular areas', () => {
      const points: EditorPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 5, y: 10 }
      ];
      
      const area = PhotoEditorService.calculateArea(points);
      expect(area).toBe(50); // Triangle area = 0.5 * base * height = 0.5 * 10 * 10 = 50
    });

    it('should return 0 for insufficient points', () => {
      const points: EditorPoint[] = [
        { x: 0, y: 0 },
        { x: 10, y: 0 }
      ];
      
      const area = PhotoEditorService.calculateArea(points);
      expect(area).toBe(0);
    });
  });

  describe('Angle Calculations', () => {
    it('should calculate 90-degree angle correctly', () => {
      const p1: EditorPoint = { x: 0, y: 0 };
      const vertex: EditorPoint = { x: 0, y: 0 };
      const p2: EditorPoint = { x: 0, y: 10 };
      const p3: EditorPoint = { x: 10, y: 0 };
      
      const angle = PhotoEditorService.calculateAngle(p2, vertex, p3);
      expect(angle).toBeCloseTo(90, 1);
    });

    it('should calculate 45-degree angle correctly', () => {
      const p1: EditorPoint = { x: 0, y: 0 };
      const vertex: EditorPoint = { x: 0, y: 0 };
      const p2: EditorPoint = { x: 10, y: 0 };
      const p3: EditorPoint = { x: 10, y: 10 };
      
      const angle = PhotoEditorService.calculateAngle(p2, vertex, p3);
      expect(angle).toBeCloseTo(45, 1);
    });
  });

  describe('Scale Calibration', () => {
    it('should calibrate scale correctly', () => {
      const pixelDistance = 100;
      const realDistance = 10;
      
      const scale = PhotoEditorService.calibrateScale(pixelDistance, realDistance, 'ft');
      expect(scale).toBe(10); // 100 pixels / 10 feet = 10 pixels per foot
    });

    it('should handle invalid inputs gracefully', () => {
      const scale1 = PhotoEditorService.calibrateScale(0, 10, 'ft');
      const scale2 = PhotoEditorService.calibrateScale(100, 0, 'ft');
      const scale3 = PhotoEditorService.calibrateScale(-100, 10, 'ft');
      
      expect(scale1).toBe(1);
      expect(scale2).toBe(1);
      expect(scale3).toBe(1);
    });
  });

  describe('Scale Estimation', () => {
    it('should provide reasonable default scale', () => {
      const scale = PhotoEditorService.getRecommendedScale(800, 600, 'ft');
      expect(scale).toBeGreaterThan(0);
      expect(scale).toBe(800 / 500); // 800 pixels / 500 feet default
    });

    it('should handle different units for scale estimation', () => {
      const scaleFeet = PhotoEditorService.getRecommendedScale(800, 600, 'ft');
      const scaleMeters = PhotoEditorService.getRecommendedScale(800, 600, 'm');
      
      expect(scaleFeet).toBe(800 / 500); // feet
      expect(scaleMeters).toBe(800 / 150); // meters
    });
  });

  describe('Element Selection', () => {
    it('should find element at point within tolerance', () => {
      const measurements: EditorMeasurement[] = [
        {
          id: 'test1',
          type: 'linear',
          points: [{ x: 10, y: 10 }, { x: 20, y: 20 }],
          unit: 'ft',
          layerId: 'layer1',
          style: { stroke: '#000', strokeWidth: 2, fill: '#fff' }
        }
      ];
      
      const annotations: EditorAnnotation[] = [];
      const searchPoint: EditorPoint = { x: 12, y: 12 };
      
      const element = PhotoEditorService.findElementAtPoint(searchPoint, measurements, annotations, 5);
      expect(element).toBeTruthy();
      expect(element?.type).toBe('measurement');
      expect(element?.id).toBe('test1');
    });

    it('should return null when no element found', () => {
      const measurements: EditorMeasurement[] = [];
      const annotations: EditorAnnotation[] = [];
      const searchPoint: EditorPoint = { x: 100, y: 100 };
      
      const element = PhotoEditorService.findElementAtPoint(searchPoint, measurements, annotations, 5);
      expect(element).toBeNull();
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique IDs', () => {
      const id1 = PhotoEditorService.generateId();
      const id2 = PhotoEditorService.generateId();
      
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('should validate points within canvas bounds', () => {
      const point: EditorPoint = { x: -10, y: 1000 };
      const validated = PhotoEditorService.validatePoint(point, 800, 600);
      
      expect(validated.x).toBe(0); // Clamped to 0
      expect(validated.y).toBe(600); // Clamped to canvas height
    });
  });
});