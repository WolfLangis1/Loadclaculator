import React, { createContext, useReducer, useMemo, ReactNode } from 'react';
import type { 
  LoadState, 
  LoadAction, 
  CalculationResults, 
  ProjectInformation, 
  PanelDetails, 
  ActualDemandData,
  CalculationMethod,
  ProjectAttachment,
  AttachmentStats
} from '../types';
import { LOAD_TEMPLATES } from '../constants';
import { calculateLoadDemand } from '../services';
import { AttachmentService } from '../services/attachmentService';
import TemplateLearningService, { 
  UserBehaviorPattern, 
  PersonalizedTemplate, 
  PredictiveRecommendation,
  LearningAnalytics 
} from '../services/templateLearningService';

interface LoadCalculatorState {
  // Load data
  loads: LoadState;
  
  // Project settings
  projectInfo: ProjectInformation;
  squareFootage: number;
  codeYear: string;
  calculationMethod: CalculationMethod;
  mainBreaker: number;
  panelDetails: PanelDetails;
  actualDemandData: ActualDemandData;
  
  // Load Management settings
  useEMS: boolean;
  emsMaxLoad: number;
  loadManagementType: 'none' | 'ems' | 'simpleswitch' | 'dcc';
  loadManagementMaxLoad: number;
  simpleSwitchMode: 'branch_sharing' | 'feeder_monitoring';
  simpleSwitchLoadA: {
    type: 'general' | 'hvac' | 'evse';
    id: number;
    name: string;
    amps: number;
  } | null;
  simpleSwitchLoadB: {
    type: 'general' | 'hvac' | 'evse';
    id: number;
    name: string;
    amps: number;
  } | null;
  
  // UI state
  showAdvanced: boolean;
  activeTab: string;
  
  // Project attachments
  attachments: ProjectAttachment[];
  attachmentStats: AttachmentStats;
  
  // Template Learning
  userPatterns: UserBehaviorPattern[];
  personalizedTemplates: PersonalizedTemplate[];
  predictiveRecommendations: PredictiveRecommendation[];
  learningAnalytics: LearningAnalytics | null;
  enableTemplateLearning: boolean;
  userId: string;
}

export interface LoadCalculatorContextType {
  state: LoadCalculatorState;
  dispatch: React.Dispatch<LoadAction>;
  calculations: CalculationResults;
  updateProjectInfo: (updates: Partial<ProjectInformation>) => void;
  updateSettings: (updates: Partial<Omit<LoadCalculatorState, 'loads' | 'projectInfo'>>) => void;
  
  // Attachment methods
  addAttachment: (attachment: ProjectAttachment) => void;
  markAttachmentForExport: (attachmentId: string, exportOptions?: any) => void;
  unmarkAttachmentForExport: (attachmentId: string) => void;
  deleteAttachment: (attachmentId: string) => void;
  getExportAttachments: () => ProjectAttachment[];
  refreshAttachments: () => void;
  
  // Template Learning methods
  trackUserAction: (action: string, context: any) => void;
  applyPersonalizedTemplate: (templateId: string) => Promise<void>;
  recordTemplateFeedback: (templateId: string, feedback: any) => void;
  getPersonalizedRecommendations: () => Promise<PredictiveRecommendation[]>;
  updateLearningPreferences: (preferences: any) => void;
}

const initialProjectInfo: ProjectInformation = {
  customerName: '',
  propertyAddress: '',
  city: '',
  state: '',
  zipCode: '',
  projectName: '',
  calculatedBy: '',
  date: new Date().toISOString().split('T')[0],
  permitNumber: '',
  jobNumber: '',
  prnNumber: '',
  issueDate: '',
  approvedBy: '',
  jurisdiction: '',
  phone: ''
};

const initialPanelDetails: PanelDetails = {
  manufacturer: 'Square D',
  model: 'QO',
  busRating: 200,
  mainBreakerRating: 200,
  spaces: 40,
  phase: 1
};

const initialActualDemandData: ActualDemandData = {
  enabled: false,
  month1: 0, month2: 0, month3: 0, month4: 0,
  month5: 0, month6: 0, month7: 0, month8: 0,
  month9: 0, month10: 0, month11: 0, month12: 0,
  averageDemand: 0
};

