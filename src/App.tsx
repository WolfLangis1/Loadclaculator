import { TabbedInterface } from './components/TabbedInterface/TabbedInterface';
import { ProjectSettingsProvider } from './context/ProjectSettingsContext';
import { LoadDataProvider } from './context/LoadDataContext';
import { CalculationProvider } from './context/CalculationContext';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { DeviceTogglePanel } from './components/UI/DeviceTogglePanel';

// Full load calculator app with essential contexts (no SLD)
function App() {
  return (
    <ErrorBoundary>
      <ProjectSettingsProvider>
        <LoadDataProvider>
          <CalculationProvider>
            <TabbedInterface />
            <DeviceTogglePanel />
          </CalculationProvider>
        </LoadDataProvider>
      </ProjectSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;