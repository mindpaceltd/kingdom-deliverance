#!/bin/bash

echo "🔍 Debugging 500 Internal Server Error for kdcuganda.org"
echo "=================================================="

echo ""
echo "1. Checking Nginx error logs..."
echo "================================"
tail -20 /var/log/nginx/error.log

echo ""
echo "2. Checking domain-specific error logs..."
echo "========================================"
tail -20 /usr/local/apache/domlogs/kdcuganda.org.error.log 2>/dev/null || echo "No Apache error log found"

echo ""
echo "3. Checking if Next.js app is running on port 3005..."
echo "===================================================="
curl -I http://127.0.0.1:3005 2>/dev/null || echo "❌ Next.js app not responding on port 3005"

echo ""
echo "4. Checking what's running on port 3005..."
echo "=========================================="
netstat -tlnp | grep 3005 || echo "❌ Nothing running on port 3005"

echo ""
echo "5. Checking PM2 status..."
echo "========================"
pm2 status

echo ""
echo "6. Checking PM2 logs for kdcuganda..."
echo "===================================="
pm2 logs kdcuganda --lines 10 2>/dev/null || echo "No kdcuganda process found in PM2"

echo ""
echo "7. Checking if Next.js is built..."
echo "================================="
cd /home/n767765/kdcuganda.org
ls -la .next 2>/dev/null || echo "❌ .next build folder not found"

echo ""
echo "8. Testing Nginx configuration..."
echo "================================"
nginx -t

echo ""
echo "9. Checking if Node.js and npm are available..."
echo "=============================================="
node --version 2>/dev/null || echo "❌ Node.js not found"
npm --version 2>/dev/null || echo "❌ npm not found"

echo ""
echo "10. Checking project directory..."
echo "================================"
cd /home/n767765/kdcuganda.org
pwd
ls -la | head -10

echo ""
echo "🔧 RECOMMENDED FIXES:"
echo "===================="
echo "If Next.js app is not running:"
echo "  cd /home/n767765/kdcuganda.org"
echo "  npm install"
echo "  npm run build"
echo "  pm2 start ecosystem.config.js"
echo ""
echo "If port 3005 is blocked:"
echo "  firewall-cmd --permanent --add-port=3005/tcp"
echo "  firewall-cmd --reload"
echo ""
echo "If PM2 process is crashed:"
echo "  pm2 restart kdcuganda"
echo "  pm2 logs kdcuganda"