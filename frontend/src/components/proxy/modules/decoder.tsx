import { useState } from "react"
import { Braces, ArrowDown, ArrowUp, Zap, Trash2, Copy } from "lucide-react"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

export function DecoderModule() {
  const [inputText, setInputText] = useState("")
  const [outputText, setOutputText] = useState("")
  const [encodingChain, setEncodingChain] = useState<string[]>([])

  const processText = (text: string, action: string, type: string) => {
    try {
      let result = text
      if (action === "encode") {
        if (type === "base64") result = btoa(text)
        else if (type === "url") result = encodeURIComponent(text)
        else if (type === "hex") result = Array.from(text).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      } else if (action === "decode") {
        if (type === "base64") result = atob(text)
        else if (type === "url") result = decodeURIComponent(text)
        else if (type === "hex") {
          const hexes = text.match(/.{1,2}/g) || []
          result = hexes.map(h => String.fromCharCode(parseInt(h, 16))).join('')
        }
      }
      return result
    } catch (e) {
      return "Error processing text"
    }
  }

  const handleAction = (action: "encode" | "decode", type: string) => {
    const result = processText(inputText, action, type)
    setOutputText(result)
    setEncodingChain([...encodingChain, `${action === 'encode' ? 'Encode' : 'Decode'} as ${type.toUpperCase()}`])
  }

  const smartDecode = () => {
    let current = inputText.trim()
    let chain: string[] = []
    let changed = true
    let safety = 0

    while (changed && safety < 5) {
      changed = false
      safety++
      
      // Try URL Decode
      if (current.includes('%') && /%[0-9a-fA-F]{2}/.test(current)) {
        try {
          const dec = decodeURIComponent(current)
          if (dec !== current) { current = dec; chain.push("URL Decode"); changed = true; continue }
        } catch(e){}
      }
      // Try Base64 Decode (basic heuristic: no spaces, matches b64 charset, length multiple of 4, ends with =)
      if (/^[a-zA-Z0-9+/]+={0,2}$/.test(current) && current.length % 4 === 0 && current.length > 0) {
        try {
          const dec = atob(current)
          // Simple heuristic to check if it's binary or readable string
          if (/^[\x20-\x7E\n\r\t]+$/.test(dec)) {
            current = dec; chain.push("Base64 Decode"); changed = true; continue
          }
        } catch(e){}
      }
    }
    
    if (chain.length > 0) {
      setOutputText(current)
      setEncodingChain(chain)
    } else {
      setOutputText("Could not automatically decode.")
      setEncodingChain(["Smart Decode Failed"])
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-2">
      <CyberPanel
        title="Decoder"
        icon={<Braces className="size-3" />}
        className="flex-1"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => { setInputText(""); setOutputText(""); setEncodingChain([]) }} className="h-6 px-2 text-[10px] text-[var(--tokyo-cyan)]/50 hover:text-[var(--tokyo-magenta)]">
              <Trash2 className="size-3 mr-1" /> Clear
            </Button>
          </div>
        }
      >
        <ResizablePanelGroup direction="vertical" className="h-full">
          {/* Top Panel - Input */}
          <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col min-h-0 bg-[var(--tokyo-panel)]">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)] shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tokyo-cyan)]">Input</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={smartDecode} className="h-6 text-[9px] bg-[var(--tokyo-green-soft)] text-[var(--tokyo-green)] border-[var(--tokyo-border-green)] uppercase mr-2 shadow-[0_0_10px_rgba(0,255,102,0.2)]">
                  <Zap className="size-3 mr-1" /> Smart Decode
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-[9px] bg-[var(--tokyo-cyan-soft)] text-[var(--tokyo-cyan)] border-[var(--tokyo-border-cyan)] uppercase">
                      Encode as... <ArrowUp className="size-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="text-[10px] min-w-[120px] bg-[var(--tokyo-panel-2)] border-[var(--tokyo-border-cyan)]">
                    {['url', 'base64', 'hex', 'html'].map(t => (
                      <DropdownMenuItem key={t} onClick={() => handleAction('encode', t)} className="uppercase text-[var(--tokyo-cyan)] hover:bg-[var(--tokyo-cyan-soft)] cursor-pointer">{t}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-6 text-[9px] bg-[var(--tokyo-magenta-soft)] text-[var(--tokyo-magenta)] border-[var(--tokyo-border-magenta)] uppercase">
                      Decode as... <ArrowDown className="size-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="text-[10px] min-w-[120px] bg-[var(--tokyo-panel-2)] border-[var(--tokyo-border-cyan)]">
                    {['url', 'base64', 'hex', 'html'].map(t => (
                      <DropdownMenuItem key={t} onClick={() => handleAction('decode', t)} className="uppercase text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)] cursor-pointer">{t}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <textarea 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              className="flex-1 w-full bg-transparent p-3 text-[11px] font-mono text-[var(--foreground)] outline-none resize-none"
              placeholder="Paste text here to decode or encode..."
            />
          </ResizablePanel>

          <ResizableHandle className="h-1 bg-[var(--tokyo-border-cyan)] hover:bg-[var(--tokyo-cyan)] transition-colors" />

          {/* Bottom Panel - Output */}
          <ResizablePanel defaultSize={50} minSize={20} className="flex flex-col min-h-0 bg-[var(--tokyo-panel)]">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--tokyo-border-cyan)] bg-[var(--tokyo-panel-2)] shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--tokyo-cyan)]">Output</span>
                {encodingChain.length > 0 && (
                  <span className="text-[9px] text-[var(--tokyo-cyan)]/50 font-mono flex items-center gap-1">
                    <Zap className="size-3" /> {encodingChain.join(" → ")}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(outputText)} className="h-6 px-2 text-[10px] text-[var(--tokyo-cyan)]/50 hover:text-[var(--tokyo-cyan)]">
                <Copy className="size-3 mr-1" /> Copy
              </Button>
            </div>
            <textarea 
              value={outputText}
              readOnly
              className="flex-1 w-full bg-transparent p-3 text-[11px] font-mono text-[var(--foreground-muted)] outline-none resize-none"
              placeholder="Result will appear here..."
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </CyberPanel>
    </div>
  )
}
