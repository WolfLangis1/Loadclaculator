# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a professional electrical load calculator application built with React and TypeScript that performs NEC (National Electrical Code) compliant load calculations for residential and commercial electrical services. The application includes three main features: Load Calculator, Single Line Diagram (SLD) creation, and Aerial View & Site Analysis.

**Latest Update**: Successfully migrated to Vercel serverless functions architecture. Fixed infinite re-rendering address field glitch caused by circular dependencies. All API endpoints now work in production with proper Google Maps integration. Supabase authentication with comprehensive Google OAuth and guest mode support. All SLD features remain production-ready with WorkingIntelligentSLDCanvas including drag-and-drop, wire routing, and NEC compliance.

## Architecture

### Modern React Application Structure
- **Framework**: React 18 with TypeScript, Vite for building
- **UI Library**: Tailwind CSS for styling, Lucide React for icons
- **Authentication**: Supabase with Google OAuth and guest mode support
- **State Management**: Multiple specialized contexts using React Context API with useReducer
- **Performance**: React.memo, useMemo optimization, lazy loading for advanced features
- **Testing**: Vitest for unit testing electrical calculations
- **Development**: Docker fullstack environment with backend proxy OR Vercel serverless functions
- **Deployment**: Vercel serverless functions with proper API routing and Google Maps integration

### Three-Module Architecture
The application consists of three main modules accessible via tabbed interface:

1. **Load Calculator** - Core electrical load calculations (always loaded)
2. **Single Line Diagram (SLD)** - Electrical diagram creation (lazy loaded)
3. **Aerial View** - Satellite imagery and site analysis (lazy loaded)

### Context Architecture
```
AppWithAuth
├── SupabaseAuthProvider      # Authentication state management
└── UnifiedAppProvider
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
│   ├── SupabaseAuthContext.tsx  # Supabase authentication
│   ├── UnifiedAppContext.tsx    # Main context hierarchy
│   ├── LoadDataContext.tsx      # Load data management
│   ├── SLDDataContext.tsx       # SLD state with drag-drop support
│   └── AerialViewContext.tsx    # Aerial view state
├── services/                  # Business logic
│   ├── necCalculations.ts     # NEC load calculations
│   ├── wireRoutingEngine.ts   # Wire routing and collision detection
│   ├── realTimeNECValidator.ts # Real-time NEC compliance
│   ├── projectService.ts      # Project management with templates
│   ├── secureApiService.ts    # Main API client for external services
│   ├── apiClient.ts           # Authenticated API client
│   └── [Additional API services for Google Maps, solar, etc.]
└── types/                     # TypeScript definitions
```

### Vercel Serverless Architecture

The application uses Vercel serverless functions for backend API operations:

- **Frontend**: Static React app deployed to Vercel edge network
- **Backend**: Serverless functions in `/api/*.js` handle Google Maps API calls
- **Security**: API keys stored server-side only, never exposed to client
- **Performance**: Fast serverless function execution with proper caching
- **Result**: Fully functional application with working Google Maps integration

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
npm run test                    # Run unit tests (Vitest)
npm run test:ui                 # Run tests with UI  
npm run test:coverage           # Run tests with coverage report
npm run test:e2e               # Run all Cypress E2E tests
npm run test:e2e:load-calculator # Test load calculator module
npm run test:e2e:sld           # Test SLD module  
npm run test:e2e:project-manager # Test project manager
npm run test:e2e:compliance    # Test compliance module
npm run cypress:open           # Open Cypress test runner
npm run cypress:run            # Run Cypress tests headless
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run typecheck    # Check TypeScript types
```

### API Testing
```bash
npm run test:api     # Test Google Maps API endpoints
npm run test:solar   # Test Solar API integration
```

### Vercel Deployment
```bash
npm run vercel:test  # Test production build locally
npm run vercel:dev   # Run Vercel development server
npm run vercel:build # Build for Vercel deployment
```

### Docker Commands
```bash
# Fullstack Development (Frontend + Backend + API Proxy)
npm run docker:build:fullstack  # Build fullstack Docker image
npm run docker:run:fullstack    # Run fullstack container with both services
docker-compose --profile fullstack up -d  # Start fullstack environment

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

## Authentication Architecture

### Supabase Integration
The application uses Supabase for authentication with a comprehensive fallback system:

