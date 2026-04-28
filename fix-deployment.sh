#!/bin/bash

echo "🔧 Kingdom Deliverance Centre - Emergency Fix Script"
echo "=================================================="

# Navigate to project directory
cd /home/n767765/kdcuganda.org

echo ""
echo "Step 1: Stopping all running PM2 processes..."
pm2 stop all
pm2 delete all

echo ""
echo "Step 2: Cleaning up old files..."
rm -rf node_modules
rm -rf .next
rm -f package-lock.json

echo ""
echo "Step 3: Installing dependencies fresh..."
npm install

echo ""
echo "Step 4: Building the application..."
npm run build

echo ""
echo "Step 5: Starting the application with PM2..."
pm2 start npm --name "kdcuganda" -- start

echo ""
echo "Step 6: Saving PM2 configuration..."
pm2 save

echo ""
echo "Step 7: Testing the application..."
sleep 5
if curl -f http://localhost:3005 > /dev/null 2>&1; then
    echo "✅ Application is running successfully!"
else
    echo "❌ Application test failed. Checking logs..."
    pm2 logs kdcuganda --lines 50
fi

echo ""
echo "Step 8: Checking PM2 status..."
pm2 status

echo ""
echo "=================================================="
echo "✅ Fix script completed!"
echo ""
echo "Your application should now be running."
echo "Check status: pm2 status"
echo "View logs: pm2 logs kdcuganda"
echo "Restart: pm2 restart kdcuganda"
