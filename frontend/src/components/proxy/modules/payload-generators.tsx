
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { MonacoViewer } from "@/components/proxy/monaco-viewer"
import { Label } from "@/components/ui/label"

export type PayloadGenType = "Simple list" | "Numbers" | "Dates" | "Brute forcer" | "Null payloads"

export interface PayloadConfig {
  type: PayloadGenType
  simpleText: string
  numFrom: number
  numTo: number
  numStep: number
  numBase: 10 | 16
  numMinInt: number
  numMaxInt: number
  bruteMin: number
  bruteMax: number
  bruteCharset: string
  nullCount: number
}

export const defaultPayloadConfig: PayloadConfig = {
  type: "Simple list",
  simpleText: "",
  numFrom: 1,
  numTo: 100,
  numStep: 1,
  numBase: 10,
  numMinInt: 0,
  numMaxInt: 0,
  bruteMin: 1,
  bruteMax: 3,
  bruteCharset: "abcdefghijklmnopqrstuvwxyz0123456789",
  nullCount: 100,
}

interface Props {
  config: PayloadConfig
  onChange: (cfg: PayloadConfig, generatedLines: string) => void
}

export function PayloadConfigPanel({ config, onChange }: Props) {

  function update(overrides: Partial<PayloadConfig>) {
    const next = { ...config, ...overrides }
    const lines = generate(next)
    onChange(next, lines)
  }

  // Generate payload string joined by \n
  function generate(c: PayloadConfig): string {
    try {
      if (c.type === "Simple list") {
        return c.simpleText
      }
      if (c.type === "Null payloads") {
        return Array.from({ length: c.nullCount || 1 }, () => "").join("\n")
      }
      if (c.type === "Numbers") {
        const out = []
        let current = c.numFrom
        const step = c.numStep === 0 ? 1 : c.numStep
        const down = current > c.numTo
        
        while ((!down && current <= c.numTo) || (down && current >= c.numTo)) {
           let s = current.toString(c.numBase)
           if (c.numMinInt > 0) s = s.padStart(c.numMinInt, "0")
           if (c.numMaxInt > 0 && s.length > c.numMaxInt) s = s.slice(s.length - c.numMaxInt)
           out.push(c.numBase === 16 ? s.toLowerCase() : s)
           current += down ? -Math.abs(step) : Math.abs(step)
           if (out.length > 50000) break // Safety limit
        }
        return out.join("\n")
      }
      if (c.type === "Brute forcer") {
        const out: string[] = []
        const chars = c.bruteCharset.split("")
        if (chars.length === 0) return ""
        
        function recurse(prefix: string, len: number) {
           if (out.length > 50000) return
           if (prefix.length === len) {
             out.push(prefix)
             return
           }
           for (const ch of chars) {
             recurse(prefix + ch, len)
           }
        }
        
        const min = Math.max(1, c.bruteMin)
        const max = Math.max(min, c.bruteMax)
        for (let l = min; l <= max; l++) {
           recurse("", l)
        }
        return out.join("\n")
      }
    } catch {
      return ""
    }
    return ""
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-muted/5">
      <div className="p-3 border-b border-border/10 flex items-center gap-2 shrink-0">
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 w-24">Payload Type</span>
        <Select value={config.type} onValueChange={(v: PayloadGenType) => update({ type: v })}>
          <SelectTrigger className="h-7 w-48 text-[11px] font-bold uppercase tracking-wider bg-black/20 border-border/20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Simple list" className="text-[11px] uppercase tracking-wider font-bold">Simple list</SelectItem>
            <SelectItem value="Numbers" className="text-[11px] uppercase tracking-wider font-bold">Numbers</SelectItem>
            <SelectItem value="Brute forcer" className="text-[11px] uppercase tracking-wider font-bold">Brute forcer</SelectItem>
            <SelectItem value="Null payloads" className="text-[11px] uppercase tracking-wider font-bold">Null payloads</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 relative overflow-auto p-4 flex flex-col gap-4 scrollbar-thin">
        {config.type === "Simple list" && (
          <div className="absolute inset-0 p-3">
             <MonacoViewer
                content={config.simpleText}
                onChange={(v) => update({ simpleText: v || "" })}
                readOnly={false}
                language="plaintext"
             />
             {config.simpleText === "" && (
                <div className="absolute inset-x-6 top-6 pointer-events-none p-4 font-mono text-[11px] text-muted-foreground/30 whitespace-pre leading-relaxed">
                  {"admin\nlogin\napi\ntest\nbackup"}
                </div>
             )}
          </div>
        )}

        {config.type === "Numbers" && (
           <div className="grid grid-cols-2 gap-4 max-w-sm">
             <div className="space-y-1.5 flex flex-col">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">From</Label>
               <Input type="number" value={config.numFrom} onChange={e=>update({numFrom:parseFloat(e.target.value)||0})} className="h-8 text-xs font-mono bg-black/20" />
             </div>
             <div className="space-y-1.5 flex flex-col">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">To</Label>
               <Input type="number" value={config.numTo} onChange={e=>update({numTo:parseFloat(e.target.value)||0})} className="h-8 text-xs font-mono bg-black/20" />
             </div>
             <div className="space-y-1.5 flex flex-col">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Step</Label>
               <Input type="number" value={config.numStep} onChange={e=>update({numStep:parseFloat(e.target.value)||1})} className="h-8 text-xs font-mono bg-black/20" />
             </div>
             <div className="space-y-1.5 flex flex-col">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Base</Label>
               <Select value={config.numBase.toString()} onValueChange={v=>update({numBase:(parseInt(v)||10) as 10|16})}>
                 <SelectTrigger className="h-8 text-xs font-mono bg-black/20"><SelectValue/></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="10">Decimal (10)</SelectItem>
                   <SelectItem value="16">Hex (16)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <div className="space-y-1.5 flex flex-col">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Min Digits</Label>
               <Input type="number" value={config.numMinInt} onChange={e=>update({numMinInt:parseInt(e.target.value)||0})} className="h-8 text-xs font-mono bg-black/20" />
             </div>
           </div>
        )}

        {config.type === "Brute forcer" && (
           <div className="grid grid-cols-2 gap-4 max-w-sm">
             <div className="space-y-1.5 flex flex-col col-span-2">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Character Set</Label>
               <Input value={config.bruteCharset} onChange={e=>update({bruteCharset:e.target.value})} className="h-8 text-xs font-mono bg-black/20" />
             </div>
             <div className="space-y-1.5 flex flex-col">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Min Length</Label>
               <Input type="number" value={config.bruteMin} onChange={e=>update({bruteMin:parseInt(e.target.value)||1})} className="h-8 text-xs font-mono bg-black/20" />
             </div>
             <div className="space-y-1.5 flex flex-col">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Max Length</Label>
               <Input type="number" value={config.bruteMax} onChange={e=>update({bruteMax:parseInt(e.target.value)||1})} className="h-8 text-xs font-mono bg-black/20" />
             </div>
           </div>
        )}

        {config.type === "Null payloads" && (
           <div className="grid grid-cols-2 gap-4 max-w-sm">
             <div className="space-y-1.5 flex flex-col">
               <Label className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Generate Count</Label>
               <Input type="number" value={config.nullCount} onChange={e=>update({nullCount:parseInt(e.target.value)||100})} className="h-8 text-xs font-mono bg-black/20" />
             </div>
           </div>
        )}



      </div>
    </div>
  )
}
