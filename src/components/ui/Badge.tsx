import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'blue' | 'green' | 'amber' | 'red' | 'champagne' | 'ghost'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full border',
        {
          'text-xs px-2 py-0.5': size === 'sm',
          'text-xs px-2.5 py-1': size === 'md',
        },
        {
          'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-default)]': variant === 'default',
          'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border-[var(--accent-blue)]/20': variant === 'blue',
          'bg-green-500/10 text-green-400 border-green-500/20': variant === 'green',
          'bg-amber-500/10 text-amber-400 border-amber-500/20': variant === 'amber',
          'bg-red-500/10 text-red-400 border-red-500/20': variant === 'red',
          'bg-[var(--accent-champagne-dim)] text-[var(--accent-champagne)] border-[var(--accent-champagne)]/20': variant === 'champagne',
          'bg-transparent text-[var(--text-muted)] border-[var(--border-subtle)]': variant === 'ghost',
        },
        className
      )}
    >
      {children}
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
    decision: { label: 'Décision', variant: 'green' as const, dot: 'bg-green-400' },
    hypothesis: { label: 'Hypothèse', variant: 'amber' as const, dot: 'bg-amber-400' },
    'open-question': { label: 'Question ouverte', variant: 'blue' as const, dot: 'bg-blue-400' },
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
  concept: { label: 'Concept', variant: 'default' },
  development: { label: 'En développement', variant: 'blue' },
  'pre-production': { label: 'Pré-production', variant: 'champagne' },
  production: { label: 'Production', variant: 'green' },
  'post-production': { label: 'Post-production', variant: 'amber' },
  archived: { label: 'Archivé', variant: 'ghost' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, variant: 'default' as const }
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
