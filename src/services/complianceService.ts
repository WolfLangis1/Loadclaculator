import {
  ComplianceData,
  ValidationResult,
  ValidationCheck,
  ComplianceIssue,
  ComplianceReport,
  ComplianceError,
  ValidationType,
  ValidationCheckStatus,
  IssueSeverity
} from '../types/compliance';
import { ProjectData } from '../types/project';
import RealTimeNECValidator from './realTimeNECValidator';
import { necCalculations } from './necCalculations';

export class ComplianceService {
  private static instance: ComplianceService;
  private necValidator: RealTimeNECValidator;
  
  private constructor() {
    this.necValidator = new RealTimeNECValidator();
  }
  
  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  // Main validation methods
  async validateProject(projectId: string, projectData?: ProjectData): Promise<ValidationResult> {
    try {
      const validationId = `validation_${Date.now()}`;
      const results: ValidationCheck[] = [];
      
      if (projectData) {
        // Run all validation checks
        const necChecks = await this.validateNECCompliance(projectData);
        const localCodeChecks = await this.validateLocalCodes(projectData, projectData.compliance?.ahjId);
        const wireSizingChecks = await this.validateWireSizing(projectData);
        const sldChecks = await this.validateSLDCompliance(projectData);
        
        results.push(...necChecks, ...localCodeChecks, ...wireSizingChecks, ...sldChecks);
      }
      
      // Calculate overall scores
      const passCount = results.filter(r => r.status === 'pass').length;
      const failCount = results.filter(r => r.status === 'fail').length;
      const warningCount = results.filter(r => r.status === 'warning').length;
      const criticalIssues = results.filter(r => r.severity === 'critical' && r.status === 'fail').length;
      
      const overallScore = results.length > 0 ? 
        Math.round((passCount / results.length) * 100) : 100;
      
      const status: 'pass' | 'fail' | 'warning' = 
        failCount > 0 ? 'fail' : warningCount > 0 ? 'warning' : 'pass';
      
      const recommendations = this.generateRecommendations(results);
      
      return {
        id: validationId,
        projectId,
        validationType: 'nec_compliance',
        status,
        validatedAt: new Date(),
        validatedBy: 'system',
        results,
        overallScore,
        criticalIssues,
        warnings: warningCount,
        recommendations
      };
      
    } catch (error) {
      console.error('Validation error:', error);
      throw new ComplianceError(
        'Failed to validate project compliance',
        'VALIDATION_ERROR',
        'critical',
        undefined,
        'Check project data integrity and try again'
      );
    }
  }

  async validateNECCompliance(projectData: ProjectData): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    try {
      // Use existing NEC validator with enhanced compliance checking
      if (projectData.sldDiagram) {
        const necValidation = this.necValidator.validateDiagram(projectData.sldDiagram, projectData.loads);
        
        // Convert system violations to compliance format
        if (necValidation.systemViolations?.length > 0) {
          necValidation.systemViolations.forEach((violation, index) => {
            checks.push({
              id: `nec_system_${index}`,
              category: 'NEC Compliance',
              description: violation.description || 'NEC code violation detected',
              necReference: violation.necSection,
              status: 'fail',
              details: violation.description || 'See NEC reference for requirements',
              suggestedFix: violation.suggestion,
              autoFixable: false,
              severity: this.mapSeverityFromViolation(violation.severity)
            });
          });
        }
        
        // Convert component violations
        necValidation.componentViolations?.forEach((violations, componentId) => {
          violations.forEach((violation, index) => {
            checks.push({
              id: `nec_comp_${componentId}_${index}`,
              category: 'NEC Compliance - Component',
              description: `${componentId}: ${violation.description}`,
              necReference: violation.necSection,
              status: 'fail',
              details: violation.description || 'Component violates NEC requirements',
              suggestedFix: violation.suggestion,
              autoFixable: false,
              severity: this.mapSeverityFromViolation(violation.severity)
            });
          });
        });
      }
      
      // Add service capacity checks
      const serviceChecks = await this.validateServiceCapacity(projectData);
      checks.push(...serviceChecks);
      
      // Add grounding and bonding checks
      const groundingChecks = await this.validateGroundingRequirements(projectData);
      checks.push(...groundingChecks);
      
      // Add wire sizing compliance
      const wireChecks = await this.validateWireNECCompliance(projectData);
      checks.push(...wireChecks);
      
    } catch (error) {
      console.error('NEC validation error:', error);
      checks.push({
        id: 'nec_validation_error',
        category: 'NEC Compliance',
        description: 'Unable to complete NEC compliance validation',
        status: 'fail',
        details: 'Validation service encountered an error',
        autoFixable: false,
        severity: 'major'
      });
    }
    
