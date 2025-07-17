import React, { useCallback } from 'react';
import { Search, MapPin, AlertCircle } from 'lucide-react';
import { useAerialView } from '../../context/AerialViewContext';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { AddressAutocomplete } from '../UI/AddressAutocomplete';
import { SecureAerialViewService } from '../../services/secureAerialViewService';

export const AddressSearchControls: React.FC = () => {
  const {
    state,
    setAddress,
    setCoordinates,
    setSatelliteImage,
    setStreetViewImages,
    setLoading,
    setError
  } = useAerialView();
  
  const { updateProjectInfo } = useProjectSettings();

  const handleAddressSearch = useCallback(async () => {
    if (!state.address.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const geocodeResult = await SecureAerialViewService.geocodeAddress(state.address);
      
      if (!geocodeResult) {
        throw new Error('Geocoding failed');
      }
      
      setCoordinates(geocodeResult.coordinates);
      updateProjectInfo({ propertyAddress: geocodeResult.address });
      
      // Get satellite image
      const satelliteResult = await SecureAerialViewService.getSatelliteImagery(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude,
        { width: 800, height: 600, zoom: state.zoom }
      );
      
      if (satelliteResult.success) {
        setSatelliteImage(satelliteResult.data.imageUrl);
      }
      
      // Get street view images
      const streetViewResult = await SecureAerialViewService.getMultiAngleStreetView(
        geocodeResult.coordinates.latitude,
        geocodeResult.coordinates.longitude
      );
      
      if (streetViewResult && streetViewResult.length > 0) {
        setStreetViewImages(streetViewResult);
      }
      
    } catch (error) {
      console.error('Error fetching aerial view data:', error);
      setError('Failed to fetch aerial view data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [state.address, state.zoom, setLoading, setError, setCoordinates, setSatelliteImage, setStreetViewImages, updateProjectInfo]);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          Property Address
        </h3>
        
        <div className="flex gap-2">
          <div className="flex-1">
            <AddressAutocomplete
              value={state.address}
              onChange={setAddress}
              placeholder="Enter property address..."
              className="w-full"
            />
          </div>
          <button
            onClick={handleAddressSearch}
            disabled={!state.address.trim() || state.loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {state.loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search
              </>
            )}
          </button>
        </div>
        
        {state.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{state.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};