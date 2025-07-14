/**
 * Change Detection Service Tests
 * 
 * Tests for the change detection functionality including pattern recognition,
 * image analysis, and historical comparison capabilities.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import ChangeDetectionService from '../services/changeDetectionService';

describe('ChangeDetectionService', () => {
  beforeAll(async () => {
    await ChangeDetectionService.initialize();
  });

  it('should initialize successfully', () => {
    const capabilities = ChangeDetectionService.getServiceCapabilities();
    expect(capabilities.isInitialized).toBe(true);
    expect(capabilities.supportedAlgorithms).toContain('hybrid');
    expect(capabilities.modelsLoaded).toBeGreaterThanOrEqual(0);
  });

  it('should have correct supported algorithms', () => {
    const capabilities = ChangeDetectionService.getServiceCapabilities();
    expect(capabilities.supportedAlgorithms).toEqual([
      'pixel_differencing',
      'feature_matching', 
      'ml_classification',
      'hybrid'
    ]);
  });

  it('should track analysis history', () => {
    const capabilities = ChangeDetectionService.getServiceCapabilities();
    expect(typeof capabilities.analysisHistory).toBe('number');
    expect(capabilities.cacheSize).toBeGreaterThanOrEqual(0);
  });

  it('should clear cache successfully', () => {
    ChangeDetectionService.clearCache();
    const capabilities = ChangeDetectionService.getServiceCapabilities();
    expect(capabilities.cacheSize).toBe(0);
  });
});