export type FuzzState = "idle" | "running" | "paused" | "done"
export type AttackType = "sniper" | "battering ram" | "pitchfork" | "cluster bomb"
export type ProcessingStepType = "uppercase" | "lowercase" | "reverse" | "base64_encode" | "base64_decode" | "url_encode" | "url_encode_all" | "hex_encode" | "prefix" | "suffix" | "match_replace" | "hash_md5" | "hash_sha1" | "hash_sha256"

export interface FuzzResult {
  id: string; payload: string; statusCode: number; length: number
  words: number; lines: number; latency: number; contentType: string
  error?: string; reflection: boolean
}

export interface FuzzFilter {
  matchCodes: string; filterCodes: string; matchSize: string; filterSize: string
  matchWords: string; filterWords: string; matchLines: string; filterLines: string
}

export interface ProcessingStep {
  id: string; type: ProcessingStepType; enabled: boolean
  value: string; pattern: string; replacement: string
}

export interface AttackOptions {
  threads: number; timeout: number; delay: number; maxRetries: number
  followRedirects: boolean; maxRedirects: number; updateContentLength: boolean
  keepAlive: boolean; cookieHandling: boolean
}

export interface PayloadSet {
  config: import("./payload-generators").PayloadConfig
  processingSteps: ProcessingStep[]
}

export interface AttackSandbox {
  id: string; name: string; state: FuzzState
  targetUrl: string; rawRequest: string
  attackType: AttackType; fuzzKeyword: string
  results: FuzzResult[]; progress: { done: number; total: number }
  elapsed: number; startTime: number
  selectedResultId: string | null
  inspectorReq: string; inspectorRes: string
  inspectorTab: "request" | "response"
  searchQuery: string; sortCol: string | null; sortDir: "asc" | "desc"
  filter: FuzzFilter; showFilters: boolean
  payloadSets: PayloadSet[]; options: AttackOptions
  errorCount: number
}

export const DEFAULT_FILTER: FuzzFilter = {
  matchCodes: "", filterCodes: "", matchSize: "", filterSize: "",
  matchWords: "", filterWords: "", matchLines: "", filterLines: "",
}

export const DEFAULT_OPTIONS: AttackOptions = {
  threads: 20, timeout: 10, delay: 0, maxRetries: 3,
  followRedirects: false, maxRedirects: 5, updateContentLength: true,
  keepAlive: true, cookieHandling: false,
}

export const DEFAULT_REQUEST = `GET /FUZZ HTTP/1.1\nHost: example.com\nUser-Agent: Meowl/1.0\nAccept: */*\nConnection: close`

export function statusColor(code: number): string {
  if (code >= 200 && code < 300) return "text-emerald-400"
  if (code >= 300 && code < 400) return "text-blue-400"
  if (code >= 400 && code < 500) return "text-amber-400"
  if (code >= 500) return "text-red-400"
  return "text-[var(--foreground-muted)]"
}

export function matchesFilter(r: FuzzResult, f: FuzzFilter): boolean {
  if (f.matchCodes.trim()) {
    const codes = f.matchCodes.split(",").map(s => parseInt(s.trim())).filter(Boolean)
    if (codes.length > 0 && !codes.includes(r.statusCode)) return false
  }
  if (f.filterCodes.trim()) {
    const codes = f.filterCodes.split(",").map(s => parseInt(s.trim())).filter(Boolean)
    if (codes.includes(r.statusCode)) return false
  }
  if (f.matchSize.trim() && r.length !== parseInt(f.matchSize)) return false
  if (f.filterSize.trim() && r.length === parseInt(f.filterSize)) return false
  if (f.matchWords.trim() && r.words !== parseInt(f.matchWords)) return false
  if (f.filterWords.trim() && r.words === parseInt(f.filterWords)) return false
  if (f.matchLines.trim() && r.lines !== parseInt(f.matchLines)) return false
  if (f.filterLines.trim() && r.lines === parseInt(f.filterLines)) return false
  return true
}

export function applyStep(input: string, step: ProcessingStep): string {
  if (!step.enabled) return input
  switch (step.type) {
    case "uppercase": return input.toUpperCase()
    case "lowercase": return input.toLowerCase()
    case "reverse": return input.split("").reverse().join("")
    case "base64_encode": try { return btoa(unescape(encodeURIComponent(input))) } catch { return input }
    case "base64_decode": try { return decodeURIComponent(escape(atob(input))) } catch { return input }
    case "url_encode": return encodeURIComponent(input)
    case "url_encode_all": return [...input].map(c => "%" + c.charCodeAt(0).toString(16).padStart(2, "0").toUpperCase()).join("")
    case "hex_encode": return [...input].map(c => c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    case "prefix": return step.value + input
    case "suffix": return input + step.value
    case "match_replace": try { return input.replace(new RegExp(step.pattern, "g"), step.replacement) } catch { return input }
    case "hash_md5": return `[MD5:${input}]`
    case "hash_sha1": return `[SHA1:${input}]`
    case "hash_sha256": return `[SHA256:${input}]`
    default: return input
  }
}

export function applyAllSteps(input: string, steps: ProcessingStep[]): string {
  return steps.reduce((acc, step) => applyStep(acc, step), input)
}

export function createDefaultSandbox(name?: string): AttackSandbox {
  return {
    id: `atk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: name || "New Attack",
    state: "idle", targetUrl: "https://example.com",
    rawRequest: DEFAULT_REQUEST, attackType: "sniper", fuzzKeyword: "FUZZ",
    results: [], progress: { done: 0, total: 0 },
    elapsed: 0, startTime: 0,
    selectedResultId: null, inspectorReq: "", inspectorRes: "",
    inspectorTab: "response", searchQuery: "",
    sortCol: null, sortDir: "asc",
    filter: { ...DEFAULT_FILTER }, showFilters: false,
    payloadSets: [{ config: { type: "Simple list", simpleText: "", numFrom: 1, numTo: 100, numStep: 1, numBase: 10, numMinInt: 0, numMaxInt: 0, bruteMin: 1, bruteMax: 3, bruteCharset: "abcdefghijklmnopqrstuvwxyz0123456789", nullCount: 100 }, processingSteps: [] }],
    options: { ...DEFAULT_OPTIONS }, errorCount: 0,
  }
}

export const STEP_LABELS: Record<ProcessingStepType, string> = {
  uppercase: "Upper Case", lowercase: "Lower Case", reverse: "Reverse",
  base64_encode: "Base64 Encode", base64_decode: "Base64 Decode",
  url_encode: "URL Encode", url_encode_all: "URL Encode All",
  hex_encode: "Hex Encode", prefix: "Add Prefix", suffix: "Add Suffix",
  match_replace: "Match & Replace", hash_md5: "Hash MD5",
  hash_sha1: "Hash SHA-1", hash_sha256: "Hash SHA-256",
}
