# Stage 6: Update Actions to Use Client-Side AI

## Overview

Migrate your server actions to client-side functions that use Firebase AI Logic. This is a big change since we're moving from server-side to client-side processing.

## Pre-Conditions

- [ ] Stages 1-5 complete (Firebase setup, dependencies, services, App Check, AI service updated)
- [ ] You understand the difference between server actions and client-side functions
- [ ] You understand async/await and error handling
- [ ] You can read the existing `app/actions.ts` file

## Time Estimate

90 minutes

## Risk Level

High - Major architectural change

## Current Server Actions

Your `app/actions.ts` has server actions (marked with `'use server'`) that:

- Process files on the server
- Generate AI responses using Google AI SDK
- Create DOCX and PDF documents
- Handle retry logic

## Goal

Create client-side equivalents that work in the browser using Firebase AI Logic.

## Tasks

### Task 1: Create Client-Side Actions File

Create `app/client-actions.ts`:

```typescript
// Client-side actions for Firebase AI Logic
// These replace the server actions for AI processing
'use client'

import { processOutput as firebaseProcessOutput } from '@/services/firebase-ai-service'
import type { FileAttachment, OutputType, StructuredElement } from './actions'
import { jsPDF } from 'jspdf'
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
} from 'docx'
import { parse } from 'node-html-parser'

// Main AI processing function - now client-side
export async function processOutput(
  fileAttachments: FileAttachment[],
  outputType: OutputType,
  isRegeneration = false
): Promise<string> {
  try {
    return await firebaseProcessOutput(
      fileAttachments,
      outputType,
      isRegeneration
    )
  } catch (error) {
    console.error('Client-side AI processing error:', error)
    throw new Error(`AI processing failed: ${error.message}`)
  }
}

// Helper function to parse HTML content (moved from server actions)
function parseHtmlToStructured(html: string): StructuredElement[] {
  const root = parse(html)

  function convertNode(node: any): StructuredElement {
    const element: StructuredElement = {
      type: node.tagName || 'text',
      content: node.text || '',
    }

    if (node.attributes) {
      element.attributes = node.attributes
    }

    if (node.childNodes && node.childNodes.length > 0) {
      element.children = node.childNodes
        .filter(
          (child: any) => child.tagName || (child.text && child.text.trim())
        )
        .map(convertNode)
    }

    return element
  }

  return root.childNodes
    .filter((node: any) => node.tagName || (node.text && node.text.trim()))
    .map(convertNode)
}

// Generate DOCX document - now client-side
export async function generateDOCX(
  content: string,
  title: string
): Promise<string> {
  try {
    const structuredContent = parseHtmlToStructured(content)

    function createDocxElements(elements: StructuredElement[]): any[] {
      const docxElements: any[] = []

      elements.forEach((element) => {
        switch (element.type) {
          case 'h1':
            docxElements.push(
              new Paragraph({
                children: [
                  new TextRun({ text: element.content, bold: true, size: 32 }),
                ],
                heading: HeadingLevel.HEADING_1,
              })
            )
            break

          case 'h2':
            docxElements.push(
              new Paragraph({
                children: [
                  new TextRun({ text: element.content, bold: true, size: 28 }),
                ],
                heading: HeadingLevel.HEADING_2,
              })
            )
            break

          case 'h3':
            docxElements.push(
              new Paragraph({
                children: [
                  new TextRun({ text: element.content, bold: true, size: 24 }),
                ],
                heading: HeadingLevel.HEADING_3,
              })
            )
            break

          case 'p':
            const textRuns: TextRun[] = []
            if (element.children && element.children.length > 0) {
              element.children.forEach((child) => {
                if (child.type === 'strong' || child.type === 'b') {
                  textRuns.push(
                    new TextRun({ text: child.content, bold: true })
                  )
                } else if (child.type === 'em' || child.type === 'i') {
                  textRuns.push(
                    new TextRun({ text: child.content, italics: true })
                  )
                } else {
                  textRuns.push(new TextRun({ text: child.content }))
                }
              })
            } else {
              textRuns.push(new TextRun({ text: element.content }))
            }
            docxElements.push(new Paragraph({ children: textRuns }))
            break

          case 'ul':
          case 'ol':
            if (element.children) {
              element.children.forEach((listItem, index) => {
                if (listItem.type === 'li') {
                  docxElements.push(
                    new Paragraph({
                      children: [
                        new TextRun({ text: `• ${listItem.content}` }),
                      ],
                    })
                  )
                }
              })
            }
            break

          case 'li':
            docxElements.push(
              new Paragraph({
                children: [new TextRun({ text: `• ${element.content}` })],
              })
            )
            break

          default:
            if (element.content && element.content.trim()) {
              docxElements.push(
                new Paragraph({
                  children: [new TextRun({ text: element.content })],
                })
              )
            }
            break
        }

        if (element.children) {
          docxElements.push(...createDocxElements(element.children))
        }
      })

      return docxElements
    }

    const docxElements = createDocxElements(structuredContent)

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, size: 36 })],
              heading: HeadingLevel.TITLE,
            }),
            new PageBreak(),
            ...docxElements,
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(doc)
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })

    const url = URL.createObjectURL(blob)
    return url
  } catch (error) {
    console.error('DOCX generation error:', error)
    throw new Error(`Failed to generate DOCX: ${error.message}`)
  }
}

// Generate PDF document - now client-side
export async function generatePDF(
  content: string,
  title: string
): Promise<string> {
  try {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - 2 * margin

    let yPosition = margin

    // Title
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    const titleLines = doc.splitTextToSize(title, maxWidth)
    doc.text(titleLines, margin, yPosition)
    yPosition += titleLines.length * 10 + 10

    // Content
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')

    // Parse HTML and convert to plain text
    const root = parse(content)
    const textContent = root.text

    const lines = doc.splitTextToSize(textContent, maxWidth)

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - margin) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin, yPosition)
      yPosition += 7
    })

    const pdfBlob = doc.output('blob')
    const url = URL.createObjectURL(pdfBlob)
    return url
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(`Failed to generate PDF: ${error.message}`)
  }
}

// Helper function to download files
export function downloadFile(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL after download
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
```

