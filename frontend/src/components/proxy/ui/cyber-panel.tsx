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
      className={`flex flex-col overflow-hidden transition-colors duration-200 ${className}`}
      style={{
        background: 'linear-gradient(180deg, var(--tokyo-panel-2), var(--tokyo-panel))',
        border: '1px solid var(--tokyo-border-cyan)',
        borderRadius: '12px',
        boxShadow: '0 18px 48px rgba(0,0,0,0.28), 0 0 24px rgba(0,240,255,0.05), inset 0 1px 0 rgba(0,240,255,0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {(title || icon || actions) && (
        <div
          className="flex items-center gap-2 px-3 py-2 shrink-0"
          style={{
            borderBottom: '1px solid var(--tokyo-border-cyan)',
            background: 'linear-gradient(180deg, var(--tokyo-panel-3), var(--tokyo-panel-2))',
          }}
        >
          {icon && <div style={{ color: 'var(--tokyo-magenta)', opacity: 0.85 }}>{icon}</div>}
          {title && (
            <h3
              className="text-[10px] font-bold uppercase tracking-[0.16em]"
              style={{ color: 'var(--tokyo-cyan)', opacity: 0.92 }}
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
