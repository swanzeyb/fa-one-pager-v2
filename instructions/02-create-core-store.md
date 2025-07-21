# Step 2: Create Core Store (File Management)

## Goal
Create the core store that will handle file management logic currently in `FileUploadProvider`.

## Pre-conditions
- [ ] Step 1 is completed with retrospective written
- [ ] Zustand is installed and available
- [ ] Directory structure is in place
- [ ] Current app is still functioning with existing contexts

## Current State Analysis
Review these files to understand current file management:
- `components/file-upload/file-upload-context.tsx` (lines 1-221)
- `hooks/use-step-tracker.ts` (lines 1-46)

## Tasks

### 2.1 Create shared types
Create `stores/types.ts` with interfaces from the current contexts:
```typescript
// Extract these types from existing code:
- FileAttachment (from app/actions.ts)
- Step type (1 | 2 | 3)
- File validation constants
```

### 2.2 Create core store structure
Create `stores/core-store.ts` with these slices:

#### File Management Slice:
- `files: File[]`
- `fileAttachments: FileAttachment[]` 
- `isDragging: boolean`
- `addFiles: (files: File[]) => Promise<void>`
- `removeFile: (index: number) => void`
- `setIsDragging: (isDragging: boolean) => void`

#### Step Tracking Slice:
- `currentStep: Step`
- `getCurrentStep: () => Step` (derived from files/outputs)
- `isStepComplete: (step: Step) => boolean`

## Key Logic to Migrate
1. File validation (PDF/TXT only)
2. File-to-base64 conversion 
3. Error handling with toast notifications
4. Step calculation based on app state

## Post-conditions
- [ ] Types file created with all necessary interfaces
- [ ] Core store created with file management structure
- [ ] Store has proper TypeScript types
- [ ] Store compiles without errors
- [ ] No business logic implemented yet (just structure)
- [ ] Store follows Zustand best practices

## Retrospective
Create `retrospectives/02-core-store-retrospective.md` and document:
- Challenges in extracting types from existing code
- Any type conflicts encountered
- How store structure compares to original context
- Decisions made about state organization
- Questions about Zustand patterns

## Important
🛑 **STOP HERE** - Do not proceed to step 3 until this step is complete and retrospective is written.

## Next Step  
After completing this step and writing the retrospective, continue to `03-create-services.md`
