export interface CalculationResults {
  totalAmps: number;
  totalVA: number;
  generalLoadVA: number;
  generalDemand: number;
  applianceDemand: number;
  hvacDemand: number;
  evseDemand: number;
  solarCapacityKW: number;
  batteryCapacityKW: number;
  totalInterconnectionAmps: number;
  interconnectionCompliant: boolean;
  criticalLoadsAmps: number;
  spareCapacity: number;
  recommendedServiceSize: number;
  warnings: ValidationMessage[];
  errors: ValidationMessage[];
}

export interface ValidationMessage {
  type: 'warning' | 'error';
  message: string;
  code: string;
  field?: string;
}

export type CalculationMethod = 'optional' | 'standard' | 'existing';

export interface ProjectInformation {
  customerName: string;
  propertyAddress: string;
  city: string;
  state: string;
  zipCode: string;
  projectName: string;
  calculatedBy: string;
  date: string;
  permitNumber: string;
  jobNumber: string;
  prnNumber: string;
  issueDate: string;
  approvedBy: string;
  jurisdiction: string;
  phone: string;
}

export interface ContractorInformation {
  companyName: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  logoUrl?: string;
}

export interface AHJInformation {
  jurisdictionName: string;
  inspectorName: string;
  inspectionDate: string;
  notes: string;
  approved: boolean;
}

export interface PanelDetails {
  manufacturer: string;
  model: string;
  busRating: number;
  mainBreakerRating: number;
  spaces: number;
  phase: number;
}

export interface ActualDemandData {
  enabled: boolean;
  month1: number;
  month2: number;
  month3: number;
  month4: number;
  month5: number;
  month6: number;
  month7: number;
  month8: number;
  month9: number;
  month10: number;
  month11: number;
  month12: number;
  averageDemand: number;
}

export interface WireSizeResult {
  wireSize: string;
  ampacity: number;
  voltageDrop: number;
  voltageDropPercent: number;
  derating: number;
}