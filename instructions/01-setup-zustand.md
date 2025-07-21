# Step 1: Setup Zustand and Project Structure

## Goal
Install Zustand and create the basic store structure for the migration.

## Pre-conditions
- [ ] Project is in a working state
- [ ] All tests are passing (if any exist)
- [ ] Git working directory is clean (recommended)
- [ ] Node.js and pnpm are available

## Tasks

### 1.1 Install Zustand
```bash
pnpm add zustand
```

### 1.2 Create stores directory structure
```
stores/
├── index.ts           # Export all stores
├── core-store.ts      # File management + content generation
├── ui-store.ts        # UI state (steps, tabs, loading)
└── types.ts           # Shared TypeScript types
```

### 1.3 Create services directory structure  
```
services/
├── index.ts           # Export all services
├── file-service.ts    # File processing utilities
├── ai-service.ts      # AI processing logic
└── analytics-service.ts # PostHog analytics
```

### 1.4 Delete feature store
- Remove `stores/feature-store.ts` (feature flags not needed)

### 1.5 Create retrospectives directory
Create `retrospectives/` directory for documenting learnings from each step.

## Post-conditions
- [ ] Zustand installed successfully (`pnpm list zustand` shows the package)
- [ ] Directory structure created exactly as specified
- [ ] Feature store deleted (if it existed)
- [ ] Retrospectives directory created
- [ ] Project still builds and runs without errors
- [ ] Ready for next step

## Retrospective
Create `retrospectives/01-setup-retrospective.md` and document:
- Any installation issues encountered
- Time taken to complete this step
- Questions that arose during setup
- Initial thoughts on the migration approach
- Any deviations from the instructions and why

## Important
🛑 **STOP HERE** - Do not proceed to step 2 until this step is complete and retrospective is written.

## Next Step
After completing this step and writing the retrospective, continue to `02-create-core-store.md`
