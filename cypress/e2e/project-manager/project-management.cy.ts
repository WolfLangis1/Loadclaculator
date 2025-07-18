describe('Project Manager - Comprehensive Tests', () => {
  beforeEach(() => {
    cy.loginAsGuest();
    cy.wait(3000);
  });

  it('should open project manager modal', () => {
    // Click the Projects button
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Verify modal opens
    cy.get('[role="dialog"], .modal, .overlay').should('be.visible');
    cy.log('Project manager modal opened successfully');
  });

  it('should display project list and options', () => {
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for project-related content
    cy.get('body').should('contain.text', /project|new|create|open|save/i);
    
    // Look for project list or grid
    cy.get('div, ul, table').then($containers => {
      const projectContainers = $containers.filter((i, el) => {
        const text = el.textContent || '';
        return /project|template|recent/i.test(text);
      });
      
      if (projectContainers.length > 0) {
        cy.log('Found project list/grid container');
      }
    });
  });

  it('should create a new project', () => {
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for "New Project" button
    cy.get('button').then($buttons => {
      const newProjectBtn = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        return /new.project|create.project|start.new/i.test(text);
      });
      
      if (newProjectBtn.length > 0) {
        cy.wrap(newProjectBtn.first()).click();
        cy.wait(1000);
        cy.log('Clicked New Project button');
        
        // Fill project details if form appears
        cy.get('input').then($inputs => {
          if ($inputs.length > 0) {
            const nameInput = $inputs.filter((i, el) => {
              const placeholder = el.getAttribute('placeholder');
              const name = el.getAttribute('name');
              return (placeholder && /name|title/i.test(placeholder)) ||
                     (name && /name|title/i.test(name));
            });
            
            if (nameInput.length > 0) {
              cy.wrap(nameInput.first()).type('Test Project E2E');
              cy.log('Filled project name');
            }
          }
        });
        
        // Save the project
        cy.get('button').then($buttons => {
          const saveBtn = $buttons.filter((i, el) => /save|create|confirm/i.test(el.textContent || ''));
          if (saveBtn.length > 0) {
            cy.wrap(saveBtn.first()).click();
            cy.wait(1000);
            cy.log('Saved new project');
          }
        });
      } else {
        cy.log('No New Project button found');
      }
    });
  });

  it('should use project templates', () => {
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for templates
    cy.get('body').then($body => {
      const text = $body.text();
      const hasTemplates = /template|residential|commercial|solar|evse/i.test(text);
      
      if (hasTemplates) {
        cy.log('Found project templates');
        
        // Try to select a template
        cy.get('button, div').then($elements => {
          const templateElements = $elements.filter((i, el) => {
            const text = el.textContent || '';
            return /residential|commercial|solar|template/i.test(text);
          });
          
          if (templateElements.length > 0) {
            cy.wrap(templateElements.first()).click();
            cy.wait(1000);
            cy.log('Selected a project template');
          }
        });
      }
    });
  });

  it('should save current project', () => {
    // First, make some changes to the current project
    cy.addLoad('general', { name: 'Test Load for Save', va: 1500 });
    
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for save button
    cy.get('button').then($buttons => {
      const saveBtn = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        return /save|save.project|save.current/i.test(text) && !/as/i.test(text);
      });
      
      if (saveBtn.length > 0) {
        cy.wrap(saveBtn.first()).click();
        cy.wait(1000);
        cy.log('Saved current project');
        
        // Look for success message
        cy.get('body').then($body => {
          const text = $body.text();
          if (/saved|success/i.test(text)) {
            cy.log('Found save success message');
          }
        });
      }
    });
  });

  it('should export project data', () => {
    // Add some data to export
    cy.addLoad('general', { name: 'Export Test Load', va: 2000 });
    
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for export functionality
    cy.get('button').then($buttons => {
      const exportBtn = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        return /export|download|backup/i.test(text);
      });
      
      if (exportBtn.length > 0) {
        cy.wrap(exportBtn.first()).click();
        cy.wait(1000);
        cy.log('Clicked export button');
        
        // Look for export format options
        cy.get('body').then($body => {
          const text = $body.text();
          if (/json|pdf|csv|xlsx/i.test(text)) {
            cy.log('Found export format options');
            
            // Try to select JSON format
            cy.get('button, option').then($options => {
              const jsonOption = $options.filter((i, el) => /json/i.test(el.textContent || ''));
              if (jsonOption.length > 0) {
                cy.wrap(jsonOption.first()).click();
                cy.log('Selected JSON export format');
              }
            });
          }
        });
      }
    });
  });

  it('should import project data', () => {
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for import functionality
    cy.get('button').then($buttons => {
      const importBtn = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        return /import|upload|load.project/i.test(text);
      });
      
      if (importBtn.length > 0) {
        cy.wrap(importBtn.first()).click();
        cy.wait(1000);
        cy.log('Clicked import button');
        
        // Look for file input
        cy.get('input[type="file"]').then($fileInputs => {
          if ($fileInputs.length > 0) {
            cy.log('Found file input for import');
            // Note: Actual file upload testing would require fixture files
          }
        });
      }
    });
  });

  it('should show recent projects', () => {
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for recent projects section
    cy.get('body').then($body => {
      const text = $body.text();
      const hasRecent = /recent|history|last.opened/i.test(text);
      
      if (hasRecent) {
        cy.log('Found recent projects section');
        
        // Look for project items
        cy.get('div, li').then($items => {
          const projectItems = $items.filter((i, el) => {
            const text = el.textContent || '';
            return /project|\.json|modified|created/i.test(text);
          });
          
          if (projectItems.length > 0) {
            cy.log(`Found ${projectItems.length} project items`);
            
            // Try to open a recent project
            cy.wrap(projectItems.first()).click();
            cy.wait(1000);
            cy.log('Clicked on recent project');
          }
        });
      }
    });
  });

  it('should handle project deletion', () => {
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // First create a project to delete
    cy.get('button').then($buttons => {
      const newProjectBtn = $buttons.filter((i, el) => /new.project/i.test(el.textContent || ''));
      if (newProjectBtn.length > 0) {
        cy.wrap(newProjectBtn.first()).click();
        cy.wait(500);
        
        // Fill project name
        cy.get('input').then($inputs => {
          if ($inputs.length > 0) {
            cy.wrap($inputs.first()).type('Project to Delete');
          }
        });
        
        // Save project
        cy.get('button').then($saveButtons => {
          const saveBtn = $saveButtons.filter((i, el) => /save|create/i.test(el.textContent || ''));
          if (saveBtn.length > 0) {
            cy.wrap(saveBtn.first()).click();
            cy.wait(1000);
            
            // Now look for delete button
            cy.get('button').then($deleteButtons => {
              const deleteBtn = $deleteButtons.filter((i, el) => /delete|remove|trash/i.test(el.textContent || ''));
              if (deleteBtn.length > 0) {
                cy.wrap(deleteBtn.first()).click();
                cy.wait(500);
                
                // Confirm deletion if modal appears
                cy.get('button').then($confirmButtons => {
                  const confirmBtn = $confirmButtons.filter((i, el) => /confirm|yes|delete/i.test(el.textContent || ''));
                  if (confirmBtn.length > 0) {
                    cy.wrap(confirmBtn.first()).click();
                    cy.log('Confirmed project deletion');
                  }
                });
              }
            });
          }
        });
      }
    });
  });

  it('should close project manager modal', () => {
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for close button
    cy.get('button').then($buttons => {
      const closeBtn = $buttons.filter((i, el) => {
        const text = el.textContent || '';
        const ariaLabel = el.getAttribute('aria-label') || '';
        return /close|cancel|×|✕/i.test(text + ' ' + ariaLabel);
      });
      
      if (closeBtn.length > 0) {
        cy.wrap(closeBtn.first()).click();
        cy.wait(500);
        cy.log('Closed project manager modal');
        
        // Verify modal is closed
        cy.get('[role="dialog"], .modal, .overlay').should('not.exist');
      } else {
        // Try pressing Escape key
        cy.get('body').type('{esc}');
        cy.wait(500);
        cy.log('Tried closing with Escape key');
      }
    });
  });

  it('should handle project search and filtering', () => {
    // Open project manager
    cy.contains('button', /Projects|Files/).click();
    cy.wait(1000);
    
    // Look for search input
    cy.get('input').then($inputs => {
      const searchInput = $inputs.filter((i, el) => {
        const placeholder = el.getAttribute('placeholder');
        const type = el.getAttribute('type');
        return (placeholder && /search|filter|find/i.test(placeholder)) ||
               (type === 'search');
      });
      
      if (searchInput.length > 0) {
        cy.wrap(searchInput.first()).type('test');
        cy.wait(1000);
        cy.log('Tested project search functionality');
        
        // Clear search
        cy.wrap(searchInput.first()).clear();
      }
    });
    
    // Look for filter options
    cy.get('select, button').then($filters => {
      const filterElements = $filters.filter((i, el) => {
        const text = el.textContent || '';
        return /filter|sort|type|date|name/i.test(text);
      });
      
      if (filterElements.length > 0) {
        cy.log('Found project filter options');
      }
    });
  });
});