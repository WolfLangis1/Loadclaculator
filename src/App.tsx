import { LoadCalculatorProvider } from './context/LoadCalculatorContext';
import { LoadCalculatorMain } from './components/LoadCalculator/LoadCalculatorMain';

function App() {
  return (
    <LoadCalculatorProvider>
      <LoadCalculatorMain />
    </LoadCalculatorProvider>
  );
}

export default App;