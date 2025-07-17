#!/bin/bash
# Production Docker Secrets Setup Script

set -e

echo "🔐 Setting up Docker secrets for production deployment"
echo "This script will create Docker secrets from your environment variables"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker Swarm is initialized
if ! docker info | grep -q "Swarm: active"; then
    echo -e "${YELLOW}⚠️  Docker Swarm not initialized. Initializing now...${NC}"
    docker swarm init
    echo -e "${GREEN}✅ Docker Swarm initialized${NC}"
fi

# Function to create secret
create_secret() {
    local secret_name=$1
    local env_var=$2
    local value=${!env_var}
    
    if [ -z "$value" ]; then
        echo -e "${RED}❌ Environment variable $env_var is not set${NC}"
        return 1
    fi
    
    if [ "$value" = "your_actual_${env_var,,}_here" ] || [ "$value" = "your_${env_var,,}_here" ]; then
        echo -e "${RED}❌ $env_var contains placeholder value${NC}"
        return 1
    fi
    
    # Check if secret already exists
    if docker secret ls | grep -q "$secret_name"; then
        echo -e "${YELLOW}⚠️  Secret $secret_name already exists, skipping...${NC}"
        return 0
    fi
    
    # Create the secret
    echo -n "$value" | docker secret create "$secret_name" -
    echo -e "${GREEN}✅ Created secret: $secret_name${NC}"
}

# Load environment variables
if [ -f .env.local ]; then
    echo "📥 Loading environment from .env.local"
    set -a
    source .env.local
    set +a
elif [ -f .env ]; then
    echo "📥 Loading environment from .env"
    set -a
    source .env
    set +a
else
    echo -e "${RED}❌ No .env.local or .env file found${NC}"
    echo "Please create .env.local with your production API keys"
    exit 1
fi

echo ""
echo "🔄 Creating Docker secrets..."

# Create secrets for each required environment variable
create_secret "load_calculator_google_maps_api_key" "GOOGLE_MAPS_API_KEY"
create_secret "load_calculator_supabase_url" "SUPABASE_URL"
create_secret "load_calculator_supabase_anon_key" "SUPABASE_ANON_KEY"
create_secret "load_calculator_supabase_service_key" "SUPABASE_SERVICE_KEY"
create_secret "load_calculator_openweather_api_key" "OPENWEATHER_API_KEY"
create_secret "load_calculator_jwt_secret" "JWT_SECRET"

echo ""
echo "📋 Created secrets:"
docker secret ls | grep load_calculator

echo ""
echo -e "${GREEN}🎉 Production secrets setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy with: docker-compose -f docker-compose.prod.yml up -d"
echo "2. Check health: curl http://localhost:3000/api/health"
echo "3. Monitor logs: docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "To remove secrets later:"
echo "docker secret rm \$(docker secret ls | grep load_calculator | awk '{print \$1}')"