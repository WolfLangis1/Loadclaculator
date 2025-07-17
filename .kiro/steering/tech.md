# Technology Stack

## Frontend
- **React 18** with TypeScript - Modern functional components with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **jsPDF** - PDF generation for reports

## Backend/APIs
- **Express.js** - Node.js server for API endpoints
- **Firebase** - Authentication and user management
- **Supabase** - Database and additional auth options
- **Google Maps APIs** - Geocoding, Places, Solar, Static Maps
- **Mapbox** - Alternative mapping provider

## Development Tools
- **TypeScript** - Full type coverage
- **ESLint** - Code linting with React-specific rules
- **Vitest** - Unit testing framework
- **Docker** - Containerization for development and production

## Build System
- **Vite** with React plugin
- **Terser** for minification
- **Multi-stage Docker builds** for production optimization

## Common Commands

### Development
```bash
npm run dev              # Start development server
npm run dev:full         # Start frontend + backend
npm run server           # Backend only
npm run server:dev       # Backend with hot reload
```

### Testing
```bash
npm run test             # Run unit tests
npm run test:ui          # Test with UI
npm run test:coverage    # Coverage report
npm run lint             # ESLint check
npm run lint:fix         # Auto-fix linting issues
npm run typecheck        # TypeScript validation
```

### Building
```bash
npm run build            # Production build
npm run build:production # Optimized production build
npm run preview          # Preview production build
```

### Docker
```bash
npm run docker:build     # Build production image
npm run docker:run       # Run production container
npm run docker:compose:dev   # Development with hot reload
npm run docker:compose:prod  # Production deployment
```

## Environment Configuration
- Use `.env.example` as template
- Frontend vars prefixed with `VITE_`
- Backend vars for API keys and secrets
- Docker environment handling for different modes