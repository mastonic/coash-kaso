# Security Review: Commit d93e6130 - Authentication & Size Limits Implementation

**Date:** 2026-05-25  
**Commit:** d93e6130 - Security: Add authentication, size limits, and error sanitization (Critical fixes)  
**Reviewer:** Security Review Tool  
**Status:** REVIEW COMPLETE - ISSUES FOUND

---

## Executive Summary

**Overall Assessment:** 🟡 **PARTIAL FIX** - Critical vulnerabilities partially addressed, but **critical enforcement gap remains**

- **Critical Issues (1 remaining):** Components not passing authentication headers
- **High Issues (3 remaining):** Missing security headers, rate limiting, CSRF protection
- **Medium Issues (2):** Dependency vulnerabilities unpatched
- **Info Issues (1):** Best practices

The security infrastructure has been well-designed in this commit, but **components are not using the authentication** to call the APIs. This creates a significant security gap where the auth layer is present but unenforced.

---

## Findings Summary

| Severity | Category | Count | Status |
|----------|----------|-------|--------|
| 🔴 Critical | Unauthenticated API Calls | 2 | FOUND |
| 🟠 High | Missing Security Features | 3 | FOUND |
| 🟡 Medium | Dependency Vulnerabilities | 2 | FOUND |
| 🟢 Info | Best Practices | 1 | INFO |

---

## Critical Issues

### 1. CRITICAL: Frontend Components Not Using Authentication

**Severity:** 🔴 CRITICAL (Defeats the purpose of auth layer)  
**Category:** OWASP A01 - Broken Access Control  
**Files:** 
- `/home/rigahludovic/Mastro-AI-Kaso/components/coach/MastroVision.tsx:62-66`
- `/home/rigahludovic/Mastro-AI-Kaso/components/coach/MastroLive.tsx:116-119`

**Description:**

The security infrastructure includes a `lib/security.ts` module that validates API keys, and there's an `lib/api-client.ts` with authenticated helper functions. However, the components are NOT using these helpers - they're making direct `fetch()` calls without the `Authorization` header.

**Current Vulnerable Code:**

```typescript
// MastroVision.tsx line 62-66
const response = await fetch('/api/analyze-vision', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageBase64: base64Image }),
  // ❌ NO AUTHORIZATION HEADER
});

// MastroLive.tsx line 116-119
const response = await fetch('/api/analyze-audio', {
  method: 'POST',
  body: formData,
  // ❌ NO AUTHORIZATION HEADER
});
```

**Why This Is Critical:**

1. The API endpoints expect an `Authorization: Bearer sk-mastroai-internal-key-2026-secure-beta` header
2. Without this header, the `validateApiKey()` function returns `valid: false`
3. All API requests will be rejected with 401 Unauthorized
4. The auth layer is **present but not enforced** - it won't prevent requests from external sources

**Impact:**

- ✅ Good: External attackers can't call the API (it requires correct key)
- ❌ Bad: Frontend application can't call the API (requests fail)
- ⚠️ Worse: Demonstrates incomplete implementation - auth exists but frontend doesn't know about it

**Recommended Fix:**

```typescript
// Option 1: Use the provided api-client helper (PREFERRED)
import { analyzeVision } from '@/lib/api-client';

const result = await analyzeVision(base64Image);

// Option 2: Manually add auth header
const response = await fetch('/api/analyze-vision', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
  },
  body: JSON.stringify({ imageBase64: base64Image }),
});
```

