# Testing Strategy & Guidelines

This document provides comprehensive testing guidelines for the Load Calculator application, ensuring code quality, reliability, and maintainability across all modules.

## 🎯 Testing Philosophy

Our testing strategy follows the **Testing Pyramid** approach:
- **Unit Tests (70%)**: Fast, isolated tests for individual functions and components
- **Integration Tests (20%)**: Cross-module interactions and data flow validation  
- **E2E Tests (10%)**: Complete user workflows and critical business paths

## 📊 Current Test Coverage

The application includes **500+ test scenarios** across multiple test types:

- **Unit Tests**: 18 test files (~420 scenarios)
- **E2E Tests**: 7 test files (81 scenarios) 
- **Integration Tests**: Cross-module data flow validation
- **Performance Tests**: Load testing and benchmarking
- **API Tests**: Comprehensive endpoint validation

## 🧪 Test Categories

### 1. Unit Tests (`src/tests/`)

#### Core Services Tests
- **`necCalculations.test.ts`**: NEC load calculations with all three methods
- **`wireCalculations.test.ts`**: Wire sizing, ampacity, and voltage drop
- **`validationService.test.ts`**: Input validation and NEC compliance
- **`photoEditorService.test.ts`**: Canvas-based measurement calculations

#### Context Provider Tests  
- **`contextProviders.test.tsx`**: React context state management
- Tests for LoadDataContext, ProjectSettingsContext, PhotoEditorContext, AerialViewContext

#### API Service Tests
- **`apiServices.test.ts`**: External API integrations with error handling
- **`vercelEndpoints.test.ts`**: Serverless function validation

### 2. Integration Tests (`src/tests/integration/`)

#### Cross-Module Data Flow
- **`crossModuleDataFlow.test.tsx`**: End-to-end data propagation
- Load Calculator → Calculations → PDF Export
- Project Settings → Aerial View → Address Sync
- Authentication → All Modules → Protected Routes

### 3. Component Tests (`src/tests/components/`)

#### Photo Editor Components
- **`photoEditorComponents.test.tsx`**: Canvas tools and measurement UI
- Tests for PhotoEditor, EditorToolbar, MeasurementCanvas, CalibrationTool

### 4. Performance Tests (`src/tests/performance/`)

#### Load Testing & Benchmarks
- **`performanceTests.test.ts`**: Large dataset handling
- Memory usage validation
- Concurrent operation testing
- Performance regression detection

### 5. E2E Tests (`cypress/e2e/`)

#### Complete User Workflows
- **Load Calculator**: All calculation methods and PDF generation
- **Wire Sizing**: Ampacity tables and voltage drop calculations
- **Aerial View**: Satellite imagery and measurement tools
- **Project Manager**: CRUD operations and templates
- **Authentication**: OAuth flows and session management
- **UI Navigation**: Tabbed interface and accessibility
- **Accessibility**: WCAG compliance and screen reader support

## 🔧 Testing Tools & Configuration

### Core Testing Stack
- **Vitest**: Unit and integration testing framework
- **Cypress**: E2E testing with real browser automation
- **Testing Library**: React component testing utilities
- **MSW (Mock Service Worker)**: API mocking for tests

### Configuration Files
- **`vitest.config.ts`**: Unit test configuration
- **`cypress.config.js`**: E2E test configuration  
- **`src/tests/setup.ts`**: Global test setup and mocks

### Mock Strategy
```typescript
// API Services
vi.mock('../../services/secureApiService', () => ({
  secureApiService: {
    geocodeAddress: vi.fn().mockResolvedValue({ lat: 34.0522, lng: -118.2437 })
  }
}));

// Canvas API
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext
});

// ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn()
}));
```

## 🚀 Running Tests

### Quick Commands
```bash
# Run all tests
npm test

# Unit tests with coverage
npm run test:coverage

# Specific test categories
npm run test:unit              # Services and contexts
npm run test:integration       # Cross-module tests  
npm run test:performance      # Performance benchmarks
npm run test:api              # API endpoint tests
npm run test:components       # React component tests

# E2E tests
npm run test:e2e              # All E2E scenarios
npm run cypress:open          # Interactive test runner

# Complete validation
npm run test:all              # All test categories
npm run validate              # Lint + TypeScript + Tests + Build
```

### Fork Validation
```bash
# Complete fork validation
npm run fork-validation

# Quick validation (skip performance/E2E)
npm run fork-validation:quick

# Generate detailed reports
npm run fork-validation:report
```

### CI/CD Integration
The project includes comprehensive GitHub Actions workflows:
- **Code Quality**: ESLint, TypeScript, security scanning
- **Unit Tests**: Coverage reporting with PR comments  
- **Build Tests**: Production build and Vercel compatibility
- **E2E Tests**: Full user workflow validation
- **Performance Tests**: Regression detection
- **Security Scan**: Vulnerability assessment

