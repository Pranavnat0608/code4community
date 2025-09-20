// Security Middleware
import { NextResponse } from 'next/server';
import { validateCSRFToken } from '@/utils/csrf';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per window
  authMaxRequests: 10, // 10 auth requests per window
};

// Check rate limit
const checkRateLimit = (ip, isAuthRequest = false) => {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_CONFIG.windowMs;
  const key = `${ip}:${isAuthRequest ? 'auth' : 'general'}`;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const requests = rateLimitStore.get(key);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  rateLimitStore.set(key, validRequests);
  
  const maxRequests = isAuthRequest ? RATE_LIMIT_CONFIG.authMaxRequests : RATE_LIMIT_CONFIG.maxRequests;
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  return true;
};

// Security headers middleware
export const securityHeaders = (response) => {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  return response;
};

// CSRF protection middleware
export const csrfProtection = (handler) => {
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

// Rate limiting middleware
export const rateLimit = (handler) => {
  return async (request, context) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const isAuthRequest = request.url.includes('/api/auth') || 
                         request.url.includes('/login') || 
                         request.url.includes('/signup');
    
    if (!checkRateLimit(ip, isAuthRequest)) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'Retry-After': '900' // 15 minutes
          }
        }
      );
    }

    return handler(request, context);
  };
};

// Input sanitization middleware
export const sanitizeInput = (handler) => {
  return async (request, context) => {
    // Sanitize request body if it exists
    if (request.method !== 'GET' && request.headers.get('content-type')?.includes('application/json')) {
      try {
        const body = await request.json();
        // Basic sanitization - remove potential XSS vectors
        const sanitizedBody = JSON.parse(JSON.stringify(body).replace(/[<>]/g, ''));
        
        // Create new request with sanitized body
        const sanitizedRequest = new Request(request, {
          body: JSON.stringify(sanitizedBody)
        });
        
        return handler(sanitizedRequest, context);
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
    }

    return handler(request, context);
  };
};
