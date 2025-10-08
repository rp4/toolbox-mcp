'use client'

import { useState, useMemo } from 'react'
import type { NeedleFinderResult } from '@audittoolbox/schemas'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'

interface NeedleViewProps {
  result: NeedleFinderResult
}

export function NeedleView({ result }: NeedleViewProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Create columns dynamically from first row
  const columns = useMemo<ColumnDef<Record<string, string | number>>[]>(() => {
    if (result.rows.length === 0) return []

    const firstRow = result.rows[0]
    return Object.keys(firstRow).map((key) => ({
      accessorKey: key,
      header: key.charAt(0).toUpperCase() + key.slice(1),
      cell: ({ getValue }) => {
        const value = getValue()
        return <span>{String(value)}</span>
      },
    }))
  }, [result.rows])

  const table = useReactTable({
    data: result.rows,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const handleDownloadCSV = () => {
    if (result.rows.length === 0) return

    // Create CSV content
    const headers = Object.keys(result.rows[0])
    const csvRows = [
      headers.join(','),
      ...result.rows.map((row) =>
        headers.map((header) => {
          const value = row[header]
          // Escape values with commas or quotes
          const stringValue = String(value)
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`
          }
          return stringValue
        }).join(',')
      ),
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'needle-findings.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-screen'}`}>
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-bold">Needle Finder Results</h1>
          {result.summary && (
            <div className="flex gap-4 mt-2 text-sm text-gray-600">
              {Object.entries(result.summary).map(([key, value]) => (
                <span key={key}>
                  <span className="font-semibold">{key}:</span> {value.toLocaleString()}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            className="px-3 py-2 border rounded"
          />
          <button
            onClick={handleDownloadCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download CSV
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {result.rows.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No results found</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left border-b font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-200"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span className="text-xs">
                          {{
                            asc: '↑',
                            desc: '↓',
                          }[header.column.getIsSorted() as string] ?? '↕'}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 border-b text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="p-3 border-t bg-gray-50 text-sm text-gray-600">
        Showing {table.getRowModel().rows.length} of {result.rows.length} row(s)
      </div>
    </div>
  )
}
