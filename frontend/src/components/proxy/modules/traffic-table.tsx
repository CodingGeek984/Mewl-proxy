import { useState, useMemo, useRef, memo, useEffect, useLayoutEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowUp, ArrowDown, GripVertical, RotateCcw } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { type TrafficEvent } from "@/types/proxy"
import { ContextMenu as RContextMenu, ContextMenuContent as RContextMenuContent, ContextMenuItem as RContextMenuItem, ContextMenuTrigger as RContextMenuTrigger } from "@/components/ui/context-menu"
import {
    formatBytes,
    buildURL,
    copyText,
    toCurlWin,
    toCurlPosix,
    toPowerShell,
    toFetch,
    toPython,
    toGo,
    getRequestHeader,
    formatProtocol,
    getFileFromPath,
    buildHAR,
    downloadHAR,
    ALL_COLUMNS,
    DEFAULT_VISIBLE,
    INTERCEPT_DEFAULT_VISIBLE,
    INTERCEPT_ONLY_VISIBLE,
    type ColDef,
    type ColKey,
    Clip
} from "@/components/proxy/modules/traffic-utils"

export {
    formatBytes,
    buildURL,
    copyText,
    toCurlWin,
    toCurlPosix,
    toPowerShell,
    toFetch,
    toPython,
    toGo,
    getRequestHeader,
    formatProtocol,
    getFileFromPath,
    buildHAR,
    downloadHAR,
    ALL_COLUMNS,
    DEFAULT_VISIBLE,
    INTERCEPT_DEFAULT_VISIBLE,
    INTERCEPT_ONLY_VISIBLE,
    type ColDef,
    type ColKey,
    Clip
}


// ─── Constants ──────────────────────────────────────────────────────────────
// ALL_COLUMNS and DEFAULT_VISIBLE are imported from ./traffic-utils


export function getColTextValue(r: TrafficEvent, colKey: string): string {
    switch (colKey) {
        case "id": return String(r.id);
        case "method": return r.method || "";
        case "host": return r.host || "";
        case "path": return r.path || "";
        case "query": return r.query || "";
        case "file": return getFileFromPath(r.path || "");
        case "url": return buildURL(r);
        case "status": return r.status_code ? String(r.status_code) : "-";
        case "time": return String(r.latency || 0);
        case "time_col": return r.time || "";
        case "request_size": return formatBytes(r.request_size || 0);
        case "response_size": return formatBytes(r.size || 0);
        case "url_length": return String(r.url_length || 0);
        case "total_size": return formatBytes((r.request_size || 0) + (r.size || 0));
        case "payload_request_size": return formatBytes(r.payload_request_size || 0);
        case "payload_response_size": return formatBytes(r.payload_response_size || 0);
        case "payload_total": return formatBytes((r.payload_request_size || 0) + (r.payload_response_size || 0));
        case "headers_size": return formatBytes(r.headers_size || 0);
        case "req_headers_size": return formatBytes(r.req_headers_size || 0);
        case "res_headers_size": return formatBytes(r.res_headers_size || 0);
        case "set_cookies": return String(r.set_cookies ?? "");
        case "tls_icon": return r.tls ? "Yes" : "No";
        case "cookie_icon": return r.has_cookie ? "Yes" : "No";
        case "has_query": return r.query ? "Yes" : "No";
        case "proto": return formatProtocol(r.protocol || "", !!r.tls);
        case "mime": return r.mime_type || "";
        case "title": return r.title || "";
        case "extension": return r.extension || "";
        case "source": return r.source || "browser";
        case "tls_issuer": return r.tls_issuer || "";
        case "server_ip":
        case "ip": return r.server_ip ?? "";
        case "source_ip": return r.source_ip ?? "";
        case "lport": return String(r.lport ?? "");
        case "rport": return String(r.rport ?? "");
        case "start_time": return r.start_time || "";
        case "end_time": return r.end_time || "";
        default: return "";
    }
}

// ─── Shared Components ───────────────────────────────────────────────────────

