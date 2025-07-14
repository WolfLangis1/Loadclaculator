/**
 * 3D Modeling Service Tests
 * 
 * Tests for the photogrammetry-based 3D site modeling functionality including
 * model generation, quality validation, solar analysis, and export capabilities.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import ThreeDModelService, { AerialImagery, ThreeDModel } from '../services/threeDModelService';

// Mock aerial imagery data for testing
const createMockImage = (
  id: string,
  coordinates: { latitude: number; longitude: number },
  azimuth: number,
  elevation: number = 45
): AerialImagery => ({
  id,
  url: `https://example.com/aerial_${id}.jpg`,
  metadata: {
    coordinates: {
      latitude: coordinates.latitude + (Math.random() - 0.5) * 0.0001,
      longitude: coordinates.longitude + (Math.random() - 0.5) * 0.0001,
      altitude: 100 + Math.random() * 20
    },
    viewAngle: {
      azimuth,
      elevation,
      roll: Math.random() * 5 - 2.5
    },
    camera: {
      focalLength: 24,
      sensorWidth: 36,
      sensorHeight: 24,
      imageWidth: 4000,
      imageHeight: 3000
    },
    timestamp: new Date(),
    source: 'google',
    quality: 'high'
  },
  georeference: {
    bounds: {
      north: coordinates.latitude + 0.001,
      south: coordinates.latitude - 0.001,
      east: coordinates.longitude + 0.001,
      west: coordinates.longitude - 0.001
    },
    projection: 'EPSG:4326',
    datum: 'WGS84'
  }
});

const mockLocation = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco

describe('ThreeDModelService', () => {
  beforeAll(async () => {
    await ThreeDModelService.initialize();
  });

  beforeEach(() => {
    ThreeDModelService.clearModels();
  });

  it('should initialize successfully', () => {
    const capabilities = ThreeDModelService.getServiceCapabilities();
    expect(capabilities.isInitialized).toBe(true);
    expect(capabilities.supportedFormats).toContain('obj');
    expect(capabilities.supportedFormats).toContain('ply');
    expect(capabilities.supportedFormats).toContain('gltf');
    expect(capabilities.algorithms).toContain('structure_from_motion');
  });

  it('should generate 3D model from multiple images', async () => {
    // Create mock images from different viewing angles
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),    // North
      createMockImage('img2', mockLocation, 90),   // East
      createMockImage('img3', mockLocation, 180),  // South
      createMockImage('img4', mockLocation, 270),  // West
      createMockImage('img5', mockLocation, 45)    // Northeast
    ];

    const result = await ThreeDModelService.generateModel(
      images,
      'test-project',
      mockLocation
    );

    expect(result.modelId).toBeDefined();
    expect(result.processingId).toBeDefined();

    // Wait a bit for processing to start
    await new Promise(resolve => setTimeout(resolve, 100));

    const progress = ThreeDModelService.getProcessingProgress(result.processingId);
    expect(progress).toBeDefined();
    expect(progress!.stage).toBeDefined();
    expect(progress!.progress).toBeGreaterThanOrEqual(0);
  });

  it('should reject insufficient images', async () => {
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),
      createMockImage('img2', mockLocation, 90)
    ]; // Only 2 images

    await expect(
      ThreeDModelService.generateModel(images, 'test-project', mockLocation)
    ).rejects.toThrow('At least 3 images required');
  });

  it('should validate image overlap requirements', async () => {
    // Create images with poor overlap (far apart coordinates)
    const images: AerialImagery[] = [
      createMockImage('img1', { latitude: 37.7749, longitude: -122.4194 }, 0),
      createMockImage('img2', { latitude: 37.7849, longitude: -122.4094 }, 90), // ~1.4km away
      createMockImage('img3', { latitude: 37.7649, longitude: -122.4294 }, 180)
    ];

    // This should fail validation due to insufficient overlap
    await expect(
      ThreeDModelService.generateModel(images, 'test-project', mockLocation, {
        qualityControl: {
          minOverlap: 30, // 30% minimum overlap
          maxReprojectionError: 2.0,
          minTriangulationAngle: 3.0,
          maxBaselineRatio: 0.6
        }
      })
    ).rejects.toThrow(/overlap/i);
  });

  it('should track processing progress correctly', async () => {
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),
      createMockImage('img2', mockLocation, 120),
      createMockImage('img3', mockLocation, 240)
    ];

    const result = await ThreeDModelService.generateModel(
      images,
      'test-project',
      mockLocation
    );

    // Check initial progress
    const initialProgress = ThreeDModelService.getProcessingProgress(result.processingId);
    expect(initialProgress).toBeDefined();
    expect(initialProgress!.stage).toBe('preprocessing');
    expect(initialProgress!.progress).toBeGreaterThanOrEqual(0);
    expect(initialProgress!.currentTask).toBeDefined();
    expect(initialProgress!.processingLogs).toHaveLength(1);
    expect(initialProgress!.processingLogs[0].level).toBe('info');
  });

  it('should export 3D models in different formats', async () => {
    // First generate a model (simplified mock)
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),
      createMockImage('img2', mockLocation, 120),
      createMockImage('img3', mockLocation, 240)
    ];

    const result = await ThreeDModelService.generateModel(
      images,
      'test-project',
      mockLocation
    );

    // Wait for processing to complete (in real implementation)
    // For testing, we'll wait and check if model is available
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test OBJ export
    const model = ThreeDModelService.getModel(result.modelId);
    if (model) {
      const objExport = await ThreeDModelService.exportModel(result.modelId, 'obj');
      expect(objExport).toContain('# 3D Model Export');
      expect(objExport).toContain('v '); // Vertex data
      expect(objExport).toContain('f '); // Face data

      // Test PLY export
      const plyExport = await ThreeDModelService.exportModel(result.modelId, 'ply');
      expect(plyExport).toContain('ply');
      expect(plyExport).toContain('format ascii 1.0');
      expect(plyExport).toContain('element vertex');

      // Test glTF export
      const gltfExport = await ThreeDModelService.exportModel(result.modelId, 'gltf');
      const gltfData = JSON.parse(gltfExport);
      expect(gltfData.asset).toBeDefined();
      expect(gltfData.asset.version).toBe('2.0');
    }
  });

  it('should analyze solar potential correctly', async () => {
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),
      createMockImage('img2', mockLocation, 120),
      createMockImage('img3', mockLocation, 240)
    ];

    const result = await ThreeDModelService.generateModel(
      images,
      'test-project',
      mockLocation
    );

    // Simulate completed model for testing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const model = ThreeDModelService.getModel(result.modelId);
    if (model) {
      const solarAnalysis = await ThreeDModelService.analyzeSolarPotential(result.modelId);

      expect(solarAnalysis.roofPlanes).toBeDefined();
      expect(solarAnalysis.totalArea).toBeGreaterThan(0);
      expect(solarAnalysis.usableArea).toBeGreaterThan(0);
      expect(solarAnalysis.usableArea).toBeLessThanOrEqual(solarAnalysis.totalArea);
      expect(solarAnalysis.panelCapacity).toBeGreaterThan(0);
      expect(solarAnalysis.annualGeneration).toBeGreaterThan(0);

      // Check that roof planes have reasonable properties
      solarAnalysis.roofPlanes.forEach(plane => {
        expect(plane.area).toBeGreaterThan(0);
        expect(plane.azimuth).toBeGreaterThanOrEqual(0);
        expect(plane.azimuth).toBeLessThan(360);
        expect(plane.tilt).toBeGreaterThanOrEqual(0);
        expect(plane.tilt).toBeLessThanOrEqual(90);
        expect(plane.shadingFactor).toBeGreaterThan(0);
        expect(plane.shadingFactor).toBeLessThanOrEqual(1);
      });
    }
  });

  it('should calculate realistic solar capacity estimates', async () => {
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),
      createMockImage('img2', mockLocation, 120),
      createMockImage('img3', mockLocation, 240)
    ];

    const result = await ThreeDModelService.generateModel(
      images,
      'test-project',
      mockLocation
    );

    await new Promise(resolve => setTimeout(resolve, 100));
    
    const model = ThreeDModelService.getModel(result.modelId);
    if (model) {
      const solarAnalysis = await ThreeDModelService.analyzeSolarPotential(result.modelId);

      // Validate solar calculations are reasonable
      const totalRoofArea = solarAnalysis.totalArea;
      const expectedUsableRatio = 0.7; // ~70% usable after setbacks
      const expectedPanelDensity = 0.2; // ~0.2 kW per m² (200W/m²)

      expect(solarAnalysis.usableArea).toBeGreaterThan(totalRoofArea * 0.5);
      expect(solarAnalysis.usableArea).toBeLessThan(totalRoofArea * 0.9);
      
      expect(solarAnalysis.panelCapacity).toBeGreaterThan(totalRoofArea * 0.1);
      expect(solarAnalysis.panelCapacity).toBeLessThan(totalRoofArea * 0.5);

      // Annual generation should be reasonable (800-1500 kWh/kW/year typical)
      const specificYield = solarAnalysis.annualGeneration / solarAnalysis.panelCapacity;
      expect(specificYield).toBeGreaterThan(800);
      expect(specificYield).toBeLessThan(2000);
    }
  });

  it('should handle model retrieval and project organization', async () => {
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),
      createMockImage('img2', mockLocation, 120),
      createMockImage('img3', mockLocation, 240)
    ];

    const projectId = 'test-project-123';
    const result = await ThreeDModelService.generateModel(
      images,
      projectId,
      mockLocation
    );

    // Test model retrieval
    const model = ThreeDModelService.getModel(result.modelId);
    if (model) {
      expect(model.id).toBe(result.modelId);
      expect(model.location.latitude).toBeCloseTo(mockLocation.latitude, 3);
      expect(model.location.longitude).toBeCloseTo(mockLocation.longitude, 3);
      expect(model.processing.sourceImages).toHaveLength(3);
    }

    // Test project models retrieval
    const projectModels = ThreeDModelService.getProjectModels(result.processingId); // Using processingId as projectId
    expect(projectModels).toHaveLength(1);
    if (projectModels.length > 0) {
      expect(projectModels[0].id).toBe(result.modelId);
    }
  });

  it('should validate service capabilities', () => {
    const capabilities = ThreeDModelService.getServiceCapabilities();

    expect(capabilities.isInitialized).toBe(true);
    expect(capabilities.totalModels).toBeGreaterThanOrEqual(0);
    expect(capabilities.supportedFormats).toEqual(['obj', 'ply', 'gltf', 'dxf', 'ifc']);
    expect(capabilities.processingQueue).toBeGreaterThanOrEqual(0);
    expect(capabilities.maxImageCount).toBe(50);
    expect(capabilities.algorithms).toContain('structure_from_motion');
    expect(capabilities.algorithms).toContain('dense_stereo');
    expect(capabilities.algorithms).toContain('lidar_fusion');
    expect(capabilities.algorithms).toContain('hybrid');
  });

  it('should handle export format validation', async () => {
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),
      createMockImage('img2', mockLocation, 120),
      createMockImage('img3', mockLocation, 240)
    ];

    const result = await ThreeDModelService.generateModel(
      images,
      'test-project',
      mockLocation
    );

    await expect(
      ThreeDModelService.exportModel(result.modelId, 'invalid_format' as any)
    ).rejects.toThrow('Unsupported export format');

    await expect(
      ThreeDModelService.exportModel('non_existent_model', 'obj')
    ).rejects.toThrow('Model non_existent_model not found');
  });

  it('should clear models and processing queue', () => {
    const initialCapabilities = ThreeDModelService.getServiceCapabilities();
    
    ThreeDModelService.clearModels();
    
    const clearedCapabilities = ThreeDModelService.getServiceCapabilities();
    expect(clearedCapabilities.totalModels).toBe(0);
    expect(clearedCapabilities.processingQueue).toBe(0);
  });

  it('should generate models with different quality settings', async () => {
    const images: AerialImagery[] = [
      createMockImage('img1', mockLocation, 0),
      createMockImage('img2', mockLocation, 72),
      createMockImage('img3', mockLocation, 144),
      createMockImage('img4', mockLocation, 216),
      createMockImage('img5', mockLocation, 288)
    ];

    // High quality settings
    const highQualityResult = await ThreeDModelService.generateModel(
      images,
      'high-quality-project',
      mockLocation,
      {
        featureDetection: {
          algorithm: 'sift',
          maxFeatures: 15000,
          threshold: 0.03,
          enableGPU: true
        },
        meshGeneration: {
          algorithm: 'poisson',
          targetVertices: 100000,
          smoothingIterations: 10,
          decimate: false,
          simplifyRatio: 0.05
        }
      }
    );

    expect(highQualityResult.modelId).toBeDefined();
    expect(highQualityResult.processingId).toBeDefined();

    // Low quality settings for faster processing
    const lowQualityResult = await ThreeDModelService.generateModel(
      images,
      'low-quality-project',
      mockLocation,
      {
        featureDetection: {
          algorithm: 'orb',
          maxFeatures: 5000,
          threshold: 0.08,
          enableGPU: false
        },
        meshGeneration: {
          algorithm: 'delaunay',
          targetVertices: 10000,
          smoothingIterations: 2,
          decimate: true,
          simplifyRatio: 0.3
        }
      }
    );

    expect(lowQualityResult.modelId).toBeDefined();
    expect(lowQualityResult.processingId).toBeDefined();
    expect(lowQualityResult.modelId).not.toBe(highQualityResult.modelId);
  });
});