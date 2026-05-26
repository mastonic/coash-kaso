/**
 * API Logging Utility
 * Centralized logging for all API endpoints
 */

export interface LogEntry {
  timestamp: string;
  method: string;
  endpoint: string;
  duration: number;
  status: 'success' | 'error';
  details?: string;
  errorMessage?: string;
}

export function logApiCall(
  method: string,
  endpoint: string,
  status: 'success' | 'error',
  durationMs: number,
  details?: string,
  errorMessage?: string
): void {
  const timestamp = new Date().toISOString();
  const statusEmoji = status === 'success' ? '✅' : '❌';
  const logMessage = `[${timestamp}] ${statusEmoji} ${method} ${endpoint} (${durationMs}ms)${
    details ? ` - ${details}` : ''
  }${errorMessage ? ` - ${errorMessage}` : ''}`;

  if (status === 'success') {
    console.log(logMessage);
  } else {
    console.error(logMessage);
  }
}

export function createApiTimer() {
  const startTime = Date.now();
  return () => Date.now() - startTime;
}
