"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import {
  Repeat2, Loader2,
  Send, Plus, Check, X, Pencil, Terminal,
  ChevronLeft, ChevronRight, Copy, Trash2, GripVertical, Palette, FolderPlus,
  ChevronDown as ChevronDownIcon,
  Zap,
  RotateCw,
  Globe2,
  RefreshCcw,
  Hash,
  ALargeSmall,
  ShieldCheck,
  Lock,
  Unlock,
  Cookie,
  ArrowRightCircle,
  FlipVertical
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuPortal,
} from "@/components/ui/context-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Inspector } from "@/components/proxy/inspector"
import { useProxyWebsocket } from "@/lib/proxy-store"
import { copyText, toCurlWin, getUniversalCopyItems, type CopyableReq } from "@/components/proxy/modules/traffic-utils"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { MonoInput } from "@/components/proxy/ui/mono-input"
import { getStatusClass, getMethodClass } from "@/lib/mock-data"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import type { Sandbox, SandboxHistoryEntry } from "@/types/proxy"

// ─── Constants ───────────────────────────────────────────────────────

const PRESET_COLORS = [
  { name: "Default", value: "transparent" },
  { name: "Sky", value: "#38bdf8" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Red", value: "#ef4444" },
  { name: "Purple", value: "#a855f7" },
  { name: "Pink", value: "#ec4899" },
]

const HTTP_VERSIONS = ["HTTP/1.0", "HTTP/1.1", "HTTP/2", "HTTP/3"]

// ─── Helpers ─────────────────────────────────────────────────────────

/** Parse Host and TLS from a raw HTTP request */
function parseHostFromRaw(raw: string): { host: string; tls: boolean } {
  const lines = raw.split("\n")
  // Check request line for full URL first
  const firstLine = lines[0] || ""
  const parts = firstLine.split(" ")
  if (parts.length >= 2) {
    const urlPart = parts[1]
    if (urlPart.startsWith("https://") || urlPart.startsWith("http://")) {
      try {
        const url = new URL(urlPart)
        return { host: url.host, tls: url.protocol === "https:" }
      } catch { /* fall through */ }
    }
  }
  // Parse Host header
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.toLowerCase().startsWith("host:")) {
      const host = trimmed.slice(5).trim()
      return { host, tls: host.endsWith(":443") }
    }
  }
  return { host: "localhost", tls: false }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}



// ─── Editable Name ───────────────────────────────────────────────────

function EditableName({
  name,
  onRename,
}: {
  name: string
  onRename: (newName: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function save() {
    if (value.trim()) onRename(value.trim())
    setEditing(false)
  }

  function cancel() {
    setValue(name)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <MonoInput
          ref={inputRef}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel() }}
          className="h-6 w-32 px-1 text-[10px]"
        />
        <Button variant="ghost" size="icon" className="size-4 shrink-0" onClick={save}><Check className="size-2.5" /></Button>
        <Button variant="ghost" size="icon" className="size-4 shrink-0" onClick={cancel}><X className="size-2.5" /></Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className="text-xs font-medium truncate">{name}</span>
      <Button variant="ghost" size="icon" className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setEditing(true)}>
        <Pencil className="size-2.5" />
      </Button>
    </div>
  )
}

// ─── Repeater Module ─────────────────────────────────────────────────

