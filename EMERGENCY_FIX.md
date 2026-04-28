# 🚨 Emergency Fix for kdcuganda.org

## Current Issues Detected:
1. ❌ `next: command not found` - Dependencies not properly installed
2. ❌ Multiple duplicate PM2 processes for kdcuganda.org
3. ❌ 500 errors and chunk loading failures
4. ❌ MIME type errors on JavaScript files

## 🔧 Immediate Fix - Run These Commands

Connect to your server and run these commands **one by one**:

```bash
# 1. Navigate to your project
cd /home/n767765/kdcuganda.org

# 2. Stop ONLY the duplicate kdcuganda processes (keeping bclimax running)
pm2 stop kdc-uganda
pm2 delete kdc-uganda
pm2 stop kingdom-deliverance
pm2 delete kingdom-deliverance

# 3. Clean up old build files
rm -rf node_modules
rm -rf .next
rm -f package-lock.json

# 4. Fresh install of dependencies
npm install

# 5. Build the application
npm run build

# 6. Start with PM2 (single instance)
pm2 start npm --name "kdcuganda" -- start

# 7. Save PM2 configuration
pm2 save

# 8. Test if it's working
curl http://localhost:3005

# 9. Check PM2 status (should show bclimax + kdcuganda only)
pm2 status

# 10. View logs if there are issues
pm2 logs kdcuganda --lines 50
```

## 🔍 Verify Each Step

After **Step 4** (npm install), verify:
```bash
# Check if next is installed
./node_modules/.bin/next --version
# Should show: 14.2.35
```

After **Step 5** (npm run build), verify:
```bash
# Check if .next folder exists
ls -la .next
# Should show build output
```

After **Step 6** (pm2 start), verify:
```bash
# Should show TWO apps running: bclimax + kdcuganda
pm2 status
# Should show:
# bclimax  | online
# kdcuganda | online
```

## 🧪 Test Your Website

After completing all steps:

1. **Test locally on server:**
   ```bash
   curl -I http://localhost:3005
   # Should return: HTTP/1.1 200 OK
   ```

2. **Test from browser:**
   - Visit: https://kdcuganda.org
   - Should load without 404 or 500 errors

3. **Check browser console:**
   - Press F12 in browser
   - Should have no red errors

## 🔄 If Still Having Issues

### Check Node.js Version
```bash
node --version
# Should be v18 or higher
```

If Node.js is too old:
```bash
# Install Node.js 18 LTS
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
```

### Check Apache Proxy Modules
```bash
# Verify proxy modules are enabled
httpd -M | grep proxy
# Should show: proxy_module, proxy_http_module
```

If not enabled:
```bash
# Enable proxy modules
nano /usr/local/apache/conf/httpd.conf
# Uncomment these lines:
# LoadModule proxy_module modules/mod_proxy.so
# LoadModule proxy_http_module modules/mod_proxy_http.so

# Restart Apache
systemctl restart httpd
```

### Check .htaccess File
```bash
cd /home/n767765/kdcuganda.org
cat .htaccess
```

Should contain:
```apache
RewriteEngine On
ProxyPreserveHost On
ProxyPass / http://localhost:3005/
ProxyPassReverse / http://localhost:3005/
```

If not, update it:
```bash
nano .htaccess
# Paste the content above
# Save: Ctrl+X, Y, Enter
```

## 📊 Monitor Your Application

```bash
# Real-time logs
pm2 logs kdcuganda

# Monitor CPU/Memory
pm2 monit

# Restart if needed
pm2 restart kdcuganda

# Stop if needed
pm2 stop kdcuganda
```

## 🆘 Common Error Solutions

### Error: "EADDRINUSE: address already in use :::3005"
```bash
# Find what's using port 3005
lsof -i :3005
# Kill the process
kill -9 <PID>
# Restart your app
pm2 restart kdcuganda
```

### Error: "Cannot find module 'next'"
```bash
# Reinstall dependencies
cd /home/n767765/kdcuganda.org
rm -rf node_modules package-lock.json
npm install
```

### Error: "Permission denied"
```bash
# Fix permissions
chown -R n767765:n767765 /home/n767765/kdcuganda.org
chmod -R 755 /home/n767765/kdcuganda.org
```

## ✅ Success Indicators

Your deployment is successful when:
- ✅ `pm2 status` shows TWO apps: "bclimax" and "kdcuganda" both as "online"
- ✅ `curl http://localhost:3005` returns HTML content
- ✅ https://kdcuganda.org loads without errors
- ✅ Browser console has no red errors
- ✅ All pages load correctly (home, about, contact, etc.)

---

**After running these commands, your website should be fully functional with the new modern design!**

**Note:** We're keeping your bclimax website running and only fixing the kdcuganda.org deployment.
