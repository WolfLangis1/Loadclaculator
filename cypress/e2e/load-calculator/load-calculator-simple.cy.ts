describe('Load Calculator - Simple Test', () => {
  beforeEach(() => {
    cy.loginAsGuest();
  });

  it('should load the Load Calculator page and verify basic elements', () => {
    // Wait for the page to load
    cy.wait(2000);
    
    // Log the current URL to confirm we're not on login page
    cy.url().then((url) => {
      cy.log('Current URL:', url);
    });
    
    // Check if we can find the main load calculator container
    cy.get('body').then(($body) => {
      cy.log('Body content length:', $body.text().length);
      
      // Look for common elements that should exist
      if ($body.find('[data-cy="load-calculator"]').length > 0) {
        cy.log('Found load-calculator container');
      } else {
        cy.log('load-calculator container not found');
      }
      
      // Look for any input fields
      const inputs = $body.find('input');
      cy.log('Found input fields:', inputs.length);
      
      // Look for any buttons
      const buttons = $body.find('button');
      cy.log('Found buttons:', buttons.length);
      
      // Look for any select elements
      const selects = $body.find('select');
      cy.log('Found select elements:', selects.length);
      
      // Log some button text to see what's available
      buttons.each((index, button) => {
        const text = Cypress.$(button).text().trim();
        if (text) {
          cy.log(`Button ${index}: "${text}"`);
        }
      });
    });
    
    // Try to find any elements with data-cy attributes
    cy.get('[data-cy]').then(($elements) => {
      cy.log('Found elements with data-cy:', $elements.length);
      $elements.each((index, element) => {
        const dataCy = Cypress.$(element).attr('data-cy');
        cy.log(`data-cy ${index}: "${dataCy}"`);
      });
    });
  });
}); 