// Centralized mock data for all Reproxy modules

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS" | "HEAD"

export interface HttpRequest {
  id: number
  method: HttpMethod
  scheme: string
  host: string
  path: string
  url: string
  status: number
  statusText: string
  length: number
  time: number // RTT in ms
  mime: string
  extension: string
  timestamp: string
  title: string
  source: "Browser" | "Reproxy" | "Extension"
  tls: boolean
  cookies: number
  localPort: number
  remotePort: number
  requestSize: number
  responseSize: number
  requestHeaders: string
  requestBody: string
  responseHeaders: string
  responseBody: string
}

export interface SiteMapNode {
  name: string
  path: string
  requests: number
  children?: SiteMapNode[]
}

export interface ScopeRule {
  id: number
  enabled: boolean
  type: "include" | "exclude"
  protocol: string
  host: string
  path: string
}

export interface MatchRule {
  id: number
  enabled: boolean
  type: "Request Header" | "Request Body" | "Response Header" | "Response Body"
  match: string
  replace: string
  isRegex: boolean
}

export interface Sandbox {
  id: string
  name: string
  method: HttpMethod
  host: string
  request: string
  response: string
  status: number
  time: number
  tls?: boolean
  loading?: boolean
}

export interface Extension {
  id: string
  name: string
  description: string
  version: string
  author: string
  enabled: boolean
  installed: boolean
  category: string
}

export interface TrafficPoint {
  time: string
  requests: number
  "2xx": number
  "3xx": number
  "4xx": number
  "5xx": number
}

// ─── Theme Variants ─────────────────────────────────────────────────

export type ThemeVariant = "cyber-green" | "ocean-blue" | "sunset-orange" | "phantom-purple" | "blood-red"

export const themeVariants: { id: ThemeVariant; label: string; accent: string; preview: string }[] = [
  { id: "cyber-green", label: "Cyber Green", accent: "#00ff41", preview: "Default neon green hacker aesthetic" },
  { id: "ocean-blue", label: "Ocean Blue", accent: "#38bdf8", preview: "Cool blue tones for extended sessions" },
  { id: "sunset-orange", label: "Sunset Orange", accent: "#fb923c", preview: "Warm amber for comfortable focus" },
  { id: "phantom-purple", label: "Phantom Purple", accent: "#c084fc", preview: "Deep purple for stealth operations" },
  { id: "blood-red", label: "Blood Red", accent: "#f87171", preview: "Aggressive red for active engagements" },
]

// ─── HTTP History Requests ───────────────────────────────────────────

