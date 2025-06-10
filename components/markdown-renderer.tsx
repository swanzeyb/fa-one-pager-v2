'use client'
import ReactMarkdown from 'react-markdown'
import React from 'react'

import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { ImageUpload } from './image-upload'
import { useFeatureFlag, FEATURE_FLAGS } from '@/lib/posthog'

interface MarkdownRendererProps {
  content: string
  className?: string
  editable?: boolean
}

// Helper function to strip leading numbers from text
function stripLeadingNumbers(text: string): string {
  // This regex matches patterns like "1. ", "1) ", "Step 1: ", etc.
  return text.replace(/^(\d+[.):]|\s*Step\s+\d+[.):]|\s*$$\d+$$)\s*/i, '')
}

export function MarkdownRenderer({
  content,
  className = '',
  editable = false,
}: MarkdownRendererProps) {
  const isImageUploadEnabled = useFeatureFlag(FEATURE_FLAGS.IMAGE_UPLOAD)

  // Process content to clean up numbered lists
  const processContent = (rawContent: string): string => {
    // Find lines that start with numbers and clean them
    return rawContent.replace(
      /^(\d+[.):]|\s*Step\s+\d+[.):]|\s*$$\d+$$)\s*(.*$)/gm,
      '$2'
    )
  }

  const processedContent = processContent(content)

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold mt-4 mb-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-bold mt-3 mb-2" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-4 whitespace-pre-line" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 mb-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 mb-4" {...props} />
          ),
          li: ({ node, ...props }) => {
            // Clean any remaining numbers from list items
            const children = React.Children.map(props.children, (child) => {
              if (typeof child === 'string') {
                return stripLeadingNumbers(child)
              }
              return child
            })

            return <li className="mb-1">{children}</li>
          },
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 italic my-4"
              {...props}
            />
          ),
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline ? (
              <pre className="bg-gray-800 text-gray-100 rounded-md p-4 overflow-x-auto my-4">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-gray-100 px-1 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            )
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table
                className="min-w-full border-collapse border border-gray-300"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-100" {...props} />
          ),
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => (
            <tr className="border-b border-gray-300" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left font-bold" {...props} />
          ),
          td: ({ node, ...props }) => <td className="px-4 py-2" {...props} />,
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t border-gray-300" {...props} />
          ),
          img:
            editable && isImageUploadEnabled
              ? ({ node, ...props }) => (
                  <ImageUpload
                    alt={props.alt || ''}
                    src={props.src || '/placeholder.svg'}
                  />
                )
              : ({ node, ...props }) => (
                  <img className="max-w-full h-auto my-4 rounded" {...props} />
                ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}
