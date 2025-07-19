import React, { useState } from 'react';
import { Download, Trash2, Shield, AlertTriangle, CheckCircle, FileText, Database, Clock } from 'lucide-react';

interface DataRightsProps {
  userId?: string;
}

const DataRightsCenter: React.FC<DataRightsProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const handleExportData = async (format: 'json' | 'csv') => {
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/user-data-rights?action=export&format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
      }

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      // Get filename from response headers or create default
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `user_data_export.${format}`;
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({
        type: 'success',
        text: `Your data has been exported successfully as ${format.toUpperCase()} format.`
      });
    } catch (error) {
      console.error('Export error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to export data'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = async (softDelete: boolean = false) => {
    if (!userId) {
      setMessage({ type: 'error', text: 'User ID is required for data deletion' });
      return;
    }

    const requiredConfirmation = `DELETE_MY_DATA_${userId}`;
    if (deleteConfirmationText !== requiredConfirmation) {
      setMessage({
        type: 'error',
        text: `Please enter the exact confirmation text: ${requiredConfirmation}`
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/user-data-rights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          action: 'delete',
          soft_delete: softDelete,
          confirmation: requiredConfirmation
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete data');
      }

      const result = await response.json();
      
      setMessage({
        type: 'success',
        text: result.message
      });

      setShowDeleteConfirmation(false);
      setDeleteConfirmationText('');

      // If hard delete, logout user after a delay
      if (!softDelete) {
        setTimeout(() => {
          localStorage.removeItem('auth_token');
          window.location.href = '/';
        }, 3000);
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete data'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-2xl font-bold text-gray-900">Data Rights Center</h1>
        </div>
        <p className="text-gray-600">
          Exercise your data protection rights under GDPR and CCPA. You can access, export, or delete your personal data.
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : message.type === 'warning'
            ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertTriangle className="w-5 h-5 mr-2" />
          )}
          {message.text}
        </div>
      )}

      {/* Data Rights Cards */}
      <div className="space-y-6">
        {/* Right to Access / Data Portability */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <Download className="w-6 h-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Right to Access & Data Portability
                </h3>
                <p className="text-gray-600 mb-4">
                  Download a complete copy of your personal data stored in our system. This includes your profile, 
                  projects, CRM data, activity logs, and consent history.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                      className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      <option value="json">JSON (Structured Data)</option>
                      <option value="csv">CSV (Spreadsheet Format)</option>
                    </select>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">What's included in your export:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Profile information (name, email, preferences)</li>
                      <li>• Project data and calculations</li>
                      <li>• CRM customers and project data</li>
                      <li>• Activity logs and system interactions</li>
                      <li>• Consent and privacy preferences history</li>
                      <li>• Subscription and billing information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleExportData(exportFormat)}
              disabled={loading}
              className="ml-6 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              {loading ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
            </button>
          </div>
        </div>

        {/* Right to Rectification */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start">
            <FileText className="w-6 h-6 text-green-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Right to Rectification
              </h3>
              <p className="text-gray-600 mb-4">
                You can update and correct your personal information through your account settings. 
                Visit your profile page to make changes to your personal data.
              </p>
              <a
                href="/settings/profile"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
              >
                <FileText className="w-4 h-4 mr-2" />
                Update Profile Information
              </a>
            </div>
          </div>
        </div>

        {/* Right to Erasure */}
        <div className="bg-white border border-red-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <Trash2 className="w-6 h-6 text-red-600 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Right to Erasure (Right to be Forgotten)
                </h3>
                <p className="text-gray-600 mb-4">
                  Request deletion of your personal data. You can choose between temporary deletion 
                  (recoverable for 30 days) or permanent deletion.
                </p>
                
                <div className="bg-red-50 p-3 rounded-lg mb-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 mb-1">Important Warning</h4>
                      <p className="text-sm text-red-800">
                        Data deletion is irreversible (for permanent deletion). This will remove all your 
                        projects, calculations, CRM data, and account information. Please export your data 
                        first if you want to keep a copy.
                      </p>
                    </div>
                  </div>
                </div>

                {showDeleteConfirmation && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        To confirm deletion, type: <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                          DELETE_MY_DATA_{userId}
                        </code>
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Enter confirmation text"
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleDeleteData(true)}
                        disabled={loading}
                        className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        {loading ? 'Processing...' : 'Temporary Delete (30 day recovery)'}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteData(false)}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {loading ? 'Processing...' : 'Permanent Delete'}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => {
                        setShowDeleteConfirmation(false);
                        setDeleteConfirmationText('');
                      }}
                      className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {!showDeleteConfirmation && (
              <button
                onClick={() => setShowDeleteConfirmation(true)}
                disabled={loading}
                className="ml-6 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete My Data
              </button>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Processing Time</h4>
              <p className="text-sm text-gray-600">
                Data exports are processed immediately. Data deletion requests are processed within 30 days 
                as required by data protection regulations.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
              <p className="text-sm text-gray-600">
                For questions about your data rights or assistance with requests, contact our Data Protection Officer at{' '}
                <a href="mailto:privacy@loadcalculator.com" className="text-blue-600 hover:underline">
                  privacy@loadcalculator.com
                </a>
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Legal Basis</h4>
              <p className="text-sm text-gray-600">
                These rights are provided under the EU General Data Protection Regulation (GDPR) and 
                California Consumer Privacy Act (CCPA).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataRightsCenter;