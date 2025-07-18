import React, { useState, useMemo } from 'react';
import { Home, Users, Loader2, Check, AlertCircle } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { useAddressSync } from '../../context/AddressSyncContext';
import { useCRMSafe } from '../../context/CRMContext';
import { useFeatureFlags } from '../../config/featureFlags';
import { TooltipWrapper } from '../UI/TooltipWrapper';
import { AddressAutocomplete } from '../UI/AddressAutocomplete';
import { InputField } from '../UI/InputField';
import { CRMProjectIntegrationService } from '../../services/crmProjectIntegrationService';

export const ProjectInformation: React.FC = () => {
  const { state, updateProjectInfo, updateSettings } = useLoadCalculator();
  const { updatePanelDetails } = useProjectSettings();
  const { syncAddressToAerialView } = useAddressSync();
  const crm = useCRMSafe();
  const featureFlags = useFeatureFlags();
  const { projectInfo } = state;

  const [isSavingToCRM, setIsSavingToCRM] = useState(false);
  const [crmSaveStatus, setCrmSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [crmError, setCrmError] = useState<string | null>(null);

  // Check if project is ready for CRM save
  const isReadyForCRM = useMemo(() => {
    return CRMProjectIntegrationService.isProjectReadyForCRM(projectInfo, state.squareFootage || 0);
  }, [projectInfo, state.squareFootage]);

  // Get validation errors
  const validationErrors = useMemo(() => {
    return CRMProjectIntegrationService.getValidationErrors(projectInfo, state.squareFootage || 0);
  }, [projectInfo, state.squareFootage]);

  // Handle CRM save
  const handleSaveToCRM = async () => {
    if (!isReadyForCRM || !crm) return;

    setIsSavingToCRM(true);
    setCrmError(null);
    setCrmSaveStatus('idle');

    try {
      const { customerId, projectId } = await CRMProjectIntegrationService.saveToCRM(
        projectInfo,
        state.squareFootage || 0,
        state.calculations
      );

      // Store customer ID for future reference
      localStorage.setItem('lastCRMCustomerId', customerId);
      localStorage.setItem('lastCRMProjectId', projectId);

      setCrmSaveStatus('success');
      setTimeout(() => setCrmSaveStatus('idle'), 3000); // Reset after 3 seconds
    } catch (error) {
      console.error('Failed to save to CRM:', error);
      setCrmError(error instanceof Error ? error.message : 'Failed to save to CRM');
      setCrmSaveStatus('error');
    } finally {
      setIsSavingToCRM(false);
    }
  };

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
            onChange={(address) => {
              // Only update project info for manual typing, don't sync to aerial yet
              updateProjectInfo({ propertyAddress: address });
            }}
            onPlaceSelect={(place) => {
              console.log('🏠 Project address selected:', place);
              const addressData = {
                propertyAddress: place.address,
                // Optionally update city, state if components available
                ...(place.components?.city && { city: place.components.city }),
                ...(place.components?.state && { state: place.components.state }),
                ...(place.components?.zipCode && { zipCode: place.components.zipCode })
              };
              updateProjectInfo(addressData);
              // Only sync to aerial view when a place is actually selected
              syncAddressToAerialView(place.address);
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
          id="phone"
          label="Phone Number"
          type="tel"
          value={projectInfo.phone || ''}
          onChange={(e) => updateProjectInfo({ phone: e.target.value })}
          placeholder="(555) 123-4567"
        />

        <InputField
          id="email"
          label="Email Address"
          type="email"
          value={projectInfo.email || ''}
          onChange={(e) => updateProjectInfo({ email: e.target.value })}
          placeholder="customer@example.com"
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
            value={state.panelDetails?.busRating || (() => {
              const mainBreaker = state.mainBreaker || 200;
              if (mainBreaker <= 150) return mainBreaker;
              else if (mainBreaker <= 200) return 225;
              else return Math.max(mainBreaker * 1.25, 400);
            })()}
            onChange={(e) => updatePanelDetails({ 
              busRating: parseInt(e.target.value) 
            })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
          >
            {[100, 125, 150, 175, 200, 225, 250, 300, 350, 400].map(size => (
              <option key={size} value={size} className="text-gray-900 bg-white">{size}A</option>
            ))}
          </select>
          
          {/* Solar Capacity Indicator */}
          {(() => {
            const getDefaultBusbarRating = (mainBreakerSize: number): number => {
              if (mainBreakerSize <= 150) {
                return mainBreakerSize;
              } else if (mainBreakerSize <= 200) {
                return 225;
              } else {
                return Math.max(mainBreakerSize * 1.25, 400);
              }
            };
            
            const mainBreaker = state.mainBreaker || 200;
            const busRating = state.panelDetails?.busRating || getDefaultBusbarRating(mainBreaker);
            const maxSolarAmps = (busRating * 1.2) - mainBreaker;
            const maxSolarKW = (maxSolarAmps * 240) / 1000;
            
            const isDefault = !state.panelDetails?.busRating;
            
            return (
              <div className="mt-2 p-2 bg-white/10 rounded text-xs text-white/80">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Solar Capacity:</span>
                  <span className="text-green-200">
                    {maxSolarAmps.toFixed(0)}A / {maxSolarKW.toFixed(1)}kW max
                  </span>
                  {isDefault && (
                    <span className="text-yellow-200">(default)</span>
                  )}
                </div>
                <div className="text-white/60 mt-1">
                  NEC 120% rule: ({busRating}A × 1.2) - {mainBreaker}A = {maxSolarAmps.toFixed(0)}A
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Save to CRM Section */}
      {featureFlags.crm.enabled && crm && (
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-white" />
              <div>
                <h3 className="text-lg font-semibold text-white">Customer Management</h3>
                <p className="text-sm text-white/80">
                  {isReadyForCRM 
                    ? 'Project information is complete - ready to save to CRM'
                    : 'Complete the required fields to save to CRM'
                  }
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveToCRM}
              disabled={!isReadyForCRM || isSavingToCRM}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300
                ${isReadyForCRM 
                  ? crmSaveStatus === 'success'
                    ? 'bg-green-600 text-white shadow-lg'
                    : crmSaveStatus === 'error'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-green-600 hover:bg-green-50 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-white/20 text-white/60 cursor-not-allowed'
                }
              `}
              title={isReadyForCRM ? 'Save project to CRM' : validationErrors.join(', ')}
            >
              {isSavingToCRM ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : crmSaveStatus === 'success' ? (
                <>
                  <Check className="h-4 w-4" />
                  Saved to CRM
                </>
              ) : crmSaveStatus === 'error' ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  Save Failed
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Save to CRM
                </>
              )}
            </button>
          </div>

          {/* Error display */}
          {crmError && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-400 rounded-lg">
              <p className="text-sm text-white">{crmError}</p>
            </div>
          )}

          {/* Validation errors for incomplete fields */}
          {!isReadyForCRM && validationErrors.length > 0 && (
            <div className="mt-3 p-3 bg-orange-500/20 border border-orange-400 rounded-lg">
              <p className="text-sm text-white font-medium mb-1">Complete these fields to save to CRM:</p>
              <ul className="text-sm text-white/90 list-disc list-inside">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};