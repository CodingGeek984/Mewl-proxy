import { useState, useEffect, useMemo, useRef } from "react"
import { Plus, Trash2, Save, ChevronDown, ChevronRight, X, History, HandMetal, Settings2, ShieldCheck, Zap, Code2, Palette, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

type RuleCategory = "proxy" | "history" | "intercept"
type RuleType = "match" | "replace" | "drop" | "delay" | "conditional" | "visibility" | "highlight"
type RuleScope = "all" | "request_header" | "request_body" | "response_header" | "response_body" | "url"

interface Rule {
  id: string
  category: RuleCategory
  name: string
  enabled: boolean
  type: RuleType
  scope: RuleScope
  pattern: string
  replacement: string
  cel_expression?: string
  color?: string
  delay_ms?: number
  visible?: boolean
}

const CATEGORY_DEFAULTS: Record<RuleCategory, Partial<Rule>> = {
  proxy: { type: "replace", scope: "request_body" },
  history: { type: "highlight", scope: "url", color: "#5E6AD2" },
  intercept: { type: "conditional", scope: "all" }
}

function AddRuleForm({ category, onCancel, onAdd }: { category: RuleCategory, onCancel: () => void, onAdd: (rule: Partial<Rule>) => void }) {
  const [formData, setFormData] = useState<Partial<Rule>>({
    name: "",
    enabled: true,
    category,
    pattern: "",
    replacement: "",
    cel_expression: "",
    delay_ms: 200,
    visible: true,
    color: "#5E6AD2",
    ...CATEGORY_DEFAULTS[category]
  })

  return (
    <div className="border border-white/[0.06] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0a0a0c] to-[#050506] shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(94,106,210,0.1)] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white/[0.02] px-5 py-4 flex items-center justify-between border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          {category === "proxy" && <ShieldCheck className="size-4 text-[#EDEDEF]" />}
          {category === "history" && <History className="size-4 text-[#EDEDEF]" />}
          {category === "intercept" && <HandMetal className="size-4 text-[#EDEDEF]" />}
          <h3 className="text-xs font-semibold tracking-wide text-[#EDEDEF]">New {category} Logic Block</h3>
        </div>
        <button onClick={onCancel} className="text-[#8A8F98] hover:text-[#EDEDEF] transition-colors bg-white/[0.05] p-1.5 rounded-md hover:bg-white/[0.1]">
          <X className="size-3.5" />
        </button>
      </div>
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">RULE NAME</Label>
            <Input
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Header Strip"
              className="h-10 text-sm bg-[#0F0F12] border-white/10 focus-within:border-[#5E6AD2] ring-offset-[#050506] focus-visible:ring-[#5E6AD2]/50 text-[#EDEDEF] rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">RULE TYPE</Label>
              <Select value={formData.type} onValueChange={v => setFormData({ ...formData, type: v as RuleType })}>
                <SelectTrigger className="h-10 text-sm bg-[#0F0F12] border-white/10 text-[#EDEDEF] rounded-lg focus-visible:ring-[#5E6AD2]/50 focus-visible:border-[#5E6AD2] ring-offset-[#050506]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0c] border-white/10 text-[#EDEDEF]">
                  {category !== "history" && (
                    <>
                      <SelectItem value="match">Match (Filter)</SelectItem>
                      <SelectItem value="replace">Match & Replace</SelectItem>
                      <SelectItem value="drop">Drop (Block)</SelectItem>
                      <SelectItem value="delay">Delay (Throttle)</SelectItem>
                    </>
                  )}
                  {category === "intercept" && <SelectItem value="conditional">Conditional Breakpoint</SelectItem>}
                  {category === "history" && (
                    <>
                      <SelectItem value="visibility">Visibility (Hide/Show)</SelectItem>
                      <SelectItem value="highlight">Highlighting (Color)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">SCOPE</Label>
              <Select value={formData.scope} onValueChange={v => setFormData({ ...formData, scope: v as RuleScope })}>
                <SelectTrigger className="h-10 text-sm bg-[#0F0F12] border-white/10 text-[#EDEDEF] rounded-lg focus-visible:ring-[#5E6AD2]/50 focus-visible:border-[#5E6AD2] ring-offset-[#050506]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0c] border-white/10 text-[#EDEDEF]">
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="request_header">Request Headers</SelectItem>
                  <SelectItem value="request_body">Request Body</SelectItem>
                  <SelectItem value="response_header">Response Headers</SelectItem>
                  <SelectItem value="response_body">Response Body</SelectItem>
                  <SelectItem value="all">Entire Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="literal" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">MATCHING LOGIC</Label>
              <TabsList className="h-8 bg-black/40 p-1 gap-1 rounded-lg border border-white/[0.02]">
                <TabsTrigger value="literal" className="h-6 text-xs px-3 font-medium data-[state=active]:bg-white/10 data-[state=active]:text-[#EDEDEF] text-[#8A8F98] rounded-md transition-all">Literal / Regex</TabsTrigger>
                <TabsTrigger value="cel" className="h-6 text-xs px-3 font-medium data-[state=active]:bg-white/10 data-[state=active]:text-[#EDEDEF] text-[#8A8F98] rounded-md transition-all">CEL Expression</TabsTrigger>
              </TabsList>
            </div>
            <div className="animate-in fade-in slide-in-from-top-1 duration-300">
              <TabsContent value="literal" className="m-0 space-y-4">
                <div className="space-y-1.5">
                  <Input
                    value={formData.pattern}
                    onChange={e => setFormData({ ...formData, pattern: e.target.value })}
                    placeholder="String to find or /regex/..."
                    className="h-10 text-sm font-mono bg-[#0F0F12] border-white/10 focus-within:border-[#5E6AD2] ring-offset-[#050506] focus-visible:ring-[#5E6AD2]/50 text-[#EDEDEF] rounded-lg"
                  />
                  <p className="text-xs text-[#8A8F98] pl-1">Uses standard string matching or regular expressions if wrapped in //</p>
                </div>
              </TabsContent>
              <TabsContent value="cel" className="m-0 space-y-4">
                <div className="space-y-1.5">
                  <div className="relative">
                    <Code2 className="absolute left-3 top-3 size-4 text-[#8A8F98]" />
                    <Textarea
                      value={formData.cel_expression}
                      onChange={e => setFormData({ ...formData, cel_expression: e.target.value })}
                      placeholder='request.method == "POST"'
                      className="h-24 pl-9 pt-2.5 text-sm font-mono bg-[#0F0F12] border-white/10 focus-within:border-[#5E6AD2] ring-offset-[#050506] focus-visible:ring-[#5E6AD2]/50 text-[#EDEDEF] rounded-lg resize-none"
                    />
                  </div>
                  <p className="text-xs text-[#8A8F98] pl-1">Common Expression Language for complex conditional logic</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <div className="h-px bg-white/[0.06] -mx-6" />

          {/* Type-specific inputs */}
          {formData.type === "replace" && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-300">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">REPLACEMENT STRING</Label>
              <Textarea
                value={formData.replacement}
                onChange={e => setFormData({ ...formData, replacement: e.target.value })}
                placeholder="String to replace with..."
                className="h-20 text-sm font-mono bg-[#0F0F12] border-white/10 focus-within:border-[#5E6AD2] ring-offset-[#050506] focus-visible:ring-[#5E6AD2]/50 text-[#EDEDEF] rounded-lg resize-none"
              />
            </div>
          )}

          {formData.type === "delay" && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-300">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">PROCESSING DELAY (MS)</Label>
              <div className="flex items-center gap-4">
                <Clock className="size-4 text-[#EDEDEF]" />
                <Input
                  type="number"
                  value={formData.delay_ms}
                  onChange={e => setFormData({ ...formData, delay_ms: parseInt(e.target.value) || 0 })}
                  className="h-10 text-sm bg-[#0F0F12] border-white/10 w-32 font-mono text-[#EDEDEF] rounded-lg focus-visible:border-[#5E6AD2]"
                />
              </div>
            </div>
          )}

          {formData.type === "highlight" && (
            <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-300">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">HIGHLIGHT PALETTE</Label>
              <div className="flex items-center gap-3">
                <Palette className="size-4 text-[#8A8F98]" />
                <div className="flex gap-2.5">
                  {["#5E6AD2", "#E879F9", "#38BDF8", "#34D399", "#FBBF24", "#F87171"].map(c => (
                    <button
                      key={c}
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`size-6 rounded-full border-2 transition-all duration-200 hover:scale-110 ${formData.color === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-80 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <div className="relative">
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60">
                      <Plus className="size-3 text-white" />
                    </div>
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="size-6 p-0 border-0 bg-transparent cursor-pointer opacity-0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formData.type === "visibility" && (
            <div className="flex items-center gap-3 animate-in slide-in-from-top-1 duration-300 bg-white/[0.02] p-3 rounded-lg border border-white/[0.04]">
              <Checkbox
                id="visibility"
                checked={formData.visible}
                onCheckedChange={v => setFormData({ ...formData, visible: !!v })}
                className="size-4 border-white/20 data-[state=checked]:bg-[#5E6AD2] data-[state=checked]:border-[#5E6AD2]"
              />
              <div className="flex flex-col">
                <Label htmlFor="visibility" className="text-sm font-medium text-[#EDEDEF] cursor-pointer">
                  Visibility Toggle
                </Label>
                <span className="text-xs text-[#8A8F98]">Rule will {formData.visible ? "SHOW" : "HIDE"} qualifying traffic items</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button onClick={onCancel} variant="ghost" className="h-9 px-4 text-sm font-medium text-[#EDEDEF] hover:bg-white/[0.05] rounded-lg">
            Cancel
          </Button>
          <Button
            onClick={() => onAdd(formData)}
            className="h-9 px-6 text-sm bg-[#5E6AD2] text-white font-medium rounded-lg hover:bg-[#6872D9] active:scale-[0.98] transition-all duration-200 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
          >
            Deploy Logic
          </Button>
        </div>
      </div>
    </div>
  )
}

function RuleItem({ rule, onUpdate, onDelete }: { rule: Rule, onUpdate: (r: Partial<Rule>) => void, onDelete: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    cardRef.current.style.setProperty('--x', `${e.clientX - rect.left}px`)
    cardRef.current.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-[2px] ${isExpanded ? 'bg-[#0a0a0c]' : 'bg-gradient-to-b from-white/[0.05] to-white/[0.01]'} border border-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_2px_10px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_8px_30px_rgba(0,0,0,0.4),0_0_60px_rgba(94,106,210,0.1)]`}
    >
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(400px circle at var(--x) var(--y), rgba(94,106,210,0.12), transparent 80%)' }} />
      
      <div
        className="relative flex items-center gap-4 p-4 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-[#8A8F98] group-hover:text-[#EDEDEF] transition-colors bg-white/[0.02] p-1.5 rounded-md">
          {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </div>
        
        <Checkbox
          checked={rule.enabled}
          onCheckedChange={v => onUpdate({ enabled: !!v })}
          onClick={e => e.stopPropagation()}
          className="relative z-10 border-white/20 data-[state=checked]:bg-[#5E6AD2] data-[state=checked]:border-[#5E6AD2] transition-colors"
        />
        
        <div className="flex flex-col flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <span className={`text-base font-semibold tracking-tight truncate ${rule.enabled ? 'text-[#EDEDEF]' : 'text-[#8A8F98] line-through opacity-60'}`}>
              {rule.name || "Untitled Logic Module"}
            </span>
            {rule.cel_expression && <Code2 className="size-3.5 text-[#5E6AD2]" />}
          </div>
          <span className="text-xs text-[#8A8F98] font-mono truncate mt-0.5">
            {rule.cel_expression ? rule.cel_expression : (rule.pattern || "*")}
          </span>
        </div>
        
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <span className="text-[10px] font-mono tracking-widest text-[#8A8F98] uppercase hidden sm:block bg-white/[0.03] px-2 py-1 rounded-md">
            {rule.scope.replace("_", " ")}
          </span>
          <span className="px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase border border-white/10 bg-white/[0.02] text-[#EDEDEF]">
            {rule.type}
          </span>
          {rule.type === "highlight" && (
            <div className="size-3.5 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]" style={{ backgroundColor: rule.color }} />
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-[#8A8F98] hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
            onClick={e => { e.stopPropagation(); onDelete() }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="relative border-t border-white/[0.04] p-6 bg-black/20 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">RULE NAME</Label>
              <Input value={rule.name} onChange={e => onUpdate({ name: e.target.value })} className="h-10 text-sm bg-[#0F0F12]/80 border-white/10 text-[#EDEDEF] focus-within:border-[#5E6AD2] rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">SCOPE</Label>
              <Select value={rule.scope} onValueChange={v => onUpdate({ scope: v as RuleScope })}>
                <SelectTrigger className="h-10 text-sm bg-[#0F0F12]/80 border-white/10 text-[#EDEDEF] rounded-lg focus-visible:ring-[#5E6AD2]/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0c] border-white/10 text-[#EDEDEF]">
                  <SelectItem value="url">URL</SelectItem>
                  <SelectItem value="request_header">Request Headers</SelectItem>
                  <SelectItem value="request_body">Request Body</SelectItem>
                  <SelectItem value="response_header">Response Headers</SelectItem>
                  <SelectItem value="response_body">Response Body</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">MATCHING LOGIC</Label>
              <div className="flex gap-1.5 bg-black/40 p-1 rounded-md border border-white/[0.02]">
                <button
                  className={`px-3 py-1 text-[10px] uppercase font-semibold tracking-wider rounded transition-all ${!rule.cel_expression ? 'bg-white/10 text-[#EDEDEF]' : 'text-[#8A8F98] hover:text-[#EDEDEF]'}`}
                  onClick={() => onUpdate({ cel_expression: undefined })}
                >
                  Pattern
                </button>
                <button
                  className={`px-3 py-1 text-[10px] uppercase font-semibold tracking-wider rounded transition-all ${rule.cel_expression ? 'bg-white/10 text-[#EDEDEF]' : 'text-[#8A8F98] hover:text-[#EDEDEF]'}`}
                  onClick={() => onUpdate({ cel_expression: rule.cel_expression || "" })}
                >
                  CEL
                </button>
              </div>
            </div>

            {rule.cel_expression !== undefined ? (
              <Textarea
                value={rule.cel_expression}
                onChange={e => onUpdate({ cel_expression: e.target.value })}
                className="h-20 text-sm font-mono bg-[#0F0F12]/80 border-white/10 text-[#EDEDEF] focus-within:border-[#5E6AD2] rounded-lg resize-none"
              />
            ) : (
              <Input value={rule.pattern} onChange={e => onUpdate({ pattern: e.target.value })} className="h-10 text-sm font-mono bg-[#0F0F12]/80 border-white/10 text-[#EDEDEF] focus-within:border-[#5E6AD2] rounded-lg" />
            )}
          </div>

          {rule.type === "replace" && (
            <div className="space-y-1.5 relative z-10">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">REPLACEMENT</Label>
              <Textarea value={rule.replacement} onChange={e => onUpdate({ replacement: e.target.value })} className="h-24 text-sm font-mono bg-[#0F0F12]/80 border-white/10 text-[#EDEDEF] focus-within:border-[#5E6AD2] rounded-lg resize-none" />
            </div>
          )}

          {rule.type === "delay" && (
            <div className="space-y-1.5 relative z-10">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">DELAY (MS)</Label>
              <Input type="number" value={rule.delay_ms} onChange={e => onUpdate({ delay_ms: parseInt(e.target.value) || 0 })} className="h-10 text-sm bg-[#0F0F12]/80 border-white/10 text-[#EDEDEF] focus-within:border-[#5E6AD2] rounded-lg w-32 font-mono" />
            </div>
          )}

          {rule.type === "highlight" && (
            <div className="space-y-1.5 relative z-10">
              <Label className="text-xs font-mono tracking-widest text-[#8A8F98]">HIGHLIGHT COLOR</Label>
              <div className="flex items-center gap-3">
                <Input type="color" value={rule.color} onChange={e => onUpdate({ color: e.target.value })} className="size-8 p-0 border-0 bg-transparent cursor-pointer" />
                <span className="text-sm font-mono text-[#EDEDEF]">{rule.color}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


export function RulesModule() {
  const [rules, setRules] = useState<Rule[]>([])
  const [activeTab, setActiveTab] = useState<RuleCategory>("proxy")
  const [hasChanges, setHasChanges] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)

  const wails = (window as any).go?.backend?.App

  useEffect(() => {
    if (wails) {
      wails.GetRules()
        .then((data: Rule[]) => {
          if (Array.isArray(data)) setRules(data)
        })
        .catch((err: any) => console.error("Failed to load rules:", err))
    }
  }, [wails])

  const saveRules = async (updatedRules?: Rule[]) => {
    if (!wails) return
    try {
      const toSend = updatedRules || rules
      const res = await wails.SaveRules(toSend)
      if (res === "Success") {
        setHasChanges(false)
        if (updatedRules) setRules(updatedRules)
      } else {
        console.error("Failed to save rules:", res)
      }
    } catch (err) {
      console.error("Failed to save rules:", err)
    }
  }

  const handleAddRule = (partial: Partial<Rule>) => {
    const rule: Rule = {
      id: `rule_${Date.now()}`,
      name: partial.name || "New Protocol Instruction",
      enabled: true,
      category: partial.category || activeTab,
      type: partial.type || "replace",
      scope: partial.scope || "request_body",
      pattern: partial.pattern || "",
      replacement: partial.replacement || "",
      cel_expression: partial.cel_expression,
      color: partial.color,
      delay_ms: partial.delay_ms,
      visible: partial.visible
    }
    const next = [...rules, rule]
    setRules(next)
    setHasChanges(true)
    setShowAddForm(false)
    saveRules(next)
  }

  const handleDelete = (id: string) => {
    const next = rules.filter(r => r.id !== id)
    setRules(next)
    setHasChanges(true)
    saveRules(next)
  }

  const handleUpdate = (id: string, updates: Partial<Rule>) => {
    const next = rules.map(r => r.id === id ? { ...r, ...updates } : r)
    setRules(next)
    setHasChanges(true)
  }

  const filteredRules = useMemo(() => rules.filter(r => r.category === activeTab), [rules, activeTab])

  return (
    <div className="flex h-full flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,#0a0a0f_0%,#050506_50%,#020203_100%)] text-[#EDEDEF] font-sans">
      {/* Layered Background Effects */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[900px] h-[1400px] bg-[#5E6AD2]/10 rounded-full blur-[150px] animate-[float_10s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[800px] bg-indigo-500/[0.08] rounded-full blur-[120px] animate-[float_12s_ease-in-out_infinite_reverse]" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.015] mix-blend-overlay" />
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(2deg); }
        }
      `}</style>

      {/* Header Area */}
      <div className="relative z-10 border-b border-white/[0.04] bg-white/[0.01] backdrop-blur-md px-8 h-16 flex items-center justify-between shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center p-1.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
              <Zap className="w-full h-full text-[#5E6AD2]" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold tracking-tight leading-none bg-gradient-to-b from-white via-white/90 to-white/60 bg-clip-text text-transparent">Logic Engine</h2>
              <span className="text-[10px] text-[#8A8F98] mt-1 font-mono tracking-widest uppercase">Active Orchestrator</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as RuleCategory)} className="w-auto ml-2">
            <TabsList className="bg-white/[0.02] border border-white/[0.04] h-10 p-1 gap-1 rounded-lg">
              <TabsTrigger value="proxy" className="px-5 text-xs font-medium tracking-wide data-[state=active]:bg-white/[0.06] data-[state=active]:text-[#EDEDEF] text-[#8A8F98] rounded-md transition-all duration-300">
                <ShieldCheck className="size-3.5 mr-2" /> Proxy
              </TabsTrigger>
              <TabsTrigger value="history" className="px-5 text-xs font-medium tracking-wide data-[state=active]:bg-white/[0.06] data-[state=active]:text-[#EDEDEF] text-[#8A8F98] rounded-md transition-all duration-300">
                <History className="size-3.5 mr-2" /> History
              </TabsTrigger>
              <TabsTrigger value="intercept" className="px-5 text-xs font-medium tracking-wide data-[state=active]:bg-white/[0.06] data-[state=active]:text-[#EDEDEF] text-[#8A8F98] rounded-md transition-all duration-300">
                <HandMetal className="size-3.5 mr-2" /> Intercept
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => saveRules()}
                    size="sm"
                    className="h-9 px-5 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all duration-200"
                  >
                    <Save className="size-3.5 mr-2" /> Commit Changes
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-[#050506] border-white/10 text-[#EDEDEF]">
                  Apply pending changes to core engine
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="h-9 px-5 text-xs bg-[#5E6AD2] text-white font-medium rounded-lg hover:bg-[#6872D9] active:scale-[0.98] transition-all duration-200 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] gap-2"
          >
            <Plus className="size-3.5" />
            New Logic Entry
          </Button>
        </div>
      </div>

      <div className="relative z-10 flex-1 overflow-auto p-8 lg:p-12 space-y-6 scrollbar-thin">
        {showAddForm && (
          <div className="max-w-3xl mx-auto w-full mb-10">
            <AddRuleForm
              category={activeTab}
              onCancel={() => setShowAddForm(false)}
              onAdd={handleAddRule}
            />
          </div>
        )}

        <div className="max-w-4xl mx-auto w-full space-y-4 pb-20">
          {filteredRules.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-gradient-to-b from-white/[0.02] to-transparent rounded-3xl border border-white/[0.04]">
              <div className="size-16 rounded-2xl bg-white/[0.02] border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center justify-center mb-6">
                <Settings2 className="size-8 text-[#8A8F98]" />
              </div>
              <h3 className="text-xl font-semibold bg-gradient-to-b from-white via-white/80 to-white/50 bg-clip-text text-transparent tracking-tight">No Active Triggers</h3>
              <p className="text-base text-[#8A8F98] mt-3 max-w-md leading-relaxed">
                Deploy automated filters or transformation logic for the <span className="text-[#5E6AD2] font-semibold">{activeTab}</span> pipeline.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="mt-8 bg-white/[0.06] hover:bg-white/[0.1] text-[#EDEDEF] border border-white/[0.05] rounded-lg">
                <Plus className="size-4 mr-2" />
                Create Initial Rule
              </Button>
            </div>
          ) : (
            filteredRules.map(rule => (
              <RuleItem
                key={rule.id}
                rule={rule}
                onUpdate={(updates) => handleUpdate(rule.id, updates)}
                onDelete={() => handleDelete(rule.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
