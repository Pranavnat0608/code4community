// Firestore App Check integration
import { getToken } from 'firebase/app-check';
import { app } from '../firebase';

/**
 * Configures Firestore to include App Check tokens in requests
 * This needs to be called after Firebase App Check is initialized
 */
export async function configureFirestoreAppCheck() {
  try {
    if (typeof window === 'undefined') {
      return; // Server-side, no need to configure
    }

    // Wait for App Check to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get the App Check token
    const token = await getToken(app, false);
    
    if (token && token.token) {
      console.log('Firestore App Check token obtained:', token.token.substring(0, 20) + '...');
      
      // Store the token for Firestore requests
      // Note: This is a simplified approach. In production, you might need
      // to implement a more sophisticated token management system
      window.firestoreAppCheckToken = token.token;
      
      // Set up token refresh
      setInterval(async () => {
        try {
          const newToken = await getToken(app, true);
          if (newToken && newToken.token) {
            window.firestoreAppCheckToken = newToken.token;
            console.log('Firestore App Check token refreshed');
          }
        } catch (error) {
          console.error('Failed to refresh Firestore App Check token:', error);
        }
      }, 50 * 60 * 1000); // Refresh every 50 minutes
      
    } else {
      console.warn('No Firestore App Check token available');
    }
  } catch (error) {
    console.error('Failed to configure Firestore App Check:', error);
  }
}

/**
 * Gets the current Firestore App Check token
 * @returns {string|null} The App Check token or null if unavailable
 */
export function getFirestoreAppCheckToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.firestoreAppCheckToken || null;
}
