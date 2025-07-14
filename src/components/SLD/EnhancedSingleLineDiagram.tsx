import React, { useState, useCallback } from 'react';
import { 
  Zap, 
  Image, 
  FileText, 
  Settings, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Layout,
  Plus,
  Save,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { EnhancedSLDCanvas } from './EnhancedSLDCanvas';
import { RefactoredComponentLibrary } from './RefactoredComponentLibrary';
import { AerialView } from './AerialView';
import { SLDService } from '../../services/sldService';
import { AerialViewService } from '../../services/aerialViewService';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { createComponentLogger } from '../../services/loggingService';
import type { SLDDiagram, AerialView as AerialViewType, SLDGenerationConfig } from '../../types/sld';

interface EnhancedSingleLineDiagramProps {
  className?: string;
}

type ActiveTab = 'sld' | 'aerial' | 'export';

interface ComponentTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  icon: React.ComponentType<any>;
  color: string;
  defaultSize: { width: number; height: number };
  description: string;
  manufacturer?: string;
  model?: string;
  specifications: Record<string, any>;
}

export const EnhancedSingleLineDiagram: React.FC<EnhancedSingleLineDiagramProps> = ({
  className = ''
}) => {
  const logger = createComponentLogger('EnhancedSingleLineDiagram');
  const { state } = useLoadCalculator();
  const [activeTab, setActiveTab] = useState<ActiveTab>('sld');
  const [diagram, setDiagram] = useState<SLDDiagram | null>(null);
  const [aerialView, setAerialView] = useState<AerialViewType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingAerial, setIsLoadingAerial] = useState(false);
  const [showComponentLibrary, setShowComponentLibrary] = useState(true);
  const [config, setConfig] = useState<SLDGenerationConfig>({
    style: 'professional',
    includeSpecifications: true,
    includeNECLabels: true,
    autoLayout: true,
    componentSpacing: 150,
    lineStyle: 'solid',
    showGrounding: true,
    showConduitSizing: false,
    colorCoding: false
  });

  // Generate SLD from load calculator data
  const handleGenerateSLD = async () => {
    setIsGenerating(true);
    try {
      const projectInfo = {
        id: 'current-project',
        customerName: state.projectInfo?.customerName || 'Unnamed Project',
        codeYear: state.codeYear,
        jurisdiction: state.projectInfo?.jurisdiction || 'Local AHJ'
      };

      const generatedDiagram = SLDService.generateFromLoadData(
        state.loads,
        projectInfo,
        config
      );

      setDiagram(generatedDiagram);
    } catch (error) {
      console.error('Failed to generate SLD:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate aerial view from address
  const handleGenerateAerial = async () => {
    const address = state.projectInfo?.propertyAddress;
    if (!address) {
      alert('Please enter a property address in the Project Information section.');
      return;
    }

    setIsLoadingAerial(true);
    try {
      const view = await AerialViewService.createAerialView(
        'current-project',
        address,
        {
          width: 800,
          height: 600,
          zoom: 18,
          mapType: 'satellite'
        }
      );

      // Auto-detect potential PV areas
      await AerialViewService.autoDetectPVAreas(view);

      // Add electrical infrastructure
      AerialViewService.addElectricalInfrastructure(view, {
        mainBreaker: state.mainBreaker,
        evseLoads: state.loads.evseLoads
      });

      setAerialView(view);
    } catch (error) {
      console.error('Failed to generate aerial view:', error);
      alert('Failed to generate aerial view. Please check the address and try again.');
    } finally {
      setIsLoadingAerial(false);
    }
  };

  // Handle component selection from library
  const handleComponentSelect = useCallback((template: ComponentTemplate) => {
    if (!diagram) return;

    // Create new component from template with proper typing
    const newComponent: any = {
      id: `component_${Date.now()}`,
      type: template.type,
      name: template.name,
      position: { x: 100, y: 100 }, // Default position
      size: template.defaultSize,
      rotation: 0,
      labels: [],
      necLabels: [],
      specifications: template.specifications,
      ...template.specifications // Spread additional properties
    };

    // Add component to diagram
    const updatedDiagram: SLDDiagram = {
      ...diagram,
      components: [...diagram.components, newComponent],
      lastModified: new Date()
    };

    setDiagram(updatedDiagram);
  }, [diagram]);

  // Handle component drag start
  const handleComponentDragStart = useCallback((template: ComponentTemplate, event: React.DragEvent) => {
    // Set drag data for drop handling
    event.dataTransfer.setData('application/json', JSON.stringify(template));
  }, []);

  // Handle diagram changes
  const handleDiagramChange = useCallback((updatedDiagram: SLDDiagram) => {
    setDiagram(updatedDiagram);
  }, []);

  // Save diagram to local storage
  const handleSaveDiagram = useCallback(() => {
    if (!diagram) {
      logger.warn('No diagram to save');
      return;
    }

    try {
      const saveData = {
        diagram,
        config,
        projectInfo: state.projectInfo,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      localStorage.setItem('sld_diagram_save', JSON.stringify(saveData));
      logger.info('Diagram saved successfully', { 
        diagramId: diagram.id,
        componentCount: diagram.components.length 
      });

      // Show success message (could be replaced with a toast notification)
      alert('Diagram saved successfully!');
    } catch (error) {
      logger.error('Failed to save diagram', error as Error);
      alert('Failed to save diagram. Please try again.');
    }
  }, [diagram, config, state.projectInfo, logger]);

  // Export diagram in SVG format
  const handleExportDiagram = useCallback(async () => {
    if (!diagram) {
      logger.warn('No diagram to export');
      return;
    }

    try {
      logger.info('Starting diagram export', { 
        diagramId: diagram.id,
        format: 'svg' 
      });

      // Create SVG export
      const svgContent = generateSVGExport(diagram);
      
      // Create download
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sld_diagram_${diagram.id}_${new Date().toISOString().slice(0, 10)}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      logger.info('Diagram exported successfully');
    } catch (error) {
      logger.error('Failed to export diagram', error as Error);
      alert('Failed to export diagram. Please try again.');
    }
  }, [diagram, logger]);

  // Generate SVG export (basic implementation)
  const generateSVGExport = (diagram: SLDDiagram): string => {
    const width = 800;
    const height = 600;
    
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .component-text { font-family: Arial, sans-serif; font-size: 12px; }
      .wire { stroke: #333; stroke-width: 2; fill: none; }
      .component { stroke: #333; stroke-width: 1; }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="white"/>
  
  <!-- Title -->
  <text x="20" y="30" class="component-text" font-size="16" font-weight="bold">
    Single Line Diagram - ${state.projectInfo?.customerName || 'Project'}
  </text>
  
  <!-- Components -->`;

    diagram.components.forEach((component) => {
      const x = component.position.x;
      const y = component.position.y + 50; // Offset for title
      const width = component.size.width;
      const height = component.size.height;

      svgContent += `
  <g class="component">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#f0f0f0" class="component"/>
    <text x="${x + width/2}" y="${y + height/2}" text-anchor="middle" class="component-text">
      ${component.type}
    </text>
  </g>`;
    });

    // Add connections
    diagram.connections.forEach(connection => {
      const fromComponent = diagram.components.find(c => c.id === connection.from.componentId);
      const toComponent = diagram.components.find(c => c.id === connection.to.componentId);
      
      if (fromComponent && toComponent) {
        const x1 = fromComponent.position.x + fromComponent.size.width/2;
        const y1 = fromComponent.position.y + fromComponent.size.height + 50;
        const x2 = toComponent.position.x + toComponent.size.width/2;
        const y2 = toComponent.position.y + 50;
        
        svgContent += `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="wire"/>`;
      }
    });

    svgContent += `
</svg>`;

    return svgContent;
  };

  const renderSLDTab = () => (
    <div className="flex h-full">
      {/* Component Library */}
      {showComponentLibrary && (
        <RefactoredComponentLibrary
          onComponentSelect={handleComponentSelect}
          onComponentDragStart={handleComponentDragStart}
        />
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* SLD Controls */}
        <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200">
          <button
            onClick={handleGenerateSLD}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {isGenerating ? 'Generating...' : 'Generate SLD'}
          </button>

          <button
            onClick={() => setShowComponentLibrary(!showComponentLibrary)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            {showComponentLibrary ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showComponentLibrary ? 'Hide Library' : 'Show Library'}
          </button>

          <button
            onClick={() => {/* TODO: Implement templates modal */}}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Layout className="h-4 w-4" />
            Templates
          </button>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Style:</label>
            <select
              value={config.style}
              onChange={(e) => setConfig(prev => ({ ...prev, style: e.target.value as any }))}
              className="px-3 py-1 border border-gray-300 rounded"
            >
              <option value="professional">Professional Style</option>
              <option value="standard">Standard</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.includeNECLabels}
              onChange={(e) => setConfig(prev => ({ ...prev, includeNECLabels: e.target.checked }))}
            />
            <span className="text-sm">NEC Labels</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.autoLayout}
              onChange={(e) => setConfig(prev => ({ ...prev, autoLayout: e.target.checked }))}
            />
            <span className="text-sm">Auto Layout</span>
          </label>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleSaveDiagram}
              disabled={!diagram}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
            <button
              onClick={handleExportDiagram}
              disabled={!diagram}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* SLD Canvas */}
        <div className="flex-1">
          {diagram ? (
            <EnhancedSLDCanvas
              diagram={diagram}
              onDiagramChange={handleDiagramChange}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Zap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No Single Line Diagram</p>
                <p className="text-sm mb-4">Click "Generate SLD" to create a diagram from your load calculations</p>
                <p className="text-xs text-gray-400">Or use the component library to build your diagram manually</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAerialTab = () => {
    const configStatus = AerialViewService.getConfigurationStatus();
    
    return (
      <div className="flex flex-col h-full">
        {/* Aerial Controls */}
        <div className="flex items-center gap-4 p-4 bg-white border-b border-gray-200">
          <button
            onClick={handleGenerateAerial}
            disabled={isLoadingAerial || !state.projectInfo?.propertyAddress}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {isLoadingAerial ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Image className="h-4 w-4" />
            )}
            {isLoadingAerial ? 'Loading...' : 'Generate Aerial View'}
          </button>

          {!state.projectInfo?.propertyAddress && (
            <span className="text-sm text-orange-600">
              Please enter property address in Project Information
            </span>
          )}

          <div className="text-sm text-gray-600">
            Address: {state.projectInfo?.propertyAddress || 'Not specified'}
          </div>

          {/* Data Source Status */}
          <div className="ml-auto flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              configStatus.isReal 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {configStatus.isReal ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              <span>{configStatus.provider} Data</span>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {!configStatus.isReal && (
          <div className="p-3 bg-yellow-50 border-b border-yellow-200">
            <div className="text-sm text-yellow-800">
              <strong>Development Mode:</strong> {configStatus.message}
            </div>
            {configStatus.setupInstructions && (
              <div className="text-xs text-yellow-700 mt-1">
                {configStatus.setupInstructions}
              </div>
            )}
          </div>
        )}

        {/* Aerial View */}
        <div className="flex-1">
          {aerialView ? (
            <AerialView
              aerialView={aerialView}
              onAerialViewChange={setAerialView}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <Image className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">No Aerial View</p>
                <p className="text-sm">Click "Generate Aerial View" to capture satellite imagery</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExportTab = () => (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Export Options</h3>
      
      <div className="space-y-6">
        {/* Export Format */}
        <div>
          <label className="block text-sm font-medium mb-2">Export Format</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="radio" name="format" value="pdf" defaultChecked className="mr-2" />
              PDF Report (Recommended for permits)
            </label>
            <label className="flex items-center">
              <input type="radio" name="format" value="svg" className="mr-2" />
              SVG (Scalable vector graphics)
            </label>
            <label className="flex items-center">
              <input type="radio" name="format" value="png" className="mr-2" />
              PNG Image (High resolution)
            </label>
          </div>
        </div>

        {/* Include Options */}
        <div>
          <label className="block text-sm font-medium mb-2">Include in Export</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              Single Line Diagram
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              Aerial Site View
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              Load Calculation Summary
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="mr-2" />
              NEC Code References
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Wire Sizing Tables
            </label>
          </div>
        </div>

        {/* Paper Size */}
        <div>
          <label className="block text-sm font-medium mb-2">Paper Size</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded">
            <option value="letter">Letter (8.5" × 11")</option>
            <option value="legal">Legal (8.5" × 14")</option>
            <option value="tabloid">Tabloid (11" × 17")</option>
            <option value="a4">A4 (210 × 297 mm)</option>
          </select>
        </div>

        {/* Export Button */}
        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <FileText className="h-5 w-5" />
          Export Permit Package
        </button>

        {/* Export Preview */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Export Preview</h4>
          <div className="text-sm text-gray-600">
            <p>• Project: {state.projectInfo?.customerName || 'Unnamed Project'}</p>
            <p>• Address: {state.projectInfo?.propertyAddress || 'Not specified'}</p>
            <p>• Service Size: {state.mainBreaker}A</p>
            <p>• Calculation Method: NEC {state.codeYear} - {state.calculationMethod}</p>
            {diagram && <p>• Components: {diagram.components.length} electrical components</p>}
            {aerialView && <p>• Aerial View: {aerialView.zoom}x zoom satellite imagery</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Enhanced Single Line Diagram & Site Plan
            </h2>
            <p className="text-sm text-gray-600">
              Professional electrical diagrams with drag-and-drop components
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        <button
          onClick={() => setActiveTab('sld')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sld'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Single Line Diagram
        </button>
        <button
          onClick={() => setActiveTab('aerial')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'aerial'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Aerial View
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'export'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Export
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-[600px]">
        {activeTab === 'sld' && renderSLDTab()}
        {activeTab === 'aerial' && renderAerialTab()}
        {activeTab === 'export' && renderExportTab()}
      </div>
    </div>
  );
}; 