## 📝 Writing Tests

### Unit Test Patterns

#### Service Layer Testing
```typescript
describe('NEC Calculations', () => {
  it('should calculate optional method correctly', () => {
    const loadState = createTestLoadState();
    const result = calculateLoadDemand(loadState, 'optional', 2524, 200);
    
    expect(result.totalAmps).toBeGreaterThan(0);
    expect(result.spareCapacity).toBeLessThan(100);
    expect(result.errors).toHaveLength(0);
  });
});
```

#### Context Testing
```typescript
describe('LoadDataContext', () => {
  it('should add loads correctly', () => {
    render(
      <LoadDataProvider>
        <TestComponent />
      </LoadDataProvider>
    );
    
    act(() => {
      fireEvent.click(screen.getByTestId('add-load'));
    });
    
    expect(screen.getByTestId('load-count')).toHaveTextContent('1');
  });
});
```

#### API Testing
```typescript
describe('Geocoding API', () => {
  it('should handle invalid addresses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ZERO_RESULTS' })
    });

    await expect(secureApiService.geocodeAddress('invalid'))
      .rejects.toThrow('No results found');
  });
});
```

### Integration Test Patterns

#### Cross-Module Data Flow
```typescript
describe('Cross-Module Integration', () => {
  it('should propagate address changes to aerial view', async () => {
    render(
      <UnifiedAppProvider>
        <IntegratedTestComponent />
      </UnifiedAppProvider>
    );

    // Update project address
    act(() => {
      fireEvent.click(screen.getByTestId('update-address'));
    });

    // Sync to aerial view
    act(() => {
      fireEvent.click(screen.getByTestId('sync-address'));
    });

    expect(screen.getByTestId('aerial-address'))
      .toHaveTextContent('123 Test St');
  });
});
```

### Performance Test Patterns

#### Load Testing
```typescript
describe('Performance Tests', () => {
  it('should handle large datasets efficiently', async () => {
    const largeLoadState = generateLargeLoadState(1000);
    
    const { duration } = await measureExecutionTime(() =>
      calculateLoadDemand(largeLoadState, 'optional', 2500, 200)
    );

    expect(duration).toBeLessThan(500); // 500ms threshold
  });
});
```

### E2E Test Patterns

#### User Workflow Testing
```typescript
describe('Load Calculator E2E', () => {
  it('should complete full load calculation workflow', () => {
    cy.visit('/');
    
    // Project setup
    cy.get('[data-testid="address-input"]')
      .type('123 Main St, Los Angeles, CA');
    cy.get('[data-testid="square-footage"]').clear().type('2500');
    
    // Add loads
    cy.get('[data-testid="general-loads-tab"]').click();
    cy.get('[data-testid="add-load-button"]').click();
    
    // Verify calculations
    cy.get('[data-testid="total-amps"]')
      .should('contain.text', 'A')
      .and('not.contain.text', '0');
    
    // Export PDF
    cy.get('[data-testid="export-pdf"]').click();
    cy.get('[data-testid="pdf-success"]').should('be.visible');
  });
});
```

## 🎯 Test Coverage Goals

### Minimum Coverage Thresholds
- **Statements**: 80%
- **Branches**: 70%  
- **Functions**: 85%
- **Lines**: 80%

### Critical Path Coverage (100%)
- NEC load calculations (all three methods)
- Project settings validation
- PDF export functionality
- Authentication flows
- API error handling

### Feature-Specific Coverage
- **Load Calculator**: 95%+ (core business logic)
- **Wire Sizing**: 90%+ (safety-critical calculations)
- **Photo Editor**: 80%+ (UI-heavy, complex interactions)
- **API Services**: 85%+ (external dependencies)

## 🔍 Test Data & Fixtures

### Test Data Patterns
```typescript
// Standard test project
const createTestProject = (): ProjectSettings => ({
  address: '123 Test St, Los Angeles, CA 90210',
  squareFootage: 2500,
  calculationMethod: 'optional',
  mainBreakerAmps: 200
});

// Large dataset generation
const generateLargeLoadState = (numLoads: number): LoadState => ({
  generalLoads: Array.from({ length: numLoads }, (_, i) => ({
    id: i + 1,
    name: `Load ${i + 1}`,
    watts: 1000 + (i * 100),
    quantity: 1,
    total: 1000 + (i * 100)
  }))
});
```

### Fixture Files
- **`cypress/fixtures/test-project.json`**: Standard project data
- **`src/tests/fixtures/`**: Reusable test data sets

## 🛠️ Debugging Tests

