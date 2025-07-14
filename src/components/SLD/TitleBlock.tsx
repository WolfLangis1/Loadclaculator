/**
 * Professional Title Block Component
 * 
 * IEEE 315 compliant title block for professional electrical diagrams
 */

import React from 'react';
import { Calendar, User, FileText, Hash, Building } from 'lucide-react';

export interface TitleBlockData {
  projectName: string;
  projectNumber: string;
  drawingTitle: string;
  drawingNumber: string;
  revision: string;
  dateCreated: string;
  dateModified: string;
  drawnBy: string;
  checkedBy: string;
  approvedBy: string;
  engineerStamp?: string;
  companyName: string;
  companyAddress: string;
  scale: string;
  sheetNumber: string;
  totalSheets: string;
  necCodeYear: string;
  jurisdictionCode?: string;
  permitNumber?: string;
}

interface TitleBlockProps {
  data: TitleBlockData;
  size: 'A' | 'B' | 'C' | 'D' | 'E'; // ANSI paper sizes
  orientation: 'landscape' | 'portrait';
  editable?: boolean;
  onDataChange?: (data: Partial<TitleBlockData>) => void;
  className?: string;
}

const TITLE_BLOCK_DIMENSIONS = {
  A: { width: 432, height: 108 }, // 6" x 1.5" at 72 DPI
  B: { width: 504, height: 108 }, // 7" x 1.5"
  C: { width: 576, height: 144 }, // 8" x 2"
  D: { width: 720, height: 144 }, // 10" x 2"
  E: { width: 864, height: 180 }  // 12" x 2.5"
};

