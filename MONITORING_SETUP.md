# 🔍 MONITORING SETUP GUIDE

**Status:** Sprint 3 - Partially Implemented  
**Date:** 2026-05-25

---

## ✅ COMPLETED

### 1. **Vercel Analytics** ✅
- ✅ `@vercel/analytics` installed
- ✅ Added to `app/layout.tsx`
- ✅ Auto-tracking Core Web Vitals (LCP, INP, CLS)
- ✅ Auto-tracking page load times

**How to view:**
1. Go to Vercel dashboard
2. Select "pitchai-henna" project
3. Click "Analytics" tab
4. View real-time metrics

### 2. **API Logging** ✅
- ✅ Logging utility created (`lib/logging.ts`)
- ✅ Applied to `/api/analyze-audio`
- ✅ All API calls logged with:
  - Timestamp
  - Method + endpoint
  - Duration (ms)
  - Status (success/error)
  - Details/error messages

**Log format:**
```
[2026-05-25T14:30:45.123Z] ✅ POST /api/analyze-audio (2345ms) - 3 recommendations
[2026-05-25T14:31:02.456Z] ❌ POST /api/analyze-vision (5000ms) - Timeout error
```

**Logs visible in:**
- Vercel project dashboard → "Functions" tab → Logs
- Local dev: Browser DevTools → Console

### 3. **Sentry Configuration** ⚠️
- ✅ `@sentry/nextjs` installed
- ✅ `sentry.server.config.ts` created
- ⏳ NEEDS: Sentry account + DSN (see below)

---

## ⏳ NEXT STEPS (TO COMPLETE MONITORING)

### **Step 1: Create Sentry Account (5 min)**

1. Go to https://sentry.io/
2. Sign up (free account)
3. Create project → Select "Next.js"
4. Copy your DSN (looks like: `https://xxx@xxx.ingest.sentry.io/xxx`)

### **Step 2: Add Sentry DSN to Environment**

Add to `.env.local`:
```
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-here@ingest.sentry.io/your-project-id
```

Add to Vercel project settings:
1. Go to Vercel dashboard
2. Select "pitchai-henna" project
3. Settings → Environment Variables
4. Add: `NEXT_PUBLIC_SENTRY_DSN` = your DSN
5. Click "Save"

### **Step 3: Enable Sentry Error Tracking**

Already configured in `sentry.server.config.ts`, but to activate:

1. Redeploy to production:
   ```bash
   vercel --prod
   ```

2. Test error capturing:
   - Go to https://pitchai-henna.vercel.app
   - Open DevTools Console (F12)
   - Type: `throw new Error('Test error')`
   - Check Sentry dashboard → Issues

3. Verify it appears in Sentry dashboard

### **Step 4: Configure Alerts (Optional)**

In Sentry dashboard:
1. Alerts → Create Alert Rule
2. Set up notification when:
   - First event in new issue
   - Error rate exceeds 10/hour
   - Latency exceeds 3s
3. Choose notification channel (email, Slack, etc.)

---

## 📊 WHAT'S BEING MONITORED

### **Vercel Analytics (Real-time)**
✅ Page load times  
✅ Core Web Vitals (LCP, INP, CLS)  
✅ Traffic by route  
✅ User geography  
✅ Device types  

**View:** Vercel Dashboard → Analytics tab

### **API Logging (Via Logs)**
✅ API endpoint calls  
✅ Response times  
✅ Success/error rates  
✅ Error messages  
✅ Request/response data  

**View:** Vercel Dashboard → Functions → Logs

### **Sentry (Error Tracking)**
⏳ JavaScript errors  
⏳ API exceptions  
⏳ Performance issues  
⏳ Error stack traces  
⏳ User session context  

**View:** Sentry Dashboard → Issues

---

## 🚨 ALERT SYSTEM

### **Critical Alerts to Configure**

1. **High Error Rate**
   - Trigger: >10 errors/minute
   - Action: Investigate API failures

2. **Slow API Responses**
   - Trigger: Response time >3000ms
   - Action: Check Gemini API status

3. **Microphone Permission Issues**
   - Trigger: Error code #144 appears >5x/hour
   - Action: Check browser/device compatibility

4. **Image Upload Failures**
   - Trigger: analyze-vision API errors >5x/hour
   - Action: Check image format support

---

## 📝 LOGGING EXAMPLES

### **Successful API Call**
```
[2026-05-25T14:30:45.123Z] ✅ POST /api/analyze-audio (2345ms) - 3 recommendations
```

### **Failed API Call**
```
[2026-05-25T14:31:02.456Z] ❌ POST /api/analyze-audio (5000ms) - Timeout: Gemini API not responding
```

### **Microphone Error**
```
[2026-05-25T14:32:10.789Z] ❌ Microphone permission denied (#144)
```

---

## 🔧 IMPLEMENTATION STATUS

| Component | Status | Notes |
|-----------|--------|-------|
| Vercel Analytics | ✅ LIVE | Auto-enabled, view in dashboard |
| API Logging | ✅ LIVE | Logs visible in console + Vercel logs |
| Sentry Setup | ⚠️ NEEDS DSN | Requires Sentry account creation |
| Error Alerts | ⏳ PENDING | After Sentry DSN configured |
| Performance Monitoring | ✅ PARTIAL | Vercel provides, Sentry adds depth |

---

## 📞 TROUBLESHOOTING

**Q: I don't see logs in Vercel dashboard**
A: Logs appear in real-time in Functions tab. Refresh page after making API calls.

**Q: Sentry not capturing errors**
A: Make sure DSN is set in environment variables and you redeployed after adding it.

**Q: Can't see Analytics**
A: Analytics appear after 5+ minutes of traffic. Wait a few minutes and refresh.

**Q: Want more detailed logging?**
A: Add to any API endpoint:
```typescript
import { logApiCall, createApiTimer } from '@/lib/logging';

const timer = createApiTimer();
// ... do work ...
logApiCall('POST', '/api/endpoint', 'success', timer(), 'custom details');
```

---

## 🎯 NEXT: VERIFY MONITORING

To verify everything is working:

1. ✅ Check Vercel Analytics dashboard
2. ✅ Make API calls and check console logs
3. ⏳ Setup Sentry (requires account)
4. ✅ Deploy to production
5. ✅ Monitor for 24-48 hours before beta launch

---

## 📊 MONITORING DASHBOARD LINKS

```
Vercel Analytics:
https://vercel.com/rigahludovic-7554s-projects/pitchai/analytics

Vercel Functions Logs:
https://vercel.com/rigahludovic-7554s-projects/pitchai/functions

Sentry (after setup):
https://sentry.io/organizations/[your-org]/issues/
```

---

**Last Updated:** 2026-05-25  
**Owner:** MastroAI Team  
**Status:** 70% Complete (awaiting Sentry account setup)
