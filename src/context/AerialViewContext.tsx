import React, { createContext, useContext, useReducer, useMemo } from 'react';

// Simplified aerial view state without AI services
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MeasurementPoint {
  x: number;
  y: number;
  latitude?: number;
  longitude?: number;
}

interface LinearMeasurement {
  id: string;
  startPoint: MeasurementPoint;
  endPoint: MeasurementPoint;
  distance: number;
  unit: 'feet' | 'meters';
  label?: string;
}

interface AreaMeasurement {
  id: string;
  points: MeasurementPoint[];
  area: number;
  unit: 'sqft' | 'sqm';
  label?: string;
}

interface PolylineMeasurement {
  id: string;
  points: MeasurementPoint[];
  totalDistance: number;
  segmentDistances: number[];
  unit: 'feet' | 'meters';
  label?: string;
}

interface AerialViewState {
  address: string;
  coordinates: Coordinates | null;
  zoom: number;
  
  // Images
  satelliteImage: string | null;
  streetViewImages: Array<{
    heading: number;
    imageUrl: string;
    label: string;
  }>;
  
  // Measurements
  measurements: {
    linear: LinearMeasurement[];
    area: AreaMeasurement[];
    polyline: PolylineMeasurement[];
  };
  
  // UI State
  ui: {
    viewMode: 'satellite' | 'streetview' | 'measurements';
    showMeasurements: boolean;
    measurementMode: 'off' | 'linear' | 'area' | 'polyline';
    loading: boolean;
    error: string | null;
  };
}

