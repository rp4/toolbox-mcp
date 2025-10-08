# Project Structure

```
toolbox-mcp/
├── .git/                                    # Git repository
├── .gitignore                               # Git ignore rules
├── .nvmrc                                   # Node version (18)
├── package.json                             # Root package.json (workspaces config)
├── vercel.json                              # Vercel deployment config
├── README.md                                # Project overview and documentation
├── CLAUDE.md                                # Instructions for Claude Code
├── BUILD.md                                 # Build and test instructions
├── PROJECT_STRUCTURE.md                     # This file
├── audit_toolbox_mcp_complete_build_instructions_for_ai_agents.md  # Original spec
│
├── apps/
│   └── web-ui/                              # Next.js iframe application
│       ├── .eslintrc.json                   # ESLint configuration
│       ├── next.config.js                   # Next.js config (iframe headers, webpack)
│       ├── postcss.config.js                # PostCSS config for Tailwind
│       ├── tailwind.config.ts               # Tailwind CSS configuration
│       ├── tsconfig.json                    # TypeScript config
│       ├── package.json                     # Web UI dependencies
│       │
│       ├── app/                             # Next.js App Router
│       │   ├── globals.css                  # Global styles (Tailwind)
│       │   ├── layout.tsx                   # Root layout component
│       │   └── page.tsx                     # Main app page (router logic)
│       │
│       ├── components/
│       │   └── views/                       # Tool-specific view components
│       │       ├── SwimlanesView.tsx        # Swimlanes diagram renderer (Canvas)
│       │       ├── NeedleView.tsx           # Needle Finder table (TanStack Table)
│       │       ├── TickTieView.tsx          # Tick'n'Tie spreadsheet + docs viewer
│       │       ├── SchedulerView.tsx        # Scheduler table/sheet view
│       │       └── AuditVerseView.tsx       # AuditUniverse 3D scene (Three.js)
│       │
│       └── public/                          # Static assets (empty)
│           └── .gitkeep
│
└── packages/
    ├── schemas/                             # Zod schemas for data validation
    │   ├── package.json                     # Schema package config
    │   ├── tsconfig.json                    # TypeScript config
    │   └── src/
    │       └── index.ts                     # All schema definitions
    │                                        # - ToolType
    │                                        # - SwimlanesContent
    │                                        # - NeedleContent
    │                                        # - TickTieContent
    │                                        # - SchedulerContent
    │                                        # - AuditVerseContent
    │                                        # - StructuredContent (union)
    │
    └── adapters/                            # File handling utilities
        ├── package.json                     # Adapters package config
        ├── tsconfig.json                    # TypeScript config
        └── src/
            ├── index.ts                     # Export all adapters
            ├── csv.ts                       # CSV parse/generate (PapaParse)
            │                                # - parseCSV()
            │                                # - parseCSVFile()
            │                                # - toCSV()
            │                                # - downloadCSV()
            │
            ├── excel.ts                     # Excel read/write (SheetJS)
            │                                # - readExcelFile()
            │                                # - readExcelAsJSON()
            │                                # - createWorkbook()
            │                                # - createExcelDataURL()
            │                                # - downloadExcel()
            │
            └── zip.ts                       # ZIP file handling (JSZip)
                                             # - readZipFile()
                                             # - createZipFile()
                                             # - downloadZip()
                                             # - extractImagesFromZip()
                                             # - extractPDFsFromZip()
```

## Key Files

### Core Application

- **`apps/web-ui/app/page.tsx`**: Main entry point
  - Reads `window.openai.toolOutput`
  - Validates with Zod schemas
  - Routes to appropriate view component
  - Handles postMessage events

- **`packages/schemas/src/index.ts`**: Type definitions
  - Zod schemas for all 5 tools
  - Discriminated union for type safety
  - Runtime validation of incoming data

### View Components

Each view component follows the same pattern:
- Receives validated data as props
- Renders tool-specific visualization
- Provides download functionality
- Supports fullscreen mode
- Handles cleanup on unmount

1. **SwimlanesView**: Canvas-based diagram
   - Draws lanes, nodes, edges
   - Auto-layout algorithm
   - Export to PNG

2. **NeedleView**: Interactive data table
   - TanStack Table for sorting/filtering
   - Global search
   - CSV export

3. **TickTieView**: Split-pane interface
   - Left: Spreadsheet viewer
   - Right: Document previews
   - Cell ↔ Document linking

4. **SchedulerView**: Schedule display
   - Table or Excel file
   - Download XLSX/CSV

5. **AuditVerseView**: 3D graph visualization
   - Three.js scene
   - Force/grid/sphere layouts
   - Orbit controls
   - Proper GPU cleanup

## Data Flow

```
ChatGPT → window.openai.toolOutput
    ↓
apps/web-ui/app/page.tsx (validate with Zod)
    ↓
Route to view component based on tool type
    ↓
Render visualization
    ↓
User interactions (download, fullscreen, etc.)
```

## Package Dependencies

### Root
- Workspaces configuration
- No direct dependencies

### packages/schemas
- zod: Runtime type validation

### packages/adapters
- papaparse: CSV parsing
- xlsx (SheetJS): Excel files
- jszip: ZIP archive handling

### apps/web-ui
- next, react, react-dom: Framework
- @audittoolbox/schemas: Local workspace package
- three, @react-three/fiber, @react-three/drei: 3D rendering
- @tanstack/react-table: Data tables
- d3: Utilities
- papaparse, xlsx, jszip: File handling
- tailwindcss: Styling

## Build Process

1. **Install**: `npm install` (installs all workspaces)
2. **Build schemas**: Required by web-ui
3. **Build adapters**: Optional, used by future features
4. **Build web-ui**: Creates production build in `.next/`
5. **Deploy**: Upload to Vercel or static host

## Development

- Hot reload enabled in Next.js
- Type checking via TypeScript
- ESLint for code quality
- Tailwind for rapid styling
- Component isolation for testing

## Future Extensions

- MCP server in `apps/mcp-server/` (currently optional)
- Shared UI components in `packages/components/`
- Integration with source repos:
  - Clone AuditUniverse for enhanced 3D
  - Clone NeedleFinder for ML-based anomaly detection
  - Clone TicknTie for full Univer integration
  - Clone Scheduler for constraint solver
  - Clone swim_lanes for advanced diagramming
