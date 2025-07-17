// Compliance and Inspection Management Types
// Based on the design document specifications

export type ComplianceStatus = 
  | 'not_started'
  | 'in_progress' 
  | 'compliant'
  | 'non_compliant'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type InspectionType = 
  | 'rough_electrical'
  | 'final_electrical' 
  | 'service_upgrade'
  | 'solar_pv'
  | 'energy_storage'
  | 'evse'
  | 'special_equipment';

export type InspectionStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'rescheduled';

export type ValidationCheckStatus = 'pass' | 'fail' | 'warning' | 'not_applicable';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'deferred';
export type IssueSeverity = 'critical' | 'major' | 'minor' | 'info';
export type IssueType = 'nec_violation' | 'local_code' | 'ahj_requirement' | 'design_error' | 'documentation';
export type DocumentStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'archived';
export type ValidationType = 'nec_compliance' | 'local_code' | 'ahj_requirements';

// Local code amendments
export interface LocalAmendment {
  id: string;
  section: string;
  description: string;
  requirement: string;
  effectiveDate: Date;
}

// Authority Having Jurisdiction
export interface AHJ {
  id: string;
  name: string;
  jurisdiction: string;
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    website?: string;
    officeHours: string;
  };
  requirements: {
    codeYear: '2017' | '2020' | '2023';
    localAmendments: LocalAmendment[];
    submissionFormat: 'pdf' | 'dwg' | 'both';
    requiredDocuments: string[];
    inspectionTypes: InspectionType[];
    processingTime: number; // days
  };
  preferences: {
    preferredContactMethod: 'email' | 'phone' | 'portal';
    schedulingSystem?: 'online' | 'phone' | 'email';
    digitalSubmission: boolean;
  };
  performance: {
    averageApprovalTime: number;
    commonRejectionReasons: string[];
    inspectorNotes: string[];
  };
}

// Validation Check Result
export interface ValidationCheck {
  id: string;
  category: string;
  description: string;
  necReference?: string;
  status: ValidationCheckStatus;
  details: string;
  suggestedFix?: string;
  autoFixable: boolean;
  severity: IssueSeverity;
}

// Overall Validation Result
export interface ValidationResult {
  id: string;
  projectId: string;
  validationType: ValidationType;
  status: 'pass' | 'fail' | 'warning';
  validatedAt: Date;
  validatedBy: 'system' | 'user';
  results: ValidationCheck[];
  overallScore: number; // 0-100
  criticalIssues: number;
  warnings: number;
  recommendations: string[];
}

// Inspection Checklist Item
export interface ChecklistItem {
  id: string;
  description: string;
  required: boolean;
  status: 'pending' | 'pass' | 'fail' | 'n/a';
  notes?: string;
  codeReference?: string;
}

// Inspection Finding
export interface InspectionFinding {
  id: string;
  type: 'violation' | 'deficiency' | 'recommendation' | 'observation';
  description: string;
  location: string;
  severity: IssueSeverity;
  codeReference?: string;
  correctionRequired: boolean;
  followUpInspection: boolean;
  photos?: string[];
}

// Inspector Information
export interface Inspector {
  name: string;
  contact: string;
  preferences?: string[];
}

// Inspection
export interface Inspection {
  id: string;
  projectId: string;
  type: InspectionType;
  status: InspectionStatus;
  scheduledDate?: Date;
  completedDate?: Date;
  inspector: Inspector;
  checklist: ChecklistItem[];
  findings: InspectionFinding[];
  result: 'pass' | 'fail' | 'conditional' | 'pending';
  nextSteps: string[];
  documents: string[]; // Document IDs
  notes: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

// Issue Comment
export interface IssueComment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  attachments?: string[];
}

// Notification Settings
export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  reminderDays: number[];
  escalationDays: number;
}

// Issue Resolution
export interface IssueResolution {
  description: string;
  correctionMade: string;
  verificationMethod: string;
  resolvedBy: string;
  reviewRequired: boolean;
  attachments: string[];
}

// Compliance Issue
export interface ComplianceIssue {
  id: string;
  projectId: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  
  // Issue details
  title: string;
  description: string;
  codeReference?: string;
  location?: string; // Where in the project/diagram
  
  // Assignment and tracking
  assignedTo?: string;
  createdBy: string;
  createdAt: Date;
  dueDate?: Date;
  
  // Resolution
  resolution?: IssueResolution;
  resolvedAt?: Date;
  resolvedBy?: string;
  
  // Related data
  relatedComponents?: string[]; // SLD component IDs
  relatedCalculations?: string[]; // Load calculation IDs
  attachments: string[]; // Document IDs
  
