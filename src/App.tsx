import { LoadCalculatorProvider } from './context/LoadCalculatorContext';
import { TabbedInterface } from './components/TabbedInterface/TabbedInterface';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <LoadCalculatorProvider>
        <TabbedInterface />
      </LoadCalculatorProvider>
    </ErrorBoundary>
  );
}

export default App;