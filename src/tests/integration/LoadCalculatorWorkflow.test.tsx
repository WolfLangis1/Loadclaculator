import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadCalculatorProvider } from '../../context/LoadCalculatorContext';
import { LoadCalculatorMain } from '../../components/LoadCalculator/LoadCalculatorMain';

const renderLoadCalculator = () => {
  return render(
    <LoadCalculatorProvider>
      <LoadCalculatorMain />
    </LoadCalculatorProvider>
  );
};

describe('Load Calculator Workflow Integration Tests', () => {
  describe('Basic Calculation Workflow', () => {
    test('should complete a basic residential calculation', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // 1. Enter project information
      const squareFootageInput = screen.getByLabelText(/square footage/i);
      await user.clear(squareFootageInput);
      await user.type(squareFootageInput, '2000');

      // 2. Set calculation method
      const methodSelect = screen.getByLabelText(/method/i);
      await user.selectOptions(methodSelect, 'optional');

      // 3. Add a general load
      const addLoadButton = screen.getByRole('button', { name: /add load/i });
      await user.click(addLoadButton);

      // 4. Fill in load details
      const loadNameInput = screen.getByPlaceholderText(/load description/i);
      await user.type(loadNameInput, 'Kitchen Outlets');

      const ampsInput = screen.getByLabelText(/amps/i);
      await user.clear(ampsInput);
      await user.type(ampsInput, '20');

      // 5. Verify calculations appear
      await waitFor(() => {
        expect(screen.getByText(/total demand/i)).toBeInTheDocument();
      });

      // 6. Check that results are reasonable
      const totalVA = screen.getByText(/\d+,?\d* VA/);
      expect(totalVA).toBeInTheDocument();
    });

    test('should handle HVAC load calculations correctly', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // Navigate to HVAC tab
      const hvacTab = screen.getByRole('tab', { name: /hvac/i });
      await user.click(hvacTab);

      // Add HVAC load
      const addHvacButton = screen.getByRole('button', { name: /add.*hvac/i });
      await user.click(addHvacButton);

      // Fill HVAC details
      const hvacNameInput = screen.getByPlaceholderText(/hvac.*description/i);
      await user.type(hvacNameInput, 'Central Air Conditioner');

      const hvacAmpsInput = screen.getByLabelText(/amps/i);
      await user.clear(hvacAmpsInput);
      await user.type(hvacAmpsInput, '30');

      // Verify HVAC appears in calculations
      await waitFor(() => {
        expect(screen.getByText(/hvac.*demand/i)).toBeInTheDocument();
      });
    });

    test('should validate EVSE loads and show warnings', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // Navigate to EVSE tab
      const evseTab = screen.getByRole('tab', { name: /evse/i });
      await user.click(evseTab);

      // Add EVSE load
      const addEvseButton = screen.getByRole('button', { name: /add.*evse/i });
      await user.click(addEvseButton);

      // Fill EVSE details with high amperage
      const evseNameInput = screen.getByPlaceholderText(/evse.*description/i);
      await user.type(evseNameInput, 'Tesla Charger');

      const evseAmpsInput = screen.getByLabelText(/amps/i);
      await user.clear(evseAmpsInput);
      await user.type(evseAmpsInput, '80');

      // Check for validation messages
      await waitFor(() => {
        expect(screen.getByText(/continuous load/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('should show validation errors for invalid inputs', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // Try to enter invalid amperage
      const ampsInput = screen.getByLabelText(/amps/i);
      await user.clear(ampsInput);
      await user.type(ampsInput, '-10');

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument();
      });
    });

    test('should handle service overload scenarios', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // Set small main breaker
      const mainBreakerInput = screen.getByLabelText(/main breaker/i);
      await user.clear(mainBreakerInput);
      await user.type(mainBreakerInput, '100');

      // Add high-amperage loads
      const addLoadButton = screen.getByRole('button', { name: /add load/i });
      await user.click(addLoadButton);

      const ampsInput = screen.getByLabelText(/amps/i);
      await user.clear(ampsInput);
      await user.type(ampsInput, '90');

      // Should show overload warning
      await waitFor(() => {
        expect(screen.getByText(/overload/i)).toBeInTheDocument();
      });
    });
  });

  describe('PDF Export', () => {
    test('should generate PDF report successfully', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // Setup basic calculation
      const squareFootageInput = screen.getByLabelText(/square footage/i);
      await user.clear(squareFootageInput);
      await user.type(squareFootageInput, '1500');

      // Mock PDF generation
      const mockCreatePDF = vi.fn().mockResolvedValue(undefined);
      vi.mock('../../services/pdfExportService', () => ({
        exportToPDF: mockCreatePDF
      }));

      // Click export button
      const exportButton = screen.getByRole('button', { name: /export.*pdf/i });
      await user.click(exportButton);

      // Verify export was attempted
      await waitFor(() => {
        expect(mockCreatePDF).toHaveBeenCalled();
      });
    });
  });

  describe('State Persistence', () => {
    test('should maintain state when switching between tabs', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // Add general load
      const addLoadButton = screen.getByRole('button', { name: /add load/i });
      await user.click(addLoadButton);

      const loadNameInput = screen.getByPlaceholderText(/load description/i);
      await user.type(loadNameInput, 'Test Load');

      // Switch to HVAC tab
      const hvacTab = screen.getByRole('tab', { name: /hvac/i });
      await user.click(hvacTab);

      // Switch back to general loads
      const generalTab = screen.getByRole('tab', { name: /general/i });
      await user.click(generalTab);

      // Verify load is still there
      expect(screen.getByDisplayValue('Test Load')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    test('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // Tab through form elements
      await user.tab();
      expect(document.activeElement).toHaveAttribute('type', 'number');

      await user.tab();
      expect(document.activeElement).toHaveAttribute('type', 'text');
    });

    test('should have proper ARIA labels', () => {
      renderLoadCalculator();

      // Check for ARIA labels
      expect(screen.getByLabelText(/square footage/i)).toHaveAttribute('aria-label');
      expect(screen.getByLabelText(/main breaker/i)).toHaveAttribute('aria-label');
    });

    test('should announce calculation updates to screen readers', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      const squareFootageInput = screen.getByLabelText(/square footage/i);
      await user.clear(squareFootageInput);
      await user.type(squareFootageInput, '2000');

      // Check for live region updates
      await waitFor(() => {
        const liveRegion = screen.getByRole('status', { hidden: true });
        expect(liveRegion).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('should handle large numbers of loads without performance degradation', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      const startTime = performance.now();

      // Add multiple loads
      for (let i = 0; i < 20; i++) {
        const addLoadButton = screen.getByRole('button', { name: /add load/i });
        await user.click(addLoadButton);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000);
    });

    test('should not cause memory leaks with repeated calculations', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Perform multiple calculation updates
      const squareFootageInput = screen.getByLabelText(/square footage/i);
      for (let i = 1000; i <= 3000; i += 100) {
        await user.clear(squareFootageInput);
        await user.type(squareFootageInput, i.toString());
        await waitFor(() => {
          expect(screen.getByText(/total demand/i)).toBeInTheDocument();
        });
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero loads gracefully', () => {
      renderLoadCalculator();

      // Should show base electrical loads even with no added loads
      expect(screen.getByText(/general lighting/i)).toBeInTheDocument();
    });

    test('should handle maximum realistic values', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      // Test with large square footage
      const squareFootageInput = screen.getByLabelText(/square footage/i);
      await user.clear(squareFootageInput);
      await user.type(squareFootageInput, '50000');

      // Should calculate without errors
      await waitFor(() => {
        expect(screen.getByText(/total demand/i)).toBeInTheDocument();
      });
    });

    test('should handle rapid input changes', async () => {
      const user = userEvent.setup();
      renderLoadCalculator();

      const squareFootageInput = screen.getByLabelText(/square footage/i);

      // Rapidly change values
      for (let i = 0; i < 10; i++) {
        await user.clear(squareFootageInput);
        await user.type(squareFootageInput, (1000 + i * 100).toString());
      }

      // Should settle on final calculation
      await waitFor(() => {
        expect(screen.getByDisplayValue('1900')).toBeInTheDocument();
      });
    });
  });
});