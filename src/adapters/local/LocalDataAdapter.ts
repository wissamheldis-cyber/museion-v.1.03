import {
  AuthAdapter, StudioRepository, ProjectRepository, ProjectContextRepository,
  ConversationRepository, SkillRepository, ProposalRepository,
  GenerationJobRepository, AssetRepository, ReviewRepository,
  DeliverableRepository, AuditRepository, FileStorageAdapter
} from '../../repositories/contracts';

import {
  UserProfile, Studio, ProjectV2, ProjectContextSnapshot, TraceItem,
  Conversation, Message, WritingMission, AIProposal, SkillDefinition,
  SkillRun, GenerationJob, AssetV2, Review, ReviewComment, Deliverable,
  AuditEvent, Sequence, StoryboardScene, Shot, StoryboardEdge
} from '../../lib/models/schema-v2';
import { generateId } from '../../lib/utils';

interface LocalDataSchema {
  users: UserProfile[];
  studios: Studio[];
  projects: ProjectV2[];
  snapshots: ProjectContextSnapshot[];
  traces: TraceItem[];
  conversations: Conversation[];
  messages: Message[];
  missions: WritingMission[];
  proposals: AIProposal[];
  skillRuns: SkillRun[];
  jobs: GenerationJob[];
  assets: AssetV2[];
  reviews: Review[];
  comments: ReviewComment[];
  deliverables: Deliverable[];
  audits: AuditEvent[];
  sequences: Sequence[];
  scenes: StoryboardScene[];
  shots: Shot[];
  edges: StoryboardEdge[];
}

const STORAGE_KEY = 'museion-v2-data';

