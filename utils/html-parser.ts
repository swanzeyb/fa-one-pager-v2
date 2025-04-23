/**
 * Parses HTML content and converts it to a structured format
 * @param html The HTML content to parse
 * @returns An array of structured elements
 */
export interface StructuredElement {
  type: string
  content: string
  attributes?: Record<string, string>
  children?: StructuredElement[]
}

export function parseHtmlToStructure(html: string): StructuredElement[] {
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = html

  // Convert the DOM elements to a structured format
  return Array.from(tempDiv.childNodes).map((node) => nodeToStructure(node))
}

function nodeToStructure(node: Node): StructuredElement {
  // Text node
  if (node.nodeType === Node.TEXT_NODE) {
    const content = node.textContent?.trim() || ""
    // Skip empty text nodes
    if (!content) {
      return { type: "text", content: "" }
    }
    return { type: "text", content }
  }

  // Element node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element
    const type = element.tagName.toLowerCase()

    // Handle special cases
    if (type === "br") {
      return { type: "br", content: "" }
    }

    // Extract attributes
    const attributes: Record<string, string> = {}
    Array.from(element.attributes).forEach((attr) => {
      attributes[attr.name] = attr.value
    })

    // Extract content and children
    let content = ""
    const children: StructuredElement[] = []

    if (element.childNodes.length > 0) {
      // If there are child nodes, process them
      Array.from(element.childNodes).forEach((childNode) => {
        children.push(nodeToStructure(childNode))
      })

      // For simple elements with only text content, extract it directly
      if (children.length === 1 && children[0].type === "text") {
        content = children[0].content
      }
    } else {
      // For empty elements
      content = ""
    }

    return {
      type,
      content,
      attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
      children: children.length > 0 ? children : undefined,
    }
  }

  // Default case for other node types
  return { type: "unknown", content: node.textContent || "" }
}

/**
 * Converts a structured format back to HTML
 * @param structure The structured elements to convert
 * @returns HTML string
 */
export function structureToHtml(structure: StructuredElement[]): string {
  return structure.map((element) => elementToHtml(element)).join("")
}

function elementToHtml(element: StructuredElement): string {
  // Handle text nodes
  if (element.type === "text") {
    return element.content
  }

  // Handle break elements
  if (element.type === "br") {
    return "<br>"
  }

  // Handle regular elements
  const attributes = element.attributes
    ? Object.entries(element.attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ")
    : ""

  const attributeString = attributes ? ` ${attributes}` : ""

  // Self-closing tags
  if (["img", "hr", "input"].includes(element.type)) {
    return `<${element.type}${attributeString} />`
  }

  // Elements with children
  if (element.children && element.children.length > 0) {
    const childrenHtml = element.children.map((child) => elementToHtml(child)).join("")
    return `<${element.type}${attributeString}>${childrenHtml}</${element.type}>`
  }

  // Elements with just content
  return `<${element.type}${attributeString}>${element.content}</${element.type}>`
}
