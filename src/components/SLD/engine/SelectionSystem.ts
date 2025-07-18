/**
 * Advanced Selection System for Professional SLD Canvas
 * 
 * Multi-select, selection handles, and group operations
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

export interface SelectionHandle {
  id: string;
  type: 'resize' | 'rotate' | 'move';
  position: Point;
  cursor: string;
  size: number;
  visible: boolean;
}

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  handles: SelectionHandle[];
}

export interface SelectedObject {
  id: string;
  type: string;
  bounds: Rectangle;
  rotation: number;
  locked: boolean;
  data: any;
}

export interface SelectionState {
  selectedIds: Set<string>;
  objects: Map<string, SelectedObject>;
  bounds: SelectionBounds | null;
  isMultiSelect: boolean;
  isDragging: boolean;
  dragStartPoint: Point | null;
  dragOffset: Point | null;
  activeHandle: SelectionHandle | null;
}

export interface GroupOperation {
  type: 'align' | 'distribute' | 'resize' | 'rotate' | 'move';
  data: any;
}

export class SelectionSystem {
  private state: SelectionState;
  private handleSize: number = 8;
  private handleHitTolerance: number = 4;
  
  // Event callbacks
  private onSelectionChange?: (selectedIds: string[], objects: SelectedObject[]) => void;
  private onBoundsChange?: (bounds: SelectionBounds | null) => void;
  private onObjectUpdate?: (id: string, updates: any) => void;

  constructor() {
    this.state = {
      selectedIds: new Set(),
      objects: new Map(),
      bounds: null,
      isMultiSelect: false,
      isDragging: false,
      dragStartPoint: null,
      dragOffset: null,
      activeHandle: null
    };
  }

  public setSelectionChangeCallback(callback: (selectedIds: string[], objects: SelectedObject[]) => void): void {
    this.onSelectionChange = callback;
  }

  public setBoundsChangeCallback(callback: (bounds: SelectionBounds | null) => void): void {
    this.onBoundsChange = callback;
  }

  public setObjectUpdateCallback(callback: (id: string, updates: any) => void): void {
    this.onObjectUpdate = callback;
  }

  public select(objectId: string, object: SelectedObject, multiSelect: boolean = false): void {
    if (!multiSelect) {
      this.clearSelection();
    }

    this.state.selectedIds.add(objectId);
    this.state.objects.set(objectId, object);
    this.state.isMultiSelect = this.state.selectedIds.size > 1;
    
    this.updateSelectionBounds();
    this.notifySelectionChange();
  }

  public selectMultiple(selections: Array<{ id: string; object: SelectedObject }>): void {
    this.clearSelection();
    
    selections.forEach(({ id, object }) => {
      this.state.selectedIds.add(id);
      this.state.objects.set(id, object);
    });
    
    this.state.isMultiSelect = this.state.selectedIds.size > 1;
    this.updateSelectionBounds();
    this.notifySelectionChange();
  }

  public deselect(objectId: string): void {
    this.state.selectedIds.delete(objectId);
    this.state.objects.delete(objectId);
    this.state.isMultiSelect = this.state.selectedIds.size > 1;
    
    this.updateSelectionBounds();
    this.notifySelectionChange();
  }

  public clearSelection(): void {
    this.state.selectedIds.clear();
    this.state.objects.clear();
    this.state.bounds = null;
    this.state.isMultiSelect = false;
    
    this.notifySelectionChange();
    this.notifyBoundsChange();
  }

  public isSelected(objectId: string): boolean {
    return this.state.selectedIds.has(objectId);
  }

  public getSelectedIds(): string[] {
    return Array.from(this.state.selectedIds);
  }

  public getSelectedObjects(): SelectedObject[] {
    return Array.from(this.state.objects.values());
  }

  public getSelectionBounds(): SelectionBounds | null {
    return this.state.bounds;
  }

  public hasSelection(): boolean {
    return this.state.selectedIds.size > 0;
  }

  public isMultiSelect(): boolean {
    return this.state.isMultiSelect;
  }

  private updateSelectionBounds(): void {
    if (this.state.selectedIds.size === 0) {
      this.state.bounds = null;
      this.notifyBoundsChange();
      return;
    }

    const objects = Array.from(this.state.objects.values());
    
    // Calculate combined bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    objects.forEach(obj => {
      minX = Math.min(minX, obj.bounds.x);
      minY = Math.min(minY, obj.bounds.y);
      maxX = Math.max(maxX, obj.bounds.x + obj.bounds.width);
      maxY = Math.max(maxY, obj.bounds.y + obj.bounds.height);
    });

    const bounds: SelectionBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      rotation: 0, // TODO: Handle rotation for multi-select
      handles: this.createSelectionHandles(minX, minY, maxX - minX, maxY - minY)
    };

    this.state.bounds = bounds;
    this.notifyBoundsChange();
  }

  private createSelectionHandles(x: number, y: number, width: number, height: number): SelectionHandle[] {
    const handles: SelectionHandle[] = [];
    const halfSize = this.handleSize / 2;

    // Corner resize handles
    handles.push(
      {
        id: 'nw',
        type: 'resize',
        position: { x: x - halfSize, y: y - halfSize },
        cursor: 'nw-resize',
        size: this.handleSize,
        visible: true
      },
      {
        id: 'ne',
        type: 'resize',
        position: { x: x + width - halfSize, y: y - halfSize },
        cursor: 'ne-resize',
        size: this.handleSize,
        visible: true
      },
      {
        id: 'sw',
        type: 'resize',
        position: { x: x - halfSize, y: y + height - halfSize },
        cursor: 'sw-resize',
        size: this.handleSize,
        visible: true
      },
      {
        id: 'se',
        type: 'resize',
        position: { x: x + width - halfSize, y: y + height - halfSize },
        cursor: 'se-resize',
        size: this.handleSize,
        visible: true
      }
    );

    // Edge resize handles (for single selection)
    if (this.state.selectedIds.size === 1) {
      handles.push(
        {
          id: 'n',
          type: 'resize',
          position: { x: x + width / 2 - halfSize, y: y - halfSize },
          cursor: 'n-resize',
          size: this.handleSize,
          visible: true
        },
        {
          id: 's',
          type: 'resize',
          position: { x: x + width / 2 - halfSize, y: y + height - halfSize },
          cursor: 's-resize',
          size: this.handleSize,
          visible: true
        },
        {
          id: 'w',
          type: 'resize',
          position: { x: x - halfSize, y: y + height / 2 - halfSize },
          cursor: 'w-resize',
          size: this.handleSize,
          visible: true
        },
        {
          id: 'e',
          type: 'resize',
          position: { x: x + width - halfSize, y: y + height / 2 - halfSize },
          cursor: 'e-resize',
          size: this.handleSize,
          visible: true
        }
      );

      // Rotation handle
      handles.push({
        id: 'rotate',
        type: 'rotate',
        position: { x: x + width / 2 - halfSize, y: y - 20 - halfSize },
        cursor: 'grab',
        size: this.handleSize,
        visible: true
      });
    }

    return handles;
  }

  public hitTestHandle(point: Point): SelectionHandle | null {
    if (!this.state.bounds) return null;

    for (const handle of this.state.bounds.handles) {
      if (!handle.visible) continue;

      const distance = Math.sqrt(
        Math.pow(point.x - (handle.position.x + handle.size / 2), 2) +
        Math.pow(point.y - (handle.position.y + handle.size / 2), 2)
      );

      if (distance <= handle.size / 2 + this.handleHitTolerance) {
        return handle;
      }
    }

    return null;
  }

  public startDrag(point: Point, handle?: SelectionHandle): void {
    this.state.isDragging = true;
    this.state.dragStartPoint = point;
    this.state.activeHandle = handle || null;

    if (!handle && this.state.bounds) {
      // Calculate drag offset for move operation
      this.state.dragOffset = {
        x: point.x - this.state.bounds.x,
        y: point.y - this.state.bounds.y
      };
    }
  }

  public updateDrag(point: Point): void {
    if (!this.state.isDragging || !this.state.dragStartPoint) return;

    const deltaX = point.x - this.state.dragStartPoint.x;
    const deltaY = point.y - this.state.dragStartPoint.y;

    if (this.state.activeHandle) {
      this.handleResize(this.state.activeHandle, deltaX, deltaY);
    } else {
      this.handleMove(deltaX, deltaY);
    }
  }

  public endDrag(): void {
    this.state.isDragging = false;
    this.state.dragStartPoint = null;
    this.state.dragOffset = null;
    this.state.activeHandle = null;
  }

  private handleMove(deltaX: number, deltaY: number): void {
    const objects = Array.from(this.state.objects.entries());
    
    objects.forEach(([id, obj]) => {
      if (obj.locked) return;

      const newBounds = {
        ...obj.bounds,
        x: obj.bounds.x + deltaX,
        y: obj.bounds.y + deltaY
      };

      const updatedObject = { ...obj, bounds: newBounds };
      this.state.objects.set(id, updatedObject);
      
      this.onObjectUpdate?.(id, { position: { x: newBounds.x, y: newBounds.y } });
    });

    this.updateSelectionBounds();
  }

  private handleResize(handle: SelectionHandle, deltaX: number, deltaY: number): void {
    if (!this.state.bounds) return;

    const bounds = this.state.bounds;
    let newBounds = { ...bounds };

    switch (handle.id) {
      case 'nw':
        newBounds.x += deltaX;
        newBounds.y += deltaY;
        newBounds.width -= deltaX;
        newBounds.height -= deltaY;
        break;
      case 'ne':
        newBounds.y += deltaY;
        newBounds.width += deltaX;
        newBounds.height -= deltaY;
        break;
      case 'sw':
        newBounds.x += deltaX;
        newBounds.width -= deltaX;
        newBounds.height += deltaY;
        break;
      case 'se':
        newBounds.width += deltaX;
        newBounds.height += deltaY;
        break;
      case 'n':
        newBounds.y += deltaY;
        newBounds.height -= deltaY;
        break;
      case 's':
        newBounds.height += deltaY;
        break;
      case 'w':
        newBounds.x += deltaX;
        newBounds.width -= deltaX;
        break;
      case 'e':
        newBounds.width += deltaX;
        break;
    }

    // Ensure minimum size
    newBounds.width = Math.max(10, newBounds.width);
    newBounds.height = Math.max(10, newBounds.height);

    this.applyResizeToObjects(bounds, newBounds);
  }

  private applyResizeToObjects(oldBounds: SelectionBounds, newBounds: SelectionBounds): void {
    const scaleX = newBounds.width / oldBounds.width;
    const scaleY = newBounds.height / oldBounds.height;
    const offsetX = newBounds.x - oldBounds.x;
    const offsetY = newBounds.y - oldBounds.y;

    const objects = Array.from(this.state.objects.entries());
    
    objects.forEach(([id, obj]) => {
      if (obj.locked) return;

      // Calculate relative position within old bounds
      const relativeX = (obj.bounds.x - oldBounds.x) / oldBounds.width;
      const relativeY = (obj.bounds.y - oldBounds.y) / oldBounds.height;
      const relativeWidth = obj.bounds.width / oldBounds.width;
      const relativeHeight = obj.bounds.height / oldBounds.height;

      // Apply scaling and offset
      const newObjBounds = {
        x: newBounds.x + relativeX * newBounds.width,
        y: newBounds.y + relativeY * newBounds.height,
        width: relativeWidth * newBounds.width,
        height: relativeHeight * newBounds.height
      };

      const updatedObject = { ...obj, bounds: newObjBounds };
      this.state.objects.set(id, updatedObject);
      
      this.onObjectUpdate?.(id, {
        position: { x: newObjBounds.x, y: newObjBounds.y },
        size: { width: newObjBounds.width, height: newObjBounds.height }
      });
    });

    this.updateSelectionBounds();
  }

  // Group operations
  public alignObjects(alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom'): void {
    if (this.state.selectedIds.size < 2) return;

    const objects = Array.from(this.state.objects.entries());
    const bounds = this.state.bounds;
    if (!bounds) return;

    objects.forEach(([id, obj]) => {
      if (obj.locked) return;

      let newX = obj.bounds.x;
      let newY = obj.bounds.y;

      switch (alignment) {
        case 'left':
          newX = bounds.x;
          break;
        case 'center':
          newX = bounds.x + bounds.width / 2 - obj.bounds.width / 2;
          break;
        case 'right':
          newX = bounds.x + bounds.width - obj.bounds.width;
          break;
        case 'top':
          newY = bounds.y;
          break;
        case 'middle':
          newY = bounds.y + bounds.height / 2 - obj.bounds.height / 2;
          break;
        case 'bottom':
          newY = bounds.y + bounds.height - obj.bounds.height;
          break;
      }

      const newBounds = { ...obj.bounds, x: newX, y: newY };
      const updatedObject = { ...obj, bounds: newBounds };
      this.state.objects.set(id, updatedObject);
      
      this.onObjectUpdate?.(id, { position: { x: newX, y: newY } });
    });

    this.updateSelectionBounds();
  }

  public distributeObjects(direction: 'horizontal' | 'vertical'): void {
    if (this.state.selectedIds.size < 3) return;

    const objects = Array.from(this.state.objects.values())
      .filter(obj => !obj.locked)
      .sort((a, b) => {
        return direction === 'horizontal' ? a.bounds.x - b.bounds.x : a.bounds.y - b.bounds.y;
      });

    if (objects.length < 3) return;

    const first = objects[0];
    const last = objects[objects.length - 1];
    
    const totalSpace = direction === 'horizontal' 
      ? (last.bounds.x + last.bounds.width) - first.bounds.x
      : (last.bounds.y + last.bounds.height) - first.bounds.y;
    
    const totalObjectSize = objects.reduce((sum, obj) => {
      return sum + (direction === 'horizontal' ? obj.bounds.width : obj.bounds.height);
    }, 0);
    
    const spacing = (totalSpace - totalObjectSize) / (objects.length - 1);
    
    let currentPos = direction === 'horizontal' ? first.bounds.x : first.bounds.y;
    
    objects.forEach((obj, index) => {
      if (index === 0 || index === objects.length - 1) {
        currentPos += direction === 'horizontal' ? obj.bounds.width : obj.bounds.height;
        return; // Don't move first and last objects
      }

      const newBounds = { ...obj.bounds };
      if (direction === 'horizontal') {
        newBounds.x = currentPos + spacing;
        currentPos = newBounds.x + newBounds.width;
      } else {
        newBounds.y = currentPos + spacing;
        currentPos = newBounds.y + newBounds.height;
      }

      const updatedObject = { ...obj, bounds: newBounds };
      this.state.objects.set(obj.id, updatedObject);
      
      this.onObjectUpdate?.(obj.id, { 
        position: { x: newBounds.x, y: newBounds.y } 
      });
    });

    this.updateSelectionBounds();
  }

  public rotateSelection(angle: number): void {
    if (!this.state.bounds) return;

    const centerX = this.state.bounds.x + this.state.bounds.width / 2;
    const centerY = this.state.bounds.y + this.state.bounds.height / 2;

    const objects = Array.from(this.state.objects.entries());
    
    objects.forEach(([id, obj]) => {
      if (obj.locked) return;

      const objCenterX = obj.bounds.x + obj.bounds.width / 2;
      const objCenterY = obj.bounds.y + obj.bounds.height / 2;

      // Rotate position around selection center
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      
      const dx = objCenterX - centerX;
      const dy = objCenterY - centerY;
      
      const newCenterX = centerX + dx * cos - dy * sin;
      const newCenterY = centerY + dx * sin + dy * cos;
      
      const newBounds = {
        ...obj.bounds,
        x: newCenterX - obj.bounds.width / 2,
        y: newCenterY - obj.bounds.height / 2
      };

      const updatedObject = { 
        ...obj, 
        bounds: newBounds,
        rotation: obj.rotation + angle
      };
      
      this.state.objects.set(id, updatedObject);
      
      this.onObjectUpdate?.(id, {
        position: { x: newBounds.x, y: newBounds.y },
        rotation: updatedObject.rotation
      });
    });

    this.updateSelectionBounds();
  }

  private notifySelectionChange(): void {
    const selectedIds = Array.from(this.state.selectedIds);
    const objects = Array.from(this.state.objects.values());
    this.onSelectionChange?.(selectedIds, objects);
  }

  private notifyBoundsChange(): void {
    this.onBoundsChange?.(this.state.bounds);
  }

  public dispose(): void {
    this.clearSelection();
  }
}