'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Direction artistique ref1-4 : l'action principale est un fond sombre
 * cerné d'un filet clair, jamais un aplat de couleur.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-sm)] transition-all duration-[var(--transition-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--interactive)] disabled:opacity-40 disabled:cursor-not-allowed select-none',
          {
            'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--interactive-border)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--interactive)] active:scale-[0.98]':
              variant === 'primary',
            'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-default)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] active:scale-[0.98]':
              variant === 'secondary',
            'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]':
              variant === 'ghost',
            'bg-[var(--state-danger-dim)] text-[var(--state-danger)] border border-[var(--state-danger)]/25 hover:bg-[var(--state-danger)]/15':
              variant === 'danger',
          },
          {
            'text-xs px-2.5 py-1.5 h-7': size === 'sm',
            'text-sm px-3.5 py-2 h-9': size === 'md',
            'text-sm px-4 py-2.5 h-10': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
