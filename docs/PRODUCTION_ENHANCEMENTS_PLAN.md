# Production Enhancements Plan

**Status:** Planning Complete - Ready for Implementation
**Date:** 2025-10-08
**Priority:** High

## Overview

This document outlines the plan to enhance the AuditToolbox MCP server to production-grade quality by adding:
1. LLM instructions/prompts (to guide ChatGPT)
2. Input validation (schema validation on tool arguments)
3. Rate limiting (to prevent abuse)
4. Error handling (graceful failures)

## Background

After security research and architecture review, we determined that:
- ✅ **Authentication is NOT required** - ChatGPT handles auth, our server is stateless
- ✅ **Privacy is preserved** - No data persistence, client-side processing only
- ❌ **Missing production features** - Validation, error handling, LLM guidance

Data flow: `User → ChatGPT → MCP Server → Vercel (iframe) → User's Browser`

---

## 1. LLM Instructions/Prompts System

### Objective
Guide ChatGPT on **when** and **how** to use each of the 5 tools effectively.

### MCP Prompts (Reusable Templates)

MCP Prompts are predefined instruction templates that:
- Standardize how ChatGPT uses tools
- Provide context-aware guidance
- Can be explicitly invoked by users
- Support arguments for customization

#### Prompts to Implement

**1. `swimlanes_guide`**
```typescript
{
  name: "swimlanes_guide",
  description: "Guide for creating process flow diagrams with swim lanes",
  arguments: [
    {
      name: "processType",
      required: false,
      description: "Type: sequential, parallel, decision-tree, or cross-functional"
    }
  ]
}
```

**Content:**
- When to use swimlanes vs other visualization tools
- How to structure lanes (by role, department, system)
- Best practices for node and edge creation
- Example process flows (approval workflow, data pipeline, etc.)

**2. `needle_finder_guide`**
```typescript
{
  name: "needle_finder_guide",
  description: "Guide for detecting anomalies and outliers in tabular data",
  arguments: [
    {
      name: "dataType",
      required: false,
      description: "Type: financial, logs, transactions, or time-series"
    }
  ]
}
```

**Content:**
- How to analyze data for different anomaly types
- When to flag severity levels (low/medium/high)
- Common patterns: duplicates, outliers, missing values, format inconsistencies
- Example anomaly detection strategies

**3. `tickntie_guide`**
```typescript
{
  name: "tickntie_guide",
  description: "Guide for linking supporting documents to spreadsheet cells",
  arguments: [
    {
      name: "auditType",
      required: false,
      description: "Type: financial-audit, compliance, inventory, or general"
    }
  ]
}
```

**Content:**
- How to create audit trails between data and documents
- Best practices for cell reference notation
- When to include page numbers and notes
- Example audit scenarios

**4. `scheduler_guide`**
```typescript
{
  name: "scheduler_guide",
  description: "Guide for creating team schedules with constraints",
  arguments: [
    {
      name: "scheduleType",
      required: false,
      description: "Type: shifts, meetings, rotations, or project-timeline"
    }
  ]
}
```

**Content:**
- How to handle availability constraints
- Balancing workload across team members
- Handling time zones and working hours
- Example scheduling scenarios

**5. `auditverse_guide`**
```typescript
{
  name: "auditverse_guide",
  description: "Guide for 3D visualization of relationships and hierarchies",
  arguments: [
    {
      name: "graphType",
      required: false,
      description: "Type: organizational, network, dependency, or knowledge-graph"
    }
  ]
}
```

**Content:**
- When 3D visualization is more effective than 2D
- How to structure nodes and edges for clarity
- Best practices for node types and metadata
- Example graph structures

---

### MCP Resources (Static Documentation)

MCP Resources expose contextual data that ChatGPT can reference without side effects.

#### Resources to Implement

