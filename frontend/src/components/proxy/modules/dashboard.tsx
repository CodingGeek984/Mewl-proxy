"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Activity, Network, TrendingUp, Cpu, HardDrive, MemoryStick,
  Download, Upload, Save, Zap, Radar, Wifi, WifiOff,
  RefreshCw, Trash2, CheckCircle, XCircle, RotateCcw, Globe, Lock
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useProxyWebsocket } from "@/lib/proxy-store"
import * as App from "@wailsjs/go/backend/App"
import type { TrafficEvent } from "@/types/proxy"
import { Input } from "@/components/ui/input"

// ─── Status Tab ──────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = "sky" }: {
  icon: any; label: string; value: string | number; sub?: string; color?: string
}) {
  const colorMap: Record<string, string> = {
    sky: "text-[var(--accent)] bg-sky-500/10 border-sky-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  }
  const c = colorMap[color] || colorMap.sky

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border/20 bg-muted/5 hover:bg-muted/10 transition-colors group">
      <div className={`size-9 rounded-lg ${c} flex items-center justify-center shrink-0 border transition-all group-hover:scale-105`}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">{label}</div>
        <div className="text-sm font-bold text-foreground/90 tabular-nums">{value}</div>
        {sub && <div className="text-[9px] text-muted-foreground/40 font-mono">{sub}</div>}
      </div>
    </div>
  )
}

