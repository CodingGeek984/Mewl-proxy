import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Search, X, Settings2, Trash2, Wifi, WifiOff, Play, ArrowUp, ArrowDown, Crosshair, Layout, ListFilter, Power, Radio, Activity, Server, ShieldCheck, Download, Upload, FileKey2, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { Inspector } from "@/components/proxy/inspector"
import { InterceptTabV2 } from "./InterceptTab-v2"
import { useProxyWebsocket } from "@/lib/proxy-store"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { MonoInput } from "@/components/proxy/ui/mono-input"
import type { TrafficEvent, SearchConfig, Rule } from "@/types/proxy"
import {
  ALL_COLUMNS, DEFAULT_VISIBLE, formatBytes,
  useTrafficTable, TrafficTable, ColSettingsPanel, buildHAR, downloadHAR
} from "./traffic-table"
import {
  ContextMenu,
  FilterPanel,
  SearchSettingsPanel,
  useTrafficFilter,
  type CtxState
} from "./traffic-shared"
import { buildURL } from "./traffic-utils"
// @ts-ignore
import * as App from "@wailsjs/go/backend/App"


// ─── Shared Logic Imports ───────────────────────────────────────────────────
// Most shared logic moved to traffic-shared.tsx to avoid duplication.
// Component-specific handlers remain below.



