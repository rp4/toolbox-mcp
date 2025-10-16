'use client'

import { useState } from 'react'
import type { TestToolContent } from '@audittoolbox/schemas'

interface TestToolViewProps {
  message: string
}

export function TestToolView({ message }: TestToolViewProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Test Tool
            </h1>
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Message'}
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border-l-4 border-indigo-500">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Your Message
            </h2>
            <p className="text-xl text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
              {message}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {message.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Characters
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {message.split(/\s+/).filter(Boolean).length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Words
                </div>
              </div>
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {message.split('\n').length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Lines
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-green-800 dark:text-green-300">
                ChatGPT iframe integration is working correctly!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
