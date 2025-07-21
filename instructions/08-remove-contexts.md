# Step 8: Remove Old Context Providers

## Goal
Clean up the old React Context providers and related files after migrating to Zustand.

## Pre-conditions
- [ ] Steps 1-7 completed with retrospectives written
- [ ] All components successfully migrated to use stores
- [ ] App is fully functional with store-based components
- [ ] No components are importing from context files

## Current Provider Nesting
In `app/page.tsx`, these providers will be removed:
```typescript
<FeatureFlagProvider>
  <ImageUploadProvider>      // Remove entirely
    <FileUploadProvider>     // Remove entirely  
      <OutputProvider>       // Remove entirely
        <AppContent />
      </OutputProvider>
    </FileUploadProvider>
  </ImageUploadProvider>
</FeatureFlagProvider>       // Remove entirely
```

## Tasks

### 8.1 Update Main Page Component

Update `app/page.tsx`:

**Before:**
```typescript
export default function FileUploadInterface() {
  return (
    <FeatureFlagProvider>
      <ImageUploadProvider>
        <FileUploadProvider>
          <OutputProvider>
            <AppContent />
            <Toaster />
          </OutputProvider>
        </FileUploadProvider>
      </ImageUploadProvider>
    </FeatureFlagProvider>
  )
}
```

**After:**
```typescript
export default function FileUploadInterface() {
  return (
    <>
      <AppContent />
      <Toaster />
    </>
  )
}
```

### 8.2 Delete Context Files

Remove these files completely:
- `components/file-upload/file-upload-context.tsx`
- `components/output/output-context.tsx`  
- `components/image-upload-context.tsx`
- `components/feature-flag-provider.tsx`

### 8.3 Remove Feature Flag Logic

Since we're removing feature flags entirely:
- Remove all `useFeatureFlag()` calls in components
- Remove `FEATURE_FLAGS` from `lib/posthog.tsx`
- Remove conditional feature rendering
- Simplify components that had feature flag conditions

### 8.4 Clean Up Imports

Update all components that imported from deleted context files:
- Remove context provider imports
- Remove useContext imports  
- Add Zustand store imports where needed

### 8.5 Update Image Upload Logic

Since we're removing `ImageUploadProvider`:
- Move image upload logic to core store if needed
- OR remove entirely if not being used
- Update any components that used image upload context

## Post-conditions
- [ ] App starts without errors
- [ ] No imports from deleted context files anywhere
- [ ] All functionality still works exactly as before
- [ ] No provider nesting in main page component
- [ ] Feature flags completely removed from codebase
- [ ] Image upload logic handled correctly (or removed)
- [ ] Bundle size reduced (fewer dependencies)

## Retrospective
Create `retrospectives/08-cleanup-retrospective.md` and document:
- What was successfully removed
- Any unexpected dependencies discovered
- How app startup time/bundle size changed
- Challenges in removing deeply integrated features
- Final state of the application architecture

## Important
🛑 **STOP HERE** - Do not proceed to step 9 until this step is complete and retrospective is written.

## Next Step
After completing this step and writing the retrospective, continue to `09-final-cleanup.md`
