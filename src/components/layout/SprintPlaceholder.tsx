import Link from 'next/link'
import { Construction } from 'lucide-react'

interface SprintPlaceholderProps {
  title: string
  sprint: 2 | 3
  projectSlug: string
}

export function SprintPlaceholder({ title, sprint, projectSlug }: SprintPlaceholderProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24">
      <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] flex items-center justify-center mb-5">
        <Construction size={20} className="text-[var(--text-muted)]" />
      </div>
      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h2>
      <p className="text-sm text-[var(--text-muted)] text-center max-w-xs">
        En construction dans le prochain sprint (Sprint {sprint}).
      </p>
      <Link
        href={`/cinema/projects/${projectSlug}`}
        className="mt-6 text-xs text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)] transition-colors"
      >
        ← Retour au projet
      </Link>
    </div>
  )
}
