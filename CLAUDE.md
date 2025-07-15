# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional electrical load calculator application built with React and TypeScript that performs NEC (National Electrical Code) compliant load calculations for residential and commercial electrical services. The application includes three main features: Load Calculator, Single Line Diagram (SLD) creation, and Aerial View & Site Analysis.

**Latest Update**: Successfully resolved Vercel deployment issues and implemented production-ready SLD features with WorkingIntelligentSLDCanvas. Google API integration is now fully functional with real geocoding and places autocomplete. The application includes comprehensive drag-and-drop functionality, rubberband selection, and wire routing with NEC compliance. All features work reliably in both development and production environments.

## Architecture

### Modern React Application Structure
- **Framework**: React 18 with TypeScript, Vite for building
- **UI Library**: Tailwind CSS for styling, Lucide React for icons
- **State Management**: Multiple specialized contexts using React Context API with useReducer
- **Performance**: React.memo, useMemo optimization, lazy loading for advanced features
- **Testing**: Vitest for unit testing electrical calculations
- **Deployment**: Vercel-optimized with selective component exclusion via .vercelignore

### Three-Module Architecture
The application consists of three main modules accessible via tabbed interface:

1. **Load Calculator** - Core electrical load calculations (always loaded)
2. **Single Line Diagram (SLD)** - Electrical diagram creation (lazy loaded)
3. **Aerial View** - Satellite imagery and site analysis (lazy loaded)

### Context Architecture
```
UnifiedAppProvider
├── ProjectSettingsProvider    # Project configuration
├── LoadDataProvider          # Load data management  
├── CalculationProvider       # NEC calculations
├── SLDDataProvider          # Single line diagram state
└── AerialViewProvider       # Aerial view state
```

### Key Directory Structure
```
src/
├── components/
│   ├── LoadCalculator/         # Core load calculation UI
│   ├── SLD/                   # Single line diagram components
│   │   ├── WorkingIntelligentSLDCanvas.tsx  # Production SLD with full features
│   │   ├── wireRoutingEngine.ts            # Professional wire routing
│   │   ├── DynamicWireRenderer.tsx         # Wire visualization
│   │   ├── CanvasTools.tsx                 # Professional editing tools
│   │   └── [Enhanced components for development]
│   ├── AerialView/            # Aerial view components
│   │   ├── SimpleAerialViewMain.tsx # Main aerial interface (Vercel-compatible)
│   │   └── [Complex aerial components excluded via .vercelignore]
│   ├── TabbedInterface/       # Main tabbed navigation
│   ├── ErrorBoundary/         # Error boundaries for feature isolation
│   ├── ProjectManager/        # Project management and templates
│   └── UI/                    # Shared UI components
├── context/                   # Specialized context providers
│   ├── UnifiedAppContext.tsx  # Main context hierarchy
│   ├── LoadDataContext.tsx    # Load data management
│   ├── SLDDataContext.tsx     # SLD state with drag-drop support
│   └── AerialViewContext.tsx  # Aerial view state
├── services/                  # Business logic
│   ├── necCalculations.ts     # NEC load calculations
│   ├── wireRoutingEngine.ts   # Wire routing and collision detection
│   ├── realTimeNECValidator.ts # Real-time NEC compliance
│   ├── projectService.ts      # Project management with templates
│   └── [Secure API services for external integrations]
└── types/                     # TypeScript definitions
```

### Vercel Deployment Strategy

The application uses a selective exclusion strategy via `.vercelignore` to ensure reliable deployments:

- **Included**: Core load calculator, WorkingIntelligentSLDCanvas.tsx, SimpleAerialViewMain.tsx, essential services
- **Excluded**: Only truly problematic components (ExpandedIEEESymbols, PerformanceMonitor) 
- **Result**: Stable builds with full SLD functionality including drag-drop, wire routing, and NEC validation

### Key Architecture Decisions

#### 1. **Lazy Loading with Error Boundaries**
- SLD and Aerial View components are lazy loaded
- Each feature has its own error boundary
- Features can fail independently without affecting core functionality
- Graceful fallback UI for missing dependencies

