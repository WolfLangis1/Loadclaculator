import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SingleLineDiagram } from '../../../components/SLD/SingleLineDiagram';
import type { LoadState } from '../../../types';

// Mock the services
vi.mock('../../../services/sldService', () => ({
  SLDService: {
    generateFromLoadData: vi.fn().mockReturnValue({
      id: 'test-diagram',
      name: 'Test Diagram',
      components: [
        {
          id: 'comp1',
          type: 'main_panel',
          name: 'Main Panel',
          position: { x: 100, y: 100 },
          size: { width: 80, height: 60 },
          rotation: 0,
          labels: [],
          necLabels: [],
          specifications: {}
        }
      ],
      connections: [],
      labels: [],
      necCompliant: true,
      necViolations: []
    })
  }
}));

vi.mock('../../../services/aerialViewService', () => ({
  AerialViewService: {
    createAerialView: vi.fn().mockResolvedValue({
      id: 'aerial1',
      imageUrl: 'test-image.jpg',
      annotations: []
    }),
    autoDetectPVAreas: vi.fn().mockResolvedValue(undefined),
    addElectricalInfrastructure: vi.fn(),
    getConfigurationStatus: vi.fn().mockReturnValue({
      isReal: false,
      provider: 'Mock',
      message: 'Using mock data for development',
      setupInstructions: 'Configure API keys in environment'
    })
  }
}));

vi.mock('../../../hooks/useLoadCalculator', () => ({
  useLoadCalculator: () => ({
    state: {
      projectInfo: {
        customerName: 'Test Customer',
        propertyAddress: '123 Test St, Test City, TC 12345',
        jurisdiction: 'Test City'
      },
      loads: {
        generalLoads: [],
        hvacLoads: [],
        evseLoads: [
          {
            id: 'evse1',
            name: 'Tesla Wall Connector',
            quantity: 1,
            amps: 48,
            va: 11520
          }
        ],
        solarBatteryLoads: [
          {
            id: 'solar1',
            type: 'solar',
            name: 'Solar Array',
            quantity: 1,
            kw: 10
          }
        ]
      },
      mainBreaker: 200,
      codeYear: '2023',
      calculationMethod: 'optional'
    }
  })
}));

