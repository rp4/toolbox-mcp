# Build Instructions

## Quick Start

```bash
# 1. Install dependencies
npm install
cd packages/schemas && npm install && cd ../..
cd packages/adapters && npm install && cd ../..
cd apps/web-ui && npm install && cd ../..

# 2. Build schemas package (required before building web-ui)
cd packages/schemas && npm run build && cd ../..

# 3. Build adapters package
cd packages/adapters && npm run build && cd ../..

# 4. Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## Development Workflow

### Watch Mode for Packages

If you're actively developing and making changes to the schema or adapter packages:

```bash
# Terminal 1: Watch schemas
cd packages/schemas && npm run dev

# Terminal 2: Watch adapters
cd packages/adapters && npm run dev

# Terminal 3: Run web-ui
cd apps/web-ui && npm run dev
```

### Building for Production

```bash
# Build all packages
npm run build

# This will build the web-ui app which includes building schemas first
```

## Testing Locally with ChatGPT

### Option 1: Local Testing (ngrok)

```bash
# Start dev server
npm run dev

# In another terminal, expose with ngrok
ngrok http 3000

# Use the ngrok URL in ChatGPT Developer Mode
```

### Option 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

## Testing Each Tool

### 1. Swimlanes

Send this test payload via ChatGPT or create a test HTML file:

```javascript
window.openai = {
  toolOutput: {
    structuredContent: {
      tool: 'swimlanes',
      spec: {
        lanes: [
          { id: 'ops', title: 'Operations' },
          { id: 'it', title: 'IT' },
          { id: 'finance', title: 'Finance' }
        ],
        nodes: [
          { id: 'n1', laneId: 'ops', label: 'Receive PO' },
          { id: 'n2', laneId: 'it', label: 'Validate System' },
          { id: 'n3', laneId: 'finance', label: 'Process Payment' }
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'send' },
          { from: 'n2', to: 'n3', label: 'approve' }
        ]
      }
    }
  }
}
```

### 2. Needle Finder

```javascript
window.openai = {
  toolOutput: {
    structuredContent: {
      tool: 'needle',
      result: {
        rows: [
          { id: 101, vendor: 'ACME Corp', amount: 99999.99, flag: 'High Risk' },
          { id: 203, vendor: 'Beta LLC', amount: 150000.00, flag: 'Duplicate' },
          { id: 405, vendor: 'Gamma Inc', amount: 250000.00, flag: 'Outlier' }
        ],
        summary: {
          matches: 3,
          scanned: 24000,
          flagged: 3
        }
      }
    }
  }
}
```

### 3. Tick'n'Tie

```javascript
window.openai = {
  toolOutput: {
    structuredContent: {
      tool: 'tickntie',
      result: {
        xlsxDataUrl: 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,...',
        links: [
          { cell: 'B12', file: 'invoice_0421.png', page: 1, bbox: [120, 330, 260, 380] },
          { cell: 'C12', file: 'receipt_0421.pdf', page: 1, bbox: [50, 200, 150, 250] }
        ]
      }
    }
  }
}
```

### 4. Scheduler

```javascript
window.openai = {
  toolOutput: {
    structuredContent: {
      tool: 'scheduler',
      result: {
        table: [
          { slot: 'Mon 09:00', 'Team A': 'Standup', 'Room': 'Conf A' },
          { slot: 'Mon 10:00', 'Team B': 'Planning', 'Room': 'Conf B' },
          { slot: 'Mon 11:00', 'Team A': 'Design Review', 'Room': 'Conf A' }
        ]
      }
    }
  }
}
```

### 5. AuditUniverse

```javascript
window.openai = {
  toolOutput: {
    structuredContent: {
      tool: 'auditverse',
      model: {
        nodes: [
          { id: 'ap', type: 'entity', label: 'Accounts Payable', size: 1.5 },
          { id: 'ar', type: 'entity', label: 'Accounts Receivable', size: 1.2 },
          { id: 'risk1', type: 'risk', label: 'Duplicate Payments', size: 1 },
          { id: 'control1', type: 'control', label: '3-Way Match', size: 1 }
        ],
        edges: [
          { from: 'ap', to: 'risk1', weight: 1 },
          { from: 'risk1', to: 'control1', weight: 1 }
        ],
        layout: 'force'
      }
    }
  }
}
```

## Creating Test HTML File

Create `test.html` in the project root:

```html
<!DOCTYPE html>
<html>
<head>
  <title>AuditToolbox Test</title>