#### 2. **Production-Ready Component Strategy**
- **Working Components**: Production-ready with full features (e.g., WorkingIntelligentSLDCanvas.tsx)
- **Enhanced Components**: Development-only advanced features for testing
- **Strategy**: Use working components in production with selective .vercelignore exclusions

#### 3. **Context Separation**
- Each major feature has its own context provider
- Contexts are specialized rather than monolithic
- Clear data flow and dependency management
- Easy to add/remove features without affecting others

#### 4. **Error Handling Strategy**
- Dependency-free error boundaries
- No external service dependencies in critical error handling
- Production-safe error reporting
- Development-only detailed error information

## Commands

### Development
```bash
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test         # Run unit tests (Vitest)
npm run test:ui      # Run tests with UI
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run typecheck    # Check TypeScript types
```

### Docker Commands
```bash
# Production Deployment
npm run docker:build           # Build production Docker image
npm run docker:run            # Run production container
npm run docker:compose:prod   # Deploy with docker-compose

# Development
npm run docker:build:dev      # Build development Docker image
npm run docker:run:dev        # Run development container with hot reload
npm run docker:compose:dev    # Start development environment

# Management
npm run docker:compose:down   # Stop all containers
npm run docker:clean          # Clean up unused containers/volumes
npm run docker:logs           # View container logs
```

## Core Features

### Module 1: Load Calculator
- **General Loads**: Lighting, receptacles, appliances with NEC demand factors
- **HVAC Loads**: Air conditioning, heating, motors with proper sizing
- **EVSE Loads**: Electric vehicle charging with EMS support (NEC 625/750)
- **Solar/Battery**: Renewable energy with 120% rule compliance (NEC 705)
- **Calculation Methods**: NEC 220.83 Optional, 220.42 Standard, 220.87 Existing Dwelling
- **Advanced Features**: SimpleSwitch load management, wire sizing, voltage drop analysis
- **Reports**: Professional PDF generation for permit submission

### Module 2: Single Line Diagram (SLD)
- **Drag & Drop**: Full drag-and-drop functionality with boundary constraints and grid snap
- **Rubberband Selection**: Multi-component selection with visual feedback
- **Component Library**: Professional electrical symbols (panels, breakers, inverters, EVSE, meters)
- **Auto-Generation**: Creates diagrams automatically from load calculator data with proper positioning
- **Wire Routing**: Intelligent wire routing with collision detection and NEC compliance
- **Real-time Validation**: Continuous NEC compliance checking with violation highlighting
- **Professional Tools**: Pan, zoom, grid, measurement tools with keyboard shortcuts
- **Editable Properties**: All components have editable characteristics (amps, name, model, etc.)
- **Export Capability**: PNG export for electrical documentation and permit submission

### Module 3: Aerial View & Site Analysis
- **Address Search**: Google Maps integration with geocoding
- **Satellite Imagery**: High-resolution aerial photography
- **Measurement Tools**: Linear distance and area calculations
- **Street Views**: Multiple angle property photography
- **Interactive Analysis**: Click-to-measure overlay system
- **Export Capability**: Download images for project documentation

## Development Guidelines

### Adding New Features to Existing Modules

#### Load Calculator Extensions
1. Update types in `src/types/load.ts`
2. Add templates in `src/constants/loadTemplates.ts`
3. Create table component in `src/components/LoadCalculator/LoadTables/`
4. Update `LoadDataContext.tsx` reducer actions
5. Add validation in `src/services/validationService.ts`

#### SLD Component Extensions
1. Add component templates to `WorkingIntelligentSLDCanvas.tsx` or component library
2. Update `SLDDataContext.tsx` for new component types and drag-drop support
3. Extend wire routing in `wireRoutingEngine.ts` for new connection types
4. Add NEC validation rules in `realTimeNECValidator.ts` for new components
5. Maintain consistent styling and editable properties for all components

