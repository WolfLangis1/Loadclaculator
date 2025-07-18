import React, { useState, Suspense, lazy, memo, useCallback } from 'react';
import { Calculator, FolderOpen, Zap, MapPin, Cable, Plus, Shield, Users } from 'lucide-react';
import { LoadCalculatorMain } from '../LoadCalculator/LoadCalculatorMain';
import { WireSizingChart } from '../LoadCalculator/WireSizingChart';
import { AsyncComponentErrorBoundary } from '../ErrorBoundary/FeatureErrorBoundary';
import { LazyLoadingSpinner } from '../UI/LazyLoadingSpinner';
import { useProjectSettings } from '../../context/ProjectSettingsContext';
import { useLoadData } from '../../context/LoadDataContext';
import { useFeatureFlags } from '../../config/featureFlags';
import { DonationButton } from '../UI/DonationButton';

// Lazy load heavy components with Vercel-compatible fallback
const WorkingIntelligentSLDCanvas = lazy(() => 
  import('../SLD/WorkingIntelligentSLDCanvas').then(module => ({ default: module.WorkingIntelligentSLDCanvas }))
);
const SimpleAerialViewMain = lazy(() => import('../AerialView/SimpleAerialViewMain').then(module => ({ default: module.SimpleAerialViewMain })));
const ComplianceMain = lazy(() => import('../Compliance/ComplianceMain').then(module => ({ default: module.ComplianceMain })));
const CRMMain = lazy(() => import('../CRM/CRMMain').then(module => ({ default: module.CRMMain })));
const EnhancedProjectManager = lazy(() => 
  import('../ProjectManager/EnhancedProjectManager').then(module => ({ default: module.EnhancedProjectManager }))
    .catch(() => import('../ProjectManager/ProjectManager').then(module => ({ default: module.ProjectManager })))
);

type TabType = 'calculator' | 'sld-intelligent' | 'aerial' | 'wire-sizing' | 'compliance' | 'crm';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  disabled?: boolean;
  comingSoon?: boolean;
}

