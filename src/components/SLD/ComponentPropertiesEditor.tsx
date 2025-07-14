import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import type { SLDComponent } from '../../types/sld';

interface ComponentPropertiesEditorProps {
  component: SLDComponent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: SLDComponent) => void;
  readonly?: boolean;
}

interface EditableField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: { value: string | number; label: string }[];
  unit?: string;
  validation?: (value: any) => string | null;
  required?: boolean;
}

export const ComponentPropertiesEditor: React.FC<ComponentPropertiesEditorProps> = ({
  component,
  isOpen,
  onClose,
  onSave,
  readonly = false
}) => {
  const [editedComponent, setEditedComponent] = useState<SLDComponent | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (component) {
      setEditedComponent({ ...component });
      setErrors({});
    }
  }, [component]);

  if (!isOpen || !component || !editedComponent) return null;

  // Define editable fields based on component type
  const getEditableFields = (type: string): EditableField[] => {
    const commonFields: EditableField[] = [
      {
        key: 'name',
        label: 'Component Name',
        type: 'text',
        required: true
      }
    ];

    switch (type) {
      case 'main_panel':
        return [
          ...commonFields,
          {
            key: 'rating',
            label: 'Panel Rating',
            type: 'select',
            options: [
              { value: 100, label: '100A' },
              { value: 125, label: '125A' },
              { value: 150, label: '150A' },
              { value: 200, label: '200A' },
              { value: 225, label: '225A' },
              { value: 400, label: '400A' },
              { value: 600, label: '600A' },
              { value: 800, label: '800A' }
            ],
            unit: 'A',
            required: true
          },
          {
            key: 'busRating',
            label: 'Bus Rating',
            type: 'number',
            unit: 'A',
            required: true
          },
          {
            key: 'voltage',
            label: 'Voltage',
            type: 'select',
            options: [
              { value: 120, label: '120V' },
              { value: 240, label: '240V' },
              { value: 277, label: '277V' },
              { value: 480, label: '480V' }
            ],
            unit: 'V',
            required: true
          },
          {
            key: 'phase',
            label: 'Phase',
            type: 'select',
            options: [
              { value: 1, label: 'Single Phase' },
              { value: 3, label: 'Three Phase' }
            ],
            required: true
          },
          {
            key: 'spaces',
            label: 'Number of Spaces',
            type: 'number',
            validation: (value) => {
              const num = parseInt(value);
              if (num < 12 || num > 60) return 'Spaces must be between 12 and 60';
              return null;
            }
          },
          {
            key: 'manufacturer',
            label: 'Manufacturer',
            type: 'select',
            options: [
              { value: 'Square D', label: 'Square D' },
              { value: 'Siemens', label: 'Siemens' },
              { value: 'Eaton', label: 'Eaton' },
              { value: 'GE', label: 'General Electric' },
              { value: 'Cutler Hammer', label: 'Cutler Hammer' }
            ]
          },
          {
            key: 'model',
            label: 'Model Number',
            type: 'text'
          }
        ];

      case 'breaker':
        return [
          ...commonFields,
          {
            key: 'rating',
            label: 'Breaker Rating',
            type: 'select',
            options: [
              { value: '15A', label: '15A' },
              { value: '20A', label: '20A' },
              { value: '30A', label: '30A' },
              { value: '40A', label: '40A' },
              { value: '50A', label: '50A' },
              { value: '60A', label: '60A' },
              { value: '70A', label: '70A' },
              { value: '80A', label: '80A' },
              { value: '90A', label: '90A' },
              { value: '100A', label: '100A' }
            ],
            required: true
          },
          {
            key: 'poles',
            label: 'Number of Poles',
            type: 'select',
            options: [
              { value: 1, label: '1 Pole' },
              { value: 2, label: '2 Pole' },
              { value: 3, label: '3 Pole' }
            ],
            required: true
          },
          {
            key: 'breakerType',
            label: 'Breaker Type',
            type: 'select',
            options: [
              { value: 'standard', label: 'Standard' },
              { value: 'gfci', label: 'GFCI' },
              { value: 'afci', label: 'AFCI' },
              { value: 'dedicated', label: 'Dedicated' }
            ]
          },
          {
            key: 'voltage',
            label: 'Voltage Rating',
            type: 'number',
            unit: 'V'
          }
        ];

      case 'evse_charger':
      case 'ev_charger':
        return [
          ...commonFields,
          {
            key: 'powerKW',
            label: 'Power Rating',
            type: 'number',
            unit: 'kW',
            validation: (value) => {
              const num = parseFloat(value);
              if (num < 1.4 || num > 22) return 'Power must be between 1.4kW and 22kW';
              return null;
            }
          },
          {
            key: 'voltage',
            label: 'Voltage',
            type: 'select',
            options: [
              { value: 120, label: '120V' },
              { value: 240, label: '240V' },
              { value: 480, label: '480V' }
            ]
          },
          {
            key: 'current',
            label: 'Current Rating',
            type: 'number',
            unit: 'A'
          },
          {
            key: 'level',
            label: 'Charging Level',
            type: 'select',
            options: [
              { value: 1, label: 'Level 1 (120V)' },
              { value: 2, label: 'Level 2 (240V)' },
              { value: 3, label: 'Level 3 (DC Fast)' }
            ]
          },
          {
            key: 'manufacturer',
            label: 'Manufacturer',
            type: 'text'
          },
          {
            key: 'model',
            label: 'Model',
            type: 'text'
          }
        ];

      case 'pv_array':
        return [
          ...commonFields,
          {
            key: 'numStrings',
            label: 'Number of Strings',
            type: 'number',
            validation: (value) => {
              const num = parseInt(value);
              if (num < 1 || num > 20) return 'Strings must be between 1 and 20';
              return null;
            }
          },
          {
            key: 'modulesPerString',
            label: 'Modules per String',
            type: 'number',
            validation: (value) => {
              const num = parseInt(value);
              if (num < 6 || num > 30) return 'Modules must be between 6 and 30';
              return null;
            }
          },
          {
            key: 'moduleWattage',
            label: 'Module Wattage',
            type: 'number',
            unit: 'W',
            validation: (value) => {
              const num = parseInt(value);
              if (num < 250 || num > 550) return 'Module wattage must be between 250W and 550W';
              return null;
            }
          },
          {
            key: 'arrayVoltage',
            label: 'Array Voltage',
            type: 'number',
            unit: 'V'
          },
          {
            key: 'arrayCurrent',
            label: 'Array Current',
            type: 'number',
            unit: 'A'
          }
        ];

      case 'inverter':
        return [
          ...commonFields,
          {
            key: 'acOutputKW',
            label: 'AC Output Power',
            type: 'number',
            unit: 'kW'
          },
          {
            key: 'dcInputVoltage',
            label: 'DC Input Voltage',
            type: 'number',
            unit: 'V'
          },
          {
            key: 'acOutputVoltage',
            label: 'AC Output Voltage',
            type: 'number',
            unit: 'V'
          },
          {
            key: 'efficiency',
            label: 'Efficiency',
            type: 'number',
            unit: '%',
            validation: (value) => {
              const num = parseFloat(value);
              if (num < 80 || num > 99) return 'Efficiency must be between 80% and 99%';
              return null;
            }
          },
          {
            key: 'manufacturer',
            label: 'Manufacturer',
            type: 'text'
          },
          {
            key: 'model',
            label: 'Model',
            type: 'text'
          }
        ];

      case 'battery':
        return [
          ...commonFields,
          {
            key: 'capacityKWh',
            label: 'Capacity',
            type: 'number',
            unit: 'kWh'
          },
          {
            key: 'powerKW',
            label: 'Power Output',
            type: 'number',
            unit: 'kW'
          },
          {
            key: 'voltage',
            label: 'Voltage',
            type: 'number',
            unit: 'V'
          },
          {
            key: 'batteryType',
            label: 'Battery Type',
            type: 'select',
            options: [
              { value: 'tesla_powerwall_3', label: 'Tesla Powerwall 3' },
              { value: 'enphase_iq10c', label: 'Enphase IQ Battery 10C' },
              { value: 'generic_ac', label: 'Generic AC Coupled' },
              { value: 'generic_dc', label: 'Generic DC Coupled' }
            ]
          },
          {
            key: 'manufacturer',
            label: 'Manufacturer',
            type: 'text'
          },
          {
            key: 'model',
            label: 'Model',
            type: 'text'
          }
        ];

      default:
        return commonFields;
    }
  };

  const fields = getEditableFields(component.type);

  const handleFieldChange = (fieldKey: string, value: any) => {
    setEditedComponent(prev => {
      if (!prev) return prev;
      
      const updated = { ...prev };
      
      // Handle nested specifications
      if (fieldKey === 'name') {
        updated.name = value;
      } else {
        updated.specifications = {
          ...updated.specifications,
          [fieldKey]: value
        };
      }

      return updated;
    });

    // Clear error for this field
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
    }
  };

  const validateField = (field: EditableField, value: any): string | null => {
    if (field.required && (!value || value === '')) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      return field.validation(value);
    }

    return null;
  };

  const handleSave = () => {
    if (!editedComponent) return;

    // Validate all fields
    const newErrors: Record<string, string> = {};
    
    fields.forEach(field => {
      const value = field.key === 'name' 
        ? editedComponent.name 
        : editedComponent.specifications[field.key];
      
      const error = validateField(field, value);
      if (error) {
        newErrors[field.key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(editedComponent);
    onClose();
  };

  const getFieldValue = (fieldKey: string) => {
    if (!editedComponent) return '';
    return fieldKey === 'name' 
      ? editedComponent.name 
      : editedComponent.specifications[fieldKey] || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Edit Component Properties
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {component.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </p>
        </div>

        {/* Form */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                  {field.unit && <span className="text-gray-400 ml-1">({field.unit})</span>}
                </label>
                
                {field.type === 'select' ? (
                  <select
                    value={getFieldValue(field.key)}
                    onChange={(e) => handleFieldChange(field.key, 
                      field.key === 'rating' || field.key === 'phase' || field.key === 'poles' 
                        ? (isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))
                        : e.target.value
                    )}
                    disabled={readonly}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    } ${readonly ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={getFieldValue(field.key)}
                    onChange={(e) => handleFieldChange(field.key, 
                      field.type === 'number' ? Number(e.target.value) : e.target.value
                    )}
                    disabled={readonly}
                    step={field.type === 'number' ? 'any' : undefined}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    } ${readonly ? 'bg-gray-100' : ''}`}
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                )}
                
                {errors[field.key] && (
                  <div className="mt-1 flex items-center text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors[field.key]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {!readonly && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 flex items-center"
            >
              <Check className="h-4 w-4 mr-1" />
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};