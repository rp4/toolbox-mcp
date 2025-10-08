# Quick Start Guide

Get the AuditToolbox MCP running in under 5 minutes.

## Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- npm (comes with Node.js)
- Git (for version control)

## Step 1: Install Dependencies

```bash
# Navigate to project root
cd /home/p472/toolbox-mcp

# Install root workspace
npm install

# Install schemas package
cd packages/schemas
npm install
cd ../..

# Install adapters package
cd packages/adapters
npm install
cd ../..

# Install web-ui package
cd apps/web-ui
npm install
cd ../..
```

## Step 2: Build Required Packages

```bash
# Build schemas (required by web-ui)
cd packages/schemas
npm run build
cd ../..

# Build adapters (optional, for future features)
cd packages/adapters
npm run build
cd ../..
```

## Step 3: Start Development Server

```bash
# From root directory
npm run dev

# Or from web-ui directory
cd apps/web-ui
npm run dev
```

The app will be available at **http://localhost:3000**

## Step 4: Test with Mock Data

### Option A: Browser Console

1. Open http://localhost:3000 in your browser
2. Open Developer Tools (F12)
3. Paste this into the console:

```javascript
window.openai = {
  toolOutput: {
    structuredContent: {
      tool: 'swimlanes',
      spec: {
        lanes: [
          { id: 'ops', title: 'Operations' },
          { id: 'it', title: 'IT Support' }
        ],
        nodes: [
          { id: 'n1', laneId: 'ops', label: 'Receive Request' },
          { id: 'n2', laneId: 'it', label: 'Process Ticket' }
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'forward' }
        ]
      }
    }
  }
}

// Trigger re-render
window.dispatchEvent(new Event('load'))
```

4. You should see a swimlanes diagram appear!

### Option B: Test HTML File

Create `test.html` in the project root:

```html
<!DOCTYPE html>
<html>
<head>
  <title>AuditToolbox Test</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    button { margin: 5px; padding: 10px 20px; cursor: pointer; }
    iframe { width: 100%; height: 600px; border: 1px solid #ccc; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>AuditToolbox MCP Test</h1>
  <div>
    <button onclick="testSwimLanes()">Test Swimlanes</button>
    <button onclick="testNeedle()">Test Needle Finder</button>
    <button onclick="testScheduler()">Test Scheduler</button>
    <button onclick="testAuditVerse()">Test AuditUniverse</button>
  </div>

  <iframe id="app" src="http://localhost:3000"></iframe>

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
            { id: 'sales', title: 'Sales' },
            { id: 'finance', title: 'Finance' },
            { id: 'ops', title: 'Operations' }
          ],
          nodes: [
            { id: 'n1', laneId: 'sales', label: 'Create Quote' },
            { id: 'n2', laneId: 'finance', label: 'Review Price' },
            { id: 'n3', laneId: 'ops', label: 'Fulfill Order' }
          ],
          edges: [
            { from: 'n1', to: 'n2', label: 'submit' },
            { from: 'n2', to: 'n3', label: 'approve' }
          ]
        }
      });
    }

    function testNeedle() {
      sendMessage({
        tool: 'needle',
        result: {
          rows: [
            { id: 1, vendor: 'ACME Corp', amount: 99999.99, status: 'Flagged' },
            { id: 2, vendor: 'Beta Inc', amount: 150000.00, status: 'Review' },
            { id: 3, vendor: 'Gamma LLC', amount: 250000.00, status: 'High Risk' }
          ],
          summary: {
            matches: 3,
            scanned: 10000,
            flagged: 3
          }
        }
      });
    }

    function testScheduler() {
      sendMessage({
        tool: 'scheduler',
        result: {
          table: [
            { Time: 'Mon 09:00', Team: 'Engineering', Activity: 'Standup', Room: 'Conf A' },
            { Time: 'Mon 10:00', Team: 'Sales', Activity: 'Pipeline Review', Room: 'Conf B' },
            { Time: 'Mon 11:00', Team: 'Engineering', Activity: 'Sprint Planning', Room: 'Conf A' },
            { Time: 'Mon 14:00', Team: 'Finance', Activity: 'Budget Review', Room: 'Conf C' }
          ]
        }
      });
    }

    function testAuditVerse() {
      sendMessage({
        tool: 'auditverse',
        model: {
          nodes: [
            { id: 'ap', type: 'entity', label: 'Accounts Payable', size: 1.5 },
            { id: 'ar', type: 'entity', label: 'Accounts Receivable', size: 1.2 },
            { id: 'inv', type: 'entity', label: 'Inventory', size: 1.0 },
            { id: 'risk1', type: 'risk', label: 'Duplicate Payments', size: 1.0 },
            { id: 'risk2', type: 'risk', label: 'Write-offs', size: 0.8 },
            { id: 'ctrl1', type: 'control', label: '3-Way Match', size: 1.0 },
            { id: 'ctrl2', type: 'control', label: 'Credit Check', size: 0.9 }
          ],
          edges: [
            { from: 'ap', to: 'risk1' },
            { from: 'risk1', to: 'ctrl1' },
            { from: 'ar', to: 'risk2' },
            { from: 'risk2', to: 'ctrl2' },
            { from: 'ap', to: 'inv' }
          ],
          layout: 'force'
        }
      });
    }

    // Auto-test on load
    window.addEventListener('load', () => {
      setTimeout(() => testSwimLanes(), 1000);
    });
  </script>
</body>
</html>
```

Open `test.html` in your browser and click the buttons to test each tool!

## Step 5: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login (first time only)
vercel login

# Deploy
vercel

# For production
vercel --prod
```

## Common Issues

### ❌ "Cannot find module '@audittoolbox/schemas'"

**Solution**: Build the schemas package first
```bash
cd packages/schemas
npm run build
cd ../..
```

### ❌ Port 3000 is already in use

**Solution**: Use a different port
```bash
cd apps/web-ui
PORT=3001 npm run dev
```

### ❌ Missing dependencies

**Solution**: Install all workspaces
```bash
npm install
cd packages/schemas && npm install && cd ../..
cd packages/adapters && npm install && cd ../..
cd apps/web-ui && npm install && cd ../..
```

## Next Steps

1. ✅ **Test all 5 tools** with the test HTML file
2. 📚 **Read** [BUILD.md](BUILD.md) for detailed testing instructions
3. 🚀 **Deploy** to Vercel with custom domain
4. 🔗 **Integrate** with ChatGPT Developer Mode
5. 🎨 **Enhance** with code from source repositories

## File Structure Summary

```
toolbox-mcp/
├── apps/web-ui/           # Main Next.js app
├── packages/schemas/      # Type definitions
├── packages/adapters/     # File utilities
├── README.md              # Project overview
├── BUILD.md               # Detailed build guide
├── QUICKSTART.md          # This file
└── SUMMARY.md             # Build status
```

## Getting Help

- Check [BUILD.md](BUILD.md) for troubleshooting
- Review [CLAUDE.md](CLAUDE.md) for architecture details
- See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for file organization

## Success Checklist

- [ ] Dependencies installed
- [ ] Schemas built
- [ ] Dev server running at localhost:3000
- [ ] Tested at least one tool with mock data
- [ ] All 5 tools render without errors
- [ ] Downloads work for each tool
- [ ] Fullscreen toggle works
- [ ] Ready to deploy to Vercel

🎉 **You're ready to go!**
