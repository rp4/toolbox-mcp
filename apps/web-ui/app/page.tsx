'use client'

import { useEffect, useState } from 'react'
import type {
  StructuredContent,
  TestToolContent,
  SwimlanesContent,
  NeedleContent,
  TickTieContent,
  SchedulerContent,
  AuditVerseContent,
} from '@audittoolbox/schemas'
import { StructuredContentSchema } from '@audittoolbox/schemas'
import { TestToolView } from '@/components/views/TestToolView'
import { SwimlanesView } from '@/components/views/SwimlanesView'
import { NeedleView } from '@/components/views/NeedleView'
import { TickTieView } from '@/components/views/TickTieView'
import { SchedulerView } from '@/components/views/SchedulerView'
import { AuditVerseView } from '@/components/views/AuditVerseView'
// Type definition is in /types/openai.d.ts

export default function App() {
  const [content, setContent] = useState<StructuredContent | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Try to get initial content from window.openai
    if (window.openai?.toolOutput?.structuredContent) {
      try {
        const validated = StructuredContentSchema.parse(
          window.openai.toolOutput.structuredContent
        )
        setContent(validated)
      } catch (err) {
        console.error('Schema validation failed:', err)
        setError('Invalid content format received')
      }
    }

    // Listen for postMessage updates
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'openai:toolOutput' && e.data?.payload?.structuredContent) {
        try {
          const validated = StructuredContentSchema.parse(
            e.data.payload.structuredContent
          )
          setContent(validated)
          setError(null)
        } catch (err) {
          console.error('Schema validation failed:', err)
          setError('Invalid content format received')
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!content) {
    return (
      <div className="flex items-center justify-center min-h-screen p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Waiting for content from ChatGPT...
          </p>
        </div>
      </div>
    )
  }

  // Route to the appropriate view based on tool type
  switch (content.tool) {
    case 'test':
      return <TestToolView message={(content as TestToolContent).message} />
    case 'swimlanes':
      return <SwimlanesView spec={(content as SwimlanesContent).spec} />
    case 'needle':
      return <NeedleView result={(content as NeedleContent).result} />
    case 'tickntie':
      return <TickTieView result={(content as TickTieContent).result} />
    case 'scheduler':
      return <SchedulerView result={(content as SchedulerContent).result} />
    case 'auditverse':
      return <AuditVerseView model={(content as AuditVerseContent).model} />
    default:
      return (
        <div className="flex items-center justify-center min-h-screen p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Unknown Tool</h1>
            <p className="text-gray-600">
              The tool type &quot;{(content as any).tool}&quot; is not recognized.
            </p>
          </div>
        </div>
      )
  }
}
