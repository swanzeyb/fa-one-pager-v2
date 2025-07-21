import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { app } from './firebase'

// Initialize App Check
export function initializeFirebaseAppCheck() {
  // Only initialize App Check in the browser
  if (typeof window !== 'undefined') {
    try {
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(
          process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY!
        ),
        isTokenAutoRefreshEnabled: true, // Auto-refresh tokens
      })

      console.log('App Check initialized successfully')
      return appCheck
    } catch (error) {
      console.error('App Check initialization failed:', error)
      // In development, you might want to continue without App Check
      if (process.env.NODE_ENV === 'development') {
        console.warn('Continuing without App Check in development mode')
      }
    }
  }
}

// For development/testing - bypasses App Check
export function initializeAppCheckDebug() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    try {
      // This allows App Check to work in development without real reCAPTCHA
      ;(window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true
      console.log('App Check debug mode enabled')
    } catch (error) {
      console.error('App Check debug setup failed:', error)
    }
  }
}
