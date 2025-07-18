/**
 * Professional Drawing Tool System for SLD Canvas
 * 
 * Comprehensive tool palette with selection, drawing, measurement, and annotation tools
 */

export interface Point {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ToolState {
  isActive: boolean;
  isDragging: boolean;
  startPoint: Point | null;
  currentPoint: Point | null;
  data: any;
}

export interface DrawingTool {
  id: string;
  name: string;
  icon: string;
  cursor: string;
  shortcut?: string;
  category: 'selection' | 'drawing' | 'measurement' | 'annotation';
  state: ToolState;
  
  // Tool lifecycle methods
  activate(): void;
  deactivate(): void;
  
  // Mouse event handlers
  onMouseDown(point: Point, event: MouseEvent): void;
  onMouseMove(point: Point, event: MouseEvent): void;
  onMouseUp(point: Point, event: MouseEvent): void;
  onDoubleClick?(point: Point, event: MouseEvent): void;
  
  // Keyboard event handlers
  onKeyDown?(event: KeyboardEvent): void;
  onKeyUp?(event: KeyboardEvent): void;
  
  // Rendering
  render?(context: CanvasRenderingContext2D | WebGL2RenderingContext): void;
  getPreviewGeometry?(): any;
}

export interface ToolOptions {
  snapToGrid: boolean;
  gridSize: number;
  snapTolerance: number;
  showGuides: boolean;
  orthoMode: boolean;
}

export class DrawingToolSystem {
  private tools: Map<string, DrawingTool> = new Map();
  private activeTool: DrawingTool | null = null;
  private options: ToolOptions;
  
  // Event callbacks
  private onToolChange?: (tool: DrawingTool | null) => void;
  private onGeometryCreate?: (geometry: any) => void;
  private onGeometryUpdate?: (id: string, updates: any) => void;
  private onSelectionChange?: (selectedIds: string[]) => void;

  constructor(options: Partial<ToolOptions> = {}) {
    this.options = {
      snapToGrid: true,
      gridSize: 20,
      snapTolerance: 10,
      showGuides: true,
      orthoMode: false,
      ...options
    };
    
    this.initializeDefaultTools();
  }

  private initializeDefaultTools(): void {
    // Import tools dynamically to avoid circular dependencies
    // Tools will be registered when they are imported
  }

  public registerTool(tool: DrawingTool): void {
    this.tools.set(tool.id, tool);
  }

  public unregisterTool(toolId: string): void {
    if (this.activeTool?.id === toolId) {
      this.setActiveTool(null);
    }
    this.tools.delete(toolId);
  }

  public getTool(toolId: string): DrawingTool | undefined {
    return this.tools.get(toolId);
  }

  public getAllTools(): DrawingTool[] {
    return Array.from(this.tools.values());
  }

  public getToolsByCategory(category: string): DrawingTool[] {
    return Array.from(this.tools.values()).filter(tool => tool.category === category);
  }

  public setActiveTool(toolId: string | null): void {
    if (this.activeTool) {
      this.activeTool.deactivate();
    }

    if (toolId) {
      const tool = this.tools.get(toolId);
      if (tool) {
        this.activeTool = tool;
        tool.activate();
      } else {
        this.activeTool = null;
      }
    } else {
      this.activeTool = null;
    }

    this.onToolChange?.(this.activeTool);
  }

  public getActiveTool(): DrawingTool | null {
    return this.activeTool;
  }

  public setOptions(options: Partial<ToolOptions>): void {
    this.options = { ...this.options, ...options };
  }

  public getOptions(): ToolOptions {
    return { ...this.options };
  }

  // Snap to grid functionality
  public snapToGrid(point: Point): Point {
    if (!this.options.snapToGrid) return point;
    
    const gridSize = this.options.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }

  // Orthogonal constraint
  public constrainToOrtho(startPoint: Point, currentPoint: Point): Point {
    if (!this.options.orthoMode) return currentPoint;
    
    const dx = Math.abs(currentPoint.x - startPoint.x);
    const dy = Math.abs(currentPoint.y - startPoint.y);
    
    if (dx > dy) {
      return { x: currentPoint.x, y: startPoint.y };
    } else {
      return { x: startPoint.x, y: currentPoint.y };
    }
  }

  // Event delegation to active tool
  public handleMouseDown(point: Point, event: MouseEvent): void {
    if (this.activeTool) {
      const snappedPoint = this.snapToGrid(point);
      this.activeTool.onMouseDown(snappedPoint, event);
    }
  }

