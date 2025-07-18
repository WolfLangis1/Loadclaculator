import React from 'react';
import { FileText, Upload, Download, Eye } from 'lucide-react';

export const DocumentManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Document Manager</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Upload className="h-4 w-4 inline mr-2" />
            Upload Document
          </button>
        </div>
        
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document Management</h3>
          <p className="text-gray-600">
            Manage compliance documents, permits, and inspection reports.
          </p>
        </div>
      </div>
    </div>
  );
};