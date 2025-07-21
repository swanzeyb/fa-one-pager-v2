# Stage 8: Environment and Configuration

## Overview

Set up production-ready configuration for Firebase AI Logic, including environment variables, security settings, and deployment configuration.

## Pre-Conditions

- [ ] Stages 1-7 complete (Firebase setup through component updates)
- [ ] You have access to your Firebase project console
- [ ] You understand environment variables and deployment
- [ ] Your app is working locally with Firebase AI Logic

## Time Estimate

45 minutes

## Risk Level

Low - Configuration and documentation

## Goals

- Set up production environment variables
- Configure Firebase for production deployment
- Document configuration for team members
- Set up proper security settings

## Tasks

### Task 1: Review and Organize Environment Variables

Update `.env.example` with all necessary variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase App Check (Security)
NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY=your_recaptcha_site_key_here

# Environment Configuration
NODE_ENV=development

# Optional: Firebase Analytics (if you want to add it later)
# NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional: App-specific configuration
# NEXT_PUBLIC_APP_NAME="Your App Name"
# NEXT_PUBLIC_APP_VERSION="1.0.0"
```

### Task 2: Create Production Environment Documentation

Create `docs/firebase-setup.md`:

```markdown
# Firebase Configuration Guide

## Overview

This app uses Firebase AI Logic for client-side AI processing. Follow this guide to set up Firebase for development and production.

## Prerequisites

- Firebase project with AI Logic enabled
- Firebase CLI installed: `npm install -g firebase-tools`

## Development Setup

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. Enable Firebase AI Logic:
   - Go to Project Settings → Integrations
   - Enable "Firebase AI Logic" (Vertex AI in Firebase)

### 2. Web App Configuration

1. In Firebase Console → Project Settings → Your apps
2. Add a web app or select existing
3. Copy the configuration object

### 3. App Check Setup

1. In Firebase Console → App Check
2. Register your web app
3. Select "reCAPTCHA v3" provider
4. Copy the site key

### 4. Environment Variables

1. Copy `.env.example` to `.env.local`
2. Fill in your Firebase configuration values
3. Never commit `.env.local` to version control

## Production Deployment

### Vercel Deployment

1. In Vercel dashboard, go to your project settings
2. Add environment variables:
   - Copy all variables from `.env.local`
   - Paste into Vercel environment variables
   - Make sure to use production Firebase config

### Other Platforms

Set the same environment variables in your hosting platform:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY`

## Security Considerations

### App Check

- Always use App Check in production
- Keep reCAPTCHA site keys secure
- Monitor App Check usage in Firebase Console

### API Keys

- Firebase API keys are safe to expose in client-side code
- They identify your project but don't grant access
- Access is controlled by Firebase Security Rules and App Check

### Domain Security

- Configure authorized domains in Firebase Console
- Remove localhost from production authorized domains
- Add your production domain to authorized domains

## Monitoring

### Firebase Console

Monitor usage in Firebase Console:

- AI Logic usage and quotas
- App Check verification status
- Error logs and debugging

### Browser Console

In development, check browser console for:

- App Check initialization success
- Firebase AI Logic connection status
- Any error messages

## Troubleshooting

### Common Issues

**App Check Failed**

- Check reCAPTCHA site key is correct
- Verify domain is authorized
- Check Firebase Console for App Check status

**AI Logic Not Working**

- Ensure AI Logic is enabled in Firebase project
- Check quotas and billing in Firebase Console
- Verify App Check is working

**Environment Variables**

- All Firebase variables must start with `NEXT_PUBLIC_`
- Check for typos in variable names
- Restart development server after changing variables

**Domain Errors**

- Add your domain to Firebase authorized domains
- Check that domain matches exactly (with/without www)
- Verify SSL certificate is valid
```

### Task 3: Configure Firebase Project Settings

In Firebase Console, verify these settings:

#### A. Authorized Domains

1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `yourapp.vercel.app`)
3. Remove `localhost` from production (keep for development)

#### B. App Check Settings