**1. Tool Selection Decision Tree**
```typescript
{
  uri: "docs://tool-selection",
  name: "Tool Selection Guide",
  description: "Decision tree for choosing the right tool",
  mimeType: "text/markdown"
}
```

**Content:**
```markdown
# Tool Selection Guide

## Decision Tree

1. **Is it tabular data with potential issues?**
   → Use **Needle Finder**

2. **Is it a process or workflow?**
   → Use **Swimlanes**

3. **Need to link documents to spreadsheet values?**
   → Use **Tick'n'Tie**

4. **Need to schedule people/resources over time?**
   → Use **Scheduler**

5. **Is it hierarchical or network data?**
   → Use **AuditUniverse**
```

**2. Input Format Specifications**
```typescript
{
  uri: "docs://formats",
  name: "Input Format Specifications",
  description: "Expected input formats for each tool",
  mimeType: "text/markdown"
}
```

**3. Example Payloads**
```typescript
{
  uri: "docs://examples",
  name: "Example Payloads",
  description: "Sample structured content for each tool",
  mimeType: "application/json"
}
```

**4. Common Pitfalls**
```typescript
{
  uri: "docs://troubleshooting",
  name: "Troubleshooting Guide",
  description: "Common issues and solutions",
  mimeType: "text/markdown"
}
```

---

## 2. Input Validation (Zod Schema Integration)

### Current State
- ✅ Zod schemas exist in `/packages/schemas`
- ❌ MCP server doesn't validate tool arguments before processing

### Implementation Strategy

#### Create Validation Middleware

**File: `/apps/mcp-server/src/validation/index.ts`**

```typescript
import { z } from 'zod';
import {
  SwimlanesContentSchema,
  NeedleContentSchema,
  TickTieContentSchema,
  SchedulerContentSchema,
  AuditVerseContentSchema,
} from '@audittoolbox/schemas';

export class ValidationError extends Error {
  constructor(
    message: string,
    public issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

const toolSchemas = {
  swimlanes: SwimlanesContentSchema,
  needle_finder: NeedleContentSchema,
  tickntie: TickTieContentSchema,
  scheduler: SchedulerContentSchema,
  auditverse: AuditVerseContentSchema,
};

export function validateToolInput(toolName: string, args: unknown) {
  const schema = toolSchemas[toolName];

  if (!schema) {
    throw new ValidationError(`Unknown tool: ${toolName}`, []);
  }

  try {
    return schema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Input validation failed', error.issues);
    }
    throw error;
  }
}

// Additional safety checks
export function validatePayloadSize(data: unknown, maxSizeMB = 10): void {
  const sizeBytes = JSON.stringify(data).length;
  const sizeMB = sizeBytes / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    throw new ValidationError(
      `Payload too large: ${sizeMB.toFixed(2)}MB (max ${maxSizeMB}MB)`,
      []
    );
  }
}

export function validateArrayLength(arr: unknown[], maxLength = 10000): void {
  if (arr.length > maxLength) {
    throw new ValidationError(
      `Array too large: ${arr.length} items (max ${maxLength})`,
      []
    );
  }
}
```

