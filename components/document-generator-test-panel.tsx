'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  runAllTests,
  benchmarkDocumentGeneration,
  TEST_HTML_SAMPLES,
  type TEST_HTML_SAMPLES as TestSamples,
} from '@/lib/document-generator-tests'
import { generateUnifiedDocument } from '@/lib/document-generator'

interface TestResults {
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
}

interface BenchmarkResults {
  pdf: { avg: number; min: number; max: number; times: number[] }
  docx: { avg: number; min: number; max: number; times: number[] }
}

export function DocumentGeneratorTestPanel() {
  const [testResults, setTestResults] = useState<TestResults | null>(null)
  const [benchmarkResults, setBenchmarkResults] =
    useState<BenchmarkResults | null>(null)
  const [isRunningTests, setIsRunningTests] = useState(false)
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false)
  const [customContent, setCustomContent] = useState('')
  const [customTitle, setCustomTitle] = useState('Custom Test Document')
  const [downloadProgress, setDownloadProgress] = useState(0)

  const runTests = useCallback(async () => {
    setIsRunningTests(true)
    try {
      const results = await runAllTests()
      setTestResults(results)
    } catch (error) {
      console.error('Error running tests:', error)
    } finally {
      setIsRunningTests(false)
    }
  }, [])

  const runBenchmark = useCallback(async () => {
    setIsRunningBenchmark(true)
    try {
      const results = await benchmarkDocumentGeneration(5)
      setBenchmarkResults(results)
    } catch (error) {
      console.error('Error running benchmark:', error)
    } finally {
      setIsRunningBenchmark(false)
    }
  }, [])

  const testCustomContent = useCallback(
    async (format: 'pdf' | 'docx') => {
      if (!customContent.trim()) {
        alert('Please enter some content to test')
        return
      }

      try {
        setDownloadProgress(25)
        const dataUri = await generateUnifiedDocument(
          customContent,
          customTitle,
          format
        )
        setDownloadProgress(75)

        // Create download link
        const link = document.createElement('a')
        link.href = dataUri
        link.download = `test-document.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setDownloadProgress(100)
        setTimeout(() => setDownloadProgress(0), 1000)
      } catch (error) {
        console.error(`Error generating ${format}:`, error)
        alert(
          `Error generating ${format}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        )
        setDownloadProgress(0)
      }
    },
    [customContent, customTitle]
  )

  const loadSample = useCallback(
    (sampleKey: keyof typeof TEST_HTML_SAMPLES) => {
      setCustomContent(TEST_HTML_SAMPLES[sampleKey])
      setCustomTitle(`Sample: ${sampleKey}`)
    },
    []
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED':
        return 'bg-green-500'
      case 'FAILED':
        return 'bg-red-500'
      case 'ERROR':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Generator Test Panel</CardTitle>
          <CardDescription>
            Test and validate the unified document generation system for
            consistency across PDF and DOCX formats.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">Run Tests</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
          <TabsTrigger value="custom">Custom Test</TabsTrigger>
          <TabsTrigger value="samples">Samples</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Automated Tests</CardTitle>
              <CardDescription>
                Run comprehensive tests to validate HTML processing, parsing,
                and document generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runTests} disabled={isRunningTests}>
                {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
              </Button>

              {testResults && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {testResults.summary.totalPassed}
                        </div>
                        <div className="text-sm text-gray-600">Passed</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">
                          {testResults.summary.totalFailed}
                        </div>
                        <div className="text-sm text-gray-600">Failed</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold">
                          {testResults.summary.totalTests}
                        </div>
                        <div className="text-sm text-gray-600">Total</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {testResults.summary.passRate.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Pass Rate</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(testResults)
                      .filter(([key]) => key !== 'summary')
                      .map(([category, results]) => (
                        <Card key={category}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg capitalize">
                              {category}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {results.results.map(
                              (result: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center space-x-2"
                                >
                                  <Badge
                                    className={getStatusColor(result.status)}
                                  >
                                    {result.status}
                                  </Badge>
                                  <span className="text-sm">{result.name}</span>
                                  {result.error && (
                                    <span className="text-xs text-red-600">
                                      ({result.error})
                                    </span>
                                  )}
                                </div>
                              )
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Benchmark</CardTitle>
              <CardDescription>
                Measure document generation performance for both PDF and DOCX
                formats.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runBenchmark} disabled={isRunningBenchmark}>
                {isRunningBenchmark ? 'Running Benchmark...' : 'Run Benchmark'}
              </Button>

              {benchmarkResults && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">PDF Generation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Average:</span>
                        <span>{benchmarkResults.pdf.avg.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min:</span>
                        <span>{benchmarkResults.pdf.min.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max:</span>
                        <span>{benchmarkResults.pdf.max.toFixed(2)}ms</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">DOCX Generation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span>Average:</span>
                        <span>{benchmarkResults.docx.avg.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min:</span>
                        <span>{benchmarkResults.docx.min.toFixed(2)}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max:</span>
                        <span>{benchmarkResults.docx.max.toFixed(2)}ms</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Content Test</CardTitle>
              <CardDescription>
                Test document generation with your own content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Title</label>
                <Input
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter document title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">HTML Content</label>
                <Textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Enter HTML content to test"
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {downloadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating document...</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <Progress value={downloadProgress} />
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => testCustomContent('pdf')}
                  disabled={downloadProgress > 0}
                >
                  Generate PDF
                </Button>
                <Button
                  onClick={() => testCustomContent('docx')}
                  disabled={downloadProgress > 0}
                >
                  Generate DOCX
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="samples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sample Content</CardTitle>
              <CardDescription>
                Load predefined HTML samples for testing different scenarios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(TEST_HTML_SAMPLES).map(([key, content]) => (
                  <Card
                    key={key}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      loadSample(key as keyof typeof TEST_HTML_SAMPLES)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="font-medium capitalize mb-2">{key}</div>
                      <div className="text-xs text-gray-600 truncate">
                        {content.substring(0, 100)}...
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
