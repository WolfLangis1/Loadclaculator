# Project Structure

## Root Level
- **Configuration files** - Package.json, Docker configs, build tools
- **Documentation** - Comprehensive guides for setup and features
- **Scripts** - Development and deployment automation

## Source Code (`src/`)
```
src/
├── components/          # React components organized by feature
├── context/            # React Context providers for state management
├── services/           # Business logic and calculations
├── types/              # TypeScript type definitions
├── constants/          # NEC tables, load templates, configuration
├── hooks/              # Custom React hooks
├── utils/              # Utility functions and helpers
├── data/               # Static data and mock responses
├── styles/             # Global styles and Tailwind extensions
├── tests/              # Unit tests for critical calculations
└── debug/              # Development debugging tools
```

## API Layer (`api/`)
```
api/
├── auth/               # Authentication endpoints
├── projects/           # Project CRUD operations
├── users/              # User management
├── services/           # External API integrations
├── utils/              # Backend utilities
├── geocode.js          # Address geocoding
├── places.js           # Google Places integration
├── solar.js            # Solar API calculations
├── satellite.js        # Aerial imagery
├── weather.js          # Weather data integration
└── roof-analysis.js    # Roof measurement tools
```

## Component Organization
- **Feature-based folders** - Components grouped by functionality
- **Shared components** - Reusable UI elements
- **Page-level components** - Top-level route components
- **Hook-based state** - Custom hooks for complex logic

## Key Architectural Patterns
- **Context + Reducer** - Centralized state management
- **Service layer** - Business logic separated from UI
- **Type-first development** - Comprehensive TypeScript coverage
- **Component composition** - Reusable, focused components
- **Error boundaries** - Graceful error handling

## Configuration Management
- **Environment-based configs** - Different settings per environment
- **Docker multi-stage** - Optimized builds for different targets
- **Path aliases** - Clean imports with `@/` prefix
- **Build optimization** - Code splitting and chunk management

## Testing Strategy
- **Unit tests** - Critical calculation logic
- **Component tests** - UI behavior validation
- **Integration tests** - API endpoint testing
- **E2E tests** - Full user workflows (Cypress)