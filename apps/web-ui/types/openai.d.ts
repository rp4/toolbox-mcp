// Type definitions for ChatGPT Apps SDK window.openai interface

export interface ActionResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
  code?: string
}

export interface Actions {
  register?: (actions: Record<string, (params: any) => Promise<ActionResponse>>) => void
  unregister?: () => void
}

export interface OpenAI {
  toolOutput?: {
    structuredContent?: unknown
  }
  actions?: Actions
}

declare global {
  interface Window {
    openai?: OpenAI
  }
}

export {}
