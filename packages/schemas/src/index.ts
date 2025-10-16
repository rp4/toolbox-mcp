import { z } from 'zod'

// ============================================================================
// Common Types
// ============================================================================

export const ToolType = z.enum(['test', 'swimlanes', 'needle', 'tickntie', 'scheduler', 'auditverse'])
export type ToolType = z.infer<typeof ToolType>

export const UploadedFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mime: z.string(),
  size: z.number(),
  dataUrl: z.string().optional(),
})
export type UploadedFile = z.infer<typeof UploadedFileSchema>

export const StructuredContentBaseSchema = z.object({
  tool: ToolType,
})

// ============================================================================
// Test Tool Schemas
// ============================================================================

export const TestToolContentSchema = StructuredContentBaseSchema.extend({
  tool: z.literal('test'),
  message: z.string(),
})
export type TestToolContent = z.infer<typeof TestToolContentSchema>

// ============================================================================
// Swimlanes Schemas
// ============================================================================

export const SwimlaneLaneSchema = z.object({
  id: z.string(),
  title: z.string(),
})
export type SwimlaneLane = z.infer<typeof SwimlaneLaneSchema>

export const SwimlaneNodeSchema = z.object({
  id: z.string(),
  laneId: z.string(),
  label: z.string(),
})
export type SwimlaneNode = z.infer<typeof SwimlaneNodeSchema>

export const SwimlaneEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
})
export type SwimlaneEdge = z.infer<typeof SwimlaneEdgeSchema>

export const SwimlanesSpecSchema = z.object({
  lanes: z.array(SwimlaneLaneSchema),
  nodes: z.array(SwimlaneNodeSchema),
  edges: z.array(SwimlaneEdgeSchema),
})
export type SwimlanesSpec = z.infer<typeof SwimlanesSpecSchema>

export const SwimlanesContentSchema = StructuredContentBaseSchema.extend({
  tool: z.literal('swimlanes'),
  spec: SwimlanesSpecSchema,
})
export type SwimlanesContent = z.infer<typeof SwimlanesContentSchema>

// ============================================================================
// Needle Finder Schemas
// ============================================================================

export const NeedleCriterionSchema = z.object({
  field: z.string(),
  op: z.enum(['contains', 'eq', 'gt', 'lt', 'regex']),
  value: z.string(),
})
export type NeedleCriterion = z.infer<typeof NeedleCriterionSchema>

export const NeedleFinderResultSchema = z.object({
  rows: z.array(z.record(z.union([z.string(), z.number()]))),
  summary: z.record(z.number()).optional(),
})
export type NeedleFinderResult = z.infer<typeof NeedleFinderResultSchema>

export const NeedleContentSchema = StructuredContentBaseSchema.extend({
  tool: z.literal('needle'),
  result: NeedleFinderResultSchema,
})
export type NeedleContent = z.infer<typeof NeedleContentSchema>

// ============================================================================
// Tick'n'Tie Schemas
// ============================================================================

export const TickTieLinkSchema = z.object({
  cell: z.string(),
  file: z.string(),
  page: z.number().optional(),
  bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
})
export type TickTieLink = z.infer<typeof TickTieLinkSchema>

export const TickTieResultSchema = z.object({
  xlsxDataUrl: z.string(),
  links: z.array(TickTieLinkSchema).optional(),
})
export type TickTieResult = z.infer<typeof TickTieResultSchema>

export const TickTieContentSchema = StructuredContentBaseSchema.extend({
  tool: z.literal('tickntie'),
  result: TickTieResultSchema,
})
export type TickTieContent = z.infer<typeof TickTieContentSchema>

// ============================================================================
// Scheduler Schemas
// ============================================================================

export const SchedulerResultSchema = z.object({
  xlsxDataUrl: z.string().optional(),
  table: z.array(z.record(z.string())).optional(),
})
export type SchedulerResult = z.infer<typeof SchedulerResultSchema>

export const SchedulerContentSchema = StructuredContentBaseSchema.extend({
  tool: z.literal('scheduler'),
  result: SchedulerResultSchema,
})
export type SchedulerContent = z.infer<typeof SchedulerContentSchema>

// ============================================================================
// AuditUniverse Schemas
// ============================================================================

export const AuditNodeTypeSchema = z.enum(['entity', 'risk', 'control'])
export type AuditNodeType = z.infer<typeof AuditNodeTypeSchema>

export const AuditNodeSchema = z.object({
  id: z.string(),
  type: AuditNodeTypeSchema,
  label: z.string(),
  size: z.number().optional(),
})
export type AuditNode = z.infer<typeof AuditNodeSchema>

export const AuditEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  weight: z.number().optional(),
})
export type AuditEdge = z.infer<typeof AuditEdgeSchema>

export const AuditVerseModelSchema = z.object({
  nodes: z.array(AuditNodeSchema),
  edges: z.array(AuditEdgeSchema),
  layout: z.enum(['force', 'grid', 'sphere']).optional(),
})
export type AuditVerseModel = z.infer<typeof AuditVerseModelSchema>

export const AuditVerseContentSchema = StructuredContentBaseSchema.extend({
  tool: z.literal('auditverse'),
  model: AuditVerseModelSchema,
})
export type AuditVerseContent = z.infer<typeof AuditVerseContentSchema>

// ============================================================================
// Union Type for All Content
// ============================================================================

export const StructuredContentSchema = z.discriminatedUnion('tool', [
  TestToolContentSchema,
  SwimlanesContentSchema,
  NeedleContentSchema,
  TickTieContentSchema,
  SchedulerContentSchema,
  AuditVerseContentSchema,
])
export type StructuredContent = z.infer<typeof StructuredContentSchema>

// ============================================================================
// Tool Output Schema (from window.openai)
// ============================================================================

export const ToolOutputSchema = z.object({
  structuredContent: StructuredContentSchema,
})
export type ToolOutput = z.infer<typeof ToolOutputSchema>

// ============================================================================
// Export Actions
// ============================================================================

export * from './actions'
