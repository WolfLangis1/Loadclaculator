/**
 * Selection Tool - Single and Multi-select capabilities
 */

import { BaseTool, Point } from './DrawingToolSystem';

export class SelectionTool extends BaseTool {
  public id = 'selection';
  public name = 'Selection';
  public icon = '↖️';
  public cursor = 'default';
  public category = 'selection' as const;
  public shortcut = 'v';

  private selectionBox: {
    start: Point;
    end: Point;
    active: boolean;
  } = {
    start: { x: 0, y: 0 },
    end: { x: 0, y: 0 },
    active: false
  };

  public onMouseDown(point: Point, event: MouseEvent): void {
    this.state.startPoint = point;
    this.state.isDragging = true;

    // Check if clicking on an existing selection handle or object
    // This would integrate with the HitTestSystem and SelectionSystem
    
    if (event.shiftKey || event.ctrlKey) {
      // Multi-select mode
      this.startMultiSelect(point);
    } else {
      // Single select or start selection box
      this.startSelection(point);
    }
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;

    if (this.state.isDragging && this.state.startPoint) {
      if (this.selectionBox.active) {
        // Update selection box
        this.selectionBox.end = point;
        this.updateSelectionBox();
      } else {
        // Check if we should start a selection box
        const distance = Math.sqrt(
          Math.pow(point.x - this.state.startPoint.x, 2) +
          Math.pow(point.y - this.state.startPoint.y, 2)
        );
        
        if (distance > 5) {
          this.startSelectionBox(this.state.startPoint, point);
        }
      }
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    if (this.selectionBox.active) {
      this.completeSelectionBox();
    } else if (this.state.startPoint) {
      // Single click selection
      this.selectAtPoint(point, event.shiftKey || event.ctrlKey);
    }

    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
    this.selectionBox.active = false;
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.selectAll();
        }
        break;
      
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        this.deleteSelected();
        break;
      
      case 'Escape':
        event.preventDefault();
        this.clearSelection();
        break;
    }
  }

  private startSelection(point: Point): void {
    // Single selection logic
    this.selectAtPoint(point, false);
  }

  private startMultiSelect(point: Point): void {
    // Multi-selection logic
    this.selectAtPoint(point, true);
  }

  private startSelectionBox(start: Point, end: Point): void {
    this.selectionBox = {
      start,
      end,
      active: true
    };
  }

  private updateSelectionBox(): void {
    // Update selection box visual feedback
    // This would trigger a re-render with the selection box overlay
  }

  private completeSelectionBox(): void {
    const bounds = {
      x: Math.min(this.selectionBox.start.x, this.selectionBox.end.x),
      y: Math.min(this.selectionBox.start.y, this.selectionBox.end.y),
      width: Math.abs(this.selectionBox.end.x - this.selectionBox.start.x),
      height: Math.abs(this.selectionBox.end.y - this.selectionBox.start.y)
    };

    // Use HitTestSystem to find objects in selection bounds
    // This would integrate with the actual hit testing system
    const selectedIds = this.getObjectsInBounds(bounds);
    this.toolSystem?.updateSelection(selectedIds);
  }

  private selectAtPoint(point: Point, multiSelect: boolean): void {
    // Use HitTestSystem to find object at point
    // This would integrate with the actual hit testing system
    const hitResult = this.hitTestAtPoint(point);
    
    if (hitResult) {
      if (multiSelect) {
        // Toggle selection
        this.toggleSelection(hitResult.id);
      } else {
        // Single selection
        this.toolSystem?.updateSelection([hitResult.id]);
      }
    } else if (!multiSelect) {
      // Clear selection if clicking on empty space
      this.clearSelection();
    }
  }

  private selectAll(): void {
    // Select all selectable objects
    const allIds = this.getAllSelectableIds();
    this.toolSystem?.updateSelection(allIds);
  }

  private deleteSelected(): void {
    // Delete selected objects
    // This would integrate with the diagram management system
  }

  private clearSelection(): void {
    this.toolSystem?.updateSelection([]);
  }

  private toggleSelection(objectId: string): void {
    // Toggle object selection state
    // This would integrate with the selection system
  }

  private getObjectsInBounds(bounds: { x: number; y: number; width: number; height: number }): string[] {
    // This would integrate with the HitTestSystem
    return [];
  }

  private hitTestAtPoint(point: Point): { id: string } | null {
    // This would integrate with the HitTestSystem
    return null;
  }

  private getAllSelectableIds(): string[] {
    // This would integrate with the diagram system
    return [];
  }

  public getPreviewGeometry(): any {
    if (this.selectionBox.active) {
      return {
        type: 'selection-box',
        bounds: {
          x: Math.min(this.selectionBox.start.x, this.selectionBox.end.x),
          y: Math.min(this.selectionBox.start.y, this.selectionBox.end.y),
          width: Math.abs(this.selectionBox.end.x - this.selectionBox.start.x),
          height: Math.abs(this.selectionBox.end.y - this.selectionBox.start.y)
        }
      };
    }
    return null;
  }
}