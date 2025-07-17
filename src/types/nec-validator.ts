import type { NECViolation } from './nec';
import type { SLDDiagram } from './sld';
import type { LoadState } from './load';

export interface RealTimeValidationResult {
  overallCompliance: boolean;
  totalViolations: number;
  criticalViolations: number;
  warningViolations: number;
  componentViolations: Map<string, NECViolation[]>;
  connectionViolations: Map<string, NECViolation[]>;
  systemViolations: NECViolation[];
  recommendations: string[];
  complianceScore: number; // 0-100
  lastValidated: Date;
}

export interface ValidationRule {
  id: string;
  name: string;
  necSection: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'component' | 'connection' | 'system' | 'layout';
  validator: (diagram: SLDDiagram, loads?: LoadState) => NECViolation[];
}
