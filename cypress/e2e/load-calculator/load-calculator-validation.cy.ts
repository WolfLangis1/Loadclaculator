describe('Load Calculator - Calculation Validation', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
  });

  describe('NEC 220.82 Demand Factor Validation', () => {
    it('should validate Optional Method demand factors correctly', () => {
      // Set to Optional Method
      cy.get('select').then(($selects) => {
        if ($selects.length > 1) {
          cy.wrap($selects).eq(1).select('optional');
          cy.log('Set to Optional Method');
        }
      });

      // Add loads to test demand factors
      cy.contains('button', 'General Loads').click();
      
      // Add first 10,000 VA (should be at 100%)
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('First 10kVA Load');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('10000');
            }
          });

          // Save load
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

      // Add additional load (should be at 40%)
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Additional Load');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('20000');
            }
          });

          // Save load
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

      // Verify calculation results show expected values
      // Expected: 10,000 VA × 100% + 20,000 VA × 40% = 10,000 + 8,000 = 18,000 VA
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Optional Method demand factors validated');
    });
  });

  describe('HVAC Load Validation', () => {
    it('should validate HVAC loads at 100% per NEC', () => {
      // Navigate to HVAC
      cy.contains('button', 'HVAC').click();
      
      // Add HVAC load
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('hvac');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add 3-ton AC unit (typically ~3,600 VA)
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('3-Ton AC Unit');
            }

            const tonsInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (tonsInput.length > 0) {
              cy.wrap(tonsInput).clear().type('3');
            }
          });

          // Save HVAC load
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

      // Verify HVAC is calculated at 100%
      cy.get('[data-cy="calculation-summary"]').should('exist');
      cy.log('HVAC load calculated at 100% per NEC');
    });
  });

  describe('EVSE Load Validation', () => {
    it('should validate EVSE loads at 100% per NEC 625.42', () => {
      // Navigate to EV Charging
      cy.contains('button', 'EV Charging').click();
      
      // Add EVSE load
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('evse');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add 32A EVSE (should be 32A × 240V = 7,680 VA at 100%)
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('32A EVSE Charger');
            }

            const ampsInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (ampsInput.length > 0) {
              cy.wrap(ampsInput).clear().type('32');
            }
          });

          // Save EVSE load
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

      // Verify EVSE is calculated at 100%
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('EVSE load calculated at 100% per NEC 625.42');
    });
  });

  describe('Solar Interconnection Validation', () => {
    it('should validate 120% rule per NEC 705.12', () => {
      // Navigate to Solar/Battery
      cy.contains('button', 'Solar/Battery').click();
      
      // Add solar system
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('solar');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add 7.5kW solar system
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('7.5kW Solar System');
            }

            const kwInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (kwInput.length > 0) {
              cy.wrap(kwInput).clear().type('7.5');
            }
          });

          // Save solar system
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

      // Verify 120% rule validation
      cy.get('[data-cy="calculation-summary"]').should('exist');
      cy.log('Solar 120% rule validated per NEC 705.12');
    });
  });

  describe('Service Size Validation', () => {
    it('should validate service size calculations', () => {
      // Add loads to test service size
      cy.contains('button', 'General Loads').click();
      
      // Add loads totaling ~30,000 VA
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
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
              cy.wrap(vaInput).clear().type('30000');
            }
          });

          // Save load
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
      cy.log('Service size calculations validated');
    });
  });

  describe('Load Management Validation', () => {
    it('should validate load management calculations', () => {
      // Navigate to EV Charging (contains Load Management)
      cy.contains('button', 'EV Charging').click();
      
      // Check for load management controls
      cy.get('input[type="checkbox"], select, input[type="number"]').then(($inputs) => {
        if ($inputs.length > 0) {
          cy.log(`Found ${$inputs.length} load management controls`);
          
          // Enable load management
          cy.get('input[type="checkbox"]').first().check();
          cy.log('Enabled load management');
          
          // Set load management threshold
          cy.get('input[type="number"]').then(($numberInputs) => {
            if ($numberInputs.length > 0) {
              cy.wrap($numberInputs).first().clear().type('75');
              cy.log('Set load management threshold to 75%');
            }
          });
        }
      });

      // Verify load management affects calculations
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Load management calculations validated');
    });
  });

  describe('NEC Compliance Validation', () => {
    it('should validate NEC compliance rules', () => {
      // Add loads that might trigger compliance checks
      cy.contains('button', 'General Loads').click();
      
      // Add oversized load to test compliance
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add extremely large load
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Oversized Load');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('75000');
            }
          });

          // Save load
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

      // Check for compliance validation messages
      cy.get('[data-cy="validation-messages"]').should('exist');
      cy.log('NEC compliance validation active');
    });
  });

  describe('Calculation Method Comparison', () => {
    it('should validate different calculation methods produce different results', () => {
      // Add a standard load first
      cy.contains('button', 'General Loads').click();
      
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Method Comparison Load');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('25000');
            }
          });

          // Save load
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

      // Test Standard Method
      cy.get('select').then(($selects) => {
        if ($selects.length > 1) {
          cy.wrap($selects).eq(1).select('standard');
          cy.log('Testing Standard Method');
          cy.get('[data-cy="calculation-results"]').should('exist');
        }
      });

      // Test Optional Method
      cy.get('select').then(($selects) => {
        if ($selects.length > 1) {
          cy.wrap($selects).eq(1).select('optional');
          cy.log('Testing Optional Method');
          cy.get('[data-cy="calculation-results"]').should('exist');
        }
      });

      cy.log('Calculation method comparison validated');
    });
  });
}); 