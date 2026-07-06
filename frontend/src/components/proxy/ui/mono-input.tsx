import React from "react"
import { Input } from "@/components/ui/input"

interface MonoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

export const MonoInput = React.forwardRef<HTMLInputElement, MonoInputProps>(
  ({ icon, className = "", ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-2.5 text-[var(--tokyo-cyan)]/55 pointer-events-none">
            {icon}
          </div>
        )}
        <Input
          ref={ref}
          className={`font-mono text-[11px] h-8 bg-[var(--tokyo-panel-2)] border-[var(--tokyo-border-cyan)] text-[var(--tokyo-cyan)] placeholder:text-[var(--tokyo-cyan)]/35 hover:border-[var(--tokyo-cyan)] focus-visible:ring-1 focus-visible:ring-[var(--tokyo-magenta)] focus-visible:border-[var(--tokyo-magenta)] transition-all ${icon ? "pl-8" : "pl-3"} ${className}`}
          {...props}
        />
      </div>
    )
  }
)
MonoInput.displayName = "MonoInput"
