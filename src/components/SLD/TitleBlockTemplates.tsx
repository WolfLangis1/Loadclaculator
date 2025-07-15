/**
 * Professional Title Block Templates for SLD Diagrams
 * 
 * Provides industry-standard title blocks and drawing borders for electrical permit submissions
 * Follows ANSI/IEEE standards and AHJ requirements for professional documentation
 */

import React from 'react';
import { Calendar, User, FileText, Building, Zap, Shield } from 'lucide-react';

export interface TitleBlockData {
  projectName: string;
  projectNumber?: string;
  drawingTitle: string;
  drawingNumber: string;
  revision: string;
  date: string;
  drawnBy: string;
  checkedBy?: string;
  approvedBy?: string;
  client: string;
  address: string;
  permitNumber?: string;
  ahj?: string; // Authority Having Jurisdiction
  scale: string;
  sheetNumber: string;
  totalSheets: string;
  necCodeYear?: '2017' | '2020' | '2023';
  voltage?: string;
  service?: string;
  description?: string;
}

export interface TitleBlockProps {
  data: TitleBlockData;
  template: 'standard' | 'professional' | 'engineering' | 'permit';
  paperSize: 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3' | 'a2' | 'a1';
  orientation: 'portrait' | 'landscape';
  onDataChange?: (field: keyof TitleBlockData, value: string) => void;
  editable?: boolean;
}

// Professional drawing dimensions (in pixels at 300 DPI)
const DRAWING_DIMENSIONS = {
  letter: { width: 2550, height: 3300, titleHeight: 400 },
  legal: { width: 2550, height: 4200, titleHeight: 400 },
  tabloid: { width: 3300, height: 5100, titleHeight: 500 },
  a4: { width: 2480, height: 3508, titleHeight: 400 },
  a3: { width: 3508, height: 4961, titleHeight: 500 },
  a2: { width: 4961, height: 7016, titleHeight: 600 },
  a1: { width: 7016, height: 9933, titleHeight: 700 }
};

/**
 * Standard Engineering Title Block Template
 */
