# Docker Setup Instructions

## Environment Configuration

### 1. Setup Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` with your actual API keys:

```bash
# Enable real satellite data (set to 'true' to use real APIs)
USE_REAL_AERIAL_DATA=true

# Google Maps API Keys (required for satellite imagery)
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here

# Mapbox API Key (alternative)
MAPBOX_API_KEY=your_actual_mapbox_api_key_here

# Preferred provider ('google' or 'mapbox')
AERIAL_PROVIDER=google
```

### 2. Getting API Keys

#### Google Maps API Key:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Maps Static API
   - Geocoding API
   - Solar API (for solar analysis)
4. Create credentials → API Key
5. Restrict the key to your domain for security

#### Mapbox API Key:
1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Create a new public token
3. Add your domain to token restrictions

## Container Usage

### Development Container (with hot reload)

```bash
# Build and run development container
docker-compose --profile dev up --build

# Or just build
docker-compose --profile dev build load-calculator-dev

# Access at: http://localhost:3002
```

**Features:**
- ✅ Hot reload for code changes
- ✅ Environment variables from .env file
- ✅ Volume mounting for live development
- ✅ Health checks
- ✅ Full TypeScript development support

### Production Container

```bash
# Build and run production container
docker-compose --profile prod up --build

# Or just build
docker-compose --profile prod build load-calculator

# Access at: http://localhost:3002
```

**Features:**
- ✅ Optimized production build
- ✅ Environment variables baked into build
- ✅ Nginx web server
- ✅ Health checks
- ✅ Smaller container size

### Direct Docker Commands

#### Development:
```bash
# Build
npm run docker:build:dev

# Run with volume mounting
npm run docker:run:dev
```

#### Production:
```bash
# Build
npm run docker:build

# Run
npm run docker:run
```

## Environment Variables Explained

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `USE_REAL_AERIAL_DATA` | Enable real API calls vs mock data | `false` | No |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key for satellite imagery | empty | Yes (if using Google) |
| `MAPBOX_API_KEY` | Mapbox API key for satellite imagery | empty | Yes (if using Mapbox) |
| `AERIAL_PROVIDER` | Preferred imagery provider | `google` | No |

## Troubleshooting

### Common Issues:

1. **Container starts and stops immediately**
   - Check logs: `docker-compose logs load-calculator-dev`
   - Ensure .env file exists and is valid
   - Check port 3002 is not in use

2. **API calls not working**
   - Verify API keys are correct in .env
   - Set `VITE_USE_REAL_AERIAL_DATA=true`
   - Check API quotas in provider dashboard

3. **Hot reload not working in development**
   - Ensure volume mounting is working
   - Check CHOKIDAR_USEPOLLING is enabled

4. **Build fails**
   - Clear Docker cache: `docker system prune`
   - Check all dependencies are installed
   - Verify Node.js version compatibility

### Useful Commands:

```bash
# View logs
docker-compose logs -f load-calculator-dev
docker-compose logs -f load-calculator

# Stop containers
docker-compose down

# Clean up
docker-compose down --volumes
docker system prune -f

# Rebuild without cache
docker-compose build --no-cache
```

## Security Notes

- ⚠️ Never commit actual API keys to version control
- ⚠️ Use environment-specific .env files
- ⚠️ Restrict API keys to your domains only
- ⚠️ Monitor API usage to avoid unexpected charges
- ✅ .env is already in .gitignore

## API Costs (Approximate)

- **Google Maps**: ~$2 per 1,000 satellite images + $5 per 1,000 geocoding requests
- **Mapbox**: ~$0.50 per 1,000 requests for both imagery and geocoding

Both providers offer free tiers for development and testing.