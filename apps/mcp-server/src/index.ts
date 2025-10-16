#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import express from 'express';

// Production enhancements
import { validateToolInvocation } from './validation/index.js';
import { handleToolError } from './middleware/error-handler.js';
import { sseRateLimiter, toolRateLimiter, checkToolRateLimit } from './middleware/rate-limit.js';
import { logger, logToolInvocation, logSessionEvent } from './middleware/logger.js';
import { ToolNotFoundError } from './utils/errors.js';

// Prompts and Resources
import { prompts, getPromptContent } from './prompts/index.js';
import { resources, getResourceContent } from './resources/index.js';

// UI will be deployed to Vercel separately
const UI_URL = process.env.UI_URL || 'https://audittoolbox-ui.vercel.app';

// Session storage for MCP connections
interface Session {
  id: string;
  transport: SSEServerTransport;
  createdAt: number;
}
const sessions = new Map<string, Session>();

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
      prompts: {},
    },
  }
);

// Register resources (widget + documentation)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'ui://widget/widget.html',
        mimeType: 'text/html',
        name: 'AuditToolbox Widget',
        description: 'Interactive UI for all 5 audit tools',
      },
      ...resources,
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  // Widget HTML
  if (uri === 'ui://widget/widget.html') {
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
  <iframe src="${UI_URL}/" style="width:100%;height:100vh;border:none;position:absolute;top:0;left:0;"></iframe>
</body>
</html>`,
          _meta: {
            'openai/widgetDescription': 'AuditToolbox - 5 audit & analysis tools',
            'openai/widgetPrefersBorder': true,
            'openai/widgetCSP': {
              connect_domains: [UI_URL],
              resource_domains: [UI_URL],
            },
            'openai/widgetDomain': UI_URL,
          },
        },
      ],
    };
  }

  // Documentation resources
  try {
    const content = getResourceContent(uri);
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Unknown resource: ${uri}`);
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts,
  };
});

// Get prompt content
server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const content = getPromptContent(name, args as Record<string, string>);
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: content,
          },
        },
      ],
    };
  } catch (error) {
    throw new Error(`Unknown prompt: ${name}`);
  }
});

// Register all tools (including test tool)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'test_tool',
        description: '⚡ TEST TOOL - Use this to verify iframe integration. Displays any message in a beautiful formatted view. Perfect for testing that the ChatGPT iframe is working correctly.',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'The message to display in the test view',
            },
          },
          required: ['message'],
        },
        _meta: {
          'openai/outputTemplate': 'ui://widget/widget.html',
          'openai/toolInvocation/invoking': 'Displaying test message…',
          'openai/toolInvocation/invoked': 'Test message displayed',
        },
      },
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

// Handle tool calls with validation and error handling
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} as any } = request.params;

  // Get session ID from request context (if available)
  const sessionId = (request as any).sessionId || 'unknown';

  try {
    // Check rate limit
    checkToolRateLimit(sessionId);

    // Validate input
    const validated = validateToolInvocation(name, args);

    // Log invocation (metadata only, no user data)
    logToolInvocation(name, sessionId, validated);

    // Process tool
    switch (name) {
      case 'test_tool':
        return {
          content: [
            {
              type: 'text',
              text: `Test message: "${args.message}"`,
            },
          ],
          structuredContent: {
            tool: 'test',
            message: args.message,
          },
        };

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
            spec: validated,
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
              rows: (validated as any).data,
              summary: {},
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
            result: {
              xlsxDataUrl: '', // Will be populated by client
              links: (validated as any).links?.map((link: any) => ({
                cell: link.cellRef,
                file: link.documentId,
                page: link.pageNumber,
              })),
            },
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
            result: {
              xlsxDataUrl: '', // Will be populated by client
              table: [],
            },
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
            model: {
              nodes: (validated as any).nodes.map((n: any) => ({
                id: n.id,
                type: n.type || 'entity',
                label: n.label,
              })),
              edges: (validated as any).edges,
            },
          },
        };

      default:
        throw new ToolNotFoundError(name);
    }
  } catch (error) {
    // Handle all errors with proper formatting
    return handleToolError(error, name);
  }
});

