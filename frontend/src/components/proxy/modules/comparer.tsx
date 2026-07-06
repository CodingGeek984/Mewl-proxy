import { useState } from "react"
import { Columns3, ClipboardPaste, ArrowRightLeft, AlignLeft, Hash } from "lucide-react"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { Button } from "@/components/ui/button"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import * as diff from "diff"

export function ComparerModule() {
  const [textA, setTextA] = useState("")
  const [textB, setTextB] = useState("")
  const [diffResult, setDiffResult] = useState<any[]>([])
  const [diffMode, setDiffMode] = useState<"none" | "words" | "bytes">("none")

  const handleCompare = (mode: "words" | "bytes") => {
    if (mode === "words") {
      setDiffResult(diff.diffWordsWithSpace(textA, textB))
    } else {
      setDiffResult(diff.diffChars(textA, textB))
    }
    setDiffMode(mode)
  }

  const handlePaste = async (setter: React.Dispatch<React.SetStateAction<string>>) => {
    try {
      const clip = await navigator.clipboard.readText()
      setter(clip)
      setDiffMode("none")
    } catch (e) {
      console.error("Paste failed", e)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-2 gap-2">
      {diffMode === "none" ? (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel defaultSize={50} className="flex flex-col min-w-0 pr-1">
            <CyberPanel title="Item A" icon={<Columns3 className="size-3" />} className="h-full" actions={
              <Button variant="ghost" size="sm" onClick={() => handlePaste(setTextA)} className="h-6 px-2 text-[10px] text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)]">
                <ClipboardPaste className="size-3 mr-1" /> Paste
              </Button>
            }>
              <textarea 
                value={textA}
                onChange={e => setTextA(e.target.value)}
                className="flex-1 w-full bg-[var(--tokyo-panel)] p-3 text-[11px] font-mono text-[var(--foreground)] outline-none resize-none"
                placeholder="Paste first item here..."
              />
            </CyberPanel>
          </ResizablePanel>

          <ResizableHandle className="w-2 bg-transparent" />

          <ResizablePanel defaultSize={50} className="flex flex-col min-w-0 pl-1">
            <CyberPanel title="Item B" icon={<Columns3 className="size-3" />} className="h-full" actions={
              <Button variant="ghost" size="sm" onClick={() => handlePaste(setTextB)} className="h-6 px-2 text-[10px] text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)]">
                <ClipboardPaste className="size-3 mr-1" /> Paste
              </Button>
            }>
              <textarea 
                value={textB}
                onChange={e => setTextB(e.target.value)}
                className="flex-1 w-full bg-[var(--tokyo-panel)] p-3 text-[11px] font-mono text-[var(--foreground)] outline-none resize-none"
                placeholder="Paste second item here..."
              />
            </CyberPanel>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <CyberPanel title={`Comparison Result (${diffMode})`} icon={<ArrowRightLeft className="size-3" />} className="flex-1" actions={
          <Button variant="ghost" size="sm" onClick={() => setDiffMode("none")} className="h-6 px-2 text-[10px] text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)]">
            Back to Editor
          </Button>
        }>
          <div className="flex-1 overflow-auto bg-[var(--tokyo-panel)] p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {diffResult.map((part, i) => (
              <span key={i} className={part.added ? "bg-[var(--tokyo-green)]/20 text-[var(--tokyo-green)]" : part.removed ? "bg-[var(--tokyo-magenta)]/20 text-[var(--tokyo-magenta)] line-through opacity-70" : "text-[var(--foreground-muted)]"}>
                {part.value}
              </span>
            ))}
          </div>
        </CyberPanel>
      )}

      <div className="flex items-center justify-end gap-2 shrink-0 bg-[var(--tokyo-panel-2)] border border-[var(--tokyo-border-cyan)] p-2 rounded-lg">
        <Button 
          variant="outline" 
          disabled={!textA && !textB}
          onClick={() => handleCompare("words")}
          className="h-8 bg-[var(--tokyo-panel)] text-[var(--tokyo-cyan)] border-[var(--tokyo-border-cyan)] hover:bg-[var(--tokyo-cyan-soft)] hover:text-[var(--tokyo-cyan)] text-[10px] uppercase font-bold tracking-widest"
        >
          <AlignLeft className="size-3 mr-2" /> Compare (Words)
        </Button>
        <Button 
          variant="outline" 
          disabled={!textA && !textB}
          onClick={() => handleCompare("bytes")}
          className="h-8 bg-[var(--tokyo-panel)] text-[var(--tokyo-magenta)] border-[var(--tokyo-border-magenta)] hover:bg-[var(--tokyo-magenta-soft)] hover:text-[var(--tokyo-magenta)] text-[10px] uppercase font-bold tracking-widest"
        >
          <Hash className="size-3 mr-2" /> Compare (Bytes)
        </Button>
      </div>
    </div>
  )
}
