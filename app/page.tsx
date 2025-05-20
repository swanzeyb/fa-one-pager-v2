"use client"

import { ImageUploadProvider } from "@/components/image-upload-context"
import { Toaster } from "@/components/ui/toaster"
import { FileUpload, FileUploadArea, FileList } from "@/components/file-upload/file-upload"
import { Output, OutputContent } from "@/components/output/output"
import { FileUploadProvider } from "@/components/file-upload/file-upload-context"
import { FeatureFlagProvider } from "@/components/feature-flag-provider"

export default function FileUploadInterface() {
  return (
    <FeatureFlagProvider>
      <ImageUploadProvider>
        <FileUploadProvider>
          <div className="flex flex-col min-h-screen lg:flex-row bg-white">
            {/* Left Column - File Upload Area */}
            <div className="w-full lg:w-1/3 p-4 border-r">
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
          <Toaster />
        </FileUploadProvider>
      </ImageUploadProvider>
    </FeatureFlagProvider>
  )
}
