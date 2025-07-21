import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { app } from './firebase'

// Initialize App Check
export function initializeFirebaseAppCheck() {
  // Only initialize App Check in the browser
  if (typeof window !== 'undefined') {
    const appCheckKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY

    if (!appCheckKey) {
      console.error('Firebase App Check key is missing')
      if (process.env.NODE_ENV === 'production') {
        throw new Error('App Check is required in production')
      }
      return
    }

    try {
      const appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(appCheckKey),
        isTokenAutoRefreshEnabled: true,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('App Check initialized successfully')
      }
      return appCheck
    } catch (error) {
      console.error('App Check initialization failed:', error)

      // In production, App Check failure should be treated as critical
      if (process.env.NODE_ENV === 'production') {
        throw new Error('App Check initialization failed in production')
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
