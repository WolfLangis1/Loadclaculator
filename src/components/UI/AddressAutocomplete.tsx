import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect?: (place: {
    address: string;
    coordinates?: { latitude: number; longitude: number };
    components?: {
      streetNumber?: string;
      streetName?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  }) => void;
  placeholder?: string;
  className?: string;
  label?: string | React.ReactNode;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  labelClassName?: string;
  helperClassName?: string;
}

interface GooglePlace {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Enter address...",
  className = "",
  label,
  helperText,
  disabled = false,
  required = false,
  labelClassName = "block text-sm font-medium text-gray-700 mb-2",
  helperClassName = "mt-1 text-xs text-gray-500"
}) => {
  const [suggestions, setSuggestions] = useState<GooglePlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const USE_REAL_DATA = import.meta.env.VITE_USE_REAL_AERIAL_DATA === 'true';

  // Mock suggestions for development
  const mockSuggestions = [
    {
      place_id: 'mock_1',
      description: '123 Main St, Anytown, CA, USA',
      structured_formatting: {
        main_text: '123 Main St',
        secondary_text: 'Anytown, CA, USA'
      }
    },
    {
      place_id: 'mock_2', 
      description: '456 Oak Ave, Springfield, IL, USA',
      structured_formatting: {
        main_text: '456 Oak Ave',
        secondary_text: 'Springfield, IL, USA'
      }
    },
    {
      place_id: 'mock_3',
      description: '789 Pine Rd, Austin, TX, USA',
      structured_formatting: {
        main_text: '789 Pine Rd',
        secondary_text: 'Austin, TX, USA'
      }
    }
  ];

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      if (USE_REAL_DATA && GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
        // Use real Google Places API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=address&key=${GOOGLE_MAPS_API_KEY}`
        );
        
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.predictions || []);
        } else {
          console.warn('Places API request failed, using mock data');
          setSuggestions(mockSuggestions.filter(place => 
            place.description.toLowerCase().includes(query.toLowerCase())
          ));
        }
      } else {
        // Use mock data for development
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        setSuggestions(mockSuggestions.filter(place => 
          place.description.toLowerCase().includes(query.toLowerCase())
        ));
      }
    } catch (error) {
      console.error('Places search failed:', error);
      setSuggestions(mockSuggestions.filter(place => 
        place.description.toLowerCase().includes(query.toLowerCase())
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId: string) => {
    if (!USE_REAL_DATA || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
      // Return mock place details
      return {
        address: value,
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        components: {
          streetNumber: '123',
          streetName: 'Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US'
        }
      };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry,address_components&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const result = data.result;
        
        // Parse address components
        const components: any = {};
        result.address_components?.forEach((component: any) => {
          if (component.types.includes('street_number')) {
            components.streetNumber = component.long_name;
          }
          if (component.types.includes('route')) {
            components.streetName = component.long_name;
          }
          if (component.types.includes('locality')) {
            components.city = component.long_name;
          }
          if (component.types.includes('administrative_area_level_1')) {
            components.state = component.short_name;
          }
          if (component.types.includes('postal_code')) {
            components.zipCode = component.long_name;
          }
          if (component.types.includes('country')) {
            components.country = component.short_name;
          }
        });

        return {
          address: result.formatted_address,
          coordinates: {
            latitude: result.geometry.location.lat,
            longitude: result.geometry.location.lng
          },
          components
        };
      }
    } catch (error) {
      console.error('Place details failed:', error);
    }

    return null;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Debounce search
    timeoutRef.current = setTimeout(() => {
      searchPlaces(newValue);
      setShowSuggestions(true);
    }, 300);
  };

  const handleSuggestionClick = async (suggestion: GooglePlace) => {
    onChange(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    if (onPlaceSelect) {
      const placeDetails = await getPlaceDetails(suggestion.place_id);
      if (placeDetails) {
        onPlaceSelect(placeDetails);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  const handleFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {label && (
        <label className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
          autoComplete="off"
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {suggestion.structured_formatting.secondary_text}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {helperText && (
        <p className={helperClassName}>{helperText}</p>
      )}
      
      {!USE_REAL_DATA && (
        <p className="mt-1 text-xs text-amber-600">
          ⚠️ Using mock address suggestions - Enable VITE_USE_REAL_AERIAL_DATA for real Google Places
        </p>
      )}
    </div>
  );
};