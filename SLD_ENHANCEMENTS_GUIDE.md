# Enhanced Single Line Diagram (SLD) Features Guide

## Overview

The Single Line Diagram feature has been significantly enhanced with professional-grade electrical engineering capabilities, collaboration features, and comprehensive analysis tools. This guide covers all new features and how to use them effectively.

## 🚀 New Features Summary

### Phase 1: Enhanced User Experience & Performance
- ✅ **Command Pattern System**: Undo/Redo with 50-step history
- ✅ **Real-time Collaboration**: Multi-user editing with conflict resolution
- ✅ **Performance Optimizations**: Virtual rendering and level-of-detail adjustments

### Phase 2: Advanced Electrical Engineering
- ✅ **Wire Sizing Service**: NEC-compliant conductor and conduit sizing
- ✅ **NEC Compliance Engine**: Validation against 6 major NEC articles
- ✅ **Load Flow Analysis**: Circuit efficiency and voltage drop calculations

### Phase 3: Professional Documentation
- ✅ **Multi-format Export**: PDF, SVG, PNG, DXF, JSON with professional templates
- ✅ **Permit Packages**: Complete documentation packages for AHJ submission

### Phase 4: Integration & UI
- ✅ **Unified Interface**: Integrated tabbed interface with all features
- ✅ **Comprehensive Analysis**: One-click analysis of all aspects

## 📋 Quick Start Guide

### 1. Basic Usage

```typescript
import { sldIntegrationService } from './services/sldIntegrationService';
import { useSLD } from './context/SLDContext';

// Initialize with a diagram
const diagram = {
  id: 'my-diagram',
  name: 'Solar PV System',
  systemType: 'grid_tied',
  // ... other properties
};

sldIntegrationService.initialize(diagram);

// Use in React component
const { state, addComponent, executeCommand } = useSLD();
```

### 2. Command Management

```typescript
// Undo/Redo operations
const { undo, redo, canUndo, canRedo } = useSLD();

// Keyboard shortcuts
// Ctrl+Z: Undo
// Ctrl+Y: Redo
// Ctrl+E: Export

// Execute custom commands
const command = new AddComponentCommand(diagram, component, updateCallback);
executeCommand(command);
```

### 3. Collaboration

```typescript
// Start collaboration session
const user = {
  id: 'user_123',
  name: 'John Doe',
  email: 'john@example.com',
  color: '#3b82f6',
  isOnline: true,
  lastActivity: new Date()
};

const session = sldIntegrationService.startCollaboration(diagram, user);

// Join existing session
const session = sldIntegrationService.joinCollaboration(sessionId, user);
```

## 🔌 Electrical Engineering Features

### Wire Sizing Analysis

```typescript
import { SLDWireService } from './services/sldWireService';

// Calculate wire sizing for a connection
const wireCalculation = SLDWireService.calculateWireSizing(
  connection,
  50, // distance in feet
  '75C', // temperature rating
  'EMT', // conduit type
  30 // ambient temperature
);

console.log(wireCalculation);
// Output:
// {
//   conductorSize: '10',
//   conduitSize: '3/4"',
//   voltageDrop: 2.1,
//   voltageDropPercent: 0.88,
//   ampacity: 35,
//   necCompliance: true,
//   recommendations: [...]
// }
```

### NEC Compliance Validation

```typescript
import { SLDNECEngine } from './services/sldNECEngine';

// Validate entire diagram
const compliance = SLDNECEngine.validateDiagram(diagram);

// Validate specific articles
const article690 = SLDNECEngine.validateArticle690(diagram);
const article705 = SLDNECEngine.validateArticle705(diagram);

// Auto-fix violations
const fixedDiagram = SLDNECEngine.autoFixViolations(diagram);
```

### Load Flow Analysis

```typescript
import { SLDLoadFlowService } from './services/sldLoadFlowService';

// Analyze circuit
const analysis = SLDLoadFlowService.analyzeCircuit(diagram);

console.log(analysis);
// Output:
// {
//   efficiency: 97.5,
//   criticalPaths: [...],
//   circuitPaths: [...],
//   recommendations: [...]
// }

// Optimize layout
const optimizedDiagram = SLDLoadFlowService.optimizeLayout(diagram);
```

