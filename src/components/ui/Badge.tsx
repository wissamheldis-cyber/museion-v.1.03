import { cn } from '@/lib/utils'

/**
 * Direction artistique ref1-4 : le chrome est monochrome.
 * `neutral` et `ghost` ne portent aucune couleur ; `ok`, `warn` et `danger`
 * sont réservés à un état réel de la donnée.
 */
interface BadgeProps {
  children: React.ReactNode
  variant?: 'neutral' | 'selected' | 'ok' | 'warn' | 'danger' | 'ghost'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'neutral', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full border',
        {
          'text-[11px] px-2 py-0.5': size === 'sm',
          'text-xs px-2.5 py-1': size === 'md',
        },
        {
          'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]':
            variant === 'neutral',
          'bg-[var(--interactive-dim)] text-[var(--text-primary)] border-[var(--interactive-border)]':
            variant === 'selected',
          'bg-[var(--state-ok-dim)] text-[var(--state-ok)] border-[var(--state-ok)]/25':
            variant === 'ok',
          'bg-[var(--state-warn-dim)] text-[var(--state-warn)] border-[var(--state-warn)]/25':
            variant === 'warn',
          'bg-[var(--state-danger-dim)] text-[var(--state-danger)] border-[var(--state-danger)]/25':
            variant === 'danger',
          'bg-transparent text-[var(--text-muted)] border-[var(--border-subtle)]':
            variant === 'ghost',
        },
        className
      )}
    >
      {children}
    </span>
  )
}

/** Pastille d'état, sans cartouche — usage « On Track », « Approved » des références. */
export function StatusDot({
  state,
  label,
  className,
}: {
  state: 'ok' | 'warn' | 'danger' | 'idle'
  label: string
  className?: string
}) {
  const color = {
    ok: 'bg-[var(--state-ok)]',
    warn: 'bg-[var(--state-warn)]',
    danger: 'bg-[var(--state-danger)]',
    idle: 'bg-[var(--text-muted)]',
  }[state]

  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', color)} />
      {label}
    </span>
  )
}

// Badge spécialisé pour les statuts de traçabilité
interface TraceBadgeProps {
  status: 'decision' | 'hypothesis' | 'open-question'
  className?: string
}

export function TraceBadge({ status, className }: TraceBadgeProps) {
  const config = {
    decision: { label: 'Décision', variant: 'ok' as const, dot: 'bg-[var(--state-ok)]' },
    hypothesis: { label: 'Hypothèse', variant: 'warn' as const, dot: 'bg-[var(--state-warn)]' },
    'open-question': {
      label: 'Question ouverte',
      variant: 'neutral' as const,
      dot: 'bg-[var(--text-secondary)]',
    },
  }
  const { label, variant, dot } = config[status]

  return (
    <Badge variant={variant} className={className}>
      <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
      {label}
    </Badge>
  )
}

// Badge statut projet
interface StatusBadgeProps {
  status: string
  className?: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  draft: { label: 'Brouillon', variant: 'ghost' },
  concept: { label: 'Concept', variant: 'neutral' },
  development: { label: 'En développement', variant: 'selected' },
  'pre-production': { label: 'Pré-production', variant: 'neutral' },
  production: { label: 'Production', variant: 'ok' },
  'post-production': { label: 'Post-production', variant: 'warn' },
  archived: { label: 'Archivé', variant: 'ghost' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'neutral' as const }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
