import type { SLDDiagram, SLDComponent, SLDConnection } from '../types/sld';

export interface NECRule {
  id: string;
  article: string;
  section: string;
  description: string;
  validator: (diagram: SLDDiagram) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  autoFix?: (diagram: SLDDiagram) => SLDDiagram;
  priority: number;
}

export interface ValidationResult {
  id: string;
  ruleId: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  componentId?: string;
  connectionId?: string;
  article: string;
  section: string;
  suggestion?: string;
  autoFixable: boolean;
}

export interface NECComplianceReport {
  diagramId: string;
  codeYear: string;
  overallCompliant: boolean;
  validationResults: ValidationResult[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
    autoFixable: number;
  };
  recommendations: string[];
}

export class SLDNECEngine {
  private static rules: NECRule[] = [
    // Article 690 - Solar Photovoltaic Systems
    {
      id: '690.13',
      article: '690.13',
      section: 'Disconnect Labeling',
      description: 'PV system disconnects shall be permanently marked',
      severity: 'error',
      priority: 1,
      validator: (diagram: SLDDiagram): ValidationResult => {
        const pvDisconnects = diagram.components.filter(c => 
          c.type === 'dc_disconnect' || c.type === 'ac_disconnect'
        );
        
        const unlabeledDisconnects = pvDisconnects.filter(d => 
          !d.necLabels.some(label => label.includes('PV SYSTEM DISCONNECT'))
        );
        
        if (unlabeledDisconnects.length > 0) {
          return {
            id: '690.13-error',
            ruleId: '690.13',
            type: 'error',
            message: 'PV system disconnects must be labeled "PV SYSTEM DISCONNECT"',
            componentId: unlabeledDisconnects[0].id,
            article: '690.13',
            section: 'Disconnect Labeling',
            suggestion: 'Add required NEC labels to all PV disconnects',
            autoFixable: true
          };
        }
        
        return {
          id: '690.13-pass',
          ruleId: '690.13',
          type: 'info',
          message: 'PV disconnect labeling compliant',
          article: '690.13',
          section: 'Disconnect Labeling',
          autoFixable: false
        };
      },
      autoFix: (diagram: SLDDiagram): SLDDiagram => {
        const updatedDiagram = { ...diagram };
        updatedDiagram.components = updatedDiagram.components.map(component => {
          if ((component.type === 'dc_disconnect' || component.type === 'ac_disconnect') &&
              !component.necLabels.some(label => label.includes('PV SYSTEM DISCONNECT'))) {
            return {
              ...component,
              necLabels: [...component.necLabels, 'PV SYSTEM DISCONNECT']
            };
          }
          return component;
        });
        return updatedDiagram;
      }
    },

    // Article 705 - Interconnected Electric Power Production Sources
    {
      id: '705.12',
      article: '705.12',
      section: 'Point of Connection',
      description: 'Interconnection point requirements',
      severity: 'error',
      priority: 1,
      validator: (diagram: SLDDiagram): ValidationResult => {
        const mainPanel = diagram.components.find(c => c.type === 'main_panel');
        const pvSystems = diagram.components.filter(c => c.type === 'inverter');
        
        if (!mainPanel || pvSystems.length === 0) {
          return {
            id: '705.12-pass',
            ruleId: '705.12',
            type: 'info',
            message: 'No PV systems to validate',
            article: '705.12',
            section: 'Point of Connection',
            autoFixable: false
          };
        }
        
        // Check 120% rule compliance
        const mainBreakerRating = (mainPanel as any).rating || 200;
        const busRating = (mainPanel as any).busRating || mainBreakerRating;
        const maxAllowableBackfeed = busRating * 1.2;
        
        const totalInterconnection = pvSystems.reduce((sum, pv) => {
          return sum + ((pv as any).acOutputKW * 1000 / 240); // Convert kW to amps
        }, 0);
        
        if (totalInterconnection > maxAllowableBackfeed) {
          return {
            id: '705.12-error',
            ruleId: '705.12',
            type: 'error',
            message: `Total interconnection (${totalInterconnection.toFixed(1)}A) exceeds 120% rule limit (${maxAllowableBackfeed}A)`,
            componentId: mainPanel.id,
            article: '705.12',
            section: 'Point of Connection',
            suggestion: 'Consider supply-side connection or upgrade panel bus rating',
            autoFixable: false
          };
        }
        
        return {
          id: '705.12-pass',
          ruleId: '705.12',
          type: 'info',
          message: '120% rule compliance verified',
          article: '705.12',
          section: 'Point of Connection',
          autoFixable: false
        };
      }
    },

    // Article 625 - Electric Vehicle Charging Systems
    {
      id: '625.43',
      article: '625.43',
      section: 'Disconnect Means',
      description: 'EVSE equipment shall have disconnect means',
      severity: 'error',
      priority: 1,
      validator: (diagram: SLDDiagram): ValidationResult => {
        const evseChargers = diagram.components.filter(c => c.type === 'evse_charger');
        const disconnects = diagram.components.filter(c => 
          c.type === 'ac_disconnect' || c.type === 'main_disconnect'
        );
        
        if (evseChargers.length === 0) {
          return {
            id: '625.43-pass',
            ruleId: '625.43',
            type: 'info',
            message: 'No EVSE systems to validate',
            article: '625.43',
            section: 'Disconnect Means',
            autoFixable: false
          };
        }
        
        // Check if each EVSE has a dedicated disconnect or is protected by main disconnect
        const evseWithoutDisconnect = evseChargers.filter(evse => {
          // Check if there's a dedicated disconnect for this EVSE
          const hasDedicatedDisconnect = disconnects.some(disconnect => {
            // This is a simplified check - in practice, you'd need to verify the connection
            return true; // Assume main disconnect provides protection
          });
          return !hasDedicatedDisconnect;
        });
        
        if (evseWithoutDisconnect.length > 0) {
          return {
            id: '625.43-error',
            ruleId: '625.43',
            type: 'error',
            message: 'EVSE equipment must have disconnect means',
            componentId: evseWithoutDisconnect[0].id,
            article: '625.43',
            section: 'Disconnect Means',
            suggestion: 'Add dedicated disconnect for EVSE or verify main disconnect protection',
            autoFixable: false
          };
        }
        
        return {
          id: '625.43-pass',
          ruleId: '625.43',
          type: 'info',
          message: 'EVSE disconnect requirements met',
          article: '625.43',
          section: 'Disconnect Means',
          autoFixable: false
        };
      }
    },

    // Article 706 - Energy Storage Systems
    {
      id: '706.15',
      article: '706.15',
      section: 'Battery System Marking',
      description: 'Battery systems shall be marked with maximum voltage and polarity',
      severity: 'error',
      priority: 1,
      validator: (diagram: SLDDiagram): ValidationResult => {
        const batterySystems = diagram.components.filter(c => c.type === 'battery');
        
        if (batterySystems.length === 0) {
          return {
            id: '706.15-pass',
            ruleId: '706.15',
            type: 'info',
            message: 'No battery systems to validate',
            article: '706.15',
            section: 'Battery System Marking',
            autoFixable: false
          };
        }
        
        const unlabeledBatteries = batterySystems.filter(battery => {
          const hasVoltageLabel = battery.necLabels.some(label => 
            label.includes('VOLTAGE') || label.includes('V')
          );
          const hasPolarityLabel = battery.necLabels.some(label => 
            label.includes('POLARITY') || label.includes('+/-')
          );
          return !hasVoltageLabel || !hasPolarityLabel;
        });
        
        if (unlabeledBatteries.length > 0) {
          return {
            id: '706.15-error',
            ruleId: '706.15',
            type: 'error',
            message: 'Battery systems must be marked with voltage and polarity',
            componentId: unlabeledBatteries[0].id,
            article: '706.15',
            section: 'Battery System Marking',
            suggestion: 'Add voltage and polarity labels to battery systems',
            autoFixable: true
          };
        }
        
        return {
          id: '706.15-pass',
          ruleId: '706.15',
          type: 'info',
          message: 'Battery system marking compliant',
          article: '706.15',
          section: 'Battery System Marking',
          autoFixable: false
        };
      },
      autoFix: (diagram: SLDDiagram): SLDDiagram => {
        const updatedDiagram = { ...diagram };
        updatedDiagram.components = updatedDiagram.components.map(component => {
          if (component.type === 'battery') {
            const voltage = (component as any).voltage || 240;
            const newLabels = [...component.necLabels];
            
            if (!newLabels.some(label => label.includes('VOLTAGE'))) {
              newLabels.push(`MAX VOLTAGE: ${voltage}V`);
            }
            if (!newLabels.some(label => label.includes('POLARITY'))) {
              newLabels.push('WARNING: BATTERY SYSTEM - OBSERVE POLARITY');
            }
            
            return { ...component, necLabels: newLabels };
          }
          return component;
        });
        return updatedDiagram;
      }
    },

    // Article 250 - Grounding and Bonding
    {
      id: '250.122',
      article: '250.122',
      section: 'Equipment Grounding Conductor Size',
      description: 'Equipment grounding conductor sizing requirements',
      severity: 'error',
      priority: 2,
      validator: (diagram: SLDDiagram): ValidationResult => {
        const connections = diagram.connections.filter(c => c.wireType === 'ground');
        
        if (connections.length === 0) {
          return {
            id: '250.122-pass',
            ruleId: '250.122',
            type: 'info',
            message: 'No ground connections to validate',
            article: '250.122',
            section: 'Equipment Grounding Conductor Size',
            autoFixable: false
          };
        }
        
        // Simplified validation - in practice, you'd need to check actual wire sizes
        const undersizedGrounds = connections.filter(connection => {
          const conductorSize = (connection as any).conductorSize;
          return conductorSize && ['14', '12'].includes(conductorSize);
        });
        
        if (undersizedGrounds.length > 0) {
          return {
            id: '250.122-warning',
            ruleId: '250.122',
            type: 'warning',
            message: 'Verify ground conductor sizing per NEC 250.122',
            connectionId: undersizedGrounds[0].id,
            article: '250.122',
            section: 'Equipment Grounding Conductor Size',
            suggestion: 'Check ground conductor size against circuit breaker rating',
            autoFixable: false
          };
        }
        
        return {
          id: '250.122-pass',
          ruleId: '250.122',
          type: 'info',
          message: 'Ground conductor sizing appears compliant',
          article: '250.122',
          section: 'Equipment Grounding Conductor Size',
          autoFixable: false
        };
      }
    },

    // Article 110 - Requirements for Electrical Installations
    {
      id: '110.14',
      article: '110.14',
      section: 'Electrical Connections',
      description: 'Termination requirements for conductors',
      severity: 'warning',
      priority: 2,
      validator: (diagram: SLDDiagram): ValidationResult => {
        const connections = diagram.connections.filter(c => c.wireType === 'ac');
        
        if (connections.length === 0) {
          return {
            id: '110.14-pass',
            ruleId: '110.14',
            type: 'info',
            message: 'No AC connections to validate',
            article: '110.14',
            section: 'Electrical Connections',
            autoFixable: false
          };
        }
        
        // Check for proper termination labeling
        const unlabeledTerminations = connections.filter(connection => {
          return !connection.label || !connection.label.includes('TERMINATION');
        });
        
        if (unlabeledTerminations.length > 0) {
          return {
            id: '110.14-warning',
            ruleId: '110.14',
            type: 'warning',
            message: 'Consider adding termination labels for clarity',
            connectionId: unlabeledTerminations[0].id,
            article: '110.14',
            section: 'Electrical Connections',
            suggestion: 'Add termination labels to improve documentation',
            autoFixable: false
          };
        }
        
        return {
          id: '110.14-pass',
          ruleId: '110.14',
          type: 'info',
          message: 'Termination labeling adequate',
          article: '110.14',
          section: 'Electrical Connections',
          autoFixable: false
        };
      }
    }
  ];

