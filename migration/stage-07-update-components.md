# Stage 7: Update Components and Hooks

## Overview

Update your UI components and hooks to use the new client-side Firebase AI Logic instead of server actions. This stage connects your new AI service to the user interface.

## Pre-Conditions

- [ ] Stages 1-6 complete (Firebase setup through client-side actions)
- [ ] You can identify which components use AI functionality
- [ ] You understand React hooks and component state management
- [ ] You understand the difference between server actions and client-side functions

## Time Estimate

60 minutes

## Risk Level

Medium - Updating user interface components

## Components That Need Updates

Based on your project structure, these likely use AI functionality:

- Components that call `processOutput`
- Components that generate documents
- Components that handle file uploads and processing
- Any components importing from `@/app/actions`

## Tasks

### Task 1: Find Components Using AI

First, let's find which components need updates:

```bash
# Run this in your terminal to find components using server actions
grep -r "processOutput\|generateDOCX\|generatePDF" components/ --include="*.tsx" --include="*.ts"
```

Also check:

```bash
# Check for imports from actions
grep -r "from.*actions" components/ --include="*.tsx" --include="*.ts"
```

Write down which files need updates.

### Task 2: Update Web Review Form Component

Update `components/web-review-form.tsx` (if it uses AI):

Look for imports like:

```typescript
import { processOutput } from '@/app/actions'
```

Replace with:

```typescript
import { useClientAI } from '@/hooks/use-client-ai'
```

Then in the component, replace server action calls:

```typescript
// OLD: Server action usage
const handleSubmit = async () => {
  const result = await processOutput(files, outputType)
  // ... rest of the logic
}

// NEW: Client-side hook usage
const { processFiles, isProcessing, error } = useClientAI()

const handleSubmit = async () => {
  try {
    const result = await processFiles(files, outputType)
    // ... rest of the logic
  } catch (err) {
    // Error is already handled by the hook
    console.error('Processing failed:', err)
  }
}
```

### Task 3: Update Output Component

Update `components/output/output.tsx` (if it handles document generation):

Look for document generation calls:

```typescript
import { generateDOCX, generatePDF } from '@/app/actions'
```

Replace with:

```typescript
import { useClientAI } from '@/hooks/use-client-ai'
```

Update the component:

```typescript
// OLD: Server action usage
const handleDownloadDOCX = async () => {
  const url = await generateDOCX(content, title)
  // manual download logic
}

// NEW: Client-side hook usage
const { downloadDOCX, downloadPDF, isGeneratingDoc } = useClientAI()

const handleDownloadDOCX = async () => {
  await downloadDOCX(content, title)
  // Download happens automatically
}

const handleDownloadPDF = async () => {
  await downloadPDF(content, title)
  // Download happens automatically
}
```

### Task 4: Update File Upload Components

Update `components/file-upload/file-upload.tsx` (if it processes files):

Replace server action imports with client hooks:

```typescript
// OLD: Server action import
import { processOutput } from '@/app/actions'

// NEW: Client hook import
import { useClientAI } from '@/hooks/use-client-ai'
```

Update file processing:

```typescript
// In your component
const { processFiles, isProcessing, error, clearError } = useClientAI()

// Update file processing logic
const handleFilesProcessed = async (
  files: FileAttachment[],
  outputType: OutputType
) => {
  clearError() // Clear any previous errors

  try {
    const result = await processFiles(files, outputType)
    // Handle successful result
    onProcessingComplete(result)
  } catch (err) {
    // Error is automatically set in the hook
    console.error('File processing failed:', err)
  }
}
```

### Task 5: Update Loading States in UI

Add loading indicators for the new async operations:

```typescript
// In your component using the AI hook
const {
  isProcessing,
  isGeneratingDoc,
  error,
  processFiles,
  downloadDOCX,
  downloadPDF,
} = useClientAI()

// In your JSX
return (
  <div>
    {error && <div className="error-message">Error: {error}</div>}

    <button onClick={handleProcess} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : 'Process Files'}
    </button>

    <button onClick={handleDownloadDOCX} disabled={isGeneratingDoc}>
      {isGeneratingDoc ? 'Generating...' : 'Download DOCX'}
    </button>

    <button onClick={handleDownloadPDF} disabled={isGeneratingDoc}>
      {isGeneratingDoc ? 'Generating...' : 'Download PDF'}
    </button>
  </div>
)
```

### Task 6: Update Error Handling

Add proper error handling to components:

```typescript
// In your component
const { error, clearError } = useClientAI()

// Clear errors when component mounts or when user starts new action
useEffect(() => {
  clearError()
}, [clearError])

// Show error messages in UI
{
  error && (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      <strong>Error:</strong> {error}
      <button
        onClick={clearError}
        className="ml-2 text-red-500 hover:text-red-700"
      >
        ✕
      </button>
    </div>
  )
}
```

### Task 7: Make Components Client-Side

Make sure components using the AI hook are client components:

Add `'use client'` directive at the top of any component that uses `useClientAI`:

```typescript
'use client'

import { useClientAI } from '@/hooks/use-client-ai'
// ... rest of imports

export function YourComponent() {
  const { processFiles } = useClientAI()
  // ... component logic
}
```

## Testing Your Work

### Test 1: Build Test

```bash
npm run build
```

Should complete without TypeScript errors.

### Test 2: Development Server Test

```bash
npm run dev
```

Open your app and check:

- No console errors about missing functions
- AI processing buttons appear and work
- Loading states show correctly
- Error messages display when appropriate

### Test 3: Functionality Test

Test the AI features:

1. Upload some files
2. Click process/generate buttons
3. Check that Firebase AI Logic is being called
4. Verify document downloads work

## Expected Behavior

After this stage:

- Components use client-side AI hook instead of server actions
- Loading states work correctly
- Error handling is improved
- Document downloads work in the browser
- All AI functionality uses Firebase AI Logic

## Post-Conditions

- [ ] All components using AI functionality updated to use `useClientAI` hook
- [ ] Server action imports removed from components
- [ ] Client-side hooks imported and used correctly
- [ ] Loading states (`isProcessing`, `isGeneratingDoc`) implemented in UI
- [ ] Error handling implemented with proper error display
- [ ] Components that use AI hooks are marked as client components (`'use client'`)
- [ ] Project builds without TypeScript errors (`npm run build` succeeds)
- [ ] Development server runs without console errors (`npm run dev` works)
- [ ] AI functionality works in the browser (file processing, document generation)

## Troubleshooting

**Error: "useClientAI is not a function"**

- Make sure you exported the hook from `hooks/index.ts`
- Check that the import path is correct
- Verify the hook file was created in Stage 6

**"Cannot call hooks outside of component" errors**

- Make sure you're only calling `useClientAI` inside React components
- Don't call hooks in event handlers or utility functions

**"Server action not found" errors**

- Make sure you removed all imports from `@/app/actions`
- Check that you're using the client-side functions instead

**Components not updating/rendering**

- Make sure components are marked as client components (`'use client'`)
- Check that state updates are happening correctly
- Verify that error boundaries aren't catching and hiding errors

**Firebase AI Logic not working**

- Check browser console for Firebase/App Check errors
- Make sure Firebase AI Logic is enabled in your project
- Verify that your App Check configuration is working

**Document downloads not working**

- Check that browser supports Blob and URL.createObjectURL
- Make sure the download function is being called correctly
- Verify that document generation isn't throwing errors

## What's Working Now

- Components use Firebase AI Logic through the client hook
- All AI processing happens in the browser
- Loading states and error handling are improved
- Document generation works client-side
- User interface is fully connected to Firebase AI

## What's Not Working Yet

- Old server actions still exist (we'll clean these up in Stage 8)
- Some development dependencies might still be present

## Next Steps

Once this stage is complete, you're ready for Stage 8: Environment and Configuration.