  // Communication
  comments: IssueComment[];
  notifications: NotificationSettings;
}

// Document Signature
export interface DocumentSignature {
  signedBy: string;
  role: string;
  signedAt: Date;
  signature?: string; // Base64 encoded signature
}

// Approval Workflow
export interface ApprovalWorkflow {
  steps: {
    step: number;
    approver: string;
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    approvedAt?: Date;
  }[];
  currentStep: number;
  finalApproval: boolean;
}

// Compliance Document
export interface ComplianceDocument {
  id: string;
  projectId: string;
  type: 'permit_application' | 'inspection_report' | 'compliance_certificate' | 'correction_notice' | 'ahj_correspondence';
  
  // Document metadata
  name: string;
  description?: string;
  version: string;
  status: DocumentStatus;
  
  // File information
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  
  // Tracking
  createdAt: Date;
  createdBy: string;
  submittedAt?: Date;
  submittedTo?: string; // AHJ ID
  approvedAt?: Date;
  approvedBy?: string;
  
  // Relationships
  relatedInspections: string[];
  relatedIssues: string[];
  supersedes?: string; // Previous document version
  
  // Approval workflow
  approvalWorkflow?: ApprovalWorkflow;
  signatures: DocumentSignature[];
}

// Audit Trail Entry
export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  entityType: 'project' | 'inspection' | 'issue' | 'document';
  entityId: string;
  changes: Record<string, any>;
  notes?: string;
}

// Submission to AHJ
export interface Submission {
  id: string;
  ahjId: string;
  submittedAt: Date;
  submittedBy: string;
  documents: string[];
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'resubmission_required';
  trackingNumber?: string;
  estimatedReviewTime?: number;
  actualReviewTime?: number;
  reviewComments?: string;
}

// Submission Package for AHJ
export interface SubmissionPackage {
  documents: ComplianceDocument[];
  coverLetter: string;
  submissionForm: Record<string, any>;
  fees: {
    permitFee: number;
    inspectionFees: number;
    total: number;
  };
  timeline: {
    submissionDate: Date;
    estimatedApproval: Date;
    inspectionDates: Date[];
  };
}

// Performance Metrics for AHJ
export interface PerformanceMetrics {
  submissionId: string;
  reviewTime: number;
  approvalTime: number;
  rejectionReasons?: string[];
  inspectorRating: number;
  communicationRating: number;
  overallSatisfaction: number;
}

// AHJ Analytics
export interface AHJAnalytics {
  averageReviewTime: number;
  approvalRate: number;
  commonRejectionReasons: string[];
  bestPractices: string[];
  contactPreferences: Record<string, number>;
  seasonalTrends: Record<string, number>;
}

// Readiness Score for Inspection
export interface ReadinessScore {
  score: number; // 0-100
  readyForInspection: boolean;
  missingItems: string[];
  recommendations: string[];
  checklistCompletion: number;
  documentationComplete: boolean;
}

// Main Compliance Data Structure
export interface ComplianceData {
  // Core compliance data
  status: ComplianceStatus;
  ahjId?: string;
  codeYear: '2017' | '2020' | '2023';
  
  // Validation tracking
  lastValidation?: Date;
  validationResults: ValidationResult[];
  complianceScore: number; // 0-100
  
  // Issue tracking
  activeIssues: ComplianceIssue[];
  resolvedIssues: ComplianceIssue[];
  
  // Inspection management
  inspections: Inspection[];
  nextInspectionDate?: Date;
  
  // Document management
  documents: ComplianceDocument[];
  submissionHistory: Submission[];
  
  // Audit trail
  auditTrail: AuditEntry[];
}

// Compliance Report
export interface ComplianceReport {
  id: string;
  projectId: string;
  generatedAt: Date;
  generatedBy: string;
  reportType: 'summary' | 'detailed' | 'inspection_ready' | 'ahj_submission';
  
  // Report content
  summary: {
    overallScore: number;
    status: ComplianceStatus;
    criticalIssues: number;
    warnings: number;
    readyForInspection: boolean;
  };
  
  sections: {
    validation: ValidationResult[];
    issues: ComplianceIssue[];
    inspections: Inspection[];
    documents: ComplianceDocument[];
    recommendations: string[];
  };
  
  // Export options
  format: 'pdf' | 'html' | 'json';
  includeAttachments: boolean;
  confidential: boolean;
}

// Error classes for compliance operations
export class ComplianceError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: IssueSeverity,
    public codeReference?: string,
    public suggestedFix?: string
  ) {
    super(message);
    this.name = 'ComplianceError';
  }
}

// Validation Request for offline queuing
export interface ValidationRequest {
  projectId: string;
  data: any;
  timestamp: number;
}