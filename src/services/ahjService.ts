import {
  AHJ,
  SubmissionPackage,
  Submission,
  PerformanceMetrics,
  AHJAnalytics,
  InspectionType,
  LocalAmendment
} from '../types/compliance';

export class AHJService {
  private static instance: AHJService;
  
  public static getInstance(): AHJService {
    if (!AHJService.instance) {
      AHJService.instance = new AHJService();
    }
    return AHJService.instance;
  }

  // AHJ Management methods
  async getAHJByLocation(address: string): Promise<AHJ[]> {
    try {
      // In a real implementation, this would query a database or API
      // For now, we'll return mock data based on common jurisdictions
      
      const mockAHJs = this.getMockAHJData();
      
      // Simple location matching - in reality this would be more sophisticated
      const locationKeywords = address.toLowerCase();
      
      return mockAHJs.filter(ahj => 
        locationKeywords.includes(ahj.jurisdiction.toLowerCase()) ||
        locationKeywords.includes(ahj.name.toLowerCase())
      );
    } catch (error) {
      console.error('Failed to get AHJ by location:', error);
      return [];
    }
  }

  async createAHJ(ahjData: Partial<AHJ>): Promise<string> {
    try {
      const ahjId = `ahj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullAHJ: AHJ = {
        id: ahjId,
        name: ahjData.name || 'Unknown AHJ',
        jurisdiction: ahjData.jurisdiction || 'Unknown',
        contactInfo: {
          address: '',
          phone: '',
          email: '',
          officeHours: 'Mon-Fri 8:00 AM - 5:00 PM',
          ...ahjData.contactInfo
        },
        requirements: {
          codeYear: '2023',
          localAmendments: [],
          submissionFormat: 'pdf',
          requiredDocuments: ['permit_application', 'load_calculations', 'single_line_diagram'],
          inspectionTypes: ['rough_electrical', 'final_electrical'],
          processingTime: 10,
          ...ahjData.requirements
        },
        preferences: {
          preferredContactMethod: 'email',
          digitalSubmission: true,
          ...ahjData.preferences
        },
        performance: {
          averageApprovalTime: 7,
          commonRejectionReasons: [],
          inspectorNotes: [],
          ...ahjData.performance
        }
      };
      
      // In a real implementation, this would save to database
      console.log('Created AHJ:', fullAHJ);
      
      return ahjId;
    } catch (error) {
      console.error('Failed to create AHJ:', error);
      throw new Error('Unable to create AHJ record');
    }
  }

  async updateAHJ(ahjId: string, updates: Partial<AHJ>): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log(`Updating AHJ ${ahjId}:`, updates);
      return true;
    } catch (error) {
      console.error('Failed to update AHJ:', error);
      return false;
    }
  }

  async getAHJRequirements(ahjId: string): Promise<AHJ['requirements'] | null> {
    try {
      // In a real implementation, this would fetch from database
      const ahj = await this.getAHJById(ahjId);
      return ahj?.requirements || null;
    } catch (error) {
      console.error('Failed to get AHJ requirements:', error);
      return null;
    }
  }

  async getAHJById(ahjId: string): Promise<AHJ | null> {
    try {
      // In a real implementation, this would fetch from database
      const mockAHJs = this.getMockAHJData();
      return mockAHJs.find(ahj => ahj.id === ahjId) || null;
    } catch (error) {
      console.error('Failed to get AHJ by ID:', error);
      return null;
    }
  }

  // Submission Management methods
  async formatForSubmission(projectId: string, ahjId: string): Promise<SubmissionPackage> {
    try {
      const ahj = await this.getAHJById(ahjId);
      if (!ahj) {
        throw new Error('AHJ not found');
      }

      // Create submission package based on AHJ requirements
      const submissionPackage: SubmissionPackage = {
        documents: [], // This would be populated with actual project documents
        coverLetter: this.generateCoverLetter(projectId, ahj),
        submissionForm: this.generateSubmissionForm(projectId, ahj),
        fees: this.calculateFees(projectId, ahj),
        timeline: this.calculateTimeline(ahj)
      };

      return submissionPackage;
    } catch (error) {
      console.error('Failed to format submission package:', error);
      throw new Error('Unable to prepare submission package');
    }
  }

  async trackSubmission(submissionId: string): Promise<Submission | null> {
    try {
      // In a real implementation, this would query the AHJ system
      // For now, return mock tracking data
      return {
        id: submissionId,
        ahjId: 'ahj_001',
        submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        submittedBy: 'user',
        documents: ['doc1', 'doc2'],
        status: 'under_review',
        trackingNumber: `TRK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        estimatedReviewTime: 7,
        actualReviewTime: 3
      };
    } catch (error) {
      console.error('Failed to track submission:', error);
      return null;
    }
  }

  async updateSubmissionStatus(submissionId: string, status: Submission['status']): Promise<boolean> {
    try {
      // In a real implementation, this would update the database
      console.log(`Updating submission ${submissionId} status to: ${status}`);
      return true;
    } catch (error) {
      console.error('Failed to update submission status:', error);
      return false;
    }
  }

  // Performance Tracking methods
  async recordAHJPerformance(ahjId: string, metrics: PerformanceMetrics): Promise<boolean> {
    try {
      // In a real implementation, this would save performance data
      console.log(`Recording performance metrics for AHJ ${ahjId}:`, metrics);
      return true;
    } catch (error) {
      console.error('Failed to record AHJ performance:', error);
      return false;
    }
  }

  async getAHJAnalytics(ahjId: string): Promise<AHJAnalytics> {
    try {
      // In a real implementation, this would calculate analytics from historical data
      return {
        averageReviewTime: 7.5,
        approvalRate: 0.85,
        commonRejectionReasons: [
          'Incomplete load calculations',
          'Missing grounding details',
          'Inadequate documentation'
        ],
        bestPractices: [
          'Submit complete documentation package',
          'Include detailed load calculations',
          'Ensure proper labeling on SLD'
        ],
        contactPreferences: {
          'email': 70,
          'phone': 20,
          'portal': 10
        },
        seasonalTrends: {
          'Q1': 0.9,
          'Q2': 1.1,
          'Q3': 1.2,
          'Q4': 0.8
        }
      };
    } catch (error) {
      console.error('Failed to get AHJ analytics:', error);
      throw new Error('Unable to retrieve AHJ analytics');
    }
  }

  // Helper methods for submission package creation
  private generateCoverLetter(projectId: string, ahj: AHJ): string {
    return `
Dear ${ahj.name} Electrical Department,

Please find enclosed the permit application and supporting documentation for electrical work at the above-referenced project.

This submission includes:
- Permit application form
- Load calculations
- Single line diagram
- Equipment specifications

All work will be performed in accordance with the ${ahj.requirements.codeYear} National Electrical Code and applicable local amendments.

Please contact us if you require any additional information.

Respectfully submitted,
[Contractor Name]
    `.trim();
  }

  private generateSubmissionForm(projectId: string, ahj: AHJ): Record<string, any> {
    return {
      projectId,
      applicantName: '',
      projectAddress: '',
      workDescription: '',
      estimatedValue: 0,
      contractorLicense: '',
      submissionDate: new Date(),
      ahjRequirements: ahj.requirements
    };
  }

  private calculateFees(projectId: string, ahj: AHJ): SubmissionPackage['fees'] {
    // Mock fee calculation - in reality this would be based on AHJ fee schedule
    const basePermitFee = 150;
    const inspectionFee = 75;
    
    return {
      permitFee: basePermitFee,
      inspectionFees: inspectionFee,
      total: basePermitFee + inspectionFee
    };
  }

  private calculateTimeline(ahj: AHJ): SubmissionPackage['timeline'] {
    const now = new Date();
    const processingDays = ahj.requirements.processingTime;
    
    const estimatedApproval = new Date(now);
    estimatedApproval.setDate(now.getDate() + processingDays);
    
    const inspectionDate = new Date(estimatedApproval);
    inspectionDate.setDate(estimatedApproval.getDate() + 7); // Week after approval
    
    return {
      submissionDate: now,
      estimatedApproval,
      inspectionDates: [inspectionDate]
    };
  }

  // Mock data for testing and development
  private getMockAHJData(): AHJ[] {
    return [
      {
        id: 'ahj_001',
        name: 'City of San Francisco',
        jurisdiction: 'San Francisco, CA',
        contactInfo: {
          address: '49 South Van Ness Avenue, San Francisco, CA 94103',
          phone: '(415) 558-6088',
          email: 'electrical.permits@sfgov.org',
          website: 'https://sfdbi.org',
          officeHours: 'Mon-Fri 8:00 AM - 5:00 PM'
        },
        requirements: {
          codeYear: '2023',
          localAmendments: [
            {
              id: 'sf_001',
              section: '210.8',
              description: 'Additional GFCI requirements',
              requirement: 'GFCI protection required in all basement areas',
              effectiveDate: new Date('2023-01-01')
            }
          ],
          submissionFormat: 'both',
          requiredDocuments: [
            'permit_application',
            'load_calculations',
            'single_line_diagram',
            'equipment_specifications',
            'site_plan'
          ],
          inspectionTypes: ['rough_electrical', 'final_electrical', 'solar_pv', 'evse'],
          processingTime: 10
        },
        preferences: {
          preferredContactMethod: 'email',
          schedulingSystem: 'online',
          digitalSubmission: true
        },
        performance: {
          averageApprovalTime: 8,
          commonRejectionReasons: [
            'Incomplete load calculations',
            'Missing equipment specifications',
            'Improper panel labeling'
          ],
          inspectorNotes: [
            'Prefers detailed documentation',
            'Strict on code compliance',
            'Helpful with clarifications'
          ]
        }
      },
      {
        id: 'ahj_002',
        name: 'Los Angeles Department of Building and Safety',
        jurisdiction: 'Los Angeles, CA',
        contactInfo: {
          address: '201 North Figueroa Street, Los Angeles, CA 90012',
          phone: '(213) 482-7077',
          email: 'electrical@lacity.org',
          website: 'https://www.ladbs.org',
          officeHours: 'Mon-Fri 7:30 AM - 4:00 PM'
        },
        requirements: {
          codeYear: '2023',
          localAmendments: [
            {
              id: 'la_001',
              section: '690.12',
              description: 'Solar rapid shutdown requirements',
              requirement: 'Enhanced rapid shutdown requirements for PV systems',
              effectiveDate: new Date('2023-01-01')
            }
          ],
          submissionFormat: 'pdf',
          requiredDocuments: [
            'permit_application',
            'load_calculations',
            'single_line_diagram',
            'equipment_cut_sheets'
          ],
          inspectionTypes: ['rough_electrical', 'final_electrical', 'solar_pv'],
          processingTime: 7
        },
        preferences: {
          preferredContactMethod: 'phone',
          schedulingSystem: 'phone',
          digitalSubmission: true
        },
        performance: {
          averageApprovalTime: 6,
          commonRejectionReasons: [
            'Inadequate grounding details',
            'Missing solar system specifications',
            'Unclear load calculations'
          ],
          inspectorNotes: [
            'Fast processing times',
            'Good online systems',
            'Professional staff'
          ]
        }
      },
      {
        id: 'ahj_003',
        name: 'Clark County Building Department',
        jurisdiction: 'Las Vegas, NV',
        contactInfo: {
          address: '4701 West Russell Road, Las Vegas, NV 89118',
          phone: '(702) 455-3000',
          email: 'building@clarkcountynv.gov',
          website: 'https://www.clarkcountynv.gov/building',
          officeHours: 'Mon-Fri 8:00 AM - 4:30 PM'
        },
        requirements: {
          codeYear: '2020',
          localAmendments: [],
          submissionFormat: 'pdf',
          requiredDocuments: [
            'permit_application',
            'load_calculations',
            'single_line_diagram'
          ],
          inspectionTypes: ['rough_electrical', 'final_electrical', 'solar_pv', 'evse'],
          processingTime: 5
        },
        preferences: {
          preferredContactMethod: 'email',
          schedulingSystem: 'online',
          digitalSubmission: true
        },
        performance: {
          averageApprovalTime: 4,
          commonRejectionReasons: [
            'Missing permit fees',
            'Incomplete applications',
            'Code year discrepancies'
          ],
          inspectorNotes: [
            'Very efficient processing',
            'Good online portal',
            'Clear requirements'
          ]
        }
      }
    ];
  }

  // Utility methods
  getInspectionTypesForAHJ(ahjId: string): InspectionType[] {
    const ahj = this.getMockAHJData().find(a => a.id === ahjId);
    return ahj?.requirements.inspectionTypes || [];
  }

  getRequiredDocumentsForAHJ(ahjId: string): string[] {
    const ahj = this.getMockAHJData().find(a => a.id === ahjId);
    return ahj?.requirements.requiredDocuments || [];
  }

  getLocalAmendmentsForAHJ(ahjId: string): LocalAmendment[] {
    const ahj = this.getMockAHJData().find(a => a.id === ahjId);
    return ahj?.requirements.localAmendments || [];
  }

  searchAHJsByName(query: string): AHJ[] {
    const allAHJs = this.getMockAHJData();
    const lowerQuery = query.toLowerCase();
    
    return allAHJs.filter(ahj => 
      ahj.name.toLowerCase().includes(lowerQuery) ||
      ahj.jurisdiction.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
export const ahjService = AHJService.getInstance();