export const StandardTitleBlock: React.FC<TitleBlockProps> = ({
  data,
  paperSize,
  orientation,
  onDataChange,
  editable = false
}) => {
  const dims = DRAWING_DIMENSIONS[paperSize];
  const width = orientation === 'landscape' ? dims.height : dims.width;
  const height = dims.titleHeight;

  const renderField = (label: string, field: keyof TitleBlockData, className = '') => {
    const value = data[field] || '';
    return (
      <div className={`border border-gray-700 ${className}`}>
        <div className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 border-b border-gray-700">
          {label}
        </div>
        {editable && onDataChange ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onDataChange(field, e.target.value)}
            className="w-full px-2 py-1 text-sm border-none outline-none"
          />
        ) : (
          <div className="px-2 py-1 text-sm font-medium">{value}</div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="bg-white border-2 border-gray-800"
      style={{ width: width * 0.3, height }}
    >
      {/* Company Header */}
      <div className="bg-blue-600 text-white p-2 text-center">
        <div className="font-bold text-lg">ELECTRICAL SINGLE LINE DIAGRAM</div>
        <div className="text-sm">Professional Engineering Services</div>
      </div>

      {/* Title Block Grid */}
      <div className="grid grid-cols-4 h-full">
        {/* Left Column - Project Info */}
        <div className="col-span-2 flex flex-col">
          {renderField('PROJECT NAME', 'projectName', 'flex-1')}
          {renderField('CLIENT', 'client', 'flex-1')}
          {renderField('ADDRESS', 'address', 'flex-1')}
          {renderField('DRAWING TITLE', 'drawingTitle', 'flex-1')}
        </div>

        {/* Middle Column - Technical Info */}
        <div className="flex flex-col">
          {renderField('DRAWING NO.', 'drawingNumber')}
          {renderField('REVISION', 'revision')}
          {renderField('DATE', 'date')}
          {renderField('SCALE', 'scale')}
          {renderField('SHEET', 'sheetNumber')}
          {renderField('NEC YEAR', 'necCodeYear')}
        </div>

        {/* Right Column - Approval */}
        <div className="flex flex-col">
          {renderField('DRAWN BY', 'drawnBy')}
          {renderField('CHECKED BY', 'checkedBy')}
          {renderField('APPROVED BY', 'approvedBy')}
          {renderField('PERMIT NO.', 'permitNumber')}
          {renderField('AHJ', 'ahj')}
          <div className="border border-gray-700 flex-1 flex items-center justify-center">
            <div className="text-center">
              <Shield className="h-6 w-6 mx-auto text-green-600" />
              <div className="text-xs font-medium">NEC COMPLIANT</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Professional Engineering Title Block Template
 */
export const ProfessionalTitleBlock: React.FC<TitleBlockProps> = ({
  data,
  paperSize,
  orientation,
  onDataChange,
  editable = false
}) => {
  const dims = DRAWING_DIMENSIONS[paperSize];
  const width = orientation === 'landscape' ? dims.height : dims.width;
  const height = dims.titleHeight;

  return (
    <div 
      className="bg-white border-2 border-gray-900"
      style={{ width: width * 0.35, height }}
    >
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 text-white p-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-xl">{data.projectName}</div>
            <div className="text-sm opacity-90">{data.drawingTitle}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg">{data.drawingNumber}</div>
            <div className="text-sm">Rev. {data.revision}</div>
          </div>
        </div>
      </div>

      {/* Professional Details Grid */}
      <div className="p-2">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="col-span-2">
            <div className="text-xs font-medium text-gray-600 mb-1">CLIENT & PROJECT</div>
            <div className="text-sm font-bold">{data.client}</div>
            <div className="text-xs text-gray-700">{data.address}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">SERVICE INFO</div>
            <div className="text-sm">{data.service} Service</div>
            <div className="text-xs text-gray-700">{data.voltage}</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-2 text-xs">
          <div>
            <span className="font-medium text-gray-600">Scale:</span>
            <div>{data.scale}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Date:</span>
            <div>{data.date}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">Sheet:</span>
            <div>{data.sheetNumber} of {data.totalSheets}</div>
          </div>
          <div>
            <span className="font-medium text-gray-600">NEC:</span>
            <div>{data.necCodeYear}</div>
          </div>
        </div>

        {/* Professional Signatures */}
        <div className="grid grid-cols-3 gap-2 text-xs border-t pt-2">
          <div>
            <div className="font-medium text-gray-600">DRAWN BY:</div>
            <div className="border-b border-gray-400 pb-1">{data.drawnBy}</div>
          </div>
          <div>
            <div className="font-medium text-gray-600">CHECKED BY:</div>
            <div className="border-b border-gray-400 pb-1">{data.checkedBy}</div>
          </div>
          <div>
            <div className="font-medium text-gray-600">APPROVED BY:</div>
            <div className="border-b border-gray-400 pb-1">{data.approvedBy}</div>
          </div>
        </div>

        {/* Permit Information */}
        {(data.permitNumber || data.ahj) && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center justify-between text-xs">
              <div>
                <span className="font-medium">Permit #:</span> {data.permitNumber}
              </div>
              <div>
                <span className="font-medium">AHJ:</span> {data.ahj}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Engineering Firm Title Block Template
 */
export const EngineeringTitleBlock: React.FC<TitleBlockProps> = ({
  data,
  paperSize,
  orientation,
  onDataChange,
  editable = false
}) => {
  return (
    <div className="bg-white border-2 border-gray-900 p-4">
      {/* Engineering Firm Header */}
      <div className="text-center border-b-2 border-gray-800 pb-2 mb-3">
        <div className="font-bold text-lg">LICENSED ELECTRICAL ENGINEERING</div>
        <div className="text-sm text-gray-600">Professional Electrical Design Services</div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-xs">NEC {data.necCodeYear} Compliant</span>
          <Shield className="h-4 w-4 text-green-600" />
        </div>
      </div>

      {/* Main Title Block */}
      <div className="grid grid-cols-12 gap-1 text-xs">
        {/* Project Information */}
        <div className="col-span-8 border border-gray-700">
          <div className="bg-gray-200 px-2 py-1 font-bold">PROJECT INFORMATION</div>
          <div className="p-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Project:</strong> {data.projectName}
              </div>
              <div>
                <strong>Client:</strong> {data.client}
              </div>
              <div className="col-span-2">
                <strong>Address:</strong> {data.address}
              </div>
              <div>
                <strong>Drawing:</strong> {data.drawingTitle}
              </div>
              <div>
                <strong>Description:</strong> {data.description}
              </div>
            </div>
          </div>
        </div>

        {/* Drawing Control */}
        <div className="col-span-4 border border-gray-700">
          <div className="bg-gray-200 px-2 py-1 font-bold">DRAWING CONTROL</div>
          <div className="p-2 space-y-1">
            <div><strong>Dwg No:</strong> {data.drawingNumber}</div>
            <div><strong>Rev:</strong> {data.revision}</div>
            <div><strong>Date:</strong> {data.date}</div>
            <div><strong>Scale:</strong> {data.scale}</div>
            <div><strong>Sheet:</strong> {data.sheetNumber} of {data.totalSheets}</div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="col-span-6 border border-gray-700">
          <div className="bg-gray-200 px-2 py-1 font-bold">ELECTRICAL SPECIFICATIONS</div>
          <div className="p-2 space-y-1">
            <div><strong>Service:</strong> {data.service}</div>
            <div><strong>Voltage:</strong> {data.voltage}</div>
            <div><strong>NEC Year:</strong> {data.necCodeYear}</div>
            <div><strong>Permit #:</strong> {data.permitNumber}</div>
          </div>
        </div>

        {/* Professional Seals */}
        <div className="col-span-6 border border-gray-700">
          <div className="bg-gray-200 px-2 py-1 font-bold">PROFESSIONAL RESPONSIBILITY</div>
          <div className="p-2 space-y-1">
            <div><strong>Drawn:</strong> {data.drawnBy}</div>
            <div><strong>Checked:</strong> {data.checkedBy}</div>
            <div><strong>Approved:</strong> {data.approvedBy}</div>
            <div><strong>AHJ:</strong> {data.ahj}</div>
          </div>
        </div>
      </div>

      {/* Professional Stamp Area */}
      <div className="mt-3 border-2 border-gray-400 border-dashed p-2 text-center text-gray-500">
        <div className="text-sm">PROFESSIONAL ENGINEER STAMP</div>
        <div className="text-xs">To be applied before submittal</div>
      </div>
    </div>
  );
};

/**
 * Permit Submission Title Block Template
 */
export const PermitTitleBlock: React.FC<TitleBlockProps> = ({
  data,
  paperSize,
  orientation,
  onDataChange,
  editable = false
}) => {
  return (
    <div className="bg-white border-4 border-red-600">
      {/* Permit Header */}
      <div className="bg-red-600 text-white p-3 text-center">
        <div className="font-bold text-xl">ELECTRICAL PERMIT SUBMISSION</div>
        <div className="text-sm">Single Line Diagram - NEC {data.necCodeYear} Compliant</div>
      </div>

      {/* Permit Information Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Left Side - Project */}
          <div className="border-2 border-gray-300 p-3">
            <h3 className="font-bold text-lg mb-2 text-red-600">PROJECT DETAILS</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Project Name:</strong> {data.projectName}</div>
              <div><strong>Property Owner:</strong> {data.client}</div>
              <div><strong>Property Address:</strong> {data.address}</div>
              <div><strong>Drawing Title:</strong> {data.drawingTitle}</div>
              <div><strong>Project Number:</strong> {data.projectNumber}</div>
            </div>
          </div>

          {/* Right Side - Permit */}
          <div className="border-2 border-gray-300 p-3">
            <h3 className="font-bold text-lg mb-2 text-red-600">PERMIT INFORMATION</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Permit Number:</strong> {data.permitNumber}</div>
              <div><strong>Authority (AHJ):</strong> {data.ahj}</div>
              <div><strong>Submission Date:</strong> {data.date}</div>
              <div><strong>Drawing Number:</strong> {data.drawingNumber}</div>
              <div><strong>Revision:</strong> {data.revision}</div>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className="border-2 border-blue-300 p-3 mb-4">
          <h3 className="font-bold text-lg mb-2 text-blue-600">ELECTRICAL SYSTEM SPECIFICATIONS</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Service Size:</strong> {data.service}<br/>
              <strong>System Voltage:</strong> {data.voltage}<br/>
              <strong>NEC Code Year:</strong> {data.necCodeYear}
            </div>
            <div>
              <strong>Drawing Scale:</strong> {data.scale}<br/>
              <strong>Sheet Number:</strong> {data.sheetNumber} of {data.totalSheets}<br/>
              <strong>System Type:</strong> Residential/Commercial
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 border-2 border-green-600 rounded-full">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
              <div className="font-bold text-green-600 mt-1">NEC COMPLIANT</div>
            </div>
          </div>
        </div>

        {/* Professional Certification */}
        <div className="border-2 border-gray-800 p-3">
          <h3 className="font-bold text-lg mb-2">PROFESSIONAL CERTIFICATION</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center border-r">
              <div className="font-bold">DRAWN BY</div>
              <div className="mt-2 border-b-2 border-gray-400 pb-2">{data.drawnBy}</div>
              <div className="text-xs text-gray-600 mt-1">Designer</div>
            </div>
            <div className="text-center border-r">
              <div className="font-bold">CHECKED BY</div>
              <div className="mt-2 border-b-2 border-gray-400 pb-2">{data.checkedBy}</div>
              <div className="text-xs text-gray-600 mt-1">Reviewer</div>
            </div>
            <div className="text-center">
              <div className="font-bold">APPROVED BY</div>
              <div className="mt-2 border-b-2 border-gray-400 pb-2">{data.approvedBy}</div>
              <div className="text-xs text-gray-600 mt-1">Professional Engineer</div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 p-2 bg-yellow-50 border-l-4 border-yellow-400 text-xs text-gray-700">
          <strong>NOTICE:</strong> This drawing has been prepared in accordance with the {data.necCodeYear} National Electrical Code. 
          All work shall be performed by licensed electrical contractors in accordance with local codes and regulations.
        </div>
      </div>
    </div>
  );
};

/**
 * Drawing Border Component
 */
export const DrawingBorder: React.FC<{
  paperSize: 'letter' | 'legal' | 'tabloid' | 'a4' | 'a3' | 'a2' | 'a1';
  orientation: 'portrait' | 'landscape';
  marginSize: 'standard' | 'large';
  showGrid?: boolean;
  children: React.ReactNode;
}> = ({ paperSize, orientation, marginSize, showGrid = false, children }) => {
  const dims = DRAWING_DIMENSIONS[paperSize];
  const width = orientation === 'landscape' ? dims.height : dims.width;
  const height = orientation === 'landscape' ? dims.width : dims.height;
  const margin = marginSize === 'large' ? 100 : 50;

  return (
    <div 
      className="relative bg-white border-4 border-gray-900"
      style={{ 
        width: width * 0.4, 
        height: height * 0.4,
        minHeight: '600px'
      }}
    >
      {/* Drawing Grid */}
      {showGrid && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, #e5e7eb 1px, transparent 1px),
              linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            margin: `${margin}px`
          }}
        />
      )}

      {/* Drawing Area */}
      <div 
        className="absolute bg-white"
        style={{
          top: margin,
          left: margin,
          right: margin,
          bottom: margin + 100, // Space for title block
          overflow: 'hidden'
        }}
      >
        {children}
      </div>

      {/* Professional Border Markings */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        {/* Corner Registration Marks */}
        <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-gray-900"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-gray-900"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-gray-900"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-gray-900"></div>
      </div>
    </div>
  );
};

export default {
  StandardTitleBlock,
  ProfessionalTitleBlock,
  EngineeringTitleBlock,
  PermitTitleBlock,
  DrawingBorder
};