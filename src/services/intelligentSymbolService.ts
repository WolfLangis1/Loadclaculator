/**
 * Intelligent Symbol Recognition Service
 * 
 * AI-powered symbol suggestion and auto-placement for electrical diagrams
 */

import { createComponentLogger } from './loggingService';
import type { LoadState } from '../types';
import type { ComponentTemplate } from '../data/componentTemplates';

interface SymbolContext {
  nearbyComponents: ComponentTemplate[];
  electricalLoad?: {
    type: 'general' | 'hvac' | 'evse' | 'solar';
    amperage: number;
    voltage: number;
    phases: 1 | 3;
  };
  locationHint?: {
    x: number;
    y: number;
    purpose: 'main_panel' | 'sub_panel' | 'load_center' | 'meter' | 'service_entrance';
  };
  necRequirements?: string[];
}

interface SymbolSuggestion {
  componentId: string;
  confidence: number;
  reason: string;
  necCompliance: {
    article: string;
    requirement: string;
    mandatory: boolean;
  }[];
  placementHint: {
    x: number;
    y: number;
    orientation: number;
  };
}

interface ElectricalPattern {
  name: string;
  description: string;
  components: string[];
  requirements: {
    spacing: number;
    sequence: string[];
    necReference: string;
  };
}

export class IntelligentSymbolService {
  private static logger = createComponentLogger('IntelligentSymbolService');

  // Common electrical patterns for recognition
  private static ELECTRICAL_PATTERNS: ElectricalPattern[] = [
    {
      name: 'Service Entrance',
      description: 'Main electrical service entry point',
      components: ['utility_meter', 'main_disconnect', 'main_panel'],
      requirements: {
        spacing: 36, // 3 feet minimum
        sequence: ['utility_meter', 'main_disconnect', 'main_panel'],
        necReference: 'NEC 230.70'
      }
    },
    {
      name: 'Solar PV Array',
      description: 'Photovoltaic system components',
      components: ['pv_array', 'dc_disconnect', 'inverter', 'ac_disconnect', 'production_meter'],
      requirements: {
        spacing: 24, // 2 feet minimum
        sequence: ['pv_array', 'dc_disconnect', 'inverter', 'ac_disconnect', 'production_meter'],
        necReference: 'NEC 690'
      }
    },
    {
      name: 'EVSE Installation',
      description: 'Electric vehicle charging station',
      components: ['evse_charger', 'evse_disconnect', 'dedicated_breaker'],
      requirements: {
        spacing: 18, // 1.5 feet minimum
        sequence: ['dedicated_breaker', 'evse_disconnect', 'evse_charger'],
        necReference: 'NEC 625'
      }
    },
    {
      name: 'Motor Control Center',
      description: 'Motor starter and protection',
      components: ['motor', 'motor_starter', 'overload_protection', 'disconnect'],
      requirements: {
        spacing: 30, // 2.5 feet minimum
        sequence: ['disconnect', 'motor_starter', 'overload_protection', 'motor'],
        necReference: 'NEC 430'
      }
    },
    {
      name: 'Transfer Switch Setup',
      description: 'Backup power transfer arrangement',
      components: ['generator', 'transfer_switch', 'main_panel'],
      requirements: {
        spacing: 36, // 3 feet minimum
        sequence: ['generator', 'transfer_switch', 'main_panel'],
        necReference: 'NEC 702'
      }
    }
  ];

  // NEC-based component requirements
  private static NEC_REQUIREMENTS = {
    'main_panel': {
      clearances: {
        front: 36, // 3 feet
        sides: 30, // 30 inches
        top: 30    // 30 inches
      },
      article: 'NEC 110.26',
      description: 'Working space around electrical equipment'
    },
    'pv_array': {
      setbacks: {
        roof_edge: 36, // 3 feet
        fire_setback: 36, // 3 feet
        obstruction: 12 // 1 foot
      },
      article: 'NEC 690.12',
      description: 'Rapid shutdown and fire setback requirements'
    },
    'evse_charger': {
      clearances: {
        front: 36, // 3 feet
        cord_reach: 25 // 25 feet maximum
      },
      article: 'NEC 625.17',
      description: 'EVSE location and cord length requirements'
    }
  };

