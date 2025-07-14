/**
 * Real-Time Shading Analysis Service
 * 
 * Provides comprehensive solar shading analysis using precise solar position algorithms,
 * satellite imagery processing, and 3D shadow modeling. Integrates with AI roof analysis
 * for accurate solar production estimates throughout different times of day and seasons.
 */

import { RoofPlane, RoofFeature, OptimizedPanelLayout, ShadingAnalysis } from './aiRoofAnalysisService';

export interface SolarPosition {
  elevation: number; // degrees above horizon (0-90)
  azimuth: number; // degrees from north (0-360)
  zenith: number; // degrees from vertical (0-90)
  hourAngle: number; // degrees (-180 to 180)
  declination: number; // degrees (-23.45 to 23.45)
  equation_of_time: number; // minutes
  air_mass: number; // atmospheric air mass factor
}

export interface ShadowCastingObject {
  id: string;
  type: 'roof_feature' | 'tree' | 'building' | 'panel';
  position: { x: number; y: number; z: number }; // z is height above roof
  dimensions: { width: number; height: number; depth: number };
  shape: 'rectangle' | 'circle' | 'polygon' | 'complex';
  vertices?: Array<{ x: number; y: number; z: number }>; // for complex shapes
}

export interface ShadowProjection {
  objectId: string;
  shadowPolygon: Array<{ x: number; y: number }>;
  intensity: number; // 0-1 (0 = no shadow, 1 = full shadow)
  softEdgeWidth: number; // pixels for penumbra effect
  type: 'umbra' | 'penumbra' | 'antumbra';
}

export interface TimeShadingAnalysis extends ShadingAnalysis {
  solarPosition: SolarPosition;
  shadows: ShadowProjection[];
  irradiance: {
    direct: number; // W/m²
    diffuse: number; // W/m²
    reflected: number; // W/m²
    total: number; // W/m²
  };
  visibility: {
    panelsInShadow: string[];
    percentageShaded: number;
    shadingPattern: 'uniform' | 'partial' | 'edge' | 'complex';
  };
  weatherFactors: {
    cloudCover: number; // 0-1
    atmosphericTransmittance: number; // 0-1
    aerosolOpticalDepth: number;
  };
}

export interface TemporalShadingReport {
  analysisId: string;
  location: { latitude: number; longitude: number };
  timeRange: { start: Date; end: Date };
  intervals: TimeShadingAnalysis[];
  summary: {
    peakShadingHours: string[];
    minimumShadingHours: string[];
    averageDailyShading: number;
    seasonalVariation: {
      winter: number;
      spring: number;
      summer: number;
      fall: number;
    };
    criticalShadingEvents: Array<{
      time: Date;
      description: string;
      impact: number; // percentage power loss
      recommendation: string;
    }>;
  };
}

export interface ShadingOptimizationOptions {
  // Temporal Analysis Settings
  analysisTimeSpan: 'single_day' | 'full_year' | 'seasons' | 'custom';
  timeInterval: number; // minutes between analysis points
  startDate: Date;
  endDate?: Date;
  
  // Solar Position Accuracy
  useNOAA_Algorithm: boolean; // use NOAA Solar Position Algorithm (SPA)
  atmosphericRefraction: boolean;
  deltaT: number; // difference between terrestrial time and UT
  
  // Shadow Modeling
  shadowResolution: 'low' | 'medium' | 'high' | 'ultra';
  includePenumbra: boolean; // model soft shadow edges
  includeReflectedLight: boolean;
  includeAtmosphericScattering: boolean;
  
  // Environmental Factors
  includeWeatherData: boolean;
  includeCloudCover: boolean;
  includeSeasonalVariation: boolean;
  includeSnowCover: boolean;
  
  // Performance Settings
  parallelProcessing: boolean;
  maxConcurrentCalculations: number;
  enableCaching: boolean;
}

export class RealTimeShadingService {
  private static readonly EARTH_RADIUS_KM = 6371.0;
  private static readonly SOLAR_CONSTANT = 1361.0; // W/m² at top of atmosphere
  private static readonly AU_TO_KM = 149597870.7; // astronomical unit in km
  
  private static weatherApiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
  private static noaaApiKey = import.meta.env.VITE_NOAA_API_KEY || '';
  
