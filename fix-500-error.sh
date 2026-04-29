#!/bin/bash

echo "🚨 EMERGENCY FIX for kdcuganda.org 500 Error"
echo "============================================="

# Navigate to project directory
cd /home/n767765/kdcuganda.org

echo ""
echo "Step 1: Stopping any existing kdcuganda processes..."
echo "===================================================="
pm2 stop kdcuganda 2>/dev/null || echo "No kdcuganda process to stop"
pm2 delete kdcuganda 2>/dev/null || echo "No kdcuganda process to delete"

echo ""
echo "Step 2: Checking Node.js and npm..."
echo "==================================="
node --version || {
    echo "❌ Node.js not found. Installing Node.js 18..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
}

echo ""
echo "Step 3: Installing dependencies..."
echo "=================================="
npm install

echo ""
echo "Step 4: Building the application..."
echo "==================================="
npm run build

echo ""
echo "Step 5: Starting the application with PM2..."
echo "============================================"
pm2 start npm --name "kdcuganda" -- start

echo ""
echo "Step 6: Checking if app is running..."
echo "===================================="
sleep 5
pm2 status

echo ""
echo "Step 7: Testing local connection..."
echo "==================================="
curl -I http://127.0.0.1:3005

echo ""
echo "Step 8: Opening firewall port 3005..."
echo "====================================="
firewall-cmd --permanent --add-port=3005/tcp
firewall-cmd --reload

echo ""
echo "Step 9: Reloading Nginx..."
echo "=========================="
systemctl reload nginx

echo ""
echo "Step 10: Final test..."
echo "====================="
curl -I http://kdcuganda.org

echo ""
echo "✅ Fix completed! Check your website now."
echo "If still having issues, run: pm2 logs kdcuganda"