/**
 * CRM Project Integration Service
 * Handles integration between Load Calculator and CRM system
 */

import { ProjectInformation } from '../types/calculation';
import { CalculationResults } from '../types/calculation';

export interface CRMCustomerData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  projectInfo: {
    projectName: string;
    projectNumber: string;
    calculatedBy: string;
    date: string;
    squareFootage: number;
  };
  calculationResults?: CalculationResults;
}

export interface CRMAttachment {
  filename: string;
  data: Blob;
  type: 'pdf' | 'image' | 'document';
  description?: string;
}

export class CRMProjectIntegrationService {
  
  /**
   * Check if project information is complete enough for CRM save
   */
  static isProjectReadyForCRM(projectInfo: ProjectInformation, squareFootage: number): boolean {
    const requiredFields = [
      projectInfo.customerName,
      projectInfo.propertyAddress,
      projectInfo.calculatedBy,
      squareFootage > 0
    ];
    
    const hasContactInfo = projectInfo.email || projectInfo.phone;
    
    return requiredFields.every(field => Boolean(field)) && hasContactInfo;
  }

  /**
   * Convert project information to CRM customer format
   */
  static convertToCRMCustomer(
    projectInfo: ProjectInformation, 
    squareFootage: number,
    calculationResults?: CalculationResults
  ): CRMCustomerData {
    return {
      name: projectInfo.customerName,
      email: projectInfo.email || '',
      phone: projectInfo.phone || '',
      address: {
        street: projectInfo.propertyAddress,
        city: projectInfo.city || '',
        state: projectInfo.state || '',
        zipCode: projectInfo.zipCode || ''
      },
      projectInfo: {
        projectName: projectInfo.projectName || `${projectInfo.customerName} - Electrical Load Calculation`,
        projectNumber: projectInfo.projectNumber || '',
        calculatedBy: projectInfo.calculatedBy,
        date: projectInfo.date || new Date().toISOString().split('T')[0],
        squareFootage
      },
      calculationResults
    };
  }

  /**
   * Create a new customer in CRM (requires CRM to be enabled)
   */
  static async createCRMCustomer(customerData: CRMCustomerData): Promise<string> {
    try {
      const response = await fetch('/api/crm-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          address: `${customerData.address.street}, ${customerData.address.city}, ${customerData.address.state} ${customerData.address.zipCode}`.trim(),
          tags: ['Load Calculator'],
          source: 'Load Calculator Application',
          customFields: {
            squareFootage: customerData.projectInfo.squareFootage,
            projectName: customerData.projectInfo.projectName,
            projectNumber: customerData.projectInfo.projectNumber,
            calculatedBy: customerData.projectInfo.calculatedBy,
            calculationDate: customerData.projectInfo.date,
            totalLoad: customerData.calculationResults?.totalDemand,
            serviceSize: customerData.calculationResults?.recommendedServiceSize
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create CRM customer: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data.id;
    } catch (error) {
      console.error('Error creating CRM customer:', error);
      throw error;
    }
  }

  /**
   * Create a CRM project linked to the customer
   */
  static async createCRMProject(customerId: string, customerData: CRMCustomerData): Promise<string> {
    try {
      const response = await fetch('/api/crm-projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerData.projectInfo.projectName,
          customerId: customerId,
          status: 'quoted',
          description: `Electrical load calculation for ${customerData.address.street}`,
          value: 0, // Can be updated later
          expectedCloseDate: null,
          customFields: {
            propertyAddress: `${customerData.address.street}, ${customerData.address.city}, ${customerData.address.state} ${customerData.address.zipCode}`.trim(),
            squareFootage: customerData.projectInfo.squareFootage,
            calculatedBy: customerData.projectInfo.calculatedBy,
            calculationDate: customerData.projectInfo.date,
            totalLoadAmps: customerData.calculationResults?.totalAmps,
            totalDemand: customerData.calculationResults?.totalDemand,
            recommendedServiceSize: customerData.calculationResults?.recommendedServiceSize,
            interconnectionCompliant: customerData.calculationResults?.interconnectionCompliant
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create CRM project: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data.id;
    } catch (error) {
      console.error('Error creating CRM project:', error);
      throw error;
    }
  }

  /**
   * Add attachment to CRM customer
   */
  static async addAttachmentToCRM(
    customerId: string, 
    attachment: CRMAttachment
  ): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', attachment.data, attachment.filename);
      formData.append('customerId', customerId);
      formData.append('type', attachment.type);
      if (attachment.description) {
        formData.append('description', attachment.description);
      }

      const response = await fetch('/api/crm-attachments', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to add attachment to CRM: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding attachment to CRM:', error);
      throw error;
    }
  }

  /**
   * Complete CRM integration workflow
   */
  static async saveToCRM(
    projectInfo: ProjectInformation,
    squareFootage: number,
    calculationResults?: CalculationResults
  ): Promise<{ customerId: string; projectId: string }> {
    if (!this.isProjectReadyForCRM(projectInfo, squareFootage)) {
      throw new Error('Project information is incomplete. Please fill in customer name, address, contact info, calculated by, and square footage.');
    }

    const customerData = this.convertToCRMCustomer(projectInfo, squareFootage, calculationResults);
    
    try {
      // Create customer in CRM
      const customerId = await this.createCRMCustomer(customerData);
      
      // Create project linked to customer
      const projectId = await this.createCRMProject(customerId, customerData);

      return { customerId, projectId };
    } catch (error) {
      console.error('Failed to save to CRM:', error);
      throw error;
    }
  }

  /**
   * Save PDF export to CRM
   */
  static async savePDFToCRM(
    customerId: string,
    pdfBlob: Blob,
    filename: string
  ): Promise<void> {
    const attachment: CRMAttachment = {
      filename,
      data: pdfBlob,
      type: 'pdf',
      description: 'Load calculation report'
    };

    return this.addAttachmentToCRM(customerId, attachment);
  }

  /**
   * Save aerial view images to CRM
   */
  static async saveAerialImageToCRM(
    customerId: string,
    imageBlob: Blob,
    filename: string,
    description: string = 'Site analysis image'
  ): Promise<void> {
    const attachment: CRMAttachment = {
      filename,
      data: imageBlob,
      type: 'image',
      description
    };

    return this.addAttachmentToCRM(customerId, attachment);
  }

  /**
   * Check if CRM integration is available
   */
  static isCRMAvailable(): boolean {
    // This would check if CRM feature flag is enabled and CRM services are available
    try {
      return typeof window !== 'undefined' && 
             window.localStorage.getItem('crm_enabled') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Get validation errors for CRM save
   */
  static getValidationErrors(projectInfo: ProjectInformation, squareFootage: number): string[] {
    const errors: string[] = [];

    if (!projectInfo.customerName) {
      errors.push('Customer name is required');
    }

    if (!projectInfo.propertyAddress) {
      errors.push('Property address is required');
    }

    if (!projectInfo.calculatedBy) {
      errors.push('Calculated by field is required');
    }

    if (!squareFootage || squareFootage <= 0) {
      errors.push('Square footage must be greater than 0');
    }

    if (!projectInfo.email && !projectInfo.phone) {
      errors.push('Either email or phone number is required');
    }

    return errors;
  }

  /**
   * Format phone number for display
   */
  static formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    
    return phone;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}