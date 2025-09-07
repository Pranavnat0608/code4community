import { isValidEmail, validatePassword, validateDisplayName, sanitizeInput } from './security';

export { isValidEmail as validateEmail, validatePassword, validateDisplayName };

export function getValidationError(field, value, options = {}) {
  // Sanitize input first
  const sanitizedValue = sanitizeInput(value);
  
  switch (field) {
    case "email":
      if (!sanitizedValue) return 'Email is required';
      const emailValid = validateEmail(sanitizedValue);
      return emailValid ? null : "Invalid email address";
    case "password":
      if (!sanitizedValue) return 'Password is required';
      const passwordValidation = validatePassword(sanitizedValue);
      return passwordValidation.isValid ? null : passwordValidation.message;
    case "confirmPassword":
      return sanitizedValue === options.password ? null : "Passwords do not match";
    case "displayName":
      if (!sanitizedValue) return 'Name is required';
      const nameValidation = validateDisplayName(sanitizedValue);
      return nameValidation.isValid ? null : nameValidation.message;
    default:
      return null;
  }
}

export function getFirebaseErrorMessage(error) {
  const code = error.code || "";
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email. Please sign up first.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid credentials. Please check your email and password.";
    case "auth/popup-closed-by-user":
      return "Sign in was cancelled.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in with Google instead, or use a different email address.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password is too weak. Please choose a stronger password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return error.message || "Authentication error.";
  }
}
