/**
 * Input validation for AuditToolbox MCP Server
 * Validates tool arguments against Zod schemas
 */

import { z } from 'zod';
import { ValidationError, PayloadTooLargeError } from '../utils/errors.js';

// Import schemas from shared package
// Note: These are the schemas for the TOOL ARGUMENTS that come into MCP server
// They differ slightly from the output schemas sent to the iframe

// Test tool arguments
const TestArgsSchema = z.object({
  message: z.string().min(1, "Message required").max(5000, "Message too long"),
});

// Swimlanes tool arguments
const SwimlanesArgsSchema = z.object({
  lanes: z.array(
    z.object({
      id: z.string().min(1, "Lane ID required"),
      title: z.string().min(1, "Lane title required"),
    })
  ).min(1, "At least one lane required").max(100, "Too many lanes"), // Reasonable limits
  nodes: z.array(
    z.object({
      id: z.string().min(1, "Node ID required"),
      laneId: z.string().min(1, "Lane ID required"),
      label: z.string().min(1, "Node label required").max(500, "Label too long"),
    })
  ).min(1, "At least one node required").max(1000, "Too many nodes"),
  edges: z.array(
    z.object({
      from: z.string().min(1, "From node required"),
      to: z.string().min(1, "To node required"),
      label: z.string().max(500, "Label too long").optional(),
    })
  ).max(2000, "Too many edges"),
});

// Needle Finder tool arguments
const NeedleFinderArgsSchema = z.object({
  data: z.array(z.record(z.string(), z.unknown())).min(1, "At least one data row required").max(10000, "Too many data rows"),
  findings: z.array(
    z.object({
      rowIndex: z.number().int().min(0, "Row index must be non-negative"),
      field: z.string().min(1, "Field name required"),
      value: z.unknown(),
      reason: z.string().min(1, "Reason required").max(1000, "Reason too long"),
      severity: z.enum(['low', 'medium', 'high']),
    })
  ).max(1000, "Too many findings"),
});

// Tick'n'Tie tool arguments
const TicknTieArgsSchema = z.object({
  workbook: z.record(z.string(), z.unknown()), // SheetJS workbook format (flexible)
  links: z.array(
    z.object({
      cellRef: z.string().min(1, "Cell reference required").max(50, "Cell reference too long"), // e.g., "Sheet1!A1"
      documentId: z.string().min(1, "Document ID required"),
      pageNumber: z.number().int().min(1, "Page number must be positive").optional(),
      note: z.string().max(1000, "Note too long").optional(),
    })
  ).max(5000, "Too many links"),
  documents: z.array(
    z.object({
      id: z.string().min(1, "Document ID required"),
      name: z.string().min(1, "Document name required").max(500, "Name too long"),
      dataUrl: z.string().optional(),
    })
  ).max(100, "Too many documents"), // Limit number of documents
});

// Scheduler tool arguments
const SchedulerArgsSchema = z.object({
  people: z.array(
    z.object({
      id: z.string().min(1, "Person ID required"),
      name: z.string().min(1, "Person name required").max(200, "Name too long"),
    })
  ).min(1, "At least one person required").max(500, "Too many people"),
  slots: z.array(
    z.object({
      id: z.string().min(1, "Slot ID required"),
      start: z.string(), // ISO date-time string
      end: z.string(),   // ISO date-time string
    })
  ).min(1, "At least one slot required").max(5000, "Too many slots"),
  assignments: z.array(
    z.object({
      personId: z.string().min(1, "Person ID required"),
      slotId: z.string().min(1, "Slot ID required"),
    })
  ).max(10000, "Too many assignments"),
});

// AuditVerse tool arguments
const AuditVerseArgsSchema = z.object({
  nodes: z.array(
    z.object({
      id: z.string().min(1, "Node ID required"),
      label: z.string().min(1, "Node label required").max(500, "Label too long"),
      type: z.string().max(100, "Type too long").optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    })
  ).min(1, "At least one node required").max(5000, "Too many nodes"),
  edges: z.array(
    z.object({
      from: z.string().min(1, "From node required"),
      to: z.string().min(1, "To node required"),
      label: z.string().max(500, "Label too long").optional(),
    })
  ).max(10000, "Too many edges"),
});

// Map tool names to their schemas
const toolSchemas: Record<string, z.ZodSchema> = {
  test: TestArgsSchema,
  swimlanes: SwimlanesArgsSchema,
  needle_finder: NeedleFinderArgsSchema,
  tickntie: TicknTieArgsSchema,
  scheduler: SchedulerArgsSchema,
  auditverse: AuditVerseArgsSchema,
};

/**
 * Validate tool input arguments against schema
 */
export function validateToolInput(toolName: string, args: unknown): unknown {
  const schema = toolSchemas[toolName];

  if (!schema) {
    throw new ValidationError(`Unknown tool: ${toolName}`, [
      {
        path: ['tool'],
        message: `Tool '${toolName}' is not recognized`,
      },
    ]);
  }

  try {
    return schema.parse(args);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        `Input validation failed for tool '${toolName}'`,
        error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,
        }))
      );
    }
    throw error;
  }
}

/**
 * Validate payload size to prevent memory exhaustion
 */
export function validatePayloadSize(
  data: unknown,
  maxSizeMB: number = 10
): void {
  const sizeBytes = JSON.stringify(data).length;
  const sizeMB = sizeBytes / (1024 * 1024);

  if (sizeMB > maxSizeMB) {
    throw new PayloadTooLargeError(sizeMB, maxSizeMB);
  }
}

/**
 * Validate array length to prevent CPU/memory exhaustion
 */
export function validateArrayLength(
  arr: unknown[],
  maxLength: number = 10000,
  fieldName: string = 'array'
): void {
  if (arr.length > maxLength) {
    throw new ValidationError(
      `Array '${fieldName}' too large: ${arr.length} items (max ${maxLength})`,
      [
        {
          path: [fieldName],
          message: `Array exceeds maximum length of ${maxLength}`,
        },
      ]
    );
  }
}

/**
 * Combined validation - checks size, then schema
 */
export function validateToolInvocation(
  toolName: string,
  args: unknown
): unknown {
  // First check payload size (cheap check)
  validatePayloadSize(args);

  // Then validate schema (more expensive)
  return validateToolInput(toolName, args);
}
