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
    if (!state.address.trim()) {
      console.log('🔍 No address to search');
      setError('Please enter an address to search');
      return;
    }

    console.log('🔍 Starting address search for:', state.address);
    setLoading(true);
    setError(null);

    try {
      // Step 1: Geocoding
      console.log('🔍 Step 1: Geocoding address...');
      let geocodeResult;
      try {
        geocodeResult = await SecureAerialViewService.geocodeAddress(state.address);
        console.log('🔍 Geocode result:', geocodeResult);
      } catch (geocodeError) {
        console.error('🔍 Geocoding failed:', geocodeError);
        throw new Error(`Address lookup failed: ${geocodeError instanceof Error ? geocodeError.message : 'Unknown geocoding error'}`);
      }
      
      if (!geocodeResult) {
        throw new Error('No results found for this address. Please try a different address.');
      }

      if (!geocodeResult.coordinates || !geocodeResult.coordinates.latitude || !geocodeResult.coordinates.longitude) {
        throw new Error('Invalid coordinates received from geocoding service');
      }
      
      setCoordinates(geocodeResult.coordinates);
      updateProjectInfo({ propertyAddress: geocodeResult.address });
      console.log('✅ Geocoding successful, coordinates set');
      
      // Step 2: Satellite Image
      console.log('🔍 Step 2: Getting satellite image...');
      let satelliteSuccess = false;
      try {
        const satelliteResult = await SecureAerialViewService.getSatelliteImagery(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude,
          { width: 800, height: 600, zoom: state.zoom }
        );
        console.log('🔍 Satellite result:', satelliteResult);
        
        if (satelliteResult && satelliteResult.success && satelliteResult.data && satelliteResult.data.imageUrl) {
          setSatelliteImage(satelliteResult.data.imageUrl);
          satelliteSuccess = true;
          console.log('✅ Satellite image loaded successfully');
        } else {
          console.warn('🔍 Satellite image failed:', satelliteResult?.error || 'No image URL returned');
        }
      } catch (satelliteError) {
        console.error('🔍 Satellite image error:', satelliteError);
      }
      
      // Step 3: Street View Images
      console.log('🔍 Step 3: Getting street view images...');
      let streetViewSuccess = false;
      try {
        const streetViewResult = await SecureAerialViewService.getMultiAngleStreetView(
          geocodeResult.coordinates.latitude,
          geocodeResult.coordinates.longitude
        );
        console.log('🔍 Street view result:', streetViewResult);
        
        if (streetViewResult && Array.isArray(streetViewResult) && streetViewResult.length > 0) {
          // Validate that we have actual image URLs
          const validImages = streetViewResult.filter(img => 
            img && img.imageUrl && !img.imageUrl.includes('placeholder')
          );
          
          if (validImages.length > 0) {
            setStreetViewImages(streetViewResult);
            streetViewSuccess = true;
            console.log(`✅ Street view images loaded: ${validImages.length} valid images`);
          } else {
            console.warn('🔍 No valid street view images available (all placeholders)');
          }
        } else {
          console.warn('🔍 Street view failed or no images returned');
        }
      } catch (streetViewError) {
        console.error('🔍 Street view error:', streetViewError);
      }
      
      // Final status
      if (satelliteSuccess || streetViewSuccess) {
        console.log('✅ Address search completed successfully');
        if (!satelliteSuccess) {
          setError('Address found, but satellite imagery is not available');
        } else if (!streetViewSuccess) {
          setError('Address found with satellite imagery, but street view is not available');
        }
      } else {
        throw new Error('Address found, but no imagery is available for this location');
      }
      
    } catch (error) {
      console.error('🔍 Address search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Search failed: ${errorMessage}`);
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
            disabled={!state.address.trim() || state.ui.loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {state.ui.loading ? (
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
        
        {state.ui.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{state.ui.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};