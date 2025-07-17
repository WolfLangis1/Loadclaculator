import type { ProjectSettingsState, ProjectInformation, PanelDetails, ActualDemandData } from '../types';

interface UpdateSettingsArgs {
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
}

export const updateSettingsHelper = (updates: any, { 
  updateProjectInfo, 
  updateCalculationSettings, 
  updatePanelDetails, 
  updateLoadManagement,
  updateActualDemandData
}: UpdateSettingsArgs) => {
  const loadManagementFields = ['loadManagementType', 'simpleSwitchMode', 'useEMS', 'emsMaxLoad', 'loadManagementMaxLoad', 'simpleSwitchLoadA', 'simpleSwitchLoadB'];
  const calculationFields = ['squareFootage', 'calculationMethod', 'mainBreaker', 'codeYear'];
  const panelFields = ['busRating', 'manufacturer', 'model', 'type', 'phases', 'voltage', 'interruptingRating', 'availableSpaces', 'usedSpaces'];
  const actualDemandFields = ['enabled', 'averageDemand', 'peakDemand', 'dataSource', 'measurementPeriod'];

  const loadManagementUpdates: any = {};
  const calculationUpdates: any = {};
  const panelUpdates: any = {};
  const projectInfoUpdates: any = {};
  const actualDemandUpdates: any = {};
  
  Object.keys(updates).forEach(key => {
    if (loadManagementFields.includes(key)) {
      loadManagementUpdates[key] = updates[key];
    } else if (calculationFields.includes(key)) {
      calculationUpdates[key] = updates[key];
    } else if (panelFields.includes(key)) {
      panelUpdates[key] = updates[key];
    } else if (actualDemandFields.includes(key)) {
      actualDemandUpdates[key] = updates[key];
    } else {
      projectInfoUpdates[key] = updates[key];
    }
  });
  
  if (Object.keys(loadManagementUpdates).length > 0) {
    updateLoadManagement(loadManagementUpdates);
  }
  if (Object.keys(calculationUpdates).length > 0) {
    updateCalculationSettings(calculationUpdates);
  }
  if (Object.keys(panelUpdates).length > 0) {
    updatePanelDetails(panelUpdates);
  }
  if (Object.keys(actualDemandUpdates).length > 0) {
    updateActualDemandData(actualDemandUpdates);
  }
  if (Object.keys(projectInfoUpdates).length > 0) {
    updateProjectInfo(projectInfoUpdates);
  }
};
