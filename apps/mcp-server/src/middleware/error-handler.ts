/**
 * Error handling middleware for AuditToolbox MCP Server
 * Converts errors to JSON-RPC 2.0 compatible responses
 */

import {
  AuditToolboxError,
  AuditToolboxErrorCode,
  isAuditToolboxError,
} from '../utils/errors.js';
import { logger, logError } from './logger.js';

/**
 * MCP Tool Response format
 */
interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

/**
 * Handle tool errors and convert to user-friendly responses
 */
export function handleToolError(error: unknown, toolName?: string): ToolResponse {
  // Known application errors
  if (isAuditToolboxError(error)) {
    const auditError = error as AuditToolboxError;

    // Log with appropriate level
    if (auditError.code < -32100) {
      // Client errors (validation, not found, etc.) - warning level
      logger.warn({
        event: 'tool_error',
        tool: toolName,
        code: auditError.code,
        message: auditError.message,
      });
    } else {
      // Server errors - error level
      logError('tool_error', auditError, { tool: toolName });
    }

    return {
      content: [
        {
          type: 'text',
          text: formatErrorMessage(auditError),
        },
      ],
      isError: true,
      _meta: {
        errorCode: auditError.code,
        errorData: auditError.data,
      },
    };
  }

  // Unexpected errors (don't expose internals to user)
  const unexpectedError = error instanceof Error ? error : new Error(String(error));

  logError('unexpected_error', unexpectedError, {
    tool: toolName,
  });

  return {
    content: [
      {
        type: 'text',
        text: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
      },
    ],
    isError: true,
    _meta: {
      errorCode: AuditToolboxErrorCode.INTERNAL_ERROR,
      timestamp: Date.now(),
    },
  };
}

/**
 * Format error message for display to user
 */
function formatErrorMessage(error: AuditToolboxError): string {
  switch (error.code) {
    case AuditToolboxErrorCode.VALIDATION_FAILED: {
      const issues = (error.data as any)?.issues || [];
      if (issues.length === 0) {
        return `Validation failed: ${error.message}`;
      }

      const issueList = issues
        .slice(0, 5) // Show max 5 issues
        .map((issue: any) => {
          const path = issue.path?.join('.') || 'unknown';
          return `  • ${path}: ${issue.message}`;
        })
        .join('\n');

      const remaining = issues.length > 5 ? `\n  ... and ${issues.length - 5} more issues` : '';

      return `Input validation failed:\n${issueList}${remaining}`;
    }

    case AuditToolboxErrorCode.TOOL_NOT_FOUND:
      return `Unknown tool: ${(error.data as any)?.toolName}. Available tools: swimlanes, needle_finder, tickntie, scheduler, auditverse`;

    case AuditToolboxErrorCode.PAYLOAD_TOO_LARGE: {
      const { sizeMB, maxMB } = error.data as any;
      return `Payload too large (${sizeMB?.toFixed(2)}MB). Maximum allowed: ${maxMB}MB. Please reduce the amount of data.`;
    }

    case AuditToolboxErrorCode.RATE_LIMIT_EXCEEDED: {
      const { retryAfter } = error.data as any;
      return `Rate limit exceeded. Please wait ${retryAfter || 60} seconds before trying again.`;
    }

    case AuditToolboxErrorCode.TOO_MANY_CONNECTIONS:
      return 'Too many active connections. Please close some connections and try again.';

    case AuditToolboxErrorCode.TOOL_EXECUTION_FAILED:
      return `Tool execution failed: ${error.message}. Please check your input and try again.`;

    case AuditToolboxErrorCode.INTERNAL_ERROR:
    default:
      return 'An internal error occurred. Please try again.';
  }
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  toolName?: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      return handleToolError(error, toolName);
    }
  }) as T;
}