type AerialViewAction = 
  | { type: 'SET_ADDRESS'; payload: string }
  | { type: 'SET_COORDINATES'; payload: Coordinates | null }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_SATELLITE_IMAGE'; payload: string | null }
  | { type: 'SET_STREET_VIEW_IMAGES'; payload: AerialViewState['streetViewImages'] }
  | { type: 'ADD_LINEAR_MEASUREMENT'; payload: LinearMeasurement }
  | { type: 'ADD_AREA_MEASUREMENT'; payload: AreaMeasurement }
  | { type: 'ADD_POLYLINE_MEASUREMENT'; payload: PolylineMeasurement }
  | { type: 'REMOVE_MEASUREMENT'; payload: { type: 'linear' | 'area' | 'polyline'; id: string } }
  | { type: 'CLEAR_MEASUREMENTS' }
  | { type: 'UPDATE_UI_STATE'; payload: Partial<AerialViewState['ui']> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_STATE' };

interface AerialViewContextType {
  state: AerialViewState;
  dispatch: React.Dispatch<AerialViewAction>;
  
  // Convenience methods
  setAddress: (address: string) => void;
  setCoordinates: (coordinates: Coordinates | null) => void;
  setZoom: (zoom: number) => void;
  setSatelliteImage: (imageUrl: string | null) => void;
  setStreetViewImages: (images: AerialViewState['streetViewImages']) => void;
  addLinearMeasurement: (measurement: LinearMeasurement) => void;
  addAreaMeasurement: (measurement: AreaMeasurement) => void;
  addPolylineMeasurement: (measurement: PolylineMeasurement) => void;
  removeMeasurement: (type: 'linear' | 'area' | 'polyline', id: string) => void;
  clearMeasurements: () => void;
  updateUIState: (updates: Partial<AerialViewState['ui']>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const initialState: AerialViewState = {
  address: '',
  coordinates: null,
  zoom: 20,
  satelliteImage: null,
  streetViewImages: [],
  measurements: {
    linear: [],
    area: [],
    polyline: []
  },
  ui: {
    viewMode: 'satellite',
    showMeasurements: true,
    measurementMode: 'off',
    loading: false,
    error: null
  }
};

function aerialViewReducer(state: AerialViewState, action: AerialViewAction): AerialViewState {
  switch (action.type) {
    case 'SET_ADDRESS':
      return {
        ...state,
        address: action.payload
      };
      
    case 'SET_COORDINATES':
      return {
        ...state,
        coordinates: action.payload
      };
      
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: action.payload
      };
      
    case 'SET_SATELLITE_IMAGE':
      return {
        ...state,
        satelliteImage: action.payload
      };
      
    case 'SET_STREET_VIEW_IMAGES':
      return {
        ...state,
        streetViewImages: action.payload
      };
      
    case 'ADD_LINEAR_MEASUREMENT':
      return {
        ...state,
        measurements: {
          ...state.measurements,
          linear: [...state.measurements.linear, action.payload]
        }
      };
      
    case 'ADD_AREA_MEASUREMENT':
      return {
        ...state,
        measurements: {
          ...state.measurements,
          area: [...state.measurements.area, action.payload]
        }
      };
      
    case 'ADD_POLYLINE_MEASUREMENT':
      return {
        ...state,
        measurements: {
          ...state.measurements,
          polyline: [...state.measurements.polyline, action.payload]
        }
      };
      
    case 'REMOVE_MEASUREMENT': {
      const { type, id } = action.payload;
      return {
        ...state,
        measurements: {
          ...state.measurements,
          [type]: state.measurements[type].filter(m => m.id !== id)
        }
      };
    }
    
    case 'CLEAR_MEASUREMENTS':
      return {
        ...state,
        measurements: {
          linear: [],
          area: [],
          polyline: []
        }
      };
      
    case 'UPDATE_UI_STATE':
      return {
        ...state,
        ui: {
          ...state.ui,
          ...action.payload
        }
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: action.payload
        }
      };
      
    case 'SET_ERROR':
      return {
        ...state,
        ui: {
          ...state.ui,
          error: action.payload
        }
      };
      
    case 'RESET_STATE':
      return {
        ...initialState
      };
      
    default:
      return state;
  }
}

const AerialViewContext = createContext<AerialViewContextType | undefined>(undefined);

export const AerialViewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(aerialViewReducer, initialState);
  
  // Memoized convenience methods
  const setAddress = React.useCallback((address: string) => {
    dispatch({ type: 'SET_ADDRESS', payload: address });
  }, []);
  
  const setCoordinates = React.useCallback((coordinates: Coordinates | null) => {
    dispatch({ type: 'SET_COORDINATES', payload: coordinates });
  }, []);
  
  const setZoom = React.useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);
  
  const setSatelliteImage = React.useCallback((imageUrl: string | null) => {
    dispatch({ type: 'SET_SATELLITE_IMAGE', payload: imageUrl });
  }, []);
  
  const setStreetViewImages = React.useCallback((images: AerialViewState['streetViewImages']) => {
    dispatch({ type: 'SET_STREET_VIEW_IMAGES', payload: images });
  }, []);
  
  const addLinearMeasurement = React.useCallback((measurement: LinearMeasurement) => {
    dispatch({ type: 'ADD_LINEAR_MEASUREMENT', payload: measurement });
  }, []);
  
  const addAreaMeasurement = React.useCallback((measurement: AreaMeasurement) => {
    dispatch({ type: 'ADD_AREA_MEASUREMENT', payload: measurement });
  }, []);
  
  const addPolylineMeasurement = React.useCallback((measurement: PolylineMeasurement) => {
    dispatch({ type: 'ADD_POLYLINE_MEASUREMENT', payload: measurement });
  }, []);
  
  const removeMeasurement = React.useCallback((type: 'linear' | 'area' | 'polyline', id: string) => {
    dispatch({ type: 'REMOVE_MEASUREMENT', payload: { type, id } });
  }, []);
  
  const clearMeasurements = React.useCallback(() => {
    dispatch({ type: 'CLEAR_MEASUREMENTS' });
  }, []);
  
  const updateUIState = React.useCallback((updates: Partial<AerialViewState['ui']>) => {
    dispatch({ type: 'UPDATE_UI_STATE', payload: updates });
  }, []);
  
  const setLoading = React.useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);
  
  const setError = React.useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);
  
  const resetState = React.useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);
  
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    setAddress,
    setCoordinates,
    setZoom,
    setSatelliteImage,
    setStreetViewImages,
    addLinearMeasurement,
    addAreaMeasurement,
    addPolylineMeasurement,
    removeMeasurement,
    clearMeasurements,
    updateUIState,
    setLoading,
    setError,
    resetState
  }), [
    state,
    setAddress,
    setCoordinates,
    setZoom,
    setSatelliteImage,
    setStreetViewImages,
    addLinearMeasurement,
    addAreaMeasurement,
    addPolylineMeasurement,
    removeMeasurement,
    clearMeasurements,
    updateUIState,
    setLoading,
    setError,
    resetState
  ]);
  
  return (
    <AerialViewContext.Provider value={contextValue}>
      {children}
    </AerialViewContext.Provider>
  );
};

export const useAerialView = (): AerialViewContextType => {
  const context = useContext(AerialViewContext);
  if (!context) {
    throw new Error('useAerialView must be used within a AerialViewProvider');
  }
  return context;
};