@echo off
REM Kingdom Deliverance Centre Uganda - Deployment Script for Windows

echo 🚀 Starting deployment for Kingdom Deliverance Centre Uganda...

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the application
echo 🔨 Building the application...
npm run build

REM Start the production server
echo 🌟 Starting production server on port 3005...
npm start

echo ✅ Deployment complete! Your website should be running on http://localhost:3005
echo 📝 Make sure your web server is configured to proxy requests to port 3005
pause