## 📄 Export & Documentation

### Multi-format Export

```typescript
import { SLDExportService } from './services/sldExportService';

// Export to different formats
const pdfResult = await SLDExportService.exportToPDF(diagram, {
  template: 'permit',
  includeCalculations: true,
  includeNECCompliance: true,
  paperSize: 'letter',
  orientation: 'landscape'
});

const svgResult = await SLDExportService.exportToSVG(diagram);
const pngResult = await SLDExportService.exportToPNG(diagram);
const dxfResult = await SLDExportService.exportToCAD(diagram);
```

### Permit Package Generation

```typescript
// Generate complete permit package
const permitData = {
  diagram,
  necCompliance,
  loadFlow,
  projectInfo: {
    name: 'Solar PV System',
    systemType: 'grid_tied',
    necCodeYear: '2023',
    designedBy: 'John Doe',
    ahj: 'City of Example'
  },
  calculations: wireAnalysis,
  aerialView: aerialViewData
};

const permitPackage = await SLDExportService.generatePermitPackage(permitData);
```

## 🎯 Comprehensive Analysis

### One-Click Analysis

```typescript
// Perform comprehensive analysis
const analysis = await sldIntegrationService.performComprehensiveAnalysis(diagram);

console.log(analysis);
// Output:
// {
//   diagram,
//   wireAnalysis: [...],
//   necCompliance: {...},
//   loadFlow: {...},
//   recommendations: [...],
//   overallScore: 85
// }
```

### Auto-Optimization

```typescript
// Auto-optimize diagram
const optimizedDiagram = await sldIntegrationService.autoOptimizeDiagram(diagram);

// This applies:
// - NEC auto-fixes
// - Layout optimizations
// - Wire sizing improvements
```

## 🔧 Performance Optimization

### Virtual Rendering

```typescript
// Enable virtual rendering for large diagrams
const { setPerformanceSettings } = useSLD();

setPerformanceSettings({
  virtualRendering: true,
  cullingDistance: 1000,
  levelOfDetail: 'high'
});
```

### Level of Detail Adjustment

```typescript
// Automatically adjust based on diagram size
const { optimizeRendering } = useSLD();

// This will automatically set:
// - virtualRendering: true (if > 50 components)
// - levelOfDetail: 'medium' (if > 100 components)
// - cullingDistance: 800 (if > 200 components)
optimizeRendering();
```

## 🎨 UI Integration

### Tabbed Interface

The enhanced SLD interface includes tabs for:

1. **Single Line Diagram**: Main editing canvas
2. **Aerial View**: Site layout integration
3. **Wire Sizing**: Wire and conduit calculations
4. **NEC Compliance**: Code compliance validation
5. **Load Flow**: Circuit analysis
6. **Export**: Multi-format export options

### Toolbar Features

- **Undo/Redo**: Command history management
- **Grid Controls**: Toggle grid and snap-to-grid
- **Collaboration**: Start/join collaboration sessions
- **Validation Status**: Real-time compliance indicators
- **Settings**: Performance and display options

## 📊 Validation & Quality Assurance

### Real-time Validation

```typescript
// Get validation results
const { state } = useSLD();
const validationResults = state.validation;

// Validation types:
// - error: Critical issues that must be fixed
// - warning: Best practice recommendations
// - info: Informational messages
```

### Project Statistics

```typescript
const stats = sldIntegrationService.getProjectStatistics(diagram);

console.log(stats);
// Output:
// {
//   components: 15,
//   connections: 22,
//   systemType: 'grid_tied',
//   complexity: 'medium',
//   estimatedCost: 2600
// }
```

## 🔒 Security & Best Practices

### Input Validation

All user inputs are validated and sanitized:

```typescript
// Component validation
if (!component.name || component.name.trim() === '') {
  throw new Error('Component must have a name');
}

// Connection validation
if (!fromComponent || !toComponent) {
  throw new Error('Connection references non-existent component');
}
```

### Error Handling

```typescript
try {
  const result = await sldIntegrationService.performComprehensiveAnalysis(diagram);
  // Handle success
} catch (error) {
  console.error('Analysis failed:', error.message);
  // Handle error gracefully
}
```

