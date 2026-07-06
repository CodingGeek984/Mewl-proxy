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

  const currentMethod = useMemo(() => {
    const lines = currentRequest.split("\n")
    if (lines.length > 0) {
      const parts = lines[0].split(" ")
      if (parts.length > 0) return parts[0] || "GET"
    }
    return "GET"
  }, [currentRequest])

  function changeMethod(newMethod: string) {
    if (!activeId) return
    const lines = currentRequest.split("\n")
    if (lines.length > 0) {
      const parts = lines[0].split(" ")
      if (parts.length > 0) {
        parts[0] = newMethod
        lines[0] = parts.join(" ")
        setEditedRequests(prev => ({ ...prev, [activeId]: lines.join("\n") }))
      }
    }
  }

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
    <div id="repeater-module-container" className="flex h-full overflow-hidden p-2">
      <CyberPanel
        title="Repeater"
        icon={<Repeat2 className="size-3" />}
        className="flex-1 min-w-0"
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* TOP TABS ROW */}
          <div className="flex items-center bg-[var(--tokyo-panel-2)] h-9 border-b border-[var(--tokyo-border-cyan)] shrink-0 overflow-x-auto no-scrollbar px-1">
            {sandboxes.map((sb, idx) => (
              <ContextMenu key={sb.id}>
                <ContextMenuTrigger asChild>
                  <button
                    onClick={(e) => handleClickSandbox(e, sb.id)}
                    onContextMenu={() => handleContextMenu(sb.id)}
                    className={`flex items-center gap-2 px-3 h-7 mx-0.5 rounded-t-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                      activeId === sb.id
                        ? "bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)] border border-[var(--tokyo-border-magenta)] border-b-0"
                        : "text-[var(--tokyo-cyan)]/50 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]"
                    }`}
                  >
                    <span className="opacity-50">[{idx + 1}]</span>
                    <div className="max-w-[100px] truncate" onDoubleClick={(e) => {
                      e.stopPropagation();
                      const newName = prompt("Rename tab:", sb.name);
                      if (newName) renameSandbox(sb.id, newName);
                    }}>
                      {sb.name}
                    </div>
                    <X className="size-3 opacity-30 hover:opacity-100 hover:text-red-400" onClick={(e) => { e.stopPropagation(); deleteSandbox(sb.id); }} />
                  </button>
                </ContextMenuTrigger>
                <ContextMenuContent className="text-[11px]">
                  <ContextMenuItem onClick={() => duplicateSandbox(sb.id)}>Duplicate</ContextMenuItem>
                  <ContextMenuItem onClick={() => {
                    const newName = prompt("Rename tab:", sb.name);
                    if (newName) renameSandbox(sb.id, newName);
                  }}>Rename</ContextMenuItem>
                  <ContextMenuItem onClick={() => deleteSandbox(sb.id)} className="text-red-400">Close</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
            <Button variant="ghost" size="icon" className="size-7 ml-1 text-[var(--tokyo-cyan)]/50 hover:text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)]" onClick={addSandbox}>
              <Plus className="size-4" />
            </Button>
          </div>

          {activeSandbox ? (
            <div className="flex flex-col h-full overflow-hidden">
              {/* TOOLBAR ROW */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--tokyo-panel)] border-b border-[var(--tokyo-border-cyan)]/50 shrink-0 select-none overflow-x-auto no-scrollbar">
                
                {/* Send Button */}
                <Button
                  variant="default"
                  className="h-7 px-4 bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta)] hover:text-white border border-[var(--tokyo-border-magenta)] disabled:opacity-30 font-black uppercase tracking-[0.1em] text-[10px] transition-all shadow-[0_0_10px_rgba(255,0,170,0.2)] active:scale-95 group/send"
                  onClick={handleSend}
                  disabled={activeSandbox.loading}
                >
                  {activeSandbox.loading ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <Send className="size-3 mr-1.5 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5 transition-transform" />}
                  SEND
                </Button>
                
                <div className="w-px h-5 bg-[var(--tokyo-border-cyan)]/50 mx-1 shrink-0" />

                {/* Target Field & HTTP Version */}
                <div className="flex items-center gap-1 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-cyan)]/50 rounded-md p-0.5 h-7">
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className={`size-5 flex items-center justify-center rounded transition-colors ${targetTls ? 'text-[var(--tokyo-green)] bg-[var(--tokyo-green-soft)]' : 'text-amber-400 bg-amber-500/10'}`} onClick={() => {
                          setSandboxes(prev => prev.map(sb => sb.id === activeId ? { ...sb, tls: !sb.tls } : sb));
                        }}>
                          {targetTls ? <Lock className="size-3" /> : <Unlock className="size-3" />}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px]">{targetTls ? "HTTPS Enabled (Click to toggle)" : "HTTP Plaintext (Click to toggle)"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className={`h-5 px-1.5 text-[10px] font-bold ${getMethodClass(currentMethod)} bg-opacity-10 hover:bg-opacity-20 gap-1 flex items-center`}>
                        {currentMethod}
                        <ChevronDownIcon className="size-2.5 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="text-[10px] min-w-[100px] border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)]">
                      <DropdownMenuLabel className="p-1 uppercase tracking-widest text-[9px] opacity-50 text-[var(--tokyo-cyan)]">Method</DropdownMenuLabel>
                      {["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].map(m => (
                        <DropdownMenuItem key={m} onClick={() => changeMethod(m)} className={`gap-2 ${currentMethod === m ? "text-[var(--tokyo-magenta)] bg-[var(--tokyo-magenta-soft)]" : "text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)]"}`}>
                          {currentMethod === m && <Check className="size-3" />}
                          <span className={`${getMethodClass(m)} font-bold`}>{m}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <div className="w-px h-3 bg-[var(--tokyo-border-cyan)]/50 mx-0.5" />

                  <MonoInput
                    value={targetHost}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = e.target.value
                      setSandboxes(prev => prev.map(sb => sb.id === activeId ? { ...sb, host: val } : sb))
                    }}
                    className="h-5 w-[180px] bg-transparent border-0 focus-visible:ring-0 text-[10px] font-bold tracking-tight text-[var(--tokyo-cyan)] placeholder:text-[var(--tokyo-cyan)]/30"
                    placeholder="host:port (e.g. 192.168.1.1:8080)"
                  />

                  <div className="w-px h-3 bg-[var(--tokyo-border-cyan)]/50 mx-0.5" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[9px] font-mono text-[var(--tokyo-cyan)]/70 hover:text-[var(--tokyo-cyan)] gap-1 flex items-center">
                        {httpVersion}
                        <ChevronDownIcon className="size-2.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-[10px] min-w-[100px] border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)]">
                      <DropdownMenuLabel className="p-1 uppercase tracking-widest text-[9px] opacity-50 text-[var(--tokyo-cyan)]">HTTP Version</DropdownMenuLabel>
                      {HTTP_VERSIONS.map(v => (
                        <DropdownMenuItem key={v} onClick={() => setHttpVersion(v)} className={`gap-2 ${httpVersion === v ? "text-[var(--tokyo-magenta)] bg-[var(--tokyo-magenta-soft)]" : "text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)]"}`}>
                          {httpVersion === v && <Check className="size-3" />}
                          {v}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="w-px h-5 bg-[var(--tokyo-border-cyan)]/50 mx-1 shrink-0" />

                {/* Response Stats */}
                {activeSandbox.status > 0 && (
                  <div className="flex items-center gap-2 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-cyan)]/50 rounded-md px-2 h-7 font-mono">
                    <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${getStatusClass(activeSandbox.status)} bg-opacity-10`}>
                      {activeSandbox.status}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-[var(--tokyo-cyan)]/70">
                      <span className="flex items-center gap-1"><RotateCw className="size-2.5 text-[var(--tokyo-magenta)]" /> {activeSandbox.time}ms</span>
                      <span className="flex items-center gap-1 font-bold"><Hash className="size-2.5 text-[var(--tokyo-green)]" /> {formatBytes(responseSize)}</span>
                    </div>
                  </div>
                )}
                
                <div className="ml-auto flex items-center gap-1">
                  <TooltipProvider delayDuration={400}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-6 text-[var(--tokyo-cyan)]/50 hover:text-[var(--tokyo-cyan)]" onClick={() => setLayout(layout === "horizontal" ? "vertical" : "horizontal")}>
                          {layout === "horizontal" ? <FlipVertical className="size-3.5 rotate-90" /> : <FlipVertical className="size-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px]">Toggle Layout</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                  ? "w-1.5 bg-[var(--tokyo-border-cyan)] hover:bg-[var(--tokyo-cyan)] transition-colors z-10 cursor-col-resize relative flex items-center justify-center after:absolute after:inset-y-0 after:-left-1 after:-right-1"
                  : "h-1.5 bg-[var(--tokyo-border-cyan)] hover:bg-[var(--tokyo-cyan)] transition-colors z-10 cursor-row-resize relative flex items-center justify-center after:absolute after:inset-x-0 after:-top-1 after:-bottom-1"
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
                      <div className="flex items-center h-8 border-b border-[var(--tokyo-border-cyan)] px-4 bg-[var(--tokyo-panel-2)] shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tokyo-cyan)]/40">Response</span>
                      </div>
                      <div className="flex flex-1 items-center justify-center text-[var(--tokyo-cyan)]/30 bg-transparent">
                        <div className="text-center opacity-50">
                          <Send className="mx-auto mb-2 size-8 text-[var(--tokyo-cyan)]" />
                          <p className="text-[10px] font-mono uppercase tracking-widest">Click SEND to see the response</p>
                        </div>
                      </div>
                    </div>
                  )}
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center text-[var(--tokyo-cyan)]/50 font-mono text-[10px] uppercase">
              <p>Create a sandbox to start</p>
            </div>
          )}
        </div>
      </CyberPanel>
    </div>

  )
}
