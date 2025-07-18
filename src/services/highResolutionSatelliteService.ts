/**
 * High-Resolution Satellite Imagery Service
 * Provides access to multiple satellite data sources for maximum zoom levels
 */

export interface SatelliteProvider {
  name: string;
  maxZoom: number;
  resolution: string;
  coverage: string;
  apiRequired: boolean;
  cost: 'free' | 'paid' | 'freemium';
}

export interface HighResImageRequest {
  latitude: number;
  longitude: number;
  zoom: number;
  width: number;
  height: number;
  provider?: string;
}

export interface HighResImageResponse {
  imageUrl: string;
  actualZoom: number;
  resolution: number; // meters per pixel
  provider: string;
  timestamp?: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export class HighResolutionSatelliteService {
  
  /**
   * Available satellite imagery providers
   */
  static getAvailableProviders(): SatelliteProvider[] {
    return [
      {
        name: 'Google Maps (Satellite)',
        maxZoom: 23,
        resolution: '0.15m/pixel (best areas)',
        coverage: 'Global',
        apiRequired: true,
        cost: 'freemium'
      },
      {
        name: 'Google Earth (Enterprise)',
        maxZoom: 24,
        resolution: '0.05-0.1m/pixel',
        coverage: 'Major cities',
        apiRequired: true,
        cost: 'paid'
      },
      {
        name: 'Esri World Imagery',
        maxZoom: 23,
        resolution: '0.3m/pixel',
        coverage: 'Global',
        apiRequired: false,
        cost: 'freemium'
      },
      {
        name: 'MapBox Satellite',
        maxZoom: 22,
        resolution: '0.5m/pixel',
        coverage: 'Global',
        apiRequired: true,
        cost: 'freemium'
      },
      {
        name: 'Bing Maps Aerial',
        maxZoom: 23,
        resolution: '0.15m/pixel',
        coverage: 'US/Europe focus',
        apiRequired: true,
        cost: 'freemium'
      },
      {
        name: 'USGS National Map',
        maxZoom: 24,
        resolution: '0.06m/pixel (6-inch)',
        coverage: 'US only',
        apiRequired: false,
        cost: 'free'
      },
      {
        name: 'Planet Labs',
        maxZoom: 25,
        resolution: '0.03m/pixel (3m)',
        coverage: 'Global, daily updates',
        apiRequired: true,
        cost: 'paid'
      }
    ];
  }

  /**
   * Get maximum available zoom for location
   */
  static async getMaxZoomForLocation(latitude: number, longitude: number): Promise<{
    provider: string;
    maxZoom: number;
    estimatedResolution: number;
  }[]> {
    const results = [];
    
    // Test Google Maps maximum zoom
    try {
      const googleMax = await this.testGoogleMapsMaxZoom(latitude, longitude);
      results.push({
        provider: 'Google Maps',
        maxZoom: googleMax,
        estimatedResolution: this.calculateGoogleMapsResolution(googleMax, latitude)
      });
    } catch (error) {
      console.warn('Failed to test Google Maps max zoom:', error);
    }

    // Test other providers
    const providers = this.getAvailableProviders();
    for (const provider of providers) {
      if (provider.name !== 'Google Maps (Satellite)') {
        try {
          const available = await this.testProviderAvailability(provider.name, latitude, longitude);
          if (available) {
            results.push({
              provider: provider.name,
              maxZoom: provider.maxZoom,
              estimatedResolution: this.estimateResolution(provider.maxZoom, latitude)
            });
          }
        } catch (error) {
          console.warn(`Failed to test ${provider.name}:`, error);
        }
      }
    }

    return results.sort((a, b) => a.estimatedResolution - b.estimatedResolution);
  }

  /**
   * Get high-resolution satellite image
   */
  static async getHighResolutionImage(request: HighResImageRequest): Promise<HighResImageResponse> {
    const provider = request.provider || 'auto';
    
    if (provider === 'auto') {
      // Try providers in order of resolution
      const availableProviders = await this.getMaxZoomForLocation(request.latitude, request.longitude);
      
      for (const providerInfo of availableProviders) {
        try {
          return await this.getImageFromProvider(providerInfo.provider, request);
        } catch (error) {
          console.warn(`Failed to get image from ${providerInfo.provider}:`, error);
          continue;
        }
      }
      
      throw new Error('No providers available for this location');
    } else {
      return await this.getImageFromProvider(provider, request);
    }
  }

  /**
   * Enhanced Google Maps with maximum zoom detection
   */
  static async getEnhancedGoogleMapsImage(
    latitude: number, 
    longitude: number, 
    width: number = 800, 
    height: number = 600
  ): Promise<HighResImageResponse> {
    
    // Detect maximum available zoom for this location
    const maxZoom = await this.testGoogleMapsMaxZoom(latitude, longitude);
    
    const url = `/api/satellite-enhanced?` + new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      zoom: maxZoom.toString(),
      width: width.toString(),
      height: height.toString(),
      format: 'png',
      maptype: 'satellite'
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get enhanced satellite image: ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    
    return {
      imageUrl,
      actualZoom: maxZoom,
      resolution: this.calculateGoogleMapsResolution(maxZoom, latitude),
      provider: 'Google Maps Enhanced',
      bounds: this.calculateBounds(latitude, longitude, maxZoom, width, height)
    };
  }

  /**
   * USGS High-Resolution Imagery (US only, up to 6-inch resolution)
   */
  static async getUSGSHighResImage(
    latitude: number, 
    longitude: number, 
    width: number = 800, 
    height: number = 600
  ): Promise<HighResImageResponse> {
    
    // Check if location is in US
    if (!this.isLocationInUS(latitude, longitude)) {
      throw new Error('USGS imagery is only available for US locations');
    }

    const url = `/api/usgs-imagery?` + new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      width: width.toString(),
      height: height.toString(),
      layers: 'USGSImageryTopo,USGSNAIPImagery'
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get USGS imagery: ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    
    return {
      imageUrl,
      actualZoom: 24,
      resolution: 0.15, // 6-inch to 1-foot typical
      provider: 'USGS National Map',
      bounds: this.calculateBounds(latitude, longitude, 24, width, height)
    };
  }

  /**
   * Esri World Imagery (Free, high-resolution alternative)
   */
  static async getEsriWorldImagery(
    latitude: number, 
    longitude: number, 
    width: number = 800, 
    height: number = 600
  ): Promise<HighResImageResponse> {
    
    const url = `/api/esri-imagery?` + new URLSearchParams({
      lat: latitude.toString(),
      lng: longitude.toString(),
      width: width.toString(),
      height: height.toString(),
      zoom: '23'
    });

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to get Esri imagery: ${response.statusText}`);
    }

    const imageBlob = await response.blob();
    const imageUrl = URL.createObjectURL(imageBlob);
    
    return {
      imageUrl,
      actualZoom: 23,
      resolution: 0.3,
      provider: 'Esri World Imagery',
      bounds: this.calculateBounds(latitude, longitude, 23, width, height)
    };
  }

  /**
   * Test Google Maps maximum zoom for specific location
   */
  private static async testGoogleMapsMaxZoom(latitude: number, longitude: number): Promise<number> {
    // Start from zoom 25 and work down until we get a valid image
    for (let zoom = 25; zoom >= 18; zoom--) {
      try {
        const testUrl = `/api/test-zoom?lat=${latitude}&lng=${longitude}&zoom=${zoom}`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        
        if (response.ok) {
          return zoom;
        }
      } catch (error) {
        continue;
      }
    }
    
    return 18; // Fallback to standard zoom
  }

  /**
   * Calculate Google Maps resolution at zoom level
   */
  private static calculateGoogleMapsResolution(zoom: number, latitude: number): number {
    // Google Maps resolution formula
    const earthCircumference = 40075017; // meters
    const resolution = earthCircumference * Math.cos(latitude * Math.PI / 180) / Math.pow(2, zoom + 8);
    return resolution;
  }

  /**
   * Test if provider is available for location
   */
  private static async testProviderAvailability(provider: string, latitude: number, longitude: number): Promise<boolean> {
    try {
      switch (provider) {
        case 'USGS National Map':
          return this.isLocationInUS(latitude, longitude);
        case 'Esri World Imagery':
          return true; // Global coverage
        case 'MapBox Satellite':
          return true; // Global coverage
        case 'Bing Maps Aerial':
          return true; // Global coverage
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Get image from specific provider
   */
  private static async getImageFromProvider(provider: string, request: HighResImageRequest): Promise<HighResImageResponse> {
    switch (provider) {
      case 'Google Maps':
      case 'Google Maps Enhanced':
        return this.getEnhancedGoogleMapsImage(request.latitude, request.longitude, request.width, request.height);
      
      case 'USGS National Map':
        return this.getUSGSHighResImage(request.latitude, request.longitude, request.width, request.height);
      
      case 'Esri World Imagery':
        return this.getEsriWorldImagery(request.latitude, request.longitude, request.width, request.height);
      
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  }

  /**
   * Check if location is in US
   */
  private static isLocationInUS(latitude: number, longitude: number): boolean {
    // Rough US bounds including Alaska and Hawaii
    return (
      (latitude >= 24.396308 && latitude <= 71.538800 && longitude >= -179.148909 && longitude <= -68.748909) ||
      (latitude >= 18.948267 && latitude <= 22.228024 && longitude >= -162.425629 && longitude <= -154.749756)
    );
  }

  /**
   * Calculate image bounds
   */
  private static calculateBounds(latitude: number, longitude: number, zoom: number, width: number, height: number) {
    const resolution = this.calculateGoogleMapsResolution(zoom, latitude);
    const halfWidth = (width * resolution) / 2;
    const halfHeight = (height * resolution) / 2;
    
    const latDelta = halfHeight / 111320; // meters per degree latitude
    const lngDelta = halfWidth / (111320 * Math.cos(latitude * Math.PI / 180));
    
    return {
      north: latitude + latDelta,
      south: latitude - latDelta,
      east: longitude + lngDelta,
      west: longitude - lngDelta
    };
  }

  /**
   * Estimate resolution for zoom level
   */
  private static estimateResolution(zoom: number, latitude: number): number {
    return this.calculateGoogleMapsResolution(zoom, latitude);
  }
}