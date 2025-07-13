# Professional Load Calculator

A modern, NEC-compliant electrical load calculator for residential and commercial applications. This application helps electrical professionals calculate service loads, wire sizes, and generate permit-ready reports.

## Features

- **NEC Compliant Calculations** - Supports 2017, 2020, and 2023 code cycles
- **Multiple Calculation Methods** - Optional (220.82), Standard (220.42), and Existing Dwelling (220.87)
- **Comprehensive Load Types** - General, HVAC, EVSE, Solar/Battery systems
- **Wire Sizing Calculator** - Automatic conductor sizing with voltage drop analysis
- **Energy Management System** - EVSE load management per NEC 750.30
- **Solar Interconnection** - 120% rule compliance checking
- **Professional Reports** - Formatted exports for permit submission
- **Responsive Design** - Works on desktop, tablet, and mobile devices
- **Accessibility Compliant** - WCAG guidelines for screen readers

## Quick Start

### Option 1: Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Loadclaculator
   ```

2. **Run with Docker (Production)**
   ```bash
   docker build -t load-calculator .
   docker run -p 3000:3000 load-calculator
   ```

3. **Or use Docker Compose**
   ```bash
   # Development with hot reload
   docker-compose --profile dev up --build

   # Production
   docker-compose -f docker-compose.prod.yml up --build -d
   ```

4. **Open in browser**
   Navigate to `http://localhost:3000`

### Option 2: Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Building for production**
   ```bash
   npm run build
   npm run preview
   ```

## Usage

### Basic Workflow

1. **Enter Project Information**
   - Customer name and property address
   - Square footage and service size
   - Select NEC code year and calculation method

2. **Input Loads**
   - **General Tab**: Lighting, receptacles, appliances
   - **HVAC Tab**: Air conditioning, heating, motors
   - **EV Charging Tab**: EVSE with optional EMS
   - **Solar/Battery Tab**: Renewable energy systems

3. **Review Calculations**
   - Total amperage and spare capacity
   - Load breakdown by category
   - Code compliance warnings/errors

4. **Generate Report**
   - Export formatted text report
   - Suitable for permit submission
   - Includes NEC code references

### Advanced Features

#### Energy Management System (EMS)
Enable EMS for multiple EVSE installations to reduce electrical demand:
```
1. Go to EV Charging tab
2. Check "Use Energy Management System"
3. Set maximum load setting
4. EMS applies 125% factor to setpoint only
```

#### Solar Interconnection Analysis
Automatic 120% rule compliance checking:
```
- Calculates: (Busbar Rating × 1.2) - Main Breaker
- Warns if solar backfeed exceeds limit
- Suggests supply-side connections when needed
```

## Docker Deployment

### Container Architecture

The application uses a multi-stage Docker build for optimal production performance:

- **Base Stage**: Node.js 18 Alpine for dependency installation
- **Builder Stage**: Compiles TypeScript and builds with Vite
- **Runner Stage**: Nginx Alpine serving static assets

### Available Docker Commands

```bash
# Build and run production container
npm run docker:build
npm run docker:run

# Development with hot reload
npm run docker:build:dev
npm run docker:run:dev

# Docker Compose workflows
npm run docker:compose:dev     # Development mode
npm run docker:compose:prod    # Production mode
npm run docker:compose:down    # Stop containers

# Utility commands
npm run docker:clean          # Clean up unused containers/volumes
npm run docker:logs           # View container logs
```

### Production Deployment

For production deployment with monitoring:

```bash
# Deploy with monitoring stack (Prometheus/Grafana)
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access services:
# Application: http://localhost:3000
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

### Docker Configuration

**Production Features:**
- Multi-stage build for minimal image size (~49MB final image)
- Nginx with gzip compression and security headers
- Health checks for container orchestration
- Non-root user for security
- Proper file permissions and ownership

**Development Features:**
- Hot reload with volume mounting
- Full development dependencies
- Debug-friendly configuration

### Environment Variables

```bash
# Production
NODE_ENV=production

# Development
NODE_ENV=development
CHOKIDAR_USEPOLLING=true  # For file watching in containers
```

## Development

### Architecture

The application follows modern React patterns:

- **Components**: Focused, reusable UI components
- **Context**: Centralized state management
- **Services**: Business logic and calculations
- **Types**: Full TypeScript coverage
- **Tests**: Unit tests for critical calculations

### Key Files

- `src/services/necCalculations.ts` - Main load calculation logic
- `src/services/wireCalculations.ts` - Wire sizing and voltage drop
- `src/constants/necConstants.ts` - NEC tables and factors
- `src/types/` - TypeScript interfaces
- `src/tests/` - Unit tests

### Adding New Features

1. **New Load Type**
   - Add TypeScript interface in `src/types/load.ts`
   - Create load template in `src/constants/loadTemplates.ts`
   - Build table component in `src/components/LoadCalculator/LoadTables/`
   - Update context reducer

2. **Calculation Changes**
   - Modify `src/services/necCalculations.ts`
   - Add comprehensive unit tests
   - Verify against NEC requirements

### Testing

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Type checking
npm run typecheck

# Linting
npm run lint
```

## NEC Code Compliance

### Supported Articles

- **220.12** - General lighting loads (3 VA/sq ft)
- **220.42-220.55** - Standard calculation method
- **220.82** - Optional calculation method
- **220.87** - Existing dwelling calculation
- **625.41-625.44** - Electric vehicle charging equipment
- **705.12** - Solar PV interconnection requirements
- **750.30** - Energy management systems

### Load Calculation Methods

#### Optional Method (220.82)
- First 10 kVA at 100%
- Remainder at 40%
- Simplified for residential

#### Standard Method (220.42-220.55)
- First 3 kVA at 100%
- Next 117 kVA at 35%
- Above 120 kVA at 25%
- Traditional demand factors

#### Existing Dwelling (220.87)
- Based on actual demand data
- Cannot be used with renewable energy
- Requires 12 months of billing history

## Professional Use

### Report Generation

Generated reports include:
- Complete load breakdown
- Wire sizing recommendations
- Code compliance verification
- Inspector notes and references
- Professional certification fields

### Disclaimer

This software is provided for informational purposes only. All electrical calculations should be verified by a licensed electrical professional. Local codes and AHJ requirements may supersede NEC requirements.

## License

[License information to be added]

## Support

For technical support or feature requests, please open an issue on the repository.

## Changelog

### v2.0.0 - Complete Refactor
- Modernized React architecture
- Added TypeScript throughout
- Improved mobile responsiveness
- Enhanced accessibility
- Added comprehensive testing
- Optimized performance

### v1.0.0 - Initial Release
- Basic load calculations
- Single file application
- Core NEC compliance