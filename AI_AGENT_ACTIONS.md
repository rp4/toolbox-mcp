# AI Agent Actions for AuditToolbox MCP

This document describes the actions that AI agents (ChatGPT) can invoke on the AuditToolbox MCP iframe to download and analyze data from each of the 5 tools.

## Overview

Each tool view registers a `downloadData` action that the LLM can call via the ChatGPT Apps SDK. The action returns structured data in the requested format, allowing the LLM to analyze the data further.

## Common Action Interface

All tools expose a single action:

```typescript
window.openai.actions.register({
  downloadData: async (params: ToolSpecificParams) => Promise<ActionResponse>
})
```

### Action Response Format

```typescript
interface ActionResponse {
  success: boolean
  data?: any              // The exported data
  message?: string        // Human-readable success message
  error?: string          // Error message if success is false
  code?: string           // Error code for programmatic handling
}
```

## Tool-Specific Actions

### 1. AuditUniverse

**Download 3D graph data (nodes and edges)**

```typescript
// Parameters
interface AuditVerseDownloadParams {
  format: 'json' | 'csv'
  filters?: {
    nodeTypes?: ('entity' | 'risk' | 'control')[]
    nodeIds?: string[]
    minSize?: number
    maxSize?: number
  }
}

// Example: Get all risk nodes as JSON
await window.openai.actions.downloadData({
  format: 'json',
  filters: {
    nodeTypes: ['risk']
  }
})

// Response (JSON format)
{
  success: true,
  data: {
    nodes: [{ id: 'r1', type: 'risk', label: 'Data Breach', size: 2 }],
    edges: [{ from: 'r1', to: 'c1', weight: 1 }],
    layout: 'force',
    summary: {
      totalNodes: 5,
      totalEdges: 8,
      nodeTypes: { entity: 2, risk: 2, control: 1 }
    }
  },
  message: "Exported 5 nodes and 8 edges"
}

// Response (CSV format)
{
  success: true,
  data: {
    nodes: "id,type,label,size\nr1,risk,Data Breach,2\n...",
    edges: "from,to,weight\nr1,c1,1\n..."
  },
  message: "Exported 5 nodes and 8 edges as CSV"
}
```

---

### 2. Swimlanes

**Download process diagram data or image**

```typescript
// Parameters
interface SwimlanesDownloadParams {
  format: 'json' | 'png' | 'svg'
  laneId?: string  // Filter to specific lane
}

// Example: Export full diagram as JSON
await window.openai.actions.downloadData({
  format: 'json'
})

// Response (JSON format)
{
  success: true,
  data: {
    lanes: [{ id: 'l1', title: 'Sales' }],
    nodes: [{ id: 'n1', laneId: 'l1', label: 'Create Quote' }],
    edges: [{ from: 'n1', to: 'n2', label: 'approved' }]
  },
  message: "Exported 5 nodes across 2 lane(s)"
}

// Response (PNG format)
{
  success: true,
  data: {
    dataUrl: "data:image/png;base64,...",
    mimeType: "image/png"
  },
  message: "Exported diagram as PNG"
}
```

---

### 3. Needle Finder

**Download anomaly detection results**

```typescript
// Parameters
interface NeedleDownloadParams {
  format: 'json' | 'csv'
  filters?: {
    columns?: string[]    // Only include these columns
    searchTerm?: string   // Filter rows containing this term
    limit?: number        // Limit number of rows
  }
}

// Example: Get first 100 anomalies as CSV
await window.openai.actions.downloadData({
  format: 'csv',
  filters: {
    limit: 100
  }
})

// Response (JSON format)
{
  success: true,
  data: {
    rows: [
      { id: 1, amount: 9999, flag: 'HIGH' },
      { id: 2, amount: 8500, flag: 'MEDIUM' }
    ],
    summary: { totalAnomalies: 45, avgAmount: 5000 },
    count: 2
  },
  message: "Exported 2 row(s)"
}

// Response (CSV format)
{
  success: true,
  data: {
    csv: "id,amount,flag\n1,9999,HIGH\n2,8500,MEDIUM\n"
  },
  message: "Exported 2 row(s) as CSV"
}
```

---

### 4. Tick'n'Tie

**Download spreadsheet with document links**

