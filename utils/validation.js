// Comprehensive validation and sanitization utility functions

// HTML sanitization to prevent XSS
export const sanitizeHtml = (input) => {
  if (typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// General input sanitization
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
};

// Enhanced email validation with sanitization
export const validateEmail = (email) => {
  if (!email) return "Email is required";
  
  const sanitizedEmail = sanitizeInput(email);
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (sanitizedEmail !== email) return "Email contains invalid characters";
  if (!emailRegex.test(sanitizedEmail)) return "Please enter a valid email address";
  if (sanitizedEmail.length > 254) return "Email is too long";
  
  return "";
};

// Enhanced password validation with security requirements
export const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long";
  if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number";
  if (!/(?=.*[@$!%*?&#^+=_\-~`|\\/])/.test(password)) return "Password must contain at least one special character (@$!%*?&#^+=_-~`|\\/)";
  
  // Check for common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return "Password is too common, please choose a stronger password";
  }
  
  return "";
};

export const validateConfirmPassword = (confirmPassword, password) => {
  if (!confirmPassword) return "Please confirm your password";
  if (confirmPassword !== password) return "Passwords do not match";
  return "";
};

// Enhanced display name validation with sanitization
export const validateDisplayName = (displayName) => {
  if (!displayName) return "Full name is required";
  
  const sanitized = sanitizeInput(displayName);
  if (sanitized !== displayName) return "Name contains invalid characters";
  if (sanitized.length < 2) return "Full name must be at least 2 characters";
  if (sanitized.length > 50) return "Full name is too long";
  
  // Check for only whitespace
  if (!sanitized.trim()) return "Full name cannot be only spaces";
  
  return "";
};

// Course validation for Math Lab
export const validateCourse = (course) => {
  if (!course) return "Course selection is required";
  
  const validCourses = [
    'Algebra 1', 'Algebra 2', 'Geometry', 'Pre-Calculus', 
    'Calculus AB', 'Calculus BC', 'Statistics', 'Other'
  ];
  
  if (!validCourses.includes(course)) return "Please select a valid course";
  return "";
};

// Request message validation
export const validateRequestMessage = (message) => {
  if (!message) return "Message is required";
  
  const sanitized = sanitizeInput(message);
  if (sanitized !== message) return "Message contains invalid characters";
  if (sanitized.length < 10) return "Message must be at least 10 characters";
  if (sanitized.length > 500) return "Message is too long";
  
  return "";
};

// URL validation
export const validateUrl = (url) => {
  if (!url) return "URL is required";
  
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'https:') return "URL must use HTTPS";
    return "";
  } catch {
    return "Please enter a valid URL";
  }
};

// File upload validation
export const validateFileUpload = (file, maxSize = 5 * 1024 * 1024) => { // 5MB default
  if (!file) return "No file selected";
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return "Only JPEG, PNG, GIF, and WebP images are allowed";
  }
  
  if (file.size > maxSize) {
    return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
  }
  
  return "";
};

// Rate limiting validation
export const validateRateLimit = (lastAttempt, cooldownMs = 60000) => {
  if (!lastAttempt) return "";
  
  const now = Date.now();
  const timeSinceLastAttempt = now - lastAttempt;
  
  if (timeSinceLastAttempt < cooldownMs) {
    const remainingTime = Math.ceil((cooldownMs - timeSinceLastAttempt) / 1000);
    return `Please wait ${remainingTime} seconds before trying again`;
  }
  
  return "";
};