export const mockRequests: HttpRequest[] = [
  {
    id: 1, method: "GET", scheme: "https", host: "api.example.com", path: "/v2/users", url: "https://api.example.com/v2/users",
    status: 200, statusText: "OK", length: 4521, time: 142, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:14Z",
    title: "User List API", source: "Browser", tls: true, cookies: 2, localPort: 52341, remotePort: 443, requestSize: 312, responseSize: 4521,
    requestHeaders: "GET /v2/users HTTP/2\nHost: api.example.com\nAccept: application/json\nAuthorization: Bearer eyJhbGciOi...\nUser-Agent: Reproxy/1.0\nAccept-Encoding: gzip, deflate, br",
    requestBody: "",
    responseHeaders: "HTTP/2 200 OK\nContent-Type: application/json; charset=utf-8\nContent-Length: 4521\nX-Request-Id: a7b3c1d4\nCache-Control: no-cache",
    responseBody: '{\n  "users": [\n    {\n      "id": 1,\n      "username": "admin",\n      "email": "admin@example.com",\n      "role": "administrator",\n      "last_login": "2026-03-01T09:15:00Z"\n    },\n    {\n      "id": 2,\n      "username": "john_doe",\n      "email": "john@example.com",\n      "role": "user",\n      "last_login": "2026-02-28T14:30:00Z"\n    }\n  ],\n  "total": 156,\n  "page": 1\n}'
  },
  {
    id: 2, method: "POST", scheme: "https", host: "api.example.com", path: "/v2/auth/login", url: "https://api.example.com/v2/auth/login",
    status: 200, statusText: "OK", length: 892, time: 234, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:12Z",
    title: "Login Endpoint", source: "Browser", tls: true, cookies: 1, localPort: 52342, remotePort: 443, requestSize: 198, responseSize: 892,
    requestHeaders: "POST /v2/auth/login HTTP/2\nHost: api.example.com\nContent-Type: application/json\nUser-Agent: Mozilla/5.0",
    requestBody: '{\n  "username": "admin",\n  "password": "hunter2"\n}',
    responseHeaders: "HTTP/2 200 OK\nContent-Type: application/json\nSet-Cookie: session=abc123; HttpOnly; Secure",
    responseBody: '{\n  "token": "eyJhbGciOiJIUzI1NiIs...",\n  "expires_in": 3600,\n  "user": {\n    "id": 1,\n    "role": "admin"\n  }\n}'
  },
  {
    id: 3, method: "GET", scheme: "https", host: "cdn.example.com", path: "/assets/main.js", url: "https://cdn.example.com/assets/main.js",
    status: 304, statusText: "Not Modified", length: 0, time: 18, mime: "application/javascript", extension: "js", timestamp: "2026-03-01T10:23:15Z",
    title: "Main JS Bundle", source: "Browser", tls: true, cookies: 0, localPort: 52343, remotePort: 443, requestSize: 156, responseSize: 0,
    requestHeaders: "GET /assets/main.js HTTP/2\nHost: cdn.example.com\nIf-None-Match: \"abc123\"",
    requestBody: "",
    responseHeaders: "HTTP/2 304 Not Modified\nETag: \"abc123\"\nCache-Control: max-age=31536000",
    responseBody: ""
  },
  {
    id: 4, method: "GET", scheme: "https", host: "api.example.com", path: "/v2/admin/config", url: "https://api.example.com/v2/admin/config",
    status: 403, statusText: "Forbidden", length: 128, time: 45, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:18Z",
    title: "Admin Config", source: "Reproxy", tls: true, cookies: 2, localPort: 52344, remotePort: 443, requestSize: 245, responseSize: 128,
    requestHeaders: "GET /v2/admin/config HTTP/2\nHost: api.example.com\nAuthorization: Bearer expired_token\nUser-Agent: Reproxy/1.0",
    requestBody: "",
    responseHeaders: "HTTP/2 403 Forbidden\nContent-Type: application/json",
    responseBody: '{\n  "error": "insufficient_permissions",\n  "message": "Admin role required"\n}'
  },
  {
    id: 5, method: "PUT", scheme: "https", host: "api.example.com", path: "/v2/users/1/profile", url: "https://api.example.com/v2/users/1/profile",
    status: 200, statusText: "OK", length: 654, time: 189, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:20Z",
    title: "Update Profile", source: "Reproxy", tls: true, cookies: 2, localPort: 52345, remotePort: 443, requestSize: 310, responseSize: 654,
    requestHeaders: "PUT /v2/users/1/profile HTTP/2\nHost: api.example.com\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOi...",
    requestBody: '{\n  "display_name": "Admin User",\n  "bio": "System administrator"\n}',
    responseHeaders: "HTTP/2 200 OK\nContent-Type: application/json",
    responseBody: '{\n  "id": 1,\n  "display_name": "Admin User",\n  "bio": "System administrator",\n  "updated_at": "2026-03-01T10:23:20Z"\n}'
  },
  {
    id: 6, method: "DELETE", scheme: "https", host: "api.example.com", path: "/v2/sessions/old", url: "https://api.example.com/v2/sessions/old",
    status: 204, statusText: "No Content", length: 0, time: 67, mime: "", extension: "", timestamp: "2026-03-01T10:23:22Z",
    title: "Clear Sessions", source: "Browser", tls: true, cookies: 1, localPort: 52346, remotePort: 443, requestSize: 189, responseSize: 0,
    requestHeaders: "DELETE /v2/sessions/old HTTP/2\nHost: api.example.com\nAuthorization: Bearer eyJhbGciOi...",
    requestBody: "",
    responseHeaders: "HTTP/2 204 No Content",
    responseBody: ""
  },
  {
    id: 7, method: "GET", scheme: "https", host: "www.target-app.io", path: "/", url: "https://www.target-app.io/",
    status: 200, statusText: "OK", length: 15234, time: 320, mime: "text/html", extension: "html", timestamp: "2026-03-01T10:23:25Z",
    title: "Target App Home", source: "Browser", tls: true, cookies: 3, localPort: 52347, remotePort: 443, requestSize: 156, responseSize: 15234,
    requestHeaders: "GET / HTTP/2\nHost: www.target-app.io\nAccept: text/html\nUser-Agent: Mozilla/5.0",
    requestBody: "",
    responseHeaders: "HTTP/2 200 OK\nContent-Type: text/html; charset=utf-8\nContent-Length: 15234\nX-Frame-Options: DENY\nContent-Security-Policy: default-src 'self'",
    responseBody: "<!DOCTYPE html>\n<html>\n<head>\n  <title>Target App</title>\n</head>\n<body>\n  <!-- Application content -->\n</body>\n</html>"
  },
  {
    id: 8, method: "POST", scheme: "https", host: "api.example.com", path: "/v2/upload", url: "https://api.example.com/v2/upload",
    status: 500, statusText: "Internal Server Error", length: 256, time: 1203, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:28Z",
    title: "File Upload", source: "Browser", tls: true, cookies: 2, localPort: 52348, remotePort: 443, requestSize: 15420, responseSize: 256,
    requestHeaders: "POST /v2/upload HTTP/2\nHost: api.example.com\nContent-Type: multipart/form-data; boundary=---boundary",
    requestBody: "---boundary\nContent-Disposition: form-data; name=\"file\"; filename=\"test.png\"\nContent-Type: image/png\n\n[binary data]\n---boundary--",
    responseHeaders: "HTTP/2 500 Internal Server Error\nContent-Type: application/json",
    responseBody: '{\n  "error": "internal_error",\n  "message": "File processing failed",\n  "trace_id": "x7y8z9"\n}'
  },
  {
    id: 9, method: "GET", scheme: "https", host: "api.example.com", path: "/v2/search?q=admin&page=1", url: "https://api.example.com/v2/search?q=admin&page=1",
    status: 200, statusText: "OK", length: 2341, time: 98, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:30Z",
    title: "Search Results", source: "Browser", tls: true, cookies: 2, localPort: 52349, remotePort: 443, requestSize: 278, responseSize: 2341,
    requestHeaders: "GET /v2/search?q=admin&page=1 HTTP/2\nHost: api.example.com\nAccept: application/json\nAuthorization: Bearer eyJhbGciOi...",
    requestBody: "",
    responseHeaders: "HTTP/2 200 OK\nContent-Type: application/json\nX-Total-Count: 23",
    responseBody: '{\n  "results": [\n    {"id": 1, "type": "user", "name": "admin"},\n    {"id": 5, "type": "role", "name": "admin_role"}\n  ],\n  "total": 23,\n  "page": 1\n}'
  },
  {
    id: 10, method: "OPTIONS", scheme: "https", host: "api.example.com", path: "/v2/users", url: "https://api.example.com/v2/users",
    status: 204, statusText: "No Content", length: 0, time: 12, mime: "", extension: "", timestamp: "2026-03-01T10:23:31Z",
    title: "CORS Preflight", source: "Browser", tls: true, cookies: 0, localPort: 52350, remotePort: 443, requestSize: 210, responseSize: 0,
    requestHeaders: "OPTIONS /v2/users HTTP/2\nHost: api.example.com\nOrigin: https://www.target-app.io\nAccess-Control-Request-Method: POST",
    requestBody: "",
    responseHeaders: "HTTP/2 204 No Content\nAccess-Control-Allow-Origin: https://www.target-app.io\nAccess-Control-Allow-Methods: GET, POST, PUT, DELETE\nAccess-Control-Allow-Headers: Authorization, Content-Type\nAccess-Control-Max-Age: 86400",
    responseBody: ""
  },
  {
    id: 11, method: "GET", scheme: "https", host: "www.target-app.io", path: "/api/graphql", url: "https://www.target-app.io/api/graphql",
    status: 200, statusText: "OK", length: 890, time: 156, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:33Z",
    title: "GraphQL Schema", source: "Reproxy", tls: true, cookies: 0, localPort: 52351, remotePort: 443, requestSize: 198, responseSize: 890,
    requestHeaders: "GET /api/graphql?query={__schema{types{name}}} HTTP/2\nHost: www.target-app.io",
    requestBody: "",
    responseHeaders: "HTTP/2 200 OK\nContent-Type: application/json",
    responseBody: '{\n  "data": {\n    "__schema": {\n      "types": [\n        {"name": "Query"},\n        {"name": "User"},\n        {"name": "Post"}\n      ]\n    }\n  }\n}'
  },
  {
    id: 12, method: "POST", scheme: "https", host: "www.target-app.io", path: "/api/graphql", url: "https://www.target-app.io/api/graphql",
    status: 200, statusText: "OK", length: 1243, time: 201, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:35Z",
    title: "GraphQL Mutation", source: "Reproxy", tls: true, cookies: 1, localPort: 52352, remotePort: 443, requestSize: 267, responseSize: 1243,
    requestHeaders: "POST /api/graphql HTTP/2\nHost: www.target-app.io\nContent-Type: application/json",
    requestBody: '{\n  "query": "mutation { updateUser(id: 1, role: \\"admin\\") { id role } }"\n}',
    responseHeaders: "HTTP/2 200 OK\nContent-Type: application/json",
    responseBody: '{\n  "data": {\n    "updateUser": {\n      "id": 1,\n      "role": "admin"\n    }\n  }\n}'
  },
  {
    id: 13, method: "GET", scheme: "http", host: "internal.corp.local", path: "/status", url: "http://internal.corp.local/status",
    status: 301, statusText: "Moved Permanently", length: 0, time: 34, mime: "", extension: "", timestamp: "2026-03-01T10:23:36Z",
    title: "Internal Status", source: "Reproxy", tls: false, cookies: 0, localPort: 52353, remotePort: 80, requestSize: 89, responseSize: 0,
    requestHeaders: "GET /status HTTP/1.1\nHost: internal.corp.local",
    requestBody: "",
    responseHeaders: "HTTP/1.1 301 Moved Permanently\nLocation: https://internal.corp.local/status",
    responseBody: ""
  },
  {
    id: 14, method: "GET", scheme: "https", host: "api.example.com", path: "/v2/users/1/tokens", url: "https://api.example.com/v2/users/1/tokens",
    status: 401, statusText: "Unauthorized", length: 98, time: 29, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:38Z",
    title: "Token Enum", source: "Reproxy", tls: true, cookies: 0, localPort: 52354, remotePort: 443, requestSize: 167, responseSize: 98,
    requestHeaders: "GET /v2/users/1/tokens HTTP/2\nHost: api.example.com\nUser-Agent: Reproxy/1.0",
    requestBody: "",
    responseHeaders: "HTTP/2 401 Unauthorized\nContent-Type: application/json\nWWW-Authenticate: Bearer",
    responseBody: '{\n  "error": "unauthorized",\n  "message": "Authentication required"\n}'
  },
  {
    id: 15, method: "PATCH", scheme: "https", host: "api.example.com", path: "/v2/settings", url: "https://api.example.com/v2/settings",
    status: 200, statusText: "OK", length: 432, time: 112, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:40Z",
    title: "Update Settings", source: "Browser", tls: true, cookies: 2, localPort: 52355, remotePort: 443, requestSize: 234, responseSize: 432,
    requestHeaders: "PATCH /v2/settings HTTP/2\nHost: api.example.com\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOi...",
    requestBody: '{\n  "notifications": true,\n  "theme": "dark"\n}',
    responseHeaders: "HTTP/2 200 OK\nContent-Type: application/json",
    responseBody: '{\n  "notifications": true,\n  "theme": "dark",\n  "updated": true\n}'
  },
  {
    id: 16, method: "GET", scheme: "https", host: "cdn.example.com", path: "/assets/style.css", url: "https://cdn.example.com/assets/style.css",
    status: 200, statusText: "OK", length: 8921, time: 45, mime: "text/css", extension: "css", timestamp: "2026-03-01T10:23:41Z",
    title: "Stylesheet", source: "Browser", tls: true, cookies: 0, localPort: 52356, remotePort: 443, requestSize: 134, responseSize: 8921,
    requestHeaders: "GET /assets/style.css HTTP/2\nHost: cdn.example.com\nAccept: text/css",
    requestBody: "",
    responseHeaders: "HTTP/2 200 OK\nContent-Type: text/css\nCache-Control: max-age=31536000",
    responseBody: "/* Main application styles */\nbody { margin: 0; padding: 0; }\n.container { max-width: 1200px; }"
  },
  {
    id: 17, method: "POST", scheme: "https", host: "api.example.com", path: "/v2/webhooks", url: "https://api.example.com/v2/webhooks",
    status: 201, statusText: "Created", length: 345, time: 178, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:43Z",
    title: "Create Webhook", source: "Reproxy", tls: true, cookies: 2, localPort: 52357, remotePort: 443, requestSize: 289, responseSize: 345,
    requestHeaders: "POST /v2/webhooks HTTP/2\nHost: api.example.com\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOi...",
    requestBody: '{\n  "url": "https://attacker.com/callback",\n  "events": ["user.created", "user.deleted"]\n}',
    responseHeaders: "HTTP/2 201 Created\nContent-Type: application/json\nLocation: /v2/webhooks/42",
    responseBody: '{\n  "id": 42,\n  "url": "https://attacker.com/callback",\n  "events": ["user.created", "user.deleted"],\n  "created_at": "2026-03-01T10:23:43Z"\n}'
  },
  {
    id: 18, method: "GET", scheme: "https", host: "www.target-app.io", path: "/robots.txt", url: "https://www.target-app.io/robots.txt",
    status: 200, statusText: "OK", length: 124, time: 22, mime: "text/plain", extension: "txt", timestamp: "2026-03-01T10:23:44Z",
    title: "Robots.txt", source: "Browser", tls: true, cookies: 0, localPort: 52358, remotePort: 443, requestSize: 98, responseSize: 124,
    requestHeaders: "GET /robots.txt HTTP/2\nHost: www.target-app.io",
    requestBody: "",
    responseHeaders: "HTTP/2 200 OK\nContent-Type: text/plain",
    responseBody: "User-agent: *\nDisallow: /admin/\nDisallow: /api/internal/\nAllow: /\nSitemap: https://www.target-app.io/sitemap.xml"
  },
  {
    id: 19, method: "GET", scheme: "https", host: "api.example.com", path: "/v2/health", url: "https://api.example.com/v2/health",
    status: 200, statusText: "OK", length: 67, time: 8, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:45Z",
    title: "Health Check", source: "Extension", tls: true, cookies: 0, localPort: 52359, remotePort: 443, requestSize: 87, responseSize: 67,
    requestHeaders: "GET /v2/health HTTP/2\nHost: api.example.com",
    requestBody: "",
    responseHeaders: "HTTP/2 200 OK\nContent-Type: application/json",
    responseBody: '{\n  "status": "healthy",\n  "uptime": 864000\n}'
  },
  {
    id: 20, method: "POST", scheme: "https", host: "api.example.com", path: "/v2/export", url: "https://api.example.com/v2/export",
    status: 202, statusText: "Accepted", length: 189, time: 56, mime: "application/json", extension: "json", timestamp: "2026-03-01T10:23:47Z",
    title: "Export Data", source: "Browser", tls: true, cookies: 2, localPort: 52360, remotePort: 443, requestSize: 198, responseSize: 189,
    requestHeaders: "POST /v2/export HTTP/2\nHost: api.example.com\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOi...",
    requestBody: '{\n  "format": "csv",\n  "filters": {"date_range": "last_30d"}\n}',
    responseHeaders: "HTTP/2 202 Accepted\nContent-Type: application/json",
    responseBody: '{\n  "job_id": "exp_a1b2c3",\n  "status": "processing",\n  "estimated_time": 30\n}'
  },
]

