# Stage 1: Set up Firebase Configuration

## Overview

Create the basic Firebase configuration files needed to connect your Next.js app to Firebase AI Logic.

## Pre-Conditions

- [ ] You have a Firebase project created (go to https://console.firebase.google.com)
- [ ] Firebase AI Logic is enabled in your project (Project Settings → Integrations)
- [ ] You have your Firebase config object from Project Settings → Your apps
- [ ] You understand basic TypeScript/JavaScript

## Time Estimate

30 minutes

## Risk Level

Low - Just creating configuration files

## Tasks

### Task 1: Create Firebase Configuration File

Create `lib/firebase.ts`:

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
```

### Task 2: Create Environment Variables Template

Create `.env.example`:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Task 3: Create Your Local Environment File

Create `.env.local` (copy from `.env.example` and fill in your actual values):

```
# Firebase Configuration - REPLACE WITH YOUR ACTUAL VALUES
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_actual_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_actual_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_actual_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
```

**Important**: Replace `your_actual_*` values with the real values from your Firebase project config.

### Task 4: Update .gitignore

Make sure `.env.local` is in your `.gitignore` file (it should already be there in Next.js projects).

## How to Get Your Firebase Config Values

1. Go to https://console.firebase.google.com
2. Select your project
3. Click the gear icon → Project settings
4. Scroll down to "Your apps" section
5. Click on your web app (or create one if you haven't)
6. Copy the config object values

## Testing Your Work

Run this command to make sure your project still builds:

```bash
npm run build
```

You should see no errors related to Firebase configuration.

## Post-Conditions

- [ ] `lib/firebase.ts` file exists and contains proper Firebase initialization
- [ ] `.env.example` file exists with all required Firebase environment variables
- [ ] `.env.local` file exists with your actual Firebase config values
- [ ] Project builds without errors (`npm run build` succeeds)
- [ ] `.env.local` is in `.gitignore` (security check)
- [ ] You can import Firebase config in other files without errors

## Troubleshooting

**Error: "Failed to initialize Firebase"**

- Check that all environment variables are spelled correctly
- Make sure you're using `NEXT_PUBLIC_` prefix for client-side variables
- Verify your Firebase project ID is correct

**Error: "Module not found: firebase/app"**

- Firebase should already be installed. If not, run: `npm install firebase`

**Build errors**

- Make sure all syntax is correct in your TypeScript files
- Check that there are no typos in import statements

## Next Steps

Once this stage is complete, you're ready for Stage 2: Install Firebase AI Logic Dependencies.