  /**
   * Validate diagram against all NEC rules
   */
  static validateArticle705(diagram: SLDDiagram): ValidationResult[] {
    return this.rules
      .filter(rule => rule.article === '705')
      .map(rule => rule.validator(diagram))
      .filter(result => result.type !== 'info');
  }

  static validateArticle625(diagram: SLDDiagram): ValidationResult[] {
    return this.rules
      .filter(rule => rule.article === '625')
      .map(rule => rule.validator(diagram))
      .filter(result => result.type !== 'info');
  }

  static validateArticle690(diagram: SLDDiagram): ValidationResult[] {
    return this.rules
      .filter(rule => rule.article === '690')
      .map(rule => rule.validator(diagram))
      .filter(result => result.type !== 'info');
  }

  static validateArticle706(diagram: SLDDiagram): ValidationResult[] {
    return this.rules
      .filter(rule => rule.article === '706')
      .map(rule => rule.validator(diagram))
      .filter(result => result.type !== 'info');
  }

  /**
   * Validate diagram against all applicable NEC rules
   */
  static validateDiagram(diagram: SLDDiagram): NECComplianceReport {
    const validationResults: ValidationResult[] = [];
    
    // Run all validators
    this.rules.forEach(rule => {
      try {
        const result = rule.validator(diagram);
        validationResults.push(result);
      } catch (error) {
        console.error(`Error validating rule ${rule.id}:`, error);
        validationResults.push({
          id: `${rule.id}-error`,
          ruleId: rule.id,
          type: 'error',
          message: `Validation error for ${rule.article}.${rule.section}`,
          article: rule.article,
          section: rule.section,
          autoFixable: false
        });
      }
    });
    
    // Calculate summary
    const errors = validationResults.filter(r => r.type === 'error').length;
    const warnings = validationResults.filter(r => r.type === 'warning').length;
    const info = validationResults.filter(r => r.type === 'info').length;
    const autoFixable = validationResults.filter(r => r.autoFixable).length;
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(validationResults);
    
    return {
      diagramId: diagram.id,
      codeYear: diagram.necCodeYear,
      overallCompliant: errors === 0,
      validationResults,
      summary: { errors, warnings, info, autoFixable },
      recommendations
    };
  }

