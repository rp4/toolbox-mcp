# AuditToolbox MCP — Complete Build Instructions (for AI agents)

> **Objective:** Build a single ChatGPT App ("AuditToolbox") that unifies **Swimlanes, Needle Finder, Tick’n’Tie, Scheduler, and AuditUniverse**. Users will upload files in chat; GPT analyzes/transforms them and routes to the right tool. The output is rendered **inline inside ChatGPT** (iframe) with optional fullscreen. **No custom backend** is required beyond static hosting; aim for **privacy-preserving, client‑side** operation.

---

## 1) Source Repositories (re‑use these)
Leverage code, data formats, and UI components from the existing open‑source repos:

- **AuditUniverse (AuditVerse)** — 3D/graph universe (Three.js)
  - https://github.com/rp4/AuditUniverse
- **NeedleFinder** — anomaly/needle search over tabular/log data
  - https://github.com/rp4/NeedleFinder
- **Scheduler** — team scheduling based on constraints
  - https://github.com/rp4/Scheduler
- **TicknTie** — tick & tie documents/images to spreadsheet values (uses Univer)
  - https://github.com/rp4/TicknTie
- **swim_lanes (Swimlanes)** — process/sequence diagram with lanes
  - https://github.com/rp4/swim_lanes

> **Action:** Inspect each repo’s **input formats**, **output structures**, and **rendering code**. Plan to **import or adapt** core logic/visualization rather than rewriting. Confirm licenses and attribution requirements in each repo.

---

## 2) What You’re Building (one‑paragraph brief)
Create a **ChatGPT App** called **AuditToolbox**. Users chat and upload files (JSON, CSV, Excel, ZIP, PDFs, images). GPT interprets the task and **routes** it to one of five tool views. Your app renders results inline:
- **Swimlanes** → SVG/canvas diagram
- **Needle Finder** → interactive table of findings
- **Tick’n’Tie** → interactive **Univer** spreadsheet + document previews
- **Scheduler** → schedule as table/sheet (+ optional fullscreen calendar)
- **AuditUniverse** → interactive **Three.js** scene

No server processing; all transforms are done by GPT and/or browser code. Host the app at **`mcp.audittoolbox.com`** (Vercel).

---

## 3) Architecture Overview
```
User ↔ ChatGPT
        ↳ AuditToolbox App iframe (Next.js/React)   [static on Vercel]
            • Router: picks which view to render
            • Views (imported/adapted from repos):
              - Swimlanes (SVG/canvas)
              - Needle Finder (table)
              - Tick’n’Tie (Univer + previews)
              - Scheduler (sheet/mini calendar)
              - AuditUniverse (Three.js)
            • Codecs: CSV/XLSX/ZIP/JSON readers & writers (client‑side)
            • Bridge: `window.openai` → receive `toolOutput` (structured JSON)
            • (Optional) Minimal API routes under /api/* if absolutely needed
```
**Key principle:** The **model** (GPT) performs heavy analysis/formatting. Your iframe is a **renderer + light transformer**.

---

## 4) Tech Stack
- **UI**: Next.js 14+ (React + TypeScript)
- **State**: React state/hooks; minimal global store
- **Rendering**:
  - **Three.js** for AuditUniverse (reuse from `AuditUniverse` repo)
  - **Univer** for Excel grid (reuse from `TicknTie` repo)
  - SVG/Canvas/D3 for Swimlanes
  - Virtualized table (TanStack Table + windowing) for Needle Finder
- **File I/O**: SheetJS (XLSX), PapaParse (CSV), JSZip (ZIP); File & Blob APIs
- **Hosting**: Vercel (static). Map **`mcp.audittoolbox.com`** to deployment
- **Bridge**: Apps SDK iframe bridge (`window.openai`) for **toolOutput → UI**

---

## 5) Data Contracts (schemas)
Create `/packages/schemas` with **zod** (or JSON Schema) to validate payloads delivered to the iframe via `window.openai.toolOutput.structuredContent`.

