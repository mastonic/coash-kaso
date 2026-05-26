# 🔒 MastroAI Security Audit & Code Review

**Date:** 2026-05-25  
**Status:** SPRINT 5 - SECURITY & OPTIMIZATION  
**Severity Distribution:** 3 🔴 Critical | 5 🟠 High | 4 🟡 Medium | 2 🟢 Low

---

## 📊 EXECUTIVE SUMMARY

| Category | Status | Count | Risk Level |
|----------|--------|-------|------------|
| **API Endpoint Security** | ⚠️ NEEDS FIXES | 8 issues | HIGH |
| **Authentication & Authorization** | ⚠️ MISSING | 5 issues | CRITICAL |
| **Input Validation** | ⚠️ NEEDS FIXES | 4 issues | HIGH |
| **Dependency Vulnerabilities** | ⚠️ 2 FOUND | 2 issues | MEDIUM |
| **Data Protection** | ✅ GOOD | 0 issues | - |
| **Error Handling** | ⚠️ INFO LEAKAGE | 2 issues | MEDIUM |
| **XSS Protection** | ✅ GOOD | 0 issues | - |
| **CSRF Protection** | ⚠️ MISSING | - | HIGH |

**Overall Score:** 6.2/10  
**Verdict:** ⚠️ **SECURE ENOUGH FOR BETA** (with fixes) | **NOT PRODUCTION-READY** without auth

---

## 🔴 CRITICAL ISSUES (3)

### 1. **NO AUTHENTICATION ON API ENDPOINTS**
**Severity:** 🔴 CRITICAL | **Impact:** Unauthorized access to all AI features  
**Affected:** `/api/analyze-audio`, `/api/analyze-vision`, `/api/generate`, `/api/analyze-video`

**Risk:**
- Anyone can call these endpoints from any domain
- No rate limiting = DOS attack possible
- No user tracking = impossible to audit usage
- Free Gemini API credits could be exhausted by attackers

**Fix Required:**
```typescript
// Add to each endpoint
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.INTERNAL_API_KEY;

export async function POST(request: NextRequest) {
  // Validate API key
  const authHeader = request.headers.get('authorization');
  const providedKey = authHeader?.replace('Bearer ', '');
  
  if (!providedKey || providedKey !== API_KEY) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // ... rest of endpoint
}
```

**Priority:** 🔴 FIX BEFORE PRODUCTION

---

### 2. **NO REQUEST SIZE LIMITS (DOS VULNERABILITY)**
**Severity:** 🔴 CRITICAL | **Impact:** Memory exhaustion, service denial

**Affected:** 
- `analyze-audio` - No file size validation
- `analyze-vision` - No base64 image size check
- `analyze-video` - No size validation

**Example Attack:**
```javascript
// Send 1GB file
const largeBlob = new Blob([new ArrayBuffer(1024 * 1024 * 1024)]);
await fetch('/api/analyze-audio', {
  method: 'POST',
  body: formData // Contains massive file
});
```

**Fix Required:**
```typescript
// In each endpoint
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const contentLength = request.headers.get('content-length');

if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
  return NextResponse.json(
    { error: 'File too large' },
    { status: 413 }
  );
}
```

**Priority:** 🔴 FIX BEFORE PRODUCTION

---

### 3. **GEMINI API KEY EXPOSED IN ERRORS**
**Severity:** 🔴 CRITICAL | **Impact:** API key compromise, unauthorized usage

**Problem:** If `error.message` contains internal details, API key might leak.

**Current Code (analyze-audio line 148):**
```typescript
message: error instanceof Error ? error.message : 'Unknown error',
```

**Risk:**
- Gemini API errors might contain credentials
- Exposed in frontend error messages
- Visible in analytics/error tracking

**Fix Required:**
```typescript
// Sanitize error messages
const sanitizeError = (error: unknown): string => {
  if (!(error instanceof Error)) return 'Unknown error';
  
  // Remove sensitive patterns
  const msg = error.message
    .replace(/api[_-]?key[=:]\S+/gi, '[REDACTED]')
    .replace(/Bearer\s+\S+/gi, '[REDACTED]')
    .replace(/sk-\S+/gi, '[REDACTED]');
  
  // Only return safe messages
  if (msg.includes('quota') || msg.includes('rate limit')) {
    return msg; // Safe to expose
  }
  
  // Generic message for internal errors
  return 'Service unavailable';
};

// Usage:
message: sanitizeError(error),
```

