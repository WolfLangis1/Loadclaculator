/**
 * Component Recognition Service
 * 
 * Intelligent system for automatically recognizing, categorizing, and configuring
 * electrical components based on load calculator data. Uses pattern matching,
 * machine learning, and electrical engineering rules to generate appropriate
 * SLD components with proper specifications and NEC compliance.
 */

import { LoadState, Load } from '../context/LoadCalculatorContext';
import { NECCalculationResult } from './necCalculations';
import { SLDComponent } from './intelligentSLDService';

export interface ComponentPattern {
  id: string;
  name: string;
  description: string;
  
  // Pattern matching criteria
  keywords: string[];
  loadTypes: string[];
  voltageRange: { min: number; max: number };
  powerRange: { min: number; max: number };
  
  // Component classification
  category: 'service' | 'distribution' | 'protection' | 'load' | 'generation' | 'control';
  sldType: SLDComponent['type'];
  priority: number; // higher priority patterns are matched first
  
  // Electrical specifications
  defaultSpecifications: {
    voltage: number;
    phases: 1 | 3;
    mountingType: 'surface' | 'flush' | 'pole' | 'pad';
    enclosureType: 'NEMA_1' | 'NEMA_3R' | 'NEMA_4' | 'NEMA_4X' | 'NEMA_12';
  };
  
  // Visual properties
  symbolProperties: {
    symbol: string;
    color: string;
    size: { width: number; height: number };
    showRating: boolean;
    showVoltage: boolean;
  };
  
  // NEC requirements
  necRequirements: {
    protectionRequired: boolean;
    disconnectRequired: boolean;
    groundingRequired: boolean;
    specialRequirements: string[];
  };
}

export interface RecognitionResult {
  confidence: number; // 0-1 recognition confidence
  component: SLDComponent;
  alternativeComponents: SLDComponent[];
  reasoning: string[];
  necCompliance: {
    violations: string[];
    warnings: string[];
    recommendations: string[];
  };
  sourceLoad?: Load;
}

export interface RecognitionConfig {
  // Recognition sensitivity
  minimumConfidence: number;
  enableFuzzyMatching: boolean;
  useMLEnhancement: boolean;
  
  // Component preferences
  preferredManufacturers: string[];
  standardVoltages: number[];
  defaultEnclosureTypes: string[];
  
  // Learning settings
  enablePatternLearning: boolean;
  userFeedbackWeight: number;
  historicalDataWeight: number;
}

export interface ComponentDatabase {
  patterns: ComponentPattern[];
  manufacturerData: Record<string, {
    name: string;
    products: Array<{
      model: string;
      type: string;
      specifications: Record<string, any>;
      necCompliant: boolean;
    }>;
  }>;
  standardComponents: Record<string, {
    rating: string;
    voltage: number;
    phases: 1 | 3;
    applications: string[];
  }>;
}

export class ComponentRecognitionService {
  private static database: ComponentDatabase | null = null;
  private static mlModel: any = null;
  private static isInitialized = false;
  private static recognitionHistory: Array<{
    input: Load;
    result: RecognitionResult;
    userCorrection?: SLDComponent;
    timestamp: Date;
  }> = [];

