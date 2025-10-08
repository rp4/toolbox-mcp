'use client'

import { useState } from 'react'
import type { SchedulerResult } from '@audittoolbox/schemas'

interface SchedulerViewProps {
  result: SchedulerResult
}

export function SchedulerView({ result }: SchedulerViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleDownload = () => {
    if (result.xlsxDataUrl) {
      // Download XLSX file
      const a = document.createElement('a')
      a.href = result.xlsxDataUrl
      a.download = 'schedule.xlsx'
      a.click()
    } else if (result.table) {
      // Download as CSV
      const headers = Object.keys(result.table[0])
      const csvRows = [
        headers.join(','),
        ...result.table.map((row) =>
          headers.map((header) => {
            const value = row[header]
            if (value.includes(',') || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        ),
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'schedule.csv'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-screen'}`}>
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-bold">Schedule</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download {result.xlsxDataUrl ? 'XLSX' : 'CSV'}
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {result.table ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(result.table[0]).map((header) => (
                    <th
                      key={header}
                      className="px-4 py-2 border border-gray-300 text-left font-semibold text-sm"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.table.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="px-4 py-2 border border-gray-300 text-sm">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : result.xlsxDataUrl ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-xl font-semibold mb-2">Schedule Ready</h2>
              <p className="text-gray-600 mb-4">
                Your schedule has been generated as an Excel file.
              </p>
              <button
                onClick={handleDownload}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-lg"
              >
                Download Schedule
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No schedule data available</p>
          </div>
        )}
      </div>

      {result.table && (
        <div className="p-3 border-t bg-gray-50 text-sm text-gray-600">
          {result.table.length} schedule item(s)
        </div>
      )}
    </div>
  )
}
