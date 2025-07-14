import React, { useState, useEffect } from 'react';
import { Zap, Image, FileText, Settings, RefreshCw, AlertCircle, CheckCircle, Layout } from 'lucide-react';
import { SLDCanvas } from './SLDCanvas';
import { AerialView } from './AerialView';
import { SLDService } from '../../services/sldService';
import { AerialViewService } from '../../services/aerialViewService';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import type { SLDDiagram, AerialView as AerialViewType, SLDGenerationConfig } from '../../types/sld';

interface SingleLineDiagramProps {
  className?: string;
}

type ActiveTab = 'sld' | 'aerial' | 'export';

export const SingleLineDiagram: React.FC<SingleLineDiagramProps> = ({
  className = ''
}) => {
  const { state } = useLoadCalculator();
  const [activeTab, setActiveTab] = useState<ActiveTab>('sld');
  const [diagram, setDiagram] = useState<SLDDiagram | null>(null);
  const [aerialView, setAerialView] = useState<AerialViewType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingAerial, setIsLoadingAerial] = useState(false);
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

  // Auto-generate SLD when load data changes (if enabled)
  useEffect(() => {
    // Disabled auto-generation to prevent initial errors
    // Users can manually generate SLD when ready
    // if (config.autoLayout && !diagram && state.projectInfo?.customerName) {
    //   handleGenerateSLD();
    // }
  }, [state.loads]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderSLDTab = () => (
    <div className="flex flex-col h-full">
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
          onClick={() => {/* TODO: Implement templates modal */}}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
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
      </div>

      {/* SLD Canvas */}
      <div className="flex-1">
        {diagram ? (
          <SLDCanvas
            diagram={diagram}
            onDiagramChange={setDiagram}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Zap className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">No Single Line Diagram</p>
              <p className="text-sm">Click "Generate SLD" to create a diagram from your load calculations</p>
            </div>
          </div>
        )}
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
              Single Line Diagram & Site Plan
            </h2>
            <p className="text-sm text-gray-600">
              Professional electrical diagrams for permit submission
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