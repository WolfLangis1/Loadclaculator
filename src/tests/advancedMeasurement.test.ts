/**
 * Advanced Measurement Service Tests
 * 
 * Tests for the GPS-based measurement functionality including distance calculations,
 * area measurements, coordinate transformations, and NEC compliance checking.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import AdvancedMeasurementService from '../services/advancedMeasurementService';

describe('AdvancedMeasurementService', () => {
  beforeAll(async () => {
    await AdvancedMeasurementService.initialize();
  });

  it('should initialize successfully', () => {
    const capabilities = AdvancedMeasurementService.getServiceCapabilities();
    expect(capabilities.isInitialized).toBe(true);
    expect(capabilities.supportedFormats).toContain('json');
    expect(capabilities.supportedFormats).toContain('kml');
    expect(capabilities.supportedFormats).toContain('geojson');
    expect(capabilities.supportedFormats).toContain('csv');
  });

  it('should calculate distance correctly using Haversine formula', () => {
    const coord1 = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
    const coord2 = { latitude: 37.7849, longitude: -122.4094 }; // ~1.4km northeast
    
    const result = AdvancedMeasurementService.calculateDistance(coord1, coord2);
    
    expect(result.meters).toBeGreaterThan(1000);
    expect(result.meters).toBeLessThan(2000);
    expect(result.feet).toBeGreaterThan(3000);
    expect(result.bearing).toBeGreaterThan(0);
    expect(result.bearing).toBeLessThan(360);
  });

  it('should calculate area correctly for a square', () => {
    // Create a small square (~100m x 100m)
    const baseCoord = { latitude: 37.7749, longitude: -122.4194 };
    const offset = 0.0009; // approximately 100m at this latitude
    
    const coordinates = [
      baseCoord,
      { latitude: baseCoord.latitude + offset, longitude: baseCoord.longitude },
      { latitude: baseCoord.latitude + offset, longitude: baseCoord.longitude + offset },
      { latitude: baseCoord.latitude, longitude: baseCoord.longitude + offset }
    ];
    
    const result = AdvancedMeasurementService.calculateArea(coordinates);
    
    expect(result.squareMeters).toBeGreaterThan(7000); // Allow for projection distortion
    expect(result.squareMeters).toBeLessThan(12000);
    expect(result.squareFeet).toBeGreaterThan(result.squareMeters * 10);
    expect(result.perimeter).toBeGreaterThan(300);
    expect(result.centroid.latitude).toBeCloseTo(baseCoord.latitude + offset/2, 4);
  });

  it('should convert between pixel and GPS coordinates', () => {
    const imageMetadata = {
      bounds: { north: 37.78, south: 37.77, east: -122.41, west: -122.42 },
      width: 800,
      height: 600
    };
    
    // Test center point
    const centerPixel = { x: 400, y: 300 };
    const gpsCoord = AdvancedMeasurementService.pixelToGPS(
      centerPixel.x, 
      centerPixel.y, 
      imageMetadata
    );
    
    expect(gpsCoord.latitude).toBeCloseTo(37.775, 3);
    expect(gpsCoord.longitude).toBeCloseTo(-122.415, 3);
    
    // Convert back to pixel
    const backToPixel = AdvancedMeasurementService.gpsToPixel(gpsCoord, imageMetadata);
    expect(backToPixel.x).toBeCloseTo(centerPixel.x, 1);
    expect(backToPixel.y).toBeCloseTo(centerPixel.y, 1);
  });

  it('should create a measurement project', () => {
    const location = { latitude: 37.7749, longitude: -122.4194 };
    const project = AdvancedMeasurementService.createProject(
      'Test Project',
      location,
      'Test description'
    );
    
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Test Project');
    expect(project.location.latitude).toBe(location.latitude);
    expect(project.location.longitude).toBe(location.longitude);
    expect(project.linearMeasurements).toEqual([]);
    expect(project.areaMeasurements).toEqual([]);
    expect(project.metadata.datum).toBe('WGS84');
  });

  it('should create linear measurements', () => {
    const points = [
      {
        id: 'point1',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        pixelPosition: { x: 100, y: 100 },
        type: 'waypoint' as const
      },
      {
        id: 'point2', 
        coordinates: { latitude: 37.7759, longitude: -122.4184 },
        pixelPosition: { x: 200, y: 200 },
        type: 'waypoint' as const
      }
    ];
    
    const measurement = AdvancedMeasurementService.createLinearMeasurement(
      points,
      'distance'
    );
    
    expect(measurement.id).toBeDefined();
    expect(measurement.type).toBe('distance');
    expect(measurement.points).toEqual(points);
    expect(measurement.results.distanceMeters).toBeGreaterThan(0);
    expect(measurement.results.distanceFeet).toBeGreaterThan(0);
    expect(measurement.results.bearing).toBeGreaterThan(0);
    expect(measurement.precision.horizontalAccuracy).toBeGreaterThan(0);
  });

  it('should create area measurements', () => {
    const boundary = [
      {
        id: 'point1',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        pixelPosition: { x: 100, y: 100 },
        type: 'corner' as const
      },
      {
        id: 'point2',
        coordinates: { latitude: 37.7759, longitude: -122.4194 },
        pixelPosition: { x: 100, y: 200 },
        type: 'corner' as const
      },
      {
        id: 'point3',
        coordinates: { latitude: 37.7759, longitude: -122.4184 },
        pixelPosition: { x: 200, y: 200 },
        type: 'corner' as const
      },
      {
        id: 'point4',
        coordinates: { latitude: 37.7749, longitude: -122.4184 },
        pixelPosition: { x: 200, y: 100 },
        type: 'corner' as const
      }
    ];
    
    const measurement = AdvancedMeasurementService.createAreaMeasurement(
      boundary,
      'installation_area'
    );
    
    expect(measurement.id).toBeDefined();
    expect(measurement.type).toBe('installation_area');
    expect(measurement.boundary).toEqual(boundary);
    expect(measurement.results.areaSquareMeters).toBeGreaterThan(0);
    expect(measurement.results.areaSquareFeet).toBeGreaterThan(0);
    expect(measurement.results.perimeterMeters).toBeGreaterThan(0);
    expect(measurement.results.centroid.latitude).toBeDefined();
    expect(measurement.results.centroid.longitude).toBeDefined();
    expect(measurement.solar).toBeDefined();
    expect(measurement.solar?.maxPanelCount).toBeGreaterThan(0);
  });

  it('should export project data in different formats', async () => {
    // Create a project with some measurements
    const location = { latitude: 37.7749, longitude: -122.4194 };
    const project = AdvancedMeasurementService.createProject('Export Test', location);
    
    // Add a simple measurement
    const points = [
      {
        id: 'p1',
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        pixelPosition: { x: 0, y: 0 },
        type: 'waypoint' as const
      },
      {
        id: 'p2',
        coordinates: { latitude: 37.7759, longitude: -122.4184 },
        pixelPosition: { x: 100, y: 100 },
        type: 'waypoint' as const
      }
    ];
    
    AdvancedMeasurementService.createLinearMeasurement(points, 'distance');
    
    // Test JSON export
    const jsonExport = await AdvancedMeasurementService.exportProject(project.id, 'json');
    expect(jsonExport).toContain('linearMeasurements');
    expect(jsonExport).toContain('areaMeasurements');
    
    // Test GeoJSON export
    const geoJsonExport = await AdvancedMeasurementService.exportProject(project.id, 'geojson');
    expect(geoJsonExport).toContain('FeatureCollection');
    expect(geoJsonExport).toContain('LineString');
    
    // Test KML export
    const kmlExport = await AdvancedMeasurementService.exportProject(project.id, 'kml');
    expect(kmlExport).toContain('<?xml version="1.0"');
    expect(kmlExport).toContain('<kml xmlns=');
    
    // Test CSV export
    const csvExport = await AdvancedMeasurementService.exportProject(project.id, 'csv');
    expect(csvExport).toContain('Type,ID,Description');
    expect(csvExport).toContain('Linear');
  });

  it('should track service capabilities and statistics', () => {
    const capabilities = AdvancedMeasurementService.getServiceCapabilities();
    
    expect(capabilities.isInitialized).toBe(true);
    expect(capabilities.totalProjects).toBeGreaterThan(0);
    expect(capabilities.supportedFormats).toEqual(['json', 'geojson', 'kml', 'csv']);
    expect(capabilities.coordinateSystem).toContain('WGS84');
    expect(capabilities.measurementTypes).toContain('distance');
    expect(capabilities.measurementTypes).toContain('area');
  });

  it('should clear projects', () => {
    const beforeCount = AdvancedMeasurementService.getServiceCapabilities().totalProjects;
    expect(beforeCount).toBeGreaterThan(0);
    
    AdvancedMeasurementService.clearProjects();
    
    const afterCount = AdvancedMeasurementService.getServiceCapabilities().totalProjects;
    expect(afterCount).toBe(0);
  });
});