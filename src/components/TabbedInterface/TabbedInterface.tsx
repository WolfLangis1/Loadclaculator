import React, { useState } from 'react';
import { Calculator, MapPin, Zap, FolderOpen } from 'lucide-react';
import { SingleLineDiagram } from '../SLD/SingleLineDiagram';
import { AerialViewMain } from '../AerialView/AerialViewMain';
import { LoadCalculatorMain } from '../LoadCalculator/LoadCalculatorMain';
import { ProjectManager } from '../ProjectManager/ProjectManager';

type TabType = 'calculator' | 'sld' | 'aerial';

interface Tab {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
}

export const TabbedInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [showProjectManager, setShowProjectManager] = useState(false);

  const tabs: Tab[] = [
    {
      id: 'calculator',
      label: 'Load Calculator',
      icon: Calculator,
      component: LoadCalculatorMain
    },
    {
      id: 'sld',
      label: 'Single Line Diagram',
      icon: Zap,
      component: SingleLineDiagram
    },
    {
      id: 'aerial',
      label: 'Aerial View & Site Analysis',
      icon: MapPin,
      component: AerialViewMain
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component || LoadCalculatorMain;

  const handleTabClick = (tabId: TabType) => {
    setActiveTab(tabId);
  };

  const handleKeyDown = (event: React.KeyboardEvent, tabId: TabType) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleTabClick(tabId);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
      let nextIndex;
      
      if (event.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
      } else {
        nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
      }
      
      const nextTab = tabs[nextIndex];
      handleTabClick(nextTab.id);
      
      // Focus the next tab after state update
      setTimeout(() => {
        const nextTabElement = document.querySelector(`#tab-${nextTab.id}`) as HTMLElement;
        if (nextTabElement) {
          nextTabElement.focus();
        }
      }, 0);
    }
  };



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4">
            <div role="tablist" aria-label="Main application navigation" className="flex space-x-8">
            {tabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  data-tab-id={tab.id}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => handleTabClick(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, tab.id)}
                  className={`${
                    isActive
                      ? 'border-blue-500 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                  aria-label={`${tab.label} tab${isActive ? ', currently selected' : ''}`}
                >
                  <tab.icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
            </div>
            
            <button
              onClick={() => setShowProjectManager(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              aria-label="Open project manager"
            >
              <FolderOpen className="h-4 w-4" aria-hidden="true" />
              Projects
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div 
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
        className={`${
          activeTab === 'sld' || activeTab === 'aerial' 
            ? 'h-[calc(100vh-80px)]' 
            : 'max-w-7xl mx-auto'
        }`}
      >
        <ActiveComponent />
      </div>
      
      {/* Project Manager Modal */}
      <ProjectManager 
        isOpen={showProjectManager} 
        onClose={() => setShowProjectManager(false)} 
      />
    </div>
  );
};