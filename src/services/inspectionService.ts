import {
  Inspection,
  InspectionType,
  InspectionStatus,
  ChecklistItem,
  InspectionFinding,
  ReadinessScore,
  Inspector
} from '../types/compliance';

export class InspectionService {
  private static instance: InspectionService;
  
  public static getInstance(): InspectionService {
    if (!InspectionService.instance) {
      InspectionService.instance = new InspectionService();
    }
    return InspectionService.instance;
  }

  // Scheduling methods
  async scheduleInspection(inspection: Partial<Inspection>): Promise<string> {
    try {
      const inspectionId = `inspection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullInspection: Inspection = {
        id: inspectionId,
        projectId: inspection.projectId || '',
        type: inspection.type || 'final_electrical',
        status: 'scheduled',
        scheduledDate: inspection.scheduledDate,
        inspector: inspection.inspector || {
          name: 'TBD',
          contact: 'TBD'
        },
        checklist: inspection.checklist || await this.generateChecklist(inspection.projectId || '', inspection.type || 'final_electrical'),
        findings: [],
        result: 'pending',
        nextSteps: [],
        documents: [],
        notes: inspection.notes || '',
        followUpRequired: false,
        ...inspection
      };
      
      // In a real implementation, this would save to database/calendar system
      console.log('Scheduled inspection:', fullInspection);
      
      // Could integrate with calendar API here
      await this.notifyInspectionScheduled(inspectionId);
      
      return inspectionId;
    } catch (error) {
      console.error('Failed to schedule inspection:', error);
      throw new Error('Unable to schedule inspection. Please try again.');
    }
  }

  async rescheduleInspection(inspectionId: string, newDate: Date): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log(`Rescheduling inspection ${inspectionId} to ${newDate}`);
      
      // Update inspection record
      // Send notifications to relevant parties
      await this.notifyInspectionRescheduled(inspectionId, newDate);
      
      return true;
    } catch (error) {
      console.error('Failed to reschedule inspection:', error);
      return false;
    }
  }

  async cancelInspection(inspectionId: string, reason: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log(`Cancelling inspection ${inspectionId}: ${reason}`);
      
      // Update inspection status to cancelled
      // Send notifications
      await this.notifyInspectionCancelled(inspectionId, reason);
      
      return true;
    } catch (error) {
      console.error('Failed to cancel inspection:', error);
      return false;
    }
  }

  // Checklist management
  async generateChecklist(projectId: string, inspectionType: InspectionType): Promise<ChecklistItem[]> {
    const checklist: ChecklistItem[] = [];
    
    switch (inspectionType) {
      case 'rough_electrical':
        checklist.push(
          {
            id: 'rough_wiring_complete',
            description: 'All rough wiring installed and secured',
            required: true,
            status: 'pending',
            codeReference: '300.4'
          },
          {
            id: 'boxes_installed',
            description: 'All electrical boxes properly installed',
            required: true,
            status: 'pending',
            codeReference: '314.20'
          },
          {
            id: 'grounding_installed',
            description: 'Grounding electrode system installed',
            required: true,
            status: 'pending',
            codeReference: '250.50'
          },
          {
            id: 'service_entrance_rough',
            description: 'Service entrance conductors installed',
            required: true,
            status: 'pending',
            codeReference: '230.40'
          }
        );
        break;
        
      case 'final_electrical':
        checklist.push(
          {
            id: 'panel_complete',
            description: 'Electrical panel properly labeled and filled',
            required: true,
            status: 'pending',
            codeReference: '408.4'
          },
          {
            id: 'gfci_installed',
            description: 'GFCI protection installed where required',
            required: true,
            status: 'pending',
            codeReference: '210.8'
          },
          {
            id: 'arc_fault_installed',
            description: 'AFCI protection installed where required',
            required: true,
            status: 'pending',
            codeReference: '210.12'
          },
          {
            id: 'smoke_detectors',
            description: 'Smoke detectors installed and interconnected',
            required: true,
            status: 'pending',
            codeReference: 'Local Fire Code'
          },
          {
            id: 'final_testing',
            description: 'All circuits tested and operational',
            required: true,
            status: 'pending'
          }
        );
        break;
        
      case 'solar_pv':
        checklist.push(
          {
            id: 'pv_disconnect_labeled',
            description: 'PV system disconnects properly labeled',
            required: true,
            status: 'pending',
            codeReference: '690.13'
          },
          {
            id: 'rapid_shutdown',
            description: 'Rapid shutdown system installed and functional',
            required: true,
            status: 'pending',
            codeReference: '690.12'
          },
          {
            id: 'pv_grounding',
            description: 'PV system properly grounded and bonded',
            required: true,
            status: 'pending',
            codeReference: '690.43'
          },
          {
            id: 'interconnection_compliance',
            description: 'Interconnection meets 120% rule',
            required: true,
            status: 'pending',
            codeReference: '705.12(D)'
          }
        );
        break;
        
      case 'evse':
        checklist.push(
          {
            id: 'evse_disconnect',
            description: 'EVSE disconnect switch properly installed',
            required: true,
            status: 'pending',
            codeReference: '625.43'
          },
          {
            id: 'evse_grounding',
            description: 'EVSE equipment grounding verified',
            required: true,
            status: 'pending',
            codeReference: '625.15'
          },
          {
            id: 'continuous_load_sizing',
            description: 'Continuous load factor applied (125%)',
            required: true,
            status: 'pending',
            codeReference: '625.17'
          }
        );
        break;
        
      default:
        checklist.push({
          id: 'general_compliance',
          description: 'Installation meets applicable code requirements',
          required: true,
          status: 'pending'
        });
    }
    
    return checklist;
  }

  async updateChecklistItem(itemId: string, status: boolean, notes?: string): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log(`Updating checklist item ${itemId}: ${status ? 'pass' : 'fail'}`, notes);
      return true;
    } catch (error) {
      console.error('Failed to update checklist item:', error);
      return false;
    }
  }

  async getInspectionReadiness(projectId: string, inspectionType?: InspectionType): Promise<ReadinessScore> {
    try {
      // This would analyze project completion status
      const score = Math.floor(Math.random() * 40) + 60; // Mock score between 60-100
      const readyForInspection = score >= 80;
      
      const missingItems: string[] = [];
      const recommendations: string[] = [];
      
      if (score < 80) {
        missingItems.push('Complete all required documentation');
        missingItems.push('Resolve outstanding compliance issues');
        recommendations.push('Address critical issues before scheduling inspection');
      }
      
      if (score < 90) {
        recommendations.push('Review checklist items and ensure completion');
      }
      
      return {
        score,
        readyForInspection,
        missingItems,
        recommendations,
        checklistCompletion: score,
        documentationComplete: score >= 85
      };
    } catch (error) {
      console.error('Failed to get inspection readiness:', error);
      return {
        score: 0,
        readyForInspection: false,
        missingItems: ['Unable to assess readiness'],
        recommendations: ['Check project data and try again'],
        checklistCompletion: 0,
        documentationComplete: false
      };
    }
  }

  // Communication methods
  async sendInspectionReminder(inspectionId: string): Promise<boolean> {
    try {
      // This would integrate with email/SMS service
      console.log(`Sending inspection reminder for ${inspectionId}`);
      
      // Mock email/SMS sending
      const reminderSent = true;
      
      if (reminderSent) {
        console.log('Inspection reminder sent successfully');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to send inspection reminder:', error);
      return false;
    }
  }

  async notifyInspectionComplete(inspectionId: string): Promise<boolean> {
    try {
      // This would send notifications to relevant parties
      console.log(`Notifying inspection completion for ${inspectionId}`);
      return true;
    } catch (error) {
      console.error('Failed to notify inspection completion:', error);
      return false;
    }
  }

  async requestReinspection(inspectionId: string, corrections: string[]): Promise<string> {
    try {
      const reinspectionId = `reinspection_${Date.now()}`;
      
      // Create new inspection record for reinspection
      console.log(`Requesting reinspection ${reinspectionId} for ${inspectionId}`);
      console.log('Required corrections:', corrections);
      
      // This would schedule a new inspection with the corrections noted
      return reinspectionId;
    } catch (error) {
      console.error('Failed to request reinspection:', error);
      throw new Error('Unable to request reinspection. Please contact the AHJ directly.');
    }
  }

  // Inspection completion and results
  async completeInspection(
    inspectionId: string, 
    result: 'pass' | 'fail' | 'conditional',
    findings: InspectionFinding[],
    notes: string
  ): Promise<boolean> {
    try {
      // Update inspection record with results
      console.log(`Completing inspection ${inspectionId} with result: ${result}`);
      
      // Process findings and determine next steps
      const nextSteps = this.generateNextSteps(result, findings);
      
      // Update inspection in database
      // Send notifications
      await this.notifyInspectionComplete(inspectionId);
      
      return true;
    } catch (error) {
      console.error('Failed to complete inspection:', error);
      return false;
    }
  }

  // Private helper methods
  private async notifyInspectionScheduled(inspectionId: string): Promise<void> {
    // Implementation for scheduling notifications
    console.log(`Inspection ${inspectionId} scheduled - notifications sent`);
  }

  private async notifyInspectionRescheduled(inspectionId: string, newDate: Date): Promise<void> {
    // Implementation for rescheduling notifications
    console.log(`Inspection ${inspectionId} rescheduled to ${newDate} - notifications sent`);
  }

  private async notifyInspectionCancelled(inspectionId: string, reason: string): Promise<void> {
    // Implementation for cancellation notifications
    console.log(`Inspection ${inspectionId} cancelled: ${reason} - notifications sent`);
  }

  private generateNextSteps(result: string, findings: InspectionFinding[]): string[] {
    const nextSteps: string[] = [];
    
    switch (result) {
      case 'pass':
        nextSteps.push('Inspection passed - proceed with project');
        nextSteps.push('Obtain certificate of occupancy if required');
        break;
        
      case 'fail':
        nextSteps.push('Address all identified violations');
        nextSteps.push('Request reinspection after corrections');
        findings.forEach(finding => {
          if (finding.correctionRequired) {
            nextSteps.push(`Correct: ${finding.description}`);
          }
        });
        break;
        
      case 'conditional':
        nextSteps.push('Address conditional items');
        nextSteps.push('Submit documentation for final approval');
        break;
    }
    
    return nextSteps;
  }

  // Mock data generators for testing
  generateMockInspector(): Inspector {
    const inspectors = [
      { name: 'John Smith', contact: 'john.smith@city.gov', preferences: ['Morning appointments'] },
      { name: 'Sarah Johnson', contact: 'sarah.johnson@city.gov', preferences: ['Afternoon preferred'] },
      { name: 'Mike Davis', contact: 'mike.davis@city.gov', preferences: ['Early morning', 'No Fridays'] }
    ];
    
    return inspectors[Math.floor(Math.random() * inspectors.length)];
  }

  getAvailableInspectionTypes(): InspectionType[] {
    return [
      'rough_electrical',
      'final_electrical',
      'service_upgrade',
      'solar_pv',
      'energy_storage',
      'evse',
      'special_equipment'
    ];
  }

  getInspectionTypeDisplayName(type: InspectionType): string {
    const displayNames: Record<InspectionType, string> = {
      'rough_electrical': 'Rough Electrical',
      'final_electrical': 'Final Electrical',
      'service_upgrade': 'Service Upgrade',
      'solar_pv': 'Solar PV System',
      'energy_storage': 'Energy Storage System',
      'evse': 'Electric Vehicle Supply Equipment',
      'special_equipment': 'Special Equipment'
    };
    
    return displayNames[type] || type;
  }
}

// Export singleton instance
export const inspectionService = InspectionService.getInstance();