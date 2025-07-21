import { useCoreStore } from '@/stores/core-store'

/**
 * Convenience hook for file management operations
 */
export const useFiles = () => {
  const files = useCoreStore((state) => state.files)
  const fileAttachments = useCoreStore((state) => state.fileAttachments)
  const isDragging = useCoreStore((state) => state.isDragging)
  const addFiles = useCoreStore((state) => state.addFiles)
  const removeFile = useCoreStore((state) => state.removeFile)
  const setIsDragging = useCoreStore((state) => state.setIsDragging)

  return {
    files,
    fileAttachments,
    isDragging,
    addFiles,
    removeFile,
    setIsDragging,
  }
}