```typescript
// Parameters
interface TickTieDownloadParams {
  format: 'xlsx' | 'json'
  includeLinks?: boolean  // Include link metadata (default: true)
}

// Example: Get workbook metadata with links
await window.openai.actions.downloadData({
  format: 'json',
  includeLinks: true
})

// Response (JSON format)
{
  success: true,
  data: {
    xlsxDataUrl: "data:application/vnd...;base64,...",
    links: [
      { cell: 'A1', file: 'invoice.pdf', page: 1, bbox: [10, 20, 100, 50] }
    ],
    summary: {
      totalLinks: 12,
      uniqueCells: 8,
      uniqueFiles: 3
    }
  },
  message: "Exported workbook metadata with 12 link(s)"
}

// Response (XLSX format)
{
  success: true,
  data: {
    dataUrl: "data:application/vnd.openxmlformats...;base64,...",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: "tickntie-workbook.xlsx"
  },
  message: "Excel workbook ready for download"
}
```

---

### 5. Scheduler

**Download team schedule**

```typescript
// Parameters
interface SchedulerDownloadParams {
  format: 'json' | 'csv' | 'xlsx'
  filters?: {
    columns?: string[]
    dateRange?: {
      start: string  // ISO date string
      end: string    // ISO date string
    }
  }
}

// Example: Get schedule for specific date range as JSON
await window.openai.actions.downloadData({
  format: 'json',
  filters: {
    dateRange: {
      start: '2025-01-01',
      end: '2025-01-31'
    }
  }
})

// Response (JSON format)
{
  success: true,
  data: {
    schedule: [
      { date: '2025-01-15', employee: 'Alice', shift: 'Morning', task: 'Audit Review' }
    ],
    count: 1
  },
  message: "Exported 1 schedule item(s)"
}

// Response (CSV format)
{
  success: true,
  data: {
    csv: "date,employee,shift,task\n2025-01-15,Alice,Morning,Audit Review\n"
  },
  message: "Exported 1 schedule item(s) as CSV"
}

// Response (XLSX format)
{
  success: true,
  data: {
    dataUrl: "data:application/vnd.openxmlformats...;base64,...",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    fileName: "schedule.xlsx"
  },
  message: "Excel schedule ready for download"
}
```

---

## Error Handling

All actions return structured errors:

```typescript
{
  success: false,
  error: "Human-readable error message",
  code: "ERROR_CODE"  // e.g., 'INVALID_FORMAT', 'DOWNLOAD_ERROR', 'CANVAS_NOT_READY'
}
```

### Common Error Codes

- `INVALID_FORMAT` - Requested format not supported
- `DOWNLOAD_ERROR` - General download failure
- `CANVAS_NOT_READY` - Canvas element not available (Swimlanes)
- `LANE_NOT_FOUND` - Specified lane ID not found (Swimlanes)
- `XLSX_NOT_AVAILABLE` - XLSX format not available for this data (Scheduler)
- `PNG_GENERATION_FAILED` - Failed to generate PNG image (Swimlanes)
- `NOT_IMPLEMENTED` - Feature not yet implemented

---

## Usage Pattern

1. **User uploads files** to ChatGPT (CSV, Excel, PDFs, etc.)
2. **GPT analyzes** and creates structured visualization payload
3. **Iframe renders** the visualization using one of the 5 tools
4. **GPT can call** `downloadData` action to retrieve data for further analysis
5. **GPT processes** returned data and answers user questions

### Example Workflow

```
User: "Show me the high-risk nodes in the audit graph and analyze their connections"

GPT: [Creates AuditUniverse visualization]
     [Calls downloadData action with filter for risk nodes]
     [Analyzes returned JSON data]
     [Responds with insights about risk connections]
```

---

## Privacy & Security

- All actions are **client-side only** - no data sent to external servers
- Data returned to GPT is **in-memory only** during the chat session
- Actions can only access **data already loaded** in the current view
- No persistent storage or data exfiltration

---

## Implementation Details

Each view component registers its actions in a `useEffect` hook:

```typescript
useEffect(() => {
  if (typeof window === 'undefined' || !window.openai?.actions?.register) return

  const downloadData = async (params: ToolSpecificParams) => {
    // Implementation...
  }

  window.openai.actions.register({ downloadData })

  return () => {
    window.openai?.actions?.unregister?.()
  }
}, [dependencies])
```

Type definitions are in:
- Action schemas: `/packages/schemas/src/actions.ts`
- Window interface: `/apps/web-ui/types/openai.d.ts`