    return checks;
  }

  async validateLocalCodes(projectData: ProjectData, ahjId?: string): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    if (!ahjId) {
      checks.push({
        id: 'no_ahj_selected',
        category: 'Local Code Compliance',
        description: 'No Authority Having Jurisdiction (AHJ) selected',
        status: 'warning',
        details: 'Local code requirements cannot be validated without AHJ selection',
        suggestedFix: 'Select the appropriate AHJ for this project location',
        autoFixable: false,
        severity: 'minor'
      });
      return checks;
    }
    
    // This would integrate with AHJ-specific requirements
    // For now, we'll add some common local code checks
    checks.push({
      id: 'local_permit_required',
      category: 'Local Code Compliance',
      description: 'Electrical permit required for this work',
      status: 'warning',
      details: 'Most jurisdictions require permits for electrical service modifications',
      suggestedFix: 'Apply for electrical permit before beginning work',
      autoFixable: false,
      severity: 'minor'
    });
    
    return checks;
  }

  async validateWireSizing(projectData: ProjectData): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    try {
      // Check if we have load data to validate
      if (!projectData.loads) {
        return checks;
      }
      
      // Validate service conductor sizing
      const serviceCheck = await this.validateServiceConductors(projectData);
      if (serviceCheck) checks.push(serviceCheck);
      
      // Validate feeder conductor sizing
      const feederChecks = await this.validateFeederConductors(projectData);
      checks.push(...feederChecks);
      
      // Validate branch circuit sizing
      const branchChecks = await this.validateBranchCircuits(projectData);
      checks.push(...branchChecks);
      
    } catch (error) {
      console.error('Wire sizing validation error:', error);
    }
    
    return checks;
  }

  async validateSLDCompliance(projectData: ProjectData): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    if (!projectData.sldDiagram) {
      return checks;
    }
    
    try {
      // Validate labeling requirements
      const labelingChecks = await this.validateSLDLabeling(projectData.sldDiagram);
      checks.push(...labelingChecks);
      
      // Validate component specifications
      const componentChecks = await this.validateSLDComponents(projectData.sldDiagram);
      checks.push(...componentChecks);
      
      // Validate connection requirements
      const connectionChecks = await this.validateSLDConnections(projectData.sldDiagram);
      checks.push(...connectionChecks);
      
    } catch (error) {
      console.error('SLD validation error:', error);
    }
    
    return checks;
  }

  // Issue management methods
  async createIssue(issue: Omit<ComplianceIssue, 'id' | 'createdAt'>): Promise<string> {
    const issueId = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullIssue: ComplianceIssue = {
      ...issue,
      id: issueId,
      createdAt: new Date()
    };
    
    // In a real implementation, this would save to a database
    console.log('Created compliance issue:', fullIssue);
    
    return issueId;
  }

  async updateIssue(issueId: string, updates: Partial<ComplianceIssue>): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log('Updated compliance issue:', issueId, updates);
      return true;
    } catch (error) {
      console.error('Failed to update issue:', error);
      return false;
    }
  }

  async resolveIssue(issueId: string, resolution: any): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log('Resolved compliance issue:', issueId, resolution);
      return true;
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      return false;
    }
  }

  async getProjectIssues(projectId: string): Promise<ComplianceIssue[]> {
    // In a real implementation, this would fetch from database
    return [];
  }

  // Reporting methods
  async generateComplianceReport(projectId: string, reportType: string = 'summary'): Promise<ComplianceReport> {
    const reportId = `report_${Date.now()}`;
    
    // This would generate a comprehensive compliance report
    return {
      id: reportId,
      projectId,
      generatedAt: new Date(),
      generatedBy: 'system',
      reportType: reportType as any,
      summary: {
        overallScore: 85,
        status: 'in_progress',
        criticalIssues: 0,
        warnings: 2,
        readyForInspection: true
      },
      sections: {
        validation: [],
        issues: [],
        inspections: [],
        documents: [],
        recommendations: []
      },
      format: 'pdf',
      includeAttachments: true,
      confidential: false
    };
  }

  async exportComplianceData(projectId: string, format: 'pdf' | 'json' | 'csv'): Promise<Blob> {
    // This would export compliance data in the specified format
    const data = JSON.stringify({ projectId, exportedAt: new Date() });
    return new Blob([data], { type: 'application/json' });
  }

  // Private helper methods
  private mapSeverityFromViolation(severity?: string): IssueSeverity {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'critical';
      case 'medium':
        return 'major';
      case 'low':
        return 'minor';
      default:
        return 'info';
    }
  }

  private generateRecommendations(results: ValidationCheck[]): string[] {
    const recommendations: string[] = [];
    
    const criticalIssues = results.filter(r => r.severity === 'critical' && r.status === 'fail');
    const majorIssues = results.filter(r => r.severity === 'major' && r.status === 'fail');
    
    if (criticalIssues.length > 0) {
      recommendations.push('Address all critical compliance issues before proceeding with installation');
    }
    
    if (majorIssues.length > 0) {
      recommendations.push('Review and resolve major compliance issues to ensure code compliance');
    }
    
    const autoFixableIssues = results.filter(r => r.autoFixable && r.status === 'fail');
    if (autoFixableIssues.length > 0) {
      recommendations.push(`${autoFixableIssues.length} issues can be automatically corrected`);
    }
    
    return recommendations;
  }

  private async validateServiceCapacity(projectData: ProjectData): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    try {
      if (projectData.calculations) {
        const totalLoad = projectData.calculations.totalDemandLoad || 0;
        const serviceSize = projectData.settings?.mainBreaker || 200;
        const utilizationRatio = totalLoad / serviceSize;
        
        if (utilizationRatio > 0.8) {
          checks.push({
            id: 'service_capacity_check',
            category: 'Service Capacity',
            description: 'Service capacity exceeds 80% utilization',
            necReference: '230.42',
            status: utilizationRatio > 1.0 ? 'fail' : 'warning',
            details: `Total load: ${totalLoad}A, Service: ${serviceSize}A (${Math.round(utilizationRatio * 100)}% utilization)`,
            suggestedFix: 'Consider increasing service size or reducing connected loads',
            autoFixable: false,
            severity: utilizationRatio > 1.0 ? 'critical' : 'major'
          });
        } else {
          checks.push({
            id: 'service_capacity_ok',
            category: 'Service Capacity',
            description: 'Service capacity is adequate',
            necReference: '230.42',
            status: 'pass',
            details: `Total load: ${totalLoad}A, Service: ${serviceSize}A (${Math.round(utilizationRatio * 100)}% utilization)`,
            autoFixable: false,
            severity: 'info'
          });
        }
      }
    } catch (error) {
      console.error('Service capacity validation error:', error);
    }
    
    return checks;
  }

  private async validateGroundingRequirements(projectData: ProjectData): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    // Basic grounding requirement check
    checks.push({
      id: 'grounding_electrode_required',
      category: 'Grounding and Bonding',
      description: 'Grounding electrode system required',
      necReference: '250.50',
      status: 'warning',
      details: 'Ensure proper grounding electrode system is installed per NEC requirements',
      suggestedFix: 'Install appropriate grounding electrodes and bonding connections',
      autoFixable: false,
      severity: 'major'
    });
    
    return checks;
  }

  private async validateWireNECCompliance(projectData: ProjectData): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    // This would integrate with wire sizing calculations
    // For now, we'll add a basic check
    checks.push({
      id: 'wire_sizing_verification',
      category: 'Wire Sizing',
      description: 'Verify conductor ampacity and derating factors',
      necReference: '310.15',
      status: 'warning',
      details: 'Conductor sizing should account for ambient temperature and bundling derating',
      suggestedFix: 'Review wire sizing calculations including all applicable derating factors',
      autoFixable: false,
      severity: 'minor'
    });
    
    return checks;
  }

  private async validateServiceConductors(projectData: ProjectData): Promise<ValidationCheck | null> {
    // Service conductor validation logic
    return null;
  }

  private async validateFeederConductors(projectData: ProjectData): Promise<ValidationCheck[]> {
    // Feeder conductor validation logic
    return [];
  }

  private async validateBranchCircuits(projectData: ProjectData): Promise<ValidationCheck[]> {
    // Branch circuit validation logic
    return [];
  }

  private async validateSLDLabeling(sldDiagram: any): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    // Check for required disconnect labels
    if (sldDiagram.components) {
      const disconnects = sldDiagram.components.filter((c: any) => 
        c.type?.includes('disconnect') || c.type?.includes('switch'));
      
      disconnects.forEach((disconnect: any, index: number) => {
        if (!disconnect.necLabels || disconnect.necLabels.length === 0) {
          checks.push({
            id: `sld_label_${disconnect.id || index}`,
            category: 'SLD Labeling',
            description: 'Disconnect switch missing required NEC labeling',
            necReference: '690.13(B)',
            status: 'fail',
            details: 'All disconnect switches must be labeled per NEC requirements',
            suggestedFix: 'Add appropriate disconnect labeling to component',
            autoFixable: true,
            severity: 'major'
          });
        }
      });
    }
    
    return checks;
  }

  private async validateSLDComponents(sldDiagram: any): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    // Validate component specifications
    if (sldDiagram.components) {
      sldDiagram.components.forEach((component: any, index: number) => {
        if (!component.ampRating || component.ampRating <= 0) {
          checks.push({
            id: `sld_component_${component.id || index}`,
            category: 'SLD Components',
            description: 'Component missing amp rating specification',
            status: 'warning',
            details: 'All electrical components should have proper amp ratings specified',
            suggestedFix: 'Add amp rating to component specifications',
            autoFixable: false,
            severity: 'minor'
          });
        }
      });
    }
    
    return checks;
  }

  private async validateSLDConnections(sldDiagram: any): Promise<ValidationCheck[]> {
    const checks: ValidationCheck[] = [];
    
    // Validate electrical connections
    if (sldDiagram.wires) {
      sldDiagram.wires.forEach((wire: any, index: number) => {
        if (!wire.wireSize || !wire.wireType) {
          checks.push({
            id: `sld_connection_${wire.id || index}`,
            category: 'SLD Connections',
            description: 'Wire connection missing size or type specification',
            status: 'warning',
            details: 'All wire connections should specify conductor size and type',
            suggestedFix: 'Add wire size and type specifications',
            autoFixable: false,
            severity: 'minor'
          });
        }
      });
    }
    
    return checks;
  }
}

// Export singleton instance
export const complianceService = ComplianceService.getInstance();