export const TabbedInterface: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [showProjectManager, setShowProjectManager] = useState(false);
  
  // Context hooks for clearing data
  const { resetSettings } = useProjectSettings();
  const { clearSessionData } = useLoadData();
  const featureFlags = useFeatureFlags();

  // Feature flags
  const FEATURE_FLAGS = {
    SLD_ENABLED: false, // Set to false to disable SLD feature
    COMPLIANCE_ENABLED: featureFlags.aerialView.compliance,
    INSPECTION_ENABLED: featureFlags.aerialView.inspection,
    CRM_ENABLED: featureFlags.crm.enabled, // CRM controlled by feature flag
  };

  const tabs: Tab[] = [
    {
      id: 'calculator',
      label: 'Load Calculator',
      icon: Calculator,
      component: LoadCalculatorMain
    },
    {
      id: 'wire-sizing',
      label: 'Wire Sizing',
      icon: Cable,
      component: WireSizingChart
    },
    {
      id: 'aerial',
      label: 'Site Analysis',
      icon: MapPin,
      component: SimpleAerialViewMain
    },
    {
      id: 'crm',
      label: 'CRM',
      icon: Users,
      component: CRMMain,
      disabled: !FEATURE_FLAGS.CRM_ENABLED,
      comingSoon: !FEATURE_FLAGS.CRM_ENABLED
    },
    {
      id: 'sld-intelligent',
      label: 'SLD',
      icon: Zap,
      component: WorkingIntelligentSLDCanvas,
      disabled: !FEATURE_FLAGS.SLD_ENABLED,
      comingSoon: !FEATURE_FLAGS.SLD_ENABLED
    },
    {
      id: 'compliance',
      label: 'Inspection & Compliance',
      icon: Shield,
      component: ComplianceMain,
      disabled: !FEATURE_FLAGS.COMPLIANCE_ENABLED && !FEATURE_FLAGS.INSPECTION_ENABLED,
      comingSoon: !FEATURE_FLAGS.COMPLIANCE_ENABLED && !FEATURE_FLAGS.INSPECTION_ENABLED
    }
  ];

  // If current active tab is disabled, switch to first enabled tab
  React.useEffect(() => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (activeTabData?.disabled) {
      const firstEnabledTab = tabs.find(tab => !tab.disabled);
      if (firstEnabledTab) {
        setActiveTab(firstEnabledTab.id);
      }
    }
  }, [activeTab, tabs]);

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component || LoadCalculatorMain;

  // Loading component for lazy-loaded features
  const LoadingComponent = () => (
    <LazyLoadingSpinner componentName={activeTabData?.label} />
  );

  // Render component with appropriate wrapper
  const renderActiveComponent = () => {
    // Load Calculator and Wire Sizing don't need lazy loading
    if (activeTab === 'calculator' || activeTab === 'wire-sizing') {
      return <ActiveComponent />;
    }

    // Other components use lazy loading with error boundaries
    return (
      <AsyncComponentErrorBoundary componentName={activeTabData?.label || 'Component'}>
        <Suspense fallback={<LoadingComponent />}>
          <ActiveComponent />
        </Suspense>
      </AsyncComponentErrorBoundary>
    );
  };

  const handleTabClick = useCallback((tabId: TabType) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.disabled) {
      return; // Don't switch to disabled tabs
    }
    setActiveTab(tabId);
  }, [tabs]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent, tabId: TabType) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.disabled) {
      return; // Don't handle keyboard events for disabled tabs
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(tabId);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const enabledTabs = tabs.filter(t => !t.disabled);
      const currentIndex = enabledTabs.findIndex(tab => tab.id === activeTab);
      let nextIndex;
      
      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1;
      } else {
        nextIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0;
      }
      
      const nextTab = enabledTabs[nextIndex];
      handleTabClick(nextTab.id);
      
      // Focus the next tab after state update
      setTimeout(() => {
        const nextTabElement = document.querySelector(`#tab-${nextTab.id}`) as HTMLElement;
        if (nextTabElement) {
          nextTabElement.focus();
        }
      }, 0);
    }
  }, [handleTabClick, tabs, activeTab]);

  const handleNewProject = useCallback(() => {
    // Clear all temporary session data
    resetSettings();
    clearSessionData();
    // Switch to calculator tab
    setActiveTab('calculator');
  }, [resetSettings, clearSessionData]);



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-2 sm:px-4">
            <div role="tablist" aria-label="Main application navigation" className="flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-hide">{/* Mobile: reduce spacing and allow horizontal scroll */}
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isDisabled = tab.disabled;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  data-tab-id={tab.id}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  disabled={isDisabled}
                  onClick={() => handleTabClick(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, tab.id)}
                  className={`${
                    isDisabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed opacity-60'
                      : isActive
                      ? 'border-blue-500 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  } whitespace-nowrap py-3 sm:py-4 px-1 sm:px-2 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-2 transition-colors min-w-0`}
                  aria-label={`${tab.label} tab${isActive ? ', currently selected' : ''}${isDisabled ? ', disabled' : ''}`}
                >
                  <tab.icon className="h-4 w-4" aria-hidden="true" />
                  <div className="flex flex-col items-start">
                    <span>{tab.label}</span>
                    {tab.comingSoon && (
                      <span className="text-xs text-gray-400 -mt-0.5">Coming Soon</span>
                    )}
                  </div>
                </button>
              );
            })}
            </div>
            
            <div className="flex items-center gap-2">
              <DonationButton size="sm" className="hidden sm:flex" />
              <DonationButton size="sm" showText={false} className="sm:hidden" />
              
              <button
                onClick={handleNewProject}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-xs sm:text-sm"
                aria-label="Start new project"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">New</span>
              </button>
              
              <button
                onClick={() => setShowProjectManager(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-xs sm:text-sm"
                aria-label="Open project manager"
              >
                <FolderOpen className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Projects</span>
                <span className="sm:hidden">Files</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div 
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className={`${
          activeTab === 'sld-intelligent' || activeTab === 'aerial' || activeTab === 'compliance' || activeTab === 'crm'
            ? 'h-[calc(100vh-80px)] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' 
            : activeTab === 'wire-sizing'
            ? 'max-w-7xl mx-auto py-3 sm:py-6 px-2 sm:px-0'
            : 'max-w-7xl mx-auto px-2 sm:px-0'
        }`}
        style={activeTab === 'sld-intelligent' || activeTab === 'aerial' || activeTab === 'compliance' || activeTab === 'crm' ? { 
          scrollBehavior: 'smooth',
          overflowY: 'auto',
          overflowX: 'auto'
        } : {}}
      >
        {renderActiveComponent()}
      </div>
      
      {/* Project Manager Modal */}
      {showProjectManager && (
        <AsyncComponentErrorBoundary componentName="Project Manager">
          <Suspense fallback={<LazyLoadingSpinner componentName="Project Manager" />}>
            <EnhancedProjectManager 
              isOpen={showProjectManager} 
              onClose={() => setShowProjectManager(false)} 
            />
          </Suspense>
        </AsyncComponentErrorBoundary>
      )}
    </div>
  );
});