export function HeaderCell({ col, width, sortField, sortAsc, onSort, onDragStart, onDragOver, onDrop, onDragEnd, isOver, onResizeStart, onHideColumn, onCopyColumnData, disableResize }: {
    col: ColDef; width: number; sortField: string; sortAsc: boolean; onSort: (k: string) => void
    onDragStart: () => void; onDragOver: (e: React.DragEvent) => void; onDrop: () => void; onDragEnd: () => void; isOver: boolean
    onResizeStart: (e: React.MouseEvent) => void; onHideColumn: (k: string) => void; onCopyColumnData: (k: string) => void; disableResize?: boolean
}) {
    const isSorted = sortField === col.sortKey
    return (
        <RContextMenu>
            <RContextMenuTrigger asChild>
                <div style={{ width, minWidth: col.minWidth, maxWidth: width, flexShrink: 0, position: "relative" }}
                    className={`flex items-center border-r border-white/5 last:border-r-0 transition-colors ${isOver ? "bg-accent/10" : ""}`}>
                    <div draggable onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} onDragEnd={onDragEnd}
                        onClick={() => onSort(col.sortKey)}
                        className={`flex items-center px-2 py-1.5 h-full text-[10px] font-sans uppercase select-none truncate cursor-pointer flex-1 transition-all duration-200 ${isSorted ? "text-accent" : "text-foreground-muted/40 hover:text-foreground/80 hover:bg-white/[0.02]"}`}>
                        <span className="truncate flex-1">{col.label}</span>
                        {isSorted && (sortAsc ? <ArrowUp className="size-3.5 ml-1 shrink-0 text-accent/80" /> : <ArrowDown className="size-3.5 ml-1 shrink-0 text-accent/80" />)}
                    </div>
                    {!disableResize && (
                    <div
                        onMouseDown={onResizeStart}
                        className="absolute right-[-4px] top-0 bottom-0 w-8 cursor-col-resize z-50 group flex items-center justify-center -mr-4"
                    >
                        <div className="w-[1px] h-3 bg-white/5 mb-1 group-hover:bg-accent/50 group-hover:h-full transition-all duration-300" />
                    </div>
                    )}
                </div>
            </RContextMenuTrigger>
            <RContextMenuContent className="text-xs bg-background-elevated border-border/40 shadow-2xl backdrop-blur-xl">
                <RContextMenuItem className="text-xs focus:bg-accent/20" onClick={() => onHideColumn(col.key)}>Hide Column: {col.label}</RContextMenuItem>
                <RContextMenuItem className="text-xs focus:bg-accent/20" onClick={() => onCopyColumnData(col.key)}>Copy Column Data</RContextMenuItem>
            </RContextMenuContent>
        </RContextMenu>
    )
}

export const VirtualRow = memo(function VirtualRow({
    req, isSelected, isMatched, rowColor, activeCols, colWidths, top, index,
}: {
    req: TrafficEvent; isSelected: boolean; isMatched: boolean; rowColor?: string;
    activeCols: ColDef[]; colWidths: Record<string, number>; top: number; index: number
}) {
    return (
        <div
            data-uid={req._uid}
            style={{ position: "absolute", transform: `translateY(${top}px)`, top: 0, left: 0, right: 0, height: 28, display: "flex", alignItems: "center", contain: "strict", backgroundColor: rowColor }}
            className={`cursor-pointer border-b border-white/[0.04] transition-all duration-200 font-sans text-[11px] select-none group/row ${isSelected ? "bg-accent/15 text-foreground shadow-[inset_2px_0_0_0_#5E6AD2]" : index % 2 !== 0 ? "bg-white/[0.02] hover:bg-white/[0.05] text-foreground/70" : "bg-transparent hover:bg-white/[0.05] text-foreground/70"} ${isMatched && !isSelected ? "bg-accent/5 shadow-[inset_1px_0_0_0_rgba(94,106,210,0.2)]" : ""}`}
        >
            {activeCols.map(col => {
                const w = colWidths[col.key] ?? col.defaultWidth
                return (
                    <div key={col.key} style={{ width: w, minWidth: col.minWidth, maxWidth: w, flexShrink: 0, contain: "content" }} className="px-2 flex items-center h-full overflow-hidden">
                        {col.render(req, w, index)}
                    </div>
                )
            })}
        </div>
    )
})

