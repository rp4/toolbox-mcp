# AuditToolbox MCP

A unified ChatGPT App that combines five audit and analysis tools into a single interface. Users interact via ChatGPT, uploading files and receiving inline visualizations through an embedded iframe.

## Tools Included

1. **Swimlanes** - Process/sequence diagrams with lanes (SVG/canvas rendering)
2. **Needle Finder** - Anomaly detection and search over tabular/log data
3. **Tick'n'Tie** - Document linking to spreadsheet cells with visual references
4. **Scheduler** - Constraint-based team scheduling
5. **AuditUniverse** - 3D graph visualization for audit relationships (Three.js)

## Architecture

- **Frontend**: Next.js 14+ (React + TypeScript)
- **Rendering**: Three.js, Canvas API, TanStack Table
- **File Processing**: SheetJS 0.20.3+ (XLSX), PapaParse (CSV), JSZip (ZIP)
- **Hosting**: Vercel at `mcp.audittoolbox.com`
- **Integration**: ChatGPT Apps SDK via `window.openai` iframe bridge

All data processing happens client-side with no backend persistence, ensuring privacy.

> **Security Note**: We use SheetJS v0.20.3 to address the ReDoS vulnerability in earlier versions. See [SECURITY.md](SECURITY.md) for details.

## Project Structure

```
/
├── apps/
│   └── web-ui/              # Next.js iframe application
│       ├── app/             # App router pages
│       ├── components/      # React components
│       │   └── views/       # Tool-specific view components
│       └── package.json
├── packages/
│   ├── schemas/             # Zod schemas for data validation
│   ├── adapters/            # File handling utilities (CSV, XLSX, ZIP)
│   └── components/          # Shared UI components
├── package.json             # Root package.json (workspaces)
└── vercel.json              # Vercel deployment config
```

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies for all workspaces
npm install

# Install dependencies for schemas package
cd packages/schemas && npm install && cd ../..

# Install dependencies for adapters package
cd packages/adapters && npm install && cd ../..

# Install dependencies for web-ui
cd apps/web-ui && npm install && cd ../..
```

### Running Locally

```bash
# Start development server
npm run dev

# Or run from web-ui directory
cd apps/web-ui
npm run dev
```

The app will be available at `http://localhost:3000`.

### Building

```bash
# Build all packages
npm run build

# Type check
npm run type-check
```

### Testing with ChatGPT

1. Enable **Developer Mode** in ChatGPT
2. Run the development server (`npm run dev`)
3. If testing remotely, expose with ngrok: `ngrok http 3000`
4. Configure the ChatGPT app to point to your URL
5. Upload sample files and test each tool

## Data Schemas

All tools use validated schemas defined in `packages/schemas`:

- **SwimlanesContent**: Lanes, nodes, and edges for process diagrams
- **NeedleContent**: Filtered rows and summary statistics
- **TickTieContent**: Excel data URL with cell-to-document links
- **SchedulerContent**: Schedule table or Excel workbook
- **AuditVerseContent**: 3D graph nodes and edges

See `packages/schemas/src/index.ts` for complete type definitions.

## View Components

Each tool has a dedicated view component in `apps/web-ui/components/views/`:

- **SwimlanesView.tsx** - Canvas-based swimlane diagram with download
- **NeedleView.tsx** - Sortable/filterable table with CSV export
- **TickTieView.tsx** - Split-pane spreadsheet + document viewer
- **SchedulerView.tsx** - Schedule table with Excel download
- **AuditVerseView.tsx** - Interactive 3D scene with Three.js

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Custom Domain

Configure `mcp.audittoolbox.com` in Vercel project settings:

1. Go to project settings → Domains
2. Add `mcp.audittoolbox.com`
3. Configure DNS with your provider (A or CNAME record)

## File Handling

The `@audittoolbox/adapters` package provides utilities for:

- **CSV**: Parse/generate CSV with PapaParse
- **Excel**: Read/write XLSX with SheetJS
- **ZIP**: Extract files from ZIP archives with JSZip

All processing happens in the browser - no server uploads required.

## Security & Privacy

- No third-party data transmission
- No backend data persistence
- All file processing client-side
- Strict CSP headers for iframe security
- Only loads assets from own domain

## Source Repositories

This project integrates code and concepts from:

- [AuditUniverse](https://github.com/rp4/AuditUniverse) - 3D visualization
- [NeedleFinder](https://github.com/rp4/NeedleFinder) - Anomaly detection
- [Scheduler](https://github.com/rp4/Scheduler) - Constraint scheduling
- [TicknTie](https://github.com/rp4/TicknTie) - Document linking
- [swim_lanes](https://github.com/rp4/swim_lanes) - Process diagrams

Check individual repositories for licenses and attribution requirements.

## License

MIT (or specify appropriate license)