function MethodBar({ method, count, total }: { method: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  const colors: Record<string, string> = {
    GET: "bg-emerald-500", POST: "bg-sky-500", PUT: "bg-amber-500",
    DELETE: "bg-red-500", PATCH: "bg-purple-500", OPTIONS: "bg-zinc-500",
    HEAD: "bg-teal-500", OTHER: "bg-zinc-600",
  }
  return (
    <div className="flex items-center gap-3 text-[11px]">
      <span className="w-14 font-mono font-bold text-foreground/70 shrink-0">{method}</span>
      <div className="flex-1 h-2 bg-muted/20 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colors[method] || colors.OTHER} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right font-mono text-muted-foreground/60 tabular-nums">{count}</span>
      <span className="w-10 text-right font-mono text-muted-foreground/30 tabular-nums text-[9px]">{pct.toFixed(0)}%</span>
    </div>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
}

function StatusTab() {
  const { requests, setRequests, isConnected, intercepts, isInterceptEnabled } = useProxyWebsocket()
  const [uptime, setUptime] = useState(0)
  const [lastExport, setLastExport] = useState<string | null>(null)

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  const exportSession = useCallback(() => {
    const session = {
      version: "1.0",
      exported_at: new Date().toISOString(),
      total_requests: requests.length,
      requests: requests.map(r => ({
        uid: r._uid,
        id: r.id,
        method: r.method,
        host: r.host,
        path: r.path,
        query: r.query,
        status_code: r.status_code,
        mime_type: r.mime_type,
        tls: r.tls,
        latency: r.latency,
        size: r.size,
        request_size: r.request_size,
        time: r.time,
        request_raw: r.request_raw,
        response_raw: r.response_raw,
      }))
    }

    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meowl_session_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setLastExport(new Date().toLocaleTimeString())
  }, [requests])

  const exportLightweight = useCallback(() => {
    const light = requests.map(r => ({
      m: r.method,
      h: r.host,
      p: r.path + (r.query ? "?" + r.query : ""),
      s: r.status_code,
      l: r.latency,
      sz: r.size,
    }))

    const blob = new Blob([JSON.stringify(light)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `meowl_light_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setLastExport(new Date().toLocaleTimeString())
  }, [requests])

  const importSession = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const data = JSON.parse(text)
        if (data.requests && Array.isArray(data.requests)) {
          const imported: TrafficEvent[] = data.requests.map((r: any) => ({
            ...r,
            _uid: r.uid || r._uid || crypto.randomUUID(),
          }))
          setRequests(prev => [...prev, ...imported])
        }
      } catch (err) {
        console.error("Import failed:", err)
      }
    }
    input.click()
  }, [setRequests])

  const stats = useMemo(() => {
    const methods: Record<string, number> = {}
    const statusCodes: Record<string, number> = {}
    let totalReqSize = 0
    let totalResSize = 0
    let totalLatency = 0
    let latencyCount = 0
    const hosts = new Set<string>()

    for (const r of requests) {
      const m = r.method || "OTHER"
      methods[m] = (methods[m] || 0) + 1

      if (r.status_code) {
        const group = `${Math.floor(r.status_code / 100)}xx`
        statusCodes[group] = (statusCodes[group] || 0) + 1
      }

      totalReqSize += r.request_size || 0
      totalResSize += r.size || 0

      if (r.latency && r.latency > 0) {
        totalLatency += r.latency
        latencyCount++
      }

      if (r.host) hosts.add(r.host)
    }

    return {
      total: requests.length,
      methods,
      statusCodes,
      totalReqSize,
      totalResSize,
      avgLatency: latencyCount > 0 ? Math.round(totalLatency / latencyCount) : 0,
      uniqueHosts: hosts.size,
      intercepted: intercepts.length,
    }
  }, [requests, intercepts])

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`
  }

  const methodOrder = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"]
  const sortedMethods = Object.entries(stats.methods).sort((a, b) => {
    const ia = methodOrder.indexOf(a[0])
    const ib = methodOrder.indexOf(b[0])
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 flex flex-col gap-5 max-w-5xl mx-auto">
        {/* Connection Banner */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${isConnected
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-red-500/5 border-red-500/20"
        }`}>
          {isConnected ? <Wifi className="size-4 text-emerald-400" /> : <WifiOff className="size-4 text-red-400" />}
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isConnected ? "text-emerald-400" : "text-red-400"}`}>
            {isConnected ? "Proxy Engine Online" : "Disconnected"}
          </span>
          <span className="text-[10px] text-muted-foreground/50 ml-auto font-mono">
            Uptime: {formatUptime(uptime)}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Activity} label="Total Requests" value={stats.total.toLocaleString()} color="sky" />
          <StatCard icon={Network} label="Unique Hosts" value={stats.uniqueHosts} color="purple" />
          <StatCard icon={Zap} label="Avg Latency" value={`${stats.avgLatency} ms`} color="amber" />
          <StatCard icon={Lock} label="Intercepted" value={stats.intercepted} sub={isInterceptEnabled ? "Active" : "Disabled"} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Method Distribution */}
          <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
            <div className="h-8 flex items-center px-4 border-b border-border/10 bg-muted/10">
              <TrendingUp className="size-3 text-[var(--accent)] mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Method Distribution</span>
            </div>
            <div className="p-4 flex flex-col gap-2.5">
              {sortedMethods.length === 0 ? (
                <div className="text-[11px] text-muted-foreground/30 text-center py-6">No data yet</div>
              ) : (
                sortedMethods.map(([m, c]) => <MethodBar key={m} method={m} count={c} total={stats.total} />)
              )}
            </div>
          </div>

          {/* Status Codes & Transfer */}
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
              <div className="h-8 flex items-center px-4 border-b border-border/10 bg-muted/10">
                <Activity className="size-3 text-emerald-400 mr-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Response Codes</span>
              </div>
              <div className="grid grid-cols-4 divide-x divide-border/10">
                {["2xx", "3xx", "4xx", "5xx"].map(code => (
                  <div key={code} className="p-3 text-center">
                    <div className={`text-sm font-bold tabular-nums ${
                      code === "2xx" ? "text-emerald-400" :
                      code === "3xx" ? "text-[var(--accent)]" :
                      code === "4xx" ? "text-amber-400" : "text-red-400"
                    }`}>{stats.statusCodes[code] || 0}</div>
                    <div className="text-[9px] font-mono text-muted-foreground/40 uppercase">{code}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Upload} label="Total Sent" value={formatBytes(stats.totalReqSize)} color="sky" />
              <StatCard icon={Download} label="Total Received" value={formatBytes(stats.totalResSize)} color="emerald" />
            </div>

            {/* System Info */}
            <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
              <div className="h-8 flex items-center px-4 border-b border-border/10 bg-muted/10">
                <Cpu className="size-3 text-purple-400 mr-2" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">System</span>
              </div>
              <div className="grid grid-cols-2 divide-x divide-border/10">
                <div className="p-3 flex items-center gap-2">
                  <MemoryStick className="size-3 text-muted-foreground/30" />
                  <div>
                    <div className="text-[9px] text-muted-foreground/40 uppercase">Engine</div>
                    <div className="text-[11px] font-mono text-foreground/70">Go + Wails v2</div>
                  </div>
                </div>
                <div className="p-3 flex items-center gap-2">
                  <HardDrive className="size-3 text-muted-foreground/30" />
                  <div>
                    <div className="text-[9px] text-muted-foreground/40 uppercase">DB Mode</div>
                    <div className="text-[11px] font-mono text-foreground/70">SQLite WAL</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Export / Import Section migrated here */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
            <div className="h-8 flex items-center px-4 border-b border-border/10 bg-muted/10">
              <Save className="size-3 text-[var(--accent)] mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Export Session</span>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportSession} className="text-[10px] uppercase font-bold tracking-widest h-8 flex-1">
                  Full JSON Export
                </Button>
                <Button variant="outline" size="sm" onClick={exportLightweight} className="text-[10px] uppercase font-bold tracking-widest h-8 flex-1">
                  Lightweight Export
                </Button>
              </div>
              {lastExport && <span className="text-[9px] text-muted-foreground/50 font-mono">Last export: {lastExport}</span>}
            </div>
          </div>
          <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
            <div className="h-8 flex items-center px-4 border-b border-border/10 bg-muted/10">
              <Download className="size-3 text-emerald-400 mr-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Import Session</span>
            </div>
            <div className="p-4 flex flex-col gap-3 h-[88px] justify-center">
              <Button variant="outline" size="sm" onClick={importSession} className="text-[10px] uppercase font-bold tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 w-fit h-8">
                <Upload className="size-3 mr-2" /> Restore File
              </Button>
            </div>
          </div>
        </div>

      </div>
    </ScrollArea>
  )
}

function ProfileTab() {
  const [proxyPool, setProxyPool] = useState("")
  const [rotationMode, setRotationMode] = useState("per_request")
  const [rotationValue, setRotationValue] = useState("1")
  const [dnsMode, setDnsMode] = useState("system")
  const [dnsValue, setDnsValue] = useState("")
  const [ja3Profile, setJa3Profile] = useState("chrome_122")
  const [checkResults, setCheckResults] = useState<{url: string, ok: boolean, latency: number}[]>([])
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    const loadSetting = (key: string, setter: (v: string) => void, def: string) => {
      // @ts-ignore
      App.GetSetting(key, def).then(setter).catch(() => {})
    }
    loadSetting("proxy_pool", setProxyPool, "")
    loadSetting("rotation_mode", setRotationMode, "per_request")
    loadSetting("rotation_value", setRotationValue, "1")
    loadSetting("dns_mode", setDnsMode, "system")
    loadSetting("dns_value", setDnsValue, "")
    loadSetting("ja3_profile", setJa3Profile, "chrome_122")
  }, [])

  const saveSetting = async (key: string, value: string) => {
    await App.SetSetting(key, value)
  }

  const saveAndApply = async () => {
    await saveSetting("proxy_pool", proxyPool)
    await saveSetting("rotation_mode", rotationMode)
    await saveSetting("rotation_value", rotationValue)
    await saveSetting("dns_mode", dnsMode)
    await saveSetting("dns_value", dnsValue)
    await saveSetting("ja3_profile", ja3Profile)
    // @ts-ignore
    await App.RestartProxy()
  }

  const checkPool = async () => {
    setChecking(true)
    try {
      // @ts-ignore
      const results = await App.CheckProxyPool(proxyPool)
      setCheckResults(results || [])
    } catch { setCheckResults([]) }
    setChecking(false)
  }

  const removeDeadProxies = () => {
    const dead = new Set(checkResults.filter(r => !r.ok).map(r => r.url))
    const lines = proxyPool.split("\n").filter(l => !dead.has(l.trim()))
    setProxyPool(lines.join("\n"))
    setCheckResults([])
  }

  const rotationModes = [
    { id: "per_request", label: "Per Request", desc: "Rotate every N requests" },
    { id: "per_session", label: "Per Session", desc: "Bind IP to session" },
    { id: "interval", label: "Interval", desc: "Rotate every N seconds" },
  ]

  const dnsModes = [
    { id: "system", label: "System" },
    { id: "custom_ip", label: "Custom IP" },
    { id: "doh", label: "DoH" },
    { id: "dot", label: "DoT" },
  ]

  const ja3Profiles = [
    { id: "chrome_122", label: "Chrome 122" },
    { id: "firefox_121", label: "Firefox 121" },
    { id: "safari_17", label: "Safari 17" },
    { id: "random", label: "Randomized" },
    { id: "go_default", label: "Go Default (No Spoof)" },
  ]

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-5">

        {/* ── Section 2: Upstream Proxy Pool ──────────────────────── */}
        <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
          <div className="h-9 flex items-center px-4 border-b border-border/10 bg-muted/10">
            <Network className="size-3 text-emerald-400 mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">Upstream Proxy Pool</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <p className="text-[10px] text-muted-foreground/50 leading-relaxed">
              Enter proxy list (one per line). Supported: <code className="text-emerald-400/60">socks5://</code> <code className="text-[var(--accent)]/60">http://</code> <code className="text-purple-400/60">vless://</code> <code className="text-amber-400/60">vmess://</code> <code className="text-red-400/60">trojan://</code> <code className="text-pink-400/60">ss://</code> <code className="text-cyan-400/60">hysteria2://</code> <code className="text-teal-400/60">tuic://</code>
            </p>
            <textarea
              value={proxyPool}
              onChange={e => setProxyPool(e.target.value)}
              placeholder={"socks5://user:pass@127.0.0.1:1080\nvless://uuid@host:443?security=reality&sni=...\nvmess://base64config\ntrojan://password@host:443\nss://method:password@host:port\nhysteria2://auth@host:port\ntuic://uuid:password@host:port"}
              className="w-full h-32 text-[11px] font-mono bg-background/50 border border-border/30 rounded-md p-3 resize-y focus:border-emerald-500/50 outline-none text-foreground/80 placeholder:text-muted-foreground/20"
              rows={6}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm" onClick={checkPool} disabled={checking}
                className="h-8 text-[10px] uppercase font-bold tracking-widest gap-2 border-sky-500/30 text-[var(--accent)] hover:bg-sky-500/10"
              >
                <RefreshCw className={`size-3 ${checking ? "animate-spin" : ""}`} /> Check Pool
              </Button>
              <Button
                variant="outline" size="sm" onClick={saveAndApply}
                className="h-8 text-[10px] uppercase font-bold tracking-widest gap-2 ml-auto border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Save className="size-3" /> Apply All
              </Button>
            </div>

            {/* Check results */}
            {checkResults.length > 0 && (
              <div className="border border-border/20 rounded-md overflow-hidden">
                <div className="max-h-40 overflow-auto">
                  {checkResults.map((r, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono border-b border-border/10 last:border-b-0 ${r.ok ? "text-emerald-400/70" : "text-red-400/70 bg-red-500/5"}`}>
                      {r.ok ? <CheckCircle className="size-3" /> : <XCircle className="size-3" />}
                      <span className="flex-1 truncate">{r.url}</span>
                      <span className="shrink-0">{r.ok ? `${r.latency}ms` : "DEAD"}</span>
                    </div>
                  ))}
                </div>
                {checkResults.some(r => !r.ok) && (
                  <div className="p-2 bg-red-500/5 border-t border-border/20 flex items-center justify-between">
                    <span className="text-[10px] text-red-400/60">{checkResults.filter(r => !r.ok).length} dead proxies found</span>
                    <Button variant="outline" size="sm" onClick={removeDeadProxies} className="h-7 text-[9px] uppercase font-bold border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1">
                      <Trash2 className="size-2.5" /> Remove Dead
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 3: IP Rotation ─────────────────────────────── */}
        <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
          <div className="h-9 flex items-center px-4 border-b border-border/10 bg-muted/10">
            <RotateCcw className="size-3 text-amber-400 mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">IP Rotation Logic</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex bg-muted/10 rounded-md p-1 border border-border/20 w-fit">
              {rotationModes.map(m => (
                <button
                  key={m.id}
                  onClick={() => setRotationMode(m.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all duration-200 ${rotationMode === m.id ? "bg-amber-500 shadow-sm text-amber-950" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground/40 border-l-2 border-amber-500/30 pl-2">
              {rotationModes.find(m => m.id === rotationMode)?.desc}
            </p>
            {rotationMode !== "per_session" && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  {rotationMode === "per_request" ? "Every N requests:" : "Every N seconds:"}
                </span>
                <Input
                  type="number" min="1" value={rotationValue}
                  onChange={e => setRotationValue(e.target.value)}
                  className="w-24 h-8 text-[11px] font-mono bg-background/50 border-border/30"
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Section 4: DNS Privacy ─────────────────────────────── */}
        <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
          <div className="h-9 flex items-center px-4 border-b border-border/10 bg-muted/10">
            <Globe className="size-3 text-[var(--accent)] mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">DNS Privacy</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="flex bg-muted/10 rounded-md p-1 border border-border/20 w-fit">
              {dnsModes.map(m => (
                <button
                  key={m.id}
                  onClick={() => setDnsMode(m.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all duration-200 ${dnsMode === m.id ? "bg-sky-500 shadow-sm text-sky-950" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {dnsMode !== "system" && (
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center h-8 overflow-hidden rounded-md border border-border/30 bg-background/50 focus-within:border-sky-500/50">
                  <div className="px-2 bg-muted/10 border-r border-border/20 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 h-full flex items-center">
                    {dnsMode === "custom_ip" ? "IP" : dnsMode === "doh" ? "URL" : "HOST:PORT"}
                  </div>
                  <Input
                    value={dnsValue}
                    onChange={e => setDnsValue(e.target.value)}
                    placeholder={dnsMode === "custom_ip" ? "1.1.1.1" : dnsMode === "doh" ? "https://cloudflare-dns.com/dns-query" : "1.1.1.1:853"}
                    className="h-full text-[11px] font-mono bg-transparent border-0 flex-1 px-2 shadow-none focus-visible:ring-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 5: TLS Fingerprinting (JA3) ────────────────── */}
        <div className="rounded-lg border border-border/20 bg-muted/5 overflow-hidden">
          <div className="h-9 flex items-center px-4 border-b border-border/10 bg-muted/10">
            <Lock className="size-3 text-red-400 mr-2" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">TLS Fingerprinting (JA3)</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
              Impersonate a real browser at the TLS handshake level. Defeats JA3-based WAFs (Cloudflare, Akamai).
            </p>
            <div className="flex bg-muted/10 rounded-md p-1 border border-border/20 w-fit flex-wrap gap-0.5">
              {ja3Profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setJa3Profile(p.id)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all duration-200 ${ja3Profile === p.id ? "bg-red-500 shadow-sm text-red-950" : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/20"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </ScrollArea>
  )
}

// ─── Scan Tab (Stub) ─────────────────────────────────────────────────────────

function ScanTab() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
      <Radar className="size-12 text-muted-foreground/10 mb-4" />
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-2">Scanner</h3>
      <p className="text-[10px] text-muted-foreground/30 max-w-xs">Automated vulnerability scanning is coming in a future release.</p>
    </div>
  )
}

// ─── Dashboard Module ────────────────────────────────────────────────────────

export function DashboardModule() {
  return (
    <Tabs defaultValue="status" className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-3 shrink-0 bg-background/40 backdrop-blur-md z-30">
        <TabsList className="h-9 bg-muted/5 gap-1 p-1 border-b-0 rounded-lg">
          <TabsTrigger value="status" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-sky-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
            Status
          </TabsTrigger>
          <TabsTrigger value="profile" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
            Profile
          </TabsTrigger>
          <TabsTrigger value="scan" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
            Scan
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="status" className="flex-1 m-0 overflow-hidden outline-none data-[state=active]:flex data-[state=active]:flex-col">
        <StatusTab />
      </TabsContent>
      <TabsContent value="profile" className="flex-1 m-0 overflow-hidden outline-none data-[state=active]:flex data-[state=active]:flex-col">
        <ProfileTab />
      </TabsContent>
      <TabsContent value="scan" className="flex-1 m-0 overflow-hidden outline-none data-[state=active]:flex data-[state=active]:flex-col">
        <ScanTab />
      </TabsContent>
    </Tabs>
  )
}
