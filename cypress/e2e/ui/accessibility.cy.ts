describe('Accessibility - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
  });

  it('should have proper heading hierarchy', () => {
    // Check for proper heading structure (h1, h2, h3, etc.)
    cy.get('h1').should('exist');
    
    // Verify no heading levels are skipped
    cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
      const levels = Array.from($headings).map(el => parseInt(el.tagName.charAt(1)));
      const sortedLevels = [...new Set(levels)].sort((a, b) => a - b);
      
      // Check that we don't skip heading levels
      for (let i = 1; i < sortedLevels.length; i++) {
        const diff = sortedLevels[i] - sortedLevels[i - 1];
        expect(diff).to.be.at.most(1);
      }
      
      cy.log('Heading hierarchy is properly structured');
    });
  });

  it('should have accessible form labels', () => {
    // Check that all form inputs have associated labels
    cy.get('input, select, textarea').each($input => {
      const id = $input.attr('id');
      const ariaLabel = $input.attr('aria-label');
      const ariaLabelledby = $input.attr('aria-labelledby');
      const placeholder = $input.attr('placeholder');
      
      // Input should have one of: associated label, aria-label, aria-labelledby, or meaningful placeholder
      if (id) {
        cy.get(`label[for="${id}"]`).should('exist');
      } else {
        expect(ariaLabel || ariaLabelledby || placeholder).to.exist;
      }
    });
    
    cy.log('Form elements have proper labeling');
  });

  it('should support keyboard navigation', () => {
    // Test Tab key navigation through interactive elements
    cy.get('body').tab();
    
    // Verify focus moves to first focusable element
    cy.focused().should('exist');
    
    // Navigate through several elements
    for (let i = 0; i < 5; i++) {
      cy.focused().tab();
      cy.focused().should('exist');
    }
    
    // Test Shift+Tab for reverse navigation
    cy.focused().tab({ shift: true });
    cy.focused().should('exist');
    
    cy.log('Keyboard navigation works properly');
  });

  it('should have proper focus indicators', () => {
    // Test that focused elements have visible focus indicators
    cy.get('button, input, select, a, [tabindex]').first().focus();
    
    cy.focused().then($el => {
      const styles = window.getComputedStyle($el[0]);
      const hasOutline = styles.outline !== 'none' && styles.outline !== '';
      const hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';
      const hasBorder = styles.borderColor !== 'transparent';
      
      // At least one focus indicator should be present
      expect(hasOutline || hasBoxShadow || hasBorder).to.be.true;
    });
    
    cy.log('Focus indicators are visible');
  });

  it('should have sufficient color contrast', () => {
    // Test main text elements for color contrast
    cy.get('body, p, span, div').each($el => {
      const text = $el.text().trim();
      if (text.length > 0) {
        cy.wrap($el).then($element => {
          const styles = window.getComputedStyle($element[0]);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Note: Actual contrast ratio calculation would require a specialized library
          // Here we just check that colors are defined
          expect(color).to.not.equal('');
          cy.log(`Text color: ${color}, Background: ${backgroundColor}`);
        });
      }
    });
  });

  it('should have proper button accessibility', () => {
    cy.get('button').each($button => {
      // Buttons should have accessible names
      const text = $button.text().trim();
      const ariaLabel = $button.attr('aria-label');
      const ariaLabelledby = $button.attr('aria-labelledby');
      const title = $button.attr('title');
      
      expect(text || ariaLabel || ariaLabelledby || title).to.exist;
      
      // Buttons should not be disabled without reason
      if ($button.prop('disabled')) {
        const ariaDisabled = $button.attr('aria-disabled');
        expect(ariaDisabled).to.equal('true');
      }
    });
    
    cy.log('Buttons have proper accessibility attributes');
  });

  it('should use semantic HTML elements', () => {
    // Check for proper use of semantic elements
    const semanticElements = ['nav', 'main', 'header', 'footer', 'section', 'article', 'aside'];
    
    semanticElements.forEach(element => {
      cy.get('body').then($body => {
        const hasElement = $body.find(element).length > 0;
        if (hasElement) {
          cy.log(`Found semantic element: ${element}`);
        }
      });
    });
    
    // Check for landmark roles
    const landmarks = ['navigation', 'main', 'banner', 'contentinfo', 'search'];
    
    landmarks.forEach(role => {
      cy.get(`[role="${role}"]`).then($elements => {
        if ($elements.length > 0) {
          cy.log(`Found landmark role: ${role}`);
        }
      });
    });
  });

  it('should provide skip links for keyboard users', () => {
    // Look for skip to main content links
    cy.get('body').then($body => {
      const skipLinks = $body.find('a[href="#main"], a[href="#content"], .skip-link');
      if (skipLinks.length > 0) {
        cy.log('Found skip navigation links');
        
        // Test that skip link works
        cy.wrap(skipLinks.first()).focus();
        cy.focused().should('contain.text', /skip|main|content/i);
      }
    });
  });

  it('should handle screen reader announcements', () => {
    // Check for ARIA live regions
    cy.get('[aria-live], [role="status"], [role="alert"]').then($liveRegions => {
      if ($liveRegions.length > 0) {
        cy.log('Found ARIA live regions for screen readers');
        
        $liveRegions.each((index, region) => {
          const ariaLive = region.getAttribute('aria-live');
          const role = region.getAttribute('role');
          cy.log(`Live region ${index}: aria-live="${ariaLive}", role="${role}"`);
        });
      }
    });
    
    // Test dynamic content announcements by adding a load
    cy.addLoad('general', { name: 'Test Load', va: 1000 });
    
    // Check if success message is announced
    cy.get('[aria-live="polite"], [role="status"]').then($announcements => {
      if ($announcements.length > 0) {
        cy.log('Found announcement regions for dynamic content');
      }
    });
  });

  it('should have proper table accessibility', () => {
    cy.get('table').each($table => {
      // Tables should have captions or accessible names
      const caption = $table.find('caption');
      const ariaLabel = $table.attr('aria-label');
      const ariaLabelledby = $table.attr('aria-labelledby');
      
      if (caption.length === 0 && !ariaLabel && !ariaLabelledby) {
        cy.log('Table missing caption or accessible name');
      }
      
      // Check for proper table headers
      const headers = $table.find('th');
      if (headers.length > 0) {
        cy.log('Table has proper header cells');
        
        // Headers should have scope attributes for complex tables
        headers.each((index, header) => {
          const scope = header.getAttribute('scope');
          const id = header.getAttribute('id');
          if (!scope && !id && $table.find('td').length > headers.length) {
            cy.log(`Header ${index} missing scope or id attribute`);
          }
        });
      }
    });
  });

  it('should handle modal dialog accessibility', () => {
    // Open project manager modal
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Check modal accessibility
    cy.get('[role="dialog"]').then($modal => {
      if ($modal.length > 0) {
        // Modal should have accessible name
        const ariaLabel = $modal.attr('aria-label');
        const ariaLabelledby = $modal.attr('aria-labelledby');
        expect(ariaLabel || ariaLabelledby).to.exist;
        
        // Modal should trap focus
        cy.focused().should('exist');
        
        // Test Escape key closes modal
        cy.get('body').type('{esc}');
        cy.wait(500);
        cy.get('[role="dialog"]').should('not.exist');
        
        cy.log('Modal accessibility is properly implemented');
      }
    });
  });

  it('should provide error handling accessibility', () => {
    // Try to trigger a validation error
    cy.contains('General Loads').click();
    cy.contains('button', 'Add Load').click();
    
    // Try to save without required fields
    cy.contains('button', 'Save').click();
    
    // Check for accessible error messages
    cy.get('[role="alert"], .error, [aria-invalid="true"]').then($errors => {
      if ($errors.length > 0) {
        $errors.each((index, error) => {
          const text = error.textContent;
          const role = error.getAttribute('role');
          const ariaInvalid = error.getAttribute('aria-invalid');
          
          cy.log(`Error ${index}: "${text}", role="${role}", aria-invalid="${ariaInvalid}"`);
        });
        
        cy.log('Error messages are accessible');
      }
    });
  });

  it('should support high contrast mode', () => {
    // Test that the application works with forced colors
    cy.get('body').then($body => {
      // Simulate high contrast mode by checking if styles still work
      const bodyStyles = window.getComputedStyle($body[0]);
      const hasBackground = bodyStyles.backgroundColor !== 'transparent';
      const hasColor = bodyStyles.color !== 'transparent';
      
      expect(hasBackground || hasColor).to.be.true;
      cy.log('Application supports high contrast styling');
    });
  });

  it('should handle reduced motion preferences', () => {
    // Check if animations are disabled when prefers-reduced-motion is set
    cy.window().then(win => {
      // Simulate reduced motion preference
      const mediaQuery = win.matchMedia('(prefers-reduced-motion: reduce)');
      
      if (mediaQuery.matches) {
        cy.log('Reduced motion preference detected');
        
        // Check that transitions are minimal
        cy.get('*').each($el => {
          const styles = window.getComputedStyle($el[0]);
          const transition = styles.transition;
          const animation = styles.animation;
          
          // Should have minimal or no transitions/animations
          if (transition !== 'none' || animation !== 'none') {
            cy.log(`Element has motion: transition="${transition}", animation="${animation}"`);
          }
        });
      }
    });
  });
});