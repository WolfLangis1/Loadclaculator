import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';

export const ValidationMessages: React.FC = () => {
  const { calculations } = useLoadCalculator();
  
  if (calculations.errors.length === 0 && calculations.warnings.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">All calculations are valid and NEC compliant</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {/* Errors */}
      {calculations.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <h3 className="text-red-800 font-medium">Code Violations - Must Be Resolved</h3>
          </div>
          <ul className="space-y-1">
            {calculations.errors.map((error, index) => (
              <li key={index} className="text-red-700 text-sm flex items-start gap-2">
                <span className="text-red-500">•</span>
                <div>
                  <span className="font-medium">{error.message}</span>
                  <span className="text-red-600 ml-2">({error.code})</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {calculations.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h3 className="text-yellow-800 font-medium">Warnings - Review Recommended</h3>
          </div>
          <ul className="space-y-1">
            {calculations.warnings.map((warning, index) => (
              <li key={index} className="text-yellow-700 text-sm flex items-start gap-2">
                <span className="text-yellow-500">•</span>
                <div>
                  <span className="font-medium">{warning.message}</span>
                  <span className="text-yellow-600 ml-2">({warning.code})</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};