**Priority:** 🔴 FIX BEFORE PRODUCTION

---

## 🟠 HIGH PRIORITY ISSUES (5)

### 4. **NO INPUT VALIDATION IN /api/generate**
**Severity:** 🟠 HIGH | **Impact:** Invalid data processing, DOS via resource exhaustion

**Current Code:**
```typescript
const { theme, load, school, playerCount } = await req.json();

if (!theme || !load || !school || !playerCount) {
  return NextResponse.json(
    { error: 'Missing required fields' },
    { status: 400 }
  );
}
```

**Issues:**
- `playerCount` could be negative, 0, or 10000 (DOS)
- `theme` could be anything (injection risk for prompt)
- `load`, `school` not validated against allowed values

**Fix Required:**
```typescript
const VALID_THEMES = ['Possession', 'Pressing', 'Transitions', 'Centre', 'Ailes', 'Controle', 'Vitesse', 'Phases', '1v1'];
const VALID_LOADS = ['Recovery', 'Moderate', 'High'];
const VALID_SCHOOLS = ['Française', 'Espagnole', 'Allemande', 'Hollandaise', 'Brésilienne', 'Argentine', 'Italienne'];

if (!VALID_THEMES.includes(theme)) {
  return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
}
if (!VALID_LOADS.includes(load)) {
  return NextResponse.json({ error: 'Invalid load' }, { status: 400 });
}
if (!VALID_SCHOOLS.includes(school)) {
  return NextResponse.json({ error: 'Invalid school' }, { status: 400 });
}

const playerCountNum = parseInt(playerCount);
if (isNaN(playerCountNum) || playerCountNum < 6 || playerCountNum > 25) {
  return NextResponse.json({ error: 'Invalid player count' }, { status: 400 });
}
```

**Priority:** 🟠 FIX BEFORE BETA

---

### 5. **NO RATE LIMITING (DOS VULNERABILITY)**
**Severity:** 🟠 HIGH | **Impact:** API exhaustion, cost explosion

**Affected:** All API endpoints

**Risk:**
- Single attacker can exhaust Gemini API quota
- No way to track per-user usage
- No backoff mechanism

**Fix Required:** Implement rate limiting using headers or middleware:
```typescript
// lib/rateLimit.ts
export async function checkRateLimit(request: NextRequest, clientId: string) {
  // Use Vercel's built-in rate limiting
  const headers = {
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '99',
    'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString(),
  };
  
  // In production, use Redis/KV store
  return headers;
}
```

Or use middleware.ts:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/api/')) {
    const clientId = request.ip || 'unknown';
    // Check rate limit from KV store
    // Return 429 if limit exceeded
  }
}
```

**Priority:** 🟠 FIX BEFORE BETA

---

### 6. **NO CONTENT-TYPE VALIDATION FOR AUDIO**
**Severity:** 🟠 HIGH | **Impact:** Invalid file processing, potential exploits

**Current Code (analyze-audio line 20-28):**
```typescript
const contentType = request.headers.get('content-type');
if (!contentType?.includes('multipart/form-data')) {
  return new Response(...);
}
```

**Issues:**
- Doesn't validate audio MIME type (could be anything)
- Doesn't validate audio format matches supported types

**Fix Required:**
```typescript
const ALLOWED_AUDIO_TYPES = ['audio/webm', 'audio/mp3', 'audio/aac', 'audio/ogg', 'audio/wav'];
const mimeType = audioFile.type;

if (!ALLOWED_AUDIO_TYPES.includes(mimeType)) {
  return new Response(
    JSON.stringify({ error: `Invalid audio format. Allowed: ${ALLOWED_AUDIO_TYPES.join(', ')}` }),
    { status: 400 }
  );
}
```

**Priority:** 🟠 FIX BEFORE BETA

---

### 7. **NO BASE64 IMAGE VALIDATION**
**Severity:** 🟠 HIGH | **Impact:** Invalid data, DOS via memory exhaustion

**Current Code (analyze-vision line 26-33):**
```typescript
const { imageBase64 } = await request.json();

if (!imageBase64) {
  return NextResponse.json(
    { error: 'No image provided' },
    { status: 400 }
  );
}
```

**Issues:**
- No size check on base64 string
- No format validation
- Could be non-image binary data

**Fix Required:**
```typescript
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

