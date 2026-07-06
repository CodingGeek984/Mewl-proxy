"use client"

import {
    useEffect, useState,
    useCallback, type ReactNode,
} from 'react'
import { create } from 'zustand'
// @ts-ignore (traffic is generated)
import { traffic } from './traffic'

import type {
    SearchConfig, FilterConfig, Rule, TrafficEvent, TelemetryEvent, Sandbox
} from '@/types/proxy'

import { useTrafficFlow } from '@/hooks/use-traffic-flow'
import { useProxyRules } from '@/hooks/use-proxy-rules'
import { useProxyIntercepts } from '@/hooks/use-proxy-intercepts'
import { useProxySearch } from '@/hooks/use-proxy-search'
import { useProxyFilter } from '@/hooks/use-proxy-filter'
// @ts-ignore
import * as App from "@wailsjs/go/backend/App"

// ─── Context ──────────────────────────────────────────────────────────────────

interface WebSocketContextType {
    isConnected: boolean
    isLive: boolean
    setIsLive: (val: boolean) => void
    requests: TrafficEvent[]
    setRequests: React.Dispatch<React.SetStateAction<TrafficEvent[]>>
    bufferedCount: number
    flushBuffer: () => void
    clearHistory: () => void
    deleteRequests: (uids: string[]) => void
    telemetry: TelemetryEvent | null
    isInterceptEnabled: boolean
    setIsInterceptEnabled: (val: boolean) => void
    sendInterceptAction: (action: "on" | "off" | "forward" | "drop" | "intercept_response", uid?: string, payload?: string) => void
    resolvedUids: Set<string>
    setResolvedUids: React.Dispatch<React.SetStateAction<Set<string>>>
    searchRaw: string
    setSearchRaw: React.Dispatch<React.SetStateAction<string>>
    searchActive: string
    setSearchActive: React.Dispatch<React.SetStateAction<string>>
    searchCfg: SearchConfig
    setSearchCfg: React.Dispatch<React.SetStateAction<SearchConfig>>
    filterCfg: FilterConfig
    setFilterCfg: React.Dispatch<React.SetStateAction<FilterConfig>>
    isFilterOnly: boolean
    setIsFilterOnly: React.Dispatch<React.SetStateAction<boolean>>
    intercepts: TrafficEvent[]
    setIntercepts: React.Dispatch<React.SetStateAction<TrafficEvent[]>>
    rules: Rule[]
    setRules: React.Dispatch<React.SetStateAction<Rule[]>>
    saveRules: (newRules: Rule[]) => Promise<void>
    rowColors: Record<string, string>
    setRowColor: (uid: string, color: string) => void
    isAnchored: boolean
    setIsAnchored: (val: boolean) => void
    requestBreakpoint: boolean
    setRequestBreakpoint: (val: boolean) => void
    responseBreakpoint: boolean
    setResponseBreakpoint: (val: boolean) => void
    sandboxes: Sandbox[]
    setSandboxes: React.Dispatch<React.SetStateAction<Sandbox[]>>
    sendToRepeater: (req: any) => void
    sendToIterater: (req: any) => void
    pendingIteraterRequest: any | null
    clearPendingIterater: () => void
    getSetting: (key: string, def: string) => Promise<string>
    setSetting: (key: string, val: string) => Promise<string>
    interacterPayload: string
    setInteracterPayload: (val: string) => void
}

