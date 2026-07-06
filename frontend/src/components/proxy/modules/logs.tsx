import { useEffect, useRef, useState } from "react"
import { ScrollText, Terminal, Play, Pause, Trash2, Search } from "lucide-react"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { Button } from "@/components/ui/button"

export function LogsModule() {
  const [logs, setLogs] = useState<string[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const [search, setSearch] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  // Fake log simulation removed to avoid false error messages
  useEffect(() => {
    if (isPaused) return
    // Real log streaming would go here
  }, [isPaused])

  useEffect(() => {
    if (!isPaused && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [logs, isPaused])

  const filteredLogs = logs.filter(l => l.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex h-full flex-col overflow-hidden p-2">
      <CyberPanel
        title="System Logs"
        icon={<Terminal className="size-3" />}
        className="flex-1"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center h-6 px-1.5 w-40 rounded bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-cyan)]">
              <Search className="size-3 mr-1 text-[var(--tokyo-cyan)]/50" />
              <input 
                className="flex-1 bg-transparent border-none outline-none text-[9px] font-mono text-[var(--foreground)] placeholder:text-[var(--tokyo-cyan)]/30"
                placeholder="Filter logs..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            
            <Button variant="ghost" size="sm" onClick={() => setIsPaused(!isPaused)} className={`h-6 px-2 text-[10px] uppercase font-bold tracking-widest ${isPaused ? 'text-[var(--tokyo-magenta)] hover:bg-[var(--tokyo-magenta-soft)]' : 'text-[var(--tokyo-green)] hover:bg-[var(--tokyo-green-soft)]'}`}>
              {isPaused ? <Play className="size-3 mr-1" /> : <Pause className="size-3 mr-1" />}
              {isPaused ? "Resume" : "Pause"}
            </Button>
            
            <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="h-6 px-2 text-[10px] text-[var(--tokyo-cyan)]/50 hover:text-[var(--tokyo-magenta)]">
              <Trash2 className="size-3" />
            </Button>
          </div>
        }
      >
        <div className="flex-1 overflow-auto bg-[#0a0a0f] p-4 font-mono text-[11px] leading-relaxed relative">
          {filteredLogs.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[var(--tokyo-cyan)]/20 uppercase font-black tracking-widest">
              <ScrollText className="size-10 mr-4 opacity-50" /> No logs yet
            </div>
          ) : (
            filteredLogs.map((log, i) => {
              const isError = log.includes("[ERROR]")
              const isWarn = log.includes("[WARN]")
              return (
                <div key={i} className={`whitespace-pre-wrap break-all mb-1 ${isError ? 'text-red-400' : isWarn ? 'text-amber-400' : 'text-[var(--tokyo-cyan)]/80'}`}>
                  {log}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>
      </CyberPanel>
    </div>
  )
}
