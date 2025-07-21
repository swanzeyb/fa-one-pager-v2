# Step 5: Create Output Management Store

## Goal
Move content generation logic from `OutputProvider` to the core store.

## Pre-conditions
- [ ] Steps 1-4 completed with retrospectives written
- [ ] File management is working through core store
- [ ] Services layer is functional
- [ ] Original OutputProvider is still working

## Current Context Analysis
- `components/output/output-context.tsx` (381 lines of complex logic)
- Handles: AI processing, retry logic, error states, editing
- Used by: `output.tsx`, `web-review-form.tsx`, `use-step-tracker.ts`

## Tasks

### 5.1 Add Output Slice to Core Store

Extend `stores/core-store.ts` with output management:

```typescript
// Output state
outputs: Record<OutputType, string>
editedOutputs: Record<OutputType, string>  
isProcessing: Record<OutputType, boolean>
errors: Record<OutputType, string | null>
activeTab: OutputType
retryCount: Record<OutputType, number>
```

### 5.2 Add Output Actions

```typescript
// Output actions
processOutputType: async (type: OutputType, isRegeneration?: boolean) => {
  // Use aiService.processOutput()
  // Handle loading states
  // Use analyticsService.trackOutputGeneration()
}

processMultipleOutputs: async () => {
  // Process mediumSummary and howToGuide in parallel
}

updateEditedOutput: (type: OutputType, content: string) => void
setActiveTab: (tab: OutputType) => void
```

### 5.3 Integrate with File Management

Ensure output processing uses the file attachments from the file management slice:

```typescript
// In processOutputType action:
const { fileAttachments } = get()
if (!fileAttachments.length) {
  // Handle no files error
  return
}
```

### 5.4 Error Handling & Retry Logic
- Move retry logic from context to store
- Integrate with analytics service for error tracking
- Handle toast notifications in store actions

## Key Benefits
- All AI processing logic centralized
- File management and output generation in same store
- Easier to coordinate between different parts of the app
- Better error handling and retry logic

## Post-conditions
- [ ] Output slice added to core store successfully
- [ ] All output actions implemented and functional
- [ ] Integration with file management works correctly
- [ ] Error handling and retries work as expected
- [ ] Analytics properly integrated with actions
- [ ] Store state updates correctly for all output operations
- [ ] Original OutputProvider still works (not replaced yet)

## Retrospective
Create `retrospectives/05-output-store-retrospective.md` and document:
- What output management logic was successfully migrated
- Challenges in integrating with file management
- How error handling and retry logic compares to original
- Coordination between file and output state
- Any performance considerations

## Important
🛑 **STOP HERE** - Do not proceed to step 6 until this step is complete and retrospective is written.

## Next Step
After completing this step and writing the retrospective, continue to `06-create-ui-store.md`
