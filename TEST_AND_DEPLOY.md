# Testing and Deployment Guide

## 🧪 Step 1: Test Locally First

### Prerequisites
You need these environment variables set in `.env.local`:

```env
# Shopify
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_secret
SCOPES=write_discounts,read_orders,read_products,write_products
SHOPIFY_APP_URL=http://localhost:3000

# Supabase (from your Supabase dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (for Prisma sessions)
DATABASE_URL=file:./dev.db

# Environment
NODE_ENV=development
```

### Get Supabase Keys
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Settings → API
4. Copy "Project URL" → `SUPABASE_URL`
5. Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`

### Run Locally
```bash
# Install dependencies (if not done)
npm install

# Run database migrations
npx prisma migrate dev

# Start local dev server
npm run dev
```

Your app will run at: `http://localhost:3000`

### Test the App
1. Open the URL in your Shopify admin (will run through Shopify CLI tunnel)
2. Install the app
3. Check Dashboard - should show data
4. Check Links page - should list links

---

## 🚀 Step 2: Deploy to Railway

### Prerequisites
- Railway account: [railway.app](https://railway.app)
- GitHub repo pushed (your code is already there ✅)

### Deployment Steps

#### 1. Connect Problem to Railway
```bash
# Option A: Web Interface
# - Go to railway.app
# - Click "New Project"
# - "Deploy from GitHub repo"
# - Select your CampaignManager repo
```

```bash
# Option B: CLI
npm i -g @railway/cli
railway login
railway init
railway up
```

#### 2. Add PostgreSQL Database
In Railway dashboard:
- Click "+ New" → "Database" → "PostgreSQL"
- Railway auto-provides `DATABASE_URL` environment variable

#### 3. Set Environment Variables
In Railway, go to your service → "Variables" tab:

```env
# Shopify (from Shopify Partners dashboard)
SHOPIFY_API_KEY=your_key
SHOPIFY_API_SECRET=your_secret
SCOPES=write_discounts,read_orders,read_products,write_products
SHOPIFY_APP_URL=https://your-app-url.railway.app

# Supabase (same as local)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (auto-provided by Railway PostgreSQL)
DATABASE_URL=postgresql://... (from Railway)

# Environment
NODE_ENV=production
```

**Important:** Get `SHOPIFY_APP_URL` after first deploy:
1. Deploy once
2. Railway gives you a URL like `your-app.railway.app`
3. Add that to Railway env vars
4. Redeploy

#### 4. Update Shopify App URL
In your Shopify Partners dashboard:
1. Go to your app
2. "App setup" → "App URL"
3. Update to your Railway URL
4. Update "Allowed redirection URLs"

#### 5. Deploy!
```bash
git push origin main
# Railway auto-deploys on push!
```

Or in Railway dashboard:
- Click "Deploy"

---

## ✅ Step 3: Test After Deployment

### 1. Install App in Shopify
1. Open Shopify admin
2. Apps → App development
3. Find your app → Install
4. Go through OAuth flow

### 2. Test Dashboard
- Should load with real data
- Stats should display

### 3. Test Links Page
- Should show links list
- Create a new link to test

### 4. Check Database
Go to Railway → PostgreSQL → "Connect" → Open database
- Should see merchants table with your shop
- Should see sessions table with session data

---

## 🐛 Troubleshooting

### Dashboard shows "Merchant not found"
**Fix:** The `afterAuth` hook should auto-create merchant. Check:
1. Railway logs for errors
2. Supabase table has your merchant
3. Reinstall the app

### "Missing Supabase environment variables"
**Fix:** Add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Railway env vars

### "Cannot connect to database"
**Fix:** 
1. Make sure PostgreSQL service is running in Railway
2. Check `DATABASE_URL` is set correctly
3. Run migrations: Railway runs them on deploy (from your start script)

### Links page shows empty
**Fix:** 
- This is normal if you haven't created links yet
- Create a link to test

### Shopify auth fails
**Fix:**
1. Check `SHOPIFY_APP_URL` matches your Railway URL
2. Update in Shopify Partners dashboard
3. Make sure `redirect_urls` includes your Railway URL

---

## 📊 Check Railway Logs

In Railway dashboard:
- Click your service
- "Logs" tab
- Watch for errors

Common things to check:
- Database connection
- Supabase connection
- Shopify API calls
- Any error messages

---

## 🎯 Quick Test Checklist

Before deploying:
- [ ] Local testing works
- [ ] Environment variables set in Railway
- [ ] Database service added in Railway
- [ ] Shopify app URL updated
- [ ] Code pushed to GitHub

After deploying:
- [ ] Railway shows "Deployed" status
- [ ] Install app in Shopify
- [ ] Dashboard loads
- [ ] Links page loads
- [ ] Can view data

---

## 🚨 Important Notes

1. **Free Tier Limits:**
   - Railway: $5 free credit/month
   - Supabase: Free tier has generous limits
   - First month is basically free!

2. **Security:**
   - Never commit `.env.local` to git
   - Use Railway environment variables
   - Service role key is secret!

3. **Database:**
   - Railway PostgreSQL persists data
   - Supabase also persists your app data
   - Both survive redeploys

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ App installs without errors
- ✅ Dashboard shows real data
- ✅ Links page loads
- ✅ No errors in Railway logs
- ✅ Merchant record exists in Supabase

---

Ready to deploy? Start with local testing, then push to Railway!

Want help with any specific step?

