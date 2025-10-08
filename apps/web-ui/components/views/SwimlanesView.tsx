'use client'

import { useEffect, useRef, useState } from 'react'
import type { SwimlanesSpec } from '@audittoolbox/schemas'

interface SwimlanesViewProps {
  spec: SwimlanesSpec
}

export function SwimlanesView({ spec }: SwimlanesViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Layout constants
    const laneWidth = rect.width / spec.lanes.length
    const laneHeight = rect.height
    const nodeHeight = 60
    const nodeWidth = 120
    const nodePadding = 40

    // Draw lanes
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    spec.lanes.forEach((lane, i) => {
      const x = i * laneWidth

      // Lane background (alternating)
      ctx.fillStyle = i % 2 === 0 ? '#f9fafb' : '#ffffff'
      ctx.fillRect(x, 0, laneWidth, laneHeight)

      // Lane border
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, laneHeight)
      ctx.stroke()

      // Lane title
      ctx.fillStyle = '#374151'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(lane.title, x + laneWidth / 2, 30)
    })

    // Calculate node positions
    const nodePositions = new Map<string, { x: number; y: number }>()
    const laneNodes = new Map<string, typeof spec.nodes>()

    spec.lanes.forEach((lane) => {
      laneNodes.set(lane.id, [])
    })

    spec.nodes.forEach((node) => {
      laneNodes.get(node.laneId)?.push(node)
    })

    spec.lanes.forEach((lane, laneIndex) => {
      const nodes = laneNodes.get(lane.id) || []
      const laneX = laneIndex * laneWidth

      nodes.forEach((node, nodeIndex) => {
        const x = laneX + laneWidth / 2
        const y = 80 + nodeIndex * (nodeHeight + nodePadding)
        nodePositions.set(node.id, { x, y })
      })
    })

    // Draw edges first (so they appear behind nodes)
    ctx.strokeStyle = '#6b7280'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    spec.edges.forEach((edge) => {
      const from = nodePositions.get(edge.from)
      const to = nodePositions.get(edge.to)

      if (from && to) {
        ctx.beginPath()
        ctx.moveTo(from.x, from.y + nodeHeight / 2)
        ctx.lineTo(to.x, to.y - nodeHeight / 2)
        ctx.stroke()

        // Draw arrow head
        const angle = Math.atan2(to.y - from.y, to.x - from.x)
        const arrowSize = 8
        ctx.save()
        ctx.translate(to.x, to.y - nodeHeight / 2)
        ctx.rotate(angle)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(-arrowSize, -arrowSize / 2)
        ctx.lineTo(-arrowSize, arrowSize / 2)
        ctx.closePath()
        ctx.fillStyle = '#6b7280'
        ctx.fill()
        ctx.restore()

        // Draw edge label if present
        if (edge.label) {
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(midX - 25, midY - 10, 50, 20)
          ctx.fillStyle = '#6b7280'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(edge.label, midX, midY + 5)
        }
      }
    })

    ctx.setLineDash([])

    // Draw nodes
    nodePositions.forEach((pos, nodeId) => {
      const node = spec.nodes.find((n) => n.id === nodeId)
      if (!node) return

      // Node background
      ctx.fillStyle = '#3b82f6'
      ctx.strokeStyle = '#2563eb'
      ctx.lineWidth = 2

      const x = pos.x - nodeWidth / 2
      const y = pos.y - nodeHeight / 2
      const radius = 8

      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + nodeWidth - radius, y)
      ctx.quadraticCurveTo(x + nodeWidth, y, x + nodeWidth, y + radius)
      ctx.lineTo(x + nodeWidth, y + nodeHeight - radius)
      ctx.quadraticCurveTo(x + nodeWidth, y + nodeHeight, x + nodeWidth - radius, y + nodeHeight)
      ctx.lineTo(x + radius, y + nodeHeight)
      ctx.quadraticCurveTo(x, y + nodeHeight, x, y + nodeHeight - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Node label
      ctx.fillStyle = '#ffffff'
      ctx.font = '13px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(node.label, pos.x, pos.y + 5)
    })
  }, [spec])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'swimlanes.png'
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-screen'}`}>
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-xl font-bold">Swimlanes Diagram</h1>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Download PNG
          </button>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  )
}
