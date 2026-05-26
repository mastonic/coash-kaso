// CSRF protection utilities
import crypto from 'crypto';

// For beta: simple token-based CSRF protection
// For production: consider using double-submit cookies or synchronizer tokens

const csrfTokenMap = new Map<string, { token: string; createdAt: number }>();

// Token validity: 1 hour
const TOKEN_VALIDITY = 60 * 60 * 1000;

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function storeCSRFToken(sessionId: string, token: string): void {
  csrfTokenMap.set(sessionId, {
    token,
    createdAt: Date.now(),
  });
}

export function verifyCSRFToken(sessionId: string, providedToken: string): boolean {
  const storedEntry = csrfTokenMap.get(sessionId);

  if (!storedEntry) {
    return false;
  }

  // Check if token is expired
  const now = Date.now();
  if (now - storedEntry.createdAt > TOKEN_VALIDITY) {
    csrfTokenMap.delete(sessionId);
    return false;
  }

  // Verify token matches
  return storedEntry.token === providedToken;
}

export function getCSRFTokenFromRequest(request: Request): string | null {
  // Check header first (XHR requests)
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) {
    return headerToken;
  }

  // For forms, we'd need to parse the body - not implemented here
  // In production, use a proper CSRF library
  return null;
}

// Cleanup expired tokens periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];

    csrfTokenMap.forEach((entry, key) => {
      if (now - entry.createdAt > TOKEN_VALIDITY) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => csrfTokenMap.delete(key));
  }, 60 * 1000); // Cleanup every minute
}
