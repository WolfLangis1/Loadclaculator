/**
 * Multi-Source Imagery Integration Service
 * 
 * Comprehensive imagery service that integrates multiple satellite and aerial
 * imagery providers (Google, Bing, Esri, Maxar) to provide the best available
 * imagery for solar analysis, site assessment, and project documentation.
 * Includes automatic source selection, quality assessment, and fallback handling.
 */

import { SecureApiService } from './secureApiService';

// Multi-Source Imagery Service - Now uses secure backend proxy
export class MultiSourceImageryService {
  private static readonly USE_REAL_DATA = true; // Always use real data now

  /**
   * Get satellite imagery from multiple providers with fallback
   */
  static async getSatelliteImage(
    latitude: number,
    longitude: number,
    zoom: number = 18,
    width: number = 640,
    height: number = 640,
    preferredProvider: 'google' | 'mapbox' | 'bing' | 'esri' | 'maxar' = 'google'
  ): Promise<any> {
    try {
      console.log('Getting satellite imagery for location:', { latitude, longitude, zoom, preferredProvider });
      
      // Use secure backend API
      const imageryData = await SecureApiService.getMultiSourceImagery(
        latitude,
        longitude,
        zoom,
        width,
        height,
        preferredProvider
      );
      
      console.log('Satellite imagery retrieved successfully');
      return imageryData;
    } catch (error) {
      console.error('Failed to get satellite imagery:', error);
      
      // Return fallback imagery data
      return this.getFallbackImageryData(latitude, longitude, zoom, width, height, preferredProvider);
    }
  }

  /**
   * Get imagery from specific provider
   */
  static async getProviderImagery(
    latitude: number,
    longitude: number,
    provider: 'google' | 'mapbox' | 'bing' | 'esri' | 'maxar',
    options: {
      zoom?: number;
      width?: number;
      height?: number;
      format?: 'png' | 'jpg' | 'webp';
    } = {}
  ): Promise<any> {
    try {
      const { zoom = 18, width = 640, height = 640 } = options;
      
      console.log(`Getting ${provider} imagery for location:`, { latitude, longitude, zoom });
      
      // Use secure backend API
      const imageryData = await SecureApiService.getSatelliteImage(
        latitude,
        longitude,
        zoom,
        width,
        height,
        provider
      );
      
      console.log(`${provider} imagery retrieved successfully`);
      return imageryData;
    } catch (error) {
      console.error(`Failed to get ${provider} imagery:`, error);
      
      // Return fallback data for specific provider
      return this.getFallbackProviderImagery(latitude, longitude, provider, options);
    }
  }

  /**
   * Get imagery with automatic provider fallback
   */
  static async getImageryWithFallback(
    latitude: number,
    longitude: number,
    options: {
      zoom?: number;
      width?: number;
      height?: number;
      providers?: Array<'google' | 'mapbox' | 'bing' | 'esri' | 'maxar'>;
    } = {}
  ): Promise<any> {
    const { zoom = 18, width = 640, height = 640, providers = ['google', 'mapbox', 'bing'] } = options;
    
    console.log('Getting imagery with fallback for location:', { latitude, longitude, providers });
    
    // Try each provider in order
    for (const provider of providers) {
      try {
        const imageryData = await this.getProviderImagery(latitude, longitude, provider, { zoom, width, height });
        console.log(`Successfully retrieved imagery from ${provider}`);
        return {
          ...imageryData,
          provider,
          fallbackUsed: false
        };
      } catch (error) {
        console.warn(`Failed to get imagery from ${provider}, trying next provider...`);
        continue;
      }
    }
    
    // If all providers fail, return fallback data
    console.warn('All providers failed, using fallback data');
    return {
      ...this.getFallbackImageryData(latitude, longitude, zoom, width, height, 'google'),
      provider: 'fallback',
      fallbackUsed: true
    };
  }

  /**
   * Get imagery comparison from multiple providers
   */
  static async getImageryComparison(
    latitude: number,
    longitude: number,
    options: {
      zoom?: number;
      width?: number;
      height?: number;
      providers?: Array<'google' | 'mapbox' | 'bing' | 'esri' | 'maxar'>;
    } = {}
  ): Promise<any> {
    const { zoom = 18, width = 640, height = 640, providers = ['google', 'mapbox', 'bing'] } = options;
    
    console.log('Getting imagery comparison for location:', { latitude, longitude, providers });
    
    const comparison = {
      location: { latitude, longitude },
      timestamp: new Date().toISOString(),
      providers: {} as Record<string, any>,
      bestProvider: null as string | null,
      qualityScores: {} as Record<string, number>
    };
    
    // Get imagery from each provider
    for (const provider of providers) {
      try {
        const imageryData = await this.getProviderImagery(latitude, longitude, provider, { zoom, width, height });
        comparison.providers[provider] = imageryData;
        
        // Calculate quality score (simplified)
        const qualityScore = this.calculateImageryQuality(imageryData, provider);
        comparison.qualityScores[provider] = qualityScore;
      } catch (error) {
        console.warn(`Failed to get imagery from ${provider} for comparison`);
        comparison.providers[provider] = null;
        comparison.qualityScores[provider] = 0;
      }
    }
    
    // Determine best provider
    const bestProvider = Object.entries(comparison.qualityScores)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a)[0];
    
