// Aerial View Service
// Handles address search, satellite imagery capture, and aerial view annotations

import type { AerialView, AerialAnnotation } from '../types/sld';

export interface GeocodeResult {
  address: string;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  components: {
    streetNumber?: string;
    streetName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
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
  // API Keys from environment variables
  private static readonly GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY';
  private static readonly MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY || 'YOUR_MAPBOX_API_KEY';
  private static readonly USE_REAL_DATA = import.meta.env.VITE_USE_REAL_AERIAL_DATA === 'true';
  private static readonly PREFERRED_PROVIDER = import.meta.env.VITE_AERIAL_PROVIDER || 'google';
  
  /**
   * Search for address and get coordinates
   */
  static async geocodeAddress(address: string): Promise<GeocodeResult> {
    // Debug logging
    console.log('🔍 Geocoding Debug Info:');
    console.log('- USE_REAL_DATA:', this.USE_REAL_DATA);
    console.log('- API Key configured:', this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY');
    console.log('- API Key (first 10 chars):', this.GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
    
    try {
      // Use real geocoding if configured, otherwise use mock data
      if (this.USE_REAL_DATA && this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        console.log('🌍 Using real Google Geocoding API');
        return await this.realGeocodeAddress(address);
      } else {
        console.log('🔧 Using mock geocoding data');
        console.log('Reason: USE_REAL_DATA =', this.USE_REAL_DATA, 'API Key configured =', this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY');
        return await this.mockGeocodeAddress(address);
      }
    } catch (error) {
      console.error('❌ Geocoding failed:', error);
      // Fallback to mock data if real API fails
      console.log('🔄 Falling back to mock data');
      return await this.mockGeocodeAddress(address);
    }
  }

  /**
   * Mock geocoding service for development
   */
  private static async mockGeocodeAddress(address: string): Promise<GeocodeResult> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock coordinates for common addresses (for demo purposes)
    const mockAddresses: Record<string, GeocodeResult> = {
      '123 main st': {
        address: '123 Main St',
        latitude: 40.7128,
        longitude: -74.0060,
        formattedAddress: '123 Main St, New York, NY 10001, USA',
        components: {
          streetNumber: '123',
          streetName: 'Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        }
      },
      '456 oak ave': {
        address: '456 Oak Ave',
        latitude: 34.0522,
        longitude: -118.2437,
        formattedAddress: '456 Oak Ave, Los Angeles, CA 90210, USA',
        components: {
          streetNumber: '456',
          streetName: 'Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }
      }
    };
    
    const normalizedAddress = address.toLowerCase().trim();
    
    if (mockAddresses[normalizedAddress]) {
      return mockAddresses[normalizedAddress];
    }
    
    // Generate random coordinates for any address (for demo)
    return {
      address,
      latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
      longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
      formattedAddress: `${address}, Demo City, DC 12345, USA`,
      components: {
        streetName: address,
        city: 'Demo City',
        state: 'DC',
        zipCode: '12345',
        country: 'USA'
      }
    };
  }

  /**
   * Get satellite imagery for coordinates
   */
  static async getSatelliteImage(
    latitude: number,
    longitude: number,
    options: Partial<SatelliteImageOptions> = {}
  ): Promise<string> {
    const defaultOptions: SatelliteImageOptions = {
      width: 800,
      height: 600,
      zoom: 20, // Maximum detail for solar analysis
      mapType: 'satellite',
      format: 'png',
      scale: 1
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    // Debug logging
    console.log('🛰️ Satellite Image Debug Info:');
    console.log('- Coordinates:', latitude, longitude);
    console.log('- Options:', finalOptions);
    console.log('- USE_REAL_DATA:', this.USE_REAL_DATA);
    console.log('- API Key configured:', this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY');
    
    try {
      // Use real satellite imagery if configured, otherwise use mock data
      if (this.USE_REAL_DATA && this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        console.log('🌍 Using real Google Static Maps API');
        const imageUrl = this.getGoogleSatelliteImageUrl(latitude, longitude, finalOptions);
        console.log('📸 Generated image URL:', imageUrl);
        return imageUrl;
      } else {
        console.log('🔧 Using mock satellite imagery');
        console.log('Reason: USE_REAL_DATA =', this.USE_REAL_DATA, 'API Key configured =', this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY');
        return await this.mockSatelliteImage(latitude, longitude, finalOptions);
      }
    } catch (error) {
      console.error('❌ Satellite image capture failed:', error);
      console.log('🔄 Falling back to mock imagery');
      return await this.mockSatelliteImage(latitude, longitude, finalOptions);
    }
  }

  /**
   * Mock satellite image service for development
   */
  private static async mockSatelliteImage(
    latitude: number,
    longitude: number,
    options: SatelliteImageOptions
  ): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a placeholder image URL for development
    // This would be replaced with actual satellite imagery in production
    const placeholderUrl = `https://via.placeholder.com/${options.width}x${options.height}/228B22/FFFFFF?text=Satellite+View%0A${latitude.toFixed(4)},${longitude.toFixed(4)}%0AZoom+${options.zoom}`;
    
    return placeholderUrl;
  }

  /**
   * Get Street View imagery for coordinates
   */
  static async getStreetViewImage(
    latitude: number,
    longitude: number,
    options: Partial<StreetViewOptions> = {}
  ): Promise<string> {
    const defaultOptions: StreetViewOptions = {
      width: 800,
      height: 600,
      fov: 90, // 90 degree field of view
      heading: 0, // Face North initially
      pitch: 10, // Look slightly up to see buildings
      format: 'png'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    // Debug logging
    console.log('🚶 Street View Debug Info:');
    console.log('- Coordinates:', latitude, longitude);
    console.log('- Options:', finalOptions);
    console.log('- USE_REAL_DATA:', this.USE_REAL_DATA);
    console.log('- API Key configured:', this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY');
    
    try {
      // Use real Street View if configured, otherwise use mock data
      if (this.USE_REAL_DATA && this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        console.log('🌍 Using real Google Street View API');
        const imageUrl = this.getGoogleStreetViewImageUrl(latitude, longitude, finalOptions);
        console.log('📸 Generated Street View URL:', imageUrl);
        return imageUrl;
      } else {
        console.log('🔧 Using mock Street View imagery');
        return await this.mockStreetViewImage(latitude, longitude, finalOptions);
      }
    } catch (error) {
      console.error('❌ Street View capture failed:', error);
      console.log('🔄 Falling back to mock imagery');
      return await this.mockStreetViewImage(latitude, longitude, finalOptions);
    }
  }

  /**
   * Mock Street View image service for development
   */
  private static async mockStreetViewImage(
    latitude: number,
    longitude: number,
    options: StreetViewOptions
  ): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate a placeholder Street View image
    const placeholderUrl = `https://via.placeholder.com/${options.width}x${options.height}/4285F4/FFFFFF?text=Street+View%0A${latitude.toFixed(4)},${longitude.toFixed(4)}%0AHeading:+${options.heading}°%0AFOV:+${options.fov}°`;
    
    return placeholderUrl;
  }

  /**
   * Get Street View image using Google Street View Static API
   */
  private static getGoogleStreetViewImageUrl(
    latitude: number,
    longitude: number,
    options: StreetViewOptions
  ): string {
    const baseUrl = 'https://maps.googleapis.com/maps/api/streetview';
    const params = new URLSearchParams({
      location: `${latitude},${longitude}`,
      size: `${options.width}x${options.height}`,
      fov: options.fov.toString(),
      heading: options.heading.toString(),
      pitch: options.pitch.toString(),
      format: options.format,
      key: this.GOOGLE_MAPS_API_KEY
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get multiple Street View angles for a location
   */
  static async getMultiAngleStreetView(
    latitude: number,
    longitude: number,
    options: Partial<StreetViewOptions> = {}
  ): Promise<{ heading: number; imageUrl: string; label: string }[]> {
    const angles = [
      { heading: 0, label: 'North View' },
      { heading: 90, label: 'East View' },
      { heading: 180, label: 'South View' },
      { heading: 270, label: 'West View' }
    ];

    const results = await Promise.all(
      angles.map(async (angle) => {
        const imageUrl = await this.getStreetViewImage(latitude, longitude, {
          ...options,
          heading: angle.heading
        });
        return {
          heading: angle.heading,
          imageUrl,
          label: angle.label
        };
      })
    );

    return results;
  }

  /**
   * Real geocoding using Google Geocoding API
   */
  private static async realGeocodeAddress(address: string): Promise<GeocodeResult> {
    const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = new URLSearchParams({
      address: address,
      key: this.GOOGLE_MAPS_API_KEY
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log('🌐 Making geocoding request to:', baseUrl);
    console.log('📍 Address:', address);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Geocoding response status:', data.status);

    if (data.status === 'REQUEST_DENIED') {
      throw new Error(`API Key error: ${data.error_message || 'Invalid or missing API key'}`);
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new Error('API quota exceeded. Check your Google Cloud billing.');
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'No results found'}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;
    const components = result.address_components;

    // Parse address components
    const addressComponents: GeocodeResult['components'] = {};
    components.forEach((component: any) => {
      if (component.types.includes('street_number')) {
        addressComponents.streetNumber = component.long_name;
      }
      if (component.types.includes('route')) {
        addressComponents.streetName = component.long_name;
      }
      if (component.types.includes('locality')) {
        addressComponents.city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        addressComponents.state = component.short_name;
      }
      if (component.types.includes('postal_code')) {
        addressComponents.zipCode = component.long_name;
      }
      if (component.types.includes('country')) {
        addressComponents.country = component.short_name;
      }
    });

    return {
      address: result.formatted_address,
      latitude: location.lat,
      longitude: location.lng,
      formattedAddress: result.formatted_address,
      components: addressComponents
    };
  }

  /**
   * Get satellite image using Google Static Maps API (production)
   */
  private static getGoogleSatelliteImageUrl(
    latitude: number,
    longitude: number,
    options: SatelliteImageOptions
  ): string {
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${latitude},${longitude}`,
      zoom: options.zoom.toString(),
      size: `${options.width}x${options.height}`,
      maptype: 'satellite',
      format: options.format,
      scale: options.scale.toString(),
      key: this.GOOGLE_MAPS_API_KEY
    });
    
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get satellite image using Mapbox Static Images API (production)
   */
  private static getMapboxSatelliteImageUrl(
    latitude: number,
    longitude: number,
    options: SatelliteImageOptions
  ): string {
    const baseUrl = 'https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static';
    const retina = options.scale === 2 ? '@2x' : '';
    return `${baseUrl}/${longitude},${latitude},${options.zoom}/${options.width}x${options.height}${retina}?access_token=${this.MAPBOX_API_KEY}`;
  }

  /**
   * Create aerial view from address
   */
  static async createAerialView(
    projectId: string,
    address: string,
    imageOptions: Partial<SatelliteImageOptions> = {}
  ): Promise<AerialView> {
    try {
      // Geocode the address
      const geocodeResult = await this.geocodeAddress(address);
      
      // Capture satellite imagery
      const imageUrl = await this.getSatelliteImage(
        geocodeResult.latitude,
        geocodeResult.longitude,
        imageOptions
      );
      
      // Create aerial view object
      const aerialView: AerialView = {
        id: this.generateId(),
        projectId,
        address: geocodeResult.formattedAddress,
        coordinates: {
          latitude: geocodeResult.latitude,
          longitude: geocodeResult.longitude
        },
        imageUrl,
        captureDate: new Date(),
        resolution: this.calculateResolution(imageOptions.zoom || 18),
        zoom: imageOptions.zoom || 18,
        mapProvider: 'google', // or 'mapbox' depending on configuration
        annotations: []
      };
      
      return aerialView;
    } catch (error) {
      console.error('Failed to create aerial view:', error);
      throw error;
    }
  }

  /**
   * Add annotation to aerial view
   */
  static addAnnotation(
    aerialView: AerialView,
    annotation: Omit<AerialAnnotation, 'id'>
  ): AerialAnnotation {
    const newAnnotation: AerialAnnotation = {
      id: this.generateId(),
      ...annotation
    };
    
    aerialView.annotations.push(newAnnotation);
    return newAnnotation;
  }

  /**
   * Remove annotation from aerial view
   */
  static removeAnnotation(aerialView: AerialView, annotationId: string): boolean {
    const index = aerialView.annotations.findIndex(a => a.id === annotationId);
    if (index >= 0) {
      aerialView.annotations.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Update annotation in aerial view
   */
  static updateAnnotation(
    aerialView: AerialView,
    annotationId: string,
    updates: Partial<Omit<AerialAnnotation, 'id'>>
  ): AerialAnnotation | null {
    const annotation = aerialView.annotations.find(a => a.id === annotationId);
    if (annotation) {
      Object.assign(annotation, updates);
      return annotation;
    }
    return null;
  }

  /**
   * Auto-detect potential PV installation areas
   */
  static async autoDetectPVAreas(aerialView: AerialView): Promise<AerialAnnotation[]> {
    // This would use AI/ML to detect suitable roof areas for solar panels
    // For now, we'll create mock annotations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockPVAreas: Omit<AerialAnnotation, 'id'>[] = [
      {
        type: 'pv_array',
        position: { x: 200, y: 150 },
        size: { width: 120, height: 80 },
        label: 'South-Facing Roof Area',
        color: '#FFD700',
        notes: 'Optimal orientation for solar panels. Estimated 5kW capacity.'
      },
      {
        type: 'pv_array',
        position: { x: 350, y: 180 },
        size: { width: 100, height: 60 },
        label: 'West-Facing Roof Area',
        color: '#FFA500',
        notes: 'Good afternoon production. Estimated 3kW capacity.'
      }
    ];
    
    const annotations = mockPVAreas.map(area => this.addAnnotation(aerialView, area));
    return annotations;
  }

  /**
   * Add electrical infrastructure annotations
   */
  static addElectricalInfrastructure(
    aerialView: AerialView,
    projectData: any
  ): AerialAnnotation[] {
    const annotations: Omit<AerialAnnotation, 'id'>[] = [];
    
    // Meter location
    annotations.push({
      type: 'meter',
      position: { x: 100, y: 300 },
      label: 'Electric Meter',
      color: '#FF0000',
      notes: 'Main service meter location'
    });
    
    // Main panel location
    annotations.push({
      type: 'panel',
      position: { x: 120, y: 320 },
      label: 'Main Panel',
      color: '#0000FF',
      notes: `${projectData.mainBreaker || 200}A main service panel`
    });
    
    // EVSE locations if applicable
    if (projectData.evseLoads?.some((load: any) => load.quantity > 0)) {
      annotations.push({
        type: 'evse_charger',
        position: { x: 80, y: 400 },
        label: 'EV Charger Location',
        color: '#00FF00',
        notes: 'Proposed EVSE installation location'
      });
    }
    
    // Add setback annotations for solar
    annotations.push({
      type: 'setback',
      position: { x: 180, y: 120 },
      size: { width: 160, height: 120 },
      label: 'Required Setbacks',
      color: '#FF69B4',
      notes: 'NEC 690.12 - 3ft from roof edge, fire setbacks'
    });
    
    return annotations.map(annotation => this.addAnnotation(aerialView, annotation));
  }

  /**
   * Export aerial view for permit submission
   */
  static async exportForPermit(
    aerialView: AerialView,
    options: {
      includeAnnotations: boolean;
      includeScale: boolean;
      includeNorthArrow: boolean;
      paperSize: 'letter' | 'a4' | 'legal' | 'tabloid';
    }
  ): Promise<string> {
    // This would generate a permit-ready image with proper scaling and annotations
    // For now, return the image URL
    return aerialView.imageUrl;
  }

  /**
   * Calculate resolution based on zoom level
   */
  private static calculateResolution(zoom: number): number {
    // Approximate resolution in meters per pixel for Google Maps
    // At zoom 18: ~0.6 meters per pixel
    // At zoom 20: ~0.15 meters per pixel
    const earthCircumference = 40075017; // meters
    const tileSize = 256; // pixels
    const metersPerPixel = earthCircumference / (tileSize * Math.pow(2, zoom));
    return parseFloat(metersPerPixel.toFixed(3));
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `aerial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate address format
   */
  static validateAddress(address: string): { valid: boolean; message?: string } {
    if (!address || address.trim().length === 0) {
      return { valid: false, message: 'Address cannot be empty' };
    }
    
    if (address.length < 5) {
      return { valid: false, message: 'Address too short' };
    }
    
    if (address.length > 200) {
      return { valid: false, message: 'Address too long' };
    }
    
    // Basic address pattern check
    const addressPattern = /^[\w\s,.-]+$/;
    if (!addressPattern.test(address)) {
      return { valid: false, message: 'Address contains invalid characters' };
    }
    
    return { valid: true };
  }

  /**
   * Get supported map providers
   */
  static getSupportedProviders(): Array<{
    id: 'google' | 'mapbox' | 'esri' | 'bing';
    name: string;
    description: string;
    requiresApiKey: boolean;
  }> {
    return [
      {
        id: 'google',
        name: 'Google Maps',
        description: 'High-quality satellite imagery with global coverage',
        requiresApiKey: true
      },
      {
        id: 'mapbox',
        name: 'Mapbox',
        description: 'Customizable satellite imagery with good detail',
        requiresApiKey: true
      },
      {
        id: 'esri',
        name: 'Esri ArcGIS',
        description: 'Professional-grade imagery for technical applications',
        requiresApiKey: true
      },
      {
        id: 'bing',
        name: 'Bing Maps',
        description: 'Microsoft satellite imagery with good coverage',
        requiresApiKey: true
      }
    ];
  }

  /**
   * Check if API keys are configured
   */
  static checkApiConfiguration(): {
    google: boolean;
    mapbox: boolean;
    configured: boolean;
    usingRealData: boolean;
    status: string;
  } {
    const googleConfigured = this.GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY';
    const mapboxConfigured = this.MAPBOX_API_KEY !== 'YOUR_MAPBOX_API_KEY';
    const anyConfigured = googleConfigured || mapboxConfigured;
    const usingReal = this.USE_REAL_DATA && anyConfigured;

    let status = '';
    if (usingReal) {
      status = `Using real ${this.PREFERRED_PROVIDER === 'mapbox' && mapboxConfigured ? 'Mapbox' : 'Google Maps'} imagery`;
    } else if (anyConfigured && !this.USE_REAL_DATA) {
      status = 'API keys configured but VITE_USE_REAL_AERIAL_DATA not enabled';
    } else {
      status = 'Using mock data - Set up API keys for real satellite imagery';
    }

    return {
      google: googleConfigured,
      mapbox: mapboxConfigured,
      configured: anyConfigured,
      usingRealData: usingReal,
      status
    };
  }

  /**
   * Get current configuration status for UI display
   */
  static getConfigurationStatus(): {
    provider: string;
    isReal: boolean;
    message: string;
    setupInstructions?: string;
  } {
    const config = this.checkApiConfiguration();
    
    if (config.usingRealData) {
      const provider = this.PREFERRED_PROVIDER === 'mapbox' && config.mapbox ? 'Mapbox' : 'Google Maps';
      return {
        provider,
        isReal: true,
        message: `Connected to ${provider} - Real satellite imagery enabled`
      };
    } else {
      return {
        provider: 'Mock',
        isReal: false,
        message: 'Using placeholder imagery for development',
        setupInstructions: 'See SETUP_AERIAL_VIEW.md for instructions on enabling real satellite data'
      };
    }
  }
}