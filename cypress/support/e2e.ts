// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands to the Cypress interface
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-cy attribute.
       * @example cy.dataCy('greeting')
       */
      dataCy(value: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Custom command to login (if authentication is implemented)
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Custom command to setup a test project
       * @example cy.setupProject({ name: 'Test Project', address: '123 Test St' })
       */
      setupProject(projectInfo: { name: string; address: string }): Chainable<void>
      
      /**
       * Custom command to add load to calculator
       * @example cy.addLoad('evse', { name: 'Tesla Charger', amps: 48 })
       */
      addLoad(type: string, loadData: Record<string, any>): Chainable<void>
    }
  }
}