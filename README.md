# FA One Pager v2

A Next.js application for processing multiple files and generating content outputs using AI services. The project has been migrated from React Context to Zustand for improved state management.

## Features

- **File Upload**: Support for multiple file types (PDF, TXT, DOCX, images)
- **AI Content Generation**: Generate different types of content outputs from uploaded files
- **Real-time Processing**: Track processing status with step-by-step progress
- **Responsive Design**: Built with Tailwind CSS and shadcn/ui components

## Architecture

### State Management

The application uses Zustand stores for efficient state management:

- **Core Store** (`stores/core-store.ts`): Manages file uploads, outputs, and step tracking
- **UI Store** (`stores/ui-store.ts`): Handles UI-specific state like drag-over indicators
- **Feature Store** (`stores/feature-store.ts`): Manages feature flags
- **Image Store** (`stores/image-store.ts`): Handles image-related state

### Services

Business logic is separated into service modules:

- **File Service** (`services/file-service.ts`): File validation and processing
- **AI Service** (`services/ai-service.ts`): AI content generation
- **Analytics Service** (`services/analytics-service.ts`): Usage tracking

### Convenience Hooks

Custom hooks provide simplified access to store functionality:

- `useFiles()`: File management operations
- `useOutputs()`: Output generation and management

## Usage Examples

### Using Store Directly

```typescript
import { useCoreStore } from '@/stores/core-store'

function MyComponent() {
  const files = useCoreStore((state) => state.files)
  const addFiles = useCoreStore((state) => state.addFiles)
  const processOutputType = useCoreStore((state) => state.processOutputType)

  // Component logic...
}
```

### Using Convenience Hooks

```typescript
import { useFiles, useOutputs } from '@/hooks'

function MyComponent() {
  const { files, addFiles, removeFile } = useFiles()
  const { outputs, processOutputType, isProcessing } = useOutputs()

  // Component logic...
}
```

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Migration Notes

This project was successfully migrated from React Context to Zustand stores for:

- ✅ Improved performance (reduced re-renders)
- ✅ Centralized business logic
- ✅ Better testability
- ✅ Cleaner component APIs
- ✅ Reduced boilerplate code
