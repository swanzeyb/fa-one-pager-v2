# 03 Services Retrospective

## Extracted Business Logic

- **File Service**: Moved file type validation, DataURL conversion, and file attachment preparation from React contexts into pure, promise-based utilities. Defined a central `ALLOWED_FILE_TYPES` constant.
- **AI Service**: Isolated the core output processing, retry logic, and document generation (`PDF` and `DOCX`) from server actions into async functions. Provided a generic `retryAI` helper for robust AI calls.
- **Analytics Service**: Centralized all tracking calls (`fileUpload`, `outputGeneration`, `error`) into standalone functions without React or PostHog provider dependencies.

## Challenges Removing React Dependencies

- Ensuring pure functions had no references to browser APIs (e.g., `window`, React hooks) required adjusting imports and abstracting fetch logic.
- Document generation utilities (`jsPDF`, `docx`) rely on browser and Node APIs; needed to confirm compatibility in a server environment or flag client-only usage.
- Retaining type safety when moving types (`FileAttachment`, `OutputType`) across module boundaries demanded careful import path adjustments.

## Comparison to Original Context Logic

- Original implementations were embedded in React contexts and server actions, mixing UI and business code.
- Services now expose minimal, focused APIs making them easier to test and reuse across different parts of the app.
- Improved error handling and retry mechanisms are centralized, replacing ad-hoc loops in actions.

## Design Decisions

- Kept service functions signature small and explicit, avoiding optional parameters where possible (e.g., excluded `isRegeneration` from base `processOutput` to simplify tests).
- Chose to stub document generation functions initially, planning to import or call full implementations later from `app/actions.ts` to minimize code duplication.
- Used a simple retry helper (`retryAI`) rather than inlining loops in each service call.

## Service Dependencies

- **AI Service** depends on type definitions from `app/actions.ts` but has no React imports.
- **Analytics Service** is standalone and can be replaced by other analytics providers by updating stubbed functions.
- **File Service** is fully pure and has no external dependencies except TypeScript types.

> 🛑 STOP: Do not proceed to step 4 until this retrospective is reviewed and merged.
