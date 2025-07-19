import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';

export interface EditorPoint {
  x: number;
  y: number;
}

export interface EditorMeasurement {
  id: string;
  type: 'linear' | 'area' | 'angle';
  points: EditorPoint[];
  distance?: number;
  area?: number;
  angle?: number;
  unit: 'ft' | 'm' | 'px';
  label?: string;
  layerId: string;
  style: {
    stroke: string;
    strokeWidth: number;
    fill?: string;
  };
}

export interface EditorAnnotation {
  id: string;
  type: 'text' | 'arrow' | 'rectangle' | 'circle' | 'line' | 'freehand';
  points: EditorPoint[];
  text?: string;
  layerId: string;
  style: {
    stroke: string;
    strokeWidth: number;
    fill?: string;
    fontSize?: number;
    fontFamily?: string;
  };
}

export interface EditorLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  type: 'photo' | 'measurement' | 'annotation' | 'overlay';
  zIndex: number;
}

export interface EditorState {
  // Image state
  image: string | null;
  imageType: 'satellite' | 'streetview';
  imageMetadata: {
    width: number;
    height: number;
    scale?: number; // pixels per foot or meter
    location?: string;
  } | null;
  
  // Layer system
  layers: EditorLayer[];
  activeLayerId: string | null;
  selectedElementIds: string[];
  
  // Editor state
  tool: 'select' | 'linear' | 'area' | 'angle' | 'text' | 'arrow' | 'rectangle' | 'circle' | 'line' | 'freehand';
  isDrawing: boolean;
  currentMeasurement: EditorMeasurement | null;
  currentAnnotation: EditorAnnotation | null;
  
  // Data
  measurements: EditorMeasurement[];
  annotations: EditorAnnotation[];
  
  // UI state
  zoom: number;
  panOffset: EditorPoint;
  unit: 'ft' | 'm';
  showGrid: boolean;
  gridSize: number;
  
  // Style settings
  strokeColor: string;
  strokeWidth: number;
  fillColor: string;
  fontSize: number;
  fontFamily: string;
}

type EditorAction =
  | { type: 'SET_IMAGE'; payload: { image: string; imageType: 'satellite' | 'streetview'; metadata: EditorState['imageMetadata'] } }
  | { type: 'SET_TOOL'; payload: EditorState['tool'] }
  | { type: 'SET_DRAWING'; payload: boolean }
  | { type: 'ADD_MEASUREMENT'; payload: EditorMeasurement }
  | { type: 'ADD_ANNOTATION'; payload: EditorAnnotation }
  | { type: 'UPDATE_CURRENT_MEASUREMENT'; payload: EditorMeasurement | null }
  | { type: 'UPDATE_CURRENT_ANNOTATION'; payload: EditorAnnotation | null }
  | { type: 'REMOVE_MEASUREMENT'; payload: string }
  | { type: 'REMOVE_ANNOTATION'; payload: string }
  | { type: 'CLEAR_ALL' }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'SET_PAN_OFFSET'; payload: EditorPoint }
  | { type: 'SET_UNIT'; payload: 'ft' | 'm' }
  | { type: 'SET_SCALE'; payload: number }
  | { type: 'TOGGLE_GRID' }
  | { type: 'SET_STROKE_COLOR'; payload: string }
  | { type: 'SET_STROKE_WIDTH'; payload: number }
  | { type: 'SET_FILL_COLOR'; payload: string }
  | { type: 'SET_FONT_SIZE'; payload: number }
  | { type: 'SET_FONT_FAMILY'; payload: string }
  // Layer actions
  | { type: 'ADD_LAYER'; payload: EditorLayer }
  | { type: 'REMOVE_LAYER'; payload: string }
  | { type: 'UPDATE_LAYER'; payload: { id: string; updates: Partial<EditorLayer> } }
  | { type: 'SET_ACTIVE_LAYER'; payload: string }
  | { type: 'REORDER_LAYER'; payload: { layerId: string; newZIndex: number } }
  | { type: 'SET_SELECTED_ELEMENTS'; payload: string[] }
  | { type: 'ADD_SELECTED_ELEMENT'; payload: string }
  | { type: 'REMOVE_SELECTED_ELEMENT'; payload: string }
  | { type: 'CLEAR_SELECTION' };

