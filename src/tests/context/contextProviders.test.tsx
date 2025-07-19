import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { LoadDataProvider, useLoadData } from '../../context/LoadDataContext';
import { ProjectSettingsProvider, useProjectSettings } from '../../context/ProjectSettingsContext';
import { PhotoEditorProvider, usePhotoEditor } from '../../context/PhotoEditorContext';
import { AerialViewProvider, useAerialView } from '../../context/AerialViewContext';
import type { LoadItem, ProjectSettings, EditorPoint } from '../../types';

// Test components to interact with contexts
const LoadDataTestComponent = () => {
  const { loadData, addLoad, updateLoad, removeLoad, clearAllLoads } = useLoadData();
  
  return (
    <div>
      <span data-testid="general-loads-count">{loadData.generalLoads.length}</span>
      <span data-testid="hvac-loads-count">{loadData.hvacLoads.length}</span>
      <span data-testid="evse-loads-count">{loadData.evseLoads.length}</span>
      <span data-testid="solar-loads-count">{loadData.solarBatteryLoads.length}</span>
      
      <button 
        data-testid="add-general-load"
        onClick={() => addLoad('general', {
          id: Date.now(),
          name: 'Test Load',
          type: 'general',
          location: 'kitchen',
          watts: 1000,
          quantity: 1,
          total: 1000,
          critical: false
        })}
      >
        Add General Load
      </button>
      
      <button 
        data-testid="clear-loads"
        onClick={clearAllLoads}
      >
        Clear All
      </button>
    </div>
  );
};

const ProjectSettingsTestComponent = () => {
  const { settings, updateSettings, resetSettings } = useProjectSettings();
  
  return (
    <div>
      <span data-testid="address">{settings.address}</span>
      <span data-testid="square-footage">{settings.squareFootage}</span>
      <span data-testid="main-breaker">{settings.mainBreakerAmps}</span>
      <span data-testid="calculation-method">{settings.calculationMethod}</span>
      
      <button 
        data-testid="update-address"
        onClick={() => updateSettings({ address: '456 Oak St, New City, CA 90211' })}
      >
        Update Address
      </button>
      
      <button 
        data-testid="update-square-footage"
        onClick={() => updateSettings({ squareFootage: 3000 })}
      >
        Update Square Footage
      </button>
      
      <button 
        data-testid="reset-settings"
        onClick={resetSettings}
      >
        Reset Settings
      </button>
    </div>
  );
};

const PhotoEditorTestComponent = () => {
  const { 
    editorState, 
    addMeasurement, 
    addAnnotation, 
    setScale, 
    setActiveTool,
    clearAll 
  } = usePhotoEditor();
  
  return (
    <div>
      <span data-testid="measurements-count">{editorState.measurements.length}</span>
      <span data-testid="annotations-count">{editorState.annotations.length}</span>
      <span data-testid="scale">{editorState.scale}</span>
      <span data-testid="active-tool">{editorState.activeTool}</span>
      
      <button 
        data-testid="add-measurement"
        onClick={() => addMeasurement({
          id: 'test-measurement',
          type: 'linear',
          points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
          unit: 'ft',
          layerId: 'layer1',
          style: { stroke: '#000', strokeWidth: 2, fill: '#fff' }
        })}
      >
        Add Measurement
      </button>
      
      <button 
        data-testid="set-scale"
        onClick={() => setScale(10)}
      >
        Set Scale
      </button>
      
      <button 
        data-testid="set-tool"
        onClick={() => setActiveTool('linear')}
      >
        Set Linear Tool
      </button>
      
      <button 
        data-testid="clear-all"
        onClick={clearAll}
      >
        Clear All
      </button>
    </div>
  );
};

