import React, { createContext, useContext, useReducer, useCallback, useMemo, ReactNode } from 'react';
import type { SLDDiagram, SLDComponent, SLDConnection, SLDPosition, SLDSize } from '../types/sld';
import { CommandManager, type SLDCommand, type CommandHistory } from '../services/sldCommandService';
import { collaborationService, type CollaborationSession, type User } from '../services/sldCollaborationService';

// Enhanced SLD State
interface SLDState {
  diagram: SLDDiagram | null;
  commandManager: CommandManager | null;
  collaboration: CollaborationSession | null;
  performance: {
    virtualRendering: boolean;
    cullingDistance: number;
    levelOfDetail: 'high' | 'medium' | 'low';
    renderQueue: RenderTask[];
  };
  validation: ValidationResult[];
  selectedElements: string[];
  isDragging: boolean;
  dragStart: { x: number; y: number };
  canvasState: {
    zoom: number;
    pan: { x: number; y: number };
    gridEnabled: boolean;
    gridSize: number;
    snapToGrid: boolean;
    showLayers: boolean;
  };
  ui: {
    showComponentLibrary: boolean;
    showWireSizing: boolean;
    showNECCompliance: boolean;
    showLoadFlow: boolean;
    activeTab: 'sld' | 'aerial' | 'export' | 'wire-sizing' | 'nec-compliance' | 'load-flow';
  };
}

interface RenderTask {
  id: string;
  priority: number;
  component: SLDComponent;
  visible: boolean;
}

interface ValidationResult {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  componentId?: string;
  connectionId?: string;
  code?: string;
  suggestion?: string;
}

// Action Types
type SLDAction =
  | { type: 'SET_DIAGRAM'; payload: SLDDiagram }
  | { type: 'UPDATE_DIAGRAM'; payload: Partial<SLDDiagram> }
  | { type: 'EXECUTE_COMMAND'; payload: SLDCommand }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_COLLABORATION_SESSION'; payload: CollaborationSession | null }
  | { type: 'SET_PERFORMANCE_SETTINGS'; payload: Partial<SLDState['performance']> }
  | { type: 'SET_VALIDATION_RESULTS'; payload: ValidationResult[] }
  | { type: 'SET_SELECTED_ELEMENTS'; payload: string[] }
  | { type: 'SET_DRAG_STATE'; payload: { isDragging: boolean; start?: { x: number; y: number } } }
  | { type: 'SET_CANVAS_STATE'; payload: Partial<SLDState['canvasState']> }
  | { type: 'SET_UI_STATE'; payload: Partial<SLDState['ui']> }
  | { type: 'ADD_COMPONENT'; payload: SLDComponent }
  | { type: 'REMOVE_COMPONENT'; payload: string }
  | { type: 'MOVE_COMPONENT'; payload: { id: string; position: SLDPosition } }
  | { type: 'RESIZE_COMPONENT'; payload: { id: string; size: SLDSize } }
  | { type: 'ADD_CONNECTION'; payload: SLDConnection }
  | { type: 'REMOVE_CONNECTION'; payload: string }
  | { type: 'UPDATE_COMPONENT_PROPERTY'; payload: { id: string; property: string; value: any } };

// Context Interface
interface SLDContextType {
  state: SLDState;
  dispatch: React.Dispatch<SLDAction>;
  
  // Command Management
  executeCommand: (command: SLDCommand) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  getHistory: () => CommandHistory;
  
  // Collaboration
  startCollaboration: (user: User) => void;
  joinCollaboration: (sessionId: string, user: User) => void;
  leaveCollaboration: () => void;
  getCollaborationSession: () => CollaborationSession | null;
  
  // Component Management
  addComponent: (component: SLDComponent) => void;
  removeComponent: (componentId: string) => void;
  moveComponent: (componentId: string, position: SLDPosition) => void;
  resizeComponent: (componentId: string, size: SLDSize) => void;
  updateComponentProperty: (componentId: string, property: string, value: any) => void;
  
  // Connection Management
  addConnection: (connection: SLDConnection) => void;
  removeConnection: (connectionId: string) => void;
  
  // Selection Management
  selectElements: (elementIds: string[]) => void;
  clearSelection: () => void;
  
