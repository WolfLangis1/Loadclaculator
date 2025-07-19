import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { UnifiedAppProvider } from '../../context/UnifiedAppContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { useCalculations } from '../../context/CalculationContext';
import { useAerialView } from '../../context/AerialViewContext';
import { usePhotoEditor } from '../../context/PhotoEditorContext';
import { calculateLoadDemand } from '../../services/necCalculations';
import type { LoadItem, ProjectSettings, CalculationResult } from '../../types';

// Mock external dependencies
vi.mock('../../services/secureApiService', () => ({
  secureApiService: {
    geocodeAddress: vi.fn().mockResolvedValue({ lat: 34.0522, lng: -118.2437 }),
    getSatelliteImage: vi.fn().mockResolvedValue({ imageUrl: 'test-image.jpg' })
  }
}));

// Integration test component that uses multiple contexts
const CrossModuleTestComponent = () => {
  const { loadData, addLoad, clearAllLoads } = useLoadData();
  const { settings, updateSettings } = useProjectSettings();
  const { calculations, triggerCalculation } = useCalculations();
  const { viewState, setAddress, setCoordinates } = useAerialView();
  const { editorState, setScale } = usePhotoEditor();

  const handleAddSampleLoads = () => {
    const sampleLoads: LoadItem[] = [
      {
        id: 1,
        name: 'Kitchen Receptacles',
        type: 'general',
        location: 'kitchen',
        watts: 1500,
        quantity: 1,
        total: 1500,
        critical: false
      },
      {
        id: 2,
        name: 'HVAC Unit',
        type: 'hvac',
        location: 'outside',
        watts: 3600,
        quantity: 1,
        total: 3600,
        critical: true
      },
      {
        id: 3,
        name: 'EVSE',
        type: 'evse',
        location: 'garage',
        amps: 48,
        voltage: 240,
        quantity: 1,
        total: 11520,
        critical: false,
        emsControlled: false
      }
    ];

    sampleLoads.forEach(load => {
      if (load.type === 'evse') {
        addLoad('evseLoads', load);
      } else if (load.type === 'hvac') {
        addLoad('hvacLoads', load);
      } else {
        addLoad('generalLoads', load);
      }
    });
  };

  const handleProjectSetup = () => {
    updateSettings({
      address: '123 Test St, Los Angeles, CA 90210',
      squareFootage: 2500,
      mainBreakerAmps: 200,
      calculationMethod: 'optional'
    });
  };

  const handleSyncAddressToAerial = () => {
    setAddress(settings.address);
  };

  return (
    <div>
      {/* Load Data Display */}
      <div data-testid="load-summary">
        <span data-testid="general-count">{loadData.generalLoads.length}</span>
        <span data-testid="hvac-count">{loadData.hvacLoads.length}</span>
        <span data-testid="evse-count">{loadData.evseLoads.length}</span>
        <span data-testid="total-loads">{
          loadData.generalLoads.length + 
          loadData.hvacLoads.length + 
          loadData.evseLoads.length
        }</span>
      </div>

      {/* Project Settings Display */}
      <div data-testid="project-summary">
        <span data-testid="project-address">{settings.address}</span>
        <span data-testid="project-sqft">{settings.squareFootage}</span>
        <span data-testid="project-breaker">{settings.mainBreakerAmps}</span>
      </div>

      {/* Calculations Display */}
      <div data-testid="calculations-summary">
        <span data-testid="total-amps">{calculations?.totalAmps || 0}</span>
        <span data-testid="spare-capacity">{calculations?.spareCapacity || 0}</span>
        <span data-testid="nec-compliant">{calculations?.necCompliant ? 'true' : 'false'}</span>
      </div>

      {/* Aerial View Display */}
      <div data-testid="aerial-summary">
        <span data-testid="aerial-address">{viewState.address}</span>
        <span data-testid="aerial-lat">{viewState.coordinates?.lat || 0}</span>
        <span data-testid="aerial-lng">{viewState.coordinates?.lng || 0}</span>
      </div>

      {/* Photo Editor Display */}
      <div data-testid="editor-summary">
        <span data-testid="editor-scale">{editorState.scale}</span>
        <span data-testid="measurements-count">{editorState.measurements.length}</span>
      </div>

      {/* Control Buttons */}
      <button data-testid="setup-project" onClick={handleProjectSetup}>
        Setup Project
      </button>
      <button data-testid="add-sample-loads" onClick={handleAddSampleLoads}>
        Add Sample Loads
      </button>
      <button data-testid="calculate-loads" onClick={triggerCalculation}>
        Calculate Loads
      </button>
      <button data-testid="sync-address" onClick={handleSyncAddressToAerial}>
        Sync Address to Aerial
      </button>
      <button data-testid="clear-loads" onClick={clearAllLoads}>
        Clear Loads
      </button>
    </div>
  );
};

