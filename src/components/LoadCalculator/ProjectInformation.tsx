import React from 'react';
import { Home } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { TooltipWrapper } from '../UI/TooltipWrapper';
import { AddressAutocomplete } from '../UI/AddressAutocomplete';
import { InputField } from '../UI/InputField';

export const ProjectInformation: React.FC = () => {
  const { state, updateProjectInfo, updateSettings } = useLoadCalculator();
  const { updatePanelDetails } = useProjectSettings();
  const { projectInfo } = state;

  return (
    <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/20 rounded-lg">
          <Home className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Project Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <InputField
          id="customer-name"
          label="Customer Name *"
          type="text"
          value={projectInfo.customerName || ''}
          onChange={(e) => updateProjectInfo({ customerName: e.target.value })}
          placeholder="Enter customer name"
          required
        />

        <div>
          <label htmlFor="property-address" className="block text-sm font-medium text-white/90 mb-2">
            Property Address *
          </label>
          <AddressAutocomplete
            value={projectInfo.propertyAddress || ''}
            onChange={(address) => updateProjectInfo({ propertyAddress: address })}
            onPlaceSelect={(place) => {
              console.log('🏠 Project address selected:', place);
              updateProjectInfo({ 
                propertyAddress: place.address,
                // Optionally update city, state if components available
                ...(place.components?.city && { city: place.components.city }),
                ...(place.components?.state && { state: place.components.state }),
                ...(place.components?.zipCode && { zipCode: place.components.zipCode })
              });
            }}
            placeholder="Start typing property address..."
            required
          />
        </div>

        <InputField
          id="city"
          label="City"
          type="text"
          value={projectInfo.city || ''}
          onChange={(e) => updateProjectInfo({ city: e.target.value })}
          placeholder="Enter city"
        />

        <InputField
          id="state"
          label="State"
          type="text"
          value={projectInfo.state || ''}
          onChange={(e) => updateProjectInfo({ state: e.target.value })}
          placeholder="Enter state"
        />

        <InputField
          id="zip-code"
          label="ZIP Code"
          type="text"
          value={projectInfo.zipCode || ''}
          onChange={(e) => updateProjectInfo({ zipCode: e.target.value })}
          placeholder="Enter ZIP code"
        />

        <InputField
          id="square-footage"
          label="Square Footage *"
          type="number"
          value={state.squareFootage || ''}
          onChange={(e) => updateSettings({ squareFootage: e.target.value === '' ? 0 : parseInt(e.target.value) || 0 })}
          placeholder="Enter square footage"
          min="0"
          required
        />

        <InputField
          id="project-name"
          label="Project Name"
          type="text"
          value={projectInfo.projectName || ''}
          onChange={(e) => updateProjectInfo({ projectName: e.target.value })}
          placeholder="Enter project name"
        />

        <InputField
          id="calculated-by"
          label="Calculated By *"
          type="text"
          value={projectInfo.calculatedBy || ''}
          onChange={(e) => updateProjectInfo({ calculatedBy: e.target.value })}
          placeholder="Enter calculator name"
          required
        />

        <div>
          <label htmlFor="main-breaker" className="block text-sm font-medium text-white/90 mb-2">
            <TooltipWrapper term="main breaker">Main Breaker Size (A) *</TooltipWrapper>
          </label>
          <select
            id="main-breaker"
            value={state.mainBreaker || 200}
            onChange={(e) => updateSettings({ mainBreaker: parseInt(e.target.value) })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
          >
            {[100, 125, 150, 175, 200, 225, 250, 300, 350, 400].map(size => (
              <option key={size} value={size} className="text-gray-900 bg-white">{size}A</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bus-rating" className="block text-sm font-medium text-white/90 mb-2">
            <TooltipWrapper term="bus rating">Bus Bar Rating (A) *</TooltipWrapper>
          </label>
          <select
            id="bus-rating"
            value={state.panelDetails?.busRating || 200}
            onChange={(e) => updatePanelDetails({ 
              busRating: parseInt(e.target.value) 
            })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
          >
            {[100, 125, 150, 175, 200, 225, 250, 300, 350, 400].map(size => (
              <option key={size} value={size} className="text-gray-900 bg-white">{size}A</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};