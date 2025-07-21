# Stage 4: Set up App Check Security

## Overview

Implement Firebase App Check to secure your AI Logic calls. This prevents unauthorized access to your Firebase AI services and protects against abuse.

## Pre-Conditions

- [ ] Stage 1-3 complete (Firebase config and AI service exist)
- [ ] You have admin access to your Firebase project
- [ ] You understand basic security concepts
- [ ] Your Firebase project has App Check available

## Time Estimate

30 minutes

## Risk Level

Medium - Security configuration

## What is App Check?

App Check helps protect your Firebase resources from abuse by ensuring requests come from your authentic app. It's required for Firebase AI Logic to work properly.

## Tasks

### Task 1: Enable App Check in Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project
3. In the left sidebar, click "App Check"
4. Click "Get started"
5. Select your web app
6. Choose "reCAPTCHA v3" as your provider
7. Click "Save"

You'll get a site key - copy this, you'll need it.

### Task 2: Create App Check Configuration

Create `lib/app-check.ts`:

```typescript
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
```

### Task 3: Update Environment Variables

Add to your `.env.local`:

```
# App Check Configuration
NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY=your_recaptcha_site_key_here
```

Add to your `.env.example`:

```
# App Check Configuration
NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY=your_recaptcha_site_key_here
```

**Replace `your_recaptcha_site_key_here` with the actual site key from Firebase Console.**

### Task 4: Update Firebase Configuration

Update `lib/firebase.ts` to initialize App Check:

```typescript
import { initializeApp } from 'firebase/app'
import { getVertexAI } from 'firebase/vertexai-preview'

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
export const vertexAI = getVertexAI(app)

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
```

### Task 5: Add App Check to Your App Layout

Update `app/layout.tsx` to ensure App Check is initialized early:

Find the existing layout component and add App Check initialization. Look for something like:

```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Add this effect to initialize App Check */}
        <AppCheckInitializer />
        {children}
      </body>
    </html>
  )
}
```

Create the App Check initializer component at the bottom of the same file:

```typescript
'use client'

import { useEffect } from 'react'

function AppCheckInitializer() {
  useEffect(() => {
    // App Check is already initialized in firebase.ts
    // This component just ensures it happens early in the app lifecycle
    console.log('App layout loaded - App Check should be initialized')
  }, [])

  return null // This component doesn't render anything
}
```

## Testing Your Work

### Test 1: Check Firebase Console

1. Go to Firebase Console → App Check
2. You should see your web app listed
3. Status should show as "Active"

### Test 2: Check Browser Console

1. Run `npm run dev`
2. Open your app in browser
3. Open browser developer tools (F12)
4. Look for "App Check initialized successfully" in console
5. Should not see any App Check errors

### Test 3: Build Test

```bash
npm run build
```

Should complete without errors.

## Expected Behavior

After this stage:

- App Check is configured in Firebase Console
- reCAPTCHA v3 is set up as the provider
- App Check initializes when your app loads
- Console shows successful initialization
- No security errors in browser console

## Post-Conditions

- [ ] App Check is enabled in Firebase Console
- [ ] reCAPTCHA v3 provider is configured
- [ ] `lib/app-check.ts` file exists with proper App Check initialization
- [ ] Environment variables include App Check site key
- [ ] `lib/firebase.ts` initializes App Check automatically
- [ ] App layout includes App Check initialization
- [ ] Browser console shows "App Check initialized successfully"
- [ ] No App Check errors in browser console
- [ ] Project builds successfully (`npm run build` works)

## Troubleshooting

**Error: "App Check initialization failed"**

- Check that your site key is correct in `.env.local`
- Make sure App Check is enabled in Firebase Console
- Verify you're using the right reCAPTCHA site key

**reCAPTCHA not loading**

- Check your network connection
- Make sure the site key is valid
- Try refreshing the page

**"FIREBASE_APPCHECK_DEBUG_TOKEN" errors**

- This is normal in development mode
- Make sure it's only enabled when `NODE_ENV === 'development'`

**App Check not working in production**

- Make sure you're using the production site key
- Remove debug mode in production builds
- Check Firebase Console for App Check status

**TypeScript errors**

- Make sure you have the latest Firebase types
- Check that all imports are correct

## Development vs Production

**Development Mode:**

- Uses debug tokens to bypass real reCAPTCHA
- More permissive for testing
- Debug messages in console

**Production Mode:**

- Uses real reCAPTCHA verification
- Stricter security
- Less verbose logging

## What's Working Now

- App Check security is protecting your Firebase AI calls
- reCAPTCHA verification is working
- Security tokens are automatically managed

## What's Not Working Yet

- AI processing still uses old server actions
- We haven't connected the new Firebase AI service to the UI

## Next Steps

Once this stage is complete, you're ready for Stage 5: Update AI Service Interface.
