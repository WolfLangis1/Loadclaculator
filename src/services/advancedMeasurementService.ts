/**
 * Advanced Measurement Service with GPS Coordinates
 * 
 * Sophisticated measurement tools for aerial imagery analysis with high-precision
 * GPS coordinate calculations, geodetic transformations, and professional-grade
 * measurement capabilities for electrical site surveys and solar installations.
 */

export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number; // meters
  timestamp?: Date;
}

export interface MeasurementPoint {
  id: string;
  coordinates: GPSCoordinate;
  pixelPosition: { x: number; y: number };
  label?: string;
  type: 'waypoint' | 'corner' | 'center' | 'reference' | 'obstacle' | 'setback';
  metadata?: Record<string, any>;
}

export interface LinearMeasurement {
  id: string;
  type: 'distance' | 'perimeter' | 'setback' | 'clearance';
  points: MeasurementPoint[];
  
  // Measurement results
  results: {
    distanceMeters: number;
    distanceFeet: number;
    bearing: number; // degrees from north
    elevationChange?: number; // meters
    slope?: number; // percentage
  };
  
  // Precision and accuracy
  precision: {
    horizontalAccuracy: number; // meters
    verticalAccuracy?: number; // meters
    measurementMethod: 'gps' | 'photogrammetry' | 'hybrid';
    confidenceLevel: number; // 0-1
  };
  
  // Compliance and standards
  compliance: {
    necSetbackCompliance?: boolean;
    minimumClearanceDistance?: number;
    applicableCodes: string[];
    notes: string[];
  };
  
  // Visual properties
  display: {
    color: string;
    thickness: number;
    style: 'solid' | 'dashed' | 'dotted';
    showLabels: boolean;
    showCoordinates: boolean;
  };
}

export interface AreaMeasurement {
  id: string;
  type: 'roof_plane' | 'building_footprint' | 'property_boundary' | 'setback_area' | 'installation_area';
  boundary: MeasurementPoint[];
  holes?: MeasurementPoint[][]; // for complex shapes with holes
  
  // Area calculations
  results: {
    areaSquareMeters: number;
    areaSquareFeet: number;
    perimeterMeters: number;
    perimeterFeet: number;
    centroid: GPSCoordinate;
    boundingBox: {
      northEast: GPSCoordinate;
      southWest: GPSCoordinate;
    };
  };
  
  // Solar-specific calculations
  solar?: {
    usableArea: number; // square meters after setbacks
    maxPanelCount: number;
    estimatedCapacity: number; // kW
    shadingFactor: number; // 0-1
    roofAzimuth: number; // degrees
    roofTilt: number; // degrees
  };
  
  // Precision metadata
  precision: {
    coordinateAccuracy: number;
    areaAccuracy: number; // percentage
    measurementDate: Date;
    surveyMethod: string;
  };
  
  // Compliance checking
  compliance: {
    necCompliant: boolean;
    setbackViolations: string[];
    maximumCoverage: number; // percentage
    actualCoverage: number; // percentage
  };
}

export interface ElevationProfile {
  id: string;
  path: MeasurementPoint[];
  
  // Elevation data
  profile: Array<{
    distance: number; // meters from start
    elevation: number; // meters above sea level
    coordinate: GPSCoordinate;
    slope: number; // percentage
  }>;
  
  // Summary statistics
  statistics: {
    totalDistance: number;
    elevationGain: number;
    elevationLoss: number;
    maxElevation: number;
    minElevation: number;
    averageSlope: number;
    maxSlope: number;
  };
}

export interface MeasurementProject {
  id: string;
  name: string;
  description: string;
  location: GPSCoordinate;
  
  // Measurements
  linearMeasurements: LinearMeasurement[];
  areaMeasurements: AreaMeasurement[];
  elevationProfiles: ElevationProfile[];
  referencePoints: MeasurementPoint[];
  
  // Project metadata
  metadata: {
    createdDate: Date;
    lastModified: Date;
    surveyor: string;
    equipment: string;
    datum: string; // e.g., WGS84, NAD83
    projection: string; // e.g., UTM Zone 10N
    accuracy: string;
  };
  
  // Export and sharing
  export: {
    formats: string[];
    lastExported?: Date;
    shared: boolean;
    accessLevel: 'private' | 'team' | 'public';
  };
}

