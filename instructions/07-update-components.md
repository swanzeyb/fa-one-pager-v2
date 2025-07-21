# Step 7: Update Components to Use Stores

## Goal
Gradually update components to use Zustand stores instead of React Context.

## Pre-conditions
- [ ] Steps 1-6 completed with retrospectives written
- [ ] Core store is fully implemented and tested
- [ ] UI store is created and functional
- [ ] Services layer is working
- [ ] Original contexts are still in place and working

## Migration Strategy
Update components one at a time, starting with the simplest ones.

## Tasks

### 7.1 Update File Upload Components

Update `components/file-upload/file-upload.tsx`:

**Before (Context):**
```typescript
const { files, addFiles, removeFile } = useFileUpload()
```

**After (Zustand):**
```typescript
const files = useCoreStore(state => state.files)
const addFiles = useCoreStore(state => state.addFiles)  
const removeFile = useCoreStore(state => state.removeFile)
```

### 7.2 Update Step Tracker Hook

Update `hooks/use-step-tracker.ts`:

**Before:**
```typescript
const { files } = useFileUpload()
const { outputs, isProcessing } = useOutput()
```

**After:**
```typescript
const currentStep = useCoreStore(state => state.getCurrentStep())
const isStepComplete = useCoreStore(state => state.isStepComplete)
```

### 7.3 Update Output Components

Update `components/output/output.tsx`:

**Before:**
```typescript
const { outputs, processOutputType, isProcessing } = useOutput()
```

**After:**
```typescript
const outputs = useCoreStore(state => state.outputs)
const processOutputType = useCoreStore(state => state.processOutputType)
const isProcessing = useCoreStore(state => state.isProcessing)
```

### 7.4 Use Selective Subscriptions

Optimize performance with selective subscriptions:

```typescript
// Instead of subscribing to entire store:
const store = useCoreStore()

// Subscribe only to what component needs:
const files = useCoreStore(state => state.files)
const addFiles = useCoreStore(state => state.addFiles)
```

## Component Update Order
1. `file-upload.tsx` (simplest)
2. `use-step-tracker.ts` (hook)
3. `output.tsx` (most complex)
4. `web-review-form.tsx`
5. `page.tsx` (remove providers)

## Post-conditions
- [ ] All target components compile without errors
- [ ] UI behavior remains exactly the same
- [ ] Performance is improved (fewer re-renders)
- [ ] No context imports remaining in updated components
- [ ] All functionality still works as expected
- [ ] Components use selective subscriptions properly

## Retrospective
Create `retrospectives/07-components-retrospective.md` and document:
- Which components were easiest/hardest to migrate
- Performance improvements observed
- Any unexpected issues during migration
- How component code clarity improved
- Patterns that emerged for store usage

## Important
🛑 **STOP HERE** - Do not proceed to step 8 until this step is complete and retrospective is written.

## Next Step
After completing this step and writing the retrospective, continue to `08-remove-contexts.md`
