/**
 * Precision Grid System for Professional SLD Canvas
 * 
 * Configurable grid with standard architectural scales and visual feedback
 */

export interface GridSettings {
  enabled: boolean;
  size: number; // Base grid size in pixels
  subdivisions: number; // Number of subdivisions for minor grid
  snapEnabled: boolean;
  snapTolerance: number; // Snap distance in pixels
  showMajorGrid: boolean;
  showMinorGrid: boolean;
  majorGridColor: string;
  minorGridColor: string;
  majorGridOpacity: number;
  minorGridOpacity: number;
  scale: GridScale;
}

export interface GridScale {
  name: string;
  unit: string;
  pixelsPerUnit: number;
  majorInterval: number; // Major grid lines every N units
  minorInterval: number; // Minor grid lines every N units
}

export interface Point {
  x: number;
  y: number;
}

export interface SnapResult {
  point: Point;
  snapped: boolean;
  snapType: 'grid' | 'guide' | 'terminal' | 'none';
  snapDistance: number;
}

export interface AlignmentGuide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
  color: string;
  opacity: number;
}

// Standard architectural scales
export const GRID_SCALES: Record<string, GridScale> = {
  'eighth_inch': {
    name: '1/8"',
    unit: 'inch',
    pixelsPerUnit: 96 / 8, // 96 DPI / 8
    majorInterval: 1, // 1 inch
    minorInterval: 0.125 // 1/8 inch
  },
  'quarter_inch': {
    name: '1/4"',
    unit: 'inch',
    pixelsPerUnit: 96 / 4,
    majorInterval: 1,
    minorInterval: 0.25
  },
  'half_inch': {
    name: '1/2"',
    unit: 'inch',
    pixelsPerUnit: 96 / 2,
    majorInterval: 1,
    minorInterval: 0.5
  },
  'one_inch': {
    name: '1"',
    unit: 'inch',
    pixelsPerUnit: 96,
    majorInterval: 1,
    minorInterval: 1
  },
  'metric_5mm': {
    name: '5mm',
    unit: 'mm',
    pixelsPerUnit: 96 / 25.4 * 5, // 96 DPI to mm conversion * 5mm
    majorInterval: 50, // 50mm
    minorInterval: 5 // 5mm
  },
  'metric_10mm': {
    name: '10mm',
    unit: 'mm',
    pixelsPerUnit: 96 / 25.4 * 10,
    majorInterval: 50,
    minorInterval: 10
  }
};

export class GridSystem {
  private settings: GridSettings;
  private alignmentGuides: Map<string, AlignmentGuide> = new Map();
  private snapTargets: Point[] = [];
  private terminalPoints: Point[] = [];
  
  // Event callbacks
  private onSettingsChange?: (settings: GridSettings) => void;
  private onGuidesChange?: (guides: AlignmentGuide[]) => void;

  constructor(initialSettings?: Partial<GridSettings>) {
    this.settings = {
      enabled: true,
      size: 20,
      subdivisions: 4,
      snapEnabled: true,
      snapTolerance: 8,
      showMajorGrid: true,
      showMinorGrid: true,
      majorGridColor: '#cccccc',
      minorGridColor: '#eeeeee',
      majorGridOpacity: 0.8,
      minorGridOpacity: 0.4,
      scale: GRID_SCALES.quarter_inch,
      ...initialSettings
    };
  }

  public setSettingsChangeCallback(callback: (settings: GridSettings) => void): void {
    this.onSettingsChange = callback;
  }

  public setGuidesChangeCallback(callback: (guides: AlignmentGuide[]) => void): void {
    this.onGuidesChange = callback;
  }

  public getSettings(): GridSettings {
    return { ...this.settings };
  }

  public updateSettings(updates: Partial<GridSettings>): void {
    this.settings = { ...this.settings, ...updates };
    this.onSettingsChange?.(this.getSettings());
  }

  public setGridScale(scaleName: string): void {
    const scale = GRID_SCALES[scaleName];
    if (scale) {
      this.updateSettings({ scale });
    }
  }

  public setGridSize(size: number): void {
    this.updateSettings({ size: Math.max(1, size) });
  }

  public setSnapEnabled(enabled: boolean): void {
    this.updateSettings({ snapEnabled: enabled });
  }

  public setSnapTolerance(tolerance: number): void {
    this.updateSettings({ snapTolerance: Math.max(1, tolerance) });
  }

