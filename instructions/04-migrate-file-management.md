# Step 4: Migrate File Management to Core Store

## Goal
Move file management logic from `FileUploadProvider` to the core store and connect it to services.

## Pre-conditions
- [ ] Steps 1-3 completed with retrospectives written
- [ ] Services layer is implemented and functional
- [ ] Core store structure exists
- [ ] Original FileUploadProvider is still working

## Current Context Analysis
- `components/file-upload/file-upload-context.tsx` (221 lines of logic)
- Used by: `file-upload.tsx`, `output-context.tsx`, `use-step-tracker.ts`

## Tasks

### 4.1 Implement Core Store Actions

Update `stores/core-store.ts` to use the file service:

```typescript
// In the file management slice:
addFiles: async (newFiles: File[]) => {
  // Use fileService.validateFileTypes()
  // Use fileService.prepareFileAttachments() 
  // Use analyticsService.trackFileUpload()
  // Handle toast notifications
}
```

### 4.2 Add Error Handling
- Move toast logic into store actions
- Handle file validation errors
- Track errors with analytics service

### 4.3 Add Step Tracking Logic
```typescript
// Derived state based on files and outputs
getCurrentStep: () => {
  const { files } = get()
  const outputs = get().outputs // will add this later
  
  if (!files.length) return 1
  if (!outputs.mediumSummary && !outputs.howToGuide) return 2  
  return 3
}
```

## Post-conditions
- [ ] Core store has all file management actions implemented
- [ ] Services are properly integrated with store actions
- [ ] Error handling works with toast notifications
- [ ] Step tracking logic is implemented and functional
- [ ] Store actions handle all edge cases from original context
- [ ] No breaking changes to existing UI (contexts still work)
- [ ] File upload flow works through store

## Retrospective
Create `retrospectives/04-file-management-retrospective.md` and document:
- What file management logic was successfully migrated
- Integration challenges with services
- How error handling compares to original implementation
- Performance differences observed
- Any unexpected complexities in the migration

## Important
🛑 **STOP HERE** - Do not proceed to step 5 until this step is complete and retrospective is written.

## Next Step
After completing this step and writing the retrospective, continue to `05-create-output-store.md`