// ─── Site Map ────────────────────────────────────────────────────────

export const mockSiteMap: SiteMapNode[] = [
  {
    name: "api.example.com", path: "/", requests: 12,
    children: [
      {
        name: "v2", path: "/v2", requests: 10,
        children: [
          {
            name: "users", path: "/v2/users", requests: 3, children: [
              {
                name: "1", path: "/v2/users/1", requests: 2, children: [
                  { name: "profile", path: "/v2/users/1/profile", requests: 1 },
                  { name: "tokens", path: "/v2/users/1/tokens", requests: 1 },
                ]
              },
            ]
          },
          {
            name: "auth", path: "/v2/auth", requests: 1, children: [
              { name: "login", path: "/v2/auth/login", requests: 1 },
            ]
          },
          {
            name: "admin", path: "/v2/admin", requests: 1, children: [
              { name: "config", path: "/v2/admin/config", requests: 1 },
            ]
          },
          { name: "search", path: "/v2/search", requests: 1 },
          { name: "sessions", path: "/v2/sessions", requests: 1 },
          { name: "upload", path: "/v2/upload", requests: 1 },
          { name: "settings", path: "/v2/settings", requests: 1 },
          { name: "webhooks", path: "/v2/webhooks", requests: 1 },
          { name: "health", path: "/v2/health", requests: 1 },
          { name: "export", path: "/v2/export", requests: 1 },
        ]
      },
    ]
  },
  {
    name: "www.target-app.io", path: "/", requests: 5,
    children: [
      { name: "(root)", path: "/", requests: 1 },
      {
        name: "api", path: "/api", requests: 2, children: [
          { name: "graphql", path: "/api/graphql", requests: 2 },
        ]
      },
      { name: "robots.txt", path: "/robots.txt", requests: 1 },
    ]
  },
  {
    name: "cdn.example.com", path: "/", requests: 2,
    children: [
      {
        name: "assets", path: "/assets", requests: 2, children: [
          { name: "main.js", path: "/assets/main.js", requests: 1 },
          { name: "style.css", path: "/assets/style.css", requests: 1 },
        ]
      },
    ]
  },
  {
    name: "internal.corp.local", path: "/", requests: 1,
    children: [
      { name: "status", path: "/status", requests: 1 },
    ]
  }
]

