import { z } from 'zod'

// ============================================================================
// Action Response Types
// ============================================================================

export const ActionSuccessSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  message: z.string().optional(),
})
export type ActionSuccess = z.infer<typeof ActionSuccessSchema>

export const ActionErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
})
export type ActionError = z.infer<typeof ActionErrorSchema>

export const ActionResponseSchema = z.union([ActionSuccessSchema, ActionErrorSchema])
export type ActionResponse = z.infer<typeof ActionResponseSchema>

// ============================================================================
// AuditUniverse Action Schemas
// ============================================================================

export const AuditVerseFilterParamsSchema = z.object({
  nodeTypes: z.array(z.enum(['entity', 'risk', 'control'])).optional(),
  nodeIds: z.array(z.string()).optional(),
  minSize: z.number().optional(),
  maxSize: z.number().optional(),
})
export type AuditVerseFilterParams = z.infer<typeof AuditVerseFilterParamsSchema>

export const AuditVerseExportFormatSchema = z.enum(['json', 'csv'])
export type AuditVerseExportFormat = z.infer<typeof AuditVerseExportFormatSchema>

export const AuditVerseDownloadParamsSchema = z.object({
  format: AuditVerseExportFormatSchema,
  filters: AuditVerseFilterParamsSchema.optional(),
})
export type AuditVerseDownloadParams = z.infer<typeof AuditVerseDownloadParamsSchema>

// ============================================================================
// Swimlanes Action Schemas
// ============================================================================

export const SwimlanesExportFormatSchema = z.enum(['png', 'svg', 'json'])
export type SwimlanesExportFormat = z.infer<typeof SwimlanesExportFormatSchema>

export const SwimlanesDownloadParamsSchema = z.object({
  format: SwimlanesExportFormatSchema,
  laneId: z.string().optional(),
})
export type SwimlanesDownloadParams = z.infer<typeof SwimlanesDownloadParamsSchema>

// ============================================================================
// Needle Finder Action Schemas
// ============================================================================

export const NeedleFilterParamsSchema = z.object({
  columns: z.array(z.string()).optional(),
  searchTerm: z.string().optional(),
  limit: z.number().optional(),
})
export type NeedleFilterParams = z.infer<typeof NeedleFilterParamsSchema>

export const NeedleExportFormatSchema = z.enum(['csv', 'json'])
export type NeedleExportFormat = z.infer<typeof NeedleExportFormatSchema>

export const NeedleDownloadParamsSchema = z.object({
  format: NeedleExportFormatSchema,
  filters: NeedleFilterParamsSchema.optional(),
})
export type NeedleDownloadParams = z.infer<typeof NeedleDownloadParamsSchema>

// ============================================================================
// Tick'n'Tie Action Schemas
// ============================================================================

export const TickTieExportFormatSchema = z.enum(['xlsx', 'json'])
export type TickTieExportFormat = z.infer<typeof TickTieExportFormatSchema>

export const TickTieDownloadParamsSchema = z.object({
  format: TickTieExportFormatSchema,
  includeLinks: z.boolean().optional(),
})
export type TickTieDownloadParams = z.infer<typeof TickTieDownloadParamsSchema>

// ============================================================================
// Scheduler Action Schemas
// ============================================================================

export const SchedulerExportFormatSchema = z.enum(['xlsx', 'csv', 'json'])
export type SchedulerExportFormat = z.infer<typeof SchedulerExportFormatSchema>

export const SchedulerFilterParamsSchema = z.object({
  columns: z.array(z.string()).optional(),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }).optional(),
})
export type SchedulerFilterParams = z.infer<typeof SchedulerFilterParamsSchema>

export const SchedulerDownloadParamsSchema = z.object({
  format: SchedulerExportFormatSchema,
  filters: SchedulerFilterParamsSchema.optional(),
})
export type SchedulerDownloadParams = z.infer<typeof SchedulerDownloadParamsSchema>

// ============================================================================
// Tool Actions Interface
// ============================================================================

export interface ToolActions {
  // Download data from the current view
  downloadData: (params: any) => Promise<ActionResponse>
}

// Helper function to create success responses
export function createSuccessResponse(data?: any, message?: string): ActionSuccess {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message }),
  }
}

// Helper function to create error responses
export function createErrorResponse(error: string, code?: string): ActionError {
  return {
    success: false,
    error,
    ...(code && { code }),
  }
}