const initialState: LoadCalculatorState = {
  loads: {
    generalLoads: [...LOAD_TEMPLATES.general],
    hvacLoads: [...LOAD_TEMPLATES.hvac],
    evseLoads: [...LOAD_TEMPLATES.evse],
    solarBatteryLoads: [...LOAD_TEMPLATES.solar]
  },
  projectInfo: initialProjectInfo,
  squareFootage: 1500,
  codeYear: '2023',
  calculationMethod: 'optional',
  mainBreaker: 200,
  panelDetails: initialPanelDetails,
  actualDemandData: initialActualDemandData,
  useEMS: false,
  emsMaxLoad: 0,
  loadManagementType: 'none',
  loadManagementMaxLoad: 0,
  simpleSwitchMode: 'branch_sharing',
  simpleSwitchLoadA: null,
  simpleSwitchLoadB: null,
  showAdvanced: false,
  activeTab: 'loads',
  
  // Project attachments
  attachments: [],
  attachmentStats: {
    total: 0,
    byType: {} as Record<any, number>,
    bySource: {} as Record<any, number>,
    markedForExport: 0,
    totalFileSize: 0
  },
  
  // Template Learning
  userPatterns: [],
  personalizedTemplates: [],
  predictiveRecommendations: [],
  learningAnalytics: null,
  enableTemplateLearning: true,
  userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

const loadReducer = (state: LoadState, action: LoadAction): LoadState => {
  switch (action.type) {
    case 'UPDATE_GENERAL_LOAD': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        generalLoads: state.generalLoads.map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    }
    
    case 'UPDATE_HVAC_LOAD': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        hvacLoads: state.hvacLoads.map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    }
    
    case 'UPDATE_EVSE_LOAD': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        evseLoads: state.evseLoads.map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    }
    
    case 'UPDATE_SOLAR_BATTERY_LOAD': {
      const { id, field, value } = action.payload;
      return {
        ...state,
        solarBatteryLoads: state.solarBatteryLoads.map(load =>
          load.id === id ? { ...load, [field]: value } : load
        )
      };
    }
    
    case 'ADD_LOAD': {
      const { category, ...loadData } = action.payload;
      switch (category) {
        case 'general':
          return { ...state, generalLoads: [...state.generalLoads, loadData] };
        case 'hvac':
          return { ...state, hvacLoads: [...state.hvacLoads, loadData] };
        case 'evse':
          return { ...state, evseLoads: [...state.evseLoads, loadData] };
        case 'solar':
          return { ...state, solarBatteryLoads: [...state.solarBatteryLoads, loadData] };
        default:
          return state;
      }
    }
    
    case 'REMOVE_LOAD': {
      const { category, id } = action.payload;
      switch (category) {
        case 'general':
          return { ...state, generalLoads: state.generalLoads.filter(load => load.id !== id) };
        case 'hvac':
          return { ...state, hvacLoads: state.hvacLoads.filter(load => load.id !== id) };
        case 'evse':
          return { ...state, evseLoads: state.evseLoads.filter(load => load.id !== id) };
        case 'solar':
          return { ...state, solarBatteryLoads: state.solarBatteryLoads.filter(load => load.id !== id) };
        default:
          return state;
      }
    }
    
    case 'RESET_LOADS': {
      return action.payload;
    }
    
    default:
      return state;
  }
};

export const LoadCalculatorContext = createContext<LoadCalculatorContextType | undefined>(undefined);

