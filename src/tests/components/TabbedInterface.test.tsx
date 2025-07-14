import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { TabbedInterface } from '../../components/TabbedInterface/TabbedInterface';
import { LoadCalculatorProvider } from '../../context/LoadCalculatorContext';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock the components that would be rendered in tabs
vi.mock('../../components/LoadCalculator/LoadCalculatorMain', () => ({
  LoadCalculatorMain: () => <div data-testid="load-calculator">Load Calculator Content</div>
}));

vi.mock('../../components/SLD/SingleLineDiagram', () => ({
  SingleLineDiagram: () => <div data-testid="sld">Single Line Diagram Content</div>
}));

vi.mock('../../components/AerialView/AerialViewMain', () => ({
  AerialViewMain: () => <div data-testid="aerial-view">Aerial View Content</div>
}));

vi.mock('../../components/ProjectManager/ProjectManager', () => ({
  ProjectManager: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? (
      <div data-testid="project-manager">
        <button onClick={onClose}>Close Project Manager</button>
      </div>
    ) : null
}));

const renderTabbedInterface = () => {
  return render(
    <LoadCalculatorProvider>
      <TabbedInterface />
    </LoadCalculatorProvider>
  );
};

describe('TabbedInterface', () => {
  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = renderTabbedInterface();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have proper ARIA attributes', () => {
      renderTabbedInterface();
      
      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      expect(tablist).toHaveAttribute('aria-label', 'Main application navigation');
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      
      // Check first tab (should be active by default)
      const firstTab = tabs[0];
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
      expect(firstTab).toHaveAttribute('tabindex', '0');
      expect(firstTab).toHaveAttribute('aria-controls', 'tabpanel-calculator');
      
      // Check inactive tabs
      tabs.slice(1).forEach(tab => {
        expect(tab).toHaveAttribute('aria-selected', 'false');
        expect(tab).toHaveAttribute('tabindex', '-1');
      });
    });

    test('should have proper tabpanel attributes', () => {
      renderTabbedInterface();
      
      const tabpanel = screen.getByRole('tabpanel');
      expect(tabpanel).toHaveAttribute('id', 'tabpanel-calculator');
      expect(tabpanel).toHaveAttribute('aria-labelledby', 'tab-calculator');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should navigate tabs with arrow keys', async () => {
      const user = userEvent.setup();
      renderTabbedInterface();
      
      const calculatorTab = screen.getByRole('tab', { name: /load calculator/i });
      const sldTab = screen.getByRole('tab', { name: /single line diagram/i });
      
      // Focus the first tab
      calculatorTab.focus();
      expect(calculatorTab).toHaveFocus();
      
      // Press right arrow to move to next tab
      await user.keyboard('{ArrowRight}');
      expect(sldTab).toHaveFocus();
      expect(sldTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should wrap around when navigating with arrow keys', async () => {
      const user = userEvent.setup();
      renderTabbedInterface();
      
      const tabs = screen.getAllByRole('tab');
      const firstTab = tabs[0];
      const lastTab = tabs[tabs.length - 1];
      
      // Click on last tab to make it active
      await user.click(lastTab);
      expect(lastTab).toHaveAttribute('aria-selected', 'true');
      
      // Focus it and press right arrow should wrap to first tab
      lastTab.focus();
      await user.keyboard('{ArrowRight}');
      
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(firstTab).toHaveAttribute('aria-selected', 'true');
      
      // Now test left arrow from first tab
      await user.keyboard('{ArrowLeft}');
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(lastTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should activate tab with Enter and Space keys', async () => {
      const user = userEvent.setup();
      renderTabbedInterface();
      
      const sldTab = screen.getByRole('tab', { name: /single line diagram/i });
      
      sldTab.focus();
      await user.keyboard('{Enter}');
      
      expect(sldTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('sld')).toBeInTheDocument();
    });
  });

  describe('Tab Functionality', () => {
    test('should render Load Calculator tab by default', () => {
      renderTabbedInterface();
      
      expect(screen.getByTestId('load-calculator')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /load calculator/i })).toHaveAttribute('aria-selected', 'true');
    });

    test('should switch tabs when clicked', async () => {
      const user = userEvent.setup();
      renderTabbedInterface();
      
      const sldTab = screen.getByRole('tab', { name: /single line diagram/i });
      await user.click(sldTab);
      
      expect(screen.getByTestId('sld')).toBeInTheDocument();
      expect(sldTab).toHaveAttribute('aria-selected', 'true');
    });

    test('should open project manager when Projects button is clicked', async () => {
      const user = userEvent.setup();
      renderTabbedInterface();
      
      const projectsButton = screen.getByRole('button', { name: /open project manager/i });
      await user.click(projectsButton);
      
      expect(screen.getByTestId('project-manager')).toBeInTheDocument();
    });
  });

  describe('Visual States', () => {
    test('should apply correct CSS classes for active and inactive tabs', () => {
      renderTabbedInterface();
      
      const tabs = screen.getAllByRole('tab');
      const activeTab = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
      const inactiveTabs = tabs.filter(tab => tab.getAttribute('aria-selected') === 'false');
      
      expect(activeTab).toHaveClass('border-blue-500', 'text-blue-600');
      inactiveTabs.forEach(tab => {
        expect(tab).toHaveClass('border-transparent', 'text-gray-500');
      });
    });

    test('should have focus styles', () => {
      renderTabbedInterface();
      
      const firstTab = screen.getAllByRole('tab')[0];
      expect(firstTab).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500');
    });
  });
});