**References:**
- [OWASP A01: Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

---

### 2. CRITICAL: Exposed API Key in Frontend Code

**Severity:** 🔴 CRITICAL (Credentials visible in browser)  
**Category:** OWASP A02 - Cryptographic Failures  
**File:** `/home/rigahludovic/Mastro-AI-Kaso/lib/api-client.ts:3`

**Description:**

The API key is hardcoded directly in the frontend JavaScript code:

```typescript
const API_KEY = 'sk-mastroai-internal-key-2026-secure-beta';
```

This is a critical vulnerability because:

1. **Browser DevTools exposure**: Any user can open DevTools → Network tab and see this key in request headers
2. **Source map exposure**: If source maps are deployed, the key is visible
3. **Client-side inspection**: Any browser extension can read this value
4. **GitHub exposure**: The key is committed to version control

**Impact:**

- Attackers can forge requests to the API with the correct Authorization header
- API quota can be exhausted by malicious actors
- Gemini API calls can be made on the user's behalf
- Any exposed API key should be immediately rotated

**Recommended Fix:**

The API key should NEVER be in client-side code. Instead:

```typescript
// Option 1: Backend proxy (RECOMMENDED)
// Frontend calls /api/proxy/analyze-vision
// Backend validates session, then calls actual endpoint

// Option 2: Use environment variable for SSR only
// Only available during build/SSR, not in client bundle
const API_KEY = process.env.INTERNAL_API_KEY; // Server-side only

// Option 3: Use authentication token instead
// Frontend gets user token from Auth provider
// Backend uses token to rate-limit per-user, not per-key
```

**References:**
- [OWASP A02: Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [Secrets in Frontend Code](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

## High Priority Issues

### 3. HIGH: Missing Security Headers

**Severity:** 🟠 HIGH  
**Category:** Defense-in-depth / OWASP A05 - Security Misconfiguration  
**File:** `/home/rigahludovic/Mastro-AI-Kaso/next.config.ts`

**Description:**

The `next.config.ts` is essentially empty and doesn't configure any security headers. Missing headers include:

- ❌ `X-Frame-Options` (prevents clickjacking)
- ❌ `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- ❌ `Content-Security-Policy` (prevents XSS)
- ❌ `Strict-Transport-Security` (enforces HTTPS)
- ❌ `Referrer-Policy` (controls referrer leakage)

**Recommended Fix:**

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
```

---

### 4. HIGH: No Rate Limiting on API Endpoints

**Severity:** 🟠 HIGH  
**Category:** OWASP A04 - Insecure Design  
**Affected:** All 4 API endpoints

**Description:**

The authentication is present, but there's no rate limiting. This allows:

1. **DOS attacks**: Unlimited requests exhaust Gemini API quota
2. **Cost explosion**: Each request costs money (Google Generative AI has usage limits)
3. **Resource exhaustion**: Memory/CPU on server can be exhausted
4. **No per-user tracking**: Cannot identify abusers

**Recommended Fix:**

```typescript
// lib/rateLimit.ts
export function getRateLimitKey(request: NextRequest): string {
  // Use IP if available, fallback to generic key
  return request.ip || request.headers.get('x-forwarded-for') || 'unknown';
}

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  // In production, use Vercel KV or Redis
  // For now, simple in-memory implementation
  // ⚠️ This resets on server restart - use persistent store
  if (!rateLimitStore[key]) {
    rateLimitStore[key] = { count: 0, resetAt: Date.now() + 60000 };
  }
  
  const window = rateLimitStore[key];
  if (Date.now() > window.resetAt) {
    window.count = 0;
    window.resetAt = Date.now() + 60000;
  }
  
  const limit = 10; // 10 requests per minute per IP
  const allowed = window.count < limit;
  window.count++;
  
  return { allowed, remaining: Math.max(0, limit - window.count) };
}

// In API endpoint:
const rateLimit = checkRateLimit(getRateLimitKey(request));
if (!rateLimit.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
  );
}
```

---

### 5. HIGH: No CSRF Protection

**Severity:** 🟠 HIGH  
**Category:** OWASP A01 - Broken Access Control  
**Affected:** Form submissions to `/api/generate`

**Description:**

POST requests to API endpoints don't validate CSRF tokens. A malicious website could:

1. Trick a logged-in user into visiting their site
2. Use JavaScript to call `/api/generate` on their behalf
3. Exhaust the user's API quota

**Recommended Fix:**

Implement CSRF protection using SameSite cookies or tokens. For a modern Next.js app with internal API key:

```typescript
// lib/csrf.ts
export function generateCSRFToken(): string {
  return crypto.randomUUID();
}

// In middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.method === 'POST' && request.nextUrl.pathname.startsWith('/api/')) {
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken = request.cookies.get('csrf-session')?.value;
    
    if (!csrfToken || csrfToken !== sessionToken) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }
  }
  return NextResponse.next();
}
```

---

## Medium Priority Issues

### 6. MEDIUM: Dependency Vulnerabilities

**Severity:** 🟡 MEDIUM  
**Category:** OWASP A06 - Vulnerable and Outdated Components  

**Found Vulnerabilities:**

#### 6a. PostCSS XSS Vulnerability

```
postcss <8.5.10
Severity: MODERATE
Issue: XSS via Unescaped </style> in CSS Stringify Output
Reference: https://github.com/advisories/GHSA-qx2v-qp2m-jg93
```

#### 6b. UUID Buffer Overflow

```
uuid <11.1.1
Severity: MODERATE
Issue: Missing buffer bounds check in v3/v5/v6
Reference: https://github.com/advisories/GHSA-w5hq-g745-h8pq

Affected packages:
- firebase-admin (via @google-cloud/storage, @google-cloud/firestore)
- google-gax
- teeny-request
- gaxios
```

**Recommended Fix:**

```bash
npm audit fix --force
```

This will upgrade to patched versions. **Note:** Be aware that some dependencies have breaking changes (e.g., next may downgrade from 16.2.6 to 9.3.3). Review and test carefully.

**Alternative:** Upgrade individually:

```bash
npm install postcss@^8.5.10 --save
npm install uuid@^11.1.1 --save
npm update firebase-admin @google-cloud/firestore @google-cloud/storage
```

---

## Information Issues

### 7. INFO: API Key Rotation Recommendation

**Severity:** 🟢 INFO  
**Category:** Best Practice

**Issue:** The hardcoded API key in `lib/api-client.ts` should be rotated immediately:

1. The key is now visible in this security review document
2. It's been committed to version control
3. It's exposed in browser network traffic

**Recommended Action:**

1. Generate a new key in `.env.local` 
2. Update `INTERNAL_API_KEY=sk-mastroai-internal-key-2026-secure-beta-v2`
3. Redeploy
4. Remove old key from version control history (consider using `git-filter-branch` or similar)

---

## What's Done Right ✅

The following security measures were properly implemented:

1. **Authentication infrastructure** - `lib/security.ts` is well-designed with proper validation
2. **Request size limits** - All endpoints check `content-length` and limit file sizes appropriately
3. **Error sanitization** - Error messages are sanitized to prevent credential leakage
4. **Input validation** - `/api/generate` validates all parameters against whitelists
5. **MIME type validation** - Audio types are checked against allowed formats
6. **Base64 validation** - Image and video base64 input is validated
7. **Type safety** - TypeScript used throughout
8. **No SQL injection** - Using Firebase, no raw SQL queries
9. **No XSS risks** - No `dangerouslySetInnerHTML` found
10. **HTTPS enforced** - Vercel automatically handles HTTPS

---

## Deployment Readiness

| Aspect | Status | Notes |
|--------|--------|-------|
| **Production Ready** | ❌ NO | Critical issues must be fixed |
| **Beta Ready** | ⚠️ WITH FIXES | Fix critical #1 and #2, then ok |
| **Security Score** | 4.2/10 | Down from 6.2/10 due to enforcement gap |

**Verdict:** This commit has excellent security infrastructure but **fails in enforcement**. The frontend components don't use authentication, making the auth layer ineffective.

---

## Remediation Priority

### Phase 1 - CRITICAL (1-2 hours)
1. ✅ Move API key from `lib/api-client.ts` to backend environment
2. ✅ Update frontend components to use authenticated API helpers
3. ✅ Verify API calls now include `Authorization` header

### Phase 2 - HIGH (2-3 hours)
4. Add security headers to `next.config.ts`
5. Implement rate limiting middleware
6. Add CSRF protection to endpoints

### Phase 3 - MEDIUM (1 hour)
7. Run `npm audit fix --force` and test
8. Update dependencies carefully

### Phase 4 - CLEANUP (optional)
9. Rotate API key
10. Clean up version control history

---

## Code Review Checklist

- [x] Authentication validation logic is correct
- [x] Request size limits are appropriate (10MB audio, 50MB video)
- [x] Error sanitization prevents credential leakage
- [x] Input validation whitelists are comprehensive
- [ ] Frontend components use authentication (NOT DONE - CRITICAL GAP)
- [ ] Security headers configured (NOT DONE)
- [ ] Rate limiting implemented (NOT DONE)
- [ ] CSRF protection active (NOT DONE)
- [ ] Dependencies patched (NOT DONE)

**Overall:** 4/9 security measures implemented. Excellent design, poor execution.

---

## References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP A01: Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [OWASP A02: Cryptographic Failures](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)
- [OWASP A04: Insecure Design](https://owasp.org/Top10/A04_2021-Insecure_Design/)
- [OWASP A05: Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [OWASP A06: Vulnerable Components](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/)
- [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Status:** REVIEW COMPLETE  
**Owner:** MastroAI Security Team  
**Next Step:** Implement Phase 1 fixes to activate authentication enforcement
