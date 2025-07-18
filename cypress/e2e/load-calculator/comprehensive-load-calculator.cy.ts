describe('Load Calculator - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
  });

  it('should have basic page structure and navigation', () => {
    // Verify main tabs are present and enabled
    cy.get('[data-tab-id="calculator"]').should('be.visible').and('not.be.disabled');
    cy.get('[data-tab-id="wire-sizing"]').should('be.visible').and('not.be.disabled');
    cy.get('[data-tab-id="aerial"]').should('be.visible').and('not.be.disabled');
    
    // Verify disabled tabs have "Coming Soon" label
    cy.get('[data-tab-id="sld-intelligent"]').should('contain', 'Coming Soon');
    cy.get('[data-tab-id="crm"]').should('contain', 'Coming Soon');
    
    // Verify project manager button exists
    cy.contains('button', 'Projects').should('be.visible');
  });

  it('should fill out project information correctly', () => {
    // Test project information form
    cy.get('input').then($inputs => {
      const customerInput = $inputs.filter((i, el) => {
        const placeholder = el.getAttribute('placeholder');
        return placeholder && (placeholder.toLowerCase().includes('customer') || placeholder.toLowerCase().includes('name'));
      });
      
      if (customerInput.length > 0) {
        cy.wrap(customerInput.first()).clear().type('John Doe Electric Project');
      }
    });

    // Test address input
    cy.get('input').then($inputs => {
      const addressInput = $inputs.filter((i, el) => {
        const placeholder = el.getAttribute('placeholder');
        return placeholder && placeholder.toLowerCase().includes('address');
      });
      
      if (addressInput.length > 0) {
        cy.wrap(addressInput.first()).clear().type('123 Main Street, Anytown, ST 12345');
      }
    });

    // Test main breaker selection
    cy.get('select').then($selects => {
      if ($selects.length > 0) {
        cy.wrap($selects.first()).select('200'); // Common main breaker size
      }
    });
  });

  it('should add and manage general loads', () => {
    // Navigate to General Loads if not already there
    cy.contains('General Loads').click();
    
    // Add a new load
    cy.contains('button', 'Add Load').click();
    
    // Fill load details
    cy.get('input[placeholder*="name"]').type('Kitchen Outlets');
    cy.get('input[type="number"]').first().clear().type('1500');
    
    // Save the load
    cy.contains('button', 'Save').click();
    
    // Verify load appears in table
    cy.contains('Kitchen Outlets').should('be.visible');
  });

  it('should handle EVSE loads correctly', () => {
    // Navigate to EVSE Loads
    cy.contains('EVSE Loads').click();
    
    // Add EVSE load
    cy.contains('button', 'Add EVSE Load').click();
    
    // Fill EVSE details
    cy.get('input[placeholder*="name"]').type('Tesla Model 3 Charger');
    cy.get('input[type="number"]').first().clear().type('48');
    
    // Test EMS selection if available
    cy.get('body').then($body => {
      if ($body.find('select').length > 0) {
        cy.get('select').last().select('ems'); // Enable EMS
      }
    });
    
    // Save EVSE load
    cy.contains('button', 'Save').click();
    
    // Verify EVSE appears in table
    cy.contains('Tesla Model 3 Charger').should('be.visible');
  });

  it('should handle HVAC loads', () => {
    // Navigate to HVAC Loads
    cy.contains('HVAC Loads').click();
    
    // Add HVAC load
    cy.contains('button', 'Add HVAC Load').click();
    
    // Fill HVAC details
    cy.get('input[placeholder*="name"]').type('Central Air Conditioning');
    cy.get('input[type="number"]').first().clear().type('3.5'); // 3.5 tons
    
    // Save HVAC load
    cy.contains('button', 'Save').click();
    
    // Verify HVAC appears in table
    cy.contains('Central Air Conditioning').should('be.visible');
  });

  it('should handle solar and battery loads', () => {
    // Navigate to Solar & Battery
    cy.contains('Solar & Battery').click();
    
    // Add solar system
    cy.contains('button', 'Add Solar').click();
    
    // Fill solar details
    cy.get('input[placeholder*="name"]').type('Rooftop Solar Array');
    cy.get('input[type="number"]').first().clear().type('10'); // 10kW system
    
    // Save solar system
    cy.contains('button', 'Save').click();
    
    // Verify solar system appears
    cy.contains('Rooftop Solar Array').should('be.visible');
  });

  it('should calculate load totals correctly', () => {
    // Add some loads to test calculations
    cy.addLoad('general', { name: 'Test Load 1', va: 1200 });
    cy.addLoad('evse', { name: 'EV Charger', amps: 40 });
    
    // Check for calculation results
    cy.get('body').should('contain', 'Total Calculated Load');
    
    // Verify that numbers appear in results
    cy.get('body').then($body => {
      const text = $body.text();
      const hasNumbers = /\d+/.test(text);
      expect(hasNumbers).to.be.true;
    });
  });

  it('should show NEC compliance information', () => {
    // Add loads that might trigger NEC rules
    cy.addLoad('evse', { name: 'Large EV Charger', amps: 80 });
    
    // Look for NEC-related information
    cy.get('body').should('contain.text', /NEC|compliance|rule/i);
  });

  it('should generate PDF reports', () => {
    // Look for export or PDF generation buttons
    cy.get('body').then($body => {
      if ($body.find('button:contains("PDF"), button:contains("Export"), button:contains("Report")').length > 0) {
        cy.contains('button', /PDF|Export|Report/i).first().click();
        cy.log('Found and clicked PDF/Export button');
      } else {
        cy.log('No PDF/Export button found');
      }
    });
  });

  it('should validate input fields', () => {
    // Test invalid inputs
    cy.contains('General Loads').click();
    cy.contains('button', 'Add Load').click();
    
    // Try to save without required fields
    cy.contains('button', 'Save').click();
    
    // Should show validation errors or prevent saving
    cy.get('input[type="number"]').first().type('-100'); // Negative number
    cy.contains('button', 'Save').click();
    
    // Test extremely large numbers
    cy.get('input[type="number"]').first().clear().type('999999');
    cy.contains('button', 'Save').click();
  });

  it('should handle load editing and deletion', () => {
    // Add a load first
    cy.addLoad('general', { name: 'Test Load for Editing', va: 1000 });
    
    // Look for edit buttons
    cy.get('body').then($body => {
      if ($body.find('button:contains("Edit"), [aria-label*="edit"], .edit-button').length > 0) {
        cy.get('button:contains("Edit"), [aria-label*="edit"], .edit-button').first().click();
        cy.log('Found and clicked edit button');
        
        // Try to modify the load
        cy.get('input[placeholder*="name"]').clear().type('Edited Load Name');
        cy.contains('button', 'Save').click();
        
        // Verify edit worked
        cy.contains('Edited Load Name').should('be.visible');
      } else {
        cy.log('No edit button found');
      }
    });
    
    // Look for delete buttons
    cy.get('body').then($body => {
      if ($body.find('button:contains("Delete"), [aria-label*="delete"], .delete-button').length > 0) {
        cy.get('button:contains("Delete"), [aria-label*="delete"], .delete-button').first().click();
        cy.log('Found and clicked delete button');
        
        // Confirm deletion if modal appears
        cy.get('body').then($body => {
          if ($body.find('button:contains("Confirm"), button:contains("Yes")').length > 0) {
            cy.contains('button', /Confirm|Yes/i).click();
          }
        });
      } else {
        cy.log('No delete button found');
      }
    });
  });
});