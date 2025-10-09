/**
 * Error types and codes for AuditToolbox MCP Server
 * Following JSON-RPC 2.0 error code conventions
 */

export enum AuditToolboxErrorCode {
  // Input errors (client fault) - 32001-32099
  VALIDATION_FAILED = -32001,
  TOOL_NOT_FOUND = -32002,
  PAYLOAD_TOO_LARGE = -32003,
  INVALID_TOOL_ARGS = -32004,

  // Rate limiting (client fault) - 32100-32199
  RATE_LIMIT_EXCEEDED = -32100,
  TOO_MANY_CONNECTIONS = -32101,

  // Server errors (server fault) - 32200-32299
  INTERNAL_ERROR = -32200,
  TOOL_EXECUTION_FAILED = -32201,
}

/**
 * Base error class for all AuditToolbox errors
 */
export class AuditToolboxError extends Error {
  constructor(
    public code: AuditToolboxErrorCode,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'AuditToolboxError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
    };
  }
}

/**
 * Validation error - thrown when input fails schema validation
 */
export class ValidationError extends AuditToolboxError {
  constructor(message: string, public issues: unknown[]) {
    super(AuditToolboxErrorCode.VALIDATION_FAILED, message, { issues });
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit error - thrown when client exceeds rate limits
 */
export class RateLimitError extends AuditToolboxError {
  constructor(retryAfter: number, type: 'connection' | 'invocation' = 'invocation') {
    super(
      type === 'connection'
        ? AuditToolboxErrorCode.TOO_MANY_CONNECTIONS
        : AuditToolboxErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Please try again in ${retryAfter}s.`,
      { retryAfter, type }
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Payload too large error - thrown when payload exceeds size limits
 */
export class PayloadTooLargeError extends AuditToolboxError {
  constructor(sizeMB: number, maxMB: number) {
    super(
      AuditToolboxErrorCode.PAYLOAD_TOO_LARGE,
      `Payload too large: ${sizeMB.toFixed(2)}MB (max ${maxMB}MB)`,
      { sizeMB, maxMB }
    );
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Tool not found error - thrown when unknown tool is requested
 */
export class ToolNotFoundError extends AuditToolboxError {
  constructor(toolName: string) {
    super(
      AuditToolboxErrorCode.TOOL_NOT_FOUND,
      `Unknown tool: ${toolName}`,
      { toolName }
    );
    this.name = 'ToolNotFoundError';
  }
}

/**
 * Tool execution error - thrown when tool fails during execution
 */
export class ToolExecutionError extends AuditToolboxError {
  constructor(toolName: string, originalError: Error) {
    super(
      AuditToolboxErrorCode.TOOL_EXECUTION_FAILED,
      `Tool execution failed: ${toolName}`,
      {
        toolName,
        error: originalError.message,
      }
    );
    this.name = 'ToolExecutionError';
  }
}

/**
 * Check if an error is a known AuditToolbox error
 */
export function isAuditToolboxError(error: unknown): error is AuditToolboxError {
  return error instanceof AuditToolboxError;
}
