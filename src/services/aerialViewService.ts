// Aerial View Service - Now uses secure backend proxy

import { SecureApiService } from './secureApiService';

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  types: string[];
  components: any[];
}

export interface SatelliteImageOptions {
  width: number;
  height: number;
  zoom: number;
  mapType: 'satellite' | 'hybrid' | 'terrain';
  format: 'png' | 'jpeg';
  scale: 1 | 2;
}

export interface StreetViewOptions {
  width: number;
  height: number;
  fov: number; // field of view (10-120 degrees)
  heading: number; // 0-360 degrees (0=North, 90=East, 180=South, 270=West)
  pitch: number; // -90 to 90 degrees (0=horizontal, positive=up, negative=down)
  format: 'png' | 'jpeg';
}

export class AerialViewService {
  private static readonly USE_REAL_DATA = true; // Always use real data now

  /**
   * Get satellite image for a location
   */
  static async getSatelliteImage(
    latitude: number,
    longitude: number,
    options: {
      width?: number;
      height?: number;
      zoom?: number;
      scale?: number;
      provider?: 'google' | 'mapbox' | 'bing';
    } = {}
  ): Promise<string> {
    try {
      const { width = 640, height = 640, zoom = 18, provider = 'google' } = options;
      
      console.log('Getting satellite image for location:', { latitude, longitude, zoom, provider });
      
      // Use secure backend API
      const imageryData = await SecureApiService.getSatelliteImage(
        latitude,
        longitude,
        zoom,
        width,
        height,
        provider
      );
      
      console.log('Satellite image retrieved successfully');
      return imageryData.url || imageryData.imageUrl || this.getFallbackImageUrl(width, height);
    } catch (error) {
      console.error('Failed to get satellite image:', error);
      return this.getFallbackImageUrl(options.width || 640, options.height || 640);
    }
  }

  /**
   * Geocode an address to coordinates
   */
  static async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      console.log('Geocoding address:', address);
      
      // Use secure backend API
      const geocodeData = await SecureApiService.geocodeAddress(address);
      
