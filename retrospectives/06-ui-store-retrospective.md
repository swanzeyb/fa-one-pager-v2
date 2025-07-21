# 06 UI Store Retrospective

## Separated UI State

- Drag-over visual indicator (`isDragOverActive`, `setDragOverActive`) moved from file upload context to `useUIStore`.
- Placeholder for modal/dialog visibility (`isWebReviewModalOpen`, `setWebReviewModal`) and global loading overlay (`isGlobalLoading`, `loadingMessage`) implemented in UI store for future use.

## Challenges

- Identifying which states belonged purely to UI (e.g., drag vs. processing) versus business logic required reviewing existing contexts and components.
- No existing button hover or animation trigger states were explicitly managed in state, so no additional migrations were needed.

## Performance Improvements

- File-upload components now subscribe only to drag-over slice, avoiding re-renders on unrelated business logic changes.
- UI store enables selective updates for future UI features (modals, overlays) without touching core store.

## What Would I Do Differently

- Introduce more explicit UI state hooks earlier (e.g., modal, toast position) to reduce initial coupling with business logic stores.
- Consider a naming convention (e.g., `ui.` prefix) to clearly distinguish UI slices in multi-store setups.

## Lessons Learned

- Separating UI concerns from business logic enhances clarity and maintainability.
- Zustand’s ability to subscribe to specific slices simplifies selective re-rendering when state changes.
- Early planning for UI state needs (overlays, modals, animations) can streamline later feature additions.
