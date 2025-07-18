import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import {
  ComplianceData,
  ComplianceStatus,
  ValidationResult,
  ComplianceIssue,
  Inspection,
  ComplianceDocument,
  AHJ,
  ComplianceError,
  AuditEntry
} from '../types/compliance';
import { useProjectSettings } from './ProjectSettingsContext';
import { useLoadData } from './LoadDataContext';

// Actions for compliance state management
type ComplianceAction =
  | { type: 'SET_COMPLIANCE_DATA'; payload: ComplianceData }
  | { type: 'UPDATE_COMPLIANCE_STATUS'; payload: ComplianceStatus }
  | { type: 'SET_AHJ'; payload: string }
  | { type: 'ADD_VALIDATION_RESULT'; payload: ValidationResult }
  | { type: 'UPDATE_COMPLIANCE_SCORE'; payload: number }
  | { type: 'ADD_ISSUE'; payload: ComplianceIssue }
  | { type: 'UPDATE_ISSUE'; payload: { id: string; updates: Partial<ComplianceIssue> } }
  | { type: 'RESOLVE_ISSUE'; payload: { id: string; resolution: any } }
  | { type: 'ADD_INSPECTION'; payload: Inspection }
  | { type: 'UPDATE_INSPECTION'; payload: { id: string; updates: Partial<Inspection> } }
  | { type: 'ADD_DOCUMENT'; payload: ComplianceDocument }
  | { type: 'UPDATE_DOCUMENT'; payload: { id: string; updates: Partial<ComplianceDocument> } }
  | { type: 'ADD_AUDIT_ENTRY'; payload: AuditEntry }
  | { type: 'RESET_COMPLIANCE' };

// Initial compliance state
const initialComplianceState: ComplianceData = {
  status: 'not_started',
  codeYear: '2023',
  validationResults: [],
  complianceScore: 0,
  activeIssues: [],
  resolvedIssues: [],
  inspections: [],
  documents: [],
  submissionHistory: [],
  auditTrail: []
};

// Compliance reducer
function complianceReducer(state: ComplianceData, action: ComplianceAction): ComplianceData {
  switch (action.type) {
    case 'SET_COMPLIANCE_DATA':
      return { ...action.payload };
    
    case 'UPDATE_COMPLIANCE_STATUS':
      return { ...state, status: action.payload };
    
    case 'SET_AHJ':
      return { ...state, ahjId: action.payload };
    
    case 'ADD_VALIDATION_RESULT':
      return {
        ...state,
        validationResults: [action.payload, ...state.validationResults.slice(0, 9)], // Keep last 10 results
        lastValidation: action.payload.validatedAt
      };
    
    case 'UPDATE_COMPLIANCE_SCORE':
      return { ...state, complianceScore: action.payload };
    
    case 'ADD_ISSUE':
      return {
        ...state,
        activeIssues: [...state.activeIssues, action.payload]
      };
    
    case 'UPDATE_ISSUE':
      return {
        ...state,
        activeIssues: state.activeIssues.map(issue =>
          issue.id === action.payload.id
            ? { ...issue, ...action.payload.updates }
            : issue
        )
      };
    
    case 'RESOLVE_ISSUE':
      const issueToResolve = state.activeIssues.find(issue => issue.id === action.payload.id);
      if (!issueToResolve) return state;
      
      const resolvedIssue = {
        ...issueToResolve,
        status: 'resolved' as const,
        resolution: action.payload.resolution,
        resolvedAt: new Date(),
        resolvedBy: 'user' // This could be dynamic based on current user
      };
      
      return {
        ...state,
        activeIssues: state.activeIssues.filter(issue => issue.id !== action.payload.id),
        resolvedIssues: [...state.resolvedIssues, resolvedIssue]
      };
    
    case 'ADD_INSPECTION':
      return {
        ...state,
        inspections: [...state.inspections, action.payload],
        nextInspectionDate: action.payload.scheduledDate || state.nextInspectionDate
      };
    
    case 'UPDATE_INSPECTION':
      return {
        ...state,
        inspections: state.inspections.map(inspection =>
          inspection.id === action.payload.id
            ? { ...inspection, ...action.payload.updates }
            : inspection
        )
      };
    
    case 'ADD_DOCUMENT':
      return {
        ...state,
        documents: [...state.documents, action.payload]
      };
    
    case 'UPDATE_DOCUMENT':
      return {
        ...state,
        documents: state.documents.map(doc =>
          doc.id === action.payload.id
            ? { ...doc, ...action.payload.updates }
            : doc
        )
      };
    
    case 'ADD_AUDIT_ENTRY':
      return {
        ...state,
        auditTrail: [action.payload, ...state.auditTrail.slice(0, 99)] // Keep last 100 entries
      };
    
    case 'RESET_COMPLIANCE':
      return { ...initialComplianceState };
    
    default:
      return state;
  }
}

