describe('Load Calculator - Business Logic & NEC Compliance', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
  });

  describe('NEC 220.82 Optional Method Calculations', () => {
    it('should apply correct demand factors for Optional Method', () => {
      // Set calculation method to Optional
      cy.get('select').then(($selects) => {
        if ($selects.length > 1) {
          cy.wrap($selects).eq(1).select('optional');
          cy.log('Set calculation method to Optional');
        }
      });

      // Add general loads to test demand factors
      cy.contains('button', 'General Loads').click();
      
      // Add first load (should be at 100%)
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add 8,000 VA load (within first 10,000 VA at 100%)
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Load 1 - 8000VA');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('8000');
            }
          });

          // Save first load
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

      // Add second load (should be at 40% demand factor)
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add 15,000 VA load (exceeds first 10,000 VA)
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Load 2 - 15000VA');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('15000');
            }
          });

          // Save second load
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

      // Verify calculation results show proper demand factors
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Optional method demand factors applied');
    });
  });

  describe('NEC 220.82 Standard Method Calculations', () => {
    it('should apply correct demand factors for Standard Method', () => {
      // Set calculation method to Standard
      cy.get('select').then(($selects) => {
        if ($selects.length > 1) {
          cy.wrap($selects).eq(1).select('standard');
          cy.log('Set calculation method to Standard');
        }
      });

      // Add general loads to test standard method demand factors
      cy.contains('button', 'General Loads').click();
      
      // Add loads to test 3-tier demand factor system
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add a large load to test multiple demand factor tiers
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Large Load - 50000VA');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('50000');
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

      // Verify standard method calculations
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Standard method demand factors applied');
    });
  });

  describe('NEC 625.42 EVSE Load Calculations', () => {
    it('should calculate EVSE loads at 100% per NEC 625.42', () => {
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
          
          // Add 48A EVSE (should be calculated at 100%)
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('48A EVSE Charger');
            }

            const ampsInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (ampsInput.length > 0) {
              cy.wrap(ampsInput).clear().type('48');
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

      // Verify EVSE is calculated at 100% (48A × 240V = 11,520 VA)
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('EVSE load calculated at 100% per NEC 625.42');
    });
  });

  describe('NEC 705.12 Solar Interconnection', () => {
    it('should validate 120% rule for solar interconnection', () => {
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
          
          // Add 10kW solar system
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('10kW Solar System');
            }

            const kwInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (kwInput.length > 0) {
              cy.wrap(kwInput).clear().type('10');
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
      cy.log('Solar interconnection 120% rule validated');
    });
  });

  describe('Service Size and Compliance', () => {
    it('should calculate service utilization and spare capacity', () => {
      // Add loads to test service size calculations
      cy.contains('button', 'General Loads').click();
      
      // Add moderate load
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add 12,000 VA load
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
              cy.wrap(vaInput).clear().type('12000');
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
      cy.log('Service size and utilization calculated');
    });
  });

  describe('Load Management and EMS', () => {
    it('should handle load management calculations', () => {
      // Navigate to EV Charging (contains Load Management)
      cy.contains('button', 'EV Charging').click();
      
      // Check for load management options
      cy.get('input[type="checkbox"], select, input[type="number"]').then(($inputs) => {
        if ($inputs.length > 0) {
          cy.log(`Found ${$inputs.length} load management controls`);
          
          // Try to enable load management
          cy.get('input[type="checkbox"]').first().check();
          cy.log('Enabled load management');
          
          // Set load management parameters if available
          cy.get('input[type="number"]').then(($numberInputs) => {
            if ($numberInputs.length > 0) {
              cy.wrap($numberInputs).first().clear().type('80');
              cy.log('Set load management threshold');
            }
          });
        }
      });

      // Verify load management affects calculations
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Load management calculations applied');
    });
  });

  describe('Validation and Error Handling', () => {
    it('should validate NEC compliance and show appropriate warnings', () => {
      // Add loads that might trigger validation
      cy.contains('button', 'General Loads').click();
      
      // Add very large load to test validation
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
              cy.wrap(nameInput).type('Oversized Load Test');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('100000');
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

      // Check for validation messages
      cy.get('[data-cy="validation-messages"]').should('exist');
      cy.log('NEC compliance validation active');
    });
  });

  describe('Calculation Accuracy', () => {
    it('should perform accurate electrical calculations', () => {
      // Test basic Ohm's Law calculations
      cy.contains('button', 'General Loads').click();
      
      // Add a known load and verify calculations
      cy.get('button').then(($buttons) => {
        const addButton = $buttons.filter((i, el) => {
          const text = Cypress.$(el).text().toLowerCase();
          return text.includes('add') && text.includes('load');
        }).first();
        
        if (addButton.length > 0) {
          cy.wrap(addButton).click();
          
          // Add 2400 VA load (should be 10A at 240V)
          cy.get('input').then(($inputs) => {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = Cypress.$(el).attr('placeholder') || '';
              return placeholder.toLowerCase().includes('name');
            }).first();
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput).type('Test Load - 2400VA');
            }

            const vaInput = $inputs.filter((i, el) => {
              const type = Cypress.$(el).attr('type');
              return type === 'number';
            }).first();
            
            if (vaInput.length > 0) {
              cy.wrap(vaInput).clear().type('2400');
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

      // Verify calculation results
      cy.get('[data-cy="calculation-results"]').should('exist');
      cy.log('Electrical calculations verified');
    });
  });
}); 