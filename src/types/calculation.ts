export interface CalculationResults {
  totalAmps: number;
  totalVA: number;
  totalDemand: number;
  generalLoadVA: number;
  generalDemand: number;
  applianceDemand: number;
  hvacDemand: number;
  evseDemand: number;
  batteryChargingDemand: number;
  solarCapacityKW: number;
  batteryCapacityKW: number;
  totalInterconnectionAmps: number;
  interconnectionCompliant: boolean;
  criticalLoadsAmps: number;
  spareCapacity: number;
  recommendedServiceSize: number;
  warnings: ValidationMessage[];
  errors: ValidationMessage[];
  appliancesIncludedInGeneral?: boolean;
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
  projectNumber: string;
  engineerName: string;
  engineerLicense: string;
  contractorName: string;
  contractorLicense: string;
  calculatedBy: string;
  date: string;
  permitNumber: string;
  jobNumber: string;
  prnNumber: string;
  issueDate: string;
  inspectionDate: string;
  approvedBy: string;
  jurisdiction: string;
  phone: string;
  notes: string;
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
  type: string;
  phases: number;
  voltage: number;
  busRating: number;
  interruptingRating: number;
  availableSpaces: number;
  usedSpaces: number;
}

export interface ActualDemandData {
  enabled: boolean;
  averageDemand: number;
  peakDemand: number;
  dataSource: string;
  measurementPeriod: string;
  month1?: number;
  month2?: number;
  month3?: number;
  month4?: number;
  month5?: number;
  month6?: number;
  month7?: number;
  month8?: number;
  month9?: number;
  month10?: number;
  month11?: number;
  month12?: number;
}

export interface WireSizeResult {
  wireSize: string;
  ampacity: number;
  voltageDrop: number;
  voltageDropPercent: number;
  derating: number;
}