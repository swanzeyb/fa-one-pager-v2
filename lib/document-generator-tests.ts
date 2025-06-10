/**
 * Document Generation Tests and Validation
 *
 * This module provides testing utilities and validation functions for the unified document generation system.
 */

import {
  preprocessHtml,
  validateHtmlContent,
  parseHtmlToDocumentStructure,
  generateUnifiedDocument,
  type DocumentElement,
} from './document-generator'

// Test HTML samples for validation
export const TEST_HTML_SAMPLES = {
  simple: '<p>This is a simple paragraph.</p>',

  complex: `
    <h1>Main Title</h1>
    <p>This is an introduction paragraph with some <strong>bold text</strong>.</p>
    <h2>Section One</h2>
    <p>This section contains a list:</p>
    <ul>
      <li>First item</li>
      <li>Second item with more text</li>
      <li>Third item</li>
    </ul>
    <h2>Section Two</h2>
    <p>This section has an ordered list:</p>
    <ol>
      <li>Step one</li>
      <li>Step two</li>
      <li>Step three</li>
    </ol>
    <pagebreak>
    <h1>Second Page</h1>
    <p>This content should appear on a new page.</p>
  `,

  malformed: `
    <h1>Unclosed heading
    <p>Missing closing tag
    <ul>
      <li>List item one
      <li>List item two</li>
    </ol>
    <div style="page-break-before: always;">Page break</div>
  `,

  empty: '',

  plainText: 'This is just plain text without any HTML tags.',

  withImages: `
    <h1>Document with Images</h1>
    <p>Here is some text before an image.</p>
    <img src="data:image/png;base64,..." alt="Sample Image" />
    <p>And some text after the image.</p>
  `,

  nested: `
    <div>
      <h1>Nested Content</h1>
      <div>
        <p>This paragraph is nested inside divs.</p>
        <div>
          <ul>
            <li>Deeply nested list item</li>
          </ul>
        </div>
      </div>
    </div>
  `,
}

/**
 * Test the HTML preprocessing function
 */
