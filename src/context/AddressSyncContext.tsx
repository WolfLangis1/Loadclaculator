import React, { createContext, useContext, useRef, useCallback } from 'react';
import { useProjectSettings } from './ProjectSettingsContext';
import { useAerialView } from './AerialViewContext';

interface AddressSyncContextType {
  syncAddressToAerialView: (address: string) => void;
  syncAddressToProject: (address: string) => void;
}

const AddressSyncContext = createContext<AddressSyncContextType | undefined>(undefined);

export const useAddressSync = () => {
  const context = useContext(AddressSyncContext);
  if (!context) {
    throw new Error('useAddressSync must be used within an AddressSyncProvider');
  }
  return context;
};

export const AddressSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateProjectInfo } = useProjectSettings();
  const { setAddress } = useAerialView();
  
  // Track the source of the last address change to prevent circular updates
  const lastUpdateSource = useRef<'project' | 'aerial' | null>(null);

  const syncAddressToAerialView = useCallback((address: string) => {
    console.log('🔄 Syncing address to Aerial View:', address);
    lastUpdateSource.current = 'project';
    setAddress(address);
    
    // Clear the source after a short delay to allow for future updates
    setTimeout(() => {
      lastUpdateSource.current = null;
    }, 100);
  }, [setAddress]);

  const syncAddressToProject = useCallback((address: string) => {
    console.log('🔄 Syncing address to Project Settings:', address);
    lastUpdateSource.current = 'aerial';
    updateProjectInfo({ propertyAddress: address });
    
    // Clear the source after a short delay to allow for future updates
    setTimeout(() => {
      lastUpdateSource.current = null;
    }, 100);
  }, [updateProjectInfo]);

  const value: AddressSyncContextType = {
    syncAddressToAerialView,
    syncAddressToProject
  };

  return (
    <AddressSyncContext.Provider value={value}>
      {children}
    </AddressSyncContext.Provider>
  );
};