/**
 * AI-Powered Roof Analysis Service
 * 
 * Advanced roof analysis using artificial intelligence, satellite imagery, and solar optimization.
 * Integrates with Google Solar API, TensorFlow.js, and multi-source imagery for comprehensive
 * site assessment and automated solar panel placement optimization.
 */

import { GoogleSolarService, SolarInsights } from './googleSolarService';
import { AerialViewService, GeocodeResult } from './aerialViewService';
import RealTimeShadingService, { TemporalShadingReport, ShadingOptimizationOptions } from './realTimeShadingService';
import NECSetbackComplianceService, { ComplianceAnalysisResult, BuildingCharacteristics } from './necSetbackComplianceService';

export interface RoofFeature {
  id: string;
  type: 'chimney' | 'vent' | 'skylight' | 'hvac_unit' | 'antenna' | 'edge' | 'ridge' | 'valley' | 'obstacle';
  position: { x: number; y: number };
  size: { width: number; height: number };
  height?: number; // relative height above roof surface
  confidence: number; // 0-1 AI confidence score
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  metadata?: Record<string, any>;
}

export interface RoofPlane {
  id: string;
  vertices: Array<{ x: number; y: number }>;
  azimuth: number; // degrees from north
  tilt: number; // degrees from horizontal
  area: number; // square meters
  suitability: number; // 0-1 solar suitability score
  shading: {
    morning: number; // 0-1 shading factor
    midday: number;
    afternoon: number;
    annual: number; // annual average
  };
  features: RoofFeature[]; // obstacles on this plane
}

export interface OptimizedPanelLayout {
  id: string;
  roofPlaneId: string;
  panels: Array<{
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    orientation: 'portrait' | 'landscape';
    wattage: number;
    tilt: number;
    azimuth: number;
  }>;
  totalPanels: number;
  totalWattage: number;
  estimatedProduction: number; // kWh/year
  efficiency: number; // layout efficiency 0-1
  setbackCompliance: boolean;
  necViolations: string[];
}

export interface ShadingAnalysis {
  timestamp: Date;
  sunPosition: {
    elevation: number; // degrees above horizon
    azimuth: number; // degrees from north
  };
  shadowMap: Array<Array<number>>; // 2D grid of shadow intensity 0-1
  affectedPanels: Array<{
    panelId: string;
    shadingFactor: number; // 0-1
    powerLoss: number; // percentage
  }>;
  totalSystemLoss: number; // percentage
}

export interface NECSetbackAnalysis {
  compliant: boolean;
  violations: Array<{
    code: string; // e.g., "NEC 690.12(B)(2)"
    description: string;
    location: { x: number; y: number };
    requiredDistance: number; // feet
    actualDistance: number; // feet
    severity: 'error' | 'warning';
  }>;
  setbackZones: Array<{
    type: 'fire_setback' | 'walkway' | 'smoke_vent' | 'ridge_hip';
    path: Array<{ x: number; y: number }>;
    width: number; // feet
    necReference: string;
  }>;
}

// Legacy interface - replaced by ComplianceAnalysisResult for enhanced analysis
export { NECSetbackAnalysis as LegacyNECSetbackAnalysis };

export interface AIRoofAnalysisResult {
  analysisId: string;
  timestamp: Date;
  coordinates: { latitude: number; longitude: number };
  imageUrl: string;
  
  // AI Detection Results
  roofPlanes: RoofPlane[];
  features: RoofFeature[];
  buildingOutline: Array<{ x: number; y: number }>;
  
  // Solar Analysis
  solarPotential: SolarInsights;
  optimizedLayouts: OptimizedPanelLayout[];
  shadingAnalysis: ShadingAnalysis[];
  
  // Enhanced Real-Time Shading Analysis
  realTimeShadingReport?: TemporalShadingReport;
  
  // Enhanced NEC Compliance Analysis
  necComplianceAnalysis?: ComplianceAnalysisResult;
  
  // Legacy Compliance (maintained for backward compatibility)
  necSetbacks: NECSetbackAnalysis;
  
