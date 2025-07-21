import { useCoreStore } from '@/stores/core-store'

/**
 * Convenience hook for output management operations
 */
export const useOutputs = () => {
  const outputs = useCoreStore((state) => state.outputs)
  const editedOutputs = useCoreStore((state) => state.editedOutputs)
  const isProcessing = useCoreStore((state) => state.isProcessing)
  const errors = useCoreStore((state) => state.errors)
  const activeTab = useCoreStore((state) => state.activeTab)
  const retryCount = useCoreStore((state) => state.retryCount)
  const processOutputType = useCoreStore((state) => state.processOutputType)
  const processMultipleOutputs = useCoreStore(
    (state) => state.processMultipleOutputs
  )
  const updateEditedOutput = useCoreStore((state) => state.updateEditedOutput)
  const setActiveTab = useCoreStore((state) => state.setActiveTab)

  return {
    outputs,
    editedOutputs,
    isProcessing,
    errors,
    activeTab,
    retryCount,
    processOutputType,
    processMultipleOutputs,
    updateEditedOutput,
    setActiveTab,
  }
}
