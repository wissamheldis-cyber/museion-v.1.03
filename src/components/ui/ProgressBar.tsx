import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: 'neutral' | 'warn' | 'ok'
}

export function ProgressBar({ value, max = 100, className, showLabel, color = 'neutral' }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  const colorClass = {
    neutral: 'bg-[var(--interactive)]',
    warn: 'bg-[var(--state-warn)]',
    ok: 'bg-[var(--state-ok)]',
  }[color]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-[3px] bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-[var(--text-muted)] metric w-8 text-right">
          {Math.round(percent)}%
        </span>
      )}
    </div>
  )
}
