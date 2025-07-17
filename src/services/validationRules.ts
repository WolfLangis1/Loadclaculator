import type { SLDDiagram, SLDConnection } from '../types/sld';
import type { LoadState } from '../types/load';
import { validateWireSizing, validateVoltageDrop, type NECViolation } from './necComplianceEngine';
import type { ValidationRule } from '../types/nec-validator';

// NEC validation rules for SLD diagrams
export const NEC_VALIDATION_RULES: ValidationRule[] = [
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