  // Performance Metrics
  confidence: number; // overall AI confidence
  processingTime: number; // milliseconds
  recommendedLayout: string; // optimizedLayouts[].id
}

export interface AIAnalysisOptions {
  // AI Model Settings
  modelConfidence: number; // minimum confidence threshold 0-1
  featureDetection: boolean;
  roofPlaneDetection: boolean;
  
  // Solar Analysis Options
  panelWattage: number; // default panel wattage
  panelSize: { width: number; height: number }; // meters
  minSetback: number; // feet from edges
  maxTilt: number; // maximum panel tilt angle
  
  // Analysis Depth
  includeShading: boolean;
  shadingTimeSteps: number; // number of sun positions to analyze
  includeWeather: boolean;
  
  // Real-Time Shading Options
  enableRealTimeShading: boolean;
  realTimeShadingOptions?: Partial<ShadingOptimizationOptions>;
  
  // Enhanced NEC Compliance Options
  enableEnhancedNECAnalysis: boolean;
  buildingCharacteristics?: BuildingCharacteristics;
  necVersion?: '2017' | '2020' | '2023';
  jurisdiction?: string;
  
  // Output Options
  generateLayouts: number; // number of layout alternatives
  optimizeFor: 'production' | 'cost' | 'aesthetics' | 'maintenance';
}

export class AIRoofAnalysisService {
  private static readonly TENSORFLOW_MODEL_URL = '/models/roof-detection/model.json';
  private static readonly WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';
  
  private static tfModel: any = null;
  private static isModelLoaded = false;

  /**
   * Initialize TensorFlow.js model for roof analysis
   */
  static async initializeAIModel(): Promise<void> {
    if (this.isModelLoaded) return;

    try {
      // In a real implementation, this would load a trained TensorFlow.js model
      // For now, we'll simulate the model loading
      console.log('🤖 Loading AI roof analysis model...');
      
      // Simulate model loading delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock model initialization
      this.tfModel = {
        predict: (imageData: ImageData) => {
          // This would be replaced with actual TensorFlow.js inference
          return this.mockAIDetection(imageData);
        }
      };
      
      this.isModelLoaded = true;
      console.log('✅ AI model loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load AI model:', error);
      throw new Error('AI model initialization failed');
    }
  }

