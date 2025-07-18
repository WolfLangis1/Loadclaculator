import React from 'react';
import { Building, MapPin, Phone, Mail } from 'lucide-react';

export const AHJManager: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Authority Having Jurisdiction</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Select AHJ
          </button>
        </div>
        
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">AHJ Management</h3>
          <p className="text-gray-600">
            Select and manage your Authority Having Jurisdiction for permit and inspection requirements.
          </p>
        </div>
      </div>
    </div>
  );
};