#### Aerial View Extensions
1. Add new measurement types to `AerialViewContext.tsx`
2. Extend measurement tools in `SimpleAerialViewMain.tsx`
3. Update coordinate system for new geographic features

### Critical Development Practices

#### Context Usage Patterns
- Use specific context hooks (e.g., `useLoadData()`) instead of legacy compatibility hooks
- Update context state through provided actions, not direct state mutation
- Maintain context hierarchy defined in `UnifiedAppContext.tsx`

#### Vercel Compatibility
- Test complex components locally before deployment
- Add problematic components to `.vercelignore` if they cause build issues
- Use simple, dependency-minimal components for production builds
- Ensure error boundaries don't import services with missing dependencies

#### Feature Development Strategy
1. **Development**: Create working components with full production features
2. **Production**: Use same working components with selective .vercelignore exclusions
3. **Testing**: Test both locally and in Vercel environment for compatibility
4. **Deployment**: Only exclude truly problematic files, keep essential dependencies included

## Electrical Domain Knowledge

### NEC Code Compliance
The application implements current electrical code requirements:
- **Article 220**: Load calculations and demand factors
- **Article 625**: Electric vehicle charging equipment  
- **Article 705**: Solar PV and energy storage interconnection
- **Article 750**: Energy management systems
- **Table 310.15(B)(16)**: Conductor ampacities and derating

### Critical Safety Considerations
- **125% Continuous Load Factor**: Applied to EVSE and other continuous loads
- **80% Service Capacity Rule**: Prevents service overload
- **120% Solar Interconnection Rule**: Prevents backfeed violations
- **Motor Load Calculations**: 125% factor for largest motor
- **Grounding Requirements**: Proper conductor sizing

### Professional Use Notes
- Generated PDF reports suitable for electrical permit submission
- Calculations reviewed by licensed electrical professionals
- Complies with local AHJ (Authority Having Jurisdiction) requirements
- Includes NEC code references for inspector verification

## Key Implementation Details

### Module Integration Architecture
The three modules share data through the unified context system:

- **Load Calculator → SLD**: Auto-generates electrical diagrams from load data
- **Load Calculator → Aerial View**: Uses project address for site analysis
- **SLD ← → Aerial View**: Both can export images for comprehensive project documentation

### State Management Pattern
```
UnifiedAppProvider provides:
├── Project settings (address, main breaker, etc.)
├── Load data (general, HVAC, EVSE, solar/battery)
├── Calculated results (NEC compliance, wire sizing)
├── SLD diagram state (components, connections)
└── Aerial view state (coordinates, measurements)
```

### Component Lazy Loading Strategy
```typescript
// TabbedInterface.tsx pattern for production-ready features
const WorkingFeature = lazy(() => 
  import('../Feature/WorkingFeatureName').then(module => ({ 
    default: module.WorkingFeatureName 
  }))
);

// Current production components:
const WorkingIntelligentSLDCanvas = lazy(() => 
  import('../SLD/WorkingIntelligentSLDCanvas').then(module => ({ 
    default: module.WorkingIntelligentSLDCanvas 
  }))
);
```

### Error Boundary Implementation
- Feature-level isolation: Each tab has its own error boundary
- Dependency-free error handling: No external service imports in error components
- Graceful degradation: Features fail independently without affecting core functionality

### Vercel Deployment Considerations
- Build-critical dependencies in `dependencies` not `devDependencies`
- Only truly problematic components excluded via `.vercelignore` patterns
- Working components (Working*.tsx) provide full features in production
- Environment-aware feature enablement for development vs production
- Successful builds with 44.79 kB gzipped for WorkingIntelligentSLDCanvas

## SLD Implementation Architecture

