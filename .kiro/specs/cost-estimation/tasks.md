# Implementation Plan

- [ ] 1. Create core cost estimation types and interfaces
  - Define TypeScript interfaces for MaterialItem, LaborItem, CostEstimate, and related types
  - Create cost estimation error classes and error codes
  - Add cost estimation types to main types index
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [ ] 2. Implement material cost calculation service
  - Create MaterialCostService class with material identification logic
  - Implement wire quantity calculation from load calculations
  - Add conduit, panel, and breaker material calculations
  - Create material database schema and default pricing data
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 3. Implement labor cost calculation service
  - Create LaborCostService class with hour calculation logic
  - Implement labor hour calculations based on material types and quantities
  - Add regional rate adjustment functionality
  - Create skill level multiplier calculations
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 4. Create cost estimation engine service
  - Implement CostEstimationService as main orchestration service
  - Add estimate generation from project data and calculations
  - Implement markup and overhead calculation logic
  - Create cost totals calculation with proper rounding
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 5. Implement supplier integration service
  - Create SupplierIntegrationService with API integration framework
  - Add pricing update functionality with caching
  - Implement fallback mechanisms for supplier API failures
  - Create supplier comparison logic for material alternatives
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. Create cost scenario management
  - Implement scenario creation and comparison logic
  - Add scenario difference calculations
  - Create scenario storage and retrieval functionality
  - Implement side-by-side scenario comparison data structures
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 7. Implement cost tracking and variance analysis
  - Create ActualCostTracking functionality
  - Add variance calculation between estimated and actual costs
  - Implement historical accuracy reporting
  - Create cost improvement suggestion logic based on variance data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 8. Create cost estimation UI components
  - Implement CostEstimationPanel main interface component
  - Create MaterialListEditor for manual material adjustments
  - Add LaborCostEditor for labor rate and hour modifications
  - Implement MarkupSettingsPanel for markup and overhead configuration
  - _Requirements: 1.5, 2.5, 3.4, 3.5_

- [ ] 9. Implement cost scenario comparison UI
  - Create CostScenarioComparison component for side-by-side comparisons
  - Add scenario creation dialog and form
  - Implement cost difference highlighting and visualization
  - Create scenario selection and management interface
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ] 10. Create cost report generation system
  - Extend PDF export service with cost estimate report templates
  - Implement detailed cost breakdown report generation
  - Add client-facing summary report without markup details
  - Create cost estimate history and version control
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 11. Integrate cost estimation with existing project workflow
  - Add cost estimation to project data structure
  - Integrate with existing NEC calculations service
  - Connect with wire sizing service for material requirements
  - Update project service to handle cost estimate persistence
  - _Requirements: 1.1, 1.2, 2.1, 4.5_

- [ ] 12. Implement cost estimation validation and error handling
  - Add input validation for all cost calculation functions
  - Implement comprehensive error handling with user-friendly messages
  - Create cost calculation boundary checks and overflow protection
  - Add validation for markup percentages and cost reasonableness
  - _Requirements: 3.1, 3.2, 7.3_

- [ ] 13. Create cost estimation unit tests
  - Write unit tests for MaterialCostService calculations
  - Add unit tests for LaborCostService hour and rate calculations
  - Create tests for markup and overhead application logic
  - Implement tests for scenario comparison calculations
  - _Requirements: 1.1, 2.1, 3.1, 5.1_

- [ ] 14. Add cost estimation integration tests
  - Create integration tests between cost estimation and NEC calculations
  - Add tests for cost estimation with wire sizing service
  - Implement tests for project data integration and persistence
  - Create tests for supplier integration with mock APIs
  - _Requirements: 1.1, 2.1, 7.1_

- [ ] 15. Implement cost estimation accessibility features
  - Add keyboard navigation support to all cost estimation interfaces
  - Implement screen reader support for cost calculations and tables
  - Create high contrast mode support for cost comparison displays
  - Add ARIA labels and descriptions for complex cost data
  - _Requirements: 4.2, 5.2_

- [ ] 16. Create cost estimation documentation and help system
  - Add inline help tooltips for cost calculation explanations
  - Create user guide documentation for cost estimation workflow
  - Implement contextual help for markup and labor rate settings
  - Add examples and best practices for cost estimation accuracy
  - _Requirements: 2.2, 3.1, 6.4_