  /**
   * Initialize the component recognition system
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 Initializing component recognition system...');
      
      // Load component database
      this.database = await this.loadComponentDatabase();
      
      // Initialize ML model for enhanced recognition
      await this.initializeMLModel();
      
      this.isInitialized = true;
      console.log('✅ Component recognition system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize component recognition:', error);
      throw new Error('Component recognition initialization failed');
    }
  }

  /**
   * Recognize and generate SLD components from load calculator data
   */
  static async recognizeComponents(
    loadState: LoadState,
    necCalculations: NECCalculationResult,
    config: Partial<RecognitionConfig> = {}
  ): Promise<{
    components: SLDComponent[];
    recognitionResults: RecognitionResult[];
    systemComponents: SLDComponent[];
    statistics: {
      totalLoads: number;
      recognizedComponents: number;
      averageConfidence: number;
      necViolations: number;
    };
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const defaultConfig: RecognitionConfig = {
      minimumConfidence: 0.6,
      enableFuzzyMatching: true,
      useMLEnhancement: true,
      preferredManufacturers: ['Square D', 'Eaton', 'Siemens', 'GE'],
      standardVoltages: [120, 240, 208, 480, 277],
      defaultEnclosureTypes: ['NEMA_1', 'NEMA_3R'],
      enablePatternLearning: true,
      userFeedbackWeight: 0.3,
      historicalDataWeight: 0.2
    };

    const finalConfig = { ...defaultConfig, ...config };

    console.log('🧠 Starting component recognition process...');

    try {
      const recognitionResults: RecognitionResult[] = [];
      const allComponents: SLDComponent[] = [];

      // Step 1: Generate system components (service panels, meters, etc.)
      const systemComponents = await this.generateSystemComponents(
        loadState,
        necCalculations,
        finalConfig
      );
      allComponents.push(...systemComponents);

      // Step 2: Process general loads
      for (const load of loadState.loads.general) {
        const result = await this.recognizeLoadComponent(load, 'general', finalConfig);
        if (result.confidence >= finalConfig.minimumConfidence) {
          recognitionResults.push(result);
          allComponents.push(result.component);
        }
      }

      // Step 3: Process HVAC loads
      for (const load of loadState.loads.hvac) {
        const result = await this.recognizeLoadComponent(load, 'hvac', finalConfig);
        if (result.confidence >= finalConfig.minimumConfidence) {
          recognitionResults.push(result);
          allComponents.push(result.component);
        }
      }

      // Step 4: Process EVSE loads
      for (const load of loadState.loads.evse) {
        const result = await this.recognizeLoadComponent(load, 'evse', finalConfig);
        if (result.confidence >= finalConfig.minimumConfidence) {
          recognitionResults.push(result);
          allComponents.push(result.component);
        }
      }

      // Step 5: Process solar/battery systems
      for (const load of loadState.loads.solarBattery) {
        const result = await this.recognizeLoadComponent(load, 'solar', finalConfig);
        if (result.confidence >= finalConfig.minimumConfidence) {
          recognitionResults.push(result);
          allComponents.push(result.component);
        }
      }

      // Step 6: Generate protection and control components
      const protectionComponents = await this.generateProtectionComponents(
        allComponents,
        necCalculations,
        finalConfig
      );
      allComponents.push(...protectionComponents);

      // Calculate statistics
      const totalLoads = loadState.loads.general.length + 
                        loadState.loads.hvac.length + 
                        loadState.loads.evse.length + 
                        loadState.loads.solarBattery.length;

      const averageConfidence = recognitionResults.length > 0
        ? recognitionResults.reduce((sum, r) => sum + r.confidence, 0) / recognitionResults.length
        : 0;

      const necViolations = recognitionResults.reduce(
        (sum, r) => sum + r.necCompliance.violations.length, 0
      );

      const statistics = {
        totalLoads,
        recognizedComponents: recognitionResults.length,
        averageConfidence,
        necViolations
      };

      console.log('✅ Component recognition completed:', statistics);

      return {
        components: allComponents,
        recognitionResults,
        systemComponents,
        statistics
      };

    } catch (error) {
      console.error('❌ Component recognition failed:', error);
      throw new Error(`Component recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Recognize a single load as an SLD component
   */
  private static async recognizeLoadComponent(
    load: Load,
    loadType: 'general' | 'hvac' | 'evse' | 'solar',
    config: RecognitionConfig
  ): Promise<RecognitionResult> {
    if (!this.database) {
      throw new Error('Component database not loaded');
    }

    // Step 1: Find matching patterns
    const matchingPatterns = this.findMatchingPatterns(load, loadType);
    
    // Step 2: Score patterns and select best match
    const bestPattern = this.scorePatternsAndSelectBest(load, matchingPatterns);
    
    if (!bestPattern.pattern) {
      // Create generic component if no pattern matches
      return this.createGenericComponent(load, loadType, config);
    }

    // Step 3: Generate component from pattern
    const component = this.generateComponentFromPattern(load, bestPattern.pattern, config);
    
    // Step 4: Enhance with ML if enabled
    if (config.useMLEnhancement && this.mlModel) {
      const mlEnhancement = await this.enhanceWithML(component, load, config);
      Object.assign(component, mlEnhancement);
    }

    // Step 5: Check NEC compliance
    const necCompliance = this.checkNECCompliance(component, load);

    // Step 6: Generate alternatives
    const alternativeComponents = this.generateAlternativeComponents(
      load, 
      matchingPatterns.slice(1, 4), 
      config
    );

    const reasoning = [
      `Matched pattern: ${bestPattern.pattern.name}`,
      `Confidence: ${(bestPattern.score * 100).toFixed(1)}%`,
      `Load type: ${loadType}`,
      `Power: ${load.watts}W, Voltage: ${load.voltage || 'N/A'}V`
    ];

    const result: RecognitionResult = {
      confidence: bestPattern.score,
      component,
      alternativeComponents,
      reasoning,
      necCompliance,
      sourceLoad: load
    };

    // Store for learning
    this.recognitionHistory.push({
      input: load,
      result,
      timestamp: new Date()
    });

    return result;
  }

  /**
   * Find patterns that match the given load
   */
  private static findMatchingPatterns(
    load: Load,
    loadType: string
  ): Array<{ pattern: ComponentPattern; score: number }> {
    if (!this.database) return [];

    const matches: Array<{ pattern: ComponentPattern; score: number }> = [];

    for (const pattern of this.database.patterns) {
      let score = 0;
      
      // Check load type match
      if (pattern.loadTypes.includes(loadType)) {
        score += 0.3;
      }

      // Check keyword matches in load description
      const description = load.description.toLowerCase();
      const keywordMatches = pattern.keywords.filter(keyword => 
        description.includes(keyword.toLowerCase())
      );
      score += (keywordMatches.length / pattern.keywords.length) * 0.4;

      // Check power range
      if (load.watts >= pattern.powerRange.min && load.watts <= pattern.powerRange.max) {
        score += 0.2;
      } else {
        // Partial credit for nearby ranges
        const powerDistance = Math.min(
          Math.abs(load.watts - pattern.powerRange.min),
          Math.abs(load.watts - pattern.powerRange.max)
        );
        const maxPower = Math.max(pattern.powerRange.max, load.watts);
        score += Math.max(0, 0.2 - (powerDistance / maxPower) * 0.2);
      }

      // Check voltage range if available
      if (load.voltage) {
        if (load.voltage >= pattern.voltageRange.min && load.voltage <= pattern.voltageRange.max) {
          score += 0.1;
        }
      }

      if (score > 0.1) { // Only include patterns with some relevance
        matches.push({ pattern, score });
      }
    }

    // Sort by score descending
    return matches.sort((a, b) => b.score - a.score);
  }

  /**
   * Score patterns and select the best match
   */
  private static scorePatternsAndSelectBest(
    load: Load,
    matches: Array<{ pattern: ComponentPattern; score: number }>
  ): { pattern: ComponentPattern | null; score: number } {
    if (matches.length === 0) {
      return { pattern: null, score: 0 };
    }

    // Apply priority weighting
    for (const match of matches) {
      match.score *= (1 + match.pattern.priority * 0.1);
    }

    // Re-sort after priority adjustment
    matches.sort((a, b) => b.score - a.score);

    return { pattern: matches[0].pattern, score: Math.min(1, matches[0].score) };
  }

  /**
   * Generate SLD component from recognized pattern
   */
  private static generateComponentFromPattern(
    load: Load,
    pattern: ComponentPattern,
    config: RecognitionConfig
  ): SLDComponent {
    const componentId = `comp_${load.id}_${Date.now()}`;
    
    return {
      id: componentId,
      type: pattern.sldType,
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      size: pattern.symbolProperties.size,
      rotation: 0,
      
      electrical: {
        voltage: load.voltage || pattern.defaultSpecifications.voltage,
        amperage: load.watts / (load.voltage || pattern.defaultSpecifications.voltage),
        phases: pattern.defaultSpecifications.phases,
        frequency: 60,
        power: load.watts,
        powerFactor: 0.9,
        efficiency: 0.85
      },
      
      specifications: {
        rating: `${load.watts}W`,
        mountingType: pattern.defaultSpecifications.mountingType,
        enclosureType: pattern.defaultSpecifications.enclosureType
      },
      
      visual: {
        symbol: pattern.symbolProperties.symbol,
        label: load.description,
        showRating: pattern.symbolProperties.showRating,
        showVoltage: pattern.symbolProperties.showVoltage,
        lineWeight: 2,
        fillColor: pattern.symbolProperties.color,
        strokeColor: '#374151'
      },
      
      terminals: this.generateTerminals(pattern.sldType),
      
      metadata: {
        necReference: pattern.necRequirements.specialRequirements.join(', '),
        loadFromCalculator: true,
        autoGenerated: true,
        category: pattern.category,
        criticality: this.determineCriticality(load, pattern)
      }
    };
  }

  /**
   * Generate appropriate terminals for component type
   */
  private static generateTerminals(componentType: SLDComponent['type']): SLDComponent['terminals'] {
    const baseTerminals = [
      {
        id: 'input_1',
        type: 'input' as const,
        position: 'left' as const,
        connectionPoint: { x: -20, y: 0 }
      },
      {
        id: 'output_1',
        type: 'output' as const,
        position: 'right' as const,
        connectionPoint: { x: 20, y: 0 }
      }
    ];

    // Add ground terminal for most components
    if (!['junction', 'relay'].includes(componentType)) {
      baseTerminals.push({
        id: 'ground',
        type: 'ground' as const,
        position: 'bottom' as const,
        connectionPoint: { x: 0, y: 15 }
      });
    }

    // Add neutral for 120V loads
    if (['load', 'evse'].includes(componentType)) {
      baseTerminals.push({
        id: 'neutral',
        type: 'neutral' as const,
        position: 'bottom' as const,
        connectionPoint: { x: -10, y: 15 }
      });
    }

    return baseTerminals;
  }

  /**
   * Determine component criticality based on load characteristics
   */
  private static determineCriticality(
    load: Load,
    pattern: ComponentPattern
  ): 'essential' | 'important' | 'standard' | 'optional' {
    const description = load.description.toLowerCase();
    
    // Essential loads
    if (description.includes('emergency') || 
        description.includes('life safety') ||
        description.includes('fire') ||
        load.watts > 10000) {
      return 'essential';
    }
    
    // Important loads
    if (description.includes('hvac') ||
        description.includes('refrigerat') ||
        description.includes('security') ||
        load.watts > 5000) {
      return 'important';
    }
    
    // Optional loads
    if (description.includes('pool') ||
        description.includes('spa') ||
        description.includes('landscape') ||
        load.watts < 500) {
      return 'optional';
    }
    
    return 'standard';
  }

  /**
   * Generate system components (service panels, meters, etc.)
   */
  private static async generateSystemComponents(
    loadState: LoadState,
    necCalculations: NECCalculationResult,
    config: RecognitionConfig
  ): Promise<SLDComponent[]> {
    const components: SLDComponent[] = [];

    // Main service panel
    const servicePanel: SLDComponent = {
      id: 'service_panel_main',
      type: 'service_panel',
      position: { x: 100, y: 100 },
      size: { width: 80, height: 120 },
      rotation: 0,
      
      electrical: {
        voltage: necCalculations.serviceVoltage,
        amperage: necCalculations.calculatedServiceSize,
        phases: necCalculations.serviceVoltage > 240 ? 3 : 1,
        frequency: 60
      },
      
      specifications: {
        rating: `${necCalculations.calculatedServiceSize}A`,
        mountingType: 'surface',
        enclosureType: 'NEMA_1'
      },
      
      visual: {
        symbol: 'service_panel',
        label: 'Main Service Panel',
        showRating: true,
        showVoltage: true,
        lineWeight: 3,
        fillColor: '#f3f4f6',
        strokeColor: '#1f2937'
      },
      
      terminals: [
        { id: 'utility_input', type: 'input', position: 'top', connectionPoint: { x: 0, y: -60 } },
        { id: 'main_output', type: 'output', position: 'bottom', connectionPoint: { x: 0, y: 60 } },
        { id: 'ground_bus', type: 'ground', position: 'bottom', connectionPoint: { x: -30, y: 50 } },
        { id: 'neutral_bus', type: 'neutral', position: 'bottom', connectionPoint: { x: 30, y: 50 } }
      ],
      
      metadata: {
        necReference: 'NEC 408.3, 408.36',
        loadFromCalculator: false,
        autoGenerated: true,
        category: 'service',
        criticality: 'essential'
      }
    };
    components.push(servicePanel);

    // Electric meter (if service size warrants it)
    if (necCalculations.calculatedServiceSize >= 100) {
      const meter: SLDComponent = {
        id: 'electric_meter',
        type: 'meter',
        position: { x: 100, y: 0 },
        size: { width: 60, height: 40 },
        rotation: 0,
        
        electrical: {
          voltage: necCalculations.serviceVoltage,
          amperage: necCalculations.calculatedServiceSize,
          phases: necCalculations.serviceVoltage > 240 ? 3 : 1,
          frequency: 60
        },
        
        specifications: {
          rating: `${necCalculations.calculatedServiceSize}A`,
          mountingType: 'surface',
          enclosureType: 'NEMA_3R'
        },
        
        visual: {
          symbol: 'meter',
          label: 'Electric Meter',
          showRating: true,
          showVoltage: false,
          lineWeight: 2,
          fillColor: '#e5e7eb',
          strokeColor: '#374151'
        },
        
        terminals: [
          { id: 'utility_in', type: 'input', position: 'top', connectionPoint: { x: 0, y: -20 } },
          { id: 'service_out', type: 'output', position: 'bottom', connectionPoint: { x: 0, y: 20 } }
        ],
        
        metadata: {
          necReference: 'NEC 230.82',
          loadFromCalculator: false,
          autoGenerated: true,
          category: 'service',
          criticality: 'essential'
        }
      };
      components.push(meter);
    }

    // Main disconnect (if required)
    if (necCalculations.calculatedServiceSize >= 200) {
      const disconnect: SLDComponent = {
        id: 'main_disconnect',
        type: 'disconnect',
        position: { x: 200, y: 100 },
        size: { width: 40, height: 60 },
        rotation: 0,
        
        electrical: {
          voltage: necCalculations.serviceVoltage,
          amperage: necCalculations.calculatedServiceSize,
          phases: necCalculations.serviceVoltage > 240 ? 3 : 1,
          frequency: 60
        },
        
        specifications: {
          rating: `${necCalculations.calculatedServiceSize}A`,
          mountingType: 'surface',
          enclosureType: 'NEMA_1'
        },
        
        visual: {
          symbol: 'disconnect',
          label: 'Main Disconnect',
          showRating: true,
          showVoltage: false,
          lineWeight: 2,
          fillColor: '#fef3c7',
          strokeColor: '#f59e0b'
        },
        
        terminals: [
          { id: 'line_in', type: 'input', position: 'left', connectionPoint: { x: -20, y: 0 } },
          { id: 'load_out', type: 'output', position: 'right', connectionPoint: { x: 20, y: 0 } }
        ],
        
        metadata: {
          necReference: 'NEC 230.70',
          loadFromCalculator: false,
          autoGenerated: true,
          category: 'protection',
          criticality: 'essential'
        }
      };
      components.push(disconnect);
    }

    return components;
  }

  /**
   * Generate protection components (breakers, fuses, etc.)
   */
  private static async generateProtectionComponents(
    components: SLDComponent[],
    necCalculations: NECCalculationResult,
    config: RecognitionConfig
  ): Promise<SLDComponent[]> {
    const protectionComponents: SLDComponent[] = [];

    // Generate breakers for each load component
    components.forEach(component => {
      if (component.metadata.category === 'load' || component.metadata.category === 'generation') {
        const breakerSize = this.calculateBreakerSize(component.electrical.amperage);
        
        const breaker: SLDComponent = {
          id: `breaker_${component.id}`,
          type: 'breaker',
          position: { x: component.position.x - 100, y: component.position.y },
          size: { width: 30, height: 20 },
          rotation: 0,
          
          electrical: {
            voltage: component.electrical.voltage,
            amperage: breakerSize,
            phases: component.electrical.phases,
            frequency: 60
          },
          
          specifications: {
            rating: `${breakerSize}A`,
            mountingType: 'flush',
            enclosureType: 'NEMA_1'
          },
          
          visual: {
            symbol: 'breaker',
            label: `${breakerSize}A CB`,
            showRating: true,
            showVoltage: false,
            lineWeight: 1,
            fillColor: '#ddd6fe',
            strokeColor: '#7c3aed'
          },
          
          terminals: [
            { id: 'line_in', type: 'input', position: 'left', connectionPoint: { x: -15, y: 0 } },
            { id: 'load_out', type: 'output', position: 'right', connectionPoint: { x: 15, y: 0 } }
          ],
          
          metadata: {
            necReference: 'NEC 240.4',
            loadFromCalculator: false,
            autoGenerated: true,
            category: 'protection',
            criticality: 'important'
          }
        };
        
        protectionComponents.push(breaker);
      }
    });

    return protectionComponents;
  }

  /**
   * Calculate appropriate breaker size for given amperage
   */
  private static calculateBreakerSize(amperage: number): number {
    const standardSizes = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400];
    
    // Apply 125% factor for continuous loads
    const requiredSize = amperage * 1.25;
    
    // Find next larger standard size
    return standardSizes.find(size => size >= requiredSize) || 400;
  }

  /**
   * Create generic component when no pattern matches
   */
  private static createGenericComponent(
    load: Load,
    loadType: string,
    config: RecognitionConfig
  ): RecognitionResult {
    const component: SLDComponent = {
      id: `generic_${load.id}`,
      type: 'load',
      position: { x: 0, y: 0 },
      size: { width: 60, height: 40 },
      rotation: 0,
      
      electrical: {
        voltage: load.voltage || 120,
        amperage: load.watts / (load.voltage || 120),
        phases: 1,
        frequency: 60,
        power: load.watts
      },
      
      specifications: {
        rating: `${load.watts}W`
      },
      
      visual: {
        symbol: 'generic_load',
        label: load.description,
        showRating: true,
        showVoltage: false,
        lineWeight: 2,
        fillColor: '#f3f4f6',
        strokeColor: '#6b7280'
      },
      
      terminals: this.generateTerminals('load'),
      
      metadata: {
        loadFromCalculator: true,
        autoGenerated: true,
        category: 'load',
        criticality: 'standard'
      }
    };

    return {
      confidence: 0.5,
      component,
      alternativeComponents: [],
      reasoning: ['Generic component created - no specific pattern matched'],
      necCompliance: {
        violations: [],
        warnings: ['Component type could not be specifically identified'],
        recommendations: ['Review load description for better component recognition']
      },
      sourceLoad: load
    };
  }

  /**
   * Check NEC compliance for recognized component
   */
  private static checkNECCompliance(component: SLDComponent, load: Load): {
    violations: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check ampacity
    if (component.electrical.amperage > 100 && !component.specifications.shortCircuitRating) {
      warnings.push('High amperage component should specify short circuit rating');
    }

    // Check grounding
    if (!component.terminals.some(t => t.type === 'ground')) {
      violations.push('Component missing equipment grounding connection');
    }

    // Check overcurrent protection
    if (component.metadata.category === 'load' && component.electrical.amperage > 15) {
      recommendations.push('Verify overcurrent protection sizing per NEC 240.4');
    }

    // Check EVSE specific requirements
    if (component.type === 'evse') {
      if (!component.specifications.enclosureType?.includes('3')) {
        recommendations.push('EVSE should use weather-resistant enclosure per NEC 625.22');
      }
    }

    return { violations, warnings, recommendations };
  }

  /**
   * Generate alternative component options
   */
  private static generateAlternativeComponents(
    load: Load,
    alternativePatterns: Array<{ pattern: ComponentPattern; score: number }>,
    config: RecognitionConfig
  ): SLDComponent[] {
    return alternativePatterns.slice(0, 3).map(({ pattern }) =>
      this.generateComponentFromPattern(load, pattern, config)
    );
  }

  /**
   * Load component database with patterns and manufacturer data
   */
  private static async loadComponentDatabase(): Promise<ComponentDatabase> {
    // In production, this would load from external database
    // For now, return built-in patterns
    return {
      patterns: this.getBuiltInPatterns(),
      manufacturerData: this.getManufacturerData(),
      standardComponents: this.getStandardComponents()
    };
  }

  /**
   * Get built-in component patterns
   */
  private static getBuiltInPatterns(): ComponentPattern[] {
    return [
      {
        id: 'hvac_unit',
        name: 'HVAC Equipment',
        description: 'Air conditioning and heating equipment',
        keywords: ['hvac', 'air condition', 'heat pump', 'furnace', 'ac unit', 'cooling', 'heating'],
        loadTypes: ['hvac'],
        voltageRange: { min: 208, max: 480 },
        powerRange: { min: 1000, max: 50000 },
        category: 'load',
        sldType: 'load',
        priority: 8,
        defaultSpecifications: {
          voltage: 240,
          phases: 1,
          mountingType: 'surface',
          enclosureType: 'NEMA_1'
        },
        symbolProperties: {
          symbol: 'hvac_unit',
          color: '#3b82f6',
          size: { width: 80, height: 60 },
          showRating: true,
          showVoltage: true
        },
        necRequirements: {
          protectionRequired: true,
          disconnectRequired: true,
          groundingRequired: true,
          specialRequirements: ['NEC 440.12', 'NEC 440.14']
        }
      },
      {
        id: 'evse_charger',
        name: 'Electric Vehicle Supply Equipment',
        description: 'EV charging stations and equipment',
        keywords: ['evse', 'ev charger', 'electric vehicle', 'charging station', 'tesla', 'chargepoint'],
        loadTypes: ['evse'],
        voltageRange: { min: 208, max: 480 },
        powerRange: { min: 3000, max: 100000 },
        category: 'load',
        sldType: 'evse',
        priority: 9,
        defaultSpecifications: {
          voltage: 240,
          phases: 1,
          mountingType: 'surface',
          enclosureType: 'NEMA_3R'
        },
        symbolProperties: {
          symbol: 'evse',
          color: '#10b981',
          size: { width: 70, height: 50 },
          showRating: true,
          showVoltage: true
        },
        necRequirements: {
          protectionRequired: true,
          disconnectRequired: true,
          groundingRequired: true,
          specialRequirements: ['NEC 625.22', 'NEC 625.42', 'NEC 625.44']
        }
      },
      {
        id: 'solar_inverter',
        name: 'Solar Inverter',
        description: 'Photovoltaic inverter equipment',
        keywords: ['solar', 'inverter', 'pv', 'photovoltaic', 'renewable', 'grid tie'],
        loadTypes: ['solar'],
        voltageRange: { min: 120, max: 480 },
        powerRange: { min: 1000, max: 100000 },
        category: 'generation',
        sldType: 'inverter',
        priority: 8,
        defaultSpecifications: {
          voltage: 240,
          phases: 1,
          mountingType: 'surface',
          enclosureType: 'NEMA_3R'
        },
        symbolProperties: {
          symbol: 'inverter',
          color: '#f59e0b',
          size: { width: 70, height: 50 },
          showRating: true,
          showVoltage: true
        },
        necRequirements: {
          protectionRequired: true,
          disconnectRequired: true,
          groundingRequired: true,
          specialRequirements: ['NEC 690.12', 'NEC 690.31', 'NEC 690.64']
        }
      },
      {
        id: 'motor_load',
        name: 'Motor Load',
        description: 'Electric motors and motor-driven equipment',
        keywords: ['motor', 'pump', 'fan', 'compressor', 'blower', 'conveyor'],
        loadTypes: ['general', 'hvac'],
        voltageRange: { min: 120, max: 480 },
        powerRange: { min: 500, max: 50000 },
        category: 'load',
        sldType: 'motor',
        priority: 7,
        defaultSpecifications: {
          voltage: 240,
          phases: 1,
          mountingType: 'surface',
          enclosureType: 'NEMA_1'
        },
        symbolProperties: {
          symbol: 'motor',
          color: '#8b5cf6',
          size: { width: 60, height: 60 },
          showRating: true,
          showVoltage: true
        },
        necRequirements: {
          protectionRequired: true,
          disconnectRequired: true,
          groundingRequired: true,
          specialRequirements: ['NEC 430.32', 'NEC 430.102']
        }
      },
      {
        id: 'lighting_load',
        name: 'Lighting Load',
        description: 'General and specialized lighting',
        keywords: ['lighting', 'lights', 'led', 'fluorescent', 'incandescent', 'fixture'],
        loadTypes: ['general'],
        voltageRange: { min: 120, max: 277 },
        powerRange: { min: 50, max: 5000 },
        category: 'load',
        sldType: 'load',
        priority: 5,
        defaultSpecifications: {
          voltage: 120,
          phases: 1,
          mountingType: 'flush',
          enclosureType: 'NEMA_1'
        },
        symbolProperties: {
          symbol: 'lighting',
          color: '#fbbf24',
          size: { width: 50, height: 30 },
          showRating: true,
          showVoltage: false
        },
        necRequirements: {
          protectionRequired: true,
          disconnectRequired: false,
          groundingRequired: true,
          specialRequirements: ['NEC 410.117']
        }
      },
      {
        id: 'receptacle_load',
        name: 'Receptacle Load',
        description: 'General purpose and special receptacles',
        keywords: ['receptacle', 'outlet', 'plug', 'convenience', 'gfci', 'dedicated'],
        loadTypes: ['general'],
        voltageRange: { min: 120, max: 240 },
        powerRange: { min: 100, max: 3000 },
        category: 'load',
        sldType: 'load',
        priority: 4,
        defaultSpecifications: {
          voltage: 120,
          phases: 1,
          mountingType: 'flush',
          enclosureType: 'NEMA_1'
        },
        symbolProperties: {
          symbol: 'receptacle',
          color: '#6b7280',
          size: { width: 40, height: 30 },
          showRating: true,
          showVoltage: false
        },
        necRequirements: {
          protectionRequired: true,
          disconnectRequired: false,
          groundingRequired: true,
          specialRequirements: ['NEC 210.8 (GFCI requirements)']
        }
      }
    ];
  }

  /**
   * Get manufacturer data
   */
  private static getManufacturerData(): ComponentDatabase['manufacturerData'] {
    return {
      'Square D': {
        name: 'Square D by Schneider Electric',
        products: [
          {
            model: 'HOM Series',
            type: 'breaker',
            specifications: { voltage: 120, amperage: [15, 20, 30, 40, 50] },
            necCompliant: true
          }
        ]
      },
      'Eaton': {
        name: 'Eaton Corporation',
        products: [
          {
            model: 'BR Series',
            type: 'breaker',
            specifications: { voltage: 240, amperage: [15, 20, 30, 40, 50] },
            necCompliant: true
          }
        ]
      }
    };
  }

  /**
   * Get standard components
   */
  private static getStandardComponents(): ComponentDatabase['standardComponents'] {
    return {
      '15A_120V_Breaker': {
        rating: '15A',
        voltage: 120,
        phases: 1,
        applications: ['lighting', 'receptacles']
      },
      '20A_120V_Breaker': {
        rating: '20A',
        voltage: 120,
        phases: 1,
        applications: ['receptacles', 'small appliances']
      },
      '30A_240V_Breaker': {
        rating: '30A',
        voltage: 240,
        phases: 1,
        applications: ['dryer', 'water heater']
      }
    };
  }

  /**
   * Initialize ML model for enhanced recognition
   */
  private static async initializeMLModel(): Promise<void> {
    try {
      console.log('🤖 Loading ML model for component recognition...');
      
      // Simulate ML model loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock ML model
      this.mlModel = {
        enhanceComponent: (component: SLDComponent, load: Load) => {
          // Mock enhancement logic
          return {
            confidence: 0.85,
            suggestions: ['Consider higher rated protection']
          };
        }
      };
      
      console.log('✅ ML model loaded for component recognition');
    } catch (error) {
      console.warn('⚠️ ML model failed to load, using rule-based recognition only');
    }
  }

  /**
   * Enhance component with ML suggestions
   */
  private static async enhanceWithML(
    component: SLDComponent,
    load: Load,
    config: RecognitionConfig
  ): Promise<Partial<SLDComponent>> {
    if (!this.mlModel) return {};

    try {
      const enhancement = this.mlModel.enhanceComponent(component, load);
      
      // Apply ML suggestions to component
      return {
        specifications: {
          ...component.specifications,
          ...enhancement.specifications
        }
      };
    } catch (error) {
      console.warn('ML enhancement failed:', error);
      return {};
    }
  }

  /**
   * Record user feedback for learning
   */
  static recordUserFeedback(
    recognitionId: string,
    correctedComponent: SLDComponent,
    rating: number
  ): void {
    const historyEntry = this.recognitionHistory.find(h => h.result.component.id === recognitionId);
    if (historyEntry) {
      historyEntry.userCorrection = correctedComponent;
      console.log('📝 User feedback recorded for component recognition learning');
    }
  }

  /**
   * Get service capabilities and statistics
   */
  static getRecognitionCapabilities(): {
    isInitialized: boolean;
    totalPatterns: number;
    supportedLoadTypes: string[];
    averageConfidence: number;
    recognitionHistory: number;
  } {
    const avgConfidence = this.recognitionHistory.length > 0
      ? this.recognitionHistory.reduce((sum, h) => sum + h.result.confidence, 0) / this.recognitionHistory.length
      : 0;

    return {
      isInitialized: this.isInitialized,
      totalPatterns: this.database?.patterns.length || 0,
      supportedLoadTypes: ['general', 'hvac', 'evse', 'solar'],
      averageConfidence: avgConfidence,
      recognitionHistory: this.recognitionHistory.length
    };
  }
}

export default ComponentRecognitionService;