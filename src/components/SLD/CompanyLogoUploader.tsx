/**
 * Company Logo Uploader Component
 * 
 * Allows uploading, positioning, and managing company logos for SLD diagrams
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, RotateCcw, Move, Maximize2, Download, Settings, Image as ImageIcon } from 'lucide-react';

interface CompanyLogoUploaderProps {
  position?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  onLogoChange?: (logoData: string | null) => void;
  isVisible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  titleBlockPosition?: { x: number; y: number };
}

interface LogoSettings {
  width: number;
  height: number;
  opacity: number;
  borderRadius: number;
  rotation: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  preserveAspectRatio: boolean;
}

const DEFAULT_LOGO_SETTINGS: LogoSettings = {
  width: 120,
  height: 80,
  opacity: 100,
  borderRadius: 8,
  rotation: 0,
  backgroundColor: 'transparent',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  preserveAspectRatio: true
};

export const CompanyLogoUploader: React.FC<CompanyLogoUploaderProps> = ({
  position = { x: 50, y: 150 },
  onPositionChange,
  onLogoChange,
  isVisible = true,
  onVisibilityChange,
  titleBlockPosition = { x: 50, y: 50 }
}) => {
  const [logoData, setLogoData] = useState<string | null>(null);
  const [logoSettings, setLogoSettings] = useState<LogoSettings>(DEFAULT_LOGO_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Load saved logo and settings from localStorage
  useEffect(() => {
    const savedLogo = localStorage.getItem('companyLogo');
    const savedSettings = localStorage.getItem('companyLogoSettings');
    const savedPosition = localStorage.getItem('companyLogoPosition');

    if (savedLogo) {
      setLogoData(savedLogo);
    }

    if (savedSettings) {
      try {
        setLogoSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.warn('Failed to parse saved logo settings');
      }
    }

    if (savedPosition && onPositionChange) {
      try {
        const pos = JSON.parse(savedPosition);
        onPositionChange(pos);
      } catch (error) {
        console.warn('Failed to parse saved logo position');
      }
    }
  }, [onPositionChange]);

  // Auto-position relative to title block
  useEffect(() => {
    if (titleBlockPosition && onPositionChange) {
      const newPosition = {
        x: titleBlockPosition.x + 450, // Position to the right of title block
        y: titleBlockPosition.y + 10   // Slight vertical offset
      };
      onPositionChange(newPosition);
    }
  }, [titleBlockPosition, onPositionChange]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoData(result);
      setUploadError(null);
      
      // Save to localStorage for persistence
      localStorage.setItem('companyLogo', result);
      
      if (onLogoChange) {
        onLogoChange(result);
      }
    };

    reader.onerror = () => {
      setUploadError('Failed to read file');
    };

    reader.readAsDataURL(file);
  }, [onLogoChange]);

  // Handle drag start
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (isEditing) return;
    
    event.preventDefault();
    setIsDragging(true);
    
    const rect = logoRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  }, [isEditing]);

  // Handle drag move
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging || !onPositionChange) return;

    const newPosition = {
      x: event.clientX - dragOffset.x,
      y: event.clientY - dragOffset.y
    };

    onPositionChange(newPosition);
    localStorage.setItem('companyLogoPosition', JSON.stringify(newPosition));
  }, [isDragging, dragOffset, onPositionChange]);

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Setup drag event listeners
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

  // Handle logo removal
  const handleRemoveLogo = useCallback(() => {
    setLogoData(null);
    setUploadError(null);
    localStorage.removeItem('companyLogo');
    
    if (onLogoChange) {
      onLogoChange(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onLogoChange]);

  // Handle settings change
  const handleSettingsChange = useCallback((key: keyof LogoSettings, value: any) => {
    const newSettings = { ...logoSettings, [key]: value };
    setLogoSettings(newSettings);
    localStorage.setItem('companyLogoSettings', JSON.stringify(newSettings));
  }, [logoSettings]);

  // Download logo
  const handleDownloadLogo = useCallback(() => {
    if (!logoData) return;

    const link = document.createElement('a');
    link.href = logoData;
    link.download = 'company-logo.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [logoData]);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Logo Display */}
      <div
        ref={logoRef}
        className={`absolute cursor-move select-none transition-all duration-200 ${
          isDragging ? 'opacity-80 z-50' : 'z-20'
        } ${logoData ? 'hover:shadow-lg' : ''}`}
        style={{
          left: position.x,
          top: position.y,
          width: logoSettings.width,
          height: logoSettings.height,
          transform: `rotate(${logoSettings.rotation}deg)`,
          opacity: logoSettings.opacity / 100
        }}
        onMouseDown={handleMouseDown}
      >
        {logoData ? (
          <div className="relative w-full h-full group">
            <img
              src={logoData}
              alt="Company Logo"
              className={`w-full h-full ${logoSettings.preserveAspectRatio ? 'object-contain' : 'object-fill'}`}
              style={{
                borderRadius: logoSettings.borderRadius,
                backgroundColor: logoSettings.backgroundColor,
                border: `${logoSettings.borderWidth}px solid ${logoSettings.borderColor}`
              }}
              draggable={false}
            />
            
            {/* Logo Controls */}
            <div className="absolute -top-8 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 rounded shadow-sm">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Edit Logo Settings"
              >
                <Settings className="h-3 w-3" />
              </button>
              <button
                onClick={handleDownloadLogo}
                className="p-1 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded"
                title="Download Logo"
              >
                <Download className="h-3 w-3" />
              </button>
              <button
                onClick={handleRemoveLogo}
                className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                title="Remove Logo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
            <div className="text-xs text-gray-600 text-center">
              <div className="font-medium">Add Company Logo</div>
              <div>Click to upload</div>
            </div>
          </div>
        )}

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Settings Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Logo Settings</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Size Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width (px)
                  </label>
                  <input
                    type="number"
                    value={logoSettings.width}
                    onChange={(e) => handleSettingsChange('width', parseInt(e.target.value) || 120)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    min="50"
                    max="500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height (px)
                  </label>
                  <input
                    type="number"
                    value={logoSettings.height}
                    onChange={(e) => handleSettingsChange('height', parseInt(e.target.value) || 80)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    min="30"
                    max="300"
                  />
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opacity (%)
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={logoSettings.opacity}
                    onChange={(e) => handleSettingsChange('opacity', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{logoSettings.opacity}%</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Border Radius (px)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={logoSettings.borderRadius}
                    onChange={(e) => handleSettingsChange('borderRadius', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 text-center">{logoSettings.borderRadius}px</div>
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rotation (degrees)
                </label>
                <input
                  type="range"
                  min="-45"
                  max="45"
                  value={logoSettings.rotation}
                  onChange={(e) => handleSettingsChange('rotation', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 text-center">{logoSettings.rotation}°</div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={logoSettings.preserveAspectRatio}
                    onChange={(e) => handleSettingsChange('preserveAspectRatio', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Preserve aspect ratio</span>
                </label>
              </div>

              {/* Upload New Logo */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Upload className="h-4 w-4" />
                  Upload New Logo
                </button>
              </div>

              {/* Error Display */}
              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-700">{uploadError}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <button
                onClick={() => setLogoSettings(DEFAULT_LOGO_SETTINGS)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyLogoUploader;