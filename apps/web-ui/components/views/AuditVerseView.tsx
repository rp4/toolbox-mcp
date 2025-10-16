'use client'

import { useEffect, useRef, useState } from 'react'
import type { AuditVerseModel, AuditVerseDownloadParams } from '@audittoolbox/schemas'
import { createSuccessResponse, createErrorResponse } from '@audittoolbox/schemas'

interface AuditVerseViewProps {
  model: AuditVerseModel
}

export function AuditVerseView({ model }: AuditVerseViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const sceneRef = useRef<any>(null)
  const rendererRef = useRef<any>(null)
  const frameIdRef = useRef<number>()

  useEffect(() => {
    let mounted = true
    let containerElement: HTMLDivElement | null = null

    // Dynamically import Three.js only when needed
    const initScene = async () => {
      const THREE = await import('three')
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')

      if (!mounted || !containerRef.current) return

      // Store container reference for cleanup
      const container = containerRef.current
      containerElement = container
      const width = container.clientWidth
      const height = container.clientHeight

      // Scene setup
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0xf0f0f0)
      sceneRef.current = scene

      // Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      camera.position.z = 15

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true })
      renderer.setSize(width, height)
      renderer.setPixelRatio(window.devicePixelRatio)
      container.appendChild(renderer.domElement)
      rendererRef.current = renderer

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      scene.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight.position.set(10, 10, 10)
      scene.add(directionalLight)

      // Create node positions and geometry
      const nodeObjects = new Map<string, THREE.Mesh>()
      const nodePositions = new Map<string, THREE.Vector3>()

      // Layout nodes based on specified layout or default to force
      const layout = model.layout || 'force'
      const nodeCount = model.nodes.length

      model.nodes.forEach((node, i) => {
        let position: THREE.Vector3

        switch (layout) {
          case 'grid':
            const cols = Math.ceil(Math.sqrt(nodeCount))
            const x = (i % cols) * 3 - (cols * 3) / 2
            const y = Math.floor(i / cols) * 3 - (Math.floor(nodeCount / cols) * 3) / 2
            position = new THREE.Vector3(x, y, 0)
            break

          case 'sphere':
            const phi = Math.acos(-1 + (2 * i) / nodeCount)
            const theta = Math.sqrt(nodeCount * Math.PI) * phi
            const radius = 10
            position = new THREE.Vector3(
              radius * Math.cos(theta) * Math.sin(phi),
              radius * Math.sin(theta) * Math.sin(phi),
              radius * Math.cos(phi)
            )
            break

          case 'force':
          default:
            // Simple circular layout for force (in production, use force-directed algorithm)
            const angle = (i / nodeCount) * Math.PI * 2
            const r = 8
            position = new THREE.Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0)
            break
        }

        nodePositions.set(node.id, position)

        // Node geometry
        const size = node.size || 1
        const geometry = new THREE.SphereGeometry(size * 0.5, 32, 32)

        // Node color based on type
        let color: number
        switch (node.type) {
          case 'entity':
            color = 0x3b82f6 // blue
            break
          case 'risk':
            color = 0xef4444 // red
            break
          case 'control':
            color = 0x10b981 // green
            break
          default:
            color = 0x6b7280 // gray
        }

        const material = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.3,
          roughness: 0.4,
        })

        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.copy(position)
        scene.add(mesh)
        nodeObjects.set(node.id, mesh)

        // Add label
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.width = 256
        canvas.height = 64
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#000000'
        context.font = 'bold 24px Arial'
        context.textAlign = 'center'
        context.fillText(node.label, 128, 40)

        const texture = new THREE.CanvasTexture(canvas)
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(spriteMaterial)
        sprite.position.copy(position)
        sprite.position.y += size * 0.8
        sprite.scale.set(2, 0.5, 1)
        scene.add(sprite)
      })

      // Create edges
      model.edges.forEach((edge) => {
        const fromPos = nodePositions.get(edge.from)
        const toPos = nodePositions.get(edge.to)

        if (fromPos && toPos) {
          const points = [fromPos, toPos]
          const geometry = new THREE.BufferGeometry().setFromPoints(points)
          const material = new THREE.LineBasicMaterial({
            color: 0x999999,
            linewidth: edge.weight || 1,
          })
          const line = new THREE.Line(geometry, material)
          scene.add(line)
        }
      })

      // Animation loop
      const animate = () => {
        if (!mounted) return
        frameIdRef.current = requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
      }

      animate()
      setIsLoading(false)

      // Handle resize
      const handleResize = () => {
        if (!containerRef.current) return
        const newWidth = containerRef.current.clientWidth
        const newHeight = containerRef.current.clientHeight
        camera.aspect = newWidth / newHeight
        camera.updateProjectionMatrix()
        renderer.setSize(newWidth, newHeight)
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    initScene()

    return () => {
      mounted = false

      // Cleanup
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current)
      }

      if (rendererRef.current) {
        rendererRef.current.dispose()
        if (containerElement?.contains(rendererRef.current.domElement)) {
          containerElement.removeChild(rendererRef.current.domElement)
        }
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((object: any) => {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material: any) => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
      }
    }
  }, [model])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Register AI agent actions
  useEffect(() => {
    if (typeof window === 'undefined' || !window.openai?.actions?.register) return

    const downloadData = async (params: AuditVerseDownloadParams) => {
      try {
        let filteredNodes = model.nodes
        let filteredEdges = model.edges

        // Apply filters if provided
        if (params.filters) {
          if (params.filters.nodeTypes) {
            filteredNodes = filteredNodes.filter((n) => params.filters!.nodeTypes!.includes(n.type))
          }
          if (params.filters.nodeIds) {
            filteredNodes = filteredNodes.filter((n) => params.filters!.nodeIds!.includes(n.id))
          }
          if (params.filters.minSize !== undefined) {
            filteredNodes = filteredNodes.filter((n) => (n.size || 1) >= params.filters!.minSize!)
          }
          if (params.filters.maxSize !== undefined) {
            filteredNodes = filteredNodes.filter((n) => (n.size || 1) <= params.filters!.maxSize!)
          }

          // Filter edges to only include those connected to filtered nodes
          const nodeIds = new Set(filteredNodes.map((n) => n.id))
          filteredEdges = filteredEdges.filter(
            (e) => nodeIds.has(e.from) && nodeIds.has(e.to)
          )
        }

        // Format data based on requested format
        if (params.format === 'json') {
          const data = {
            nodes: filteredNodes,
            edges: filteredEdges,
            layout: model.layout,
            summary: {
              totalNodes: filteredNodes.length,
              totalEdges: filteredEdges.length,
              nodeTypes: Object.fromEntries(
                ['entity', 'risk', 'control'].map((type) => [
                  type,
                  filteredNodes.filter((n) => n.type === type).length,
                ])
              ),
            },
          }
          return createSuccessResponse(data, `Exported ${filteredNodes.length} nodes and ${filteredEdges.length} edges`)
        } else if (params.format === 'csv') {
          // Export nodes as CSV
          const nodeHeaders = ['id', 'type', 'label', 'size']
          const nodeRows = filteredNodes.map((node) => [
            node.id,
            node.type,
            node.label,
            node.size || 1,
          ])

          const nodeCsv = [
            nodeHeaders.join(','),
            ...nodeRows.map((row) =>
              row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
            ),
          ].join('\n')

          // Export edges as CSV
          const edgeHeaders = ['from', 'to', 'weight']
          const edgeRows = filteredEdges.map((edge) => [
            edge.from,
            edge.to,
            edge.weight || 1,
          ])

          const edgeCsv = [
            edgeHeaders.join(','),
            ...edgeRows.map((row) =>
              row.map((cell) => (typeof cell === 'string' && cell.includes(',') ? `"${cell}"` : cell)).join(',')
            ),
          ].join('\n')

          return createSuccessResponse(
            {
              nodes: nodeCsv,
              edges: edgeCsv,
            },
            `Exported ${filteredNodes.length} nodes and ${filteredEdges.length} edges as CSV`
          )
        }

        return createErrorResponse('Invalid format. Use "json" or "csv"', 'INVALID_FORMAT')
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
  }, [model])

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-screen'}`}>
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-bold">AuditUniverse</h1>
          <p className="text-sm text-gray-600">
            {model.nodes.length} nodes, {model.edges.length} edges
            {model.layout && ` • ${model.layout} layout`}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-4 mr-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span>Entity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span>Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span>Control</span>
            </div>
          </div>
          <button
            onClick={toggleFullscreen}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading 3D scene...</p>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <div className="p-3 border-t bg-gray-50 text-sm text-gray-600">
        Click and drag to rotate • Scroll to zoom • Right-click and drag to pan
      </div>
    </div>
  )
}
