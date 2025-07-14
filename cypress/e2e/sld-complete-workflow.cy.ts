describe('SLD Complete Workflow', () => {
  beforeEach(() => {
    cy.visit('/')
    
    // Setup test project
    cy.fixture('test-project').then((project) => {
      cy.setupProject({
        name: project.projectInfo.customerName,
        address: project.projectInfo.propertyAddress
      })
    })
  })

  describe('End-to-End SLD Generation Workflow', () => {
    it('should complete full workflow from load entry to SLD export', () => {
      cy.fixture('test-project').then((project) => {
        // Step 1: Add loads to the calculator
        cy.log('Adding solar load')
        cy.addLoad('solar', {
          name: project.loads.solar[0].name,
          kw: project.loads.solar[0].kw
        })

        cy.log('Adding EVSE load')
        cy.addLoad('evse', {
          name: project.loads.evse[0].name,
          amps: project.loads.evse[0].amps
        })

        cy.log('Adding HVAC load')
        cy.addLoad('hvac', {
          name: project.loads.hvac[0].name,
          tons: project.loads.hvac[0].tons
        })

        // Step 2: Navigate to SLD tab
        cy.log('Navigating to Single Line Diagram')
        cy.contains('Single Line Diagram').click()
        
        // Verify SLD tab is active
        cy.get('.border-purple-500').should('contain', 'Single Line Diagram')

        // Step 3: Generate SLD
        cy.log('Generating SLD from load data')
        cy.contains('Generate SLD').click()
        
        // Wait for generation to complete
        cy.contains('Generating...', { timeout: 10000 }).should('be.visible')
        cy.contains('Generating...', { timeout: 20000 }).should('not.exist')
        
        // Verify SLD canvas appears
        cy.get('[data-testid="sld-canvas"]', { timeout: 10000 }).should('be.visible')
        
        // Step 4: Verify components are present
        cy.log('Verifying SLD components')
        cy.get('[data-testid="sld-canvas"]').within(() => {
          // Should have main panel
          cy.contains('Main Panel').should('be.visible')
          
          // Should have PV array for solar
          cy.contains('PV Array').should('be.visible')
          
          // Should have inverter
          cy.contains('INV').should('be.visible')
          
          // Should have disconnects
          cy.contains('DISC').should('be.visible')
          
          // Should have EVSE charger
          cy.contains('EVSE').should('be.visible')
          
          // Should have grounding
          cy.contains('GND').should('be.visible')
        })

        // Step 5: Test SLD interactions
        cy.log('Testing SLD component interactions')
        
        // Click on a component to select it
        cy.get('[data-testid="sld-canvas"]').within(() => {
          cy.contains('Main Panel').click()
        })
        
        // Verify selection (component should be highlighted)
        cy.get('.border-blue-500').should('exist')
        
        // Test zoom controls
        cy.get('[data-testid="zoom-in"]').click()
        cy.get('[data-testid="zoom-display"]').should('contain', '120%')
        
        cy.get('[data-testid="zoom-out"]').click()
        cy.get('[data-testid="zoom-display"]').should('contain', '100%')

        // Step 6: Test NEC compliance
        cy.log('Testing NEC compliance validation')
        cy.contains('Validate').click()
        
        // Should show compliance status
        cy.contains('NEC Compliant').should('be.visible')
        cy.contains('✓').should('be.visible')

        // Step 7: Generate aerial view
        cy.log('Testing aerial view generation')
        cy.contains('Aerial View').click()
        
        // Check if address is available for aerial view
        cy.get('body').then(($body) => {
          if ($body.find('button:contains("Generate Aerial View"):not(:disabled)').length > 0) {
            cy.contains('Generate Aerial View').click()
            cy.contains('Loading...', { timeout: 15000 }).should('be.visible')
            cy.contains('Loading...', { timeout: 30000 }).should('not.exist')
            
            // Verify aerial view appears or shows mock message
            cy.get('[data-testid="aerial-view"]').should('be.visible')
          } else {
            cy.log('Aerial view generation disabled - no valid address or API key')
          }
        })

        // Step 8: Test export functionality
        cy.log('Testing export functionality')
        cy.contains('Export').click()
        
        // Verify export options are available
        cy.contains('Export Options').should('be.visible')
        cy.contains('PDF Report').should('be.visible')
        cy.contains('SVG').should('be.visible')
        cy.contains('PNG Image').should('be.visible')
        
        // Test export format selection
        cy.get('input[value="svg"]').click()
        cy.get('input[value="svg"]').should('be.checked')
        
        // Test include options
        cy.get('input[type="checkbox"]').first().should('be.checked')
        cy.get('input[type="checkbox"]').first().click()
        cy.get('input[type="checkbox"]').first().should('not.be.checked')
        
        // Test paper size selection
        cy.get('select').contains('Letter').should('be.visible')
        
        // Verify export preview shows project data
        cy.contains('Export Preview').should('be.visible')
        cy.contains(`• Project: ${project.projectInfo.customerName}`).should('be.visible')
        cy.contains('• Service Size: 200A').should('be.visible')
        
        // Test export button (note: actual export would require file download handling)
        cy.contains('Export Permit Package').should('be.visible').and('not.be.disabled')
      })
    })

    it('should handle SLD modifications and updates', () => {
      // First generate an SLD
      cy.addLoad('solar', { name: 'Solar Array', kw: 10 })
      cy.contains('Single Line Diagram').click()
      cy.contains('Generate SLD').click()
      cy.contains('Generating...', { timeout: 20000 }).should('not.exist')

      cy.log('Testing SLD component modifications')
      
      // Select a component
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel').click()
      })
      
      // Move component (drag and drop simulation)
      cy.get('.border-blue-500').trigger('mousedown', { which: 1 })
      cy.get('[data-testid="sld-canvas"]').trigger('mousemove', { clientX: 300, clientY: 200 })
      cy.get('[data-testid="sld-canvas"]').trigger('mouseup')
      
      // Verify component moved
      cy.get('[data-testid="sld-canvas"]').should('contain', 'Main Panel')
      
      // Test adding component from library
      cy.get('[data-testid="component-library"]').should('be.visible')
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('Battery Storage').click()
      })
      
      // Verify new component appears
      cy.get('[data-testid="sld-canvas"]').should('contain', 'Battery')
      
      // Test connection creation
      cy.log('Testing connection creation')
      // This would require more complex interaction simulation
      
      // Test undo/redo
      cy.log('Testing undo/redo functionality')
      cy.get('[data-testid="undo-button"]').should('not.be.disabled')
      cy.get('[data-testid="undo-button"]').click()
      
      // Verify undo worked
      cy.get('[data-testid="redo-button"]').should('not.be.disabled')
      cy.get('[data-testid="redo-button"]').click()
    })

    it('should validate wire sizing and NEC compliance', () => {
      // Setup complex system
      cy.addLoad('solar', { name: 'Large Solar Array', kw: 20 })
      cy.addLoad('evse', { name: 'High Power EVSE', amps: 80 })
      cy.addLoad('hvac', { name: 'Large Heat Pump', tons: 5 })

      cy.contains('Single Line Diagram').click()
      cy.contains('Generate SLD').click()
      cy.contains('Generating...', { timeout: 20000 }).should('not.exist')

      cy.log('Testing wire sizing analysis')
      
      // Navigate to wire sizing tab
      cy.contains('Wire Sizing').click()
      
      // Run wire sizing analysis
      cy.contains('Analyze Wire Sizing').click()
      cy.contains('Analyzing...', { timeout: 15000 }).should('be.visible')
      cy.contains('Analyzing...', { timeout: 25000 }).should('not.exist')
      
      // Verify results
      cy.contains('Wire Sizing Results').should('be.visible')
      cy.get('[data-testid="wire-analysis-results"]').within(() => {
        cy.contains('AWG').should('be.visible')
        cy.contains('Voltage Drop').should('be.visible')
      })

      cy.log('Testing NEC compliance analysis')
      
      // Navigate to NEC compliance tab
      cy.contains('NEC Compliance').click()
      
      // Run compliance check
      cy.contains('Check NEC Compliance').click()
      cy.contains('Analyzing...', { timeout: 15000 }).should('be.visible')
      cy.contains('Analyzing...', { timeout: 25000 }).should('not.exist')
      
      // Verify compliance results
      cy.get('[data-testid="nec-compliance-results"]').should('be.visible')
      cy.contains('Errors:').should('be.visible')
      cy.contains('Warnings:').should('be.visible')
      
      // Check for recommendations
      cy.get('body').then(($body) => {
        if ($body.find(':contains("Recommendations:")').length > 0) {
          cy.contains('Recommendations:').should('be.visible')
        }
      })

      cy.log('Testing load flow analysis')
      
      // Navigate to load flow tab
      cy.contains('Load Flow').click()
      
      // Run load flow analysis
      cy.contains('Analyze Load Flow').click()
      cy.contains('Analyzing...', { timeout: 15000 }).should('be.visible')
      cy.contains('Analyzing...', { timeout: 25000 }).should('not.exist')
      
      // Verify load flow results
      cy.contains('Overall Efficiency').should('be.visible')
      cy.contains('Critical Paths').should('be.visible')
      cy.contains('Total Paths').should('be.visible')
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty project gracefully', () => {
      cy.log('Testing empty project handling')
      
      cy.contains('Single Line Diagram').click()
      cy.contains('Generate SLD').click()
      
      // Should still generate basic diagram with main components
      cy.contains('Generating...', { timeout: 20000 }).should('not.exist')
      cy.get('[data-testid="sld-canvas"]').should('be.visible')
      cy.get('[data-testid="sld-canvas"]').should('contain', 'Main Panel')
      cy.get('[data-testid="sld-canvas"]').should('contain', 'GRID')
    })

    it('should handle invalid load data', () => {
      cy.log('Testing invalid load data handling')
      
      // Try to add load with invalid data
      cy.contains('EVSE Loads').click()
      cy.get('button').contains('Add EVSE Load').click()
      
      // Enter invalid amperage
      cy.get('input[type="number"]').first().clear().type('-50')
      cy.get('button').contains('Save').click()
      
      // Should show validation error
      cy.contains('error').should('be.visible')
      
      // Fix the data
      cy.get('input[type="number"]').first().clear().type('48')
      cy.get('button').contains('Save').click()
      
      // Should save successfully
      cy.contains('error').should('not.exist')
    })

    it('should handle network errors gracefully', () => {
      cy.log('Testing network error handling')
      
      // Intercept and fail aerial view request
      cy.intercept('GET', '**/aerial-view/**', { forceNetworkError: true }).as('aerialViewError')
      
      cy.contains('Aerial View').click()
      cy.contains('Generate Aerial View').click()
      
      // Should show error message
      cy.contains('Failed to generate aerial view').should('be.visible')
    })
  })

  describe('Performance and Responsiveness', () => {
    it('should handle large diagrams efficiently', () => {
      cy.log('Testing performance with complex diagram')
      
      // Add many loads
      for (let i = 0; i < 10; i++) {
        cy.addLoad('evse', { name: `EVSE ${i}`, amps: 32 })
      }
      
      for (let i = 0; i < 5; i++) {
        cy.addLoad('solar', { name: `Solar Array ${i}`, kw: 5 })
      }
      
      cy.contains('Single Line Diagram').click()
      cy.contains('Generate SLD').click()
      
      // Should still complete in reasonable time
      cy.contains('Generating...', { timeout: 30000 }).should('not.exist')
      cy.get('[data-testid="sld-canvas"]').should('be.visible')
      
      // Test interactions remain responsive
      cy.get('[data-testid="zoom-in"]').click()
      cy.get('[data-testid="zoom-out"]').click()
      
      // Canvas should remain interactive
      cy.get('[data-testid="sld-canvas"]').should('be.visible')
    })

    it('should be responsive on different screen sizes', () => {
      cy.log('Testing responsive design')
      
      // Test mobile viewport
      cy.viewport('iphone-6')
      cy.contains('Single Line Diagram').click()
      cy.contains('Generate SLD').should('be.visible')
      
      // Test tablet viewport
      cy.viewport('ipad-2')
      cy.contains('Generate SLD').should('be.visible')
      
      // Test desktop viewport
      cy.viewport(1920, 1080)
      cy.contains('Generate SLD').should('be.visible')
      
      // All elements should remain accessible
      cy.contains('Templates').should('be.visible')
      cy.contains('Aerial View').should('be.visible')
      cy.contains('Export').should('be.visible')
    })
  })

  describe('Accessibility', () => {
    it('should be accessible via keyboard navigation', () => {
      cy.log('Testing keyboard accessibility')
      
      cy.contains('Single Line Diagram').click()
      
      // Tab through interface
      cy.get('body').tab()
      cy.focused().should('contain', 'Generate SLD')
      
      cy.focused().tab()
      cy.focused().should('contain', 'Templates')
      
      // Test tab navigation to different tabs
      cy.get('body').tab().tab().tab()
      cy.focused().should('contain', 'Aerial View')
      
      // Activate with Enter key
      cy.focused().type('{enter}')
      cy.contains('Generate Aerial View').should('be.visible')
    })

    it('should have proper ARIA labels and roles', () => {
      cy.log('Testing ARIA accessibility')
      
      cy.contains('Single Line Diagram').click()
      
      // Check for proper ARIA labels
      cy.get('[aria-label="Generate SLD"]').should('exist')
      cy.get('[role="tablist"]').should('exist')
      cy.get('[role="tab"]').should('have.length.at.least', 3)
      
      // Check for screen reader announcements
      cy.get('[aria-live="polite"]').should('exist')
    })
  })
})