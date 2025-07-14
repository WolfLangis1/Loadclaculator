describe('SLD Component Interactions', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.setupProject({
      name: 'Component Test Project',
      address: '456 Component St, Test City, TC 54321'
    })
    
    // Setup a basic system
    cy.addLoad('solar', { name: 'Test Solar', kw: 8 })
    cy.addLoad('evse', { name: 'Test EVSE', amps: 40 })
    
    // Navigate to SLD and generate
    cy.contains('Single Line Diagram').click()
    cy.contains('Generate SLD').click()
    cy.contains('Generating...', { timeout: 20000 }).should('not.exist')
  })

  describe('Component Selection and Manipulation', () => {
    it('should select individual components', () => {
      cy.log('Testing component selection')
      
      // Click on main panel
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel').click()
      })
      
      // Should be selected (highlighted)
      cy.get('.border-blue-500').should('exist')
      cy.get('[data-testid="selected-component"]').should('contain', 'Main Panel')
      
      // Click on different component
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('PV Array').click()
      })
      
      // New component should be selected
      cy.get('[data-testid="selected-component"]').should('contain', 'PV Array')
    })

    it('should support multi-select with Ctrl+click', () => {
      cy.log('Testing multi-component selection')
      
      // Select first component
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel').click()
      })
      
      // Ctrl+click second component
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('PV Array').click({ ctrlKey: true })
      })
      
      // Both should be selected
      cy.get('.border-blue-500').should('have.length', 2)
      cy.get('[data-testid="selection-count"]').should('contain', '2')
    })

    it('should deselect components when clicking empty space', () => {
      cy.log('Testing component deselection')
      
      // Select a component
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel').click()
      })
      
      cy.get('.border-blue-500').should('exist')
      
      // Click empty space
      cy.get('[data-testid="sld-canvas"]').click(100, 300)
      
      // Should deselect
      cy.get('.border-blue-500').should('not.exist')
      cy.get('[data-testid="selected-component"]').should('not.exist')
    })

    it('should move components via drag and drop', () => {
      cy.log('Testing component drag and drop')
      
      // Get initial position
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel').then(($panel) => {
          const initialRect = $panel[0].getBoundingClientRect()
          
          // Drag to new position
          cy.wrap($panel)
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: initialRect.x + 100, clientY: initialRect.y + 50 })
            .trigger('mouseup')
          
          // Verify position changed
          cy.contains('Main Panel').then(($movedPanel) => {
            const newRect = $movedPanel[0].getBoundingClientRect()
            expect(newRect.x).to.not.equal(initialRect.x)
            expect(newRect.y).to.not.equal(initialRect.y)
          })
        })
      })
    })

    it('should snap to grid when enabled', () => {
      cy.log('Testing grid snapping')
      
      // Ensure grid is enabled
      cy.get('[data-testid="toggle-grid"]').then(($btn) => {
        if (!$btn.hasClass('bg-blue-100')) {
          cy.wrap($btn).click()
        }
      })
      
      // Move component
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel')
          .trigger('mousedown', { which: 1 })
          .trigger('mousemove', { clientX: 205, clientY: 155 }) // Slightly off-grid
          .trigger('mouseup')
      })
      
      // Should snap to nearest grid point
      cy.get('[data-testid="component-position"]').should('contain', '200,160') // Snapped values
    })

    it('should show component properties panel when selected', () => {
      cy.log('Testing component properties panel')
      
      // Select a component
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel').click()
      })
      
      // Properties panel should appear
      cy.get('[data-testid="properties-panel"]').should('be.visible')
      cy.get('[data-testid="properties-panel"]').should('contain', 'Main Panel')
      
      // Should show component specifications
      cy.get('[data-testid="properties-panel"]').within(() => {
        cy.contains('Rating').should('be.visible')
        cy.contains('200A').should('be.visible')
        cy.contains('Voltage').should('be.visible')
        cy.contains('240V').should('be.visible')
      })
    })

    it('should allow editing component properties', () => {
      cy.log('Testing component property editing')
      
      // Select inverter
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('INV').click()
      })
      
      // Edit properties
      cy.get('[data-testid="properties-panel"]').within(() => {
        cy.get('input[placeholder*="Name"]').clear().type('Custom Inverter')
        cy.get('input[type="number"]').first().clear().type('7.6')
      })
      
      // Apply changes
      cy.get('[data-testid="apply-changes"]').click()
      
      // Verify changes
      cy.get('[data-testid="sld-canvas"]').should('contain', 'Custom Inverter')
      cy.get('[data-testid="sld-canvas"]').should('contain', '7.6kW')
    })

    it('should delete components with Delete key', () => {
      cy.log('Testing component deletion')
      
      // Count initial components
      cy.get('[data-testid="sld-canvas"] > div').then(($components) => {
        const initialCount = $components.length
        
        // Select a component
        cy.get('[data-testid="sld-canvas"]').within(() => {
          cy.contains('PV Array').click()
        })
        
        // Press Delete key
        cy.get('body').type('{del}')
        
        // Verify component was deleted
        cy.get('[data-testid="sld-canvas"] > div').should('have.length', initialCount - 1)
        cy.get('[data-testid="sld-canvas"]').should('not.contain', 'PV Array')
      })
    })
  })

  describe('Connection Management', () => {
    it('should create connections between components', () => {
      cy.log('Testing connection creation')
      
      // Enter connection mode
      cy.get('[data-testid="connection-mode"]').click()
      
      // Click on source component output port
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.get('[data-port="output"]').first().click()
      })
      
      // Click on target component input port
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.get('[data-port="input"]').eq(1).click()
      })
      
      // Connection should be created
      cy.get('[data-testid="sld-canvas"] svg line').should('exist')
      cy.get('[data-testid="connection-count"]').should('contain', '1')
    })

    it('should show connection properties when selected', () => {
      cy.log('Testing connection selection and properties')
      
      // Click on a connection line
      cy.get('[data-testid="sld-canvas"] svg line').first().click()
      
      // Properties panel should show connection details
      cy.get('[data-testid="properties-panel"]').should('be.visible')
      cy.get('[data-testid="properties-panel"]').should('contain', 'Connection')
      cy.get('[data-testid="properties-panel"]').should('contain', 'Wire Type')
      cy.get('[data-testid="properties-panel"]').should('contain', 'Voltage')
      cy.get('[data-testid="properties-panel"]').should('contain', 'Current')
    })

    it('should allow editing connection properties', () => {
      cy.log('Testing connection property editing')
      
      // Select a connection
      cy.get('[data-testid="sld-canvas"] svg line').first().click()
      
      // Edit properties
      cy.get('[data-testid="properties-panel"]').within(() => {
        cy.get('select[name="wireType"]').select('dc')
        cy.get('input[name="voltage"]').clear().type('600')
        cy.get('input[name="current"]').clear().type('25')
        cy.get('input[name="conductorSize"]').clear().type('10 AWG')
      })
      
      // Apply changes
      cy.get('[data-testid="apply-changes"]').click()
      
      // Verify changes
      cy.get('[data-testid="connection-info"]').should('contain', '600V')
      cy.get('[data-testid="connection-info"]').should('contain', '25A')
      cy.get('[data-testid="connection-info"]').should('contain', '10 AWG')
    })

    it('should delete connections', () => {
      cy.log('Testing connection deletion')
      
      // Count initial connections
      cy.get('[data-testid="sld-canvas"] svg line').then(($lines) => {
        const initialCount = $lines.length
        
        // Select a connection
        cy.get('[data-testid="sld-canvas"] svg line').first().click()
        
        // Delete with keyboard
        cy.get('body').type('{del}')
        
        // Verify connection was deleted
        cy.get('[data-testid="sld-canvas"] svg line').should('have.length', initialCount - 1)
      })
    })

    it('should validate connection types', () => {
      cy.log('Testing connection validation')
      
      // Try to connect incompatible ports
      cy.get('[data-testid="connection-mode"]').click()
      
      // Click on DC output
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.get('[data-port="dc-output"]').first().click()
      })
      
      // Click on AC input (should show error)
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.get('[data-port="ac-input"]').first().click()
      })
      
      // Should show validation error
      cy.get('[data-testid="validation-error"]').should('contain', 'Incompatible connection')
    })
  })

  describe('Component Library Integration', () => {
    it('should add components from library', () => {
      cy.log('Testing component library')
      
      // Open component library
      cy.get('[data-testid="component-library"]').should('be.visible')
      
      // Add battery component
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('Battery Storage').click()
      })
      
      // Component should appear on canvas
      cy.get('[data-testid="sld-canvas"]').should('contain', 'Battery')
      
      // Should be positioned appropriately
      cy.get('[data-testid="component-count"]').should('contain', 'increased')
    })

    it('should drag components from library to canvas', () => {
      cy.log('Testing drag and drop from library')
      
      // Drag component from library
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('EVSE Charger')
          .trigger('dragstart')
      })
      
      // Drop on canvas
      cy.get('[data-testid="sld-canvas"]')
        .trigger('dragover')
        .trigger('drop', 400, 300)
      
      // Component should appear at drop location
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('EVSE').should('be.visible')
      })
    })

    it('should filter components in library', () => {
      cy.log('Testing component library filtering')
      
      // Use search filter
      cy.get('[data-testid="component-search"]').type('solar')
      
      // Should show only solar-related components
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('PV Array').should('be.visible')
        cy.contains('Inverter').should('be.visible')
        cy.contains('Battery').should('not.exist')
      })
      
      // Clear search
      cy.get('[data-testid="component-search"]').clear()
      
      // All components should be visible again
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('Battery').should('be.visible')
      })
    })

    it('should categorize components properly', () => {
      cy.log('Testing component categorization')
      
      // Click on Solar category
      cy.get('[data-testid="category-solar"]').click()
      
      // Should show only solar components
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('PV Array').should('be.visible')
        cy.contains('Inverter').should('be.visible')
        cy.contains('DC Disconnect').should('be.visible')
        cy.contains('Battery').should('not.exist')
      })
      
      // Click on Battery category
      cy.get('[data-testid="category-battery"]').click()
      
      // Should show only battery components
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('Battery Storage').should('be.visible')
        cy.contains('Tesla Powerwall').should('be.visible')
        cy.contains('PV Array').should('not.exist')
      })
    })
  })

  describe('Undo/Redo Operations', () => {
    it('should undo component additions', () => {
      cy.log('Testing undo component addition')
      
      // Add component
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('Battery Storage').click()
      })
      
      // Verify component added
      cy.get('[data-testid="sld-canvas"]').should('contain', 'Battery')
      
      // Undo
      cy.get('[data-testid="undo-button"]').click()
      
      // Component should be removed
      cy.get('[data-testid="sld-canvas"]').should('not.contain', 'Battery')
    })

    it('should undo component movements', () => {
      cy.log('Testing undo component movement')
      
      // Get initial position
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel').then(($panel) => {
          const initialRect = $panel[0].getBoundingClientRect()
          
          // Move component
          cy.wrap($panel)
            .trigger('mousedown', { which: 1 })
            .trigger('mousemove', { clientX: initialRect.x + 100, clientY: initialRect.y })
            .trigger('mouseup')
          
          // Undo movement
          cy.get('[data-testid="undo-button"]').click()
          
          // Should return to original position
          cy.contains('Main Panel').then(($movedPanel) => {
            const newRect = $movedPanel[0].getBoundingClientRect()
            expect(Math.abs(newRect.x - initialRect.x)).to.be.lessThan(10)
          })
        })
      })
    })

    it('should redo undone operations', () => {
      cy.log('Testing redo functionality')
      
      // Add component
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('Battery Storage').click()
      })
      
      // Undo
      cy.get('[data-testid="undo-button"]').click()
      cy.get('[data-testid="sld-canvas"]').should('not.contain', 'Battery')
      
      // Redo
      cy.get('[data-testid="redo-button"]').click()
      cy.get('[data-testid="sld-canvas"]').should('contain', 'Battery')
    })

    it('should maintain command history correctly', () => {
      cy.log('Testing command history')
      
      // Perform multiple operations
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('Battery Storage').click()
      })
      
      cy.get('[data-testid="component-library"]').within(() => {
        cy.contains('EVSE Charger').click()
      })
      
      // Undo twice
      cy.get('[data-testid="undo-button"]').click()
      cy.get('[data-testid="undo-button"]').click()
      
      // Both components should be gone
      cy.get('[data-testid="sld-canvas"]').should('not.contain', 'Battery')
      cy.get('[data-testid="sld-canvas"]').should('not.contain', 'EVSE')
      
      // Redo once
      cy.get('[data-testid="redo-button"]').click()
      
      // Only first component should be back
      cy.get('[data-testid="sld-canvas"]').should('contain', 'Battery')
      cy.get('[data-testid="sld-canvas"]').should('not.contain', 'EVSE')
    })
  })

  describe('Canvas Controls', () => {
    it('should zoom in and out correctly', () => {
      cy.log('Testing zoom controls')
      
      // Get initial zoom level
      cy.get('[data-testid="zoom-display"]').should('contain', '100%')
      
      // Zoom in
      cy.get('[data-testid="zoom-in"]').click()
      cy.get('[data-testid="zoom-display"]').should('contain', '120%')
      
      // Zoom in more
      cy.get('[data-testid="zoom-in"]').click()
      cy.get('[data-testid="zoom-display"]').should('contain', '144%')
      
      // Zoom out
      cy.get('[data-testid="zoom-out"]').click()
      cy.get('[data-testid="zoom-display"]').should('contain', '120%')
      
      // Reset zoom
      cy.get('[data-testid="zoom-reset"]').click()
      cy.get('[data-testid="zoom-display"]').should('contain', '100%')
    })

    it('should pan the canvas', () => {
      cy.log('Testing canvas panning')
      
      // Pan with mouse wheel + drag
      cy.get('[data-testid="sld-canvas"]')
        .trigger('mousedown', { which: 2, clientX: 400, clientY: 300 }) // Middle mouse button
        .trigger('mousemove', { clientX: 500, clientY: 400 })
        .trigger('mouseup')
      
      // Verify pan position changed
      cy.get('[data-testid="pan-position"]').should('not.contain', '0,0')
    })

    it('should toggle grid visibility', () => {
      cy.log('Testing grid toggle')
      
      // Grid should be visible initially
      cy.get('[data-testid="sld-canvas"]').should('have.css', 'background-image')
      
      // Toggle grid off
      cy.get('[data-testid="toggle-grid"]').click()
      cy.get('[data-testid="sld-canvas"]').should('have.css', 'background-image', 'none')
      
      // Toggle grid back on
      cy.get('[data-testid="toggle-grid"]').click()
      cy.get('[data-testid="sld-canvas"]').should('have.css', 'background-image')
    })

    it('should fit diagram to screen', () => {
      cy.log('Testing fit to screen')
      
      // Zoom in first
      cy.get('[data-testid="zoom-in"]').click().click().click()
      cy.get('[data-testid="zoom-display"]').should('contain', '173%')
      
      // Fit to screen
      cy.get('[data-testid="fit-to-screen"]').click()
      
      // Should adjust zoom and pan to show all components
      cy.get('[data-testid="zoom-display"]').should('not.contain', '173%')
      cy.get('[data-testid="sld-canvas"]').within(() => {
        cy.contains('Main Panel').should('be.visible')
        cy.contains('PV Array').should('be.visible')
      })
    })
  })
})