1. Go to Firebase Console → App Check
2. Verify your web app is registered
3. Check that reCAPTCHA v3 is configured
4. Monitor usage and adjust quotas if needed

#### C. AI Logic Quotas

1. Go to Firebase Console → AI Logic
2. Check your quotas and usage
3. Set up billing alerts if needed
4. Configure rate limiting if necessary

### Task 4: Create Development vs Production Configuration

Update `lib/firebase.ts` to handle different environments:

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

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]

const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}`
  )
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Vertex AI
export const vertexAI = getVertexAI(app)

// Log configuration status (development only)
if (process.env.NODE_ENV === 'development') {
  console.log('Firebase initialized for project:', firebaseConfig.projectId)
}

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

### Task 5: Update App Check for Production

Update `lib/app-check.ts` for better production configuration:

```typescript
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
```

### Task 6: Create Deployment Checklist

Create `docs/deployment-checklist.md`:

```markdown
# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables set in hosting platform
- [ ] Firebase project configured for production
- [ ] App Check enabled with production reCAPTCHA key
- [ ] Production domain added to Firebase authorized domains
- [ ] All tests passing (`npm run build` succeeds)
- [ ] No console errors in development

## Firebase Configuration

- [ ] AI Logic enabled in Firebase project
- [ ] App Check configured with reCAPTCHA v3
- [ ] Billing set up for AI Logic usage
- [ ] Quotas configured appropriately
- [ ] Authorized domains include production domain

## Environment Variables

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY` set
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` set
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID` set
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` set
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` set
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID` set
- [ ] `NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY` set (production reCAPTCHA key)

## Post-Deployment Testing

- [ ] App loads without errors
- [ ] Firebase AI Logic processes files correctly
- [ ] Document generation (DOCX/PDF) works
- [ ] App Check verifies successfully
- [ ] No console errors in production
- [ ] AI processing completes successfully

## Monitoring

- [ ] Set up Firebase usage monitoring
- [ ] Configure billing alerts
- [ ] Monitor App Check verification rates
- [ ] Check AI Logic quota usage
```

## Testing Your Work

### Test 1: Environment Validation

```bash
npm run build
```

Should complete and validate all environment variables.

### Test 2: Production Simulation

1. Set `NODE_ENV=production` temporarily
2. Run the app and check that App Check works correctly
3. Verify no debug tokens are used
4. Reset `NODE_ENV=development`

### Test 3: Documentation Review

- Read through your documentation
- Make sure all steps are clear
- Verify all environment variables are documented

## Expected Behavior

After this stage:

- Production environment is properly configured
- Security settings are optimized for production
- Documentation is complete for team members
- Deployment process is documented
- Environment variables are validated

## Post-Conditions

- [ ] `.env.example` contains all required environment variables
- [ ] `docs/firebase-setup.md` provides complete setup instructions
- [ ] `docs/deployment-checklist.md` guides deployment process
- [ ] Firebase project configured for production (authorized domains, App Check)
- [ ] `lib/firebase.ts` validates environment variables
- [ ] `lib/app-check.ts` handles production vs development correctly
- [ ] Environment variable validation prevents misconfiguration
- [ ] Documentation covers development and production setup
- [ ] Security settings are production-ready

## Troubleshooting

**Environment variable errors**

- Check that all variables start with `NEXT_PUBLIC_`
- Verify no typos in variable names
- Make sure `.env.local` is not committed to git

**App Check production issues**

- Verify production reCAPTCHA key is correct
- Check that domain is authorized in Firebase
- Make sure debug mode is disabled in production

**Firebase Console access issues**

- Verify you have the correct permissions
- Check that you're in the right Firebase project
- Make sure billing is set up if required

**Documentation unclear**

- Test following your own documentation
- Ask a colleague to review setup steps
- Update documentation based on feedback

## What's Working Now

- Production-ready Firebase configuration
- Complete documentation for setup and deployment
- Environment variable validation
- Security optimized for production
- Team can follow setup instructions

## What's Not Working Yet

- Old server actions still exist (we'll clean these up in Stage 9)

## Next Steps

Once this stage is complete, you're ready for Stage 9: Testing and Cleanup.