// ─── Scope Rules ─────────────────────────────────────────────────────

export const mockScopeRules: ScopeRule[] = [
  { id: 1, enabled: true, type: "include", protocol: "Any", host: "api.example.com", path: ".*" },
  { id: 2, enabled: true, type: "include", protocol: "HTTPS", host: "www.target-app.io", path: ".*" },
  { id: 3, enabled: true, type: "include", protocol: "Any", host: "internal.corp.local", path: ".*" },
  { id: 4, enabled: false, type: "exclude", protocol: "Any", host: "cdn.example.com", path: "/assets/.*" },
  { id: 5, enabled: true, type: "exclude", protocol: "Any", host: ".*\\.google\\.com", path: ".*" },
]

// ─── Match & Replace Rules ───────────────────────────────────────────

export const mockMatchRules: MatchRule[] = [
  { id: 1, enabled: true, type: "Request Header", match: "User-Agent: .*", replace: "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)", isRegex: true },
  { id: 2, enabled: false, type: "Request Header", match: "X-Forwarded-For: .*", replace: "X-Forwarded-For: 127.0.0.1", isRegex: true },
  { id: 3, enabled: true, type: "Response Header", match: "Content-Security-Policy: .*", replace: "", isRegex: true },
  { id: 4, enabled: false, type: "Request Body", match: '"role":"user"', replace: '"role":"admin"', isRegex: false },
]