// Context interface
interface ComplianceContextType {
  // State
  complianceData: ComplianceData;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setComplianceData: (data: ComplianceData) => void;
  updateComplianceStatus: (status: ComplianceStatus) => void;
  setAHJ: (ahjId: string) => void;
  addValidationResult: (result: ValidationResult) => void;
  updateComplianceScore: (score: number) => void;
  
  // Issue management
  addIssue: (issue: ComplianceIssue) => void;
  updateIssue: (id: string, updates: Partial<ComplianceIssue>) => void;
  resolveIssue: (id: string, resolution: any) => void;
  
  // Inspection management
  addInspection: (inspection: Inspection) => void;
  updateInspection: (id: string, updates: Partial<Inspection>) => void;
  
  // Document management
  addDocument: (document: ComplianceDocument) => void;
  updateDocument: (id: string, updates: Partial<ComplianceDocument>) => void;
  
  // Utility functions
  getComplianceScore: () => number;
  getCriticalIssues: () => ComplianceIssue[];
  getUpcomingInspections: () => Inspection[];
  isReadyForInspection: (inspectionType: string) => boolean;
  
  // Reset
  resetCompliance: () => void;
}

// Create context
const ComplianceContext = createContext<ComplianceContextType | undefined>(undefined);

// Provider component
export const ComplianceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complianceData, dispatch] = useReducer(complianceReducer, initialComplianceState);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  // Get project context for integration
  const { settings } = useProjectSettings();
  const { loads } = useLoadData();

  // Action creators
  const setComplianceData = useCallback((data: ComplianceData) => {
    dispatch({ type: 'SET_COMPLIANCE_DATA', payload: data });
  }, []);

  const updateComplianceStatus = useCallback((status: ComplianceStatus) => {
    dispatch({ type: 'UPDATE_COMPLIANCE_STATUS', payload: status });
    
    // Add audit entry
    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date(),
      userId: 'current_user', // This should be dynamic
      action: 'update_compliance_status',
      entityType: 'project',
      entityId: settings.projectInfo?.projectName || 'unknown',
      changes: { status },
      notes: `Compliance status updated to ${status}`
    };
    dispatch({ type: 'ADD_AUDIT_ENTRY', payload: auditEntry });
  }, [settings.projectInfo?.projectName]);

  const setAHJ = useCallback((ahjId: string) => {
    dispatch({ type: 'SET_AHJ', payload: ahjId });
  }, []);

  const addValidationResult = useCallback((result: ValidationResult) => {
    dispatch({ type: 'ADD_VALIDATION_RESULT', payload: result });
    
    // Update compliance score based on validation
    const score = Math.round(result.overallScore);
    dispatch({ type: 'UPDATE_COMPLIANCE_SCORE', payload: score });
    
    // Update status based on critical issues
    const newStatus: ComplianceStatus = result.criticalIssues > 0 ? 'non_compliant' : 
                                       result.warnings > 0 ? 'in_progress' : 'compliant';
    dispatch({ type: 'UPDATE_COMPLIANCE_STATUS', payload: newStatus });
  }, []);

  const updateComplianceScore = useCallback((score: number) => {
    dispatch({ type: 'UPDATE_COMPLIANCE_SCORE', payload: score });
  }, []);

  const addIssue = useCallback((issue: ComplianceIssue) => {
    dispatch({ type: 'ADD_ISSUE', payload: issue });
  }, []);

  const updateIssue = useCallback((id: string, updates: Partial<ComplianceIssue>) => {
    dispatch({ type: 'UPDATE_ISSUE', payload: { id, updates } });
  }, []);

  const resolveIssue = useCallback((id: string, resolution: any) => {
    dispatch({ type: 'RESOLVE_ISSUE', payload: { id, resolution } });
  }, []);

  const addInspection = useCallback((inspection: Inspection) => {
    dispatch({ type: 'ADD_INSPECTION', payload: inspection });
  }, []);

  const updateInspection = useCallback((id: string, updates: Partial<Inspection>) => {
    dispatch({ type: 'UPDATE_INSPECTION', payload: { id, updates } });
  }, []);

  const addDocument = useCallback((document: ComplianceDocument) => {
    dispatch({ type: 'ADD_DOCUMENT', payload: document });
  }, []);

  const updateDocument = useCallback((id: string, updates: Partial<ComplianceDocument>) => {
    dispatch({ type: 'UPDATE_DOCUMENT', payload: { id, updates } });
  }, []);

  // Utility functions
  const getComplianceScore = useCallback((): number => {
    return complianceData.complianceScore;
  }, [complianceData.complianceScore]);

  const getCriticalIssues = useCallback((): ComplianceIssue[] => {
    return complianceData.activeIssues.filter(issue => issue.severity === 'critical');
  }, [complianceData.activeIssues]);

  const getUpcomingInspections = useCallback((): Inspection[] => {
    const now = new Date();
    return complianceData.inspections
      .filter(inspection => inspection.scheduledDate && inspection.scheduledDate > now)
      .sort((a, b) => (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0));
  }, [complianceData.inspections]);

  const isReadyForInspection = useCallback((inspectionType: string): boolean => {
    const criticalIssues = getCriticalIssues();
    const hasActiveViolations = criticalIssues.some(issue => issue.type === 'nec_violation');
    
    // Basic readiness check - no critical violations
    return !hasActiveViolations && complianceData.complianceScore >= 80;
  }, [getCriticalIssues, complianceData.complianceScore]);

  const resetCompliance = useCallback(() => {
    dispatch({ type: 'RESET_COMPLIANCE' });
    setError(null);
  }, []);

  // Effect to trigger validation when load data changes
  useEffect(() => {
    if (loads && Object.keys(loads).length > 0) {
      // This would trigger automatic compliance validation
      // For now, we'll just update the last validation timestamp
      const now = new Date();
      if (!complianceData.lastValidation || 
          now.getTime() - complianceData.lastValidation.getTime() > 5 * 60 * 1000) { // 5 minutes
        // Could trigger validation here
        console.log('Load data changed - compliance validation may be needed');
      }
    }
  }, [loads, complianceData.lastValidation]);

  const contextValue: ComplianceContextType = {
    // State
    complianceData,
    isLoading,
    error,
    
    // Actions
    setComplianceData,
    updateComplianceStatus,
    setAHJ,
    addValidationResult,
    updateComplianceScore,
    
    // Issue management
    addIssue,
    updateIssue,
    resolveIssue,
    
    // Inspection management
    addInspection,
    updateInspection,
    
    // Document management
    addDocument,
    updateDocument,
    
    // Utility functions
    getComplianceScore,
    getCriticalIssues,
    getUpcomingInspections,
    isReadyForInspection,
    
    // Reset
    resetCompliance
  };

  return (
    <ComplianceContext.Provider value={contextValue}>
      {children}
    </ComplianceContext.Provider>
  );
};

// Hook to use compliance context
export const useCompliance = (): ComplianceContextType => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};

// Convenience hooks for specific data
export const useComplianceScore = (): number => {
  const { getComplianceScore } = useCompliance();
  return getComplianceScore();
};

export const useComplianceIssues = () => {
  const { complianceData } = useCompliance();
  return {
    activeIssues: complianceData.activeIssues,
    resolvedIssues: complianceData.resolvedIssues,
    criticalCount: complianceData.activeIssues.filter(issue => issue.severity === 'critical').length,
    warningCount: complianceData.activeIssues.filter(issue => issue.severity === 'minor').length
  };
};

export const useComplianceInspections = () => {
  const { complianceData, getUpcomingInspections } = useCompliance();
  return {
    allInspections: complianceData.inspections,
    upcomingInspections: getUpcomingInspections(),
    completedInspections: complianceData.inspections.filter(i => i.status === 'completed'),
    nextInspectionDate: complianceData.nextInspectionDate
  };
};