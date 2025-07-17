import React from 'react';
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Users,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useCompliance, useComplianceScore, useComplianceIssues, useComplianceInspections } from '../../context/ComplianceContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';

interface ComplianceDashboardProps {
  onNavigate: (section: string) => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ onNavigate }) => {
  const { complianceData } = useCompliance();
  const complianceScore = useComplianceScore();
  const { activeIssues, resolvedIssues, criticalCount, warningCount } = useComplianceIssues();
  const { allInspections, upcomingInspections, completedInspections, nextInspectionDate } = useComplianceInspections();
  const { settings } = useProjectSettings();

  // Calculate statistics
  const totalValidations = complianceData.validationResults.length;
  const lastValidation = complianceData.lastValidation;
  const totalDocuments = complianceData.documents.length;
  const hasAHJ = !!complianceData.ahjId;

  // Get compliance status color and message
  const getComplianceStatus = () => {
    if (criticalCount > 0) {
      return { color: 'text-red-600', bg: 'bg-red-50', status: 'Non-Compliant', message: 'Critical issues require attention' };
    } else if (warningCount > 0) {
      return { color: 'text-yellow-600', bg: 'bg-yellow-50', status: 'In Progress', message: 'Some issues need resolution' };
    } else if (complianceScore >= 90) {
      return { color: 'text-green-600', bg: 'bg-green-50', status: 'Compliant', message: 'All requirements met' };
    } else {
      return { color: 'text-gray-600', bg: 'bg-gray-50', status: 'Not Started', message: 'Compliance validation needed' };
    }
  };

  const complianceStatus = getComplianceStatus();

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  // Status cards data
  const statusCards = [
    {
      title: 'Compliance Score',
      value: `${complianceScore}%`,
      icon: Shield,
      color: complianceStatus.color,
      bg: complianceStatus.bg,
      description: complianceStatus.message,
      onClick: () => onNavigate('validation')
    },
    {
      title: 'Active Issues',
      value: activeIssues.length.toString(),
      icon: AlertTriangle,
      color: criticalCount > 0 ? 'text-red-600' : warningCount > 0 ? 'text-yellow-600' : 'text-green-600',
      bg: criticalCount > 0 ? 'bg-red-50' : warningCount > 0 ? 'bg-yellow-50' : 'bg-green-50',
      description: `${criticalCount} critical, ${warningCount} warnings`,
      onClick: () => onNavigate('issues')
    },
    {
      title: 'Upcoming Inspections',
      value: upcomingInspections.length.toString(),
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      description: nextInspectionDate ? `Next: ${formatDate(nextInspectionDate)}` : 'None scheduled',
      onClick: () => onNavigate('inspections')
    },
    {
      title: 'Documents',
      value: totalDocuments.toString(),
      icon: FileText,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      description: 'Compliance documents ready',
      onClick: () => onNavigate('documents')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Project overview */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Project Overview</h2>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${complianceStatus.color} ${complianceStatus.bg}`}>
            {complianceStatus.status}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Project Name:</span>
            <p className="font-medium">{settings.projectInfo?.projectName || 'Unnamed Project'}</p>
          </div>
          <div>
            <span className="text-gray-500">Customer:</span>
            <p className="font-medium">{settings.projectInfo?.customerName || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>
            <p className="font-medium">{settings.projectInfo?.jurisdiction || 'Not specified'}</p>
          </div>
          <div>
            <span className="text-gray-500">Code Year:</span>
            <p className="font-medium">{complianceData.codeYear}</p>
          </div>
          <div>
            <span className="text-gray-500">Last Validation:</span>
            <p className="font-medium">{formatDate(lastValidation)}</p>
          </div>
          <div>
            <span className="text-gray-500">AHJ Selected:</span>
            <p className="font-medium">{hasAHJ ? 'Yes' : 'Not selected'}</p>
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            className="bg-white rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm font-medium text-gray-900">{card.title}</p>
              <p className="text-xs text-gray-500">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity and quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {complianceData.auditTrail.slice(0, 5).length > 0 ? (
              complianceData.auditTrail.slice(0, 5).map((entry, index) => (
                <div key={entry.id || index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{entry.action}</p>
                    <p className="text-xs text-gray-500">{formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('validation')}
              className="w-full flex items-center justify-between p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Run Compliance Validation</p>
                  <p className="text-xs text-blue-600">Check current project status</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-blue-600" />
            </button>

            <button
              onClick={() => onNavigate('inspections')}
              className="w-full flex items-center justify-between p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Schedule Inspection</p>
                  <p className="text-xs text-green-600">Book next inspection</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-green-600" />
            </button>

            <button
              onClick={() => onNavigate('ahj')}
              className="w-full flex items-center justify-between p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900">Select AHJ</p>
                  <p className="text-xs text-purple-600">Choose authority having jurisdiction</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-purple-600" />
            </button>

            <button
              onClick={() => onNavigate('documents')}
              className="w-full flex items-center justify-between p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Generate Report</p>
                  <p className="text-xs text-orange-600">Export compliance documentation</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-orange-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalValidations}</p>
            <p className="text-sm text-gray-500">Total Validations</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{resolvedIssues.length}</p>
            <p className="text-sm text-gray-500">Issues Resolved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{completedInspections.length}</p>
            <p className="text-sm text-gray-500">Inspections Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
            <p className="text-sm text-gray-500">Documents Ready</p>
          </div>
        </div>
      </div>
    </div>
  );
};