### 5.1 Common Types
```ts
// Generic uploaded file descriptor (if UI needs to echo/preview)
export type UploadedFile = {
  id: string
  name: string
  mime: string
  size: number
  dataUrl?: string // base64 data URL (optional for inline preview)
}

export type StructuredContentBase = {
  tool: 'swimlanes'|'needle'|'tickntie'|'scheduler'|'auditverse'
}
```

### 5.2 Tool Payloads
```ts
// Swimlanes
export type SwimlanesSpec = {
  lanes: { id: string; title: string }[]
  nodes: { id: string; laneId: string; label: string }[]
  edges: { from: string; to: string; label?: string }[]
}
export type SwimlanesContent = StructuredContentBase & { tool:'swimlanes'; spec: SwimlanesSpec }

// Needle Finder
export type NeedleCriterion = { field: string; op: 'contains'|'eq'|'gt'|'lt'|'regex'; value: string }
export type NeedleFinderResult = { rows: Record<string, string|number>[]; summary?: Record<string, number> }
export type NeedleContent = StructuredContentBase & { tool:'needle'; result: NeedleFinderResult }

// Tick’n’Tie
export type TickTieLink = { cell: string; file: string; page?: number; bbox?: [number,number,number,number] }
export type TickTieResult = { xlsxDataUrl: string; links?: TickTieLink[] }
export type TickTieContent = StructuredContentBase & { tool:'tickntie'; result: TickTieResult }

// Scheduler
export type SchedulerResult = { xlsxDataUrl?: string; table?: Array<Record<string,string>> }
export type SchedulerContent = StructuredContentBase & { tool:'scheduler'; result: SchedulerResult }

// AuditUniverse (3D scene)
export type AuditNode = { id: string; type: 'entity'|'risk'|'control'; label: string; size?: number }
export type AuditEdge = { from: string; to: string; weight?: number }
export type AuditVerseModel = { nodes: AuditNode[]; edges: AuditEdge[]; layout?: 'force'|'grid'|'sphere' }
export type AuditVerseContent = StructuredContentBase & { tool:'auditverse'; model: AuditVerseModel }
```

> **Why schemas?** They make the iframe renderer deterministic and safe: the model outputs a known structure; the UI validates and displays it.

---

## 6) UI Implementation Plan
Create `/apps/web-ui` with a single page that reads `window.openai.toolOutput` and switches views.

### 6.1 Iframe Bootstrap (pseudo‑code)
```tsx
// pages/app.tsx
import { useEffect, useState } from 'react'
import type { SwimlanesContent, NeedleContent, TickTieContent, SchedulerContent, AuditVerseContent } from '@schemas'
import { SwimlanesView, NeedleView, TickTieView, SchedulerView, AuditVerseView } from '@components'

export default function App() {
  const [output, setOutput] = useState<any>(null)

  useEffect(() => {
    // @ts-ignore — provided by Apps SDK host
    setOutput(window.openai?.toolOutput || null)
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'openai:toolOutput') setOutput(e.data.payload)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  if (!output?.structuredContent) return <div>Waiting for content…</div>
  const sc = output.structuredContent

  switch (sc.tool) {
    case 'swimlanes':  return <SwimlanesView spec={(sc as SwimlanesContent).spec} />
    case 'needle':     return <NeedleView result={(sc as NeedleContent).result} />
    case 'tickntie':   return <TickTieView  data={(sc as TickTieContent).result} />
    case 'scheduler':  return <SchedulerView data={(sc as SchedulerContent).result} />
    case 'auditverse': return <AuditVerseView model={(sc as AuditVerseContent).model} />
    default:           return <div>Unknown tool.</div>
  }
}
```

### 6.2 View Components (reuse repo code)
- **SwimlanesView** (adapt from `swim_lanes`): parse `SwimlanesSpec` → render SVG/canvas; add zoom/pan; export PNG/SVG.
- **NeedleView** (adapt from `NeedleFinder`): table with highlights; sticky header; summary counts; export CSV.
- **TickTieView** (adapt from `TicknTie`): mount **Univer** with `xlsxDataUrl`; right panel shows doc previews; clicking a cell jumps to linked doc region and vice versa.
- **SchedulerView** (adapt from `Scheduler`): render a compact table or Univer sheet; provide “Open fullscreen” action for detailed editing.
- **AuditVerseView** (adapt from `AuditUniverse`): mount a Three.js scene; load model → nodes/edges; provide layout switcher; **dispose** on unmount.

