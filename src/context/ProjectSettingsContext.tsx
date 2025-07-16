import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { 
  ProjectInformation, 
  CalculationMethod, 
  PanelDetails, 
  ActualDemandData 
} from '../types';

interface ProjectSettingsState {
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
}

interface ProjectSettingsContextType {
  settings: ProjectSettingsState;
  updateProjectInfo: (updates: Partial<ProjectInformation>) => void;
  updateCalculationSettings: (updates: Partial<Pick<ProjectSettingsState, 
    'squareFootage' | 'codeYear' | 'calculationMethod' | 'mainBreaker'
  >>) => void;
  updatePanelDetails: (updates: Partial<PanelDetails>) => void;
  updateLoadManagement: (updates: Partial<Pick<ProjectSettingsState,
    'useEMS' | 'emsMaxLoad' | 'loadManagementType' | 'loadManagementMaxLoad' | 
    'simpleSwitchMode' | 'simpleSwitchLoadA' | 'simpleSwitchLoadB'
  >>) => void;
  updateActualDemandData: (updates: Partial<ActualDemandData>) => void;
  resetSettings: () => void;
  saveToLocalStorage: (projectId: string) => void;
  loadFromLocalStorage: (projectId: string) => boolean;
}

const initialProjectInfo: ProjectInformation = {
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
  permitNumber: '',
  inspectionDate: '',
  notes: ''
};

const initialPanelDetails: PanelDetails = {
  manufacturer: '',
  model: '',
  type: 'main',
  phases: 1,
  voltage: 240,
  busRating: 200,
  interruptingRating: 10000,
  availableSpaces: 40,
  usedSpaces: 0
};

const initialActualDemandData: ActualDemandData = {
  enabled: false,
  averageDemand: 0,
  peakDemand: 0,
  dataSource: '',
  measurementPeriod: '12-month'
};

const initialSettings: ProjectSettingsState = {
  projectInfo: initialProjectInfo,
  squareFootage: 0,
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
  simpleSwitchLoadB: null
};

const ProjectSettingsContext = createContext<ProjectSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'loadCalculator_projectSettings';
const SESSION_KEY = 'loadCalculator_sessionSettings';

export const ProjectSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ProjectSettingsState>(() => {
    // First try to load from sessionStorage (temporary working data)
    try {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return { ...initialSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load session settings:', error);
    }

    // If no session data, start with clean initial settings
    return initialSettings;
  });

  // Auto-save to sessionStorage for temporary working data
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('Failed to save session settings:', error);
    }
  }, [settings]);
  
  const updateProjectInfo = React.useCallback((updates: Partial<ProjectInformation>) => {
    setSettings(prev => ({
      ...prev,
      projectInfo: { ...prev.projectInfo, ...updates }
    }));
  }, []);
  
  const updateCalculationSettings = React.useCallback((updates: Partial<Pick<ProjectSettingsState, 
    'squareFootage' | 'codeYear' | 'calculationMethod' | 'mainBreaker'
  >>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updatePanelDetails = React.useCallback((updates: Partial<PanelDetails>) => {
    setSettings(prev => ({
      ...prev,
      panelDetails: { ...prev.panelDetails, ...updates }
    }));
  }, []);
  
  const updateLoadManagement = React.useCallback((updates: Partial<Pick<ProjectSettingsState,
    'useEMS' | 'emsMaxLoad' | 'loadManagementType' | 'loadManagementMaxLoad' | 
    'simpleSwitchMode' | 'simpleSwitchLoadA' | 'simpleSwitchLoadB'
  >>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateActualDemandData = React.useCallback((updates: Partial<ActualDemandData>) => {
    setSettings(prev => ({
      ...prev,
      actualDemandData: { ...prev.actualDemandData, ...updates }
    }));
  }, []);
  
  const resetSettings = React.useCallback(() => {
    setSettings(initialSettings);
    // Clear session storage when resetting
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
  }, []);

  const saveToLocalStorage = React.useCallback((projectId: string) => {
    try {
      const projectKey = `${STORAGE_KEY}_${projectId}`;
      localStorage.setItem(projectKey, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.warn('Failed to save project settings to localStorage:', error);
      return false;
    }
  }, [settings]);

  const loadFromLocalStorage = React.useCallback((projectId: string) => {
    try {
      const projectKey = `${STORAGE_KEY}_${projectId}`;
      const saved = localStorage.getItem(projectKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings({ ...initialSettings, ...parsed });
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to load project settings from localStorage:', error);
      return false;
    }
  }, []);
  
  const contextValue = useMemo(() => ({
    settings,
    updateProjectInfo,
    updateCalculationSettings,
    updatePanelDetails,
    updateLoadManagement,
    updateActualDemandData,
    resetSettings,
    saveToLocalStorage,
    loadFromLocalStorage
  }), [
    settings,
    updateProjectInfo,
    updateCalculationSettings,
    updatePanelDetails,
    updateLoadManagement,
    updateActualDemandData,
    resetSettings,
    saveToLocalStorage,
    loadFromLocalStorage
  ]);
  
  return (
    <ProjectSettingsContext.Provider value={contextValue}>
      {children}
    </ProjectSettingsContext.Provider>
  );
};

export const useProjectSettings = (): ProjectSettingsContextType => {
  const context = useContext(ProjectSettingsContext);
  if (!context) {
    throw new Error('useProjectSettings must be used within a ProjectSettingsProvider');
  }
  return context;
};