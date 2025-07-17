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
        {/* Only load Analytics on Vercel platform */}
        {import.meta.env.VERCEL_ENV && <Analytics />}
      </UnifiedAppProvider>
    </ErrorBoundary>
  );
}

export default App;