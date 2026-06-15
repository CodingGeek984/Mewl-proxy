"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Download, Power, Plus, Trash2, Code2,
  Puzzle, Save, Play, Edit3, X, Check,
  Package, Zap, Shield, Eye, Bug, Globe
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Extension {
  id: string
  name: string
  description: string
  version: string
  author: string
  category: string
  enabled: boolean
  installed: boolean
  builtin: boolean
}

interface CustomScript {
  id: string
  name: string
  description: string
  code: string
  enabled: boolean
  createdAt: string
}

// ─── Built-in Extensions Registry ────────────────────────────────────────────

const BUILTIN_EXTENSIONS: Extension[] = [
  { id: "ext-sqli", name: "SQLi Scanner", description: "Automated SQL injection detection with payload fuzzing and error-based analysis", version: "2.4.1", author: "meowl-team", enabled: true, installed: true, builtin: true, category: "Scanner" },
  { id: "ext-xss", name: "XSS Hunter", description: "Cross-site scripting payload injection and DOM-based XSS detection", version: "1.7.0", author: "meowl-team", enabled: true, installed: true, builtin: true, category: "Scanner" },
  { id: "ext-jwt", name: "JWT Decoder", description: "Decode, edit, and re-sign JWT tokens with custom secrets", version: "3.0.2", author: "meowl-team", enabled: false, installed: true, builtin: true, category: "Utility" },
  { id: "ext-cors", name: "CORS Checker", description: "Test CORS misconfigurations by injecting Origin headers and analyzing responses", version: "1.2.0", author: "meowl-team", enabled: true, installed: true, builtin: true, category: "Scanner" },
  { id: "ext-param", name: "Param Miner", description: "Discover hidden parameters via brute-force with smart wordlists", version: "1.8.3", author: "meowl-team", enabled: true, installed: true, builtin: true, category: "Discovery" },
  { id: "ext-autorep", name: "Auto Repeater", description: "Automatically resend modified requests based on configurable rules", version: "2.1.0", author: "meowl-team", enabled: false, installed: true, builtin: true, category: "Automation" },
  { id: "ext-logger", name: "Request Logger", description: "Enhanced logging with filtering, export, and real-time monitoring", version: "1.5.0", author: "meowl-team", enabled: true, installed: true, builtin: true, category: "Utility" },
  { id: "ext-auth", name: "Auth Analyzer", description: "Detect authentication bypass vulnerabilities by replaying requests with modified auth tokens", version: "1.3.0", author: "meowl-team", enabled: false, installed: true, builtin: true, category: "Scanner" },
]

// ─── Persistence ─────────────────────────────────────────────────────────────

const EXTENSIONS_KEY = "meowl_extensions"
const SCRIPTS_KEY = "meowl_custom_scripts"

function loadExtensions(): Extension[] {
  try {
    const saved = localStorage.getItem(EXTENSIONS_KEY)
    if (saved) {
      const states: Record<string, boolean> = JSON.parse(saved)
      return BUILTIN_EXTENSIONS.map(ext => ({
        ...ext,
        enabled: states[ext.id] !== undefined ? states[ext.id] : ext.enabled,
      }))
    }
  } catch {}
  return [...BUILTIN_EXTENSIONS]
}

function saveExtensions(exts: Extension[]) {
  const states: Record<string, boolean> = {}
  for (const e of exts) states[e.id] = e.enabled
  localStorage.setItem(EXTENSIONS_KEY, JSON.stringify(states))
}

function loadScripts(): CustomScript[] {
  try {
    const saved = localStorage.getItem(SCRIPTS_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return []
}

function saveScripts(scripts: CustomScript[]) {
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts))
}

// ─── Category Helpers ────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, any> = {
  Scanner: Shield, Discovery: Eye, Utility: Zap,
  Automation: Play, Default: Puzzle,
}

const CATEGORY_COLORS: Record<string, string> = {
  Scanner: "text-red-400 bg-red-500/10 border-red-500/20",
  Discovery: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  Utility: "text-[var(--accent)] bg-sky-500/10 border-sky-500/20",
  Automation: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
}

// ─── Extension Card ──────────────────────────────────────────────────────────

