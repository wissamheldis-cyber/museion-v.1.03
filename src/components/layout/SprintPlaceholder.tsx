import Link from 'next/link'

interface SprintPlaceholderProps {
  title: string
  projectSlug: string
  /** Sprint prévu, si la capacité est planifiée. */
  sprint?: 2 | 3
  /** Ce que fera la page, décrit sans jamais le simuler. */
  description?: string
  /** Contrainte explicite à rappeler (autorisation, absence d'IA…). */
  constraint?: string
}

/**
 * Écran d'une capacité non construite. Il annonce ce qui n'existe pas,
 * il ne le mime jamais.
 */
export function SprintPlaceholder({
  title,
  projectSlug,
  sprint,
  description,
  constraint,
}: SprintPlaceholderProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="w-full max-w-md">
        <p className="label-caps">{sprint ? `Sprint ${sprint}` : 'Non planifié'}</p>
        <h2 className="mt-2 text-xl font-medium text-[var(--text-primary)]">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {description ?? 'Cette page n’est pas encore construite.'}
        </p>

        <div className="mt-5 border-t border-[var(--border-subtle)] pt-4">
          <p className="label-caps">État</p>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
            {sprint
              ? `En construction dans le Sprint ${sprint}. Rien n’est simulé ici.`
              : 'Capacité non planifiée à ce jour. Rien n’est simulé ici.'}
          </p>
        </div>

        {constraint && (
          <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--state-warn)]/25 bg-[var(--state-warn-dim)] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-[var(--state-warn)]">{constraint}</p>
          </div>
        )}

        <Link
          href={`/cinema/projects/${projectSlug}`}
          className="mt-6 inline-block text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
        >
          ← Retour au projet
        </Link>
      </div>
    </div>
  )
}
