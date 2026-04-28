#!/bin/bash

# Kingdom Deliverance Centre Uganda - CWP VPS Deployment Script
echo "🚀 Starting deployment for Kingdom Deliverance Centre Uganda on CWP VPS..."

# Navigate to project directory
cd /home/n767765/kdcuganda.org

# Pull latest changes
echo "📥 Pulling latest changes..."
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building the application..."
npm run build

# Install PM2 globally if not already installed
echo "🔧 Setting up PM2..."
npm install -g pm2

# Stop existing application if running
pm2 stop kingdom-deliverance 2>/dev/null || true

# Start the application with PM2
echo "🌟 Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup (run this manually after the script)
echo "⚙️  Setting up PM2 startup..."
pm2 startup

# Open firewall port
echo "🔥 Configuring firewall..."
firewall-cmd --permanent --add-port=3005/tcp 2>/dev/null || true
firewall-cmd --reload 2>/dev/null || true

# Test the application
echo "🧪 Testing application..."
sleep 5
if curl -f http://localhost:3005 > /dev/null 2>&1; then
    echo "✅ Application is running successfully on port 3005!"
else
    echo "❌ Application test failed. Check logs with: pm2 logs kingdom-deliverance"
fi

# Show status
echo "📊 Application status:"
pm2 status

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .htaccess file in /home/n767765/public_html/"
echo "2. Run the PM2 startup command shown above"
echo "3. Test your website at https://kdcuganda.org"
echo ""
echo "Useful commands:"
echo "- Check logs: pm2 logs kingdom-deliverance"
echo "- Restart app: pm2 restart kingdom-deliverance"
echo "- Check status: pm2 status"