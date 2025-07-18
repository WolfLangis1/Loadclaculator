/**
 * AI Roof Analysis Service using TensorFlow.js
 * 
 * Provides intelligent roof detection, solar panel placement analysis,
 * and shadow detection from satellite imagery
 */

import * as tf from '@tensorflow/tfjs';

export interface RoofAnalysisResult {
  roofArea: number; // in square meters
  usableArea: number; // area suitable for solar panels
  roofSegments: RoofSegment[];
  shadingAnalysis: ShadingData;
  panelPlacement: PanelPlacement[];
  confidence: number; // 0-1 confidence score
  processingTime: number; // milliseconds
}

export interface RoofSegment {
  id: string;
  area: number;
  slope: number; // degrees
  orientation: number; // azimuth degrees (0-360)
  suitability: number; // 0-1 score for solar suitability
  coordinates: Array<{ x: number; y: number }>;
}

export interface ShadingData {
  averageShading: number; // 0-1 (0 = no shade, 1 = full shade)
  timeOfDayAnalysis: Array<{
    hour: number;
    shadingPercentage: number;
  }>;
  shadowSources: Array<{
    type: 'tree' | 'building' | 'structure';
    severity: number; // 0-1
    coordinates: { x: number; y: number };
  }>;
}

export interface PanelPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  efficiency: number; // 0-1 expected efficiency
  annualProduction: number; // kWh per year
}

export class AIRoofAnalysisService {
  private static model: tf.LayersModel | null = null;
  private static isModelLoaded = false;
  private static modelLoadPromise: Promise<void> | null = null;

  /**
   * Initialize TensorFlow.js and load pre-trained models
   */
  static async initialize(): Promise<void> {
    if (this.isModelLoaded) return;
    
    if (this.modelLoadPromise) {
      return this.modelLoadPromise;
    }

    this.modelLoadPromise = this.loadModels();
    return this.modelLoadPromise;
  }

