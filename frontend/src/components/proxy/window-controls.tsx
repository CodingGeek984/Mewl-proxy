import { useState, useEffect } from "react"
import { Minus, Square, Copy, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { WindowMinimise, WindowToggleMaximise, WindowIsMaximised, Quit } from "@wailsjs/runtime/runtime"

export function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await WindowIsMaximised()
      setIsMaximized(maximized)
    }
    checkMaximized()
    const interval = setInterval(checkMaximized, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center h-full no-drag gap-0.5 pr-1">
      {/* Minimize — Green */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-8 rounded-md transition-all duration-200 group/min"
        style={{ color: 'var(--foreground-muted)' }}
        onClick={WindowMinimise}
      >
        <div className="relative">
          <Minus className="size-3.5 transition-colors duration-200 group-hover/min:text-emerald-400" />
          <div className="absolute inset-0 rounded-full opacity-0 group-hover/min:opacity-100 transition-opacity duration-200"
            style={{ boxShadow: '0 0 12px rgba(52, 211, 153, 0.4)' }}
          />
        </div>
      </Button>

      {/* Maximize — Amber */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-8 rounded-md transition-all duration-200 group/max"
        style={{ color: 'var(--foreground-muted)' }}
        onClick={() => WindowToggleMaximise()}
      >
        <div className="relative">
          {isMaximized ? (
            <Copy className="size-3 rotate-90 transition-colors duration-200 group-hover/max:text-amber-400" />
          ) : (
            <Square className="size-3 transition-colors duration-200 group-hover/max:text-amber-400" />
          )}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover/max:opacity-100 transition-opacity duration-200"
            style={{ boxShadow: '0 0 12px rgba(251, 191, 36, 0.4)' }}
          />
        </div>
      </Button>

      {/* Close — Red */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-8 rounded-md transition-all duration-200 group/close hover:bg-red-500/90"
        style={{ color: 'var(--foreground-muted)' }}
        onClick={Quit}
      >
        <X className="size-3.5 transition-colors duration-200 group-hover/close:text-white" />
      </Button>
    </div>
  )
}