// ─── Repeater Sandboxes ──────────────────────────────────────────────

export const mockSandboxes: Sandbox[] = [
  {
    id: "sb-1", name: "Auth Bypass Test", method: "POST", host: "api.example.com",
    request: "POST /v2/auth/login HTTP/2\nHost: api.example.com\nContent-Type: application/json\nUser-Agent: Reproxy/1.0\n\n{\n  \"username\": \"admin\",\n  \"password\": \"' OR 1=1 --\"\n}",
    response: "HTTP/2 200 OK\nContent-Type: application/json\nSet-Cookie: session=abc123; HttpOnly; Secure\n\n{\n  \"token\": \"eyJhbGciOiJIUzI1NiIs...\",\n  \"expires_in\": 3600,\n  \"user\": {\n    \"id\": 1,\n    \"role\": \"admin\"\n  }\n}",
    status: 200, time: 234
  },
  {
    id: "sb-2", name: "IDOR Check /users/2", method: "GET", host: "api.example.com",
    request: "GET /v2/users/2/profile HTTP/2\nHost: api.example.com\nAuthorization: Bearer eyJhbGciOi_USER1_TOKEN\nAccept: application/json",
    response: "HTTP/2 200 OK\nContent-Type: application/json\n\n{\n  \"id\": 2,\n  \"username\": \"john_doe\",\n  \"email\": \"john@example.com\",\n  \"ssn\": \"***-**-1234\"\n}",
    status: 200, time: 89
  },
  {
    id: "sb-3", name: "Webhook SSRF", method: "POST", host: "api.example.com",
    request: "POST /v2/webhooks HTTP/2\nHost: api.example.com\nContent-Type: application/json\nAuthorization: Bearer eyJhbGciOi...\n\n{\n  \"url\": \"http://169.254.169.254/latest/meta-data/\",\n  \"events\": [\"user.created\"]\n}",
    response: "HTTP/2 201 Created\nContent-Type: application/json\n\n{\n  \"id\": 43,\n  \"url\": \"http://169.254.169.254/latest/meta-data/\",\n  \"events\": [\"user.created\"]\n}",
    status: 201, time: 178
  },
  {
    id: "sb-4", name: "GraphQL Introspection", method: "POST", host: "www.target-app.io",
    request: "POST /api/graphql HTTP/2\nHost: www.target-app.io\nContent-Type: application/json\n\n{\n  \"query\": \"{__schema{queryType{name}mutationType{name}types{name kind fields{name type{name}}}}}\"\n}",
    response: "HTTP/2 200 OK\nContent-Type: application/json\n\n{\n  \"data\": {\n    \"__schema\": {\n      \"queryType\": {\"name\": \"Query\"},\n      \"mutationType\": {\"name\": \"Mutation\"},\n      \"types\": [\n        {\"name\": \"User\", \"kind\": \"OBJECT\", \"fields\": [\n          {\"name\": \"id\", \"type\": {\"name\": \"ID\"}},\n          {\"name\": \"email\", \"type\": {\"name\": \"String\"}},\n          {\"name\": \"role\", \"type\": {\"name\": \"String\"}}\n        ]}\n      ]\n    }\n  }\n}",
    status: 200, time: 201
  },
]

