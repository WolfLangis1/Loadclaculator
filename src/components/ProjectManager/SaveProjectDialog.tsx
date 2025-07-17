import React, { useState } from 'react';
import { useProjectSettings } from '../../context/ProjectSettingsContext';

interface SaveProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectName: string) => Promise<void>;
  isLoading: boolean;
}

export const SaveProjectDialog: React.FC<SaveProjectDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  isLoading,
}) => {
  const { settings } = useProjectSettings();
  const [projectName, setProjectName] = useState('');

  if (!isOpen) return null;

  const generateDefaultProjectName = () => {
    const customer = settings.projectInfo.customerName || 'Unnamed Project';
    const date = new Date().toLocaleDateString();
    return `${customer} - ${date}`;
  };

  const handleSave = async () => {
    await onSave(projectName || generateDefaultProjectName());
    setProjectName(''); // Clear input after saving
  };

  return (
    <div className="fixed inset-0 z-60 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Save Project</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={generateDefaultProjectName()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Project'}
          </button>
        </div>
      </div>
    </div>
  );
};
