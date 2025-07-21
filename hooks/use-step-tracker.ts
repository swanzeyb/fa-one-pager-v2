'use client'

import { useCoreStore } from '@/stores/core-store'

export type Step = 1 | 2 | 3

export function useStepTracker(): {
  currentStep: Step
  isStepComplete: (step: Step) => boolean
} {
  const getCurrentStep = useCoreStore(state => state.getCurrentStep)
  const isStepComplete = useCoreStore(state => state.isStepComplete)

  return {
    currentStep: getCurrentStep(),
    isStepComplete,
  }
}
