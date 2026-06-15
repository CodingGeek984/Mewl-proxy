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
          <div className="absolute left-2.5 text-muted-foreground/50 pointer-events-none">
            {icon}
          </div>
        )}
        <Input
          ref={ref}
          className={`font-mono text-[11px] h-8 bg-muted/10 border-border/40 hover:border-border/60 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary/40 transition-all ${icon ? "pl-8" : "pl-3"} ${className}`}
          {...props}
        />
      </div>
    )
  }
)
MonoInput.displayName = "MonoInput"
