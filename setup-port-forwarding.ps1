# Port Forwarding Setup Script for Load Calculator
# Run this script as Administrator for best results

Write-Host "=== Load Calculator Port Forwarding Setup ===" -ForegroundColor Green
Write-Host ""

# Get network information
Write-Host "1. Checking network configuration..." -ForegroundColor Yellow
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -and $_.AddressState -eq "Preferred"}).IPAddress
$gateway = (Get-NetRoute -DestinationPrefix "0.0.0.0/0").NextHop

Write-Host "   Local IP: $localIP" -ForegroundColor Cyan
Write-Host "   Gateway: $gateway" -ForegroundColor Cyan
Write-Host "   Application Port: 3000" -ForegroundColor Cyan
Write-Host ""

# Check if port 3000 is in use
Write-Host "2. Checking if port 3000 is available..." -ForegroundColor Yellow
$portInUse = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "   WARNING: Port 3000 is already in use!" -ForegroundColor Red
    Write-Host "   Please stop the application using port 3000 first." -ForegroundColor Red
} else {
    Write-Host "   Port 3000 is available" -ForegroundColor Green
}
Write-Host ""

# Check Windows Firewall
Write-Host "3. Checking Windows Firewall..." -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -DisplayName "Load Calculator Port 3000" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    Write-Host "   Firewall rule not found. Creating one..." -ForegroundColor Yellow
    try {
        New-NetFirewallRule -DisplayName "Load Calculator Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
        Write-Host "   Firewall rule created successfully" -ForegroundColor Green
    } catch {
        Write-Host "   Failed to create firewall rule. Run as Administrator." -ForegroundColor Red
    }
} else {
    Write-Host "   Firewall rule already exists" -ForegroundColor Green
}
Write-Host ""

# Test local connectivity
Write-Host "4. Testing local connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   Local access: SUCCESS" -ForegroundColor Green
} catch {
    Write-Host "   Local access: FAILED - Start the application first with 'npm run dev'" -ForegroundColor Red
}
Write-Host ""

# Display access information
Write-Host "=== Access Information ===" -ForegroundColor Green
Write-Host ""
Write-Host "Local Network Access:" -ForegroundColor Cyan
Write-Host "  Your computer: http://localhost:3000" -ForegroundColor White
Write-Host "  Other devices: http://$localIP:3000" -ForegroundColor White
Write-Host ""
Write-Host "Router Configuration:" -ForegroundColor Cyan
Write-Host "  Router URL: http://$gateway" -ForegroundColor White
Write-Host "  Port Forward Settings:" -ForegroundColor White
Write-Host "    External Port: 3000" -ForegroundColor White
Write-Host "    Internal Port: 3000" -ForegroundColor White
Write-Host "    Internal IP: $localIP" -ForegroundColor White
Write-Host "    Protocol: TCP" -ForegroundColor White
Write-Host ""
Write-Host "Quick Testing with ngrok:" -ForegroundColor Cyan
Write-Host "  Command: ngrok http 3000" -ForegroundColor White
Write-Host "  URL: Check ngrok console output" -ForegroundColor White
Write-Host ""

# Get public IP
Write-Host "5. Getting public IP address..." -ForegroundColor Yellow
try {
    $publicIP = (Invoke-WebRequest -Uri "https://ifconfig.me" -UseBasicParsing).Content
    Write-Host "   Public IP: $publicIP" -ForegroundColor Cyan
    Write-Host "   Internet access (after port forwarding): http://$publicIP:3000" -ForegroundColor White
} catch {
    Write-Host "   Could not retrieve public IP" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Start your application: npm run dev" -ForegroundColor White
Write-Host "2. Test local network access from another device" -ForegroundColor White
Write-Host "3. Configure router port forwarding if needed" -ForegroundColor White
Write-Host "4. For quick testing, use: ngrok http 3000" -ForegroundColor White
Write-Host ""
Write-Host "For detailed instructions, see: PORT_FORWARDING_GUIDE.md" -ForegroundColor Yellow 