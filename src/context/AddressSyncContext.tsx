import React, { createContext, useContext, useEffect } from 'react';
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
  const { settings, updateProjectInfo } = useProjectSettings();
  const { state: aerialState, setAddress } = useAerialView();

  const syncAddressToAerialView = (address: string) => {
    console.log('🔄 Syncing address to Aerial View:', address);
    setAddress(address);
  };

  const syncAddressToProject = (address: string) => {
    console.log('🔄 Syncing address to Project Settings:', address);
    updateProjectInfo({ propertyAddress: address });
  };

  // Auto-sync when project address changes
  useEffect(() => {
    const projectAddress = settings.projectInfo.propertyAddress;
    if (projectAddress && projectAddress !== aerialState.address) {
      console.log('🔄 Auto-syncing project address to aerial view:', projectAddress);
      setAddress(projectAddress);
    }
  }, [settings.projectInfo.propertyAddress, aerialState.address, setAddress]);

  // Auto-sync when aerial address changes (from search)
  useEffect(() => {
    const aerialAddress = aerialState.address;
    if (aerialAddress && aerialAddress !== settings.projectInfo.propertyAddress) {
      console.log('🔄 Auto-syncing aerial address to project settings:', aerialAddress);
      updateProjectInfo({ propertyAddress: aerialAddress });
    }
  }, [aerialState.address, settings.projectInfo.propertyAddress, updateProjectInfo]);

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