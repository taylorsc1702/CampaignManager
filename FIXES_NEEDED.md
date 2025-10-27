# Critical Fixes Needed for Railway + Supabase

## 🔴 Immediate Issues

### 1. Components Use 'use client' (Next.js Pattern)
**All components** have `'use client'` directive - this won't work in React Router
- Remove from all 8 components
- Convert to server-loaded components

### 2. Supabase Configuration Wrong
**File:** `app/lib/supabase.ts`
**Issues:**
- Uses `NEXT_PUBLIC_` prefix (Next.js pattern)
- Creates client-side instances
- Need server-side service role client for React Router

### 3. No Server-Side Data Loading
**Routes don't pass merchant data** - components use hardcoded demo data
- Need loaders to fetch merchant from Supabase
- Need to pass shop data from Shopify session

### 4. Shopify Session Not Connected to Supabase
- When app installs, need to create/update merchant record
- Currently no connection between Shopify sessions and Supabase merchants

### 5. Missing Environment Variables
Need proper env var names for React Router (not Next.js)

---

## ✅ Fix Plan

### Step 1: Fix Supabase Configuration
Create server-side Supabase client using service role key

### Step 2: Remove 'use client' from Components
Convert all 8 components to work without client directive

### Step 3: Create Server Loaders
Add proper loaders to routes that fetch merchant data

### Step 4: Connect Shopify Auth to Supabase
Store merchant on app install

### Step 5: Create API Routes
Build proper React Router routes for the API endpoints

### Step 6: Fix Environment Variables
Update to use proper React Router env vars

---

## 🚀 Let's Start Fixing!

I'll tackle these systematically. Should I proceed with the fixes?

