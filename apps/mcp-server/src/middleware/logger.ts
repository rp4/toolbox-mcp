/**
 * Structured logging for AuditToolbox MCP Server
 * Privacy-preserving: Never logs user data
 */

import pino from 'pino';

/**
 * Configure pino logger with privacy protections
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Pretty print in development
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,

  // Redact sensitive fields (defense in depth - these should never appear anyway)
  redact: {
    paths: [
      // Tool arguments that contain user data
      'args.data',
      'args.workbook',
      'args.documents',
      'args.nodes',
      'args.edges',
      'args.lanes',
      'args.findings',
      'args.links',
      'args.people',
      'args.slots',
      'args.assignments',
      // Any base64 data URLs
      '*.dataUrl',
      '*.base64',
      // Session content
      'payload.*',
      'structuredContent.*',
    ],
    remove: true,
  },

  // Format level names
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

/**
 * Log tool invocation (metadata only, never user data)
 */
export function logToolInvocation(
  tool: string,
  sessionId: string,
  args: unknown
): void {
  const argsSize = JSON.stringify(args).length;
  const nodeCount = (args as any)?.nodes?.length;
  const dataRowCount = (args as any)?.data?.length;

  logger.info({
    event: 'tool_invoked',
    tool,
    sessionId,
    argsSizeBytes: argsSize,
    // Safe metadata (counts only)
    metadata: {
      nodeCount,
      dataRowCount,
    },
    timestamp: Date.now(),
  });
}

/**
 * Log validation failure (error types only, not actual data)
 */
export function logValidationError(
  tool: string,
  sessionId: string,
  issueCount: number
): void {
  logger.warn({
    event: 'validation_failed',
    tool,
    sessionId,
    issueCount,
    timestamp: Date.now(),
  });
}

/**
 * Log rate limit hit
 */
export function logRateLimit(
  type: 'sse' | 'tool',
  identifier: string
): void {
  logger.warn({
    event: 'rate_limit_hit',
    type,
    identifier,
    timestamp: Date.now(),
  });
}

/**
 * Log session lifecycle events
 */
export function logSessionEvent(
  event: 'session_created' | 'session_closed',
  sessionId: string,
  metadata?: { durationMs?: number }
): void {
  logger.info({
    event,
    sessionId,
    ...metadata,
    timestamp: Date.now(),
  });
}

/**
 * Log errors (never include user data)
 */
export function logError(
  event: string,
  error: Error,
  context?: Record<string, unknown>
): void {
  logger.error({
    event,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    ...context,
    timestamp: Date.now(),
  });
}