export const useProxyStore = create<WebSocketContextType>((set) => ({
    isConnected: false,
    isLive: true,
    setIsLive: () => { },
    requests: [],
    setRequests: () => { },
    bufferedCount: 0,
    flushBuffer: () => { },
    clearHistory: () => { },
    deleteRequests: () => { },
    telemetry: null,
    isInterceptEnabled: false,
    setIsInterceptEnabled: () => { },
    sendInterceptAction: () => { },
    resolvedUids: new Set(),
    setResolvedUids: () => { },
    searchRaw: "",
    setSearchRaw: () => { },
    searchActive: "",
    setSearchActive: () => { },
    searchCfg: { locations: ["all"], interactionScopes: ["all"], regex: false, negative: false },
    setSearchCfg: () => { },
    filterCfg: {
        enabled: false, reqHasResponse: false, reqHasParams: false,
        mimeHtml: true, mimeImages: true, mimeCss: true, mimeJson: true, mimeOther: true,
        status2xx: true, status3xx: true, status4xx: true, status5xx: true,
        methodGet: true, methodPost: true, methodPut: true, methodDelete: true, methodOptions: true,
        hideExtensions: "", listenerPort: ""
    },
    setFilterCfg: () => { },
    isFilterOnly: false,
    setIsFilterOnly: () => { },
    intercepts: [],
    setIntercepts: () => { },
    rules: [],
    setRules: () => { },
    saveRules: async () => { },
    rowColors: {},
    setRowColor: () => { },
    isAnchored: true,
    setIsAnchored: () => { },
    requestBreakpoint: false,
    setRequestBreakpoint: () => { },
    responseBreakpoint: false,
    setResponseBreakpoint: () => { },
    sandboxes: [],
    setSandboxes: () => { },
    sendToRepeater: () => { },
    sendToIterater: () => { },
    pendingIteraterRequest: null,
    clearPendingIterater: () => { },
    getSetting: async () => "",
    setSetting: async () => "",
    interacterPayload: "",
    setInteracterPayload: () => { },
}))

