import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  version: z.number().int().min(1).default(1),
  createdBy: z.string().uuid().optional(),
});

export const ProjectEntitySchema = BaseEntitySchema.extend({
  studioId: z.string().uuid(),
  projectId: z.string().uuid(),
});

export const ProvenanceSchema = z.object({
  type: z.enum(['human', 'ai', 'system', 'migrated']),
  providerId: z.string().optional(),
  modelId: z.string().optional(),
  confidence: z.number().optional(),
});

// ============================================================================
// CORE ENTITIES
// ============================================================================

export const UserProfileSchema = BaseEntitySchema.extend({
  displayName: z.string().min(1),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
});

export const StudioSchema = BaseEntitySchema.extend({
  name: z.string().min(1),
  plan: z.enum(['free', 'pro', 'enterprise']).default('free'),
});

export const StudioRoleSchema = z.enum(['owner', 'admin', 'creator', 'reviewer']);

export const StudioMembershipSchema = BaseEntitySchema.extend({
  studioId: z.string().uuid(),
  userId: z.string().uuid(),
  role: StudioRoleSchema,
});

// ============================================================================
// PROJECT
// ============================================================================

export const ProjectStatusSchema = z.enum([
  'draft', 'concept', 'development', 'pre-production', 'production', 'post-production', 'archived'
]);

export const ProjectSchema = BaseEntitySchema.extend({
  studioId: z.string().uuid(),
  slug: z.string(),
  title: z.string().min(1),
  status: ProjectStatusSchema,
  format: z.enum(['feature', 'short', 'documentary', 'series', 'animation']),
  genre: z.enum(['historical', 'epic', 'drama', 'thriller', 'documentary', 'fantasy', 'scifi', 'comedy']),
  coverImageUrl: z.string().optional(),
  isFavorite: z.boolean().default(false),
  completionPercent: z.number().min(0).max(100).default(0),
  isDemo: z.boolean().optional(),
});

export const ProjectCanonSchema = z.object({
  logline: z.string().default(""),
  synopsis: z.object({
    short: z.string().default(""),
    long: z.string().default(""),
    beginning: z.string().default(""),
    development: z.string().default(""),
    resolution: z.string().default(""),
  }).optional(),
});

export const ProjectContextSnapshotSchema = ProjectEntitySchema.extend({
  canon: ProjectCanonSchema,
  decisions: z.array(z.string().uuid()),
  hypotheses: z.array(z.string().uuid()),
  openQuestions: z.array(z.string().uuid()),
  referenceAssetIds: z.array(z.string().uuid()),
  snapshotLabel: z.string(),
});

// ============================================================================
// CREATIVE TRACEABILITY (DECISIONS, HYPOTHESES)
// ============================================================================

export const TraceItemBaseSchema = ProjectEntitySchema.extend({
  content: z.string(),
  provenance: ProvenanceSchema,
});

export const DecisionSchema = TraceItemBaseSchema.extend({
  status: z.literal('decision'),
  context: z.string().optional(),
});

export const HypothesisSchema = TraceItemBaseSchema.extend({
  status: z.literal('hypothesis'),
  toValidate: z.string().optional(),
});

export const OpenQuestionSchema = TraceItemBaseSchema.extend({
  status: z.literal('open-question'),
  priority: z.enum(['low', 'medium', 'high']),
});

export const TraceItemSchema = z.discriminatedUnion('status', [
  DecisionSchema, HypothesisSchema, OpenQuestionSchema
]);

// ============================================================================
// WRITING / CONVERSATION
// ============================================================================

export const WritingTargetSchema = z.enum(['vision', 'logline', 'synopsis', 'treatment', 'characters', 'script', 'general']);

export const ConversationSchema = ProjectEntitySchema.extend({
  title: z.string(),
  status: z.enum(['active', 'archived']),
});

export const MessageSchema = ProjectEntitySchema.extend({
  conversationId: z.string().uuid(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  provenance: ProvenanceSchema,
});

export const WritingMissionSchema = ProjectEntitySchema.extend({
  title: z.string(),
  target: WritingTargetSchema,
  contextSnapshot: z.string(), // Description of the context provided
  status: z.enum(['active', 'completed', 'cancelled']),
});

export const AIProposalSchema = ProjectEntitySchema.extend({
  missionId: z.string().uuid(),
  target: WritingTargetSchema,
  content: z.string(),
  label: z.string(),
  status: z.enum(['pending', 'accepted', 'rejected']),
  provenance: ProvenanceSchema,
});

// ============================================================================
// SKILLS & AI
// ============================================================================

export const SkillDefinitionSchema = BaseEntitySchema.extend({
  name: z.string(),
  description: z.string(),
  parametersSchema: z.record(z.string(), z.any()), // JSON Schema
});

export const SkillRunSchema = ProjectEntitySchema.extend({
  skillId: z.string().uuid(),
  parameters: z.record(z.string(), z.any()),
  result: z.any().optional(),
  status: z.enum(['running', 'success', 'error']),
  error: z.string().optional(),
  provenance: ProvenanceSchema,
});

export const ProviderConnectionMetadataSchema = BaseEntitySchema.extend({
  studioId: z.string().uuid(),
  provider: z.string(),
  isConnected: z.boolean(),
  lastCheckAt: z.string().datetime(),
});

// ============================================================================
// GENERATION & ASSETS
// ============================================================================

export const JobStatusSchema = z.enum(['draft', 'queued', 'running', 'review_required', 'approved', 'failed', 'cancelled']);

export const GenerationJobSchema = ProjectEntitySchema.extend({
  label: z.string(),
  kind: z.enum(['image', 'video', 'text', 'audio']),
  status: JobStatusSchema,
  prompt: z.string(),
  parameters: z.record(z.string(), z.any()), // ratio, resolution, seed, quality...
  provider: z.string(),
  sceneId: z.string().uuid().optional(),
  shotId: z.string().uuid().optional(),
  referenceAssetIds: z.array(z.string().uuid()).default([]),
  resultAssetId: z.string().uuid().optional(),
  error: z.string().optional(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  provenance: ProvenanceSchema,
});

export const AssetStatusSchema = z.enum(['ephemeral', 'candidate', 'approved', 'canonical', 'archived', 'deleted']);

export const AssetVersionSchema = BaseEntitySchema.extend({
  assetId: z.string().uuid(),
  url: z.string().url(),
  prompt: z.string().optional(),
  status: AssetStatusSchema,
  provenance: ProvenanceSchema,
});

export const AssetRelationSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string().uuid(),
  relatedAssetId: z.string().uuid(),
  type: z.enum(['reference', 'variation', 'derived']),
});