// Start HTTP server with SSE transport
async function main() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3001', 10);

  // CORS - skip for SSE endpoint to avoid headers being sent early
  app.use((req, res, next) => {
    if (req.path === '/sse') {
      return next(); // Skip CORS for SSE
    }
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use((req, res, next) => {
    if (req.path === '/sse') {
      return next(); // Skip JSON parser for SSE
    }
    express.json()(req, res, next);
  });

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'audittoolbox-mcp' });
  });

  // SSE endpoint for MCP (with rate limiting)
  app.get('/sse', sseRateLimiter, async (req, res) => {
    logger.info({ event: 'sse_connection_attempt', ip: req.ip });

    try {
      // 1) Set headers FIRST to prevent compression/buffering
      //    Must be before transport.start() which calls res.writeHead()
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Connection', 'keep-alive');

      // 2) Create transport - use absolute URL for messages endpoint
      const transport = new SSEServerTransport('https://toolbox-mcp.fly.dev/messages', res);

      // 3) Store session and log creation
      const sessionStartTime = Date.now();
      sessions.set(transport.sessionId, {
        id: transport.sessionId,
        transport,
        createdAt: sessionStartTime
      });

      logSessionEvent('session_created', transport.sessionId);
      logger.info({ event: 'session_stored', sessionId: transport.sessionId, totalSessions: sessions.size });

      // 4) Connect MCP server to transport (calls transport.start() automatically)
      await server.connect(transport);

      // 5) Immediately send a comment to force a first chunk out,
      //    then keep-alive heartbeats every 15s.
      try {
        res.write(`: connected ${Date.now()}\n\n`);
        if (res.flushHeaders) res.flushHeaders(); // ensure bytes go out now
      } catch (e) {
        console.error('Initial heartbeat write failed:', e);
      }
      const heartbeat = setInterval(() => {
        try {
          res.write(`: hb ${Date.now()}\n\n`);
        } catch (err) {
          console.error('Heartbeat error:', err);
          clearInterval(heartbeat);
        }
      }, 15000);

      // 6) Clean up on disconnect
      req.on('close', () => {
        const durationMs = Date.now() - sessionStartTime;
        logger.info({ event: 'sse_connection_closed', sessionId: transport.sessionId, durationMs });

        clearInterval(heartbeat);
        sessions.delete(transport.sessionId);
        toolRateLimiter.removeSession(transport.sessionId);

        logSessionEvent('session_closed', transport.sessionId, { durationMs });
      });
    } catch (error) {
      console.error('SSE connection error:', error);
      if (!res.headersSent) {
        res.status(500).end('SSE connection failed');
      }
    }
  });

  // Message endpoint - handle incoming messages from client (JSON-RPC over HTTP)
  app.post('/messages', express.json(), async (req, res) => {
    const sessionId = req.query.sessionId as string;
    console.error(`POST /messages - sessionId: ${sessionId}`);
    console.error(`  Host: ${req.headers.host}, X-Forwarded-Host: ${req.headers['x-forwarded-host']}`);
    console.error(`  Active sessions: ${Array.from(sessions.keys()).join(', ')}`);
    const session = sessions.get(sessionId);

    if (!session) {
      console.error(`No session found for: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }

    try {
      // Let your SSEServerTransport handle the message and return a reply
      await session.transport.handlePostMessage(req, res, req.body);
      // handlePostMessage sends the response itself (202 or error)
    } catch (err: any) {
      console.error('handlePostMessage error', err);
      if (!res.headersSent) {
        return res.status(500).json({ error: 'handlePostMessage failed' });
      }
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    logger.info({
      event: 'server_started',
      port: PORT,
      host: '0.0.0.0',
      sseEndpoint: `http://0.0.0.0:${PORT}/sse`,
      widgetUrl: UI_URL,
      env: process.env.NODE_ENV || 'production',
    });
    console.error(`AuditToolbox MCP server running on http://0.0.0.0:${PORT}`);
    console.error(`SSE endpoint: http://0.0.0.0:${PORT}/sse`);
    console.error(`Widget URL: ${UI_URL}`);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
