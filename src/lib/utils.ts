import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  return formatDate(dateString)
}

export function countWords(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  concept: 'Concept',
  development: 'En développement',
  'pre-production': 'Pré-production',
  production: 'Production',
  'post-production': 'Post-production',
  archived: 'Archivé',
}

export const FORMAT_LABELS: Record<string, string> = {
  feature: 'Long métrage',
  short: 'Court métrage',
  documentary: 'Documentaire',
  series: 'Série',
  animation: 'Animation',
}

export const GENRE_LABELS: Record<string, string> = {
  historical: 'Historique',
  epic: 'Épique',
  drama: 'Drame',
  thriller: 'Thriller',
  documentary: 'Documentaire',
  fantasy: 'Fantastique',
  scifi: 'Science-fiction',
  comedy: 'Comédie',
}
