import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Calculator, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export const LoadCalculationGuide: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: "Project Setup",
      icon: BookOpen,
      content: [
        "Enter customer information and property address",
        "Measure and input accurate square footage (heated/cooled area only)",
        "Identify existing service size (main breaker amperage)",
        "Select appropriate NEC code year (latest adopted by AHJ)",
        "Choose calculation method based on project type"
      ],
      tips: [
        "Square footage should include only heated/cooled spaces",
        "Check with local AHJ for current NEC adoption",
        "Optional method (220.82) is simpler for most residential"
      ]
    },
    {
      id: 2,
      title: "General Loads Input",
      icon: Zap,
      content: [
        "General lighting automatically calculated at 3 VA/sq ft",
        "Add specific appliances with nameplate ratings",
        "Include receptacle loads for workshops/garages",
        "Consider future expansion needs",
        "Mark critical loads for backup power sizing"
      ],
      tips: [
        "Use nameplate VA rating when available",
        "Kitchen appliances >1800W require dedicated circuits",
        "Garage/workshop receptacles add significant load"
      ]
    },
    {
      id: 3,
      title: "HVAC Systems",
      icon: Zap,
      content: [
        "Enter air conditioning unit specifications",
        "Include heat pump backup/auxiliary heat",
        "Add ventilation fans and equipment",
        "Consider load management strategies",
        "Account for motor starting requirements"
      ],
      tips: [
        "Use largest of heating or cooling load, not both",
        "Heat pumps may need auxiliary heat included",
        "Motor loads require 125% continuous factor"
      ]
    },
    {
      id: 4,
      title: "EV Charging Equipment",
      icon: Calculator,
      content: [
        "Determine EVSE power requirements",
        "Consider number of charging stations",
        "Evaluate Energy Management System (EMS) benefits",
        "Plan for load sharing capabilities",
        "Account for continuous load factors (125%)"
      ],
      tips: [
        "Multiple EVSEs without EMS require full capacity",
        "EMS can significantly reduce electrical demand",
        "Consider future EV adoption in household"
      ]
    },
    {
      id: 5,
      title: "Solar & Battery Systems",
      icon: CheckCircle,
      content: [
        "Enter solar array specifications",
        "Calculate inverter AC output ratings",
        "Check 120% rule compliance for interconnection",
        "Size battery backup for critical loads",
        "Consider supply-side connections if needed"
      ],
      tips: [
        "120% rule: (Busbar × 1.2) - Main Breaker ≥ Solar Breaker",
        "Supply-side connections avoid 120% rule limits",
        "Battery sizing should match critical load duration needs"
      ]
    },
    {
      id: 6,
      title: "Review & Validation",
      icon: AlertTriangle,
      content: [
        "Verify total amperage vs service capacity",
        "Check spare capacity for future expansion",
        "Review warning and error messages",
        "Validate wire sizing recommendations",
        "Confirm code compliance"
      ],
      tips: [
        "Maintain 25% spare capacity when possible",
        "Address all error messages before proceeding",
        "Consider voltage drop for long wire runs"
      ]
    }
  ];

  const bestPractices = [
    "Always use conservative estimates for safety margins",
    "Document all assumptions and data sources",
    "Consider local climate effects on HVAC sizing",
    "Plan for future electrical needs and technology",
    "Coordinate with other building systems (plumbing, gas)",
    "Review calculations with licensed electrician",
    "Keep updated with latest NEC code changes"
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden print:hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors border-b border-blue-200"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-blue-900">Load Calculation Guide & Best Practices</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-blue-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-blue-600" />
        )}
      </button>

      {isExpanded && (
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Follow this step-by-step process to ensure accurate and code-compliant electrical load calculations.
              Click on each step for detailed guidance.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              
              return (
                <div key={step.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setActiveStep(isActive ? null : step.id)}
                    className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <Icon className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">{step.title}</span>
                    {isActive ? (
                      <ChevronUp className="h-4 w-4 text-gray-500 ml-auto" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500 ml-auto" />
                    )}
                  </button>

                  {isActive && (
                    <div className="p-4 bg-white border-t border-gray-200">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Steps:</h4>
                          <ul className="space-y-1">
                            {step.content.map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Tips:</h4>
                          <ul className="space-y-1">
                            {step.tips.map((tip, idx) => (
                              <li key={idx} className="text-sm text-blue-700 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Best Practices */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Best Practices
            </h4>
            <ul className="space-y-2">
              {bestPractices.map((practice, index) => (
                <li key={index} className="text-sm text-amber-800 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  {practice}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Disclaimer:</strong> This software provides calculations for informational purposes only. 
              All electrical work must be performed by licensed professionals and inspected per local codes. 
              Local requirements may supersede NEC standards.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};