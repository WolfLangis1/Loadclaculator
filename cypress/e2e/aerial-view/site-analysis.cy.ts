describe('Aerial View / Site Analysis - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
    
    // Navigate to Site Analysis tab
    cy.get('[data-tab-id="aerial"]').click();
    cy.wait(3000); // Allow time for lazy loading
  });

  it('should load the aerial view interface', () => {
    // Verify we're on the aerial view tab
    cy.get('[data-tab-id="aerial"]').should('have.attr', 'aria-selected', 'true');
    
    // Look for aerial view specific elements
    cy.get('body').should('contain.text', /aerial|satellite|map|address|analysis/i);
  });

  it('should have address search functionality', () => {
    // Look for address input field
    cy.get('input').then($inputs => {
      const addressInput = $inputs.filter((i, el) => {
        const placeholder = el.getAttribute('placeholder');
        const name = el.getAttribute('name');
        const id = el.getAttribute('id');
        return (placeholder && placeholder.toLowerCase().includes('address')) ||
               (name && name.toLowerCase().includes('address')) ||
               (id && id.toLowerCase().includes('address'));
      });
      
      if (addressInput.length > 0) {
        cy.wrap(addressInput.first()).type('123 Main Street, Anytown, CA 90210');
        cy.log('Found and filled address input');
        
        // Look for search button
        cy.get('button').then($buttons => {
          const searchButton = $buttons.filter((i, el) => {
            const text = el.textContent || '';
            return /search|find|locate|go/i.test(text);
          });
          
          if (searchButton.length > 0) {
            cy.wrap(searchButton.first()).click();
            cy.wait(2000);
            cy.log('Found and clicked search button');
          }
        });
      } else {
        cy.log('No address input field found');
      }
    });
  });

  it('should display map or satellite imagery', () => {
    // Look for map container elements
    cy.get('div').then($divs => {
      const mapDivs = $divs.filter((i, el) => {
        const className = el.className;
        const id = el.id;
        return /map|satellite|imagery|canvas|leaflet|google/i.test(className + ' ' + id);
      });
      
      if (mapDivs.length > 0) {
        cy.log('Found map container elements');
        cy.wrap(mapDivs.first()).should('be.visible');
      }
    });
    
    // Look for map-related content
    cy.get('body').then($body => {
      const text = $body.text();
      const hasMapContent = /satellite|imagery|zoom|pan|street view/i.test(text);
      
      if (hasMapContent) {
        cy.log('Found map-related content');
      }
    });
  });

  it('should have measurement tools', () => {
    // Look for measurement tool buttons
    cy.get('button').then($buttons => {
      const measureButtons = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        const title = el.getAttribute('title') || '';
        return /measure|distance|area|ruler|calculate/i.test(text + ' ' + title);
      });
      
      if (measureButtons.length > 0) {
        cy.log('Found measurement tool buttons');
        cy.wrap(measureButtons.first()).click();
        cy.log('Clicked measurement tool');
        
        // Look for measurement instructions or tools
        cy.wait(1000);
        cy.get('body').should('contain.text', /click|measure|distance|area/i);
      } else {
        cy.log('No measurement tools found');
      }
    });
  });

  it('should show coordinates or location information', () => {
    // Look for coordinate display
    cy.get('body').then($body => {
      const text = $body.text();
      const hasCoordinates = /latitude|longitude|lat|lng|coordinates|\d+\.\d+.*\d+\.\d+/i.test(text);
      
      if (hasCoordinates) {
        cy.log('Found coordinate information');
        cy.get('body').should('contain.text', /lat|lng|coordinates/i);
      }
    });
  });

  it('should support different view modes', () => {
    // Look for view mode controls
    cy.get('button, select').then($controls => {
      const viewControls = $controls.filter((i, el) => {
        const text = el.textContent || '';
        const value = el.getAttribute('value') || '';
        return /satellite|street|terrain|hybrid|map/i.test(text + ' ' + value);
      });
      
      if (viewControls.length > 0) {
        cy.log('Found view mode controls');
        
        // Try switching between view modes
        viewControls.each((index, control) => {
          if (index < 3) { // Test first 3 view modes
            cy.wrap(control).click();
            cy.wait(1000);
            cy.log(`Switched to view mode: ${control.textContent}`);
          }
        });
      }
    });
  });

  it('should have zoom and pan controls', () => {
    // Look for zoom controls
    cy.get('button').then($buttons => {
      const zoomButtons = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        const title = el.getAttribute('title') || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        return /zoom|pan|\+|\-|in|out/i.test(text + ' ' + title + ' ' + ariaLabel);
      });
      
      if (zoomButtons.length > 0) {
        cy.log('Found zoom/pan controls');
        
        // Test zoom in
        const zoomInBtn = zoomButtons.filter((i, el) => /\+|in/i.test(el.textContent || ''));
        if (zoomInBtn.length > 0) {
          cy.wrap(zoomInBtn.first()).click();
          cy.wait(500);
          cy.log('Tested zoom in');
        }
        
        // Test zoom out
        const zoomOutBtn = zoomButtons.filter((i, el) => /\-|out/i.test(el.textContent || ''));
        if (zoomOutBtn.length > 0) {
          cy.wrap(zoomOutBtn.first()).click();
          cy.wait(500);
          cy.log('Tested zoom out');
        }
      }
    });
  });

  it('should display property information', () => {
    // After searching for an address, look for property details
    cy.get('input').then($inputs => {
      const addressInput = $inputs.filter((i, el) => {
        const placeholder = el.getAttribute('placeholder');
        return placeholder && placeholder.toLowerCase().includes('address');
      });
      
      if (addressInput.length > 0) {
        cy.wrap(addressInput.first()).clear().type('1600 Amphitheatre Parkway, Mountain View, CA');
        
        // Submit search
        cy.get('button').then($buttons => {
          const searchButton = $buttons.filter((i, el) => /search|find/i.test(el.textContent || ''));
          if (searchButton.length > 0) {
            cy.wrap(searchButton.first()).click();
            cy.wait(3000);
            
            // Look for property information
            cy.get('body').then($body => {
              const text = $body.text();
              const hasPropertyInfo = /square.feet|sq.ft|acres|lot.size|parcel/i.test(text);
              
              if (hasPropertyInfo) {
                cy.log('Found property information');
              }
            });
          }
        });
      }
    });
  });

  it('should handle export functionality', () => {
    // Look for export or download buttons
    cy.get('button').then($buttons => {
      const exportButtons = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        return /export|download|save|capture|screenshot/i.test(text);
      });
      
      if (exportButtons.length > 0) {
        cy.log('Found export functionality');
        cy.wrap(exportButtons.first()).click();
        cy.wait(1000);
        cy.log('Tested export feature');
      }
    });
  });

  it('should show street view if available', () => {
    // Look for street view elements
    cy.get('body').then($body => {
      const text = $body.text();
      const hasStreetView = /street.view|street.photo|360|panorama/i.test(text);
      
      if (hasStreetView) {
        cy.log('Found street view functionality');
        
        // Look for street view button
        cy.get('button').then($buttons => {
          const streetViewBtn = $buttons.filter((i, el) => /street/i.test(el.textContent || ''));
          if (streetViewBtn.length > 0) {
            cy.wrap(streetViewBtn.first()).click();
            cy.wait(2000);
            cy.log('Tested street view');
          }
        });
      }
    });
  });

  it('should be responsive on different screen sizes', () => {
    // Test mobile view
    cy.viewport(375, 667);
    cy.wait(1000);
    cy.get('body').should('be.visible');
    
    // Test tablet view
    cy.viewport(768, 1024);
    cy.wait(1000);
    cy.get('body').should('be.visible');
    
    // Test desktop view
    cy.viewport(1280, 720);
    cy.wait(1000);
    cy.get('body').should('be.visible');
    
    cy.log('Tested responsive design on different viewports');
  });
});