function HistoryTab() {
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set())
  const [lastSelectedUid, setLastSelectedUid] = useState<string | null>(null)
  const [isInspectorVisible, setIsInspectorVisible] = useState(true)

  const [layout, setLayout] = useState<"horizontal" | "vertical" | "combined">("combined")
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean, type: "selected" | "all" }>({ open: false, type: "all" })
  const [colSettingsOpen, setColSettingsOpen] = useState(false)
  const [snapshot] = useState<TrafficEvent[] | null>(null)
  const [ctxMenu, setCtxMenu] = useState<CtxState | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    requests, isConnected, clearHistory, deleteRequests, isLive, setIsLive,
    isInterceptEnabled,
    searchRaw, setSearchRaw, searchActive, setSearchActive,
    searchCfg, setSearchCfg, filterCfg, setFilterCfg, isFilterOnly, setIsFilterOnly,
    rowColors, isAnchored, setIsAnchored,
    requestBreakpoint, setRequestBreakpoint, responseBreakpoint, setResponseBreakpoint, setIsInterceptEnabled,
    rules
  } = useProxyWebsocket()

  // Suppress unused warnings for variables that are destructured but used indirectly/later
  void isAnchored; void setIsAnchored; void responseBreakpoint;

  const liveList = useMemo(() => {
    return snapshot ?? requests
  }, [snapshot, requests])

  const { filtered, matchedIds } = useTrafficFilter(liveList, searchActive, searchCfg, filterCfg, rules)

  const inspectorActiveUid = lastSelectedUid || Array.from(selectedUids).pop()
  const selectedReq = useMemo(() => inspectorActiveUid ? liveList.find((r: TrafficEvent) => r._uid === inspectorActiveUid) : undefined, [inspectorActiveUid, liveList])



  useEffect(() => {
    if (!isFilterOnly && searchActive.trim() && matchedIds.size > 0) {
      // Auto-select all matched IDs
      setSelectedUids(new Set(matchedIds))
      // Get the last matched item from the filtered list (which are the matches)
      const lastMatch = filtered[filtered.length-1]
      if (lastMatch && lastMatch._uid) {
        setLastSelectedUid(lastMatch._uid)
      }
    }
  }, [matchedIds, searchActive, isFilterOnly])

  // Auto-select last request if none selected and traffic arrives
  useEffect(() => {
    if (requests.length > 0 && selectedUids.size === 0 && !lastSelectedUid) {
      const last = requests[requests.length-1]
      if (last && last._uid) {
        setSelectedUids(new Set([last._uid]))
        setLastSelectedUid(last._uid)
      }
    }
  }, [requests.length, selectedUids.size, lastSelectedUid])

  const tableData = useMemo(() => {
    return (isFilterOnly || filterCfg.enabled) ? filtered : [...liveList]
  }, [isFilterOnly, filterCfg.enabled, filtered, liveList])

  const tableState = useTrafficTable({
    data: tableData,
    storageKey: "proxy_col_v12",
    containerRef,
    disableResize: true
  })



  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === "Enter") setSearchActive(searchRaw) }
  const clearSearch = () => { setSearchRaw(""); setSearchActive("") }

  const handleRowClick = useCallback((uid: string, e: React.MouseEvent) => {
    setSelectedUids(prev => {
      const next = new Set(prev)
      if (e.ctrlKey || e.metaKey) {
        if (next.has(uid)) next.delete(uid)
        else next.add(uid)
        setLastSelectedUid(uid)
      } else if (e.shiftKey && lastSelectedUid) {
        const i1 = tableState.displayList.findIndex(r => r._uid === lastSelectedUid)
        const i2 = tableState.displayList.findIndex(r => r._uid === uid)
        if (i1 !== -1 && i2 !== -1) {
          const min = Math.min(i1, i2), max = Math.max(i1, i2)
          for (let i = min; i <= max; i++) next.add(tableState.displayList[i]._uid)
        }
        setLastSelectedUid(uid)
      } else {
        next.clear()
        if (!prev.has(uid) || prev.size > 1) { next.add(uid); setLastSelectedUid(uid) }
        else setLastSelectedUid(null)
      }
      return next
    })
  }, [lastSelectedUid, tableState.displayList])

  const handleDeleteRequest = useCallback(() => {
    if (selectedUids.size > 0) setDeleteConfirm({ open: true, type: "selected" })
    else setDeleteConfirm({ open: true, type: "all" })
  }, [selectedUids])

  const confirmDelete = useCallback(() => {
    if (deleteConfirm.type === "selected") {
      deleteRequests(Array.from(selectedUids))
      setSelectedUids(new Set())
      setLastSelectedUid(null)
    } else {
      clearHistory()
    }
    setDeleteConfirm({ open: false, type: "all" })
  }, [deleteConfirm, selectedUids, deleteRequests, clearHistory])

  const handleCtxMenu = useCallback((req: TrafficEvent, e: React.MouseEvent) => {
    e.preventDefault()
    setSelectedUids(prev => {
      if (!prev.has(req._uid)) {
        setLastSelectedUid(req._uid)
        return new Set([req._uid])
      }
      return prev
    })
    setCtxMenu({ req, x: e.clientX, y: e.clientY })
  }, [])




  const navigateRequests = useCallback((dir: 1 | -1) => {
    const list = tableState.displayList
    const currentUid = inspectorActiveUid
    if (!currentUid) {
      if (list.length > 0) {
        const first = list[0]._uid
        setLastSelectedUid(first)
        setSelectedUids(new Set([first]))
      }
      return
    }
    const idx = list.findIndex(r => r._uid === currentUid)
    const nextIdx = idx + dir
    if (nextIdx >= 0 && nextIdx < list.length) {
      const nextUid = list[nextIdx]._uid
      setLastSelectedUid(nextUid)
      setSelectedUids(new Set([nextUid]))
      tableState.virtualizer.scrollToIndex(nextIdx, { align: 'center' })
    }
  }, [tableState.displayList, inspectorActiveUid, tableState.virtualizer])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === "a" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setSelectedUids(new Set(tableState.displayList.map(r => r._uid)))
        return
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        navigateRequests(-1)
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        navigateRequests(1)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [navigateRequests])

  const navigateInspector = useCallback((dir: 1 | -1) => {
    const sources = selectedUids.size > 1
      ? tableState.displayList.filter(r => selectedUids.has(r._uid))
      : tableState.displayList

    const currentUid = inspectorActiveUid
    if (!currentUid) return

    const idx = sources.findIndex(r => r._uid === currentUid)
    if (idx === -1) return

    const nextIdx = idx + dir
    if (nextIdx >= 0 && nextIdx < sources.length) {
      const nextUid = sources[nextIdx]._uid
      setLastSelectedUid(nextUid)
      setSelectedUids(new Set([nextUid]))

      const newIdx = tableState.displayList.findIndex(r => r._uid === nextUid)
      if (newIdx !== -1) {
        tableState.virtualizer.scrollToIndex(newIdx, { align: 'center', behavior: 'smooth' })
      }
    }
  }, [inspectorActiveUid, selectedUids, tableState.displayList, tableState.virtualizer])

  const handleSearchCfgChange = (cfg: SearchConfig) => {
    setSearchCfg(cfg)
  }

  useEffect(() => {
    // When inspector visibility changes, wait for animation and autowidth columns
    const timer = setTimeout(() => {
      tableState.setAutoDistribute(true)
    }, 250) // wait for panel slide-in animation to finish
    return () => clearTimeout(timer)
  }, [isInspectorVisible, tableState])

  const showInspector = isInspectorVisible

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AlertDialog open={deleteConfirm.open} onOpenChange={(v) => !v && setDeleteConfirm({ open: false, type: "all" })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm.type === "selected"
                ? `This will permanently delete ${selectedUids.size} selected request(s) from the database.`
                : "This will permanently clear all requests from the database. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteConfirm.type === "selected" ? "Delete Selected" : "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {ctxMenu && ctxMenu.req && <ContextMenu ctx={ctxMenu as CtxState} onClose={() => { setCtxMenu(null); setSelectedUids(new Set()); }} selectedUids={selectedUids} allData={liveList} />}


      <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-transparent">
        {tableState.displayList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
            <div className="text-center">
              {liveList.length === 0 ? (
                <>
                  {isConnected ? (
                    <Wifi className="mx-auto mb-3 size-10 opacity-30 text-primary" />
                  ) : (
                    <WifiOff className="mx-auto mb-3 size-10 opacity-30 text-destructive" />
                  )}
                  <p className="text-sm font-medium">{isConnected ? "Waiting for traffic..." : "Backend not connected"}</p>
                  <p className="mt-1 text-xs opacity-50">{isConnected ? "Proxy: 127.0.0.1:8082" : "Start run.py"}</p>
                </>
              ) : (
                <>
                  <Search className="mx-auto mb-3 size-10 opacity-20" />
                  <p className="text-sm font-medium">No results found</p>
                  <button onClick={clearSearch} className="mt-2 text-xs text-primary hover:underline">Clear search</button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex min-h-0 w-full overflow-hidden p-2">
            <ResizablePanelGroup direction="horizontal" id="history-main-group-v2" className="flex-1 w-full h-full gap-2">
              <ResizablePanel
                id="history-table-panel-v2"
                defaultSize={showInspector ? 55 : 100}
                minSize={10}
                className="flex flex-col min-h-0 min-w-0"
              >
                <CyberPanel
                  title="HTTP History"
                  icon={<ListFilter className="size-3" />}
                  className="h-full"
                  actions={
                    <div className="flex items-center gap-1">
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isInterceptEnabled ? "default" : "ghost"}
                              size="icon"
                              className={`size-6 shrink-0 ${isInterceptEnabled ? "bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)] border-[var(--tokyo-border-magenta)] border" : "text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]"}`}
                              onClick={() => {
                                if (requestBreakpoint) {
                                  setRequestBreakpoint(false)
                                  setResponseBreakpoint(false)
                                  setIsInterceptEnabled(false)
                                } else {
                                  setRequestBreakpoint(true)
                                  setIsInterceptEnabled(true)
                                }
                              }}
                            >
                              <Crosshair className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px]">Intercept</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant={!isLive ? "default" : "ghost"} size="icon" className={`size-6 shrink-0 ${!isLive ? "bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)] border-[var(--tokyo-border-magenta)] border" : "text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]"}`} onClick={() => setIsLive(!isLive)}>
                              {isLive ? <div className="flex gap-[2px] items-center justify-center"><div className="w-[1.5px] h-2 bg-current rounded-sm" /><div className="w-[1.5px] h-2 bg-current rounded-sm" /></div> : <Play className="size-2.5 fill-current ml-0.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px]">{isLive ? "Pause" : "Resume"}</TooltipContent>
                        </Tooltip>

                        <div className="w-px h-3 bg-[var(--tokyo-border-cyan)] mx-0.5" />

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className={`size-6 shrink-0 transition-colors ${isInspectorVisible ? "text-[var(--tokyo-magenta)] bg-[var(--tokyo-magenta-soft)]" : "text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]"}`} onClick={() => setIsInspectorVisible(!isInspectorVisible)}>
                              <Layout className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px]">Inspector</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenu open={colSettingsOpen} onOpenChange={setColSettingsOpen}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-6 shrink-0 text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]">
                                  <Settings2 className="size-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="p-0 border-none bg-transparent">
                                <ColSettingsPanel visible={tableState.visibleCols} order={tableState.colOrder}
                                  onVisibleChange={tableState.setVisibleCols} onOrderChange={tableState.setColOrder}
                                  onReset={() => { tableState.setVisibleCols(DEFAULT_VISIBLE); tableState.setColOrder(ALL_COLUMNS.map(c => c.key)); tableState.setColWidths({}); tableState.setAutoDistribute(true) }} />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px]">Columns</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-6 shrink-0 text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-magenta-soft)] hover:text-[var(--tokyo-magenta)]" onClick={handleDeleteRequest}>
                              <Trash2 className="size-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-[10px]">Clear</TooltipContent>
                        </Tooltip>

                      </TooltipProvider>
                    </div>
                  }
                >
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="flex items-center gap-1.5 border-b border-[var(--tokyo-border-cyan)] px-2 py-1.5 shrink-0 bg-[var(--tokyo-panel-2)] overflow-hidden flex-wrap select-none">
                      <Popover open={filterPanelOpen} onOpenChange={setFilterPanelOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className={`size-7 ${filterCfg.enabled ? 'text-[var(--tokyo-magenta)] bg-[var(--tokyo-magenta-soft)]' : 'text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]'}`} title={`Filter: ${filterCfg.enabled ? "Active" : "Off"}`}>
                            <ListFilter className="size-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 border-0 shadow-none bg-transparent" align="start" sideOffset={8}>
                          <FilterPanel config={filterCfg} onChange={setFilterCfg} onClose={() => setFilterPanelOpen(false)} />
                        </PopoverContent>
                      </Popover>

                      <div className="flex-1 max-w-2xl min-w-0 relative">
                        <MonoInput
                          icon={<Search className="size-3.5" />}
                          placeholder="Search"
                          value={searchRaw}
                          onChange={e => setSearchRaw(e.target.value)}
                          onKeyDown={handleSearchKeyDown}
                          className="h-7"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                          {searchRaw && (
                            <button onClick={clearSearch} className="text-[var(--tokyo-cyan)]/55 hover:text-[var(--tokyo-magenta)] p-0.5">
                              <X className="size-3.5" />
                            </button>
                          )}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="text-[var(--tokyo-cyan)]/55 hover:text-[var(--tokyo-magenta)] p-0.5 rounded hover:bg-[var(--tokyo-magenta-soft)]">
                                <Settings2 className="size-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-auto" align="end" sideOffset={6}>
                              <SearchSettingsPanel config={searchCfg} onChange={handleSearchCfgChange} isFilterOnly={isFilterOnly} onFilterChange={setIsFilterOnly} />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col bg-[var(--tokyo-panel)]">
                      <TrafficTable
                        tableState={tableState}
                        containerRef={containerRef}
                        selectedUids={selectedUids}
                        matchedIds={matchedIds}
                        rowColors={rowColors}
                        isAnchored={isAnchored}
                        onRowClick={handleRowClick}
                        onCtxMenu={handleCtxMenu}
                      />
                    </div>
                  </div>
                </CyberPanel>
              </ResizablePanel>

              {showInspector && (
                <ResizableHandle id="history-main-handle-v2"
                  className="w-1 bg-transparent hover:bg-[var(--tokyo-cyan-soft)] transition-colors z-50 cursor-col-resize flex items-center justify-center group relative overflow-visible"
                />
              )}

              {showInspector && (
                <ResizablePanel
                  id="history-inspector-panel-v2"
                  defaultSize={45}
                  minSize={20}
                  className="flex flex-col min-h-0 min-w-0"
                >
                  <CyberPanel
                    title="Inspector"
                    icon={<Crosshair className="size-3" />}
                    className="h-full"
                    actions={
                      <div className="flex items-center gap-1 pr-1">
                        <Button variant="ghost" size="icon" className="size-6 text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]" onClick={() => navigateInspector(-1)}>
                          <ArrowUp className="size-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-6 text-[var(--tokyo-cyan)]/55 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]" onClick={() => navigateInspector(1)}>
                          <ArrowDown className="size-3" />
                        </Button>
                      </div>
                    }
                  >
                    <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-full">
                      {layout === "combined" ? (
                        <div className="flex flex-col h-full overflow-hidden">
                          <Tabs defaultValue="request" className="flex-1 flex flex-col overflow-hidden">
                            <div className={`h-8 border-b border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)] flex items-center px-1 shrink-0 select-none ${!selectedReq ? 'opacity-30 pointer-events-none' : ''}`}>
                              <TabsList className="h-6 bg-transparent gap-0 p-0">
                                <TabsTrigger value="request" className="h-full text-[10px] uppercase tracking-tight px-3 data-[state=active]:bg-[var(--tokyo-magenta-soft)] data-[state=active]:text-[var(--tokyo-magenta)] text-[var(--tokyo-cyan)]/55 rounded-none border-0">Request</TabsTrigger>
                                <TabsTrigger value="response" disabled={!selectedReq || (selectedReq as TrafficEvent).status_code === 0} className="h-full text-[10px] uppercase tracking-tight px-3 data-[state=active]:bg-[var(--tokyo-magenta-soft)] data-[state=active]:text-[var(--tokyo-magenta)] text-[var(--tokyo-cyan)]/55 rounded-none border-0">Response</TabsTrigger>
                              </TabsList>
                              <div className="ml-auto flex items-center gap-1 border-l border-[var(--tokyo-border-cyan)] pl-2 mr-1 my-1">
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-5 rounded-sm bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)]">
                                        <div className="w-3 h-3 border border-current rounded-[1px] relative flex flex-col pt-[2px]"><div className="w-full h-px bg-current opacity-50" /></div>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px]">Tabs view</TooltipContent>
                                  </Tooltip>

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-5 rounded-sm text-[var(--tokyo-cyan)]/45 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]" onClick={() => setLayout('horizontal')}>
                                        <div className="w-3 h-3 border border-current rounded-[1px] flex flex-row">
                                          <div className="h-full w-[50%] border-r border-current opacity-50" />
                                        </div>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-[10px]">Split view</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            <TabsContent value="request" className="flex-1 m-0 overflow-hidden">
                              <Inspector content={selectedReq ? (selectedReq as TrafficEvent).request_raw || "" : ""} url={selectedReq ? buildURL(selectedReq as TrafficEvent) : ""} className="h-full" disabled={!selectedReq} />
                            </TabsContent>
                            <TabsContent value="response" className="flex-1 m-0 overflow-hidden">
                              <Inspector content={selectedReq ? (selectedReq as TrafficEvent).response_raw || "" : ""} url={selectedReq ? buildURL(selectedReq as TrafficEvent) : ""} className="h-full" isResponse={true} disabled={!selectedReq || (selectedReq as TrafficEvent).status_code === 0} />
                            </TabsContent>
                          </Tabs>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                          <div className={`h-8 border-b border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)] flex items-center px-1 shrink-0 ${!selectedReq ? 'opacity-30 pointer-events-none' : ''}`}>
                            <span className="text-[10px] uppercase tracking-tight px-3 text-[var(--tokyo-cyan)]/60">Split View</span>
                            <div className="ml-auto flex items-center gap-1 border-l border-[var(--tokyo-border-cyan)] pl-2 mr-1 my-1">
                              <Button variant="ghost" size="icon" className="size-5 rounded-sm text-[var(--tokyo-cyan)]/45 hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)]" onClick={() => setLayout('combined')} title="Tabs view">
                                <div className="w-3 h-3 border border-current rounded-[1px] relative flex flex-col pt-[2px]"><div className="w-full h-px bg-current opacity-50" /></div>
                              </Button>
                              <Button variant="ghost" size="icon" className="size-5 rounded-sm bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)]" title="Split view">
                                <div className="w-3 h-3 border border-current rounded-[1px] flex flex-row">
                                  <div className="h-full w-[50%] border-r border-current opacity-50" />
                                </div>
                              </Button>
                            </div>
                          </div>
                          <ResizablePanelGroup direction="vertical" id="history-split-group-v2" className="flex-1 h-full min-w-0">
                            <ResizablePanel id="history-req-panel-v2" defaultSize={50} minSize={10} className="flex flex-col min-w-0 overflow-hidden">
                              <div className="h-6 shrink-0 bg-[var(--tokyo-panel-2)] border-b border-[var(--tokyo-border-cyan)] flex items-center px-3 select-none">
                                <span className="text-[9px] uppercase tracking-widest text-[var(--tokyo-cyan)]/70 font-medium">Request</span>
                              </div>
                              <Inspector content={selectedReq ? (selectedReq as TrafficEvent).request_raw || "" : ""} className="flex-1 w-full" disabled={!selectedReq} />
                            </ResizablePanel>
                            <ResizableHandle id="history-split-handle-v2"
                              className="h-1 bg-transparent hover:bg-[var(--tokyo-cyan-soft)] transition-colors z-50 flex items-center justify-center cursor-row-resize"
                            />
                            <ResizablePanel id="history-res-panel-v2" defaultSize={50} minSize={10} className="flex flex-col min-w-0 overflow-hidden">
                              <div className="h-6 shrink-0 bg-[var(--tokyo-panel-2)] border-b border-[var(--tokyo-border-cyan)] flex items-center px-3 select-none">
                                <span className={`text-[9px] uppercase tracking-widest font-medium ${(!selectedReq || (selectedReq as TrafficEvent).status_code === 0) ? 'text-[var(--tokyo-cyan)]/30' : 'text-[var(--tokyo-green)]/70'}`}>Response</span>
                              </div>
                              <Inspector content={selectedReq ? (selectedReq as TrafficEvent).response_raw || "" : ""} className="flex-1 min-w-0" isResponse={true} disabled={!selectedReq || (selectedReq as TrafficEvent).status_code === 0} />
                            </ResizablePanel>
                          </ResizablePanelGroup>
                        </div>
                      )}
                    </div>
                  </CyberPanel>
                </ResizablePanel>
              )}
            </ResizablePanelGroup>
          </div>
        )}
      </div>
    </div >
  )
}


