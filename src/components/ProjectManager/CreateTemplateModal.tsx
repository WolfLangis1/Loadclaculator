/**
 * Create Template Modal Component
 * 
 * Modal for creating project templates from existing projects
 */

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { ProjectData } from '../../services/projectService';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectId: string, templateName: string, category: 'residential' | 'commercial' | 'industrial' | 'solar' | 'evse' | 'custom') => void;
  projects: ProjectData[];
}

const TEMPLATE_CATEGORIES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'solar', label: 'Solar PV' },
  { value: 'evse', label: 'EV Charging' },
  { value: 'custom', label: 'Custom' }
];

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  projects
}) => {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'residential' | 'commercial' | 'industrial' | 'solar' | 'evse' | 'custom'>('custom');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (templateName.trim() && selectedProjectId) {
      onCreate(selectedProjectId, templateName.trim(), category);
      setTemplateName('');
      setDescription('');
      setCategory('custom');
      setSelectedProjectId('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Create Template</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="sourceProject" className="block text-sm font-medium text-gray-700 mb-2">
              Source Project
            </label>
            <select
              id="sourceProject"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a project to create template from</option>
              {projects.map((project) => (
                <option key={project.metadata.id} value={project.metadata.id}>
                  {project.metadata.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="templateName" className="block text-sm font-medium text-gray-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this template..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {TEMPLATE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              Create Template
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};