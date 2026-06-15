import { useMemo } from 'react'
import type { TrafficEvent, SiteNode } from '@/types/proxy'

/**
 * Hook to transform a flat list of traffic events into a hierarchical site map.
 * Optimized with useMemo to only rebuild the tree when requests change.
 */
export function useSiteMap(requests: TrafficEvent[]) {
    return useMemo(() => {
        const tree = new Map<string, SiteNode>()
        const flatNodes = new Map<string, SiteNode>()

        if (!requests || !Array.from(requests)) return { tree, flatNodes }

        for (const t of requests) {
            const host = t.host || "unknown"
            if (!tree.has(host)) {
                const newNode: SiteNode = {
                    label: host,
                    fullPath: host,
                    requests: 0,
                    children: new Map(),
                    methods: new Set(),
                    statusCodes: new Set(),
                    eventUids: []
                }
                tree.set(host, newNode)
                flatNodes.set(host, newNode)
            }
            const hostNode = tree.get(host)!
            hostNode.requests++
            hostNode.methods.add(t.method || "GET")
            hostNode.eventUids.push(t._uid)
            if (t.status_code) hostNode.statusCodes.add(t.status_code)

            // Walk path segments
            const segments = (t.path || "/").split("/").filter(Boolean)
            let cur = hostNode
            let curPath = host
            for (const seg of segments) {
                curPath += "/" + seg
                if (!cur.children.has(seg)) {
                    const newNode: SiteNode = {
                        label: seg,
                        fullPath: curPath,
                        requests: 0,
                        children: new Map(),
                        methods: new Set(),
                        statusCodes: new Set(),
                        eventUids: []
                    }
                    cur.children.set(seg, newNode)
                    flatNodes.set(curPath, newNode)
                }
                const child = cur.children.get(seg)!
                child.requests++
                child.methods.add(t.method || "GET")
                child.eventUids.push(t._uid)
                if (t.status_code) child.statusCodes.add(t.status_code)
                cur = child
            }
        }

        return { tree, flatNodes }
    }, [requests])
}