const initialState: EditorState = {
  image: null,
  imageType: 'satellite',
  imageMetadata: null,
  layers: [],
  activeLayerId: null,
  selectedElementIds: [],
  tool: 'select',
  isDrawing: false,
  currentMeasurement: null,
  currentAnnotation: null,
  measurements: [],
  annotations: [],
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  unit: 'ft',
  showGrid: false,
  gridSize: 50,
  strokeColor: '#ff0000',
  strokeWidth: 2,
  fillColor: 'rgba(255, 0, 0, 0.2)',
  fontSize: 14,
  fontFamily: 'Arial'
};

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_IMAGE':
      const defaultLayers: EditorLayer[] = [
        {
          id: 'photo-layer',
          name: 'Photo',
          visible: true,
          locked: false,
          opacity: 1,
          type: 'photo',
          zIndex: 0
        },
        {
          id: 'measurement-layer',
          name: 'Measurements',
          visible: true,
          locked: false,
          opacity: 1,
          type: 'measurement',
          zIndex: 1
        },
        {
          id: 'annotation-layer',
          name: 'Annotations',
          visible: true,
          locked: false,
          opacity: 1,
          type: 'annotation',
          zIndex: 2
        }
      ];
      return {
        ...state,
        image: action.payload.image,
        imageType: action.payload.imageType,
        imageMetadata: action.payload.metadata,
        layers: defaultLayers,
        activeLayerId: 'annotation-layer',
        selectedElementIds: [],
        measurements: [],
        annotations: [],
        currentMeasurement: null,
        currentAnnotation: null,
        zoom: 1,
        panOffset: { x: 0, y: 0 }
      };

    case 'SET_TOOL':
      return {
        ...state,
        tool: action.payload,
        isDrawing: false,
        currentMeasurement: null,
        currentAnnotation: null
      };

    case 'SET_DRAWING':
      return { ...state, isDrawing: action.payload };

    case 'ADD_MEASUREMENT':
      return {
        ...state,
        measurements: [...state.measurements, action.payload],
        currentMeasurement: null,
        isDrawing: false
      };

    case 'ADD_ANNOTATION':
      return {
        ...state,
        annotations: [...state.annotations, action.payload],
        currentAnnotation: null,
        isDrawing: false
      };

    case 'UPDATE_CURRENT_MEASUREMENT':
      return { ...state, currentMeasurement: action.payload };

    case 'UPDATE_CURRENT_ANNOTATION':
      return { ...state, currentAnnotation: action.payload };

    case 'REMOVE_MEASUREMENT':
      return {
        ...state,
        measurements: state.measurements.filter(m => m.id !== action.payload)
      };

    case 'REMOVE_ANNOTATION':
      return {
        ...state,
        annotations: state.annotations.filter(a => a.id !== action.payload)
      };

    case 'CLEAR_ALL':
      return {
        ...state,
        measurements: [],
        annotations: [],
        currentMeasurement: null,
        currentAnnotation: null,
        isDrawing: false
      };

    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(5, action.payload)) };

    case 'SET_PAN_OFFSET':
      return { ...state, panOffset: action.payload };

    case 'SET_UNIT':
      return { ...state, unit: action.payload };

    case 'SET_SCALE':
      return {
        ...state,
        imageMetadata: state.imageMetadata ? {
          ...state.imageMetadata,
          scale: action.payload
        } : null
      };

    case 'TOGGLE_GRID':
      return { ...state, showGrid: !state.showGrid };

    case 'SET_STROKE_COLOR':
      return { ...state, strokeColor: action.payload };

    case 'SET_STROKE_WIDTH':
      return { ...state, strokeWidth: action.payload };

    case 'SET_FILL_COLOR':
      return { ...state, fillColor: action.payload };

    case 'SET_FONT_SIZE':
      return { ...state, fontSize: action.payload };

    case 'SET_FONT_FAMILY':
      return { ...state, fontFamily: action.payload };

    // Layer actions
    case 'ADD_LAYER':
      return {
        ...state,
        layers: [...state.layers, action.payload].sort((a, b) => a.zIndex - b.zIndex)
      };

    case 'REMOVE_LAYER':
      return {
        ...state,
        layers: state.layers.filter(layer => layer.id !== action.payload),
        activeLayerId: state.activeLayerId === action.payload ? null : state.activeLayerId
      };

    case 'UPDATE_LAYER':
      return {
        ...state,
        layers: state.layers.map(layer =>
          layer.id === action.payload.id
            ? { ...layer, ...action.payload.updates }
            : layer
        ).sort((a, b) => a.zIndex - b.zIndex)
      };

    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayerId: action.payload };

    case 'REORDER_LAYER':
      return {
        ...state,
        layers: state.layers.map(layer =>
          layer.id === action.payload.layerId
            ? { ...layer, zIndex: action.payload.newZIndex }
            : layer
        ).sort((a, b) => a.zIndex - b.zIndex)
      };

    case 'SET_SELECTED_ELEMENTS':
      return { ...state, selectedElementIds: action.payload };

    case 'ADD_SELECTED_ELEMENT':
      return {
        ...state,
        selectedElementIds: [...state.selectedElementIds, action.payload]
      };

    case 'REMOVE_SELECTED_ELEMENT':
      return {
        ...state,
        selectedElementIds: state.selectedElementIds.filter(id => id !== action.payload)
      };

    case 'CLEAR_SELECTION':
      return { ...state, selectedElementIds: [] };

    default:
      return state;
  }
}

