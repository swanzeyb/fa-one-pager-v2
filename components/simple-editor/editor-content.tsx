'use client'

import { useSimpleEditor } from './simple-editor-context'
import { useEffect } from 'react'

interface EditorContentProps {
  className?: string
}

export function EditorContent({ className = '' }: EditorContentProps) {
  const { editorRef, isReadOnly, handleContentChange } = useSimpleEditor()

  // Add key event handling for Enter and Backspace keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isReadOnly) return

      if (e.key === 'Enter' && !e.shiftKey) {
        // Let the browser handle the Enter key naturally
        // This will create a new line in contentEditable elements
        setTimeout(() => handleContentChange(), 0)
      } else if (e.key === 'Backspace') {
        e.preventDefault() // Always prevent default to have full control
        
        const selection = window.getSelection()
        if (!selection || selection.rangeCount === 0) return

        const range = selection.getRangeAt(0)

        // Handle selection ranges (delete selected content)
        if (!range.collapsed) {
          range.deleteContents()
          setTimeout(() => handleContentChange(), 0)
          return
        }

        const container = range.startContainer
        const offset = range.startOffset

        // Helper function to get the block element containing the cursor
        const getBlockElement = (node: Node): Element | null => {
          let current =
            node.nodeType === Node.TEXT_NODE
              ? node.parentElement
              : (node as Element)
          while (current && current !== editorRef.current) {
            if (
              current.tagName &&
              ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV'].includes(
                current.tagName
              )
            ) {
              return current
            }
            current = current.parentElement
          }
          return null
        }

        // Helper function to move cursor to end of element
        const moveCursorToEndOf = (element: Element) => {
          const newRange = document.createRange()
          const lastNode = element.lastChild

          if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
            newRange.setStart(lastNode, lastNode.textContent?.length || 0)
          } else if (lastNode) {
            newRange.setStart(element, element.childNodes.length)
          } else {
            newRange.setStart(element, 0)
          }

          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }

        // Helper function to check if a block element is effectively empty
        const isEmptyBlock = (element: Element): boolean => {
          const text = element.textContent?.trim() || ''
          const html = element.innerHTML.trim()
          return !text || html === '<br>' || html === '<br/>' || html === '&nbsp;' || !html
        }

        // Special case: cursor is on a BR element (empty line)
        if (
          container.nodeType === Node.ELEMENT_NODE &&
          (container as Element).tagName === 'BR'
        ) {
          const blockElement = getBlockElement(container)
          if (blockElement && blockElement.previousElementSibling) {
            moveCursorToEndOf(blockElement.previousElementSibling)
            blockElement.remove()
            setTimeout(() => handleContentChange(), 0)
            return
          }
        }

        // Special case: cursor is in an effectively empty text node or empty block
        if (container.nodeType === Node.TEXT_NODE && offset === 0) {
          const textContent = (container as Text).textContent || ''
          if (textContent.trim() === '' || textContent === '\u00A0') {
            // Check for empty or non-breaking space
            const blockElement = getBlockElement(container)
            if (blockElement && blockElement.previousElementSibling) {
              moveCursorToEndOf(blockElement.previousElementSibling)
              blockElement.remove()
              setTimeout(() => handleContentChange(), 0)
              return
            }
          }
        }

        // Additional case: cursor is at the start of an empty block element
        if (container.nodeType === Node.ELEMENT_NODE && offset === 0) {
          const blockElement = getBlockElement(container)
          if (blockElement && isEmptyBlock(blockElement) && blockElement.previousElementSibling) {
            moveCursorToEndOf(blockElement.previousElementSibling)
            blockElement.remove()
            setTimeout(() => handleContentChange(), 0)
            return
          }
        }

        // Case 1: At the beginning of a block element
        if (offset === 0) {
          const blockElement = getBlockElement(container)

          if (blockElement) {
            const previousSibling = blockElement.previousElementSibling

            if (previousSibling) {
              // Check if current block is empty using helper function
              const isEmpty = isEmptyBlock(blockElement)
              const currentText = blockElement.textContent?.trim() || ''

              if (isEmpty) {
                // For empty blocks, just remove them and move cursor to end of previous
                moveCursorToEndOf(previousSibling)
                blockElement.remove()
              } else {
                // Merge with previous block
                const previousText = previousSibling.textContent?.trim() || ''

                // Clean up the previous element's HTML
                let previousHTML = previousSibling.innerHTML.replace(
                  /<br\s*\/?>\s*$/gi,
                  ''
                )

                // Clean current HTML (remove <br> tags used for empty line display)
                let currentHTML = blockElement.innerHTML.replace(
                  /<br\s*\/?>/gi,
                  ''
                )

                // Add space if both elements have content
                const separator = previousText && currentText ? ' ' : ''

                // Merge the content
                previousSibling.innerHTML =
                  previousHTML + separator + currentHTML

                // Position cursor at the junction
                moveCursorToEndOf(previousSibling)
                if (separator) {
                  // Move cursor back by the length of the merged content
                  const newRange = document.createRange()
                  const textNode = previousSibling.lastChild
                  if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                    const junctionPoint = (previousHTML + separator).replace(
                      /<[^>]*>/g,
                      ''
                    ).length
                    newRange.setStart(
                      textNode,
                      Math.min(junctionPoint, textNode.textContent?.length || 0)
                    )
                    newRange.collapse(true)
                    selection.removeAllRanges()
                    selection.addRange(newRange)
                  }
                }

                blockElement.remove()
              }

              setTimeout(() => handleContentChange(), 0)
              return
            }
          }
        }

        // Case 2: Regular character deletion within text
        if (container.nodeType === Node.TEXT_NODE && offset > 0) {
          const textNode = container as Text
          const beforeText =
            textNode.textContent?.substring(0, offset - 1) || ''
          const afterText = textNode.textContent?.substring(offset) || ''

          textNode.textContent = beforeText + afterText

          // Position cursor
          const newRange = document.createRange()
          newRange.setStart(textNode, offset - 1)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)

          setTimeout(() => handleContentChange(), 0)
          return
        }

        // Case 3: At the beginning of a text node but not at block beginning
        if (container.nodeType === Node.TEXT_NODE && offset === 0) {
          const textNode = container as Text
          const parentElement = textNode.parentElement

          if (parentElement) {
            // Find previous text content
            const walker = document.createTreeWalker(
              editorRef.current!,
              NodeFilter.SHOW_TEXT,
              null
            )

            let currentNode = (walker.currentNode = textNode)
            let previousTextNode = walker.previousNode() as Text

            if (previousTextNode) {
              // Merge with previous text node
              const previousLength = previousTextNode.textContent?.length || 0
              previousTextNode.textContent =
                (previousTextNode.textContent || '') +
                (textNode.textContent || '')

              // Position cursor
              const newRange = document.createRange()
              newRange.setStart(previousTextNode, previousLength)
              newRange.collapse(true)
              selection.removeAllRanges()
              selection.addRange(newRange)

              // Remove the current text node if it's now empty
              if (!textNode.textContent) {
                textNode.remove()
              }

              setTimeout(() => handleContentChange(), 0)
              return
            }
          }
        }

        // Fallback: Don't do anything if we can't handle it properly
        setTimeout(() => handleContentChange(), 0)
      }
    }

    const editorElement = editorRef.current
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [editorRef, isReadOnly, handleContentChange])

  return (
    <div
      ref={editorRef}
      contentEditable={!isReadOnly}
      onInput={handleContentChange}
      onBlur={handleContentChange}
      className={`p-4 min-h-[200px] max-h-[calc(100vh-400px)] overflow-y-auto focus:outline-none ${className}`}
      style={{
        whiteSpace: 'pre-wrap',
        counterReset: 'item', // Reset counter for ordered lists
      }}
    />
  )
}
