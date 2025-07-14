import { LoadCalculatorMain } from './components/LoadCalculator/LoadCalculatorMain';
import { ProjectSettingsProvider } from './context/ProjectSettingsContext';
import { LoadDataProvider } from './context/LoadDataContext';
import { CalculationProvider } from './context/CalculationContext';

// Testing with essential contexts only (no SLD)
function App() {
  return (
    <ProjectSettingsProvider>
      <LoadDataProvider>
        <CalculationProvider>
          <div style={{ padding: '20px' }}>
            <h1>Load Calculator - Testing with Contexts</h1>
            <LoadCalculatorMain />
          </div>
        </CalculationProvider>
      </LoadDataProvider>
    </ProjectSettingsProvider>
  );
}

export default App;