### Task 2: Create Client-Side Hook for AI Processing

Create `hooks/use-client-ai.ts`:

```typescript
// Hook for client-side AI processing
'use client'

import { useState, useCallback } from 'react'
import {
  processOutput,
  generateDOCX,
  generatePDF,
  downloadFile,
} from '@/app/client-actions'
import type { FileAttachment, OutputType } from '@/app/actions'

export interface UseClientAIReturn {
  isProcessing: boolean
  isGeneratingDoc: boolean
  processFiles: (
    files: FileAttachment[],
    outputType: OutputType,
    isRegeneration?: boolean
  ) => Promise<string>
  downloadDOCX: (content: string, title: string) => Promise<void>
  downloadPDF: (content: string, title: string) => Promise<void>
  error: string | null
  clearError: () => void
}

export function useClientAI(): UseClientAIReturn {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const processFiles = useCallback(
    async (
      files: FileAttachment[],
      outputType: OutputType,
      isRegeneration = false
    ): Promise<string> => {
      setIsProcessing(true)
      setError(null)

      try {
        const result = await processOutput(files, outputType, isRegeneration)
        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'AI processing failed'
        setError(errorMessage)
        throw err
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const downloadDOCX = useCallback(async (content: string, title: string) => {
    setIsGeneratingDoc(true)
    setError(null)

    try {
      const url = await generateDOCX(content, title)
      downloadFile(url, `${title}.docx`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'DOCX generation failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsGeneratingDoc(false)
    }
  }, [])

  const downloadPDF = useCallback(async (content: string, title: string) => {
    setIsGeneratingDoc(true)
    setError(null)

    try {
      const url = await generatePDF(content, title)
      downloadFile(url, `${title}.pdf`)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'PDF generation failed'
      setError(errorMessage)
      throw err
    } finally {
      setIsGeneratingDoc(false)
    }
  }, [])

  return {
    isProcessing,
    isGeneratingDoc,
    processFiles,
    downloadDOCX,
    downloadPDF,
    error,
    clearError,
  }
}
```

### Task 3: Export New Client Functions

Update `hooks/index.ts` to include the new hook:

```typescript
// Add this export to your existing exports
export * from './use-client-ai'

// Keep all existing exports
export * from './use-files'
export * from './use-mobile'
export * from './use-outputs'
export * from './use-step-tracker'
export * from './use-toast'
```

## Testing Your Work

### Test 1: TypeScript Compilation

```bash
npm run build
```

Should complete without TypeScript errors.

### Test 2: Import Test

Make sure you can import the new client functions:

```typescript
import { processOutput, generateDOCX, generatePDF } from '@/app/client-actions'
import { useClientAI } from '@/hooks/use-client-ai'
```

### Test 3: Basic Functionality Test (Optional)

If you want to test the basic functionality, you can create a simple test component, but this is optional since we'll test everything in Stage 7.

## Expected Behavior

After this stage:

- Client-side actions replace server actions
- AI processing works entirely in the browser
- Document generation (DOCX/PDF) works client-side
- Hook provides easy interface for components
- All processing uses Firebase AI Logic

## Post-Conditions

- [ ] `app/client-actions.ts` file exists with client-side AI processing
- [ ] `hooks/use-client-ai.ts` provides hook interface for AI operations
- [ ] Client-side `processOutput()` uses Firebase AI Logic
- [ ] Client-side `generateDOCX()` creates Word documents in browser
- [ ] Client-side `generatePDF()` creates PDF documents in browser
- [ ] `downloadFile()` helper function handles file downloads
- [ ] `hooks/index.ts` exports the new AI hook
- [ ] Project builds without TypeScript errors (`npm run build` succeeds)
- [ ] You can import all new client-side functions without errors

## Troubleshooting

**Error: "Cannot use import outside a module"**

- Make sure you're using 'use client' directive at the top of client-side files
- Check that your component files are properly marked as client components

**Document generation errors**

- Make sure jsPDF and docx packages are properly installed
- Check that browser supports Blob and URL.createObjectURL APIs
- Verify that HTML parsing is working correctly

**Firebase AI Logic errors**

- Make sure App Check is working (check browser console)
- Verify that Firebase AI Logic is enabled in your project
- Check that your prompts are loading correctly

**Import errors**

- Make sure all file paths are correct
- Check that TypeScript can resolve the imports
- Verify that all dependencies are installed

**"document is not defined" errors**

- This happens when client-side code runs on server
- Make sure you're using 'use client' directive
- Check that components using this are client components

## What's Working Now

- Client-side AI processing with Firebase AI Logic
- Document generation works in the browser
- Easy-to-use hook interface for components
- File download functionality

## What's Not Working Yet

- Components still need to be updated to use the new client-side functions
- Old server actions are still present (we'll remove them later)

## Next Steps

Once this stage is complete, you're ready for Stage 7: Update Components and Hooks.