  public snapToGrid(point: Point): SnapResult {
    if (!this.settings.snapEnabled) {
      return {
        point,
        snapped: false,
        snapType: 'none',
        snapDistance: 0
      };
    }

    const gridSize = this.settings.size;
    const snappedX = Math.round(point.x / gridSize) * gridSize;
    const snappedY = Math.round(point.y / gridSize) * gridSize;
    
    const snapDistance = Math.sqrt(
      Math.pow(snappedX - point.x, 2) + Math.pow(snappedY - point.y, 2)
    );

    if (snapDistance <= this.settings.snapTolerance) {
      return {
        point: { x: snappedX, y: snappedY },
        snapped: true,
        snapType: 'grid',
        snapDistance
      };
    }

    return {
      point,
      snapped: false,
      snapType: 'none',
      snapDistance: 0
    };
  }

  public snapToGuides(point: Point): SnapResult {
    if (!this.settings.snapEnabled || this.alignmentGuides.size === 0) {
      return {
        point,
        snapped: false,
        snapType: 'none',
        snapDistance: 0
      };
    }

    let bestSnap: SnapResult = {
      point,
      snapped: false,
      snapType: 'none',
      snapDistance: Infinity
    };

    for (const guide of this.alignmentGuides.values()) {
      let snapPoint: Point;
      let distance: number;

      if (guide.type === 'horizontal') {
        snapPoint = { x: point.x, y: guide.position };
        distance = Math.abs(point.y - guide.position);
      } else {
        snapPoint = { x: guide.position, y: point.y };
        distance = Math.abs(point.x - guide.position);
      }

      if (distance <= this.settings.snapTolerance && distance < bestSnap.snapDistance) {
        bestSnap = {
          point: snapPoint,
          snapped: true,
          snapType: 'guide',
          snapDistance: distance
        };
      }
    }

    return bestSnap;
  }

  public snapToTerminals(point: Point): SnapResult {
    if (!this.settings.snapEnabled || this.terminalPoints.length === 0) {
      return {
        point,
        snapped: false,
        snapType: 'none',
        snapDistance: 0
      };
    }

    let bestSnap: SnapResult = {
      point,
      snapped: false,
      snapType: 'none',
      snapDistance: Infinity
    };

    for (const terminal of this.terminalPoints) {
      const distance = Math.sqrt(
        Math.pow(terminal.x - point.x, 2) + Math.pow(terminal.y - point.y, 2)
      );

      if (distance <= this.settings.snapTolerance && distance < bestSnap.snapDistance) {
        bestSnap = {
          point: terminal,
          snapped: true,
          snapType: 'terminal',
          snapDistance: distance
        };
      }
    }

    return bestSnap;
  }

  public snapPoint(point: Point): SnapResult {
    // Try snapping in order of priority: terminals, guides, grid
    let result = this.snapToTerminals(point);
    if (result.snapped) return result;

    result = this.snapToGuides(point);
    if (result.snapped) return result;

    return this.snapToGrid(point);
  }

  public generateAlignmentGuides(
    movingObjects: { x: number; y: number; width: number; height: number }[],
    staticObjects: { x: number; y: number; width: number; height: number }[]
  ): void {
    this.clearAlignmentGuides();

    if (movingObjects.length === 0 || staticObjects.length === 0) {
      return;
    }

    const tolerance = this.settings.snapTolerance;
    const guides: AlignmentGuide[] = [];

    for (const moving of movingObjects) {
      const movingEdges = {
        left: moving.x,
        right: moving.x + moving.width,
        top: moving.y,
        bottom: moving.y + moving.height,
        centerX: moving.x + moving.width / 2,
        centerY: moving.y + moving.height / 2
      };

      for (const static_ of staticObjects) {
        const staticEdges = {
          left: static_.x,
          right: static_.x + static_.width,
          top: static_.y,
          bottom: static_.y + static_.height,
          centerX: static_.x + static_.width / 2,
          centerY: static_.y + static_.height / 2
        };

        // Check for vertical alignment (horizontal guides)
        const verticalAlignments = [
          { moving: movingEdges.top, static: staticEdges.top, name: 'top-top' },
          { moving: movingEdges.top, static: staticEdges.bottom, name: 'top-bottom' },
          { moving: movingEdges.bottom, static: staticEdges.top, name: 'bottom-top' },
          { moving: movingEdges.bottom, static: staticEdges.bottom, name: 'bottom-bottom' },
          { moving: movingEdges.centerY, static: staticEdges.centerY, name: 'center-center' }
        ];

        for (const alignment of verticalAlignments) {
          if (Math.abs(alignment.moving - alignment.static) <= tolerance) {
            guides.push({
              id: `h-${guides.length}`,
              type: 'horizontal',
              position: alignment.static,
              start: Math.min(movingEdges.left, staticEdges.left) - 20,
              end: Math.max(movingEdges.right, staticEdges.right) + 20,
              color: '#ff6b6b',
              opacity: 0.8
            });
          }
        }

        // Check for horizontal alignment (vertical guides)
        const horizontalAlignments = [
          { moving: movingEdges.left, static: staticEdges.left, name: 'left-left' },
          { moving: movingEdges.left, static: staticEdges.right, name: 'left-right' },
          { moving: movingEdges.right, static: staticEdges.left, name: 'right-left' },
          { moving: movingEdges.right, static: staticEdges.right, name: 'right-right' },
          { moving: movingEdges.centerX, static: staticEdges.centerX, name: 'center-center' }
        ];

        for (const alignment of horizontalAlignments) {
          if (Math.abs(alignment.moving - alignment.static) <= tolerance) {
            guides.push({
              id: `v-${guides.length}`,
              type: 'vertical',
              position: alignment.static,
              start: Math.min(movingEdges.top, staticEdges.top) - 20,
              end: Math.max(movingEdges.bottom, staticEdges.bottom) + 20,
              color: '#4ecdc4',
              opacity: 0.8
            });
          }
        }
      }
    }

    // Add guides to the system
    guides.forEach(guide => {
      this.alignmentGuides.set(guide.id, guide);
    });

    this.onGuidesChange?.(this.getAlignmentGuides());
  }