  /**
   * Analyze load calculator data and suggest appropriate electrical symbols
   */
  static analyzeLoadDataForSymbols(loadState: LoadState): SymbolSuggestion[] {
    this.logger.info('Analyzing load data for symbol suggestions');
    
    const suggestions: SymbolSuggestion[] = [];
    let yPosition = 100; // Starting Y position for suggestions

    // Main service components (always needed)
    suggestions.push({
      componentId: 'utility_meter',
      confidence: 1.0,
      reason: 'Required for all electrical services',
      necCompliance: [{
        article: 'NEC 230.82',
        requirement: 'Meter location and accessibility',
        mandatory: true
      }],
      placementHint: { x: 100, y: yPosition, orientation: 0 }
    });

    yPosition += 80;

    suggestions.push({
      componentId: 'main_panel',
      confidence: 1.0,
      reason: `Main panel for ${loadState.mainBreaker}A service`,
      necCompliance: [{
        article: 'NEC 408.36',
        requirement: 'Panel board overcurrent protection',
        mandatory: true
      }],
      placementHint: { x: 100, y: yPosition, orientation: 0 }
    });

    yPosition += 120;

    // Analyze HVAC loads
    if (loadState.loads.hvacLoads && loadState.loads.hvacLoads.length > 0) {
      loadState.loads.hvacLoads.forEach((hvac, index) => {
        if (hvac.amperage > 0) {
          suggestions.push({
            componentId: 'hvac_disconnect',
            confidence: 0.9,
            reason: `Disconnect required for ${hvac.description} (${hvac.amperage}A)`,
            necCompliance: [{
              article: 'NEC 440.14',
              requirement: 'HVAC disconnect within sight',
              mandatory: true
            }],
            placementHint: { x: 300 + (index * 100), y: yPosition, orientation: 0 }
          });

          suggestions.push({
            componentId: 'motor_three_phase',
            confidence: 0.8,
            reason: `HVAC unit: ${hvac.description}`,
            necCompliance: [{
              article: 'NEC 440.32',
              requirement: 'Motor overload protection',
              mandatory: true
            }],
            placementHint: { x: 300 + (index * 100), y: yPosition + 60, orientation: 0 }
          });
        }
      });
      yPosition += 150;
    }

    // Analyze EVSE loads
    if (loadState.loads.evseLoads && loadState.loads.evseLoads.length > 0) {
      loadState.loads.evseLoads.forEach((evse, index) => {
        if (evse.amperage > 0) {
          suggestions.push({
            componentId: 'evse_charger',
            confidence: 0.95,
            reason: `EVSE charger: ${evse.amperage}A`,
            necCompliance: [{
              article: 'NEC 625.41',
              requirement: 'EVSE ventilation and location',
              mandatory: true
            }],
            placementHint: { x: 500 + (index * 120), y: yPosition, orientation: 0 }
          });

          suggestions.push({
            componentId: 'evse_disconnect',
            confidence: 0.9,
            reason: `Disconnect for EVSE ${evse.amperage}A circuit`,
            necCompliance: [{
              article: 'NEC 625.23',
              requirement: 'EVSE disconnect switch',
              mandatory: true
            }],
            placementHint: { x: 500 + (index * 120), y: yPosition - 60, orientation: 0 }
          });
        }
      });
      yPosition += 150;
    }

    // Analyze solar/battery systems
    if (loadState.loads.solarBatteryLoads && loadState.loads.solarBatteryLoads.length > 0) {
      const solarSystems = loadState.loads.solarBatteryLoads.filter(s => s.systemSizeKW > 0);
      
      solarSystems.forEach((solar, index) => {
        suggestions.push({
          componentId: 'pv_array',
          confidence: 0.95,
          reason: `Solar PV array: ${solar.systemSizeKW}kW`,
          necCompliance: [{
            article: 'NEC 690.12',
            requirement: 'PV array rapid shutdown',
            mandatory: true
          }],
          placementHint: { x: 200 + (index * 150), y: 50, orientation: 0 }
        });

        suggestions.push({
          componentId: 'dc_disconnect',
          confidence: 0.9,
          reason: 'DC disconnect for PV array',
          necCompliance: [{
            article: 'NEC 690.15',
            requirement: 'PV DC disconnect',
            mandatory: true
          }],
          placementHint: { x: 200 + (index * 150), y: 130, orientation: 0 }
        });

        suggestions.push({
          componentId: 'inverter',
          confidence: 0.9,
          reason: `Inverter for ${solar.systemSizeKW}kW system`,
          necCompliance: [{
            article: 'NEC 690.60',
            requirement: 'Inverter identification',
            mandatory: true
          }],
          placementHint: { x: 200 + (index * 150), y: 210, orientation: 0 }
        });

        suggestions.push({
          componentId: 'ac_disconnect',
          confidence: 0.9,
          reason: 'AC disconnect for inverter',
          necCompliance: [{
            article: 'NEC 690.64',
            requirement: 'Inverter AC disconnect',
            mandatory: true
          }],
          placementHint: { x: 200 + (index * 150), y: 290, orientation: 0 }
        });
      });
    }

    this.logger.info('Generated symbol suggestions', { 
      count: suggestions.length,
      types: suggestions.map(s => s.componentId)
    });

    return suggestions;
  }