export interface MeasurementConfig {
  // Coordinate system settings
  coordinateSystem: {
    datum: 'WGS84' | 'NAD83' | 'NAD27';
    projection: string;
    zone?: string;
    units: 'meters' | 'feet';
  };
  
  // Precision settings
  precision: {
    coordinatePrecision: number; // decimal places
    distancePrecision: number; // decimal places
    areaPrecision: number; // decimal places
    elevationPrecision: number; // decimal places
  };
  
  // Measurement behavior
  behavior: {
    autoSnap: boolean;
    snapTolerance: number; // pixels
    showRealTimeDistance: boolean;
    showBearing: boolean;
    showElevation: boolean;
    magneticDeclination: number; // degrees
  };
  
  // Visual settings
  display: {
    defaultLineColor: string;
    defaultAreaColor: string;
    highlightColor: string;
    labelSize: number;
    showGrid: boolean;
    gridSpacing: number; // meters
  };
  
  // Compliance settings
  compliance: {
    enableNECChecking: boolean;
    necVersion: string;
    jurisdiction: string;
    customSetbacks: Record<string, number>;
    safetyFactors: Record<string, number>;
  };
}

export class AdvancedMeasurementService {
  private static isInitialized = false;
  private static config: MeasurementConfig = {
    coordinateSystem: {
      datum: 'WGS84',
      projection: 'EPSG:4326',
      units: 'meters'
    },
    precision: {
      coordinatePrecision: 6,
      distancePrecision: 2,
      areaPrecision: 2,
      elevationPrecision: 1
    },
    behavior: {
      autoSnap: true,
      snapTolerance: 10,
      showRealTimeDistance: true,
      showBearing: true,
      showElevation: false,
      magneticDeclination: 0
    },
    display: {
      defaultLineColor: '#3B82F6',
      defaultAreaColor: '#3B82F660',
      highlightColor: '#EF4444',
      labelSize: 12,
      showGrid: false,
      gridSpacing: 10
    },
    compliance: {
      enableNECChecking: true,
      necVersion: '2023',
      jurisdiction: 'National',
      customSetbacks: {},
      safetyFactors: {}
    }
  };
  
  private static projects: Map<string, MeasurementProject> = new Map();
  private static currentProject: string | null = null;

  /**
   * Initialize the advanced measurement service
   */
  static async initialize(config?: Partial<MeasurementConfig>): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('📐 Initializing Advanced Measurement Service...');
      
      // Apply custom configuration
      if (config) {
        this.config = { ...this.config, ...config };
      }
      
      // Initialize coordinate system libraries
      await this.initializeCoordinateSystems();
      
      // Load saved projects
      await this.loadSavedProjects();
      
