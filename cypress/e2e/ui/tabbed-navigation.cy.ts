describe('Tabbed Navigation and UI Components - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
  });

  it('should display all main navigation tabs correctly', () => {
    // Verify all expected tabs are present
    const expectedTabs = ['calculator', 'wire-sizing', 'aerial', 'sld-intelligent', 'crm'];
    
    expectedTabs.forEach(tabId => {
      cy.get(`[data-tab-id="${tabId}"]`).should('exist');
    });
    
    // Verify calculator tab is active by default
    cy.get('[data-tab-id="calculator"]').should('have.attr', 'aria-selected', 'true');
    
    cy.log('All main navigation tabs are present');
  });

  it('should handle tab switching correctly', () => {
    // Test switching to enabled tabs
    const enabledTabs = ['calculator', 'wire-sizing', 'aerial'];
    
    enabledTabs.forEach(tabId => {
      cy.get(`[data-tab-id="${tabId}"]`).click();
      cy.wait(1000);
      
      // Verify tab becomes active
      cy.get(`[data-tab-id="${tabId}"]`).should('have.attr', 'aria-selected', 'true');
      
      // Verify other tabs are not active
      enabledTabs.filter(id => id !== tabId).forEach(otherId => {
        cy.get(`[data-tab-id="${otherId}"]`).should('have.attr', 'aria-selected', 'false');
      });
      
      cy.log(`Successfully switched to ${tabId} tab`);
    });
  });

  it('should handle disabled tabs appropriately', () => {
    // Test that disabled tabs show "Coming Soon" and don't respond to clicks
    const disabledTabs = ['sld-intelligent', 'crm'];
    
    disabledTabs.forEach(tabId => {
      // Verify tab shows "Coming Soon"
      cy.get(`[data-tab-id="${tabId}"]`).should('contain', 'Coming Soon');
      
      // Verify tab is disabled
      cy.get(`[data-tab-id="${tabId}"]`).should('be.disabled');
      
      // Try clicking and verify it doesn't become active
      cy.get(`[data-tab-id="${tabId}"]`).click({ force: true });
      cy.get(`[data-tab-id="${tabId}"]`).should('have.attr', 'aria-selected', 'false');
      
      cy.log(`${tabId} tab is properly disabled`);
    });
  });

  it('should support keyboard navigation', () => {
    // Start with calculator tab focused
    cy.get('[data-tab-id="calculator"]').focus();
    
    // Test arrow key navigation
    cy.get('[data-tab-id="calculator"]').trigger('keydown', { key: 'ArrowRight' });
    cy.wait(500);
    
    // Should move to next enabled tab (wire-sizing)
    cy.get('[data-tab-id="wire-sizing"]').should('be.focused');
    
    // Test left arrow
    cy.get('[data-tab-id="wire-sizing"]').trigger('keydown', { key: 'ArrowLeft' });
    cy.wait(500);
    
    // Should move back to calculator
    cy.get('[data-tab-id="calculator"]').should('be.focused');
    
    // Test Enter key activation
    cy.get('[data-tab-id="wire-sizing"]').focus();
    cy.get('[data-tab-id="wire-sizing"]').trigger('keydown', { key: 'Enter' });
    cy.wait(500);
    
    // Should activate the wire-sizing tab
    cy.get('[data-tab-id="wire-sizing"]').should('have.attr', 'aria-selected', 'true');
    
    cy.log('Keyboard navigation works correctly');
  });

  it('should be responsive on different screen sizes', () => {
    // Test mobile view
    cy.viewport(375, 667);
    cy.wait(1000);
    
    // Verify tabs are still visible and usable
    cy.get('[data-tab-id="calculator"]').should('be.visible');
    cy.get('[data-tab-id="wire-sizing"]').should('be.visible');
    
    // Test horizontal scrolling on mobile if needed
    cy.get('[role="tablist"]').scrollTo('right');
    cy.wait(500);
    cy.get('[data-tab-id="aerial"]').should('be.visible');
    
    // Test tablet view
    cy.viewport(768, 1024);
    cy.wait(1000);
    cy.get('[data-tab-id="calculator"]').should('be.visible');
    
    // Test desktop view
    cy.viewport(1280, 720);
    cy.wait(1000);
    cy.get('[data-tab-id="calculator"]').should('be.visible');
    
    cy.log('Tabbed navigation is responsive across screen sizes');
  });

  it('should maintain proper ARIA attributes', () => {
    // Check tablist role
    cy.get('[role="tablist"]').should('exist');
    
    // Check individual tab roles and attributes
    cy.get('[data-tab-id="calculator"]').should('have.attr', 'role', 'tab');
    cy.get('[data-tab-id="calculator"]').should('have.attr', 'aria-controls');
    cy.get('[data-tab-id="calculator"]').should('have.attr', 'aria-selected');
    
    // Check tabpanel
    cy.get('[role="tabpanel"]').should('exist');
    cy.get('[role="tabpanel"]').should('have.attr', 'aria-labelledby');
    
    cy.log('ARIA attributes are properly set for accessibility');
  });

  it('should display project manager button correctly', () => {
    // Verify Projects button is visible
    cy.contains('button', /Projects|Files/).should('be.visible');
    
    // Test button functionality
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Should open project manager modal
    cy.get('[role="dialog"], .modal, .overlay').should('be.visible');
    
    // Close modal
    cy.get('body').type('{esc}');
    cy.wait(500);
    
    cy.log('Project manager button works correctly');
  });

  it('should handle tab content loading states', () => {
    // Switch to a lazy-loaded tab (aerial view)
    cy.get('[data-tab-id="aerial"]').click();
    
    // Look for loading indicators
    cy.get('body').then($body => {
      const text = $body.text();
      const hasLoading = /loading|please.wait|initializing/i.test(text);
      
      if (hasLoading) {
        cy.log('Found loading state for lazy-loaded content');
      }
    });
    
    // Wait for content to load
    cy.wait(3000);
    
    // Verify content eventually loads
    cy.get('[role="tabpanel"]').should('be.visible');
    
    cy.log('Tab content loading handled correctly');
  });

  it('should handle error boundaries gracefully', () => {
    // Try switching between tabs to test error boundaries
    const tabs = ['calculator', 'wire-sizing', 'aerial'];
    
    tabs.forEach(tabId => {
      cy.get(`[data-tab-id="${tabId}"]`).click();
      cy.wait(1000);
      
      // Verify no error boundary is triggered
      cy.get('body').should('not.contain', 'Something went wrong');
      cy.get('body').should('not.contain', 'Error');
      
      // Verify content loads
      cy.get('[role="tabpanel"]').should('be.visible');
    });
    
    cy.log('Error boundaries are working correctly');
  });

  it('should maintain tab state during navigation', () => {
    // Switch to wire sizing tab
    cy.get('[data-tab-id="wire-sizing"]').click();
    cy.wait(1000);
    
    // Verify active state
    cy.get('[data-tab-id="wire-sizing"]').should('have.attr', 'aria-selected', 'true');
    
    // Open and close project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    cy.get('body').type('{esc}');
    cy.wait(500);
    
    // Verify tab state is maintained
    cy.get('[data-tab-id="wire-sizing"]').should('have.attr', 'aria-selected', 'true');
    
    cy.log('Tab state is maintained during other interactions');
  });

  it('should handle tab focus management correctly', () => {
    // Click on a tab
    cy.get('[data-tab-id="wire-sizing"]').click();
    
    // Tab should receive focus and be keyboard navigable
    cy.get('[data-tab-id="wire-sizing"]').should('have.attr', 'tabindex', '0');
    
    // Other tabs should not be in tab order
    cy.get('[data-tab-id="calculator"]').should('have.attr', 'tabindex', '-1');
    cy.get('[data-tab-id="aerial"]').should('have.attr', 'tabindex', '-1');
    
    cy.log('Tab focus management is working correctly');
  });

  it('should display proper visual states for tabs', () => {
    // Test active tab styling
    cy.get('[data-tab-id="calculator"]').should('have.class', /blue|active/);
    
    // Test hover states by moving mouse
    cy.get('[data-tab-id="wire-sizing"]').trigger('mouseover');
    cy.wait(500);
    
    // Test focus states
    cy.get('[data-tab-id="wire-sizing"]').focus();
    cy.get('[data-tab-id="wire-sizing"]').should('have.css', 'outline').or('have.css', 'box-shadow');
    
    cy.log('Visual states for tabs are working correctly');
  });

  it('should handle rapid tab switching', () => {
    // Rapidly switch between tabs
    const tabs = ['calculator', 'wire-sizing', 'aerial', 'calculator'];
    
    tabs.forEach((tabId, index) => {
      cy.get(`[data-tab-id="${tabId}"]`).click();
      cy.wait(200); // Short wait to test rapid switching
    });
    
    // Verify final state is correct
    cy.get('[data-tab-id="calculator"]').should('have.attr', 'aria-selected', 'true');
    cy.get('[role="tabpanel"]').should('be.visible');
    
    cy.log('Rapid tab switching handled correctly');
  });
});