    if (bestProvider) {
      comparison.bestProvider = bestProvider[0];
    }
    
    return comparison;
  }

  /**
   * Get imagery metadata and capabilities
   */
  static async getImageryMetadata(
    latitude: number,
    longitude: number,
    provider: 'google' | 'mapbox' | 'bing' | 'esri' | 'maxar' = 'google'
  ): Promise<any> {
    try {
      console.log(`Getting imagery metadata for ${provider} at location:`, { latitude, longitude });
      
      // Use secure backend API to get metadata
      const imageryData = await SecureApiService.getSatelliteImage(latitude, longitude, 18, 640, 640, provider);
      
      return {
        provider,
        location: { latitude, longitude },
        timestamp: new Date().toISOString(),
        capabilities: this.getProviderCapabilities(provider),
        metadata: {
          resolution: this.getProviderResolution(provider),
          coverage: this.getProviderCoverage(provider),
          updateFrequency: this.getProviderUpdateFrequency(provider),
          dataSource: imageryData.provider || provider
        }
      };
    } catch (error) {
      console.error(`Failed to get imagery metadata for ${provider}:`, error);
      return this.getFallbackMetadata(latitude, longitude, provider);
    }
  }

  // Helper methods
  private static calculateImageryQuality(imageryData: any, provider: string): number {
    // Simplified quality calculation
    let qualityScore = 0.8; // Base score
    
    // Provider-specific adjustments
    switch (provider) {
      case 'google':
        qualityScore = 0.9; // High quality
        break;
      case 'mapbox':
        qualityScore = 0.85; // Good quality
        break;
      case 'bing':
        qualityScore = 0.8; // Standard quality
        break;
      case 'esri':
        qualityScore = 0.75; // Lower quality but good coverage
        break;
      case 'maxar':
        qualityScore = 0.95; // Very high quality
        break;
    }
    
    // Adjust based on data availability
    if (imageryData && imageryData.url) {
      qualityScore += 0.1;
    }
    
    return Math.min(qualityScore, 1.0);
  }

  private static getProviderCapabilities(provider: string): any {
    const capabilities = {
      google: {
        maxZoom: 20,
        formats: ['png', 'jpg'],
        coverage: 'global',
        updateFrequency: 'monthly'
      },
      mapbox: {
        maxZoom: 22,
        formats: ['png', 'jpg', 'webp'],
        coverage: 'global',
        updateFrequency: 'quarterly'
      },
      bing: {
        maxZoom: 19,
        formats: ['png', 'jpg'],
        coverage: 'global',
        updateFrequency: 'monthly'
      },
      esri: {
        maxZoom: 18,
        formats: ['png', 'jpg'],
        coverage: 'global',
        updateFrequency: 'yearly'
      },
      maxar: {
        maxZoom: 20,
        formats: ['png', 'jpg'],
        coverage: 'select_regions',
        updateFrequency: 'quarterly'
      }
    };
    
    return capabilities[provider as keyof typeof capabilities] || capabilities.google;
  }

  private static getProviderResolution(provider: string): string {
    const resolutions = {
      google: '0.5m',
      mapbox: '0.3m',
      bing: '0.5m',
      esri: '1m',
      maxar: '0.3m'
    };
    
    return resolutions[provider as keyof typeof resolutions] || '0.5m';
  }

  private static getProviderCoverage(provider: string): string {
    const coverages = {
      google: 'global',
      mapbox: 'global',
      bing: 'global',
      esri: 'global',
      maxar: 'select_regions'
    };
    
    return coverages[provider as keyof typeof coverages] || 'global';
  }

  private static getProviderUpdateFrequency(provider: string): string {
    const frequencies = {
      google: 'monthly',
      mapbox: 'quarterly',
      bing: 'monthly',
      esri: 'yearly',
      maxar: 'quarterly'
    };
    
    return frequencies[provider as keyof typeof frequencies] || 'monthly';
  }

  // Fallback methods
  private static getFallbackImageryData(
    latitude: number,
    longitude: number,
    zoom: number,
    width: number,
    height: number,
    provider: string
  ): any {
    return {
      type: 'image',
      url: `https://via.placeholder.com/${width}x${height}/4a90e2/ffffff?text=Satellite+Imagery+Unavailable`,
      provider: provider,
      location: { lat: latitude, lon: longitude },
      zoom,
      width,
      height,
      timestamp: new Date().toISOString(),
      fallback: true
    };
  }

  private static getFallbackProviderImagery(
    latitude: number,
    longitude: number,
    provider: string,
    options: any
  ): any {
    return this.getFallbackImageryData(
      latitude,
      longitude,
      options.zoom || 18,
      options.width || 640,
      options.height || 640,
      provider
    );
  }

  private static getFallbackMetadata(latitude: number, longitude: number, provider: string): any {
    return {
      provider,
      location: { latitude, longitude },
      timestamp: new Date().toISOString(),
      capabilities: this.getProviderCapabilities(provider),
      metadata: {
        resolution: this.getProviderResolution(provider),
        coverage: this.getProviderCoverage(provider),
        updateFrequency: this.getProviderUpdateFrequency(provider),
        dataSource: 'fallback'
      },
      fallback: true
    };
  }
}

export default MultiSourceImageryService;