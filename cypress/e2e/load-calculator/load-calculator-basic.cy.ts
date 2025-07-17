describe('Load Calculator - Basic Elements', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    // Wait for the page to fully load
    cy.wait(3000);
  });

  it('should verify the page loads and has basic structure', () => {
    // Verify we're not on login page
    cy.url().should('not.include', '/login');
    
    // Check if the main load calculator container exists
    cy.get('[data-cy="load-calculator"]').should('exist');
    
    // Check if we can find any input fields
    cy.get('input').should('have.length.greaterThan', 0);
    
    // Check if we can find any buttons
    cy.get('button').should('have.length.greaterThan', 0);
  });

  it('should be able to interact with project information fields', () => {
    // Look for customer name input - try different selectors
    cy.get('input').then(($inputs) => {
      // Log all input placeholders to see what's available
      $inputs.each((index, input) => {
        const placeholder = Cypress.$(input).attr('placeholder');
        const name = Cypress.$(input).attr('name');
        const id = Cypress.$(input).attr('id');
        if (placeholder || name || id) {
          cy.log(`Input ${index}: placeholder="${placeholder}", name="${name}", id="${id}"`);
        }
      });
    });
    
    // Try to find customer input by common patterns
    cy.get('input[placeholder*="customer"], input[placeholder*="Customer"], input[name*="customer"], input[name*="Customer"]').first().then(($input) => {
      if ($input.length > 0) {
        cy.wrap($input).clear().type('Test Customer');
        cy.log('Found and filled customer input');
      } else {
        cy.log('No customer input found');
      }
    });
  });

  it('should be able to navigate between tabs', () => {
    // Look for tab buttons - try different patterns
    cy.get('button').then(($buttons) => {
      $buttons.each((index, button) => {
        const text = Cypress.$(button).text().trim();
        if (text && (text.includes('Load') || text.includes('EVSE') || text.includes('HVAC') || text.includes('Solar'))) {
          cy.log(`Found tab button: "${text}"`);
        }
      });
    });
    
    // Try to click on General Loads tab
    cy.contains('button', 'General Loads').click({ force: true });
    cy.log('Attempted to click General Loads tab');
  });

  it('should be able to add a basic load', () => {
    // Try to find and click "Add Load" button
    cy.contains('button', 'Add Load').click({ force: true });
    cy.log('Attempted to click Add Load button');
    
    // Try to fill in load details
    cy.get('input[placeholder*="name"], input[name*="name"]').first().type('Test Load');
    cy.get('input[type="number"]').first().type('1500');
    
    // Try to save
    cy.contains('button', 'Save').click();
    cy.log('Attempted to save load');
  });
}); 