// CSRF Protection Utility

// Generate a secure CSRF token
export const generateCSRFToken = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use crypto.getRandomValues for better security
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Server-side: use Web Crypto API for Edge Runtime compatibility
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
};

// Validate CSRF token
export const validateCSRFToken = (token, sessionToken) => {
  if (!token || !sessionToken) return false;
  return token === sessionToken;
};

// Store CSRF token in session storage
export const storeCSRFToken = (token) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('csrf_token', token);
  }
};

// Retrieve CSRF token from session storage
export const getCSRFToken = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('csrf_token');
  }
  return null;
};

// Clear CSRF token
export const clearCSRFToken = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('csrf_token');
  }
};

// Generate and store a new CSRF token
export const initializeCSRFToken = () => {
  const token = generateCSRFToken();
  storeCSRFToken(token);
  return token;
};
