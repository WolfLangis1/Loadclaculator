#!/bin/bash
# Bash script to start the Load Calculator in Docker development mode

echo "🚀 Starting Load Calculator Development Environment"

# Function to check if Docker is running
check_docker() {
    if docker info >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if Docker is running
if check_docker; then
    echo "✅ Docker is running"
else
    echo "❌ Docker is not running"
    echo "Please start Docker Desktop manually and run this script again."
    echo "On Windows: Start Docker Desktop application"
    echo "On Linux: sudo systemctl start docker"
    exit 1
fi

# Stop any running containers
echo "🛑 Stopping any existing containers..."
docker-compose down 2>/dev/null || true

# Build and start the development container
echo "🔨 Building and starting development container on port 3002..."
docker-compose --profile dev up load-calculator-dev --build -d

# Wait a moment for container to start
sleep 5

# Check container status
if docker-compose ps load-calculator-dev | grep -q "Up"; then
    echo "✅ Development container started successfully!"
    echo "🌐 Application available at: http://localhost:3002"
    echo ""
    echo "📊 Container status:"
    docker-compose ps load-calculator-dev
    echo ""
    echo "📋 Useful commands:"
    echo "  View logs:      docker-compose logs -f load-calculator-dev"
    echo "  Stop container: docker-compose down"
    echo "  Restart:        docker-compose restart load-calculator-dev"
    echo "  Shell access:   docker-compose exec load-calculator-dev sh"
else
    echo "❌ Failed to start development container"
    echo "📋 Container logs:"
    docker-compose logs load-calculator-dev
    exit 1
fi