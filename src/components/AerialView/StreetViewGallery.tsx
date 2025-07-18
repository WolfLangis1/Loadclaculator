import React, { useState, useCallback } from 'react';
import { Camera, Download, AlertCircle, RefreshCw, Edit } from 'lucide-react';
import { useAerialView } from '../../context/AerialViewContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { AttachmentService } from '../../services/attachmentService';
import { CRMProjectIntegrationService } from '../../services/crmProjectIntegrationService';

interface StreetViewImageProps {
  image: {
    imageUrl: string;
    label: string;
    heading: number;
  };
  onFallback: () => void;
  onEdit?: (imageUrl: string, label: string) => void;
}

const StreetViewImage: React.FC<StreetViewImageProps> = ({ image, onFallback, onEdit }) => {
  const { settings } = useProjectSettings();
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [showCopyright, setShowCopyright] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageStatus('loaded');
    setShowCopyright(true);
  }, []);

  const handleImageError = useCallback(() => {
    console.warn(`Street view image failed to load: ${image.label}`, image.imageUrl);
    setImageStatus('error');
    onFallback();
  }, [image.label, image.imageUrl, onFallback]);

  const handleRetry = useCallback(() => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      setImageStatus('loading');
      const img = new Image();
      img.onload = handleImageLoad;
      img.onerror = handleImageError;
      img.src = `${image.imageUrl}&retry=${Date.now()}`;
    }
  }, [retryCount, image.imageUrl, handleImageLoad, handleImageError]);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(image.imageUrl);
      const blob = await response.blob();
      const filename = `street-view-${image.label.toLowerCase().replace(/\s+/g, '-')}.jpg`;
      
      // Save locally
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      // Save to project assets
      await AttachmentService.saveProjectAsset(
        'current',
        filename,
        blob,
        'street_view',
        'streetview'
      );

      // Auto-save to CRM if customer exists
      try {
        const lastCRMCustomerId = localStorage.getItem('lastCRMCustomerId');
        
        if (lastCRMCustomerId) {
          await CRMProjectIntegrationService.saveAerialImageToCRM(
            lastCRMCustomerId,
            blob,
            filename,
            `Street view ${image.label} - ${settings.projectInfo.propertyAddress || 'project location'}`
          );
          
          console.log(`✅ Street view ${image.label} automatically saved to CRM customer attachments`);
        }
      } catch (crmError) {
        console.warn('Failed to save street view to CRM (continuing with local save):', crmError);
      }
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  }, [image.imageUrl, image.label, settings.projectInfo.propertyAddress]);

  const renderErrorFallback = () => (
    <div className="w-full h-48 bg-gray-100 border border-gray-200 rounded-lg flex flex-col items-center justify-center">
      <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-600 mb-2">Street view unavailable</p>
      <p className="text-xs text-gray-500 text-center mb-3">
        No street view imagery available for {image.label.toLowerCase()}
      </p>
      {retryCount < 2 && (
        <button
          onClick={handleRetry}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      )}
    </div>
  );

  const renderLoadingState = () => (
    <div className="w-full h-48 bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
        <p className="text-sm text-gray-600">Loading {image.label.toLowerCase()}...</p>
      </div>
    </div>
  );

  return (
    <div className="text-center">
      {imageStatus === 'loading' && renderLoadingState()}
      {imageStatus === 'error' && renderErrorFallback()}
      {imageStatus !== 'error' && (
        <div className="relative">
          <img
            src={image.imageUrl}
            alt={image.label}
            className={`w-full h-auto border border-gray-200 rounded-lg ${
              imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageStatus === 'loading' ? 'none' : 'block' }}
          />
          {imageStatus === 'loaded' && (
            <>
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={handleDownload}
                  className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                  title="Download image"
                >
                  <Download className="h-4 w-4" />
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(image.imageUrl, image.label)}
                    className="p-1 bg-black bg-opacity-50 text-white rounded hover:bg-opacity-70"
                    title="Edit in Photo Editor"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          )}
          {showCopyright && imageStatus === 'loaded' && (
            <div className="absolute bottom-2 right-2 text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
              © Google
            </div>
          )}
        </div>
      )}
      <p className="text-sm font-medium text-gray-700 mt-2">{image.label}</p>
    </div>
  );
};

interface StreetViewGalleryProps {
  onEditImage?: (imageUrl: string, imageType: 'streetview', metadata: { label: string }) => void;
}

export const StreetViewGallery: React.FC<StreetViewGalleryProps> = ({ onEditImage }) => {
  const { state } = useAerialView();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageFallback = useCallback((imageUrl: string) => {
    setFailedImages(prev => new Set(prev).add(imageUrl));
  }, []);

  const handleEditImage = useCallback((imageUrl: string, label: string) => {
    if (onEditImage) {
      onEditImage(imageUrl, 'streetview', { label });
    }
  }, [onEditImage]);

  const availableImages = state.streetViewImages.filter(
    image => !failedImages.has(image.imageUrl)
  );

  if (!state.streetViewImages.length) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Camera className="h-5 w-5 text-purple-600" />
        Street View Gallery
      </h4>
      
      {availableImages.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">No street view images available for this location</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableImages.map((image, index) => (
            <StreetViewImage
              key={`${image.imageUrl}-${index}`}
              image={image}
              onFallback={() => handleImageFallback(image.imageUrl)}
              onEdit={onEditImage ? handleEditImage : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};