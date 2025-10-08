# Testing Guide

## ✅ Dev Server is Running!

The development server is now running at: **http://localhost:3000**

## How to Test

### Option 1: Using the Test HTML File (RECOMMENDED)

I've created a test interface for you at [test.html](test.html)

1. **Open the test file in your browser:**
   ```bash
   # From the project root
   open test.html
   # OR
   firefox test.html
   # OR
   chrome test.html
   ```

2. **Click the buttons to test each tool:**
   - 🏊 **Test Swimlanes** - Process diagram with 4 departments
   - 🔍 **Test Needle Finder** - Table with 8 flagged transactions
   - 🔗 **Test Tick'n'Tie** - Spreadsheet with 5 linked documents
   - 📅 **Test Scheduler** - Weekly schedule with 10 meetings
   - 🌌 **Test AuditUniverse** - 3D graph with 15 nodes

3. **What you should see:**
   - The iframe automatically loads localhost:3000
   - After 2 seconds, Swimlanes will auto-load
   - Click any button to switch between tools
   - Each tool should render instantly

### Option 2: Browser Console Method

If you prefer to test directly:

1. Open http://localhost:3000 in your browser
2. Open DevTools (F12)
3. Paste this in the console:

```javascript
// Test Swimlanes
window.openai = {
  toolOutput: {
    structuredContent: {
      tool: 'swimlanes',
      spec: {
        lanes: [
          { id: 'sales', title: 'Sales' },
          { id: 'finance', title: 'Finance' }
        ],
        nodes: [
          { id: 'n1', laneId: 'sales', label: 'Create Quote' },
          { id: 'n2', laneId: 'finance', label: 'Review Price' }
        ],
        edges: [
          { from: 'n1', to: 'n2', label: 'submit' }
        ]
      }
    }
  }
}

// Trigger reload
location.reload()
```

### Option 3: PostMessage Method

1. Open http://localhost:3000 in an iframe
2. Send postMessage from parent window:

```javascript
const iframe = document.querySelector('iframe');
iframe.contentWindow.postMessage({
  type: 'openai:toolOutput',
  payload: {
    structuredContent: {
      tool: 'needle',
      result: {
        rows: [
          { id: 1, vendor: 'ACME', amount: 99999.99, flag: 'High' }
        ],
        summary: { matches: 1, scanned: 1000 }
      }
    }
  }
}, '*');
```

## Expected Results

### 🏊 Swimlanes
- Canvas-based process diagram
- Multiple colored lanes (alternating backgrounds)
- Blue nodes with labels
- Arrows connecting nodes
- Download PNG button
- Fullscreen button

### 🔍 Needle Finder
- Sortable table with 8 rows
- Summary statistics at top
- Search box (filters all columns)
- Click column headers to sort
- Download CSV button
- Fullscreen button

### 🔗 Tick'n'Tie
- Split-pane layout
- Left: Spreadsheet info with linked cells
- Right: Document preview panel
- Clickable cell buttons (B12, C12, B15, D20, E25)
- Download XLSX button
- Fullscreen button

### 📅 Scheduler
- Table with 10 scheduled meetings
- Columns: Time, Team, Activity, Room, Duration
- Clean formatting
- Download CSV button
- Fullscreen button

### 🌌 AuditUniverse
- 3D visualization with Three.js
- 15 nodes (color-coded by type):
  - Blue: Entities (AP, AR, Inventory, GL, Payroll)
  - Red: Risks
  - Green: Controls
- Lines connecting nodes
- Interactive controls:
  - Click and drag to rotate
  - Scroll to zoom
  - Right-click and drag to pan
- Fullscreen button

## Troubleshooting

### "Waiting for content from ChatGPT..."
**This is normal!** The app is waiting for data. Use one of the test methods above to send mock data.

### Iframe doesn't load
- Make sure the dev server is running on port 3000
- Check browser console for errors
- Try opening http://localhost:3000 directly first

### No changes after clicking buttons
- Check browser console for errors
- Verify the iframe loaded correctly
- Try the browser console method instead

### 3D visualization doesn't show
- Wait a few seconds for Three.js to load
- Check for "Loading 3D scene..." message
- Verify WebGL is supported (try chrome://gpu)

### TypeScript/Build Errors
```bash
# Rebuild packages
cd /home/p472/toolbox-mcp
cd packages/schemas && npm run build && cd ../..
cd packages/adapters && npm run build && cd ../..
cd apps/web-ui && npm run build
```

## Stopping the Dev Server

```bash
# Find the process
ps aux | grep "next dev"

# Or use the background job ID
# (I'll provide this if needed)
```

## Development Workflow

While testing, you can modify code and see changes instantly:

1. Edit any component in `apps/web-ui/components/views/`
2. Save the file
3. The browser will automatically refresh (Hot Module Replacement)

## Next Steps After Testing

Once you've verified all 5 tools work:

1. ✅ Test downloads (PNG, CSV, XLSX)
2. ✅ Test fullscreen mode
3. ✅ Test responsive design (resize browser)
4. ✅ Check browser console for errors
5. ✅ Ready for deployment!

## Quick Test Checklist

- [ ] Swimlanes renders with diagram
- [ ] Needle Finder shows table with data
- [ ] Tick'n'Tie shows split pane
- [ ] Scheduler displays schedule
- [ ] AuditUniverse shows 3D scene
- [ ] All download buttons work
- [ ] All fullscreen toggles work
- [ ] No console errors
- [ ] Smooth interactions

---

**Happy Testing! 🎉**

The test.html file will automatically test Swimlanes after 2 seconds. Click the other buttons to test the remaining tools!
