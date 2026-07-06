import { useState, useCallback, useEffect } from 'react'

export function useProxyIntercepts(wsRef: React.RefObject<WebSocket | null>) {
    const [isInterceptEnabled, setIsInterceptEnabled] = useState(false)
    const [requestBreakpoint, setRequestBreakpoint] = useState(false)
    const [responseBreakpoint, setResponseBreakpoint] = useState(false)

    const handleSetIsInterceptEnabled = useCallback((val: boolean) => {
        setIsInterceptEnabled(val)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "intercept_action", action: val ? "on" : "off" }))
        }
    }, [wsRef])

    const sendInterceptAction = useCallback((action: "on" | "off" | "forward" | "drop" | "intercept_response", uid?: string, payload?: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "intercept_action", action, uid, payload }))
        }
    }, [wsRef])

    const handleSetRequestBreakpoint = useCallback((val: boolean) => {
        setRequestBreakpoint(val)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "set_breakpoints",
                request: val,
                response: responseBreakpoint
            }))
        }
    }, [wsRef, responseBreakpoint])

    const handleSetResponseBreakpoint = useCallback((val: boolean) => {
        setResponseBreakpoint(val)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: "set_breakpoints",
                request: requestBreakpoint,
                response: val
            }))
        }
    }, [wsRef, requestBreakpoint])

    // Sync breakpoint states with interception
    useEffect(() => {
        if (!requestBreakpoint && !responseBreakpoint && isInterceptEnabled) {
            handleSetIsInterceptEnabled(false)
        }
    }, [requestBreakpoint, responseBreakpoint, isInterceptEnabled, handleSetIsInterceptEnabled])

    return {
        isInterceptEnabled,
        setIsInterceptEnabled: handleSetIsInterceptEnabled,
        requestBreakpoint,
        setRequestBreakpoint: handleSetRequestBreakpoint,
        responseBreakpoint,
        setResponseBreakpoint: handleSetResponseBreakpoint,
        sendInterceptAction
    }
}
