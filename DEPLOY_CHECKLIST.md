# 🚀 DEPLOY TO PRODUCTION CHECKLIST

## PRE-DEPLOY VERIFICATION

- [x] Git status clean (all changes committed)
  - Commit: `9d635593` ✅
  - Status: main branch ready

- [x] Build passes locally
  - TypeScript: 0 errors ✅
  - Build time: 6.1s ✅
  - Routes: 14/14 ✅

- [x] Environment variables ready
  - NEXT_PUBLIC_FIREBASE_API_KEY ✅
  - GEMINI_API_KEY ✅
  - (Verified in .env.local)

- [ ] Vercel project configured
  - Project: pitchai-henna (already live)
  - URL: https://pitchai-henna.vercel.app

---

## DEPLOYMENT OPTIONS

### **Option A: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI if not already
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### **Option B: Claude Code Skill**
```bash
/vercel:deploy prod
```

### **Option C: Git Push (if GitHub remote configured)**
```bash
git push origin main
# Vercel auto-deploys on push
```

### **Option D: Manual via Vercel Dashboard**
```
1. Go to https://vercel.com
2. Select "pitchai-henna" project
3. Find latest commit (9d635593)
4. Click "Deploy"
```

---

## POST-DEPLOY SMOKE TEST

After deployment completes, verify:

```
☐ Production URL loads (no 404)
☐ Landing page displays correctly
☐ Title shows: "MastroAI - Assistant Tactique & Pilotage Club"
☐ API endpoints respond:
   ☐ GET / → 200
   ☐ GET /session → 200
   ☐ GET /video → 200
   ☐ GET /dashboard → 200
   ☐ POST /api/generate → responds (not 500)
☐ No console errors in browser
☐ Performance: page loads in <3s
```

---

## EXPECTED DEPLOYMENT TIME

- Vercel compile: ~30-60s
- DNS propagation: instant (vercel.app domain)
- **Total:** ~2-3 minutes

---

## IF DEPLOYMENT FAILS

Check:
1. Build output in Vercel dashboard
2. Environment variables set in Vercel project settings
3. Edge functions/regions (should default to auto)
4. Check: Settings → Build & Development → Build Command
   - Should be: `next build`
5. Check: Settings → Environment Variables
   - Both GEMINI and Firebase keys present

---

## ROLLBACK (if needed)

Vercel keeps last 10 deployments. To rollback:
1. Go to Vercel dashboard
2. Find previous working deployment
3. Click "Promote to Production"
4. Takes ~1 minute

---

**Status:** Ready for deployment  
**Last tested:** 2026-05-25  
**Owner:** MastroAI Team
