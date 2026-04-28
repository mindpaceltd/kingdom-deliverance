# Kingdom Deliverance Centre Uganda - VPS Deployment Guide

## 🚀 InMotion VPS with CentOS WebPanel (CWP) Deployment

### Your Current Setup
- **Server:** InMotion VPS (173.231.241.161)
- **OS:** CentOS with WebPanel (CWP)
- **User:** n767765
- **Project Path:** `/home/n767765/kdcuganda.org/` (This is your web root)
- **Domain:** kdcuganda.org points directly to `/home/n767765/kdcuganda.org/`

## 📋 Step-by-Step Deployment

### Step 1: Connect to Your Server
```bash
# From your Windows machine
ssh root@173.231.241.161
# Enter your password when prompted
```

### Step 2: Navigate to Your Project
```bash
cd /home/n767765/kdcuganda.org
```

### Step 3: Update Your Code (You've already done this!)
```bash
# Pull latest changes
git fetch origin
git reset --hard origin/main

# Install dependencies
npm install

# Fix any security vulnerabilities (optional)
npm audit fix
```

### Step 4: Build and Deploy
```bash
# Build the production version
npm run build

# Install PM2 globally for process management
npm install -g pm2

# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it gives you (usually something like: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root)
```

### Step 5: Configure CWP/Apache to Proxy to Your App

#### Option A: Using CWP Web Server Configuration

1. **Login to CWP Panel:**
   - Go to `http://173.231.241.161:2030` or `https://173.231.241.161:2031`
   - Login with your root credentials

2. **Configure Virtual Host:**
   - Go to `WebServer Settings` → `Apache Settings` → `Vhost Conf`
   - Select your domain `kdcuganda.org`
   - Add this configuration:

```apache
<VirtualHost *:80>
    ServerName kdcuganda.org
    ServerAlias www.kdcuganda.org
    DocumentRoot /home/n767765/kdcuganda.org
    
    # Proxy all requests to Next.js app
    ProxyPreserveHost On
    ProxyPass / http://localhost:3005/
    ProxyPassReverse / http://localhost:3005/
    
    # Handle static files directly (optional optimization)
    ProxyPass /_next/static/ !
    ProxyPass /favicon.ico !
    
    # Logging
    ErrorLog /usr/local/apache/logs/kdcuganda.org_error.log
    CustomLog /usr/local/apache/logs/kdcuganda.org_access.log combined
</VirtualHost>

<VirtualHost *:443>
    ServerName kdcuganda.org
    ServerAlias www.kdcuganda.org
    DocumentRoot /home/n767765/kdcuganda.org
    
    # SSL Configuration (if you have SSL)
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/kdcuganda.org.crt
    SSLCertificateKeyFile /etc/ssl/private/kdcuganda.org.key
    
    # Proxy all requests to Next.js app
    ProxyPreserveHost On
    ProxyPass / http://localhost:3005/
    ProxyPassReverse / http://localhost:3005/
    
    # Handle static files directly
    ProxyPass /_next/static/ !
    ProxyPass /favicon.ico !
    
    # Logging
    ErrorLog /usr/local/apache/logs/kdcuganda.org_ssl_error.log
    CustomLog /usr/local/apache/logs/kdcuganda.org_ssl_access.log combined
</VirtualHost>
```

#### Option B: Using .htaccess (Simpler approach)

The `.htaccess` file should be in your project root `/home/n767765/kdcuganda.org/` (where your website files are):

```bash
# You're already in the right directory
cd /home/n767765/kdcuganda.org

# Edit the existing .htaccess file
nano .htaccess
```

Add this content:
```apache
RewriteEngine On

# Enable mod_proxy if available
<IfModule mod_proxy.c>
    # Proxy all requests to Next.js app running on port 3005
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ http://localhost:3005/$1 [P,L]
    
    # Set proper headers
    ProxyPreserveHost On
    ProxyPassReverse / http://localhost:3005/
</IfModule>

# Fallback if mod_proxy is not available
<IfModule !mod_proxy.c>
    # Redirect to the application port
    RewriteRule ^(.*)$ http://kdcuganda.org:3005/$1 [R=302,L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>
```