### Test Debugging Tools
```typescript
// Debug specific tests
npm run test:ui                    # Vitest UI for interactive debugging
npm run cypress:open              # Cypress UI for E2E debugging

// Verbose test output
npm run test -- --verbose
npm run test -- --reporter=verbose

// Run specific test files
npm run test -- necCalculations.test.ts
npm run test -- --grep "should calculate"
```

### Common Debugging Patterns
```typescript
// Debug async operations
await waitFor(() => {
  expect(screen.getByTestId('result')).toBeInTheDocument();
});

// Debug component state
screen.debug(); // Print current DOM
console.log(screen.getByTestId('data').textContent);

// Debug test timing
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
```

## 🔧 Maintenance Guidelines

### Regular Maintenance Tasks

#### Weekly
- [ ] Review test coverage reports
- [ ] Update test data for new features
- [ ] Check for flaky tests in CI

#### Monthly  
- [ ] Performance benchmark reviews
- [ ] Test dependency updates
- [ ] E2E test environment validation

#### Quarterly
- [ ] Comprehensive test strategy review
- [ ] Test suite performance optimization
- [ ] Coverage threshold adjustments

### Adding New Features

#### Test Requirements for New Features
1. **Unit Tests**: Core functionality with edge cases
2. **Integration Tests**: Cross-module interactions
3. **E2E Tests**: Complete user workflows (if user-facing)
4. **Performance Tests**: If feature affects performance
5. **API Tests**: If feature includes new endpoints

#### Test Checklist for PRs
- [ ] Tests written for new functionality
- [ ] Coverage thresholds maintained
- [ ] Tests pass in CI/CD pipeline
- [ ] E2E tests updated for UI changes
- [ ] Performance impact assessed

### Handling Test Failures

#### Investigation Process
1. **Reproduce Locally**: Run failing test locally
2. **Check Dependencies**: Verify mock configurations
3. **Review Changes**: Check recent code changes
4. **Environment Issues**: Validate test environment setup
5. **Flaky Tests**: Add retry logic or improve reliability

#### Common Failure Patterns
```typescript
// Async timing issues
await waitFor(() => expect(element).toBeInTheDocument());

// Mock cleanup
afterEach(() => {
  vi.clearAllMocks();
  cleanup();
});

// State isolation
beforeEach(() => {
  // Reset global state
});
```

## 📈 Performance Monitoring

### Performance Test Benchmarks
- **Small datasets (50 items)**: < 50ms
- **Medium datasets (200 items)**: < 200ms  
- **Large datasets (1000 items)**: < 500ms
- **Memory usage**: < 10MB increase per 100 operations

### Performance Regression Detection
```typescript
describe('Performance Benchmarks', () => {
  it('should meet calculation benchmarks', async () => {
    const benchmarkSizes = [10, 50, 100, 250, 500];
    
    for (const size of benchmarkSizes) {
      const { duration } = await measureExecutionTime(/* test */);
      const maxAcceptable = size * 0.5; // 0.5ms per item
      expect(duration).toBeLessThan(maxAcceptable);
    }
  });
});
```

## 🔒 Security Testing

### Security Test Patterns
```typescript
describe('Security Validation', () => {
  it('should prevent SQL injection in inputs', () => {
    const maliciousInput = "'; DROP TABLE users; --";
    expect(() => validateInput(maliciousInput)).toThrow();
  });
  
  it('should sanitize API responses', () => {
    const response = sanitizeApiResponse(rawResponse);
    expect(response).not.toContain('<script>');
  });
});
```

### Secret Detection
- Pre-commit hooks scan for API keys
- Automated security scanning in CI/CD
- Regular dependency vulnerability audits

## 📚 Resources & References

### Testing Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library Guidelines](https://testing-library.com/docs/guiding-principles)

### Internal Resources
- **`CLAUDE.md`**: Project architecture and development guidelines
- **`src/tests/setup.ts`**: Global test configuration
- **`.github/workflows/`**: CI/CD pipeline configuration

### Team Guidelines
- All PRs require passing tests
- Critical features require 90%+ test coverage
- Performance tests must pass benchmarks
- Security scans must show no high-severity issues

---

## 🎉 Quick Start for New Contributors

1. **Setup Environment**:
   ```bash
   npm install
   npm run test  # Verify tests work
   ```

2. **Run Full Validation**:
   ```bash
   npm run fork-validation:quick
   ```

3. **Write Your First Test**:
   - Copy existing test patterns
   - Follow naming conventions
   - Include edge cases
   - Verify coverage increases

4. **Submit PR**:
   - All tests must pass
   - Coverage maintained
   - Include test updates for new features

This comprehensive testing strategy ensures the Load Calculator application maintains high quality, reliability, and performance while enabling confident development and safe refactoring.