  // Canvas Management
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleSnapToGrid: () => void;
  
  // Performance
  setPerformanceSettings: (settings: Partial<SLDState['performance']>) => void;
  optimizeRendering: () => void;
  
  // Validation
  validateDiagram: () => ValidationResult[];
  clearValidation: () => void;
}

// Initial State
const initialState: SLDState = {
  diagram: null,
  commandManager: null,
  collaboration: null,
  performance: {
    virtualRendering: true,
    cullingDistance: 1000,
    levelOfDetail: 'high',
    renderQueue: []
  },
  validation: [],
  selectedElements: [],
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  canvasState: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    gridEnabled: true,
    gridSize: 20,
    snapToGrid: true,
    showLayers: false
  },
  ui: {
    showComponentLibrary: true,
    showWireSizing: false,
    showNECCompliance: false,
    showLoadFlow: false,
    activeTab: 'sld'
  }
};

// Reducer
function sldReducer(state: SLDState, action: SLDAction): SLDState {
  switch (action.type) {
    case 'SET_DIAGRAM': {
      console.log('SLDContext: SET_DIAGRAM action received:', action.payload);
      const commandManager = new CommandManager(action.payload);
      const newState = {
        ...state,
        diagram: action.payload,
        commandManager
      };
      console.log('SLDContext: New state after SET_DIAGRAM:', newState);
      return newState;
    }
    
    case 'UPDATE_DIAGRAM': {
      if (!state.diagram) return state;
      return {
        ...state,
        diagram: { ...state.diagram, ...action.payload }
      };
    }
    
    case 'EXECUTE_COMMAND': {
      if (!state.commandManager) return state;
      state.commandManager.executeCommand(action.payload);
      return { ...state };
    }
    
    case 'UNDO': {
      if (!state.commandManager) return state;
      state.commandManager.undo();
      return { ...state };
    }
    
    case 'REDO': {
      if (!state.commandManager) return state;
      state.commandManager.redo();
      return { ...state };
    }
    
    case 'SET_COLLABORATION_SESSION': {
      return {
        ...state,
        collaboration: action.payload
      };
    }
    
    case 'SET_PERFORMANCE_SETTINGS': {
      return {
        ...state,
        performance: { ...state.performance, ...action.payload }
      };
    }
    
    case 'SET_VALIDATION_RESULTS': {
      return {
        ...state,
        validation: action.payload
      };
    }
    
    case 'SET_SELECTED_ELEMENTS': {
      return {
        ...state,
        selectedElements: action.payload
      };
    }
    
    case 'SET_DRAG_STATE': {
      return {
        ...state,
        isDragging: action.payload.isDragging,
        dragStart: action.payload.start || state.dragStart
      };
    }
    
    case 'SET_CANVAS_STATE': {
      return {
        ...state,
        canvasState: { ...state.canvasState, ...action.payload }
      };
    }
    
    case 'SET_UI_STATE': {
      return {
        ...state,
        ui: { ...state.ui, ...action.payload }
      };
    }
    
    case 'ADD_COMPONENT': {
      if (!state.diagram) return state;
      return {
        ...state,
        diagram: {
          ...state.diagram,
          components: [...state.diagram.components, action.payload],
          lastModified: new Date()
        }
      };
    }
    
    case 'REMOVE_COMPONENT': {
      if (!state.diagram) return state;
      return {
        ...state,
        diagram: {
          ...state.diagram,
          components: state.diagram.components.filter(c => c.id !== action.payload),
          lastModified: new Date()
        }
      };
    }
    
    case 'MOVE_COMPONENT': {
      if (!state.diagram) return state;
      return {
        ...state,
        diagram: {
          ...state.diagram,
          components: state.diagram.components.map(c =>
            c.id === action.payload.id
              ? { ...c, position: action.payload.position }
              : c
          ),
          lastModified: new Date()
        }
      };
    }
    
    case 'RESIZE_COMPONENT': {
      if (!state.diagram) return state;
      return {
        ...state,
        diagram: {
          ...state.diagram,
          components: state.diagram.components.map(c =>
            c.id === action.payload.id
              ? { ...c, size: action.payload.size }
              : c
          ),
          lastModified: new Date()
        }
      };
    }
    
    case 'ADD_CONNECTION': {
      if (!state.diagram) return state;
      return {
        ...state,
        diagram: {
          ...state.diagram,
          connections: [...state.diagram.connections, action.payload],
          lastModified: new Date()
        }
      };
    }
    
    case 'REMOVE_CONNECTION': {
      if (!state.diagram) return state;
      return {
        ...state,
        diagram: {
          ...state.diagram,
          connections: state.diagram.connections.filter(c => c.id !== action.payload),
          lastModified: new Date()
        }
      };
    }
    
    case 'UPDATE_COMPONENT_PROPERTY': {
      if (!state.diagram) return state;
      return {
        ...state,
        diagram: {
          ...state.diagram,
          components: state.diagram.components.map(c =>
            c.id === action.payload.id
              ? { ...c, [action.payload.property]: action.payload.value }
              : c
          ),
          lastModified: new Date()
        }
      };
    }
    
    default:
      return state;
  }
}

