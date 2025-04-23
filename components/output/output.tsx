"use client"

import { RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/spinner"
import { OutputActions } from "@/components/output-actions"
import { OutputProvider, useOutput, getOutputTypeTitle } from "./output-context"
import { useFileUpload } from "../file-upload/file-upload-context"
import { SimpleEditor } from "../simple-editor"
import type { OutputType } from "@/app/actions"
import type React from "react"

interface OutputProps {
  children: React.ReactNode
}

export function Output({ children }: OutputProps) {
  return (
    <OutputProvider>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Output</CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </OutputProvider>
  )
}

interface OutputTabsProps {
  children: React.ReactNode
}

export function OutputTabs({ children }: OutputTabsProps) {
  const { activeTab, setActiveTab, isProcessing } = useOutput()

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as OutputType)} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="shortSummary">
          Short Summary
          {isProcessing.shortSummary && <Spinner className="ml-2 h-4 w-4" />}
        </TabsTrigger>
        <TabsTrigger value="mediumSummary">
          Medium Summary
          {isProcessing.mediumSummary && <Spinner className="ml-2 h-4 w-4" />}
        </TabsTrigger>
        <TabsTrigger value="howToGuide">
          How-to Guide
          {isProcessing.howToGuide && <Spinner className="ml-2 h-4 w-4" />}
        </TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}

interface OutputTabContentProps {
  value: OutputType
  children?: React.ReactNode
}

export function OutputTabContent({ value, children }: OutputTabContentProps) {
  const { outputs, errors, isProcessing, processOutputType, updateEditedOutput } = useOutput()
  const { files, fileAttachments, prepareFileAttachments } = useFileUpload()

  const handleGenerate = async () => {
    const attachments = await prepareFileAttachments()
    processOutputType(value, attachments)
  }

  const handleEditorChange = (content: string) => {
    updateEditedOutput(value, content)
  }

  const renderContent = () => {
    if (errors[value]) {
      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
          <h3 className="text-lg font-medium text-red-500">Error</h3>
          <p className="text-sm text-muted-foreground">{errors[value]}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={handleGenerate}>
            Try Again
          </Button>
        </div>
      )
    }

    if (outputs[value]) {
      return <SimpleEditor content={outputs[value]} onChange={handleEditorChange} />
    }

    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {isProcessing[value]
          ? `Generating ${value === "howToGuide" ? "how-to guide" : value}...`
          : `Click the Generate button to create a ${value === "howToGuide" ? "how-to guide" : value}.`}
      </p>
    )
  }

  return (
    <TabsContent value={value} className="mt-4">
      <div className="border rounded-md">
        <div className="p-4 flex justify-between items-center">
          <h3 className="text-sm font-medium">{getOutputTypeTitle(value)}</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isProcessing[value] || files.length === 0}
              className="flex items-center gap-1"
            >
              {isProcessing[value] ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
            <OutputActions
              content={outputs[value]}
              title={getOutputTypeTitle(value)}
              outputType={value}
              fileAttachments={fileAttachments}
              disabled={!outputs[value] || isProcessing[value] || !!errors[value]}
            />
          </div>
        </div>
        <div>{renderContent()}</div>
      </div>
    </TabsContent>
  )
}
