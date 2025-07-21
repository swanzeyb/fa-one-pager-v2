# Stage 5: Update AI Service Interface

## Overview

Update your existing AI service to use Firebase AI Logic while maintaining the same function signatures that your components expect. This bridges the old and new implementations.

## Pre-Conditions

- [ ] Stages 1-4 complete (Firebase config, dependencies, Firebase AI service, App Check)
- [ ] You understand TypeScript interfaces and function signatures
- [ ] You can read and understand the existing `services/ai-service.ts`
- [ ] Firebase AI Logic is working (App Check set up)

## Time Estimate

60 minutes

## Risk Level

Medium - Modifying existing functionality

## Current AI Service Functions

Your `services/ai-service.ts` currently has:

- `processOutput()` - Main AI processing function
- `generateDOCX()` - Document generation
- `generatePDF()` - PDF generation
- `retryAI()` - Retry logic

## Tasks

### Task 1: Load Prompts Configuration

First, we need to access your prompts. Create a helper to load them on the client side.

Create `lib/prompts.ts`:

```typescript
// Client-side prompts loader
import type { OutputType } from '@/app/actions'

// Import prompts from the JSON file
import promptsData from '@/app/prompts.json'

export interface PromptConfig {
  system: string
  user: string
}

export interface PromptsData {
  shortSummary: PromptConfig
  mediumSummary: PromptConfig
  howToGuide: PromptConfig
}

// Type-safe prompts access
export const prompts: PromptsData = promptsData as PromptsData

// Get prompt for specific output type
export function getPromptForType(outputType: OutputType): PromptConfig {
  const prompt = prompts[outputType]
  if (!prompt) {
    throw new Error(`No prompt found for output type: ${outputType}`)
  }
  return prompt
}
```

### Task 2: Update Firebase AI Service

Update `services/firebase-ai-service.ts` to use the prompts:

```typescript
// Firebase AI Service: Client-side AI processing using Firebase AI Logic
import { getGenerativeModel } from 'firebase/vertexai-preview'
import { vertexAI } from '@/lib/firebase'
import { getPromptForType } from '@/lib/prompts'
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

  // Load the correct prompt for this output type
  const promptConfig = getPromptForType(outputType)

  // Create system prompt with regeneration instructions
  const systemPrompt =
    promptConfig.system +
    (isRegeneration
      ? ' Please make this regeneration noticeably different from previous versions.'
      : '')

  try {
    // Adjust temperature for regeneration
    const temperature = isRegeneration ? 0.7 : 0.3
    const model = getModel(temperature)

    // Create the prompt parts
    const promptParts = [
      { text: systemPrompt },
      ...fileParts,
      { text: promptConfig.user },
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

### Task 3: Update Main AI Service

Now update `services/ai-service.ts` to use Firebase AI Logic instead of server actions:

Find the existing `processOutput` function and replace it:

```typescript
// AI Service: Async functions for AI processing and document generation
// Now uses Firebase AI Logic for client-side processing
import type { FileAttachment, OutputType } from '@/app/actions'
import { processOutput as firebaseProcessOutput } from './firebase-ai-service'

// Main processing function - now uses Firebase AI Logic
export async function processOutput(
  attachments: FileAttachment[],
  type: OutputType,
  isRegeneration = false
): Promise<string> {
  // Use Firebase AI Logic instead of server actions
  return firebaseProcessOutput(attachments, type, isRegeneration)
}

// These document generation functions will be updated in Stage 6
// For now, keep them as stubs
export async function generateDOCX(
  content: string,
  title: string
): Promise<string> {
  // TODO: Move to client-side implementation in Stage 6
  throw new Error('DOCX generation not yet migrated to client-side')
}

export async function generatePDF(
  content: string,
  title: string
): Promise<string> {
  // TODO: Move to client-side implementation in Stage 6
  throw new Error('PDF generation not yet migrated to client-side')
}

// Retry function - now uses Firebase AI retry logic
export async function retryAI<T>(
  fn: () => Promise<T>,
  retries = 3
): Promise<T> {
  // Import retry logic from Firebase AI service
  const { retryFirebaseAI } = await import('./firebase-ai-service')
  return retryFirebaseAI(fn, retries)
}
```

### Task 4: Test the Updated Service

Create a simple test to verify the service works:

```typescript
// test-updated-service.ts (temporary)
import { processOutput } from '@/services/ai-service'

console.log('Updated AI service imports successfully')

// Test with dummy data (don't actually run this yet)
const testData = {
  attachments: [],
  type: 'shortSummary' as const,
}

console.log('Service interface matches expected signature')
```

Delete this file after checking that imports work.

## Testing Your Work

### Test 1: TypeScript Compilation

```bash
npm run build
```

Should complete without TypeScript errors.

### Test 2: Import Test

Make sure you can still import the AI service with the same interface:

```typescript
import { processOutput, retryAI } from '@/services/ai-service'
```

### Test 3: Check Prompts Loading

Make sure prompts can be imported:

```typescript
import { getPromptForType } from '@/lib/prompts'
```

## Expected Behavior

After this stage:

- AI service maintains the same interface as before
- AI service now uses Firebase AI Logic internally
- Prompts are properly loaded from prompts.json
- Document generation functions are stubbed (will work in Stage 6)
- TypeScript compilation succeeds

## Post-Conditions

- [ ] `lib/prompts.ts` file exists and properly loads prompts.json
- [ ] `services/firebase-ai-service.ts` uses prompts correctly
- [ ] `services/ai-service.ts` is updated to use Firebase AI Logic
- [ ] `processOutput()` function has same signature but uses Firebase internally
- [ ] `retryAI()` function uses Firebase retry logic
- [ ] Document generation functions are temporarily stubbed
- [ ] Project builds without TypeScript errors (`npm run build` succeeds)
- [ ] You can import AI service functions without errors
- [ ] Prompts load correctly from JSON file

## Troubleshooting

**Error: "Cannot find module '@/app/prompts.json'"**

- Make sure the prompts.json file exists in your app folder
- Check that your tsconfig.json allows JSON imports
- Add this to tsconfig.json if needed:
  ```json
  {
    "compilerOptions": {
      "resolveJsonModule": true
    }
  }
  ```

**TypeScript errors about prompt types**

- Make sure your prompts.json has the expected structure
- Check that all output types (shortSummary, mediumSummary, howToGuide) exist
- Verify each prompt has both "system" and "user" properties

**Import errors for Firebase AI service**

- Make sure Stage 3 was completed successfully
- Check that firebase-ai-service.ts exports the processOutput function

**"Empty response from AI model" errors**

- This might happen if App Check isn't working properly
- Check Firebase Console for App Check status
- Make sure your prompts are properly formatted

## What's Working Now

- AI service uses Firebase AI Logic internally
- Same interface as before (components won't need changes yet)
- Prompts are properly loaded
- Retry logic works with Firebase

## What's Not Working Yet

- Document generation (DOCX/PDF) is stubbed
- Components still call server actions (we'll fix this in Stage 6)
- Some AI features may not work until we update components

## Next Steps

Once this stage is complete, you're ready for Stage 6: Update Actions to Use Client-Side AI.