</head>
<body>
  <h1>Tool Test</h1>
  <button onclick="testSwimLanes()">Test Swimlanes</button>
  <button onclick="testNeedle()">Test Needle Finder</button>
  <button onclick="testTickTie()">Test Tick'n'Tie</button>
  <button onclick="testScheduler()">Test Scheduler</button>
  <button onclick="testAuditVerse()">Test AuditUniverse</button>

  <iframe id="app" src="http://localhost:3000" width="100%" height="800px"></iframe>

  <script>
    function sendMessage(content) {
      const iframe = document.getElementById('app');
      iframe.contentWindow.postMessage({
        type: 'openai:toolOutput',
        payload: { structuredContent: content }
      }, '*');
    }

    function testSwimLanes() {
      sendMessage({
        tool: 'swimlanes',
        spec: {
          lanes: [
            { id: 'ops', title: 'Operations' },
            { id: 'it', title: 'IT' }
          ],
          nodes: [
            { id: 'n1', laneId: 'ops', label: 'Receive PO' },
            { id: 'n2', laneId: 'it', label: 'Validate' }
          ],
          edges: [
            { from: 'n1', to: 'n2', label: 'send' }
          ]
        }
      });
    }

    function testNeedle() {
      sendMessage({
        tool: 'needle',
        result: {
          rows: [
            { id: 101, vendor: 'ACME', amount: 99999.99, flag: 'High' }
          ],
          summary: { matches: 1, scanned: 1000 }
        }
      });
    }

    function testTickTie() {
      sendMessage({
        tool: 'tickntie',
        result: {
          xlsxDataUrl: 'data:text/plain,test',
          links: [
            { cell: 'B12', file: 'invoice.png' }
          ]
        }
      });
    }

    function testScheduler() {
      sendMessage({
        tool: 'scheduler',
        result: {
          table: [
            { slot: 'Mon 09:00', team: 'Team A', room: 'Conf A' }
          ]
        }
      });
    }

    function testAuditVerse() {
      sendMessage({
        tool: 'auditverse',
        model: {
          nodes: [
            { id: 'ap', type: 'entity', label: 'AP' },
            { id: 'risk1', type: 'risk', label: 'Dup Payments' }
          ],
          edges: [
            { from: 'ap', to: 'risk1' }
          ],
          layout: 'force'
        }
      });
    }
  </script>
</body>
</html>
```

## Common Issues

### "Cannot find module '@audittoolbox/schemas'"

The schemas package needs to be built first:

```bash
cd packages/schemas
npm run build
```

### Port 3000 already in use

```bash
# Use a different port
cd apps/web-ui
PORT=3001 npm run dev
```

### Type errors in web-ui

Make sure all packages are built:

```bash
cd packages/schemas && npm run build && cd ../..
cd packages/adapters && npm run build && cd ../..
```

## Production Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set build settings:
   - Framework: Next.js
   - Root Directory: `apps/web-ui`
   - Build Command: `cd ../.. && npm install && cd packages/schemas && npm run build && cd ../packages/adapters && npm run build && cd ../../apps/web-ui && npm run build`
   - Output Directory: `.next`

4. Add custom domain: `mcp.audittoolbox.com`

### Manual Deployment

```bash
# Build everything
cd packages/schemas && npm run build && cd ../..
cd packages/adapters && npm run build && cd ../..
cd apps/web-ui && npm run build

# The build output will be in apps/web-ui/.next
# Deploy this directory to your static host
```
