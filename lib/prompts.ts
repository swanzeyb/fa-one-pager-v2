// Client-side prompts loader
import type { OutputType } from '@/app/actions'

// Import prompts from the JSON file
import promptsData from '@/app/prompts.json'

export interface PromptConfig {
  system: string
  prompt: string // Note: using 'prompt' to match existing prompts.json structure
}

export interface PromptsData {
  shortSummary: PromptConfig
  mediumSummary: PromptConfig
  howToGuide: PromptConfig
}

// Type-safe prompts access
export const prompts: PromptsData = promptsData as PromptsData

// Get prompt for specific output type
export function getPromptForType(outputType: OutputType): PromptConfig {
  const prompt = prompts[outputType]
  if (!prompt) {
    throw new Error(`No prompt found for output type: ${outputType}`)
  }
  return prompt
}