> **Performance:** lazy‑load heavy libs (`three`, `@univerjs/*`), pause animations when off‑screen, virtualize large tables, dispose GPU and object URLs on unmount.

---

## 7) Orchestration & Data Flow
**Model‑first transformation:** The ChatGPT model converts raw user inputs (files + instructions) into the **structured payload** for your view.

Typical flows:
- **Swimlanes**: From prose/docs → `SwimlanesSpec` (lanes/nodes/edges) → render.
- **Needle Finder**: From CSV/Excel/logs + criteria → filtered rows `NeedleFinderResult` → render table.
- **Tick’n’Tie**: From ZIP (xlsx + images/pdfs) → model extracts numbers/locations and annotates workbook → returns `TickTieResult { xlsxDataUrl, links }` → render in Univer + previews.
- **Scheduler**: From constraints described in chat → model generates schedule table or sheet (`SchedulerResult`) → render; offer fullscreen.
- **AuditUniverse**: From org/process/risk inputs → compact graph `AuditVerseModel` → render Three.js.

> **Optional MCP**: If you prefer stricter function interfaces, expose MCP endpoints like `tick_and_tie.prepare` or `needle.filter`. Keep them stateless and client‑safe.

---

## 8) File Handling (client‑only)
- **Read**: SheetJS for `.xlsx`, PapaParse for `.csv`, JSZip for `.zip`, native File APIs for blobs.
- **Write**: Produce **data URLs** (e.g., `xlsxDataUrl`) for downloads and for Univer loader.
- **Previews**: Images/PDFs from the ZIP load into `<img>` or PDF canvas; store mapping from cells to doc regions.
- **Large inputs**: If huge, prompt the model to scope (e.g., “process top 2 sheets” or “first 20 pages”).

---

## 9) Hosting & Domains
- Deploy `web-ui` to **Vercel** (static export or standard Next.js build).
- Map **`mcp.audittoolbox.com`** (or `audittoolbox.com/app`) to the deployment.
- If you add optional APIs, use Next.js API routes under `/api/*`; keep them **stateless** and **no persistence**.

---

## 10) Developer Workflow
1. **Clone repos** and scaffold monorepo structure:
```
/audittoolbox
  /apps
    /web-ui       # Next.js (the iframe app)
    /mcp-server   # optional, minimal (or omit)
  /packages
    /schemas      # zod/JSON Schema for structuredContent
    /adapters     # CSV/XLSX/ZIP utilities; OCR helpers if needed
    /components   # Views reusing code from the repos
```
2. **Port/Adapt**: Bring rendering and core logic from the five repos into `/components` (or install them as packages if they’re publishable). Keep interfaces thin.
3. **Implement schemas** and a simple router page that reads `window.openai.toolOutput` and renders the correct view.
4. **Mock data** for each tool and validate rendering.
5. **Enable ChatGPT Developer Mode** and install your app pointing to your dev URL; test live. (If local only, tunnel with ngrok.)
6. **Optimize**: lazy‑load, reduce bundle size, test on mobile and desktop, ensure dispose/cleanup.
7. **Deploy** to Vercel; set custom domain; verify HTTPS and CORS for asset loading.

---

## 11) UX & Product Details
- **Welcome**: “Upload files or describe what you want: Swimlanes, Needle Finder, Tick’n’Tie, Scheduler, AuditUniverse. I’ll pick the right tool.”
- **After upload**: Offer suggested actions (e.g., “Tick’n’Tie these PDFs to your Excel?” or “Search anomalies with Needle Finder?”).
- **Controls per view**: **Download**, **Explain** (ask GPT to describe output), **Adjust** (prompt tweak), **Fullscreen**.
- **Errors**: Friendly recovery (“I couldn’t parse this workbook; try re‑uploading or ask me to convert it”).

---

## 12) Acceptance Criteria
- Installs in ChatGPT Dev Mode; shows landing card.
- Upload → GPT picks tool → Inline render with correct schema.
- Each view supports **Download** and **Fullscreen**.
- Three.js and Univer perform smoothly; resources are disposed on unmount.
- No external network calls (except loading static assets from your domain).
- Optional MCP endpoints are disabled by default; if enabled, they are stateless.

