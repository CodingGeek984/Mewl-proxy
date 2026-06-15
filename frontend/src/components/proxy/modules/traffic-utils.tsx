import type { TrafficEvent } from "@/types/proxy"
import React from "react"
import { getStatusClass, getMethodClass } from "@/lib/mock-data"
import { Check, Minus, Globe, FileCode, Cookie, Terminal, Code } from "lucide-react"

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatTime(iso: string | undefined): string {
    if (!iso) return "-"
    try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return iso
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`
    } catch {
        return iso
    }
}

export function formatBytes(b: number): string {
    if (b === null || b === undefined || b === 0) return "0"
    if (b < 1024) return `${b}B`
    if (b < 1048576) return `${(b / 1024).toFixed(1)}K`
    return `${(b / 1048576).toFixed(1)}M`
}
export function formatLatency(ms: number): string {
    if (ms === null || ms === undefined || ms === 0) return "-"
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`
    return `${(ms / 60000).toFixed(2)}m`
}
export function latencyColor(ms: number) {
    if (ms < 200) return "text-[var(--accent)]"
    if (ms < 800) return "text-yellow-400"
    return "text-red-400"
}
export function formatProtocol(protocol: string, tls: boolean): string {
    const p = (protocol ?? "").toUpperCase()
    if (p === "WSS" || p === "WS") return p
    // p is e.g. "HTTP/1.1", "HTTP/2.0", "HTTP/2", "H2"
    const scheme = tls ? "HTTPS" : "HTTP"
    if (p.startsWith("HTTP/")) {
        const ver = p.replace("HTTP/", "")
        return `${scheme}/${ver}`
    }
    if (p === "H2") return `${scheme}/2.0`
    if (p === "H3") return `${scheme}/3.0`
    return `${scheme}/1.1`
}
export function protocolColor(full: string): string {
    if (full.startsWith("WS")) return "text-purple-400"
    if (full.includes("/3")) return "text-emerald-400"
    if (full.includes("/2")) return "text-blue-400"
    if (full.includes("HTTPS")) return "text-[var(--accent)]"
    return "text-muted-foreground"
}
export function getFileFromPath(path: string): string {
    const seg = (path ?? "").split("?")[0].split("/").pop() ?? ""
    return seg || "/"
}
export function formatIssuer(issuer: string): string {
    if (!issuer) return "-"
    // Common CA mappings
    if (issuer.includes("Let's Encrypt")) return "Let's Encrypt"
    if (issuer.includes("Google Trust Services")) return "Google"
    if (issuer.includes("DigiCert")) return "DigiCert"
    if (issuer.includes("Cloudflare")) return "Cloudflare"
    if (issuer.includes("Sectigo")) return "Sectigo"
    if (issuer.includes("GlobalSign")) return "GlobalSign"
    if (issuer.includes("Amazon")) return "Amazon"
    if (issuer.includes("ZeroSSL")) return "ZeroSSL"

    // Fallback: extract O= or CN=
    const match = issuer.match(/O=([^,]+)/) || issuer.match(/CN=([^,]+)/)
    return match ? match[1].trim() : issuer.split(",")[0].trim()
}
export function buildURL(r: TrafficEvent): string {
    return `${r.tls ? "https" : "http"}://${r.host}${r.path}`
}
export function copyText(t: string) {
    navigator.clipboard.writeText(t).catch(() => { })
}

export function parseRawReq(raw: string) {
    if (!raw) return { method: "GET", path: "/", headers: [], body: "" }
    const parts = raw.split("\n\n")
    const head = parts[0]
    const body = parts.slice(1).join("\n\n")
    const lines = head.split("\n")
    const [method, path] = (lines[0] || "GET /").split(" ")
    const headers = lines.slice(1).filter(l => l.trim()).map(l => {
        const idx = l.indexOf(":")
        if (idx !== -1) return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()] as [string, string]
        return ["", ""] as [string, string]
    }).filter((h) => h[0])
    return { method, path, headers, body }
}