### Step 6: Configure Firewall (Important!)

```bash
# Open port 3005 for your Next.js app
firewall-cmd --permanent --add-port=3005/tcp
firewall-cmd --reload

# Check if the port is open
firewall-cmd --list-ports
```

### Step 7: Start Your Application

```bash
# Navigate back to your project
cd /home/n767765/kdcuganda.org

# Start the application
pm2 start ecosystem.config.js

# Check if it's running
pm2 status
pm2 logs kingdom-deliverance
```

### Step 8: Test Your Deployment

```bash
# Test locally on the server
curl http://localhost:3005

# Check if the service is running
netstat -tlnp | grep 3005
```

## 🔧 Troubleshooting Commands

### Check Application Status
```bash
# PM2 status
pm2 status
pm2 logs kingdom-deliverance

# Check if port 3005 is in use
netstat -tlnp | grep 3005
lsof -i :3005

# Check Apache status
systemctl status httpd
```

### Restart Services
```bash
# Restart your Next.js app
pm2 restart kingdom-deliverance

# Restart Apache
systemctl restart httpd

# Restart the entire PM2 process
pm2 kill
pm2 start ecosystem.config.js
```

### View Logs
```bash
# Application logs
pm2 logs kingdom-deliverance

# Apache logs
tail -f /usr/local/apache/logs/kdcuganda.org_error.log
tail -f /usr/local/apache/logs/kdcuganda.org_access.log

# System logs
journalctl -u httpd -f
```

## 🌐 Environment Variables

Create your production environment file:

```bash
cd /home/n767765/kdcuganda.org
nano .env.local
```

Add your production variables:
```env
NODE_ENV=production
PORT=3005
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCIAL_FACEBOOK=your_facebook_url
NEXT_PUBLIC_SOCIAL_INSTAGRAM=your_instagram_url
NEXT_PUBLIC_SOCIAL_YOUTUBE=your_youtube_url
```

## 🔄 Future Updates

To update your website:

```bash
# SSH to your server
ssh root@173.231.241.161

# Navigate to project
cd /home/n767765/kdcuganda.org

# Pull latest changes
git fetch origin
git reset --hard origin/main

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart the application
pm2 restart kingdom-deliverance

# Check status
pm2 status
```

## 🚨 Quick Fix for Current 404 Issue

Since you're already on the server, run these commands immediately:

```bash
# Make sure you're in the right directory (your web root)
cd /home/n767765/kdcuganda.org

# Build the application
npm run build

# Install PM2 if not already installed
npm install -g pm2

# Start the application
pm2 start npm --name "kingdom-deliverance" -- start

# Check if it's running
pm2 status

# Test locally
curl http://localhost:3005

# Update your .htaccess file (it's in the same directory)
nano .htaccess
```

**Replace the content of `.htaccess` with:**
```apache
RewriteEngine On

# Proxy all requests to Next.js app running on port 3005
ProxyPreserveHost On
ProxyPass / http://localhost:3005/
ProxyPassReverse / http://localhost:3005/

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>
```

## 📞 CWP Specific Notes

- **CWP Panel:** Access at `http://173.231.241.161:2030`
- **File Manager:** Use CWP's file manager or SSH
- **Apache Config:** Located in `/usr/local/apache/conf/`
- **Domain Config:** Managed through CWP's domain management
- **SSL:** Can be configured through CWP's SSL section

## ✅ Success Indicators

Your deployment is successful when:
- `pm2 status` shows your app as "online"
- `curl http://localhost:3005` returns HTML content
- Your domain `kdcuganda.org` loads without 404 errors
- Apache logs show successful proxy requests

---

**Next Steps:** Run the quick fix commands above, then test your website. If you encounter any issues, check the logs using the troubleshooting commands provided.