export function RepeaterModule() {
  const { sandboxes, setSandboxes, interacterPayload } = useProxyWebsocket()
  const [activeId, setActiveId] = useState<string>("")
  const [editedRequests, setEditedRequests] = useState<Record<string, string>>({})
  const [layout, setLayout] = useState<"horizontal" | "vertical">("vertical")
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  // Toolbar toggles
  const [updateContentLength, setUpdateContentLength] = useState(true)
  const [followRedirections, setFollowRedirections] = useState(false)
  const [storeCookie, setStoreCookie] = useState(false)
  const [updateHostHeader, setUpdateHostHeader] = useState(true)
  const [lowercaseHeaders, setLowercaseHeaders] = useState(false)
  const [restoreAntiCsrf, setRestoreAntiCsrf] = useState(false)
  const [autoDecode, setAutoDecode] = useState(false)
  const [httpVersion, setHttpVersion] = useState("HTTP/1.1")

  // Initialize active sandbox and edited requests
  useEffect(() => {
    if (sandboxes.length > 0) {
      if (!activeId || !sandboxes.find(s => s.id === activeId)) {
        setActiveId(sandboxes[0].id)
      }

      const newEdited: Record<string, string> = { ...editedRequests }
      let changed = false
      sandboxes.forEach((sb: Sandbox) => {
        if (!(sb.id in newEdited)) {
          newEdited[sb.id] = sb.request
          changed = true
        }
      })
      if (changed) setEditedRequests(newEdited)
    }
  }, [sandboxes, activeId])

  const activeSandbox = sandboxes.find((s) => s.id === activeId)
  const currentRequest = editedRequests[activeId] || ""

  // ─── Grouping Helpers ──────────────────────────────────────────

  const groupedSandboxes = useMemo(() => {
    const groups: Record<string, Sandbox[]> = { "Main": [] }
    sandboxes.forEach(sb => {
      const g = sb.group || "Main"
      if (!groups[g]) groups[g] = []
      groups[g].push(sb)
    })
    return groups
  }, [sandboxes])

  const allGroups = useMemo(() => {
    return Array.from(new Set(sandboxes.map(s => s.group || "Main").filter(Boolean)))
  }, [sandboxes])

  function toggleGroup(group: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  // ─── Drag and Drop ─────────────────────────────────────────────

  function handleDragStart(id: string) {
    setDraggedId(id)
  }

  function handleDragOver(e: React.DragEvent, targetId: string) {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return
    
    // Find indices
    const draggedIdx = sandboxes.findIndex(s => s.id === draggedId)
    const targetIdx = sandboxes.findIndex(s => s.id === targetId)
    
    if (draggedIdx === -1 || targetIdx === -1) return

    const newSandboxes = [...sandboxes]
    const [removed] = newSandboxes.splice(draggedIdx, 1)
    newSandboxes.splice(targetIdx, 0, removed)
    setSandboxes(newSandboxes)
  }

  function handleDrop() {
    setDraggedId(null)
  }

  // ─── Multi-select Context Menu Helpers ─────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function handleClickSandbox(e: React.MouseEvent, id: string) {
    if (e.metaKey || e.ctrlKey) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    } else if (e.shiftKey && sandboxes.length > 0) {
      const lastSelected = Array.from(selectedIds).pop() || activeId
      const targetIdx = sandboxes.findIndex(s => s.id === id)
      const lastIdx = sandboxes.findIndex(s => s.id === lastSelected)
      if (targetIdx !== -1 && lastIdx !== -1) {
        const start = Math.min(targetIdx, lastIdx)
        const end = Math.max(targetIdx, lastIdx)
        const range = sandboxes.slice(start, end + 1).map(s => s.id)
        setSelectedIds(new Set([...selectedIds, ...range]))
      }
    } else {
      setSelectedIds(new Set([id]))
      selectSandbox(id)
    }
  }

  function handleContextMenu(id: string) {
    if (!selectedIds.has(id)) {
      setSelectedIds(new Set([id]))
      selectSandbox(id)
    }
  }

  const { sendToIterater } = useProxyWebsocket()
  
  function getActiveSandboxes() {
    return selectedIds.size > 0 ? sandboxes.filter(s => selectedIds.has(s.id)) : [activeSandbox].filter(Boolean) as Sandbox[]
  }

  function doCopy(type: 'url' | 'host' | 'path' | 'curl' | 'req_headers' | 'res_headers') {
    const sbs = getActiveSandboxes()
    const content = sbs.map(sb => {
      const host = sb.host || "unknown.com"
      const proto = sb.tls ? "https://" : "http://"
      const firstLine = sb.request.split("\n")[0] || ""
      const path = firstLine.split(" ")[1] || "/"
      
      if (type === 'host') return host
      if (type === 'path') return path
      if (type === 'url') return `${proto}${host}${path}`
      if (type === 'req_headers') return sb.request.split("\n\n")[0] || ""
      if (type === 'res_headers') return (sb.response || "").split("\n\n")[0] || ""
      if (type === 'curl') {
        return toCurlWin({
          _uid: sb.id, host, protocol: "HTTP", tls: sb.tls, method: sb.method || "GET",
          path, request_raw: sb.request, response_raw: sb.response, status: sb.status,
          size: 0, time: sb.time, mime: "", source: "repeater", timestamp: Date.now()
        } as any)
      }
      return ""
    }).join("\n")
    copyText(content)
  }

  // Map sandboxes to CopyableReq for universal copy helper
  const getActiveSandboxesAsCopyable = useCallback((): CopyableReq[] => {
    const sbs = getActiveSandboxes()
    return sbs.map(sb => {
      const { host: parsedHost } = parseHostFromRaw(sb.request)
      const host = sb.host || parsedHost
      const path = (sb.request.split("\n")[0] || "").split(" ")[1] || "/"
      return {
        request_raw: sb.request,
        response_raw: sb.response,
        host,
        path: path.split("?")[0],
        query: path.split("?")[1] || "",
        tls: sb.tls
      }
    })
  }, [sandboxes, selectedIds, activeId])

  const copyItems = useMemo(() => getUniversalCopyItems(getActiveSandboxesAsCopyable()), [getActiveSandboxesAsCopyable])

  function doSendToIterater() {
    const sbs = getActiveSandboxes()
    sbs.forEach(sb => {
      // Create mock TrafficEvent
      sendToIterater({
        _uid: `rep-${sb.id}-${Date.now()}`,
        host: sb.host,
        protocol: "HTTP",
        tls: sb.tls,
        method: sb.method,
        path: sb.request.split(" ")[1] || "/",
        request_raw: sb.request,
        response_raw: "",
        status: 0,
        size: 0,
        time: 0,
        mime: "",
        source: "repeater",
        timestamp: Date.now()
      })
    })
  }

  function doBulkGroup(groupName: string) {
    const ids = getActiveSandboxes().map(s => s.id)
    setSandboxes(prev => prev.map(sb => ids.includes(sb.id) ? { ...sb, group: groupName } : sb))
  }

  function doBulkColor(color: string) {
    const ids = getActiveSandboxes().map(s => s.id)
    setSandboxes(prev => prev.map(sb => ids.includes(sb.id) ? { ...sb, color } : sb))
  }


  // Keep target indicator in sync with the parsed or explicitly edited host
  const { host: parsedHost, tls: parsedTls } = parseHostFromRaw(currentRequest)
  const targetHost = activeSandbox?.host || parsedHost
  const targetTls = activeSandbox?.tls ?? parsedTls

  function selectSandbox(id: string) {
    setActiveId(id)
  }

  function addSandbox() {
    const newSb: Sandbox = {
      id: `sb-${Date.now()}`,
      name: `New #${sandboxes.length + 1}`,
      method: "GET",
      host: "",
      request: "GET / HTTP/1.1\nHost: example.com\nAccept: */*",
      response: "",
      status: 0,
      time: 0,
      tls: false,
      loading: false,
      history: [],
      historyIndex: -1,
    }
    setSandboxes((prev) => [...prev, newSb])
    setActiveId(newSb.id)
  }

  function duplicateSandbox(id: string) {
    const src = sandboxes.find(s => s.id === id)
    if (!src) return
    const newSb: Sandbox = {
      ...src,
      id: `sb-${Date.now()}`,
      name: `${src.name} (copy)`,
      history: [],
      historyIndex: -1,
      loading: false,
    }
    setSandboxes((prev) => [...prev, newSb])
    setEditedRequests((prev) => ({ ...prev, [newSb.id]: prev[id] || src.request }))
    setActiveId(newSb.id)
  }

  function deleteSandbox(id: string) {
    setSandboxes((prev) => prev.filter(s => s.id !== id))
    setEditedRequests((prev) => {
      const copy = { ...prev }
      delete copy[id]
      return copy
    })
  }

  function renameSandbox(id: string, newName: string) {
    setSandboxes((prev) => prev.map((sb) => (sb.id === id ? { ...sb, name: newName } : sb)))
  }

  // ─── History navigation ─────────────────────────────────────────

  const navigateHistory = useCallback((direction: "back" | "forward") => {
    if (!activeSandbox) return
    const history = activeSandbox.history || []
    let newIdx = activeSandbox.historyIndex

    if (direction === "back" && newIdx > 0) {
      newIdx--
    } else if (direction === "forward" && newIdx < history.length - 1) {
      newIdx++
    } else {
      return
    }

    const entry = history[newIdx]
    setSandboxes((prev: Sandbox[]) => prev.map((s: Sandbox) => s.id === activeId ? {
      ...s,
      request: entry.request,
      response: entry.response,
      status: entry.status,
      time: entry.time,
      host: entry.host,
      tls: entry.tls,
      historyIndex: newIdx,
    } : s))
    setEditedRequests((prev) => ({ ...prev, [activeId]: entry.request }))
  }, [activeSandbox, activeId, setSandboxes])

  const jumpToHistory = useCallback((idx: number) => {
    if (!activeSandbox) return
    const history = activeSandbox.history || []
    if (idx < 0 || idx >= history.length) return
    const entry = history[idx]
    setSandboxes((prev: Sandbox[]) => prev.map((s: Sandbox) => s.id === activeId ? {
      ...s,
      request: entry.request,
      response: entry.response,
      status: entry.status,
      time: entry.time,
      host: entry.host,
      tls: entry.tls,
      historyIndex: idx,
    } : s))
    setEditedRequests((prev) => ({ ...prev, [activeId]: entry.request }))
  }, [activeSandbox, activeId, setSandboxes])

  const canGoBack = activeSandbox && (activeSandbox.historyIndex ?? 0) > 0
  const canGoForward = activeSandbox && (activeSandbox.historyIndex ?? 0) < ((activeSandbox.history?.length ?? 0) - 1)

  // ─── Send request ───────────────────────────────────────────────

  async function handleSend() {
    if (!activeSandbox || activeSandbox.loading) return

    let finalReq = currentRequest

    // Apply toolbar transformations
    const lines = finalReq.split("\n")
    if (lines.length > 0) {
      // 1. HTTP Version selector logic
      const firstLine = lines[0]
      const parts = firstLine.split(" ")
      if (parts.length >= 3) {
        parts[2] = httpVersion
        lines[0] = parts.join(" ")
      }

      // 2. Header transformations
      let bodyIdx = lines.findIndex(l => l.trim() === "")
      if (bodyIdx === -1) bodyIdx = lines.length

      const headerLines = lines.slice(1, bodyIdx)
      const bodyLines = lines.slice(bodyIdx)
      const body = bodyLines.join("\n").trim()

      const processedHeaders = headerLines.map(line => {
        let [name, ...valueParts] = line.split(":")
        if (!valueParts.length) return line
        
        let value = valueParts.join(":").trim()
        let cleanName = name.trim()

        // Update Host Header
        if (updateHostHeader && cleanName.toLowerCase() === "host") {
          value = targetHost || value
        }

        // Lowercase Headers
        if (lowercaseHeaders) {
          cleanName = cleanName.toLowerCase()
        }

        return `${cleanName}: ${value}`
      })

      // Update Content-Length
      if (updateContentLength) {
        const clIdx = processedHeaders.findIndex(h => h.toLowerCase().startsWith("content-length:"))
        if (body.length > 0) {
          const clHeader = lowercaseHeaders ? `content-length: ${body.length}` : `Content-Length: ${body.length}`
          if (clIdx > -1) processedHeaders[clIdx] = clHeader
          else processedHeaders.push(clHeader)
        } else if (clIdx > -1) {
          processedHeaders.splice(clIdx, 1)
        }
      }

      finalReq = [lines[0], ...processedHeaders, ...bodyLines].join("\n")
    }

    if (interacterPayload && interacterPayload.trim() !== "") {
      finalReq = finalReq.replace(/\{\{interacter\}\}/g, interacterPayload)
    }

    // Parse host and TLS from the actual raw request or use override
    const { host: parsedHost } = parseHostFromRaw(finalReq)
    const host = targetHost || parsedHost
    const tls = targetTls

    setEditedRequests((prev: any) => ({ ...prev, [activeId]: finalReq }))
    setSandboxes((prev: Sandbox[]) => prev.map((s: Sandbox) => s.id === activeId ? { ...s, loading: true, host, tls } : s))
    const start = Date.now()

    try {
      // @ts-ignore
      const resp = await window.go.backend.App.ResendRequest(finalReq, host, tls)
      const duration = Date.now() - start

      let nextReq = finalReq
      if (storeCookie) {
        const respHeaders = resp.split('\n\n')[0].split('\n')
        const setCookies = respHeaders.filter((h: string) => h.toLowerCase().startsWith('set-cookie:'))
        if (setCookies.length > 0) {
          const newCookies = setCookies.map((c: string) => c.split(':')[1].trim().split(';')[0])
          const reqLines = nextReq.split('\n')
          const cookieIdx = reqLines.findIndex((l: string) => l.toLowerCase().startsWith('cookie:'))
          let currentCookies: string[] = []
          if (cookieIdx !== -1) {
            currentCookies = reqLines[cookieIdx].split(/:(.+)/)[1].trim().split(';').map((c: string) => c.trim())
          }
          const cookieMap = new Map<string, string>()
          currentCookies.forEach((c: string) => { const p = c.split('='); if(p[0]) cookieMap.set(p[0], p.slice(1).join('=')) })
          newCookies.forEach((c: string) => { const p = c.split('='); if(p[0]) cookieMap.set(p[0], p.slice(1).join('=')) })
          const finalCookieString = Array.from(cookieMap.entries()).map(([k,v]) => v !== undefined ? `${k}=${v}` : k).join('; ')
          const cookieHeader = lowercaseHeaders ? `cookie: ${finalCookieString}` : `Cookie: ${finalCookieString}`
          
          if (cookieIdx !== -1) reqLines[cookieIdx] = cookieHeader
          else {
            let bodyIdx = reqLines.findIndex((l: string) => l.trim() === '')
            if (bodyIdx === -1) bodyIdx = reqLines.length
            reqLines.splice(bodyIdx, 0, cookieHeader)
          }
          nextReq = reqLines.join('\n')
          
          if (nextReq !== finalReq) {
            setEditedRequests((prev: any) => ({ ...prev, [activeId]: nextReq }))
          }
        }
      }

      // Parse status code from response
      const statusLine = resp.split('\n')[0]
      const statusMatch = statusLine.match(/HTTP\/[\d.]+\s+(\d+)/)
      const status = statusMatch ? parseInt(statusMatch[1]) : 200

      // Create history entry
      const historyEntry: SandboxHistoryEntry = {
        request: nextReq,
        response: resp,
        status,
        time: duration,
        host,
        tls,
        timestamp: Date.now(),
      }

      setSandboxes((prev: Sandbox[]) => prev.map((s: Sandbox) => s.id === activeId ? {
        ...s,
        response: resp,
        status,
        time: duration,
        loading: false,
        host,
        tls,
        method: finalReq.split(' ')[0] || s.method,
        history: [...(s.history || []), historyEntry],
        historyIndex: (s.history || []).length,
      } : s))
    } catch (err: any) {
      const duration = Date.now() - start
      const errMsg = err?.message || String(err)

      const historyEntry: SandboxHistoryEntry = {
        request: finalReq,
        response: `Error: ${errMsg}`,
        status: 0,
        time: duration,
        host,
        tls,
        timestamp: Date.now(),
      }

      setSandboxes((prev: Sandbox[]) => prev.map((s: Sandbox) => s.id === activeId ? {
        ...s,
        loading: false,
        response: `Error: ${errMsg}`,
        status: 0,
        time: duration,
        host,
        history: [...(s.history || []), historyEntry],
        historyIndex: (s.history || []).length,
      } : s))
    }
  }

  // ─── Ctrl+Enter to send ─────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault()
        handleSend()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [activeSandbox, activeId, currentRequest])

  const historyLength = activeSandbox?.history?.length ?? 0
  const historyIdx = activeSandbox?.historyIndex ?? -1
  const responseSize = activeSandbox?.response ? new Blob([activeSandbox.response]).size : 0

  return (
    <div id="repeater-module-container" className="flex h-full p-2 overflow-hidden gap-2">
      <ResizablePanelGroup direction="horizontal" className="flex-1 gap-2">
        {/* Sandboxes sidebar */}
        <ResizablePanel defaultSize={20} minSize={15} className="flex flex-col">
          <CyberPanel
            title="Sandboxes"
            icon={<Terminal className="size-3" />}
            className="h-full"
            actions={
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-[var(--accent)]" onClick={addSandbox}>
                  <Plus className="size-3.5" />
                </Button>
              </div>
            }
          >
            <ScrollArea className="h-full">
              <div className="flex flex-col py-1">
                {Object.entries(groupedSandboxes).map(([group, groupSandboxes]) => (
                  <div key={group} className="flex flex-col mb-1">
                    {/* Group Header */}
                    {allGroups.length > 1 && (
                      <div 
                        className="flex items-center gap-1.5 px-3 py-1 bg-muted/20 border-y border-border/5 cursor-pointer hover:bg-muted/30 transition-all select-none group"
                        onClick={() => toggleGroup(group)}
                      >
                        <ChevronDownIcon className={`size-3 text-muted-foreground/30 transition-transform duration-200 ${collapsedGroups.has(group) ? "-rotate-90" : ""}`} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{group}</span>
                        <span className="text-[9px] font-mono text-muted-foreground/20 ml-auto">{groupSandboxes.length}</span>
                      </div>
                    )}
                    
                    {!collapsedGroups.has(group) && groupSandboxes.map((sb) => (
                      <ContextMenu key={sb.id}>
                        <ContextMenuTrigger asChild>
                          <div
                            draggable
                            onDragStart={() => handleDragStart(sb.id)}
                            onDragOver={(e) => handleDragOver(e, sb.id)}
                            onDrop={handleDrop}
                            onDragEnd={handleDrop}
                            role="button"
                            tabIndex={0}
                            className={`group/sb flex flex-col gap-0.5 px-3 py-2 text-left transition-all cursor-pointer hover:bg-accent/40 relative 
                              ${activeId === sb.id ? "border-r-2 border-sky-500 shadow-[inset_0_0_20px_rgba(56,189,248,0.05)]" : ""} 
                              ${selectedIds.has(sb.id) ? "bg-sky-500/10" : ""}
                              ${draggedId === sb.id ? "opacity-30 scale-95" : "opacity-100"}`}
                            onClick={(e) => handleClickSandbox(e, sb.id)}
                            onContextMenu={() => handleContextMenu(sb.id)}
                          >
                            {/* Color Bar */}
                            {sb.color && sb.color !== "transparent" && (
                              <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: sb.color }} />
                            )}

                            <div className="flex items-center justify-between gap-2 min-w-0">
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <GripVertical className="size-3 text-muted-foreground/10 group-hover/sb:text-muted-foreground/30 transition-colors shrink-0 cursor-grab" />
                                {sb.color && sb.color !== "transparent" && (
                                  <div className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: sb.color }} />
                                )}
                                <div className="truncate flex-1 min-w-0">
                                  <EditableName
                                    name={sb.name}
                                    onRename={(newName) => renameSandbox(sb.id, newName)}
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover/sb:opacity-100 transition-opacity shrink-0">
                                {sb.loading && <Loader2 className="size-3 animate-spin text-[var(--accent)]" />}
                                <Button variant="ghost" size="icon" className="size-5 text-muted-foreground/40 hover:text-[var(--accent)]" onClick={(e) => { e.stopPropagation(); duplicateSandbox(sb.id) }}>
                                  <Copy className="size-2.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-5 text-muted-foreground/40 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteSandbox(sb.id) }}>
                                  <Trash2 className="size-2.5" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 pl-4 ml-0.5">
                              <span className={`text-[10px] font-mono font-bold shrink-0 ${getMethodClass(sb.method)}`}>{sb.method}</span>
                              <span className="text-[10px] font-mono text-muted-foreground/60 truncate tracking-tighter flex-1">{sb.host}</span>
                              {sb.status > 0 && (
                                <Badge variant="outline" className={`text-[8px] px-1 py-0 ml-auto shrink-0 ${getStatusClass(sb.status)}`}>{sb.status}</Badge>
                              )}
                            </div>
                          </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-48 text-[11px]">
                          <ContextMenuLabel className="text-[10px] uppercase tracking-widest opacity-50">
                            SELECTED {selectedIds.size > 1 ? `(${selectedIds.size})` : ''}
                          </ContextMenuLabel>
                          <ContextMenuSeparator />
                          <ContextMenuSub>
                            <ContextMenuSubTrigger className="gap-2">
                              <Copy className="size-3.5" /> Copy Value
                            </ContextMenuSubTrigger>
                            <ContextMenuPortal>
                              <ContextMenuSubContent className="text-[11px] min-w-[200px]">
                                {copyItems.map((ci: any, idx: number) => 
                                  ci.type === "separator" 
                                    ? <ContextMenuSeparator key={idx} />
                                    : (
                                      <ContextMenuItem key={idx} onClick={ci.action} className="gap-2">
                                        {ci.icon}
                                        {ci.label}
                                      </ContextMenuItem>
                                    )
                                )}
                              </ContextMenuSubContent>
                            </ContextMenuPortal>
                          </ContextMenuSub>
                          <ContextMenuSeparator />

                          <ContextMenuItem onClick={() => doSendToIterater()} className="gap-2"><RefreshCcw className="size-3.5 text-[var(--accent)]" /> Send to Iterater</ContextMenuItem>

                          <ContextMenuSeparator />

                          <ContextMenuSub>
                            <ContextMenuSubTrigger className="gap-2"><FolderPlus className="size-3.5" /> Move to Group</ContextMenuSubTrigger>
                            <ContextMenuPortal>
                              <ContextMenuSubContent className="text-[11px] min-w-[150px]">
                                {allGroups.map(g => (
                                  <ContextMenuItem key={g} onClick={() => doBulkGroup(g)} className="gap-2">
                                    <Hash className="size-3 text-muted-foreground/50" /> {g}
                                  </ContextMenuItem>
                                ))}
                                <ContextMenuSeparator />
                                <ContextMenuItem onClick={() => {
                                  let g = prompt("New group name:")
                                  if (g) doBulkGroup(g)
                                }} className="gap-2">
                                  <Plus className="size-3" /> New Group...
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem onClick={() => doBulkGroup("")}>Remove from Group</ContextMenuItem>
                              </ContextMenuSubContent>
                            </ContextMenuPortal>
                          </ContextMenuSub>

                          <ContextMenuSub>
                            <ContextMenuSubTrigger className="gap-2"><Palette className="size-3.5" /> Change Color</ContextMenuSubTrigger>
                            <ContextMenuPortal>
                              <ContextMenuSubContent className="text-[11px] min-w-[120px]">
                                {PRESET_COLORS.map(c => (
                                  <ContextMenuItem key={c.name} onClick={() => doBulkColor(c.value)} className="gap-2">
                                    <div className="size-2 rounded-full border border-border/20" style={{ backgroundColor: c.value }} /> {c.name}
                                  </ContextMenuItem>
                                ))}
                              </ContextMenuSubContent>
                            </ContextMenuPortal>
                          </ContextMenuSub>

                          <ContextMenuSeparator />
                          <ContextMenuItem onClick={() => selectedIds.forEach(id => duplicateSandbox(id))} className="gap-2"><Copy className="size-3.5" /> Duplicate</ContextMenuItem>
                          <ContextMenuItem onClick={() => selectedIds.forEach(id => deleteSandbox(id))} className="gap-2 text-red-400"><Trash2 className="size-3.5" /> Delete</ContextMenuItem>
                        </ContextMenuContent>
                      </ContextMenu>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CyberPanel>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-transparent hover:bg-sky-500/20 transition-colors" />

        {/* Main area */}
        <ResizablePanel defaultSize={80} minSize={30} className="flex flex-col">
          {activeSandbox ? (
            <CyberPanel
              title={activeSandbox.name}
              icon={<Repeat2 className="size-3" />}
              className="h-full"
              actions={
                <div className="flex items-center gap-2 pr-1">
                  {/* Response Stats (Enlarged) */}
                  {activeSandbox.status > 0 && (
                    <div className="flex items-center gap-2 bg-background/50 border border-border/20 rounded-md px-2 h-7 font-mono animate-in fade-in slide-in-from-right-2 duration-300">
                      <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[11px] font-bold ${getStatusClass(activeSandbox.status)} bg-opacity-10 border border-current border-opacity-20`}>
                        <Zap className="size-3" />
                        {activeSandbox.status}
                      </div>
                      <div className="flex flex-col justify-center -space-y-1">
                        <div className="text-[9px] text-muted-foreground/60 flex items-center gap-1 italic">
                          <RotateCw className="size-2.5" /> {activeSandbox.time}ms
                        </div>
                        <div className="text-[9px] text-muted-foreground/40 flex items-center gap-1 font-bold">
                          <Hash className="size-2.5" /> {formatBytes(responseSize)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="w-px h-5 bg-border/20 mx-1 shrink-0" />

                  {/* Target Field & HTTP Version */}
                  <div className="flex items-center gap-1 bg-muted/20 border border-border/10 rounded-md p-0.5 h-8">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={`size-5 flex items-center justify-center rounded transition-colors ${targetTls ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                            {targetTls ? <Lock className="size-3" /> : <Unlock className="size-3" />}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">{targetTls ? "HTTPS Enabled" : "HTTP Plaintext"}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <MonoInput
                      value={targetHost}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const val = e.target.value
                        setSandboxes(prev => prev.map(sb => sb.id === activeId ? { ...sb, host: val } : sb))
                      }}
                      className="h-6 w-[180px] bg-transparent border-0 focus-visible:ring-0 text-[10px] font-bold tracking-tight text-[var(--accent)] placeholder:text-muted-foreground/20"
                      placeholder="host:port (e.g. 192.168.1.1:8080)"
                    />

                    <div className="w-px h-3 bg-border/20 mx-0.5" />

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] font-mono text-muted-foreground/60 hover:text-[var(--accent)] gap-1 flex items-center">
                          {httpVersion}
                          <ChevronDownIcon className="size-2.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="text-[10px] min-w-[100px]">
                        <DropdownMenuLabel className="p-1 uppercase tracking-widest text-[9px] opacity-50">HTTP Version</DropdownMenuLabel>
                        {HTTP_VERSIONS.map(v => (
                          <DropdownMenuItem key={v} onClick={() => setHttpVersion(v)} className={`gap-2 ${httpVersion === v ? "text-[var(--accent)] bg-sky-500/5" : ""}`}>
                            {httpVersion === v && <Check className="size-3" />}
                            {v}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="w-px h-5 bg-border/20 mx-1 shrink-0" />

                  {/* History navigation (compact) */}
                  <div className="flex items-center gap-0.5 bg-muted/10 rounded-md p-0.5 border border-border/5">
                    <Button variant="ghost" size="icon" className="size-6 text-muted-foreground/50 hover:text-[var(--accent)] disabled:opacity-10" disabled={!canGoBack} onClick={() => navigateHistory("back")}>
                      <ChevronLeft className="size-3.5" />
                    </Button>

                    {historyLength > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] font-mono text-muted-foreground/40 hover:text-[var(--accent)] tabular-nums">
                            {historyIdx + 1}/{historyLength}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="max-h-64 overflow-auto w-56 text-[10px]">
                          {(activeSandbox.history || []).map((entry, i) => (
                            <DropdownMenuItem key={i} className={`font-mono gap-2 ${i === historyIdx ? 'bg-sky-500/10 text-[var(--accent)]' : ''}`} onClick={() => jumpToHistory(i)}>
                              <span className="text-muted-foreground/40 w-4 text-right">#{i + 1}</span>
                              <span className={getStatusClass(entry.status)}>{entry.status || "ERR"}</span>
                              <span className="text-muted-foreground/40 shrink-0">{entry.time}ms</span>
                              <span className="text-muted-foreground/20 ml-auto tabular-nums truncate">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <Button variant="ghost" size="icon" className="size-6 text-muted-foreground/50 hover:text-[var(--accent)] disabled:opacity-10" disabled={!canGoForward} onClick={() => navigateHistory("forward")}>
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>

                  <div className="w-px h-5 bg-border/20 mx-1 shrink-0" />

                  {/* Send button */}
                  <Button
                    variant="default"
                    className="h-8 px-5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40 disabled:opacity-30 font-black uppercase tracking-[0.1em] text-[11px] transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] active:scale-95 group/send"
                    onClick={handleSend}
                    disabled={activeSandbox.loading}
                  >
                    {activeSandbox.loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />}
                    SEND
                  </Button>
                </div>
              }
            >
              <div className="flex flex-col h-full overflow-hidden">
                {/* TOOLBAR ROW (Mini buttons) */}
                <div className="flex items-center gap-1 px-3 py-1 bg-background/40 backdrop-blur-sm border-b border-border/20 shrink-0 select-none overflow-x-auto no-scrollbar">
                  <div className="flex items-center gap-1 py-0.5 px-1 bg-muted/5 rounded-md border border-border/5">
                    <TooltipProvider delayDuration={400}>
                      {/* Content-Length */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`size-6 rounded ${updateContentLength ? 'text-[var(--accent)] bg-sky-500/10' : 'text-muted-foreground/30 hover:text-muted-foreground/80'}`}
                            onClick={() => setUpdateContentLength(!updateContentLength)}
                          >
                            <ALargeSmall className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Auto Content-Length Update</TooltipContent>
                      </Tooltip>

                      {/* Redirections */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`size-6 rounded ${followRedirections ? 'text-emerald-400 bg-emerald-500/10' : 'text-muted-foreground/30 hover:text-muted-foreground/80'}`}
                            onClick={() => setFollowRedirections(!followRedirections)}
                          >
                            <ArrowRightCircle className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Follow Redirections (3xx)</TooltipContent>
                      </Tooltip>

                      {/* Cookies */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`size-6 rounded ${storeCookie ? 'text-amber-400 bg-amber-500/10' : 'text-muted-foreground/30 hover:text-muted-foreground/80'}`}
                            onClick={() => setStoreCookie(!storeCookie)}
                          >
                            <Cookie className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Store Cookie</TooltipContent>
                      </Tooltip>

                      {/* Update Host */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`size-6 rounded ${updateHostHeader ? 'text-purple-400 bg-purple-500/10' : 'text-muted-foreground/30 hover:text-muted-foreground/80'}`}
                            onClick={() => setUpdateHostHeader(!updateHostHeader)}
                          >
                            <Globe2 className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Update Host Header</TooltipContent>
                      </Tooltip>

                      <div className="w-px h-4 bg-border/20 mx-0.5" />

                      {/* Lowercase Headers */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`size-6 rounded ${lowercaseHeaders ? 'text-pink-400 bg-pink-500/10' : 'text-muted-foreground/30 hover:text-muted-foreground/80'}`}
                            onClick={() => setLowercaseHeaders(!lowercaseHeaders)}
                          >
                            <ALargeSmall className="size-3.5 lowercase" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Lowercase Header Names</TooltipContent>
                      </Tooltip>

                      {/* Anti-CSRF */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`size-6 rounded ${restoreAntiCsrf ? 'text-indigo-400 bg-indigo-500/10' : 'text-muted-foreground/30 hover:text-muted-foreground/80'}`}
                            onClick={() => setRestoreAntiCsrf(!restoreAntiCsrf)}
                          >
                            <ShieldCheck className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Restore Anti-CSRF Tokens</TooltipContent>
                      </Tooltip>

                      {/* Auto Decode */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`size-6 rounded ${autoDecode ? 'text-[var(--accent)] bg-sky-500/10' : 'text-muted-foreground/30 hover:text-muted-foreground/80'}`}
                            onClick={() => setAutoDecode(!autoDecode)}
                          >
                            <Zap className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Automatic Decode (URL, Base64, etc.)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="ml-auto flex items-center gap-1">
                    <TooltipProvider delayDuration={400}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground/30 hover:text-[var(--accent)]" onClick={() => setLayout(layout === "horizontal" ? "vertical" : "horizontal")}>
                            {layout === "horizontal" ? <FlipVertical className="size-3.5 rotate-90" /> : <FlipVertical className="size-3.5" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-[10px]">Toggle Layout</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <div className="w-px h-4 bg-border/20 mx-1" />
                    <span className="text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest px-1">Repeater 2.0</span>
                  </div>
                </div>

                <ResizablePanelGroup direction={layout === "vertical" ? "horizontal" : "vertical"} className="flex-1">
                  {/* Request panel */}
                  <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col min-h-0 min-w-0">
                    <Inspector
                      content={currentRequest}
                      className="flex-1"
                      label="Request"
                      readOnly={false}
                      onContentChange={(val) => {
                        setEditedRequests((prev) => ({ ...prev, [activeId]: val }))
                      }}
                    />
                  </ResizablePanel>

                  <ResizableHandle className={layout === "vertical"
                    ? "w-1.5 bg-border/30 hover:bg-sky-500/50 transition-colors z-10 cursor-col-resize relative flex items-center justify-center after:absolute after:inset-y-0 after:-left-1 after:-right-1"
                    : "h-1.5 bg-border/30 hover:bg-sky-500/50 transition-colors z-10 cursor-row-resize relative flex items-center justify-center after:absolute after:inset-x-0 after:-top-1 after:-bottom-1"
                  }
                  />

                  {/* Response panel */}
                  <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col min-h-0 min-w-0">
                    {activeSandbox.response ? (
                      <Inspector
                        content={activeSandbox.response}
                        className="flex-1"
                        label="Response"
                        isResponse={activeSandbox.status > 0}
                      />
                    ) : (
                      <div className="flex h-full flex-col">
                        <div className="flex items-center h-8 border-b border-border/20 px-3 bg-muted/5 shrink-0">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Response</span>
                        </div>
                        <div className="flex flex-1 items-center justify-center text-muted-foreground bg-transparent">
                          <div className="text-center opacity-30">
                            <Send className="mx-auto mb-2 size-8 text-[var(--accent)]" />
                            <p className="text-[10px] font-mono uppercase tracking-widest">Click SEND to see the response</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </CyberPanel>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <p className="text-sm">Create a sandbox to start</p>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