export const TitleBlock: React.FC<TitleBlockProps> = ({
  data,
  size,
  orientation,
  editable = false,
  onDataChange,
  className = ''
}) => {
  const dimensions = TITLE_BLOCK_DIMENSIONS[size] || TITLE_BLOCK_DIMENSIONS.C; // Default to size C
  const isLandscape = orientation === 'landscape';
  
  const blockWidth = isLandscape ? dimensions.width : dimensions.height;
  const blockHeight = isLandscape ? dimensions.height : dimensions.width;

  const handleFieldChange = (field: keyof TitleBlockData, value: string) => {
    if (editable && onDataChange) {
      onDataChange({ [field]: value });
    }
  };

  const EditableField: React.FC<{
    field: keyof TitleBlockData;
    className?: string;
    maxLength?: number;
  }> = ({ field, className: fieldClassName = '', maxLength }) => {
    const value = data[field] || '';
    
    if (editable) {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleFieldChange(field, e.target.value)}
          className={`bg-transparent border-none outline-none w-full ${fieldClassName}`}
          maxLength={maxLength}
        />
      );
    }
    
    return <span className={fieldClassName}>{value}</span>;
  };

  return (
    <div
      className={`border-2 border-gray-800 bg-white font-mono ${className}`}
      style={{ width: blockWidth, height: blockHeight }}
    >
      <svg
        width={blockWidth}
        height={blockHeight}
        viewBox={`0 0 ${blockWidth} ${blockHeight}`}
        className="w-full h-full"
      >
        {/* Main border */}
        <rect
          x="2"
          y="2"
          width={blockWidth - 4}
          height={blockHeight - 4}
          fill="white"
          stroke="#1f2937"
          strokeWidth="2"
        />

        {/* Company section */}
        <rect
          x="2"
          y="2"
          width={blockWidth - 4}
          height="32"
          fill="#f8fafc"
          stroke="#1f2937"
          strokeWidth="1"
        />

        {/* Drawing info section */}
        <rect
          x="2"
          y="34"
          width={blockWidth * 0.6}
          height={blockHeight - 36}
          fill="white"
          stroke="#1f2937"
          strokeWidth="1"
        />

        {/* Signatures section */}
        <rect
          x={blockWidth * 0.6 + 2}
          y="34"
          width={blockWidth * 0.4 - 4}
          height={blockHeight - 36}
          fill="#f8fafc"
          stroke="#1f2937"
          strokeWidth="1"
        />

        {/* Internal grid lines */}
        {/* Horizontal dividers */}
        <line
          x1={blockWidth * 0.6 + 2}
          y1="50"
          x2={blockWidth - 2}
          y2="50"
          stroke="#1f2937"
          strokeWidth="0.5"
        />
        <line
          x1={blockWidth * 0.6 + 2}
          y1="66"
          x2={blockWidth - 2}
          y2="66"
          stroke="#1f2937"
          strokeWidth="0.5"
        />
        <line
          x1={blockWidth * 0.6 + 2}
          y1="82"
          x2={blockWidth - 2}
          y2="82"
          stroke="#1f2937"
          strokeWidth="0.5"
        />

        {/* Vertical dividers in drawing info */}
        <line
          x1={blockWidth * 0.3}
          y1="34"
          x2={blockWidth * 0.3}
          y2={blockHeight - 2}
          stroke="#1f2937"
          strokeWidth="0.5"
        />

        {/* Vertical dividers in signatures */}
        <line
          x1={blockWidth * 0.8}
          y1="34"
          x2={blockWidth * 0.8}
          y2={blockHeight - 2}
          stroke="#1f2937"
          strokeWidth="0.5"
        />
      </svg>

      {/* Text content overlay */}
      <div className="absolute inset-0 p-1 text-xs">
        {/* Company Header */}
        <div className="h-8 flex items-center justify-center bg-gray-50 border-b border-gray-800">
          <div className="text-center">
            <div className="font-bold text-sm">
              <EditableField field="companyName" className="text-gray-900" />
            </div>
            <div className="text-xs text-gray-600">
              <EditableField field="companyAddress" />
            </div>
          </div>
        </div>

        <div className="flex h-full">
          {/* Left section - Drawing Information */}
          <div className="flex-1 p-2 space-y-1" style={{ width: '60%' }}>
            <div className="grid grid-cols-2 gap-2 h-full">
              {/* Left column */}
              <div className="space-y-1">
                <div>
                  <label className="text-gray-500 text-xs block">PROJECT NAME</label>
                  <EditableField 
                    field="projectName" 
                    className="font-medium text-gray-900 text-sm" 
                  />
                </div>
                
                <div>
                  <label className="text-gray-500 text-xs block">DRAWING TITLE</label>
                  <EditableField 
                    field="drawingTitle" 
                    className="font-medium text-gray-900 text-sm" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 text-xs block">SCALE</label>
                    <EditableField field="scale" className="text-gray-900" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs block">NEC</label>
                    <EditableField field="necCodeYear" className="text-gray-900" />
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-gray-500 text-xs block">PROJECT #</label>
                    <EditableField field="projectNumber" className="text-gray-900" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs block">DWG #</label>
                    <EditableField field="drawingNumber" className="text-gray-900" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-1">
                  <div>
                    <label className="text-gray-500 text-xs block">SHEET</label>
                    <EditableField field="sheetNumber" className="text-gray-900" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs block">OF</label>
                    <EditableField field="totalSheets" className="text-gray-900" />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs block">REV</label>
                    <EditableField field="revision" className="text-gray-900" />
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-500 text-xs block">DATE</label>
                  <EditableField field="dateModified" className="text-gray-900" />
                </div>
              </div>
            </div>
          </div>

          {/* Right section - Signatures */}
          <div className="border-l border-gray-800 p-2" style={{ width: '40%' }}>
            <div className="grid grid-cols-2 h-full text-xs">
              {/* Left signatures column */}
              <div className="space-y-3">
                <div>
                  <label className="text-gray-500 text-xs block mb-1">DRAWN BY</label>
                  <EditableField field="drawnBy" className="text-gray-900" />
                  <div className="text-gray-400 text-xs mt-1">
                    <EditableField field="dateCreated" />
                  </div>
                </div>
                
                <div>
                  <label className="text-gray-500 text-xs block mb-1">CHECKED BY</label>
                  <EditableField field="checkedBy" className="text-gray-900" />
                </div>
                
                <div>
                  <label className="text-gray-500 text-xs block mb-1">APPROVED BY</label>
                  <EditableField field="approvedBy" className="text-gray-900" />
                </div>
              </div>

              {/* Right info column */}
              <div className="border-l border-gray-300 pl-2 space-y-2">
                {data.permitNumber && (
                  <div>
                    <label className="text-gray-500 text-xs block">PERMIT #</label>
                    <EditableField field="permitNumber" className="text-gray-900" />
                  </div>
                )}
                
                {data.jurisdictionCode && (
                  <div>
                    <label className="text-gray-500 text-xs block">JURISDICTION</label>
                    <EditableField field="jurisdictionCode" className="text-gray-900" />
                  </div>
                )}
                
                {data.engineerStamp && (
                  <div className="mt-4">
                    <div className="border border-gray-400 rounded p-2 text-center">
                      <div className="text-xs text-gray-600">ENGINEER SEAL</div>
                      <div className="mt-1 text-xs">
                        <EditableField field="engineerStamp" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};