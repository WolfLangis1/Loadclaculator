import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SLDProvider, useSLD } from '../../context/SLDContext';
import type { SLDDiagram, SLDComponent } from '../../types/sld';

// Test component that uses SLD context
const TestComponent = () => {
  const {
    state,
    addComponent,
    removeComponent,
    moveComponent,
    addConnection,
    validateDiagram,
    undo,
    redo,
    canUndo,
    canRedo
  } = useSLD();

  return (
    <div>
      <div data-testid="diagram-id">{state.diagram?.id || 'no-diagram'}</div>
      <div data-testid="component-count">{state.diagram?.components.length || 0}</div>
      <div data-testid="connection-count">{state.diagram?.connections.length || 0}</div>
      <div data-testid="validation-count">{state.validation.length}</div>
      <div data-testid="can-undo">{canUndo().toString()}</div>
      <div data-testid="can-redo">{canRedo().toString()}</div>
      
      <button 
        data-testid="add-component"
        onClick={() => {
          const component: SLDComponent = {
            id: 'test-component',
            type: 'main_panel',
            name: 'Test Panel',
            position: { x: 100, y: 100 },
            size: { width: 80, height: 60 },
            rotation: 0,
            labels: [],
            necLabels: [],
            specifications: {}
          } as any;
          addComponent(component);
        }}
      >
        Add Component
      </button>
      
      <button 
        data-testid="remove-component"
        onClick={() => removeComponent('test-component')}
      >
        Remove Component
      </button>
      
      <button 
        data-testid="move-component"
        onClick={() => moveComponent('test-component', { x: 200, y: 200 })}
      >
        Move Component
      </button>
      
      <button 
        data-testid="add-connection"
        onClick={() => {
          addConnection({
            id: 'test-connection',
            fromComponentId: 'comp1',
            toComponentId: 'comp2',
            fromPort: 'output',
            toPort: 'input',
            wireType: 'ac'
          });
        }}
      >
        Add Connection
      </button>
      
      <button 
        data-testid="validate"
        onClick={() => validateDiagram()}
      >
        Validate
      </button>
      
      <button 
        data-testid="undo"
        onClick={() => undo()}
      >
        Undo
      </button>
      
      <button 
        data-testid="redo"
        onClick={() => redo()}
      >
        Redo
      </button>
    </div>
  );
};

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <SLDProvider>
      {component}
    </SLDProvider>
  );
};

