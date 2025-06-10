/**
 * Document Consistency Validator
 *
 * This module provides utilities to validate that PDF and DOCX outputs
 * maintain consistent formatting and content structure.
 */

import {
  parseHtmlToDocumentStructure,
  generatePDFFromStructure,
  generateDOCXFromStructure,
  type DocumentElement,
} from './document-generator'

export interface ConsistencyReport {
  isConsistent: boolean
  warnings: string[]
  errors: string[]
  metrics: {
    elementCount: number
    headingCount: number
    paragraphCount: number
    listCount: number
    totalContentLength: number
  }
  formatSpecific: {
    pdf: {
      dataSize: number
      generationTime: number
      isValid: boolean
    }
    docx: {
      dataSize: number
      generationTime: number
      isValid: boolean
    }
  }
}

/**
 * Analyzes document structure for potential consistency issues
 */
export function analyzeDocumentStructure(elements: DocumentElement[]): {
  warnings: string[]
  metrics: ConsistencyReport['metrics']
} {
  const warnings: string[] = []
  const metrics = {
    elementCount: elements.length,
    headingCount: 0,
    paragraphCount: 0,
    listCount: 0,
    totalContentLength: 0,
  }

  let hasTitle = false
  let previousHeadingLevel = 0

  for (const element of elements) {
    metrics.totalContentLength += element.content.length

    switch (element.type) {
      case 'title':
        hasTitle = true
        break

      case 'heading':
        metrics.headingCount++
        const level = element.level || 1

        // Check for heading hierarchy issues
        if (level > previousHeadingLevel + 1 && previousHeadingLevel > 0) {
          warnings.push(
            `Heading hierarchy skip detected: H${previousHeadingLevel} to H${level}`
          )
        }
        previousHeadingLevel = level
        break

      case 'paragraph':
        metrics.paragraphCount++

        // Check for very short paragraphs that might be formatting artifacts
        if (element.content.length < 10) {
          warnings.push(`Very short paragraph detected: "${element.content}"`)
        }
        break

      case 'list':
        metrics.listCount++

        // Check for empty lists
        if (!element.children || element.children.length === 0) {
          warnings.push('Empty list detected')
        }
        break
    }
  }

  // Document structure warnings
  if (!hasTitle) {
    warnings.push('Document has no title')
  }

  if (metrics.elementCount === 0) {
    warnings.push('Document has no content elements')
  }

  if (metrics.totalContentLength < 50) {
    warnings.push('Document content is very short')
  }

  return { warnings, metrics }
}

/**
 * Validates consistency between PDF and DOCX generation
 */
export async function validateDocumentConsistency(
  htmlContent: string,
  title: string
): Promise<ConsistencyReport> {
  const warnings: string[] = []
  const errors: string[] = []

  try {
    // Parse HTML into structured format
    const elements = parseHtmlToDocumentStructure(htmlContent, title)

    // Analyze structure
    const analysis = analyzeDocumentStructure(elements)
    warnings.push(...analysis.warnings)

    // Generate both formats and measure performance
    const pdfStartTime = performance.now()
    let pdfDataUri: string
    let pdfValid = false
    let pdfError: string | null = null

    try {
      pdfDataUri = generatePDFFromStructure(elements)
      pdfValid = pdfDataUri.startsWith('data:application/pdf;base64,')
      if (!pdfValid) {
        errors.push('PDF generation returned invalid data URI')
      }
    } catch (error) {
      pdfError =
        error instanceof Error ? error.message : 'Unknown PDF generation error'
      errors.push(`PDF generation failed: ${pdfError}`)
      pdfDataUri = ''
    }
    const pdfEndTime = performance.now()

    const docxStartTime = performance.now()
    let docxDataUri: string
    let docxValid = false
    let docxError: string | null = null

    try {
      docxDataUri = await generateDOCXFromStructure(elements)
      docxValid = docxDataUri.startsWith(
        'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,'
      )
      if (!docxValid) {
        errors.push('DOCX generation returned invalid data URI')
      }
    } catch (error) {
      docxError =
        error instanceof Error ? error.message : 'Unknown DOCX generation error'
      errors.push(`DOCX generation failed: ${docxError}`)
      docxDataUri = ''
    }
    const docxEndTime = performance.now()

    // Performance comparison
    const pdfTime = pdfEndTime - pdfStartTime
    const docxTime = docxEndTime - docxStartTime
    const timeDifference = Math.abs(pdfTime - docxTime)

    if (timeDifference > 1000) {
      // More than 1 second difference
      warnings.push(
        `Significant performance difference between formats: PDF ${pdfTime.toFixed(
          0
        )}ms, DOCX ${docxTime.toFixed(0)}ms`
      )
    }

    // Size comparison
    const pdfSize = pdfDataUri.length
    const docxSize = docxDataUri.length
    const sizeDifference =
      Math.abs(pdfSize - docxSize) / Math.max(pdfSize, docxSize)

    if (sizeDifference > 2) {
      // More than 200% size difference
      warnings.push(
        `Significant size difference between formats: PDF ${pdfSize} bytes, DOCX ${docxSize} bytes`
      )
    }

    // Content validation
    if (pdfValid && docxValid) {
      // Both formats generated successfully - check for content consistency
      // This is a basic check - more sophisticated content comparison could be added
      const pdfContentIndicator = pdfDataUri.length
      const docxContentIndicator = docxDataUri.length

      if (
        Math.abs(pdfContentIndicator - docxContentIndicator) >
        docxContentIndicator * 0.5
      ) {
        warnings.push(
          'Generated documents may have significantly different content sizes'
        )
      }
    }

    const isConsistent = errors.length === 0 && pdfValid && docxValid

    return {
      isConsistent,
      warnings,
      errors,
      metrics: analysis.metrics,
      formatSpecific: {
        pdf: {
          dataSize: pdfSize,
          generationTime: pdfTime,
          isValid: pdfValid,
        },
        docx: {
          dataSize: docxSize,
          generationTime: docxTime,
          isValid: docxValid,
        },
      },
    }
  } catch (error) {
    errors.push(
      `Document consistency validation failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )

    return {
      isConsistent: false,
      warnings,
      errors,
      metrics: {
        elementCount: 0,
        headingCount: 0,
        paragraphCount: 0,
        listCount: 0,
        totalContentLength: 0,
      },
      formatSpecific: {
        pdf: {
          dataSize: 0,
          generationTime: 0,
          isValid: false,
        },
        docx: {
          dataSize: 0,
          generationTime: 0,
          isValid: false,
        },
      },
    }
  }
}

/**
 * Batch validate multiple documents for consistency
 */
export async function batchValidateConsistency(
  documents: Array<{ content: string; title: string; id?: string }>
): Promise<{
  overall: {
    totalDocuments: number
    consistentDocuments: number
    inconsistentDocuments: number
    failedDocuments: number
    consistencyRate: number
  }
  results: Array<{
    id?: string
    title: string
    report: ConsistencyReport
  }>
}> {
  const results: Array<{
    id?: string
    title: string
    report: ConsistencyReport
  }> = []

  let consistentCount = 0
  let inconsistentCount = 0
  let failedCount = 0

  for (const doc of documents) {
    try {
      const report = await validateDocumentConsistency(doc.content, doc.title)

      if (report.errors.length > 0) {
        failedCount++
      } else if (report.isConsistent) {
        consistentCount++
      } else {
        inconsistentCount++
      }

      results.push({
        id: doc.id,
        title: doc.title,
        report,
      })
    } catch (error) {
      failedCount++
      results.push({
        id: doc.id,
        title: doc.title,
        report: {
          isConsistent: false,
          warnings: [],
          errors: [
            `Validation failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          ],
          metrics: {
            elementCount: 0,
            headingCount: 0,
            paragraphCount: 0,
            listCount: 0,
            totalContentLength: 0,
          },
          formatSpecific: {
            pdf: { dataSize: 0, generationTime: 0, isValid: false },
            docx: { dataSize: 0, generationTime: 0, isValid: false },
          },
        },
      })
    }
  }

  const totalDocuments = documents.length
  const consistencyRate =
    totalDocuments > 0 ? (consistentCount / totalDocuments) * 100 : 0

  return {
    overall: {
      totalDocuments,
      consistentDocuments: consistentCount,
      inconsistentDocuments: inconsistentCount,
      failedDocuments: failedCount,
      consistencyRate,
    },
    results,
  }
}

