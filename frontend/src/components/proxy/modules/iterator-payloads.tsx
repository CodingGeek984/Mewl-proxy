import { useState, useMemo } from "react"
import { Plus, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { PayloadSet, ProcessingStep, ProcessingStepType } from "./iterator-types"
import { STEP_LABELS, applyAllSteps } from "./iterator-types"
import { PayloadConfigPanel, defaultPayloadConfig } from "./payload-generators"
import type { PayloadConfig } from "./payload-generators"

interface Props {
  markers: string[]
  payloadSets: PayloadSet[]
  onPayloadSetsChange: (sets: PayloadSet[]) => void
}

const STEP_CATEGORIES: { label: string; items: ProcessingStepType[] }[] = [
  { label: "Hash", items: ["hash_md5", "hash_sha1", "hash_sha256"] },
  { label: "String", items: ["uppercase", "lowercase", "reverse"] },
  { label: "Encode", items: ["base64_encode", "base64_decode", "url_encode", "url_encode_all", "hex_encode"] },
  { label: "Modify", items: ["prefix", "suffix", "match_replace"] },
]

function newStep(type: ProcessingStepType): ProcessingStep {
  return { id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, type, enabled: true, value: "", pattern: "", replacement: "" }
}

export function PayloadsTab({ markers, payloadSets, onPayloadSetsChange }: Props) {
  const [activeMarker, setActiveMarker] = useState(0)
  const [previewInput, setPreviewInput] = useState("admin")
  const [addStepOpen, setAddStepOpen] = useState(false)

  const activeSet = payloadSets[activeMarker] || { config: { ...defaultPayloadConfig }, processingSteps: [] }
  const steps = activeSet.processingSteps

  const previewOutput = useMemo(() => {
    try { return applyAllSteps(previewInput, steps) } catch { return "[error]" }
  }, [previewInput, steps])

  // Full wordlist preview: take all source lines, apply processing steps to each
  const previewWordlist = useMemo(() => {
    const sourceText = activeSet.config.simpleText || ""
    const lines = sourceText.split("\n").filter((l: string) => l.trim() !== "").slice(0, 500)
    return lines.map((line: string) => applyAllSteps(line, steps))
  }, [activeSet.config.simpleText, steps])

  function updateConfig(cfg: PayloadConfig, lines: string) {
    const next = [...payloadSets]
    next[activeMarker] = { ...activeSet, config: { ...cfg, simpleText: lines } }
    onPayloadSetsChange(next)
  }

  function updateSteps(newSteps: ProcessingStep[]) {
    const next = [...payloadSets]
    next[activeMarker] = { ...activeSet, processingSteps: newSteps }
    onPayloadSetsChange(next)
  }

  function addStep(type: ProcessingStepType) {
    updateSteps([...steps, newStep(type)])
    setAddStepOpen(false)
  }

  function removeStep(id: string) { updateSteps(steps.filter(s => s.id !== id)) }

  function toggleStep(id: string) {
    updateSteps(steps.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s))
  }

  function updateStepField(id: string, field: keyof ProcessingStep, val: string) {
    updateSteps(steps.map(s => s.id === id ? { ...s, [field]: val } : s))
  }

  function moveStep(idx: number, dir: -1 | 1) {
    const ni = idx + dir
    if (ni < 0 || ni >= steps.length) return
    const a = [...steps]; [a[idx], a[ni]] = [a[ni], a[idx]]
    updateSteps(a)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Marker List */}
      <div className="w-44 shrink-0 flex flex-col" style={{ borderRight: '1px solid var(--border-default)', background: 'var(--background-elevated)' }}>
        <div className="h-9 flex items-center px-3 shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>Markers</span>
          <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--foreground-muted)' }}>{markers.length || payloadSets.length}</span>
        </div>
        <ScrollArea className="flex-1">
          {(markers.length > 0 ? markers : ["Default"]).map((m, i) => (
            <button key={i} onClick={() => setActiveMarker(i)}
              className="w-full text-left px-3 py-2 flex items-center gap-2 transition-all duration-150"
              style={{
                background: activeMarker === i ? 'var(--accent-glow)' : 'transparent',
                borderLeft: activeMarker === i ? '2px solid var(--accent)' : '2px solid transparent',
                color: activeMarker === i ? 'var(--foreground)' : 'var(--foreground-muted)',
              }}>
              <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--accent)' }}>§{i + 1}</span>
              <span className="text-[10px] truncate">{m || `Position ${i + 1}`}</span>
            </button>
          ))}
        </ScrollArea>
      </div>

      {/* Main Payload Config */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Source */}
        <div className="flex-1 min-h-0 flex flex-col" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="h-9 flex items-center px-3 gap-2 shrink-0" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--background-elevated)' }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>Payload Source</span>
          </div>
          <div className="flex-1 relative">
            <PayloadConfigPanel config={activeSet.config} onChange={updateConfig} />
          </div>
        </div>

        {/* Processing Pipeline */}
        <div className="h-[240px] shrink-0 flex flex-col" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="h-9 flex items-center px-3 gap-2 shrink-0" style={{ borderBottom: '1px solid var(--border-default)', background: 'var(--background-elevated)' }}>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>Processing Pipeline</span>
            <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--foreground-muted)' }}>{steps.length} steps</span>
            <div className="relative">
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[9px] gap-1" style={{ color: 'var(--accent)' }} onClick={() => setAddStepOpen(!addStepOpen)}>
                <Plus className="size-3" /> Add
              </Button>
              {addStepOpen && (
                <div className="absolute right-0 top-7 z-50 w-48 rounded-lg p-1 shadow-lg animate-menu-in" style={{ background: 'var(--popover)', border: '1px solid var(--border-default)' }}>
                  {STEP_CATEGORIES.map(cat => (
                    <div key={cat.label}>
                      <div className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>{cat.label}</div>
                      {cat.items.map(type => (
                        <button key={type} onClick={() => addStep(type)} className="w-full text-left px-2 py-1 text-[10px] rounded hover:brightness-125 transition-colors" style={{ color: 'var(--foreground)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          {STEP_LABELS[type]}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <ScrollArea className="flex-1 p-2">
            {steps.length === 0 ? (
              <div className="flex items-center justify-center h-full text-[10px] uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
                No processing steps — payloads sent as-is
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {steps.map((step, idx) => (
                  <div key={step.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg group transition-all duration-150"
                    style={{ background: step.enabled ? 'var(--surface)' : 'transparent', border: '1px solid var(--border-default)', opacity: step.enabled ? 1 : 0.4 }}>
                    <div className="flex flex-col gap-0.5 cursor-pointer" style={{ color: 'var(--foreground-subtle)' }}>
                      <button onClick={() => moveStep(idx, -1)} className="hover:text-white text-[8px]">▲</button>
                      <button onClick={() => moveStep(idx, 1)} className="hover:text-white text-[8px]">▼</button>
                    </div>
                    <span className="text-[9px] font-mono w-5 text-center" style={{ color: 'var(--foreground-subtle)' }}>{idx + 1}</span>
                    <Switch checked={step.enabled} onCheckedChange={() => toggleStep(step.id)} className="scale-[0.55]" />
                    <span className="text-[10px] font-semibold min-w-[100px]" style={{ color: 'var(--foreground)' }}>{STEP_LABELS[step.type]}</span>
                    {(step.type === "prefix" || step.type === "suffix") && (
                      <Input value={step.value} onChange={e => updateStepField(step.id, "value", e.target.value)} placeholder="Value..."
                        className="h-5 text-[10px] font-mono flex-1 max-w-[200px]" style={{ background: 'var(--background-elevated)', borderColor: 'var(--border-default)' }} />
                    )}
                    {step.type === "match_replace" && (
                      <>
                        <Input value={step.pattern} onChange={e => updateStepField(step.id, "pattern", e.target.value)} placeholder="Pattern"
                          className="h-5 text-[10px] font-mono flex-1 max-w-[140px]" style={{ background: 'var(--background-elevated)', borderColor: 'var(--border-default)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--foreground-subtle)' }}>→</span>
                        <Input value={step.replacement} onChange={e => updateStepField(step.id, "replacement", e.target.value)} placeholder="Replace"
                          className="h-5 text-[10px] font-mono flex-1 max-w-[140px]" style={{ background: 'var(--background-elevated)', borderColor: 'var(--border-default)' }} />
                      </>
                    )}
                    <button onClick={() => removeStep(step.id)} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--foreground-subtle)' }}>
                      <Trash2 className="size-3 hover:text-red-400 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Full Wordlist Preview */}
        <div className="h-[180px] shrink-0 flex flex-col" style={{ borderTop: '1px solid var(--border-default)', background: 'var(--background-elevated)' }}>
          <div className="h-9 flex items-center px-3 gap-2 shrink-0" style={{ borderBottom: '1px solid var(--border-default)' }}>
            <Eye className="size-3" style={{ color: 'var(--accent)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>Wordlist Preview</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--foreground-muted)' }}>
              {previewWordlist.length} payloads
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] uppercase" style={{ color: 'var(--foreground-subtle)' }}>Test</span>
              <Input value={previewInput} onChange={e => setPreviewInput(e.target.value)} placeholder="admin"
                className="h-5 w-24 text-[10px] font-mono" style={{ background: 'var(--surface)', borderColor: 'var(--border-default)' }} />
              <span className="text-[10px]" style={{ color: 'var(--accent)' }}>→</span>
              <div className="h-5 w-32 flex items-center px-1.5 rounded text-[10px] font-mono truncate" style={{ background: 'var(--accent-glow)', border: '1px solid var(--border-accent)', color: 'var(--foreground)' }}>
                {previewOutput || "—"}
              </div>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-1.5 font-mono text-[10px] leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
              {previewWordlist.length === 0 ? (
                <div className="flex items-center justify-center h-full py-6 text-[10px] uppercase tracking-widest" style={{ color: 'var(--foreground-subtle)' }}>
                  Enter payloads in the source above
                </div>
              ) : (
                previewWordlist.map((line, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-0.5 rounded transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <span className="w-8 text-right shrink-0 tabular-nums" style={{ color: 'var(--foreground-subtle)', opacity: 0.4 }}>{i + 1}</span>
                    <span style={{ color: 'var(--foreground)' }}>{line}</span>
                  </div>
                ))
              )}
              {previewWordlist.length >= 500 && (
                <div className="px-2 py-1 text-[9px] italic" style={{ color: 'var(--foreground-subtle)' }}>...showing first 500 of {activeSet.config.simpleText?.split('\n').filter(Boolean).length || 0} payloads</div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}