describe('Cross-Module Data Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize all contexts with default values', () => {
    render(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    // Verify initial state across all contexts
    expect(screen.getByTestId('total-loads')).toHaveTextContent('0');
    expect(screen.getByTestId('project-address')).toHaveTextContent('');
    expect(screen.getByTestId('project-sqft')).toHaveTextContent('2000');
    expect(screen.getByTestId('total-amps')).toHaveTextContent('0');
    expect(screen.getByTestId('aerial-address')).toHaveTextContent('');
    expect(screen.getByTestId('editor-scale')).toHaveTextContent('1');
  });

  it('should handle complete project setup workflow', async () => {
    render(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    // Step 1: Setup project settings
    act(() => {
      fireEvent.click(screen.getByTestId('setup-project'));
    });

    expect(screen.getByTestId('project-address')).toHaveTextContent('123 Test St, Los Angeles, CA 90210');
    expect(screen.getByTestId('project-sqft')).toHaveTextContent('2500');
    expect(screen.getByTestId('project-breaker')).toHaveTextContent('200');

    // Step 2: Add loads
    act(() => {
      fireEvent.click(screen.getByTestId('add-sample-loads'));
    });

    expect(screen.getByTestId('general-count')).toHaveTextContent('1');
    expect(screen.getByTestId('hvac-count')).toHaveTextContent('1');
    expect(screen.getByTestId('evse-count')).toHaveTextContent('1');
    expect(screen.getByTestId('total-loads')).toHaveTextContent('3');

    // Step 3: Trigger calculations
    act(() => {
      fireEvent.click(screen.getByTestId('calculate-loads'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('total-amps')).not.toHaveTextContent('0');
    });

    // Verify calculations completed
    const totalAmps = parseInt(screen.getByTestId('total-amps').textContent || '0');
    expect(totalAmps).toBeGreaterThan(0);
    expect(totalAmps).toBeLessThan(200); // Should be under main breaker capacity

    // Step 4: Sync address to aerial view
    act(() => {
      fireEvent.click(screen.getByTestId('sync-address'));
    });

    expect(screen.getByTestId('aerial-address')).toHaveTextContent('123 Test St, Los Angeles, CA 90210');
  });

  it('should propagate load changes to calculations automatically', async () => {
    render(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    // Setup initial state
    act(() => {
      fireEvent.click(screen.getByTestId('setup-project'));
    });

    // Add loads and verify calculations update
    act(() => {
      fireEvent.click(screen.getByTestId('add-sample-loads'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('total-amps')).not.toHaveTextContent('0');
    });

    const initialAmps = parseInt(screen.getByTestId('total-amps').textContent || '0');

    // Clear loads and verify calculations update
    act(() => {
      fireEvent.click(screen.getByTestId('clear-loads'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('total-loads')).toHaveTextContent('0');
    });

    // Calculations should reflect the change
    await waitFor(() => {
      const newAmps = parseInt(screen.getByTestId('total-amps').textContent || '0');
      expect(newAmps).toBeLessThan(initialAmps);
    });
  });

  it('should handle address synchronization between project and aerial view', async () => {
    render(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    // Setup project with address
    act(() => {
      fireEvent.click(screen.getByTestId('setup-project'));
    });

    expect(screen.getByTestId('project-address')).toHaveTextContent('123 Test St, Los Angeles, CA 90210');
    expect(screen.getByTestId('aerial-address')).toHaveTextContent('');

    // Sync address to aerial view
    act(() => {
      fireEvent.click(screen.getByTestId('sync-address'));
    });

    expect(screen.getByTestId('aerial-address')).toHaveTextContent('123 Test St, Los Angeles, CA 90210');

    // Address should trigger coordinate lookup (mocked)
    await waitFor(() => {
      expect(screen.getByTestId('aerial-lat')).not.toHaveTextContent('0');
      expect(screen.getByTestId('aerial-lng')).not.toHaveTextContent('0');
    });
  });

  it('should validate NEC compliance across load types', async () => {
    render(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    // Setup project with 200A service
    act(() => {
      fireEvent.click(screen.getByTestId('setup-project'));
    });

    // Add normal loads
    act(() => {
      fireEvent.click(screen.getByTestId('add-sample-loads'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('nec-compliant')).toHaveTextContent('true');
    });

    // Verify spare capacity is reasonable
    const spareCapacity = parseInt(screen.getByTestId('spare-capacity').textContent || '0');
    expect(spareCapacity).toBeGreaterThan(0);
    expect(spareCapacity).toBeLessThan(100);
  });

  it('should handle data persistence across context providers', () => {
    const { rerender } = render(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    // Setup initial data
    act(() => {
      fireEvent.click(screen.getByTestId('setup-project'));
      fireEvent.click(screen.getByTestId('add-sample-loads'));
    });

    expect(screen.getByTestId('total-loads')).toHaveTextContent('3');
    expect(screen.getByTestId('project-sqft')).toHaveTextContent('2500');

    // Rerender component (simulates component remount)
    rerender(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    // Data should persist across rerenders
    expect(screen.getByTestId('total-loads')).toHaveTextContent('3');
    expect(screen.getByTestId('project-sqft')).toHaveTextContent('2500');
  });

  it('should handle error states gracefully across modules', async () => {
    // Mock calculation service to throw error
    vi.mocked(calculateLoadDemand).mockImplementationOnce(() => {
      throw new Error('Calculation failed');
    });

    render(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('setup-project'));
      fireEvent.click(screen.getByTestId('add-sample-loads'));
    });

    // Should handle calculation errors gracefully
    act(() => {
      fireEvent.click(screen.getByTestId('calculate-loads'));
    });

    // Other modules should continue to function
    expect(screen.getByTestId('total-loads')).toHaveTextContent('3');
    expect(screen.getByTestId('project-address')).toHaveTextContent('123 Test St, Los Angeles, CA 90210');
  });

  it('should validate load totals across different load types', () => {
    const LoadTotalTestComponent = () => {
      const { loadData, addLoad } = useLoadData();
      
      const addComplexLoads = () => {
        // Add loads with different calculation patterns
        addLoad('generalLoads', {
          id: 1,
          name: 'Lighting',
          type: 'general',
          location: 'whole_house',
          watts: 3, // watts per sq ft
          quantity: 2500, // square footage
          total: 7500, // 3 * 2500
          critical: false
        });

        addLoad('evseLoads', {
          id: 2,
          name: 'Tesla Charger',
          type: 'evse',
          location: 'garage',
          amps: 48,
          voltage: 240,
          quantity: 1,
          total: 11520, // 48 * 240
          critical: false,
          emsControlled: false
        });
      };

      const totalWatts = loadData.generalLoads.reduce((sum, load) => sum + load.total, 0) +
                        loadData.hvacLoads.reduce((sum, load) => sum + load.total, 0) +
                        loadData.evseLoads.reduce((sum, load) => sum + load.total, 0) +
                        loadData.solarBatteryLoads.reduce((sum, load) => sum + load.total, 0);

      return (
        <div>
          <span data-testid="total-watts">{totalWatts}</span>
          <button data-testid="add-complex" onClick={addComplexLoads}>Add Complex</button>
        </div>
      );
    };

    render(
      <UnifiedAppProvider>
        <LoadTotalTestComponent />
      </UnifiedAppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByTestId('add-complex'));
    });

    expect(screen.getByTestId('total-watts')).toHaveTextContent('19020'); // 7500 + 11520
  });

  it('should handle concurrent context updates without race conditions', async () => {
    render(
      <UnifiedAppProvider>
        <CrossModuleTestComponent />
      </UnifiedAppProvider>
    );

    // Trigger multiple simultaneous updates
    act(() => {
      fireEvent.click(screen.getByTestId('setup-project'));
      fireEvent.click(screen.getByTestId('add-sample-loads'));
      fireEvent.click(screen.getByTestId('sync-address'));
    });

    // All updates should complete successfully
    await waitFor(() => {
      expect(screen.getByTestId('project-address')).toHaveTextContent('123 Test St, Los Angeles, CA 90210');
      expect(screen.getByTestId('total-loads')).toHaveTextContent('3');
      expect(screen.getByTestId('aerial-address')).toHaveTextContent('123 Test St, Los Angeles, CA 90210');
    });
  });
});