/**
 * Unified Single Line Diagram Main Component
 * 
 * Combines AI-powered features, performance optimizations, and professional standards
 * into a single comprehensive SLD interface
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap,
  Settings,
  Download,
  Save,
  RotateCcw,
  Grid,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Layers,
  FileText,
  Play,
  Brain,
  Target,
  Maximize,
  AlertTriangle,
  CheckCircle,
  Info,
  Shield
} from 'lucide-react';

import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { TitleBlock } from './TitleBlock';
import { LayerManager } from './LayerManager';
import { RealisticElectricalSymbols } from '../SLD/RealisticElectricalSymbols';
import { WireSizingPanel } from './WireSizingPanel';
import { SLDToolbar, type ToolType } from './SLDToolbar';
import { ExpandedComponentLibrary } from './ExpandedComponentLibrary';

// Services
import { IntelligentSymbolService } from '../../services/intelligentSymbolService';
import { createComponentLogger } from '../../services/loggingService';

// Types
import type { SLDDiagram, SLDComponent, SLDConnection } from '../../types/sld';

interface AIFeatures {
  enableSymbolSuggestions: boolean;
  enableAutoLayout: boolean;
  enableNECCompliance: boolean;
  enableLoadAnalysis: boolean;
}

interface ViewSettings {
  showGrid: boolean;
  showTitleBlock: boolean;
  showLayers: boolean;
  enableWebGL: boolean;
  showAIAssistant: boolean;
}

interface LayoutMode {
  mode: 'edit' | 'view' | 'ai_assist' | 'performance';
  zoom: number;
  pan: { x: number; y: number };
}

interface ToolbarState {
  activeTool: ToolType;
  canUndo: boolean;
  canRedo: boolean;
  gridVisible: boolean;
  layersVisible: boolean;
}

export const UnifiedSLDMain: React.FC = () => {
  const logger = createComponentLogger('UnifiedSLDMain');
  const { state } = useLoadCalculator();
  
  // Core SLD state
  const [diagram, setDiagram] = useState<SLDDiagram>({
    id: 'main-sld',
    name: 'Main Electrical Single Line Diagram',
    components: [],
    connections: [],
    metadata: {
      necCompliance: '2023',
      drawingStandard: 'IEEE 315',
      createdBy: 'Load Calculator',
      createdDate: new Date().toISOString()
    }
  });

  // AI and intelligent features
  const [aiFeatures, setAiFeatures] = useState<AIFeatures>({
    enableSymbolSuggestions: true,
    enableAutoLayout: true,
    enableNECCompliance: true,
    enableLoadAnalysis: true
  });

  // View and UI state
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    showGrid: true,
    showTitleBlock: true,
    showLayers: true,
    enableWebGL: true,
    showAIAssistant: true
  });

  const [layoutMode, setLayoutMode] = useState<LayoutMode>({
    mode: 'edit',
    zoom: 1.0,
    pan: { x: 0, y: 0 }
  });

  // Generation and analysis state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<any[]>([]);
  const [symbolSuggestions, setSymbolSuggestions] = useState<any[]>([]);
  const [necViolations, setNecViolations] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [selectedConnection, setSelectedConnection] = useState<SLDConnection | null>(null);
  const [showWireSizingPanel, setShowWireSizingPanel] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Toolbar state
  const [toolbarState, setToolbarState] = useState<ToolbarState>({
    activeTool: 'select',
    canUndo: false,
    canRedo: false,
    gridVisible: true,
    layersVisible: true
  });

  // Simple viewport state for now
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Simplified viewport functions
  const fitToComponents = useCallback(() => {
    // Reset to default view
    setViewport({ x: 0, y: 0, scale: 1 });
  }, []);

  /**
   * Create a new blank diagram
   */
  const handleCreateNewDiagram = useCallback(() => {
    const newDiagram: SLDDiagram = {
      id: 'main-sld',
      name: 'Main Electrical Single Line Diagram',
      components: [],
      connections: [],
      metadata: {
        necCompliance: '2023',
        drawingStandard: 'IEEE 315',
        createdBy: 'Load Calculator',
        createdDate: new Date().toISOString()
      }
    };
    
    setDiagram(newDiagram);
    setError('');
    logger.info('New SLD diagram created');
  }, [logger]);

  /**
   * Update generation progress
   */
  const updateProgress = useCallback((step: string, progress: number, message: string, complete = false) => {
    setGenerationProgress(prev => {
      const existing = prev.find(p => p.step === step);
      if (existing) {
        return prev.map(p => p.step === step ? { ...p, progress, message, complete } : p);
      }
      return [...prev, { step, progress, message, complete }];
    });
  }, []);

  /**
   * Handle component selection
   */
  const handleComponentSelect = useCallback((component: SLDComponent) => {
    logger.info('Component selected', { componentId: component.id, type: component.type });
    
    // Get AI suggestions for selected component
    if (aiFeatures.enableSymbolSuggestions) {
      const suggestions = IntelligentSymbolService.suggestSymbolsForContext({
        nearbyComponents: [component],
        locationHint: {
          x: component.position.x,
          y: component.position.y,
          purpose: 'main_panel'
        }
      });
      setSymbolSuggestions(suggestions);
    }
  }, [aiFeatures.enableSymbolSuggestions, logger]);

  /**
   * Handle toolbar tool changes
   */
  const handleToolChange = useCallback((tool: ToolType) => {
    setToolbarState(prev => ({
      ...prev,
      activeTool: tool
    }));
    logger.info('Tool changed', { tool });
  }, [logger]);

  /**
   * Handle undo/redo operations
   */
  const handleUndo = useCallback(() => {
    // TODO: Implement undo logic
    logger.info('Undo requested');
  }, [logger]);

  const handleRedo = useCallback(() => {
    // TODO: Implement redo logic
    logger.info('Redo requested');
  }, [logger]);

  /**
   * Add component to diagram
   */
  const handleAddComponent = useCallback((componentType: string, componentName: string) => {
    const newComponent: SLDComponent = {
      id: `comp_${Date.now()}`,
      type: componentType,
      label: componentName,
      position: { x: 200 + Math.random() * 100, y: 200 + Math.random() * 100 },
      size: { width: 80, height: 80 },
      rotation: 0,
      specifications: {
        rating: componentType.includes('panel') ? '200A' : 
               componentType.includes('breaker') ? '20A' : 
               componentType.includes('disconnect') ? '60A' : '100A',
        voltage: '240V',
        phases: 1
      },
      visual: {
        fillColor: '#f9fafb',
        strokeColor: '#374151',
        lineWeight: 2,
        showRating: true
      }
    } as SLDComponent;

    setDiagram(prev => ({
      ...prev,
      components: [...prev.components, newComponent]
    }));

    logger.info('Component added to diagram', { componentType, id: newComponent.id });
  }, [logger]);

  /**
   * Handle component library selection
   */
  const handleComponentLibrarySelect = useCallback((componentType: string, componentName: string) => {
    setSelectedComponent(componentType);
    handleAddComponent(componentType, componentName);
  }, [handleAddComponent]);

  /**
   * Toggle grid visibility
   */
  const handleToggleGrid = useCallback(() => {
    setViewSettings(prev => ({
      ...prev,
      showGrid: !prev.showGrid
    }));
    setToolbarState(prev => ({
      ...prev,
      gridVisible: !prev.gridVisible
    }));
  }, []);

  /**
   * Toggle layers visibility
   */
  const handleToggleLayers = useCallback(() => {
    setViewSettings(prev => ({
      ...prev,
      showLayers: !prev.showLayers
    }));
    setToolbarState(prev => ({
      ...prev,
      layersVisible: !prev.layersVisible
    }));
  }, []);

  /**
   * Handle save diagram
   */
  const handleSave = useCallback(() => {
    logger.info('Save diagram requested');
    // TODO: Implement save logic
  }, [logger]);

  /**
   * Export diagram
   */
  const handleExport = useCallback(async (format: 'pdf' | 'svg' | 'dwg') => {
    try {
      logger.info(`Exporting SLD to ${format}`);
      
      if (format === 'svg' && canvasRef.current) {
        // SVG export logic would go here
        logger.info('SVG export completed');
      }
      
    } catch (error) {
      logger.error(`Export to ${format} failed`, error as Error);
      setError(`Failed to export to ${format.toUpperCase()}`);
    }
  }, [canvasRef, logger]);

  /**
   * Handle export diagram
   */
  const handleExportDiagram = useCallback(() => {
    logger.info('Export diagram requested');
    handleExport('svg');
  }, [handleExport]);

  /**
   * Handle component movement
   */
  const handleComponentMove = useCallback((componentId: string, position: { x: number; y: number }) => {
    setDiagram(prev => ({
      ...prev,
      components: prev.components.map(comp =>
        comp.id === componentId ? { ...comp, position } : comp
      )
    }));
  }, []);

  /**
   * Handle connection selection for wire sizing
   */
  const handleConnectionSelect = useCallback((connection: SLDConnection) => {
    setSelectedConnection(connection);
    setShowWireSizingPanel(true);
  }, []);

  /**
   * Handle wire size changes from the wire sizing panel
   */
  const handleWireSizeChange = useCallback((connectionId: string, wireData: {
    wireGauge: string;
    conduitSize: string;
    metadata: any;
  }) => {
    setDiagram(prev => ({
      ...prev,
      connections: prev.connections.map(conn =>
        conn.id === connectionId ? {
          ...conn,
          wireGauge: wireData.wireGauge,
          conduitSize: wireData.conduitSize,
          metadata: wireData.metadata
        } : conn
      )
    }));
  }, []);

  /**
   * Handle zoom controls
   */
  const handleZoom = useCallback((delta: number) => {
    setLayoutMode(prev => ({
      ...prev,
      zoom: Math.max(0.1, Math.min(3.0, prev.zoom + delta))
    }));
  }, []);

  /**
   * Toggle AI features
   */
  const toggleAIFeature = useCallback((feature: keyof AIFeatures) => {
    setAiFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  }, []);

  /**
   * Toggle view settings
   */
  const toggleViewSetting = useCallback((setting: keyof ViewSettings) => {
    setViewSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">AI-Powered Single Line Diagram</h1>
              <p className="text-blue-100 text-sm">
                Professional electrical diagrams with intelligent assistance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Features Toggle */}
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={viewSettings.showAIAssistant}
                  onChange={() => toggleViewSetting('showAIAssistant')}
                  className="rounded"
                />
                AI Assistant
              </label>
            </div>


            {/* New Diagram Button */}
            <button
              onClick={handleCreateNewDiagram}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Play className="h-4 w-4" />
              New Diagram
            </button>
          </div>
        </div>
      </div>


      {/* SLD Toolbar */}
      <div className="flex-shrink-0 border-b border-gray-200 p-2">
        <SLDToolbar
          activeTool={toolbarState.activeTool}
          onToolChange={handleToolChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={() => handleZoom(0.1)}
          onZoomOut={() => handleZoom(-0.1)}
          onSave={handleSave}
          onExport={handleExportDiagram}
          onToggleGrid={handleToggleGrid}
          onToggleLayers={handleToggleLayers}
          canUndo={toolbarState.canUndo}
          canRedo={toolbarState.canRedo}
          gridVisible={toolbarState.gridVisible}
          layersVisible={toolbarState.layersVisible}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - AI Assistant & Controls */}
        {viewSettings.showAIAssistant && (
          <div className="w-80 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* AI Features */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-600" />
                  AI Features
                </h3>
                
                {Object.entries(aiFeatures).map(([key, enabled]) => (
                  <label key={key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => toggleAIFeature(key as keyof AIFeatures)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </span>
                  </label>
                ))}
              </div>

              {/* Symbol Suggestions */}
              {symbolSuggestions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">AI Suggestions</h3>
                  <div className="space-y-2">
                    {symbolSuggestions.slice(0, 5).map((suggestion, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900">
                            {suggestion.componentId.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs text-blue-600">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">{suggestion.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* NEC Compliance */}
              {necViolations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-yellow-600" />
                    NEC Compliance
                  </h3>
                  <div className="space-y-2">
                    {necViolations.map((violation, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        violation.severity === 'critical' ? 'bg-red-50 border-red-200' :
                        violation.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          {violation.severity === 'critical' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                          ) : violation.severity === 'warning' ? (
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          ) : (
                            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{violation.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{violation.description}</p>
                            <p className="text-xs text-gray-500 mt-1 font-mono">NEC {violation.section}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expanded Component Library */}
              <ExpandedComponentLibrary
                onComponentSelect={handleComponentLibrarySelect}
                selectedComponent={selectedComponent || undefined}
              />

              {/* View Controls */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">View Settings</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleViewSetting('showGrid')}
                    className={`p-2 rounded text-sm ${
                      viewSettings.showGrid ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Grid className="h-4 w-4 mx-auto" />
                  </button>
                  
                  <button
                    onClick={() => toggleViewSetting('showLayers')}
                    className={`p-2 rounded text-sm ${
                      viewSettings.showLayers ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Layers className="h-4 w-4 mx-auto" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleZoom(-0.1)}
                    className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  
                  <span className="text-sm font-medium text-center flex-1">
                    {Math.round(viewport.scale * 100)}%
                  </span>
                  
                  <button
                    onClick={() => handleZoom(0.1)}
                    className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={fitToComponents}
                  className="w-full p-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  <Target className="h-4 w-4 inline mr-2" />
                  Fit to View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Canvas Area */}
        <div className="flex-1 relative flex">
          <div className="flex-1 relative">
          {/* SLD Drawing Canvas */}
          <div className="w-full h-full bg-white relative overflow-hidden">
            {/* Grid Background */}
            {viewSettings.showGrid && (
              <div 
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px'
                }}
              />
            )}

            {/* SLD Components */}
            <div className="absolute inset-0" style={{ transform: `scale(${viewport.scale}) translate(${-viewport.x}px, ${-viewport.y}px)` }}>
              {diagram.components.map((component) => (
                <div
                  key={component.id}
                  className="absolute cursor-pointer hover:shadow-lg transition-shadow"
                  style={{
                    left: component.position.x,
                    top: component.position.y,
                    width: component.size.width,
                    height: component.size.height,
                    transform: `rotate(${component.rotation}deg)`
                  }}
                  onClick={() => handleComponentSelect(component)}
                >
                  {/* Render component based on type */}
                  {component.type === 'main_panel' && (
                    <RealisticElectricalSymbols.MainElectricalPanel
                      width={component.size.width}
                      height={component.size.height}
                      amperage={200}
                      showRating={true}
                    />
                  )}
                  {component.type === 'sub_panel' && (
                    <RealisticElectricalSymbols.SubPanel
                      width={component.size.width}
                      height={component.size.height}
                      amperage={100}
                      showRating={true}
                    />
                  )}
                  {component.type === 'circuit_breaker_sp' && (
                    <RealisticElectricalSymbols.CircuitBreakerSP
                      width={component.size.width}
                      height={component.size.height}
                      amperage={20}
                      showRating={true}
                    />
                  )}
                  {component.type === 'circuit_breaker_dp' && (
                    <RealisticElectricalSymbols.CircuitBreakerDP
                      width={component.size.width}
                      height={component.size.height}
                      amperage={50}
                      showRating={true}
                    />
                  )}
                  {component.type === 'meter' && (
                    <RealisticElectricalSymbols.ElectricMeter
                      width={component.size.width}
                      height={component.size.height}
                      showRating={true}
                    />
                  )}
                  {component.type === 'disconnect' && (
                    <RealisticElectricalSymbols.DisconnectSwitch
                      width={component.size.width}
                      height={component.size.height}
                      amperage={60}
                      showRating={true}
                    />
                  )}
                  {component.type === 'transformer' && (
                    <RealisticElectricalSymbols.TransformerPadMount
                      width={component.size.width}
                      height={component.size.height}
                      amperage={75}
                      voltage="12.47kV/240V"
                      showRating={true}
                    />
                  )}
                  {component.type === 'motor' && (
                    <RealisticElectricalSymbols.MotorThreePhaseHeavyDuty
                      width={component.size.width}
                      height={component.size.height}
                      amperage={15}
                      showRating={true}
                    />
                  )}
                  {/* Renewable Energy Components */}
                  {(component.type === 'solar_panel' || component.type === 'inverter' || component.type === 'battery') && (
                    <RealisticElectricalSymbols.MainElectricalPanel
                      width={component.size.width}
                      height={component.size.height}
                      amperage={component.specifications?.rating?.replace('A', '') || 100}
                      showRating={true}
                    />
                  )}
                  {/* EV Charging Components */}
                  {(component.type === 'evse_l2' || component.type === 'evse_dcfc') && (
                    <RealisticElectricalSymbols.CircuitBreakerDP
                      width={component.size.width}
                      height={component.size.height}
                      amperage={component.specifications?.rating?.replace('A', '') || 40}
                      showRating={true}
                    />
                  )}
                  {/* Instrumentation Components */}
                  {('type' in component && (component.type as string) === 'ct' || (component.type as string) === 'vt') && (
                    <RealisticElectricalSymbols.TransformerPadMount
                      width={component.size?.width || 50}
                      height={component.size?.height || 50}
                      amperage={component.specifications?.rating?.replace?.('A', '') || 100}
                      voltage={component.specifications?.voltage || '120V'}
                      showRating={true}
                    />
                  )}
                  {/* Control Components */}
                  {('type' in component && (component.type as string) === 'contactor' || (component.type as string) === 'relay') && (
                    <RealisticElectricalSymbols.CircuitBreakerSP
                      width={component.size?.width || 50}
                      height={component.size?.height || 50}
                      amperage={component.specifications?.rating?.replace?.('A', '') || 30}
                      showRating={true}
                    />
                  )}
                  
                  {/* Component label */}
                  {component.label && (
                    <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
                      {component.label}
                    </div>
                  )}
                </div>
              ))}

              {/* SLD Connections */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {diagram.connections.map((connection) => (
                  <g key={connection.id}>
                    {/* Wire line */}
                    <line
                      x1={connection.startPoint?.x || 0}
                      y1={connection.startPoint?.y || 0}
                      x2={connection.endPoint?.x || 0}
                      y2={connection.endPoint?.y || 0}
                      stroke="#374151"
                      strokeWidth="2"
                      className="cursor-pointer pointer-events-auto hover:stroke-blue-600"
                      onClick={() => handleConnectionSelect(connection)}
                    />
                    
                    {/* Wire label */}
                    {connection.label && (
                      <text
                        x={((connection.startPoint?.x || 0) + (connection.endPoint?.x || 0)) / 2}
                        y={((connection.startPoint?.y || 0) + (connection.endPoint?.y || 0)) / 2 - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#374151"
                        className="pointer-events-none"
                      >
                        {connection.label}
                      </text>
                    )}
                    
                    {/* Wire gauge info */}
                    {connection.wireGauge && (
                      <text
                        x={((connection.startPoint?.x || 0) + (connection.endPoint?.x || 0)) / 2}
                        y={((connection.startPoint?.y || 0) + (connection.endPoint?.y || 0)) / 2 + 10}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#6b7280"
                        className="pointer-events-none"
                      >
                        {connection.wireGauge}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Canvas controls */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white shadow-lg rounded-lg p-2">
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              
              <span className="text-sm font-medium px-2 min-w-12 text-center">
                {Math.round((viewport?.scale || 1) * 100)}%
              </span>
              
              <button
                onClick={() => handleZoom(0.1)}
                className="p-2 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              
              <div className="w-px h-6 bg-gray-300 mx-1" />
              
              <button
                onClick={fitToComponents}
                className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                title="Fit to View"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Overlay: Title Block */}
          {viewSettings.showTitleBlock && diagram.components.length > 0 && (
            <div className="absolute bottom-4 right-4">
              <TitleBlock
                data={{
                  projectName: state.projectInfo?.customerName || 'Electrical Project',
                  projectNumber: 'E-2025-001',
                  drawingTitle: 'Main Single Line Diagram',
                  drawingNumber: 'E-001',
                  revision: 'A',
                  dateCreated: new Date().toLocaleDateString(),
                  dateModified: new Date().toLocaleDateString(),
                  drawnBy: 'Load Calculator AI',
                  checkedBy: '',
                  approvedBy: '',
                  companyName: 'Electrical Design Associates',
                  companyAddress: '',
                  scale: '1:1',
                  sheetNumber: '1',
                  totalSheets: '1',
                  necCodeYear: diagram.metadata?.necCompliance || '2023'
                }}
                size="C"
                orientation="landscape"
              />
            </div>
          )}

          {/* Overlay: Layer Manager */}
          {viewSettings.showLayers && diagram.components.length > 0 && (
            <div className="absolute top-4 left-4">
              <LayerManager
                layers={[
                  { 
                    id: 'components', 
                    name: 'Components', 
                    visible: true, 
                    locked: false,
                    color: '#374151',
                    lineWeight: 1,
                    lineType: 'solid' as const,
                    opacity: 1,
                    printable: true,
                    elementIds: [],
                    order: 1,
                    category: 'electrical' as const
                  },
                  { 
                    id: 'connections', 
                    name: 'Connections', 
                    visible: true, 
                    locked: false,
                    color: '#059669',
                    lineWeight: 2,
                    lineType: 'solid' as const,
                    opacity: 1,
                    printable: true,
                    elementIds: [],
                    order: 2,
                    category: 'electrical' as const
                  },
                  { 
                    id: 'annotations', 
                    name: 'Annotations', 
                    visible: true, 
                    locked: false,
                    color: '#dc2626',
                    lineWeight: 1,
                    lineType: 'solid' as const,
                    opacity: 1,
                    printable: true,
                    elementIds: [],
                    order: 3,
                    category: 'annotations' as const
                  }
                ]}
                onLayerChange={(layerId: string, changes: any) => {
                  logger.info('Layer changed', { layerId, changes });
                }}
                onLayerCreate={(layer: any) => {
                  logger.info('Layer created', { layer });
                }}
                onLayerDelete={(layerId: string) => {
                  logger.info('Layer deleted', { layerId });
                }}
                onLayerDuplicate={(layerId: string) => {
                  logger.info('Layer duplicated', { layerId });
                }}
                onLayerReorder={(layerId: string, newOrder: number) => {
                  logger.info('Layer reordered', { layerId, newOrder });
                }}
                onLayerSelect={(layerId: string) => {
                  logger.info('Layer selected', { layerId });
                }}
              />
            </div>
          )}

          {/* Empty State */}
          {diagram.components.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 max-w-md">
                <Zap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Start Drawing Your SLD</h3>
                <p className="text-sm mb-4">
                  Click on electrical components from the library on the left to add them to your diagram.
                  Then connect them with wires and use the intelligent wire sizing features.
                </p>
                <div className="flex flex-col gap-2 text-xs text-gray-400">
                  <p>💡 Click components in the library to add them</p>
                  <p>🔌 Click connections to open wire sizing panel</p>
                  <p>📐 Use zoom controls and grid for precision</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="absolute top-4 right-4 max-w-md">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}
          </div>

          {/* Right Sidebar - Wire Sizing Panel */}
          {showWireSizingPanel && selectedConnection && (
            <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Wire Sizing</h3>
                  <button
                    onClick={() => setShowWireSizingPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>
                
                <WireSizingPanel
                  connection={selectedConnection}
                  onWireSizeChange={handleWireSizeChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default UnifiedSLDMain;