- **SupabaseAuthContext.tsx**: Primary authentication provider with immediate fallback user creation
- **Google OAuth**: Configured for seamless sign-in with Google accounts
- **Guest Mode**: Full application access without account creation
- **Immediate Fallback**: Creates user objects instantly without database dependencies for optimal performance

### Authentication Flow
```typescript
// Authentication initialization pattern
const initializeUserData = useCallback(async (supabaseUser: SupabaseUser) => {
  // Always create fallback user immediately - no database dependencies
  const fallbackUser: User = {
    id: supabaseUser.id,
    email: supabaseUser.email || undefined,
    name: supabaseUser.user_metadata?.name || 'User',
    // ... other properties
  };
  
  setDbUser(fallbackUser);
  setUserSettings(fallbackSettings);
  // Background database sync can be added here with timeout protection
}, []);
```

### Protected Routes
- **ProtectedRoute**: Wraps authenticated content with loading states and redirects
- **Error Boundaries**: Authentication failures don't crash the entire application
- **Graceful Degradation**: Guest users get full functionality with local storage persistence

### API Architecture Patterns
The application supports multiple deployment strategies:

**Vercel Serverless (Production)**:
- **Frontend**: Static app deployed to Vercel CDN
- **Backend**: Serverless functions in `/api/*.js` handle external API calls
- **Security**: Environment variables managed in Vercel dashboard

**Docker Development (Local)**:
- **Frontend**: http://localhost:3000 (Vite dev server)  
- **Backend**: http://localhost:3001 (Express server with Google Maps proxy)
- **Development**: Hot reload for both frontend and backend services

## Google API Integration

### Current Status
- ✅ **Google Geocoding API**: Fully functional for address-to-coordinates conversion via `/api/geocode`
- ✅ **Google Places API**: Working for real-time address autocomplete via `/api/places`
- ✅ **Google Solar API**: Integrated solar analysis via `/api/solar` with fallback calculations
- ✅ **Google Street View API**: Multi-angle property photography via `/api/streetview`
- ✅ **Google Static Maps API**: Satellite imagery via `/api/satellite`
- ✅ **Vercel Serverless Functions**: All endpoints deployed as serverless functions
- ✅ **Security**: API keys stored server-side only, never exposed to client
- ✅ **Error Handling**: Graceful fallback when APIs unavailable
- ✅ **Production Ready**: Successfully deployed and tested on Vercel

### API Test Command
```bash
npm run test:api  # Tests all API endpoints including Google services
```

### Required Environment Variables
```bash
# .env file (not committed to git)
# Supabase Authentication
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API (backend only for security)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Optional APIs
OPENWEATHER_API_KEY=your_openweather_api_key_here
USE_REAL_AERIAL_DATA=true
AERIAL_PROVIDER=google
```

### Supabase Setup Required
1. **Create Project**: https://app.supabase.com/new
2. **Authentication**: Enable Google OAuth provider in Auth settings
3. **Database**: Tables for users, user_settings, projects (optional for offline fallback)
4. **API Keys**: Copy project URL and anon key to environment variables
5. **RLS Policies**: Configure Row Level Security for data protection

### Google Cloud Console Setup Required
1. **Enable APIs**: Maps JavaScript API, Places API (New), Geocoding API, Maps Static API
2. **API Key Restrictions**: Set HTTP referrers to your domains (localhost, Vercel URLs)
3. **OAuth Consent**: Configure for Supabase callback URLs
4. **Billing**: Required for production usage
5. **Usage Monitoring**: Set up alerts for quota limits

### User Experience
- **AddressAutocomplete**: Shows real Google Places suggestions instead of mock data
- **AerialView**: Displays green status "Secure backend configured and ready"
- **Error States**: Clear fallback messaging when APIs temporarily unavailable
- **Performance**: Fast autocomplete with proper debouncing and caching

## Common Development Workflows

### Setting Up Development Environment
```bash
# 1. Clone and install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your actual API keys

# 3. Start development server (frontend only)
npm run dev

# 4. Start fullstack environment (frontend + backend proxy)
docker-compose --profile fullstack up -d
```

### Debugging Authentication Issues
```bash
# Check Supabase configuration
console.log('Supabase URL:', import.meta.env.SUPABASE_URL)
console.log('Supabase Key:', import.meta.env.SUPABASE_ANON_KEY?.substring(0, 10) + '...')

# Monitor authentication state in browser console
# Look for: "initializeUserData: Completed successfully - authentication ready"

# Common fixes:
# - Ensure environment variables are properly exposed via vite.config.js
# - Check Google OAuth redirect URLs in Supabase dashboard
# - Verify fallback user creation pattern in SupabaseAuthContext
```

