"use client"

import { Activity, Database, Terminal, Wifi, WifiOff } from "lucide-react"
import { useProxyWebsocket } from "@/lib/proxy-store"

export function StatusBar() {
  const { isConnected, requests, telemetry } = useProxyWebsocket()
  const last = requests[requests.length - 1]

  return (
    <div
      className="flex h-8 items-center gap-4 px-3 font-mono text-[10px] z-10 shrink-0 select-none"
      style={{
        background: 'linear-gradient(180deg, rgba(31,35,53,0.98), rgba(26,27,38,0.98))',
        borderTop: '1px solid var(--border-default)',
        color: 'var(--foreground-muted)',
      }}
    >
      <div className="flex items-center gap-2">
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
        <span className="opacity-80">{isConnected ? "WS online" : "WS offline"}</span>
      </div>
      <div className="hidden items-center gap-2 sm:flex">
        <Database className="size-3 text-[var(--accent)] opacity-70" />
        <span>{requests.length} requests</span>
      </div>
      {telemetry && (
        <div className="hidden sm:flex items-center gap-3 opacity-70">
          <Activity className="size-3 text-[var(--status-info)]" />
          <span>{telemetry.rps} req/s</span>
          <span>{telemetry.latency}ms avg</span>
        </div>
      )}
      <div className="min-w-0 flex-1 items-center gap-2 hidden md:flex">
        <Terminal className="size-3 text-[var(--status-success)] opacity-70" />
        <span className="truncate">
          {last ? `[history] ${last.method} ${last.host}${last.path} -> ${last.status_code || "pending"}` : "[logs] waiting for proxy traffic"}
        </span>
      </div>
      <div className="ml-auto hidden sm:block">
        <span className="text-gradient-accent font-semibold opacity-70">Meowl v1.0</span>
      </div>
    </div>
  )
}
