import { NextRequest, NextResponse } from 'next/server';

// SECURITY NOTE: For beta, we rely on rate limiting and input validation instead of API keys.
// API keys should never be exposed in client-side code.
// Once we move to production with open access, implement user authentication (JWT, sessions).

// Validate that request comes from same origin (prevents CSRF)
export function validateOrigin(request: NextRequest): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Allow requests from same origin during development and production
  if (process.env.NODE_ENV === 'development') {
    return { valid: true }; // Allow all in development
  }

  // In production, accept requests from same domain or no origin (forms)
  if (!origin && !referer) {
    return { valid: true }; // Forms without origin header
  }

  if (origin && origin.includes(host || '')) {
    return { valid: true }; // Same origin
  }

  console.warn(`[SECURITY] Request from unauthorized origin: ${origin}`);
  return { valid: false, error: 'Unauthorized origin' };
}

// Check request size limit
export function checkRequestSize(contentLength: string | null, maxBytes: number): { valid: boolean; error?: string } {
  if (!contentLength) {
    return { valid: true }; // Unknown size, allow through
  }

  const sizeBytes = parseInt(contentLength);
  if (isNaN(sizeBytes)) {
    return { valid: false, error: 'Invalid content-length header' };
  }

  if (sizeBytes > maxBytes) {
    return {
      valid: false,
      error: `Request too large (${(sizeBytes / 1024 / 1024).toFixed(1)}MB). Max: ${(maxBytes / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  return { valid: true };
}

// Sanitize error messages before sending to client
export function sanitizeErrorForClient(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'An error occurred';
  }

  const msg = error.message.toLowerCase();

  // Safe messages to expose
  const safePatterns = [
    /quota/i,
    /rate.?limit/i,
    /timeout/i,
    /invalid.?(audio|image|format)/i,
    /too.?large/i,
    /unsupported/i,
  ];

  const isSafe = safePatterns.some(pattern => pattern.test(error.message));
  if (isSafe) {
    return error.message;
  }

  // Log full error server-side for debugging
  console.error('[INTERNAL ERROR]', error.message, error.stack);

  // Return generic message to client
  return 'Service temporarily unavailable. Please try again.';
}

// Create standardized API error response
export function apiError(message: string, statusCode: number = 500) {
  return NextResponse.json({ error: message }, { status: statusCode });
}

// Create standardized API success response
export function apiSuccess(data: any, statusCode: number = 200) {
  return NextResponse.json(data, { status: statusCode });
}
