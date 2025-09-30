// Enhanced error tracking for Firebase App Check
export function trackAppCheckError(error, context = {}) {
  console.error('App Check Error:', error, context);
  
  // Track with Google Analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'app_check_error', {
      error_message: error.message || 'Unknown error',
      error_code: error.code || 'unknown',
      error_stack: error.stack ? error.stack.substring(0, 500) : undefined,
      context: JSON.stringify(context),
      timestamp: new Date().toISOString()
    });
  }
  
  // Track with console for debugging
  console.group('🔍 App Check Error Details');
  console.error('Error:', error);
  console.error('Context:', context);
  console.error('Timestamp:', new Date().toISOString());
  console.groupEnd();
}

export function trackAppCheckSuccess(operation, duration = null) {
  console.log('App Check Success:', operation, duration ? `(${duration}ms)` : '');
  
  // Track with Google Analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'app_check_success', {
      operation: operation,
      duration: duration,
      timestamp: new Date().toISOString()
    });
  }
}

export function trackAppCheckPerformance(operation, startTime, endTime) {
  const duration = endTime - startTime;
  console.log(`App Check Performance - ${operation}: ${duration}ms`);
  
  // Track with Google Analytics if available
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'app_check_performance', {
      operation: operation,
      duration: duration,
      timestamp: new Date().toISOString()
    });
  }
}

export function trackAppCheckTokenRefresh(success, error = null) {
  if (success) {
    console.log('App Check token refreshed successfully');
    trackAppCheckSuccess('token_refresh');
  } else {
    console.error('App Check token refresh failed:', error);
    trackAppCheckError(error || new Error('Token refresh failed'), { operation: 'token_refresh' });
  }
}
