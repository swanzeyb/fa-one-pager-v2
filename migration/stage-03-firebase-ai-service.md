# Stage 3: Create Firebase AI Service

## Overview

Create a new AI service that uses Firebase AI Logic instead of the server-side Google AI SDK. This will handle all AI processing on the client side.

## Pre-Conditions

- [ ] Stage 1 complete (Firebase configuration exists)
- [ ] Stage 2 complete (Dependencies updated)
- [ ] You understand basic TypeScript interfaces
- [ ] You understand async/await functions
- [ ] Firebase AI Logic is enabled in your Firebase project

## Time Estimate

45 minutes

## Risk Level

Medium - Creating new functionality

## Current AI Service

Your current `services/ai-service.ts` has these functions:

- `processOutput()` - Processes files and generates AI output
- `generateDOCX()` - Creates Word documents
- `generatePDF()` - Creates PDF documents
- `retryAI()` - Handles retry logic

## Tasks

### Task 1: Create Firebase AI Service

Create `services/firebase-ai-service.ts`:

```typescript
// Firebase AI Service: Client-side AI processing using Firebase AI Logic
import { getGenerativeModel } from 'firebase/vertexai-preview'
import { vertexAI } from '@/lib/firebase'
import type { FileAttachment, OutputType } from '@/app/actions'

// Firebase AI model configuration
const getModel = (temperature: number = 0.3) => {
  return getGenerativeModel(vertexAI, {
    model: 'gemini-pro',
    generationConfig: {
      temperature,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  })
}

// Convert file attachments to Firebase format
function prepareFileData(attachments: FileAttachment[]) {
  const parts = []

  for (const file of attachments) {
    try {
      // For Firebase AI Logic, we need to prepare file data differently
      if (file.contentType.startsWith('image/')) {
        parts.push({
          inlineData: {
            data: file.data.split(',')[1], // Remove data URL prefix
            mimeType: file.contentType,
          },
        })
      } else {
        // For text files, include as text
        const textContent = atob(file.data.split(',')[1]) // Decode base64
        parts.push({
          text: `File: ${file.name}\nContent: ${textContent}`,
        })
      }
    } catch (error) {
      console.warn(`Could not process file ${file.name}:`, error)
    }
  }

  return parts
}

// Main AI processing function
export async function processOutputWithFirebase(
  fileAttachments: FileAttachment[],
  outputType: OutputType,
  isRegeneration = false
): Promise<string> {
  // Validate input
  if (!fileAttachments || fileAttachments.length === 0) {
    throw new Error('No file attachments provided')
  }

  // Prepare file data for Firebase
  const fileParts = prepareFileData(fileAttachments)

  if (fileParts.length === 0) {
    throw new Error('No valid files could be processed')
  }

  // TODO: Load prompts (we'll get these from your prompts.json in next stage)
  const systemPrompt = `You are an AI assistant that processes documents and creates summaries. 
    Output type requested: ${outputType}
    ${
      isRegeneration
        ? 'Please make this version different from previous versions.'
        : ''
    }`

  try {
    // Adjust temperature for regeneration
    const temperature = isRegeneration ? 0.7 : 0.3
    const model = getModel(temperature)

    // Create the prompt parts
    const promptParts = [
      { text: systemPrompt },
      ...fileParts,
      { text: `Please process these files and create a ${outputType}.` },
    ]

    // Generate content using Firebase AI Logic
    const result = await model.generateContent(promptParts)
    const response = await result.response
    const text = response.text()

    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from AI model')
    }

    return text
  } catch (error) {
    console.error('Firebase AI processing error:', error)
    throw new Error(`AI processing failed: ${error.message}`)
  }
}

// Retry wrapper function
export async function retryFirebaseAI<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  let lastError

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      console.warn(`Attempt ${i + 1} failed:`, err)

      // Wait before retrying (exponential backoff)
      if (i < retries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 1000)
        )
      }
    }
  }

  throw lastError
}

// Export the main function with retry logic
export async function processOutput(
  fileAttachments: FileAttachment[],
  outputType: OutputType,
  isRegeneration = false
): Promise<string> {
  return retryFirebaseAI(
    () =>
      processOutputWithFirebase(fileAttachments, outputType, isRegeneration),
    3
  )
}
```

### Task 2: Update Services Index

Update `services/index.ts` to export the new Firebase AI service:

```typescript
// Add this export
export * from './firebase-ai-service'

// Keep existing exports
export * from './ai-service'
export * from './analytics-service'
export * from './file-service'
```

### Task 3: Test the New Service (Basic Import Test)

Create a temporary test file to make sure imports work:

```typescript
// test-firebase-ai.ts (temporary)
import { processOutput } from '@/services/firebase-ai-service'

console.log('Firebase AI service imports successfully')
// Don't actually call the function yet - we're just testing imports
```

If this file doesn't show TypeScript errors, your service is properly set up.

**Delete this test file after checking.**

## Testing Your Work

### Test 1: TypeScript Compilation

```bash
npm run build
```

Should complete without TypeScript errors in your new Firebase AI service.

### Test 2: Check Imports

Make sure you can import the new service without errors:

```typescript
import { processOutput } from '@/services/firebase-ai-service'
```

### Test 3: Firebase Connection

Your Firebase config from Stage 1 should be working. The new service imports it correctly.

## Expected Behavior

After this stage:

- New Firebase AI service exists with the same interface as the old one
- TypeScript compilation succeeds
- Service can be imported without errors
- **Note**: The service won't actually work yet because:
  - We haven't loaded the prompts.json file properly
  - We haven't set up App Check security
  - The old server actions are still being used

## Post-Conditions

- [ ] `services/firebase-ai-service.ts` file exists
- [ ] File contains `processOutput()` function with same signature as original
- [ ] File contains retry logic (`retryFirebaseAI()` function)
- [ ] File properly imports Firebase AI Logic modules
- [ ] `services/index.ts` exports the new Firebase AI service
- [ ] Project builds without TypeScript errors (`npm run build` succeeds)
- [ ] You can import functions from the new service without errors
- [ ] Firebase configuration is properly imported and used

## Troubleshooting

**Error: "Cannot find module 'firebase/vertexai-preview'"**

- Make sure you have Firebase 12.0.0 or later
- Check that Firebase AI Logic is enabled in your Firebase project
- Try: `npm install firebase@latest`

**TypeScript errors about missing types**

- Make sure your `tsconfig.json` includes the proper Firebase types
- Try restarting your TypeScript language server in VS Code

**Import errors for '@/lib/firebase'**

- Make sure you completed Stage 1 and the file exists
- Check that your import path is correct

**Error: "getGenerativeModel is not a function"**

- Firebase AI Logic might not be enabled in your project
- Check Firebase Console → Project Settings → Integrations

## What's Working Now

- Firebase AI service exists and can be imported
- TypeScript compilation succeeds
- Service has the same interface as the original

## What's Not Working Yet

- AI processing won't work until we set up App Check (Stage 4)
- Prompts aren't properly loaded yet
- Old server actions are still being used

## Next Steps

Once this stage is complete, you're ready for Stage 4: Set up App Check Security.