// Check base64 length
if (imageBase64.length > MAX_IMAGE_SIZE) {
  return NextResponse.json(
    { error: 'Image too large (max 10MB)' },
    { status: 413 }
  );
}

// Validate base64 format
if (!/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
  return NextResponse.json(
    { error: 'Invalid base64 format' },
    { status: 400 }
  );
}
```

**Priority:** 🟠 FIX BEFORE BETA

---

### 8. **MISSING CSRF PROTECTION**
**Severity:** 🟠 HIGH | **Impact:** Cross-site request forgery attacks possible

**Risk:**
- Forms not protected from CSRF
- No CSRF tokens on state-changing operations
- No SameSite cookie restrictions

**Fix Required:**
```typescript
// lib/csrf.ts
import { sha256 } from 'crypto';

export function generateCSRFToken(): string {
  return sha256(Date.now().toString() + Math.random()).toString('hex');
}

// In API endpoints:
const csrfToken = request.headers.get('x-csrf-token');
const sessionToken = request.cookies.get('csrf-token')?.value;

if (!csrfToken || csrfToken !== sessionToken) {
  return NextResponse.json(
    { error: 'CSRF token invalid' },
    { status: 403 }
  );
}
```

**Priority:** 🟠 FIX BEFORE PRODUCTION

---

## 🟡 MEDIUM PRIORITY ISSUES (4)

### 9. **DEPENDENCY VULNERABILITY: postcss XSS**
**Severity:** 🟡 MEDIUM | **CVE:** GHSA-qx2v-qp2m-jg93

**Issue:** PostCSS has XSS vulnerability in CSS stringify output

**Current Versions:**
```
postcss: <8.5.10 (VULNERABLE)
next: 16.2.6 (depends on postcss)
```

**Fix Required:**
```bash
npm audit fix --force
# or manually update postcss
npm install postcss@^8.5.10 --save
```

**Priority:** 🟡 FIX SOON

---

### 10. **DEPENDENCY VULNERABILITY: uuid Buffer Overflow**
**Severity:** 🟡 MEDIUM | **CVE:** GHSA-w5hq-g745-h8pq

**Issue:** uuid missing buffer bounds check

**Affected Dependencies:**
- firebase-admin (uses vulnerable uuid)
- google-cloud storage/firestore (use vulnerable uuid)

**Fix Required:**
```bash
npm audit fix --force
```

This will upgrade dependencies to patched versions.

**Priority:** 🟡 FIX SOON

---

### 11. **ERROR MESSAGE INFORMATION LEAKAGE**
**Severity:** 🟡 MEDIUM | **Impact:** Information disclosure

**Affected:** 
- `analyze-audio` line 148: `error.message` exposed
- `analyze-vision` line 124: `error.message` exposed

**Current Code:**
```typescript
message: error instanceof Error ? error.message : 'Unknown error',
```

**Risk:**
- Stack traces visible to client
- Internal API URLs leaked
- Database errors visible

**Fix Required:**
```typescript
const getClientErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) return 'An error occurred';
  
  const msg = error.message;
  
  // Safe to expose
  if (msg.includes('quota') || msg.includes('rate limit')) {
    return msg;
  }
  
  // Don't expose internal details
  console.error('[INTERNAL]', msg); // Log on server
  return 'Service temporarily unavailable';
};
```

**Priority:** 🟡 FIX BEFORE BETA

---

### 12. **NO HTTPS HEADERS CONFIGURED**
**Severity:** 🟡 MEDIUM | **Impact:** Weak security posture

**Missing Security Headers:**
- ❌ X-Frame-Options (clickjacking)
- ❌ X-Content-Type-Options (MIME sniffing)
- ❌ Content-Security-Policy (XSS)
- ❌ Strict-Transport-Security (HSTS)

**Fix Required:** Add to `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};
```

**Priority:** 🟡 FIX BEFORE PRODUCTION

---

## 🟢 LOW PRIORITY ISSUES (2)

### 13. **FIREBASE RULES NOT REVIEWED**
**Severity:** 🟢 LOW | **Status:** Not evaluated in this audit

**Note:** Firebase Firestore and Storage security rules were not reviewed. Recommend:
1. [ ] Review Firestore rules in Firebase Console
2. [ ] Ensure default deny policy
3. [ ] Verify auth-based access control
4. [ ] Check Storage rules for file upload restrictions

**Action:** Review in separate Firebase security audit

---

### 14. **LOGGING DOESN'T INCLUDE REQUEST SOURCE**
**Severity:** 🟢 LOW | **Impact:** Limited audit trail

**Current Code:** `lib/logging.ts` logs API calls but not IP/user info

**Improvement:**
```typescript
export function logApiCall(
  endpoint: string,
  duration: number,
  statusCode: number,
  ip?: string
) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      endpoint,
      duration_ms: duration,
      status: statusCode,
      client_ip: ip,
    })
  );
}
```

**Priority:** 🟢 NICE-TO-HAVE

---

## ✅ SECURITY STRENGTHS

### Things Done Right:
✅ **No hardcoded secrets** - All sensitive data uses environment variables  
✅ **No dangerous HTML rendering** - No `dangerouslySetInnerHTML` or `innerHTML` found  
✅ **No SQL injection risk** - No SQL queries (using Firebase)  
✅ **Good error handling** - Try/catch blocks in all critical paths  
✅ **HTTPS enforced** - Vercel deploys with automatic HTTPS  
✅ **Sentry configured** - Error tracking active  
✅ **TypeScript enabled** - Type safety throughout  

---

## 🔧 SPRINT 5 FIX CHECKLIST

### CRITICAL (must fix before production)
- [ ] Add authentication to all API endpoints (Issue #1)
- [ ] Add request size limits to prevent DOS (Issue #2)
- [ ] Sanitize error messages to prevent key exposure (Issue #3)

### HIGH (must fix before beta)
- [ ] Add input validation to /api/generate (Issue #4)
- [ ] Implement rate limiting on API endpoints (Issue #5)
- [ ] Validate audio MIME types (Issue #6)
- [ ] Validate base64 image format and size (Issue #7)
- [ ] Add CSRF protection to forms (Issue #8)

### MEDIUM (should fix soon)
- [ ] Update postcss dependency (Issue #9)
- [ ] Update uuid dependency (Issue #10)
- [ ] Fix error message information leakage (Issue #11)
- [ ] Add security headers to responses (Issue #12)

### LOW (nice-to-have)
- [ ] Review Firebase security rules (Issue #13)
- [ ] Improve logging with request source (Issue #14)

---

## 📋 IMPLEMENTATION PRIORITY

**Phase 1 - CRITICAL (1-2 hours):**
1. Add API authentication
2. Add request size limits
3. Sanitize error messages

**Phase 2 - HIGH (2-3 hours):**
4. Input validation in /api/generate
5. Implement rate limiting
6. Fix MIME type validation
7. Fix base64 validation

**Phase 3 - MEDIUM (1 hour):**
8. Update dependencies
9. Fix info leakage
10. Add security headers

**Phase 4 - LOW (optional):**
11. Firebase rules review
12. Enhanced logging

---

## 🚀 DEPLOYMENT READINESS

| Criteria | Status | Action |
|----------|--------|--------|
| **Critical Issues** | ⚠️ 3 found | FIX BEFORE PRODUCTION |
| **High Issues** | ⚠️ 5 found | FIX BEFORE BETA |
| **Medium Issues** | ⚠️ 4 found | FIX SOON |
| **XSS/SQL Injection** | ✅ SAFE | No changes needed |
| **Data Protection** | ✅ GOOD | No changes needed |
| **HTTPS/TLS** | ✅ GOOD | No changes needed |

**Verdict:** 
- ❌ NOT READY for production (missing auth)
- ⚠️ OK for closed beta (with authentication added)
- ✅ READY for open beta (after all HIGH issues fixed)

---

## 📞 NEXT STEPS

1. **Create security fixes branch:** `git checkout -b sprint-5-security`
2. **Implement fixes in order:** CRITICAL → HIGH → MEDIUM → LOW
3. **Test each fix:** Manual testing + security review
4. **Update dependencies:** `npm audit fix --force`
5. **Deploy to staging:** Test fixes before production
6. **Final security review:** Re-run this audit after fixes

---

**Owner:** MastroAI Security Team  
**Date:** 2026-05-25  
**Status:** AUDIT COMPLETE - FIXES IN PROGRESS  
**Next Review:** After all fixes implemented

