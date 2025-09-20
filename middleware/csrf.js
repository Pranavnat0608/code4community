// CSRF Middleware for API routes
import { NextResponse } from 'next/server';
import { validateCSRFToken } from '@/utils/csrf';

export const csrfMiddleware = (handler) => {
  return async (request, context) => {
    // Skip CSRF for GET requests and public endpoints
    if (request.method === 'GET') {
      return handler(request, context);
    }

    // Get CSRF token from headers
    const csrfToken = request.headers.get('x-csrf-token');
    const sessionToken = request.headers.get('x-session-token');

    // Validate CSRF token
    if (!validateCSRFToken(csrfToken, sessionToken)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    return handler(request, context);
  };
};
