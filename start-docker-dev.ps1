#!/usr/bin/env pwsh
# PowerShell script to start Docker Desktop and run the Load Calculator in development mode

Write-Host "🚀 Starting Load Calculator Development Environment" -ForegroundColor Green

# Check if Docker Desktop is running
$dockerRunning = $false
try {
    docker info > $null 2>&1
    $dockerRunning = $true
    Write-Host "✅ Docker Desktop is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
}

if (-not $dockerRunning) {
    Write-Host "🔄 Starting Docker Desktop..." -ForegroundColor Yellow
    
    # Try to start Docker Desktop (Windows)
    $dockerDesktopPath = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopPath) {
        Start-Process -FilePath $dockerDesktopPath
        Write-Host "⏳ Waiting for Docker Desktop to start (this may take 30-60 seconds)..." -ForegroundColor Yellow
        
        # Wait for Docker to be ready
        $timeout = 120 # 2 minutes timeout
        $elapsed = 0
        while ($elapsed -lt $timeout) {
            Start-Sleep -Seconds 5
            $elapsed += 5
            try {
                docker info > $null 2>&1
                $dockerRunning = $true
                break
            } catch {
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
        }
        
        if ($dockerRunning) {
            Write-Host "`n✅ Docker Desktop started successfully!" -ForegroundColor Green
        } else {
            Write-Host "`n❌ Docker Desktop failed to start within timeout" -ForegroundColor Red
            Write-Host "Please manually start Docker Desktop and run this script again." -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "❌ Docker Desktop not found. Please install Docker Desktop for Windows." -ForegroundColor Red
        Write-Host "Download from: https://docs.docker.com/desktop/install/windows-install/" -ForegroundColor Blue
        exit 1
    }
}

# Stop any running containers
Write-Host "🛑 Stopping any existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null

# Build and start the development container
Write-Host "🔨 Building and starting development container..." -ForegroundColor Yellow
docker-compose --profile dev up load-calculator-dev --build -d

# Check if container started successfully
Start-Sleep -Seconds 5
$containerStatus = docker-compose ps load-calculator-dev --format json | ConvertFrom-Json

if ($containerStatus -and $containerStatus.State -eq "running") {
    Write-Host "✅ Development container started successfully!" -ForegroundColor Green
    Write-Host "🌐 Application available at: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "📊 Container status:" -ForegroundColor Blue
    docker-compose ps load-calculator-dev
    
    Write-Host "`n📋 Useful commands:" -ForegroundColor Blue
    Write-Host "  View logs:     docker-compose logs -f load-calculator-dev" -ForegroundColor White
    Write-Host "  Stop container: docker-compose down" -ForegroundColor White
    Write-Host "  Restart:       docker-compose restart load-calculator-dev" -ForegroundColor White
    
} else {
    Write-Host "❌ Failed to start development container" -ForegroundColor Red
    Write-Host "📋 Container logs:" -ForegroundColor Yellow
    docker-compose logs load-calculator-dev
    exit 1
}