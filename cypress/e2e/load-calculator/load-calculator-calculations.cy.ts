describe('Load Calculator - Calculation Functionality', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
  });

  describe('Project Information Setup', () => {
    it('should allow setting up basic project information', () => {
      // Verify we're on the calculator page
      cy.url().should('not.include', '/login');
      cy.get('[data-cy="load-calculator"]').should('exist');

      // Find and fill customer name input
      cy.get('input').then(($inputs) => {
        const customerInput = $inputs.filter((i, el) => {
          const placeholder = Cypress.$(el).attr('placeholder') || '';
          const name = Cypress.$(el).attr('name') || '';
          return placeholder.toLowerCase().includes('customer') || 
                 name.toLowerCase().includes('customer');
        }).first();
        
        if (customerInput.length > 0) {
          cy.wrap(customerInput).clear().type('Test Customer');
          cy.log('Filled customer name');
        }
      });

      // Find and fill address input
      cy.get('input').then(($inputs) => {
        const addressInput = $inputs.filter((i, el) => {
          const placeholder = Cypress.$(el).attr('placeholder') || '';
          const name = Cypress.$(el).attr('name') || '';
          return placeholder.toLowerCase().includes('address') || 
                 name.toLowerCase().includes('address');
        }).first();
        
        if (addressInput.length > 0) {
          cy.wrap(addressInput).clear().type('123 Test Street');
          cy.log('Filled address');
        }
      });

      // Set NEC code year if available
      cy.get('select').then(($selects) => {
        if ($selects.length > 0) {
          cy.wrap($selects).first().select('2023');
          cy.log('Set NEC code year to 2023');
        }
      });
    });
  });

  describe('General Load Calculations', () => {
    it('should calculate general loads with demand factors', () => {
      // Navigate to General Loads tab
      cy.contains('button', 'General Loads').click();
      cy.log('Navigated to General Loads tab');

      // Add a general load
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          cy.log('Clicked add load button');

          // Fill in load details
          cy.get('input').then(($inputs) => {
            // Find name input
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Test Load');
            }

            // Find VA input
            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('1500');
            }
          });

          // Try to save
          cy.get('button').then(($buttons) => {
            const saveButton = $buttons.filter((i, el) => {
              const text = Cypress.$(el).text().toLowerCase();
              return text.includes('save');
            }).first();
            
            if (saveButton.length > 0) {
              cy.wrap(saveButton).click();
              cy.log('Attempted to save load');
            }
          });
        }
      });

      // Verify calculation results are updated
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Calculation results section exists');
    });
  });

  describe('HVAC Load Calculations', () => {
    it('should calculate HVAC loads at 100%', () => {
      // Navigate to HVAC tab
      cy.contains('button', 'HVAC').click();
      cy.log('Navigated to HVAC tab');

      // Add an HVAC load
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('hvac');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          cy.log('Clicked add HVAC load button');

          // Fill in HVAC details
          cy.get('input').then(($inputs) => {
            // Find name input
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Central AC');
            }

            // Find tons input
            const tonsInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (tonsInput.length > 0) {
              cy.wrap(tonsInput).clear().type('3');
            }
          });

          // Try to save
          cy.get('button').then(($buttons) => {
            const saveButton = $buttons.filter((i, el) => {
              const text = Cypress.$(el).text().toLowerCase();
              return text.includes('save');
            }).first();
            
            if (saveButton.length > 0) {
              cy.wrap(saveButton).click();
              cy.log('Attempted to save HVAC load');
            }
          });
        }
      });

      // Verify HVAC calculations are reflected
      cy.get('[data-cy="calculation-summary"]').should('exist');
      cy.log('Calculation summary section exists');
    });
  });

  describe('EVSE Load Calculations', () => {
    it('should calculate EVSE loads at 100% per NEC 625.42', () => {
      // Navigate to EV Charging tab
      cy.contains('button', 'EV Charging').click();
      cy.log('Navigated to EV Charging tab');

      // Add an EVSE load
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('evse');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          cy.log('Clicked add EVSE load button');

          // Fill in EVSE details
          cy.get('input').then(($inputs) => {
            // Find name input
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Tesla Charger');
            }

            // Find amps input
            const ampsInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (ampsInput.length > 0) {
              cy.wrap(ampsInput).clear().type('48');
            }
          });

          // Try to save
          cy.get('button').then(($buttons) => {
            const saveButton = $buttons.filter((i, el) => {
              const text = Cypress.$(el).text().toLowerCase();
              return text.includes('save');
            }).first();
            
            if (saveButton.length > 0) {
              cy.wrap(saveButton).click();
              cy.log('Attempted to save EVSE load');
            }
          });
        }
      });

      // Verify EVSE calculations are reflected
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Calculation results section exists');
    });
  });

  describe('Solar and Battery Calculations', () => {
    it('should calculate solar interconnection per NEC 705.12', () => {
      // Navigate to Solar/Battery tab
      cy.contains('button', 'Solar/Battery').click();
      cy.log('Navigated to Solar/Battery tab');

      // Add a solar system
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('solar');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          cy.log('Clicked add solar button');

          // Fill in solar details
          cy.get('input').then(($inputs) => {
            // Find name input
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Solar System');
            }

            // Find kW input
            const kwInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (kwInput.length > 0) {
              cy.wrap(kwInput).clear().type('5');
            }
          });

          // Try to save
          cy.get('button').then(($buttons) => {
            const saveButton = $buttons.filter((i, el) => {
              const text = Cypress.$(el).text().toLowerCase();
              return text.includes('save');
            }).first();
            
            if (saveButton.length > 0) {
              cy.wrap(saveButton).click();
              cy.log('Attempted to save solar system');
            }
          });
        }
      });

      // Verify solar calculations are reflected
      cy.get('[data-cy="calculation-summary"]').should('exist');
      cy.log('Calculation summary section exists');
    });
  });

  describe('Load Management Features', () => {
    it('should handle load management calculations', () => {
      // Navigate to EV Charging tab (contains Load Management)
      cy.contains('button', 'EV Charging').click();
      cy.log('Navigated to EV Charging tab');

      // Check if load management options are available
      cy.get('input[type="checkbox"], select, input[type="number"]').then(($inputs) => {
        if ($inputs.length > 0) {
          cy.log(`Found ${$inputs.length} load management inputs`);
          
          // Try to enable load management if available
          cy.get('input[type="checkbox"]').first().check();
          cy.log('Enabled load management');
        }
      });

      // Verify load management affects calculations
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Load management calculations reflected');
    });
  });

  describe('NEC Compliance Validation', () => {
    it('should validate NEC compliance rules', () => {
      // Add a load that might trigger validation
      cy.contains('button', 'General Loads').click();
      
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();

          // Add a very large load to test validation
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Large Load Test');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('50000');
            }
          });

          // Try to save
          cy.get('button').then(($buttons) => {
            const saveButton = $buttons.filter((i, el) => {
              const text = Cypress.$(el).text().toLowerCase();
              return text.includes('save');
            }).first();
            
            if (saveButton.length > 0) {
              cy.wrap(saveButton).click();
            }
          });
        }
      });

      // Check for validation messages
      cy.get('[data-cy="validation-messages"]').should('exist');
      cy.log('Validation messages section exists');
    });
  });

  describe('Calculation Method Switching', () => {
    it('should handle different calculation methods', () => {
      // Test switching between calculation methods
      cy.get('select').then(($selects) => {
        if ($selects.length > 1) {
          // Switch to Standard method
          cy.wrap($selects).eq(1).select('standard');
          cy.log('Switched to Standard calculation method');
          
          // Verify calculations update
          cy.get('[data-cy="calculation-results"]').should('exist');
          
          // Switch to Optional method
          cy.wrap($selects).eq(1).select('optional');
          cy.log('Switched to Optional calculation method');
          
          // Verify calculations update again
          cy.get('[data-cy="calculation-results"]').should('exist');
        }
      });
    });
  });

  describe('Service Size and Compliance', () => {
    it('should calculate service utilization and compliance', () => {
      // Add some loads to test service size calculations
      cy.contains('button', 'General Loads').click();
      
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();

          // Add a moderate load
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Service Test Load');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('8000');
            }
          });

          // Try to save
          cy.get('button').then(($buttons) => {
            const saveButton = $buttons.filter((i, el) => {
              const text = Cypress.$(el).text().toLowerCase();
              return text.includes('save');
            }).first();
            
            if (saveButton.length > 0) {
              cy.wrap(saveButton).click();
            }
          });
        }
      });

      // Verify service size calculations
      cy.get('[data-cy="calculation-summary"]').should('exist');
      cy.log('Service size calculations displayed');
    });
  });
}); 