// ─── Provider (Now acts as State Syncer for Zustand) ──────────────────────────

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const {
        isConnected, isLive, setIsLive, requests, setRequests,
        intercepts, setIntercepts, telemetry, bufferedCount,
        flushBuffer, clearHistoryState, deleteRequestsFromState, wsRef
    } = useTrafficFlow()

    const { rules, setRules, saveRules } = useProxyRules()
    const {
        isInterceptEnabled, setIsInterceptEnabled, requestBreakpoint, setRequestBreakpoint,
        responseBreakpoint, setResponseBreakpoint, sendInterceptAction
    } = useProxyIntercepts(wsRef)
    const { searchRaw, setSearchRaw, searchActive, setSearchActive, searchCfg, setSearchCfg } = useProxySearch()
    const { filterCfg, setFilterCfg, isFilterOnly, setIsFilterOnly } = useProxyFilter()

    const [resolvedUids, setResolvedUids] = useState<Set<string>>(new Set())
    const [sandboxes, setSandboxes] = useState<Sandbox[]>([])
    const [rowColors, setRowColors] = useState<Record<string, string>>({})
    const [isAnchored, setIsAnchored] = useState(true)

    // Load sandboxes from localStorage on init
    useEffect(() => {
        const saved = localStorage.getItem("proxy_sandboxes")
        if (saved) {
            try { setSandboxes(JSON.parse(saved)) }
            catch { /* ignore */ }
        }
    }, [])

    // Save sandboxes whenever they change
    useEffect(() => {
        if (sandboxes.length > 0) {
            localStorage.setItem("proxy_sandboxes", JSON.stringify(sandboxes))
        }
    }, [sandboxes])

    const [interacterPayload, setInteracterPayload] = useState("")

    useEffect(() => {
        const saved = localStorage.getItem("proxy_interacter_payload")
        if (saved) setInteracterPayload(saved)
        
        // Ensure proxy_scope is synchronized to backend immediately on mount
        const savedScope = localStorage.getItem("proxy_scope")
        const scopeItems: string[] = savedScope ? JSON.parse(savedScope) : [".*"]
        const syncRules = scopeItems.map((host, i) => ({
            id: i + 1, enabled: true, type: "include", protocol: "Any", host: host, path: ".*"
        }))
        if (syncRules.length === 0) {
            syncRules.push({ id: 1, enabled: true, type: "include", protocol: "Any", host: ".*", path: ".*" })
        }
        App.SaveScopeRules(syncRules).catch(console.error)
    }, [])

    useEffect(() => {
        localStorage.setItem("proxy_interacter_payload", interacterPayload)
    }, [interacterPayload])

    // Initial history fetch
    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [hRes, iRes, rData] = await Promise.all([
                    fetch('http://127.0.0.1:8000/api/history').then(r => r.json()),
                    fetch('http://127.0.0.1:8000/api/intercepts').then(r => r.json()),
                    App.GetRules()
                ])
                setRequests(hRes.map((d: any) => ({ ...d, _uid: d._uid || d.uid || crypto.randomUUID() })))
                setIntercepts(iRes.map((d: any) => ({ ...d, _uid: d._uid || d.uid || crypto.randomUUID() })))
                setRules(rData || [])
            } catch (err) {
                console.error('Initial fetch failed:', err)
            }
        }
        fetchAll()
    }, [setRequests, setIntercepts, setRules])

    const setRowColor = useCallback((uid: string, color: string) => {
        setRowColors(prev => ({ ...prev, [uid]: color }))
    }, [])

    const clearHistory = useCallback(async () => {
        try {
            await fetch('http://127.0.0.1:8000/api/clear', { method: 'POST' })
        } catch (e) { console.error('Failed to clear backend history:', e) }
        clearHistoryState()
    }, [clearHistoryState])

    const deleteRequests = useCallback(async (uids: string[]) => {
        if (!uids || uids.length === 0) return
        try {
            await fetch('http://127.0.0.1:8000/api/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uids })
            })
        } catch (e) { console.error('Failed to delete backend history:', e) }
        deleteRequestsFromState(new Set(uids))
    }, [deleteRequestsFromState])

    const sendToRepeater = useCallback((req: any) => {
        const newSb: Sandbox = {
            id: `sb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: `${req.method} ${req.path || "/"}`,
            method: req.method,
            host: req.host,
            request: req.request_raw || `${req.method} ${req.path}${req.query ? "?" + req.query : ""} HTTP/1.1\nHost: ${req.host}\n\n`,
            response: req.response_raw || "",
            status: req.status_code || 0,
            time: req.latency || 0,
            tls: req.tls || false,
            loading: false,
            history: [],
            historyIndex: -1,
        }
        setSandboxes(prev => [...prev, newSb])
    }, [])

    const [pendingIteraterRequest, setPendingIteraterRequest] = useState<any | null>(null)

    const sendToIterater = useCallback((req: any) => {
        setPendingIteraterRequest({
            method: req.method,
            host: req.host,
            path: req.path,
            query: req.query,
            tls: req.tls,
            request_raw: req.request_raw || `${req.method} ${req.path}${req.query ? "?" + req.query : ""} HTTP/1.1\nHost: ${req.host}\n\n`,
        })
    }, [])

    const clearPendingIterater = useCallback(() => {
        setPendingIteraterRequest(null)
    }, [])

    const stateValues: WebSocketContextType = {
        isConnected, isLive, setIsLive, requests, setRequests, bufferedCount,
        flushBuffer, clearHistory, deleteRequests, telemetry,
        isInterceptEnabled, setIsInterceptEnabled, sendInterceptAction,
        resolvedUids, setResolvedUids, searchRaw, setSearchRaw,
        searchActive, setSearchActive, searchCfg, setSearchCfg,
        filterCfg, setFilterCfg, isFilterOnly, setIsFilterOnly,
        intercepts, setIntercepts, rules, setRules, saveRules,
        rowColors, setRowColor, isAnchored, setIsAnchored,
        requestBreakpoint, setRequestBreakpoint, responseBreakpoint, setResponseBreakpoint,
        sandboxes, setSandboxes, sendToRepeater, sendToIterater,
        pendingIteraterRequest, clearPendingIterater,
        getSetting: App.GetSetting, setSetting: App.SetSetting,
        interacterPayload, setInteracterPayload,
    }

    // Sync all values into Zustand continuously
    useEffect(() => {
        useProxyStore.setState(stateValues)
    }, [
        isConnected, isLive, requests, bufferedCount, telemetry, isInterceptEnabled,
        resolvedUids, searchRaw, searchActive, searchCfg, filterCfg, isFilterOnly,
        intercepts, rules, rowColors, isAnchored, requestBreakpoint, responseBreakpoint,
        sandboxes, pendingIteraterRequest, interacterPayload
    ])

    return <>{children}</>
}

// Keep legacy hook for easy migration - components can progressively opt into specific Zustand selectors later
export function useProxyWebsocket() {
    return useProxyStore()
}