  /**
   * Suggest symbols based on nearby components and electrical context
   */
  static suggestSymbolsForContext(context: SymbolContext): SymbolSuggestion[] {
    const suggestions: SymbolSuggestion[] = [];

    // Analyze nearby components for patterns
    const nearbyTypes = context.nearbyComponents.map(c => c.type);
    
    // Check for known electrical patterns
    for (const pattern of this.ELECTRICAL_PATTERNS) {
      const matchingComponents = pattern.components.filter(comp => 
        nearbyTypes.includes(comp)
      );

      if (matchingComponents.length > 0) {
        // Suggest missing components from the pattern
        const missingComponents = pattern.components.filter(comp => 
          !nearbyTypes.includes(comp)
        );

        missingComponents.forEach((componentType, index) => {
          suggestions.push({
            componentId: componentType,
            confidence: 0.8 - (index * 0.1), // Decrease confidence for later components
            reason: `Completes ${pattern.name} pattern`,
            necCompliance: [{
              article: pattern.requirements.necReference,
              requirement: pattern.description,
              mandatory: true
            }],
            placementHint: {
              x: (context.locationHint?.x || 0) + (index * pattern.requirements.spacing),
              y: (context.locationHint?.y || 0) + 50,
              orientation: 0
            }
          });
        });
      }
    }

    // Electrical load-based suggestions
    if (context.electricalLoad) {
      const load = context.electricalLoad;
      
      switch (load.type) {
        case 'hvac':
          suggestions.push({
            componentId: 'hvac_disconnect',
            confidence: 0.9,
            reason: `Required disconnect for ${load.amperage}A HVAC load`,
            necCompliance: [{
              article: 'NEC 440.14',
              requirement: 'HVAC equipment disconnect',
              mandatory: true
            }],
            placementHint: {
              x: (context.locationHint?.x || 0) + 60,
              y: (context.locationHint?.y || 0),
              orientation: 0
            }
          });
          break;

        case 'evse':
          suggestions.push({
            componentId: 'evse_disconnect',
            confidence: 0.95,
            reason: `Disconnect for ${load.amperage}A EVSE`,
            necCompliance: [{
              article: 'NEC 625.23',
              requirement: 'EVSE disconnect switch',
              mandatory: true
            }],
            placementHint: {
              x: (context.locationHint?.x || 0),
              y: (context.locationHint?.y || 0) - 40,
              orientation: 0
            }
          });
          break;

        case 'solar':
          if (!nearbyTypes.includes('dc_disconnect')) {
            suggestions.push({
              componentId: 'dc_disconnect',
              confidence: 0.9,
              reason: 'Required DC disconnect for solar PV',
              necCompliance: [{
                article: 'NEC 690.15',
                requirement: 'PV DC disconnect',
                mandatory: true
              }],
              placementHint: {
                x: (context.locationHint?.x || 0),
                y: (context.locationHint?.y || 0) + 60,
                orientation: 0
              }
            });
          }
          break;
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate component placement against NEC requirements
   */
  static validateComponentPlacement(
    componentType: string, 
    position: { x: number; y: number },
    nearbyComponents: Array<{ type: string; position: { x: number; y: number } }>
  ): { valid: boolean; violations: string[]; suggestions: string[] } {
    const violations: string[] = [];
    const suggestions: string[] = [];
    
    const requirements = this.NEC_REQUIREMENTS[componentType as keyof typeof this.NEC_REQUIREMENTS];
    
    if (!requirements) {
      return { valid: true, violations: [], suggestions: [] };
    }

    // Check clearances for components that require them
    if ('clearances' in requirements) {
      nearbyComponents.forEach(nearby => {
        const distance = Math.sqrt(
          Math.pow(position.x - nearby.position.x, 2) + 
          Math.pow(position.y - nearby.position.y, 2)
        );

        if (distance < requirements.clearances.front) {
          violations.push(
            `Insufficient clearance to ${nearby.type}. ` +
            `Required: ${requirements.clearances.front}", Current: ${distance.toFixed(1)}"`
          );
          suggestions.push(
            `Move component ${requirements.clearances.front}" away from ${nearby.type} per ${requirements.article}`
          );
        }
      });
    }

    // Check setbacks for components that require them
    if ('setbacks' in requirements) {
      // This would integrate with roof edge detection in aerial view
      suggestions.push(
        `Verify setbacks meet ${requirements.article} requirements`
      );
    }

    return {
      valid: violations.length === 0,
      violations,
      suggestions
    };
  }

  /**
   * Auto-route connections between components based on electrical standards
   */
  static suggestWireRouting(
    fromComponent: { type: string; position: { x: number; y: number } },
    toComponent: { type: string; position: { x: number; y: number } },
    obstacleComponents: Array<{ position: { x: number; y: number }; size: { width: number; height: number } }>
  ): { path: Array<{ x: number; y: number }>; wireType: string; conduitRequired: boolean } {
    
    const start = fromComponent.position;
    const end = toComponent.position;

    // Simple routing algorithm (would be enhanced with proper pathfinding)
    const path = [start];
    
    // Check if direct path is clear
    const directPath = this.isPathClear(start, end, obstacleComponents);
    
    if (directPath) {
      path.push(end);
    } else {
      // Create L-shaped path around obstacles
      const midPoint = { x: start.x, y: end.y };
      path.push(midPoint);
      path.push(end);
    }

    // Determine wire type based on component types
    let wireType = 'copper_thwn';
    let conduitRequired = false;

    if (fromComponent.type.includes('solar') || toComponent.type.includes('solar')) {
      wireType = 'pv_wire';
      conduitRequired = true;
    }

    if (fromComponent.type.includes('evse') || toComponent.type.includes('evse')) {
      conduitRequired = true;
    }

    return { path, wireType, conduitRequired };
  }

  /**
   * Check if path between two points is clear of obstacles
   */
  private static isPathClear(
    start: { x: number; y: number },
    end: { x: number; y: number },
    obstacles: Array<{ position: { x: number; y: number }; size: { width: number; height: number } }>
  ): boolean {
    // Simplified line-rectangle intersection check
    return obstacles.every(obstacle => {
      const rect = {
        left: obstacle.position.x,
        right: obstacle.position.x + obstacle.size.width,
        top: obstacle.position.y,
        bottom: obstacle.position.y + obstacle.size.height
      };

      // Basic line-rectangle intersection (would be enhanced)
      return !this.lineIntersectsRect(start, end, rect);
    });
  }

  /**
   * Check if line intersects rectangle
   */
  private static lineIntersectsRect(
    start: { x: number; y: number },
    end: { x: number; y: number },
    rect: { left: number; right: number; top: number; bottom: number }
  ): boolean {
    // Simplified implementation - would use proper line-rectangle intersection
    const lineLeft = Math.min(start.x, end.x);
    const lineRight = Math.max(start.x, end.x);
    const lineTop = Math.min(start.y, end.y);
    const lineBottom = Math.max(start.y, end.y);

    return !(lineRight < rect.left || 
             lineLeft > rect.right || 
             lineBottom < rect.top || 
             lineTop > rect.bottom);
  }
}