// Context Provider
interface SLDProviderProps {
  children: ReactNode;
}

export const SLDProvider: React.FC<SLDProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(sldReducer, initialState);

  // Command Management
  const executeCommand = useCallback((command: SLDCommand) => {
    dispatch({ type: 'EXECUTE_COMMAND', payload: command });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const canUndo = useCallback(() => {
    return state.commandManager?.canUndo() || false;
  }, [state.commandManager]);

  const canRedo = useCallback(() => {
    return state.commandManager?.canRedo() || false;
  }, [state.commandManager]);

  const getHistory = useCallback(() => {
    return state.commandManager?.getHistory() || { commands: [], currentIndex: -1, maxHistory: 50 };
  }, [state.commandManager]);

  // Collaboration
  const startCollaboration = useCallback((user: User) => {
    if (!state.diagram) return;
    const session = collaborationService.createSession(state.diagram.id, user);
    dispatch({ type: 'SET_COLLABORATION_SESSION', payload: session });
  }, [state.diagram]);

  const joinCollaboration = useCallback((sessionId: string, user: User) => {
    const session = collaborationService.joinSession(sessionId, user);
    dispatch({ type: 'SET_COLLABORATION_SESSION', payload: session });
  }, []);

  const leaveCollaboration = useCallback(() => {
    if (state.collaboration) {
      const currentUser = collaborationService.getCurrentUser();
      if (currentUser) {
        collaborationService.leaveSession(state.collaboration.id, currentUser.id);
      }
    }
    dispatch({ type: 'SET_COLLABORATION_SESSION', payload: null });
  }, [state.collaboration]);

  const getCollaborationSession = useCallback(() => {
    return state.collaboration;
  }, [state.collaboration]);

  // Component Management
  const addComponent = useCallback((component: SLDComponent) => {
    dispatch({ type: 'ADD_COMPONENT', payload: component });
  }, []);

  const removeComponent = useCallback((componentId: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: componentId });
  }, []);

  const moveComponent = useCallback((componentId: string, position: SLDPosition) => {
    dispatch({ type: 'MOVE_COMPONENT', payload: { id: componentId, position } });
  }, []);

  const resizeComponent = useCallback((componentId: string, size: SLDSize) => {
    dispatch({ type: 'RESIZE_COMPONENT', payload: { id: componentId, size } });
  }, []);

  const updateComponentProperty = useCallback((componentId: string, property: string, value: any) => {
    dispatch({ type: 'UPDATE_COMPONENT_PROPERTY', payload: { id: componentId, property, value } });
  }, []);

  // Connection Management
  const addConnection = useCallback((connection: SLDConnection) => {
    dispatch({ type: 'ADD_CONNECTION', payload: connection });
  }, []);

  const removeConnection = useCallback((connectionId: string) => {
    dispatch({ type: 'REMOVE_CONNECTION', payload: connectionId });
  }, []);

  // Selection Management
  const selectElements = useCallback((elementIds: string[]) => {
    dispatch({ type: 'SET_SELECTED_ELEMENTS', payload: elementIds });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTED_ELEMENTS', payload: [] });
  }, []);

  // Canvas Management
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_CANVAS_STATE', payload: { zoom } });
  }, []);

  const setPan = useCallback((pan: { x: number; y: number }) => {
    dispatch({ type: 'SET_CANVAS_STATE', payload: { pan } });
  }, []);

  const toggleGrid = useCallback(() => {
    dispatch({ type: 'SET_CANVAS_STATE', payload: { gridEnabled: !state.canvasState.gridEnabled } });
  }, [state.canvasState.gridEnabled]);

  const setGridSize = useCallback((size: number) => {
    dispatch({ type: 'SET_CANVAS_STATE', payload: { gridSize: size } });
  }, []);

  const toggleSnapToGrid = useCallback(() => {
    dispatch({ type: 'SET_CANVAS_STATE', payload: { snapToGrid: !state.canvasState.snapToGrid } });
  }, [state.canvasState.snapToGrid]);

  // Performance
  const setPerformanceSettings = useCallback((settings: Partial<SLDState['performance']>) => {
    dispatch({ type: 'SET_PERFORMANCE_SETTINGS', payload: settings });
  }, []);

  const optimizeRendering = useCallback(() => {
    // Implement rendering optimization logic
    const componentCount = state.diagram?.components.length || 0;
    const optimizedSettings = {
      virtualRendering: componentCount > 50,
      levelOfDetail: componentCount > 100 ? 'medium' as const : 'high' as const,
      cullingDistance: componentCount > 200 ? 800 : 1000
    };
    dispatch({ type: 'SET_PERFORMANCE_SETTINGS', payload: optimizedSettings });
  }, [state.diagram?.components.length]);

  // Validation
  const validateDiagram = useCallback((): ValidationResult[] => {
    if (!state.diagram) return [];
    
    const results: ValidationResult[] = [];
    
    // Basic validation
    if (state.diagram.components.length === 0) {
      results.push({
        id: 'no-components',
        type: 'warning',
        message: 'No components added to diagram'
      });
    }
    
    if (state.diagram.connections.length === 0) {
      results.push({
        id: 'no-connections',
        type: 'warning',
        message: 'No connections between components'
      });
    }
    
    // Component validation
    state.diagram.components.forEach(component => {
      if (!component.name || component.name.trim() === '') {
        results.push({
          id: `component-${component.id}-no-name`,
          type: 'error',
          message: 'Component must have a name',
          componentId: component.id
        });
      }
    });
    
    return results;
  }, [state.diagram]);

  const clearValidation = useCallback(() => {
    dispatch({ type: 'SET_VALIDATION_RESULTS', payload: [] });
  }, []);

  // Context Value
  const contextValue: SLDContextType = useMemo(() => ({
    state,
    dispatch,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    getHistory,
    startCollaboration,
    joinCollaboration,
    leaveCollaboration,
    getCollaborationSession,
    addComponent,
    removeComponent,
    moveComponent,
    resizeComponent,
    updateComponentProperty,
    addConnection,
    removeConnection,
    selectElements,
    clearSelection,
    setZoom,
    setPan,
    toggleGrid,
    setGridSize,
    toggleSnapToGrid,
    setPerformanceSettings,
    optimizeRendering,
    validateDiagram,
    clearValidation
  }), [
    state,
    executeCommand,
    undo,
    redo,
    canUndo,
    canRedo,
    getHistory,
    startCollaboration,
    joinCollaboration,
    leaveCollaboration,
    getCollaborationSession,
    addComponent,
    removeComponent,
    moveComponent,
    resizeComponent,
    updateComponentProperty,
    addConnection,
    removeConnection,
    selectElements,
    clearSelection,
    setZoom,
    setPan,
    toggleGrid,
    setGridSize,
    toggleSnapToGrid,
    setPerformanceSettings,
    optimizeRendering,
    validateDiagram,
    clearValidation
  ]);

  return (
    <SLDContext.Provider value={contextValue}>
      {children}
    </SLDContext.Provider>
  );
};

// Context
const SLDContext = createContext<SLDContextType | undefined>(undefined);

// Hook
export const useSLD = (): SLDContextType => {
  const context = useContext(SLDContext);
  if (context === undefined) {
    throw new Error('useSLD must be used within an SLDProvider');
  }
  return context;
}; 