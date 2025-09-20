// Secure error handling utility

// Error types that are safe to show to users
const USER_SAFE_ERRORS = {
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
  'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
  'auth/invalid-credential': 'Invalid credentials. Please check your information.',
  'auth/requires-recent-login': 'Please sign out and sign back in, then try again.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/expired-action-code': 'This verification link has expired. Please request a new one.',
  'auth/invalid-action-code': 'This verification link is invalid. Please request a new one.',
  'auth/network-request-failed': 'Network error. Please check your connection and try again.',
  'permission-denied': 'You don\'t have permission to perform this action.',
  'not-found': 'The requested resource was not found.',
  'validation-error': 'Please check your input and try again.'
};

// Log error details securely (server-side only)
export const logError = (error, context = {}) => {
  if (typeof window === 'undefined') {
    // Server-side logging
    console.error('[ERROR]', {
      message: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
  } else {
    // Client-side logging (sanitized)
    console.error('[CLIENT ERROR]', {
      message: error.message,
      code: error.code,
      context: sanitizeContext(context)
    });
  }
};

// Sanitize context for client-side logging
const sanitizeContext = (context) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(context)) {
    if (typeof value === 'string' && value.length < 100) {
      sanitized[key] = value;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Get user-friendly error message
export const getUserErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred.';
  
  // Check for known error codes
  if (error.code && USER_SAFE_ERRORS[error.code]) {
    return USER_SAFE_ERRORS[error.code];
  }
  
  // Check for validation errors
  if (error.message && error.message.includes('validation')) {
    return 'Please check your input and try again.';
  }
  
  // Check for network errors
  if (error.message && error.message.includes('network')) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Default safe message
  return 'An unexpected error occurred. Please try again.';
};

// Handle API errors securely
export const handleApiError = (error, context = {}) => {
  logError(error, context);
  
  // Don't expose internal error details
  const safeMessage = getUserErrorMessage(error);
  
  return {
    success: false,
    error: safeMessage,
    code: error.code || 'unknown-error'
  };
};

// Handle authentication errors
export const handleAuthError = (error) => {
  logError(error, { type: 'authentication' });
  
  const safeMessage = getUserErrorMessage(error);
  
  return {
    success: false,
    error: safeMessage,
    code: error.code || 'auth-error'
  };
};

// Handle validation errors
export const handleValidationError = (error, field = null) => {
  logError(error, { type: 'validation', field });
  
  return {
    success: false,
    error: getUserErrorMessage(error),
    field: field || 'general',
    code: 'validation-error'
  };
};

// Create error boundary component
export const createErrorBoundary = (Component) => {
  return class ErrorBoundary extends Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      logError(error, { 
        type: 'react-error-boundary',
        componentStack: errorInfo.componentStack 
      });
    }

    render() {
      if (this.state.hasError) {
        return (
          <div className="p-4 text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Something went wrong
            </h2>
            <p className="text-muted-foreground mb-4">
              We're sorry, but something unexpected happened.
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="btn-primary px-4 py-2"
            >
              Try again
            </button>
          </div>
        );
      }

      return this.props.children;
    }
  };
};
