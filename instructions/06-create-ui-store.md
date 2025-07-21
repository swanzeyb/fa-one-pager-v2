# Step 6: Create UI State Store

## Goal
Create a separate store for pure UI state that doesn't involve business logic.

## Pre-conditions
- [ ] Zustand is installed and configured
- [ ] Core store is created and functional
- [ ] Services layer is implemented
- [ ] File management migration is complete
- [ ] Output management migration is complete

## Current UI State Analysis
Review these for UI-only state:
- Tab selection in outputs
- Loading spinners and overlays
- Modal/dialog states
- Theme preferences (if any)
- Drag and drop visual states

## Tasks

### 6.1 Create UI Store
Create `stores/ui-store.ts`:

```typescript
interface UIState {
  // Modal/Dialog states
  isWebReviewModalOpen: boolean
  
  // Loading overlays (separate from business logic loading)
  isGlobalLoading: boolean
  loadingMessage: string
  
  // Visual states
  isDragOverActive: boolean // different from file isDragging
  
  // Actions
  setWebReviewModal: (open: boolean) => void
  setGlobalLoading: (loading: boolean, message?: string) => void
  setDragOverActive: (active: boolean) => void
}
```

### 6.2 Move Visual States

Identify and move these UI-only states:
- Visual drag indicators
- Button hover states
- Animation triggers
- Modal visibility
- Toast positioning preferences

### 6.3 Keep Business Logic Separate

DO NOT move these to UI store (they stay in core store):
- `isDragging` from file upload (this affects file processing)
- `isProcessing` from outputs (this affects business logic)
- `activeTab` (this might affect processing logic)

## Benefits of Separation
- UI components can subscribe only to UI changes
- Business logic changes don't trigger UI re-renders
- Easier to test UI behavior separately
- Better performance with selective subscriptions

## Post-conditions
- [ ] UI store created with pure UI state
- [ ] No business logic in UI store
- [ ] No UI-only state in core store
- [ ] Components can subscribe to specific slices
- [ ] Store exports properly
- [ ] Store compiles without TypeScript errors
- [ ] UI store is completely independent of business logic

## Retrospective
Create `retrospectives/06-ui-store-retrospective.md` and document:
- What UI state was successfully separated
- Any challenges in identifying pure UI state vs business logic
- Performance improvements observed (if any)
- What would you do differently next time
- Lessons learned about UI/logic separation

## Important
🛑 **STOP HERE** - Do not proceed to step 7 until this step is complete and retrospective is written.

## Next Step
After completing this step and writing the retrospective, continue to `07-update-components.md`