export const AssetSchema = ProjectEntitySchema.extend({
  name: z.string(),
  type: z.enum(['image', 'video', 'reference', 'character', 'decor', 'document']),
  status: AssetStatusSchema,
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  sceneId: z.string().optional(),
  sequenceId: z.string().optional(),
  shotId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).default({}),
  provenance: ProvenanceSchema,
});

// ============================================================================
// STORYBOARD (Gilgamesh Support)
// ============================================================================

export const SequenceSchema = ProjectEntitySchema.extend({
  title: z.string(),
  description: z.string().optional(),
  order: z.number(),
});

export const StoryboardSceneSchema = ProjectEntitySchema.extend({
  sequenceId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  content: z.string().optional(),
  order: z.number(),
});

export const ShotSchema = ProjectEntitySchema.extend({
  sceneId: z.string(),
  description: z.string().optional(),
  type: z.string(),
  movement: z.string().optional(),
  duration: z.number().optional(),
  order: z.number(),
});

export const StoryboardEdgeSchema = ProjectEntitySchema.extend({
  source: z.string(),
  target: z.string(),
  label: z.string().optional(),
});

// ============================================================================
// REVIEW & DELIVERABLES
// ============================================================================

export const ReviewSchema = ProjectEntitySchema.extend({
  assetId: z.string().uuid(),
  status: z.enum(['pending', 'approved', 'rejected', 'changes_requested']),
  decidedAt: z.string().datetime().optional(),
});

export const ReviewCommentSchema = ProjectEntitySchema.extend({
  reviewId: z.string().uuid().optional(), // Or assetId directly
  assetId: z.string().uuid(),
  content: z.string(),
  authorName: z.string(), // Temporary fallback for createdBy
});

export const DeliverableSectionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['vision', 'logline', 'synopsis', 'treatment', 'characters', 'storyboard', 'shots', 'assets']),
  included: z.boolean(),
  label: z.string(),
});

export const DeliverableSchema = ProjectEntitySchema.extend({
  title: z.string(),
  format: z.enum(['html', 'json', 'pdf']),
  sections: z.array(DeliverableSectionSchema),
  exportedAt: z.string().datetime().optional(),
});

// ============================================================================
// AUDIT
// ============================================================================

export const AuditEventSchema = ProjectEntitySchema.extend({
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  details: z.record(z.string(), z.any()),
});

export const UsageEventSchema = BaseEntitySchema.extend({
  studioId: z.string().uuid(),
  provider: z.string(),
  operation: z.string(),
  tokens: z.number().optional(),
  cost: z.number().optional(),
});

// ============================================================================
// INFER TYPES
// ============================================================================

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type Studio = z.infer<typeof StudioSchema>;
export type StudioRole = z.infer<typeof StudioRoleSchema>;
export type StudioMembership = z.infer<typeof StudioMembershipSchema>;
export type ProjectV2 = z.infer<typeof ProjectSchema>;
export type ProjectCanon = z.infer<typeof ProjectCanonSchema>;
export type ProjectContextSnapshot = z.infer<typeof ProjectContextSnapshotSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type Hypothesis = z.infer<typeof HypothesisSchema>;
export type OpenQuestion = z.infer<typeof OpenQuestionSchema>;
export type TraceItem = z.infer<typeof TraceItemSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type WritingMission = z.infer<typeof WritingMissionSchema>;
export type AIProposal = z.infer<typeof AIProposalSchema>;
export type SkillDefinition = z.infer<typeof SkillDefinitionSchema>;
export type SkillRun = z.infer<typeof SkillRunSchema>;
export type ProviderConnectionMetadata = z.infer<typeof ProviderConnectionMetadataSchema>;
export type GenerationJob = z.infer<typeof GenerationJobSchema>;
export type AssetV2 = z.infer<typeof AssetSchema>;
export type AssetVersion = z.infer<typeof AssetVersionSchema>;
export type AssetRelation = z.infer<typeof AssetRelationSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ReviewComment = z.infer<typeof ReviewCommentSchema>;
export type Deliverable = z.infer<typeof DeliverableSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type UsageEvent = z.infer<typeof UsageEventSchema>;
export type Provenance = z.infer<typeof ProvenanceSchema>;

export type Sequence = z.infer<typeof SequenceSchema>;
export type StoryboardScene = z.infer<typeof StoryboardSceneSchema>;
export type Shot = z.infer<typeof ShotSchema>;
export type StoryboardEdge = z.infer<typeof StoryboardEdgeSchema>;
