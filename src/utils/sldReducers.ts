import type { SLDDiagram, SLDComponent, SLDConnection, SLDPosition } from '../types/sld';

export const setDiagram = (state: any, payload: SLDDiagram) => ({
  ...state,
  diagram: payload
});

export const addComponent = (state: any, payload: SLDComponent) => {
  if (!state.diagram) return state;
  return {
    ...state,
    diagram: {
      ...state.diagram,
      components: [...state.diagram.components, payload],
      metadata: {
        ...state.diagram.metadata,
        modified: new Date().toISOString()
      }
    }
  };
};

export const updateComponent = (state: any, payload: { id: string; updates: Partial<SLDComponent> }) => {
  if (!state.diagram) return state;
  return {
    ...state,
    diagram: {
      ...state.diagram,
      components: state.diagram.components.map((comp: SLDComponent) =>
        comp.id === payload.id 
          ? { ...comp, ...payload.updates }
          : comp
      ),
      metadata: {
        ...state.diagram.metadata,
        modified: new Date().toISOString()
      }
    }
  };
};

export const removeComponent = (state: any, payload: string) => {
  if (!state.diagram) return state;
  return {
    ...state,
    diagram: {
      ...state.diagram,
      components: state.diagram.components.filter((comp: SLDComponent) => comp.id !== payload),
      connections: state.diagram.connections.filter((conn: SLDConnection) => 
        conn.fromComponentId !== payload && conn.toComponentId !== payload
      ),
      metadata: {
        ...state.diagram.metadata,
        modified: new Date().toISOString()
      }
    },
    selectedComponents: state.selectedComponents.filter((id: string) => id !== payload)
  };
};

export const addConnection = (state: any, payload: SLDConnection) => {
  if (!state.diagram) return state;
  return {
    ...state,
    diagram: {
      ...state.diagram,
      connections: [...state.diagram.connections, payload],
      metadata: {
        ...state.diagram.metadata,
        modified: new Date().toISOString()
      }
    }
  };
};

export const removeConnection = (state: any, payload: string) => {
  if (!state.diagram) return state;
  return {
    ...state,
    diagram: {
      ...state.diagram,
      connections: state.diagram.connections.filter((conn: SLDConnection) => conn.id !== payload),
      metadata: {
        ...state.diagram.metadata,
        modified: new Date().toISOString()
      }
    }
  };
};

export const selectComponents = (state: any, payload: string[]) => ({
  ...state,
  selectedComponents: payload
});

export const updateCanvasState = (state: any, payload: Partial<any>) => ({
  ...state,
  canvasState: {
    ...state.canvasState,
    ...payload
  }
});

export const updateUIState = (state: any, payload: Partial<any>) => ({
  ...state,
  ui: {
    ...state.ui,
    ...payload
  }
});

export const resetDiagram = (initialState: any) => ({
  ...initialState,
  diagram: {
    ...initialState.diagram!,
    id: 'diagram-' + Date.now(),
    metadata: {
      ...initialState.diagram!.metadata,
      created: new Date().toISOString(),
      modified: new Date().toISOString()
    }
  }
});
