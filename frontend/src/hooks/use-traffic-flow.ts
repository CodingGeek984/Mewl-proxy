import { useState, useEffect, useRef, useCallback } from 'react'
// @ts-ignore
import { traffic } from '@/lib/traffic'
import type { TrafficEvent, TelemetryEvent } from '@/types/proxy'

const MAX_REQUESTS = 10_000
const FLUSH_INTERVAL_MS = 150

function mergeEvents(prev: TrafficEvent[], incoming: TrafficEvent[]): TrafficEvent[] {
    if (incoming.length === 0) return prev
    const newItems = [...incoming].reverse()
    const nextMap = new Map<string, TrafficEvent>()
    for (const r of newItems) if (!nextMap.has(r._uid)) nextMap.set(r._uid, r)
    for (const r of prev) if (!nextMap.has(r._uid)) nextMap.set(r._uid, r)
    const merged = Array.from(nextMap.values())
    merged.sort((a, b) => (b.id || 0) - (a.id || 0))
    return merged.length > MAX_REQUESTS ? merged.slice(0, MAX_REQUESTS) : merged
}

export function useTrafficFlow() {
    const [isConnected, setIsConnected] = useState(false)
    const [isLive, setIsLive] = useState(true)
    const [requests, setRequests] = useState<TrafficEvent[]>([])
    const [intercepts, setIntercepts] = useState<TrafficEvent[]>([])
    const [telemetry, setTelemetry] = useState<TelemetryEvent | null>(null)
    const [bufferedCount, setBufferedCount] = useState(0)

    const isLiveRef = useRef(true)
    const pendingLive = useRef<TrafficEvent[]>([])
    const pendingBuf = useRef<TrafficEvent[]>([])
    const wsRef = useRef<WebSocket | null>(null)

    const handleSetIsLive = useCallback((val: boolean) => {
        isLiveRef.current = val
        setIsLive(val)
    }, [])

    const flushBuffer = useCallback(() => {
        const buf = pendingBuf.current
        pendingBuf.current = []
        setBufferedCount(0)
        if (buf.length > 0) {
            setRequests(prev => mergeEvents(prev, buf))
        }
    }, [])

    const clearHistoryState = useCallback(() => {
        pendingLive.current = []
        pendingBuf.current = []
        setRequests([])
        setIntercepts([])
        setBufferedCount(0)
    }, [])

    const deleteRequestsFromState = useCallback((uidSet: Set<string>) => {
        pendingLive.current = pendingLive.current.filter(r => !uidSet.has(r._uid))
        pendingBuf.current = pendingBuf.current.filter(r => !uidSet.has(r._uid))
        setRequests(prev => prev.filter(r => !uidSet.has(r._uid)))
    }, [])

    // ── WebSocket Logic ──────────────────────────────────────────────────────
    useEffect(() => {
        let reconnectTimer: ReturnType<typeof setTimeout>

        function connect() {
            try { wsRef.current = new WebSocket('ws://127.0.0.1:8000/ws') }
            catch {
                reconnectTimer = setTimeout(connect, 2000)
                return
            }

            const ws = wsRef.current
            ws.binaryType = "arraybuffer"

            ws.onopen = () => setIsConnected(true)
            ws.onclose = () => {
                setIsConnected(false)
                reconnectTimer = setTimeout(connect, 2000)
            }
            ws.onerror = () => {}

            ws.onmessage = (event) => {
                try {
                    let msg: any
                    if (event.data instanceof ArrayBuffer) {
                        const batch = traffic.WSBatch.decode(new Uint8Array(event.data))
                        batch.events.forEach((d: any) => {
                            const req: TrafficEvent = {
                                _uid: d.uid,
                                id: Number(d.id),
                                time: d.time || '',
                                tool: d.tool || '',
                                method: d.method || '',
                                host: d.host || '',
                                path: d.path || '',
                                query: d.query || '',
                                param_count: 0,
                                status_code: Number(d.statusCode) || 0,
                                size: Number(d.size) || 0,
                                request_size: Number(d.requestSize) || 0,
                                latency: Number(d.latency) || 0,
                                mime_type: d.mimeType || '',
                                tls: !!d.tls,
                                protocol: d.protocol || '',
                                lport: Number(d.lport) || null,
                                rport: Number(d.rport) || null,
                                source_ip: d.sourceIp || null,
                                server_ip: d.serverIp || null,
                                has_cookie: !!d.hasCookie,
                                extension: d.extension || '',
                                source: d.source || '',
                                length: Number(d.length) || 0,
                                payload_request_size: Number(d.payloadRequestSize) || 0,
                                payload_response_size: Number(d.payloadResponseSize) || 0,
                                headers_size: Number(d.headersSize) || 0,
                                title: d.title || '',
                                tls_issuer: d.tlsIssuer || '',
                                set_cookies: Number(d.setCookies) || 0,
                                start_time: d.startTime || '',
                                end_time: d.endTime || '',
                                req_headers_size: Number(d.reqHeadersSize) || 0,
                                res_headers_size: Number(d.resHeadersSize) || 0,
                                url_length: Number(d.urlLength) || 0,
                                request_raw: d.requestRaw || '',
                                response_raw: d.responseRaw || '',
                            }

                            const isInt = req.source === "intercept"
                            if (isInt && req.status_code === 0) {
                                setIntercepts(prev => {
                                    if (prev.find(r => r._uid === req._uid)) return prev.map(r => r._uid === req._uid ? req : r)
                                    return [req, ...prev]
                                })
                            } else {
                                if (isInt && req.status_code > 0) {
                                    setIntercepts(prev => prev.filter(r => r._uid !== req._uid))
                                }
                                if (isLiveRef.current) pendingLive.current.push(req)
                                else pendingBuf.current.push(req)
                            }
                        })
                        return
                    } else {
                        msg = JSON.parse(event.data as string)
                    }

                    if (msg.type === 'new_traffic') {
                        const req: TrafficEvent = { ...msg.data, _uid: msg.data._uid || msg.data.uid || crypto.randomUUID() }
                        const isInt = req.source === "intercept"
                        if (isInt && req.status_code === 0) {
                            setIntercepts(prev => {
                                const exists = prev.find(r => r._uid === req._uid)
                                if (exists) return prev.map(r => r._uid === req._uid ? req : r)
                                return [req, ...prev]
                            })
                        } else {
                            if (isInt && req.status_code > 0) {
                                setIntercepts(prev => prev.filter(r => r._uid !== req._uid))
                            }
                            if (isLiveRef.current) pendingLive.current.push(req)
                            else pendingBuf.current.push(req)
                        }
                    } else if (msg.type === 'new_traffic_batch') {
                        const items: TrafficEvent[] = (msg.data as any[]).map(
                            (d: any) => ({ ...d, _uid: d._uid || d.uid || crypto.randomUUID() } as TrafficEvent)
                        )
                        if (isLiveRef.current) pendingLive.current.push(...items)
                        else pendingBuf.current.push(...items)
                    } else if (msg.type === 'intercept_removed') {
                        const uid = msg.data as string
                        setIntercepts(prev => prev.filter(r => r._uid !== uid))
                    } else if (msg.type === 'telemetry') {
                        setTelemetry(msg.data as TelemetryEvent)
                    }
                } catch { /* ignore */ }
            }
        }

        connect()
        return () => { clearTimeout(reconnectTimer); wsRef.current?.close() }
    }, [])

    // ── Flush Timer ──────────────────────────────────────────────────────────
    useEffect(() => {
        const id = setInterval(() => {
            const live = pendingLive.current
            const buf = pendingBuf.current
            if (live.length === 0 && buf.length === 0) return

            pendingLive.current = []
            pendingBuf.current = []

            if (live.length > 0) setRequests(prev => mergeEvents(prev, live))
            if (buf.length > 0) setBufferedCount(c => c + buf.length)
        }, FLUSH_INTERVAL_MS)
        return () => clearInterval(id)
    }, [])

    return {
        isConnected,
        isLive,
        setIsLive: handleSetIsLive,
        requests,
        setRequests,
        intercepts,
        setIntercepts,
        telemetry,
        bufferedCount,
        flushBuffer,
        clearHistoryState,
        deleteRequestsFromState,
        wsRef
    }
}
