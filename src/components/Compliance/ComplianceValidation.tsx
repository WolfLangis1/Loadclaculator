import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, FileText, Info } from 'lucide-react';
import { useCompliance } from '../../context/ComplianceContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { useLoadData } from '../../context/LoadDataContext';
import { complianceService } from '../../services/complianceService';

export const ComplianceValidation: React.FC = () => {
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  
  const { complianceData, addValidationResult } = useCompliance();
  const { settings } = useProjectSettings();
  const { loads } = useLoadData();

  const handleRunValidation = async () => {
    setIsValidating(true);
    setValidationMessage('');
    
    try {
      // Create project data for validation
      const projectData = {
        metadata: {
          id: 'current_project',
          name: settings.projectInfo?.projectName || 'Current Project'
        },
        settings,
        loads,
        compliance: complianceData
      };

      const validationResult = await complianceService.validateProject('current_project', projectData as any);
      addValidationResult(validationResult);
      
      setValidationMessage('Validation completed successfully');
    } catch (error) {
      console.error('Validation failed:', error);
      setValidationMessage('Validation failed. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const latestValidation = complianceData.validationResults[0];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'major':
        return 'text-orange-600 bg-orange-50';
      case 'minor':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Validation header and controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Code Compliance Validation</h2>
          <button
            onClick={handleRunValidation}
            disabled={isValidating}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            <span>{isValidating ? 'Validating...' : 'Run Validation'}</span>
          </button>
        </div>

        {validationMessage && (
          <div className={`p-3 rounded-lg text-sm ${
            validationMessage.includes('failed') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {validationMessage}
          </div>
        )}

        {latestValidation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Latest Validation Results</h3>
              <span className="text-sm text-gray-500">
                {new Date(latestValidation.validatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="mt-2 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon(latestValidation.status)}
                <span className="text-sm font-medium">
                  Overall: {latestValidation.status.charAt(0).toUpperCase() + latestValidation.status.slice(1)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Score: {latestValidation.overallScore}%
              </div>
              <div className="text-sm text-gray-600">
                {latestValidation.criticalIssues} critical, {latestValidation.warnings} warnings
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation results */}
      {latestValidation && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Validation Details</h3>
            <p className="text-sm text-gray-600 mt-1">
              {latestValidation.results.length} checks performed
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {latestValidation.results.map((check, index) => (
              <div key={check.id || index} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(check.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {check.description}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(check.severity)}`}>
                        {check.severity}
                      </span>
                    </div>
                    
                    <p className="mt-1 text-sm text-gray-600">{check.details}</p>
                    
                    {check.necReference && (
                      <p className="mt-1 text-xs text-blue-600">
                        NEC Reference: {check.necReference}
                      </p>
                    )}
                    
                    {check.suggestedFix && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <h5 className="text-xs font-medium text-blue-900 mb-1">Suggested Fix:</h5>
                        <p className="text-xs text-blue-800">{check.suggestedFix}</p>
                        {check.autoFixable && (
                          <button className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium">
                            Auto-fix available
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {latestValidation?.recommendations && latestValidation.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {latestValidation.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                <p className="text-sm text-gray-700">{recommendation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No validation data */}
      {!latestValidation && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Validation Results</h3>
          <p className="text-gray-600 mb-6">
            Run a compliance validation to check your project against NEC requirements and local codes.
          </p>
          <button
            onClick={handleRunValidation}
            disabled={isValidating}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isValidating ? 'Validating...' : 'Run First Validation'}
          </button>
        </div>
      )}
    </div>
  );
};