// ─── Extensions ──────────────────────────────────────────────────────

export const mockExtensions: Extension[] = [
  { id: "ext-1", name: "SQLi Scanner", description: "Automated SQL injection detection with payload fuzzing and error-based analysis", version: "2.4.1", author: "reproxy-team", enabled: true, installed: true, category: "Scanner" },
  { id: "ext-2", name: "CORS Checker", description: "Tests CORS misconfigurations by injecting Origin headers and analyzing responses", version: "1.1.0", author: "security-utils", enabled: true, installed: true, category: "Scanner" },
  { id: "ext-3", name: "JWT Decoder", description: "Decode, edit, and re-sign JWT tokens with custom secrets", version: "3.0.2", author: "reproxy-team", enabled: false, installed: true, category: "Utility" },
  { id: "ext-4", name: "Custom Logger", description: "Advanced logging with filtering, export to CSV/JSON, and Elasticsearch integration", version: "1.5.0", author: "community", enabled: true, installed: true, category: "Logging" },
  { id: "ext-5", name: "XSS Hunter", description: "Detect reflected and stored XSS with payload generation and callback server", version: "2.0.0", author: "xss-team", enabled: false, installed: true, category: "Scanner" },
  { id: "ext-6", name: "Param Miner", description: "Discover hidden parameters via brute-force with smart wordlists", version: "1.8.3", author: "reproxy-team", enabled: true, installed: true, category: "Discovery" },
  { id: "ext-7", name: "Auth Analyzer", description: "Compare authenticated vs unauthenticated responses to find auth bypasses", version: "1.2.0", author: "security-utils", enabled: false, installed: true, category: "Scanner" },
  { id: "ext-8", name: "Response Diff", description: "Visual diff between two HTTP responses with syntax highlighting", version: "1.0.1", author: "community", enabled: true, installed: true, category: "Utility" },
]

