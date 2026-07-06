import {
    Inbox, AlertCircle, Send, ArrowRightCircle,
    ChevronDown, Power, ShieldCheck, PlayCircle, XCircle, FastForward,
    Search, X, Settings2, Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { useProxyWebsocket } from "@/lib/proxy-store"
import { TrafficTable, useTrafficTable, INTERCEPT_ONLY_VISIBLE } from "@/components/proxy/modules/traffic-table"
import { useTrafficFilter, ContextMenu, SearchSettingsPanel, type CtxState } from "@/components/proxy/modules/traffic-shared"
import type { TrafficEvent, SearchConfig } from "@/types/proxy"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Inspector } from "@/components/proxy/inspector"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { MonoInput } from "@/components/proxy/ui/mono-input"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"

export function InterceptTabV2() {
    const {
        intercepts, isInterceptEnabled, setIsInterceptEnabled,
        sendInterceptAction,
        requestBreakpoint, setRequestBreakpoint, responseBreakpoint, setResponseBreakpoint,
        getSetting, setSetting, sendToRepeater, sendToIterater
    } = useProxyWebsocket()

    const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set())
    const [lastSelectedUid, setLastSelectedUid] = useState<string | null>(null)
    const [editedRequest, setEditedRequest] = useState<string | null>(null)
    const [editedResponse, setEditedResponse] = useState<string | null>(null)
    const [ctxMenu, setCtxMenu] = useState<CtxState | null>(null)
    const [followProxyRules, setFollowProxyRules] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)

    // Local search state (like HTTP History)
    const [searchRaw, setSearchRaw] = useState("")
    const [searchActive, setSearchActive] = useState("")
    const [searchCfg, setSearchCfg] = useState<SearchConfig>({ locations: ["all"], interactionScopes: ["all"], regex: false, negative: false })
    const [isFilterOnly, setIsFilterOnly] = useState(false)

    useEffect(() => {
        getSetting("follow_proxy_rules", "true").then(v => setFollowProxyRules(v === "true"))
    }, [getSetting])

    const toggleFollowProxy = async () => {
        const next = !followProxyRules
        setFollowProxyRules(next)
        await setSetting("follow_proxy_rules", next ? "true" : "false")
    }

    const toggleRequestBreakpoint = () => {
        const next = !requestBreakpoint
        setRequestBreakpoint(next)
        if (next) setIsInterceptEnabled(true)
        else if (!responseBreakpoint) setIsInterceptEnabled(false)
    }

    const toggleResponseBreakpoint = () => {
        const next = !responseBreakpoint
        setResponseBreakpoint(next)
        if (next) setIsInterceptEnabled(true)
        else if (!requestBreakpoint) setIsInterceptEnabled(false)
    }

    const { filtered, matchedIds } = useTrafficFilter(intercepts, searchActive, searchCfg, { enabled: false, reqHasResponse: false, reqHasParams: false, mimeHtml: true, mimeImages: true, mimeCss: true, mimeJson: true, mimeOther: true, status2xx: true, status3xx: true, status4xx: true, status5xx: true, methodGet: true, methodPost: true, methodPut: true, methodDelete: true, methodOptions: true, hideExtensions: "", listenerPort: "" })
    const tableData = useMemo(() => filtered, [filtered])

    const tableState = useTrafficTable({
        data: tableData,
        storageKey: "proxy_intercept_col_v16",
        containerRef,
        initialVisible: INTERCEPT_ONLY_VISIBLE
    })

    const firstUid = intercepts.length > 0 ? intercepts[0]._uid : null
    const activeUid = lastSelectedUid || (selectedUids.size > 0 ? Array.from(selectedUids)[0] : firstUid)

    const selectedReq = useMemo(
        () => activeUid ? intercepts.find((r: TrafficEvent) => r._uid === activeUid) : undefined,
        [intercepts, activeUid]
    )

    // Auto-select the first request in the queue if nothing is selected
    useEffect(() => {
        if (intercepts.length > 0 && selectedUids.size === 0) {
            setSelectedUids(new Set([intercepts[0]._uid]))
            setLastSelectedUid(intercepts[0]._uid)
        }
    }, [intercepts, selectedUids.size])

    // Search handlers (identical to HTTP History)
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") setSearchActive(searchRaw) }
    const clearSearch = () => { setSearchRaw(""); setSearchActive("") }

    const handleRowClick = useCallback((uid: string, e: React.MouseEvent) => {
        setSelectedUids(prev => {
            const next = new Set(prev)
            if (e.ctrlKey || e.metaKey) {
                if (next.has(uid)) next.delete(uid)
                else next.add(uid)
            } else if (e.shiftKey && lastSelectedUid) {
                const list = tableData
                const i1 = list.findIndex(r => r._uid === lastSelectedUid)
                const i2 = list.findIndex(r => r._uid === uid)
                if (i1 !== -1 && i2 !== -1) {
                    const min = Math.min(i1, i2), max = Math.max(i1, i2)
                    for (let i = min; i <= max; i++) next.add(list[i]._uid)
                }
            } else {
                next.clear()
                next.add(uid)
            }
            setLastSelectedUid(uid)
            setEditedRequest(null)
            setEditedResponse(null)
            return next
        })
    }, [lastSelectedUid, tableData])

    // Forward selected
    const handleForward = useCallback(() => {
        selectedUids.forEach(uid => {
            const req = intercepts.find(r => r._uid === uid)
            const isResponse = (req as any)?.response_raw && (req as any)?.response_raw !== ""
            if (isResponse) {
                const payload = (selectedUids.size === 1 && uid === lastSelectedUid && editedResponse !== null)
                    ? editedResponse : (req as any)?.response_raw as string || ""
                sendInterceptAction('forward', uid, payload)
            } else {
                const payload = (selectedUids.size === 1 && uid === lastSelectedUid && editedRequest !== null)
                    ? editedRequest : (req as any)?.request_raw as string || ""
                sendInterceptAction('forward', uid, payload)
            }
        })
        setEditedRequest(null)
        setEditedResponse(null)
    }, [selectedUids, lastSelectedUid, editedRequest, editedResponse, intercepts, sendInterceptAction])

    // Forward all simultaneously
    const handleForwardAll = useCallback(() => {
        intercepts.forEach(req => {
            const isResponse = (req as any)?.response_raw && (req as any)?.response_raw !== ""
            const payload = isResponse ? (req as any).response_raw : (req as any).request_raw
            sendInterceptAction('forward', req._uid, payload)
        })
        setEditedRequest(null); setEditedResponse(null); setSelectedUids(new Set())
    }, [intercepts, sendInterceptAction])



    // Pass: forward one-by-one sequentially
    const handlePass = useCallback(async () => {
        const items = [...intercepts]
        for (const req of items) {
            const isResponse = (req as any)?.response_raw && (req as any)?.response_raw !== ""
            const payload = isResponse ? (req as any).response_raw : (req as any).request_raw
            sendInterceptAction('forward', req._uid, payload)
            await new Promise(r => setTimeout(r, 150))
        }
        setEditedRequest(null); setEditedResponse(null); setSelectedUids(new Set())
    }, [intercepts, sendInterceptAction])

    // Drop selected
    const handleDrop = useCallback(() => {
        selectedUids.forEach(uid => sendInterceptAction('drop', uid))
        setEditedRequest(null); setEditedResponse(null)
    }, [selectedUids, sendInterceptAction])

    // Keyboard Shortcuts (Ctrl+F Forward, Ctrl+D Drop)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                if (intercepts.length > 0 && selectedUids.size > 0) {
                    e.preventDefault()
                    handleForward()
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                if (intercepts.length > 0 && selectedUids.size > 0) {
                    e.preventDefault()
                    handleDrop()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleForward, handleDrop, intercepts.length, selectedUids.size])

    // Drop all
    const handleDropAll = useCallback(() => {
        intercepts.forEach(req => sendInterceptAction('drop', req._uid))
        setEditedRequest(null); setEditedResponse(null); setSelectedUids(new Set())
    }, [intercepts, sendInterceptAction])

    // Forward & intercept response
    const handleInterceptResponse = useCallback(() => {
        selectedUids.forEach(uid => {
            const req = intercepts.find(r => r._uid === uid)
            const isResponse = (req as any)?.response_raw && (req as any)?.response_raw !== ""
            if (!isResponse) {
                const payload = (selectedUids.size === 1 && uid === lastSelectedUid && editedRequest !== null)
                    ? editedRequest : (req as any)?.request_raw as string || ""
                sendInterceptAction('intercept_response', uid, payload)
            }
        })
        setEditedRequest(null); setEditedResponse(null)
    }, [selectedUids, lastSelectedUid, editedRequest, intercepts, sendInterceptAction])

    // Auto-disable intercept when both breakpoints off
    useEffect(() => {
        if (!requestBreakpoint && !responseBreakpoint && isInterceptEnabled) {
            setIsInterceptEnabled(false)
        }
    }, [requestBreakpoint, responseBreakpoint, isInterceptEnabled, setIsInterceptEnabled])

    return (
        <div className="flex h-full flex-col overflow-hidden">
            <TooltipProvider delayDuration={300}>
                {ctxMenu && <ContextMenu ctx={ctxMenu} onClose={() => setCtxMenu(null)} selectedUids={selectedUids} allData={intercepts} />}

                {/* ─── Top Action Bar ─── */}
                <div className="flex items-center gap-1.5 border-b border-[var(--tokyo-border-cyan)] px-2 py-1.5 shrink-0 bg-[var(--tokyo-panel)] overflow-hidden select-none">
                    {/* Left: Toggle Mini-Buttons */}
                    <Button
                        variant={!isInterceptEnabled ? "default" : "outline"}
                        className={`h-8 px-4 text-xs font-bold uppercase tracking-widest gap-2 transition-all duration-300 ${!isInterceptEnabled ? "bg-[var(--tokyo-green)] text-[#0a0a0f] hover:bg-[var(--tokyo-green)] shadow-[0_0_15px_rgba(0,255,102,0.3)] border-transparent" : "bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)] border-[var(--tokyo-border-magenta)] hover:bg-[var(--tokyo-magenta-soft)]"}`}
                        onClick={() => {
                            if (isInterceptEnabled) {
                                setRequestBreakpoint(false)
                                setResponseBreakpoint(false)
                                setIsInterceptEnabled(false)
                            } else {
                                setRequestBreakpoint(true)
                                setIsInterceptEnabled(true)
                            }
                        }}
                    >
                        {!isInterceptEnabled ? <PlayCircle className="size-4" /> : <Power className="size-4" />}
                        {!isInterceptEnabled ? "PASS: ON" : "PASS: OFF"}
                    </Button>

                    <div className="w-px h-3 bg-[var(--tokyo-border-cyan)] mx-0.5" />

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={requestBreakpoint ? "default" : "ghost"} size="icon"
                                className={`size-6 shrink-0 ${requestBreakpoint ? "bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)] border-[var(--tokyo-border-magenta)] border" : "text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]"}`}
                                onClick={toggleRequestBreakpoint}
                            >
                                <Send className="size-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px]">Request Intercept</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={responseBreakpoint ? "default" : "ghost"} size="icon"
                                className={`size-6 shrink-0 ${responseBreakpoint ? "bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)] border-[var(--tokyo-border-magenta)] border" : "text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]"}`}
                                onClick={toggleResponseBreakpoint}
                            >
                                <Download className="size-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px]">Response Intercept</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={followProxyRules ? "default" : "ghost"} size="icon"
                                className={`size-6 shrink-0 ${followProxyRules ? "bg-[var(--tokyo-cyan-soft)] text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)] border-[var(--tokyo-border-cyan)] border" : "text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]"}`}
                                onClick={toggleFollowProxy}
                            >
                                <ShieldCheck className="size-3.5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-[10px]">Follow Proxy Rules</TooltipContent>
                    </Tooltip>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Right: Full Action Buttons */}
                    <div className="flex items-center">
                        <Button
                            disabled={intercepts.length === 0 || selectedUids.size === 0}
                            variant="ghost"
                            className="h-7 px-3 text-[10px] font-bold uppercase tracking-tight text-[var(--tokyo-green)] hover:bg-[var(--tokyo-green-soft)] disabled:opacity-20 rounded-r-none gap-1.5 transition-all"
                            onClick={handleForward}
                        >
                            <PlayCircle className="size-3.5" /> Forward
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={intercepts.length === 0}>
                                <Button disabled={intercepts.length === 0} variant="ghost" className="h-7 px-1.5 text-[var(--tokyo-green)] hover:bg-[var(--tokyo-green-soft)] rounded-l-none border-l border-[var(--tokyo-border-cyan)] disabled:opacity-20">
                                    <ChevronDown className="size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[160px]">
                                <DropdownMenuItem disabled={selectedUids.size === 0} onClick={handleForward} className="text-[11px] gap-2">
                                    <PlayCircle className="size-3 text-emerald-500" /> Forward
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={intercepts.length === 0} onClick={handleForwardAll} className="text-[11px] gap-2">
                                    <FastForward className="size-3 text-emerald-500" /> Forward All
                                </DropdownMenuItem>
                                {selectedReq && !((selectedReq as any)?.response_raw) && (
                                    <DropdownMenuItem disabled={selectedUids.size === 0} onClick={handleInterceptResponse} className="text-[11px] gap-2">
                                        <ArrowRightCircle className="size-3 text-amber-500" /> Forward & Intercept Res
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center">
                        <Button
                            disabled={intercepts.length === 0 || selectedUids.size === 0}
                            variant="ghost"
                            className="h-7 px-3 text-[10px] font-bold uppercase tracking-tight text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)] disabled:opacity-20 rounded-r-none gap-1.5 transition-all"
                            onClick={handleDrop}
                        >
                            <XCircle className="size-3.5" /> Drop
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={intercepts.length === 0}>
                                <Button disabled={intercepts.length === 0} variant="ghost" className="h-7 px-1.5 text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)] rounded-l-none border-l border-[var(--tokyo-border-cyan)] disabled:opacity-20">
                                    <ChevronDown className="size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[120px]">
                                <DropdownMenuItem disabled={selectedUids.size === 0} onClick={handleDrop} className="text-[11px] gap-2">
                                    <XCircle className="size-3 text-red-500" /> Drop
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled={intercepts.length === 0} onClick={handleDropAll} className="text-[11px] gap-2">
                                    <XCircle className="size-3 text-red-500" /> Drop All
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center ml-2 pl-2 border-l border-[var(--tokyo-border-cyan)]">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild disabled={!selectedReq}>
                                <Button disabled={!selectedReq} variant="ghost" className="h-7 px-3 text-[10px] font-bold uppercase tracking-tight text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)] disabled:opacity-20 gap-1.5 transition-all">
                                    <Settings2 className="size-3.5" /> Action
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[140px]">
                                <DropdownMenuItem onClick={() => { if (selectedReq) sendToRepeater(selectedReq); }} className="text-[11px] gap-2">
                                    <AlertCircle className="size-3 text-emerald-400" /> Send to Repeater
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { if (selectedReq) sendToIterater(selectedReq); }} className="text-[11px] gap-2">
                                    <FastForward className="size-3 text-amber-400" /> Send to Iterator
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <Button
                        disabled={intercepts.length === 0}
                        variant="ghost"
                        className="h-7 px-3 text-[10px] font-bold uppercase tracking-tight text-accent hover:bg-accent/10 disabled:opacity-20 gap-1.5 transition-all ml-1"
                        onClick={handlePass}
                    >
                        <FastForward className="size-3.5" /> Pass
                    </Button>
                </div>

                {/* ─── Main Content ─── */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-2">
                    <CyberPanel
                        title={selectedReq ? (editedRequest || editedResponse ? "Intercepted Request (Modified)" : "Intercepted Request") : "Awaiting Intercept..."}
                        icon={<AlertCircle className={`size-3 ${isInterceptEnabled ? "text-red-500 animate-pulse" : ""}`} />}
                        className="h-full"
                    >
                        <div className="flex flex-col h-full overflow-hidden">
                            {selectedReq ? (
                                (() => {
                                    const hasResponse = (selectedReq as any)?.response_raw && (selectedReq as any)?.response_raw !== ""
                                    const isRequestIntercept = !hasResponse
                                    const originalContent = isRequestIntercept
                                        ? (selectedReq as TrafficEvent).request_raw || ""
                                        : (selectedReq as TrafficEvent).response_raw || ""
                                    return (
                                        <div className="flex-1 flex flex-col overflow-hidden">
                                            <div className="h-8 border-b border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)] flex items-center px-4 shrink-0 justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-black tracking-widest uppercase ${isRequestIntercept ? "text-[var(--tokyo-cyan)]" : "text-[var(--tokyo-magenta)]"}`}>
                                                        {isRequestIntercept ? "REQUEST" : "RESPONSE"}
                                                    </span>
                                                    {(editedRequest !== null || editedResponse !== null) && (
                                                        <span className="text-[9px] text-red-400 font-bold uppercase animate-pulse">Modified</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground/50 font-mono">
                                                    Queue: {intercepts.length}
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                {isRequestIntercept ? (
                                                    <Inspector
                                                        content={editedRequest !== null ? editedRequest : originalContent}
                                                        className="h-full"
                                                        readOnly={false}
                                                        onContentChange={(newContent) => setEditedRequest(newContent)}
                                                        onDiscard={() => setEditedRequest(null)}
                                                    />
                                                ) : (
                                                    <Inspector
                                                        content={editedResponse !== null ? editedResponse : originalContent}
                                                        className="h-full"
                                                        isResponse={true}
                                                        readOnly={false}
                                                        onContentChange={(newContent) => setEditedResponse(newContent)}
                                                        onDiscard={() => setEditedResponse(null)}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    )
                                })()
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-[var(--tokyo-panel-2)]">
                                    <div className="relative mb-6">
                                        <Inbox className={`size-16 ${isInterceptEnabled ? "text-red-500/40 animate-pulse" : "text-[var(--tokyo-cyan)]/10"}`} />
                                        {isInterceptEnabled && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="size-2 bg-red-500 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-ping" />
                                            </div>
                                        )}
                                    </div>
                                    <h3 className={`text-[11px] font-black uppercase tracking-[0.3em] ${isInterceptEnabled ? "text-red-500/60" : "text-[var(--tokyo-cyan)]/20"}`}>
                                        {isInterceptEnabled ? "Awaiting Intercept" : "Interception Idle"}
                                    </h3>
                                    <p className="text-[9px] mt-3 font-mono text-[var(--tokyo-cyan)]/30 max-w-[200px] leading-relaxed">
                                        {isInterceptEnabled
                                            ? "Matching traffic will be paused here for review."
                                            : "Enable interception to start catching requests & responses."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </CyberPanel>
                </div>
            </TooltipProvider>
        </div>
    )
}