function ExtensionCard({ ext, onToggle }: { ext: Extension; onToggle: () => void }) {
  const CatIcon = CATEGORY_ICONS[ext.category] || CATEGORY_ICONS.Default
  const catColor = CATEGORY_COLORS[ext.category] || "text-muted-foreground bg-muted/10 border-border/20"

  return (
    <div className={`rounded-lg border overflow-hidden transition-all group ${ext.enabled ? "border-border/30 bg-muted/5" : "border-border/10 bg-muted/3 opacity-60"}`}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`size-7 rounded-md ${catColor} flex items-center justify-center shrink-0 border`}>
              <CatIcon className="size-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-foreground/90 truncate">{ext.name}</div>
              <div className="text-[9px] text-muted-foreground/40 font-mono">{ext.author} · v{ext.version}</div>
            </div>
          </div>
          <Switch checked={ext.enabled} onCheckedChange={onToggle} className="scale-[0.65] shrink-0" />
        </div>
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed line-clamp-2">{ext.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant="outline" className={`text-[8px] font-mono px-1.5 py-0 ${catColor}`}>
            {ext.category}
          </Badge>
          {ext.enabled && (
            <span className="text-[8px] text-emerald-400/60 font-mono uppercase flex items-center gap-1">
              <Power className="size-2" /> Active
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Script Editor ───────────────────────────────────────────────────────────

function ScriptEditor({ script, onSave, onCancel }: {
  script: CustomScript | null
  onSave: (script: CustomScript) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(script?.name || "")
  const [description, setDescription] = useState(script?.description || "")
  const [code, setCode] = useState(script?.code || `// Meowl Extension Script
// Available hooks:
//   onRequest(req)  - called before each request
//   onResponse(res) - called after each response
//
// Example:
function onRequest(req) {
  // Add a custom header to all requests
  req.headers["X-Custom-Header"] = "meowl";
  return req;
}

function onResponse(res) {
  // Log responses with specific status codes
  if (res.statusCode >= 400) {
    console.log("[Extension] Error:", res.statusCode, res.url);
  }
  return res;
}`)

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: script?.id || crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      code,
      enabled: script?.enabled ?? true,
      createdAt: script?.createdAt || new Date().toISOString(),
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="h-9 flex items-center px-3 border-b border-border/20 bg-muted/5 shrink-0 gap-2">
        <Code2 className="size-3 text-purple-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70">
          {script ? "Edit Script" : "New Script"}
        </span>
        <div className="flex-1" />
        <Button size="sm" variant="ghost" className="h-6 px-2 text-[9px] uppercase text-muted-foreground/50 hover:text-foreground gap-1" onClick={onCancel}>
          <X className="size-2.5" /> Cancel
        </Button>
        <Button size="sm" variant="outline" className="h-6 px-3 text-[9px] uppercase font-bold tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1" onClick={handleSave}>
          <Save className="size-2.5" /> Save
        </Button>
      </div>
      <div className="p-3 border-b border-border/20 space-y-2 shrink-0">
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Script name"
          className="h-7 text-[11px] bg-muted/10 border-border/20"
        />
        <Input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description (optional)"
          className="h-7 text-[11px] bg-muted/10 border-border/20"
        />
      </div>
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        className="flex-1 p-3 text-[11px] font-mono bg-[#0a0a0a] text-foreground/80 resize-none outline-none leading-relaxed custom-scrollbar"
        spellCheck={false}
      />
    </div>
  )
}

// ─── Extensions Module ───────────────────────────────────────────────────────

export function ExtensionsModule() {
  const [extensions, setExtensions] = useState<Extension[]>(loadExtensions)
  const [scripts, setScripts] = useState<CustomScript[]>(loadScripts)
  const [searchInstalled, setSearchInstalled] = useState("")
  const [searchScripts, setSearchScripts] = useState("")
  const [editingScript, setEditingScript] = useState<CustomScript | null | "new">(null)

  // Persist on change
  useEffect(() => { saveExtensions(extensions) }, [extensions])
  useEffect(() => { saveScripts(scripts) }, [scripts])

  const toggleExtension = useCallback((id: string) => {
    setExtensions(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e))
  }, [])

  const toggleScript = useCallback((id: string) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }, [])

  const deleteScript = useCallback((id: string) => {
    setScripts(prev => prev.filter(s => s.id !== id))
  }, [])

  const saveScript = useCallback((script: CustomScript) => {
    setScripts(prev => {
      const idx = prev.findIndex(s => s.id === script.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = script
        return next
      }
      return [...prev, script]
    })
    setEditingScript(null)
  }, [])

  const filteredExtensions = extensions.filter(e =>
    e.name.toLowerCase().includes(searchInstalled.toLowerCase()) ||
    e.category.toLowerCase().includes(searchInstalled.toLowerCase())
  )

  const filteredScripts = scripts.filter(s =>
    s.name.toLowerCase().includes(searchScripts.toLowerCase())
  )

  const enabledCount = extensions.filter(e => e.enabled).length + scripts.filter(s => s.enabled).length

  // If editing a script, show the editor full-screen
  if (editingScript) {
    return (
      <ScriptEditor
        script={editingScript === "new" ? null : editingScript}
        onSave={saveScript}
        onCancel={() => setEditingScript(null)}
      />
    )
  }

  return (
    <Tabs defaultValue="installed" className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-3 shrink-0 bg-background/80 backdrop-blur-md z-30">
        <TabsList className="h-9 bg-muted/5 gap-1 p-1 border-b-0 rounded-lg">
          <TabsTrigger
            value="installed"
            className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-sky-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200 gap-1.5"
          >
            <Puzzle className="size-3" />
            Extensions ({extensions.length})
          </TabsTrigger>
          <TabsTrigger
            value="scripts"
            className="h-7 text-[10px] font-bold uppercase tracking-widest px-4 data-[state=active]:bg-sky-500 data-[state=active]:text-white text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-md transition-all duration-200 gap-1.5"
          >
            <Code2 className="size-3" />
            Scripts ({scripts.length})
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Extensions Tab */}
      <TabsContent value="installed" className="flex-1 m-0 overflow-hidden outline-none data-[state=active]:flex data-[state=active]:flex-col">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-border/20 px-3 py-2 shrink-0 bg-muted/5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/30" />
              <Input
                placeholder="Search extensions..."
                value={searchInstalled}
                onChange={e => setSearchInstalled(e.target.value)}
                className="h-7 pl-8 text-[10px] bg-muted/10 border-border/20"
              />
            </div>
            <Badge variant="outline" className="text-[8px] font-mono px-1.5 py-0 border-border/30 text-muted-foreground/50">
              {enabledCount} active
            </Badge>
          </div>
          <ScrollArea className="flex-1">
            <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredExtensions.map(ext => (
                <ExtensionCard
                  key={ext.id}
                  ext={ext}
                  onToggle={() => toggleExtension(ext.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </TabsContent>

      {/* Scripts Tab */}
      <TabsContent value="scripts" className="flex-1 m-0 overflow-hidden outline-none data-[state=active]:flex data-[state=active]:flex-col">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 border-b border-border/20 px-3 py-2 shrink-0 bg-muted/5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground/30" />
              <Input
                placeholder="Search scripts..."
                value={searchScripts}
                onChange={e => setSearchScripts(e.target.value)}
                className="h-7 pl-8 text-[10px] bg-muted/10 border-border/20"
              />
            </div>
            <Button
              size="sm" variant="outline"
              className="h-7 px-3 text-[10px] uppercase font-bold tracking-widest border-purple-500/30 text-purple-400 hover:bg-purple-500/10 gap-1.5"
              onClick={() => setEditingScript("new")}
            >
              <Plus className="size-3" /> New Script
            </Button>
          </div>

          <ScrollArea className="flex-1">
            {filteredScripts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground/20">
                <Code2 className="size-10 mb-3" />
                <span className="text-[11px] font-mono uppercase tracking-wider">No custom scripts yet</span>
                <span className="text-[9px] text-muted-foreground/15 mt-1">Click "New Script" to create one</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-3">
                {filteredScripts.map(script => (
                  <div
                    key={script.id}
                    className={`rounded-lg border overflow-hidden transition-all ${script.enabled ? "border-border/30 bg-muted/5" : "border-border/10 bg-muted/3 opacity-60"}`}
                  >
                    <div className="p-3 flex items-start gap-3">
                      <div className="size-8 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Code2 className="size-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-foreground/90">{script.name}</span>
                          {script.enabled && (
                            <span className="text-[8px] text-emerald-400/60 font-mono uppercase">Active</span>
                          )}
                        </div>
                        {script.description && (
                          <p className="text-[9px] text-muted-foreground/50 mt-0.5 line-clamp-1">{script.description}</p>
                        )}
                        <div className="text-[8px] text-muted-foreground/30 font-mono mt-1">
                          Created: {new Date(script.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch checked={script.enabled} onCheckedChange={() => toggleScript(script.id)} className="scale-[0.6]" />
                        <Button size="sm" variant="ghost" className="size-6 p-0 text-muted-foreground/30 hover:text-[var(--accent)]" onClick={() => setEditingScript(script)}>
                          <Edit3 className="size-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="size-6 p-0 text-muted-foreground/30 hover:text-red-400" onClick={() => deleteScript(script.id)}>
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
  )
}