describe('SLDContext', () => {
  beforeEach(() => {
    // Clear any existing state
    localStorage.clear();
  });

  describe('Provider', () => {
    it('should provide initial state', () => {
      renderWithProvider(<TestComponent />);
      
      expect(screen.getByTestId('diagram-id')).toHaveTextContent('no-diagram');
      expect(screen.getByTestId('component-count')).toHaveTextContent('0');
      expect(screen.getByTestId('connection-count')).toHaveTextContent('0');
      expect(screen.getByTestId('validation-count')).toHaveTextContent('0');
      expect(screen.getByTestId('can-undo')).toHaveTextContent('false');
      expect(screen.getByTestId('can-redo')).toHaveTextContent('false');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = () => {};
      
      expect(() => render(<TestComponent />)).toThrow('useSLD must be used within an SLDProvider');
      
      console.error = originalError;
    });
  });

  describe('Component Management', () => {
    it('should add components', async () => {
      renderWithProvider(<TestComponent />);
      
      const addButton = screen.getByTestId('add-component');
      await act(async () => {
        addButton.click();
      });
      
      expect(screen.getByTestId('component-count')).toHaveTextContent('1');
    });

    it('should remove components', async () => {
      renderWithProvider(<TestComponent />);
      
      const addButton = screen.getByTestId('add-component');
      const removeButton = screen.getByTestId('remove-component');
      
      await act(async () => {
        addButton.click();
      });
      
      expect(screen.getByTestId('component-count')).toHaveTextContent('1');
      
      await act(async () => {
        removeButton.click();
      });
      
      expect(screen.getByTestId('component-count')).toHaveTextContent('0');
    });

    it('should move components', async () => {
      const TestMoveComponent = () => {
        const { state, addComponent, moveComponent } = useSLD();
        
        const component = state.diagram?.components.find(c => c.id === 'test-component');
        
        return (
          <div>
            <div data-testid="component-position">
              {component ? `${component.position.x},${component.position.y}` : 'none'}
            </div>
            <button 
              data-testid="add-component"
              onClick={() => {
                const comp: SLDComponent = {
                  id: 'test-component',
                  type: 'main_panel',
                  name: 'Test Panel',
                  position: { x: 100, y: 100 },
                  size: { width: 80, height: 60 },
                  rotation: 0,
                  labels: [],
                  necLabels: [],
                  specifications: {}
                } as any;
                addComponent(comp);
              }}
            >
              Add Component
            </button>
            <button 
              data-testid="move-component"
              onClick={() => moveComponent('test-component', { x: 200, y: 200 })}
            >
              Move Component
            </button>
          </div>
        );
      };
      
      renderWithProvider(<TestMoveComponent />);
      
      const addButton = screen.getByTestId('add-component');
      const moveButton = screen.getByTestId('move-component');
      
      await act(async () => {
        addButton.click();
      });
      
      expect(screen.getByTestId('component-position')).toHaveTextContent('100,100');
      
      await act(async () => {
        moveButton.click();
      });
      
      expect(screen.getByTestId('component-position')).toHaveTextContent('200,200');
    });
  });

  describe('Connection Management', () => {
    it('should add connections', async () => {
      renderWithProvider(<TestComponent />);
      
      const addButton = screen.getByTestId('add-connection');
      await act(async () => {
        addButton.click();
      });
      
      expect(screen.getByTestId('connection-count')).toHaveTextContent('1');
    });
  });

  describe('Validation', () => {
    it('should validate diagram and return results', async () => {
      const TestValidationComponent = () => {
        const { state, validateDiagram } = useSLD();
        
        return (
          <div>
            <div data-testid="validation-results">
              {state.validation.map((result, index) => (
                <div key={index} data-testid={`validation-${index}`}>
                  {result.type}: {result.message}
                </div>
              ))}
            </div>
            <button 
              data-testid="validate"
              onClick={() => validateDiagram()}
            >
              Validate
            </button>
          </div>
        );
      };
      
      renderWithProvider(<TestValidationComponent />);
      
      const validateButton = screen.getByTestId('validate');
      await act(async () => {
        validateButton.click();
      });
      
      // Should have validation warnings for empty diagram
      const validationResults = screen.getByTestId('validation-results');
      expect(validationResults.children.length).toBeGreaterThan(0);
    });
  });

  describe('Canvas State Management', () => {
    it('should manage zoom and pan state', async () => {
      const TestCanvasComponent = () => {
        const { state, setZoom, setPan } = useSLD();
        
        return (
          <div>
            <div data-testid="zoom">{state.canvasState.zoom}</div>
            <div data-testid="pan">{`${state.canvasState.pan.x},${state.canvasState.pan.y}`}</div>
            <button 
              data-testid="set-zoom"
              onClick={() => setZoom(1.5)}
            >
              Set Zoom
            </button>
            <button 
              data-testid="set-pan"
              onClick={() => setPan({ x: 50, y: 100 })}
            >
              Set Pan
            </button>
          </div>
        );
      };
      
      renderWithProvider(<TestCanvasComponent />);
      
      expect(screen.getByTestId('zoom')).toHaveTextContent('1');
      expect(screen.getByTestId('pan')).toHaveTextContent('0,0');
      
      const zoomButton = screen.getByTestId('set-zoom');
      const panButton = screen.getByTestId('set-pan');
      
      await act(async () => {
        zoomButton.click();
      });
      
      expect(screen.getByTestId('zoom')).toHaveTextContent('1.5');
      
      await act(async () => {
        panButton.click();
      });
      
      expect(screen.getByTestId('pan')).toHaveTextContent('50,100');
    });

    it('should toggle grid settings', async () => {
      const TestGridComponent = () => {
        const { state, toggleGrid, setGridSize } = useSLD();
        
        return (
          <div>
            <div data-testid="grid-enabled">{state.canvasState.gridEnabled.toString()}</div>
            <div data-testid="grid-size">{state.canvasState.gridSize}</div>
            <button 
              data-testid="toggle-grid"
              onClick={() => toggleGrid()}
            >
              Toggle Grid
            </button>
            <button 
              data-testid="set-grid-size"
              onClick={() => setGridSize(30)}
            >
              Set Grid Size
            </button>
          </div>
        );
      };
      
      renderWithProvider(<TestGridComponent />);
      
      expect(screen.getByTestId('grid-enabled')).toHaveTextContent('true');
      expect(screen.getByTestId('grid-size')).toHaveTextContent('20');
      
      const toggleButton = screen.getByTestId('toggle-grid');
      const sizeButton = screen.getByTestId('set-grid-size');
      
      await act(async () => {
        toggleButton.click();
      });
      
      expect(screen.getByTestId('grid-enabled')).toHaveTextContent('false');
      
      await act(async () => {
        sizeButton.click();
      });
      
      expect(screen.getByTestId('grid-size')).toHaveTextContent('30');
    });
  });

  describe('Performance Settings', () => {
    it('should manage performance settings', async () => {
      const TestPerformanceComponent = () => {
        const { state, setPerformanceSettings, optimizeRendering } = useSLD();
        
        return (
          <div>
            <div data-testid="virtual-rendering">
              {state.performance.virtualRendering.toString()}
            </div>
            <div data-testid="level-of-detail">{state.performance.levelOfDetail}</div>
            <button 
              data-testid="set-performance"
              onClick={() => setPerformanceSettings({ 
                virtualRendering: false, 
                levelOfDetail: 'medium' 
              })}
            >
              Set Performance
            </button>
            <button 
              data-testid="optimize"
              onClick={() => optimizeRendering()}
            >
              Optimize
            </button>
          </div>
        );
      };
      
      renderWithProvider(<TestPerformanceComponent />);
      
      expect(screen.getByTestId('virtual-rendering')).toHaveTextContent('true');
      expect(screen.getByTestId('level-of-detail')).toHaveTextContent('high');
      
      const setButton = screen.getByTestId('set-performance');
      await act(async () => {
        setButton.click();
      });
      
      expect(screen.getByTestId('virtual-rendering')).toHaveTextContent('false');
      expect(screen.getByTestId('level-of-detail')).toHaveTextContent('medium');
    });
  });

  describe('Selection Management', () => {
    it('should manage element selection', async () => {
      const TestSelectionComponent = () => {
        const { state, selectElements, clearSelection } = useSLD();
        
        return (
          <div>
            <div data-testid="selected-count">{state.selectedElements.length}</div>
            <div data-testid="selected-elements">
              {state.selectedElements.join(',')}
            </div>
            <button 
              data-testid="select-elements"
              onClick={() => selectElements(['comp1', 'comp2'])}
            >
              Select Elements
            </button>
            <button 
              data-testid="clear-selection"
              onClick={() => clearSelection()}
            >
              Clear Selection
            </button>
          </div>
        );
      };
      
      renderWithProvider(<TestSelectionComponent />);
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
      
      const selectButton = screen.getByTestId('select-elements');
      const clearButton = screen.getByTestId('clear-selection');
      
      await act(async () => {
        selectButton.click();
      });
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('2');
      expect(screen.getByTestId('selected-elements')).toHaveTextContent('comp1,comp2');
      
      await act(async () => {
        clearButton.click();
      });
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid operations gracefully', async () => {
      renderWithProvider(<TestComponent />);
      
      // Try to remove non-existent component
      const removeButton = screen.getByTestId('remove-component');
      await act(async () => {
        removeButton.click();
      });
      
      // Should not crash - component count should remain 0
      expect(screen.getByTestId('component-count')).toHaveTextContent('0');
    });

    it('should handle move operations on non-existent components', async () => {
      renderWithProvider(<TestComponent />);
      
      // Try to move non-existent component
      const moveButton = screen.getByTestId('move-component');
      await act(async () => {
        moveButton.click();
      });
      
      // Should not crash
      expect(screen.getByTestId('component-count')).toHaveTextContent('0');
    });
  });
});