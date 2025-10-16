'use client'

import { useState, useEffect, useRef } from 'react'
import type { TickTieResult, TickTieDownloadParams, ActionResponse } from '@audittoolbox/schemas'
import { createSuccessResponse, createErrorResponse } from '@audittoolbox/schemas'

interface TickTieViewProps {
  result: TickTieResult
}

export function TickTieView({ result }: TickTieViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // Get links for selected cell
  const cellLinks = result.links?.filter((link) => link.cell === selectedCell) || []

  // Get unique files from links
  const linkedFiles = Array.from(
    new Set(result.links?.map((link) => link.file) || [])
  )

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = result.xlsxDataUrl
    a.download = 'tickntie-workbook.xlsx'
    a.click()
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleCellClick = (cell: string) => {
    setSelectedCell(cell)
    // Find first linked file for this cell
    const link = result.links?.find((l) => l.cell === cell)
    if (link) {
      setSelectedFile(link.file)
    }
  }

  const handleFileClick = (file: string) => {
    setSelectedFile(file)
    // Find first cell linked to this file
    const link = result.links?.find((l) => l.file === file)
    if (link) {
      setSelectedCell(link.cell)
    }
  }

  // Register AI agent actions
  useEffect(() => {
    if (typeof window === 'undefined' || !window.openai?.actions?.register) return

    const downloadData = async (params: TickTieDownloadParams): Promise<ActionResponse> => {
      try {
        // Format data based on requested format
        if (params.format === 'xlsx') {
          // Return the xlsx data URL directly
          return createSuccessResponse(
            {
              dataUrl: result.xlsxDataUrl,
              mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              fileName: 'tickntie-workbook.xlsx',
            },
            'Excel workbook ready for download'
          )
        } else if (params.format === 'json') {
          // Return links data as JSON
          const data: any = {
            xlsxDataUrl: result.xlsxDataUrl,
          }

          if (params.includeLinks !== false && result.links) {
            data.links = result.links
            data.summary = {
              totalLinks: result.links.length,
              uniqueCells: Array.from(new Set(result.links.map((l) => l.cell))).length,
              uniqueFiles: Array.from(new Set(result.links.map((l) => l.file))).length,
            }
          }

          return createSuccessResponse(
            data,
            `Exported workbook metadata${result.links ? ` with ${result.links.length} link(s)` : ''}`
          )
        }

        return createErrorResponse('Invalid format. Use "xlsx" or "json"', 'INVALID_FORMAT')
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
        <h1 className="text-xl font-bold">Tick&apos;n&apos;Tie Workbook</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download XLSX
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Spreadsheet */}
        <div className="flex-1 border-r overflow-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Spreadsheet</h2>
            <div className="text-sm text-gray-600 mb-4">
              {result.links ? `${result.links.length} linked cell(s)` : 'No links'}
            </div>

            {/* Simple spreadsheet viewer - in production, integrate Univer here */}
            <div className="border rounded bg-white">
              <div className="p-4 text-center text-gray-500">
                <p className="mb-2">📊 Excel Workbook Ready</p>
                <p className="text-sm">
                  Download the workbook to view in Excel or other spreadsheet applications.
                </p>
                {result.links && result.links.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">Linked Cells:</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {Array.from(new Set(result.links.map((l) => l.cell))).map((cell) => (
                        <button
                          key={cell}
                          onClick={() => handleCellClick(cell)}
                          className={`px-3 py-1 rounded text-sm ${
                            selectedCell === cell
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {cell}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Document Preview */}
        <div className="w-1/2 overflow-auto bg-gray-50">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Source Documents</h2>

            {linkedFiles.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {linkedFiles.map((file) => (
                    <button
                      key={file}
                      onClick={() => handleFileClick(file)}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedFile === file
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border hover:bg-gray-100'
                      }`}
                    >
                      {file}
                    </button>
                  ))}
                </div>

                {selectedFile && (
                  <div className="border rounded bg-white p-4">
                    <h3 className="font-semibold mb-2">{selectedFile}</h3>
                    {selectedCell && cellLinks.length > 0 && (
                      <div className="text-sm text-gray-600 mb-4">
                        Linked to cell: <span className="font-semibold">{selectedCell}</span>
                        {cellLinks[0].page && ` (Page ${cellLinks[0].page})`}
                      </div>
                    )}
                    <div className="bg-gray-100 h-96 flex items-center justify-center rounded">
                      <p className="text-gray-500">
                        Document preview would appear here
                        <br />
                        <span className="text-xs">
                          (In production: render PDF/image from ZIP)
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No linked documents</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedCell && cellLinks.length > 0 && (
        <div className="p-3 border-t bg-blue-50 text-sm">
          <span className="font-semibold">Selected: {selectedCell}</span>
          <span className="text-gray-600 ml-4">
            {cellLinks.length} link(s) to source documents
          </span>
        </div>
      )}
    </div>
  )
}