export const LoadCalculatorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loads, dispatch] = useReducer(loadReducer, initialState.loads);
  const [appState, setAppState] = React.useState(() => {
    const { loads, ...rest } = initialState;
    return rest;
  });
  
  const state: LoadCalculatorState = {
    loads,
    ...appState
  };
  
  // Split calculations into smaller, more targeted memos for better performance
  const baseCalculationInputs = useMemo(() => ({
    calculationMethod: state.calculationMethod,
    squareFootage: state.squareFootage,
    mainBreaker: state.mainBreaker,
    panelDetails: state.panelDetails,
    actualDemandData: state.actualDemandData
  }), [state.calculationMethod, state.squareFootage, state.mainBreaker, 
       state.panelDetails, state.actualDemandData]);

  const loadManagementInputs = useMemo(() => ({
    useEMS: state.useEMS,
    emsMaxLoad: state.emsMaxLoad,
    loadManagementType: state.loadManagementType,
    loadManagementMaxLoad: state.loadManagementMaxLoad,
    simpleSwitchMode: state.simpleSwitchMode,
    simpleSwitchLoadA: state.simpleSwitchLoadA,
    simpleSwitchLoadB: state.simpleSwitchLoadB
  }), [state.useEMS, state.emsMaxLoad, state.loadManagementType, 
       state.loadManagementMaxLoad, state.simpleSwitchMode,
       state.simpleSwitchLoadA, state.simpleSwitchLoadB]);

  const calculations = useMemo(() => 
    calculateLoadDemand(
      loads,
      baseCalculationInputs.calculationMethod,
      baseCalculationInputs.squareFootage,
      baseCalculationInputs.mainBreaker,
      baseCalculationInputs.panelDetails,
      baseCalculationInputs.actualDemandData,
      loadManagementInputs.useEMS,
      loadManagementInputs.emsMaxLoad,
      loadManagementInputs.loadManagementType,
      loadManagementInputs.loadManagementMaxLoad,
      loadManagementInputs.simpleSwitchMode,
      loadManagementInputs.simpleSwitchLoadA,
      loadManagementInputs.simpleSwitchLoadB
    ),
    [loads, baseCalculationInputs, loadManagementInputs]
  );
  
  const updateProjectInfo = React.useCallback((updates: Partial<ProjectInformation>) => {
    setAppState(prev => ({
      ...prev,
      projectInfo: { ...prev.projectInfo, ...updates }
    }));
  }, []);
  
  const updateSettings = React.useCallback((updates: Partial<Omit<LoadCalculatorState, 'loads' | 'projectInfo'>>) => {
    setAppState(prev => ({ ...prev, ...updates }));
  }, []);

  // Generate project ID for attachments
  const projectId = React.useMemo(() => {
    return `project_${state.projectInfo.customerName}_${state.projectInfo.propertyAddress}`.replace(/[^a-zA-Z0-9_]/g, '_') || 'default_project';
  }, [state.projectInfo.customerName, state.projectInfo.propertyAddress]);

  // Attachment methods
  const addAttachment = React.useCallback((attachment: ProjectAttachment) => {
    AttachmentService.addAttachment(projectId, attachment);
    refreshAttachments();
  }, [projectId]);

  const markAttachmentForExport = React.useCallback((attachmentId: string, exportOptions?: any) => {
    AttachmentService.markForExport(projectId, attachmentId, exportOptions);
    refreshAttachments();
  }, [projectId]);

  const unmarkAttachmentForExport = React.useCallback((attachmentId: string) => {
    AttachmentService.unmarkForExport(projectId, attachmentId);
    refreshAttachments();
  }, [projectId]);

  const deleteAttachment = React.useCallback((attachmentId: string) => {
    AttachmentService.deleteAttachment(projectId, attachmentId);
    refreshAttachments();
  }, [projectId]);

  const getExportAttachments = React.useCallback(() => {
    return AttachmentService.getExportAttachments(projectId);
  }, [projectId]);

  const refreshAttachments = React.useCallback(() => {
    const attachments = AttachmentService.getProjectAttachments(projectId);
    const stats = AttachmentService.getAttachmentStats(projectId);
    setAppState(prev => ({
      ...prev,
      attachments,
      attachmentStats: stats
    }));
  }, [projectId]);

  // Refresh attachments when project changes
  React.useEffect(() => {
    refreshAttachments();
  }, [refreshAttachments]);

  // Template Learning methods
  const [userActions, setUserActions] = React.useState<Array<{
    timestamp: Date;
    action: string;
    context: any;
  }>>([]);

  const trackUserAction = React.useCallback((action: string, context: any) => {
    if (!state.enableTemplateLearning) return;
    
    const actionData = {
      timestamp: new Date(),
      action,
      context
    };
    
    setUserActions(prev => [...prev, actionData]);
    console.log('📊 Tracking user action:', action);
  }, [state.enableTemplateLearning]);

  const applyPersonalizedTemplate = React.useCallback(async (templateId: string) => {
    try {
      const result = await TemplateLearningService.applyPersonalizedTemplate(
        state.userId,
        templateId,
        state.loads,
        true // user confirmation
      );

      if (result.success) {
        // Update loads with template data
        if (result.updatedState.loads) {
          Object.entries(result.updatedState.loads).forEach(([category, loads]) => {
            loads.forEach((load: any) => {
              dispatch({
                type: `ADD_${category.toUpperCase().slice(0, -5)}_LOAD` as any,
                payload: load
              });
            });
          });
        }

        // Update recommendations
        const recommendations = await TemplateLearningService.getPersonalizedRecommendations(
          state.userId,
          {
            loadState: state.loads,
            projectType: state.projectInfo.projectName || 'general',
            currentStep: state.activeTab,
            timeContext: new Date()
          }
        );

        setAppState(prev => ({
          ...prev,
          predictiveRecommendations: recommendations
        }));

        console.log('✅ Template applied successfully:', result.appliedChanges);
      }
    } catch (error) {
      console.error('❌ Failed to apply template:', error);
    }
  }, [state.userId, state.loads, state.projectInfo, state.activeTab, dispatch]);

  const recordTemplateFeedback = React.useCallback((templateId: string, feedback: any) => {
    TemplateLearningService.recordUserFeedback(state.userId, templateId, feedback);
    trackUserAction('template_feedback', { templateId, feedback });
  }, [state.userId, trackUserAction]);

  const getPersonalizedRecommendations = React.useCallback(async () => {
    try {
      const recommendations = await TemplateLearningService.getPersonalizedRecommendations(
        state.userId,
        {
          loadState: state.loads,
          projectType: state.projectInfo.projectName || 'general',
          currentStep: state.activeTab,
          timeContext: new Date()
        }
      );

      setAppState(prev => ({
        ...prev,
        predictiveRecommendations: recommendations
      }));

      return recommendations;
    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
      return [];
    }
  }, [state.userId, state.loads, state.projectInfo, state.activeTab]);

  const updateLearningPreferences = React.useCallback((preferences: any) => {
    setAppState(prev => ({
      ...prev,
      enableTemplateLearning: preferences.enableTemplateLearning ?? prev.enableTemplateLearning
    }));
    trackUserAction('learning_preferences_updated', preferences);
  }, [trackUserAction]);

  // Track session completion and analyze patterns
  React.useEffect(() => {
    if (userActions.length > 0 && state.enableTemplateLearning) {
      const sessionData = {
        projectType: state.projectInfo.projectName || 'general',
        actions: userActions.map(action => ({
          timestamp: action.timestamp,
          action: action.action,
          context: action.context
        })),
        completionStatus: 'in_progress' as const,
        finalState: state.loads,
        necCalculations: calculations as any,
        duration: userActions.length > 0 
          ? (new Date().getTime() - userActions[0].timestamp.getTime()) / 60000 
          : 0
      };

      // Debounced pattern analysis
      const timeoutId = setTimeout(async () => {
        try {
          const result = await TemplateLearningService.trackUserSession(
            state.userId,
            sessionData
          );

          setAppState(prev => ({
            ...prev,
            userPatterns: result.patternsDetected,
            personalizedTemplates: result.newTemplates,
            predictiveRecommendations: result.recommendations
          }));
        } catch (error) {
          console.error('❌ Pattern analysis failed:', error);
        }
      }, 5000); // 5 second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [userActions, state.enableTemplateLearning, state.userId, state.projectInfo, state.loads, calculations]);

  // Initialize template learning service
  React.useEffect(() => {
    if (state.enableTemplateLearning) {
      TemplateLearningService.initialize().catch(error => {
        console.error('❌ Template learning initialization failed:', error);
      });
    }
  }, [state.enableTemplateLearning]);
  
  const contextValue: LoadCalculatorContextType = {
    state,
    dispatch,
    calculations,
    updateProjectInfo,
    updateSettings,
    addAttachment,
    markAttachmentForExport,
    unmarkAttachmentForExport,
    deleteAttachment,
    getExportAttachments,
    refreshAttachments,
    trackUserAction,
    applyPersonalizedTemplate,
    recordTemplateFeedback,
    getPersonalizedRecommendations,
    updateLearningPreferences
  };
  
  return (
    <LoadCalculatorContext.Provider value={contextValue}>
      {children}
    </LoadCalculatorContext.Provider>
  );
};

