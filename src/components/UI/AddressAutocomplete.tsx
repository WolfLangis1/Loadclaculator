import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { SecureApiService } from '../../services/secureApiService';

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
  const [apiAvailable, setApiAvailable] = useState(true);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Mock suggestions for development/fallback
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

  // Check API availability on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const isHealthy = await SecureApiService.healthCheck();
        setApiAvailable(isHealthy);
      } catch (error) {
        console.warn('API health check failed, using fallback mode');
        setApiAvailable(false);
      }
    };
    
    checkApiHealth();
  }, []);

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      if (apiAvailable) {
        // Use secure backend API
        const result = await SecureApiService.getPlaceSuggestions(query);
        
        if (result.predictions) {
          setSuggestions(result.predictions);
        } else {
          console.warn('No predictions returned from secure API, using mock data');
          setSuggestions(mockSuggestions.filter(place => 
            place.description.toLowerCase().includes(query.toLowerCase())
          ));
        }
      } else {
        // Use mock data for development/fallback
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
    if (!apiAvailable || placeId.startsWith('mock_')) {
      // Return mock place details for fallback
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
      // Use secure backend for place details
      const result = await SecureApiService.getPlaceSuggestions(value, 'session-token');
      
      if (result.result) {
        const placeResult = result.result;
        
        // Parse address components
        const components: any = {};
        placeResult.address_components?.forEach((component: any) => {
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
          address: placeResult.formatted_address,
          coordinates: {
            latitude: placeResult.geometry.location.lat,
            longitude: placeResult.geometry.location.lng
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
        setSuggestions([]);
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
    if (value.length >= 3 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Auto-scroll to selected suggestion
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className={labelClassName}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
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
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center ${
                index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <MapPin className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {suggestion.structured_formatting.main_text}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {helperText && (
        <p className={helperClassName}>
          {helperText}
          {!apiAvailable && (
            <span className="text-yellow-600 ml-2">
              ⚠️ Using mock address suggestions - Secure API not available
            </span>
          )}
        </p>
      )}
    </div>
  );
};