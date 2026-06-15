"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
    Globe,
    Folder,
    File,
    ChevronRight,
    ChevronDown,
    Search,
    Plus,
    Target,
    Settings2,
    Zap,
    Shield,
    Network,
    Trash2,
    Layout,
    Play,
    Square,
    Bug,
    Clock,
    History,
    Loader2
} from "lucide-react"
import { useProxyWebsocket } from "@/lib/proxy-store"
import { useSiteMap } from "@/hooks/use-site-map"
import { Button } from "@/components/ui/button"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MonoInput } from "@/components/proxy/ui/mono-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrafficTable, useTrafficTable, DEFAULT_VISIBLE } from "./traffic-table"
import { ContextMenu, type CtxState } from "./traffic-shared"
import { buildURL } from "./traffic-utils"
import { Inspector } from "@/components/proxy/inspector"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
// @ts-ignore
import { EventsOn, EventsOff } from "@wailsjs/runtime/runtime"
// @ts-ignore
import * as App from "@wailsjs/go/backend/App"
import type { SiteNode } from "@/types/proxy"

// --- Components ---

interface TreeNodeProps {
    node: SiteNode
    depth: number
    onSelect: (node: SiteNode) => void
    selectedPath: string | null
}

function TreeNode({ node, depth, onSelect, selectedPath }: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState(depth === 0)
    const isSelected = selectedPath === node.fullPath
    const hasChildren = node.children.size > 0

    const colorClass = node.methods.has("POST") ? "text-amber-400" : node.methods.has("DELETE") ? "text-red-400" : "text-[var(--accent)]"

    return (
        <div className="flex flex-col select-none">
            <div
                className={`flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-white/5 transition-colors group ${isSelected ? 'bg-sky-500/10 border-r-2 border-sky-500' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => {
                    onSelect(node)
                    if (hasChildren) setIsOpen(!isOpen)
                }}
            >
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {hasChildren ? (
                        isOpen ? <ChevronDown className="size-3 text-muted-foreground/50" /> : <ChevronRight className="size-3 text-muted-foreground/50" />
                    ) : null}
                </div>
                <div className="shrink-0">
                    {depth === 0 ? (
                        <Globe className={`size-3.5 ${isSelected ? 'text-[var(--accent)]' : 'text-muted-foreground/40'}`} />
                    ) : hasChildren ? (
                        <Folder className={`size-3.5 ${isSelected ? 'text-amber-400' : 'text-muted-foreground/30'}`} />
                    ) : (
                        <File className={`size-3.5 ${isSelected ? colorClass : 'text-muted-foreground/20'}`} />
                    )}
                </div>
                <span className={`text-[11px] font-mono truncate transition-colors ${isSelected ? 'text-[var(--accent)] font-bold' : 'text-muted-foreground/80 group-hover:text-foreground'}`}>
                    {node.label}
                </span>
                {node.requests > 1 && (
                    <span className="text-[9px] text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 px-1 py-0.5 border border-border/10 rounded-sm">
                        {node.requests}
                    </span>
                )}
            </div>

            {isOpen && hasChildren && (
                <div className="flex flex-col">
                    {Array.from(node.children.entries()).map(([_, child]) => (
                        <TreeNode key={child.fullPath} node={child} depth={depth + 1} onSelect={onSelect} selectedPath={selectedPath} />
                    ))}
                </div>
            )}
        </div>
    )
}

function SitemapTab() {
    const { requests } = useProxyWebsocket()
    const { tree } = useSiteMap(requests)
    const [selectedNode, setSelectedNode] = useState<SiteNode | null>(null)
    const [search, setSearch] = useState("")

    // Traffic Table state
    const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set())
    const [lastSelectedUid, setLastSelectedUid] = useState<string | null>(null)
    const [isInspectorVisible, setIsInspectorVisible] = useState(true)
    const [ctxMenu, setCtxMenu] = useState<CtxState | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const nodeRequests = useMemo(() => {
        if (!selectedNode) return []
        const uids = new Set(selectedNode.eventUids)
        return requests.filter(r => uids.has(r._uid))
    }, [selectedNode, requests])

    const tableState = useTrafficTable({
        data: nodeRequests,
        storageKey: "proxy_map_col_v1",
        containerRef,
        initialVisible: DEFAULT_VISIBLE
    })

    const selectedReq = useMemo(() => {
        const uid = lastSelectedUid || Array.from(selectedUids).pop()
        return uid ? requests.find(r => r._uid === uid) : undefined
    }, [lastSelectedUid, selectedUids, requests])

    const handleNodeSelect = (node: SiteNode) => {
        setSelectedNode(node)
        setSelectedUids(new Set())
        setLastSelectedUid(null)
    }

    const filteredTree = useMemo(() => {
        if (!search) return tree
        const filtered = new Map<string, SiteNode>()
        for (const [hostName, node] of tree.entries()) {
            if (hostName.toLowerCase().includes(search.toLowerCase())) {
                filtered.set(hostName, node)
            }
        }
        return filtered
    }, [tree, search])

    return (
        <div className="flex h-full w-full overflow-hidden p-2 gap-2 bg-background/50">
            {ctxMenu && <ContextMenu ctx={ctxMenu} onClose={() => setCtxMenu(null)} selectedUids={selectedUids} allData={requests} />}

            <ResizablePanelGroup direction="horizontal" id="map-main-group" className="flex-1 gap-2">
                <ResizablePanel id="map-tree-panel" defaultSize={25} minSize={15} className="flex flex-col min-h-0 min-w-0">
                    <CyberPanel title="Tree" icon={<Target className="size-3" />} className="h-full">
                        <div className="flex flex-col h-full overflow-hidden">
                            <div className="p-2 border-b border-border/10 bg-muted/5 shrink-0">
                                <MonoInput
                                    icon={<Search className="size-3" />}
                                    placeholder="Filter tree..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="h-7 text-[10px]"
                                />
                            </div>
                            <ScrollArea className="flex-1 scrollbar-cyber">
                                <div className="py-2">
                                    {Array.from(filteredTree.entries()).map(([_, node]) => (
                                        <TreeNode key={node.fullPath} node={node} depth={0} onSelect={handleNodeSelect} selectedPath={selectedNode?.fullPath || null} />
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    </CyberPanel>
                </ResizablePanel>

                <ResizableHandle id="map-tree-handle" className="w-1 bg-transparent hover:bg-sky-500/20 transition-colors" />

                <ResizablePanel id="map-content-panel" defaultSize={75} minSize={30} className="flex flex-col min-h-0 min-w-0">
                    {selectedNode ? (
                        <CyberPanel
                            title={selectedNode.fullPath}
                            icon={<Network className="size-3" />}
                            className="h-full"
                            actions={
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className={`size-6 ${isInspectorVisible ? "text-[var(--accent)] bg-sky-500/10" : "text-muted-foreground"}`} onClick={() => setIsInspectorVisible(!isInspectorVisible)}>
                                        <Layout className="size-3" />
                                    </Button>
                                </div>
                            }
                        >
                            <ResizablePanelGroup direction="vertical" id="map-detail-group" className="flex-1">
                                <ResizablePanel id="map-table-panel" defaultSize={50} minSize={20} className="flex flex-col min-h-0 min-w-0">
                                    <div className="flex-1 min-h-0 flex flex-col bg-background/30" ref={containerRef}>
                                        <TrafficTable
                                            tableState={tableState}
                                            containerRef={containerRef}
                                            selectedUids={selectedUids}
                                            matchedIds={new Set()}
                                            rowColors={{}}
                                            isAnchored={true}
                                            onRowClick={(uid, e) => {
                                                setSelectedUids(prev => {
                                                    const next = new Set(prev)
                                                    if (e.ctrlKey || e.metaKey) {
                                                        if (next.has(uid)) next.delete(uid)
                                                        else next.add(uid)
                                                    } else {
                                                        next.clear()
                                                        next.add(uid)
                                                    }
                                                    setLastSelectedUid(uid)
                                                    return next
                                                })
                                            }}
                                            onCtxMenu={(req, e) => {
                                                e.preventDefault()
                                                setSelectedUids(prev => {
                                                    if (!prev.has(req._uid)) {
                                                        setLastSelectedUid(req._uid)
                                                        return new Set([req._uid])
                                                    }
                                                    return prev
                                                })
                                                setCtxMenu({ req, x: e.clientX, y: e.clientY })
                                            }}
                                        />
                                    </div>
                                </ResizablePanel>

                                {isInspectorVisible && (
                                    <>
                                        <ResizableHandle id="map-detail-handle" className="h-1 bg-border/5 hover:bg-sky-500/20 transition-colors" />
                                        <ResizablePanel id="map-inspector-panel" defaultSize={50} minSize={20} className="flex flex-col min-h-0 min-w-0 bg-background/50">
                                            <div className="flex-1 overflow-hidden h-full flex flex-col">
                                                {selectedReq ? (
                                                    <Tabs defaultValue="request" className="flex-1 flex flex-col overflow-hidden">
                                                        <div className={`h-8 border-b border-border/10 bg-muted/5 flex items-center px-1 shrink-0 select-none ${!selectedReq ? 'opacity-30 pointer-events-none' : ''}`}>
                                                            <TabsList className="h-6 bg-transparent gap-0 p-0">
                                                                <TabsTrigger value="request" className="h-full text-[10px] uppercase tracking-tight px-3 data-[state=active]:bg-sky-500/10 data-[state=active]:text-[var(--accent)] rounded-none border-0">Request</TabsTrigger>
                                                                <TabsTrigger value="response" disabled={!selectedReq || (selectedReq as any).status_code === 0} className="h-full text-[10px] uppercase tracking-tight px-3 data-[state=active]:bg-sky-500/10 data-[state=active]:text-[var(--accent)] rounded-none border-0">Response</TabsTrigger>
                                                            </TabsList>
                                                        </div>
                                                        <TabsContent value="request" className="flex-1 m-0 overflow-hidden">
                                                            <Inspector content={selectedReq.request_raw || ""} url={buildURL(selectedReq as any)} className="h-full" disabled={!selectedReq} />
                                                        </TabsContent>
                                                        <TabsContent value="response" className="flex-1 m-0 overflow-hidden">
                                                            <Inspector content={selectedReq.response_raw || ""} url={buildURL(selectedReq as any)} className="h-full" isResponse={true} disabled={!selectedReq || (selectedReq as any).status_code === 0} />
                                                        </TabsContent>
                                                    </Tabs>
                                                ) : (
                                                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 italic text-[10px] uppercase tracking-widest">
                                                        No Request Selected
                                                    </div>
                                                )}
                                            </div>
                                        </ResizablePanel>
                                    </>
                                )}
                            </ResizablePanelGroup>
                        </CyberPanel>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-muted/5 border border-dashed border-border/20 rounded-lg">
                            <Target className="size-12 text-muted-foreground/10 mb-4" />
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">Select a node</h3>
                            <p className="text-[10px] mt-2 text-muted-foreground/20 max-w-[200px] text-center">
                                Browse the tree to view specific endpoint details and traffic history.
                            </p>
                        </div>
                    )}
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

interface SpiderResult {
    id: string
    url: string
    source: string
    time: string
    mode: string
}

function WorkersTab() {
    const { requests } = useProxyWebsocket()
    const [activeTab, setActiveTab] = useState("spider")
    const [targetUrl, setTargetUrl] = useState("")
    const [isSpidering, setIsSpidering] = useState(false)
    const [spiderMode, setSpiderMode] = useState<"passive" | "standard" | "ajax">("standard")
    const [maxDepth, setMaxDepth] = useState(3)
    const [spiderResults, setSpiderResults] = useState<SpiderResult[]>([])
    const [titusResults, setTitusResults] = useState<any[]>([])
    const [wappalyzerResults, setWappalyzerResults] = useState<any>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [followRedirects, setFollowRedirects] = useState(true)
    const [selectedUids, setSelectedUids] = useState<Set<string>>(new Set())
    const [lastSelectedUid, setLastSelectedUid] = useState<string | null>(null)
    const [isInspectorVisible, setIsInspectorVisible] = useState(true)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleResult = (res: SpiderResult) => setSpiderResults(prev => [res, ...prev].slice(0, 1000))
        const handleStop = () => setIsSpidering(false)
        const handleTitus = (evt: any) => setTitusResults(prev => [evt, ...prev].slice(0, 1000))
        EventsOn("spider_result", handleResult)
        EventsOn("spider_stopped", handleStop)
        EventsOn("titus_alert", handleTitus)
        return () => {
            EventsOff("spider_result")
            EventsOff("spider_stopped")
            EventsOff("titus_alert")
        }
    }, [])

    const startSpider = async () => {
        if (!targetUrl) return
        setSpiderResults([])
        setIsSpidering(true)
        try { await App.StartSpider({ url: targetUrl, mode: spiderMode, max_depth: maxDepth }) }
        catch (err) { console.error("Failed to start spider", err); setIsSpidering(false) }
    }

    const stopSpider = async () => {
        try { await App.StopSpider(); setIsSpidering(false) }
        catch (err) { console.error("Failed to stop spider", err) }
    }

    const runWappalyzer = async () => {
        if (!targetUrl) return
        setIsAnalyzing(true)
        setWappalyzerResults(null)
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/wappalyzer?url=${encodeURIComponent(targetUrl)}`)
            const data = await res.json()
            setWappalyzerResults(data)
        } catch (err) {
            console.error("Wappalyzer failed", err)
            setWappalyzerResults({ error: "Failed to connect to analyzer" })
        } finally {
            setIsAnalyzing(false)
        }
    }

    const filteredRequests = useMemo(() => {
        if (!targetUrl) return requests.filter(r => r.source === "spider")
        try {
            const host = new URL(targetUrl).host
            return requests.filter(r => (r.host === host || r.source === "spider"))
        } catch { return requests.filter(r => r.source === "spider") }
    }, [requests, targetUrl])

    const tableState = useTrafficTable({
        data: filteredRequests,
        storageKey: "proxy_workers_col_v1",
        containerRef,
        initialVisible: DEFAULT_VISIBLE
    })

    const selectedReq = useMemo(() => {
        const uid = lastSelectedUid || Array.from(selectedUids).pop()
        return uid ? requests.find(r => r._uid === uid) : undefined
    }, [lastSelectedUid, selectedUids, requests])

    return (
        <div className="flex h-full w-full overflow-hidden p-2 gap-2 bg-background/50">
            <ResizablePanelGroup direction="horizontal" id="workers-main-group" className="flex-1 gap-2">
                <ResizablePanel id="workers-config-panel" defaultSize={25} minSize={20} className="flex flex-col min-h-0 min-w-0">
                    <CyberPanel title="Worker Config" icon={<Settings2 className="size-3" />} className="h-full">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                            <div className="px-2 pt-2 shrink-0">
                                <TabsList className="w-full bg-muted/5 gap-1 p-1 h-8 rounded-lg border-b-0">
                                    <TabsTrigger value="spider" className="flex-1 h-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-sky-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
                                        <Zap className="size-3 mr-1.5" /> Spider
                                    </TabsTrigger>
                                    <TabsTrigger value="titus" className="flex-1 h-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-rose-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
                                        <Shield className="size-3 mr-1.5" /> Titus
                                    </TabsTrigger>
                                    <TabsTrigger value="analyzer" className="flex-1 h-6 text-[10px] font-bold uppercase tracking-widest data-[state=active]:bg-amber-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">
                                        <Bug className="size-3 mr-1.5" /> Wappalyzer
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                            <ScrollArea className="flex-1 px-4 py-4 shrink-0">
                                <TabsContent value="spider" className="m-0 space-y-6">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target URL</Label>
                                        <MonoInput
                                            icon={<Globe className="size-3 text-[var(--accent)]" />}
                                            placeholder="https://example.com"
                                            value={targetUrl}
                                            onChange={e => setTargetUrl(e.target.value)}
                                            className="border-sky-500/20 focus:border-sky-500/50 text-[10px]"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Engine Mode</Label>
                                        <div className="grid grid-cols-3 gap-1">
                                            {(["passive", "standard", "ajax"] as const).map(mode => (
                                                <Button
                                                    key={mode}
                                                    variant="outline"
                                                    size="sm"
                                                    className={`h-7 text-[9px] uppercase font-bold ${spiderMode === mode ? "bg-sky-500/20 border-sky-500/50 text-[var(--accent)]" : "bg-muted/5 text-muted-foreground"}`}
                                                    onClick={() => setSpiderMode(mode)}
                                                >
                                                    {mode}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold">Max Depth</Label>
                                            <input type="number" value={maxDepth} onChange={e => setMaxDepth(parseInt(e.target.value))} className="w-12 h-6 bg-muted/10 border border-border/20 rounded px-1 text-[10px] font-mono text-center" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-bold">Follow Redirects</Label>
                                            <Switch checked={followRedirects} onCheckedChange={setFollowRedirects} className="scale-75" />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex gap-2">
                                        {isSpidering ? (
                                            <Button variant="destructive" className="flex-1 h-9 text-[11px] font-black uppercase tracking-widest" onClick={stopSpider}>
                                                <Square className="size-3.5 mr-2 fill-current" /> Stop
                                            </Button>
                                        ) : (
                                            <Button className="flex-1 h-9 text-[11px] font-black uppercase tracking-widest bg-sky-500 hover:bg-[var(--accent)] text-white shadow-[0_4px_10px_rgba(56,189,248,0.3)]" onClick={startSpider} disabled={!targetUrl}>
                                                <Play className="size-3.5 mr-2 fill-current" /> Launch
                                            </Button>
                                        )}
                                    </div>
                                </TabsContent>
                                 <TabsContent value="titus" className="m-0 h-full">
                                    <div className="flex-1 flex flex-col bg-muted/5 border border-border/10 rounded-md p-2 h-full">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="size-3.5 text-rose-400" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Passive Secrets Scan</span>
                                            <div className="ml-auto flex items-center gap-2">
                                                <span className="relative flex h-2 w-2">
                                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">Monitoring</span>
                                            </div>
                                        </div>
                                        <ScrollArea className="flex-1 min-h-0 container">
                                            <div className="space-y-2 px-1">
                                                {titusResults.length > 0 ? titusResults.map((res, i) => (
                                                    <div key={i} className="flex flex-col gap-1 text-[9px] font-mono border-l-2 border-rose-500/50 bg-background/50 p-2 rounded-r-md">
                                                        <div className="flex justify-between items-center text-muted-foreground">
                                                            <span className="text-foreground font-bold">{res.rule_name}</span>
                                                            <span className="text-[8px] opacity-50">{res.source} • {res.rule_id}</span>
                                                        </div>
                                                        <div className="text-rose-400 break-all">{res.match}</div>
                                                        <div className="text-muted-foreground/50 truncate text-[8px]">{res.url}</div>
                                                    </div>
                                                )) : <div className="text-muted-foreground/30 italic text-center p-4">No secrets detected yet. Navigate to trigger scans.</div>}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                 </TabsContent>
                                 <TabsContent value="analyzer" className="m-0 space-y-4">
                                     <div className="space-y-3">
                                         <div className="space-y-2">
                                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Target URL</Label>
                                             <div className="flex gap-2">
                                                 <MonoInput 
                                                     icon={<Globe className="size-3 text-amber-400" />}
                                                     placeholder="https://example.com"
                                                     value={targetUrl}
                                                     onChange={e => setTargetUrl(e.target.value)}
                                                     className="flex-1 h-8 text-[10px] border-amber-500/20"
                                                 />
                                                 <Button 
                                                     size="sm" 
                                                     className="h-8 bg-amber-500 hover:bg-amber-400 text-white font-black uppercase text-[10px] tracking-widest px-4"
                                                     onClick={runWappalyzer}
                                                     disabled={isAnalyzing || !targetUrl}
                                                 >
                                                     {isAnalyzing ? <Loader2 className="size-3 animate-spin" /> : "Analyze"}
                                                 </Button>
                                             </div>
                                         </div>

                                         <div className="bg-muted/5 border border-border/10 rounded-lg overflow-hidden min-h-[120px] flex flex-col">
                                            <div className="px-3 py-1.5 bg-muted/10 border-b border-border/10 flex items-center justify-between">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Analysis Result</span>
                                                {wappalyzerResults && !wappalyzerResults.error && (
                                                    <span className="text-[8px] text-emerald-400 font-mono">Found {wappalyzerResults.technologies?.length || 0} hits</span>
                                                )}
                                            </div>
                                            <ScrollArea className="flex-1 h-[200px]">
                                                {isAnalyzing ? (
                                                    <div className="h-full flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                                                        <Loader2 className="size-6 text-amber-500 animate-spin" />
                                                        <span className="text-[9px] uppercase font-bold tracking-widest animate-pulse">Scanning Stack...</span>
                                                    </div>
                                                ) : wappalyzerResults ? (
                                                    wappalyzerResults.error ? (
                                                        <div className="p-4 text-center space-y-2">
                                                            <div className="text-red-400 text-[10px] font-mono break-all">{wappalyzerResults.error}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="p-2 space-y-1">
                                                            {wappalyzerResults.technologies?.map((tech: any, i: number) => (
                                                                <div key={i} className="flex flex-col gap-0.5 p-2 bg-background/40 border border-border/5 rounded hover:border-amber-500/30 transition-colors group">
                                                                    <div className="flex justify-between items-center text-[10px]">
                                                                        <span className="font-bold text-foreground/90">{tech.name}</span>
                                                                        {tech.confidence && <span className="text-[8px] text-emerald-400 opacity-60 font-mono">{tech.confidence}%</span>}
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {tech.categories?.map((cat: string) => (
                                                                            <span key={cat} className="text-[8px] px-1 bg-amber-500/10 text-amber-400/80 rounded border border-amber-500/5 uppercase tracking-tighter">
                                                                                {cat}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {(!wappalyzerResults.technologies || wappalyzerResults.technologies.length === 0) && (
                                                                <div className="py-12 text-center text-muted-foreground/30 italic text-[10px]">No technologies identified</div>
                                                            )}
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-20 group hover:opacity-30 transition-opacity">
                                                        <Bug className="size-8 text-amber-500" />
                                                        <span className="text-[9px] uppercase font-bold tracking-[0.2em]">Ready for Analysis</span>
                                                    </div>
                                                )}
                                            </ScrollArea>
                                         </div>
                                     </div>
                                 </TabsContent>
                             </ScrollArea>
                            <div className="mt-auto border-t border-border/10 bg-muted/5 p-2 shrink-0">
                                <div className="flex items-center gap-1.5 mb-2 px-1">
                                    <Clock className="size-3 text-muted-foreground/40" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">Activity Log</span>
                                    {isSpidering && <Loader2 className="size-2.5 ml-auto text-[var(--accent)] animate-spin" />}
                                </div>
                                <div className="h-32 overflow-y-auto font-mono text-[9px] scrollbar-cyber space-y-1">
                                    {spiderResults.length > 0 ? spiderResults.map(res => (
                                        <div key={res.id} className="flex gap-2 text-muted-foreground/60 border-l border-border/10 pl-2 py-0.5">
                                            <span className="truncate text-foreground/70">{res.url}</span>
                                        </div>
                                    )) : <div className="text-muted-foreground/20 italic p-2 text-center">No active results</div>}
                                </div>
                            </div>
                        </Tabs>
                    </CyberPanel>
                </ResizablePanel>

                <ResizableHandle id="workers-config-handle" className="w-1 bg-transparent hover:bg-sky-500/20 transition-colors" />

                <ResizablePanel id="workers-content-panel" defaultSize={75} minSize={30} className="flex flex-col min-h-0 min-w-0">
                    <CyberPanel title="Worker History" icon={<History className="size-3" />} className="h-full" actions={
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className={`size-6 ${isInspectorVisible ? "text-[var(--accent)] bg-sky-500/10" : "text-muted-foreground"}`} onClick={() => setIsInspectorVisible(!isInspectorVisible)}>
                                <Layout className="size-3" />
                            </Button>
                        </div>
                    }>
                        <ResizablePanelGroup direction="vertical" id="workers-detail-group" className="flex-1">
                            <ResizablePanel id="workers-table-panel" defaultSize={50} minSize={20} className="flex flex-col min-h-0 min-w-0">
                                <div className="flex-1 min-h-0 flex flex-col bg-background/30" ref={containerRef}>
                                    <TrafficTable
                                        tableState={tableState}
                                        containerRef={containerRef}
                                        selectedUids={selectedUids}
                                        matchedIds={new Set()}
                                        rowColors={{}}
                                        isAnchored={false}
                                        onRowClick={(uid, e) => {
                                            setSelectedUids(prev => {
                                                const next = new Set(prev)
                                                if (e.ctrlKey || e.metaKey) {
                                                    if (next.has(uid)) next.delete(uid)
                                                    else next.add(uid)
                                                } else { next.clear(); next.add(uid) }
                                                setLastSelectedUid(uid)
                                                return next
                                            })
                                        }}
                                    />
                                </div>
                            </ResizablePanel>
                            {isInspectorVisible && (
                                <>
                                    <ResizableHandle id="workers-detail-handle" className="h-1 bg-border/5 hover:bg-sky-500/20 transition-colors" />
                                    <ResizablePanel id="workers-inspector-panel" defaultSize={50} minSize={20} className="flex flex-col min-h-0 min-w-0 bg-background/50">
                                        <div className="flex-1 overflow-hidden h-full flex flex-col">
                                            {selectedReq ? (
                                                <Tabs defaultValue="request" className="flex-1 flex flex-col overflow-hidden">
                                                    <div className={`h-8 border-b border-border/10 bg-muted/5 flex items-center px-1 shrink-0 select-none ${!selectedReq ? 'opacity-30 pointer-events-none' : ''}`}>
                                                        <TabsList className="h-6 bg-transparent gap-0 p-0">
                                                            <TabsTrigger value="request" className="h-full text-[10px] uppercase tracking-tight px-3 data-[state=active]:bg-sky-500/10 data-[state=active]:text-[var(--accent)] rounded-none border-0">Request</TabsTrigger>
                                                            <TabsTrigger value="response" disabled={!selectedReq || (selectedReq as any).status_code === 0} className="h-full text-[10px] uppercase tracking-tight px-3 data-[state=active]:bg-sky-500/10 data-[state=active]:text-[var(--accent)] rounded-none border-0">Response</TabsTrigger>
                                                        </TabsList>
                                                    </div>
                                                    <TabsContent value="request" className="flex-1 m-0 overflow-hidden">
                                                        <Inspector content={selectedReq.request_raw || ""} url={buildURL(selectedReq as any)} className="h-full" disabled={!selectedReq} />
                                                    </TabsContent>
                                                    <TabsContent value="response" className="flex-1 m-0 overflow-hidden">
                                                        <Inspector content={selectedReq.response_raw || ""} url={buildURL(selectedReq as any)} className="h-full" isResponse={true} disabled={!selectedReq || (selectedReq as any).status_code === 0} />
                                                    </TabsContent>
                                                </Tabs>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/20 italic text-[10px] uppercase tracking-widest">
                                                    No Selection
                                                </div>
                                            )}
                                        </div>
                                    </ResizablePanel>
                                </>
                            )}
                        </ResizablePanelGroup>
                    </CyberPanel>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}

function ScopeTab() {
    const [scope, setScope] = useState<string[]>(() => {
        const saved = localStorage.getItem("proxy_scope")
        return saved ? JSON.parse(saved) : ["*.example.com", "127.0.0.1"]
    })
    const [newScope, setNewScope] = useState("")

    useEffect(() => {
        localStorage.setItem("proxy_scope", JSON.stringify(scope))
        // Sync to backend DB so proxy_engine uses it
        const rules = scope.map((host, i) => ({
            id: i + 1,
            enabled: true,
            type: "include",
            protocol: "Any",
            host: host,
            path: ".*"
        }))
        // Ensure traffic is never dropped if scope is visually empty
        if (rules.length === 0) {
            rules.push({ id: 1, enabled: true, type: "include", protocol: "Any", host: ".*", path: ".*" })
        }
        App.SaveScopeRules(rules).catch(console.error)
    }, [scope])

    const addScope = () => {
        if (!newScope || scope.includes(newScope)) return
        setScope(prev => [...prev, newScope])
        setNewScope("")
    }

    const removeScope = (item: string) => setScope(prev => prev.filter(i => i !== item))

    return (
        <div className="flex h-full w-full overflow-hidden p-4 gap-4 bg-background/50">
            <CyberPanel title="Target Scope" icon={<Shield className="size-3" />} className="flex-1 max-w-2xl mx-auto">
                <div className="flex flex-col h-full p-4 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/50">Definition</Label>
                        <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
                            Define which hosts, IP ranges, or URL patterns are considered "in-scope". 
                            Future updates will allow filtering the Sitemap and History based on these rules.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <MonoInput
                                icon={<Plus className="size-3" />}
                                placeholder="Add pattern (e.g. *.google.com)"
                                value={newScope}
                                onChange={e => setNewScope(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && addScope()}
                                className="flex-1 h-9 text-[11px]"
                            />
                            <Button className="h-9 px-4 bg-sky-500 hover:bg-[var(--accent)] text-white font-bold" onClick={addScope}>
                                Add
                            </Button>
                        </div>

                        <ScrollArea className="h-[400px] border border-border/10 rounded-lg bg-muted/5 p-2">
                            <div className="space-y-1">
                                {scope.length > 0 ? scope.map(item => (
                                    <div key={item} className="flex items-center justify-between px-3 py-2 bg-muted/10 border border-border/5 rounded border-l-2 border-l-sky-500/50 group">
                                        <span className="text-[11px] font-mono text-foreground/80">{item}</span>
                                        <Button variant="ghost" size="icon" className="size-6 text-muted-foreground/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all" onClick={() => removeScope(item)}>
                                            <Trash2 className="size-3" />
                                        </Button>
                                    </div>
                                )) : (
                                    <div className="flex flex-col items-center justify-center py-12 opacity-20">
                                        <Shield className="size-8 mb-2" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest">No scope defined</span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </CyberPanel>
        </div>
    )
}

export function MapModule() {
    const [activeTab, setActiveTab] = useState("sitemap")

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-background">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-0 gap-0">
                <div className="border-b px-3 shrink-0 bg-background/40 backdrop-blur-md z-30">
                    <TabsList className="h-9 bg-muted/5 gap-1 p-1 border-b-0 rounded-lg">
                        <TabsTrigger value="sitemap" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-sky-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">Sitemap</TabsTrigger>
                        <TabsTrigger value="workers" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-amber-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">Workers</TabsTrigger>
                        <TabsTrigger value="scope" className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200">Scope</TabsTrigger>
                    </TabsList>
                </div>
                <div className="flex-1 min-h-0 relative">
                    <TabsContent value="sitemap" className="h-full m-0 focus-visible:outline-none absolute inset-0"><SitemapTab /></TabsContent>
                    <TabsContent value="workers" className="h-full m-0 focus-visible:outline-none absolute inset-0"><WorkersTab /></TabsContent>
                    <TabsContent value="scope" className="h-full m-0 focus-visible:outline-none absolute inset-0"><ScopeTab /></TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
