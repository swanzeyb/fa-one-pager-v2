# Retrospective: 02-core-store

## Challenges in extracting types from existing code

- FileAttachment was already defined in `app/actions.ts` and imported in the context, so it was straightforward to reuse.
- Step type was clearly defined in `hooks/use-step-tracker.ts` as `1 | 2 | 3`.
- File validation constants (allowed file types) were present in the context and migrated as a constant and type.

## Type conflicts encountered

- No major type conflicts encountered. All types were already well-typed in the original code.

## Store structure vs. original context

- The new Zustand store structure separates file management and step tracking into clear slices, making the state more modular and testable.
- The context previously mixed logic and state; the store now only defines structure and types, with no business logic yet.

## Decisions about state organization

- Kept the store slices close to the original context's responsibilities for easier migration in later steps.
- Used TypeScript interfaces for each slice for clarity and future extensibility.

## Questions about Zustand patterns

- Should async actions (like addFiles) be handled directly in the store, or should side effects (like toasts) be managed outside the store?
- Is it best practice to keep all slices in a single store, or split into multiple stores for larger apps?

---

**Ready for Step 3.**
