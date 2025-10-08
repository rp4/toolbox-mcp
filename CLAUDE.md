# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ✅ Project Status: BUILT & READY FOR TESTING

All core components have been implemented:
- ✅ Monorepo structure with npm workspaces
- ✅ Type-safe Zod schemas for all 5 tools
- ✅ Complete view components (Swimlanes, Needle Finder, Tick'n'Tie, Scheduler, AuditUniverse)
- ✅ File handling utilities (CSV, Excel, ZIP)
- ✅ Next.js app with iframe bridge
- ✅ Vercel deployment configuration

**See [SUMMARY.md](SUMMARY.md) for detailed build status and [BUILD.md](BUILD.md) for testing instructions.**

## Project Overview

**AuditToolbox MCP** is a unified ChatGPT App that combines five audit/analysis tools into a single interface. Users chat with GPT and upload files; the model routes to the appropriate tool and renders results inline within ChatGPT via iframe.

The five tools are:
- **Swimlanes** - Process/sequence diagrams with lanes (SVG/canvas)
- **Needle Finder** - Anomaly detection over tabular/log data
- **Tick'n'Tie** - Document linking to spreadsheet cells (uses Univer)
- **Scheduler** - Team scheduling based on constraints
- **AuditUniverse** - 3D graph visualization (Three.js)

## Architecture Principles

**Model-first transformation**: The ChatGPT model performs heavy analysis and converts raw inputs into structured payloads. The iframe is a renderer + light transformer.

**Client-side only**: No custom backend required beyond static hosting. All file processing happens in the browser using SheetJS, PapaParse, JSZip, etc.

**Privacy-preserving**: No data persistence, no third-party servers, no exfiltration.

## Actual Project Structure

```
/toolbox-mcp
  /apps
    /web-ui                          # ✅ Next.js iframe app (COMPLETE)
      /app                           # App router
        - page.tsx                   # Main router with view switching
        - layout.tsx                 # Root layout
      /components/views              # All 5 view components
        - SwimlanesView.tsx          # ✅ Canvas-based diagram
        - NeedleView.tsx             # ✅ TanStack Table
        - TickTieView.tsx            # ✅ Split-pane with links
        - SchedulerView.tsx          # ✅ Schedule table
        - AuditVerseView.tsx         # ✅ Three.js 3D scene
  /packages
    /schemas                         # ✅ Zod schemas (COMPLETE)
      /src/index.ts                  # All type definitions
    /adapters                        # ✅ File utilities (COMPLETE)
      /src
        - csv.ts                     # PapaParse wrapper
        - excel.ts                   # SheetJS wrapper
        - zip.ts                     # JSZip wrapper
```

See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for complete file tree.

## Source Repositories to Reuse

Import/adapt code from these existing open-source repos:
- **AuditUniverse** - https://github.com/rp4/AuditUniverse (Three.js 3D graph)
- **NeedleFinder** - https://github.com/rp4/NeedleFinder (anomaly search)
- **Scheduler** - https://github.com/rp4/Scheduler (constraint-based scheduling)
- **TicknTie** - https://github.com/rp4/TicknTie (Univer spreadsheet + doc linking)
- **swim_lanes** - https://github.com/rp4/swim_lanes (process diagrams)

Check licenses and attribution requirements when integrating.

## Tech Stack

- **UI**: Next.js 14+ (React + TypeScript)
- **Rendering**:
  - Three.js for AuditUniverse
  - Univer for Excel grid (Tick'n'Tie)
  - SVG/Canvas/D3 for Swimlanes
  - TanStack Table for Needle Finder
- **File I/O**: SheetJS (XLSX), PapaParse (CSV), JSZip (ZIP)
- **Hosting**: Vercel at `mcp.audittoolbox.com`
- **Bridge**: Apps SDK `window.openai` for toolOutput → UI

## Data Contracts

All tool payloads follow a common base:
```ts
type StructuredContentBase = {
  tool: 'swimlanes'|'needle'|'tickntie'|'scheduler'|'auditverse'
}
```

Each tool extends this with a specific schema (see section 5.2 in the spec document). Use zod schemas in `/packages/schemas` to validate incoming data from ChatGPT.

## iframe Integration Pattern

The main app page reads `window.openai.toolOutput.structuredContent` and switches views based on the `tool` field:
1. Listen for initial payload and message events
2. Validate schema
3. Route to appropriate view component
4. Lazy-load heavy dependencies (three, @univerjs/*)
5. Dispose resources properly on unmount

## Performance Requirements

- Lazy-load heavy libraries (Three.js, Univer)
- Pause animations when off-screen
- Virtualize large tables
- Dispose GPU resources and object URLs on unmount
- No memory/GPU leaks

## View Component Responsibilities

Each view must support:
- **Download** - Export as CSV/XLSX/SVG/PNG depending on tool
- **Fullscreen** - Option to expand view (especially for Tick'n'Tie & AuditUniverse)
- **Proper cleanup** - Dispose Three.js geometries/materials/textures, revoke object URLs

## Development Workflow

1. Set up monorepo structure (apps/web-ui, packages/schemas, packages/components)
2. Port rendering logic from the five source repos
3. Implement schemas and router page
4. Mock data for each tool to validate rendering
5. Test with ChatGPT Developer Mode (use ngrok for local dev)
6. Optimize bundle size and lazy-loading
7. Deploy to Vercel with custom domain

## Testing Before Deployment

- Enable Developer Mode in ChatGPT
- Run `next dev` in `/apps/web-ui`
- Expose locally with ngrok if needed
- Upload sample files for each tool type
- Validate schema compliance and rendering for all five tools

## Security & Privacy

- No third-party servers; no data persistence
- Only load static assets from own domain
- Set strict CSP
- If optional APIs are needed, keep them stateless with no storage
- Provide clear download controls; never exfiltrate data

## Deployment

- Deploy to Vercel (static export or standard Next.js)
- Map `mcp.audittoolbox.com` to deployment
- Verify HTTPS and CORS for asset loading
- Ensure inline rendering works for all 5 tools
- Resources properly disposed on unmount

## Reference Documentation

The complete specification is in [audit_toolbox_mcp_complete_build_instructions_for_ai_agents.md](audit_toolbox_mcp_complete_build_instructions_for_ai_agents.md), including:
- Detailed data schemas for each tool (section 5.2)
- Example payloads from model → iframe (section 14)
- Tool-specific reuse notes per repo (section 13)
- Acceptance criteria checklist (section 17)