const AerialViewTestComponent = () => {
  const { 
    viewState, 
    setAddress, 
    setCoordinates, 
    setSatelliteProvider,
    setZoomLevel,
    toggleMeasurementMode 
  } = useAerialView();
  
  return (
    <div>
      <span data-testid="address">{viewState.address}</span>
      <span data-testid="coordinates">{viewState.coordinates?.lat},{viewState.coordinates?.lng}</span>
      <span data-testid="provider">{viewState.satelliteProvider}</span>
      <span data-testid="zoom">{viewState.zoomLevel}</span>
      <span data-testid="measurement-mode">{viewState.measurementMode ? 'true' : 'false'}</span>
      
      <button 
        data-testid="set-address"
        onClick={() => setAddress('789 Pine St, Test City, CA 90212')}
      >
        Set Address
      </button>
      
      <button 
        data-testid="set-coordinates"
        onClick={() => setCoordinates({ lat: 34.0522, lng: -118.2437 })}
      >
        Set Coordinates
      </button>
      
      <button 
        data-testid="set-provider"
        onClick={() => setSatelliteProvider('usgs')}
      >
        Set USGS Provider
      </button>
      
      <button 
        data-testid="toggle-measurement"
        onClick={toggleMeasurementMode}
      >
        Toggle Measurement
      </button>
    </div>
  );
};

