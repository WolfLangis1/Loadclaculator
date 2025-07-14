import { UnifiedAppProvider } from './context/UnifiedAppContext';
import { TabbedInterface } from './components/TabbedInterface/TabbedInterface';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { DeviceTogglePanel } from './components/UI/DeviceTogglePanel';

function App() {
  return (
    <ErrorBoundary>
      <UnifiedAppProvider>
        <TabbedInterface />
        <DeviceTogglePanel />
      </UnifiedAppProvider>
    </ErrorBoundary>
  );
}

export default App;