export function ColSettingsPanel({ visible, order, onVisibleChange, onOrderChange, onReset }: {
    visible: ColKey[]; order: ColKey[];
    onVisibleChange: (v: ColKey[]) => void; onOrderChange: (o: ColKey[]) => void
    onReset: () => void
}) {
    const orderedCols = order.map(k => ALL_COLUMNS.find(c => c.key === k)!).filter(Boolean)
    const [dragging, setDragging] = useState<ColKey | null>(null)
    const [over, setOver] = useState<ColKey | null>(null)
    function toggle(key: ColKey) { onVisibleChange(visible.includes(key) ? visible.filter(k => k !== key) : [...visible, key]) }
    function onDrop(target: ColKey) {
        if (!dragging || dragging === target) return
        const from = order.indexOf(dragging), to = order.indexOf(target)
        const next = [...order]; next.splice(from, 1); next.splice(to, 0, dragging)
        onOrderChange(next); setDragging(null); setOver(null)
    }
    return (
        <div className="w-56 pb-2 bg-popover rounded-md border shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20">
                <span className="text-xs font-semibold">Columns</span>
                <button onClick={onReset} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1.5 bg-zinc-800/40 hover:bg-zinc-700/60 px-2 py-0.5 rounded border border-white/5 transition-colors"><RotateCcw className="size-2.5" />Reset</button>
            </div>
            <div className="max-h-80 overflow-y-auto pt-1">
                {orderedCols.map(col => (
                    <div key={col.key} draggable
                        onDragStart={() => setDragging(col.key)} onDragOver={e => { e.preventDefault(); setOver(col.key) }}
                        onDrop={() => onDrop(col.key)} onDragEnd={() => { setDragging(null); setOver(null) }}
                        className={`flex items-center gap-2 px-3 py-1 cursor-grab hover:bg-muted/50 select-none ${over === col.key && dragging !== col.key ? "bg-accent/50" : ""}`}>
                        <GripVertical className="size-3 text-muted-foreground/30" />
                        <Switch checked={visible.includes(col.key)} onCheckedChange={() => toggle(col.key)} className="scale-[0.65]" />
                        <span className="text-[11px] flex-1 truncate">{col.label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

export function useTrafficTable({
    data, storageKey = "proxy_col_v12", containerRef, initialVisible, disableResize
}: {
    data: TrafficEvent[]; storageKey?: string; containerRef: React.RefObject<HTMLDivElement | null>; initialVisible?: ColKey[]; disableResize?: boolean
}) {
    const [sortField, setSortField] = useState("id")
    const [sortAsc, setSortAsc] = useState(false)
    const [visibleCols, setVisibleCols] = useState<ColKey[]>(initialVisible ?? DEFAULT_VISIBLE)
    const [colOrder, setColOrder] = useState<ColKey[]>(ALL_COLUMNS.map(c => c.key))
    const [colWidths, setColWidths] = useState<Record<string, number>>({})
    const [autoDistribute, setAutoDistribute] = useState(true)
    const [draggingCol, setDraggingCol] = useState<ColKey | null>(null)
    const [overCol, setOverCol] = useState<ColKey | null>(null)
    const [containerWidth, setContainerWidth] = useState<number>(0)
    const resizeRef = useRef<{ key: string; startX: number; startW: number } | null>(null)

    // Watch container width changes with ResizeObserver for smooth auto-distribute
    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return
        setContainerWidth(el.offsetWidth) // synchronous measure before paint
        const ro = new ResizeObserver((entries) => {
            const w = entries[0]?.contentRect.width ?? 0
            setContainerWidth(w)
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [containerRef.current])

    useEffect(() => {
        try {
            const r = localStorage.getItem(storageKey)
            if (r) {
                const s = JSON.parse(r)
                if (Array.isArray(s.visible)) setVisibleCols(s.visible)
                if (Array.isArray(s.order)) setColOrder(s.order)
                if (s.widths && typeof s.widths === "object") setColWidths(s.widths)
                if (typeof s.autoDistribute === "boolean") setAutoDistribute(s.autoDistribute)
            }
        } catch { }
    }, [storageKey])

    useEffect(() => {
        try { localStorage.setItem(storageKey, JSON.stringify({ visible: visibleCols, order: colOrder, widths: colWidths, autoDistribute })) } catch { }
    }, [visibleCols, colOrder, colWidths, autoDistribute, storageKey])

    const activeCols = useMemo(() => colOrder.map(k => ALL_COLUMNS.find(c => c.key === k)!).filter(c => c && visibleCols.includes(c.key)), [colOrder, visibleCols])

    const computedWidths = useMemo(() => {
        if (!autoDistribute) return colWidths
        const active = activeCols
        const tableW = containerWidth || containerRef.current?.offsetWidth || 1400
        const extra = Math.max(0, tableW - 20)
        
        const ad: Record<string, number> = {}
        const equalWidth = extra / active.length
        active.forEach(c => {
            ad[c.key] = equalWidth
        })
        return ad
    }, [autoDistribute, colWidths, activeCols, containerWidth])

    const displayList = useMemo(() => {
        const list = [...data]
        list.sort((a, b) => {
            const av = (a as any)[sortField], bv = (b as any)[sortField]
            if (typeof av === "number" && typeof bv === "number") return sortAsc ? av - bv : bv - av
            return sortAsc ? String(av ?? "").localeCompare(String(bv ?? "")) : String(bv ?? "").localeCompare(String(av ?? ""))
        })
        return list
    }, [data, sortField, sortAsc])

    const virtualizer = useVirtualizer({
        count: displayList.length, getScrollElement: () => containerRef.current,
        estimateSize: () => 28, getItemKey: i => displayList[i]._uid, overscan: 20,
        paddingStart: 1, paddingEnd: 1
    })

    const getWidth = (col: ColDef) => computedWidths[col.key] ?? col.defaultWidth
    const toggleSort = (key: string) => { if (sortField === key) setSortAsc(a => !a); else { setSortField(key); setSortAsc(true) } }

    const onHeaderDrop = (targetKey: ColKey) => {
        if (!draggingCol || draggingCol === targetKey) return
        const from = colOrder.indexOf(draggingCol), to = colOrder.indexOf(targetKey)
        const next = [...colOrder]; next.splice(from, 1); next.splice(to, 0, draggingCol)
        setColOrder(next); setDraggingCol(null); setOverCol(null)
    }

    const startResize = (e: React.MouseEvent, key: string) => {
        if (disableResize) return
        e.preventDefault(); e.stopPropagation(); setAutoDistribute(false)
        const currentW = getWidth(ALL_COLUMNS.find(c => c.key === key)!)
        resizeRef.current = { key, startX: e.clientX, startW: currentW }
        const onMove = (ev: MouseEvent) => {
            const snap = resizeRef.current; if (!snap) return
            const col = ALL_COLUMNS.find(c => c.key === snap.key)
            let newW = snap.startW + (ev.clientX - snap.startX)
            newW = Math.max(col?.minWidth ?? 30, newW)
            if (col?.maxWidth) newW = Math.min(col.maxWidth, newW)
            setColWidths(prev => ({ ...prev, [snap.key]: newW }))
        }
        const onUp = () => {
            resizeRef.current = null;
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp)
        }
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp)
    }

    return {
        visibleCols, setVisibleCols, colOrder, setColOrder, setColWidths, setAutoDistribute,
        activeCols, computedWidths, displayList, virtualizer,
        sortField, sortAsc, toggleSort,
        draggingCol, setDraggingCol, overCol, setOverCol, onHeaderDrop, startResize, getWidth,
        disableResize: !!disableResize
    }
}

export function TrafficTable({
    tableState, containerRef, selectedUids, matchedIds, rowColors, isAnchored, onRowClick, onCtxMenu
}: {
    tableState: ReturnType<typeof useTrafficTable>
    containerRef: React.RefObject<HTMLDivElement | null>
    selectedUids: Set<string>
    matchedIds: Set<string>
    rowColors?: Record<string, string>
    isAnchored?: boolean
    onRowClick: (uid: string, e: React.MouseEvent) => void
    onCtxMenu?: (req: TrafficEvent, e: React.MouseEvent) => void
}) {
    const {
        activeCols, computedWidths, displayList, virtualizer,
        sortField, sortAsc, toggleSort,
        draggingCol, setDraggingCol, overCol, setOverCol, onHeaderDrop, startResize, getWidth
    } = tableState

    // Auto-scroll to bottom on new items ONLY if NOT anchored
    // Don't scroll on initial load
    const isInitialMount = useRef(true)
    const prevLength = useRef(displayList.length)

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            prevLength.current = displayList.length
            return
        }

        // Only scroll if list grew AND not anchored
        if (displayList.length > prevLength.current && !isAnchored) {
            virtualizer.scrollToIndex(displayList.length-1, { align: 'end' })
        }

        prevLength.current = displayList.length
    }, [displayList.length, isAnchored, virtualizer])



    return (
        <>
            <div className="shrink-0 border-b bg-muted/10 w-full overflow-hidden" style={{ height: 28 }}>
                <div className="flex h-full w-full">
                    {activeCols.map((col) => (
                        <HeaderCell key={col.key} col={col} width={getWidth(col)} sortField={sortField} sortAsc={sortAsc} onSort={toggleSort}
                            onDragStart={() => setDraggingCol(col.key)} onDragOver={e => { e.preventDefault(); setOverCol(col.key) }}
                            onDrop={() => onHeaderDrop(col.key)} onDragEnd={() => { setDraggingCol(null); setOverCol(null) }}
                            isOver={overCol === col.key && draggingCol !== col.key}
                            onResizeStart={e => startResize(e, col.key)}
                            disableResize={tableState.disableResize}
                            onHideColumn={(k) => { tableState.setVisibleCols(tableState.visibleCols.filter((c: string) => c !== k)); tableState.setColOrder(tableState.colOrder.filter((c: string) => c !== k)) }}
                            onCopyColumnData={(k) => {
                                const textData = displayList.map(req => getColTextValue(req, k)).join("\n")
                                copyText(textData)
                            }} />
                    ))}
                </div>
            </div>
            <div ref={containerRef} className="flex-1 overflow-auto outline-none bg-transparent relative z-10 pb-3" tabIndex={0}
                onClick={e => {
                    const target = e.target as HTMLElement
                    const row = target.closest('[data-uid]')
                    if (row) {
                        const uid = row.getAttribute('data-uid')
                        if (uid) onRowClick(uid, e)
                    }
                }}
                onContextMenu={e => {
                    const target = e.target as HTMLElement
                    const row = target.closest('[data-uid]')
                    if (row) {
                        const uid = row.getAttribute('data-uid')
                        const req = displayList.find(r => r._uid === uid)
                        if (req && onCtxMenu) onCtxMenu(req, e)
                    }
                }}
            >
                <div style={{ height: virtualizer.getTotalSize(), width: "100%", position: "relative" }}>
                    {virtualizer.getVirtualItems().map(vRow => {
                        const req = displayList[vRow.index]
                        return (
                            <VirtualRow key={req._uid} req={req} isSelected={selectedUids.has(req._uid)}
                                isMatched={matchedIds.has(req._uid)}
                                rowColor={rowColors?.[req._uid]}
                                activeCols={activeCols} colWidths={computedWidths} top={vRow.start} index={vRow.index} />
                        )
                    })}
                </div>
            </div>
        </>
    )
}

