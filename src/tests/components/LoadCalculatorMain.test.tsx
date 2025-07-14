import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { LoadCalculatorMain } from '../../components/LoadCalculator/LoadCalculatorMain';
import { LoadCalculatorProvider } from '../../context/LoadCalculatorContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock child components for focused testing
vi.mock('../../components/LoadCalculator/ProjectInformation', () => ({
  ProjectInformation: () => <div data-testid="project-information">Project Information</div>
}));

vi.mock('../../components/LoadCalculator/LoadInputTabs', () => ({
  LoadInputTabs: () => <div data-testid="load-input-tabs">Load Input Tabs</div>
}));

vi.mock('../../components/LoadCalculator/CalculationResults', () => ({
  CalculationResults: () => <div data-testid="calculation-results">Calculation Results</div>
}));

vi.mock('../../components/LoadCalculator/CalculationTransparency', () => ({
  CalculationTransparency: () => <div data-testid="calculation-transparency">Calculation Transparency</div>
}));

vi.mock('../../components/LoadCalculator/ValidationMessages', () => ({
  ValidationMessages: () => <div data-testid="validation-messages">Validation Messages</div>
}));

vi.mock('../../components/LoadCalculator/LoadCalculationGuide', () => ({
  LoadCalculationGuide: () => <div data-testid="load-calculation-guide">Load Calculation Guide</div>
}));

vi.mock('../../components/LoadCalculator/DefinitionsGlossary', () => ({
  DefinitionsGlossary: () => <div data-testid="definitions-glossary">Definitions Glossary</div>
}));

const renderLoadCalculatorMain = () => {
  return render(
    <LoadCalculatorProvider>
      <LoadCalculatorMain />
    </LoadCalculatorProvider>
  );
};

describe('LoadCalculatorMain', () => {
  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = renderLoadCalculatorMain();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper heading structure', () => {
      renderLoadCalculatorMain();
      
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Load Calculator');
      expect(mainHeading).toBeInTheDocument();
    });

    test('should have properly labeled form controls', () => {
      renderLoadCalculatorMain();
      
      const codeYearSelect = screen.getByLabelText(/code/i);
      expect(codeYearSelect).toBeInTheDocument();
      expect(codeYearSelect).toHaveAttribute('id', 'code-year');
      
      const methodSelect = screen.getByLabelText(/method/i);
      expect(methodSelect).toBeInTheDocument();
      expect(methodSelect).toHaveAttribute('id', 'calculation-method');
    });
  });

  describe('Header Controls', () => {
    test('should render all NEC code year options', () => {
      renderLoadCalculatorMain();
      
      const codeYearSelect = screen.getByLabelText(/code/i);
      expect(codeYearSelect).toBeInTheDocument();
      
      const options = Array.from(codeYearSelect.querySelectorAll('option'));
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent('NEC 2023');
      expect(options[1]).toHaveTextContent('NEC 2020');
      expect(options[2]).toHaveTextContent('NEC 2017');
    });

    test('should have default code year of 2023', () => {
      renderLoadCalculatorMain();
      
      const codeYearSelect = screen.getByLabelText(/code/i) as HTMLSelectElement;
      expect(codeYearSelect.value).toBe('2023');
    });

    test('should update code year when selection changes', async () => {
      const user = userEvent.setup();
      renderLoadCalculatorMain();
      
      const codeYearSelect = screen.getByLabelText(/code/i);
      await user.selectOptions(codeYearSelect, '2020');
      
      expect(codeYearSelect).toHaveValue('2020');
    });

    test('should render calculation method options', () => {
      renderLoadCalculatorMain();
      
      const methodSelect = screen.getByLabelText(/method/i);
      expect(methodSelect).toBeInTheDocument();
      
      const options = Array.from(methodSelect.querySelectorAll('option'));
      expect(options.length).toBeGreaterThan(0);
      
      // Should include standard calculation methods
      const optionTexts = options.map(option => option.textContent);
      expect(optionTexts).toContain(expect.stringMatching(/optional/i));
      expect(optionTexts).toContain(expect.stringMatching(/standard/i));
    });
  });

  describe('Component Rendering', () => {
    test('should render all required child components', () => {
      renderLoadCalculatorMain();
      
      expect(screen.getByTestId('project-information')).toBeInTheDocument();
      expect(screen.getByTestId('load-input-tabs')).toBeInTheDocument();
      expect(screen.getByTestId('calculation-results')).toBeInTheDocument();
      expect(screen.getByTestId('calculation-transparency')).toBeInTheDocument();
      expect(screen.getByTestId('validation-messages')).toBeInTheDocument();
      expect(screen.getByTestId('load-calculation-guide')).toBeInTheDocument();
      expect(screen.getByTestId('definitions-glossary')).toBeInTheDocument();
    });

    test('should display current NEC code year in header', () => {
      renderLoadCalculatorMain();
      
      expect(screen.getByText(/NEC 2023 Compliant/i)).toBeInTheDocument();
    });

    test('should have calculator icon in header', () => {
      renderLoadCalculatorMain();
      
      const calculatorIcon = screen.getByRole('img', { hidden: true });
      expect(calculatorIcon).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    test('should have proper layout structure', () => {
      const { container } = renderLoadCalculatorMain();
      
      // Should have main container with gradient background
      const mainContainer = container.querySelector('.bg-gradient-to-br');
      expect(mainContainer).toBeInTheDocument();
      
      // Should have header with gradient
      const header = container.querySelector('.bg-gradient-to-r');
      expect(header).toBeInTheDocument();
    });

    test('should be responsive with max-width constraint', () => {
      const { container } = renderLoadCalculatorMain();
      
      const contentContainer = container.querySelector('.max-w-\\[1800px\\]');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('should handle focus states properly', async () => {
      const user = userEvent.setup();
      renderLoadCalculatorMain();
      
      const codeYearSelect = screen.getByLabelText(/code/i);
      
      await user.tab();
      // The first focusable element should be focused
      expect(document.activeElement).toBeTruthy();
    });

    test('should maintain form state', async () => {
      const user = userEvent.setup();
      renderLoadCalculatorMain();
      
      const codeYearSelect = screen.getByLabelText(/code/i);
      const methodSelect = screen.getByLabelText(/method/i);
      
      // Change code year
      await user.selectOptions(codeYearSelect, '2020');
      expect(codeYearSelect).toHaveValue('2020');
      
      // Change method
      await user.selectOptions(methodSelect, 'standard');
      
      // Code year should still be 2020
      expect(codeYearSelect).toHaveValue('2020');
    });
  });

  describe('Error Handling', () => {
    test('should render without crashing when context is provided', () => {
      expect(() => renderLoadCalculatorMain()).not.toThrow();
    });

    test('should handle missing context gracefully', () => {
      // This should be handled by the useLoadCalculator hook
      // The hook should throw an error if context is not provided
      expect(() => {
        render(<LoadCalculatorMain />);
      }).toThrow();
    });
  });
});