      console.log('Address geocoded successfully');
      return this.parseGeocodeResult(geocodeData);
    } catch (error) {
      console.error('Failed to geocode address:', error);
      return this.getFallbackGeocodeResult(address);
    }
  }

  /**
   * Get place suggestions for autocomplete
   */
  static async getPlaceSuggestions(input: string, sessionToken?: string): Promise<any[]> {
    try {
      console.log('Getting place suggestions for:', input);
      
      // Use secure backend API
      const suggestionsData = await SecureApiService.getPlaceSuggestions(input, sessionToken);
      
      console.log('Place suggestions retrieved successfully');
      return suggestionsData.predictions || [];
    } catch (error) {
      console.error('Failed to get place suggestions:', error);
      return this.getFallbackPlaceSuggestions(input);
    }
  }

  /**
   * Get weather data for a location
   */
  static async getWeatherData(latitude: number, longitude: number, provider: 'openweather' | 'noaa' = 'openweather'): Promise<any> {
    try {
      console.log('Getting weather data for location:', { latitude, longitude, provider });
      
      // Use secure backend API
      const weatherData = await SecureApiService.getWeatherData(latitude, longitude, provider);
      
      console.log('Weather data retrieved successfully');
      return weatherData;
    } catch (error) {
      console.error('Failed to get weather data:', error);
      return this.getFallbackWeatherData(latitude, longitude);
    }
  }

  /**
   * Get comprehensive aerial view data
   */
  static async getAerialViewData(
    latitude: number,
    longitude: number,
    options: {
      includeWeather?: boolean;
      includeGeocoding?: boolean;
      imageOptions?: any;
    } = {}
  ): Promise<any> {
    try {
      console.log('Getting comprehensive aerial view data for location:', { latitude, longitude });
      
      const { includeWeather = true, includeGeocoding = false, imageOptions = {} } = options;
      
      // Get satellite image
      const satelliteImage = await this.getSatelliteImage(latitude, longitude, imageOptions);
      
      // Get weather data if requested
      let weatherData = null;
      if (includeWeather) {
        weatherData = await this.getWeatherData(latitude, longitude);
      }
      
      // Get geocoding data if requested
      let geocodingData = null;
      if (includeGeocoding) {
        // Reverse geocode the coordinates
        const reverseGeocode = await this.reverseGeocode(latitude, longitude);
        geocodingData = reverseGeocode;
      }
      
      return {
        location: { latitude, longitude },
        timestamp: new Date().toISOString(),
        satelliteImage,
        weather: weatherData,
        geocoding: geocodingData
      };
    } catch (error) {
      console.error('Failed to get aerial view data:', error);
      return this.getFallbackAerialViewData(latitude, longitude, options);
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    try {
      console.log('Reverse geocoding coordinates:', { latitude, longitude });
      
      // Use secure backend API with coordinates as address
      const address = `${latitude},${longitude}`;
      const geocodeData = await SecureApiService.geocodeAddress(address);
      
      console.log('Reverse geocoding completed successfully');
      return this.parseGeocodeResult(geocodeData);
    } catch (error) {
      console.error('Failed to reverse geocode:', error);
      return this.getFallbackGeocodeResult(`${latitude},${longitude}`);
    }
  }

  // Helper methods
  private static parseGeocodeResult(geocodeData: any): GeocodeResult {
    if (!geocodeData || !geocodeData.results || geocodeData.results.length === 0) {
      throw new Error('No geocoding results found');
    }

    const result = geocodeData.results[0];
    const location = result.geometry.location;

    return {
      address: result.formatted_address,
      latitude: location.lat,
      longitude: location.lng,
      placeId: result.place_id,
      types: result.types,
      components: result.address_components || []
    };
  }

  // Fallback methods
  private static getFallbackImageUrl(width: number, height: number): string {
    return `https://via.placeholder.com/${width}x${height}/4a90e2/ffffff?text=Aerial+View+Unavailable`;
  }

  private static getFallbackGeocodeResult(address: string): GeocodeResult {
    return {
      address: address,
      latitude: 40.7128,
      longitude: -74.0060,
      placeId: 'fallback_place_id',
      types: ['locality', 'political'],
      components: []
    };
  }

  private static getFallbackPlaceSuggestions(input: string): any[] {
    return [
      {
        description: `${input} - Demo Address`,
        place_id: `demo_${Date.now()}`,
        structured_formatting: {
          main_text: input,
          secondary_text: 'Demo Location'
        }
      }
    ];
  }

  private static getFallbackWeatherData(latitude: number, longitude: number): any {
    return {
      weather: [
        {
          id: 800,
          main: 'Clear',
          description: 'clear sky',
          icon: '01d'
        }
      ],
      main: {
        temp: 72,
        feels_like: 70,
        temp_min: 68,
        temp_max: 76,
        pressure: 1013,
        humidity: 50
      },
      wind: {
        speed: 5,
        deg: 180
      },
      clouds: {
        all: 20
      },
      sys: {
        country: 'US',
        sunrise: Date.now() / 1000 - 21600,
        sunset: Date.now() / 1000 + 21600
      },
      name: 'Demo Location'
    };
  }

  private static getFallbackAerialViewData(latitude: number, longitude: number, options: any): any {
    return {
      location: { latitude, longitude },
      timestamp: new Date().toISOString(),
      satelliteImage: this.getFallbackImageUrl(options.imageOptions?.width || 640, options.imageOptions?.height || 640),
      weather: options.includeWeather ? this.getFallbackWeatherData(latitude, longitude) : null,
      geocoding: options.includeGeocoding ? this.getFallbackGeocodeResult(`${latitude},${longitude}`) : null
    };
  }
}

// Export interfaces for compatibility
export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  placeId: string;
  types: string[];
  components: any[];
}

export default AerialViewService;