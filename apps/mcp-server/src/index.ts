#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const NGROK_URL = process.env.NGROK_URL || 'https://adjustmental-plutean-george.ngrok-free.dev';
const UI_PORT = process.env.UI_PORT || '3000';

// Create MCP server
const server = new Server(
  {
    name: 'audittoolbox',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

// Register the widget HTML resource
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'ui://widget/widget.html',
        mimeType: 'text/html',
        name: 'AuditToolbox Widget',
        description: 'Interactive UI for all 5 audit tools',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  if (request.params.uri === 'ui://widget/widget.html') {
    return {
      contents: [
        {
          uri: 'ui://widget/widget.html',
          mimeType: 'text/html',
          text: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AuditToolbox</title>
</head>
<body>
  <iframe src="${NGROK_URL}/" style="width:100%;height:100vh;border:none;position:absolute;top:0;left:0;"></iframe>
</body>
</html>`,
          _meta: {
            'openai/widgetDescription': 'AuditToolbox - 5 audit & analysis tools',
            'openai/widgetPrefersBorder': true,
            'openai/widgetCSP': {
              connect_domains: [NGROK_URL],
              resource_domains: [NGROK_URL],
            },
            'openai/widgetDomain': NGROK_URL,
          },
        },
      ],
    };
  }
  throw new Error(`Unknown resource: ${request.params.uri}`);
});

// Register all 5 tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'swimlanes',
        description: 'Create interactive process/sequence diagrams with swim lanes. Upload process descriptions, flowcharts, or describe workflows.',
        inputSchema: {
          type: 'object',
          properties: {
            lanes: {
              type: 'array',
              description: 'Swim lanes (e.g., departments, actors)',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  title: { type: 'string' },
                },
                required: ['id', 'title'],
              },
            },
            nodes: {
              type: 'array',
              description: 'Process steps/activities',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  laneId: { type: 'string' },
                  label: { type: 'string' },
                },
                required: ['id', 'laneId', 'label'],
              },
            },
            edges: {
              type: 'array',
              description: 'Connections between steps',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  label: { type: 'string' },
                },
                required: ['from', 'to'],
              },
            },
          },
          required: ['lanes', 'nodes', 'edges'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/widget.html',
          'openai/toolInvocation/invoking': 'Creating swimlane diagram…',
          'openai/toolInvocation/invoked': 'Swimlane diagram ready',
        },
      },
      {
        name: 'needle_finder',
        description: 'Find anomalies and outliers in tabular data (CSV, Excel). Detect unusual patterns, duplicates, or values that don\'t match expected ranges.',
        inputSchema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              description: 'Tabular data rows',
              items: { type: 'object' },
            },
            findings: {
              type: 'array',
              description: 'Detected anomalies with reasons',
              items: {
                type: 'object',
                properties: {
                  rowIndex: { type: 'number' },
                  field: { type: 'string' },
                  value: {},
                  reason: { type: 'string' },
                  severity: { type: 'string', enum: ['low', 'medium', 'high'] },
                },
                required: ['rowIndex', 'field', 'value', 'reason', 'severity'],
              },
            },
          },
          required: ['data', 'findings'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/widget.html',
          'openai/toolInvocation/invoking': 'Analyzing data for anomalies…',
          'openai/toolInvocation/invoked': 'Anomaly analysis complete',
        },
      },
      {
        name: 'tickntie',
        description: 'Link spreadsheet cells to supporting documents/images. Upload Excel + PDFs/images to create an audit trail showing which documents support which numbers.',
        inputSchema: {
          type: 'object',
          properties: {
            workbook: {
              type: 'object',
              description: 'Excel workbook data (SheetJS format)',
            },
            links: {
              type: 'array',
              description: 'Cell-to-document links',
              items: {
                type: 'object',
                properties: {
                  cellRef: { type: 'string', description: 'e.g., Sheet1!A1' },
                  documentId: { type: 'string' },
                  pageNumber: { type: 'number' },
                  note: { type: 'string' },
                },
                required: ['cellRef', 'documentId'],
              },
            },
            documents: {
              type: 'array',
              description: 'Supporting documents',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  dataUrl: { type: 'string' },
                },
                required: ['id', 'name'],
              },
            },
          },
          required: ['workbook', 'links', 'documents'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/widget.html',
          'openai/toolInvocation/invoking': 'Creating document links…',
          'openai/toolInvocation/invoked': 'Tick & tie complete',
        },
      },
      {
        name: 'scheduler',
        description: 'Generate team schedules based on availability and constraints. Upload availability data and constraints to create optimized schedules.',
        inputSchema: {
          type: 'object',
          properties: {
            people: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                },
                required: ['id', 'name'],
              },
            },
            slots: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  start: { type: 'string', format: 'date-time' },
                  end: { type: 'string', format: 'date-time' },
                },
                required: ['id', 'start', 'end'],
              },
            },
            assignments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  personId: { type: 'string' },
                  slotId: { type: 'string' },
                },
                required: ['personId', 'slotId'],
              },
            },
          },
          required: ['people', 'slots', 'assignments'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/widget.html',
          'openai/toolInvocation/invoking': 'Generating schedule…',
          'openai/toolInvocation/invoked': 'Schedule ready',
        },
      },
      {
        name: 'auditverse',
        description: 'Visualize relationships and hierarchies in 3D graph space. Upload organizational data, process flows, or any connected data for interactive 3D exploration.',
        inputSchema: {
          type: 'object',
          properties: {
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string' },
                  type: { type: 'string' },
                  metadata: { type: 'object' },
                },
                required: ['id', 'label'],
              },
            },
            edges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  from: { type: 'string' },
                  to: { type: 'string' },
                  label: { type: 'string' },
                },
                required: ['from', 'to'],
              },
            },
          },
          required: ['nodes', 'edges'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/widget.html',
          'openai/toolInvocation/invoking': 'Building 3D universe…',
          'openai/toolInvocation/invoked': '3D visualization ready',
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'swimlanes':
      return {
        content: [
          {
            type: 'text',
            text: `Created swimlane diagram with ${args.lanes?.length || 0} lanes, ${args.nodes?.length || 0} nodes, and ${args.edges?.length || 0} connections.`,
          },
        ],
        structuredContent: {
          tool: 'swimlanes',
          spec: args,
        },
      };

    case 'needle_finder':
      return {
        content: [
          {
            type: 'text',
            text: `Found ${args.findings?.length || 0} anomalies in ${args.data?.length || 0} rows.`,
          },
        ],
        structuredContent: {
          tool: 'needle',
          result: {
            data: args.data,
            findings: args.findings,
          },
        },
      };

    case 'tickntie':
      return {
        content: [
          {
            type: 'text',
            text: `Created ${args.links?.length || 0} links between spreadsheet cells and ${args.documents?.length || 0} documents.`,
          },
        ],
        structuredContent: {
          tool: 'tickntie',
          workbook: args.workbook,
          links: args.links,
          documents: args.documents,
        },
      };

    case 'scheduler':
      return {
        content: [
          {
            type: 'text',
            text: `Created schedule for ${args.people?.length || 0} people across ${args.slots?.length || 0} time slots.`,
          },
        ],
        structuredContent: {
          tool: 'scheduler',
          people: args.people,
          slots: args.slots,
          assignments: args.assignments,
        },
      };

    case 'auditverse':
      return {
        content: [
          {
            type: 'text',
            text: `Created 3D visualization with ${args.nodes?.length || 0} nodes and ${args.edges?.length || 0} connections.`,
          },
        ],
        structuredContent: {
          tool: 'auditverse',
          graph: {
            nodes: args.nodes,
            edges: args.edges,
          },
        },
      };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start HTTP server with SSE transport
async function main() {
  const app = express();
  const PORT = process.env.PORT || 3001;

  // Store active transports by session ID
  const transports = new Map<string, SSEServerTransport>();

  // CORS
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'audittoolbox-mcp' });
  });

  // SSE endpoint for MCP
  app.get('/sse', async (req, res) => {
    console.error('New SSE connection');
    const transport = new SSEServerTransport('/messages', res);
    const sessionId = transport.sessionId;

    transports.set(sessionId, transport);

    // Clean up on disconnect
    res.on('close', () => {
      console.error(`SSE connection closed: ${sessionId}`);
      transports.delete(sessionId);
    });

    await server.connect(transport);
  });

  // Message endpoint - handle incoming messages from client
  app.post('/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);

    if (!transport) {
      console.error(`No transport found for session: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    // Let the transport handle the message
    res.sendStatus(202);
  });

  // Proxy all other requests to Next.js UI
  app.use('/', createProxyMiddleware({
    target: `http://localhost:${UI_PORT}`,
    changeOrigin: true,
    ws: true, // proxy websockets for HMR
  }));

  app.listen(PORT, () => {
    console.error(`AuditToolbox MCP server running on http://localhost:${PORT}`);
    console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
    console.error(`Widget URL: ${NGROK_URL}`);
    console.error(`Proxying UI from: http://localhost:${UI_PORT}`);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
