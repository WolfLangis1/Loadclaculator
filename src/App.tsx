import { LoadCalculatorMain } from './components/LoadCalculator/LoadCalculatorMain';
import { ProjectSettingsProvider } from './context/ProjectSettingsContext';
import { LoadDataProvider } from './context/LoadDataContext';
import { CalculationProvider } from './context/CalculationContext';

// Stable working version - LoadCalculatorMain only
function App() {
  return (
    <ProjectSettingsProvider>
      <LoadDataProvider>
        <CalculationProvider>
          <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '20px' }}>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
                Professional Electrical Load Calculator
              </h1>
              <LoadCalculatorMain />
            </div>
          </div>
        </CalculationProvider>
      </LoadDataProvider>
    </ProjectSettingsProvider>
  );
}

export default App;