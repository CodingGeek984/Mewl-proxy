import { useState, useMemo, useRef, useEffect } from "react"
import { X, Trash2, ChevronRight, Copy, Send, Highlighter, Repeat2, RefreshCcw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useProxyWebsocket } from "@/lib/proxy-store"
import type { TrafficEvent, SearchLocation, InteractionScope, SearchConfig, FilterConfig, Rule } from "@/types/proxy"
import { formatProtocol, buildURL, copyText, toCurlWin } from "@/components/proxy/modules/traffic-table"
import { getUniversalCopyItems } from "@/components/proxy/modules/traffic-utils"

// ─── Search Helpers ─────────────────────────────────────────────────────────

export const FIELD_ALIASES: Record<string, string> = {
  code: "status", c: "status", status: "status",
  m: "method", method: "method",
  h: "host", host: "host", domain: "host",
  p: "path", path: "path",
  proto: "protocol", protocol: "protocol",
  mime: "mime", type: "mime",
  size: "size", resp: "size", response: "size",
  req: "request_size", request: "request_size",
  length: "length", len: "length",
  ip: "ip", ext: "ext", extension: "ext",
  src: "source", source: "source", initiator: "source",
  title: "title", t: "title",
  cookie: "cookie", cookies: "cookie",
  port: "port", rport: "rport", lport: "lport",
  iscookie: "iscookie",
  preq: "payload_request_size", payload_request: "payload_request_size",
  presp: "payload_response_size", payload_response: "payload_response_size",
  hsize: "headers_size", headers: "headers_size",
  rtt: "latency",
  issuer: "tls_issuer",
  addr: "server_ip",
  start: "start_time",
  end: "end_time",
  "#": "id",
}

