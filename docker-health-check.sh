#!/bin/sh
# Docker health check script for Load Calculator

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "ERROR: nginx is not running"
    exit 1
fi

# Check if the application responds
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "SUCCESS: Application is healthy"
    exit 0
else
    echo "ERROR: Application health check failed"
    exit 1
fi