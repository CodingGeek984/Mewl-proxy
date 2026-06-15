export type SearchLocation = "all" | "url" | "headers" | "body"
export type InteractionScope = "all" | "request" | "response"

export interface SearchConfig {
    locations: SearchLocation[]
    interactionScopes: InteractionScope[]
    regex: boolean
    negative: boolean
}

export interface FilterConfig {
    enabled: boolean
    reqHasResponse: boolean
    reqHasParams: boolean
    mimeHtml: boolean
    mimeImages: boolean
    mimeCss: boolean
    mimeJson: boolean
    mimeOther: boolean
    status2xx: boolean
    status3xx: boolean
    status4xx: boolean
    status5xx: boolean
    methodGet: boolean
    methodPost: boolean
    methodPut: boolean
    methodDelete: boolean
    methodOptions: boolean
    hideExtensions: string
    listenerPort: string
}

export interface Rule {
    id: string
    category: string
    name: string
    enabled: boolean
    type: string
    scope: string
    pattern: string
    replacement: string
    cel_expression: string
    color: string
    delay_ms: number
    visible: boolean
    // Legacy support for older components during migration
    match?: string
    replace?: string
}

export interface TrafficEvent {
    _uid: string           // client-side UUID (use for React key={})
    id: number
    time: string
    tool: string
    method: string
    host: string
    path: string
    query: string
    param_count: number
    status_code: number
    size: number
    request_size: number
    latency: number
    mime_type: string
    tls: boolean
    protocol: string
    lport: number | null
    rport: number | null
    source_ip: string | null
    server_ip: string | null
    has_cookie: boolean
    extension: string
    source: string
    length: number
    payload_request_size: number
    payload_response_size: number
    headers_size: number
    title: string
    tls_issuer: string
    set_cookies: number
    start_time: string
    end_time: string
    req_headers_size: number
    res_headers_size: number
    url_length: number
    request_raw: string
    response_raw: string
}

export type TelemetryEvent = { rps: number; latency: number }

export interface SiteNode {
    label: string
    fullPath: string
    requests: number
    children: Map<string, SiteNode>
    methods: Set<string>
    statusCodes: Set<number>
    eventUids: string[]
}

export interface SandboxHistoryEntry {
    request: string
    response: string
    status: number
    time: number
    host: string
    tls: boolean
    timestamp: number
}

export interface Sandbox {
    id: string
    name: string
    method: string
    host: string
    request: string
    response: string
    status: number
    time: number
    tls: boolean
    loading: boolean
    group?: string
    color?: string
    history: SandboxHistoryEntry[]
    historyIndex: number
}
