"use client"
import { useState, useCallback, useRef, useMemo, useEffect } from "react"
import { Play, Square, Pause, Trash2, Copy, Plus, Filter, Zap, ChevronDown, ChevronUp, Search, Settings2, FileText, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { MonacoViewer } from "@/components/proxy/monaco-viewer"
import { Inspector } from "@/components/proxy/inspector"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { useProxyWebsocket } from "@/lib/proxy-store"
import { EventsOn } from "@wailsjs/runtime/runtime"
import { PayloadsTab } from "./iterator-payloads"
import type { AttackSandbox, FuzzResult, AttackType } from "./iterator-types"
import { createDefaultSandbox, statusColor, matchesFilter, DEFAULT_REQUEST } from "./iterator-types"

// ─── Main Module ─────────────────────────────────────────────────────────────
export function IteratorModule() {
  const [sandboxes, setSandboxes] = useState<AttackSandbox[]>([createDefaultSandbox("Attack #1")])
  const [activeSbId, setActiveSbId] = useState(sandboxes[0].id)
  const [activeTab, setActiveTab] = useState<"execution" | "payloads" | "results">("execution")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameVal, setRenameVal] = useState("")
  const editorRef = useRef<any>(null)
  const { requests, pendingIteraterRequest, clearPendingIterater, interacterPayload } = useProxyWebsocket()

  const sb = sandboxes.find(s => s.id === activeSbId) || sandboxes[0]
  const update = useCallback((id: string, patch: Partial<AttackSandbox>) => {
    setSandboxes(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
  }, [])
  const updateActive = useCallback((patch: Partial<AttackSandbox>) => update(activeSbId, patch), [activeSbId, update])

  // Consume "Send to Iterator" from proxy
  useEffect(() => {
    if (pendingIteraterRequest) {
      const req = pendingIteraterRequest
      updateActive({ targetUrl: `${req.tls ? "https" : "http"}://${req.host}`, rawRequest: req.request_raw || DEFAULT_REQUEST })
      clearPendingIterater()
    }
  }, [pendingIteraterRequest, clearPendingIterater, updateActive])

  // Elapsed timer
  useEffect(() => {
    if (sb.state !== "running") return
    const start = Date.now() - sb.elapsed * 1000
    const iv = setInterval(() => update(sb.id, { elapsed: Math.floor((Date.now() - start) / 1000) }), 1000)
    return () => clearInterval(iv)
  }, [sb.state, sb.id, update])

  // Listen for fuzzer events
  useEffect(() => {
    const off1 = EventsOn("fuzzer_result", (r: any) => {
      const sid = r.SessionID || r.session_id || ""
      if (sid && sid !== activeSbId) return
      setSandboxes(prev => prev.map(s => s.id === (sid || activeSbId) ? {
        ...s,
        results: [...s.results, { id: r.ID || r.id, payload: r.Payload || r.payload, statusCode: r.Status || r.status || 0, length: r.Length || r.length || 0, words: r.Words || r.words || 0, lines: r.Lines || r.lines || 0, latency: r.TimeMs || r.time_ms || 0, reflection: r.Reflection || r.reflection || false, error: r.Error || r.error || "", contentType: "" } as FuzzResult],
        progress: { ...s.progress, done: s.progress.done + 1 },
        errorCount: s.errorCount + ((r.Error || r.error) ? 1 : 0),
      } : s))
    })
    const off2 = EventsOn("fuzzer_done", (sid?: string) => {
      const id = sid || activeSbId
      setSandboxes(prev => prev.map(s => s.id === id ? { ...s, state: "done" } : s))
    })
    const off3 = EventsOn("fuzzer_error", (_err: string) => {
      setSandboxes(prev => prev.map(s => s.id === activeSbId ? { ...s, state: "idle" } : s))
    })
    return () => { off1(); off2(); off3() }
  }, [activeSbId])

  // Get inspector data for selected result
  useEffect(() => {
    if (!sb.selectedResultId) return
    // @ts-ignore
    window.go?.backend?.App?.GetFuzzDetail?.(sb.selectedResultId).then((data: any) => {
      if (data) updateActive({ inspectorReq: data.request || "", inspectorRes: data.response || "" })
    }).catch(() => {})
  }, [sb.selectedResultId])

  // Markers
  const markers = useMemo(() => {
    const re = /§([^§]*)§/g; const m: string[] = []; let match
    while ((match = re.exec(sb.rawRequest)) !== null) m.push(match[1])
    return m
  }, [sb.rawRequest])

  // Actions
  const addSandbox = () => {
    const ns = createDefaultSandbox(`Attack #${sandboxes.length + 1}`)
    setSandboxes(p => [...p, ns]); setActiveSbId(ns.id)
  }
  const removeSandbox = (id: string) => {
    if (sandboxes.length <= 1) return
    const next = sandboxes.filter(s => s.id !== id)
    setSandboxes(next)
    if (activeSbId === id) setActiveSbId(next[0].id)
  }
  const startRename = (id: string, name: string) => { setRenamingId(id); setRenameVal(name) }
  const finishRename = () => { if (renamingId) { update(renamingId, { name: renameVal || "Untitled" }); setRenamingId(null) } }

  const addMarker = useCallback(() => {
    const ed = editorRef.current; if (!ed) return
    const sel = ed.getSelection(), mod = ed.getModel(); if (!sel || !mod) return
    ed.executeEdits("iterator", [{ range: sel, text: `§${mod.getValueInRange(sel)}§`, forceMoveMarkers: true }])
    updateActive({ rawRequest: ed.getValue() })
  }, [updateActive])
  const clearMarkers = useCallback(() => updateActive({ rawRequest: sb.rawRequest.replace(/§/g, "") }), [sb.rawRequest, updateActive])
  const autoMarkers = useCallback(() => {
    let m = sb.rawRequest; m = m.replace(/([a-zA-Z0-9_]+)=([^&\s]+)/g, "$1=§$2§"); m = m.replace(/"([^"]+)"\s*:\s*"([^"]+)"/g, '"$1": "§$2§"')
    updateActive({ rawRequest: m })
  }, [sb.rawRequest, updateActive])

  const startFuzz = useCallback(async () => {
    const ps = sb.payloadSets[0]; if (!ps || !ps.config.simpleText?.trim()) return
    const total = ps.config.simpleText.split("\n").filter(Boolean).length * Math.max(1, markers.length || 1)
    updateActive({ state: "running", results: [], progress: { done: 0, total }, elapsed: 0, startTime: Date.now(), errorCount: 0 })
    let req = sb.rawRequest
    if (interacterPayload?.trim()) req = req.replace(/\{\{interacter\}\}/g, interacterPayload)
    // @ts-ignore
    await window.go?.backend?.App?.StartFuzzer?.({
      session_id: sb.id, target_url: sb.targetUrl, raw_request: req,
      payload_configs: sb.payloadSets.map(ps => ps.config), attack_type: sb.attackType,
      fuzz_keyword: sb.fuzzKeyword, threads: sb.options.threads, timeout_ms: sb.options.timeout * 1000, delay_ms: sb.options.delay,
    })
  }, [sb, markers, interacterPayload, updateActive])

  const stopFuzz = useCallback(async () => {
    // @ts-ignore
    await window.go?.backend?.App?.StopFuzzer?.(); updateActive({ state: "idle" })
  }, [updateActive])
  const pauseFuzz = useCallback(async () => {
    if (sb.state === "running") { /* @ts-ignore */ await window.go?.backend?.App?.PauseFuzzer?.(); updateActive({ state: "paused" }) }
    else if (sb.state === "paused") { /* @ts-ignore */ await window.go?.backend?.App?.ResumeFuzzer?.(); updateActive({ state: "running" }) }
  }, [sb.state, updateActive])
  const clearResults = useCallback(() => updateActive({ results: [], progress: { done: 0, total: 0 }, state: "idle", selectedResultId: null, errorCount: 0 }), [updateActive])

  // Sort & filter
  const filteredResults = useMemo(() => {
    let r = sb.results.filter(x => matchesFilter(x, sb.filter))
    if (sb.searchQuery.trim()) { const q = sb.searchQuery.toLowerCase(); r = r.filter(x => x.payload.toLowerCase().includes(q) || String(x.statusCode).includes(q)) }
    if (sb.sortCol) {
      r = [...r].sort((a, b) => { const av = (a as any)[sb.sortCol!], bv = (b as any)[sb.sortCol!]
        return typeof av === "number" ? (sb.sortDir === "asc" ? av - bv : bv - av) : (sb.sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av))) })
    }
    return r
  }, [sb.results, sb.filter, sb.sortCol, sb.sortDir, sb.searchQuery])

  const toggleSort = (col: string) => {
    if (sb.sortCol === col) updateActive({ sortDir: sb.sortDir === "asc" ? "desc" : "asc" })
    else updateActive({ sortCol: col, sortDir: "asc" })
  }
  const pct = sb.progress.total > 0 ? Math.round((sb.progress.done / sb.progress.total) * 100) : 0
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`
  const eta = sb.progress.done > 0 && sb.state === "running" ? Math.round((sb.elapsed / sb.progress.done) * (sb.progress.total - sb.progress.done)) : 0
  const selectedResult = sb.results.find(r => r.id === sb.selectedResultId) || null

  const stateColor = (s: string) => s === "running" ? "#4ade80" : s === "paused" ? "#fbbf24" : s === "done" ? "var(--accent)" : "var(--foreground-subtle)"

  return (
    <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex flex-col h-full overflow-hidden">
      {/* Top Tab Bar — matches Proxy/Dashboard style */}
      <div className="flex items-center shrink-0 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <TabsList className="h-9 bg-muted/5 gap-1 p-1 border-b-0 rounded-lg">
          <TabsTrigger value="execution" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-sky-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
            Execution
          </TabsTrigger>
          <TabsTrigger value="payloads" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-sky-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
            Payloads
          </TabsTrigger>
          <TabsTrigger value="results" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-sky-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
            Results
          </TabsTrigger>
        </TabsList>
        <div className="flex-1" />
        {/* Control buttons — always visible */}
        <div className="flex items-center gap-1.5 mr-2">
          {sb.state !== "idle" && sb.state !== "done" && (
            <span className="text-[9px] font-mono mr-2" style={{ color: 'var(--foreground-muted)' }}>
              {sb.progress.done}/{sb.progress.total} ({pct}%) · {fmt(sb.elapsed)} {eta > 0 && `· ETA ${fmt(eta)}`} {sb.errorCount > 0 && <span className="text-red-400">· {sb.errorCount} err</span>}
            </span>
          )}
          {(sb.state === "idle" || sb.state === "done") ? (
            <Button size="sm" onClick={startFuzz} disabled={!sb.payloadSets[0]?.config?.simpleText?.trim()}
              className="h-7 px-3 text-[10px] uppercase font-bold tracking-widest gap-1.5 text-white"
              style={{ background: 'var(--accent)', boxShadow: '0 0 0 1px rgba(94,106,210,0.5), 0 4px 12px rgba(94,106,210,0.3), inset 0 1px 0 0 rgba(255,255,255,0.15)' }}>
              <Play className="size-3" /> Start
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={pauseFuzz} className="h-7 px-3 text-[10px] uppercase font-bold tracking-widest gap-1.5"
                style={{ color: sb.state === "paused" ? "#4ade80" : "#fbbf24", background: 'rgba(255,255,255,0.05)' }}>
                {sb.state === "paused" ? <Play className="size-3" /> : <Pause className="size-3" />} {sb.state === "paused" ? "Resume" : "Pause"}
              </Button>
              <Button size="sm" variant="ghost" onClick={stopFuzz} className="h-7 px-3 text-[10px] uppercase font-bold tracking-widest gap-1.5"
                style={{ color: '#f87171', background: 'rgba(255,255,255,0.05)' }}>
                <Square className="size-3" /> Stop
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={clearResults} className="h-7 px-2" style={{ color: 'var(--foreground-subtle)' }}>
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sandbox Sidebar — only on Execution tab */}
        {activeTab === "execution" && (
          <div className="w-48 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border-default)' }}>
          <CyberPanel title="Sandboxes" icon={<Zap className="size-3" />} className="h-full rounded-none border-0"
            actions={<Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-[var(--accent)]" onClick={addSandbox}><Plus className="size-3.5" /></Button>}>
            <ScrollArea className="h-full">
              <div className="flex flex-col py-1">
              {sandboxes.map(s => (
                <div key={s.id} onClick={() => setActiveSbId(s.id)}
                  className={`group/sb flex flex-col gap-0.5 px-3 py-2 cursor-pointer transition-all duration-150 hover:bg-accent/10 ${activeSbId === s.id ? "border-r-2 border-[var(--accent)] shadow-[inset_0_0_20px_rgba(94,106,210,0.05)]" : ""}`}
                  style={{ background: activeSbId === s.id ? 'var(--accent-glow)' : 'transparent' }}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="size-2 rounded-full shrink-0" style={{ background: stateColor(s.state), boxShadow: s.state === "running" ? `0 0 6px ${stateColor(s.state)}` : 'none' }} />
                    {renamingId === s.id ? (
                      <input autoFocus value={renameVal} onChange={e => setRenameVal(e.target.value)} onBlur={finishRename} onKeyDown={e => e.key === "Enter" && finishRename()}
                        className="flex-1 text-[10px] font-medium bg-transparent outline-none" style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--accent)' }} />
                    ) : (
                      <span className="flex-1 text-[10px] font-medium truncate" style={{ color: activeSbId === s.id ? 'var(--foreground)' : 'var(--foreground-muted)' }}
                        onDoubleClick={() => startRename(s.id, s.name)}>{s.name}</span>
                    )}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/sb:opacity-100 transition-opacity shrink-0">
                      {sandboxes.length > 1 && (
                        <button onClick={e => { e.stopPropagation(); removeSandbox(s.id) }} style={{ color: 'var(--foreground-subtle)' }}>
                          <Trash2 className="size-2.5 hover:text-red-400 transition-colors" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pl-3.5">
                    <span className="text-[9px] font-mono font-bold shrink-0" style={{ color: 'var(--accent)' }}>{s.attackType.toUpperCase().slice(0, 6)}</span>
                    <span className="text-[9px] font-mono truncate flex-1" style={{ color: 'var(--foreground-subtle)' }}>{s.targetUrl.replace(/^https?:\/\//, '')}</span>
                    {s.state !== "idle" && s.state !== "done" && <span className="text-[8px] font-mono shrink-0" style={{ color: 'var(--foreground-subtle)' }}>{Math.round((s.progress.done / Math.max(1, s.progress.total)) * 100)}%</span>}
                  </div>
                </div>
              ))}
              </div>
            </ScrollArea>
          </CyberPanel>
          </div>
        )}

        {/* Tab Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === "execution" && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Progress bar */}
              {(sb.state === "running" || sb.state === "paused" || sb.state === "done") && (
                <div className="h-0.5 shrink-0 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
                  <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: sb.state === "done" ? "#4ade80" : sb.state === "paused" ? "#fbbf24" : 'var(--accent)', boxShadow: `0 0 8px ${sb.state === "done" ? "#4ade80" : 'var(--accent)'}` }} />
                </div>
              )}
              {/* Connection bar — inline compact */}
              <div className="h-8 flex items-center px-3 gap-3 shrink-0" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--background-elevated)' }}>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>Connection</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px]" style={{ color: 'var(--foreground-subtle)' }}>Threads</span>
                    <input type="number" value={sb.options.threads} onChange={e => updateActive({ options: { ...sb.options, threads: parseInt(e.target.value) || 1 } })}
                      className="w-10 h-5 text-[10px] font-mono text-center rounded bg-transparent outline-none" style={{ border: '1px solid var(--border-default)', color: 'var(--foreground)' }} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px]" style={{ color: 'var(--foreground-subtle)' }}>Timeout</span>
                    <input type="number" value={sb.options.timeout} onChange={e => updateActive({ options: { ...sb.options, timeout: parseInt(e.target.value) || 10 } })}
                      className="w-10 h-5 text-[10px] font-mono text-center rounded bg-transparent outline-none" style={{ border: '1px solid var(--border-default)', color: 'var(--foreground)' }} />
                    <span className="text-[8px]" style={{ color: 'var(--foreground-subtle)' }}>s</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px]" style={{ color: 'var(--foreground-subtle)' }}>Delay</span>
                    <input type="number" value={sb.options.delay} onChange={e => updateActive({ options: { ...sb.options, delay: parseInt(e.target.value) || 0 } })}
                      className="w-10 h-5 text-[10px] font-mono text-center rounded bg-transparent outline-none" style={{ border: '1px solid var(--border-default)', color: 'var(--foreground)' }} />
                    <span className="text-[8px]" style={{ color: 'var(--foreground-subtle)' }}>ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px]" style={{ color: 'var(--foreground-subtle)' }}>Retries</span>
                    <input type="number" value={sb.options.maxRetries} onChange={e => updateActive({ options: { ...sb.options, maxRetries: parseInt(e.target.value) || 0 } })}
                      className="w-8 h-5 text-[10px] font-mono text-center rounded bg-transparent outline-none" style={{ border: '1px solid var(--border-default)', color: 'var(--foreground)' }} />
                  </div>
                </div>
                <div className="w-px h-4" style={{ background: 'var(--border-default)' }} />
                {/* Behavior mini-buttons */}
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>Behavior</span>
                {[
                  { key: "followRedirects" as const, label: "Redir", active: sb.options.followRedirects },
                  { key: "updateContentLength" as const, label: "C-Len", active: sb.options.updateContentLength },
                  { key: "keepAlive" as const, label: "Keep", active: sb.options.keepAlive },
                  { key: "cookieHandling" as const, label: "Cookie", active: sb.options.cookieHandling },
                ].map(b => (
                  <button key={b.key} onClick={() => updateActive({ options: { ...sb.options, [b.key]: !b.active } })}
                    className="h-5 px-1.5 text-[8px] font-bold uppercase tracking-wider rounded transition-all"
                    style={{
                      background: b.active ? 'var(--accent-glow)' : 'transparent',
                      color: b.active ? 'var(--accent)' : 'var(--foreground-subtle)',
                      border: b.active ? '1px solid var(--border-accent)' : '1px solid var(--border-default)',
                    }}>
                    {b.label}
                  </button>
                ))}
              </div>

              {/* Request Template */}
              <div className="flex flex-col flex-1 min-h-0">
                <div className="h-8 flex items-center px-3 gap-2 shrink-0" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--background-elevated)' }}>
                  <FileText className="size-3" style={{ color: 'var(--accent)', opacity: 0.7 }} />
                  <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>Request Template</span>
                  <div className="w-px h-4" style={{ background: 'var(--border-default)' }} />
                  <Select value={sb.attackType} onValueChange={(v: AttackType) => updateActive({ attackType: v })}>
                    <SelectTrigger className="h-6 w-32 bg-transparent border-none text-[10px] uppercase font-bold tracking-wider focus:ring-0" style={{ color: 'var(--accent)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["sniper", "battering ram", "pitchfork", "cluster bomb"] as const).map(t => <SelectItem key={t} value={t} className="text-[10px] uppercase font-bold">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="w-px h-4" style={{ background: 'var(--border-default)' }} />
                  <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--accent)' }} onClick={addMarker}>Add §</Button>
                  <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px] uppercase font-bold tracking-widest text-red-400" onClick={clearMarkers}>Clear §</Button>
                  <Button size="sm" variant="ghost" className="h-5 px-2 text-[10px] uppercase font-bold tracking-widest text-emerald-400" onClick={autoMarkers}>Auto §</Button>
                  <div className="flex-1" />
                  <Button size="sm" variant="ghost" className="h-5 px-2 text-[9px] uppercase gap-1" style={{ color: 'var(--foreground-subtle)' }}
                    onClick={() => { const last = requests[requests.length - 1]; if (last?.request_raw) updateActive({ rawRequest: last.request_raw, targetUrl: `${last.tls ? "https" : "http"}://${last.host}` }) }}>
                    <Copy className="size-2.5" /> Import
                  </Button>
                </div>
                <div className="flex-1 relative">
                  <MonacoViewer content={sb.rawRequest} onChange={v => updateActive({ rawRequest: v || "" })} onMount={ed => editorRef.current = ed} readOnly={false} language="http" />
                </div>
              </div>
            </div>
          )}

          {activeTab === "payloads" && <PayloadsTab markers={markers} payloadSets={sb.payloadSets} onPayloadSetsChange={sets => updateActive({ payloadSets: sets })} />}

          {activeTab === "results" && (
            <ResizablePanelGroup direction="vertical" className="flex-1">
              {/* Progress bar for results */}
              {(sb.state === "running" || sb.state === "paused" || sb.state === "done") && (
                <div className="h-0.5 shrink-0 relative overflow-hidden" style={{ background: 'var(--surface)' }}>
                  <div className="h-full transition-all duration-300" style={{ width: `${pct}%`, background: sb.state === "done" ? "#4ade80" : sb.state === "paused" ? "#fbbf24" : 'var(--accent)', boxShadow: `0 0 8px ${sb.state === "done" ? "#4ade80" : 'var(--accent)'}` }} />
                </div>
              )}
              {/* Results Table */}
              <ResizablePanel defaultSize={60} minSize={20}>
                <div className="flex flex-col h-full">
                  <div className="h-8 flex items-center px-3 gap-2 shrink-0" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--background-elevated)' }}>
                    <Filter className="size-3" style={{ color: 'var(--accent)', opacity: 0.7 }} />
                    <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>Results</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--foreground-muted)' }}>{filteredResults.length}/{sb.results.length}</span>
                    <div className="flex-1" />
                    <div className="flex items-center h-5 px-1.5 w-32 rounded" style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
                      <Search className="size-2.5 mr-1.5" style={{ color: 'var(--foreground-subtle)' }} />
                      <input className="flex-1 bg-transparent border-none outline-none text-[9px] font-mono" style={{ color: 'var(--foreground)' }}
                        placeholder="Search..." value={sb.searchQuery} onChange={e => updateActive({ searchQuery: e.target.value })} />
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => updateActive({ showFilters: !sb.showFilters })}
                      className={`h-5 px-2 text-[9px] uppercase gap-1 ${sb.showFilters ? 'text-purple-400' : ''}`} style={{ color: sb.showFilters ? undefined : 'var(--foreground-subtle)' }}>
                      <Settings2 className="size-2.5" /> Filters {sb.showFilters ? <ChevronUp className="size-2" /> : <ChevronDown className="size-2" />}
                    </Button>
                  </div>
                  {/* Filter panel */}
                  {sb.showFilters && (
                    <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border-default)', background: 'rgba(139,92,246,0.03)' }}>
                      <div className="grid grid-cols-[50px_1fr_1fr] gap-1 mb-1"><span /><span className="text-[8px] font-bold uppercase tracking-widest text-emerald-400/60 text-center">Match</span><span className="text-[8px] font-bold uppercase tracking-widest text-red-400/60 text-center">Filter</span></div>
                      {(["Status:matchCodes:filterCodes:200,301:404", "Size:matchSize:filterSize:1234:0", "Words:matchWords:filterWords::", "Lines:matchLines:filterLines::"] as const).map(row => {
                        const [l, mk, fk, mp, fp] = row.split(":")
                        return (<div key={l} className="grid grid-cols-[50px_1fr_1fr] gap-2 items-center">
                          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>{l}</span>
                          <Input value={(sb.filter as any)[mk]} onChange={e => updateActive({ filter: { ...sb.filter, [mk]: e.target.value } })} placeholder={mp || "Match"}
                            className="h-5 text-[10px] font-mono" style={{ background: 'var(--surface)', borderColor: 'var(--border-default)' }} />
                          <Input value={(sb.filter as any)[fk]} onChange={e => updateActive({ filter: { ...sb.filter, [fk]: e.target.value } })} placeholder={fp || "Filter"}
                            className="h-5 text-[10px] font-mono" style={{ background: 'var(--surface)', borderColor: 'var(--border-default)' }} />
                        </div>)
                      })}
                    </div>
                  )}
                  {/* Table */}
                  <ScrollArea className="flex-1">
                    <table className="w-full">
                      <thead className="sticky top-0 z-10">
                        <tr className="text-[9px] font-bold uppercase tracking-widest select-none" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--background-elevated)', color: 'var(--foreground-subtle)' }}>
                          {[["id","#","w-10"],["payload","Payload",""],["statusCode","Status","w-16"],["length","Length","w-16"],["words","Words","w-14"],["lines","Lines","w-14"],["latency","Time","w-16"],["reflection","Reflect","w-16"]].map(([col,label,w]) => (
                            <th key={col} className={`text-left px-2 py-1.5 ${w} cursor-pointer transition-colors`} onClick={() => toggleSort(col)}
                              onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')} onMouseLeave={e => (e.currentTarget.style.color = 'var(--foreground-subtle)')}>
                              {label} {sb.sortCol === col && (sb.sortDir === "asc" ? "↑" : "↓")}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredResults.length === 0 ? (
                          <tr><td colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2" style={{ color: 'var(--foreground-subtle)' }}>
                              <Zap className="size-8" style={{ opacity: 0.3 }} />
                              <span className="text-[11px] font-mono uppercase tracking-wider">{sb.state === "running" ? "Waiting for results..." : sb.state === "idle" ? "Configure & Start" : "No matches"}</span>
                            </div>
                          </td></tr>
                        ) : filteredResults.map(r => (
                          <tr key={r.id} onClick={() => updateActive({ selectedResultId: r.id })}
                            className="text-[11px] font-mono cursor-pointer transition-all duration-150"
                            style={{ borderBottom: '1px solid var(--border-default)', background: sb.selectedResultId === r.id ? 'var(--accent-glow)' : 'transparent', opacity: r.error ? 0.5 : 1, borderLeft: sb.selectedResultId === r.id ? '2px solid var(--accent)' : '2px solid transparent' }}
                            onMouseEnter={e => { if (sb.selectedResultId !== r.id) e.currentTarget.style.background = 'var(--surface-hover)' }}
                            onMouseLeave={e => { if (sb.selectedResultId !== r.id) e.currentTarget.style.background = 'transparent' }}>
                            <td className="px-2 py-1" style={{ color: 'var(--foreground-subtle)' }}>{filteredResults.indexOf(r) + 1}</td>
                            <td className="px-2 py-1 truncate max-w-[200px]" style={{ color: 'var(--foreground)' }}>{r.payload}</td>
                            <td className={`px-2 py-1 font-bold ${statusColor(r.statusCode)}`}>{r.error ? <AlertTriangle className="size-3 text-red-400 inline" /> : r.statusCode}</td>
                            <td className="px-2 py-1 text-right tabular-nums" style={{ color: 'var(--foreground-muted)' }}>{r.length}</td>
                            <td className="px-2 py-1 text-right tabular-nums" style={{ color: 'var(--foreground-muted)' }}>{r.words}</td>
                            <td className="px-2 py-1 text-right tabular-nums" style={{ color: 'var(--foreground-muted)' }}>{r.lines}</td>
                            <td className="px-2 py-1 text-right tabular-nums" style={{ color: 'var(--foreground-subtle)' }}>{r.latency}ms</td>
                            <td className="px-2 py-1 text-center">{r.reflection ? <span className="text-emerald-400 text-[9px] font-bold">●</span> : <span style={{ color: 'var(--foreground-subtle)' }}>—</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              </ResizablePanel>

              <ResizableHandle className="h-1 bg-transparent transition-colors"
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-glow)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')} />

              {/* Inspector inside Results */}
              <ResizablePanel defaultSize={40} minSize={15}>
                <div className="flex flex-col h-full">
                  <div className="h-8 flex items-center px-1 shrink-0 select-none" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--background-elevated)' }}>
                    {(["request", "response"] as const).map(tab => (
                      <button key={tab} onClick={() => updateActive({ inspectorTab: tab })}
                        className={`h-full px-3 text-[10px] font-black uppercase tracking-[0.15em] transition-all relative ${sb.inspectorTab === tab ? 'text-[var(--accent)] bg-white/5' : 'text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/5'}`}>
                        {tab}
                        {sb.inspectorTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: 'var(--accent)' }} />}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                    {selectedResult ? (
                      sb.inspectorTab === "request"
                        ? <Inspector content={sb.inspectorReq} label="Request" isResponse={false} />
                        : <Inspector content={sb.inspectorRes} label="Response" isResponse={true} />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest font-bold" style={{ color: 'var(--foreground-subtle)' }}>
                        Select a result to inspect
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </div>
    </Tabs>
  )
}