export function escWin(s: string) { return s.replace(/"/g, '\\"') }
export function escPosix(s: string) { return s.replace(/'/g, "'\\''") }

export function toCurlWin(r: TrafficEvent): string {
    const p = parseRawReq(r.request_raw || "")
    let cmd = `curl -X ${p.method} "${buildURL(r)}"`
    p.headers.forEach(([k, v]) => { cmd += ` -H "${k}: ${escWin(v)}"` })
    if (p.body) cmd += ` -d "${escWin(p.body)}"`
    return cmd
}

export function toCurlPosix(r: TrafficEvent): string {
    const p = parseRawReq(r.request_raw || "")
    let cmd = `curl -X ${p.method} '${buildURL(r)}'`
    p.headers.forEach(([k, v]) => { cmd += ` \\\n  -H '${k}: ${escPosix(v)}'` })
    if (p.body) cmd += ` \\\n  -d '${escPosix(p.body)}'`
    return cmd
}

export function toPowerShell(r: TrafficEvent): string {
    const p = parseRawReq(r.request_raw || "")
    let cmd = `Invoke-WebRequest -Uri "${buildURL(r)}" -Method ${p.method}`
    if (p.headers.length > 0) {
        const h = p.headers.map(([k, v]) => `"${k}"="${escWin(v)}"`).join('; ')
        cmd += ` -Headers @{${h}}`
    }
    if (p.body) cmd += ` -Body "${escWin(p.body)}"`
    return cmd
}

export function toFetch(r: TrafficEvent): string {
    const p = parseRawReq(r.request_raw || "")
    let cmd = `fetch("${buildURL(r)}", {\n  method: "${p.method}",`
    if (p.headers.length > 0) {
        cmd += `\n  headers: {`
        p.headers.forEach(([k, v]) => { cmd += `\n    "${k}": "${v.replace(/"/g, '\\"')}",` })
        cmd += `\n  },`
    }
    if (p.body) cmd += `\n  body: ${JSON.stringify(p.body)},`
    cmd += `\n})`
    return cmd
}

export function toPython(r: TrafficEvent): string {
    const p = parseRawReq(r.request_raw || "")
    let code = `import requests\n\nurl = "${buildURL(r)}"\n`
    if (p.headers.length > 0) {
        code += `headers = {\n`
        p.headers.forEach(([k, v]) => { code += `    "${k}": "${v.replace(/"/g, '\\"')}",\n` })
        code += `}\n`
    }
    if (p.body) {
        code += `data = ${JSON.stringify(p.body)}\n`
        code += `response = requests.${p.method.toLowerCase()}(url, headers=headers, data=data)\n`
    } else {
        code += `response = requests.${p.method.toLowerCase()}(url, headers=headers)\n`
    }
    code += `print(response.text)`
    return code
}

export function toGo(r: TrafficEvent): string {
    const p = parseRawReq(r.request_raw || "")
    let code = `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"\n\t"strings"\n)\n\nfunc main() {\n`
    code += `\tclient := &http.Client{}\n`
    if (p.body) {
        code += `\tbody := strings.NewReader(\`${p.body.replace(/`/g, "'")}\`)\n`
        code += `\treq, _ := http.NewRequest("${p.method}", "${buildURL(r)}", body)\n`
    } else {
        code += `\treq, _ := http.NewRequest("${p.method}", "${buildURL(r)}", nil)\n`
    }
    p.headers.forEach(([k, v]) => {
        code += `\treq.Header.Set("${k}", "${v.replace(/"/g, '\\"')}")\n`
    })
    code += `\tresp, _ := client.Do(req)\n\tdefer resp.Body.Close()\n`
    code += `\tb, _ := io.ReadAll(resp.Body)\n\tfmt.Println(string(b))\n}`
    return code
}

export function getRequestHeader(raw: string, name: string): string {
    const head = raw.split("\n\n")[0]
    const lines = head.split("\n")
    const found = lines.find(l => l.toLowerCase().startsWith(`${name.toLowerCase()}:`))
    return found ? found.split(":")[1]?.trim() : ""
}

export interface CopyableReq {
    request_raw?: string
    response_raw?: string
    host?: string
    path?: string
    query?: string
    tls?: boolean
}

export function getUniversalCopyItems(reqs: CopyableReq[]) {
    const isSingle = reqs.length === 1
    
    return [
      { label: isSingle ? "URL" : `URLs (${reqs.length})`, icon: <Globe className="size-3" />, action: () => copyText(reqs.map(i => buildURL(i as any)).join("\n")) },
      { label: isSingle ? "Host" : "Hosts", icon: <Globe className="size-3" />, action: () => copyText(reqs.map(i => i.host ?? "").join("\n")) },
      { label: "Path", action: () => copyText(reqs.map(i => i.path ?? "").join("\n")) },
      { label: "Path with Query", action: () => copyText(reqs.map(i => (i.path || "") + (i.query ? "?" + i.query : "")).join("\n")) },
      { type: "separator" },
      { label: isSingle ? "Full Request" : "Full Requests", icon: <FileCode className="size-3" />, action: () => copyText(reqs.map(i => i.request_raw || "").join("\n\n---\n\n")) },
      { label: isSingle ? "Full Response" : "Full Responses", icon: <FileCode className="size-3" />, action: () => copyText(reqs.map(i => i.response_raw || "").join("\n\n---\n\n")) },
      { label: "Request Headers", action: () => copyText(reqs.map(i => (i.request_raw || "").split("\n\n")[0]).join("\n\n---\n\n")) },
      { label: "Response Headers", action: () => copyText(reqs.map(i => (i.response_raw || "").split("\n\n")[0]).join("\n\n---\n\n")) },
      { label: "Request Body", action: () => copyText(reqs.map(i => (i.request_raw || "").split("\n\n").slice(1).join("\n\n")).join("\n\n---\n\n")) },
      { label: "Response Body", action: () => copyText(reqs.map(i => (i.response_raw || "").split("\n\n").slice(1).join("\n\n")).join("\n\n---\n\n")) },
      { type: "separator" },
      { label: "Request Cookie", icon: <Cookie className="size-3" />, action: () => copyText(reqs.map(i => getRequestHeader(i.request_raw || "", "Cookie")).filter(Boolean).join("\n")) },
      { label: "Response Set-Cookie", icon: <Cookie className="size-3" />, action: () => copyText(reqs.map(i => getRequestHeader(i.response_raw || "", "Set-Cookie")).filter(Boolean).join("\n")) },
      { type: "separator" },
      { label: "as cURL (bash)", icon: <Terminal className="size-3" />, action: () => copyText(reqs.map(i => toCurlPosix(i as any)).join("\n")) },
      { label: "as cURL (cmd)", icon: <Terminal className="size-3" />, action: () => copyText(reqs.map(i => toCurlWin(i as any)).join("\n")) },
      { label: "as Fetch", icon: <Code className="size-3" />, action: () => copyText(reqs.map(i => toFetch(i as any)).join("\n\n")) },
      { label: "as Python (requests)", icon: <Code className="size-3" />, action: () => copyText(reqs.map(i => toPython(i as any)).join("\n\n# ---\n\n")) },
      { label: "as Go (http)", icon: <Code className="size-3" />, action: () => copyText(reqs.map(i => toGo(i as any)).join("\n\n// ---\n\n")) },
    ]
}

export function buildHAR(reqs: TrafficEvent[]): string {
    return JSON.stringify({
        log: {
            version: "1.2",
            creator: { name: "Meowl", version: "1.0.0" },
            entries: reqs.map(r => ({
                startedDateTime: r.time,
                time: r.latency,
                request: {
                    method: r.method, url: buildURL(r),
                    httpVersion: r.protocol ?? "HTTP/1.1",
                    headers: [], queryString: [], cookies: [],
                    headersSize: -1, bodySize: r.request_size ?? -1,
                },
                response: {
                    status: r.status_code, statusText: "",
                    httpVersion: r.protocol ?? "HTTP/1.1",
                    headers: [], cookies: [],
                    content: { size: r.size ?? 0, mimeType: r.mime_type ?? "" },
                    redirectURL: "", headersSize: -1, bodySize: r.size ?? -1,
                },
                timings: { send: 0, wait: r.latency, receive: 0 },
                serverIPAddress: r.server_ip ?? "",
            }))
        }
    }, null, 2)
}

export function downloadHAR(content: string, filename: string) {
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([content], { type: "application/json" }))
    a.download = filename; a.click()
}

// ─── Column Definitions ─────────────────────────────────────────────────────

export type ColKey = string
export interface ColDef {
    key: ColKey; label: string; defaultWidth: number; minWidth: number; maxWidth?: number
    sortKey: string; flexGrow?: number; render: (r: TrafficEvent, w: number, index: number) => React.ReactNode
}

export function Clip({ children }: { children: React.ReactNode }) {
    return (
        <div className="overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex items-center w-full">
            {children}
        </div>
    )
}

function BoolIcon({ val, activeColor = "text-accent" }: { val: boolean; activeColor?: string }) {
    return (
        <div className="flex justify-center w-full">
            {val
                ? <Check className={`size-3 ${activeColor} drop-shadow-[0_0_8px_rgba(94,106,210,0.4)]`} />
                : <Minus className="size-3 opacity-10" />}
        </div>
    )
}

function Mono({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <span className={`font-mono tabular-nums tracking-tight ${className}`}>{children}</span>
}

export const ALL_COLUMNS: ColDef[] = [
    {
        key: "id", label: "#", defaultWidth: 40, minWidth: 30, maxWidth: 60, sortKey: "id", flexGrow: 0,
        render: (r, _, idx) => <Clip><Mono className="text-foreground-muted/60 text-center w-full text-[9px]">{r.id === 0 ? idx + 1 : r.id}</Mono></Clip>
    },
    {
        key: "method", label: "Method", defaultWidth: 60, minWidth: 50, maxWidth: 84, sortKey: "method", flexGrow: 0,
        render: (r) => <Clip><span className={`font-sans font-bold px-1.5 py-0.5 rounded-md text-[9px] tracking-wider uppercase bg-white/5 border border-white/5 ${getMethodClass(r.method)}`}>{r.method}</span></Clip>
    },
    {
        key: "direction", label: "Dir", defaultWidth: 40, minWidth: 30, maxWidth: 64, sortKey: "status_code", flexGrow: 0,
        render: (r) => {
            let sign = "="
            let color = "text-emerald-400"
            if (r.source === "InterceptRequest") { sign = ">"; color = "text-accent" } 
            else if (r.source === "InterceptResponse") { sign = "<"; color = "text-orange-400" } 
            else if (r.status_code === 0) { sign = ">"; color = "text-accent/60" }
            return <div className={`flex justify-center w-full font-bold ${color}`}>{sign}</div>
        }
    },
    {
        key: "host", label: "Domain", defaultWidth: 160, minWidth: 100, sortKey: "host", flexGrow: 1,
        render: (r) => <Clip><span className="text-foreground/90 font-medium">{r.host}</span></Clip>
    },
    {
        key: "url_base", label: "Host", defaultWidth: 200, minWidth: 100, sortKey: "host", flexGrow: 1,
        render: (r) => <Clip><span className="text-foreground/90 font-medium"><span className="opacity-40">{r.tls ? "https" : "http"}://</span>{r.host}</span></Clip>
    },
    {
        key: "path", label: "Path", defaultWidth: 260, minWidth: 100, sortKey: "path", flexGrow: 2,
        render: (r) => <Clip><span className="text-foreground-muted tracking-tight">{r.path}</span></Clip>
    },
    {
        key: "query", label: "Query", defaultWidth: 150, minWidth: 40, sortKey: "query", flexGrow: 1,
        render: (r) => <Clip><span className="text-foreground-subtle text-[10px] italic">{r.query || "-"}</span></Clip>
    },
    {
        key: "status", label: "Status", defaultWidth: 60, minWidth: 44, sortKey: "status_code", flexGrow: 0,
        render: (r) => <Clip><Mono className={`${getStatusClass(r.status_code)} text-center w-full font-bold`}>{r.status_code || "-"}</Mono></Clip>
    },
    {
        key: "mime", label: "MIME", defaultWidth: 80, minWidth: 50, sortKey: "mime_type", flexGrow: 0,
        render: (r) => <Clip><span className="text-foreground-muted/80 text-[10px] uppercase tracking-tighter">{r.mime_type?.split("/")[1] || r.mime_type || "-"}</span></Clip>
    },
    {
        key: "total_size", label: "Size", defaultWidth: 80, minWidth: 60, sortKey: "size", flexGrow: 0,
        render: (r) => <Clip><Mono className="text-accent text-right w-full text-[10px] font-bold">{r.status_code === 0 ? "-" : formatBytes((r.request_size || 0) + (r.size || 0))}</Mono></Clip>
    },
    {
        key: "payload_total", label: "Payload", defaultWidth: 90, minWidth: 60, sortKey: "payload_request_size", flexGrow: 0,
        render: (r) => <Clip><Mono className="text-accent/70 text-right w-full text-[10px]">{r.status_code === 0 ? "-" : formatBytes((r.payload_request_size || 0) + (r.payload_response_size || 0))}</Mono></Clip>
    },
    {
        key: "headers_size", label: "H-Size", defaultWidth: 80, minWidth: 60, sortKey: "headers_size", flexGrow: 0,
        render: (r) => <Clip><Mono className="text-foreground-subtle text-right w-full text-[10px]">{r.status_code === 0 ? "-" : formatBytes(r.headers_size)}</Mono></Clip>
    },
    {
        key: "request_size", label: "Req Size", defaultWidth: 80, minWidth: 60, sortKey: "request_size", flexGrow: 0,
        render: (r) => <Clip><Mono className="text-foreground-muted/60 text-right w-full text-[10px]">{formatBytes(r.request_size)}</Mono></Clip>
    },
    {
        key: "response_size", label: "Res Size", defaultWidth: 80, minWidth: 60, sortKey: "size", flexGrow: 0,
        render: (r) => <Clip><Mono className="text-emerald-400/80 text-right w-full text-[10px]">{r.status_code === 0 ? "-" : formatBytes(r.size)}</Mono></Clip>
    },
    {
        key: "url_length", label: "Length URL", defaultWidth: 80, minWidth: 30, sortKey: "url_length",
        render: (r) => <Clip><Mono className="text-muted-foreground/80 text-right w-full">{r.url_length || 0}</Mono></Clip>
    },
    {
        key: "payload_response_size", label: "Response Payload Size", defaultWidth: 140, minWidth: 50, sortKey: "payload_response_size",
        render: (r) => <Clip><Mono className="text-emerald-400/80 text-right w-full">{r.status_code === 0 ? "-" : formatBytes(r.payload_response_size)}</Mono></Clip>
    },
    {
        key: "payload_request_size", label: "Request Payload Size", defaultWidth: 140, minWidth: 50, sortKey: "payload_request_size",
        render: (r) => <Clip><Mono className="text-muted-foreground/90 text-right w-full">{formatBytes(r.payload_request_size)}</Mono></Clip>
    },
    {
        key: "req_headers_size", label: "Request Headers Size", defaultWidth: 140, minWidth: 50, sortKey: "req_headers_size",
        render: (r) => <Clip><Mono className="text-muted-foreground/90 text-right w-full">{formatBytes(r.req_headers_size)}</Mono></Clip>
    },
    {
        key: "res_headers_size", label: "Response Headers Size", defaultWidth: 150, minWidth: 50, sortKey: "res_headers_size",
        render: (r) => <Clip><Mono className="text-emerald-400/80 text-right w-full">{r.status_code === 0 ? "-" : formatBytes(r.res_headers_size)}</Mono></Clip>
    },
    {
        key: "time", label: "RTT", defaultWidth: 66, minWidth: 50, sortKey: "latency", flexGrow: 0,
        render: (r) => <Clip><Mono className={`text-right w-full font-bold text-[10px] ${latencyColor(r.latency)}`}>{formatLatency(r.latency)}</Mono></Clip>
    },
    {
        key: "proto", label: "Proto", defaultWidth: 60, minWidth: 44, maxWidth: 100, sortKey: "protocol", flexGrow: 0,
        render: (r) => {
            const p = formatProtocol(r.protocol, r.tls)
            return <Clip><Mono className={`text-[9px] font-bold tracking-tight w-full text-center opacity-60 ${protocolColor(p)}`}>{p}</Mono></Clip>
        }
    },
    {
        key: "tls_icon", label: "TLS", defaultWidth: 36, minWidth: 20, sortKey: "tls",
        render: (r) => <BoolIcon val={r.tls} />
    },
    {
        key: "cookie_icon", label: "Cookie", defaultWidth: 44, minWidth: 20, sortKey: "has_cookie",
        render: (r) => <BoolIcon val={r.has_cookie} activeColor="text-yellow-400" />
    },
    {
        key: "has_query", label: "Params", defaultWidth: 44, minWidth: 20, sortKey: "query",
        render: (r) => <BoolIcon val={!!r.query} activeColor="text-orange-400" />
    },
    {
        key: "ip", label: "RHOST", defaultWidth: 110, minWidth: 40, sortKey: "server_ip",
        render: (r) => <Clip><Mono className="text-muted-foreground/80 text-[10px]">{r.server_ip || "-"}</Mono></Clip>
    },
    {
        key: "source_ip", label: "LHOST", defaultWidth: 110, minWidth: 40, sortKey: "source_ip",
        render: (r) => <Clip><Mono className="text-muted-foreground/80 text-[10px]">{r.source_ip || "-"}</Mono></Clip>
    },
    {
        key: "lport", label: "LPORT", defaultWidth: 56, minWidth: 30, sortKey: "lport",
        render: (r) => <Clip><Mono className="text-muted-foreground/80 text-[10px]">{r.lport ?? "-"}</Mono></Clip>
    },
    {
        key: "rport", label: "RPORT", defaultWidth: 56, minWidth: 30, sortKey: "rport",
        render: (r) => <Clip><Mono className="text-muted-foreground/80 text-[10px]">{r.rport ?? "-"}</Mono></Clip>
    },
    {
        key: "extension", label: "Ext", defaultWidth: 52, minWidth: 20, sortKey: "extension",
        render: (r) => <Clip><span className="text-muted-foreground/90 font-medium text-[10px]">{r.extension || "-"}</span></Clip>
    },
    {
        key: "source", label: "Source", defaultWidth: 72, minWidth: 36, sortKey: "source",
        render: (r) => <Clip><span className="text-muted-foreground/80 text-[10px] uppercase font-semibold tracking-tighter">{r.source || "browser"}</span></Clip>
    },
    {
        key: "title", label: "Title", defaultWidth: 140, minWidth: 40, sortKey: "title",
        render: (r) => <Clip><span className="text-foreground/60 text-[10px]">{r.title || "-"}</span></Clip>
    },
    {
        key: "tls_issuer", label: "TLS Issuer", defaultWidth: 130, minWidth: 40, sortKey: "tls_issuer",
        render: (r) => <Clip><span className="text-muted-foreground/90 text-[10px]">{formatIssuer(r.tls_issuer)}</span></Clip>
    },
    {
        key: "url", label: "URL", defaultWidth: 300, minWidth: 50, sortKey: "host",
        render: (r) => <Clip><span className="text-muted-foreground/80 text-[10px]">{buildURL(r)}</span></Clip>
    },
    {
        key: "file", label: "File", defaultWidth: 110, minWidth: 30, sortKey: "path",
        render: (r) => <Clip><span className="text-foreground/60 text-[10px]">{getFileFromPath(r.path)}</span></Clip>
    },
    {
        key: "start_time", label: "Start", defaultWidth: 160, minWidth: 50, sortKey: "start_time",
        render: (r) => <Clip><Mono className="text-muted-foreground/80 text-[10px]">{formatTime(r.start_time || r.time)}</Mono></Clip>
    },
    {
        key: "end_time", label: "End", defaultWidth: 160, minWidth: 50, sortKey: "end_time",
        render: (r) => <Clip><Mono className="text-muted-foreground/80 text-[10px]">{r.end_time ? formatTime(r.end_time) : (r.time ? formatTime(new Date(new Date(r.time).getTime() + (r.latency || 0)).toISOString()) : "-")}</Mono></Clip>
    },
    {
        key: "time_col", label: "Time", defaultWidth: 160, minWidth: 50, sortKey: "time",
        render: (r) => <Clip><Mono className="text-muted-foreground/90 text-[10px]">{formatTime(r.start_time || r.time)}</Mono></Clip>
    },
]

export const DEFAULT_VISIBLE = ["id", "method", "host", "path", "query", "status", "total_size", "payload_total", "time", "title"]
export const INTERCEPT_DEFAULT_VISIBLE = ["method", "host", "path", "mime", "total_size"]
export const INTERCEPT_ONLY_VISIBLE = ["id", "proto", "method", "host", "path", "request_size", "payload_request_size", "direction", "time_col", "url_base"]

export const SEARCH_LOCATIONS = ["ALL", "URL", "HEADERS", "BODY"]
export const INTERACTION_SCOPES = ["ALL", "REQUEST", "RESPONSE"]

