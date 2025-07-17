/**
 * Pan Tool - Smooth viewport panning
 */

import { BaseTool, Point } from './DrawingToolSystem';

export class PanTool extends BaseTool {
  public id = 'pan';
  public name = 'Pan';
  public icon = '✋';
  public cursor = 'grab';
  public category = 'selection' as const;
  public shortcut = 'h';

  private panOffset: Point = { x: 0, y: 0 };
  private initialViewport: Point = { x: 0, y: 0 };

  protected onActivate(): void {
    // Change cursor to indicate pan mode
    document.body.style.cursor = 'grab';
  }

  protected onDeactivate(): void {
    document.body.style.cursor = '';
  }

  public onMouseDown(point: Point, event: MouseEvent): void {
    this.state.startPoint = point;
    this.state.isDragging = true;
    this.cursor = 'grabbing';
    document.body.style.cursor = 'grabbing';

    // Store initial viewport position
    this.initialViewport = this.getCurrentViewport();
    this.panOffset = { x: 0, y: 0 };
  }

  public onMouseMove(point: Point, event: MouseEvent): void {
    this.state.currentPoint = point;

    if (this.state.isDragging && this.state.startPoint) {
      // Calculate pan offset
      this.panOffset = {
        x: point.x - this.state.startPoint.x,
        y: point.y - this.state.startPoint.y
      };

      // Apply pan to viewport
      this.applyPan(this.panOffset);
    }
  }

  public onMouseUp(point: Point, event: MouseEvent): void {
    this.state.isDragging = false;
    this.state.startPoint = null;
    this.state.currentPoint = null;
    this.cursor = 'grab';
    document.body.style.cursor = 'grab';

    // Finalize pan operation
    if (this.panOffset.x !== 0 || this.panOffset.y !== 0) {
      this.finalizePan();
    }
  }

  public onKeyDown(event: KeyboardEvent): void {
    // Arrow keys for precise panning
    const panStep = event.shiftKey ? 50 : 10;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.panByOffset({ x: panStep, y: 0 });
        break;
      
      case 'ArrowRight':
        event.preventDefault();
        this.panByOffset({ x: -panStep, y: 0 });
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        this.panByOffset({ x: 0, y: panStep });
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        this.panByOffset({ x: 0, y: -panStep });
        break;
    }
  }

  private getCurrentViewport(): Point {
    // This would integrate with the ViewportManager
    // For now, return a placeholder
    return { x: 0, y: 0 };
  }

  private applyPan(offset: Point): void {
    // This would integrate with the ViewportManager to update the viewport
    // The offset needs to be converted to world coordinates based on zoom level
    const worldOffset = this.screenToWorldOffset(offset);
    
    // Update viewport position
    this.updateViewport({
      x: this.initialViewport.x - worldOffset.x,
      y: this.initialViewport.y - worldOffset.y
    });
  }

  private panByOffset(offset: Point): void {
    const currentViewport = this.getCurrentViewport();
    const worldOffset = this.screenToWorldOffset(offset);
    
    this.updateViewport({
      x: currentViewport.x + worldOffset.x,
      y: currentViewport.y + worldOffset.y
    });
  }

  private finalizePan(): void {
    // Finalize the pan operation
    // This could trigger viewport constraint checking or smooth animation completion
  }

  private screenToWorldOffset(screenOffset: Point): Point {
    // Convert screen space offset to world space offset
    // This would use the current zoom level from ViewportManager
    const zoom = this.getCurrentZoom();
    return {
      x: screenOffset.x / zoom,
      y: screenOffset.y / zoom
    };
  }

  private getCurrentZoom(): number {
    // This would integrate with the ViewportManager
    return 1.0;
  }

  private updateViewport(position: Point): void {
    // This would integrate with the ViewportManager
    // For now, this is a placeholder
  }
}