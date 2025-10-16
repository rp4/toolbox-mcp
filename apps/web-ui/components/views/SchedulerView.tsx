'use client'

import { useState, useEffect } from 'react'
import type { SchedulerResult, SchedulerDownloadParams } from '@audittoolbox/schemas'
import { createSuccessResponse, createErrorResponse } from '@audittoolbox/schemas'

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

  // Register AI agent actions
  useEffect(() => {
    if (typeof window === 'undefined' || !window.openai?.actions?.register) return

    const downloadData = async (params: SchedulerDownloadParams) => {
      try {
        let data = result.table || []

        // Apply filters if provided
        if (params.filters) {
          if (params.filters.columns && params.filters.columns.length > 0) {
            // Filter to only include specified columns
            data = data.map((row) => {
              const filtered: Record<string, string> = {}
              params.filters!.columns!.forEach((col) => {
                if (col in row) {
                  filtered[col] = row[col]
                }
              })
              return filtered
            })
          }

          if (params.filters.dateRange && data.length > 0) {
            // Filter by date range (assuming there's a date column)
            const dateColumns = Object.keys(data[0]).filter((key) =>
              key.toLowerCase().includes('date')
            )

            if (dateColumns.length > 0) {
              const dateCol = dateColumns[0]
              const startDate = new Date(params.filters.dateRange.start)
              const endDate = new Date(params.filters.dateRange.end)

              data = data.filter((row) => {
                const rowDate = new Date(row[dateCol])
                return rowDate >= startDate && rowDate <= endDate
              })
            }
          }
        }

        // Format data based on requested format
        if (params.format === 'json') {
          return createSuccessResponse(
            {
              schedule: data,
              count: data.length,
            },
            `Exported ${data.length} schedule item(s)`
          )
        } else if (params.format === 'csv') {
          if (data.length === 0) {
            return createSuccessResponse({ csv: '' }, 'No schedule data to export')
          }

          const headers = Object.keys(data[0])
          const csvRows = [
            headers.join(','),
            ...data.map((row) =>
              headers
                .map((header) => {
                  const value = row[header]
                  if (value.includes(',') || value.includes('"')) {
                    return `"${value.replace(/"/g, '""')}"`
                  }
                  return value
                })
                .join(',')
            ),
          ]

          const csvContent = csvRows.join('\n')
          return createSuccessResponse(
            { csv: csvContent },
            `Exported ${data.length} schedule item(s) as CSV`
          )
        } else if (params.format === 'xlsx') {
          // Return the xlsx data URL if available
          if (result.xlsxDataUrl) {
            return createSuccessResponse(
              {
                dataUrl: result.xlsxDataUrl,
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                fileName: 'schedule.xlsx',
              },
              'Excel schedule ready for download'
            )
          } else {
            return createErrorResponse('XLSX format not available for this schedule', 'XLSX_NOT_AVAILABLE')
          }
        }

        return createErrorResponse('Invalid format. Use "json", "csv", or "xlsx"', 'INVALID_FORMAT')
      } catch (error) {
        return createErrorResponse(
          error instanceof Error ? error.message : 'Failed to download data',
          'DOWNLOAD_ERROR'
        )
      }
    }

    const actions = { downloadData }
    window.openai.actions.register(actions)

    return () => {
      window.openai?.actions?.unregister?.()
    }
  }, [result])

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
