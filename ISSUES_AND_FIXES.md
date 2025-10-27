# Campaign Manager - Critical Issues & Fixes Needed

## Executive Summary

The codebase shows significant architectural misalignment. It's built as a **Next.js** app (client-side patterns) but needs to be **React Router** (server-side). Several features won't work in production.

---

## 🔴 CRITICAL ISSUES

### 1. **Architecture Mismatch**
- **Problem**: Using Next.js patterns (`'use client'`, client-side Supabase) in a React Router app
- **Impact**: Features won't work, components can't access servers
- **Status**: Must fix

### 2. **Missing API Routes**
Components reference missing endpoints:
- `/api/products/lookup` 
- `/api/links/create-from-url`
- `/api/bulk/operations`
- **Impact**: These features will 404

### 3. **Database Disconnect**
- Supabase schema exists for merchants/links
- Prisma is configured for sessions
- No connection between Shopify sessions and merchant data
- **Impact**: Can't associate links with shops

### 4. **Client-Side Only Logic**
- Fetching products from client
- Creating links from client
- No server-side data loading
- **Impact**: Security issues, no server data access

### 5. **Hardcoded Demo Data**
- All pages use `demo-merchant` instead of real data
- No integration with Shopify session data
- **Impact**: App shows fake data

---

## ⚠️ WHAT WORKS

✅ Shopify authentication (`app/shopify.server.ts`)
✅ Navigation structure
✅ Component UI (Polaris components)
✅ QR code generation library
✅ Database schema (Supabase)

---

## 🔧 RECOMMENDED FIXES

### Priority 1: Fix Architecture

#### Option A: Full React Router Migration (Recommended)
- Convert all components to server-loaded
- Create server-side loaders for all data
- Remove client-side API calls
- Use Shopify's `authenticate.admin()` for shop data

#### Option B: Hybrid Approach
- Keep client components for UI
- Create proper API route handlers in React Router
- Add server actions for mutations

### Priority 2: Connect Shopify to Database

1. **Store merchant on install**
```typescript
// In afterAuth hook
await prisma.merchant.upsert({
  where: { shop: session.shop },
  create: { shop: session.shop, accessToken: session.accessToken },
  update: { accessToken: session.accessToken }
})
```

2. **Use Prisma instead of Supabase**
   - Remove Supabase dependency
   - Add Prisma schema for merchants/links
   - Use Repeatable migrations

### Priority 3: Fix API Routes

Create proper React Router routes:
```
app/routes/api.products.lookup.tsx  → Loader for product lookup
app/routes/api.links.create.tsx     → Action for link creation
app/routes/api.bulk.operations.tsx  → Loader for bulk operations
```

### Priority 4: Real Data Flow

Replace hardcoded `demo-merchant`:
```typescript
// In loader
const { session } = await authenticate.admin(request)
const merchant = await prisma.merchant.findUnique({ 
  where: { shop: session.shop } 
})
return { merchant }
```

---

## 📋 IMMEDIATE ACTION ITEMS

1. ✅ **Fixed**: Docker build (Prisma migrations)
2. ⏳ **Next**: Choose architecture (Full React Router vs Hybrid)
3. ⏳ **Then**: Create Prisma schema for merchants/links
4. ⏳ **Then**: Implement proper loaders in routes
5. ⏳ **Then**: Remove Supabase OR convert to server-side

---

## 🎯 RECOMMENDED PATH FORWARD

**Option 1: Full React Router** (Best for Shopify apps)
- Pros: Proper server-side, security, performance
     
- Cons: More refactoring needed
- Effort: 2-3 days

**Option 2: Add API Routes Layer**
- Keep components mostly as-is
- Add server-side route handlers
- Pros: Less refactoring
- Cons: Some features remain limited
- Effort: 1 day

---

## 📝 NOTES

- The UI/UX design is solid
- The database schema is well-designed
- The Shopify integration setup is correct
- Main issue: Client/server boundary isn't respected

---

## Recommendation

**Choose Option 1** - Full React Router migration. It's the proper pattern for Shopify apps, gives you full server access, better security, and aligns with React Router best practices.

I can help implement any of these fixes. What would you like to prioritize?

