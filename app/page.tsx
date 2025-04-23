"use client"

import { ImageUploadProvider } from "@/components/image-upload-context"
import { Toaster } from "@/components/ui/toaster"
import { FileUpload, FileUploadArea, FileList } from "@/components/file-upload/file-upload"
import { Output, OutputTabs, OutputTabContent } from "@/components/output/output"
import { FileUploadProvider } from "@/components/file-upload/file-upload-context"

export default function FileUploadInterface() {
  return (
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

          {/* Right Column - Output Windows with Tabs */}
          <div className="w-full lg:w-2/3 p-4">
            <Output>
              <OutputTabs>
                <OutputTabContent value="shortSummary" />
                <OutputTabContent value="mediumSummary" />
                <OutputTabContent value="howToGuide" />
              </OutputTabs>
            </Output>
          </div>
        </div>
        <Toaster />
      </FileUploadProvider>
    </ImageUploadProvider>
  )
}