## 🚀 Advanced Usage

### Custom NEC Rules

```typescript
// Add custom NEC validation rule
const customRule = {
  id: 'custom.rule.1',
  article: '690',
  section: 'Custom Section',
  description: 'Custom validation rule',
  severity: 'error',
  priority: 1,
  validator: (diagram) => {
    // Custom validation logic
    return validationResult;
  },
  autoFix: (diagram) => {
    // Custom auto-fix logic
    return fixedDiagram;
  }
};

SLDNECEngine.addRule(customRule);
```

### Custom Export Templates

```typescript
// Create custom export template
const customTemplate = {
  name: 'custom_template',
  description: 'Custom export template',
  sections: [
    'header',
    'diagram',
    'calculations',
    'compliance',
    'footer'
  ],
  styling: {
    fontFamily: 'Arial',
    fontSize: 12,
    colors: {
      primary: '#2563eb',
      secondary: '#64748b'
    }
  }
};
```

## 📈 Performance Monitoring

### Rendering Performance

```typescript
// Monitor rendering performance
const { state } = useSLD();
const performance = state.performance;

console.log('Performance Settings:', {
  virtualRendering: performance.virtualRendering,
  levelOfDetail: performance.levelOfDetail,
  cullingDistance: performance.cullingDistance,
  renderQueueLength: performance.renderQueue.length
});
```

### Memory Management

```typescript
// Cleanup resources when done
useEffect(() => {
  return () => {
    sldIntegrationService.cleanup();
  };
}, []);
```

## 🔄 Migration Guide

### From Legacy SLD

1. **Update Imports**:
   ```typescript
   // Old
   import { useLoadCalculator } from './hooks/useLoadCalculator';
   
   // New
   import { useSLD } from './context/SLDContext';
   ```

2. **Update Component Usage**:
   ```typescript
   // Old
   const { diagram, updateDiagram } = useLoadCalculator();
   
   // New
   const { state, dispatch, addComponent, moveComponent } = useSLD();
   ```

3. **Enable New Features**:
   ```typescript
   // Initialize integration service
   sldIntegrationService.initialize(diagram);
   
   // Enable collaboration
   const session = sldIntegrationService.startCollaboration(diagram, user);
   ```

## 🎯 Best Practices

### 1. Performance
- Use virtual rendering for diagrams with >50 components
- Enable level-of-detail adjustments for large diagrams
- Clean up resources when components unmount

### 2. Collaboration
- Start collaboration sessions early in the design process
- Use clear user names and colors for identification
- Resolve conflicts promptly

### 3. Validation
- Run NEC compliance checks before finalizing designs
- Address all errors before submitting for permits
- Use auto-fixes when available

### 4. Export
- Use appropriate templates for different purposes
- Include all required sections in permit packages
- Verify export quality before submission

## 🆘 Troubleshooting

### Common Issues

1. **Performance Issues**:
   - Enable virtual rendering
   - Reduce level of detail
   - Increase culling distance

2. **Validation Errors**:
   - Check component names
   - Verify connections
   - Review NEC compliance

3. **Export Failures**:
   - Check diagram validity
   - Verify template compatibility
   - Ensure sufficient memory

### Getting Help

- Check validation messages for specific issues
- Review console logs for error details
- Use the comprehensive analysis for recommendations

## 📚 API Reference

### Core Services

- `SLDIntegrationService`: Main integration service
- `SLDWireService`: Wire sizing calculations
- `SLDNECEngine`: NEC compliance validation
- `SLDLoadFlowService`: Circuit analysis
- `SLDExportService`: Export functionality
- `SLDCollaborationService`: Real-time collaboration

### Context Hooks

- `useSLD()`: Main SLD context hook
- `sldIntegrationService`: Integration service instance

### Types

- `SLDDiagram`: Main diagram type
- `SLDComponent`: Component type
- `SLDConnection`: Connection type
- `WireCalculation`: Wire sizing result
- `NECComplianceReport`: Compliance validation result
- `LoadFlowAnalysis`: Circuit analysis result

---

This guide covers the essential features of the enhanced SLD system. For more detailed information about specific features, refer to the individual service documentation and type definitions. 