function RulesTab() {
  const { rules, saveRules, getSetting, setSetting } = useProxyWebsocket()
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [activeCategory, setActiveCategory] = useState<'proxy' | 'intercept' | 'history'>('proxy')
  const [followProxyRules, setFollowProxyRules] = useState(true)

  useEffect(() => {
    getSetting("follow_proxy_rules", "true").then(v => setFollowProxyRules(v === "true"))
  }, [getSetting])

  const toggleFollowProxy = async () => {
    const next = !followProxyRules
    setFollowProxyRules(next)
    await setSetting("follow_proxy_rules", next ? "true" : "false")
  }

  const handleToggle = (id: string) => {
    const newRules = rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r)
    saveRules(newRules)
  }

  const handleDelete = (id: string) => {
    const newRules = rules.filter(r => r.id !== id)
    saveRules(newRules)
    if (editingRule?.id === id) setEditingRule(null)
  }

  const handleSave = (rule: Rule) => {
    let newRules = []
    const existing = rules.find(r => r.id === rule.id)
    if (existing) {
      newRules = rules.map(r => r.id === rule.id ? rule : r)
    } else {
      newRules = [...rules, rule]
    }
    saveRules(newRules)
    setEditingRule(null)
  }

  const filteredRules = rules.filter(r => r.category === activeCategory)
  const colors = CATEGORY_COLORS[activeCategory] || CATEGORY_COLORS.proxy

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--tokyo-panel)] overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={60} minSize={30}>
          <div className="flex flex-col h-full p-2 gap-2">
            <CyberPanel
              title={`${activeCategory.toUpperCase()} RULES`}
              icon={<Settings2 className="size-3" />}
              className="flex-1"
              actions={
                <div className="flex items-center gap-2 pr-1">
                  <Button
                    size="sm"
                    className="h-6 text-[9px] font-black uppercase tracking-widest border-0 px-3 rounded-sm transition-all"
                    style={{ backgroundColor: 'var(--tokyo-magenta)', color: 'white', boxShadow: '0 0 14px var(--accent-glow)' }}
                    onClick={() => {
                      setEditingRule({
                        id: crypto.randomUUID(),
                        category: activeCategory,
                        enabled: true,
                        name: "",
                        type: activeCategory === 'history' ? 'Hide' : 'MatchReplace',
                        scope: "url",
                        pattern: "",
                        replacement: "",
                        delay_ms: 0,
                        cel_expression: "",
                        color: "",
                        visible: true
                      } as Rule);
                    }}
                  >
                    ADD RULE
                  </Button>
                </div>
              }
            >
              <div className="flex flex-col h-full overflow-hidden">
                {/* Category Selector */}
                <div className="flex border-b border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)] shrink-0 h-9">
                  {(['proxy', 'intercept', 'history'] as const).map(cat => {
                    const catColors = CATEGORY_COLORS[cat]
                    const isActive = activeCategory === cat
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-1 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                          isActive
                            ? 'text-[var(--tokyo-magenta)] bg-[var(--tokyo-magenta-soft)]'
                            : 'text-[var(--tokyo-cyan)]/50 hover:text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)]'
                        }`}
                      >
                        {cat}
                        {isActive && (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-0.5"
                            style={{ backgroundColor: 'var(--tokyo-magenta)' }}
                          />
                        )}
                      </button>
                    )
                  })}
                </div>

                {activeCategory === 'intercept' && (
                  <div className="p-3 px-5 border-b border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-cyan-soft)] flex items-center justify-between gap-4 shrink-0">
                    <div className="flex flex-col gap-0.5">
                      <div className="text-[10px] font-bold text-[var(--tokyo-cyan)] uppercase tracking-wider">Conditional Intercept</div>
                      <div className="text-[9px] text-[var(--tokyo-cyan)]/60 leading-tight">Apply rules contextually. Breakpoints must be active.</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer group" onClick={toggleFollowProxy}>
                        <div className="size-3 border border-[var(--tokyo-border-cyan)] flex items-center justify-center transition-all group-hover:border-[var(--tokyo-cyan)]">
                          {followProxyRules && <div className="size-1 bg-[var(--tokyo-cyan)] shadow-[0_0_5px_rgba(0,240,255,0.5)]" />}
                        </div>
                        <span className="text-[9px] font-bold text-[var(--tokyo-cyan)]/65 group-hover:text-[var(--tokyo-magenta)] uppercase tracking-tighter">Follow Proxy</span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="h-7 border-b border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)] flex items-center px-4 shrink-0 text-[10px] uppercase tracking-widest text-[var(--tokyo-cyan)]/55 font-bold">
                  <div className="w-10">Act</div>
                  <div className="flex-1">Description</div>
                  <div className="w-[100px]">Type</div>
                  <div className="w-[120px]">Scope</div>
                  <div className="w-16"></div>
                </div>

                <div className="flex-1 overflow-auto h-full scrollbar-cyber">
                  {filteredRules.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40 py-12 select-none text-[var(--tokyo-cyan)]">
                      <Settings2 className="size-12 mb-2" />
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em]">Zero {activeCategory} rules</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--tokyo-border-cyan)]">
                      {filteredRules.map(rule => (
                        <div
                          key={rule.id}
                          onClick={() => setEditingRule(rule)}
                          className={`flex items-center px-4 h-9 text-[11px] font-mono group hover:bg-[var(--tokyo-cyan-soft)] transition-colors cursor-pointer border-l-2 ${
                            rule.enabled ? 'border-[var(--tokyo-cyan)]' : 'border-transparent opacity-40'
                          } ${editingRule?.id === rule.id ? 'bg-[var(--tokyo-magenta-soft)] border-[var(--tokyo-magenta)] mt-[-1px] mb-[-1px] z-10' : ''}`}
                        >
                          <div className="w-10 flex items-center" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleToggle(rule.id)}
                              className={`size-4 border flex items-center justify-center transition-colors ${
                                rule.enabled ? 'bg-[var(--tokyo-cyan)] border-[var(--tokyo-cyan)] text-[#0a0a0f] shadow-[0_0_8px_rgba(0,240,255,0.4)]' : 'border-[var(--tokyo-border-cyan)] hover:border-[var(--tokyo-cyan)]'
                              }`}
                            >
                              {rule.enabled && <div className="size-1.5 bg-current rounded-full" />}
                            </button>
                          </div>
                          <div className={`flex-1 truncate pr-4 text-[var(--tokyo-cyan)]/80 font-bold group-hover:text-[var(--tokyo-magenta)] transition-colors ${editingRule?.id === rule.id ? 'text-[var(--tokyo-magenta)]' : ''}`}>
                            {rule.name}
                          </div>
                          <div className="w-[100px] text-[10px] uppercase font-black tracking-widest text-[var(--tokyo-cyan)]/70 font-mono italic">{rule.type}</div>
                          <div className="w-[120px] text-[10px] uppercase font-bold tracking-tight text-[var(--tokyo-cyan)]/50">{rule.scope.replace('_', ' ')}</div>
                          <div className="w-16 flex items-center justify-end gap-1 opacity-10 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleDelete(rule.id)} className="p-1 hover:text-red-400"><Trash2 className="size-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CyberPanel>
          </div>
        </ResizablePanel>

        {editingRule && (
          <>
            <ResizableHandle className="w-1 bg-transparent hover:bg-sky-500/20 transition-colors" />
            <ResizablePanel defaultSize={40} minSize={25}>
              <div className="h-full p-2 pl-0">
                <RuleEditor
                  rule={editingRule}
                  category={activeCategory}
                  onClose={() => setEditingRule(null)}
                  onSave={handleSave}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}

interface RuleModalProps {
  rule: Rule | null
  category: string
  onClose: () => void
  onSave: (rule: Rule) => void
}

const CATEGORY_COLORS: Record<string, { accent: string; glow: string; bg: string; border: string; text: string; pill: string; pillActive: string }> = {
  proxy: {
    accent: 'var(--tokyo-magenta)',
    glow: 'rgba(255, 0, 170, 0.6)',
    bg: 'bg-[var(--tokyo-cyan-soft)]',
    border: 'border-[var(--tokyo-border-cyan)]',
    text: 'text-[var(--tokyo-cyan)]',
    pill: 'border-[var(--tokyo-border-cyan)] text-[var(--tokyo-cyan)]/60 hover:border-[var(--tokyo-cyan)] hover:text-[var(--tokyo-cyan)]',
    pillActive: 'bg-[var(--tokyo-magenta-soft)] border-[var(--tokyo-magenta)] text-[var(--tokyo-magenta)] shadow-[0_0_12px_rgba(255,0,170,0.2)]',
  },
  intercept: {
    accent: 'var(--tokyo-magenta)',
    glow: 'rgba(255, 0, 170, 0.6)',
    bg: 'bg-[var(--tokyo-cyan-soft)]',
    border: 'border-[var(--tokyo-border-cyan)]',
    text: 'text-[var(--tokyo-cyan)]',
    pill: 'border-[var(--tokyo-border-cyan)] text-[var(--tokyo-cyan)]/60 hover:border-[var(--tokyo-cyan)] hover:text-[var(--tokyo-cyan)]',
    pillActive: 'bg-[var(--tokyo-magenta-soft)] border-[var(--tokyo-magenta)] text-[var(--tokyo-magenta)] shadow-[0_0_12px_rgba(255,0,170,0.2)]',
  },
  history: {
    accent: 'var(--tokyo-magenta)',
    glow: 'rgba(255, 0, 170, 0.6)',
    bg: 'bg-[var(--tokyo-cyan-soft)]',
    border: 'border-[var(--tokyo-border-cyan)]',
    text: 'text-[var(--tokyo-cyan)]',
    pill: 'border-[var(--tokyo-border-cyan)] text-[var(--tokyo-cyan)]/60 hover:border-[var(--tokyo-cyan)] hover:text-[var(--tokyo-cyan)]',
    pillActive: 'bg-[var(--tokyo-magenta-soft)] border-[var(--tokyo-magenta)] text-[var(--tokyo-magenta)] shadow-[0_0_12px_rgba(255,0,170,0.2)]',
  },
}

const TYPE_OPTIONS: Record<string, { value: string; label: string; desc: string }[]> = {
  proxy: [
    { value: 'MatchReplace', label: 'MATCH & REPLACE', desc: 'Find and substitute content' },
    { value: 'Delay', label: 'INJECT DELAY', desc: 'Add latency to matching traffic' },
    { value: 'drop', label: 'DROP TRAFFIC', desc: 'Block matching requests/responses' },
  ],
  intercept: [
    { value: 'MatchReplace', label: 'MATCH & REPLACE', desc: 'Find and substitute content' },
    { value: 'Delay', label: 'INJECT DELAY', desc: 'Add latency to matching traffic' },
    { value: 'drop', label: 'DROP TRAFFIC', desc: 'Block matching requests/responses' },
  ],
  history: [
    { value: 'Hide', label: 'HIDE TRAFFIC', desc: 'Filter out matching entries' },
    { value: 'Show', label: 'SHOW ONLY', desc: 'Show only matching entries' },
  ],
}

const SCOPE_OPTIONS = [
  { value: 'url', label: 'URL' },
  { value: 'request_header', label: 'REQ HDR' },
  { value: 'request_body', label: 'REQ BODY' },
  { value: 'response_header', label: 'RES HDR' },
  { value: 'response_body', label: 'RES BODY' },
  { value: 'all', label: 'ALL' },
]

function RuleEditor({ rule, category, onClose, onSave }: RuleModalProps) {
  const { rules } = useProxyWebsocket()
  const [type, setType] = useState(rule?.type || (category === 'history' ? 'Hide' : 'MatchReplace'))
  const [scope, setScope] = useState(rule?.scope || 'url')
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.proxy
  const typeOptions = TYPE_OPTIONS[category] || TYPE_OPTIONS.proxy

  const handleSave = () => {
    const name = (document.getElementById('rule-name') as HTMLInputElement).value
    const pattern = (document.getElementById('rule-pattern') as HTMLInputElement).value
    const replacement = (document.getElementById('rule-replacement') as HTMLInputElement)?.value || ''
    const delay = parseInt((document.getElementById('rule-delay') as HTMLInputElement)?.value || '0')

    onSave({
      id: rule?.id || crypto.randomUUID(),
      category: rule?.category || category,
      enabled: rule?.enabled ?? true,
      name,
      type,
      scope,
      pattern,
      replacement,
      delay_ms: delay,
      cel_expression: "",
      color: "",
      visible: true
    } as Rule)
  }

  return (
    <CyberPanel
      title={`${rule?.name ? 'MODIFY' : 'NEW'} ${category.toUpperCase()} RULE`}
      icon={<div className="size-1.5 rounded-full" style={{ backgroundColor: colors.accent, boxShadow: `0 0 10px ${colors.glow}` }} />}
      className="h-full shadow-[0_0_40px_rgba(0,0,0,0.4)]"
      actions={
        <button onClick={onClose} className="text-muted-foreground/30 hover:text-white transition-colors p-1">
          <X className="size-4" />
        </button>
      }
    >
      <div className="flex flex-col h-full bg-[var(--tokyo-panel)]">
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">

            {/* Rule Name */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.2em] text-[var(--tokyo-cyan)]/65 font-black">Rule Name</label>
              <Input
                id="rule-name"
                defaultValue={rule?.name || ""}
                placeholder="e.g. Identity Cloak"
                className="h-10 bg-[var(--tokyo-panel-2)] border-[var(--tokyo-border-cyan)] text-[var(--tokyo-cyan)] text-[13px] font-mono rounded-none focus-visible:ring-1 focus-visible:ring-[var(--tokyo-magenta)] focus-visible:ring-offset-0 placeholder:text-[var(--tokyo-cyan)]/25"
                autoFocus
                key={rule?.id}
              />
            </div>

            {/* Type Selector — Pills */}
            <div className="space-y-2.5">
              <label className="text-[9px] uppercase tracking-[0.2em] text-[var(--tokyo-cyan)]/65 font-black">Operation Type</label>
              <div className="flex flex-col gap-1.5">
                {typeOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-3 py-2 px-3 border transition-all duration-200 text-left ${
                      type === opt.value ? colors.pillActive : colors.pill + ' bg-[var(--tokyo-panel-2)]'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-[10px] font-black uppercase tracking-widest">{opt.label}</div>
                      <div className={`text-[9px] mt-0.5 ${type === opt.value ? 'text-[var(--tokyo-cyan)]/75' : 'text-[var(--tokyo-cyan)]/35'}`}>{opt.desc}</div>
                    </div>
                    {type === opt.value && <div className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: colors.accent, boxShadow: `0 0 10px ${colors.glow}` }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Scope Selector — Compact Grid */}
            <div className="space-y-2.5">
              <label className="text-[9px] uppercase tracking-[0.2em] text-[var(--tokyo-cyan)]/65 font-black">Target Scope</label>
              <div className="grid grid-cols-3 gap-1">
                {SCOPE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setScope(opt.value)}
                    className={`px-1 py-2 border text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                      scope === opt.value ? colors.pillActive : colors.pill + ' bg-[var(--tokyo-panel-2)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditional Fields */}
            {type === 'Delay' && (
              <div className="space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
                <label className="text-[9px] uppercase tracking-[0.2em] text-[var(--tokyo-cyan)]/65 font-black">Latency (ms)</label>
                <div className="relative">
                  <Input
                    id="rule-delay"
                    type="number"
                    defaultValue={rule?.delay_ms || 500}
                    className="h-10 bg-[var(--tokyo-panel-2)] border-[var(--tokyo-border-cyan)] text-[var(--tokyo-cyan)] text-[13px] font-mono rounded-none pr-14"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--tokyo-cyan)]/35 tracking-wider">MS</div>
                </div>
              </div>
            )}

            {/* Pattern Field */}
            <div className="space-y-2">
              <label className="text-[9px] uppercase tracking-[0.2em] text-[var(--tokyo-cyan)]/65 font-black">Match Expression</label>
              <div className="relative">
                <Input
                  id="rule-pattern"
                  defaultValue={rule?.pattern || ""}
                  placeholder="e.g. /api/auth.*"
                  className="h-10 bg-[var(--tokyo-panel-2)] border-[var(--tokyo-border-cyan)] text-[var(--tokyo-cyan)] text-[13px] font-mono rounded-none pr-16"
                  key={rule?.id + '-pattern'}
                />
                <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black tracking-widest ${colors.text} opacity-30`}>REGEX</div>
              </div>
            </div>

            {/* Replacement Field */}
            {type === 'MatchReplace' && (
              <div className="space-y-2 animate-in slide-in-from-top-1 fade-in duration-200">
                <label className="text-[9px] uppercase tracking-[0.2em] text-[var(--tokyo-cyan)]/65 font-black">Substitution</label>
                <Input
                  id="rule-replacement"
                  defaultValue={rule?.replacement || ""}
                  placeholder="replacement_value"
                  className="h-10 bg-[var(--tokyo-panel-2)] border-[var(--tokyo-border-cyan)] text-[var(--tokyo-cyan)] text-[13px] font-mono rounded-none"
                  key={rule?.id + '-replacement'}
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── Footer Action ── */}
        <div className={`px-5 py-4 border-t ${colors.border} bg-[var(--tokyo-panel-2)] flex flex-col gap-3 shrink-0`}>
          <Button
            className="w-full h-10 text-[11px] font-black uppercase tracking-[0.2em] text-white rounded-none shadow-lg transition-all active:scale-[0.98]"
            style={{ backgroundColor: colors.accent, boxShadow: `0 0 15px ${colors.glow.replace('0.6', '0.2')}` }}
            onClick={handleSave}
          >
            {rule?.id && rules.find(r => r.id === rule.id) ? 'APPLY CHANGES' : 'CREATE RULE'}
          </Button>
          <div className="text-center opacity-40 hover:opacity-100 transition-opacity">
            <button 
              onClick={onClose}
              className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
            >
              Discard and Close
            </button>
          </div>
        </div>
      </div>
    </CyberPanel>
  )
}

export function ProxyModule({ defaultTab = "overview" }: { defaultTab?: "overview" | "history" | "intercept" | "match" }) {
  return (
    <Tabs defaultValue={defaultTab} className="flex h-full flex-col overflow-hidden">

      <TabsContent value="overview" className="flex-1 m-0 overflow-hidden"><ProxyOverview /></TabsContent>
      <TabsContent value="intercept" className="flex-1 m-0 overflow-hidden"><InterceptTabV2 /></TabsContent>
      <TabsContent value="history" className="flex-1 m-0 overflow-hidden"><HistoryTab /></TabsContent>
      <TabsContent value="match" className="flex-1 m-0 overflow-hidden"><RulesTab /></TabsContent>
    </Tabs>
  )
}


function ProxyOverview() {
  const {
    requests,
    telemetry,
    isConnected,
    isLive,
    setIsLive,
    isInterceptEnabled,
    setIsInterceptEnabled,
    clearHistory,
  } = useProxyWebsocket()
  const [proxyPort, setProxyPort] = useState(8081)
  const [proxyHost, setProxyHost] = useState("127.0.0.1")
  const [isProxyRunning, setIsProxyRunning] = useState(true)
  const [isRestarting, setIsRestarting] = useState(false)
  const [isGeneratingCert, setIsGeneratingCert] = useState(false)

  const refreshProxySettings = useCallback(async () => {
    if (App.GetProxySettings) {
      const settings = await App.GetProxySettings()
      if (settings?.host) setProxyHost(String(settings.host))
      else if (settings?.address) setProxyHost(String(settings.address).replace(/^:/, "127.0.0.1:").split(":")[0] || "127.0.0.1")
      if (settings?.port) setProxyPort(Number(settings.port))
      if (typeof settings?.running === "boolean") setIsProxyRunning(settings.running)
    } else if (App.IsProxyRunning) {
      setIsProxyRunning(await App.IsProxyRunning())
    }
  }, [])

  useEffect(() => {
    refreshProxySettings().catch(() => undefined)
  }, [refreshProxySettings])

  const restartProxy = async () => {
    setIsRestarting(true)
    try {
      if (App.RestartProxy) await App.RestartProxy()
      await refreshProxySettings()
      setIsLive(true)
    } finally {
      setTimeout(() => setIsRestarting(false), 500)
    }
  }

  const startProxy = async () => {
    setIsRestarting(true)
    try {
      if (App.StartProxy) setIsProxyRunning(await App.StartProxy())
      else if (App.RestartProxy) await App.RestartProxy()
      await refreshProxySettings()
      setIsLive(true)
    } finally {
      setTimeout(() => setIsRestarting(false), 500)
    }
  }

  const stopProxy = async () => {
    setIsRestarting(true)
    try {
      if (App.StopProxy) await App.StopProxy()
      await refreshProxySettings()
    } finally {
      setTimeout(() => setIsRestarting(false), 500)
    }
  }

  const exportHistory = () => {
    downloadHAR(buildHAR(requests))
  }

  const generateCertificate = async () => {
    setIsGeneratingCert(true)
    try {
      if (App.RegenerateCA) await App.RegenerateCA()
    } finally {
      setTimeout(() => setIsGeneratingCert(false), 650)
    }
  }

  const totalBytes = requests.reduce((sum, req) => sum + (req.request_size || 0) + (req.size || 0), 0)
  const successful = requests.filter(req => (req.status_code || 0) >= 200 && (req.status_code || 0) < 400).length
  const avgLatency = requests.length
    ? Math.round(requests.reduce((sum, req) => sum + (req.latency || 0), 0) / requests.length)
    : 0

  const statCards = [
    { label: "Captured", value: requests.length.toLocaleString(), accent: "var(--accent)" },
    { label: "Success", value: successful.toLocaleString(), accent: "var(--status-success)" },
    { label: "Throughput", value: `${telemetry?.rps ?? 0}/s`, accent: "var(--status-info)" },
    { label: "Avg Time", value: `${avgLatency}ms`, accent: "var(--status-warning)" },
  ]

  return (
    <div className="h-full overflow-auto p-3">
      <div className="grid h-full min-h-[720px] grid-cols-[minmax(420px,0.9fr)_minmax(540px,1.1fr)] gap-3 2xl:grid-cols-[520px_1fr]">
        <CyberPanel title="Proxy Control" icon={<Power className="size-3.5" />} className="min-h-0">
          <div className="flex h-full flex-col gap-5 p-5">
            <div className="rounded-[14px] border border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel)] p-5 shadow-inner shadow-[rgba(0,240,255,0.04)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--tokyo-cyan)]">Proxy Engine</div>
                  <div className="mt-1 flex items-center gap-2 text-xl font-semibold text-[var(--tokyo-cyan)]">
                    {isProxyRunning ? "Listening" : "Stopped"}
                    <span className={`size-2 rounded-full ${isConnected && isProxyRunning ? "bg-[var(--status-success)]" : "bg-[var(--status-error)]"} shadow-[0_0_14px_currentColor]`} />
                  </div>
                </div>
                <button
                  className={`proxy-power-toggle ${isProxyRunning ? "is-on" : ""}`}
                  onClick={() => isProxyRunning ? stopProxy() : startProxy()}
                  aria-label="Toggle proxy listener"
                >
                  <span />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="proxy-detail-card">
                  <Server className="size-4 text-[var(--accent)]" />
                  <span>Host</span>
                  <strong>{proxyHost}</strong>
                </div>
                <div className="proxy-detail-card">
                  <Radio className="size-4 text-[var(--status-info)]" />
                  <span>Port</span>
                  <strong>{proxyPort}</strong>
                </div>
                <div className="proxy-detail-card">
                  <Crosshair className="size-4 text-[var(--status-error)]" />
                  <span>Intercept</span>
                  <strong>{isInterceptEnabled ? "Enabled" : "Disabled"}</strong>
                </div>
                <div className="proxy-detail-card">
                  <Activity className="size-4 text-[var(--status-success)]" />
                  <span>Traffic</span>
                  <strong>{formatBytes(totalBytes)}</strong>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {statCards.map((stat) => (
                <div key={stat.label} className="stat-tile">
                  <span>{stat.label}</span>
                  <strong style={{ color: stat.accent }}>{stat.value}</strong>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button className="premium-action" onClick={restartProxy} disabled={isRestarting}>
                <RefreshCw className={`size-4 ${isRestarting ? "animate-spin" : ""}`} />
                Restart Proxy
              </Button>
              <Button variant="outline" className="premium-action secondary" onClick={isProxyRunning ? stopProxy : startProxy} disabled={isRestarting}>
                <Power className="size-4" />
                {isProxyRunning ? "Stop Proxy" : "Start Proxy"}
              </Button>
              <Button variant="outline" className="premium-action secondary" onClick={clearHistory}>
                <Trash2 className="size-4" />
                Clear
              </Button>
              <Button variant="outline" className="premium-action secondary" onClick={exportHistory}>
                <Download className="size-4" />
                Export
              </Button>
              <Button variant="outline" className="premium-action secondary">
                <Upload className="size-4" />
                Import
              </Button>
              <Button variant="outline" className="premium-action secondary" onClick={generateCertificate} disabled={isGeneratingCert}>
                <FileKey2 className="size-4" />
                Generate Certificate
              </Button>
            </div>
          </div>
        </CyberPanel>

        <CyberPanel title="Traffic Operations" icon={<ShieldCheck className="size-3.5" />} className="min-h-0">
          <div className="grid h-full grid-rows-[auto_1fr] gap-3 p-4">
            <div className="grid grid-cols-3 gap-3">
              <button
                className={`ops-card ${isInterceptEnabled ? "is-danger" : ""}`}
                onClick={() => setIsInterceptEnabled(!isInterceptEnabled)}
              >
                <Crosshair className="size-5" />
                <span>Intercept State</span>
                <strong>{isInterceptEnabled ? "Holding" : "Pass-through"}</strong>
              </button>
              <div className="ops-card">
                <Wifi className="size-5" />
                <span>Backend</span>
                <strong>{isConnected ? "Online" : "Offline"}</strong>
              </div>
              <div className="ops-card">
                <Activity className="size-5" />
                <span>Duration</span>
                <strong>{avgLatency}ms avg</strong>
              </div>
            </div>

            <div className="overflow-hidden rounded-[12px] border border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel)]">
              <div className="flex h-9 items-center border-b border-[var(--tokyo-border-cyan)] px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--tokyo-cyan)]">
                Recent Traffic
              </div>
              <div className="h-[calc(100%-36px)] overflow-auto">
                {requests.slice(-12).reverse().map((req) => (
                  <div key={req._uid} className="recent-row">
                    <span className={`method-badge method-${(req.method || "get").toLowerCase()}`}>{req.method || "GET"}</span>
                    <span className="truncate font-mono text-[var(--tokyo-cyan)]">{req.host}{req.path}</span>
                    <span className="ml-auto font-mono text-[var(--tokyo-cyan)]/70">{req.status_code || "-"}</span>
                  </div>
                ))}
                {requests.length === 0 && (
                  <div className="flex h-full min-h-[260px] items-center justify-center text-center text-xs text-[var(--tokyo-cyan)]/55">
                    Waiting for traffic on {proxyHost}:{proxyPort}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CyberPanel>
      </div>
    </div>
  )
}
