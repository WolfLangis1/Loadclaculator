import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ClipboardCheck, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Users,
  Building
} from 'lucide-react';
import { useCompliance, useComplianceScore, useComplianceIssues, useComplianceInspections } from '../../context/ComplianceContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { useLoadData } from '../../context/LoadDataContext';
import { ComplianceDashboard } from './ComplianceDashboard';
import { InspectionManager } from './InspectionManager';
import { ComplianceValidation } from './ComplianceValidation';
import { AHJManager } from './AHJManager';
import { IssueTracker } from './IssueTracker';
import { DocumentManager } from './DocumentManager';
import { ComplianceErrorBoundary } from '../ErrorBoundary/ComplianceErrorBoundary';

type ComplianceSection = 
  | 'dashboard' 
  | 'validation' 
  | 'inspections' 
  | 'issues' 
  | 'documents' 
  | 'ahj';

export const ComplianceMain: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ComplianceSection>('dashboard');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Context hooks
  const { 
    complianceData, 
    isLoading,
    error,
    setAHJ,
    addValidationResult,
    resetCompliance 
  } = useCompliance();
  const complianceScore = useComplianceScore();
  const { activeIssues, criticalCount, warningCount } = useComplianceIssues();
  const { upcomingInspections, nextInspectionDate } = useComplianceInspections();
  const { settings } = useProjectSettings();
  const { loads } = useLoadData();

  // Initialize compliance data when component mounts
  useEffect(() => {
    if (!isInitialized && settings.projectInfo?.projectName) {
      // Initialize compliance system for this project
      setIsInitialized(true);
    }
  }, [settings.projectInfo?.projectName, isInitialized]);

  // Navigation items for the compliance interface
  const navigationItems = [
    {
      id: 'dashboard' as ComplianceSection,
      label: 'Dashboard',
      icon: Shield,
      description: 'Overview of compliance status'
    },
    {
      id: 'validation' as ComplianceSection,
      label: 'Validation',
      icon: CheckCircle,
      description: 'Code compliance validation',
      badge: complianceData.validationResults.length > 0 ? complianceData.validationResults[0]?.criticalIssues : undefined
    },
    {
      id: 'inspections' as ComplianceSection,
      label: 'Inspections',
      icon: Calendar,
      description: 'Schedule and track inspections',
      badge: upcomingInspections.length
    },
    {
      id: 'issues' as ComplianceSection,
      label: 'Issues',
      icon: AlertTriangle,
      description: 'Track compliance issues',
      badge: activeIssues.length,
      badgeColor: criticalCount > 0 ? 'bg-red-500' : 'bg-yellow-500'
    },
    {
      id: 'documents' as ComplianceSection,
      label: 'Documents',
      icon: FileText,
      description: 'Manage compliance documents',
      badge: complianceData.documents.length
    },
    {
      id: 'ahj' as ComplianceSection,
      label: 'AHJ',
      icon: Building,
      description: 'Authority Having Jurisdiction'
    }
  ];

  // Status indicators
  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 90) return CheckCircle;
    if (score >= 70) return Clock;
    return XCircle;
  };

  const StatusIcon = getStatusIcon(complianceScore);

  // Render the active section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <ComplianceDashboard onNavigate={setActiveSection} />;
      case 'validation':
        return <ComplianceValidation />;
      case 'inspections':
        return <InspectionManager />;
      case 'issues':
        return <IssueTracker />;
      case 'documents':
        return <DocumentManager />;
      case 'ahj':
        return <AHJManager />;
      default:
        return <ComplianceDashboard onNavigate={setActiveSection} />;
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
            Compliance System Error
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {error}
          </p>
          <button
            onClick={resetCompliance}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Reset Compliance System
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with status overview */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Inspection & Compliance
                </h1>
                <p className="text-sm text-gray-600">
                  {settings.projectInfo?.projectName || 'No project selected'}
                </p>
              </div>
            </div>
            
            {/* Quick status indicators */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <StatusIcon className={`h-5 w-5 ${getStatusColor(complianceScore)}`} />
                <span className={`text-sm font-medium ${getStatusColor(complianceScore)}`}>
                  {complianceScore}% Compliant
                </span>
              </div>
              
              {criticalCount > 0 && (
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {criticalCount} Critical Issue{criticalCount !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              
              {upcomingInspections.length > 0 && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <Calendar className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {upcomingInspections.length} Upcoming
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Navigation sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              {navigationItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </div>
                    
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        item.badgeColor || 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            
            {/* Quick actions */}
            <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setActiveSection('validation')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Run Validation</span>
                </button>
                <button 
                  onClick={() => setActiveSection('inspections')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Schedule Inspection</span>
                </button>
                <button 
                  onClick={() => setActiveSection('documents')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center space-x-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Export Report</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <ComplianceErrorBoundary componentName={activeSection}>
              {isLoading ? (
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading compliance data...</p>
                </div>
              ) : (
                renderSectionContent()
              )}
            </ComplianceErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};