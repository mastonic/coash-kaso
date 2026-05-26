# 🔍 SPRINT 3: MONITORING & ERROR TRACKING

**Objective:** Add production observability to catch and diagnose issues before users report them

**Timeline:** ~1 hour

**Status:** IN PROGRESS

---

## 📋 CHECKLIST

### **Phase 1: Error Tracking with Sentry (25 min)**

Sentry captures JavaScript errors, API failures, and performance issues automatically.

- [ ] **Install Sentry SDK**
  ```bash
  npm install @sentry/react @sentry/nextjs
  ```

- [ ] **Configure Sentry in app/layout.tsx**
  - Add DSN to .env.local (get from sentry.io)
  - Initialize Sentry client
  - Set release version

- [ ] **Verify error capture**
  - Test: Deliberately throw error in dev
  - Check Sentry dashboard for captured error
  - Verify source maps working

### **Phase 2: API Logging (20 min)**

Log all API calls for debugging and monitoring.

- [ ] **Add logging middleware**
  - Log all POST requests to /api/*
  - Log response times
  - Log error responses
  - Log API parameters (sanitized)

- [ ] **Log formats**
  ```
  [2026-05-25 14:30:45] POST /api/analyze-audio
  Duration: 2.3s
  Status: 200
  Source: MastroAI Live
  ```

- [ ] **Log aggregation**
  - Logs go to Vercel Logs (default)
  - Can integrate with external service later

### **Phase 3: Vercel Analytics (10 min)**

Built-in Vercel analytics for performance monitoring.

- [ ] **Verify @vercel/analytics installed**
  ```bash
  npm install @vercel/analytics
  ```

- [ ] **Add Analytics to app/layout.tsx**
  ```typescript
  import { Analytics } from '@vercel/analytics/react';
  ```

- [ ] **Enable in Vercel Dashboard**
  - Go to Vercel project settings
  - Enable Web Analytics
  - Set up Core Web Vitals tracking

### **Phase 4: Alert Configuration (5 min)**

Set up alerts for critical errors.

- [ ] **Create Slack webhook** (if using Slack)
- [ ] **Configure Sentry alerts**
  - Alert on first error
  - Alert on error spike (>10 errors/min)
  - Alert on API latency (>3s)
  
- [ ] **Test alert system**
  - Trigger test error
  - Verify notification received

---

## 📝 IMPLEMENTATION DETAILS

### Sentry Setup

```typescript
// app/layout.tsx

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
});
```

### API Logging

```typescript
// app/api/analyze-audio/route.ts

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log('[API] analyze-audio started');
    
    // ... API logic ...
    
    const duration = Date.now() - startTime;
    console.log(`[API] analyze-audio completed in ${duration}ms`);
    
    return response;
  } catch (error) {
    console.error('[API] analyze-audio failed:', error);
    Sentry.captureException(error);
    return Response.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
```

### Vercel Analytics

```typescript
// app/layout.tsx

import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🔧 ENVIRONMENT VARIABLES NEEDED

Add to `.env.local` and Vercel project settings:

```
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
```

---

## ✅ SUCCESS CRITERIA

Sprint 3 is DONE when:

- [ ] Sentry installed and errors captured
- [ ] API logging implemented
- [ ] Vercel Analytics enabled
- [ ] Alert system configured
- [ ] Test error successfully captured
- [ ] Dashboard shows real-time metrics

---

## 📊 WHAT YOU'LL BE ABLE TO MONITOR

**In Sentry Dashboard:**
- ❌ JavaScript errors (with stack traces)
- ❌ API failures
- ⚠️ Performance issues
- 🔔 Error trends

**In Vercel Dashboard:**
- 📈 Page load times
- 🎯 Core Web Vitals (LCP, INP, CLS)
- 🚀 Deployment analytics
- 💾 Function execution times

**In Logs:**
- 📝 API call details
- ⏱️ Response times
- 🔍 Request/response bodies (sanitized)

---

## 🚀 NEXT SPRINT

After Sprint 3:
→ **Sprint 4: Beta Documentation** (45 min)
- Create testing guide for beta users
- Setup feedback channel
- Add help documentation

---

**Owner:** MastroAI Team  
**Deadline:** Before beta launch  
**Difficulty:** Medium (requires third-party account setup)
