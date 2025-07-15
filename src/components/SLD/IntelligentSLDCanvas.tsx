/**
 * Intelligent SLD Canvas - Auto-generating Professional Single Line Diagrams
 * 
 * Integrates intelligent auto-generation with professional drawing capabilities
 * Supports load calculator integration, NEC compliance, and professional export
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Zap, 
  RefreshCw, 
  Settings, 
  Download, 
  FileText,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useSLDData } from '../../context/SLDDataContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { EnhancedComponentLibrary } from './EnhancedComponentLibrary';
import { DraggableTitleBlock } from './DraggableTitleBlock';

// Simple interfaces for Vercel compatibility
interface SLDGenerationOptions {
  includeLoadCalculations: boolean;
  includeCircuitNumbers: boolean;
  includeWireSizing: boolean;
  includeNECReferences: boolean;
  diagramStyle: string;
  voltageLevel: number;
  serviceSize: number;
}

type CanvasTool = 'select' | 'pan' | 'zoom';

export const IntelligentSLDCanvas: React.FC = () => {
  const { state: sldState, updateDiagram, addComponent, updateComponent } = useSLDData();
  const { loads } = useLoadData();
  const { settings } = useProjectSettings();
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationOptions, setGenerationOptions] = useState<SLDGenerationOptions>({
    includeLoadCalculations: true,
    includeCircuitNumbers: true,
    includeWireSizing: true,
    includeNECReferences: true,
    diagramStyle: 'residential',
    voltageLevel: 240,
    serviceSize: settings.mainBreaker || 200
  });
  
  // Canvas and interaction state
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);
  const [showGenerationPanel, setShowGenerationPanel] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  
  // Title block state
  const [showTitleBlock, setShowTitleBlock] = useState(true);
  const [titleBlockTemplate, setTitleBlockTemplate] = useState('professional');
  const [titleBlockData, setTitleBlockData] = useState<TitleBlockData>(() => 
    generateTitleBlockFromProject(settings, loads, 'professional')
  );
  const [titleBlockPosition, setTitleBlockPosition] = useState({ x: 50, y: 50 });
  const [titleBlockEditing, setTitleBlockEditing] = useState(false);
  const [isDraggingTitleBlock, setIsDraggingTitleBlock] = useState(false);
  
  // Wire routing state
  const [showWireRouting, setShowWireRouting] = useState(true);
  const [showWireLabels, setShowWireLabels] = useState(true);
  const [showCollisionHighlight, setShowCollisionHighlight] = useState(true);
  const [selectedWire, setSelectedWire] = useState<string | null>(null);
  
  // NEC validation state
  const [necValidator] = useState(() => new RealTimeNECValidator());
  const [validationResult, setValidationResult] = useState<RealTimeValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(true);
  
  // Layer management
  const [layers, setLayers] = useState<DrawingLayer[]>(() => 
    DEFAULT_LAYERS.map((layer, index) => ({
      ...layer,
      id: `layer-${index}`,
      componentIds: []
    }))
  );
  const [activeLayerId, setActiveLayerId] = useState<string>(layers[0]?.id || '');
  
  /**
   * Generate intelligent SLD from current load data
   */
  const handleGenerateIntelligentSLD = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Step 1: Analyze load data (20%)
      setGenerationProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Calculate layout and components (40%)
      setGenerationProgress(40);
      const { diagram, components } = generateIntelligentSLD(
        loads,
        { name: settings.projectName },
        generationOptions
      );
      
      // Step 3: Generate wire sizing and circuits (60%)
      setGenerationProgress(60);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 4: Apply professional styling (80%)
      setGenerationProgress(80);
      
      // Update the SLD with generated diagram
      updateDiagram(diagram);
      
      // Step 5: Finalize and organize layers (100%)
      setGenerationProgress(100);
      setLastGenerated(new Date());
      
      // Step 6: Validate NEC compliance
      if (showValidation) {
        necValidator.validateDiagramRealTime(diagram, loads, setValidationResult);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error('Error generating intelligent SLD:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  }, [loads, settings, generationOptions, updateDiagram]);
  
  /**
   * Handle generation option changes
   */
  const handleOptionChange = useCallback((option: keyof SLDGenerationOptions, value: any) => {
    setGenerationOptions(prev => ({
      ...prev,
      [option]: value
    }));
  }, []);
  
  /**
   * Calculate generation statistics
   */
  const generationStats = React.useMemo(() => {
    const totalLoads = loads.generalLoads.length + loads.hvacLoads.length + 
                      loads.evseLoads.length + loads.solarBatteryLoads.length;
    const activeLoads = loads.generalLoads.filter(l => l.quantity > 0).length +
                       loads.hvacLoads.filter(l => l.quantity > 0).length +
                       loads.evseLoads.filter(l => l.quantity > 0).length +
                       loads.solarBatteryLoads.filter(l => l.kw > 0).length;
    
    return {
      totalLoads,
      activeLoads,
      estimatedComponents: 4 + activeLoads + (activeLoads > 8 ? 2 : 0), // Service + loads + sub-panels
      estimatedConnections: activeLoads + 3 // Load connections + service connections
    };
  }, [loads]);
  
  /**
   * Auto-regenerate when load data changes significantly
   */
  useEffect(() => {
    if (lastGenerated && generationOptions.includeLoadCalculations) {
      const timeSinceGeneration = Date.now() - lastGenerated.getTime();
      if (timeSinceGeneration > 30000) { // 30 seconds cooldown
        // Auto-regenerate if load data changed
        // This could be enhanced with change detection
      }
    }
  }, [loads, lastGenerated, generationOptions.includeLoadCalculations]);

  /**
   * Handle title block data changes
   */
  const handleTitleBlockDataChange = useCallback((field: keyof TitleBlockData, value: string) => {
    setTitleBlockData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  /**
   * Handle title block position changes
   */
  const handleTitleBlockPositionChange = useCallback((position: { x: number; y: number }) => {
    setTitleBlockPosition(position);
  }, []);

  /**
   * Get project data for auto-fill
   */
  const projectDataForAutoFill = useMemo(() => ({
    projectName: settings.projectInfo?.projectName || settings.projectName,
    propertyAddress: settings.projectInfo?.propertyAddress,
    client: settings.projectInfo?.clientName,
    engineerName: settings.projectInfo?.engineerName,
    serviceSize: settings.mainBreaker?.toString(),
    voltage: settings.voltage?.toString()
  }), [
    settings.projectInfo?.projectName,
    settings.projectName,
    settings.projectInfo?.propertyAddress,
    settings.projectInfo?.clientName,
    settings.projectInfo?.engineerName,
    settings.mainBreaker,
    settings.voltage
  ]);
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with Generation Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Intelligent SLD Generator
            </h2>
            
            {lastGenerated && (
              <div className="text-sm text-gray-500">
                Last generated: {lastGenerated.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTitleBlock(!showTitleBlock)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                showTitleBlock 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Title Block"
            >
              <FileText className="h-4 w-4" />
              Title Block
            </button>
            
            <button
              onClick={() => setShowWireRouting(!showWireRouting)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                showWireRouting 
                  ? 'bg-green-100 text-green-700 border border-green-300' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle Wire Routing"
            >
              <Zap className="h-4 w-4" />
              Smart Wiring
            </button>
            
            <button
              onClick={() => setShowValidation(!showValidation)}
              className={`px-3 py-2 rounded-md flex items-center gap-2 ${
                showValidation 
                  ? validationResult?.overallCompliance 
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Toggle NEC Validation"
            >
              <CheckCircle className="h-4 w-4" />
              NEC Check
            </button>
            
            <button
              onClick={() => setShowGenerationPanel(!showGenerationPanel)}
              className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-md flex items-center gap-2"
              title="Generation Settings"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            
          </div>
        </div>
        
        {/* Generation Progress */}
        {isGenerating && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Generating intelligent diagram...</span>
              <span>{generationProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Generation Statistics */}
        <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-gray-600">Loads:</span>
            <span className="font-medium">{generationStats.activeLoads}/{generationStats.totalLoads}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-gray-600">Components:</span>
            <span className="font-medium">{generationStats.estimatedComponents}</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            <span className="text-gray-600">Connections:</span>
            <span className="font-medium">{generationStats.estimatedConnections}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-gray-600">Service:</span>
            <span className="font-medium">{generationOptions.serviceSize}A</span>
          </div>
        </div>
      </div>
      
      {/* Generation Options Panel */}
      {showGenerationPanel && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <h3 className="font-medium text-gray-900 mb-3">Generation Options</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagram Style
              </label>
              <select
                value={generationOptions.diagramStyle}
                onChange={(e) => handleOptionChange('diagramStyle', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voltage Level
              </label>
              <select
                value={generationOptions.voltageLevel}
                onChange={(e) => handleOptionChange('voltageLevel', Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value={120}>120V</option>
                <option value={240}>240V</option>
                <option value={480}>480V</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Size
              </label>
              <input
                type="number"
                value={generationOptions.serviceSize}
                onChange={(e) => handleOptionChange('serviceSize', Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="200"
              />
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generationOptions.includeLoadCalculations}
                onChange={(e) => handleOptionChange('includeLoadCalculations', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Load Calculations</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generationOptions.includeCircuitNumbers}
                onChange={(e) => handleOptionChange('includeCircuitNumbers', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Circuit Numbers</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generationOptions.includeWireSizing}
                onChange={(e) => handleOptionChange('includeWireSizing', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Wire Sizing</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generationOptions.includeNECReferences}
                onChange={(e) => handleOptionChange('includeNECReferences', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">NEC References</span>
            </label>
          </div>
        </div>
      )}

      {/* Title Block Configuration Panel */}
      {showTitleBlock && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Professional Title Block
            </h3>
            
            <select
              value={titleBlockTemplate}
              onChange={(e) => {
                setTitleBlockTemplate(e.target.value);
                setTitleBlockData(generateTitleBlockFromProject(settings, loads, e.target.value));
              }}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="professional">Professional</option>
              <option value="standard">Standard</option>
              <option value="engineering">Engineering</option>
              <option value="permit">Permit Submission</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            <p>✨ The title block is now draggable and editable directly on the canvas!</p>
            <p>📝 Click on any field in the title block to edit it inline</p>
            <p>🔄 Data automatically syncs from the Load Calculator project information</p>
          </div>
        </div>
      )}

      {/* Wire Routing Configuration Panel */}
      {showWireRouting && (
        <div className="bg-green-50 border-b border-green-200 p-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-green-600" />
              Smart Wire Routing
            </h3>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWireLabels(!showWireLabels)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  showWireLabels 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Labels
              </button>
              
              <button
                onClick={() => setShowCollisionHighlight(!showCollisionHighlight)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  showCollisionHighlight 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Collision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEC Validation Panel */}
      {showValidation && (
        <div className={`border-b p-3 ${
          validationResult?.overallCompliance 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 flex items-center gap-2 text-sm">
              <CheckCircle className={`h-4 w-4 ${
                validationResult?.overallCompliance ? 'text-green-600' : 'text-red-600'
              }`} />
              NEC Compliance
            </h3>
            
            {validationResult && (
              <div className="flex items-center gap-3 text-xs">
                <span className={`px-2 py-1 rounded font-medium ${
                  validationResult.criticalViolations > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {validationResult.criticalViolations} Critical
                </span>
                <span className={`px-2 py-1 rounded font-medium ${
                  validationResult.warningViolations > 0 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                }`}>
                  {validationResult.warningViolations} Warnings
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="flex flex-1">
        {/* Layer Manager */}
        <LayerManager
          layers={layers}
          onLayerUpdate={(layerId, updates) => 
            setLayers(prev => prev.map(layer => 
              layer.id === layerId ? { ...layer, ...updates } : layer
            ))
          }
          onLayerAdd={(newLayer) => {
            const id = `layer-${Date.now()}`;
            setLayers(prev => [...prev, { ...newLayer, id }]);
          }}
          onLayerDelete={(layerId) => {
            setLayers(prev => prev.filter(layer => layer.id !== layerId));
            if (activeLayerId === layerId) {
              setActiveLayerId(layers[0]?.id || '');
            }
          }}
          onLayerReorder={(fromIndex, toIndex) => {
            setLayers(prev => {
              const newLayers = [...prev];
              const [removed] = newLayers.splice(fromIndex, 1);
              newLayers.splice(toIndex, 0, removed);
              return newLayers;
            });
          }}
          activeLayerId={activeLayerId}
          onActiveLayerChange={setActiveLayerId}
        />
        
        {/* Enhanced Component Library */}
        <EnhancedComponentLibrary />
        
        {/* Main Canvas Area */}
        <div className="flex-1 relative overflow-auto bg-gray-100">
          {/* Canvas Tools */}
          <div className="absolute top-4 right-4 z-10">
            <CanvasTools
              activeTool={activeTool}
              onToolChange={setActiveTool}
              zoom={sldState.canvasState.zoom}
              onZoomChange={(zoom) => {}} // Implement zoom change
              onZoomFit={() => {}} // Implement zoom fit
              onZoomReset={() => {}} // Implement zoom reset
              selectedComponents={selectedComponents}
              onDeleteSelected={() => {}} // Implement delete
              onCopySelected={() => {}} // Implement copy
              onRotateSelected={() => {}} // Implement rotate
              gridEnabled={sldState.canvasState.gridEnabled}
              onGridToggle={() => {}} // Implement grid toggle
              snapToGrid={true}
              onSnapToggle={() => {}} // Implement snap toggle
            />
          </div>
          
          {/* Professional Drawing Border with Title Block */}
          <div className="min-w-[1200px] min-h-[1200px] m-4">
            <DrawingBorder
              paperSize="tabloid"
              orientation="landscape"
              marginSize="standard"
              showGrid={sldState.canvasState.gridEnabled}
            >
            {/* Draggable Title Block */}
            {showTitleBlock && (
              <DraggableTitleBlock
                data={titleBlockData}
                position={titleBlockPosition}
                onPositionChange={handleTitleBlockPositionChange}
                onDataChange={handleTitleBlockDataChange}
                template={titleBlockTemplate as 'standard' | 'professional' | 'engineering' | 'permit'}
                editable={true}
                autoFillFromProject={true}
                projectData={projectDataForAutoFill}
              />
            )}
            
            {/* SLD Canvas Content */}
            <div
              ref={canvasRef}
              className="w-full h-full relative"
              style={{
                transform: `scale(${sldState.canvasState.zoom})`,
                transformOrigin: 'top left'
              }}
            >
            {/* Grid */}
            {sldState.canvasState.gridEnabled && (
              <div
                className="absolute inset-0 opacity-25"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                    linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                  `,
                  backgroundSize: `${sldState.canvasState.gridSize}px ${sldState.canvasState.gridSize}px`
                }}
              />
            )}
            
            {/* Generated Components */}
            {sldState.diagram?.components.map(component => (
              <div
                key={component.id}
                className="absolute border-2 border-blue-400 bg-white cursor-pointer select-none shadow-sm hover:shadow-md transition-all"
                style={{
                  left: component.position.x,
                  top: component.position.y,
                  width: component.width,
                  height: component.height
                }}
                onClick={() => {
                  if (selectedComponents.includes(component.id)) {
                    setSelectedComponents(prev => prev.filter(id => id !== component.id));
                  } else {
                    setSelectedComponents(prev => [...prev, component.id]);
                  }
                }}
              >
                {/* Component Symbol and Info */}
                <div className="w-full h-full flex flex-col items-center justify-center p-2">
                  <div className="text-lg mb-1">{component.symbol}</div>
                  <div className="text-xs text-gray-600 text-center font-medium">
                    {component.name}
                  </div>
                  {(component as any).specifications?.rating && (
                    <div className="text-xs font-mono text-blue-600">
                      {(component as any).specifications.rating}
                    </div>
                  )}
                  {generationOptions.includeCircuitNumbers && (component as any).circuitNumber && (
                    <div className="text-xs font-mono text-green-600">
                      Ckt: {(component as any).circuitNumber}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Dynamic Wire Routing */}
            {showWireRouting && sldState.diagram?.connections && sldState.diagram?.components && (
              <DynamicWireRenderer
                connections={sldState.diagram.connections}
                components={sldState.diagram.components}
                showWireLabels={showWireLabels}
                showCollisionHighlight={showCollisionHighlight}
                interactive={true}
                onWireClick={(route) => {
                  console.log('Wire clicked:', route);
                  setSelectedWire(route.connectionId);
                }}
                onWireHover={(route) => {
                  // Handle wire hover for tooltips or highlighting
                }}
                selectedWires={selectedWire ? [selectedWire] : []}
                constraints={{
                  gridSnap: sldState.canvasState.gridEnabled,
                  gridSize: sldState.canvasState.gridSize || 20,
                  routingMethod: 'manhattan',
                  avoidanceMargin: 25,
                  wireSpacing: 18
                }}
              />
            )}

            {/* Fallback Connection Lines (when wire routing is disabled) */}
            {!showWireRouting && sldState.diagram?.connections?.map(connection => (
              <svg
                key={connection.id}
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
              >
                <line
                  x1={100} // Calculate based on component positions
                  y1={100}
                  x2={200}
                  y2={200}
                  stroke={connection.type === 'dc' ? '#dc2626' : '#1f2937'}
                  strokeWidth="2"
                  strokeDasharray={connection.type === 'dc' ? '5,5' : undefined}
                />
              </svg>
            ))}
            
            {/* Empty State */}
            {!sldState.diagram?.components?.length && !isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Zap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Professional SLD Canvas
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Create professional single line diagrams using the component library and drawing tools.
                    Drag components from the library to build your electrical system.
                  </p>
                </div>
              </div>
            )}
            </div>
          </DrawingBorder>
          
          {/* Scroll indicator */}
          <div className="flex justify-center py-8 text-gray-500 text-sm border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <span>⬇️ Scroll down to explore the full canvas area</span>
              <span className="text-xs text-gray-400">(Canvas: 1200px wide)</span>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};