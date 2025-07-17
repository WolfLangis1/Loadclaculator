import type { ProjectSettingsState } from '../types';

export const initialLoadManagementSettings = {
  useEMS: false,
  emsMaxLoad: 0,
  loadManagementType: 'none',
  loadManagementMaxLoad: 0,
  simpleSwitchMode: 'branch_sharing',
  simpleSwitchLoadA: null,
  simpleSwitchLoadB: null
};
