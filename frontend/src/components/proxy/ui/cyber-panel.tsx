import React from "react"

interface CyberPanelProps {
  title?: string
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}

export function CyberPanel({ title, children, className = "", icon, actions }: CyberPanelProps) {
  return (
    <div
      className={`flex flex-col overflow-hidden ${className}`}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '8px',
      }}
    >
      {(title || icon || actions) && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 shrink-0"
          style={{
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--background-elevated)',
          }}
        >
          {icon && <div style={{ color: 'var(--accent)', opacity: 0.7 }}>{icon}</div>}
          {title && (
            <h3
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'var(--foreground-muted)', opacity: 0.8 }}
            >{title}</h3>
          )}
          {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
        </div>
      )}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  )
}