/**
 * Generate a detailed consistency report in markdown format
 */
export function generateConsistencyReportMarkdown(
  report: ConsistencyReport,
  title: string
): string {
  const { isConsistent, warnings, errors, metrics, formatSpecific } = report

  let markdown = `# Document Consistency Report: ${title}\n\n`

  // Overall status
  markdown += `## Overall Status\n`
  markdown += `**${isConsistent ? '✅ CONSISTENT' : '❌ INCONSISTENT'}**\n\n`

  // Metrics
  markdown += `## Document Metrics\n`
  markdown += `- **Elements**: ${metrics.elementCount}\n`
  markdown += `- **Headings**: ${metrics.headingCount}\n`
  markdown += `- **Paragraphs**: ${metrics.paragraphCount}\n`
  markdown += `- **Lists**: ${metrics.listCount}\n`
  markdown += `- **Content Length**: ${metrics.totalContentLength} characters\n\n`

  // Format comparison
  markdown += `## Format Comparison\n`
  markdown += `| Metric | PDF | DOCX |\n`
  markdown += `|--------|-----|------|\n`
  markdown += `| Valid | ${formatSpecific.pdf.isValid ? '✅' : '❌'} | ${
    formatSpecific.docx.isValid ? '✅' : '❌'
  } |\n`
  markdown += `| Generation Time | ${formatSpecific.pdf.generationTime.toFixed(
    2
  )}ms | ${formatSpecific.docx.generationTime.toFixed(2)}ms |\n`
  markdown += `| Data Size | ${formatSpecific.pdf.dataSize} bytes | ${formatSpecific.docx.dataSize} bytes |\n\n`

  // Warnings
  if (warnings.length > 0) {
    markdown += `## Warnings\n`
    warnings.forEach((warning) => {
      markdown += `- ⚠️ ${warning}\n`
    })
    markdown += `\n`
  }

  // Errors
  if (errors.length > 0) {
    markdown += `## Errors\n`
    errors.forEach((error) => {
      markdown += `- ❌ ${error}\n`
    })
    markdown += `\n`
  }

  // Recommendations
  markdown += `## Recommendations\n`
  if (isConsistent && warnings.length === 0) {
    markdown += `- ✅ Document generation is working optimally\n`
  } else {
    if (errors.length > 0) {
      markdown += `- 🔧 Fix the errors listed above before proceeding\n`
    }
    if (warnings.length > 0) {
      markdown += `- 📝 Review and address the warnings to improve document quality\n`
    }
    if (!formatSpecific.pdf.isValid) {
      markdown += `- 🔧 PDF generation failed - check HTML content and formatting\n`
    }
    if (!formatSpecific.docx.isValid) {
      markdown += `- 🔧 DOCX generation failed - check HTML content and formatting\n`
    }
  }

  return markdown
}
