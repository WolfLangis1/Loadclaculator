/**
 * Real-Time NEC Compliance Validator for SLD Diagrams
 * 
 * Provides continuous validation of electrical diagrams against NEC requirements
 * Integrates with intelligent SLD generation and manual editing workflows
 * 
 * Consolidated from: sldNECEngine.ts, sldNECComplianceService.ts, necComplianceEngine.ts
 * for better organization and reduced duplication
 */

import type { SLDComponent, SLDConnection, SLDDiagram } from '../types/sld';
import type { LoadState } from '../types/load';
import { 
  analyzeCircuit, 
  generateComplianceReport, 
  validateWireSizing, 
  validateVoltageDrop,
  type NECViolation,
  type ComplianceAnalysis 
} from './necComplianceEngine';

export interface RealTimeValidationResult {
  overallCompliance: boolean;
  totalViolations: number;
  criticalViolations: number;
  warningViolations: number;
  componentViolations: Map<string, NECViolation[]>;
  connectionViolations: Map<string, NECViolation[]>;
  systemViolations: NECViolation[];
  recommendations: string[];
  complianceScore: number; // 0-100
  lastValidated: Date;
}

export interface ValidationRule {
  id: string;
  name: string;
  necSection: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'component' | 'connection' | 'system' | 'layout';
  validator: (diagram: SLDDiagram, loads?: LoadState) => NECViolation[];
}