export function testHtmlPreprocessing(): {
  passed: number
  failed: number
  results: any[]
} {
  const tests = [
    {
      name: 'Simple HTML',
      input: TEST_HTML_SAMPLES.simple,
      expected: (result: string) =>
        result.includes('<p>') && result.includes('</p>'),
    },
    {
      name: 'Empty content',
      input: TEST_HTML_SAMPLES.empty,
      expected: (result: string) => result === '',
    },
    {
      name: 'Plain text',
      input: TEST_HTML_SAMPLES.plainText,
      expected: (result: string) =>
        result.includes('<p>') && result.includes('This is just plain text'),
    },
    {
      name: 'Script tag removal',
      input:
        '<p>Safe content</p><script>alert("danger")</script><p>More safe content</p>',
      expected: (result: string) =>
        !result.includes('<script>') && result.includes('Safe content'),
    },
    {
      name: 'Page break normalization',
      input: '<div style="page-break-before: always;">Content</div>',
      expected: (result: string) => result.includes('<pagebreak>'),
    },
  ]

  const results: any[] = []
  let passed = 0
  let failed = 0

  tests.forEach((test) => {
    try {
      const result = preprocessHtml(test.input)
      const success = test.expected(result)

      if (success) {
        passed++
        results.push({ name: test.name, status: 'PASSED', result })
      } else {
        failed++
        results.push({
          name: test.name,
          status: 'FAILED',
          result,
          input: test.input,
        })
      }
    } catch (error) {
      failed++
      results.push({
        name: test.name,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  return { passed, failed, results }
}

/**
 * Test the HTML validation function
 */
export function testHtmlValidation(): {
  passed: number
  failed: number
  results: any[]
} {
  const tests = [
    {
      name: 'Valid HTML',
      input: TEST_HTML_SAMPLES.simple,
      expectedValid: true,
    },
    {
      name: 'Complex valid HTML',
      input: TEST_HTML_SAMPLES.complex,
      expectedValid: true,
    },
    {
      name: 'Empty content',
      input: TEST_HTML_SAMPLES.empty,
      expectedValid: false,
    },
    {
      name: 'Malformed HTML',
      input: TEST_HTML_SAMPLES.malformed,
      expectedValid: false,
    },
    {
      name: 'Plain text',
      input: TEST_HTML_SAMPLES.plainText,
      expectedValid: true,
    },
  ]

  const results: any[] = []
  let passed = 0
  let failed = 0

  tests.forEach((test) => {
    try {
      const validation = validateHtmlContent(test.input)
      const success = validation.isValid === test.expectedValid

      if (success) {
        passed++
        results.push({ name: test.name, status: 'PASSED', validation })
      } else {
        failed++
        results.push({
          name: test.name,
          status: 'FAILED',
          expected: test.expectedValid,
          actual: validation.isValid,
          validation,
        })
      }
    } catch (error) {
      failed++
      results.push({
        name: test.name,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  return { passed, failed, results }
}

/**
 * Test the HTML parsing to document structure
 */
export function testDocumentStructureParsing(): {
  passed: number
  failed: number
  results: any[]
} {
  const tests = [
    {
      name: 'Simple paragraph',
      input: TEST_HTML_SAMPLES.simple,
      title: 'Test Document',
      validate: (elements: DocumentElement[]) => {
        return (
          elements.length >= 2 && // title + paragraph
          elements[0].type === 'title' &&
          elements[1].type === 'paragraph'
        )
      },
    },
    {
      name: 'Complex structure',
      input: TEST_HTML_SAMPLES.complex,
      title: 'Complex Test',
      validate: (elements: DocumentElement[]) => {
        const types = elements.map((el) => el.type)
        return (
          types.includes('title') &&
          types.includes('heading') &&
          types.includes('paragraph') &&
          types.includes('list') &&
          types.includes('pageBreak')
        )
      },
    },
    {
      name: 'List handling',
      input: '<ul><li>Item 1</li><li>Item 2</li></ul>',
      title: 'List Test',
      validate: (elements: DocumentElement[]) => {
        const listElement = elements.find((el) => el.type === 'list')
        return (
          listElement &&
          listElement.listType === 'unordered' &&
          listElement.children &&
          listElement.children.length === 2
        )
      },
    },
    {
      name: 'Heading levels',
      input: '<h1>H1</h1><h2>H2</h2><h3>H3</h3>',
      title: 'Heading Test',
      validate: (elements: DocumentElement[]) => {
        const headings = elements.filter((el) => el.type === 'heading')
        return (
          headings.length === 3 &&
          headings[0].level === 1 &&
          headings[1].level === 2 &&
          headings[2].level === 3
        )
      },
    },
  ]

  const results: any[] = []
  let passed = 0
  let failed = 0

  tests.forEach((test) => {
    try {
      const elements = parseHtmlToDocumentStructure(test.input, test.title)
      const success = test.validate(elements)

      if (success) {
        passed++
        results.push({
          name: test.name,
          status: 'PASSED',
          elementCount: elements.length,
        })
      } else {
        failed++
        results.push({
          name: test.name,
          status: 'FAILED',
          elements,
          elementTypes: elements.map((el) => ({
            type: el.type,
            level: el.level,
            content: el.content.substring(0, 50),
          })),
        })
      }
    } catch (error) {
      failed++
      results.push({
        name: test.name,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  return { passed, failed, results }
}

/**
 * Test document generation consistency between formats
 */
export async function testDocumentGenerationConsistency(): Promise<{
  passed: number
  failed: number
  results: any[]
}> {
  const testCases = [
    {
      name: 'Simple content',
      content: TEST_HTML_SAMPLES.simple,
      title: 'Simple Test',
    },
    {
      name: 'Complex content',
      content: TEST_HTML_SAMPLES.complex,
      title: 'Complex Test',
    },
  ]

  const results: any[] = []
  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    try {
      // Generate both formats
      const pdfResult = await generateUnifiedDocument(
        testCase.content,
        testCase.title,
        'pdf'
      )
      const docxResult = await generateUnifiedDocument(
        testCase.content,
        testCase.title,
        'docx'
      )

      // Basic validation - both should be data URIs with correct MIME types
      const pdfValid = pdfResult.startsWith('data:application/pdf;base64,')
      const docxValid = docxResult.startsWith(
        'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,'
      )

      if (pdfValid && docxValid) {
        passed++
        results.push({
          name: testCase.name,
          status: 'PASSED',
          pdfSize: pdfResult.length,
          docxSize: docxResult.length,
        })
      } else {
        failed++
        results.push({
          name: testCase.name,
          status: 'FAILED',
          pdfValid,
          docxValid,
          pdfStart: pdfResult.substring(0, 100),
          docxStart: docxResult.substring(0, 100),
        })
      }
    } catch (error) {
      failed++
      results.push({
        name: testCase.name,
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return { passed, failed, results }
}

/**
 * Run all tests and return comprehensive results
 */
export async function runAllTests(): Promise<{
  preprocessing: { passed: number; failed: number; results: any[] }
  validation: { passed: number; failed: number; results: any[] }
  parsing: { passed: number; failed: number; results: any[] }
  generation: { passed: number; failed: number; results: any[] }
  summary: {
    totalTests: number
    totalPassed: number
    totalFailed: number
    passRate: number
  }
}> {
  console.log('Running document generation tests...')

  const preprocessing = testHtmlPreprocessing()
  console.log(
    `Preprocessing: ${preprocessing.passed}/${
      preprocessing.passed + preprocessing.failed
    } passed`
  )

  const validation = testHtmlValidation()
  console.log(
    `Validation: ${validation.passed}/${
      validation.passed + validation.failed
    } passed`
  )

  const parsing = testDocumentStructureParsing()
  console.log(
    `Parsing: ${parsing.passed}/${parsing.passed + parsing.failed} passed`
  )

  const generation = await testDocumentGenerationConsistency()
  console.log(
    `Generation: ${generation.passed}/${
      generation.passed + generation.failed
    } passed`
  )

  const totalTests =
    preprocessing.passed +
    preprocessing.failed +
    validation.passed +
    validation.failed +
    parsing.passed +
    parsing.failed +
    generation.passed +
    generation.failed

  const totalPassed =
    preprocessing.passed +
    validation.passed +
    parsing.passed +
    generation.passed
  const totalFailed =
    preprocessing.failed +
    validation.failed +
    parsing.failed +
    generation.failed
  const passRate = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0

  return {
    preprocessing,
    validation,
    parsing,
    generation,
    summary: {
      totalTests,
      totalPassed,
      totalFailed,
      passRate,
    },
  }
}

/**
 * Performance benchmark for document generation
 */
export async function benchmarkDocumentGeneration(
  iterations: number = 10
): Promise<{
  pdf: { avg: number; min: number; max: number; times: number[] }
  docx: { avg: number; min: number; max: number; times: number[] }
}> {
  const testContent = TEST_HTML_SAMPLES.complex
  const testTitle = 'Benchmark Test'

  const pdfTimes: number[] = []
  const docxTimes: number[] = []

  // Warm up
  await generateUnifiedDocument(testContent, testTitle, 'pdf')
  await generateUnifiedDocument(testContent, testTitle, 'docx')

  // Benchmark PDF generation
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await generateUnifiedDocument(testContent, testTitle, 'pdf')
    const end = performance.now()
    pdfTimes.push(end - start)
  }

  // Benchmark DOCX generation
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await generateUnifiedDocument(testContent, testTitle, 'docx')
    const end = performance.now()
    docxTimes.push(end - start)
  }

  const pdfStats = {
    avg: pdfTimes.reduce((a, b) => a + b, 0) / pdfTimes.length,
    min: Math.min(...pdfTimes),
    max: Math.max(...pdfTimes),
    times: pdfTimes,
  }

  const docxStats = {
    avg: docxTimes.reduce((a, b) => a + b, 0) / docxTimes.length,
    min: Math.min(...docxTimes),
    max: Math.max(...docxTimes),
    times: docxTimes,
  }

  return { pdf: pdfStats, docx: docxStats }
}