  public clearAlignmentGuides(): void {
    this.alignmentGuides.clear();
    this.onGuidesChange?.([]);
  }

  public getAlignmentGuides(): AlignmentGuide[] {
    return Array.from(this.alignmentGuides.values());
  }

  public setTerminalPoints(points: Point[]): void {
    this.terminalPoints = [...points];
  }

  public addTerminalPoint(point: Point): void {
    this.terminalPoints.push(point);
  }

  public clearTerminalPoints(): void {
    this.terminalPoints = [];
  }

  public getGridLines(viewport: { x: number; y: number; width: number; height: number; zoom: number }): {
    majorLines: { type: 'horizontal' | 'vertical'; position: number }[];
    minorLines: { type: 'horizontal' | 'vertical'; position: number }[];
  } {
    const lines = {
      majorLines: [] as { type: 'horizontal' | 'vertical'; position: number }[],
      minorLines: [] as { type: 'horizontal' | 'vertical'; position: number }[]
    };

    if (!this.settings.enabled) {
      return lines;
    }

    const gridSize = this.settings.size;
    const subdivisions = this.settings.subdivisions;
    const minorGridSize = gridSize / subdivisions;

    // Calculate visible range
    const startX = Math.floor(viewport.x / gridSize) * gridSize;
    const endX = Math.ceil((viewport.x + viewport.width / viewport.zoom) / gridSize) * gridSize;
    const startY = Math.floor(viewport.y / gridSize) * gridSize;
    const endY = Math.ceil((viewport.y + viewport.height / viewport.zoom) / gridSize) * gridSize;

    // Generate major grid lines
    if (this.settings.showMajorGrid) {
      for (let x = startX; x <= endX; x += gridSize) {
        lines.majorLines.push({ type: 'vertical', position: x });
      }
      for (let y = startY; y <= endY; y += gridSize) {
        lines.majorLines.push({ type: 'horizontal', position: y });
      }
    }

    // Generate minor grid lines
    if (this.settings.showMinorGrid && viewport.zoom > 0.5) {
      const minorStartX = Math.floor(viewport.x / minorGridSize) * minorGridSize;
      const minorEndX = Math.ceil((viewport.x + viewport.width / viewport.zoom) / minorGridSize) * minorGridSize;
      const minorStartY = Math.floor(viewport.y / minorGridSize) * minorGridSize;
      const minorEndY = Math.ceil((viewport.y + viewport.height / viewport.zoom) / minorGridSize) * minorGridSize;

      for (let x = minorStartX; x <= minorEndX; x += minorGridSize) {
        if (x % gridSize !== 0) { // Skip major grid positions
          lines.minorLines.push({ type: 'vertical', position: x });
        }
      }
      for (let y = minorStartY; y <= minorEndY; y += minorGridSize) {
        if (y % gridSize !== 0) { // Skip major grid positions
          lines.minorLines.push({ type: 'horizontal', position: y });
        }
      }
    }

    return lines;
  }

  public getGridInfo(): {
    scale: GridScale;
    actualSize: number;
    realWorldSize: string;
  } {
    const scale = this.settings.scale;
    const actualSize = this.settings.size;
    const realWorldUnits = actualSize / scale.pixelsPerUnit;
    
    return {
      scale,
      actualSize,
      realWorldSize: `${realWorldUnits.toFixed(3)} ${scale.unit}`
    };
  }

  public convertPixelsToRealWorld(pixels: number): number {
    return pixels / this.settings.scale.pixelsPerUnit;
  }

  public convertRealWorldToPixels(units: number): number {
    return units * this.settings.scale.pixelsPerUnit;
  }

  public dispose(): void {
    this.alignmentGuides.clear();
    this.snapTargets = [];
    this.terminalPoints = [];
  }
}