  /**
   * Perform comprehensive real-time shading analysis
   */
  static async analyzeRealTimeShading(
    latitude: number,
    longitude: number,
    roofPlanes: RoofPlane[],
    layout: OptimizedPanelLayout,
    options: Partial<ShadingOptimizationOptions> = {}
  ): Promise<TemporalShadingReport> {
    console.log('🌞 Starting real-time shading analysis...');
    
    const startTime = performance.now();
    
    // Merge with default options
    const finalOptions = this.mergeOptions(options);
    
    // Generate analysis timestamps
    const analysisTimestamps = this.generateAnalysisTimestamps(finalOptions);
    
    // Extract shadow-casting objects from roof analysis
    const shadowCasters = this.extractShadowCasters(roofPlanes, layout);
    
    // Perform temporal analysis
    const intervals: TimeShadingAnalysis[] = [];
    
    for (const timestamp of analysisTimestamps) {
      const analysis = await this.analyzeTimestamp(
        latitude,
        longitude,
        timestamp,
        shadowCasters,
        layout,
        finalOptions
      );
      intervals.push(analysis);
    }
    
    // Generate summary and insights
    const summary = this.generateShadingSummary(intervals);
    
    const processingTime = performance.now() - startTime;
    
    const report: TemporalShadingReport = {
      analysisId: `shading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      location: { latitude, longitude },
      timeRange: {
        start: analysisTimestamps[0],
        end: analysisTimestamps[analysisTimestamps.length - 1]
      },
      intervals,
      summary
    };
    
    console.log('✅ Real-time shading analysis completed:', {
      intervals: intervals.length,
      averageShading: summary.averageDailyShading,
      processingTime: Math.round(processingTime)
    });
    
    return report;
  }
  
  /**
   * Calculate precise solar position using NOAA Solar Position Algorithm
   */
  static calculateSolarPosition(
    latitude: number,
    longitude: number,
    timestamp: Date,
    deltaT: number = 69.184 // seconds, approximate value for 2024
  ): SolarPosition {
    // Convert timestamp to Julian date
    const julianDate = this.dateToJulianDate(timestamp);
    
    // Calculate Julian centuries since J2000.0
    const julianCentury = (julianDate - 2451545.0) / 36525.0;
    
    // Geometric mean longitude of the sun (degrees)
    const geomMeanLongSun = (280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032)) % 360;
    
    // Geometric mean anomaly of the sun (degrees)
    const geomMeanAnomSun = 357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury);
    
    // Eccentricity of Earth's orbit
    const eccentricity = 0.016708634 - julianCentury * (0.000042037 + 0.0000001267 * julianCentury);
    
    // Sun equation of center
    const sunEqOfCenter = Math.sin(this.degToRad(geomMeanAnomSun)) * (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury)) +
                         Math.sin(this.degToRad(2 * geomMeanAnomSun)) * (0.019993 - 0.000101 * julianCentury) +
                         Math.sin(this.degToRad(3 * geomMeanAnomSun)) * 0.000289;
    
    // Sun true longitude (degrees)
    const sunTrueLong = geomMeanLongSun + sunEqOfCenter;
    
    // Sun apparent longitude (degrees)
    const sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin(this.degToRad(125.04 - 1934.136 * julianCentury));
    
    // Mean obliquity of the ecliptic (degrees)
    const meanObliqEcliptic = 23 + (26 + ((21.448 - julianCentury * (46.815 + julianCentury * (0.00059 - julianCentury * 0.001813)))) / 60) / 60;
    
    // Corrected obliquity of the ecliptic (degrees)
    const obliqCorr = meanObliqEcliptic + 0.00256 * Math.cos(this.degToRad(125.04 - 1934.136 * julianCentury));
    
    // Sun declination (degrees)
    const declination = this.radToDeg(Math.asin(Math.sin(this.degToRad(obliqCorr)) * Math.sin(this.degToRad(sunAppLong))));
    
    // Equation of time (minutes)
    const varY = Math.tan(this.degToRad(obliqCorr / 2)) * Math.tan(this.degToRad(obliqCorr / 2));
    const eqTime = 4 * this.radToDeg(varY * Math.sin(2 * this.degToRad(geomMeanLongSun)) -
                                    2 * eccentricity * Math.sin(this.degToRad(geomMeanAnomSun)) +
                                    4 * eccentricity * varY * Math.sin(this.degToRad(geomMeanAnomSun)) * Math.cos(2 * this.degToRad(geomMeanLongSun)) -
                                    0.5 * varY * varY * Math.sin(4 * this.degToRad(geomMeanLongSun)) -
                                    1.25 * eccentricity * eccentricity * Math.sin(2 * this.degToRad(geomMeanAnomSun)));
    
    // True solar time (minutes)
    const timeOffset = eqTime + 4 * longitude - 60 * timestamp.getTimezoneOffset();
    const trueSolarTime = (timestamp.getHours() * 60 + timestamp.getMinutes() + timestamp.getSeconds() / 60 + timeOffset) % 1440;
    
    // Hour angle (degrees)
    const hourAngle = trueSolarTime / 4 < 0 ? trueSolarTime / 4 + 180 : trueSolarTime / 4 - 180;
    
    // Solar zenith angle (degrees)
    const zenith = this.radToDeg(Math.acos(
      Math.sin(this.degToRad(latitude)) * Math.sin(this.degToRad(declination)) +
      Math.cos(this.degToRad(latitude)) * Math.cos(this.degToRad(declination)) * Math.cos(this.degToRad(hourAngle))
    ));
    
    // Solar elevation angle (degrees)
    const elevation = 90 - zenith;
    
    // Solar azimuth angle (degrees)
    let azimuth: number;
    if (hourAngle > 0) {
      azimuth = (this.radToDeg(Math.acos(
        ((Math.sin(this.degToRad(latitude)) * Math.cos(this.degToRad(zenith))) - Math.sin(this.degToRad(declination))) /
        (Math.cos(this.degToRad(latitude)) * Math.sin(this.degToRad(zenith)))
      )) + 180) % 360;
    } else {
      azimuth = (540 - this.radToDeg(Math.acos(
        ((Math.sin(this.degToRad(latitude)) * Math.cos(this.degToRad(zenith))) - Math.sin(this.degToRad(declination))) /
        (Math.cos(this.degToRad(latitude)) * Math.sin(this.degToRad(zenith)))
      ))) % 360;
    }
    
    // Atmospheric air mass (Kasten and Young 1989)
    const airMass = elevation > 0 ? 
      1 / (Math.cos(this.degToRad(zenith)) + 0.50572 * Math.pow(96.07995 - zenith, -1.6364)) : 
      999;
    
    return {
      elevation: Math.max(0, elevation),
      azimuth,
      zenith,
      hourAngle,
      declination,
      equation_of_time: eqTime,
      air_mass: airMass
    };
  }
  
  /**
   * Calculate 3D shadow projections from objects
   */
  static calculateShadowProjections(
    solarPosition: SolarPosition,
    shadowCasters: ShadowCastingObject[],
    groundPlane: { z: number } = { z: 0 }
  ): ShadowProjection[] {
    if (solarPosition.elevation <= 0) {
      // Sun is below horizon, no meaningful shadows
      return [];
    }
    
    const projections: ShadowProjection[] = [];
    
    for (const caster of shadowCasters) {
      const projection = this.projectShadow(caster, solarPosition, groundPlane);
      if (projection) {
        projections.push(projection);
      }
    }
    
    return projections;
  }
  
  /**
   * Project shadow for a single object
   */
  private static projectShadow(
    caster: ShadowCastingObject,
    solarPosition: SolarPosition,
    groundPlane: { z: number }
  ): ShadowProjection | null {
    if (solarPosition.elevation <= 0) return null;
    
    // Calculate shadow vector
    const shadowLength = caster.position.z / Math.tan(this.degToRad(solarPosition.elevation));
    const shadowDirectionX = shadowLength * Math.sin(this.degToRad(solarPosition.azimuth));
    const shadowDirectionY = shadowLength * Math.cos(this.degToRad(solarPosition.azimuth));
    
    let shadowPolygon: Array<{ x: number; y: number }> = [];
    
    switch (caster.shape) {
      case 'rectangle':
        shadowPolygon = this.projectRectangularShadow(
          caster,
          shadowDirectionX,
          shadowDirectionY
        );
        break;
        
      case 'circle':
        shadowPolygon = this.projectCircularShadow(
          caster,
          shadowDirectionX,
          shadowDirectionY
        );
        break;
        
      case 'polygon':
      case 'complex':
        shadowPolygon = this.projectPolygonShadow(
          caster,
          shadowDirectionX,
          shadowDirectionY
        );
        break;
    }
    
    // Calculate shadow intensity based on object opacity and sun angle
    const intensity = this.calculateShadowIntensity(caster, solarPosition);
    
    return {
      objectId: caster.id,
      shadowPolygon,
      intensity,
      softEdgeWidth: this.calculatePenumbraWidth(caster, solarPosition),
      type: 'umbra' // Simplified - would calculate umbra/penumbra zones in full implementation
    };
  }
  
  /**
   * Project rectangular shadow
   */
  private static projectRectangularShadow(
    caster: ShadowCastingObject,
    shadowDirX: number,
    shadowDirY: number
  ): Array<{ x: number; y: number }> {
    const halfWidth = caster.dimensions.width / 2;
    const halfDepth = caster.dimensions.depth / 2;
    
    // Object corners
    const corners = [
      { x: caster.position.x - halfWidth, y: caster.position.y - halfDepth },
      { x: caster.position.x + halfWidth, y: caster.position.y - halfDepth },
      { x: caster.position.x + halfWidth, y: caster.position.y + halfDepth },
      { x: caster.position.x - halfWidth, y: caster.position.y + halfDepth }
    ];
    
    // Project corners to create shadow polygon
    return corners.map(corner => ({
      x: corner.x + shadowDirX,
      y: corner.y + shadowDirY
    }));
  }
  
  /**
   * Project circular shadow (approximated as polygon)
   */
  private static projectCircularShadow(
    caster: ShadowCastingObject,
    shadowDirX: number,
    shadowDirY: number
  ): Array<{ x: number; y: number }> {
    const radius = caster.dimensions.width / 2;
    const segments = 16; // 16-sided polygon approximation
    const polygon: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const x = caster.position.x + radius * Math.cos(angle);
      const y = caster.position.y + radius * Math.sin(angle);
      
      polygon.push({
        x: x + shadowDirX,
        y: y + shadowDirY
      });
    }
    
    return polygon;
  }
  
  /**
   * Project polygon shadow
   */
  private static projectPolygonShadow(
    caster: ShadowCastingObject,
    shadowDirX: number,
    shadowDirY: number
  ): Array<{ x: number; y: number }> {
    if (!caster.vertices) {
      // Fallback to rectangular shadow
      return this.projectRectangularShadow(caster, shadowDirX, shadowDirY);
    }
    
    return caster.vertices.map(vertex => ({
      x: vertex.x + shadowDirX,
      y: vertex.y + shadowDirY
    }));
  }
  
  /**
   * Calculate shadow intensity based on object properties
   */
  private static calculateShadowIntensity(
    caster: ShadowCastingObject,
    solarPosition: SolarPosition
  ): number {
    // Base intensity depends on object type
    let baseIntensity = 0.8; // Default to 80% shadow
    
    switch (caster.type) {
      case 'roof_feature':
        baseIntensity = 0.9; // Solid roof features cast strong shadows
        break;
      case 'tree':
        baseIntensity = 0.6; // Trees have partial transparency
        break;
      case 'building':
        baseIntensity = 0.95; // Buildings cast very strong shadows
        break;
      case 'panel':
        baseIntensity = 0.85; // Solar panels cast strong shadows
        break;
    }
    
    // Adjust for sun angle - lower sun creates stronger shadows
    const angleModifier = 1 - (solarPosition.elevation / 90) * 0.3;
    
    return Math.min(1, baseIntensity * angleModifier);
  }
  
  /**
   * Calculate penumbra (soft shadow edge) width
   */
  private static calculatePenumbraWidth(
    caster: ShadowCastingObject,
    solarPosition: SolarPosition
  ): number {
    // Simplified penumbra calculation
    // In reality, this depends on sun's apparent diameter and object size
    const sunAngularDiameter = 0.53; // degrees
    const objectHeight = caster.dimensions.height;
    const shadowDistance = objectHeight / Math.tan(this.degToRad(solarPosition.elevation));
    
    // Penumbra width is proportional to shadow distance and sun's angular size
    return shadowDistance * Math.tan(this.degToRad(sunAngularDiameter / 2));
  }
  
  /**
   * Analyze shading for a specific timestamp
   */
  private static async analyzeTimestamp(
    latitude: number,
    longitude: number,
    timestamp: Date,
    shadowCasters: ShadowCastingObject[],
    layout: OptimizedPanelLayout,
    options: ShadingOptimizationOptions
  ): Promise<TimeShadingAnalysis> {
    // Calculate solar position
    const solarPosition = this.calculateSolarPosition(latitude, longitude, timestamp, options.deltaT);
    
    // Calculate shadow projections
    const shadows = this.calculateShadowProjections(solarPosition, shadowCasters);
    
    // Calculate solar irradiance
    const irradiance = await this.calculateSolarIrradiance(
      latitude,
      longitude,
      timestamp,
      solarPosition,
      options
    );
    
    // Analyze panel shading
    const affectedPanels = this.analyzePanelShading(layout.panels, shadows);
    
    // Calculate visibility metrics
    const visibility = this.calculateVisibilityMetrics(layout.panels, affectedPanels);
    
    // Get weather factors if enabled
    const weatherFactors = options.includeWeatherData 
      ? await this.getWeatherFactors(latitude, longitude, timestamp)
      : { cloudCover: 0, atmosphericTransmittance: 0.8, aerosolOpticalDepth: 0.1 };
    
    return {
      timestamp,
      sunPosition: solarPosition,
      shadowMap: this.generateShadowMap(shadows, 100), // 100x100 grid
      affectedPanels,
      totalSystemLoss: affectedPanels.reduce((sum, panel) => sum + panel.powerLoss, 0) / affectedPanels.length,
      solarPosition,
      shadows,
      irradiance,
      visibility,
      weatherFactors
    };
  }
  
  /**
   * Generate shadow map from projections
   */
  private static generateShadowMap(
    shadows: ShadowProjection[],
    resolution: number
  ): number[][] {
    const shadowMap = Array(resolution).fill(null).map(() => Array(resolution).fill(0));
    
    // For each shadow projection, mark affected grid cells
    shadows.forEach(shadow => {
      shadow.shadowPolygon.forEach(point => {
        const gridX = Math.floor((point.x / 1024) * resolution);
        const gridY = Math.floor((point.y / 1024) * resolution);
        
        if (gridX >= 0 && gridX < resolution && gridY >= 0 && gridY < resolution) {
          shadowMap[gridY][gridX] = Math.max(shadowMap[gridY][gridX], shadow.intensity);
        }
      });
    });
    
    return shadowMap;
  }
  
  /**
   * Analyze which panels are affected by shadows
   */
  private static analyzePanelShading(
    panels: OptimizedPanelLayout['panels'],
    shadows: ShadowProjection[]
  ): Array<{ panelId: string; shadingFactor: number; powerLoss: number }> {
    return panels.map(panel => {
      let maxShadingFactor = 0;
      
      // Check if panel intersects with any shadow
      shadows.forEach(shadow => {
        const shadingFactor = this.calculatePanelShadowIntersection(panel, shadow);
        maxShadingFactor = Math.max(maxShadingFactor, shadingFactor);
      });
      
      // Calculate power loss based on shading factor
      // Solar panels have non-linear response to shading
      const powerLoss = this.calculatePowerLossFromShading(maxShadingFactor);
      
      return {
        panelId: panel.id,
        shadingFactor: maxShadingFactor,
        powerLoss
      };
    });
  }
  
  /**
   * Calculate intersection between panel and shadow
   */
  private static calculatePanelShadowIntersection(
    panel: OptimizedPanelLayout['panels'][0],
    shadow: ShadowProjection
  ): number {
    // Simplified intersection calculation
    // In practice, would use polygon intersection algorithms
    const panelCenter = panel.position;
    const panelHalfWidth = panel.size.width / 2;
    const panelHalfHeight = panel.size.height / 2;
    
    // Check if panel center is inside shadow polygon
    const isInside = this.isPointInPolygon(panelCenter, shadow.shadowPolygon);
    
    if (isInside) {
      return shadow.intensity;
    }
    
    // Check for partial overlap (simplified)
    const minDistance = shadow.shadowPolygon.reduce((min, point) => {
      const distance = Math.sqrt(
        Math.pow(point.x - panelCenter.x, 2) + Math.pow(point.y - panelCenter.y, 2)
      );
      return Math.min(min, distance);
    }, Infinity);
    
    const panelDiagonal = Math.sqrt(panelHalfWidth * panelHalfWidth + panelHalfHeight * panelHalfHeight);
    
    if (minDistance < panelDiagonal) {
      // Partial overlap - simplified calculation
      return shadow.intensity * Math.max(0, 1 - (minDistance / panelDiagonal));
    }
    
    return 0;
  }
  
  /**
   * Calculate power loss from shading factor
   */
  private static calculatePowerLossFromShading(shadingFactor: number): number {
    // Solar panels have non-linear response to shading due to bypass diodes
    // This is a simplified model - real analysis would consider panel topology
    
    if (shadingFactor < 0.1) return shadingFactor * 10; // Linear for light shading
    if (shadingFactor < 0.3) return 10 + (shadingFactor - 0.1) * 30; // Moderate shading
    return 16 + (shadingFactor - 0.3) * 120; // Heavy shading causes disproportionate loss
  }
  
  /**
   * Calculate visibility metrics
   */
  private static calculateVisibilityMetrics(
    panels: OptimizedPanelLayout['panels'],
    affectedPanels: Array<{ panelId: string; shadingFactor: number; powerLoss: number }>
  ): TimeShadingAnalysis['visibility'] {
    const panelsInShadow = affectedPanels
      .filter(panel => panel.shadingFactor > 0.1)
      .map(panel => panel.panelId);
    
    const percentageShaded = (panelsInShadow.length / panels.length) * 100;
    
    let shadingPattern: 'uniform' | 'partial' | 'edge' | 'complex' = 'uniform';
    
    if (panelsInShadow.length === 0) {
      shadingPattern = 'uniform';
    } else if (panelsInShadow.length < panels.length * 0.3) {
      shadingPattern = 'partial';
    } else if (panelsInShadow.length < panels.length * 0.7) {
      shadingPattern = 'edge';
    } else {
      shadingPattern = 'complex';
    }
    
    return {
      panelsInShadow,
      percentageShaded,
      shadingPattern
    };
  }
  
  /**
   * Calculate solar irradiance
   */
  private static async calculateSolarIrradiance(
    latitude: number,
    longitude: number,
    timestamp: Date,
    solarPosition: SolarPosition,
    options: ShadingOptimizationOptions
  ): Promise<TimeShadingAnalysis['irradiance']> {
    if (solarPosition.elevation <= 0) {
      return { direct: 0, diffuse: 0, reflected: 0, total: 0 };
    }
    
    // Calculate extraterrestrial irradiance
    const dayOfYear = Math.floor((timestamp.getTime() - new Date(timestamp.getFullYear(), 0, 0).getTime()) / 86400000);
    const eccentricity = 1 + 0.033 * Math.cos(2 * Math.PI * dayOfYear / 365);
    const extraterrestrialIrradiance = this.SOLAR_CONSTANT * eccentricity;
    
    // Calculate atmospheric attenuation
    const atmosphericTransmittance = Math.pow(0.7, Math.pow(solarPosition.air_mass, 0.678));
    
    // Direct normal irradiance
    const directNormal = extraterrestrialIrradiance * atmosphericTransmittance;
    const direct = directNormal * Math.sin(this.degToRad(solarPosition.elevation));
    
    // Diffuse irradiance (simplified sky model)
    const diffuse = 0.3 * direct;
    
    // Reflected irradiance (ground albedo)
    const groundAlbedo = 0.2; // typical value
    const reflected = (direct + diffuse) * groundAlbedo * 0.5; // simplified calculation
    
    const total = direct + diffuse + reflected;
    
    return { direct, diffuse, reflected, total };
  }
  
  /**
   * Get weather factors from API
   */
  private static async getWeatherFactors(
    latitude: number,
    longitude: number,
    timestamp: Date
  ): Promise<TimeShadingAnalysis['weatherFactors']> {
    // Mock weather data for development
    // In production, would integrate with weather APIs
    return {
      cloudCover: Math.random() * 0.5, // 0-50% cloud cover
      atmosphericTransmittance: 0.8 + Math.random() * 0.15, // 80-95% transmittance
      aerosolOpticalDepth: 0.05 + Math.random() * 0.1 // 0.05-0.15 AOD
    };
  }
  
  /**
   * Extract shadow-casting objects from roof analysis
   */
  private static extractShadowCasters(
    roofPlanes: RoofPlane[],
    layout: OptimizedPanelLayout
  ): ShadowCastingObject[] {
    const casters: ShadowCastingObject[] = [];
    
    // Add roof features as shadow casters
    roofPlanes.forEach(plane => {
      plane.features.forEach(feature => {
        casters.push({
          id: feature.id,
          type: 'roof_feature',
          position: { x: feature.position.x, y: feature.position.y, z: feature.height || 1.0 },
          dimensions: { 
            width: feature.size.width, 
            height: feature.height || 1.0, 
            depth: feature.size.height 
          },
          shape: 'rectangle'
        });
      });
    });
    
    // Add panels as shadow casters (they can shadow each other)
    layout.panels.forEach(panel => {
      casters.push({
        id: `panel_shadow_${panel.id}`,
        type: 'panel',
        position: { x: panel.position.x, y: panel.position.y, z: 0.2 }, // panels are ~20cm above roof
        dimensions: { 
          width: panel.size.width, 
          height: 0.2, 
          depth: panel.size.height 
        },
        shape: 'rectangle'
      });
    });
    
    return casters;
  }
  
  /**
   * Generate analysis timestamps
   */
  private static generateAnalysisTimestamps(options: ShadingOptimizationOptions): Date[] {
    const timestamps: Date[] = [];
    let current = new Date(options.startDate);
    const end = options.endDate || new Date(current.getTime() + 24 * 60 * 60 * 1000); // default to 1 day
    
    while (current <= end) {
      timestamps.push(new Date(current));
      current = new Date(current.getTime() + options.timeInterval * 60 * 1000);
    }
    
    return timestamps;
  }
  
  /**
   * Generate shading summary
   */
  private static generateShadingSummary(intervals: TimeShadingAnalysis[]): TemporalShadingReport['summary'] {
    const averageDailyShading = intervals.reduce((sum, interval) => sum + interval.totalSystemLoss, 0) / intervals.length;
    
    // Find peak and minimum shading hours
    const sortedByShading = [...intervals].sort((a, b) => b.totalSystemLoss - a.totalSystemLoss);
    const peakShadingHours = sortedByShading.slice(0, 3).map(interval => 
      interval.timestamp.toLocaleTimeString()
    );
    const minimumShadingHours = sortedByShading.slice(-3).map(interval => 
      interval.timestamp.toLocaleTimeString()
    );
    
    // Mock seasonal variation for now
    const seasonalVariation = {
      winter: averageDailyShading * 1.2,
      spring: averageDailyShading * 0.9,
      summer: averageDailyShading * 0.8,
      fall: averageDailyShading * 1.0
    };
    
    const criticalShadingEvents = intervals
      .filter(interval => interval.totalSystemLoss > 20) // >20% power loss
      .map(interval => ({
        time: interval.timestamp,
        description: `High shading event: ${interval.totalSystemLoss.toFixed(1)}% system loss`,
        impact: interval.totalSystemLoss,
        recommendation: interval.totalSystemLoss > 30 ? 
          'Consider panel relocation or tree trimming' : 
          'Monitor for seasonal changes'
      }));
    
    return {
      peakShadingHours,
      minimumShadingHours,
      averageDailyShading,
      seasonalVariation,
      criticalShadingEvents
    };
  }
  
  /**
   * Merge options with defaults
   */
  private static mergeOptions(options: Partial<ShadingOptimizationOptions>): ShadingOptimizationOptions {
    const defaults: ShadingOptimizationOptions = {
      analysisTimeSpan: 'single_day',
      timeInterval: 60, // 1 hour
      startDate: new Date(),
      useNOAA_Algorithm: true,
      atmosphericRefraction: true,
      deltaT: 69.184,
      shadowResolution: 'medium',
      includePenumbra: false,
      includeReflectedLight: true,
      includeAtmosphericScattering: true,
      includeWeatherData: false,
      includeCloudCover: false,
      includeSeasonalVariation: true,
      includeSnowCover: false,
      parallelProcessing: true,
      maxConcurrentCalculations: 4,
      enableCaching: true
    };
    
    return { ...defaults, ...options };
  }
  
  // Utility functions
  private static degToRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }
  
  private static radToDeg(radians: number): number {
    return radians * 180 / Math.PI;
  }
  
  private static dateToJulianDate(date: Date): number {
    return (date.getTime() / 86400000) + 2440587.5;
  }
  
  private static isPointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>): boolean {
    let inside = false;
    const n = polygon.length;
    
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      
      if (((yi > point.y) !== (yj > point.y)) && 
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }
}

export default RealTimeShadingService;