interface PhotoEditorContextType {
  state: EditorState;
  
  // Image actions
  setImage: (image: string, imageType: 'satellite' | 'streetview', metadata: EditorState['imageMetadata']) => void;
  
  // Tool actions
  setTool: (tool: EditorState['tool']) => void;
  setDrawing: (isDrawing: boolean) => void;
  
  // Measurement actions
  addMeasurement: (measurement: EditorMeasurement) => void;
  updateCurrentMeasurement: (measurement: EditorMeasurement | null) => void;
  removeMeasurement: (id: string) => void;
  
  // Annotation actions
  addAnnotation: (annotation: EditorAnnotation) => void;
  updateCurrentAnnotation: (annotation: EditorAnnotation | null) => void;
  removeAnnotation: (id: string) => void;
  
  // General actions
  clearAll: () => void;
  
  // View actions
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: EditorPoint) => void;
  setUnit: (unit: 'ft' | 'm') => void;
  setScale: (scale: number) => void;
  toggleGrid: () => void;
  
  // Style actions
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFillColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  
  // Layer actions
  addLayer: (layer: EditorLayer) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<EditorLayer>) => void;
  setActiveLayer: (id: string) => void;
  reorderLayer: (layerId: string, newZIndex: number) => void;
  
  // Selection actions
  setSelectedElements: (ids: string[]) => void;
  addSelectedElement: (id: string) => void;
  removeSelectedElement: (id: string) => void;
  clearSelection: () => void;
}

const PhotoEditorContext = createContext<PhotoEditorContextType | undefined>(undefined);

