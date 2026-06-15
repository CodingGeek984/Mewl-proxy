"use client"

import { Wifi, WifiOff } from "lucide-react"
import { useProxyWebsocket } from "@/lib/proxy-store"

export function StatusBar() {
  const { isConnected, requests, telemetry } = useProxyWebsocket()

  return (
    <div
      className="flex h-7 items-center gap-4 px-3 font-mono text-[10px] z-10 shrink-0 select-none"
      style={{
        background: 'var(--background-elevated)',
        borderTop: '1px solid var(--border-default)',
        color: 'var(--foreground-muted)',
      }}
    >
      <div className="flex items-center gap-2">
        {/* Connection indicator dot */}
        <div
          className="size-1.5 rounded-full"
          style={{
            background: isConnected ? 'var(--status-success)' : 'var(--status-error)',
            boxShadow: isConnected
              ? '0 0 6px var(--status-success)'
              : '0 0 6px var(--status-error)',
          }}
        />
        {isConnected
          ? <Wifi className="size-3" style={{ color: 'var(--status-success)', opacity: 0.7 }} />
          : <WifiOff className="size-3" style={{ color: 'var(--status-error)', opacity: 0.7 }} />
        }
        <span className="opacity-70">{requests.length} requests</span>
      </div>
      {telemetry && (
        <div className="hidden sm:flex items-center gap-3 opacity-50">
          <span>{telemetry.rps} req/s</span>
          <span>{telemetry.latency}ms avg</span>
        </div>
      )}
      <div className="ml-auto hidden sm:block">
        <span className="text-gradient-accent font-semibold opacity-60">Meowl v1.0</span>
      </div>
    </div>
  )
}