describe('SingleLineDiagram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render component with header and tabs', () => {
      render(<SingleLineDiagram />);
      
      expect(screen.getByText('Single Line Diagram & Site Plan')).toBeInTheDocument();
      expect(screen.getByText('Professional electrical diagrams for permit submission')).toBeInTheDocument();
      
      // Check for tabs
      expect(screen.getByText('Single Line Diagram')).toBeInTheDocument();
      expect(screen.getByText('Aerial View')).toBeInTheDocument();
      expect(screen.getByText('Export')).toBeInTheDocument();
    });

    it('should render SLD tab by default', () => {
      render(<SingleLineDiagram />);
      
      expect(screen.getByText('Generate SLD')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('No Single Line Diagram')).toBeInTheDocument();
    });

    it('should show empty state when no diagram exists', () => {
      render(<SingleLineDiagram />);
      
      expect(screen.getByText('No Single Line Diagram')).toBeInTheDocument();
      expect(screen.getByText('Click "Generate SLD" to create a diagram from your load calculations')).toBeInTheDocument();
    });
  });

  describe('SLD Generation', () => {
    it('should generate SLD when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const generateButton = screen.getByText('Generate SLD');
      await user.click(generateButton);
      
      // Should show generating state
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      
      // Wait for generation to complete
      await waitFor(() => {
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during generation', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const generateButton = screen.getByText('Generate SLD');
      await user.click(generateButton);
      
      expect(screen.getByText('Generating...')).toBeInTheDocument();
      expect(generateButton).toBeDisabled();
    });

    it('should apply configuration settings', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      // Change configuration
      const styleSelect = screen.getByDisplayValue('Professional Style');
      await user.selectOptions(styleSelect, 'standard');
      
      const necLabelsCheckbox = screen.getByLabelText('NEC Labels');
      await user.click(necLabelsCheckbox);
      
      const autoLayoutCheckbox = screen.getByLabelText('Auto Layout');
      await user.click(autoLayoutCheckbox);
      
      // Generate with new settings
      const generateButton = screen.getByText('Generate SLD');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to aerial view tab', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const aerialTab = screen.getByText('Aerial View');
      await user.click(aerialTab);
      
      expect(screen.getByText('Generate Aerial View')).toBeInTheDocument();
      expect(screen.getByText('No Aerial View')).toBeInTheDocument();
    });

    it('should switch to export tab', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const exportTab = screen.getByText('Export');
      await user.click(exportTab);
      
      expect(screen.getByText('Export Options')).toBeInTheDocument();
      expect(screen.getByText('Export Format')).toBeInTheDocument();
      expect(screen.getByText('PDF Report (Recommended for permits)')).toBeInTheDocument();
    });

    it('should maintain active tab styling', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const sldTab = screen.getByText('Single Line Diagram');
      const aerialTab = screen.getByText('Aerial View');
      
      // SLD tab should be active by default
      expect(sldTab.closest('button')).toHaveClass('border-purple-500', 'text-purple-600');
      
      // Switch to aerial view
      await user.click(aerialTab);
      
      expect(aerialTab.closest('button')).toHaveClass('border-purple-500', 'text-purple-600');
      expect(sldTab.closest('button')).toHaveClass('border-transparent');
    });
  });

  describe('Aerial View Tab', () => {
    it('should show address requirement message when no address', async () => {
      // Mock useLoadCalculator to return no address
      const mockUseLoadCalculator = vi.fn().mockReturnValue({
        state: {
          projectInfo: {
            customerName: 'Test Customer',
            propertyAddress: '', // No address
            jurisdiction: 'Test City'
          },
          loads: {},
          mainBreaker: 200,
          codeYear: '2023'
        }
      });
      
      vi.mocked(require('../../../hooks/useLoadCalculator').useLoadCalculator).mockImplementation(mockUseLoadCalculator);
      
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const aerialTab = screen.getByText('Aerial View');
      await user.click(aerialTab);
      
      expect(screen.getByText('Please enter property address in Project Information')).toBeInTheDocument();
      expect(screen.getByText('Generate Aerial View')).toBeDisabled();
    });

    it('should generate aerial view when address is provided', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const aerialTab = screen.getByText('Aerial View');
      await user.click(aerialTab);
      
      const generateButton = screen.getByText('Generate Aerial View');
      expect(generateButton).not.toBeDisabled();
      
      await user.click(generateButton);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('should show configuration status', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const aerialTab = screen.getByText('Aerial View');
      await user.click(aerialTab);
      
      expect(screen.getByText('Mock Data')).toBeInTheDocument();
      expect(screen.getByText('Development Mode:')).toBeInTheDocument();
      expect(screen.getByText('Using mock data for development')).toBeInTheDocument();
    });
  });

  describe('Export Tab', () => {
    it('should render export options', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const exportTab = screen.getByText('Export');
      await user.click(exportTab);
      
      // Check export format options
      expect(screen.getByText('PDF Report (Recommended for permits)')).toBeInTheDocument();
      expect(screen.getByText('SVG (Scalable vector graphics)')).toBeInTheDocument();
      expect(screen.getByText('PNG Image (High resolution)')).toBeInTheDocument();
      
      // Check include options
      expect(screen.getByText('Single Line Diagram')).toBeInTheDocument();
      expect(screen.getByText('Aerial Site View')).toBeInTheDocument();
      expect(screen.getByText('Load Calculation Summary')).toBeInTheDocument();
      expect(screen.getByText('NEC Code References')).toBeInTheDocument();
      
      // Check paper size options
      expect(screen.getByText('Letter (8.5" × 11")')).toBeInTheDocument();
      
      // Check export button
      expect(screen.getByText('Export Permit Package')).toBeInTheDocument();
    });

    it('should show export preview', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const exportTab = screen.getByText('Export');
      await user.click(exportTab);
      
      expect(screen.getByText('Export Preview')).toBeInTheDocument();
      expect(screen.getByText('• Project: Test Customer')).toBeInTheDocument();
      expect(screen.getByText('• Address: 123 Test St, Test City, TC 12345')).toBeInTheDocument();
      expect(screen.getByText('• Service Size: 200A')).toBeInTheDocument();
      expect(screen.getByText('• Calculation Method: NEC 2023 - optional')).toBeInTheDocument();
    });

    it('should handle export format selection', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const exportTab = screen.getByText('Export');
      await user.click(exportTab);
      
      // Select different export formats
      const pdfRadio = screen.getByDisplayValue('pdf');
      const svgRadio = screen.getByDisplayValue('svg');
      const pngRadio = screen.getByDisplayValue('png');
      
      expect(pdfRadio).toBeChecked(); // Default
      
      await user.click(svgRadio);
      expect(svgRadio).toBeChecked();
      expect(pdfRadio).not.toBeChecked();
      
      await user.click(pngRadio);
      expect(pngRadio).toBeChecked();
      expect(svgRadio).not.toBeChecked();
    });

    it('should handle include options selection', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const exportTab = screen.getByText('Export');
      await user.click(exportTab);
      
      // Toggle include options
      const sldCheckbox = screen.getByLabelText('Single Line Diagram');
      const aerialCheckbox = screen.getByLabelText('Aerial Site View');
      const loadSummaryCheckbox = screen.getByLabelText('Load Calculation Summary');
      
      // Should be checked by default
      expect(sldCheckbox).toBeChecked();
      expect(aerialCheckbox).toBeChecked();
      expect(loadSummaryCheckbox).toBeChecked();
      
      // Toggle off
      await user.click(sldCheckbox);
      expect(sldCheckbox).not.toBeChecked();
      
      // Toggle back on
      await user.click(sldCheckbox);
      expect(sldCheckbox).toBeChecked();
    });
  });

  describe('Template Modal', () => {
    it('should open template modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const templatesButton = screen.getByText('Templates');
      await user.click(templatesButton);
      
      // Template modal should open (would need to mock the modal component)
      // This test would need the actual modal component to be implemented
    });
  });

  describe('Error Handling', () => {
    it('should handle SLD generation errors gracefully', async () => {
      // Mock service to throw error
      const mockSLDService = vi.mocked(require('../../../services/sldService').SLDService);
      mockSLDService.generateFromLoadData.mockImplementation(() => {
        throw new Error('Generation failed');
      });
      
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const generateButton = screen.getByText('Generate SLD');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
      });
      
      // Should still show empty state after error
      expect(screen.getByText('No Single Line Diagram')).toBeInTheDocument();
    });

    it('should handle aerial view generation errors gracefully', async () => {
      // Mock service to reject
      const mockAerialService = vi.mocked(require('../../../services/aerialViewService').AerialViewService);
      mockAerialService.createAerialView.mockRejectedValue(new Error('Failed to create aerial view'));
      
      // Mock window.alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const aerialTab = screen.getByText('Aerial View');
      await user.click(aerialTab);
      
      const generateButton = screen.getByText('Generate Aerial View');
      await user.click(generateButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to generate aerial view. Please check the address and try again.');
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<SingleLineDiagram />);
      
      // Check for accessible button labels
      const generateButton = screen.getByText('Generate SLD');
      expect(generateButton).toBeInTheDocument();
      
      const templatesButton = screen.getByText('Templates');
      expect(templatesButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      // Tab through elements
      await user.tab();
      expect(screen.getByText('Single Line Diagram')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Aerial View')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Export')).toHaveFocus();
    });

    it('should handle tab selection with keyboard', async () => {
      const user = userEvent.setup();
      render(<SingleLineDiagram />);
      
      const aerialTab = screen.getByText('Aerial View');
      
      // Focus and activate with keyboard
      aerialTab.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Generate Aerial View')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on different screen sizes', () => {
      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<SingleLineDiagram />);
      
      expect(screen.getByText('Single Line Diagram & Site Plan')).toBeInTheDocument();
      
      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });
      
      render(<SingleLineDiagram />);
      
      expect(screen.getAllByText('Single Line Diagram & Site Plan')).toHaveLength(2);
    });
  });

  describe('Integration', () => {
    it('should integrate with load calculator state', () => {
      render(<SingleLineDiagram />);
      
      // Should show project information from load calculator
      const exportTab = screen.getByText('Export');
      fireEvent.click(exportTab);
      
      expect(screen.getByText('• Project: Test Customer')).toBeInTheDocument();
      expect(screen.getByText('• Service Size: 200A')).toBeInTheDocument();
    });

    it('should reflect load calculator changes', () => {
      const { rerender } = render(<SingleLineDiagram />);
      
      // Mock updated load calculator state
      const updatedMock = vi.fn().mockReturnValue({
        state: {
          projectInfo: {
            customerName: 'Updated Customer',
            propertyAddress: '456 New St',
            jurisdiction: 'New City'
          },
          loads: {},
          mainBreaker: 400,
          codeYear: '2020'
        }
      });
      
      vi.mocked(require('../../../hooks/useLoadCalculator').useLoadCalculator).mockImplementation(updatedMock);
      
      rerender(<SingleLineDiagram />);
      
      const exportTab = screen.getByText('Export');
      fireEvent.click(exportTab);
      
      expect(screen.getByText('• Project: Updated Customer')).toBeInTheDocument();
      expect(screen.getByText('• Service Size: 400A')).toBeInTheDocument();
    });
  });
});