import { UnifiedAppProvider } from './context/UnifiedAppContext';
import { TabbedInterface } from './components/TabbedInterface/TabbedInterface';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';

// Complete load calculator app with SLD and Aerial View features
function App() {
  return (
    <ErrorBoundary>
      <UnifiedAppProvider>
        <TabbedInterface />
        <Analytics />
      </UnifiedAppProvider>
    </ErrorBoundary>
  );
}

export default App;