#### Integration into Tool Handlers

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    // Validate payload size first (prevent DoS)
    validatePayloadSize(args);

    // Validate tool-specific schema
    const validated = validateToolInput(name, args);

    // Process with validated input
    return handleToolInvocation(name, validated);

  } catch (error) {
    return handleToolError(error);
  }
});
```

### Validation Rules

1. **Required fields** - All required properties must be present
2. **Type checking** - String, number, array, object types must match
3. **Array bounds** - Prevent memory exhaustion (max 10k items)
4. **Payload size** - Limit to 10MB JSON size
5. **String lengths** - Reasonable limits on text fields
6. **Enum values** - Validate against allowed values (e.g., severity levels)

---

## 3. Rate Limiting

### Strategy

Since the MCP server is **stateless and ephemeral**, rate limiting serves to:
1. Prevent abuse of SSE connections
2. Limit tool invocations per session
3. Prevent memory exhaustion from large payloads

### Implementation

**File: `/apps/mcp-server/src/middleware/rate-limit.ts`**

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// SSE connection rate limiter (per IP)
export const sseRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 SSE connections per IP
  message: { error: 'Too many connections, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Tool invocation rate limiter (in-memory, per session)
class SessionRateLimiter {
  private sessions = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private maxPerMinute = 30,
    private maxPerSession = 100
  ) {}

  check(sessionId: string): boolean {
    const now = Date.now();
    let session = this.sessions.get(sessionId);

    if (!session || now > session.resetAt) {
      session = { count: 0, resetAt: now + 60000 };
      this.sessions.set(sessionId, session);
    }

    if (session.count >= this.maxPerMinute) {
      return false;
    }

    session.count++;
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now > session.resetAt) {
        this.sessions.delete(id);
      }
    }
  }
}

export const toolRateLimiter = new SessionRateLimiter(30, 100);

// Cleanup expired sessions every 5 minutes
setInterval(() => toolRateLimiter.cleanup(), 5 * 60 * 1000);
```

### Rate Limit Configuration

| Limit Type | Window | Max | Purpose |
|------------|--------|-----|---------|
| SSE Connections | 15 min | 10 per IP | Prevent connection flooding |
| Tool Invocations | 1 min | 30 per session | Prevent rapid-fire abuse |
| Payload Size | - | 10 MB | Prevent memory exhaustion |
| Array Length | - | 10k items | Prevent CPU exhaustion |

---

## 4. Error Handling

### Current State
- Basic `throw new Error()` with generic messages
- No structured error codes
- No JSON-RPC compliance

### Error Type Taxonomy

**File: `/apps/mcp-server/src/utils/errors.ts`**

```typescript
export enum AuditToolboxErrorCode {
  // Input errors (client fault)
  VALIDATION_FAILED = -32001,
  TOOL_NOT_FOUND = -32002,
  PAYLOAD_TOO_LARGE = -32003,

  // Rate limiting (client fault)
  RATE_LIMIT_EXCEEDED = -32004,

  // Server errors (server fault)
  INTERNAL_ERROR = -32005,
  TOOL_EXECUTION_FAILED = -32006,
}

export class AuditToolboxError extends Error {
  constructor(
    public code: AuditToolboxErrorCode,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'AuditToolboxError';
  }
}

export class ValidationError extends AuditToolboxError {
  constructor(message: string, public issues: unknown[]) {
    super(AuditToolboxErrorCode.VALIDATION_FAILED, message, { issues });
  }
}

export class RateLimitError extends AuditToolboxError {
  constructor(retryAfter: number) {
    super(
      AuditToolboxErrorCode.RATE_LIMIT_EXCEEDED,
      'Rate limit exceeded',
      { retryAfter }
    );
  }
}

export class PayloadTooLargeError extends AuditToolboxError {
  constructor(sizeMB: number, maxMB: number) {
    super(
      AuditToolboxErrorCode.PAYLOAD_TOO_LARGE,
      `Payload too large: ${sizeMB.toFixed(2)}MB (max ${maxMB}MB)`,
      { sizeMB, maxMB }
    );
  }
}
```

### Error Handler Middleware

**File: `/apps/mcp-server/src/middleware/error-handler.ts`**

```typescript
import { AuditToolboxError, AuditToolboxErrorCode } from '../utils/errors';
import { logger } from './logger';

export function handleToolError(error: unknown) {
  // Known application errors
  if (error instanceof AuditToolboxError) {
    logger.warn({
      event: 'tool_error',
      code: error.code,
      message: error.message,
      data: error.data,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
      _meta: {
        errorCode: error.code,
        errorData: error.data,
      },
    };
  }

  // Unexpected errors (log but don't expose details)
  logger.error({
    event: 'unexpected_error',
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    content: [
      {
        type: 'text',
        text: 'An unexpected error occurred. Please try again.',
      },
    ],
    isError: true,
    _meta: {
      errorCode: AuditToolboxErrorCode.INTERNAL_ERROR,
      timestamp: Date.now(),
    },
  };
}
```