// NEC validation rules for SLD diagrams
const NEC_VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'service-disconnect-location',
    name: 'Service Disconnect Location',
    necSection: 'NEC 230.70',
    description: 'Service disconnect must be readily accessible',
    severity: 'error',
    category: 'component',
    validator: (diagram) => {
      const violations: NECViolation[] = [];
      const serviceDisconnects = diagram.components.filter(c => 
        c.type === 'service_disconnect' || c.type === 'main_disconnect'
      );
      
      if (serviceDisconnects.length === 0) {
        violations.push({
          code: 'NEC-230-70-001',
          section: '230.70',
          description: 'Service disconnect is required and must be readily accessible',
          severity: 'error',
          recommendation: 'Add service disconnect component to diagram'
        });
      }
      
      return violations;
    }
  },
  {
    id: 'grounding-electrode-required',
    name: 'Grounding Electrode System',
    necSection: 'NEC 250.50',
    description: 'Grounding electrode system is required',
    severity: 'error',
    category: 'system',
    validator: (diagram) => {
      const violations: NECViolation[] = [];
      const groundingElectrodes = diagram.components.filter(c => 
        c.type === 'grounding_electrode'
      );
      
      if (groundingElectrodes.length === 0) {
        violations.push({
          code: 'NEC-250-50-001',
          section: '250.50',
          description: 'Grounding electrode system is required for all electrical services',
          severity: 'error',
          recommendation: 'Add grounding electrode component (rod, plate, or concrete-encased electrode)'
        });
      }
      
      return violations;
    }
  },
  {
    id: 'circuit-breaker-ratings',
    name: 'Circuit Breaker Standard Ratings',
    necSection: 'NEC 240.6',
    description: 'Circuit breakers must use standard ampere ratings',
    severity: 'error',
    category: 'component',
    validator: (diagram) => {
      const violations: NECViolation[] = [];
      const standardRatings = [15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 100, 110, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500, 600, 700, 800, 1000, 1200, 1600, 2000, 2500, 3000, 4000, 5000, 6000];
      
      diagram.components
        .filter(c => c.type === 'breaker' || c.type === 'circuit_breaker')
        .forEach(component => {
          const rating = parseInt(component.specifications?.rating?.replace('A', '') || '0');
          if (rating > 0 && !standardRatings.includes(rating)) {
            violations.push({
              code: 'NEC-240-6-001',
              section: '240.6',
              description: `Non-standard breaker rating: ${rating}A`,
              severity: 'error',
              recommendation: `Use standard ampere rating closest to calculated load`
            });
          }
        });
      
      return violations;
    }
  },
  {
    id: 'evse-continuous-load-factor',
    name: 'EVSE Continuous Load Factor',
    necSection: 'NEC 625.17',
    description: 'EVSE circuits require 125% continuous load factor',
    severity: 'error',
    category: 'connection',
    validator: (diagram) => {
      const violations: NECViolation[] = [];
      
      diagram.components
        .filter(c => c.type === 'evse_charger' || c.type === 'ev_charger')
        .forEach(component => {
          const rating = parseInt(component.specifications?.rating?.replace('A', '') || '0');
          if (rating > 0) {
            const connections = diagram.connections?.filter(conn => 
              conn.to === component.id || conn.from === component.id
            );
            
            connections?.forEach(connection => {
              const wireRating = parseInt(connection.specifications?.ampacity || '0');
              const requiredRating = Math.ceil(rating * 1.25);
              
              if (wireRating < requiredRating) {
                violations.push({
                  code: 'NEC-625-17-001',
                  section: '625.17',
                  description: `EVSE circuit requires 125% continuous load factor: ${requiredRating}A minimum`,
                  severity: 'error',
                  recommendation: `Increase wire size to handle ${requiredRating}A continuous load`
                });
              }
            });
          }
        });
      
      return violations;
    }
  },
  {
    id: 'solar-rapid-shutdown',
    name: 'Solar PV Rapid Shutdown',
    necSection: 'NEC 690.12',
    description: 'Solar PV systems require rapid shutdown capability',
    severity: 'warning',
    category: 'system',
    validator: (diagram) => {
      const violations: NECViolation[] = [];
      const pvArrays = diagram.components.filter(c => c.type === 'pv_array');
      const rapidShutdownDevices = diagram.components.filter(c => 
        c.specifications?.rapidShutdown === true ||
        c.name?.toLowerCase().includes('rapid shutdown')
      );
      
      if (pvArrays.length > 0 && rapidShutdownDevices.length === 0) {
        violations.push({
          code: 'NEC-690-12-001',
          section: '690.12',
          description: 'PV systems require rapid shutdown devices or system',
          severity: 'warning',
          recommendation: 'Add rapid shutdown device or verify system compliance with NEC 690.12'
        });
      }
      
      return violations;
    }
  },
  {
    id: 'solar-120-percent-rule',
    name: 'Solar 120% Interconnection Rule',
    necSection: 'NEC 705.12(B)(3)(2)',
    description: 'Solar interconnection must not exceed 120% of bus rating',
    severity: 'error',
    category: 'system',
    validator: (diagram, loads) => {
      const violations: NECViolation[] = [];
      const mainPanels = diagram.components.filter(c => c.type === 'main_panel');
      const solarInverters = diagram.components.filter(c => c.type === 'inverter' || c.type === 'solar_inverter');
      
      mainPanels.forEach(panel => {
        const busRating = panel.specifications?.rating ? parseInt(panel.specifications.rating.replace('A', '')) : 200;
        const maxAllowed = busRating * 1.2;
        
        // Calculate main breaker and solar breaker total
        const mainBreaker = busRating; // Main breaker typically equals bus rating
        let solarBreaker = 0;
        
        solarInverters.forEach(inverter => {
          const rating = parseInt(inverter.specifications?.rating?.replace('A', '') || '0');
          solarBreaker += rating;
        });
        
        const totalBreakers = mainBreaker + solarBreaker;
        
        if (totalBreakers > maxAllowed) {
          violations.push({
            code: 'NEC-705-12-001',
            section: '705.12(B)(3)(2)',
            description: `Solar interconnection exceeds 120% rule: ${totalBreakers}A > ${maxAllowed}A`,
            severity: 'error',
            recommendation: 'Reduce solar inverter size or upgrade electrical service'
          });
        }
      });
      
      return violations;
    }
  },
  {
    id: 'wire-color-coding',
    name: 'Wire Color Coding Standards',
    necSection: 'NEC 200.6',
    description: 'Proper wire color coding for identification',
    severity: 'warning',
    category: 'connection',
    validator: (diagram) => {
      const violations: NECViolation[] = [];
      
      diagram.connections?.forEach(connection => {
        const wireType = connection.type;
        const voltage = connection.voltage || 120;
        
        // Check for proper color coding indicators in specifications
        if (wireType === 'ground' && !connection.specifications?.material?.includes('green')) {
          violations.push({
            code: 'NEC-200-6-001',
            section: '200.6',
            description: 'Ground wires should be identified with green color coding',
            severity: 'warning',
            recommendation: 'Add green color identification for grounding conductors'
          });
        }
        
        if (voltage >= 480 && wireType === 'power') {
          violations.push({
            code: 'NEC-200-6-002',
            section: '200.6',
            description: 'High voltage circuits require proper phase identification',
            severity: 'warning',
            recommendation: 'Add phase color coding (brown/orange/yellow for 480V)'
          });
        }
      });
      
      return violations;
    }
  }
];