// ─── Traffic Stats (Dashboard Charts) ────────────────────────────────

export const mockTrafficStats: TrafficPoint[] = [
  { time: "10:20", requests: 45, "2xx": 32, "3xx": 5, "4xx": 6, "5xx": 2 },
  { time: "10:21", requests: 62, "2xx": 48, "3xx": 4, "4xx": 8, "5xx": 2 },
  { time: "10:22", requests: 38, "2xx": 28, "3xx": 3, "4xx": 5, "5xx": 2 },
  { time: "10:23", requests: 71, "2xx": 54, "3xx": 6, "4xx": 8, "5xx": 3 },
  { time: "10:24", requests: 55, "2xx": 40, "3xx": 5, "4xx": 7, "5xx": 3 },
  { time: "10:25", requests: 83, "2xx": 62, "3xx": 8, "4xx": 9, "5xx": 4 },
  { time: "10:26", requests: 47, "2xx": 34, "3xx": 4, "4xx": 6, "5xx": 3 },
  { time: "10:27", requests: 92, "2xx": 70, "3xx": 7, "4xx": 11, "5xx": 4 },
  { time: "10:28", requests: 68, "2xx": 52, "3xx": 6, "4xx": 7, "5xx": 3 },
  { time: "10:29", requests: 76, "2xx": 58, "3xx": 5, "4xx": 9, "5xx": 4 },
  { time: "10:30", requests: 59, "2xx": 44, "3xx": 4, "4xx": 8, "5xx": 3 },
  { time: "10:31", requests: 84, "2xx": 64, "3xx": 7, "4xx": 9, "5xx": 4 },
]

