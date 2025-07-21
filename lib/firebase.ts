import { initializeApp } from 'firebase/app'
import { getAI } from 'firebase/ai'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Vertex AI
export const vertexAI = getAI(app)

// Initialize App Check (only in browser)
if (typeof window !== 'undefined') {
  import('./app-check').then(
    ({ initializeFirebaseAppCheck, initializeAppCheckDebug }) => {
      // Use debug mode in development
      if (process.env.NODE_ENV === 'development') {
        initializeAppCheckDebug()
      }
      initializeFirebaseAppCheck()
    }
  )
}