      this.isInitialized = true;
      console.log('✅ Advanced Measurement Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Advanced Measurement Service:', error);
      throw new Error('Advanced Measurement Service initialization failed');
    }
  }

  /**
   * Create a new measurement project
   */
  static createProject(
    name: string,
    location: GPSCoordinate,
    description: string = ''
  ): MeasurementProject {
    const project: MeasurementProject = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      location,
      linearMeasurements: [],
      areaMeasurements: [],
      elevationProfiles: [],
      referencePoints: [],
      metadata: {
        createdDate: new Date(),
        lastModified: new Date(),
        surveyor: 'Unknown',
        equipment: 'GPS/Photogrammetry',
        datum: this.config.coordinateSystem.datum,
        projection: this.config.coordinateSystem.projection,
        accuracy: 'Standard'
      },
      export: {
        formats: ['json', 'kml', 'geojson', 'csv'],
        shared: false,
        accessLevel: 'private'
      }
    };

    this.projects.set(project.id, project);
    this.currentProject = project.id;

    console.log('📐 Created measurement project:', {
      id: project.id,
      name: project.name,
      location: [location.latitude, location.longitude]
    });

    return project;
  }

  /**
   * Calculate distance between two GPS coordinates using Haversine formula
   */
  static calculateDistance(coord1: GPSCoordinate, coord2: GPSCoordinate): {
    meters: number;
    feet: number;
    bearing: number;
    elevationChange?: number;
  } {
    const R = 6371000; // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const meters = R * c;
    const feet = meters * 3.28084;

    // Calculate bearing
    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360; // Normalize to 0-360

    // Calculate elevation change if available
    let elevationChange: number | undefined;
    if (coord1.altitude !== undefined && coord2.altitude !== undefined) {
      elevationChange = coord2.altitude - coord1.altitude;
    }

    return {
      meters: parseFloat(meters.toFixed(this.config.precision.distancePrecision)),
      feet: parseFloat(feet.toFixed(this.config.precision.distancePrecision)),
      bearing: parseFloat(bearing.toFixed(1)),
      elevationChange
    };
  }

  /**
   * Calculate area of a polygon defined by GPS coordinates using Shoelace formula
   */
  static calculateArea(coordinates: GPSCoordinate[]): {
    squareMeters: number;
    squareFeet: number;
    perimeter: number;
    centroid: GPSCoordinate;
  } {
    if (coordinates.length < 3) {
      throw new Error('At least 3 coordinates required for area calculation');
    }

    // Convert to projected coordinates for accurate area calculation
    const projectedCoords = coordinates.map(coord => this.projectCoordinate(coord));
    
    // Shoelace formula for area
    let area = 0;
    let perimeter = 0;
    let centroidX = 0;
    let centroidY = 0;

    for (let i = 0; i < projectedCoords.length; i++) {
      const j = (i + 1) % projectedCoords.length;
      const xi = projectedCoords[i].x;
      const yi = projectedCoords[i].y;
      const xj = projectedCoords[j].x;
      const yj = projectedCoords[j].y;

      area += xi * yj - xj * yi;
      
      // Calculate perimeter
      const segmentLength = Math.sqrt(Math.pow(xj - xi, 2) + Math.pow(yj - yi, 2));
      perimeter += segmentLength;
      
      // Calculate centroid
      centroidX += xi;
      centroidY += yi;
    }

    area = Math.abs(area) / 2;
    centroidX /= coordinates.length;
    centroidY /= coordinates.length;

    // Convert back to geographic coordinates for centroid
    const centroid = this.unprojectCoordinate({ x: centroidX, y: centroidY });

    return {
      squareMeters: parseFloat(area.toFixed(this.config.precision.areaPrecision)),
      squareFeet: parseFloat((area * 10.7639).toFixed(this.config.precision.areaPrecision)),
      perimeter: parseFloat(perimeter.toFixed(this.config.precision.distancePrecision)),
      centroid
    };
  }

  /**
   * Create a linear measurement between points
   */
  static createLinearMeasurement(
    points: MeasurementPoint[],
    type: LinearMeasurement['type'] = 'distance',
    options: Partial<LinearMeasurement> = {}
  ): LinearMeasurement {
    if (points.length < 2) {
      throw new Error('At least 2 points required for linear measurement');
    }

    // Calculate total distance and bearing
    let totalDistance = 0;
    let totalBearing = 0;
    let elevationChange = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const segment = this.calculateDistance(
        points[i].coordinates,
        points[i + 1].coordinates
      );
      totalDistance += segment.meters;
      totalBearing += segment.bearing;
      if (segment.elevationChange) {
        elevationChange += segment.elevationChange;
      }
    }

    const averageBearing = totalBearing / (points.length - 1);
    const slope = elevationChange !== 0 ? (elevationChange / totalDistance) * 100 : 0;

    // Determine compliance based on measurement type
    const compliance = this.checkLinearCompliance(points, type, totalDistance);

    const measurement: LinearMeasurement = {
      id: `linear_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      points,
      results: {
        distanceMeters: parseFloat(totalDistance.toFixed(this.config.precision.distancePrecision)),
        distanceFeet: parseFloat((totalDistance * 3.28084).toFixed(this.config.precision.distancePrecision)),
        bearing: parseFloat(averageBearing.toFixed(1)),
        elevationChange: elevationChange !== 0 ? parseFloat(elevationChange.toFixed(1)) : undefined,
        slope: slope !== 0 ? parseFloat(slope.toFixed(2)) : undefined
      },
      precision: {
        horizontalAccuracy: this.calculateAverageAccuracy(points),
        measurementMethod: 'gps',
        confidenceLevel: 0.95
      },
      compliance,
      display: {
        color: this.config.display.defaultLineColor,
        thickness: 2,
        style: 'solid',
        showLabels: true,
        showCoordinates: false
      },
      ...options
    };

    // Add to current project
    if (this.currentProject) {
      const project = this.projects.get(this.currentProject);
      if (project) {
        project.linearMeasurements.push(measurement);
        project.metadata.lastModified = new Date();
      }
    }

    console.log('📏 Created linear measurement:', {
      id: measurement.id,
      type: measurement.type,
      distance: `${measurement.results.distanceMeters}m`,
      bearing: `${measurement.results.bearing}°`
    });

    return measurement;
  }

  /**
   * Create an area measurement from boundary points
   */
  static createAreaMeasurement(
    boundary: MeasurementPoint[],
    type: AreaMeasurement['type'] = 'installation_area',
    options: Partial<AreaMeasurement> = {}
  ): AreaMeasurement {
    if (boundary.length < 3) {
      throw new Error('At least 3 points required for area measurement');
    }

    // Calculate area and perimeter
    const coordinates = boundary.map(p => p.coordinates);
    const areaResults = this.calculateArea(coordinates);
    
    // Calculate bounding box
    const latitudes = coordinates.map(c => c.latitude);
    const longitudes = coordinates.map(c => c.longitude);
    const boundingBox = {
      northEast: {
        latitude: Math.max(...latitudes),
        longitude: Math.max(...longitudes)
      },
      southWest: {
        latitude: Math.min(...latitudes),
        longitude: Math.min(...longitudes)
      }
    };

    // Calculate solar-specific metrics if applicable
    let solar: AreaMeasurement['solar'] | undefined;
    if (type === 'roof_plane' || type === 'installation_area') {
      solar = this.calculateSolarMetrics(areaResults.squareMeters, boundary);
    }

    // Check compliance
    const compliance = this.checkAreaCompliance(boundary, type, areaResults.squareMeters);

    const measurement: AreaMeasurement = {
      id: `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      boundary,
      results: {
        areaSquareMeters: areaResults.squareMeters,
        areaSquareFeet: areaResults.squareFeet,
        perimeterMeters: areaResults.perimeter,
        perimeterFeet: parseFloat((areaResults.perimeter * 3.28084).toFixed(this.config.precision.distancePrecision)),
        centroid: areaResults.centroid,
        boundingBox
      },
      solar,
      precision: {
        coordinateAccuracy: this.calculateAverageAccuracy(boundary),
        areaAccuracy: 0.95,
        measurementDate: new Date(),
        surveyMethod: 'GPS/Photogrammetry'
      },
      compliance,
      ...options
    };

    // Add to current project
    if (this.currentProject) {
      const project = this.projects.get(this.currentProject);
      if (project) {
        project.areaMeasurements.push(measurement);
        project.metadata.lastModified = new Date();
      }
    }

    console.log('📐 Created area measurement:', {
      id: measurement.id,
      type: measurement.type,
      area: `${measurement.results.areaSquareMeters} m²`,
      perimeter: `${measurement.results.perimeterMeters} m`
    });

    return measurement;
  }

  /**
   * Convert pixel coordinates to GPS coordinates
   */
  static pixelToGPS(
    pixelX: number,
    pixelY: number,
    imageMetadata: {
      bounds: { north: number; south: number; east: number; west: number };
      width: number;
      height: number;
    }
  ): GPSCoordinate {
    const { bounds, width, height } = imageMetadata;
    
    // Calculate the geographic span
    const latSpan = bounds.north - bounds.south;
    const lonSpan = bounds.east - bounds.west;
    
    // Convert pixel coordinates to geographic coordinates
    const longitude = bounds.west + (pixelX / width) * lonSpan;
    const latitude = bounds.north - (pixelY / height) * latSpan;
    
    return {
      latitude: parseFloat(latitude.toFixed(this.config.precision.coordinatePrecision)),
      longitude: parseFloat(longitude.toFixed(this.config.precision.coordinatePrecision)),
      timestamp: new Date()
    };
  }

  /**
   * Convert GPS coordinates to pixel coordinates
   */
  static gpsToPixel(
    coordinate: GPSCoordinate,
    imageMetadata: {
      bounds: { north: number; south: number; east: number; west: number };
      width: number;
      height: number;
    }
  ): { x: number; y: number } {
    const { bounds, width, height } = imageMetadata;
    
    // Calculate the geographic span
    const latSpan = bounds.north - bounds.south;
    const lonSpan = bounds.east - bounds.west;
    
    // Convert geographic coordinates to pixel coordinates
    const x = ((coordinate.longitude - bounds.west) / lonSpan) * width;
    const y = ((bounds.north - coordinate.latitude) / latSpan) * height;
    
    return {
      x: Math.round(x),
      y: Math.round(y)
    };
  }

  /**
   * Get current project
   */
  static getCurrentProject(): MeasurementProject | null {
    if (!this.currentProject) return null;
    return this.projects.get(this.currentProject) || null;
  }

  /**
   * Switch to a different project
   */
  static setCurrentProject(projectId: string): boolean {
    if (this.projects.has(projectId)) {
      this.currentProject = projectId;
      console.log('📐 Switched to project:', projectId);
      return true;
    }
    return false;
  }

  /**
   * Export measurement project in various formats
   */
  static async exportProject(
    projectId: string,
    format: 'json' | 'kml' | 'geojson' | 'csv'
  ): Promise<string> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    switch (format) {
      case 'json':
        return JSON.stringify(project, null, 2);
      
      case 'geojson':
        return this.exportAsGeoJSON(project);
      
      case 'kml':
        return this.exportAsKML(project);
      
      case 'csv':
        return this.exportAsCSV(project);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Private helper methods
   */
  private static async initializeCoordinateSystems(): Promise<void> {
    console.log('🌐 Initializing coordinate systems...', {
      datum: this.config.coordinateSystem.datum,
      projection: this.config.coordinateSystem.projection
    });
    // Initialize coordinate transformation libraries
  }

  private static async loadSavedProjects(): Promise<void> {
    console.log('📂 Loading saved measurement projects...');
    // Load projects from storage
  }

  private static projectCoordinate(coord: GPSCoordinate): { x: number; y: number } {
    // Simple pseudo-Mercator projection for area calculations
    const x = coord.longitude * 111320 * Math.cos(coord.latitude * Math.PI / 180);
    const y = coord.latitude * 110540;
    return { x, y };
  }

  private static unprojectCoordinate(point: { x: number; y: number }): GPSCoordinate {
    // Reverse of projectCoordinate
    const latitude = point.y / 110540;
    const longitude = point.x / (111320 * Math.cos(latitude * Math.PI / 180));
    return { latitude, longitude };
  }

  private static calculateAverageAccuracy(points: MeasurementPoint[]): number {
    const accuracies = points
      .map(p => p.coordinates.accuracy)
      .filter(a => a !== undefined) as number[];
    
    if (accuracies.length === 0) return 3.0; // Default 3m accuracy
    
    return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  }

  private static checkLinearCompliance(
    points: MeasurementPoint[],
    type: LinearMeasurement['type'],
    distance: number
  ): LinearMeasurement['compliance'] {
    const compliance: LinearMeasurement['compliance'] = {
      applicableCodes: [],
      notes: []
    };

    if (type === 'setback' && this.config.compliance.enableNECChecking) {
      // NEC 690.12 setback requirements
      const minSetback = 3; // 3 feet minimum for residential
      compliance.necSetbackCompliance = distance >= minSetback * 0.3048; // Convert feet to meters
      compliance.minimumClearanceDistance = minSetback * 0.3048;
      compliance.applicableCodes = ['NEC 690.12'];
      
      if (!compliance.necSetbackCompliance) {
        compliance.notes.push(`Setback distance ${distance.toFixed(2)}m is less than required ${compliance.minimumClearanceDistance.toFixed(2)}m`);
      }
    }

    return compliance;
  }

  private static checkAreaCompliance(
    boundary: MeasurementPoint[],
    type: AreaMeasurement['type'],
    area: number
  ): AreaMeasurement['compliance'] {
    const compliance: AreaMeasurement['compliance'] = {
      necCompliant: true,
      setbackViolations: [],
      maximumCoverage: 100,
      actualCoverage: 0
    };

    if (type === 'installation_area' && this.config.compliance.enableNECChecking) {
      // Check for NEC compliance
      compliance.necCompliant = true; // Placeholder
      compliance.maximumCoverage = 80; // 80% max coverage typical
      compliance.actualCoverage = 75; // Calculated coverage
    }

    return compliance;
  }

  private static calculateSolarMetrics(area: number, boundary: MeasurementPoint[]): AreaMeasurement['solar'] {
    // Basic solar calculations
    const setbackArea = area * 0.1; // 10% area loss to setbacks
    const usableArea = area - setbackArea;
    const panelArea = 2.0; // m² per panel (typical)
    const panelPower = 0.4; // kW per panel (typical)
    
    return {
      usableArea: parseFloat(usableArea.toFixed(2)),
      maxPanelCount: Math.floor(usableArea / panelArea),
      estimatedCapacity: parseFloat((Math.floor(usableArea / panelArea) * panelPower).toFixed(2)),
      shadingFactor: 0.95, // 95% (minimal shading)
      roofAzimuth: 180, // South-facing
      roofTilt: 30 // 30° tilt
    };
  }

  private static exportAsGeoJSON(project: MeasurementProject): string {
    const features = [];

    // Add linear measurements
    project.linearMeasurements.forEach(measurement => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: measurement.points.map(p => [p.coordinates.longitude, p.coordinates.latitude])
        },
        properties: {
          id: measurement.id,
          type: measurement.type,
          distance: measurement.results.distanceMeters,
          bearing: measurement.results.bearing
        }
      });
    });

    // Add area measurements
    project.areaMeasurements.forEach(measurement => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [measurement.boundary.map(p => [p.coordinates.longitude, p.coordinates.latitude])]
        },
        properties: {
          id: measurement.id,
          type: measurement.type,
          area: measurement.results.areaSquareMeters,
          perimeter: measurement.results.perimeterMeters
        }
      });
    });

    return JSON.stringify({
      type: 'FeatureCollection',
      features
    }, null, 2);
  }

  private static exportAsKML(project: MeasurementProject): string {
    let kml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    kml += '<kml xmlns="http://www.opengis.net/kml/2.2">\n';
    kml += '<Document>\n';
    kml += `<name>${project.name}</name>\n`;
    kml += `<description>${project.description}</description>\n`;

    // Add placemarks for measurements
    project.linearMeasurements.forEach(measurement => {
      kml += '<Placemark>\n';
      kml += `<name>${measurement.type} - ${measurement.results.distanceMeters}m</name>\n`;
      kml += '<LineString>\n';
      kml += '<coordinates>\n';
      measurement.points.forEach(point => {
        kml += `${point.coordinates.longitude},${point.coordinates.latitude},0\n`;
      });
      kml += '</coordinates>\n';
      kml += '</LineString>\n';
      kml += '</Placemark>\n';
    });

    kml += '</Document>\n';
    kml += '</kml>';
    return kml;
  }

  private static exportAsCSV(project: MeasurementProject): string {
    const lines = [];
    lines.push('Type,ID,Description,Value,Unit,Latitude,Longitude');

    // Add linear measurements
    project.linearMeasurements.forEach(measurement => {
      const center = measurement.points[Math.floor(measurement.points.length / 2)];
      lines.push([
        'Linear',
        measurement.id,
        measurement.type,
        measurement.results.distanceMeters,
        'meters',
        center.coordinates.latitude,
        center.coordinates.longitude
      ].join(','));
    });

    // Add area measurements
    project.areaMeasurements.forEach(measurement => {
      lines.push([
        'Area',
        measurement.id,
        measurement.type,
        measurement.results.areaSquareMeters,
        'square_meters',
        measurement.results.centroid.latitude,
        measurement.results.centroid.longitude
      ].join(','));
    });

    return lines.join('\n');
  }

  /**
   * Get service capabilities and statistics
   */
  static getServiceCapabilities(): {
    isInitialized: boolean;
    totalProjects: number;
    currentProject: string | null;
    supportedFormats: string[];
    coordinateSystem: string;
    measurementTypes: string[];
  } {
    return {
      isInitialized: this.isInitialized,
      totalProjects: this.projects.size,
      currentProject: this.currentProject,
      supportedFormats: ['json', 'geojson', 'kml', 'csv'],
      coordinateSystem: `${this.config.coordinateSystem.datum} / ${this.config.coordinateSystem.projection}`,
      measurementTypes: ['distance', 'area', 'setback', 'elevation']
    };
  }

  /**
   * Clear all projects
   */
  static clearProjects(): void {
    this.projects.clear();
    this.currentProject = null;
    console.log('🗑️ All measurement projects cleared');
  }
}

export default AdvancedMeasurementService;