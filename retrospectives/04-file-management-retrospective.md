# Retrospective: Step 4 5 – Migrate File Management to Core Store

## Migrated Logic

- Validating file types using `fileService.validateFileTypes`
- Preparing file attachments with `fileService.prepareFileAttachments`
- Tracking uploads and errors with `analyticsService`
- Displaying toast notifications for success and error states
- Removing files and updating the store state
- Drag state management via `setIsDragging`

## Integration Challenges

- Ensuring `useToast` hook could be called outside React components; implemented `setToast` workaround
- Handling asynchronous errors from `prepareFileAttachments` without blocking UI
- Coordinating analytics tracking within async flows

## Error Handling Comparison

- Original context displayed toasts directly in `FileUploadProvider`; now centralized in store actions
- Unified error tracking via `analyticsService.trackError`
- Cleaner separation between UI and logic

## Performance Observations

- Minimal impact on latency; file preparation remains asynchronous
- Store updates batch file arrays efficiently

## Unexpected Complexities

- Managing `toastFn` initialization required manual setter injection in the store
- Placeholder outputs logic deferred to next steps
