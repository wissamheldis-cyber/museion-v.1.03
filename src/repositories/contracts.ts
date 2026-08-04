import { 
  ProjectV2, ProjectContextSnapshot, Conversation, Message,
  WritingMission, AIProposal, SkillDefinition, SkillRun,
  GenerationJob, AssetV2, Review, ReviewComment, Deliverable,
  AuditEvent, Studio, UserProfile, TraceItem
} from '../lib/models/schema-v2';

export interface AuthAdapter {
  getCurrentUser(): Promise<UserProfile | null>;
  login(email: string): Promise<void>;
  logout(): Promise<void>;
}

export interface StudioRepository {
  getStudio(id: string): Promise<Studio | null>;
  createStudio(studio: Omit<Studio, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Studio>;
}

export interface ProjectRepository {
  getProjects(studioId: string): Promise<ProjectV2[]>;
  getProject(id: string): Promise<ProjectV2 | null>;
  createProject(project: Omit<ProjectV2, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ProjectV2>;
  updateProject(id: string, updates: Partial<ProjectV2>): Promise<ProjectV2>;
  deleteProject(id: string): Promise<void>;
}

export interface ProjectContextRepository {
  getSnapshots(projectId: string): Promise<ProjectContextSnapshot[]>;
  createSnapshot(snapshot: Omit<ProjectContextSnapshot, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ProjectContextSnapshot>;
  getTraces(projectId: string): Promise<TraceItem[]>;
  addTrace(trace: Omit<TraceItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<TraceItem>;
}

export interface ConversationRepository {
  getConversations(projectId: string): Promise<Conversation[]>;
  createConversation(conv: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Conversation>;
  getMessages(conversationId: string): Promise<Message[]>;
  addMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Message>;
}

export interface SkillRepository {
  getSkills(): Promise<SkillDefinition[]>;
  getSkillRuns(projectId: string): Promise<SkillRun[]>;
  createSkillRun(run: Omit<SkillRun, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<SkillRun>;
  updateSkillRun(id: string, updates: Partial<SkillRun>): Promise<SkillRun>;
}

export interface ProposalRepository {
  getMissions(projectId: string): Promise<WritingMission[]>;
  createMission(mission: Omit<WritingMission, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<WritingMission>;
  getProposals(missionId: string): Promise<AIProposal[]>;
  createProposal(proposal: Omit<AIProposal, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<AIProposal>;
  updateProposal(id: string, updates: Partial<AIProposal>): Promise<AIProposal>;
}

export interface GenerationJobRepository {
  getJobs(projectId: string): Promise<GenerationJob[]>;
  createJob(job: Omit<GenerationJob, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<GenerationJob>;
  updateJob(id: string, updates: Partial<GenerationJob>): Promise<GenerationJob>;
  deleteJob(id: string): Promise<void>;
}

export interface AssetRepository {
  getAssets(projectId: string): Promise<AssetV2[]>;
  getAsset(id: string): Promise<AssetV2 | null>;
  createAsset(asset: Omit<AssetV2, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<AssetV2>;
  updateAsset(id: string, updates: Partial<AssetV2>): Promise<AssetV2>;
  deleteAsset(id: string): Promise<void>;
}

export interface ReviewRepository {
  getReviews(projectId: string): Promise<Review[]>;
  createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Review>;
  updateReview(id: string, updates: Partial<Review>): Promise<Review>;
  getComments(assetId: string): Promise<ReviewComment[]>;
  addComment(comment: Omit<ReviewComment, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ReviewComment>;
  deleteComment(id: string): Promise<void>;
}

export interface DeliverableRepository {
  getDeliverables(projectId: string): Promise<Deliverable[]>;
  createDeliverable(del: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Deliverable>;
  updateDeliverable(id: string, updates: Partial<Deliverable>): Promise<Deliverable>;
  deleteDeliverable(id: string): Promise<void>;
}

export interface AuditRepository {
  getEvents(projectId: string): Promise<AuditEvent[]>;
  logEvent(event: Omit<AuditEvent, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<void>;
}

export interface FileStorageAdapter {
  uploadFile(projectId: string, file: File | Blob, path: string): Promise<string>;
  getFileUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}