  private static async loadModels(): Promise<void> {
    try {
      console.log('Initializing TensorFlow.js for roof analysis...');
      
      // Set backend (prefer WebGL for performance)
      await tf.ready();
      console.log('TensorFlow.js backend:', tf.getBackend());
      
      // For now, we'll use a simple image segmentation approach
      // In a production environment, you would load a pre-trained model
      // For this implementation, we'll use computer vision techniques
      
      this.isModelLoaded = true;
      console.log('AI Roof Analysis Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AI Roof Analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze satellite image for roof detection and solar potential
   * @deprecated Use analyzeRoofFromImage instead
   */
  static async analyzeRoof(
    imageUrl: string, 
    latitude: number, 
    longitude: number
  ): Promise<RoofAnalysisResult> {
    return this.analyzeRoofFromImage(imageUrl, latitude, longitude);
  }

  /**
   * Analyze satellite image for roof detection and solar potential
   */
  static async analyzeRoofFromImage(
    imageUrl: string, 
    latitude: number, 
    longitude: number
  ): Promise<RoofAnalysisResult> {
    await this.initialize();
    
    const startTime = performance.now();
    
    try {
      // Load and preprocess the image
      const imageElement = await this.loadImage(imageUrl);
      const preprocessedImage = await this.preprocessImage(imageElement);
      
      // Perform roof detection
      const roofSegments = await this.detectRoofSegments(preprocessedImage, latitude);
      
      // Analyze shading
      const shadingAnalysis = await this.analyzeShadows(preprocessedImage, latitude);
      
      // Generate optimal panel placement
      const panelPlacement = await this.generatePanelPlacement(roofSegments, shadingAnalysis);
      
      // Calculate total areas
      const totalRoofArea = roofSegments.reduce((sum, segment) => sum + segment.area, 0);
      const usableArea = roofSegments
        .filter(segment => segment.suitability > 0.6)
        .reduce((sum, segment) => sum + segment.area, 0);
      
      const processingTime = performance.now() - startTime;
      
      return {
        roofArea: totalRoofArea,
        usableArea,
        roofSegments,
        shadingAnalysis,
        panelPlacement,
        confidence: this.calculateConfidence(roofSegments),
        processingTime
      };
      
    } catch (error) {
      console.error('Roof analysis failed:', error);
      throw new Error(`AI roof analysis failed: ${error.message}`);
    }
  }

  /**
   * Load image from URL and create HTML image element
   */
  private static async loadImage(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  /**
   * Preprocess image for analysis
   */
  private static async preprocessImage(imageElement: HTMLImageElement): Promise<tf.Tensor3D> {
    try {
      // Convert image to tensor
      const tensor = tf.browser.fromPixels(imageElement);
      
      // Resize to standard dimensions for processing
      const resized = tf.image.resizeBilinear(tensor, [512, 512]);
      
      // Normalize pixel values to 0-1 range
      const normalized = resized.div(255.0);
      
      // Clean up intermediate tensors
      tensor.dispose();
      resized.dispose();
      
      return normalized as tf.Tensor3D;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw new Error(`Image preprocessing failed: ${error.message}`);
    }
  }

  /**
   * Detect roof segments using computer vision techniques
   */
  private static async detectRoofSegments(
    image: tf.Tensor3D, 
    latitude: number
  ): Promise<RoofSegment[]> {
    // Convert to grayscale for edge detection
    const grayscale = tf.image.rgbToGrayscale(image);
    
    // Apply Gaussian blur to reduce noise
    const blurred = tf.conv2d(
      grayscale.expandDims(0),
      this.createGaussianKernel(),
      1,
      'same'
    ).squeeze([0]);
    
    // Edge detection using Sobel operator
    const edges = await this.applySobelEdgeDetection(blurred);
    
    // Find contours and extract roof-like shapes
    const roofSegments = await this.extractRoofShapes(edges, latitude);
    
    // Clean up tensors
    grayscale.dispose();
    blurred.dispose();
    edges.dispose();
    
    return roofSegments;
  }

  /**
   * Create Gaussian blur kernel
   */
  private static createGaussianKernel(): tf.Tensor4D {
    const kernel = tf.tensor4d([
      [[[1]], [[2]], [[1]]],
      [[[2]], [[4]], [[2]]],
      [[[1]], [[2]], [[1]]]
    ]).div(16);
    
    return kernel;
  }

  /**
   * Apply Sobel edge detection
   */
  private static async applySobelEdgeDetection(image: tf.Tensor3D): Promise<tf.Tensor3D> {
    // Sobel X kernel
    const sobelX = tf.tensor4d([
      [[[-1]], [[0]], [[1]]],
      [[[-2]], [[0]], [[2]]],
      [[[-1]], [[0]], [[1]]]
    ]);
    
    // Sobel Y kernel  
    const sobelY = tf.tensor4d([
      [[[-1]], [[-2]], [[-1]]],
      [[[0]], [[0]], [[0]]],
      [[[1]], [[2]], [[1]]]
    ]);
    
    // Apply convolutions
    const gradX = tf.conv2d(image.expandDims(0), sobelX, 1, 'same').squeeze([0]);
    const gradY = tf.conv2d(image.expandDims(0), sobelY, 1, 'same').squeeze([0]);
    
    // Calculate gradient magnitude
    const magnitude = tf.sqrt(tf.add(tf.square(gradX), tf.square(gradY)));
    
    // Clean up
    sobelX.dispose();
    sobelY.dispose();
    gradX.dispose();
    gradY.dispose();
    
    return magnitude;
  }

  /**
   * Extract roof-like shapes from edge detected image
   */
  private static async extractRoofShapes(
    edges: tf.Tensor3D, 
    latitude: number
  ): Promise<RoofSegment[]> {
    // Convert tensor to array for processing
    const edgeData = await edges.data();
    const [height, width] = edges.shape.slice(0, 2);
    
    // Simple shape detection - in production this would be more sophisticated
    const segments: RoofSegment[] = [];
    
    // Divide image into grid and analyze each section
    const gridSize = 64;
    for (let y = 0; y < height - gridSize; y += gridSize) {
      for (let x = 0; x < width - gridSize; x += gridSize) {
        const segment = this.analyzeGridSection(
          edgeData, width, height, x, y, gridSize, latitude, segments.length
        );
        
        if (segment && segment.area > 100) { // Minimum area threshold
          segments.push(segment);
        }
      }
    }
    
    return segments;
  }

  /**
   * Analyze a grid section for roof characteristics
   */
  private static analyzeGridSection(
    edgeData: Float32Array | Int32Array | Uint8Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    gridSize: number,
    latitude: number,
    id: number
  ): RoofSegment | null {
    let edgeCount = 0;
    let totalIntensity = 0;
    
    // Count edges and calculate average intensity in this section
    for (let y = startY; y < Math.min(startY + gridSize, height); y++) {
      for (let x = startX; x < Math.min(startX + gridSize, width); x++) {
        const pixelIndex = y * width + x;
        const intensity = edgeData[pixelIndex] as number;
        totalIntensity += intensity;
        
        if (intensity > 0.3) { // Edge threshold
          edgeCount++;
        }
      }
    }
    
    const actualGridSize = Math.min(gridSize, width - startX) * Math.min(gridSize, height - startY);
    const edgeRatio = edgeCount / actualGridSize;
    const avgIntensity = totalIntensity / actualGridSize;
    
    // Determine if this section looks like a roof
    const isRoof = edgeRatio > 0.1 && edgeRatio < 0.8 && avgIntensity > 0.2;
    
    if (!isRoof) return null;
    
    // Estimate roof characteristics
    const area = actualGridSize * 0.25; // Convert pixels to approximate square meters
    const slope = Math.min(30, Math.max(5, edgeRatio * 60)); // Estimate slope from edge density
    const orientation = (startX / width) * 360; // Simple orientation based on position
    const suitability = this.calculateSolarSuitability(slope, orientation, latitude);
    
    return {
      id: `roof_segment_${id}`,
      area,
      slope,
      orientation,
      suitability,
      coordinates: [
        { x: startX, y: startY },
        { x: startX + gridSize, y: startY },
        { x: startX + gridSize, y: startY + gridSize },
        { x: startX, y: startY + gridSize }
      ]
    };
  }

  /**
   * Calculate solar suitability score
   */
  private static calculateSolarSuitability(
    slope: number, 
    orientation: number, 
    latitude: number
  ): number {
    // Optimal slope is approximately equal to latitude
    const optimalSlope = Math.abs(latitude);
    const slopeScore = 1 - Math.abs(slope - optimalSlope) / 45;
    
    // Optimal orientation is south (180 degrees)
    const orientationDiff = Math.min(
      Math.abs(orientation - 180),
      360 - Math.abs(orientation - 180)
    );
    const orientationScore = 1 - orientationDiff / 90;
    
    return Math.max(0, Math.min(1, (slopeScore + orientationScore) / 2));
  }

  /**
   * Analyze shadows in the image
   */
  private static async analyzeShadows(
    image: tf.Tensor3D, 
    latitude: number
  ): Promise<ShadingData> {
    // Convert to grayscale and look for dark areas
    const grayscale = tf.image.rgbToGrayscale(image);
    const darkAreas = tf.less(grayscale, tf.scalar(0.3));
    
    // Calculate average shading
    const shadingRatio = tf.mean(tf.cast(darkAreas, 'float32'));
    const averageShading = await shadingRatio.data();
    
    // Generate time-of-day analysis (simplified)
    const timeOfDayAnalysis = Array.from({ length: 12 }, (_, i) => ({
      hour: i + 6, // 6 AM to 6 PM
      shadingPercentage: averageShading[0] * (1 + 0.3 * Math.sin((i / 12) * Math.PI))
    }));
    
    // Clean up
    grayscale.dispose();
    darkAreas.dispose();
    shadingRatio.dispose();
    
    return {
      averageShading: averageShading[0],
      timeOfDayAnalysis,
      shadowSources: [] // Would require more sophisticated analysis
    };
  }

  /**
   * Generate optimal panel placement
   */
  private static async generatePanelPlacement(
    roofSegments: RoofSegment[], 
    shadingAnalysis: ShadingData
  ): Promise<PanelPlacement[]> {
    const placements: PanelPlacement[] = [];
    
    // Standard solar panel dimensions (approximate)
    const panelWidth = 20; // pixels (would be meters in real coords)
    const panelHeight = 30; // pixels
    
    roofSegments.forEach((segment, segmentIndex) => {
      if (segment.suitability < 0.6) return; // Skip unsuitable segments
      
      // Calculate how many panels fit in this segment
      const segmentWidth = Math.max(...segment.coordinates.map(c => c.x)) - 
                          Math.min(...segment.coordinates.map(c => c.x));
      const segmentHeight = Math.max(...segment.coordinates.map(c => c.y)) - 
                           Math.min(...segment.coordinates.map(c => c.y));
      
      const panelsX = Math.floor(segmentWidth / panelWidth);
      const panelsY = Math.floor(segmentHeight / panelHeight);
      
      const minX = Math.min(...segment.coordinates.map(c => c.x));
      const minY = Math.min(...segment.coordinates.map(c => c.y));
      
      // Place panels with spacing
      for (let y = 0; y < panelsY; y++) {
        for (let x = 0; x < panelsX; x++) {
          const panelX = minX + x * panelWidth + 2; // 2 pixel spacing
          const panelY = minY + y * panelHeight + 2;
          
          const efficiency = segment.suitability * (1 - shadingAnalysis.averageShading * 0.5);
          const annualProduction = 400 * efficiency * 1500; // 400W panel, 1500 hours effective sun
          
          placements.push({
            id: `panel_${segmentIndex}_${y}_${x}`,
            x: panelX,
            y: panelY,
            width: panelWidth - 2,
            height: panelHeight - 2,
            efficiency,
            annualProduction
          });
        }
      }
    });
    
    return placements;
  }

  /**
   * Calculate overall confidence score
   */
  private static calculateConfidence(roofSegments: RoofSegment[]): number {
    if (roofSegments.length === 0) return 0;
    
    const avgSuitability = roofSegments.reduce((sum, segment) => sum + segment.suitability, 0) / roofSegments.length;
    const segmentCount = Math.min(roofSegments.length / 5, 1); // Normalize segment count
    
    return (avgSuitability + segmentCount) / 2;
  }

  /**
   * Cleanup TensorFlow.js resources
   */
  static cleanup(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    this.isModelLoaded = false;
    this.modelLoadPromise = null;
  }

  /**
   * Get memory usage information
   */
  static getMemoryInfo(): any {
    return tf.memory();
  }
}