---

## 13) Tool‑Specific Re‑use Notes (per repo)

### 13.1 AuditUniverse (Three.js)
- Reuse scene setup, graph layout, and material configs from `AuditUniverse`.
- Create an adapter that maps `AuditVerseModel` to the repo’s internal graph model.
- Implement **pause when off‑screen**, **resize on container changes**, and **dispose** geometries/materials/textures on unmount.

### 13.2 NeedleFinder
- Reuse filtering/scoring logic and parsers from `NeedleFinder`.
- Provide a column‑agnostic renderer: infer headers and types from the first N rows; show counts and match highlights.
- Export filtered results back to CSV.

### 13.3 Scheduler
- Reuse constraint → schedule generation functions.
- Output a compact table or sheet; include a button to open a **fullscreen** calendar route for editing.

### 13.4 TicknTie
- Reuse Univer integration and tick/annotation logic.
- Build a two‑pane UI: **Univer grid** + **doc preview**; implement cell↔source linking using `links`.
- Accept a `xlsxDataUrl` and optional `links`; support **download** of the updated workbook.

### 13.5 swim_lanes
- Reuse lane layout & edge routing; ensure deterministic layout from `SwimlanesSpec`.
- Provide zoom/pan and export (SVG/PNG).

---

## 14) Example Payloads (from model → iframe)

**Swimlanes**
```json
{
  "tool": "swimlanes",
  "spec": {
    "lanes": [ {"id":"ops","title":"Operations"}, {"id":"it","title":"IT"} ],
    "nodes": [ {"id":"n1","laneId":"ops","label":"Receive PO"}, {"id":"n2","laneId":"it","label":"Validate"} ],
    "edges": [ {"from":"n1","to":"n2","label":"send"} ]
  }
}
```

**Needle Finder**
```json
{
  "tool": "needle",
  "result": {
    "rows": [ {"id": 101, "vendor": "ACME", "amount": 99999.99, "note": "> threshold"} ],
    "summary": {"matches": 1, "scanned": 24000}
  }
}
```

**Tick’n’Tie**
```json
{
  "tool": "tickntie",
  "result": {
    "xlsxDataUrl": "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,....",
    "links": [ {"cell":"B12","file":"inv_0421.png","bbox":[120,330,260,380]} ]
  }
}
```

**Scheduler**
```json
{
  "tool": "scheduler",
  "result": {
    "table": [
      {"slot":"Mon 09:00","Team A":"Standup","Room":"Conf A"},
      {"slot":"Mon 10:00","Team B":"Planning","Room":"Conf B"}
    ]
  }
}
```

**AuditUniverse**
```json
{
  "tool": "auditverse",
  "model": {
    "nodes": [ {"id":"ap","type":"entity","label":"AP"}, {"id":"risk1","type":"risk","label":"Duplicate Payments"} ],
    "edges": [ {"from":"ap","to":"risk1"} ],
    "layout": "force"
  }
}
```

---

## 15) Testing Before Public Release
- Turn on **Developer Mode** in ChatGPT.
- Run `next dev` (or `vercel dev`) for `/apps/web-ui`; if remote access is required, expose with **ngrok**.
- Install the app privately; chat with it; upload sample files; validate each view.
- Iterate on prompt templates so the model reliably emits the schemas above.

---

## 16) Security & Privacy
- No third‑party servers; no data persistence.
- Only load static assets from your domain; set strict CSP.
- Provide clear download controls; never exfiltrate data.
- If optional APIs are used, ensure they are **stateless** and **do not store** request payloads.

---

## 17) Delivery Checklist
- [ ] Deployed at `mcp.audittoolbox.com` over HTTPS
- [ ] Inline render works for all 5 tools
- [ ] Fullscreen option for Tick’n’Tie & AuditUniverse; link‑out optional for Scheduler
- [ ] Download (CSV/XLSX/SVG/PNG/ZIP) available per view
- [ ] Resources disposed on unmount; no memory/GPU leaks
- [ ] Licenses reviewed; attributions included where required

---

### End of Instructions