  public handleMouseMove(point: Point, event: MouseEvent): void {
    if (this.activeTool) {
      let processedPoint = this.snapToGrid(point);
      
      if (this.activeTool.state.isDragging && this.activeTool.state.startPoint) {
        processedPoint = this.constrainToOrtho(this.activeTool.state.startPoint, processedPoint);
      }
      
      this.activeTool.onMouseMove(processedPoint, event);
    }
  }

  public handleMouseUp(point: Point, event: MouseEvent): void {
    if (this.activeTool) {
      const snappedPoint = this.snapToGrid(point);
      this.activeTool.onMouseUp(snappedPoint, event);
    }
  }

  public handleDoubleClick(point: Point, event: MouseEvent): void {
    if (this.activeTool?.onDoubleClick) {
      const snappedPoint = this.snapToGrid(point);
      this.activeTool.onDoubleClick(snappedPoint, event);
    }
  }

  public handleKeyDown(event: KeyboardEvent): void {
    // Handle tool shortcuts
    const shortcutTool = Array.from(this.tools.values())
      .find(tool => tool.shortcut === event.key.toLowerCase());
    
    if (shortcutTool && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      this.setActiveTool(shortcutTool.id);
      return;
    }

    // Handle tool-specific key events
    if (this.activeTool?.onKeyDown) {
      this.activeTool.onKeyDown(event);
    }

    // Handle global shortcuts
    switch (event.key.toLowerCase()) {
      case 'escape':
        event.preventDefault();
        this.setActiveTool('selection');
        break;
      
      case 'g':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.options.snapToGrid = !this.options.snapToGrid;
        }
        break;
      
      case 'o':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          this.options.orthoMode = !this.options.orthoMode;
        }
        break;
    }
  }

  public handleKeyUp(event: KeyboardEvent): void {
    if (this.activeTool?.onKeyUp) {
      this.activeTool.onKeyUp(event);
    }
  }

  // Event callback setters
  public setToolChangeCallback(callback: (tool: DrawingTool | null) => void): void {
    this.onToolChange = callback;
  }

  public setGeometryCreateCallback(callback: (geometry: any) => void): void {
    this.onGeometryCreate = callback;
  }

  public setGeometryUpdateCallback(callback: (id: string, updates: any) => void): void {
    this.onGeometryUpdate = callback;
  }

  public setSelectionChangeCallback(callback: (selectedIds: string[]) => void): void {
    this.onSelectionChange = callback;
  }

  // Utility methods for tools
  public createGeometry(geometry: any): void {
    this.onGeometryCreate?.(geometry);
  }

  public updateGeometry(id: string, updates: any): void {
    this.onGeometryUpdate?.(id, updates);
  }

  public updateSelection(selectedIds: string[]): void {
    this.onSelectionChange?.(selectedIds);
  }

  public dispose(): void {
    if (this.activeTool) {
      this.activeTool.deactivate();
    }
    this.tools.clear();
  }
}

// Base tool class for common functionality
export abstract class BaseTool implements DrawingTool {
  public abstract id: string;
  public abstract name: string;
  public abstract icon: string;
  public abstract cursor: string;
  public abstract category: 'selection' | 'drawing' | 'measurement' | 'annotation';
  public shortcut?: string;
  
  public state: ToolState = {
    isActive: false,
    isDragging: false,
    startPoint: null,
    currentPoint: null,
    data: null
  };

  protected toolSystem?: DrawingToolSystem;

  public setToolSystem(toolSystem: DrawingToolSystem): void {
    this.toolSystem = toolSystem;
  }

  public activate(): void {
    this.state.isActive = true;
    this.onActivate();
  }

  public deactivate(): void {
    this.state.isActive = false;
    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
    this.state.data = null;
    this.onDeactivate();
  }

  protected onActivate(): void {
    // Override in subclasses
  }

  protected onDeactivate(): void {
    // Override in subclasses
  }

  public abstract onMouseDown(point: Point, event: MouseEvent): void;
  public abstract onMouseMove(point: Point, event: MouseEvent): void;
  public abstract onMouseUp(point: Point, event: MouseEvent): void;

  public onDoubleClick?(point: Point, event: MouseEvent): void;
  public onKeyDown?(event: KeyboardEvent): void;
  public onKeyUp?(event: KeyboardEvent): void;
  public render?(context: CanvasRenderingContext2D | WebGL2RenderingContext): void;
  public getPreviewGeometry?(): any;
}