import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AuditToolbox MCP',
  description: 'Unified audit and analysis tools for ChatGPT',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
