import type { ProjectInformation } from '../types';

export const initialProjectInfo: ProjectInformation = {
  customerName: '',
  propertyAddress: '',
  city: '',
  state: '',
  zipCode: '',
  projectName: '',
  projectNumber: '',
  engineerName: '',
  engineerLicense: '',
  contractorName: '',
  contractorLicense: '',
  calculatedBy: '',
  date: new Date().toISOString().split('T')[0], // Default to today's date
  permitNumber: '',
  jobNumber: '',
  prnNumber: '',
  issueDate: '',
  inspectionDate: '',
  approvedBy: '',
  jurisdiction: '',
  phone: '',
  email: '',
  notes: ''
};
