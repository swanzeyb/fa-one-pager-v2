import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer'
import path from 'path'

// Assuming your app runs on localhost:3000
const APP_URL = 'http://localhost:3000'
// Path to a dummy file for testing uploads
const DUMMY_FILE_PATH = path.resolve(__dirname, 'test-file.txt') // Create this file

describe('Content Generation & Viewing', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await puppeteer.launch() // Add { headless: false, slowMo: 50 } for debugging
    page = await browser.newPage()
    // Create the dummy file if it doesn't exist
    const fs = require('fs')
    if (!fs.existsSync(DUMMY_FILE_PATH)) {
      fs.writeFileSync(DUMMY_FILE_PATH, 'This is a test file.')
    }
  })

  afterAll(async () => {
    await browser.close()
    // Clean up the dummy file
    const fs = require('fs')
    if (fs.existsSync(DUMMY_FILE_PATH)) {
      fs.unlinkSync(DUMMY_FILE_PATH)
    }
  })

  beforeEach(async () => {
    await page.goto(APP_URL, { waitUntil: 'networkidle0' })
  })

  // Helper function to get output content from the active tab panel
  const getOutputContent = async () => {
    const outputSelector = '[role="tabpanel"][data-state="active"]'
    // Wait for the panel to exist before trying to get content
    await page.waitForSelector(outputSelector, { timeout: 5000 })
    return await page.$eval(outputSelector, (el) => el.textContent)
  }

  test('As a user, after a successful file upload, content appears within the default output tab ("Short Summary")', async () => {
    // Find the actual file input element using its ID
    const fileInputSelector = '#file-upload'
    // Wait for the selector and cast the result
    const fileInput = (await page.waitForSelector(
      fileInputSelector
    )) as ElementHandle<HTMLInputElement> | null

    if (!fileInput) {
      throw new Error('File input #file-upload not found')
    }

    // Upload the file using the input element
    await fileInput.uploadFile(DUMMY_FILE_PATH)

    // Wait for content generation within the active tab panel
    const outputSelector = '[role="tabpanel"][data-state="active"]'
    // Wait for the panel to contain something other than the initial placeholder/loading text
    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector)
        // Adjust the condition based on placeholder text if necessary
        return (
          element &&
          element.textContent &&
          !element.textContent.includes('Click the Generate button') &&
          !element.textContent.includes('Generating')
        )
      },
      { timeout: 30000 },
      outputSelector
    )

    // Optional: Confirm "Short Summary" tab is selected
    const shortSummaryTab = await page.$(
      'aria/Short Summary[role="tab"][aria-selected="true"]'
    )
    expect(shortSummaryTab).not.toBeNull()

    const outputContent = await getOutputContent()
    expect(outputContent).not.toBe('')
    expect(outputContent).toBeTruthy()
    // Add more specific content check if possible
    expect(outputContent).not.toContain('Click the Generate button')
  }, 35000)

  test('As a user, I can click the "Medium Summary" tab, and the content displayed in the output area updates accordingly', async () => {
    // Upload a file
    const fileInputSelector = '#file-upload'
    const fileInput = (await page.waitForSelector(
      fileInputSelector
    )) as ElementHandle<HTMLInputElement> | null
    if (!fileInput) throw new Error('File input #file-upload not found')
    await fileInput.uploadFile(DUMMY_FILE_PATH)

    // Wait for initial content in the default tab
    const initialOutputSelector = '[role="tabpanel"][data-state="active"]'
    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector)
        return (
          element &&
          element.textContent &&
          !element.textContent.includes('Click the Generate button') &&
          !element.textContent.includes('Generating')
        )
      },
      { timeout: 30000 },
      initialOutputSelector
    )
    const initialContent = await getOutputContent()

    // Click the "Medium Summary" tab
    const mediumTabSelector = 'aria/Medium Summary[role="tab"]'
    await page.click(mediumTabSelector)

    // Wait for the new tab panel to become active and potentially show loading/placeholder first
    const newOutputSelector = '[role="tabpanel"][data-state="active"]'
    await page.waitForSelector(newOutputSelector, { timeout: 5000 })

    // Wait for the content in the *new* active panel to be different from the initial content
    // and not be empty or a placeholder/loading message.
    await page.waitForFunction(
      (initial, selector) => {
        const currentElement = document.querySelector(selector)
        const currentContent = currentElement?.textContent || ''
        return (
          currentContent !== initial &&
          currentContent !== '' &&
          !currentContent.includes('Click the Generate button') &&
          !currentContent.includes('Generating')
        )
      },
      { timeout: 30000 }, // Wait up to 30s for the change
      initialContent,
      newOutputSelector // Pass selector for the *new* active panel
    )

    const newContent = await getOutputContent()
    expect(newContent).not.toBe('')
    expect(newContent).toBeTruthy()
    expect(newContent).not.toBe(initialContent)
    expect(newContent).not.toContain('Click the Generate button')
  }, 70000)

  test('As a user, I can click the "How-to Guide" tab, and the content displayed in the output area updates accordingly', async () => {
    // Upload file
    const fileInputSelector = '#file-upload'
    const fileInput = (await page.waitForSelector(
      fileInputSelector
    )) as ElementHandle<HTMLInputElement> | null
    if (!fileInput) throw new Error('File input #file-upload not found')
    await fileInput.uploadFile(DUMMY_FILE_PATH)

    // Wait for initial content
    const initialOutputSelector = '[role="tabpanel"][data-state="active"]'
    await page.waitForFunction(
      (selector) => {
        const element = document.querySelector(selector)
        return (
          element &&
          element.textContent &&
          !element.textContent.includes('Click the Generate button') &&
          !element.textContent.includes('Generating')
        )
      },
      { timeout: 30000 },
      initialOutputSelector
    )
    const initialContent = await getOutputContent()

    // Click the "How-to Guide" tab
    const howToTabSelector = 'aria/How-to Guide[role="tab"]'
    await page.click(howToTabSelector)

    // Wait for the new tab panel to become active
    const newOutputSelector = '[role="tabpanel"][data-state="active"]'
    await page.waitForSelector(newOutputSelector, { timeout: 5000 })

    // Wait for content update in the new active panel
    await page.waitForFunction(
      (initial, selector) => {
        const currentElement = document.querySelector(selector)
        const currentContent = currentElement?.textContent || ''
        return (
          currentContent !== initial &&
          currentContent !== '' &&
          !currentContent.includes('Click the Generate button') &&
          !currentContent.includes('Generating')
        )
      },
      { timeout: 30000 }, // Wait up to 30s
      initialContent,
      newOutputSelector
    )

    const newContent = await getOutputContent()
    expect(newContent).not.toBe('')
    expect(newContent).toBeTruthy()
    expect(newContent).not.toBe(initialContent)
    expect(newContent).not.toContain('Click the Generate button')
  }, 70000)

  test('As a user, if content generation fails, an error message is displayed within the tab panel', async () => {
    // Create an empty file known to cause errors (based on previous assumption)
    const EMPTY_FILE_PATH = path.resolve(__dirname, 'empty-test-file.txt')
    const fs = require('fs')
    fs.writeFileSync(EMPTY_FILE_PATH, '')

    try {
      const fileInputSelector = '#file-upload'
      const fileInput = (await page.waitForSelector(
        fileInputSelector
      )) as ElementHandle<HTMLInputElement> | null
      if (!fileInput) throw new Error('File input #file-upload not found')

      // Upload the file expected to fail
      await fileInput.uploadFile(EMPTY_FILE_PATH)

      // Wait for the Generate button to appear in the active tab panel
      const generateButtonSelector =
        '[role="tabpanel"][data-state="active"] button:has-text("Generate")'
      await page.waitForSelector(generateButtonSelector, { timeout: 10000 })

      // Click the generate button within the active panel
      await page.click(generateButtonSelector)

      // Wait for the inline error heading to appear within the active tab panel
      const errorSelector =
        '[role="tabpanel"][data-state="active"] aria/Error[role="heading"]'
      await page.waitForSelector(errorSelector, { timeout: 15000 })

      // Verify the error message text (checking the parent div of the heading for the description)
      const errorHeading = await page.$(errorSelector)
      // Use evaluateHandle to get a JSHandle, then get the parentElement property
      const errorContainerHandle = await errorHeading?.evaluateHandle(
        (el) => el.parentElement
      )
      let errorMessage = null
      // Check if the handle exists and is an ElementHandle before evaluating
      if (errorContainerHandle instanceof ElementHandle) {
        // Explicitly cast to ElementHandle<Element> before calling evaluate
        const elementHandle = errorContainerHandle as ElementHandle<Element>
        // Use evaluate with a typed function
        errorMessage = await elementHandle.evaluate(
          (el: Element) => el.textContent
        )
      }

      expect(errorMessage).toContain('Error') // Check heading text
      // Add check for specific error description if available and consistent
      // expect(errorMessage).toContain('Specific error description');
    } finally {
      // Clean up empty file
      if (fs.existsSync(EMPTY_FILE_PATH)) {
        fs.unlinkSync(EMPTY_FILE_PATH)
      }
    }
  }, 30000) // Timeout for failure test
})
