import React from 'react';
import { Sun, Zap } from 'lucide-react';
import { AIRoofAnalysisService, type RoofAnalysisResult } from '../../services/aiRoofAnalysisService';

interface SolarAnalysisResultsProps {
  solarAnalysis: any;
  aiRoofAnalysis: RoofAnalysisResult | null;
  loading: boolean;
  aiLoading: boolean;
  onRefresh: () => void;
}

export const SolarAnalysisResults: React.FC<SolarAnalysisResultsProps> = ({
  solarAnalysis,
  aiRoofAnalysis,
  loading,
  aiLoading,
  onRefresh
}) => {
  return (
    <div className="space-y-6">
      {/* Solar Potential Results */}
      {solarAnalysis && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sun className="h-5 w-5 text-yellow-600" />
            Solar Potential Analysis
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Solar Potential */}
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Energy Potential</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Annual Energy:</span>
                  <span className="font-medium text-green-600">
                    {solarAnalysis.solarPotential?.annualEnergyPotential?.toLocaleString() || 'N/A'} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Daily Average:</span>
                  <span className="font-medium">
                    {solarAnalysis.solarPotential?.dailyAverage?.toFixed(1) || 'N/A'} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monthly Average:</span>
                  <span className="font-medium">
                    {solarAnalysis.solarPotential?.monthlyAverage?.toFixed(0) || 'N/A'} kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Peak Power:</span>
                  <span className="font-medium">
                    {solarAnalysis.solarPotential?.peakPowerPotential?.toLocaleString() || 'N/A'} W
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Analysis */}
            {solarAnalysis.recommendations?.financialAnalysis && (
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Financial Analysis</h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Bill:</span>
                    <span className="font-medium">
                      ${solarAnalysis.recommendations.financialAnalysis.monthlyBill?.toFixed(0) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Solar Percentage:</span>
                    <span className="font-medium">
                      {solarAnalysis.recommendations.financialAnalysis.solarPercentage?.toFixed(0) || 'N/A'}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Federal Incentive:</span>
                    <span className="font-medium text-green-600">
                      ${solarAnalysis.recommendations.financialAnalysis.federalIncentive?.toFixed(0) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Metering:</span>
                    <span className="font-medium">
                      {solarAnalysis.recommendations.financialAnalysis.netMeteringAllowed ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Roof Analysis Results */}
      {aiRoofAnalysis && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            AI Roof Detection
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Roof Analysis</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Detected Roof Area:</span>
                  <span className="font-medium text-purple-600">
                    {aiRoofAnalysis.roofArea.toFixed(0)} m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Usable Area:</span>
                  <span className="font-medium">
                    {aiRoofAnalysis.usableArea.toFixed(0)} m²
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Roof Segments:</span>
                  <span className="font-medium">{aiRoofAnalysis.roofSegments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Optimal Panels:</span>
                  <span className="font-medium text-green-600">
                    {aiRoofAnalysis.panelPlacement.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Analysis Quality</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Confidence:</span>
                  <span className="font-medium">
                    {(aiRoofAnalysis.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time:</span>
                  <span className="font-medium text-blue-600">
                    {aiRoofAnalysis.processingTime.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shading Factor:</span>
                  <span className="font-medium">
                    {(aiRoofAnalysis.shadingAnalysis.averageShading * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading States */}
      {(loading || aiLoading) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">
              {loading && 'Analyzing solar potential...'}
              {aiLoading && 'Running AI roof analysis...'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};