export function globToRe(g: string) { return g.replace(/[\.\+\^\$\{\}\(\)\|\[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") }

export function matchTerm(r: TrafficEvent, term: { field: string | null; op: string; value: string; regex: boolean }, cfg: SearchConfig): boolean {
  const { field: f, value: v, op, regex: rx } = term

  // Handle numeric comparisons
  if (f && op && [">", "<", ">=", "<=", "!=", "~", "=="].includes(op)) {
    let numVal: number | undefined;
    if (f === "status") numVal = r.status_code;
    else if (f === "size") numVal = r.size;
    else if (f === "request_size") numVal = r.request_size;
    else if (f === "length") numVal = r.length;
    else if (f === "payload_request_size") numVal = r.payload_request_size;
    else if (f === "payload_response_size") numVal = r.payload_response_size;
    else if (f === "headers_size") numVal = r.headers_size;
    else if (f === "latency" || f === "rtt") numVal = r.latency;
    else if (f === "lport") numVal = r.lport ?? undefined;
    else if (f === "rport") numVal = r.rport ?? undefined;
    else if (f === "id") numVal = r.id;

    if (numVal !== undefined || f === "port") {
      const numOp = (actual: number, targetStr: string, o: string) => {
        let target = parseFloat(targetStr.replace(/[^\d.]/g, ""))
        const lower = targetStr.toLowerCase()
        if (lower.includes("kb") || lower.endsWith("k")) target *= 1024
        else if (lower.includes("mb") || lower.endsWith("m")) target *= 1024 * 1024
        if (o === ">") return actual > target
        if (o === "<") return actual < target
        if (o === ">=") return actual >= target
        if (o === "<=") return actual <= target
        if (o === "!=") return actual !== target
        if (o === "=" || o === ":" || o === "==") {
          if (targetStr.includes("-")) {
            const parts = targetStr.split("-")
            const min = parseFloat(parts[0].replace(/[^\d.]/g, ""))
            const max = parseFloat(parts[1].replace(/[^\d.]/g, ""))
            if (!isNaN(min) && !isNaN(max)) return actual >= min && actual <= max
          }
          return actual === target
        }
        if (o === "~") return Math.abs(actual - target) / (target || 1) < 0.2
        return false
      }
      if (f === "port") {
        return numOp(r.lport || 0, v, op) || numOp(r.rport || 0, v, op);
      }
      return numOp(numVal ?? 0, v, op);
    }
  }

  const t = (s: string) => {
    if (op === "==") return s.toLowerCase() === v.toLowerCase();
    if (rx || cfg.regex) { try { return new RegExp(v, "i").test(s) } catch { return false } }
    if (v.includes("*") || v.includes("?")) {
      try {
        const pattern = "^" + globToRe(v) + "$"
        return new RegExp(pattern, "i").test(s)
      } catch { return false }
    }
    // EXACT match for fields like host, method, status
    if (f) return s.toLowerCase() === v.toLowerCase();

    return s.toLowerCase().includes(v.toLowerCase())
  }

  const [reqHeaders, ...reqBodyParts] = (r.request_raw || "").split("\n\n")
  const [resHeaders, ...resBodyParts] = (r.response_raw || "").split("\n\n")
  const reqBody = reqBodyParts.join("\n\n")
  const resBody = resBodyParts.join("\n\n")

  const parts: string[] = []
  const locs = cfg.locations
  const scopes = cfg.interactionScopes

  const includeReq = scopes.includes("all") || scopes.includes("request")
  const includeRes = scopes.includes("all") || scopes.includes("response")

  if (locs.includes("all") || locs.includes("url")) {
    parts.push(r.host ?? "", r.path ?? "", r.query ?? "")
  }
  
  if (includeReq) {
    if (locs.includes("all") || locs.includes("headers")) parts.push(reqHeaders)
    if (locs.includes("all") || locs.includes("body")) parts.push(reqBody)
  }
  
  if (includeRes) {
    if (locs.includes("all") || locs.includes("headers")) parts.push(resHeaders)
    if (locs.includes("all") || locs.includes("body")) parts.push(resBody, r.title ?? "")
  }

  // Use the specific fields if 'f' is set
  if (f === "status") return op === "==" ? String(r.status_code) === v : String(r.status_code).startsWith(v)
  if (f === "method") return String(r.method ?? "").toLowerCase() === v.toLowerCase()
  if (f === "host") return t(String(r.host ?? ""))
  if (f === "path") return t(r.path ?? "")
  if (f === "mime") return t(r.mime_type ?? "")
  if (f === "protocol") { const fl = formatProtocol(r.protocol, r.tls).toLowerCase(); return t(fl) || t(r.protocol ?? "") }
  if (f === "size") return t(String(r.size ?? 0))
  if (f === "request_size") return t(String(r.request_size ?? 0))
  if (f === "length") return t(String(r.length ?? 0))
  if (f === "rtt" || f === "latency") return t(String(r.latency ?? 0))
  if (f === "ip") return t(r.source_ip ?? "") || t(r.server_ip ?? "")
  if (f === "ext") return (r.extension ?? "").toLowerCase() === v.toLowerCase()
  if (f === "source") return t(r.source ?? "")
  if (f === "title") return t(r.title ?? "")
  if (f === "issuer") return t(r.tls_issuer ?? "")
  if (f === "lport") return String(r.lport) === v
  if (f === "rport") return String(r.rport) === v
  if (f === "port") return String(r.lport) === v || String(r.rport) === v
  if (f === "id") return String(r.id) === v
  if (f === "addr") return t(r.server_ip ?? "")
  if (f === "scheme") return (r.tls ? "https" : "http") === v.toLowerCase()
  if (f === "cookie") return t((r.request_raw ?? "") + "\n" + (r.response_raw ?? ""))
  if (f === "iscookie") return ["true", "1", "yes"].includes(v.toLowerCase()) ? !!r.has_cookie : !r.has_cookie
  if (f === "tls") return r.tls === ["true", "1", "yes"].includes(v.toLowerCase())
  if (f === "start_time") return t(r.start_time ?? "")
  if (f === "end_time") return t(r.end_time ?? "")
  if (f === "has") { if (v === "cookie") return !!r.has_cookie; if (v === "tls") return !!r.tls; if (v === "title") return !!(r.title); return false }

  return parts.some(p => t(p))
}

// ─── Shared Components ───────────────────────────────────────────────────────

export interface CtxState { req: TrafficEvent; x: number; y: number }

export function ContextMenu({ ctx, onClose, selectedUids, allData }: {
  ctx: CtxState
  onClose: () => void
  selectedUids: Set<string>
  allData: TrafficEvent[]
}) {
  const [sub, setSub] = useState<string | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const { deleteRequests, setRowColor, sendToRepeater, sendToIterater } = useProxyWebsocket()

  const activeUids = selectedUids.size > 0 ? selectedUids : new Set([ctx.req._uid])
  const activeReqs = allData.filter(r => activeUids.has(r._uid))
  const count = activeUids.size
  const isBulk = count > 1

  function openSub(name: string) {
    if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null }
    setSub(name)
  }
  function scheduleSub() { hideTimer.current = setTimeout(() => setSub(null), 200) }
  function keepSub() { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null } }
  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])

  useEffect(() => {
    function handler(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent && e.key === "Escape") { onClose(); return }
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("mousedown", handler, true)
    document.addEventListener("keydown", handler, true)
    return () => { document.removeEventListener("mousedown", handler, true); document.removeEventListener("keydown", handler, true) }
  }, [onClose])

  const r = ctx.req
  const copyItems = getUniversalCopyItems(activeReqs)

  const sendToItems = [
    { label: "Repeater", icon: <Repeat2 className="size-3.5 text-emerald-400" />, action: () => { sendToRepeater(r); console.log("Sent to Repeater:", r._uid) } },
    { label: "Iterater", icon: <RefreshCcw className="size-3.5 text-[var(--accent)]" />, action: () => { sendToIterater(r); console.log("Sent to Iterater:", r._uid) } },
  ]

  const highlightColors = [
    { label: "Red", color: "rgba(239, 68, 68, 0.25)" },
    { label: "Orange", color: "rgba(249, 115, 22, 0.25)" },
    { label: "Yellow", color: "rgba(234, 179, 8, 0.25)" },
    { label: "Green", color: "rgba(34, 197, 94, 0.25)" },
    { label: "Blue", color: "rgba(59, 130, 246, 0.25)" },
    { label: "Purple", color: "rgba(168, 85, 247, 0.25)" },
    { label: "None", color: "" },
  ]

  async function doResend() {
    try {
      // @ts-ignore
      await window.go.backend.App.ResendRequest(r.request_raw, r.host, r.tls)
    } catch {
      copyText(toCurlWin(r))
    }
    onClose()
  }

  function doHighlight(color: string) {
    activeUids.forEach(uid => setRowColor(uid, color))
    onClose()
  }

  function doDelete() {
    deleteRequests(Array.from(activeUids))
    onClose()
  }

  const menuStyle: React.CSSProperties = {
    position: "fixed",
    left: ctx.x,
    top: ctx.y,
    zIndex: 9999,
    minWidth: 210,
  }

  return (
    <div ref={ref} style={menuStyle}
      className="relative bg-popover border border-border rounded-md shadow-2xl py-1.5">
      {isBulk && (
        <div className="px-3 py-1 mb-1 border-b border-border/40 text-[10px] text-[var(--accent)] font-mono font-bold tracking-wider">
          {count} items selected
        </div>
      )}
      <button onMouseEnter={() => openSub("copy")} onMouseLeave={scheduleSub}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-accent/70">
        <span className="flex items-center gap-2.5"><Copy className="size-3.5" />Copy Value</span>
        <ChevronRight className="size-3.5 text-muted-foreground" />
      </button>
      {sub === "copy" && (
        <div onMouseEnter={keepSub} onMouseLeave={scheduleSub}
          style={{ position: "absolute", left: "100%", top: 0, marginLeft: 4, minWidth: 230 }}
          className="bg-popover border border-border rounded-md shadow-2xl py-1.5 flex flex-col z-[9999]">
          {copyItems.map((ci: any, idx: number) =>
            (ci as any).type === "separator"
              ? <div key={idx} className="h-px bg-border my-1 mx-2" />
              : <button key={(ci as any).label} onClick={() => { (ci as any).action!(); onClose() }}
                className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-accent/70 cursor-default flex items-center justify-between group">
                <span className="flex items-center gap-2 group-hover:text-[var(--accent)] transition-colors">
                  {(ci as any).icon}
                  {(ci as any).label}
                </span>
              </button>
          )}
        </div>
      )}
      <button onMouseEnter={() => openSub("sendto")} onMouseLeave={scheduleSub}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-accent/70">
        <span className="flex items-center gap-2.5"><Send className="size-3.5" />Send To</span>
        <ChevronRight className="size-3.5 text-muted-foreground" />
      </button>
      {sub === "sendto" && (
        <div onMouseEnter={keepSub} onMouseLeave={scheduleSub}
          style={{ position: "absolute", left: "100%", top: 0, marginLeft: 4, minWidth: 180 }}
          className="bg-popover border border-border rounded-md shadow-2xl py-1.5 flex flex-col z-[9999]">
          {sendToItems.map(si => (
            <button key={si.label} onClick={() => { si.action(); onClose() }}
              className="w-full text-left px-4 py-1.5 text-[12px] hover:bg-accent/70 flex items-center gap-2">
              {si.icon}{si.label}
            </button>
          ))}
        </div>
      )}
      <div className="h-px bg-border my-1 mx-2" />
      <button onMouseEnter={() => openSub("highlight")} onMouseLeave={scheduleSub}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-accent/70">
        <span className="flex items-center gap-2.5"><Highlighter className="size-3.5 text-amber-400" />
          Highlight{isBulk ? ` (${count})` : ""}
        </span>
        <ChevronRight className="size-3.5 text-muted-foreground" />
      </button>
      {sub === "highlight" && (
        <div onMouseEnter={keepSub} onMouseLeave={scheduleSub}
          style={{ position: "absolute", left: "100%", top: 0, marginLeft: 4, minWidth: 150 }}
          className="bg-popover border border-border rounded-md shadow-2xl py-1.5 flex flex-col z-[9999]">
          {highlightColors.map(c => (
            <button key={c.label} onClick={() => doHighlight(c.color)}
              className="w-full flex items-center gap-2.5 px-4 py-1.5 text-[12px] hover:bg-accent/70 text-left">
              <div className="size-2.5 rounded-full border border-white/20" style={{ backgroundColor: c.color || "transparent" }} />
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="h-px bg-border my-1 mx-2" />
      {!isBulk && (
        <button onClick={doResend} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-accent/70 text-left">
          <Repeat2 className="size-3.5 text-emerald-400" />Resend
        </button>
      )}
      <button onClick={doDelete}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-[12px] hover:bg-accent/70 text-left text-red-400">
        <Trash2 className="size-3.5" />Delete{isBulk ? ` (${count})` : ""}
      </button>
    </div>
  )
}

export function FilterPanel({ config, onChange, onClose }: { config: FilterConfig, onChange: (c: FilterConfig) => void, onClose: () => void }) {
  return (
    <div className="w-[600px] flex flex-col pointer-events-auto bg-popover rounded-md border shadow-2xl overflow-hidden">
      <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
        <span className="font-bold text-[11px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">History Filter</span>
        <div className="flex items-center gap-2">
          <Button variant={config.enabled ? "default" : "outline"} size="sm" className="h-6 text-[10px] px-3 font-bold uppercase tracking-wider" onClick={() => onChange({ ...config, enabled: !config.enabled })}>
            Filter {config.enabled ? "on" : "off"}
          </Button>
          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 outline-none focus:outline-none focus-visible:ring-0" onClick={onClose} title="Close filter menu">
            <X className="size-3.5" />
          </Button>
        </div>
      </div>
      <div className="p-4 grid grid-cols-4 gap-4 text-xs bg-background/50">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold border-b border-border/50 pb-1 text-muted-foreground uppercase tracking-widest text-[9px] mb-2">Filter by request type</h4>
            <div className="flex items-center space-x-2"><Checkbox checked={config.reqHasResponse} onCheckedChange={(v) => onChange({ ...config, reqHasResponse: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer text-muted-foreground/80 hover:text-foreground transition-colors" onClick={() => onChange({ ...config, reqHasResponse: !config.reqHasResponse })}>Show only items with responses</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.reqHasParams} onCheckedChange={(v) => onChange({ ...config, reqHasParams: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer text-muted-foreground/80 hover:text-foreground transition-colors" onClick={() => onChange({ ...config, reqHasParams: !config.reqHasParams })}>Show only requests with parameters</Label></div>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold border-b border-border/50 pb-1 text-muted-foreground uppercase tracking-widest text-[9px] mb-2 mt-4">Filter by status code</h4>
            <div className="flex items-center space-x-2"><Checkbox checked={config.status2xx} onCheckedChange={(v) => onChange({ ...config, status2xx: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, status2xx: !config.status2xx })}>2xx [success]</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.status3xx} onCheckedChange={(v) => onChange({ ...config, status3xx: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, status3xx: !config.status3xx })}>3xx [redirection]</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.status4xx} onCheckedChange={(v) => onChange({ ...config, status4xx: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, status4xx: !config.status4xx })}>4xx [request error]</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.status5xx} onCheckedChange={(v) => onChange({ ...config, status5xx: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, status5xx: !config.status5xx })}>5xx [server error]</Label></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold border-b border-border/50 pb-1 text-muted-foreground uppercase tracking-widest text-[9px] mb-2">Filter by method</h4>
            <div className="flex items-center space-x-2"><Checkbox checked={config.methodGet} onCheckedChange={(v) => onChange({ ...config, methodGet: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer font-bold text-emerald-400" onClick={() => onChange({ ...config, methodGet: !config.methodGet })}>GET</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.methodPost} onCheckedChange={(v) => onChange({ ...config, methodPost: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer font-bold text-[var(--accent)]" onClick={() => onChange({ ...config, methodPost: !config.methodPost })}>POST</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.methodPut} onCheckedChange={(v) => onChange({ ...config, methodPut: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer font-bold text-orange-400" onClick={() => onChange({ ...config, methodPut: !config.methodPut })}>PUT</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.methodDelete} onCheckedChange={(v) => onChange({ ...config, methodDelete: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer font-bold text-red-500" onClick={() => onChange({ ...config, methodDelete: !config.methodDelete })}>DELETE</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.methodOptions} onCheckedChange={(v) => onChange({ ...config, methodOptions: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer font-bold text-purple-400" onClick={() => onChange({ ...config, methodOptions: !config.methodOptions })}>OPTIONS</Label></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold border-b border-border/50 pb-1 text-muted-foreground uppercase tracking-widest text-[9px] mb-2">Filter by MIME type</h4>
            <div className="flex items-center space-x-2"><Checkbox checked={config.mimeHtml} onCheckedChange={(v) => onChange({ ...config, mimeHtml: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, mimeHtml: !config.mimeHtml })}>HTML</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.mimeJson} onCheckedChange={(v) => onChange({ ...config, mimeJson: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, mimeJson: !config.mimeJson })}>JSON</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.mimeCss} onCheckedChange={(v) => onChange({ ...config, mimeCss: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, mimeCss: !config.mimeCss })}>CSS / JS</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.mimeImages} onCheckedChange={(v) => onChange({ ...config, mimeImages: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, mimeImages: !config.mimeImages })}>Images</Label></div>
            <div className="flex items-center space-x-2"><Checkbox checked={config.mimeOther} onCheckedChange={(v) => onChange({ ...config, mimeOther: !!v })} className="scale-[0.8] origin-left border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" /><Label className="text-[11px] cursor-pointer" onClick={() => onChange({ ...config, mimeOther: !config.mimeOther })}>Other text</Label></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-bold border-b border-border/50 pb-1 text-muted-foreground uppercase tracking-widest text-[9px] mb-2">Filter by extension</h4>
            <Label className="text-[10px] text-muted-foreground/60 whitespace-normal block mt-1 tracking-wider uppercase">Hide if matches:</Label>
            <Input className="h-7 text-[10px] font-mono mt-2 w-full bg-background border-border/50 focus-visible:ring-sky-500/50" placeholder="js, gif, jpg, png, css" value={config.hideExtensions} onChange={e => onChange({ ...config, hideExtensions: e.target.value })} />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold border-b border-border/50 pb-1 text-muted-foreground uppercase tracking-widest text-[9px] mb-2 mt-4">Filter by listener</h4>
            <Label className="text-[10px] text-muted-foreground/60 block mt-1 tracking-wider uppercase">Local port:</Label>
            <Input className="h-7 text-[11px] font-mono mt-2 w-full bg-background max-w-[100px] border-border/50 focus-visible:ring-sky-500/50" placeholder="e.g. 8080" value={config.listenerPort} onChange={e => onChange({ ...config, listenerPort: e.target.value })} />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SearchSettingsPanel({ config, onChange, isFilterOnly, onFilterChange }: {
  config: SearchConfig;
  onChange: (c: SearchConfig) => void;
  isFilterOnly: boolean;
  onFilterChange: (v: boolean) => void;
}) {
  const toggleLocation = (val: SearchLocation) => {
    let next = [...config.locations]
    if (val === "all") {
      next = ["all"]
    } else {
      next = next.filter(s => s !== "all")
      if (next.includes(val)) {
        next = next.filter(s => s !== val)
      } else {
        next.push(val)
      }
      if (next.length === 0) next = ["all"]
    }
    onChange({ ...config, locations: next })
  }

  const toggleScope = (val: InteractionScope) => {
    let next = [...config.interactionScopes]
    if (val === "all") {
      next = ["all"]
    } else {
      next = next.filter(s => s !== "all")
      if (next.includes(val)) {
        next = next.filter(s => s !== val)
      } else {
        next.push(val)
      }
      if (next.length === 0) next = ["all"]
    }
    onChange({ ...config, interactionScopes: next })
  }

  return (
    <div className="p-3 w-64 space-y-4 text-xs select-none bg-popover border rounded-md shadow-2xl overflow-hidden">
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-bold opacity-60">Search Location</p>
        <div className="flex gap-1 flex-wrap">
          {([["ALL", "all"], ["URL", "url"], ["HEADERS", "headers"], ["BODY", "body"]] as const).map(([label, val]) => (
            <button key={val} onClick={() => toggleLocation(val)}
              className={`px-2 py-1 rounded text-[9px] font-mono border transition-all ${config.locations.includes(val) ? "bg-primary/10 text-primary border-primary/30" : "border-border/40 hover:border-primary/30 text-muted-foreground hover:text-foreground"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-bold opacity-60">Interaction Scope</p>
        <div className="flex gap-1 flex-wrap">
          {["ALL", "REQUEST", "RESPONSE"].map(label => {
            const val = label.toLowerCase() as InteractionScope
            return (
              <button key={val} onClick={() => toggleScope(val)}
                className={`px-2 py-1 rounded text-[9px] font-mono border transition-all ${config.interactionScopes.includes(val) ? "bg-primary/10 text-primary border-primary/30" : "border-border/40 hover:border-primary/30 text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="h-px bg-border/40 -mx-3" />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox checked={config.regex} onCheckedChange={(v) => onChange({ ...config, regex: v === true })} className="mr-2 border-2 border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
          <div><p className="text-[11px] font-medium leading-none">Regexp</p><p className="text-[9px] text-muted-foreground mt-1 block">Enable /pattern/ syntax</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={isFilterOnly} onCheckedChange={(v) => onFilterChange(v === true)} className="mr-2 border-2 border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
          <div><p className="text-[11px] font-medium leading-none">Filters</p><p className="text-[9px] text-muted-foreground mt-1 block">Show only matching results</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox checked={config.negative} onCheckedChange={(v) => onChange({ ...config, negative: v === true })} className="mr-2 border-2 border-muted-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
          <div><p className="text-[11px] font-medium leading-none">Inversion</p><p className="text-[9px] text-muted-foreground mt-1 block">Invert results</p></div>
        </div>
      </div>
    </div>
  )
}

export function useTrafficFilter(
  liveList: TrafficEvent[],
  searchActive: string,
  searchCfg: SearchConfig,
  filterCfg: FilterConfig,
  historyRules: Rule[] = []
) {
  // Helper to check if a rule matches a request
  const matchHistoryRule = (r: TrafficEvent, rule: Rule) => {
    let text = "";
    switch (rule.scope) {
      case "url": text = buildURL(r); break;
      case "request_header": text = r.request_raw?.split("\n\n")[0] || ""; break;
      case "response_header": text = r.response_raw?.split("\n\n")[0] || ""; break;
      case "request_body": text = (r.request_raw || "").split("\n\n")[1] || ""; break;
      case "response_body": text = (r.response_raw || "").split("\n\n")[1] || ""; break;
      case "all": text = (r.request_raw || "") + "\n" + (r.response_raw || ""); break;
      default: text = buildURL(r);
    }

    try {
      const re = new RegExp(rule.pattern, "i");
      return re.test(text);
    } catch {
      return text.toLowerCase().includes(rule.pattern.toLowerCase());
    }
  };

  const parsedSearch = useMemo(() => {
    const raw = searchActive.trim()
    if (!raw) return []
    return raw.split(/\s+(?:or|\|\|)\s+/i).map((part: string) => {
      const terms: any[] = []
      const re = /(!?)([a-z_]+)\s*(>=|<=|!=|==|>|<|=|~|[:=])\s*(?:"([^"]*)"|'([^']*)'|(\S+))|(!?)(?:"([^"]*)"|'([^']*)'|(\S+))/gi
      let m
      while ((m = re.exec(part)) !== null) {
        const inv1 = m[1]; const field = m[2]; const op = m[3]
        const val1 = m[4] !== undefined ? m[4] : m[5] !== undefined ? m[5] : m[6]
        const inv2 = m[7]
        const val2 = m[8] !== undefined ? m[8] : m[9] !== undefined ? m[9] : m[10]
        const invert = (inv1 || inv2) === "!"
        const fRaw = field?.toLowerCase()
        const v = val1 !== undefined ? val1 : val2
        if (!v || /^(and|&&)$/i.test(v)) continue
        if (field && op) {
          if (fRaw === "search") {
            const isRx = v.startsWith("/") && v.endsWith("/") && v.length > 2
            terms.push({ invert, field: null, op: "=", value: isRx ? v.slice(1, -1) : v, regex: isRx })
          } else {
            const f = FIELD_ALIASES[fRaw] ?? fRaw
            const actualOp = (op === ":") ? "=" : op
            terms.push({ invert, field: f, op: actualOp, value: v, regex: false })
          }
        } else {
          const isRx = v.startsWith("/") && v.endsWith("/") && v.length > 2
          const hasW = !isRx && v.includes("*")
          terms.push({ invert, field: null, op: "=", value: hasW ? globToRe(v) : isRx ? v.slice(1, -1) : v, regex: isRx || hasW })
        }
      }
      return terms
    }).filter((g: any[]) => g.length > 0)
  }, [searchActive])

  const filtered = useMemo(() => {
    let result = [...liveList]

    // Apply History Rules (Hide/Show)
    const activeHistoryRules = historyRules.filter(r => r.enabled && r.category === 'history');
    if (activeHistoryRules.length > 0) {
      const showRules = activeHistoryRules.filter(r => r.type === 'Show');
      const hideRules = activeHistoryRules.filter(r => r.type === 'Hide');

      result = result.filter(r => {
        // If there are "Show" rules, must match at least one
        if (showRules.length > 0) {
          const matchedShow = showRules.some(rule => matchHistoryRule(r, rule));
          if (!matchedShow) return false;
        }
        // If there are "Hide" rules, must NOT match any
        if (hideRules.length > 0) {
          const matchedHide = hideRules.some(rule => matchHistoryRule(r, rule));
          if (matchedHide) return false;
        }
        return true;
      });
    }

    if (filterCfg.enabled) {
      result = result.filter((r: TrafficEvent) => {
        if (filterCfg.reqHasResponse && !r.size) return false;
        const hasParams = (r.path || "").includes("?") || (r.method === "POST" && (r.request_raw || "").includes("application/x-www-form-urlencoded"))
        if (filterCfg.reqHasParams && !hasParams) return false;
        const m = (r.method || "").toUpperCase();
        if (m === "GET" && !filterCfg.methodGet) return false;
        if (m === "POST" && !filterCfg.methodPost) return false;
        if (m === "PUT" && !filterCfg.methodPut) return false;
        if (m === "DELETE" && !filterCfg.methodDelete) return false;
        if (m === "OPTIONS" && !filterCfg.methodOptions) return false;
        const sc = r.status_code || 0;
        if (sc > 0) {
          if (sc >= 200 && sc < 300 && !filterCfg.status2xx) return false;
          if (sc >= 300 && sc < 400 && !filterCfg.status3xx) return false;
          if (sc >= 400 && sc < 500 && !filterCfg.status4xx) return false;
          if (sc >= 500 && !filterCfg.status5xx) return false;
        }
        const mime = (r.mime_type || "").toLowerCase();
        const isHtml = mime.includes("html");
        const isImg = mime.includes("image");
        const isCss = mime.includes("css") || mime.includes("javascript") || mime.includes("x-javascript");
        const isJson = mime.includes("json");
        const isOther = !isHtml && !isImg && !isCss && !isJson && mime !== "";
        if (mime) {
          if (isHtml && !filterCfg.mimeHtml) return false;
          if (isImg && !filterCfg.mimeImages) return false;
          if (isCss && !filterCfg.mimeCss) return false;
          if (isJson && !filterCfg.mimeJson) return false;
          if (isOther && !filterCfg.mimeOther) return false;
        }
        if (filterCfg.hideExtensions.trim()) {
          const exts = filterCfg.hideExtensions.split(",").map(e => e.trim().toLowerCase()).filter(e => e);
          const ext = ((r.extension || "").startsWith(".") ? (r.extension || "").substring(1) : (r.extension || "")).toLowerCase();
          if (ext && exts.includes(ext)) return false;
        }
        if (filterCfg.listenerPort.trim()) {
          if (String(r.lport) !== filterCfg.listenerPort.trim()) return false;
        }
        return true;
      });
    }
    if (searchActive.trim() && parsedSearch.length > 0) {
      result = result.filter(r => {
        return parsedSearch.some(group => group.every(term => {
          const m = matchTerm(r, term, searchCfg)
          return term.invert ? !m : m
        }))
      })
    }
    return result
  }, [searchActive, parsedSearch, searchCfg, liveList, filterCfg, historyRules])

  const matchedIds = useMemo(() => {
    if (!searchActive.trim() || parsedSearch.length === 0) return new Set<string>()
    return new Set(filtered.map(r => r._uid))
  }, [filtered, searchActive, parsedSearch])

  return { filtered, matchedIds, parsedSearch }
}