/**
 * Real-time NEC validator class
 */
export class RealTimeNECValidator {
  private validationCache = new Map<string, RealTimeValidationResult>();
  private debounceTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 500; // 500ms debounce for real-time validation

  /**
   * Validate SLD diagram in real-time with debouncing
   */
  validateDiagramRealTime(
    diagram: SLDDiagram,
    loads?: LoadState,
    callback?: (result: RealTimeValidationResult) => void
  ): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(() => {
      const result = this.validateDiagram(diagram, loads);
      callback?.(result);
    }, this.DEBOUNCE_MS);
  }

  /**
   * Immediate validation of SLD diagram
   */
  validateDiagram(diagram: SLDDiagram, loads?: LoadState): RealTimeValidationResult {
    const cacheKey = this.generateCacheKey(diagram);
    
    // Check cache for recent validation
    const cached = this.validationCache.get(cacheKey);
    if (cached && Date.now() - cached.lastValidated.getTime() < 5000) {
      return cached;
    }

    const componentViolations = new Map<string, NECViolation[]>();
    const connectionViolations = new Map<string, NECViolation[]>();
    const systemViolations: NECViolation[] = [];

    let totalViolations = 0;
    let criticalViolations = 0;
    let warningViolations = 0;

    // Run all validation rules
    for (const rule of NEC_VALIDATION_RULES) {
      try {
        const violations = rule.validator(diagram, loads);
        
        violations.forEach(violation => {
          totalViolations++;
          if (violation.severity === 'error') criticalViolations++;
          if (violation.severity === 'warning') warningViolations++;

          // Categorize violations
          if (rule.category === 'system') {
            systemViolations.push(violation);
          } else if (rule.category === 'component') {
            // Associate with relevant components
            diagram.components.forEach(component => {
              if (violation.description.includes(component.type) || 
                  violation.description.includes(component.name || '')) {
                const existing = componentViolations.get(component.id) || [];
                existing.push(violation);
                componentViolations.set(component.id, existing);
              }
            });
          } else if (rule.category === 'connection') {
            // Associate with relevant connections
            diagram.connections?.forEach(connection => {
              if (violation.description.includes(connection.type) ||
                  violation.description.includes(connection.specifications?.wireSize || '')) {
                const existing = connectionViolations.get(connection.id) || [];
                existing.push(violation);
                connectionViolations.set(connection.id, existing);
              }
            });
          }
        });
      } catch (error) {
        console.warn(`Validation rule ${rule.id} failed:`, error);
      }
    }

    // Validate individual wire connections
    if (diagram.connections && diagram.components) {
      diagram.connections.forEach(connection => {
        const sourceComponent = diagram.components.find(c => c.id === connection.from);
        const targetComponent = diagram.components.find(c => c.id === connection.to);
        
        if (sourceComponent && targetComponent) {
          const wireSize = connection.specifications?.wireSize || '12';
          const voltage = connection.voltage || 240;
          const current = connection.current || 20;
          
          // Validate wire sizing
          const wireSizingViolations = validateWireSizing(
            current,
            voltage,
            wireSize,
            'copper',
            '75C',
            3,
            30,
            false,
            false
          );
          
          if (wireSizingViolations.length > 0) {
            const existing = connectionViolations.get(connection.id) || [];
            existing.push(...wireSizingViolations);
            connectionViolations.set(connection.id, existing);
            
            wireSizingViolations.forEach(v => {
              totalViolations++;
              if (v.severity === 'error') criticalViolations++;
              if (v.severity === 'warning') warningViolations++;
            });
          }
        }
      });
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      componentViolations,
      connectionViolations,
      systemViolations
    );

    // Calculate compliance score
    const complianceScore = this.calculateComplianceScore(
      totalViolations,
      criticalViolations,
      warningViolations,
      diagram.components.length
    );

    const result: RealTimeValidationResult = {
      overallCompliance: criticalViolations === 0,
      totalViolations,
      criticalViolations,
      warningViolations,
      componentViolations,
      connectionViolations,
      systemViolations,
      recommendations,
      complianceScore,
      lastValidated: new Date()
    };

    // Cache result
    this.validationCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Generate actionable recommendations based on violations
   */
  private generateRecommendations(
    componentViolations: Map<string, NECViolation[]>,
    connectionViolations: Map<string, NECViolation[]>,
    systemViolations: NECViolation[]
  ): string[] {
    const recommendations: string[] = [];

    // Priority recommendations for critical violations
    const criticalViolations = [
      ...Array.from(componentViolations.values()).flat(),
      ...Array.from(connectionViolations.values()).flat(),
      ...systemViolations
    ].filter(v => v.severity === 'error');

    if (criticalViolations.length > 0) {
      recommendations.push('🚨 Critical: Address all error-level violations before proceeding');
      
      // Group recommendations by NEC section
      const sectionRecommendations = new Map<string, string[]>();
      criticalViolations.forEach(violation => {
        if (violation.recommendation) {
          const section = violation.section;
          const existing = sectionRecommendations.get(section) || [];
          existing.push(violation.recommendation);
          sectionRecommendations.set(section, existing);
        }
      });

      sectionRecommendations.forEach((recs, section) => {
        recommendations.push(`${section}: ${recs[0]}`);
      });
    }

    // General recommendations
    if (componentViolations.size > 0) {
      recommendations.push('Review component specifications and ratings');
    }
    
    if (connectionViolations.size > 0) {
      recommendations.push('Verify wire sizing and connection specifications');
    }
    
    if (systemViolations.length > 0) {
      recommendations.push('Address system-level NEC requirements');
    }

    return recommendations;
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(
    totalViolations: number,
    criticalViolations: number,
    warningViolations: number,
    componentCount: number
  ): number {
    if (totalViolations === 0) return 100;

    // Base score starts at 100
    let score = 100;

    // Deduct points for violations
    score -= criticalViolations * 20; // Critical violations: -20 points each
    score -= warningViolations * 5;   // Warning violations: -5 points each

    // Adjust for diagram complexity
    const complexityFactor = Math.min(componentCount / 10, 1); // More components = more tolerance
    score += complexityFactor * 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate cache key for diagram
   */
  private generateCacheKey(diagram: SLDDiagram): string {
    const componentHash = diagram.components
      .map(c => `${c.id}-${c.type}-${JSON.stringify(c.specifications)}`)
      .join('|');
    
    const connectionHash = diagram.connections
      ?.map(c => `${c.id}-${c.type}-${JSON.stringify(c.specifications)}`)
      .join('|') || '';

    return `${diagram.id}-${componentHash}-${connectionHash}`.slice(0, 100);
  }

  /**
   * Get validation summary for display
   */
  getValidationSummary(result: RealTimeValidationResult): string {
    if (result.overallCompliance) {
      return `✅ NEC Compliant (${result.complianceScore}% score)`;
    } else {
      return `⚠️ ${result.criticalViolations} Critical, ${result.warningViolations} Warnings (${result.complianceScore}% score)`;
    }
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }
}

export default RealTimeNECValidator;