export class LocalDataAdapter implements 
  AuthAdapter, StudioRepository, ProjectRepository, ProjectContextRepository,
  ConversationRepository, SkillRepository, ProposalRepository,
  GenerationJobRepository, AssetRepository, ReviewRepository,
  DeliverableRepository, AuditRepository, FileStorageAdapter 
{
  private delay = 200; // Simulated network delay

  private async wait() {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  private getData(): LocalDataSchema {
    if (typeof window === 'undefined') {
      return this.getEmptyData();
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return this.getEmptyData();
    try {
      return JSON.parse(raw);
    } catch {
      return this.getEmptyData();
    }
  }

  private saveData(data: LocalDataSchema) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }

  private getEmptyData(): LocalDataSchema {
    return {
      users: [], studios: [], projects: [], snapshots: [], traces: [],
      conversations: [], messages: [], missions: [], proposals: [],
      skillRuns: [], jobs: [], assets: [], reviews: [], comments: [],
      deliverables: [], audits: [],
      sequences: [], scenes: [], shots: [], edges: []
    };
  }

  private createEntity<T extends { id: string, version: number, createdAt: string, updatedAt: string }>(
    partial: Omit<T, 'id' | 'createdAt' | 'updatedAt' | 'version'>
  ): T {
    const now = new Date().toISOString();
    return {
      ...partial,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      version: 1
    } as unknown as T;
  }

  private updateEntity<T extends { id: string, version: number, updatedAt: string }>(
    current: T, updates: Partial<T>
  ): T {
    return {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: current.version + 1
    };
  }

  // AuthAdapter
  async getCurrentUser(): Promise<UserProfile | null> {
    await this.wait();
    const data = this.getData();
    return data.users[0] || null;
  }
  async login(email: string): Promise<void> {
    await this.wait();
    const data = this.getData();
    if (data.users.length === 0) {
      data.users.push(this.createEntity<UserProfile>({ displayName: email.split('@')[0], email }));
      this.saveData(data);
    }
  }
  async logout(): Promise<void> {
    await this.wait();
  }

  // StudioRepository
  async getStudio(id: string): Promise<Studio | null> {
    await this.wait();
    return this.getData().studios.find(s => s.id === id) || null;
  }
  async createStudio(studio: Omit<Studio, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Studio> {
    await this.wait();
    const data = this.getData();
    const newStudio = this.createEntity<Studio>(studio);
    data.studios.push(newStudio);
    this.saveData(data);
    return newStudio;
  }

  // ProjectRepository
  async getProjects(studioId: string): Promise<ProjectV2[]> {
    await this.wait();
    return this.getData().projects.filter(p => p.studioId === studioId);
  }
  async getProject(id: string): Promise<ProjectV2 | null> {
    await this.wait();
    return this.getData().projects.find(p => p.id === id) || null;
  }
  async createProject(project: Omit<ProjectV2, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ProjectV2> {
    await this.wait();
    const data = this.getData();
    const newProj = this.createEntity<ProjectV2>(project);
    data.projects.push(newProj);
    this.saveData(data);
    return newProj;
  }
  async updateProject(id: string, updates: Partial<ProjectV2>): Promise<ProjectV2> {
    await this.wait();
    const data = this.getData();
    const idx = data.projects.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Project not found");
    const updated = this.updateEntity(data.projects[idx], updates);
    data.projects[idx] = updated;
    this.saveData(data);
    return updated;
  }
  async deleteProject(id: string): Promise<void> {
    await this.wait();
    const data = this.getData();
    data.projects = data.projects.filter(p => p.id !== id);
    this.saveData(data);
  }

  // ProjectContextRepository
  async getSnapshots(projectId: string): Promise<ProjectContextSnapshot[]> {
    await this.wait();
    return this.getData().snapshots.filter(s => s.projectId === projectId);
  }
  async createSnapshot(snapshot: Omit<ProjectContextSnapshot, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ProjectContextSnapshot> {
    await this.wait();
    const data = this.getData();
    const newSnap = this.createEntity<ProjectContextSnapshot>(snapshot);
    data.snapshots.push(newSnap);
    this.saveData(data);
    return newSnap;
  }
  async getTraces(projectId: string): Promise<TraceItem[]> {
    await this.wait();
    return this.getData().traces.filter(t => t.projectId === projectId);
  }
  async addTrace(trace: Omit<TraceItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<TraceItem> {
    await this.wait();
    const data = this.getData();
    const newTrace = this.createEntity<TraceItem>(trace);
    data.traces.push(newTrace);
    this.saveData(data);
    return newTrace;
  }

  // ConversationRepository
  async getConversations(projectId: string): Promise<Conversation[]> {
    await this.wait();
    return this.getData().conversations.filter(c => c.projectId === projectId);
  }
  async createConversation(conv: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Conversation> {
    await this.wait();
    const data = this.getData();
    const newConv = this.createEntity<Conversation>(conv);
    data.conversations.push(newConv);
    this.saveData(data);
    return newConv;
  }
  async getMessages(conversationId: string): Promise<Message[]> {
    await this.wait();
    return this.getData().messages.filter(m => m.conversationId === conversationId);
  }
  async addMessage(message: Omit<Message, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Message> {
    await this.wait();
    const data = this.getData();
    const newMsg = this.createEntity<Message>(message);
    data.messages.push(newMsg);
    this.saveData(data);
    return newMsg;
  }

  // SkillRepository
  async getSkills(): Promise<SkillDefinition[]> {
    await this.wait();
    return []; // For now, no dynamic skill definitions
  }
  async getSkillRuns(projectId: string): Promise<SkillRun[]> {
    await this.wait();
    return this.getData().skillRuns.filter(r => r.projectId === projectId);
  }
  async createSkillRun(run: Omit<SkillRun, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<SkillRun> {
    await this.wait();
    const data = this.getData();
    const newRun = this.createEntity<SkillRun>(run);
    data.skillRuns.push(newRun);
    this.saveData(data);
    return newRun;
  }
  async updateSkillRun(id: string, updates: Partial<SkillRun>): Promise<SkillRun> {
    await this.wait();
    const data = this.getData();
    const idx = data.skillRuns.findIndex(r => r.id === id);
    if (idx === -1) throw new Error("SkillRun not found");
    const updated = this.updateEntity(data.skillRuns[idx], updates);
    data.skillRuns[idx] = updated;
    this.saveData(data);
    return updated;
  }

  // ProposalRepository
  async getMissions(projectId: string): Promise<WritingMission[]> {
    await this.wait();
    return this.getData().missions.filter(m => m.projectId === projectId);
  }
  async createMission(mission: Omit<WritingMission, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<WritingMission> {
    await this.wait();
    const data = this.getData();
    const newMission = this.createEntity<WritingMission>(mission);
    data.missions.push(newMission);
    this.saveData(data);
    return newMission;
  }
  async getProposals(missionId: string): Promise<AIProposal[]> {
    await this.wait();
    return this.getData().proposals.filter(p => p.missionId === missionId);
  }
  async createProposal(proposal: Omit<AIProposal, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<AIProposal> {
    await this.wait();
    const data = this.getData();
    const newProp = this.createEntity<AIProposal>(proposal);
    data.proposals.push(newProp);
    this.saveData(data);
    return newProp;
  }
  async updateProposal(id: string, updates: Partial<AIProposal>): Promise<AIProposal> {
    await this.wait();
    const data = this.getData();
    const idx = data.proposals.findIndex(p => p.id === id);
    if (idx === -1) throw new Error("Proposal not found");
    const updated = this.updateEntity(data.proposals[idx], updates);
    data.proposals[idx] = updated;
    this.saveData(data);
    return updated;
  }

  // GenerationJobRepository
  async getJobs(projectId: string): Promise<GenerationJob[]> {
    await this.wait();
    return this.getData().jobs.filter(j => j.projectId === projectId);
  }
  async createJob(job: Omit<GenerationJob, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<GenerationJob> {
    await this.wait();
    const data = this.getData();
    const newJob = this.createEntity<GenerationJob>(job);
    data.jobs.push(newJob);
    this.saveData(data);
    return newJob;
  }
  async updateJob(id: string, updates: Partial<GenerationJob>): Promise<GenerationJob> {
    await this.wait();
    const data = this.getData();
    const idx = data.jobs.findIndex(j => j.id === id);
    if (idx === -1) throw new Error("Job not found");
    const updated = this.updateEntity(data.jobs[idx], updates);
    data.jobs[idx] = updated;
    this.saveData(data);
    return updated;
  }
  async deleteJob(id: string): Promise<void> {
    await this.wait();
    const data = this.getData();
    data.jobs = data.jobs.filter(j => j.id !== id);
    this.saveData(data);
  }

  // AssetRepository
  async getAssets(projectId: string): Promise<AssetV2[]> {
    await this.wait();
    return this.getData().assets.filter(a => a.projectId === projectId);
  }
  async getAsset(id: string): Promise<AssetV2 | null> {
    await this.wait();
    return this.getData().assets.find(a => a.id === id) || null;
  }
  async createAsset(asset: Omit<AssetV2, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<AssetV2> {
    await this.wait();
    const data = this.getData();
    const newAsset = this.createEntity<AssetV2>(asset);
    data.assets.push(newAsset);
    this.saveData(data);
    return newAsset;
  }
  async updateAsset(id: string, updates: Partial<AssetV2>): Promise<AssetV2> {
    await this.wait();
    const data = this.getData();
    const idx = data.assets.findIndex(a => a.id === id);
    if (idx === -1) throw new Error("Asset not found");
    const updated = this.updateEntity(data.assets[idx], updates);
    data.assets[idx] = updated;
    this.saveData(data);
    return updated;
  }
  async deleteAsset(id: string): Promise<void> {
    await this.wait();
    const data = this.getData();
    data.assets = data.assets.filter(a => a.id !== id);
    this.saveData(data);
  }

  // ReviewRepository
  async getReviews(projectId: string): Promise<Review[]> {
    await this.wait();
    return this.getData().reviews.filter(r => r.projectId === projectId);
  }
  async createReview(review: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Review> {
    await this.wait();
    const data = this.getData();
    const newRev = this.createEntity<Review>(review);
    data.reviews.push(newRev);
    this.saveData(data);
    return newRev;
  }
  async updateReview(id: string, updates: Partial<Review>): Promise<Review> {
    await this.wait();
    const data = this.getData();
    const idx = data.reviews.findIndex(r => r.id === id);
    if (idx === -1) throw new Error("Review not found");
    const updated = this.updateEntity(data.reviews[idx], updates);
    data.reviews[idx] = updated;
    this.saveData(data);
    return updated;
  }
  async getComments(assetId: string): Promise<ReviewComment[]> {
    await this.wait();
    return this.getData().comments.filter(c => c.assetId === assetId);
  }
  async addComment(comment: Omit<ReviewComment, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ReviewComment> {
    await this.wait();
    const data = this.getData();
    const newComm = this.createEntity<ReviewComment>(comment);
    data.comments.push(newComm);
    this.saveData(data);
    return newComm;
  }
  async deleteComment(id: string): Promise<void> {
    await this.wait();
    const data = this.getData();
    data.comments = data.comments.filter(c => c.id !== id);
    this.saveData(data);
  }

  // DeliverableRepository
  async getDeliverables(projectId: string): Promise<Deliverable[]> {
    await this.wait();
    return this.getData().deliverables.filter(d => d.projectId === projectId);
  }
  async createDeliverable(del: Omit<Deliverable, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Deliverable> {
    await this.wait();
    const data = this.getData();
    const newDel = this.createEntity<Deliverable>(del);
    data.deliverables.push(newDel);
    this.saveData(data);
    return newDel;
  }
  async updateDeliverable(id: string, updates: Partial<Deliverable>): Promise<Deliverable> {
    await this.wait();
    const data = this.getData();
    const idx = data.deliverables.findIndex(d => d.id === id);
    if (idx === -1) throw new Error("Deliverable not found");
    const updated = this.updateEntity(data.deliverables[idx], updates);
    data.deliverables[idx] = updated;
    this.saveData(data);
    return updated;
  }
  async deleteDeliverable(id: string): Promise<void> {
    await this.wait();
    const data = this.getData();
    data.deliverables = data.deliverables.filter(d => d.id !== id);
    this.saveData(data);
  }

  // AuditRepository
  async getEvents(projectId: string): Promise<AuditEvent[]> {
    await this.wait();
    return this.getData().audits.filter(a => a.projectId === projectId);
  }
  async logEvent(event: Omit<AuditEvent, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<void> {
    const data = this.getData();
    data.audits.push(this.createEntity<AuditEvent>(event));
    this.saveData(data);
  }

  // FileStorageAdapter
  async uploadFile(projectId: string, file: File | Blob, path: string): Promise<string> {
    await this.wait();
    // Simulate returning a path/url
    return URL.createObjectURL(file);
  }
  async getFileUrl(path: string): Promise<string> {
    return path;
  }
  async deleteFile(path: string): Promise<void> {
    await this.wait();
  }

  // Helper pour l'export/import (migration)
  exportData(): string {
    return JSON.stringify(this.getData());
  }
  importData(rawJson: string) {
    const parsed = JSON.parse(rawJson);
    this.saveData(parsed);
  }
}

export const localProvider = new LocalDataAdapter();
