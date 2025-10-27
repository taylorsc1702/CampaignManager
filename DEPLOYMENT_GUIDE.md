# Deployment Guide - Cheapest Functional Setup

## 🏆 Recommended: Railway.app ($5/month)

**Why Railway?**
- ✅ $5/month starter tier with $5 credit = FREE for first month
- ✅ Includes PostgreSQL database (no separate DB cost)
- ✅ Always-on (essential for Shopify webhooks)
- ✅ Auto-deploy from GitHub
- ✅ Already configured in your repo (`railway.json`)
- ✅ Handles HTTPS automatically
- ✅ No cold starts (apps don't spin down)

**What you get:**
- Web service hosting
- PostgreSQL database (1GB included)
- Automatic SSL/TLS
- Custom domain support
- 500 hours/month of usage (basically unlimited for one app)

---

## 📋 Setup Steps (Railway)

### 1. Sign up at [railway.app](https://railway.app)
- Use GitHub OAuth for easy access

### 2. Create New Project
```bash
# Railway will auto-detect railway.json
```

### 3. Add PostgreSQL Service
```
Dashboard → New → Database → PostgreSQL
```

### 4. Get Database URL
```bash
# Railway provides this automatically as DATABASE_URL
# Connect your app service to database service
```

### 5. Set Environment Variables
Add these in Railway dashboard:
```env
# Shopify (from your .env.local)
SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
SCOPES=read_products,write_discounts,etc
SHOPIFY_APP_URL=https://your-app.railway.app

# Database (auto-provided by Railway)
DATABASE_URL=postgresql://user:pass@host:port/db

# Node
NODE_ENV=production
```

### 6. Deploy
```bash
# Railway auto-deploys on git push to main
git push origin main
```

---

## 💰 Cost Breakdown

### Option 1: Railway ($5/month)
- App hosting: Included
- Database: Included (1GB)
- **Total: $5/month** after free credit
- Notification: $5-$10/month after scaling

### Option 2: Render.com (FREE with limitations)
❌ **Not recommended for Shopify apps**
- Free tier spins down after inactivity
- Webhooks will fail
- No PostgreSQL on free tier
- **Would need: App ($7/month) + DB ($7/month) = $14/month**

### Option 3: Fly.io
- Free tier available but complex
- Need separate database (~$3-5/month)
- More setup required
- **Total: ~$3-5/month**

### Option 4: Supabase + Any host
- Supabase PostgreSQL: FREE (generous limits)
- Vercel/Railway: FREE tier
- **Total: $0** but complex setup
- Issues: Supabase is client-focused, not ideal for server apps

---

## 🎯 Final Recommendation

**Use Railway.app - $5/month**

Why it wins:
1. Already configured (`railway.json` exists)
2. Simplest setup (database included)
3. Reliable for production
4. Best for Shopify apps (always-on)
5. Cost-effective for what you get

**Alternative if $5 is too much:**
Use Supabase (free PostgreSQL) + Fly.io (free hosting)
- More work to set up
- Slightly less reliable
- Free initially, then ~$3/month later

---

## 🚀 Quick Start Commands

### Deploy to Railway
```bash
# 1. Install Railway CLI (optional)
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add PostgreSQL
railway add

# 5. Deploy
railway up
```

### Or use GitHub integration
1. Connect GitHub repo to Railway
2. Railway auto-detects settings
3. Add environment variables
4. Deploy!

---

## 📝 Required Environment Variables

Make sure these are set in Railway:

```env
# Shopify
SHOPIFY_API_KEY
SHOPIFY_API_SECRET
SCOPES
SHOPIFY_APP_URL

# Database (auto from Railway)
DATABASE_URL

# Environment
NODE_ENV=production
```

---

## ✅ What Works Automatically

Once deployed:
- ✅ HTTPS via Railway domain
- ✅ Automatic deploys on git push
- ✅ Webhook endpoints (always-on)
- ✅ Database migrations run on deploy
- ✅ Health checks configured

---

## 🔧 Need to Update?

Just push to GitHub:
```bash
git add .
git commit -m "Update app"
git push origin main
# Railway auto-deploys
```

---

## 💡 Pro Tips

1. **Start with Railway** - Get it working first
2. **Monitor usage** - Railway shows billing in dashboard
3. **Scale later** - $5 handles plenty of traffic for MVP
4. **Free month** - $5 credit = free first month
5. **Custom domain** - Add your domain later (free)

---

## ❓ Need Help?

- Railway docs: https://docs.railway.app
- Their Discord: Very active, helpful community
- Shopify hosting guide: They actually recommend Railway for apps

Want me to help set this up? I can guide you through the Railway deployment.

