// Writing Assistant types
export type WritingTarget = 'vision' | 'logline' | 'synopsis' | 'treatment' | 'characters' | 'script'
export type WritingClassification = 'decision' | 'hypothesis' | 'open-question'

export interface WritingMission {
  id: string
  projectId: string
  title: string
  target: WritingTarget
  context: string  // user-chosen context description
  createdAt: string
}

export interface WritingMessage {
  id: string
  missionId: string
  role: 'user' | 'assistant'
  content: string
  classification?: WritingClassification
  createdAt: string
}

export interface WritingVariant {
  id: string
  missionId: string
  label: string
  content: string
  target: WritingTarget
  selected: boolean
  createdAt: string
}

// Production Job types (extends RenderJob)
export type JobStatus = 'draft' | 'queued' | 'running' | 'review_required' | 'approved' | 'failed' | 'cancelled'

export interface ProductionJob {
  id: string
  projectId: string
  sceneId?: string
  shotId?: string
  label: string
  kind: 'image' | 'video'
  status: JobStatus
  prompt: string
  ratio: string
  resolution: string
  seed: string
  quality: 'draft' | 'standard' | 'high'
  provider: string  // e.g., 'mock'
  referenceAssetIds?: string[]
  resultAssetId?: string
  error?: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
}

// Review types
export interface ReviewComment {
  id: string
  projectId: string
  assetId: string
  content: string
  author: string
  createdAt: string
}

export interface ReviewChecklist {
  id: string
  projectId: string
  assetId: string
  label: string
  checked: boolean
}

// Deliverable types
export type DeliverableFormat = 'html' | 'json'

export interface DeliverablePackage {
  id: string
  projectId: string
  title: string
  sections: DeliverableSection[]
  createdAt: string
  exportedAt?: string
}

export interface DeliverableSection {
  id: string
  type: 'vision' | 'logline' | 'synopsis' | 'treatment' | 'characters' | 'storyboard' | 'shots' | 'assets'
  included: boolean
  label: string
}

// Collection types for Library
export interface AssetCollection {
  id: string
  projectId: string
  name: string
  assetIds: string[]
  createdAt: string
}
