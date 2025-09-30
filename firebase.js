import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getRemoteConfig } from "firebase/remote-config";
import { getPerformance } from "firebase/performance";
import { firebaseConfig, recaptchaSiteKey } from "./keys.js";

// Firebase config imported from keys.js

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Initialize Remote Config for gradual rollout
const remoteConfig = getRemoteConfig(app);
remoteConfig.settings = {
  minimumFetchIntervalMillis: 3600000, // 1 hour
  fetchTimeoutMillis: 60000
};

// Initialize Performance Monitoring
let perf = null;
if (typeof window !== 'undefined') {
  perf = getPerformance(app);
}

// Optimized App Check initialization with performance monitoring
const initializeAppCheckAsync = async () => {
  if (typeof window === 'undefined') return null;
  
  // Start performance trace
  const appCheckTrace = perf ? perf.trace('app_check_initialization') : null;
  if (appCheckTrace) appCheckTrace.start();
  
  try {
    console.log('Initializing Firebase App Check with site key:', recaptchaSiteKey);
    
    // Check if App Check should be enabled via Remote Config
    try {
      await remoteConfig.fetchAndActivate();
      const appCheckEnabled = remoteConfig.getBoolean('app_check_enabled');
      if (!appCheckEnabled) {
        console.log('App Check disabled via Remote Config');
        window.firebaseAppCheckReady = true;
        window.dispatchEvent(new CustomEvent('firebaseAppCheckReady'));
        return null;
      }
    } catch (rcError) {
      console.warn('Remote Config fetch failed, proceeding with App Check:', rcError);
    }
    
    // Initialize App Check
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
    
    console.log('Firebase App Check initialized successfully');
    window.firebaseAppCheck = appCheck;
    
    // Set up token change listener
    appCheck.onTokenChanged((token) => {
      if (token) {
        console.log('App Check token refreshed');
      } else {
        console.warn('App Check token expired');
      }
    });
    
    // Wait for App Check to be fully ready
    const waitForAppCheck = async () => {
      try {
        const { getToken } = await import('firebase/app-check');
        const token = await getToken(appCheck, false);
        console.log('App Check token ready:', token ? 'Yes' : 'No');
        
        if (token && token.token) {
          console.log('Firebase App Check is fully ready for Firestore operations');
          window.firebaseAppCheckReady = true;
          window.dispatchEvent(new CustomEvent('firebaseAppCheckReady'));
          
          // Stop performance trace
          if (appCheckTrace) appCheckTrace.stop();
        } else {
          console.error('App Check token not available');
          // Retry after a delay
          setTimeout(waitForAppCheck, 2000);
        }
      } catch (error) {
        console.error('App Check token generation failed:', error);
        // Track error
        if (window.gtag) {
          window.gtag('event', 'app_check_error', {
            error_message: error.message,
            error_code: error.code
          });
        }
        // Retry after a delay
        setTimeout(waitForAppCheck, 2000);
      }
    };
    
    // Start the App Check readiness check with slight delay
    setTimeout(waitForAppCheck, 1000);
    
    return appCheck;
    
  } catch (error) {
    console.error('Failed to initialize Firebase App Check:', error);
    
    // Track error
    if (window.gtag) {
      window.gtag('event', 'app_check_init_error', {
        error_message: error.message,
        error_code: error.code
      });
    }
    
    // Fallback: signal ready without App Check
    window.firebaseAppCheckReady = true;
    window.dispatchEvent(new CustomEvent('firebaseAppCheckReady'));
    
    if (appCheckTrace) appCheckTrace.stop();
    return null;
  }
};

// Initialize App Check asynchronously to avoid blocking app startup
if (typeof window !== 'undefined') {
  // Defer initialization to improve startup time
  setTimeout(() => {
    initializeAppCheckAsync();
  }, 100);
}

// Configure Google provider for better OAuth experience
provider.setCustomParameters({
  prompt: 'select_account',
  access_type: 'offline'
});

const firestore = getFirestore(app);

export { auth, provider, firestore, createUserWithEmailAndPassword, sendEmailVerification, fetchSignInMethodsForEmail, app, remoteConfig, perf };
export default app;