### Error Response Format (JSON-RPC 2.0 compliant)

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error: Input validation failed"
    }
  ],
  "isError": true,
  "_meta": {
    "errorCode": -32001,
    "errorData": {
      "issues": [
        {
          "path": ["lanes"],
          "message": "Required"
        }
      ]
    }
  }
}
```

---

## 5. Structured Logging

### Objective
Add observability without compromising privacy (never log user data).

**File: `/apps/mcp-server/src/middleware/logger.ts`**

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Redact any sensitive fields (defense in depth)
  redact: {
    paths: [
      'args.data',
      'args.workbook',
      'args.documents',
      'args.nodes',
      'args.edges',
      '*.dataUrl',
    ],
    remove: true,
  },

  formatters: {
    level(label) {
      return { level: label };
    },
  },
});

// Log tool invocations (metadata only)
export function logToolInvocation(
  tool: string,
  sessionId: string,
  args: unknown
) {
  const argsSize = JSON.stringify(args).length;

  logger.info({
    event: 'tool_invoked',
    tool,
    sessionId,
    argsSizeBytes: argsSize,
    timestamp: Date.now(),
  });
}

// Log validation failures (types only, not data)
export function logValidationError(
  tool: string,
  issues: unknown[]
) {
  logger.warn({
    event: 'validation_failed',
    tool,
    issueCount: issues.length,
    timestamp: Date.now(),
  });
}

// Log rate limit hits
export function logRateLimit(
  type: 'sse' | 'tool',
  identifier: string
) {
  logger.warn({
    event: 'rate_limit_hit',
    type,
    identifier,
    timestamp: Date.now(),
  });
}
```

### What to Log

| Category | What to Log | What NOT to Log |
|----------|-------------|-----------------|
| Tool Invocations | ✅ Tool name, timestamp, arg size | ❌ Actual user data |
| Validation | ✅ Error types, field paths | ❌ Field values |
| Rate Limits | ✅ IP/session ID, limit type | ❌ User identity |
| Errors | ✅ Error codes, stack traces | ❌ Sensitive data in errors |
| Sessions | ✅ Connection/disconnect events | ❌ Session content |

---

## File Structure

```
/apps/mcp-server/src/
  index.ts                      # Main server (update)

  /prompts/                     # NEW
    index.ts                    # Prompt handler
    swimlanes-guide.md          # Swimlanes guidance
    needle-finder-guide.md      # Needle Finder guidance
    tickntie-guide.md           # Tick'n'Tie guidance
    scheduler-guide.md          # Scheduler guidance
    auditverse-guide.md         # AuditUniverse guidance

  /resources/                   # NEW
    index.ts                    # Resource handler
    tool-selection.md           # Decision tree
    formats.md                  # Input formats
    examples.json               # Example payloads
    troubleshooting.md          # Common issues

  /validation/                  # NEW
    index.ts                    # Validation middleware
    schemas.ts                  # Schema imports

  /middleware/                  # NEW
    rate-limit.ts               # Rate limiting
    error-handler.ts            # Error handling
    logger.ts                   # Structured logging

  /utils/                       # NEW
    errors.ts                   # Error classes
```

---

## Implementation Order (Priority)

### Phase 1: Foundation (High Priority)
1. ✅ **Error handling** - Prevents crashes, improves debugging
2. ✅ **Input validation** - Prevents bad data from crashing tools
3. ✅ **Structured logging** - Enables monitoring and debugging

### Phase 2: Guidance (Medium Priority)
4. ✅ **MCP Prompts** - Improves ChatGPT's tool usage
5. ✅ **MCP Resources** - Provides reference documentation

