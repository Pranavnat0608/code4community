export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePassword(password) {
  return password.length >= 6;
}

export function getValidationError(field, value, options = {}) {
  switch (field) {
    case "email":
      return validateEmail(value) ? null : "Invalid email address";
    case "password":
      return validatePassword(value) ? null : "Password must be at least 6 characters";
    case "confirmPassword":
      return value === options.password ? null : "Passwords do not match";
    case "displayName":
      return value ? null : "Name is required";
    default:
      return null;
  }
}

export function getFirebaseErrorMessage(error) {
  const code = error.code || "";
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Invalid email or password.";
    case "auth/popup-closed-by-user":
      return "Sign in was cancelled.";
    case "auth/email-already-in-use":
      return "Email already in use.";
    default:
      return error.message || "Authentication error.";
  }
}
