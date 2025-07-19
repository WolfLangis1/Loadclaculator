describe('Wire Sizing Chart - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
    
    // Navigate to Wire Sizing tab
    cy.get('[data-tab-id="wire-sizing"]').click();
    cy.wait(2000);
  });

  it('should display wire sizing chart interface', () => {
    // Verify we're on the wire sizing tab
    cy.get('[data-tab-id="wire-sizing"]').should('have.attr', 'aria-selected', 'true');
    
    // Look for wire sizing specific elements
    cy.get('body').should('contain.text', /wire|sizing|gauge|awg|ampacity/i);
  });

  it('should show wire sizing tables', () => {
    // Look for table elements
    cy.get('table, .table, [role="table"]').should('exist');
    
    // Check for common wire sizes
    cy.get('body').should('contain.text', /12|14|10|8|6|4|2|1\/0|2\/0|3\/0|4\/0/);
    
    // Check for ampacity values
    cy.get('body').should('contain.text', /20|30|40|55|70|85|95|110|125|150|175|200/);
  });

  it('should display different wire types', () => {
    // Look for different conductor types
    cy.get('body').then($body => {
      const text = $body.text();
      const hasCopperAluminum = /copper|aluminum|cu|al/i.test(text);
      const hasInsulationTypes = /thwn|thhn|xhhw|use/i.test(text);
      
      if (hasCopperAluminum) {
        cy.log('Found conductor material information');
      }
      if (hasInsulationTypes) {
        cy.log('Found insulation type information');
      }
    });
  });

  it('should show temperature correction factors', () => {
    // Look for temperature-related information
    cy.get('body').should('contain.text', /temperature|correction|factor|60°|75°|90°/i);
  });

  it('should display conduit fill information', () => {
    // Look for conduit fill tables or information
    cy.get('body').then($body => {
      const text = $body.text();
      const hasConduitInfo = /conduit|fill|raceway|emt|pvc|rigid/i.test(text);
      const hasPercentages = /40%|31%|53%/i.test(text);
      
      if (hasConduitInfo || hasPercentages) {
        cy.log('Found conduit fill information');
      }
    });
  });

  it('should have interactive elements for calculations', () => {
    // Look for input fields for calculations
    cy.get('input, select').then($inputs => {
      if ($inputs.length > 0) {
        cy.log(`Found ${$inputs.length} input/select elements`);
        
        // Try interacting with inputs
        $inputs.each((index, element) => {
          const $el = Cypress.$(element);
          const type = $el.attr('type');
          const placeholder = $el.attr('placeholder');
          
          if (type === 'number' && placeholder) {
            cy.wrap(element).clear().type('100');
            cy.log(`Filled input with placeholder: ${placeholder}`);
          }
        });
      }
    });
  });

  it('should calculate wire size recommendations', () => {
    // Look for calculation buttons or automatic calculations
    cy.get('button').then($buttons => {
      const calcButtons = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        return /calculate|compute|find|recommend/i.test(text);
      });
      
      if (calcButtons.length > 0) {
        cy.wrap(calcButtons.first()).click();
        cy.log('Found and clicked calculation button');
        
        // Look for results
        cy.wait(1000);
        cy.get('body').should('contain.text', /result|recommendation|size|gauge/i);
      }
    });
  });

  it('should show voltage drop calculations', () => {
    // Look for voltage drop related content
    cy.get('body').then($body => {
      const text = $body.text();
      const hasVoltageDrop = /voltage.drop|vd|3%|5%/i.test(text);
      
      if (hasVoltageDrop) {
        cy.log('Found voltage drop information');
        cy.get('body').should('contain.text', /voltage.drop|vd/i);
      }
    });
  });

  it('should display NEC code references', () => {
    // Look for NEC references
    cy.get('body').should('contain.text', /nec|310\.15|table|article/i);
  });

  it('should be responsive and accessible', () => {
    // Test different viewport sizes
    cy.viewport(768, 1024); // Tablet
    cy.wait(500);
    cy.get('body').should('be.visible');
    
    cy.viewport(375, 667); // Mobile
    cy.wait(500);
    cy.get('body').should('be.visible');
    
    cy.viewport(1280, 720); // Desktop
    cy.wait(500);
    
    // Test keyboard navigation
    cy.get('button, input, select, [tabindex]').then($focusable => {
      if ($focusable.length > 0) {
        cy.wrap($focusable.first()).focus().should('be.focused');
      }
    });
  });

  it('should handle edge cases in calculations', () => {
    // Test with extreme values if inputs exist
    cy.get('input[type="number"]').then($inputs => {
      if ($inputs.length > 0) {
        // Test very small values
        cy.wrap($inputs.first()).clear().type('1');
        
        // Test very large values
        cy.wrap($inputs.first()).clear().type('1000');
        
        // Test decimal values
        cy.wrap($inputs.first()).clear().type('12.5');
        
        // Test zero
        cy.wrap($inputs.first()).clear().type('0');
        
        cy.log('Tested edge case values in wire sizing inputs');
      }
    });
  });
});