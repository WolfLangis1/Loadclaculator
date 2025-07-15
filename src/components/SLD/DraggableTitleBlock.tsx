/**
 * Draggable and Editable Title Block Component
 * 
 * Professional title block that can be moved around the canvas and edited inline.
 * Auto-fills from load calculator project information and maintains professional formatting.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Move, Edit3, Save, X, RefreshCw, FileText, Building, User, Calendar } from 'lucide-react';
import { TitleBlockData } from './TitleBlockTemplates';

interface DraggableTitleBlockProps {
  data: TitleBlockData;
  position: { x: number; y: number };
  onPositionChange: (position: { x: number; y: number }) => void;
  onDataChange: (field: keyof TitleBlockData, value: string) => void;
  template: 'standard' | 'professional' | 'engineering' | 'permit';
  editable?: boolean;
  autoFillFromProject?: boolean;
  projectData?: {
    projectName?: string;
    propertyAddress?: string;
    client?: string;
    engineerName?: string;
    serviceSize?: string;
    voltage?: string;
  };
}

export const DraggableTitleBlock: React.FC<DraggableTitleBlockProps> = ({
  data,
  position,
  onPositionChange,
  onDataChange,
  template = 'professional',
  editable = true,
  autoFillFromProject = true,
  projectData
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [editingField, setEditingField] = useState<keyof TitleBlockData | null>(null);
  const [tempValues, setTempValues] = useState<Partial<TitleBlockData>>({});
  
  const titleBlockRef = useRef<HTMLDivElement>(null);

  // Auto-fill from project data when it changes
  useEffect(() => {
    if (!autoFillFromProject || !projectData) return;
    
    const fieldsToUpdate: Partial<TitleBlockData> = {};
    
    // Only update if there are actual differences
    if (projectData.projectName && projectData.projectName !== data.projectName) {
      fieldsToUpdate.projectName = projectData.projectName;
    }
    if (projectData.propertyAddress && projectData.propertyAddress !== data.address) {
      fieldsToUpdate.address = projectData.propertyAddress;
    }
    if (projectData.client && projectData.client !== data.client) {
      fieldsToUpdate.client = projectData.client;
    }
    if (projectData.engineerName && projectData.engineerName !== data.drawnBy) {
      fieldsToUpdate.drawnBy = projectData.engineerName;
    }
    if (projectData.serviceSize && projectData.serviceSize !== data.service) {
      fieldsToUpdate.service = `${projectData.serviceSize}A`;
    }
    if (projectData.voltage && projectData.voltage !== data.voltage) {
      fieldsToUpdate.voltage = `${projectData.voltage}V`;
    }

    // Only trigger updates if there are actually fields to update
    if (Object.keys(fieldsToUpdate).length > 0) {
      Object.entries(fieldsToUpdate).forEach(([field, value]) => {
        onDataChange(field as keyof TitleBlockData, value as string);
      });
    }
  }, [
    autoFillFromProject,
    projectData?.projectName,
    projectData?.propertyAddress,
    projectData?.client,
    projectData?.engineerName,
    projectData?.serviceSize,
    projectData?.voltage,
    data.projectName,
    data.address,
    data.client,
    data.drawnBy,
    data.service,
    data.voltage,
    onDataChange
  ]);

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === titleBlockRef.current || (e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
      e.preventDefault();
    }
  }, [position]);

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      onPositionChange(newPosition);
    }
  }, [isDragging, dragStart, onPositionChange]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add global event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle field editing
  const startEditing = (field: keyof TitleBlockData) => {
    setEditingField(field);
    setTempValues({ [field]: data[field] || '' });
    setIsEditing(true);
  };

  const saveEdit = () => {
    if (editingField && tempValues[editingField] !== undefined) {
      onDataChange(editingField, tempValues[editingField] as string);
    }
    setEditingField(null);
    setTempValues({});
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setTempValues({});
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const renderEditableField = (
    label: string, 
    field: keyof TitleBlockData, 
    icon?: React.ReactNode,
    className = ''
  ) => {
    const value = data[field] || '';
    const isCurrentlyEditing = editingField === field;
    
    return (
      <div className={`relative group ${className}`}>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {label}
          </span>
          {editable && !isCurrentlyEditing && (
            <button
              onClick={() => startEditing(field)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
              title={`Edit ${label}`}
            >
              <Edit3 className="h-3 w-3 text-gray-500" />
            </button>
          )}
        </div>
        
        {isCurrentlyEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tempValues[field] || ''}
              onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
              onKeyDown={handleKeyPress}
              className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={label}
              autoFocus
            />
            <button
              onClick={saveEdit}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Save"
            >
              <Save className="h-3 w-3" />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              title="Cancel"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="px-2 py-1 text-sm font-medium bg-gray-50 border border-gray-200 rounded min-h-[28px] flex items-center">
            {value || (
              <span className="text-gray-400 italic">Click to edit</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderProfessionalTemplate = () => (
    <div className="bg-white border-2 border-gray-800 rounded-lg shadow-lg min-w-[400px]">
      {/* Header with drag handle */}
      <div 
        className="drag-handle bg-gradient-to-r from-blue-800 to-blue-600 text-white p-3 rounded-t-lg cursor-move flex items-center justify-between"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="h-4 w-4" />
          <div>
            <div className="font-bold text-lg">{data.projectName || 'Project Name'}</div>
            <div className="text-sm opacity-90">{data.drawingTitle || 'Single Line Diagram'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold text-lg">{data.drawingNumber || 'E-SLD-001'}</div>
          <div className="text-sm">Rev. {data.revision || 'A'}</div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Project Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            {renderEditableField('Project Name', 'projectName', <Building className="h-3 w-3 text-blue-600" />)}
          </div>
          <div>
            {renderEditableField('Drawing Number', 'drawingNumber', <FileText className="h-3 w-3 text-green-600" />)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            {renderEditableField('Client', 'client', <User className="h-3 w-3 text-purple-600" />)}
          </div>
          <div>
            {renderEditableField('Revision', 'revision')}
          </div>
        </div>

        {renderEditableField('Property Address', 'address', <Building className="h-3 w-3 text-orange-600" />)}

        {/* Technical Information */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            {renderEditableField('Service Size', 'service')}
          </div>
          <div>
            {renderEditableField('Voltage', 'voltage')}
          </div>
          <div>
            {renderEditableField('NEC Year', 'necCodeYear')}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            {renderEditableField('Date', 'date', <Calendar className="h-3 w-3 text-red-600" />)}
          </div>
          <div>
            {renderEditableField('Scale', 'scale')}
          </div>
        </div>

        {/* Professional Information */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Professional Responsibility</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              {renderEditableField('Drawn By', 'drawnBy', <User className="h-3 w-3 text-blue-600" />)}
            </div>
            <div>
              {renderEditableField('Checked By', 'checkedBy')}
            </div>
            <div>
              {renderEditableField('Approved By', 'approvedBy')}
            </div>
          </div>
        </div>

        {/* Permit Information */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Permit Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              {renderEditableField('Permit Number', 'permitNumber')}
            </div>
            <div>
              {renderEditableField('Authority (AHJ)', 'ahj')}
            </div>
          </div>
        </div>
      </div>

      {/* Auto-fill indicator */}
      {autoFillFromProject && (
        <div className="bg-blue-50 border-t border-blue-200 p-2 rounded-b-lg">
          <div className="flex items-center gap-2 text-xs text-blue-700">
            <RefreshCw className="h-3 w-3" />
            <span>Auto-fills from Load Calculator project information</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={titleBlockRef}
      className={`absolute z-10 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${
        isEditing ? 'z-50' : ''
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease'
      }}
    >
      {template === 'professional' && renderProfessionalTemplate()}
      
      {/* Standard template fallback */}
      {template !== 'professional' && (
        <div className="bg-white border-2 border-gray-800 rounded-lg shadow-lg p-4 min-w-[300px]">
          <div 
            className="drag-handle flex items-center gap-2 mb-4 p-2 bg-gray-100 rounded cursor-move"
            onMouseDown={handleMouseDown}
          >
            <Move className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Title Block - {template}</span>
          </div>
          
          <div className="space-y-3">
            {renderEditableField('Project', 'projectName')}
            {renderEditableField('Drawing', 'drawingNumber')}
            {renderEditableField('Client', 'client')}
            {renderEditableField('Date', 'date')}
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableTitleBlock;