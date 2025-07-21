# Step 3: Create Services Layer

## Goal
Extract business logic from contexts into dedicated service functions.

## Pre-conditions
- [ ] Steps 1-2 completed with retrospectives written
- [ ] Core store structure is in place
- [ ] Types are defined and available
- [ ] Current app still functions with existing contexts

## Current Logic Analysis
Review these files for business logic to extract:
- `components/file-upload/file-upload-context.tsx` (file processing)
- `app/actions.ts` (AI processing, PDF/DOCX generation)
- `lib/posthog.tsx` (analytics tracking)

## Tasks

### 3.1 Create File Service
Create `services/file-service.ts`:

#### Functions to extract:
- `validateFileTypes(files: File[]): { valid: File[], invalid: File[] }`
- `convertToDataURL(file: File): Promise<string>`
- `prepareFileAttachments(files: File[]): Promise<FileAttachment[]>`
- `ALLOWED_FILE_TYPES` constant

#### Benefits:
- Pure functions (easier to test)
- Reusable across different parts of app
- No React dependencies

### 3.2 Create AI Service  
Create `services/ai-service.ts`:

#### Functions to extract from actions.ts:
- `processOutput(attachments: FileAttachment[], type: OutputType): Promise<string>`
- `generateDOCX(content: string): Promise<Blob>`
- `generatePDF(content: string): Promise<Blob>`
- Retry logic for AI calls

### 3.3 Create Analytics Service
Create `services/analytics-service.ts`:

#### Functions to extract from posthog.tsx:
- `trackFileUpload(count: number): void`
- `trackOutputGeneration(type: string, isRegeneration: boolean): void`
- `trackError(type: string, message: string): void`
- All analytics.* calls

### 3.4 Create services index
Create `services/index.ts` to export all services.

## Post-conditions
- [ ] File service created with pure functions
- [ ] AI service created with async functions
- [ ] Analytics service created
- [ ] All services export from index.ts
- [ ] Services have no React dependencies
- [ ] Services are pure functions where possible
- [ ] All services compile without TypeScript errors

## Retrospective
Create `retrospectives/03-services-retrospective.md` and document:
- What business logic was successfully extracted
- Challenges in removing React dependencies
- How services compare to original context logic
- Any design decisions made about service organization
- Dependencies between services (if any)

## Important
🛑 **STOP HERE** - Do not proceed to step 4 until this step is complete and retrospective is written.

## Next Step
After completing this step and writing the retrospective, continue to `04-migrate-file-management.md`
