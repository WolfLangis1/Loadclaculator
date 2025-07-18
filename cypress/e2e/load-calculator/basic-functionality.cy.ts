describe('Load Calculator - Basic Functionality', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    // Wait for the application to load
    cy.get('[data-cy="load-calculator"]', { timeout: 10000 }).should('be.visible')
  })

  it('should load the main Load Calculator page', () => {
    // Verify main components are present
    cy.get('[data-cy="load-calculator-header"]').should('be.visible')
    cy.get('[data-cy="project-information"]').should('be.visible')
    cy.get('[data-cy="load-input-tabs"]').should('be.visible')
    cy.get('[data-cy="calculation-results"]').should('be.visible')
    cy.get('[data-cy="calculation-summary"]').should('be.visible')
  })

  it('should allow project information input', () => {
    // Test customer name input
    cy.get('input[placeholder*="Customer"]').clear().type('Test Customer')
    cy.get('input[placeholder*="Customer"]').should('have.value', 'Test Customer')

    // Test address input
    cy.get('input[placeholder*="Address"]').clear().type('123 Test Street')
    cy.get('input[placeholder*="Address"]').should('have.value', '123 Test Street')

    // Test NEC code year selection
    cy.get('select').first().select('2023')
    cy.get('select').first().should('have.value', '2023')

    // Test calculation method selection
    cy.get('select').eq(1).select('optional')
    cy.get('select').eq(1).should('have.value', 'optional')
  })

  it('should navigate between load input tabs', () => {
    // Test tab navigation
    cy.contains('General Loads').click()
    cy.get('[data-cy="general-loads-tab"]').should('be.visible')

    cy.contains('EVSE Loads').click()
    cy.get('[data-cy="evse-loads-tab"]').should('be.visible')

    cy.contains('HVAC Loads').click()
    cy.get('[data-cy="hvac-loads-tab"]').should('be.visible')

    cy.contains('Solar & Battery').click()
    cy.get('[data-cy="solar-battery-tab"]').should('be.visible')

    cy.contains('Load Management').click()
    cy.get('[data-cy="load-management-tab"]').should('be.visible')
  })

  it('should add and remove general loads', () => {
    // Navigate to General Loads tab
    cy.contains('General Loads').click()

    // Add a general load
    cy.get('button').contains('Add Load').click()
    
    // Fill in load details
    cy.get('input[placeholder*="name"]').type('Test Load')
    cy.get('input[type="number"]').first().clear().type('1500')
    cy.get('select').first().select('VA')
    
    // Save the load
    cy.get('button').contains('Save').click()

    // Verify load was added
    cy.contains('Test Load').should('be.visible')
    cy.contains('1500').should('be.visible')

    // Remove the load
    cy.get('button').contains('Delete').first().click()
    cy.get('button').contains('Confirm').click()

    // Verify load was removed
    cy.contains('Test Load').should('not.exist')
  })

  it('should add and remove EVSE loads', () => {
    // Navigate to EVSE Loads tab
    cy.contains('EVSE Loads').click()

    // Add an EVSE load
    cy.get('button').contains('Add EVSE Load').click()
    
    // Fill in EVSE details
    cy.get('input[placeholder*="name"]').type('Tesla Charger')
    cy.get('input[type="number"]').first().clear().type('48')
    cy.get('select').first().select('A')
    
    // Save the EVSE load
    cy.get('button').contains('Save').click()

    // Verify EVSE load was added
    cy.contains('Tesla Charger').should('be.visible')
    cy.contains('48').should('be.visible')

    // Remove the EVSE load
    cy.get('button').contains('Delete').first().click()
    cy.get('button').contains('Confirm').click()

    // Verify EVSE load was removed
    cy.contains('Tesla Charger').should('not.exist')
  })

  it('should add and remove HVAC loads', () => {
    // Navigate to HVAC Loads tab
    cy.contains('HVAC Loads').click()

    // Add an HVAC load
    cy.get('button').contains('Add HVAC Load').click()
    
    // Fill in HVAC details
    cy.get('input[placeholder*="name"]').type('Central AC')
    cy.get('input[type="number"]').first().clear().type('3')
    cy.get('select').first().select('Tons')
    
    // Save the HVAC load
    cy.get('button').contains('Save').click()

    // Verify HVAC load was added
    cy.contains('Central AC').should('be.visible')
    cy.contains('3').should('be.visible')

    // Remove the HVAC load
    cy.get('button').contains('Delete').first().click()
    cy.get('button').contains('Confirm').click()

    // Verify HVAC load was removed
    cy.contains('Central AC').should('not.exist')
  })

  it('should add and remove solar/battery loads', () => {
    // Navigate to Solar & Battery tab
    cy.contains('Solar & Battery').click()

    // Add a solar system
    cy.get('button').contains('Add Solar').click()
    
    // Fill in solar details
    cy.get('input[placeholder*="name"]').type('Solar System')
    cy.get('input[type="number"]').first().clear().type('5')
    cy.get('select').first().select('kW')
    
    // Save the solar system
    cy.get('button').contains('Save').click()

    // Verify solar system was added
    cy.contains('Solar System').should('be.visible')
    cy.contains('5').should('be.visible')

    // Remove the solar system
    cy.get('button').contains('Delete').first().click()
    cy.get('button').contains('Confirm').click()

    // Verify solar system was removed
    cy.contains('Solar System').should('not.exist')
  })

  it('should perform basic calculations', () => {
    // Setup project information
    cy.get('input[placeholder*="Customer"]').clear().type('Test Customer')
    cy.get('input[placeholder*="Address"]').clear().type('123 Test Street')
    cy.get('select').first().select('2023')
    cy.get('select').eq(1).select('optional')

    // Add a general load
    cy.contains('General Loads').click()
    cy.get('button').contains('Add Load').click()
    cy.get('input[placeholder*="name"]').type('Test Load')
    cy.get('input[type="number"]').first().clear().type('1500')
    cy.get('select').first().select('VA')
    cy.get('button').contains('Save').click()

    // Verify calculations are performed
    cy.get('[data-cy="calculation-results"]').should('be.visible')
    cy.get('[data-cy="total-load"]').should('be.visible')
    cy.get('[data-cy="demand-load"]').should('be.visible')
  })

  it('should display validation messages', () => {
    // Try to add a load without required fields
    cy.contains('General Loads').click()
    cy.get('button').contains('Add Load').click()
    cy.get('button').contains('Save').click()

    // Verify validation message appears
    cy.get('[data-cy="validation-messages"]').should('be.visible')
    cy.contains('Name is required').should('be.visible')
  })

  it('should handle form validation correctly', () => {
    // Test invalid input
    cy.contains('General Loads').click()
    cy.get('button').contains('Add Load').click()
    
    // Try to enter invalid values
    cy.get('input[type="number"]').first().clear().type('-100')
    cy.get('button').contains('Save').click()

    // Verify validation prevents saving
    cy.get('[data-cy="validation-messages"]').should('be.visible')
  })

  it('should persist data across tab switches', () => {
    // Add a load in General Loads
    cy.contains('General Loads').click()
    cy.get('button').contains('Add Load').click()
    cy.get('input[placeholder*="name"]').type('Persistent Load')
    cy.get('input[type="number"]').first().clear().type('2000')
    cy.get('select').first().select('VA')
    cy.get('button').contains('Save').click()

    // Switch to another tab
    cy.contains('EVSE Loads').click()
    
    // Switch back to General Loads
    cy.contains('General Loads').click()
    
    // Verify load is still there
    cy.contains('Persistent Load').should('be.visible')
    cy.contains('2000').should('be.visible')
  })

  it('should display calculation guide and definitions', () => {
    // Scroll to bottom sections
    cy.get('[data-cy="load-calculation-guide"]').should('be.visible')
    cy.get('[data-cy="definitions-glossary"]').should('be.visible')
    
    // Verify guide content
    cy.contains('Load Calculation Guide').should('be.visible')
    cy.contains('Definitions & Glossary').should('be.visible')
  })
}) 