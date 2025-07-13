import React from 'react';
import { Home } from 'lucide-react';
import { useLoadCalculator } from '../../hooks/useLoadCalculator';

export const ProjectInformation: React.FC = () => {
  const { state, updateProjectInfo, updateSettings } = useLoadCalculator();
  const { projectInfo } = state;

  return (
    <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/20 rounded-lg">
          <Home className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Project Information</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label htmlFor="customer-name" className="block text-sm font-medium text-white/90 mb-2">
            Customer Name *
          </label>
          <input
            id="customer-name"
            type="text"
            value={projectInfo.customerName}
            onChange={(e) => updateProjectInfo({ customerName: e.target.value })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
            placeholder="Enter customer name"
            required
          />
        </div>

        <div>
          <label htmlFor="property-address" className="block text-sm font-medium text-white/90 mb-2">
            Property Address *
          </label>
          <input
            id="property-address"
            type="text"
            value={projectInfo.propertyAddress}
            onChange={(e) => updateProjectInfo({ propertyAddress: e.target.value })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
            placeholder="Enter property address"
            required
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-white/90 mb-2">
            City
          </label>
          <input
            id="city"
            type="text"
            value={projectInfo.city}
            onChange={(e) => updateProjectInfo({ city: e.target.value })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-white/90 mb-2">
            State
          </label>
          <input
            id="state"
            type="text"
            value={projectInfo.state}
            onChange={(e) => updateProjectInfo({ state: e.target.value })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
            placeholder="Enter state"
          />
        </div>

        <div>
          <label htmlFor="zip-code" className="block text-sm font-medium text-white/90 mb-2">
            ZIP Code
          </label>
          <input
            id="zip-code"
            type="text"
            value={projectInfo.zipCode}
            onChange={(e) => updateProjectInfo({ zipCode: e.target.value })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
            placeholder="Enter ZIP code"
          />
        </div>

        <div>
          <label htmlFor="square-footage" className="block text-sm font-medium text-white/90 mb-2">
            Square Footage *
          </label>
          <input
            id="square-footage"
            type="number"
            value={state.squareFootage}
            onChange={(e) => updateSettings({ squareFootage: parseInt(e.target.value) || 0 })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
            placeholder="Enter square footage"
            min="0"
            required
          />
        </div>

        <div>
          <label htmlFor="project-name" className="block text-sm font-medium text-white/90 mb-2">
            Project Name
          </label>
          <input
            id="project-name"
            type="text"
            value={projectInfo.projectName}
            onChange={(e) => updateProjectInfo({ projectName: e.target.value })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
            placeholder="Enter project name"
          />
        </div>

        <div>
          <label htmlFor="calculated-by" className="block text-sm font-medium text-white/90 mb-2">
            Calculated By *
          </label>
          <input
            id="calculated-by"
            type="text"
            value={projectInfo.calculatedBy}
            onChange={(e) => updateProjectInfo({ calculatedBy: e.target.value })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
            placeholder="Enter calculator name"
            required
          />
        </div>

        <div>
          <label htmlFor="main-breaker" className="block text-sm font-medium text-white/90 mb-2">
            Main Breaker Size (A) *
          </label>
          <select
            id="main-breaker"
            value={state.mainBreaker}
            onChange={(e) => updateSettings({ mainBreaker: parseInt(e.target.value) })}
            className="w-full rounded-lg border-0 bg-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-white/50"
          >
            {[100, 125, 150, 175, 200, 225, 250, 300, 350, 400].map(size => (
              <option key={size} value={size}>{size}A</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};