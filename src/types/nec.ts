import type { ValidationMessage } from './index';

export interface NECViolation {
  code: string;
  section: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  recommendation?: string;
  calculation?: any;
}

export interface CircuitAnalysis {
  circuitId: string;
  circuitName: string;
  load: number; // amps
  voltage: number;
  wireSize: string;
  ampacity: number;
  length: number;
  material: 'copper' | 'aluminum';
  temperatureRating: '60C' | '75C' | '90C';
  conduitFill: number;
  violations: NECViolation[];
  recommendations: string[];
}

export interface ComplianceAnalysis {
  overallCompliance: boolean;
  totalViolations: number;
  criticalViolations: number;
  warningViolations: number;
  circuits: CircuitAnalysis[];
  systemViolations: NECViolation[];
  recommendations: string[];
}
