import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Allow embedding in ChatGPT/OpenAI iframes
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://*.openai.com https://*.chatgpt.com https://chatgpt.com https://chat.openai.com"
  )

  // Remove X-Frame-Options to avoid conflicts
  response.headers.delete('X-Frame-Options')

  // Add CORS headers for API calls from ChatGPT
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')

  return response
}

export const config = {
  matcher: '/:path*',
}