### WorkingIntelligentSLDCanvas.tsx (Production Component)
The primary SLD component that includes all production-ready features:
- **Drag & Drop System**: Mouse event handling with boundary constraints and grid snap
- **Rubberband Selection**: Multi-select with Ctrl/Cmd key support and visual feedback  
- **Component Generation**: Auto-creates diagrams from load calculator data with professional positioning
- **Wire Routing**: Uses `wireRoutingEngine.ts` for collision detection and optimal routing
- **NEC Validation**: Real-time compliance checking with `realTimeNECValidator.ts`
- **Professional Tools**: Pan, zoom, grid toggle, and measurement capabilities

### Wire Routing System
- **wireRoutingEngine.ts**: Core routing logic with Manhattan and A* pathfinding
- **DynamicWireRenderer.tsx**: SVG-based wire visualization with collision highlighting
- **Collision Detection**: Line-rectangle intersection with component avoidance zones
- **Wire Styling**: Professional wire types (power, control, DC, ground) with voltage-based styling
- **NEC Compliance**: Wire sizing validation and continuous load factors

### Real-time NEC Validation
- **Validation Rules**: Service disconnect location, grounding requirements, breaker ratings
- **EVSE Compliance**: 125% continuous load factor validation (NEC 625.17)
- **Solar Integration**: 120% interconnection rule checking (NEC 705.12)
- **Component Validation**: Standard ampere ratings and proper specifications
- **Performance**: Debounced validation with caching for real-time feedback

### Project Management System
- **projectService.ts**: Comprehensive project CRUD with templates and persistence
- **Template System**: Built-in templates for residential, commercial, solar, and EVSE projects
- **Logo Management**: Company logo upload, positioning, and caching system
- **Photo Caching**: Persistent storage for project images and documentation

### Canvas Architecture Patterns
- **Tool System**: Extensible tool architecture with select, pan, zoom, measure tools
- **Event Handling**: Proper mouse event capture with prevent default and stop propagation
- **State Management**: Centralized drag state and rubberband selection state
- **Performance**: React.memo, useMemo, and useCallback for optimization
- **Error Boundaries**: Feature-level isolation with graceful degradation

### Development vs Production Strategy
- **Single Codebase**: Working components used in both development and production
- **Selective Exclusion**: .vercelignore only excludes truly problematic files
- **Feature Flags**: Environment-aware enabling of advanced features
- **Build Optimization**: Vite bundling with proper code splitting and tree shaking

## Google API Integration

### Current Status
- ✅ **Google Geocoding API**: Fully functional for address-to-coordinates conversion
- ✅ **Google Places API**: Working for real-time address autocomplete suggestions  
- ✅ **Backend Proxy Security**: All API keys stored server-side only via `/api/*` endpoints
- ✅ **Error Handling**: Graceful fallback to mock data when APIs unavailable
- ✅ **Production Ready**: Successfully tested and deployed

### API Test Command
```bash
npm run test:api  # Tests all API endpoints including Google services
```

### Required Environment Variables
```bash
# .env file (server-side only, not committed to git)
GOOGLE_MAPS_API_KEY=your_actual_google_api_key
OPENWEATHER_API_KEY=your_openweather_api_key_here  # Optional for weather data
```

### Google Cloud Console Setup Required
1. **Enable APIs**: Maps JavaScript API, Places API (New), Geocoding API, Maps Static API
2. **API Key Restrictions**: Set HTTP referrers to your domains (localhost, Vercel URLs)
3. **Billing**: Required for production usage
4. **Usage Monitoring**: Set up alerts for quota limits

### User Experience
- **AddressAutocomplete**: Shows real Google Places suggestions instead of mock data
- **AerialView**: Displays green status "Secure backend configured and ready"
- **Error States**: Clear fallback messaging when APIs temporarily unavailable
- **Performance**: Fast autocomplete with proper debouncing and caching

### Rules
- Make edits to existing code and only create essentially duplicate files if absolutely needed
- No mock data, simulated values, or hardcoded data
- Always use WorkingIntelligentSLDCanvas for SLD features - it includes all production-ready functionality
- When adding SLD features, extend the existing working component rather than creating new ones
- Test all changes locally with `npm run build` before deployment to ensure Vercel compatibility
- Never commit API keys to git - they are properly excluded via .gitignore 