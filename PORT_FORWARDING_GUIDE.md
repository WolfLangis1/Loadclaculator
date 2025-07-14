# Port Forwarding Guide for Load Calculator

## Overview
This guide explains how to make your Load Calculator application accessible from other devices on the internet.

## Current Configuration
- **Local IP**: 192.168.0.155
- **Router IP**: 192.168.0.1
- **Application Port**: 3000
- **Vite Config**: Already configured with `host: '0.0.0.0'` for external access

## Method 1: Local Network Access (Same WiFi)

### Step 1: Start the Application
```bash
npm run dev
```

### Step 2: Access from Other Devices
- **Your computer**: http://localhost:3000
- **Other devices on same WiFi**: http://192.168.0.155:3000

## Method 2: Internet Access via Router Port Forwarding

### Step 1: Access Router Configuration
1. Open browser and navigate to: http://192.168.0.1
2. Login with your router credentials
3. Look for router credentials on the router label or manual

### Step 2: Configure Port Forwarding
Navigate to: **Advanced Settings → Port Forwarding** (or similar)

Add a new port forward rule:
```
Service Name: Load Calculator
External Port: 3000 (or any port you prefer)
Internal Port: 3000
Internal IP: 192.168.0.155
Protocol: TCP
Status: Enabled
```

### Step 3: Find Your Public IP
```bash
# Check your public IP address
curl ifconfig.me
# or visit: https://whatismyipaddress.com
```

### Step 4: Access from Internet
Once configured, access your app from anywhere:
```
http://YOUR_PUBLIC_IP:3000
```

## Method 3: Using ngrok (Quick Testing)

### Step 1: Install ngrok
```bash
npm install -g ngrok
```

### Step 2: Create Tunnel
```bash
ngrok http 3000
```

### Step 3: Access via ngrok URL
ngrok will provide a public URL like:
```
https://abc123.ngrok.io
```

## Method 4: Using Docker (Production Ready)

### Step 1: Build and Run with Docker
```bash
# Build the application
npm run docker:build

# Run with port mapping
docker run -p 3000:3000 load-calculator
```

### Step 2: Use Docker Compose
```bash
# Development
npm run docker:compose:dev

# Production
npm run docker:compose:prod
```

## Security Considerations

### 1. Firewall Configuration
- Ensure Windows Firewall allows port 3000
- Configure router firewall if needed

### 2. HTTPS Setup (Recommended for Production)
```bash
# For development with HTTPS
npm run dev -- --https

# For production, use a reverse proxy like nginx
```

### 3. Environment Variables
Create `.env` file for production:
```env
NODE_ENV=production
VITE_API_URL=https://your-domain.com
```

## Troubleshooting

### Common Issues:

1. **Can't access from other devices on same network**
   - Check Windows Firewall settings
   - Ensure Vite is running with `host: '0.0.0.0'`

2. **Port forwarding not working**
   - Verify router configuration
   - Check if ISP blocks port 3000
   - Try different external port (8080, 8000, etc.)

3. **ngrok not working**
   - Check if port 3000 is already in use
   - Verify ngrok installation

### Testing Commands:
```bash
# Test local access
curl http://localhost:3000

# Test network access
curl http://192.168.0.155:3000

# Check if port is open
netstat -an | findstr :3000
```

## Production Deployment Options

### 1. VPS/Cloud Server
- Deploy to AWS, DigitalOcean, or similar
- Use nginx as reverse proxy
- Set up SSL certificate

### 2. Static Hosting
```bash
# Build for production
npm run build

# Deploy to Netlify, Vercel, or GitHub Pages
```

### 3. Container Orchestration
- Use Docker Swarm or Kubernetes
- Implement load balancing
- Set up monitoring and logging

## Next Steps

1. **Choose your method** based on your needs:
   - Local network: Method 1
   - Quick testing: Method 3 (ngrok)
   - Permanent internet access: Method 2 (router)
   - Production: Method 4 (Docker)

2. **Test the setup** from different devices

3. **Consider security** implications and implement HTTPS

4. **Monitor performance** and adjust as needed

## Support

If you encounter issues:
1. Check router manufacturer's documentation
2. Verify network configuration
3. Test with different ports
4. Consider using a VPN service for additional security 