export const PhotoEditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Image actions
  const setImage = useCallback((image: string, imageType: 'satellite' | 'streetview', metadata: EditorState['imageMetadata']) => {
    dispatch({ type: 'SET_IMAGE', payload: { image, imageType, metadata } });
  }, []);

  // Tool actions
  const setTool = useCallback((tool: EditorState['tool']) => {
    dispatch({ type: 'SET_TOOL', payload: tool });
  }, []);

  const setDrawing = useCallback((isDrawing: boolean) => {
    dispatch({ type: 'SET_DRAWING', payload: isDrawing });
  }, []);

  // Measurement actions
  const addMeasurement = useCallback((measurement: EditorMeasurement) => {
    dispatch({ type: 'ADD_MEASUREMENT', payload: measurement });
  }, []);

  const updateCurrentMeasurement = useCallback((measurement: EditorMeasurement | null) => {
    dispatch({ type: 'UPDATE_CURRENT_MEASUREMENT', payload: measurement });
  }, []);

  const removeMeasurement = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_MEASUREMENT', payload: id });
  }, []);

  // Annotation actions
  const addAnnotation = useCallback((annotation: EditorAnnotation) => {
    dispatch({ type: 'ADD_ANNOTATION', payload: annotation });
  }, []);

  const updateCurrentAnnotation = useCallback((annotation: EditorAnnotation | null) => {
    dispatch({ type: 'UPDATE_CURRENT_ANNOTATION', payload: annotation });
  }, []);

  const removeAnnotation = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_ANNOTATION', payload: id });
  }, []);

  // General actions
  const clearAll = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL' });
  }, []);

  // View actions
  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom });
  }, []);

  const setPanOffset = useCallback((offset: EditorPoint) => {
    dispatch({ type: 'SET_PAN_OFFSET', payload: offset });
  }, []);

  const setUnit = useCallback((unit: 'ft' | 'm') => {
    dispatch({ type: 'SET_UNIT', payload: unit });
  }, []);

  const setScale = useCallback((scale: number) => {
    dispatch({ type: 'SET_SCALE', payload: scale });
  }, []);

  const toggleGrid = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID' });
  }, []);

  // Style actions
  const setStrokeColor = useCallback((color: string) => {
    dispatch({ type: 'SET_STROKE_COLOR', payload: color });
  }, []);

  const setStrokeWidth = useCallback((width: number) => {
    dispatch({ type: 'SET_STROKE_WIDTH', payload: width });
  }, []);

  const setFillColor = useCallback((color: string) => {
    dispatch({ type: 'SET_FILL_COLOR', payload: color });
  }, []);

  const setFontSize = useCallback((size: number) => {
    dispatch({ type: 'SET_FONT_SIZE', payload: size });
  }, []);

  const setFontFamily = useCallback((family: string) => {
    dispatch({ type: 'SET_FONT_FAMILY', payload: family });
  }, []);

  // Layer actions
  const addLayer = useCallback((layer: EditorLayer) => {
    dispatch({ type: 'ADD_LAYER', payload: layer });
  }, []);

  const removeLayer = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_LAYER', payload: id });
  }, []);

  const updateLayer = useCallback((id: string, updates: Partial<EditorLayer>) => {
    dispatch({ type: 'UPDATE_LAYER', payload: { id, updates } });
  }, []);

  const setActiveLayer = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_LAYER', payload: id });
  }, []);

  const reorderLayer = useCallback((layerId: string, newZIndex: number) => {
    dispatch({ type: 'REORDER_LAYER', payload: { layerId, newZIndex } });
  }, []);

  // Selection actions
  const setSelectedElements = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_SELECTED_ELEMENTS', payload: ids });
  }, []);

  const addSelectedElement = useCallback((id: string) => {
    dispatch({ type: 'ADD_SELECTED_ELEMENT', payload: id });
  }, []);

  const removeSelectedElement = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_SELECTED_ELEMENT', payload: id });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTION' });
  }, []);

  const contextValue: PhotoEditorContextType = {
    state,
    setImage,
    setTool,
    setDrawing,
    addMeasurement,
    updateCurrentMeasurement,
    removeMeasurement,
    addAnnotation,
    updateCurrentAnnotation,
    removeAnnotation,
    clearAll,
    setZoom,
    setPanOffset,
    setUnit,
    setScale,
    toggleGrid,
    setStrokeColor,
    setStrokeWidth,
    setFillColor,
    setFontSize,
    setFontFamily,
    addLayer,
    removeLayer,
    updateLayer,
    setActiveLayer,
    reorderLayer,
    setSelectedElements,
    addSelectedElement,
    removeSelectedElement,
    clearSelection
  };

  return (
    <PhotoEditorContext.Provider value={contextValue}>
      {children}
    </PhotoEditorContext.Provider>
  );
};

export const usePhotoEditor = (): PhotoEditorContextType => {
  const context = useContext(PhotoEditorContext);
  if (!context) {
    throw new Error('usePhotoEditor must be used within a PhotoEditorProvider');
  }
  return context;
};