// ─── Helpers ────────────────────────────────────────────────────────

export function getStatusClass(status: number): string {
  if (!status) return ""
  if (status >= 200 && status < 300) return "status-2xx"
  if (status >= 300 && status < 400) return "status-3xx"
  if (status >= 400 && status < 500) return "status-4xx"
  if (status >= 500) return "status-5xx"
  return ""
}

export function getMethodClass(method: string): string {
  if (!method) return ""
  return `method-${method.toLowerCase()}`
}

export function toHex(str: string): string {
  return str.split("").map((c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join(" ")
}

export function toCurl(req: string): string {
  const lines = req.split("\n")
  const firstLine = lines[0] || ""
  const parts = firstLine.split(" ")
  const method = parts[0] || "GET"
  const path = parts[1] || "/"
  const headerLines = lines.slice(1)
  const emptyIdx = headerLines.findIndex((l) => l.trim() === "")
  const headers = emptyIdx > -1 ? headerLines.slice(0, emptyIdx) : headerLines
  const body = emptyIdx > -1 ? headerLines.slice(emptyIdx + 1).join("\n") : ""
  const hostHeader = headers.find((h) => h.toLowerCase().startsWith("host:"))
  const host = hostHeader ? hostHeader.split(":").slice(1).join(":").trim() : "localhost"
  let curl = `curl -X ${method} 'https://${host}${path}'`
  headers.filter((h) => !h.toLowerCase().startsWith("host:")).forEach((h) => {
    curl += ` \\\n  -H '${h}'`
  })
  if (body) curl += ` \\\n  -d '${body}'`
  return curl
}

export function toPosixScript(req: string): string {
  return `#!/bin/sh\n# Generated by Reproxy\nset -e\n\n${toCurl(req)}\n`
}