describe('Context Providers', () => {
  describe('LoadDataContext', () => {
    it('should provide default load data state', () => {
      render(
        <LoadDataProvider>
          <LoadDataTestComponent />
        </LoadDataProvider>
      );
      
      expect(screen.getByTestId('general-loads-count')).toHaveTextContent('0');
      expect(screen.getByTestId('hvac-loads-count')).toHaveTextContent('0');
      expect(screen.getByTestId('evse-loads-count')).toHaveTextContent('0');
      expect(screen.getByTestId('solar-loads-count')).toHaveTextContent('0');
    });

    it('should add loads correctly', () => {
      render(
        <LoadDataProvider>
          <LoadDataTestComponent />
        </LoadDataProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('add-general-load'));
      });
      
      expect(screen.getByTestId('general-loads-count')).toHaveTextContent('1');
    });

    it('should clear all loads', () => {
      render(
        <LoadDataProvider>
          <LoadDataTestComponent />
        </LoadDataProvider>
      );
      
      // Add a load first
      act(() => {
        fireEvent.click(screen.getByTestId('add-general-load'));
      });
      
      expect(screen.getByTestId('general-loads-count')).toHaveTextContent('1');
      
      // Clear all loads
      act(() => {
        fireEvent.click(screen.getByTestId('clear-loads'));
      });
      
      expect(screen.getByTestId('general-loads-count')).toHaveTextContent('0');
    });

    it('should handle load updates and removals', () => {
      const UpdateTestComponent = () => {
        const { loadData, addLoad, updateLoad, removeLoad } = useLoadData();
        
        const handleUpdate = () => {
          if (loadData.generalLoads.length > 0) {
            updateLoad('general', loadData.generalLoads[0].id, { watts: 2000, total: 2000 });
          }
        };
        
        const handleRemove = () => {
          if (loadData.generalLoads.length > 0) {
            removeLoad('general', loadData.generalLoads[0].id);
          }
        };
        
        return (
          <div>
            <span data-testid="first-load-watts">
              {loadData.generalLoads[0]?.watts || 0}
            </span>
            <button data-testid="add-load" onClick={() => addLoad('general', {
              id: 1,
              name: 'Test Load',
              type: 'general',
              location: 'kitchen',
              watts: 1000,
              quantity: 1,
              total: 1000,
              critical: false
            })}>Add</button>
            <button data-testid="update-load" onClick={handleUpdate}>Update</button>
            <button data-testid="remove-load" onClick={handleRemove}>Remove</button>
          </div>
        );
      };
      
      render(
        <LoadDataProvider>
          <UpdateTestComponent />
        </LoadDataProvider>
      );
      
      // Add load
      act(() => {
        fireEvent.click(screen.getByTestId('add-load'));
      });
      
      expect(screen.getByTestId('first-load-watts')).toHaveTextContent('1000');
      
      // Update load
      act(() => {
        fireEvent.click(screen.getByTestId('update-load'));
      });
      
      expect(screen.getByTestId('first-load-watts')).toHaveTextContent('2000');
      
      // Remove load
      act(() => {
        fireEvent.click(screen.getByTestId('remove-load'));
      });
      
      expect(screen.getByTestId('first-load-watts')).toHaveTextContent('0');
    });
  });

  describe('ProjectSettingsContext', () => {
    it('should provide default project settings', () => {
      render(
        <ProjectSettingsProvider>
          <ProjectSettingsTestComponent />
        </ProjectSettingsProvider>
      );
      
      expect(screen.getByTestId('address')).toHaveTextContent('');
      expect(screen.getByTestId('square-footage')).toHaveTextContent('2000');
      expect(screen.getByTestId('main-breaker')).toHaveTextContent('200');
      expect(screen.getByTestId('calculation-method')).toHaveTextContent('optional');
    });

    it('should update settings correctly', () => {
      render(
        <ProjectSettingsProvider>
          <ProjectSettingsTestComponent />
        </ProjectSettingsProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('update-address'));
      });
      
      expect(screen.getByTestId('address')).toHaveTextContent('456 Oak St, New City, CA 90211');
      
      act(() => {
        fireEvent.click(screen.getByTestId('update-square-footage'));
      });
      
      expect(screen.getByTestId('square-footage')).toHaveTextContent('3000');
    });

    it('should reset settings to defaults', () => {
      render(
        <ProjectSettingsProvider>
          <ProjectSettingsTestComponent />
        </ProjectSettingsProvider>
      );
      
      // Update some settings first
      act(() => {
        fireEvent.click(screen.getByTestId('update-address'));
        fireEvent.click(screen.getByTestId('update-square-footage'));
      });
      
      expect(screen.getByTestId('address')).toHaveTextContent('456 Oak St, New City, CA 90211');
      expect(screen.getByTestId('square-footage')).toHaveTextContent('3000');
      
      // Reset settings
      act(() => {
        fireEvent.click(screen.getByTestId('reset-settings'));
      });
      
      expect(screen.getByTestId('address')).toHaveTextContent('');
      expect(screen.getByTestId('square-footage')).toHaveTextContent('2000');
    });

    it('should validate settings updates', () => {
      const ValidationTestComponent = () => {
        const { settings, updateSettings, validationErrors } = useProjectSettings();
        
        return (
          <div>
            <span data-testid="validation-errors">{validationErrors.length}</span>
            <button 
              data-testid="invalid-update"
              onClick={() => updateSettings({ squareFootage: -100 })}
            >
              Invalid Update
            </button>
          </div>
        );
      };
      
      render(
        <ProjectSettingsProvider>
          <ValidationTestComponent />
        </ProjectSettingsProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('invalid-update'));
      });
      
      expect(screen.getByTestId('validation-errors')).toHaveTextContent('1');
    });
  });

  describe('PhotoEditorContext', () => {
    it('should provide default photo editor state', () => {
      render(
        <PhotoEditorProvider>
          <PhotoEditorTestComponent />
        </PhotoEditorProvider>
      );
      
      expect(screen.getByTestId('measurements-count')).toHaveTextContent('0');
      expect(screen.getByTestId('annotations-count')).toHaveTextContent('0');
      expect(screen.getByTestId('scale')).toHaveTextContent('1');
      expect(screen.getByTestId('active-tool')).toHaveTextContent('select');
    });

    it('should add measurements correctly', () => {
      render(
        <PhotoEditorProvider>
          <PhotoEditorTestComponent />
        </PhotoEditorProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('add-measurement'));
      });
      
      expect(screen.getByTestId('measurements-count')).toHaveTextContent('1');
    });

    it('should update scale and active tool', () => {
      render(
        <PhotoEditorProvider>
          <PhotoEditorTestComponent />
        </PhotoEditorProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('set-scale'));
      });
      
      expect(screen.getByTestId('scale')).toHaveTextContent('10');
      
      act(() => {
        fireEvent.click(screen.getByTestId('set-tool'));
      });
      
      expect(screen.getByTestId('active-tool')).toHaveTextContent('linear');
    });

    it('should clear all measurements and annotations', () => {
      render(
        <PhotoEditorProvider>
          <PhotoEditorTestComponent />
        </PhotoEditorProvider>
      );
      
      // Add measurement first
      act(() => {
        fireEvent.click(screen.getByTestId('add-measurement'));
      });
      
      expect(screen.getByTestId('measurements-count')).toHaveTextContent('1');
      
      // Clear all
      act(() => {
        fireEvent.click(screen.getByTestId('clear-all'));
      });
      
      expect(screen.getByTestId('measurements-count')).toHaveTextContent('0');
      expect(screen.getByTestId('scale')).toHaveTextContent('1');
      expect(screen.getByTestId('active-tool')).toHaveTextContent('select');
    });
  });

  describe('AerialViewContext', () => {
    it('should provide default aerial view state', () => {
      render(
        <AerialViewProvider>
          <AerialViewTestComponent />
        </AerialViewProvider>
      );
      
      expect(screen.getByTestId('address')).toHaveTextContent('');
      expect(screen.getByTestId('coordinates')).toHaveTextContent(',');
      expect(screen.getByTestId('provider')).toHaveTextContent('google');
      expect(screen.getByTestId('zoom')).toHaveTextContent('18');
      expect(screen.getByTestId('measurement-mode')).toHaveTextContent('false');
    });

    it('should update address and coordinates', () => {
      render(
        <AerialViewProvider>
          <AerialViewTestComponent />
        </AerialViewProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('set-address'));
      });
      
      expect(screen.getByTestId('address')).toHaveTextContent('789 Pine St, Test City, CA 90212');
      
      act(() => {
        fireEvent.click(screen.getByTestId('set-coordinates'));
      });
      
      expect(screen.getByTestId('coordinates')).toHaveTextContent('34.0522,-118.2437');
    });

    it('should update satellite provider', () => {
      render(
        <AerialViewProvider>
          <AerialViewTestComponent />
        </AerialViewProvider>
      );
      
      act(() => {
        fireEvent.click(screen.getByTestId('set-provider'));
      });
      
      expect(screen.getByTestId('provider')).toHaveTextContent('usgs');
    });

    it('should toggle measurement mode', () => {
      render(
        <AerialViewProvider>
          <AerialViewTestComponent />
        </AerialViewProvider>
      );
      
      expect(screen.getByTestId('measurement-mode')).toHaveTextContent('false');
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle-measurement'));
      });
      
      expect(screen.getByTestId('measurement-mode')).toHaveTextContent('true');
      
      act(() => {
        fireEvent.click(screen.getByTestId('toggle-measurement'));
      });
      
      expect(screen.getByTestId('measurement-mode')).toHaveTextContent('false');
    });
  });

  describe('Context Integration', () => {
    it('should handle multiple context providers together', () => {
      const IntegratedTestComponent = () => {
        const { settings, updateSettings } = useProjectSettings();
        const { viewState, setAddress } = useAerialView();
        
        const syncAddress = () => {
          setAddress(settings.address);
        };
        
        return (
          <div>
            <span data-testid="project-address">{settings.address}</span>
            <span data-testid="aerial-address">{viewState.address}</span>
            <button 
              data-testid="update-project-address"
              onClick={() => updateSettings({ address: 'Integrated Test Address' })}
            >
              Update Project
            </button>
            <button data-testid="sync-addresses" onClick={syncAddress}>
              Sync Addresses
            </button>
          </div>
        );
      };
      
      render(
        <ProjectSettingsProvider>
          <AerialViewProvider>
            <IntegratedTestComponent />
          </AerialViewProvider>
        </ProjectSettingsProvider>
      );
      
      // Update project address
      act(() => {
        fireEvent.click(screen.getByTestId('update-project-address'));
      });
      
      expect(screen.getByTestId('project-address')).toHaveTextContent('Integrated Test Address');
      expect(screen.getByTestId('aerial-address')).toHaveTextContent('');
      
      // Sync addresses
      act(() => {
        fireEvent.click(screen.getByTestId('sync-addresses'));
      });
      
      expect(screen.getByTestId('aerial-address')).toHaveTextContent('Integrated Test Address');
    });

    it('should handle context errors gracefully', () => {
      const ErrorComponent = () => {
        // Try to use context outside provider
        const { loadData } = useLoadData();
        return <div>{loadData.generalLoads.length}</div>;
      };
      
      // Should throw error when context used outside provider
      expect(() => render(<ErrorComponent />)).toThrow();
    });
  });
});