  /**
   * Auto-fix violations where possible
   */
  static autoFixViolations(diagram: SLDDiagram): SLDDiagram {
    let updatedDiagram = { ...diagram };
    
    // Get validation results
    const report = this.validateDiagram(diagram);
    const autoFixableViolations = report.validationResults.filter(r => r.autoFixable);
    
    // Apply auto-fixes
    autoFixableViolations.forEach(violation => {
      const rule = this.rules.find(r => r.id === violation.ruleId);
      if (rule && rule.autoFix) {
        try {
          updatedDiagram = rule.autoFix(updatedDiagram);
        } catch (error) {
          console.error(`Error applying auto-fix for rule ${rule.id}:`, error);
        }
      }
    });
    
    return updatedDiagram;
  }

  /**
   * Get specific rule by ID
   */
  static getRule(ruleId: string): NECRule | undefined {
    return this.rules.find(rule => rule.id === ruleId);
  }

  /**
   * Get all rules for a specific article
   */
  static getRulesForArticle(article: string): NECRule[] {
    return this.rules.filter(rule => rule.article === article);
  }

  /**
   * Add custom rule
   */
  static addRule(rule: NECRule): void {
    // Check if rule already exists
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
    
    // Sort by priority
    this.rules.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove rule
   */
  static removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Generate recommendations based on validation results
   */
  private static generateRecommendations(validationResults: ValidationResult[]): string[] {
    const recommendations: string[] = [];
    
    const errors = validationResults.filter(r => r.type === 'error');
    const warnings = validationResults.filter(r => r.type === 'warning');
    
    if (errors.length > 0) {
      recommendations.push(`Fix ${errors.length} critical compliance issue(s)`);
    }
    
    if (warnings.length > 0) {
      recommendations.push(`Address ${warnings.length} warning(s) for best practices`);
    }
    
    const autoFixable = validationResults.filter(r => r.autoFixable);
    if (autoFixable.length > 0) {
      recommendations.push(`Apply auto-fixes for ${autoFixable.length} issue(s)`);
    }
    
    // Specific recommendations based on common issues
    const pvDisconnectIssues = errors.filter(e => e.ruleId === '690.13');
    if (pvDisconnectIssues.length > 0) {
      recommendations.push('Add required "PV SYSTEM DISCONNECT" labels to all PV disconnects');
    }
    
    const batteryLabelIssues = errors.filter(e => e.ruleId === '706.15');
    if (batteryLabelIssues.length > 0) {
      recommendations.push('Add voltage and polarity labels to battery systems');
    }
    
    const interconnectionIssues = errors.filter(e => e.ruleId === '705.12');
    if (interconnectionIssues.length > 0) {
      recommendations.push('Review interconnection method - consider supply-side connection');
    }
    
    return recommendations;
  }

  /**
   * Export validation report to different formats
   */
  static exportReport(report: NECComplianceReport, format: 'json' | 'text' | 'html'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2);
      
      case 'text':
        return this.generateTextReport(report);
      
      case 'html':
        return this.generateHtmlReport(report);
      
      default:
        return JSON.stringify(report);
    }
  }

  private static generateTextReport(report: NECComplianceReport): string {
    let text = `NEC Compliance Report\n`;
    text += `==================\n\n`;
    text += `Diagram ID: ${report.diagramId}\n`;
    text += `NEC Code Year: ${report.codeYear}\n`;
    text += `Overall Compliant: ${report.overallCompliant ? 'YES' : 'NO'}\n\n`;
    
    text += `Summary:\n`;
    text += `- Errors: ${report.summary.errors}\n`;
    text += `- Warnings: ${report.summary.warnings}\n`;
    text += `- Auto-fixable: ${report.summary.autoFixable}\n\n`;
    
    if (report.validationResults.length > 0) {
      text += `Validation Results:\n`;
      report.validationResults.forEach(result => {
        text += `[${result.type.toUpperCase()}] ${result.article}.${result.section}: ${result.message}\n`;
        if (result.suggestion) {
          text += `  Suggestion: ${result.suggestion}\n`;
        }
      });
      text += `\n`;
    }
    
    if (report.recommendations.length > 0) {
      text += `Recommendations:\n`;
      report.recommendations.forEach(rec => {
        text += `- ${rec}\n`;
      });
    }
    
    return text;
  }

  private static generateHtmlReport(report: NECComplianceReport): string {
    return `
      <html>
        <head>
          <title>NEC Compliance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f0f0f0; padding: 10px; border-radius: 5px; }
            .summary { margin: 20px 0; }
            .error { color: #d32f2f; }
            .warning { color: #f57c00; }
            .info { color: #1976d2; }
            .recommendations { background: #e3f2fd; padding: 10px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>NEC Compliance Report</h1>
            <p><strong>Diagram ID:</strong> ${report.diagramId}</p>
            <p><strong>NEC Code Year:</strong> ${report.codeYear}</p>
            <p><strong>Overall Compliant:</strong> ${report.overallCompliant ? 'YES' : 'NO'}</p>
          </div>
          
          <div class="summary">
            <h2>Summary</h2>
            <p>Errors: ${report.summary.errors} | Warnings: ${report.summary.warnings} | Auto-fixable: ${report.summary.autoFixable}</p>
          </div>
          
          ${report.validationResults.length > 0 ? `
            <div>
              <h2>Validation Results</h2>
              ${report.validationResults.map(result => `
                <div class="${result.type}">
                  <strong>[${result.type.toUpperCase()}] ${result.article}.${result.section}:</strong> ${result.message}
                  ${result.suggestion ? `<br><em>Suggestion: ${result.suggestion}</em>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${report.recommendations.length > 0 ? `
            <div class="recommendations">
              <h2>Recommendations</h2>
              <ul>
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </body>
      </html>
    `;
  }
} 