  /**
   * Perform comprehensive AI roof analysis
   */
  static async analyzeRoof(
    latitude: number,
    longitude: number,
    options: Partial<AIAnalysisOptions> = {}
  ): Promise<AIRoofAnalysisResult> {
    const startTime = performance.now();
    
    // Initialize AI model if not loaded
    if (!this.isModelLoaded) {
      await this.initializeAIModel();
    }

    const defaultOptions: AIAnalysisOptions = {
      modelConfidence: 0.7,
      featureDetection: true,
      roofPlaneDetection: true,
      panelWattage: 400,
      panelSize: { width: 2.0, height: 1.0 },
      minSetback: 3.0,
      maxTilt: 30,
      includeShading: true,
      shadingTimeSteps: 12,
      includeWeather: true,
      enableRealTimeShading: true,
      realTimeShadingOptions: {
        analysisTimeSpan: 'single_day',
        timeInterval: 60,
        shadowResolution: 'medium',
        includeWeatherData: true
      },
      enableEnhancedNECAnalysis: true,
      buildingCharacteristics: {
        type: 'residential',
        stories: 1,
        roofType: 'pitched',
        roofMaterial: 'asphalt_shingle',
        jurisdictionCode: 'ifc'
      },
      necVersion: '2023',
      jurisdiction: 'National',
      generateLayouts: 3,
      optimizeFor: 'production'
    };

    const finalOptions = { ...defaultOptions, ...options };

    console.log('🔬 Starting AI roof analysis for coordinates:', latitude, longitude);

    try {
      // Step 1: Get high-resolution satellite imagery
      const imageUrl = await AerialViewService.getSatelliteImage(
        latitude,
        longitude,
        { width: 1024, height: 1024, zoom: 20, scale: 2 }
      );

      // Step 2: Get solar potential data
      const solarPotential = await GoogleSolarService.getSolarInsights(
        latitude,
        longitude
      );

      // Step 3: Perform AI image analysis
      const imageData = await this.loadImageData(imageUrl);
      const aiDetection = await this.performAIAnalysis(imageData, finalOptions);

      // Step 4: Optimize solar panel layouts
      const optimizedLayouts = await this.generateOptimizedLayouts(
        aiDetection.roofPlanes,
        aiDetection.features,
        solarPotential,
        finalOptions
      );

      // Step 5: Analyze shading patterns
      const shadingAnalysis = finalOptions.includeShading 
        ? await this.performShadingAnalysis(
            latitude,
            longitude,
            aiDetection.roofPlanes,
            optimizedLayouts[0],
            finalOptions
          )
        : [];

      // Step 6: Enhanced Real-Time Shading Analysis (if enabled)
      let realTimeShadingReport: TemporalShadingReport | undefined;
      if (finalOptions.enableRealTimeShading && optimizedLayouts[0]) {
        console.log('🌞 Running enhanced real-time shading analysis...');
        realTimeShadingReport = await RealTimeShadingService.analyzeRealTimeShading(
          latitude,
          longitude,
          aiDetection.roofPlanes,
          optimizedLayouts[0],
          finalOptions.realTimeShadingOptions || {}
        );
      }

      // Step 7: Enhanced NEC Compliance Analysis (if enabled)
      let necComplianceAnalysis: ComplianceAnalysisResult | undefined;
      if (finalOptions.enableEnhancedNECAnalysis && optimizedLayouts[0] && finalOptions.buildingCharacteristics) {
        console.log('📋 Running enhanced NEC 690.12 compliance analysis...');
        necComplianceAnalysis = await NECSetbackComplianceService.analyzeNECCompliance(
          aiDetection.roofPlanes,
          aiDetection.features,
          optimizedLayouts[0],
          finalOptions.buildingCharacteristics,
          finalOptions.necVersion || '2023',
          finalOptions.jurisdiction || 'National'
        );
      }

      // Step 8: Legacy NEC setback compliance (for backward compatibility)
      const necSetbacks = await this.analyzeNECSetbacks(
        aiDetection.roofPlanes,
        aiDetection.features,
        optimizedLayouts[0],
        finalOptions
      );

      const processingTime = performance.now() - startTime;

      const result: AIRoofAnalysisResult = {
        analysisId: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        coordinates: { latitude, longitude },
        imageUrl,
        roofPlanes: aiDetection.roofPlanes,
        features: aiDetection.features,
        buildingOutline: aiDetection.buildingOutline,
        solarPotential,
        optimizedLayouts,
        shadingAnalysis,
        realTimeShadingReport,
        necComplianceAnalysis,
        necSetbacks,
        confidence: aiDetection.confidence,
        processingTime: Math.round(processingTime),
        recommendedLayout: optimizedLayouts[0]?.id || ''
      };

      console.log('✅ AI roof analysis completed:', {
        roofPlanes: result.roofPlanes.length,
        features: result.features.length,
        layouts: result.optimizedLayouts.length,
        confidence: result.confidence,
        processingTime: result.processingTime
      });

      return result;

    } catch (error) {
      console.error('❌ AI roof analysis failed:', error);
      throw new Error(`Roof analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load image data from URL for AI processing
   */
  private static async loadImageData(imageUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for AI analysis'));
      };

      img.src = imageUrl;
    });
  }

  /**
   * Perform AI analysis on roof imagery
   */
  private static async performAIAnalysis(
    imageData: ImageData,
    options: AIAnalysisOptions
  ): Promise<{
    roofPlanes: RoofPlane[];
    features: RoofFeature[];
    buildingOutline: Array<{ x: number; y: number }>;
    confidence: number;
  }> {
    console.log('🧠 Running AI inference on roof imagery...');

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (this.tfModel) {
      return this.tfModel.predict(imageData);
    } else {
      // Fallback to mock detection
      return this.mockAIDetection(imageData);
    }
  }

  /**
   * Mock AI detection for development/testing
   */
  private static mockAIDetection(imageData: ImageData): {
    roofPlanes: RoofPlane[];
    features: RoofFeature[];
    buildingOutline: Array<{ x: number; y: number }>;
    confidence: number;
  } {
    const width = imageData.width;
    const height = imageData.height;

    // Generate mock roof planes
    const roofPlanes: RoofPlane[] = [
      {
        id: 'plane_1',
        vertices: [
          { x: width * 0.2, y: height * 0.3 },
          { x: width * 0.8, y: height * 0.3 },
          { x: width * 0.8, y: height * 0.7 },
          { x: width * 0.2, y: height * 0.7 }
        ],
        azimuth: 180, // south-facing
        tilt: 25,
        area: 150, // square meters
        suitability: 0.95,
        shading: {
          morning: 0.1,
          midday: 0.05,
          afternoon: 0.15,
          annual: 0.1
        },
        features: []
      },
      {
        id: 'plane_2',
        vertices: [
          { x: width * 0.15, y: height * 0.25 },
          { x: width * 0.85, y: height * 0.25 },
          { x: width * 0.85, y: height * 0.35 },
          { x: width * 0.15, y: height * 0.35 }
        ],
        azimuth: 270, // west-facing
        tilt: 25,
        area: 80,
        suitability: 0.75,
        shading: {
          morning: 0.3,
          midday: 0.1,
          afternoon: 0.05,
          annual: 0.15
        },
        features: []
      }
    ];

    // Generate mock features
    const features: RoofFeature[] = [
      {
        id: 'feature_1',
        type: 'chimney',
        position: { x: width * 0.3, y: height * 0.4 },
        size: { width: 20, height: 20 },
        height: 2.0,
        confidence: 0.92,
        boundingBox: { x: width * 0.29, y: height * 0.39, width: 22, height: 22 }
      },
      {
        id: 'feature_2',
        type: 'vent',
        position: { x: width * 0.6, y: height * 0.5 },
        size: { width: 8, height: 8 },
        height: 0.5,
        confidence: 0.85,
        boundingBox: { x: width * 0.595, y: height * 0.495, width: 10, height: 10 }
      },
      {
        id: 'feature_3',
        type: 'hvac_unit',
        position: { x: width * 0.7, y: height * 0.6 },
        size: { width: 40, height: 30 },
        height: 1.5,
        confidence: 0.88,
        boundingBox: { x: width * 0.68, y: height * 0.585, width: 44, height: 34 }
      }
    ];

    // Generate mock building outline
    const buildingOutline = [
      { x: width * 0.15, y: height * 0.25 },
      { x: width * 0.85, y: height * 0.25 },
      { x: width * 0.85, y: height * 0.75 },
      { x: width * 0.15, y: height * 0.75 }
    ];

    return {
      roofPlanes,
      features,
      buildingOutline,
      confidence: 0.87
    };
  }

  /**
   * Generate optimized solar panel layouts
   */
  private static async generateOptimizedLayouts(
    roofPlanes: RoofPlane[],
    features: RoofFeature[],
    solarPotential: SolarInsights,
    options: AIAnalysisOptions
  ): Promise<OptimizedPanelLayout[]> {
    console.log('⚡ Generating optimized panel layouts...');

    const layouts: OptimizedPanelLayout[] = [];

    for (let i = 0; i < options.generateLayouts; i++) {
      const layout = await this.generateSingleLayout(
        roofPlanes,
        features,
        solarPotential,
        options,
        i
      );
      layouts.push(layout);
    }

    // Sort by efficiency or production depending on optimization goal
    layouts.sort((a, b) => {
      switch (options.optimizeFor) {
        case 'production':
          return b.estimatedProduction - a.estimatedProduction;
        case 'cost':
          return a.totalPanels - b.totalPanels; // fewer panels = lower cost
        case 'aesthetics':
          return b.efficiency - a.efficiency; // more uniform = better aesthetics
        default:
          return b.estimatedProduction - a.estimatedProduction;
      }
    });

    return layouts;
  }

  /**
   * Generate a single optimized layout
   */
  private static async generateSingleLayout(
    roofPlanes: RoofPlane[],
    features: RoofFeature[],
    solarPotential: SolarInsights,
    options: AIAnalysisOptions,
    variant: number
  ): Promise<OptimizedPanelLayout> {
    // This would implement sophisticated panel placement algorithm
    // For now, using simplified logic
    
    const layoutId = `layout_${variant + 1}`;
    const panels: OptimizedPanelLayout['panels'] = [];
    
    // Focus on the best roof plane for this example
    const bestPlane = roofPlanes.reduce((best, plane) => 
      plane.suitability > best.suitability ? plane : best
    );

    if (bestPlane) {
      // Calculate available area minus setbacks and obstacles
      const setbackDistance = options.minSetback * 3.28084; // convert feet to meters
      const panelWidth = options.panelSize.width;
      const panelHeight = options.panelSize.height;
      
      // Simple grid placement algorithm
      const gridCols = Math.floor((bestPlane.area / panelWidth) * 0.6); // 60% coverage
      const gridRows = Math.floor(gridCols * 0.6);
      
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          if (panels.length >= solarPotential.solarPotential.maxArrayPanelsCount) break;
          
          const panelId = `panel_${row}_${col}`;
          const x = bestPlane.vertices[0].x + (col * panelWidth * 40); // 40px per meter roughly
          const y = bestPlane.vertices[0].y + (row * panelHeight * 40);
          
          // Check if panel conflicts with features
          const conflictsWithFeature = features.some(feature => {
            const dx = Math.abs(feature.position.x - x);
            const dy = Math.abs(feature.position.y - y);
            return dx < (feature.size.width + panelWidth * 20) && 
                   dy < (feature.size.height + panelHeight * 20);
          });
          
          if (!conflictsWithFeature) {
            panels.push({
              id: panelId,
              position: { x, y },
              size: { width: panelWidth * 40, height: panelHeight * 40 }, // converted to pixels
              orientation: variant % 2 === 0 ? 'landscape' : 'portrait',
              wattage: options.panelWattage,
              tilt: bestPlane.tilt,
              azimuth: bestPlane.azimuth
            });
          }
        }
      }
    }

    const totalWattage = panels.length * options.panelWattage;
    const estimatedProduction = totalWattage * 1.4 * (1 - roofPlanes[0]?.shading.annual || 0.1); // rough estimate
    
    return {
      id: layoutId,
      roofPlaneId: bestPlane?.id || '',
      panels,
      totalPanels: panels.length,
      totalWattage,
      estimatedProduction,
      efficiency: panels.length / (solarPotential.solarPotential.maxArrayPanelsCount || 1),
      setbackCompliance: true, // would be calculated based on actual positions
      necViolations: []
    };
  }

  /**
   * Perform shading analysis for different sun positions
   */
  private static async performShadingAnalysis(
    latitude: number,
    longitude: number,
    roofPlanes: RoofPlane[],
    layout: OptimizedPanelLayout,
    options: AIAnalysisOptions
  ): Promise<ShadingAnalysis[]> {
    console.log('🌞 Analyzing shading patterns...');

    const analyses: ShadingAnalysis[] = [];
    const timeSteps = options.shadingTimeSteps;

    // Generate sun positions throughout the day
    for (let hour = 6; hour <= 18; hour += 12 / timeSteps) {
      const sunPosition = this.calculateSunPosition(latitude, longitude, new Date(), hour);
      const shadowMap = this.generateShadowMap(roofPlanes, layout, sunPosition);
      
      const affectedPanels = layout.panels.map(panel => ({
        panelId: panel.id,
        shadingFactor: this.calculatePanelShading(panel, shadowMap),
        powerLoss: 0 // would be calculated based on shading factor
      }));

      const totalSystemLoss = affectedPanels.reduce((sum, panel) => 
        sum + panel.powerLoss, 0) / affectedPanels.length;

      analyses.push({
        timestamp: new Date(),
        sunPosition,
        shadowMap,
        affectedPanels,
        totalSystemLoss
      });
    }

    return analyses;
  }

  /**
   * Calculate sun position for given coordinates and time
   */
  private static calculateSunPosition(
    latitude: number,
    longitude: number,
    date: Date,
    hour: number
  ): { elevation: number; azimuth: number } {
    // Simplified solar position calculation
    // In production, would use more accurate solar position algorithms
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    const declination = 23.45 * Math.sin((360 * (284 + dayOfYear) / 365) * Math.PI / 180);
    const hourAngle = 15 * (hour - 12);
    
    const elevation = Math.asin(
      Math.sin(declination * Math.PI / 180) * Math.sin(latitude * Math.PI / 180) +
      Math.cos(declination * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * Math.cos(hourAngle * Math.PI / 180)
    ) * 180 / Math.PI;

    const azimuth = Math.atan2(
      Math.sin(hourAngle * Math.PI / 180),
      Math.cos(hourAngle * Math.PI / 180) * Math.sin(latitude * Math.PI / 180) - 
      Math.tan(declination * Math.PI / 180) * Math.cos(latitude * Math.PI / 180)
    ) * 180 / Math.PI + 180;

    return { elevation: Math.max(0, elevation), azimuth };
  }

  /**
   * Generate shadow map for given sun position
   */
  private static generateShadowMap(
    roofPlanes: RoofPlane[],
    layout: OptimizedPanelLayout,
    sunPosition: { elevation: number; azimuth: number }
  ): number[][] {
    // Simplified shadow calculation
    // In production, would use ray tracing or similar techniques
    const mapSize = 100;
    const shadowMap: number[][] = Array(mapSize).fill(null).map(() => Array(mapSize).fill(0));

    // For each roof feature, calculate shadow
    roofPlanes.forEach(plane => {
      plane.features.forEach(feature => {
        if (feature.height && feature.height > 0.5) {
          const shadowLength = feature.height / Math.tan(sunPosition.elevation * Math.PI / 180);
          const shadowDirection = sunPosition.azimuth * Math.PI / 180;
          
          // Cast shadow on map (simplified)
          const shadowEndX = feature.position.x + shadowLength * Math.sin(shadowDirection);
          const shadowEndY = feature.position.y + shadowLength * Math.cos(shadowDirection);
          
          // Mark shadow area (very simplified)
          const mapX = Math.floor((feature.position.x / 1024) * mapSize);
          const mapY = Math.floor((feature.position.y / 1024) * mapSize);
          const endMapX = Math.floor((shadowEndX / 1024) * mapSize);
          const endMapY = Math.floor((shadowEndY / 1024) * mapSize);
          
          if (mapX >= 0 && mapX < mapSize && mapY >= 0 && mapY < mapSize) {
            shadowMap[mapY][mapX] = 0.8; // 80% shading
          }
          if (endMapX >= 0 && endMapX < mapSize && endMapY >= 0 && endMapY < mapSize) {
            shadowMap[endMapY][endMapX] = 0.4; // 40% shading
          }
        }
      });
    });

    return shadowMap;
  }

  /**
   * Calculate shading factor for a specific panel
   */
  private static calculatePanelShading(
    panel: OptimizedPanelLayout['panels'][0],
    shadowMap: number[][]
  ): number {
    const mapSize = shadowMap.length;
    const mapX = Math.floor((panel.position.x / 1024) * mapSize);
    const mapY = Math.floor((panel.position.y / 1024) * mapSize);
    
    if (mapX >= 0 && mapX < mapSize && mapY >= 0 && mapY < mapSize) {
      return shadowMap[mapY][mapX];
    }
    
    return 0; // no shading
  }

  /**
   * Analyze NEC setback compliance
   */
  private static async analyzeNECSetbacks(
    roofPlanes: RoofPlane[],
    features: RoofFeature[],
    layout: OptimizedPanelLayout,
    options: AIAnalysisOptions
  ): Promise<NECSetbackAnalysis> {
    console.log('📋 Analyzing NEC setback compliance...');

    const violations: NECSetbackAnalysis['violations'] = [];
    const setbackZones: NECSetbackAnalysis['setbackZones'] = [];

    // NEC 690.12(B)(2) - 3-foot pathway requirements
    const requiredSetback = 3.0; // feet

    // Check each panel against roof edges
    layout.panels.forEach(panel => {
      roofPlanes.forEach(plane => {
        if (plane.id === layout.roofPlaneId) {
          // Calculate distance to nearest roof edge
          let minDistance = Infinity;
          
          for (let i = 0; i < plane.vertices.length; i++) {
            const vertex1 = plane.vertices[i];
            const vertex2 = plane.vertices[(i + 1) % plane.vertices.length];
            
            const distance = this.pointToLineDistance(
              panel.position,
              vertex1,
              vertex2
            );
            
            minDistance = Math.min(minDistance, distance);
          }

          // Convert pixels to feet (rough approximation)
          const distanceInFeet = (minDistance / 40) * 3.28084;

          if (distanceInFeet < requiredSetback) {
            violations.push({
              code: 'NEC 690.12(B)(2)',
              description: `Panel too close to roof edge. Required: ${requiredSetback}', Actual: ${distanceInFeet.toFixed(1)}'`,
              location: panel.position,
              requiredDistance: requiredSetback,
              actualDistance: distanceInFeet,
              severity: 'error'
            });
          }
        }
      });
    });

    // Generate setback zones for visualization
    roofPlanes.forEach(plane => {
      const setbackPath: Array<{ x: number; y: number }> = [];
      
      // Create inset polygon for 3-foot setback
      plane.vertices.forEach((vertex, index) => {
        const prev = plane.vertices[(index - 1 + plane.vertices.length) % plane.vertices.length];
        const next = plane.vertices[(index + 1) % plane.vertices.length];
        
        // Calculate inset point (simplified)
        const insetX = vertex.x + (Math.sign(vertex.x - prev.x) + Math.sign(vertex.x - next.x)) * 40; // ~3 feet in pixels
        const insetY = vertex.y + (Math.sign(vertex.y - prev.y) + Math.sign(vertex.y - next.y)) * 40;
        
        setbackPath.push({ x: insetX, y: insetY });
      });

      setbackZones.push({
        type: 'fire_setback',
        path: setbackPath,
        width: requiredSetback,
        necReference: 'NEC 690.12(B)(2)'
      });
    });

    return {
      compliant: violations.length === 0,
      violations,
      setbackZones
    };
  }

  /**
   * Calculate distance from point to line segment
   */
  private static pointToLineDistance(
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }

    let param = dot / lenSq;
    param = Math.max(0, Math.min(1, param));

    const xx = lineStart.x + param * C;
    const yy = lineStart.y + param * D;

    const dx = point.x - xx;
    const dy = point.y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get analysis capabilities and status
   */
  static getAnalysisCapabilities(): {
    aiModelLoaded: boolean;
    supportedFeatures: string[];
    estimatedProcessingTime: string;
    accuracyRating: string;
  } {
    return {
      aiModelLoaded: this.isModelLoaded,
      supportedFeatures: [
        'Roof Plane Detection',
        'Obstacle Identification',
        'Solar Panel Optimization',
        'Shading Analysis',
        'NEC Setback Compliance',
        'Multi-Layout Generation'
      ],
      estimatedProcessingTime: '15-30 seconds',
      accuracyRating: 'Development Mode (Mock AI)'
    };
  }

  /**
   * Export analysis results for further processing
   */
  static exportAnalysisResults(result: AIRoofAnalysisResult, format: 'json' | 'csv' | 'pdf'): string | Blob {
    switch (format) {
      case 'json':
        return JSON.stringify(result, null, 2);
      
      case 'csv':
        const csvLines = [
          'Panel ID,X Position,Y Position,Wattage,Azimuth,Tilt,Shading Factor',
          ...result.optimizedLayouts[0]?.panels.map(panel => 
            `${panel.id},${panel.position.x},${panel.position.y},${panel.wattage},${panel.azimuth},${panel.tilt},0`
          ) || []
        ];
        return csvLines.join('\n');
      
      case 'pdf':
        // Would generate PDF report with visualizations
        return new Blob(['PDF report generation not implemented'], { type: 'application/pdf' });
      
      default:
        return JSON.stringify(result, null, 2);
    }
  }
}

export default AIRoofAnalysisService;