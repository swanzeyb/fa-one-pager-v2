'use client'

import { ImageUploadProvider } from '@/components/image-upload-context'
import { Toaster } from '@/components/ui/toaster'
import {
  FileUpload,
  FileUploadArea,
  FileList,
} from '@/components/file-upload/file-upload'
import { Output, OutputContent } from '@/components/output/output'
import { FileUploadProvider } from '@/components/file-upload/file-upload-context'
import { FeatureFlagProvider } from '@/components/feature-flag-provider'
import { OutputProvider } from '@/components/output/output-context'
import { useStepTracker } from '@/hooks/use-step-tracker'

function StepBanner() {
  const { currentStep, isStepComplete } = useStepTracker()

  const getStepStyle = (stepNumber: number) => {
    const isCurrent = currentStep === stepNumber

    if (isCurrent) {
      return 'bg-blue-500 text-white'
    } else {
      return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-lg font-semibold text-gray-800 mb-2">
          Research Summary Generator
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${getStepStyle(
                1
              )}`}
            >
              1
            </span>
            <span>Upload Files</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${getStepStyle(
                2
              )}`}
            >
              2
            </span>
            <span>Generate Content</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${getStepStyle(
                3
              )}`}
            >
              3
            </span>
            <span>Send for Web Review</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Instructions Banner */}
      <StepBanner />

      <div className="flex flex-col lg:flex-row flex-1">
        {/* Left Column - File Upload Area */}
        <div className="w-full lg:w-1/3 p-4">
          <FileUpload>
            <FileUploadArea />
            <FileList />
          </FileUpload>
        </div>

        {/* Right Column - Output Windows without Tabs */}
        <div className="w-full lg:w-2/3 p-4">
          <Output>
            <OutputContent />
          </Output>
        </div>
      </div>
    </div>
  )
}

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
