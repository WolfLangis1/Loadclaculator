// CRM Integration Service
// Handles integration between existing load calculator data and CRM system

import { useCRM } from '../context/CRMContext';
import { useProjectSettings } from '../context/ProjectSettingsContext';
import { useLoadData } from '../context/LoadDataContext';
import type { 
  Customer, 
  CRMProject, 
  CreateCustomerRequest, 
  CreateCRMProjectRequest,
  CreateActivityRequest 
} from '../types/crm';

interface ProjectIntegrationData {
  projectName: string;
  customerInfo: {
    name: string;
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
  };
  projectValue?: number;
  description?: string;
  loadData: any;
  calculations: any;
}

export class CRMIntegrationService {
  // Create CRM customer and project from current load calculator session
  static async createProjectFromSession(
    crmActions: ReturnType<typeof useCRM>,
    projectSettings: any,
    loadData: any,
    calculations: any
  ): Promise<{ customer: Customer; project: CRMProject }> {
    
    // Extract customer information from project settings
    const customerData = this.extractCustomerFromProject(projectSettings);
    
    // Create or find customer
    let customer: Customer;
    try {
      customer = await crmActions.createCustomer(customerData);
    } catch (error) {
      // If customer creation fails, try to find existing customer by email
      if (customerData.email) {
        await crmActions.loadCustomers({ search: customerData.email });
        const existingCustomer = crmActions.customers.find(c => c.email === customerData.email);
        if (existingCustomer) {
          customer = existingCustomer;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    // Create CRM project linked to customer
    const projectData = this.extractProjectFromSession(
      customer.id, 
      projectSettings, 
      loadData, 
      calculations
    );
    
    const project = await crmActions.createProject(projectData);

    // Create activity log
    await crmActions.createActivity({
      project_id: project.id,
      customer_id: customer.id,
      type: 'note',
      title: 'Project imported from Load Calculator',
      description: 'Project data and calculations imported from load calculator session',
      metadata: {
        importedAt: new Date().toISOString(),
        hasCalculations: !!calculations,
        hasLoadData: !!loadData
      }
    });

    return { customer, project };
  }

  // Extract customer data from project settings
  private static extractCustomerFromProject(projectSettings: any): CreateCustomerRequest {
    const projectInfo = projectSettings?.projectInfo || {};
    
    return {
      name: projectInfo.clientName || projectInfo.projectName || 'Unnamed Customer',
      email: projectInfo.clientEmail,
      phone: projectInfo.clientPhone,
      company: projectInfo.company,
      address: projectInfo.address ? {
        street: projectInfo.address.street || projectInfo.address,
        city: projectInfo.address.city,
        state: projectInfo.address.state,
        zipCode: projectInfo.address.zipCode || projectInfo.address.zip
      } : undefined,
      source: 'website', // Default source for load calculator imports
      notes: `Project imported from Load Calculator on ${new Date().toLocaleDateString()}`,
      tags: ['load-calculator', 'imported'],
      custom_fields: {
        importedFrom: 'load-calculator',
        importDate: new Date().toISOString(),
        originalProjectData: projectInfo
      }
    };
  }

  // Extract project data from load calculator session
  private static extractProjectFromSession(
    customerId: string,
    projectSettings: any,
    loadData: any,
    calculations: any
  ): CreateCRMProjectRequest {
    const projectInfo = projectSettings?.projectInfo || {};
    const totalLoad = calculations?.totalLoad || 0;
    
    // Estimate project value based on load calculations
    const estimatedValue = this.estimateProjectValue(loadData, calculations);
    
    return {
      customer_id: customerId,
      stage_id: '', // Will need to get first stage ID
      value: estimatedValue,
      probability: 50, // Default probability
      expected_close_date: this.calculateExpectedCloseDate(),
      source: 'website',
      priority: this.determinePriority(totalLoad, estimatedValue),
      tags: ['load-calculator', 'electrical', 'imported'],
      custom_fields: {
        importedFrom: 'load-calculator',
        importDate: new Date().toISOString(),
        loadCalculations: calculations,
        loadData: loadData,
        projectSettings: projectSettings,
        totalLoad: totalLoad,
        mainBreakerSize: projectSettings?.mainBreaker,
        calculationMethod: projectSettings?.calculationMethod,
        squareFootage: projectSettings?.squareFootage
      }
    };
  }

  // Estimate project value based on load calculations and industry standards
  private static estimateProjectValue(loadData: any, calculations: any): number {
    if (!calculations) return 0;

    const totalLoad = calculations.totalLoad || 0;
    const hasEVSE = loadData?.evse?.length > 0;
    const hasSolar = loadData?.solarBattery?.solar?.inverterSize > 0;
    const hasBattery = loadData?.solarBattery?.battery?.capacity > 0;
    
    // Base electrical work estimate: $15-25 per amp
    let baseValue = totalLoad * 20;
    
    // EVSE installation premium
    if (hasEVSE) {
      const evseCount = loadData.evse.length;
      baseValue += evseCount * 2500; // Average EVSE installation cost
    }
    
    // Solar installation premium
    if (hasSolar) {
      const inverterSize = loadData.solarBattery.solar.inverterSize;
      baseValue += inverterSize * 3; // $3 per watt solar premium
    }
    
    // Battery installation premium
    if (hasBattery) {
      const batteryCapacity = loadData.solarBattery.battery.capacity;
      baseValue += batteryCapacity * 1000; // $1000 per kWh battery premium
    }
    
    // Round to nearest $100
    return Math.round(baseValue / 100) * 100;
  }

  // Determine project priority based on load and value
  private static determinePriority(totalLoad: number, estimatedValue: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (estimatedValue > 50000 || totalLoad > 300) return 'high';
    if (estimatedValue > 20000 || totalLoad > 150) return 'medium';
    return 'low';
  }

  // Calculate expected close date (typically 30-90 days for electrical projects)
  private static calculateExpectedCloseDate(): string {
    const now = new Date();
    const closeDate = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000)); // 60 days from now
    return closeDate.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  }

  // Sync existing projects with CRM
  static async syncExistingProjects(
    crmActions: ReturnType<typeof useCRM>,
    existingProjects: any[]
  ): Promise<void> {
    for (const project of existingProjects) {
      try {
        await this.createProjectFromSession(
          crmActions,
          project.projectSettings || project,
          project.loadData || project.data,
          project.calculations
        );
      } catch (error) {
        console.error('Failed to sync project:', project.name || project.id, error);
      }
    }
  }

  // Create customer from address autocomplete data
  static createCustomerFromAddress(
    addressData: any,
    additionalInfo: Partial<CreateCustomerRequest> = {}
  ): CreateCustomerRequest {
    return {
      name: additionalInfo.name || 'New Customer',
      email: additionalInfo.email,
      phone: additionalInfo.phone,
      address: {
        street: addressData.street || addressData.formatted_address,
        city: addressData.city,
        state: addressData.state,
        zipCode: addressData.zipCode || addressData.postal_code
      },
      source: 'website',
      tags: ['prospect', 'address-lookup'],
      ...additionalInfo
    };
  }

  // Link existing load calculator project with CRM project
  static linkProjectWithCRM(
    loadCalculatorProjectId: string,
    crmProjectId: string,
    metadata: Record<string, any> = {}
  ): void {
    // Store the link in localStorage for now
    // In a full implementation, this would be stored in the database
    const links = JSON.parse(localStorage.getItem('crm-project-links') || '{}');
    links[loadCalculatorProjectId] = {
      crmProjectId,
      linkedAt: new Date().toISOString(),
      metadata
    };
    localStorage.setItem('crm-project-links', JSON.stringify(links));
  }

  // Get CRM project ID for a load calculator project
  static getCRMProjectId(loadCalculatorProjectId: string): string | null {
    const links = JSON.parse(localStorage.getItem('crm-project-links') || '{}');
    return links[loadCalculatorProjectId]?.crmProjectId || null;
  }

  // Update CRM project when load calculator data changes
  static async updateCRMFromCalculator(
    crmActions: ReturnType<typeof useCRM>,
    loadCalculatorProjectId: string,
    projectSettings: any,
    loadData: any,
    calculations: any
  ): Promise<void> {
    const crmProjectId = this.getCRMProjectId(loadCalculatorProjectId);
    if (!crmProjectId) return;

    // Update project value and custom fields
    const updatedValue = this.estimateProjectValue(loadData, calculations);
    const updatedPriority = this.determinePriority(
      calculations?.totalLoad || 0, 
      updatedValue
    );

    try {
      await crmActions.updateProject({
        id: crmProjectId,
        value: updatedValue,
        priority: updatedPriority,
        custom_fields: {
          lastUpdated: new Date().toISOString(),
          loadCalculations: calculations,
          loadData: loadData,
          projectSettings: projectSettings
        }
      });

      // Create activity for the update
      await crmActions.createActivity({
        project_id: crmProjectId,
        type: 'note',
        title: 'Project data updated from Load Calculator',
        description: `Project calculations updated. New estimated value: $${updatedValue.toLocaleString()}`,
        metadata: {
          updatedAt: new Date().toISOString(),
          previousUpdate: true
        }
      });
    } catch (error) {
      console.error('Failed to update CRM project:', error);
    }
  }
}

// React hook for CRM integration
export const useCRMIntegration = () => {
  const crmActions = useCRM();
  const { settings } = useProjectSettings();
  const { loads } = useLoadData();

  const createProjectFromCurrentSession = async (calculations: any) => {
    return CRMIntegrationService.createProjectFromSession(
      crmActions,
      settings,
      loads,
      calculations
    );
  };

  const updateCRMFromCurrentSession = async (
    loadCalculatorProjectId: string,
    calculations: any
  ) => {
    return CRMIntegrationService.updateCRMFromCalculator(
      crmActions,
      loadCalculatorProjectId,
      settings,
      loads,
      calculations
    );
  };

  return {
    createProjectFromCurrentSession,
    updateCRMFromCurrentSession,
    linkProjectWithCRM: CRMIntegrationService.linkProjectWithCRM,
    getCRMProjectId: CRMIntegrationService.getCRMProjectId,
    createCustomerFromAddress: CRMIntegrationService.createCustomerFromAddress,
    ...crmActions
  };
};