import React, { createContext, useContext, useReducer, useMemo } from 'react';
import type { SLDDiagram, SLDComponent, SLDConnection, SLDPosition } from '../types/sld';
import { 
  setDiagram as setDiagramReducer,
  addComponent as addComponentReducer,
  updateComponent as updateComponentReducer,
  removeComponent as removeComponentReducer,
  addConnection as addConnectionReducer,
  removeConnection as removeConnectionReducer,
  selectComponents as selectComponentsReducer,
  updateCanvasState as updateCanvasStateReducer,
  updateUIState as updateUIStateReducer,
  resetDiagram as resetDiagramReducer
} from '../utils/sldReducers';

// Simplified SLD state without problematic services
interface SLDState {
  diagram: SLDDiagram | null;
  selectedComponents: string[];
  canvasState: {
    zoom: number;
    pan: { x: number; y: number };
    gridEnabled: boolean;
    gridSize: number;
    snapToGrid: boolean;
  };
  ui: {
    showComponentLibrary: boolean;
    showGrid: boolean;
    readonly: boolean;
  };
}

type SLDAction = 
  | { type: 'SET_DIAGRAM'; payload: SLDDiagram }
  | { type: 'ADD_COMPONENT'; payload: SLDComponent }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; updates: Partial<SLDComponent> } }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'ADD_CONNECTION'; payload: SLDConnection }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'SELECT_COMPONENTS'; payload: string[] }
  | { type: 'UPDATE_CANVAS_STATE'; payload: Partial<SLDState['canvasState']> }
  | { type: 'UPDATE_UI_STATE'; payload: Partial<SLDState['ui']> }
  | { type: 'RESET_DIAGRAM' };

interface SLDDataContextType {
  state: SLDState;
  dispatch: React.Dispatch<SLDAction>;
  
  // Convenience methods
  addComponent: (component: SLDComponent) => void;
  updateComponent: (id: string, updates: Partial<SLDComponent>) => void;
  removeComponent: (id: string) => void;
  addConnection: (connection: SLDConnection) => void;
  removeConnection: (id: string) => void;
  selectComponents: (ids: string[]) => void;
  updateCanvasState: (updates: Partial<SLDState['canvasState']>) => void;
  updateUIState: (updates: Partial<SLDState['ui']>) => void;
  resetDiagram: () => void;
}

const initialState: SLDState = {
  diagram: {
    id: 'main-diagram',
    name: 'Electrical Single Line Diagram',
    components: [],
    connections: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: '1.0.0',
      author: 'Load Calculator',
      necCompliant: true,
      codeYear: 2023
    }
  },
  selectedComponents: [],
  canvasState: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: true
  },
  ui: {
    showComponentLibrary: true,
    showGrid: true,
    readonly: false
  }
};

function sldDataReducer(state: SLDState, action: SLDAction): SLDState {
  switch (action.type) {
    case 'SET_DIAGRAM':
      return setDiagramReducer(state, action.payload);
    case 'ADD_COMPONENT':
      return addComponentReducer(state, action.payload);
    case 'UPDATE_COMPONENT':
      return updateComponentReducer(state, action.payload);
    case 'REMOVE_COMPONENT':
      return removeComponentReducer(state, action.payload);
    case 'ADD_CONNECTION':
      return addConnectionReducer(state, action.payload);
    case 'REMOVE_CONNECTION':
      return removeConnectionReducer(state, action.payload);
    case 'SELECT_COMPONENTS':
      return selectComponentsReducer(state, action.payload);
    case 'UPDATE_CANVAS_STATE':
      return updateCanvasStateReducer(state, action.payload);
    case 'UPDATE_UI_STATE':
      return updateUIStateReducer(state, action.payload);
    case 'RESET_DIAGRAM':
      return resetDiagramReducer(initialState);
    default:
      return state;
  }
}

const SLDDataContext = createContext<SLDDataContextType | undefined>(undefined);

export const SLDDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(sldDataReducer, initialState);
  
  const addComponent = React.useCallback((component: SLDComponent) => {
    dispatch({ type: 'ADD_COMPONENT', payload: component });
  }, []);
  
  const updateComponent = React.useCallback((id: string, updates: Partial<SLDComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id, updates } });
  }, []);
  
  const removeComponent = React.useCallback((id: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: id });
  }, []);
  
  const addConnection = React.useCallback((connection: SLDConnection) => {
    dispatch({ type: 'ADD_CONNECTION', payload: connection });
  }, []);
  
  const removeConnection = React.useCallback((id: string) => {
    dispatch({ type: 'REMOVE_CONNECTION', payload: id });
  }, []);
  
  const selectComponents = React.useCallback((ids: string[]) => {
    dispatch({ type: 'SELECT_COMPONENTS', payload: ids });
  }, []);
  
  const updateCanvasState = React.useCallback((updates: Partial<SLDState['canvasState']>) => {
    dispatch({ type: 'UPDATE_CANVAS_STATE', payload: updates });
  }, []);
  
  const updateUIState = React.useCallback((updates: Partial<SLDState['ui']>) => {
    dispatch({ type: 'UPDATE_UI_STATE', payload: updates });
  }, []);
  
  const resetDiagram = React.useCallback(() => {
    dispatch({ type: 'RESET_DIAGRAM' });
  }, []);
  
  const contextValue = useMemo(() => ({
    state,
    dispatch,
    addComponent,
    updateComponent,
    removeComponent,
    addConnection,
    removeConnection,
    selectComponents,
    updateCanvasState,
    updateUIState,
    resetDiagram
  }), [
    state,
    addComponent,
    updateComponent,
    removeComponent,
    addConnection,
    removeConnection,
    selectComponents,
    updateCanvasState,
    updateUIState,
    resetDiagram
  ]);
  
  return (
    <SLDDataContext.Provider value={contextValue}>
      {children}
    </SLDDataContext.Provider>
  );
};

export const useSLDData = (): SLDDataContextType => {
  const context = useContext(SLDDataContext);
  if (!context) {
    throw new Error('useSLDData must be used within a SLDDataProvider');
  }
  return context;
};