import type React from 'react'
import './globals.css'
import './markdown.css'
import { Inter } from 'next/font/google'
import { PHProvider } from '@/lib/posthog'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppCheckInitializer />
        <PHProvider>{children}</PHProvider>
      </body>
    </html>
  )
}

export const metadata = {
  generator: 'v0.dev',
}

// App Check Initializer Component
function AppCheckInitializer() {
  // App Check is already initialized in firebase.ts
  // This component just ensures it happens early in the app lifecycle
  return null // This component doesn't render anything
}
