#!/bin/bash
# Production Deployment Script with Health Checks and Monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🚀 Load Calculator Production Deployment"
echo "========================================"
echo ""

# Configuration
HEALTH_CHECK_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_INTERVAL=10  # 10 seconds
COMPOSE_FILE="docker-compose.prod.yml"

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Pre-deployment checks
echo "🔍 Pre-deployment checks..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running"
    exit 1
fi
log_success "Docker is running"

# Check if compose file exists
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Production compose file not found: $COMPOSE_FILE"
    exit 1
fi
log_success "Compose file found"

# Check Docker secrets
log_info "Checking Docker secrets..."
REQUIRED_SECRETS=(
    "load_calculator_google_maps_api_key"
    "load_calculator_supabase_url"
    "load_calculator_supabase_anon_key"
    "load_calculator_jwt_secret"
)

MISSING_SECRETS=()
for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! docker secret ls | grep -q "$secret"; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    log_error "Missing required secrets:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  - $secret"
    done
    echo ""
    echo "Run 'scripts/create-production-secrets.sh' to create them"
    exit 1
fi
log_success "All required secrets are available"

# Build and deploy
echo ""
echo "🏗️  Building and deploying..."

# Stop existing containers
if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
    log_info "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down
fi

# Build and start services
log_info "Building and starting services..."
docker-compose -f "$COMPOSE_FILE" up -d --build

# Health checks
echo ""
echo "🏥 Performing health checks..."

wait_for_service() {
    local service_name=$1
    local health_url=$2
    local timeout=$HEALTH_CHECK_TIMEOUT
    local interval=$HEALTH_CHECK_INTERVAL
    local elapsed=0
    
    log_info "Waiting for $service_name to be healthy..."
    
    while [ $elapsed -lt $timeout ]; do
        if curl -f -s "$health_url" >/dev/null 2>&1; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        sleep $interval
        elapsed=$((elapsed + interval))
        echo -n "."
    done
    
    echo ""
    log_error "$service_name failed to become healthy within ${timeout}s"
    return 1
}

# Wait for services
HEALTH_CHECKS_PASSED=true

if ! wait_for_service "API Server" "http://localhost:3001/api/health"; then
    HEALTH_CHECKS_PASSED=false
fi

if ! wait_for_service "Frontend" "http://localhost:3000"; then
    HEALTH_CHECKS_PASSED=false
fi

# Check container status
echo ""
echo "📊 Container status:"
docker-compose -f "$COMPOSE_FILE" ps

# Check logs for errors
echo ""
echo "📝 Recent logs:"
docker-compose -f "$COMPOSE_FILE" logs --tail=20

# Final health check with detailed information
echo ""
echo "🔬 Detailed health check..."

API_HEALTH=$(curl -s http://localhost:3001/api/health 2>/dev/null || echo '{"status":"unhealthy"}')
echo "API Health: $API_HEALTH"

# Performance test
echo ""
echo "⚡ Performance test..."
RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null http://localhost:3000)
echo "Frontend response time: ${RESPONSE_TIME}s"

# Security check
echo ""
echo "🛡️  Security check..."

# Check if API keys are exposed
if curl -s http://localhost:3000 | grep -q "AIza\|sk_live\|eyJ"; then
    log_error "Potential API key exposure detected in frontend"
    HEALTH_CHECKS_PASSED=false
else
    log_success "No API key exposure detected"
fi

# Check CORS headers
CORS_HEADER=$(curl -s -I http://localhost:3001/api/health | grep -i "access-control-allow-origin" || echo "")
if [ -n "$CORS_HEADER" ]; then
    log_info "CORS header: $CORS_HEADER"
    if echo "$CORS_HEADER" | grep -q "\*"; then
        log_warning "CORS is set to allow all origins"
    fi
fi

# Deployment summary
echo ""
echo "========================================"
if [ "$HEALTH_CHECKS_PASSED" = true ]; then
    log_success "🎉 DEPLOYMENT SUCCESSFUL!"
    echo ""
    echo "🌐 Application URLs:"
    echo "  Frontend: http://localhost:3000"
    echo "  API:      http://localhost:3001"
    echo "  Health:   http://localhost:3001/api/health"
    echo ""
    echo "📊 Monitoring:"
    echo "  Logs:     docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Status:   docker-compose -f $COMPOSE_FILE ps"
    echo "  Metrics:  http://localhost:9090 (if monitoring enabled)"
    echo ""
    echo "🛠️  Management:"
    echo "  Stop:     docker-compose -f $COMPOSE_FILE down"
    echo "  Restart:  docker-compose -f $COMPOSE_FILE restart"
    echo "  Update:   ./scripts/deploy-production.sh"
    
else
    log_error "🚨 DEPLOYMENT FAILED OR UNHEALTHY"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  Check logs: docker-compose -f $COMPOSE_FILE logs"
    echo "  Check status: docker-compose -f $COMPOSE_FILE ps"
    echo "  Check secrets: docker secret ls"
    echo "  Validate env: npm run validate-env"
    echo ""
    echo "💡 Common issues:"
    echo "  - API keys not properly configured"
    echo "  - Docker secrets missing or incorrect"
    echo "  - Network connectivity issues"
    echo "  - Resource constraints (CPU/memory)"
    
    exit 1
fi

echo "========================================" 