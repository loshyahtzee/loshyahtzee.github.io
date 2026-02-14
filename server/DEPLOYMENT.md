# Server Deployment Guide

This guide covers deploying the Yahtzee WebSocket server to various platforms.

## Prerequisites

- Node.js 14+ installed locally (for testing)
- GitHub account (for deployment)
- Account on chosen hosting platform

## 🎯 Deployment Options

### 1. Render.com (Recommended - Free Tier)

**Pros**: Free tier, automatic HTTPS, easy setup, auto-deploys from GitHub

**Steps**:

1. **Sign up** at [render.com](https://render.com)

2. **Create Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub account
   - Select your yahtzee-multiplayer repository
   
3. **Configure Service**:
   ```
   Name: yahtzee-server
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: server
   Build Command: npm install
   Start Command: npm start
   ```

4. **Choose Plan**:
   - Select "Free" (spins down after 15 min of inactivity)
   - Or "Starter" ($7/month) for always-on

5. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment to complete
   - Copy your URL: `https://yahtzee-server.onrender.com`

6. **Get WebSocket URL**:
   - Replace `https://` with `wss://`
   - Example: `wss://yahtzee-server.onrender.com`

7. **Update Frontend**:
   - Edit `game.js` line 8
   - Set `WEBSOCKET_URL: 'wss://yahtzee-server.onrender.com'`

**Notes**:
- Free tier sleeps after 15 min inactivity (first connection takes ~30 seconds to wake)
- Auto-redeploys on GitHub commits
- Includes SSL certificate automatically

---

### 2. Railway.app

**Pros**: Generous free tier ($5 credit/month), easy setup, automatic SSL

**Steps**:

1. **Sign up** at [railway.app](https://railway.app)

2. **New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configuration**:
   - Railway auto-detects Node.js
   - Set root directory: Click settings → change to `/server`
   - Environment variables: None needed

4. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete

5. **Get URL**:
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Copy the domain (e.g., `yahtzee-server.up.railway.app`)

6. **WebSocket URL**:
   - Format: `wss://yahtzee-server.up.railway.app`
   - Update in `game.js`

**Notes**:
- $5 free credit per month
- Sleeps after inactivity (free tier)
- Auto-deploys on push

---

### 3. Glitch.com

**Pros**: Completely free, instant deployment, web-based editor

**Steps**:

1. **Sign up** at [glitch.com](https://glitch.com)

2. **Import Project**:
   - Click "New Project" → "Import from GitHub"
   - Paste repository URL
   - Or click "glitch-hello-node" and manually copy files

3. **Setup** (if not importing):
   - Create `package.json` and `server.js` in Glitch editor
   - Copy contents from your repository's `server/` folder

4. **Configuration**:
   - Glitch auto-installs dependencies
   - Auto-starts server
   - No configuration needed!

5. **Get URL**:
   - Look at top-left for your project name
   - URL format: `https://your-project-name.glitch.me`
   - WebSocket: `wss://your-project-name.glitch.me`

6. **Update Frontend**:
   ```javascript
   WEBSOCKET_URL: 'wss://your-project-name.glitch.me'
   ```

**Notes**:
- Completely free
- Sleeps after 5 min inactivity
- Limited to 4000 requests/hour
- Great for testing/demos

---

### 4. Heroku

**Pros**: Reliable, well-documented

**Steps**:

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create App**:
   ```bash
   cd server
   heroku create yahtzee-server-yourname
   ```

4. **Add Procfile**:
   ```
   web: node server.js
   ```

5. **Deploy**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

6. **Get URL**:
   - `wss://yahtzee-server-yourname.herokuapp.com`

**Notes**:
- Free tier removed in 2022
- Paid plans start at $7/month
- Very reliable

---

### 5. Self-Hosted (VPS/Cloud Server)

**Pros**: Full control, no limits, can run 24/7

**Requirements**: 
- VPS (DigitalOcean, Linode, AWS EC2, etc.)
- Ubuntu 20.04+ or similar
- Basic Linux knowledge

**Steps**:

1. **SSH into server**:
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Install PM2** (process manager):
   ```bash
   sudo npm install -g pm2
   ```

4. **Clone repository**:
   ```bash
   git clone https://github.com/yourusername/yahtzee-multiplayer.git
   cd yahtzee-multiplayer/server
   npm install
   ```

5. **Start with PM2**:
   ```bash
   pm2 start server.js --name yahtzee-server
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx** (reverse proxy with SSL):
   ```bash
   sudo apt install nginx certbot python3-certbot-nginx
   ```

   Create `/etc/nginx/sites-available/yahtzee`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/yahtzee /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Get SSL Certificate**:
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

8. **WebSocket URL**: `wss://your-domain.com`

**Notes**:
- Requires domain name
- Best for production/high-traffic
- Full control over resources
- ~$5-10/month for basic VPS

---

## 🔧 Testing Your Deployment

### 1. Test WebSocket Connection

Use this simple HTML file:

```html
<!DOCTYPE html>
<html>
<body>
    <h1>WebSocket Test</h1>
    <div id="status">Connecting...</div>
    <script>
        const ws = new WebSocket('wss://your-server-url.com');
        
        ws.onopen = () => {
            document.getElementById('status').innerHTML = '✅ Connected!';
            ws.send(JSON.stringify({ type: 'test' }));
        };
        
        ws.onerror = () => {
            document.getElementById('status').innerHTML = '❌ Connection failed';
        };
        
        ws.onmessage = (e) => {
            console.log('Received:', e.data);
        };
    </script>
</body>
</html>
```

### 2. Test with curl

```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://your-server-url.com
```

Should return `101 Switching Protocols`

---

## 📊 Monitoring

### Render.com
- Dashboard shows logs in real-time
- Metrics tab for resource usage
- Auto-alerts on crashes

### Railway.app
- Deployments tab for build logs
- Metrics in dashboard
- Usage tracking

### PM2 (Self-hosted)
```bash
pm2 status           # Check status
pm2 logs yahtzee-server  # View logs
pm2 monit            # Real-time monitoring
```

---

## 🚨 Troubleshooting

**WebSocket connection fails**:
- Check server is running: `curl https://your-url.com`
- Verify WebSocket URL starts with `wss://` (not `https://`)
- Check firewall allows WebSocket connections
- Test locally first: `ws://localhost:8080`

**"Failed to connect" in frontend**:
- Ensure `game.js` has correct WebSocket URL
- Check browser console for errors
- Verify server is deployed and running

**Players can't join room**:
- Check server logs for errors
- Verify room code is correct
- Make sure server hasn't crashed

**Free tier sleeping**:
- Render/Railway: First connection takes ~30 seconds
- Glitch: Wakes up in ~10 seconds
- Consider upgrading to paid tier for always-on

---

## 💡 Recommendations

**For Development/Testing**: Glitch.com
**For Production (Free)**: Render.com
**For Production (Paid)**: Railway.app or Self-hosted
**For Enterprise**: Self-hosted on dedicated server

---

## 🔒 Security Notes

- All recommended platforms provide SSL/TLS automatically
- No API keys or secrets needed for basic setup
- Consider adding rate limiting for production
- Monitor for abuse if publicly accessible

---

## 📝 Summary Comparison

| Platform | Free Tier | SSL | Auto-Deploy | Sleep Time | Best For |
|----------|-----------|-----|-------------|------------|----------|
| Render | ✅ | ✅ | ✅ | 15 min | Production (free) |
| Railway | ✅ ($5 credit) | ✅ | ✅ | Yes | Production (paid) |
| Glitch | ✅ | ✅ | ✅ | 5 min | Development |
| Self-hosted | ❌ | Manual | Manual | Never | High-traffic |

---

**Questions?** Open an issue on GitHub or check the main README.md