### Adding New Load Calculation Types
```bash
# 1. Update types
# Edit src/types/load.ts

# 2. Add calculation logic
# Edit src/utils/loadCalculations.ts or src/services/necCalculations.ts

# 3. Update validation
# Edit src/services/validationService.ts

# 4. Create UI components
# Add table component in src/components/LoadCalculator/LoadTables/

# 5. Update context
# Edit src/context/LoadDataContext.tsx for state management
```

### Container Rebuilding for Changes
```bash
# Stop current container
docker stop $(docker ps -q) && docker rm $(docker ps -aq)

# Rebuild and start with latest code
source .env && docker build -f Dockerfile.fullstack -t load-calculator-fullstack . && \
docker run -d -p 3000:3000 -p 3001:3001 \
  -e GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY" \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY" \
  --name load-calculator-fullstack load-calculator-fullstack
```

### Critical Development Rules

#### Architecture Rules
- **Vercel Serverless**: All API endpoints must be Vercel serverless functions in `/api/*.js` format
- **Authentication Pattern**: Always use immediate fallback user creation without database dependencies to prevent infinite loading
- **Context Anti-Pattern**: Never create circular dependencies between contexts (e.g., AddressSyncContext infinite loops)
- **API Base URL**: Use `/api` in production, proper environment variable handling for development

#### Component Development Rules  
- **SLD Development**: Always use WorkingIntelligentSLDCanvas for SLD features - it includes all production-ready functionality
- **Address Fields**: Avoid infinite re-rendering by only syncing addresses on place selection, not every keystroke
- **Error Boundaries**: Each major feature should have its own error boundary for graceful degradation
- **Lazy Loading**: Use lazy loading for non-critical modules (SLD, Aerial View) with proper error handling

#### Deployment Rules
- **Calculation Safety**: Wrap `calculateLoadDemand` calls in try-catch with default return values to prevent UI crashes
- **Default Values**: Ensure project settings have valid defaults (e.g., `squareFootage: 2000` not `0`)
- **Testing**: Test all changes locally with `npm run build` before deployment to ensure Vercel compatibility
- **Environment Variables**: Use non-prefixed versions exposed via vite.config.js for frontend/backend compatibility
- **Security**: Never commit API keys to git - they are properly excluded via .gitignore

#### Code Quality Rules
- **Code Editing**: Make edits to existing code and only create duplicate files if absolutely needed
- **Context Usage**: Use specific context hooks instead of legacy compatibility hooks
- **State Updates**: Update context state through provided actions, not direct state mutation

## Recent Critical Fixes & Common Issues

### API Deployment Issues
**Problem**: API calls work in development but fail in Vercel production
**Root Cause**: Missing backend serverless functions deployment
**Solution**: Convert Express API routes to Vercel serverless function format
- Files: `/api/*.js` must export `export default async function handler(req, res)`
- Configuration: `vercel.json` must include functions and rewrites configuration
- Environment: API keys must be configured in Vercel dashboard

### Address Field Infinite Re-rendering
**Problem**: Address field glitches, text appears/disappears, cannot delete address
**Root Cause**: Circular dependency in AddressSyncContext causes infinite useEffect loops
**Solution**: Remove bidirectional auto-sync, track update sources
- Issue: Two useEffect hooks triggering each other infinitely
- Fix: Use source tracking and only sync on place selection, not every keystroke
- Files: `AddressSyncContext.tsx`, `ProjectInformation.tsx`

### Context Circular Dependencies
**Problem**: Infinite re-renders causing performance issues and UI glitches
**Symptoms**: Console warnings about maximum update depth, components not responding
**Prevention**: 
- Never create useEffect hooks that update each other's dependencies
- Use useCallback and useRef for update source tracking
- Avoid syncing state on every keystroke - use debouncing or selection-based triggers

### Vercel Build Failures
**Common Issues**:
- TypeScript errors in production but not development
- Missing environment variables for API functions
- Component imports causing build-time errors
**Solutions**:
- Always test with `npm run build` before deployment
- Check `vercel.json` configuration for proper function setup
- Verify environment variables are set in Vercel dashboard