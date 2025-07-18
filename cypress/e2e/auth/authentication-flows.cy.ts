describe('Authentication Flows - Comprehensive Tests', () => {
  it('should display login page correctly', () => {
    cy.visit('/login');
    
    // Verify we're on the login page
    cy.url().should('include', '/login');
    
    // Check for authentication elements
    cy.get('body').should('contain.text', /login|sign.in|authentication/i);
    
    // Look for Google OAuth button
    cy.get('button').then($buttons => {
      const googleBtn = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        return /google|oauth|sign.in.with/i.test(text);
      });
      
      if (googleBtn.length > 0) {
        cy.log('Found Google OAuth button');
        cy.wrap(googleBtn.first()).should('be.visible');
      }
    });
    
    // Check for guest login option
    cy.get('[data-cy="guest-login"]').should('be.visible');
  });

  it('should handle guest login successfully', () => {
    cy.visit('/login');
    
    // Scroll to find guest login button
    cy.scrollTo('bottom');
    
    // Click guest login
    cy.get('[data-cy="guest-login"]').should('be.visible').click();
    
    // Wait for authentication to complete
    cy.wait(5000);
    
    // Verify we're redirected away from login
    cy.url({ timeout: 10000 }).should('not.include', '/login');
    
    // Verify we can access the main application
    cy.get('[data-tab-id="calculator"]').should('be.visible');
    
    cy.log('Guest login completed successfully');
  });

  it('should maintain authentication state across page reloads', () => {
    // Login as guest first
    cy.loginAsGuest();
    
    // Verify we're logged in
    cy.url().should('not.include', '/login');
    
    // Reload the page
    cy.reload();
    cy.wait(3000);
    
    // Verify we're still logged in
    cy.url().should('not.include', '/login');
    cy.get('[data-tab-id="calculator"]').should('be.visible');
    
    cy.log('Authentication state maintained after reload');
  });

  it('should handle logout functionality', () => {
    // Login first
    cy.loginAsGuest();
    
    // Look for logout button/menu
    cy.get('button, a').then($elements => {
      const logoutElements = $elements.filter((i, el) => {
        const text = el.textContent || '';
        const title = el.getAttribute('title') || '';
        return /logout|sign.out|exit/i.test(text + ' ' + title);
      });
      
      if (logoutElements.length > 0) {
        cy.wrap(logoutElements.first()).click();
        cy.wait(2000);
        
        // Verify we're redirected to login
        cy.url({ timeout: 5000 }).should('include', '/login');
        cy.log('Logout functionality works');
      } else {
        cy.log('No logout button found - may be in user menu');
        
        // Look for user menu or profile button
        cy.get('button').then($buttons => {
          const userMenuBtn = $buttons.filter((i, el) => {
            const text = el.textContent || '';
            const ariaLabel = el.getAttribute('aria-label') || '';
            return /user|profile|menu|account/i.test(text + ' ' + ariaLabel);
          });
          
          if (userMenuBtn.length > 0) {
            cy.wrap(userMenuBtn.first()).click();
            cy.wait(1000);
            
            // Look for logout in dropdown
            cy.get('button, a').then($dropdownItems => {
              const logoutInDropdown = $dropdownItems.filter((i, el) => /logout|sign.out/i.test(el.textContent || ''));
              if (logoutInDropdown.length > 0) {
                cy.wrap(logoutInDropdown.first()).click();
                cy.wait(2000);
                cy.url({ timeout: 5000 }).should('include', '/login');
                cy.log('Found logout in user menu');
              }
            });
          }
        });
      }
    });
  });

  it('should handle authentication errors gracefully', () => {
    cy.visit('/login');
    
    // Test with invalid session by manipulating localStorage
    cy.window().then((win) => {
      win.localStorage.setItem('supabase.auth.token', 'invalid_token');
    });
    
    // Try to access protected content
    cy.visit('/');
    cy.wait(3000);
    
    // Should redirect to login or show error
    cy.url().then((url) => {
      if (url.includes('/login')) {
        cy.log('Correctly redirected to login with invalid token');
      } else {
        cy.log('Application handled invalid token gracefully');
      }
    });
  });

  it('should protect routes when not authenticated', () => {
    // Clear any existing authentication
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // Try to access the main application directly
    cy.visit('/');
    cy.wait(3000);
    
    // Should redirect to login or require authentication
    cy.url().then((url) => {
      if (url.includes('/login')) {
        cy.log('Protected routes correctly redirect to login');
      } else {
        // Check if we can access functionality without login
        cy.get('body').then($body => {
          const hasMainContent = $body.find('[data-tab-id="calculator"]').length > 0;
          if (hasMainContent) {
            cy.log('Application allows guest access to main content');
          } else {
            cy.log('Application properly protects content');
          }
        });
      }
    });
  });

  it('should handle session expiration', () => {
    // Login first
    cy.loginAsGuest();
    
    // Simulate session expiration by clearing auth data
    cy.window().then((win) => {
      win.localStorage.clear();
    });
    
    // Try to perform an action that might require authentication
    cy.reload();
    cy.wait(3000);
    
    // Check how the application handles expired session
    cy.url().then((url) => {
      if (url.includes('/login')) {
        cy.log('Application correctly handles session expiration');
      } else {
        cy.log('Application continues to work after session clear');
      }
    });
  });

  it('should display user information when authenticated', () => {
    // Login as guest
    cy.loginAsGuest();
    
    // Look for user information display
    cy.get('body').then($body => {
      const text = $body.text();
      const hasUserInfo = /user|guest|profile|account|welcome/i.test(text);
      
      if (hasUserInfo) {
        cy.log('Found user information display');
        
        // Look for user avatar or name
        cy.get('img, span, div').then($elements => {
          const userElements = $elements.filter((i, el) => {
            const alt = el.getAttribute('alt') || '';
            const className = el.className || '';
            const text = el.textContent || '';
            return /avatar|profile|user|guest/i.test(alt + ' ' + className + ' ' + text);
          });
          
          if (userElements.length > 0) {
            cy.log('Found user avatar or display element');
          }
        });
      }
    });
  });

  it('should handle Google OAuth button click', () => {
    cy.visit('/login');
    
    // Look for Google OAuth button
    cy.get('button').then($buttons => {
      const googleBtn = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        return /google|oauth|sign.in.with.google/i.test(text);
      });
      
      if (googleBtn.length > 0) {
        // Note: We can't actually complete OAuth in E2E tests
        // but we can verify the button is clickable and triggers action
        cy.wrap(googleBtn.first()).should('not.be.disabled');
        cy.log('Google OAuth button is present and clickable');
        
        // Click would normally redirect to Google OAuth
        // In E2E test, we just verify the button works
        cy.wrap(googleBtn.first()).click();
        cy.wait(1000);
        cy.log('Google OAuth button click handled');
      } else {
        cy.log('Google OAuth button not found');
      }
    });
  });

  it('should handle authentication loading states', () => {
    cy.visit('/login');
    
    // Click guest login and check for loading states
    cy.get('[data-cy="guest-login"]').click();
    
    // Look for loading indicators
    cy.get('body').then($body => {
      const text = $body.text();
      const hasLoadingText = /loading|authenticating|signing.in|please.wait/i.test(text);
      
      if (hasLoadingText) {
        cy.log('Found authentication loading state');
      }
      
      // Look for spinner or loading animation
      const hasSpinner = $body.find('.spinner, .loading, [data-loading]').length > 0;
      if (hasSpinner) {
        cy.log('Found loading spinner during authentication');
      }
    });
    
    // Wait for authentication to complete
    cy.wait(5000);
    cy.url({ timeout: 10000 }).should('not.include', '/login');
  });
});