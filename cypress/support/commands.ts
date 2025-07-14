// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to select elements by data-cy attribute
Cypress.Commands.add('dataCy', (value: string) => {
  return cy.get(`[data-cy=${value}]`)
})

// Custom command to setup a test project
Cypress.Commands.add('setupProject', (projectInfo: { name: string; address: string }) => {
  // Navigate to the application
  cy.visit('/')
  
  // Fill in project information
  cy.get('input[placeholder*="Customer"]').clear().type(projectInfo.name)
  cy.get('input[placeholder*="Address"]').clear().type(projectInfo.address)
  
  // Additional project setup as needed
  cy.get('select').first().select('2023') // NEC Code Year
  cy.get('select').eq(1).select('optional') // Calculation Method
})

// Custom command to add different types of loads
Cypress.Commands.add('addLoad', (type: string, loadData: Record<string, any>) => {
  // Navigate to appropriate load tab
  switch (type) {
    case 'evse':
      cy.contains('EVSE Loads').click()
      cy.get('button').contains('Add EVSE Load').click()
      
      if (loadData.name) {
        cy.get('input[placeholder*="name"]').type(loadData.name)
      }
      if (loadData.amps) {
        cy.get('input[type="number"]').first().clear().type(loadData.amps.toString())
      }
      break
      
    case 'solar':
      cy.contains('Solar & Battery').click()
      cy.get('button').contains('Add Solar').click()
      
      if (loadData.name) {
        cy.get('input[placeholder*="name"]').type(loadData.name)
      }
      if (loadData.kw) {
        cy.get('input[type="number"]').first().clear().type(loadData.kw.toString())
      }
      break
      
    case 'hvac':
      cy.contains('HVAC Loads').click()
      cy.get('button').contains('Add HVAC Load').click()
      
      if (loadData.name) {
        cy.get('input[placeholder*="name"]').type(loadData.name)
      }
      if (loadData.tons) {
        cy.get('input[type="number"]').first().clear().type(loadData.tons.toString())
      }
      break
      
    default:
      // General loads
      cy.contains('General Loads').click()
      cy.get('button').contains('Add Load').click()
      
      if (loadData.name) {
        cy.get('input[placeholder*="name"]').type(loadData.name)
      }
      if (loadData.va) {
        cy.get('input[type="number"]').first().clear().type(loadData.va.toString())
      }
  }
  
  // Save the load
  cy.get('button').contains('Save').click()
})

// Custom command for login (if authentication is implemented)
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('input[type="email"]').type(email)
    cy.get('input[type="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('not.include', '/login')
  })
})

// Prevent Cypress from failing on uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Script error')) {
    return false
  }
  return true
})