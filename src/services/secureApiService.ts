// Secure API Service - Uses backend proxy instead of direct API calls
export class SecureApiService {
  private static readonly API_BASE = '/api';
  private static mockMode = false;

  // Check if API is available and enable mock mode if not
  private static async checkApiAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/health`, { 
        method: 'GET',
        timeout: 2000 
      } as any);
      return response.ok;
    } catch {
      this.mockMode = true;
      return false;
    }
  }

  // Geocoding API
  static async geocodeAddress(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/geocode?address=${encodeURIComponent(address)}`);
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  // Places Autocomplete API
  static async getPlaceSuggestions(input: string, sessionToken?: string): Promise<any> {
    // Check if we should use mock mode
    if (this.mockMode || !(await this.checkApiAvailability())) {
      return this.getMockPlaceSuggestions(input);
    }

    try {
      let url = `${this.API_BASE}/places?input=${encodeURIComponent(input)}`;
      
      if (sessionToken) {
        url += `&sessiontoken=${sessionToken}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn('Places API failed, falling back to mock data');
        return this.getMockPlaceSuggestions(input);
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Places API error, falling back to mock data:', error);
      return this.getMockPlaceSuggestions(input);
    }
  }

  // Mock place suggestions for development
  private static getMockPlaceSuggestions(input: string): any {
    const mockSuggestions = [
      {
        description: `${input} Street, Anytown, CA 12345`,
        place_id: 'mock_place_1',
        structured_formatting: {
          main_text: `${input} Street`,
          secondary_text: 'Anytown, CA 12345'
        }
      },
      {
        description: `${input} Avenue, Springfield, IL 62701`,
        place_id: 'mock_place_2', 
        structured_formatting: {
          main_text: `${input} Avenue`,
          secondary_text: 'Springfield, IL 62701'
        }
      },
      {
        description: `${input} Boulevard, Austin, TX 78701`,
        place_id: 'mock_place_3',
        structured_formatting: {
          main_text: `${input} Boulevard`, 
          secondary_text: 'Austin, TX 78701'
        }
      }
    ];

    return {
      status: 'OK',
      predictions: mockSuggestions
    };
  }

  // Weather API
  static async getWeatherData(lat: number, lon: number, provider: 'openweather' | 'noaa' = 'openweather'): Promise<any> {
    try {
      const response = await fetch(
        `${this.API_BASE}/weather?lat=${lat}&lon=${lon}&provider=${provider}`
      );
      
      if (!response.ok) {
        throw new Error(`Weather API failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Weather API error:', error);
      throw error;
    }
  }

  // Satellite Imagery API
  static async getSatelliteImage(
    lat: number, 
    lon: number, 
    zoom: number = 18, 
    width: number = 640, 
    height: number = 640,
    provider: 'google' | 'mapbox' | 'bing' | 'esri' | 'maxar' = 'google'
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.API_BASE}/satellite?lat=${lat}&lon=${lon}&zoom=${zoom}&width=${width}&height=${height}&provider=${provider}`
      );
      
      if (!response.ok) {
        throw new Error(`Satellite API failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Satellite API error:', error);
      throw error;
    }
  }

  // Get satellite image URL (for direct image display)
  static getSatelliteImageUrl(
    lat: number, 
    lon: number, 
    zoom: number = 18, 
    width: number = 640, 
    height: number = 640,
    provider: 'google' | 'mapbox' | 'bing' | 'esri' | 'maxar' = 'google'
  ): string {
    return `${this.API_BASE}/satellite?lat=${lat}&lon=${lon}&zoom=${zoom}&width=${width}&height=${height}&provider=${provider}`;
  }

  // Solar API (Google Solar API)
  static async getSolarData(
    lat: number,
    lon: number,
    radiusMeters: number = 100
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.API_BASE}/solar?lat=${lat}&lon=${lon}&radiusMeters=${radiusMeters}`
      );
      
      if (!response.ok) {
        throw new Error(`Solar API failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Solar API error:', error);
      throw error;
    }
  }

  // Multi-source imagery with fallback
  static async getMultiSourceImagery(
    lat: number,
    lon: number,
    zoom: number = 18,
    width: number = 640,
    height: number = 640,
    preferredProvider: 'google' | 'mapbox' | 'bing' = 'google'
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.API_BASE}/satellite?lat=${lat}&lon=${lon}&zoom=${zoom}&width=${width}&height=${height}&provider=${preferredProvider}`
      );
      
      if (!response.ok) {
        throw new Error(`Multi-source imagery failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Multi-source imagery error:', error);
      throw error;
    }
  }

  // Real-time shading analysis
  static async getRealTimeShading(
    lat: number,
    lon: number,
    timestamp?: number
  ): Promise<any> {
    try {
      let url = `${this.API_BASE}/shading?lat=${lat}&lon=${lon}`;
      if (timestamp) {
        url += `&timestamp=${timestamp}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Shading analysis failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Shading analysis error:', error);
      throw error;
    }
  }

  // AI Roof Analysis
  static async getAIRoofAnalysis(
    lat: number,
    lon: number,
    roofData?: any
  ): Promise<any> {
    try {
      const response = await fetch(`${this.API_BASE}/roof-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lat,
          lon,
          roofData
        })
      });
      
      if (!response.ok) {
        throw new Error(`AI roof analysis failed: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('AI roof analysis error:', error);
      throw error;
    }
  }

  // Health check for API availability
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/geocode?address=test`);
      return response.status !== 500; // Consider healthy if not server error
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
} 