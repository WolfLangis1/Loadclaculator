import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type {
  ProjectInformation,
  CalculationMethod,
  PanelDetails,
  ActualDemandData,
  ProjectSettingsState
} from '../types';
import { initialProjectInfo } from '../constants/initialProjectInfo';
import { initialPanelDetails } from '../constants/initialPanelDetails';
import { initialActualDemandData } from '../constants/initialActualDemandData';
import { initialLoadManagementSettings } from '../constants/initialLoadManagementSettings';

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

const initialSettings: ProjectSettingsState = {
  projectInfo: initialProjectInfo,
  squareFootage: 2000, // Default to 2000 sq ft for typical residence
  codeYear: '2023',
  calculationMethod: 'optional',
  mainBreaker: 200,
  panelDetails: initialPanelDetails,
  actualDemandData: initialActualDemandData,
  ...initialLoadManagementSettings
};

const ProjectSettingsContext = createContext<ProjectSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'loadCalculator_projectSettings';
const SESSION_KEY = 'loadCalculator_sessionSettings';

export const ProjectSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ProjectSettingsState>(() => {
    try {
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return { ...initialSettings, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load session settings:', error);
    }

    return initialSettings;
  });

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
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.warn('Failed to clear session data:', error);
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