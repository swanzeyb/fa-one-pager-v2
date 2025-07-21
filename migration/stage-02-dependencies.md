# Stage 2: Install Firebase AI Logic Dependencies

## Overview

Update your project dependencies to use Firebase AI Logic instead of the current Google AI SDK.

## Pre-Conditions

- [ ] Stage 1 is complete (Firebase configuration files exist)
- [ ] You have access to terminal/command line
- [ ] You understand basic package management (npm/pnpm)
- [ ] Your project currently builds without errors

## Time Estimate

15 minutes

## Risk Level

Low - Just updating dependencies

## Current Dependencies to Remove

Your project currently uses:

- `@ai-sdk/google` - Will be replaced with Firebase AI Logic
- `ai` - Will be replaced with Firebase AI Logic

## New Dependencies to Add

- Firebase AI Logic is already available through the existing `firebase` package
- No additional installations needed!

## Tasks

### Task 1: Check Current Dependencies

First, let's see what we currently have. Run:

```bash
npm list @ai-sdk/google ai
```

You should see these packages listed in your project.

### Task 2: Update package.json

We need to keep the existing `firebase` package but we can remove the old AI SDK dependencies since we'll be using Firebase AI Logic instead.

Open `package.json` and:

1. **Keep these dependencies** (they're already there):

   ```json
   "firebase": "^12.0.0"
   ```

2. **Remove these dependencies**:
   ```json
   "@ai-sdk/google": "latest",
   "ai": "latest"
   ```

The AI functionality will now come through the Firebase SDK instead.

### Task 3: Install Dependencies

Run the package manager to update your dependencies:

```bash
npm install
```

Or if you're using pnpm (which your project uses):

```bash
pnpm install
```

### Task 4: Verify Installation

Check that Firebase is properly installed:

```bash
npm list firebase
```

You should see `firebase@12.0.0` (or similar version).

## Testing Your Work

### Test 1: Build the Project

```bash
npm run build
```

This should complete without dependency-related errors.

### Test 2: Start Development Server

```bash
npm run dev
```

The app should start without errors (though some AI features might not work yet - that's expected).

### Test 3: Check Firebase Import

Create a temporary test file to verify Firebase can be imported:

```typescript
// test-firebase.ts (temporary file)
import { initializeApp } from 'firebase/app'
import { getVertexAI } from 'firebase/vertexai-preview'

console.log('Firebase imports work!')
```

If you can create this file without TypeScript errors, the dependencies are working.

**Delete this test file after checking.**

## Expected Changes

After this stage:

- `@ai-sdk/google` and `ai` packages removed from package.json
- Firebase package remains (providing AI Logic functionality)
- Project builds successfully
- No dependency conflicts

## Post-Conditions

- [ ] `@ai-sdk/google` and `ai` packages removed from package.json
- [ ] `firebase` package still present and working
- [ ] `npm install` or `pnpm install` completes successfully
- [ ] Project builds without dependency errors (`npm run build` succeeds)
- [ ] Development server starts without errors (`npm run dev` works)
- [ ] Firebase imports work in TypeScript files
- [ ] No console errors about missing dependencies

## Troubleshooting

**Error: "Cannot resolve module 'firebase/vertexai-preview'"**

- Make sure you have Firebase version 12.0.0 or later
- Try: `npm install firebase@latest`

**Error: "Package not found" when removing dependencies**

- The packages might already be removed
- Check `package.json` to see if they're still there
- Run `npm install` to clean up

**Build still fails**

- Run `npm install` again to make sure all dependencies are properly installed
- Check that you didn't accidentally remove any other required packages
- Look for TypeScript errors in the console

**pnpm vs npm issues**

- Your project uses pnpm, so stick with `pnpm install`
- If you accidentally used npm, delete `node_modules` and `package-lock.json`, then run `pnpm install`

## What's Working Now

- Firebase is installed and ready
- Old conflicting AI packages are removed
- Project builds successfully

## What's Not Working Yet

- AI features will be broken (expected)
- Import statements in existing code may show errors (we'll fix this in later stages)

## Next Steps

Once this stage is complete, you're ready for Stage 3: Create Firebase AI Service.
