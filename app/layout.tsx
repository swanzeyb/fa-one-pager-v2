import type React from "react"
import "./globals.css"
import "./markdown.css"
import { Inter } from "next/font/google"
import { PHProvider } from "@/lib/posthog"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PHProvider>{children}</PHProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
