describe('Guest Login Debug', () => {
  it('should be able to login as guest', () => {
    // Visit login page
    cy.visit('/login');
    cy.log('Visited login page');
    
    // Check if we're on login page
    cy.url().should('include', '/login');
    cy.log('Confirmed we are on login page');
    
    // Scroll to bottom to find guest login button
    cy.scrollTo('bottom');
    cy.log('Scrolled to bottom');
    
    // Check if guest login button exists
    cy.get('[data-cy="guest-login"]').should('be.visible');
    cy.log('Found guest login button');
    
    // Click guest login button
    cy.get('[data-cy="guest-login"]').click();
    cy.log('Clicked guest login button');
    
    // Wait and check for any error messages
    cy.wait(3000);
    cy.log('Waited 3 seconds after click');
    
    // Check current URL
    cy.url().then((url) => {
      cy.log('Current URL:', url);
    });
    
    // Check if we're still on login page
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="guest-login"]').length > 0) {
        cy.log('Still on login page - guest login failed');
        // Log any error messages
        cy.get('body').then(($body) => {
          const pageText = $body.text();
          cy.log('Page content:', pageText);
        });
      } else {
        cy.log('Successfully left login page');
      }
    });
  });
}); 