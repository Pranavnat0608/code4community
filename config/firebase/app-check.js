// Firebase App Check Configuration
// This helps verify that requests come from your legitimate app

import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { recaptchaSiteKey } from '../../keys.js';

// App Check configuration
export const initializeAppCheckConfig = (app) => {
  // Only initialize App Check in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Use the site key from keys.js
    if (recaptchaSiteKey && recaptchaSiteKey !== 'your_recaptcha_site_key_here') {
      return initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      });
    }
  }
  
  // In development, return null (App Check disabled)
  return null;
};
