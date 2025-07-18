import React, { createContext, useContext, useReducer, useEffect, useMemo } from 'react';
import { useSupabaseAuth } from './SupabaseAuthContext';

// User settings interface
interface UserSettings {
  // Theme & Display
  theme: 'light' | 'dark' | 'system';
  units: 'imperial' | 'metric';
  timezone: string;
  
  // Application Preferences
  defaultCalculationMethod: 'standard' | 'optional' | 'existing';
  autoSave: boolean;
  saveInterval: number; // in seconds
  showAdvancedFeatures: boolean;
  enableNotifications: boolean;
  
  // API Configuration
  googleMapsApiKey?: string;
  openWeatherApiKey?: string;
  useRealAerialData: boolean;
  aerialProvider: 'google' | 'mapbox';
  
  // Report Settings
  defaultReportTemplate: string;
  includeLogoInReports: boolean;
  reportPaperSize: 'letter' | 'a4';
  reportOrientation: 'portrait' | 'landscape';
  
  // Professional Info (for reports)
  companyName?: string;
  licenseNumber?: string;
  certifications: string[];
  signature?: string;
  
  // UI Preferences
  compactMode: boolean;
  showTooltips: boolean;
  keyboardShortcuts: boolean;
  confirmDeletions: boolean;
}

// Default settings
const defaultSettings: UserSettings = {
  theme: 'system',
  units: 'imperial',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  defaultCalculationMethod: 'standard',
  autoSave: true,
  saveInterval: 30,
  showAdvancedFeatures: false,
  enableNotifications: true,
  useRealAerialData: true,
  aerialProvider: 'google',
  defaultReportTemplate: 'standard',
  includeLogoInReports: true,
  reportPaperSize: 'letter',
  reportOrientation: 'portrait',
  certifications: [],
  compactMode: false,
  showTooltips: true,
  keyboardShortcuts: true,
  confirmDeletions: true
};

// Action types
type UserSettingsAction = 
  | { type: 'SET_SETTING'; key: keyof UserSettings; value: any }
  | { type: 'SET_MULTIPLE_SETTINGS'; settings: Partial<UserSettings> }
  | { type: 'RESET_SETTINGS' }
  | { type: 'LOAD_SETTINGS'; settings: UserSettings };

// Context type
interface UserSettingsContextType {
  settings: UserSettings;
  dispatch: React.Dispatch<UserSettingsAction>;
  
  // Convenience methods
  setSetting: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => void;
  setMultipleSettings: (settings: Partial<UserSettings>) => void;
  resetSettings: () => void;
  saveSettings: () => Promise<void>;
  loadSettings: () => Promise<void>;
  exportSettings: () => string;
  importSettings: (settingsJson: string) => boolean;
}

// Reducer
function userSettingsReducer(state: UserSettings, action: UserSettingsAction): UserSettings {
  switch (action.type) {
    case 'SET_SETTING':
      return {
        ...state,
        [action.key]: action.value
      };
      
    case 'SET_MULTIPLE_SETTINGS':
      return {
        ...state,
        ...action.settings
      };
      
    case 'RESET_SETTINGS':
      return { ...defaultSettings };
      
    case 'LOAD_SETTINGS':
      return {
        ...defaultSettings,
        ...action.settings
      };
      
    default:
      return state;
  }
}

// Create context
const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

// Provider component
export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, dispatch] = useReducer(userSettingsReducer, defaultSettings);
  const { dbUser } = useSupabaseAuth();

  // Load settings on mount and user change
  useEffect(() => {
    loadSettings();
  }, [dbUser?.id]);

  // Auto-save when settings change (debounced)
  useEffect(() => {
    if (!settings.autoSave) return;
    
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, settings.saveInterval * 1000);
    
    return () => clearTimeout(timeoutId);
  }, [settings]);

  // Convenience methods
  const setSetting = React.useCallback(<K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    dispatch({ type: 'SET_SETTING', key, value });
  }, []);

  const setMultipleSettings = React.useCallback((newSettings: Partial<UserSettings>) => {
    dispatch({ type: 'SET_MULTIPLE_SETTINGS', settings: newSettings });
  }, []);

  const resetSettings = React.useCallback(() => {
    dispatch({ type: 'RESET_SETTINGS' });
  }, []);

  const saveSettings = React.useCallback(async () => {
    try {
      const settingsKey = dbUser?.id ? `user_settings_${dbUser.id}` : 'user_settings_guest';
      localStorage.setItem(settingsKey, JSON.stringify(settings));
      
      // TODO: Also save to Supabase if user is authenticated
      if (dbUser && !dbUser.is_guest) {
        console.log('Settings saved to localStorage for user:', dbUser.id);
        // Future: Save to Supabase user_settings table
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings, dbUser]);

  const loadSettings = React.useCallback(async () => {
    try {
      const settingsKey = dbUser?.id ? `user_settings_${dbUser.id}` : 'user_settings_guest';
      const savedSettings = localStorage.getItem(settingsKey);
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        dispatch({ type: 'LOAD_SETTINGS', settings: parsedSettings });
      }
      
      // TODO: Also load from Supabase if user is authenticated
      if (dbUser && !dbUser.is_guest) {
        console.log('Settings loaded from localStorage for user:', dbUser.id);
        // Future: Load from Supabase user_settings table
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // Reset to defaults on error
      dispatch({ type: 'RESET_SETTINGS' });
    }
  }, [dbUser]);

  const exportSettings = React.useCallback(() => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const importSettings = React.useCallback((settingsJson: string) => {
    try {
      const importedSettings = JSON.parse(settingsJson);
      
      // Validate that it's a valid settings object
      if (typeof importedSettings === 'object' && importedSettings !== null) {
        dispatch({ type: 'LOAD_SETTINGS', settings: importedSettings });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }, []);

  // Context value
  const contextValue = useMemo(() => ({
    settings,
    dispatch,
    setSetting,
    setMultipleSettings,
    resetSettings,
    saveSettings,
    loadSettings,
    exportSettings,
    importSettings
  }), [
    settings,
    setSetting,
    setMultipleSettings,
    resetSettings,
    saveSettings,
    loadSettings,
    exportSettings,
    importSettings
  ]);

  return (
    <UserSettingsContext.Provider value={contextValue}>
      {children}
    </UserSettingsContext.Provider>
  );
};

// Hook to use settings
export const useUserSettings = (): UserSettingsContextType => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider');
  }
  return context;
};