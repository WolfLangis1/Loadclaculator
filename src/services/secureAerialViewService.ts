// Secure Aerial View Service - Uses backend proxy for API calls
import { SecureApiService } from './secureApiService';

export interface GeocodeResult {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  components?: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface AerialView {
  id: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  satelliteImageUrl?: string;
  streetViewUrls?: string[];
  weatherData?: any;
  solarData?: any;
  timestamp: Date;
}

export class SecureAerialViewService {
  private static readonly USE_SECURE_API = true;

  // Get satellite imagery using secure backend
  static async getSatelliteImagery(
    latitude: number,
    longitude: number,
    options: {
      zoom?: number;
      width?: number;
      height?: number;
      provider?: 'google' | 'mapbox' | 'bing';
    } = {}
  ): Promise<any> {
    try {
      if (this.USE_SECURE_API) {
        // Validate input coordinates
        if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          throw new Error('Invalid coordinates provided for satellite imagery');
        }

        // Use secure backend proxy
        const result = await SecureApiService.getSatelliteImage(
          latitude,
          longitude,
          options.zoom || 18,
          options.width || 640,
          options.height || 640,
          options.provider || 'google'
        );
        
        // Validate API response
        if (!result) {
          throw new Error('No response from satellite imagery service');
        }

        // Check if we have a valid image URL
        if (!result.url && !result.imageUrl) {
          throw new Error('No image URL returned from satellite service');
        }

        const imageUrl = result.url || result.imageUrl;
        if (typeof imageUrl !== 'string' || imageUrl.length === 0) {
          throw new Error('Invalid image URL format returned from satellite service');
        }
        
        return {
          success: true,
          data: { imageUrl },
          source: 'secure-backend'
        };
      } else {
        throw new Error('Secure API service is required - no fallback available');
      }
    } catch (error) {
      console.error('Secure satellite imagery error:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error'
      };
    }
  }

  // Get address suggestions using secure backend
  static async getAddressSuggestions(input: string): Promise<any> {
    try {
      if (this.USE_SECURE_API) {
        // Use secure backend proxy
        const result = await SecureApiService.getPlaceSuggestions(input);
        
        return {
          success: true,
          data: result,
          source: 'secure-backend'
        };
      } else {
        throw new Error('Secure API service is required - no fallback available');
      }
    } catch (error) {
      console.error('Secure address suggestions error:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error'
      };
    }
  }

  // Get weather data using secure backend
  static async getWeatherData(latitude: number, longitude: number): Promise<any> {
    try {
      if (this.USE_SECURE_API) {
        // Use secure backend proxy
        const result = await SecureApiService.getWeatherData(latitude, longitude);
        
        return {
          success: true,
          data: result,
          source: 'secure-backend'
        };
      } else {
        throw new Error('Secure API service is required - no fallback available');
      }
    } catch (error) {
      console.error('Secure weather data error:', error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error'
      };
    }
  }