### Phase 3: Protection (Low Priority)
6. ✅ **Rate limiting** - Prevents abuse (less critical for stateless server)

---

## Testing Strategy

### Unit Tests
```typescript
describe('Validation', () => {
  it('should validate swimlanes input', () => {
    const valid = { lanes: [...], nodes: [...], edges: [...] };
    expect(() => validateToolInput('swimlanes', valid)).not.toThrow();
  });

  it('should reject missing required fields', () => {
    const invalid = { lanes: [] }; // missing nodes, edges
    expect(() => validateToolInput('swimlanes', invalid)).toThrow(ValidationError);
  });

  it('should reject payloads over size limit', () => {
    const huge = { data: 'x'.repeat(20 * 1024 * 1024) }; // 20MB
    expect(() => validatePayloadSize(huge)).toThrow(PayloadTooLargeError);
  });
});

describe('Rate Limiting', () => {
  it('should allow requests within limit', () => {
    const limiter = new SessionRateLimiter(5, 10);
    for (let i = 0; i < 5; i++) {
      expect(limiter.check('session1')).toBe(true);
    }
  });

  it('should block requests over limit', () => {
    const limiter = new SessionRateLimiter(5, 10);
    for (let i = 0; i < 5; i++) {
      limiter.check('session1');
    }
    expect(limiter.check('session1')).toBe(false);
  });
});
```

### Integration Tests
```bash
# Test tool invocation with invalid data
curl -X POST http://localhost:3001/messages \
  -H "Content-Type: application/json" \
  -d '{"tool": "swimlanes", "args": {}}'
# Should return validation error

# Test rate limiting
for i in {1..50}; do
  curl http://localhost:3001/sse &
done
# Should start rejecting after 10 connections
```

### Manual Tests with ChatGPT
1. Ask ChatGPT to create a swimlane diagram
2. Verify prompts guide it to ask for process type
3. Try to trigger validation errors with bad data
4. Verify error messages are helpful in ChatGPT UI

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Validation Coverage | 100% | All tool inputs validated |
| Error Clarity | >80% | User-friendly error messages |
| ChatGPT Accuracy | >90% | Correct tool selection |
| Server Uptime | 99.9% | No crashes from bad input |
| Response Time | <500ms | p95 latency |

---

## Dependencies

```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "express-rate-limit": "^7.1.5",
    "pino": "^8.17.2",
    "pino-pretty": "^10.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "vitest": "^1.1.0"
  }
}
```

---

## Rollout Plan

### Week 1: Foundation
- [ ] Set up error handling system
- [ ] Implement validation middleware
- [ ] Add structured logging
- [ ] Write unit tests

### Week 2: Guidance
- [ ] Create MCP prompts for all 5 tools
- [ ] Create MCP resources (docs, examples)
- [ ] Test with ChatGPT Developer Mode

### Week 3: Polish
- [ ] Add rate limiting
- [ ] Performance testing
- [ ] Documentation updates
- [ ] Deploy to production

---

## Documentation Updates Required

1. **README.md** - Add section on error handling and validation
2. **SECURITY.md** - Document rate limits and payload restrictions
3. **API.md** (new) - Document error codes and formats
4. **CLAUDE.md** - Update with new prompts/resources info

---

## Future Enhancements (Out of Scope)

- Metrics/monitoring dashboard (Grafana, Prometheus)
- Distributed tracing (OpenTelemetry)
- Advanced rate limiting (Redis-backed)
- Circuit breaker pattern for tool failures
- A/B testing for prompt effectiveness

---

## References

- [MCP Specification - Prompts](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts)
- [MCP Best Practices Guide](https://workos.com/blog/mcp-features-guide)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Zod Documentation](https://zod.dev)
- [Pino Logger Documentation](https://getpino.io)

---

**Next Steps:** Begin implementation with Phase 1 (Error Handling + Validation + Logging)
