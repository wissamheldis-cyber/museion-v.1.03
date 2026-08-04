'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="label-caps">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:border-[var(--interactive)] focus:ring-1 focus:ring-[var(--interactive)]/30',
            error && 'border-[var(--state-danger)]/50 focus:border-[var(--state-danger)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--state-danger)]">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="label-caps">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-sm)] px-3 py-2 text-sm placeholder:text-[var(--text-muted)] transition-all duration-[var(--transition-fast)] focus:outline-none focus:border-[var(--interactive)] focus:ring-1 focus:ring-[var(--interactive)]/30 resize-none',
            error && 'border-[var(--state-danger)]/50',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-[var(--state-danger)]">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