  // Geocode address using secure backend
  static async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      if (this.USE_SECURE_API) {
        // Use secure backend proxy
        const result = await SecureApiService.geocodeAddress(address);
        
        if (result.results && result.results.length > 0) {
          const geocodeResult = result.results[0];
          const location = geocodeResult.geometry.location;
          
          // Parse address components
          const components: any = {};
          geocodeResult.address_components?.forEach((component: any) => {
            if (component.types.includes('street_number')) {
              components.streetNumber = component.long_name;
            }
            if (component.types.includes('route')) {
              components.streetName = component.long_name;
            }
            if (component.types.includes('locality')) {
              components.city = component.long_name;
            }
            if (component.types.includes('administrative_area_level_1')) {
              components.state = component.short_name;
            }
            if (component.types.includes('postal_code')) {
              components.zipCode = component.long_name;
            }
            if (component.types.includes('country')) {
              components.country = component.short_name;
            }
          });

          return {
            address: geocodeResult.formatted_address,
            coordinates: {
              latitude: location.lat,
              longitude: location.lng
            },
            components
          };
        }
        
        return null;
      } else {
        throw new Error('Secure API service is required - no fallback available');
      }
    } catch (error) {
      console.error('Secure geocoding error:', error);
      return null;
    }
  }

  // Get satellite image URL (for direct image display)
  static async getSatelliteImage(
    latitude: number,
    longitude: number,
    options: {
      zoom?: number;
      width?: number;
      height?: number;
      provider?: 'google' | 'mapbox' | 'bing';
    } = {}
  ): Promise<string> {
    try {
      if (this.USE_SECURE_API) {
        // Use secure backend proxy
        const result = await SecureApiService.getSatelliteImage(
          latitude,
          longitude,
          options.zoom || 18,
          options.width || 640,
          options.height || 640,
          options.provider || 'google'
        );
        
        return result.url || '';
      } else {
        throw new Error('Secure API service is required - no fallback available');
      }
    } catch (error) {
      console.error('Secure satellite image error:', error);
      return `https://via.placeholder.com/${options.width || 640}x${options.height || 640}/ffcccc/cc0000?text=Error+Loading+Image`;
    }
  }

  // Get multi-angle street view using secure backend
  static async getMultiAngleStreetView(
    latitude: number,
    longitude: number,
    options: { width?: number; height?: number } = {}
  ): Promise<{heading: number; imageUrl: string; label: string}[]> {
    try {
      // Validate input coordinates
      if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        throw new Error('Invalid coordinates provided for street view');
      }

      const { width = 640, height = 640 } = options;
      
      // Define multiple headings for comprehensive street view coverage
      const headings = [
        { heading: 0, label: 'North View' },
        { heading: 90, label: 'East View' },
        { heading: 180, label: 'South View' },
        { heading: 270, label: 'West View' }
      ];
      
      // Get street view for each heading using SecureApiService
      const streetViewPromises = headings.map(async ({ heading, label }) => {
        try {
          const result = await SecureApiService.getStreetView(
            latitude,
            longitude,
            heading,
            0, // pitch
            90, // fov
            width,
            height
          );
          
          // Validate the API response
          if (!result) {
            console.warn(`No response from street view service for ${label}`);
            return {
              heading,
              imageUrl: `https://via.placeholder.com/${width}x${height}/ffcccc/cc0000?text=${encodeURIComponent(label + ' Unavailable')}`,
              label
            };
          }

          // Check for valid image URL
          const imageUrl = result.url || result.imageUrl;
          if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.length === 0) {
            console.warn(`No valid image URL returned for ${label}`);
            return {
              heading,
              imageUrl: `https://via.placeholder.com/${width}x${height}/ffcccc/cc0000?text=${encodeURIComponent(label + ' Unavailable')}`,
              label
            };
          }

          // Check if street view is actually available (not an error response)
          if (result.available === false || (result.status && result.status !== 'OK')) {
            console.warn(`Street view not available for ${label}:`, result.status || 'Unknown status');
            return {
              heading,
              imageUrl: `https://via.placeholder.com/${width}x${height}/ffcccc/cc0000?text=${encodeURIComponent(label + ' Not Available')}`,
              label
            };
          }
          
          return {
            heading,
            imageUrl,
            label
          };
        } catch (error) {
          console.warn(`Failed to get ${label}:`, error);
          return {
            heading,
            imageUrl: `https://via.placeholder.com/${width}x${height}/ffcccc/cc0000?text=${encodeURIComponent(label + ' Error')}`,
            label
          };
        }
      });
      
      const results = await Promise.all(streetViewPromises);
      
      // Log summary of results
      const validImages = results.filter(r => r.imageUrl && !r.imageUrl.includes('placeholder'));
      console.log(`Street view results: ${validImages.length}/${results.length} views available`);
      
      return results;
    } catch (error) {
      console.error('Street view error:', error);
      throw error;
    }
  }

  // Create aerial view with all data
  static async createAerialView(address: string): Promise<AerialView> {
    const geocodeResult = await this.geocodeAddress(address);
    
    if (!geocodeResult) {
      throw new Error('Failed to geocode address');
    }

    const satelliteImageUrl = await this.getSatelliteImage(
      geocodeResult.coordinates.latitude,
      geocodeResult.coordinates.longitude
    );

    const streetViewResults = await this.getMultiAngleStreetView(
      geocodeResult.coordinates.latitude,
      geocodeResult.coordinates.longitude
    );

    const weatherData = await this.getWeatherData(
      geocodeResult.coordinates.latitude,
      geocodeResult.coordinates.longitude
    );

    return {
      id: `aerial_${Date.now()}`,
      address: geocodeResult.address,
      coordinates: geocodeResult.coordinates,
      satelliteImageUrl,
      streetViewUrls: streetViewResults.map(sv => sv.imageUrl),
      weatherData: weatherData.data,
      timestamp: new Date()
    };
  }

  // Auto-detect PV areas (placeholder for future implementation)
  static async autoDetectPVAreas(view: AerialView): Promise<void> {
    // This would use AI/ML services to detect solar panels
    console.log('Auto-detecting PV areas for:', view.address);
  }

  // Add electrical infrastructure (placeholder for future implementation)
  static async addElectricalInfrastructure(view: AerialView, options: any): Promise<void> {
    // This would add electrical components to the aerial view
    console.log('Adding electrical infrastructure for:', view.address);
  }

  // Get configuration status
  static getConfigurationStatus(): {
    isReal: boolean;
    message: string;
    setupInstructions?: string;
  } {
    return {
      isReal: this.USE_SECURE_API,
      message: this.USE_SECURE_API ? 'Secure backend configured and ready' : 'Using fallback mode - configure secure backend for full functionality',
      setupInstructions: this.USE_SECURE_API ? undefined : 'Add API keys to Vercel environment variables to enable secure backend'
    };
  }

  // Check if secure API is available
  static async checkApiHealth(): Promise<boolean> {
    try {
      return await SecureApiService.healthCheck();
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
} 