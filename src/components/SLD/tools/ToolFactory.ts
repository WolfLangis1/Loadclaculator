/**
 * Tool Factory - Creates and registers all drawing tools
 */

import { DrawingToolSystem } from './DrawingToolSystem';
import { SelectionTool } from './SelectionTool';
import { PanTool } from './PanTool';
import { ZoomTool } from './ZoomTool';
import { WireDrawingTool } from './WireDrawingTool';
import { RectangleTool, CircleTool, LineTool, CalloutTool } from './BasicDrawingTools';
import { TextTool } from './TextTool';
import { DimensionTool } from './DimensionTool';
import { MeasureDistanceTool, MeasureAreaTool, MeasureAngleTool } from './MeasurementTools';

export function createDrawingToolSystem(): DrawingToolSystem {
  const toolSystem = new DrawingToolSystem();

  // Selection tools
  const selectionTool = new SelectionTool();
  const panTool = new PanTool();
  const zoomTool = new ZoomTool();

  // Drawing tools
  const wireDrawingTool = new WireDrawingTool();
  const rectangleTool = new RectangleTool();
  const circleTool = new CircleTool();
  const lineTool = new LineTool();

  // Annotation tools
  const textTool = new TextTool();
  const dimensionTool = new DimensionTool();
  const calloutTool = new CalloutTool();

  // Measurement tools
  const measureDistanceTool = new MeasureDistanceTool();
  const measureAreaTool = new MeasureAreaTool();
  const measureAngleTool = new MeasureAngleTool();

  // Register all tools
  const tools = [
    selectionTool,
    panTool,
    zoomTool,
    wireDrawingTool,
    rectangleTool,
    circleTool,
    lineTool,
    textTool,
    dimensionTool,
    calloutTool,
    measureDistanceTool,
    measureAreaTool,
    measureAngleTool
  ];

  tools.forEach(tool => {
    if ('setToolSystem' in tool) {
      (tool as any).setToolSystem(toolSystem);
    }
    toolSystem.registerTool(tool);
  });

  return toolSystem;
}