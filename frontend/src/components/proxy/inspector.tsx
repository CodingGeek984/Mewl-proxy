import { useState, useMemo, useEffect, useRef, useCallback, memo } from "react"
import { Search, X, Copy, Check, Eye, WrapText, Pilcrow, ChevronRight, ChevronUp, ChevronDown, Download, Send, Settings2, Plus, RefreshCcw, ZoomIn, ZoomOut, MousePointer2, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import * as prettier from "prettier/standalone"
import babelPlugin from "prettier/plugins/babel"
import estreePlugin from "prettier/plugins/estree"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useProxyWebsocket } from "@/lib/proxy-store"


interface InspectorProps {
  content: string
  url?: string
  className?: string
  label?: string
  readOnly?: boolean
  isResponse?: boolean
  showHidden?: boolean
  onContentChange?: (content: string) => void
  onDiscard?: () => void
  disabled?: boolean
}

const IMPORTANT_HEADERS_WHITELIST = [
  "host",
  "user-agent",
  "accept",
  "content-type",
  "content-length",
  "cookie",
  "set-cookie",
  "authorization",
  "bearer",
  "x-api-key",
  "origin",
  "referer",
  "server",
  "location",
  "connection"
]

type TabMode = "pretty" | "raw" | "hex" | "headers" | "render"

const escapeHtml = (unsafe: string) => {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}



/**
 * Text editor with line numbers.
 * Pretty mode only prettifies BODY (after blank line), headers stay raw.
 */
function TextEditor({
  code,
  wordWrap = false,
  showHidden = false,
  hideBoringHeaders = false,
  isPretty = false,
  readOnly = true,
  searchQuery = "",
  activeMatchIndex = 0,
  onMatchCountChange,
  onChange
}: {
  code: string
  wordWrap?: boolean
  showHidden?: boolean
  hideBoringHeaders?: boolean
  isPretty?: boolean
  readOnly?: boolean
  searchQuery?: string
  activeMatchIndex?: number
  onMatchCountChange?: (count: number) => void
  onChange?: (val: string) => void
}) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [processedCode, setProcessedCode] = useState(code)
  const [plainFormattedCode, setPlainFormattedCode] = useState(code)

  const { rawFilteredText, lineMap } = useMemo(() => {
    let text = code
    let lines = text.split(/\r?\n/)
    let map = lines.map((_, i) => i + 1)

    if (isPretty && hideBoringHeaders) {
      const parts = text.split(/\r?\n\r?\n/)
      if (parts.length > 0) {
        const headLines = parts[0].split(/\r?\n/)
        if (headLines.length > 0) {
          const reqResLine = headLines[0]
          const filteredItems = headLines.slice(1).map((line, i) => ({ line, originalIndex: i + 2 }))
            .filter(item => {
              const lower = item.line.toLowerCase()
              return IMPORTANT_HEADERS_WHITELIST.some(w => lower.startsWith(`${w}:`))
            })

          const newHead = [reqResLine, ...filteredItems.map(i => i.line)].join("\n")
          const newMap = [1, ...filteredItems.map(i => i.originalIndex)]

          if (parts.length > 1) {
            const bodyLines = parts.slice(1).join("\n\n").split(/\n/)
            const offset = headLines.length + 1
            newMap.push(offset) // the blank line
            bodyLines.forEach((_, i) => newMap.push(offset + 1 + i))
            text = newHead + "\n\n" + parts.slice(1).join("\n\n")
          } else {
            text = newHead
          }
          map = newMap
        }
      }
    }
    return { rawFilteredText: text, lineMap: map }
  }, [code, isPretty, hideBoringHeaders])

  useEffect(() => {
    let active = true
    async function processText() {
      let text = rawFilteredText
      let isFormatted = false

      // 1. PRETTIFY FIRST (so prettier parses clean code)
      if (isPretty) {
        try {
          const parts = text.split(/\r?\n\r?\n/)
          const headArr = parts[0]
          const bodyArr = parts.length > 1 ? parts.slice(1).join("\n\n") : ""
          const trimmed = bodyArr.trim()
          if (trimmed && trimmed.length < 50000) {
            let formattedBody = bodyArr
            try {
              if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                formattedBody = await prettier.format(trimmed, {
                  parser: "json",
                  plugins: [babelPlugin, estreePlugin],
                  printWidth: 60,
                })
                isFormatted = true
              } else if (trimmed.includes("=") && (trimmed.includes("&") || trimmed.length < 1000) && !trimmed.includes(" ")) {
                try {
                  const searchParams = new URLSearchParams(trimmed)
                  const pairs: string[] = []
                  searchParams.forEach((value, key) => {
                    pairs.push(`${key}=${value}`)
                  })
                  if (pairs.length > 0) {
                    formattedBody = pairs.join("\n&")
                    isFormatted = true
                  }
                } catch { }
              }
              if (isFormatted) {
                text = parts.length > 1 ? headArr + "\n\n" + formattedBody.trim() : formattedBody.trim()
              }
            } catch { }
          }
        } catch { }
      }

      const textBeforeHtml = text

      // 2. HIGHLIGHT HEADERS (Simple bolding of keys)
      if (isPretty) {
        const parts = text.split(/\n\n/)
        if (parts.length > 0) {
          const headLines = parts[0].split(/\n/)
          const highlightedHead = headLines.map((line, i) => {
            if (i === 0) return `<span class="text-[var(--accent)] font-bold">${escapeHtml(line)}</span>`
            const colonIdx = line.indexOf(":")
            if (colonIdx !== -1) {
              const key = line.slice(0, colonIdx)
              const val = line.slice(colonIdx)
              return `<span class="text-sky-300 font-medium opacity-80">${escapeHtml(key)}</span><span class="text-zinc-100 font-mono">${escapeHtml(val)}</span>`
            }
            return escapeHtml(line)
          }).join("\n")

          if (parts.length > 1) {
            text = highlightedHead + "\n\n" + escapeHtml(parts.slice(1).join("\n\n"))
          } else {
            text = highlightedHead
          }
        } else {
          text = escapeHtml(text)
        }
      } else {
        text = escapeHtml(text)
      }

      // 3. SHOW HIDDEN SYMBOLS LAST (on top of HTML escaped text)
      if (showHidden) {
        text = text
          .replace(/ /g, '<span class="text-sky-500/30 select-none">·</span>')
          .replace(/\\r/g, '<span class="text-sky-500/50 select-none">¤</span>')
          .replace(/\r/g, '<span class="text-sky-500/50 select-none">¤</span>')
          .replace(/\\n/g, '<span class="text-sky-500/50 select-none">¬</span>\n')
          .replace(/\n/g, '<span class="text-sky-500/50 select-none">¬</span>\n')
          .replace(/\\t/g, '<span class="text-sky-500/50 select-none">→</span>\t')
          .replace(/\t/g, '<span class="text-sky-500/50 select-none">→</span>\t')
      }

      if (active) {
        setPlainFormattedCode(textBeforeHtml)
        setProcessedCode(text)
      }
    }
    processText()
    return () => { active = false }
  }, [rawFilteredText, isPretty, showHidden])

  const lines = useMemo(() => processedCode.split(/\n/), [processedCode])
  const plainLines = useMemo(() => plainFormattedCode.split(/\n/), [plainFormattedCode])

  const lineNumbers = useMemo(() => {
    // If we have a lineMap from filtering, use it
    if (isPretty && hideBoringHeaders) return lineMap

    if (!isPretty || lines.length === rawFilteredText.split(/\n/).length) {
      return lines.map((_, i) => i + 1)
    }
    const rawLines = rawFilteredText.split(/\n/)
    let rawBlankIdx = -1
    for (let i = 0; i < rawLines.length; i++) {
      if (rawLines[i].trim() === "") { rawBlankIdx = i; break }
    }
    const nums: (number | string)[] = []
    if (rawBlankIdx === -1) {
      for (let i = 0; i < lines.length; i++) nums.push(i < rawFilteredText.split(/\n/).length ? i + 1 : "")
    } else {
      for (let i = 0; i <= rawBlankIdx; i++) nums.push(i + 1)
      const bodyPrettyLines = lines.length - rawBlankIdx - 1
      const bodyRawLines = rawFilteredText.split(/\n/).length - rawBlankIdx - 1
      let rawIdx = rawBlankIdx + 1
      const ratio = bodyPrettyLines / bodyRawLines
      for (let i = 0; i < bodyPrettyLines; i++) {
        if (i === 0 || Math.floor(i / ratio) !== Math.floor((i - 1) / ratio)) {
          nums.push(rawIdx + 1)
          rawIdx = Math.min(rawIdx + 1, rawFilteredText.split(/\n/).length - 1)
        } else {
          nums.push("")
        }
      }
    }
    return nums
  }, [lines, rawFilteredText, isPretty, hideBoringHeaders, lineMap])

  const rowVirtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 20,
    overscan: 10,
    measureElement: (el) => el.getBoundingClientRect().height,
  })

  useEffect(() => {
    rowVirtualizer.measure()
  }, [wordWrap, rowVirtualizer])

  useEffect(() => {
    if (!searchQuery) {
      onMatchCountChange?.(0)
      return
    }
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const matches = processedCode.match(new RegExp(escaped, "gi"))
    onMatchCountChange?.(matches ? matches.length : 0)
  }, [processedCode, searchQuery, onMatchCountChange])

  useEffect(() => {
    if (!searchQuery || !lines.length) return
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(escaped, "gi")
    let currentMatchCount = 0
    let targetLineIdx = -1
    for (let i = 0; i < lines.length; i++) {
      const lineMatches = lines[i].match(regex)
      if (lineMatches) {
        if (currentMatchCount + lineMatches.length > activeMatchIndex) {
          targetLineIdx = i
          break
        }
        currentMatchCount += lineMatches.length
      }
    }
    if (targetLineIdx !== -1) {
      rowVirtualizer.scrollToIndex(targetLineIdx, { align: "center" })
      // Further fine-tuning with scrollIntoView after render if wrap is enabled
    }
  }, [activeMatchIndex, searchQuery, lines, rowVirtualizer])

  useEffect(() => {
    if (searchQuery && activeMatchIndex >= 0) {
      const el = document.getElementById('active-search-match')
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' })
      }
    }
  }, [activeMatchIndex, searchQuery, processedCode])

  const matchesPerLine = useMemo(() => {
    if (!searchQuery) return lines.map(() => 0)
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(escaped, "gi")
    return lines.map(l => {
      const m = l.match(regex)
      return m ? m.length : 0
    })
  }, [lines, searchQuery])

  const startMatchIdxPerLine = useMemo(() => {
    const starts: number[] = []
    let current = 0
    for (const count of matchesPerLine) {
      starts.push(current)
      current += count
    }
    return starts
  }, [matchesPerLine])

  const highlightLine = useCallback((text: string, startIdx: number) => {
    let highlighted = text
    if (isPretty && (text.includes("&quot;") || text.includes(": "))) {
      highlighted = highlighted
        .replace(/(&quot;.+?&quot;)\s*:/g, '<span class="text-[var(--accent)]">$1</span>:')
        .replace(/:\s*(&quot;.+?&quot;)/g, ': <span class="text-emerald-400">$1</span>')
        .replace(/:\s*(\d+)/g, ': <span class="text-orange-400">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-400">$1</span>')
    }
    if (searchQuery) {
      const escaped = escapeHtml(searchQuery).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const regex = new RegExp(`(${escaped})`, "gi")
      let matchCount = 0
      highlighted = highlighted.replace(regex, (match) => {
        const currentGlobalIdx = startIdx + matchCount
        const isActive = currentGlobalIdx === activeMatchIndex
        matchCount++
        return `<mark class="${isActive ? 'bg-sky-500 text-white font-bold ring-1 ring-[var(--accent)]/60' : 'bg-sky-500/15 text-inherit'} rounded-sm px-0.5 transition-colors" ${isActive ? 'id="active-search-match"' : ''}>${match}</mark>`
      })
    }
    return highlighted
  }, [isPretty, searchQuery, activeMatchIndex])

  // Editable mode - use textarea for raw, contentEditable for pretty
  if (!readOnly && !isPretty) {
    const rawLines = code.split('\n')
    
    // For showHidden overlay
    const overlayHtml = showHidden ? escapeHtml(code).replace(/\r/g, '<span class="text-sky-500/50">\\r</span>').replace(/\n/g, '<span class="text-sky-500/50">\\n</span>\n').replace(/\t/g, '<span class="text-sky-500/50">\\t</span>\t') : ''

    return (
      <div className="flex h-full bg-transparent no-scrollbar font-digital text-[11px] relative overflow-hidden min-w-0 border-t border-border/10">
        <div className="shrink-0 z-10 w-[44px] h-full overflow-hidden no-scrollbar bg-background/40 relative">
          <div
            className="bg-muted/5 text-muted-foreground/30 px-2 text-right select-none w-full h-fit py-3 whitespace-pre font-mono text-[10px]"
            style={{ lineHeight: '20px' }}
          >
            {rawLines.map((_, i) => i + 1).join('\n')}
          </div>
          <div className="absolute top-0 right-0 w-px h-full bg-border/10" />
        </div>
        <div className="relative flex-1 w-full h-full">
          {showHidden && (
            <div 
              className={`absolute inset-0 pointer-events-none px-3 font-digital text-foreground/40 break-all pb-3 select-none ${wordWrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-hidden"}`} 
              style={{ lineHeight: '20px', paddingTop: '12px' }}
              dangerouslySetInnerHTML={{ __html: overlayHtml }}
            />
          )}
          <textarea
            value={code}
            onChange={(e) => onChange?.(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            wrap={wordWrap ? "soft" : "off"}
            className={`absolute inset-0 w-full h-full bg-transparent px-3 font-digital outline-none border-0 resize-none caret-emerald-500 pb-3 ${showHidden ? 'text-transparent' : 'text-foreground/90'} ${wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre overflow-x-auto"}`}
            style={{ lineHeight: '20px', paddingTop: '12px' }}
            onScroll={(e) => {
              const gutterWrapper = e.currentTarget.parentElement?.previousElementSibling as HTMLElement
              if (gutterWrapper) gutterWrapper.scrollTop = e.currentTarget.scrollTop
              
              if (showHidden) {
                 const overlay = e.currentTarget.previousElementSibling as HTMLElement
                 if (overlay) {
                    overlay.scrollTop = e.currentTarget.scrollTop
                    overlay.scrollLeft = e.currentTarget.scrollLeft
                 }
              }
            }}
          />
        </div>
      </div>
    )
  }

  // Editable Pretty mode
  const [isEditing, setIsEditing] = useState(false)
  if (!readOnly && isPretty) {
    if (isEditing) {
      return (
        <div className="flex h-full bg-transparent no-scrollbar font-digital text-[11px] relative overflow-hidden min-w-0 border-t border-border/10">
          <div className="shrink-0 z-10 w-[44px] h-full overflow-hidden no-scrollbar bg-background/40 relative">
            <div
              className="bg-muted/5 text-muted-foreground/30 px-2 text-right select-none w-full h-fit py-3 whitespace-pre font-mono text-[10px]"
              style={{ lineHeight: '20px' }}
            >
              {plainLines.map((_, i) => i + 1).join('\n')}
            </div>
            <div className="absolute top-0 right-0 w-px h-full bg-border/10" />
          </div>
          <textarea
            autoFocus
            value={plainFormattedCode}
            onBlur={() => setIsEditing(false)}
            onChange={(e) => onChange?.(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            wrap={wordWrap ? "soft" : "off"}
            className={`flex-1 w-full bg-transparent px-3 font-digital outline-none border-0 resize-none text-foreground/90 caret-emerald-500 pb-3 ${wordWrap ? "whitespace-pre-wrap" : "whitespace-pre overflow-x-auto"}`}
            style={{ lineHeight: '20px', height: '100%', minWidth: '100%', paddingTop: '12px' }}
          />
        </div>
      )
    }

    return (
      <div
        className="flex items-start font-digital text-[11px] select-text min-w-0 w-full h-full overflow-auto scrollbar-thin relative cursor-text"
        ref={parentRef}
        onClick={() => setIsEditing(true)}
      >
        <div className="py-3 w-full relative min-w-0" style={{ height: `${Math.max(rowVirtualizer.getTotalSize(), parentRef.current?.clientHeight || 0)}px` }}>
          <div className="absolute top-0 left-[44px] w-px h-full bg-border/10 z-0" />
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              data-index={virtualRow.index}
              className="flex absolute top-0 left-0 min-w-full w-fit"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                lineHeight: '20px',
                minHeight: '20px'
              }}
            >
              <div className="bg-muted/5 text-muted-foreground/30 px-2 text-right select-none shrink-0 z-10 w-[44px] flex items-center justify-end font-mono text-[10px]">
                {lineNumbers[virtualRow.index]}
              </div>
              <div
                className={`px-3 flex-1 flex items-center min-w-0 ${wordWrap ? "whitespace-pre-wrap break-words overflow-hidden" : "whitespace-pre"} outline-none`}
                dangerouslySetInnerHTML={{ __html: highlightLine(lines[virtualRow.index] || " ", startMatchIdxPerLine[virtualRow.index]) }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start font-digital text-[11px] select-text min-w-0 w-full h-full overflow-auto scrollbar-thin relative" ref={parentRef}>
      <div className="py-3 w-full relative min-w-0" style={{ height: `${Math.max(rowVirtualizer.getTotalSize(), parentRef.current?.clientHeight || 0)}px` }}>
        <div className="absolute top-0 left-[44px] w-px h-full bg-border/10 z-0" />
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            data-index={virtualRow.index}
            className="flex absolute top-0 left-0 min-w-full w-fit"
            style={{
              transform: `translateY(${virtualRow.start}px)`,
              lineHeight: '20px',
              minHeight: '20px'
            }}
          >
            <div className="bg-muted/5 text-muted-foreground/30 px-2 text-right select-none shrink-0 z-10 w-[44px] flex items-center justify-end font-mono text-[10px]">
              {lineNumbers[virtualRow.index]}
            </div>
            <div className={`px-3 flex-1 flex items-center min-w-0 ${wordWrap ? "whitespace-pre-wrap break-words overflow-hidden" : "whitespace-pre"}`}>
              <div className={`text-foreground/85 w-full ${wordWrap ? "whitespace-pre-wrap break-all" : "whitespace-pre"}`} dangerouslySetInnerHTML={{ __html: highlightLine(lines[virtualRow.index] || " ", startMatchIdxPerLine[virtualRow.index]) }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RenderView({ content, url }: { content: string, url?: string }) {
  const [zoom, setZoom] = useState(100)
  const [interactive, setInteractive] = useState(false)
  const [autoFit] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const { html, isImage, imageUrl } = useMemo(() => {
    const parts = content.split(/\r?\n\r?\n/)
    const body = parts.length > 1 ? parts.slice(1).join("\n\n") : ""
    const lower = body.toLowerCase().trim()

    const isHtml = lower.includes("<html") || lower.includes("<!doctype html") || lower.includes("<body")
    const isImage = body.startsWith("data:image/") || 
                    content.toLowerCase().includes("content-type: image/") ||
                    (body.length > 4 && body.slice(0, 4) === "\x89PNG")

    return { html: isHtml ? body : null, isImage, imageUrl: isImage ? body : null }
  }, [content])

  const handleRefresh = () => setRefreshKey(prev => prev + 1)

  if (html) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/50 relative overflow-hidden group/render">
        {/* Browser Toolbar */}
        <div className="flex items-center h-10 px-3 bg-background/60 backdrop-blur-xl border-b border-border/40 gap-4 z-10 shrink-0">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={handleRefresh} title="Refresh">
              <RefreshCcw className="size-3.5" />
            </Button>
          </div>

          <div className="flex-1 flex items-center justify-center gap-3">
             <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-full border border-border/20 max-w-[400px] w-full">
                <Globe className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="text-[10px] font-mono text-foreground/80 truncate font-medium">{url || "about:blank"}</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <MousePointer2 className={`size-3 ${interactive ? 'text-[var(--accent)]' : 'text-muted-foreground/40'}`} />
                <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">Interactive</span>
                <Switch 
                  checked={interactive} 
                  onCheckedChange={setInteractive} 
                  className="scale-[0.6] data-[state=checked]:bg-sky-500"
                />
             </div>
             
             <div className="h-4 w-px bg-border/40" />

             <div className="flex items-center gap-3 min-w-[140px]">
                <ZoomOut className="size-3 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors" onClick={() => setZoom(Math.max(25, zoom - 25))} />
                <Slider 
                  value={[zoom]} 
                  onValueChange={([v]) => setZoom(v)} 
                  min={25} 
                  max={200} 
                  step={5} 
                  className="w-20 cursor-pointer h-1 [&_.relative]:h-1 [&_[role=slider]]:size-2.5 [&_[role=slider]]:bg-sky-500 [&_[role=slider]]:border-0" 
                />
                <ZoomIn className="size-3 text-muted-foreground/40 cursor-pointer hover:text-foreground transition-colors" onClick={() => setZoom(Math.min(200, zoom + 25))} />
                <span className="text-[10px] font-mono text-muted-foreground/70 w-8">{zoom}%</span>
             </div>
          </div>
        </div>

        {/* Viewport */}
        <div className="flex-1 overflow-auto p-4 flex flex-col items-center custom-scrollbar-minimal bg-[#f0f0f4] dark:bg-[#1e1e24]">
           <div 
             className="bg-white rounded-sm relative transition-all duration-300 ease-out flex flex-col"
             style={{ 
               width: autoFit ? '100%' : '1280px',
               maxWidth: '100%',
               height: autoFit ? '100%' : 'fit-content',
               minHeight: '600px',
               transform: `scale(${zoom / 100})`,
               transformOrigin: 'top center'
             }}
           >
             {isImage ? (
               <div className="flex-1 w-full h-full flex items-center justify-center p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiI+PC9yZWN0Pgo8cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiPjwvcmVjdD4KPHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNmMmYyZjIiPjwvcmVjdD4KPC9zdmc+')]">
                 <img src={imageUrl!} alt="Rendered Response" className="max-w-full max-h-full object-contain shadow-md border border-border/10" />
               </div>
             ) : (
               <>
                 <iframe
                   key={refreshKey}
                   srcDoc={html}
                   className="w-full min-h-[800px] border-0 rounded-sm flex-1"
                   sandbox={interactive ? "allow-scripts allow-forms allow-same-origin" : "allow-scripts"}
                   title="Render View"
                 />
                 {!interactive && (
                   <div className="absolute inset-0 z-20 cursor-default" />
                 )}
               </>
             )}
           </div>
           
           <div className="h-20 shrink-0" /> {/* Bottom spacing */}
        </div>
      </div>
    )
  }

  if (isImage) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-950/40 relative group/image">
        <div className="flex items-center h-10 px-3 bg-background/60 backdrop-blur-xl border-b border-border/40 gap-4 z-10 shrink-0">
          <div className="flex-1 flex items-center justify-center gap-3">
             <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-full border border-border/20 max-w-[400px] w-full">
                <Globe className="size-3 text-muted-foreground/50 shrink-0" />
                <span className="text-[10px] font-mono text-foreground/80 truncate font-medium">{url || "Image Preview"}</span>
             </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex flex-col items-center custom-scrollbar-minimal bg-[#f0f0f4] dark:bg-[#1e1e24]">
          <div className="relative group">
             <div className="absolute -inset-1 bg-sky-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
             <img 
               src={imageUrl!} 
               alt="Rendered content" 
               className="max-w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] border border-white/5 rounded-lg object-contain bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NUUVFpYGBgYDh9+vT/UTAMICM6GvT19fH/OXPmDH6NR8NgNAyGMBgMowEAgREvEW6B9fQAAAAASUVORK5CYII=')] transition-transform duration-300 hover:scale-[1.02]" 
             />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/10 p-12 text-center select-none bg-muted/2">
      <div className="size-20 rounded-full border border-dashed border-muted-foreground/1) flex items-center justify-center opacity-20 relative">
        <div className="absolute inset-0 rounded-full animate-ping bg-sky-500/5 duration-[3000ms]" />
        <Eye className="size-8" />
      </div>
      <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] opacity-30">No Renderable Content</p>
    </div>
  )
}

const RESPONSE_STATUS_DISPLAY = (content: string) => {
  const firstLine = content.split('\n')[0]
  const statusMatch = firstLine.match(/HTTP\/\d\.\d\s+(\d+)/)
  if (statusMatch) {
    const code = statusMatch[1]
    const color = code.startsWith('2') ? 'text-emerald-400' : code.startsWith('3') ? 'text-[var(--accent)]' : 'text-red-400'
    return <span className={color}>{code} {firstLine.split(code)[1]?.trim()}</span>
  }
  return firstLine
}

const GRPC_METHOD_DISPLAY = (content: string) => {
  const firstLine = content.split('\n')[0]
  const parts = firstLine.split(' ')
  return <span className="text-[var(--accent)]">{parts[0]}</span>
}

const SectionHeader = ({ title, count, show, onToggle, extra }: { title: string, count: number, show: boolean, onToggle: () => void, extra?: React.ReactNode }) => (
  <div
    className={`flex items-center h-7 px-3 border-b border-border/10 cursor-pointer hover:bg-muted/20 transition-all duration-200 group ${show ? 'bg-sky-500/5' : 'bg-muted/10'}`}
    onClick={onToggle}
  >
    <div className={`transition-transform duration-200 ${show ? 'rotate-90' : ''}`}>
      <ChevronRight className={`size-3 ${show ? 'text-[var(--accent)]' : 'text-muted-foreground/50'}`} />
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-widest ml-2 transition-colors duration-200 ${show ? 'text-[var(--accent)]' : 'text-foreground/70'}`}>{title}</span>
    {count > 0 && <span className="ml-2 text-[9px] font-mono text-[var(--accent)] bg-sky-500/10 px-1 rounded-full">{count}</span>}
    {extra && <div className="ml-auto">{extra}</div>}
  </div>
)


function InspectorTabContent({
  content,
  searchQuery = "",
  activeMatchIndex = 0,
  onMatchCountChange,
  isResponse = false,
  readOnly = true,
  onChange,
}: {
  content: string,
  readOnly?: boolean,
  showHidden?: boolean,
  isResponse?: boolean,
  searchQuery?: string,
  activeMatchIndex?: number,
  onMatchCountChange?: (count: number) => void,
  onChange?: (val: string) => void,
}) {
  const [showParams, setShowParams] = useState(true)
  const [showHeaders, setShowHeaders] = useState(true)
  const [expandedHeaders, setExpandedHeaders] = useState<Set<number>>(new Set())

  const toggleHeader = (idx: number) => {
    setExpandedHeaders(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const { headers, url, params, bodyStr } = useMemo(() => {
    const linesArr = content.split(/\r?\n/)
    const first = linesArr[0] || ""
    const parts = first.split(" ")
    const u = parts[1] || ""

    const bodyParts = content.split(/\r?\n\r?\n/)
    const bodyValue = bodyParts.length > 1 ? bodyParts.slice(1).join("\n\n") : ""
    const headLines = bodyParts[0].split(/\n/)
    const hList: { key: string, value: string }[] = []
    for (let i = 1; i < headLines.length; i++) {
      const line = headLines[i]
      const colonIdx = line.indexOf(":")
      if (colonIdx !== -1) {
        hList.push({
          key: line.slice(0, colonIdx).trim(),
          value: line.slice(colonIdx + 1).trim()
        })
      }
    }

    const urlParts = u.split("?")
    const urlParams: { key: string, value: string }[] = []
    if (urlParts.length > 1) {
      const query = urlParts[1]
      if (query.length > 0) {
        query.split("&").forEach(pair => {
          const [k, v] = pair.split("=")
          urlParams.push({ key: decodeURIComponent(k || ""), value: decodeURIComponent(v || "") })
        })
      }
    }
    return { headers: hList, url: urlParts[0], params: urlParams, bodyStr: bodyValue }
  }, [content])

  const handleUpdate = (type: 'param' | 'header' | 'body', index: number, field: 'key' | 'value', newValue: string) => {
    if (!onChange || readOnly) return
    let newParams = [...params]
    let newHeaders = [...headers]
    let newBody = bodyStr

    if (type === 'param') {
      newParams[index] = { ...newParams[index], [field]: newValue }
    } else if (type === 'header') {
      newHeaders[index] = { ...newHeaders[index], [field]: newValue }
    } else if (type === 'body') {
      newBody = newValue
    }

    const linesArr = content.split(/\r?\n/)
    let firstLine = linesArr[0] || ""
    if (!isResponse && type === 'param') {
       const parts = firstLine.split(" ")
       if (parts.length >= 2) {
         let base = parts[1].split("?")[0]
         const qs = newParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&")
         parts[1] = qs ? `${base}?${qs}` : base
         firstLine = parts.join(" ")
       }
    }

    const headerBlock = newHeaders.map(h => `${h.key}: ${h.value}`).join("\r\n")
    const delimiter = newBody.length > 0 ? "\r\n\r\n" : "\r\n\r\n"
    const newContent = `${firstLine}\r\n${headerBlock}${delimiter}${newBody}`
    onChange(newContent)
  }

  const handleAddRow = (type: 'param' | 'header') => {
    if (!onChange || readOnly) return
    if (type === 'param') handleUpdate('param', params.length, 'key', 'new_param')
    if (type === 'header') handleUpdate('header', headers.length, 'key', 'New-Header')
  }

  const handleDeleteRow = (type: 'param' | 'header', index: number) => {
    if (!onChange || readOnly) return
    if (type === 'param') {
       let newParams = params.filter((_, i) => i !== index)
       const linesArr = content.split(/\r?\n/)
       let firstLine = linesArr[0] || ""
       if (!isResponse) {
         const parts = firstLine.split(" ")
         if (parts.length >= 2) {
           let base = parts[1].split("?")[0]
           const qs = newParams.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&")
           parts[1] = qs ? `${base}?${qs}` : base
           firstLine = parts.join(" ")
         }
       }
       const headerBlock = headers.map(h => `${h.key}: ${h.value}`).join("\r\n")
       const delimiter = bodyStr.length > 0 ? "\r\n\r\n" : "\r\n\r\n"
       onChange(`${firstLine}\r\n${headerBlock}${delimiter}${bodyStr}`)
    }
    if (type === 'header') {
       let newHeaders = headers.filter((_, i) => i !== index)
       const linesArr = content.split(/\r?\n/)
       const headerBlock = newHeaders.map(h => `${h.key}: ${h.value}`).join("\r\n")
       const delimiter = bodyStr.length > 0 ? "\r\n\r\n" : "\r\n\r\n"
       onChange(`${linesArr[0] || ""}\r\n${headerBlock}${delimiter}${bodyStr}`)
    }
  }

  useEffect(() => {
    const isRx = searchQuery.startsWith("/") && searchQuery.endsWith("/")
    const escaped = isRx ? searchQuery.slice(1, -1) : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(escaped, "gi")
    let total = 0
    params.forEach(p => {
      total += (p.key.match(regex)?.length || 0)
      total += (p.value.match(regex)?.length || 0)
    })
    headers.forEach(h => {
      total += (h.key.match(regex)?.length || 0)
      total += (h.value.match(regex)?.length || 0)
    })
    total += (bodyStr.match(regex)?.length || 0)
    onMatchCountChange?.(total)
  }, [params, headers, bodyStr, searchQuery, onMatchCountChange])

  // escapeHtml is defined at module level

  const highlightMarkup = (text: string, startIdx: number) => {
    if (!searchQuery) return escapeHtml(text)
    const escaped = escapeHtml(searchQuery).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(${escaped})`, "gi")
    let matchCount = 0
    return escapeHtml(text).replace(regex, (match) => {
      const currentGlobalIdx = startIdx + matchCount
      const isActive = currentGlobalIdx === activeMatchIndex
      matchCount++
      return `<mark class="${isActive ? 'bg-sky-500 text-white font-bold ring-1 ring-[var(--accent)]/60' : 'bg-sky-500/15 text-inherit'} rounded-sm px-0.5" ${isActive ? 'id="active-search-match-details"' : ''}>${match}</mark>`
    })
  }

  useEffect(() => {
    if (searchQuery && activeMatchIndex >= 0) {
      const el = document.getElementById('active-search-match-details')
      if (el) el.scrollIntoView({ block: 'center', inline: 'nearest' })
    }
  }, [activeMatchIndex, searchQuery, content])

  const getStartIdx = (type: 'param-k' | 'param-v' | 'header-k' | 'header-v' | 'body', index?: number) => {
    if (!searchQuery) return 0
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(escaped, "gi")
    let current = 0
    for (let i = 0; i < params.length; i++) {
      if (type === 'param-k' && i === index) return current
      current += (params[i].key.match(regex)?.length || 0)
      if (type === 'param-v' && i === index) return current
      current += (params[i].value.match(regex)?.length || 0)
    }
    for (let i = 0; i < headers.length; i++) {
      if (type === 'header-k' && i === index) return current
      current += (headers[i].key.match(regex)?.length || 0)
      if (type === 'header-v' && i === index) return current
      current += (headers[i].value.match(regex)?.length || 0)
    }
    if (type === 'body') return current
    return 0
  }

  // prettier formatting is handled by TextEditor component


  return (
    <div className="flex-1 flex flex-col font-mono bg-transparent overflow-hidden scrollbar-thin min-h-0">
      <div className="flex flex-col border-b border-border/20 bg-muted/5 shrink-0">
        <div className="flex items-center h-8 px-3 border-b border-border/10 bg-muted/10">
          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] opacity-50">
            {isResponse ? RESPONSE_STATUS_DISPLAY(content) : GRPC_METHOD_DISPLAY(content)}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground truncate opacity-60 ml-3">{url}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin min-h-0 bg-transparent flex flex-col">

        {(params.length > 0 || !readOnly) && (
          <div className="shrink-0">
            <SectionHeader title="URL Parameters" count={params.length} show={showParams} onToggle={() => setShowParams(!showParams)} extra={!readOnly ? <Plus className="size-3 text-[var(--accent)] mr-2 hover:scale-125 transition-transform" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleAddRow('param')}} /> : undefined} />
            {showParams && (
              <div className="flex flex-col border-b border-border/20 bg-muted/5">
                {params.map((p, i) => (
                  <div key={i} className={`flex items-stretch min-h-[28px] border-b border-border/10 last:border-b-0 ${i % 2 === 0 ? 'bg-muted/5' : ''} relative group/row`}>
                    <div className="w-[180px] shrink-0 border-r border-border/10 flex items-center bg-muted/5 relative">
                      {readOnly ? (
                        <div className="w-full h-full px-3 text-[10px] text-[var(--accent)] font-bold flex items-center" dangerouslySetInnerHTML={{ __html: highlightMarkup(p.key, getStartIdx('param-k', i)) }} />
                      ) : (
                        <input className="w-full h-full bg-transparent outline-none px-3 text-[10px] text-[var(--accent)] font-bold font-mono focus:bg-sky-500/10" value={p.key} onChange={e => handleUpdate('param', i, 'key', e.target.value)} />
                      )}
                    </div>
                    <div className="flex-1 flex items-center min-w-0 pr-6">
                      {readOnly ? (
                        <div className="w-full h-full px-3 text-[10px] text-foreground/85 flex items-center truncate" dangerouslySetInnerHTML={{ __html: highlightMarkup(p.value, getStartIdx('param-v', i)) }} />
                      ) : (
                        <input className="w-full h-full bg-transparent outline-none px-3 text-[10px] text-foreground/85 font-mono focus:bg-sky-500/10" value={p.value} onChange={e => handleUpdate('param', i, 'value', e.target.value)} />
                      )}
                    </div>
                    {!readOnly && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                        <X className="size-3.5 text-red-500 cursor-pointer hover:scale-110" onClick={() => handleDeleteRow('param', i)} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(headers.length > 0 || !readOnly) && (
          <div className="shrink-0">
            <SectionHeader title="Headers" count={headers.length} show={showHeaders} onToggle={() => setShowHeaders(!showHeaders)} extra={!readOnly ? <Plus className="size-3 text-[var(--accent)] mr-2 hover:scale-125 transition-transform" onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleAddRow('header')}} /> : undefined} />
            {showHeaders && (
              <div className="flex flex-col border-b border-border/20">
                {headers.map((h, i) => {
                  const subItems = (h.key.toLowerCase() === 'cookie' || h.key.toLowerCase() === 'set-cookie')
                    ? h.value.split(/;\s*/).filter(s => s.includes('=')).map(s => {
                      const parts = s.split('=')
                      return { k: parts[0], v: parts.slice(1).join('=') }
                    })
                    : []
                  const isComplex = subItems.length > 0
                  const isExpanded = expandedHeaders.has(i)

                  return (
                    <div key={i} className="flex flex-col border-b border-border/10 last:border-b-0 relative group/row">
                      <div className={`flex items-stretch min-h-[28px] ${i % 2 === 0 ? 'bg-muted/5' : ''}`}>
                        <div className="w-[180px] shrink-0 border-r border-border/10 flex items-center bg-muted/5 group/h">
                          {readOnly ? (
                            <div className="w-full h-full px-3 text-[10px] text-sky-300 font-medium flex items-center gap-2"
                              onClick={() => isComplex && toggleHeader(i)}>
                              {isComplex && <ChevronRight className={`size-2.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />}
                              <div dangerouslySetInnerHTML={{ __html: highlightMarkup(h.key, getStartIdx('header-k', i)) }} />
                            </div>
                          ) : (
                            <input className="w-full h-full bg-transparent outline-none px-3 text-[10px] text-sky-300 font-medium focus:bg-sky-500/10" value={h.key} onChange={e => handleUpdate('header', i, 'key', e.target.value)} />
                          )}
                        </div>
                        <div className="flex-1 flex items-center min-w-0 pr-6">
                           {readOnly ? (
                              <div className="w-full h-full px-3 text-[10px] text-foreground/80 flex items-center truncate" dangerouslySetInnerHTML={{ __html: highlightMarkup(h.value, getStartIdx('header-v', i)) }} />
                           ) : (
                              <input className="w-full h-full bg-transparent outline-none px-3 text-[10px] text-foreground/80 font-mono focus:bg-sky-500/10" value={h.value} onChange={e => handleUpdate('header', i, 'value', e.target.value)} />
                           )}
                        </div>
                        {!readOnly && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity">
                            <X className="size-3.5 text-red-500 cursor-pointer hover:scale-110" onClick={() => handleDeleteRow('header', i)} />
                          </div>
                        )}
                      </div>
                      {isExpanded && subItems.length > 0 && (
                        <div className="flex flex-col bg-sky-500/5 py-1">
                          {subItems.map((si, j) => (
                            <div key={j} className="flex items-center min-h-[22px] px-8 border-l-2 border-sky-500/20 ml-4 mb-0.5 last:mb-0">
                              <span className="text-[9px] text-[var(--accent)] font-bold mr-2 uppercase tracking-tight">{si.k}:</span>
                              <span className="text-[10px] text-foreground/60 truncate italic">{si.v}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`size-6 rounded-sm ${active ? 'text-[var(--accent)] bg-sky-500/10' : 'text-muted-foreground hover:text-foreground hover:hover:bg-muted/50'}`}
            onClick={onClick}
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface HexRowProps {
  start: number
  row: { startIndex: number, offset: string, bytes: number[] }
  selStart: number
  selEnd: number
  editState: { idx: number, val: string, kind: 'hex'|'ascii' } | null
  setEditState: (state: any) => void
  applyEdit: (idx: number, val: string, kind: 'hex'|'ascii') => void
}

const HexRow = memo(({ 
  start, row, selStart, selEnd, editState, setEditState, applyEdit 
}: HexRowProps) => {
  return (
    <div
      className="absolute top-0 left-0 w-full flex items-center px-4 hover:bg-[var(--cyber-accent)]/5 transition-colors border-b border-white/[0.02]"
      style={{ height: `24px`, transform: `translateY(${start}px)` }}
    >
      <span className="cyber-offset w-20 shrink-0 font-mono text-[10px] select-none pointer-events-none">{row.offset}</span>
      
      <div className="flex gap-1 h-full items-center px-4 border-r border-white/5 flex-[3] min-w-0">
        {row.bytes.map((b, i) => {
          const globalIdx = row.startIndex + i
          const isSelected = globalIdx >= selStart && globalIdx <= selEnd
          const isEditing = editState?.idx === globalIdx && editState.kind === 'hex'
          
          if (isEditing) {
             return <input 
               key={i} autoFocus maxLength={2} 
               className="flex-1 min-w-0 text-center bg-[var(--cyber-accent)]/20 text-white outline-none border-b border-[var(--cyber-accent)]"
               value={editState.val}
               onChange={e => setEditState({ ...editState, val: e.target.value })}
               onBlur={e => applyEdit(globalIdx, e.target.value, 'hex')}
               onKeyDown={e => e.key === 'Enter' && applyEdit(globalIdx, (e.target as HTMLInputElement).value, 'hex')}
             />
          }

          return (
            <span 
              key={i}
              data-idx={globalIdx}
              data-kind="hex"
              className={`flex-1 min-w-0 text-center cursor-text ${isSelected ? 'cyber-selected' : b === 0 ? 'text-white/10' : 'text-[var(--cyber-accent)] opacity-80'}`}
            >
              {b.toString(16).padStart(2, '0').toUpperCase()}
            </span>
          )
        })}
        {Array.from({ length: 16 - row.bytes.length }).map((_, i) => (
          <span key={`empty-${i}`} className="flex-1 min-w-0" />
        ))}
      </div>

      <div className="flex gap-0 h-full items-center px-4 flex-1 min-w-0">
        {row.bytes.map((b, i) => {
          const globalIdx = row.startIndex + i
          const isSelected = globalIdx >= selStart && globalIdx <= selEnd
          const char = (b >= 32 && b <= 126) ? String.fromCharCode(b) : '·'
          const isEditing = editState?.idx === globalIdx && editState.kind === 'ascii'

          if (isEditing) {
            return <input 
               key={i} autoFocus maxLength={1} 
               className="flex-1 min-w-0 text-center bg-accent/20 text-white outline-none border-b border-accent h-4 text-[10px]"
               value={editState.val}
               onChange={e => setEditState({ ...editState, val: e.target.value })}
               onBlur={e => applyEdit(globalIdx, e.target.value, 'ascii')}
               onKeyDown={e => e.key === 'Enter' && applyEdit(globalIdx, (e.target as HTMLInputElement).value, 'ascii')}
             />
          }

          return (
            <span
              key={i}
              data-idx={globalIdx}
              data-kind="ascii"
              className={`flex-1 min-w-0 text-center cursor-text text-[10px] transition-all duration-75 ${isSelected ? 'cyber-selected-ascii' : b === 0 ? 'text-white/10' : 'text-white/60 hover:text-accent'}`}
            >
              {char}
            </span>
          )
        })}
        {Array.from({ length: 16 - row.bytes.length }).map((_, i) => (
          <span key={`empty-ascii-${i}`} className="flex-1 min-w-0" />
        ))}
      </div>
    </div>
  )
}, (prev, next) => {
  // custom comparison to limit re-renders
  // Row only needs to re-render if:
  // 1. row data changes
  // 2. start position changes (virtual scroll)
  // 3. selection status of ANY byte in this row changed
  // 4. edit state for this row changed
  if (prev.row !== next.row) return false
  if (prev.start !== next.start) return false
  
  const pStart = prev.selStart, pEnd = prev.selEnd
  const nStart = next.selStart, nEnd = next.selEnd
  const rStart = prev.row.startIndex, rEnd = rStart + 15
  
  // check if selection range overlap with this row changed
  const wasInSelection = (rStart <= pEnd && rEnd >= pStart)
  const isInSelection = (rStart <= nEnd && rEnd >= nStart)
  
  if (wasInSelection !== isInSelection) return false
  // if it's partially in selection, we need to check if bounds moved relative to this row
  if (wasInSelection && isInSelection) {
    if (pStart !== nStart || pEnd !== nEnd) return false
  }

  if (prev.editState !== next.editState) {
    const pIdx = prev.editState?.idx
    const nIdx = next.editState?.idx
    const wasEditingThisRow = pIdx !== undefined && pIdx >= rStart && pIdx <= rEnd
    const isEditingThisRow = nIdx !== undefined && nIdx >= rStart && nIdx <= rEnd
    if (wasEditingThisRow || isEditingThisRow) return false
  }
  
  return true
})

function HexView({ content, onChange, readOnly = true }: { content: string, onChange?: (val: string) => void, readOnly?: boolean }) {
  const bytes = useMemo(() => new TextEncoder().encode(content), [content])
  const [selection, setSelection] = useState<[number, number] | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [editState, setEditState] = useState<{ idx: number, val: string, kind: 'hex'|'ascii' } | null>(null)

  const parentRef = useRef<HTMLDivElement>(null)

  const resolveTarget = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const el = target.closest('[data-idx]') as HTMLElement
    if (!el) return null
    return {
      idx: parseInt(el.dataset.idx || "-1"),
      kind: el.dataset.kind as 'hex' | 'ascii'
    }
  }

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = resolveTarget(e)
    if (target && target.idx >= 0) {
      setSelection([target.idx, target.idx])
      setIsDragging(true)
      if (editState) setEditState(null)
    }
  }

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (isDragging && selection) {
      const target = resolveTarget(e)
      if (target && target.idx >= 0) {
        setSelection([selection[0], target.idx])
      }
    }
  }

  useEffect(() => {
    const onMouseUp = () => setIsDragging(false)
    window.addEventListener('mouseup', onMouseUp)
    return () => window.removeEventListener('mouseup', onMouseUp)
  }, [])

  const handleContainerDoubleClick = (e: React.MouseEvent) => {
    if (readOnly) return
    const target = resolveTarget(e)
    if (target && target.idx >= 0) {
      const val = target.kind === 'hex' ? bytes[target.idx].toString(16).padStart(2, '0').toUpperCase() : String.fromCharCode(bytes[target.idx])
      setEditState({ idx: target.idx, val, kind: target.kind })
    }
  }

  const applyEdit = useCallback((idx: number, finalVal: string, kind: 'hex'|'ascii') => {
    if (!onChange || readOnly) { setEditState(null); return }
    let num = bytes[idx]
    if (kind === 'hex') {
      const parsed = parseInt(finalVal, 16)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 255) num = parsed
    } else {
      if (finalVal.length > 0) num = finalVal.charCodeAt(0)
    }
    const newBytes = new Uint8Array(bytes)
    newBytes[idx] = num
    onChange(new TextDecoder().decode(newBytes))
    setEditState(null)
  }, [onChange, readOnly, bytes])

  const rows = useMemo(() => {
    const r = []
    for (let i = 0; i < bytes.length; i += 16) {
      const chunk = bytes.slice(i, i + 16)
      r.push({
        startIndex: i,
        offset: i.toString(16).padStart(8, '0').toUpperCase(),
        bytes: Array.from(chunk)
      })
    }
    return r
  }, [bytes])

  const selStart = selection ? Math.min(selection[0], selection[1]) : -1
  const selEnd = selection ? Math.max(selection[0], selection[1]) : -1

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24,
    overscan: 20,
  })

  return (
    <div 
      className="flex-1 overflow-auto font-mono text-[11px] bg-[#050508] scrollbar-thin select-none outline-none cyber-scanlines relative" 
      ref={parentRef} 
      tabIndex={0} 
      onMouseDown={handleContainerMouseDown}
      onMouseMove={handleContainerMouseMove}
      onDoubleClick={handleContainerDoubleClick}
      onKeyDown={e => {
        if ((e.key === 'Backspace' || e.key === 'Delete') && selection && !readOnly && onChange) {
            const start = Math.min(selection[0], selection[1])
            const end = Math.max(selection[0], selection[1])
            const newBytes = new Uint8Array(bytes.length - (end - start + 1))
            newBytes.set(bytes.slice(0, start), 0)
            newBytes.set(bytes.slice(end + 1), start)
            onChange(new TextDecoder().decode(newBytes))
            setSelection(null)
        }
    }}>
      <div className="relative w-full" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <HexRow 
            key={virtualRow.index}
            start={virtualRow.start}
            row={rows[virtualRow.index]}
            selStart={selStart}
            selEnd={selEnd}
            editState={editState}
            setEditState={setEditState}
            applyEdit={applyEdit}
          />
        ))}
      </div>
    </div>
  )
}



function TextTabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-full px-3 text-[10px] font-bold uppercase tracking-normal transition-all duration-200 rounded-sm relative group ${active ? 'text-[var(--accent)] bg-sky-500/10' : 'text-muted-foreground/50 hover:text-foreground/80 hover:bg-muted/30'}`}
    >
      {label}
      {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-500" />}
    </button>
  )
}

export const Inspector = memo(function Inspector({
  content,
  url = "",
  className = "",
  label,
  readOnly = true,
  isResponse = false,
  onContentChange,
  onDiscard,
  disabled = false
}: InspectorProps) {
  const [activeTab, setActiveTab] = useState<TabMode>("pretty")
  const [wordWrap, setWordWrap] = useState(false)
  const [showHidden, setShowHidden] = useState(false)
  const [hideBoringHeaders, setHideBoringHeaders] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [searchMatchCount, setSearchMatchCount] = useState(0)
  const [activeSearchMatch, setActiveSearchMatch] = useState(0)
  const [copied, setCopied] = useState(false)
  const [originalContent] = useState(content)
  const [searchUseRegex, setSearchUseRegex] = useState(false)
  const [searchCaseSensitive, setSearchCaseSensitive] = useState(false)
  const [searchWholeWord, setSearchWholeWord] = useState(false)
  const [searchDiacritics, setSearchDiacritics] = useState(false)
  const { sendToRepeater, sendToIterater } = useProxyWebsocket()

  const hasChanges = content !== originalContent

  const handleSaveToFile = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = isResponse ? 'response.txt' : 'request.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [content, isResponse])

  const handleCopy = useCallback(() => {
    let textToCopy = content
    if (activeTab === "hex") {
      const parts = content.split(/\r?\n\r?\n/)
      const bodyPart = parts.length > 1 ? parts.slice(1).join("\n\n") : content
      const encoder = new TextEncoder()
      const bytes = encoder.encode(bodyPart)
      textToCopy = Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
    } else if (activeTab === "headers") {
      // Logic for Inspector expanded items would require state tracking.
      // For now, let's copy the raw content to keep it simple but functional.
      textToCopy = content
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [content, activeTab])

  const navigateSearch = useCallback((dir: number) => {
    if (searchMatchCount === 0) return
    setActiveSearchMatch(prev => (prev + dir + searchMatchCount) % searchMatchCount)
  }, [searchMatchCount])

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      navigateSearch(e.shiftKey ? -1 : 1)
    }
  }, [navigateSearch])

  return (
    <div className={`flex flex-col h-full bg-transparent border-border/40 min-w-0 ${className}`}>
      {/* TOOLBAR */}
      <div className="flex items-center h-8 px-1 bg-background/30 backdrop-blur-md border-b border-border/40 shrink-0 select-none -mt-[1px]">
        {label && <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 px-2 border-r border-border/40 mr-1 shrink-0">{label}</span>}
        <div className={`flex items-center h-full gap-0.5 py-1 ${disabled ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
          <TextTabButton active={activeTab === 'pretty'} onClick={() => setActiveTab('pretty')} label="Pretty" />
          <TextTabButton active={activeTab === 'raw'} onClick={() => setActiveTab('raw')} label="Raw" />
          <TextTabButton active={activeTab === 'hex'} onClick={() => setActiveTab('hex')} label="Hex" />
          <TextTabButton active={activeTab === 'headers'} onClick={() => setActiveTab('headers')} label="Details" />
          <TextTabButton active={activeTab === 'render'} onClick={() => setActiveTab('render')} label="Render" />
        </div>

        <div className={`ml-auto flex items-center h-full px-2 ${disabled ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
          {onDiscard && hasChanges && (
            <TabButton
              active={false}
              onClick={onDiscard}
              icon={<X className="size-3.5 text-red-500" />}
              label="Discard Changes"
            />
          )}

          <div className="flex items-center gap-0.5 h-full">
            {activeTab === 'pretty' && (
              <>
                <TabButton active={hideBoringHeaders} onClick={() => setHideBoringHeaders(!hideBoringHeaders)} icon={<Eye className="size-3.5" />} label="Boring Headers" />
                <TabButton active={wordWrap} onClick={() => setWordWrap(!wordWrap)} icon={<WrapText className="size-3.5" />} label="Line Wrap" />
                <TabButton active={showHidden} onClick={() => setShowHidden(!showHidden)} icon={<Pilcrow className="size-3.5" />} label="Non-printing Characters" />
              </>
            )}
            {activeTab === 'raw' && (
              <>
                <TabButton active={wordWrap} onClick={() => setWordWrap(!wordWrap)} icon={<WrapText className="size-3.5" />} label="Line Wrap" />
                <TabButton active={showHidden} onClick={() => setShowHidden(!showHidden)} icon={<Pilcrow className="size-3.5" />} label="Non-printing Characters" />
              </>
            )}
          </div>

          <div className="w-px h-3 bg-border/40 mx-1 shrink-0" />
          <div className="flex items-center gap-0.5 h-full">
            <TabButton active={showSearch} onClick={() => setShowSearch(!showSearch)} icon={<Search className="size-3.5" />} label="Search" />
            <TabButton active={copied} onClick={handleCopy} icon={copied ? <Check className="size-3.5 text-[var(--accent)]" /> : <Copy className="size-3.5" />} label="Copy" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 ml-0.5">
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={handleCopy} className="gap-2"><Copy className="size-3" /> Copy Content</DropdownMenuItem>
                <DropdownMenuItem onClick={() => sendToRepeater({ request_raw: content, method: content.split(' ')[0], path: content.split(' ')[1], host: '' })} className="gap-2"><Send className="size-3 text-emerald-400" /> Send to Repeater</DropdownMenuItem>
                <DropdownMenuItem onClick={() => sendToIterater({ request_raw: content, method: content.split(' ')[0], path: content.split(' ')[1], host: '' })} className="gap-2"><Send className="size-3 text-[var(--accent)]" /> Send to Iterater</DropdownMenuItem>
                <DropdownMenuItem onClick={handleSaveToFile} className="gap-2"><Download className="size-3" /> Save to File</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-transparent overflow-hidden relative flex flex-col">
        {disabled ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-transparent text-muted-foreground/30 font-mono select-none">
            <pre className="text-[10px] leading-tight text-center">
              {`
      |\\      _,,,---,,_
ZZZzz /, '.\'\`\'    -.  ;-;;,_
     |,4-  ) )-,_. ,\\ (  \`'-'
    '---\'\'(_/--'  \`-'\\_)
                           `}
            </pre>
            <p className="mt-4 text-[9px] uppercase tracking-[0.2em] font-bold opacity-50">No request selected</p>
          </div>
        ) : (
          <>
            {activeTab === 'pretty' && (
              <TextEditor
                code={content}
                isPretty={true}
                wordWrap={wordWrap}
                showHidden={showHidden}
                hideBoringHeaders={hideBoringHeaders}
                readOnly={readOnly}
                searchQuery={showSearch ? searchQuery : ""}
                activeMatchIndex={activeSearchMatch}
                onMatchCountChange={setSearchMatchCount}
                onChange={onContentChange}
              />
            )}
            {activeTab === 'raw' && (
              <TextEditor
                code={content}
                wordWrap={wordWrap}
                showHidden={showHidden}
                readOnly={readOnly}
                searchQuery={showSearch ? searchQuery : ""}
                activeMatchIndex={activeSearchMatch}
                onMatchCountChange={setSearchMatchCount}
                onChange={onContentChange}
              />
            )}
            {activeTab === 'hex' && (
              <HexView 
                content={content} 
                onChange={onContentChange} 
                readOnly={readOnly} 
              />
            )}
            {activeTab === 'headers' && (
              <div className="flex-1 min-h-0 flex flex-col">
                <InspectorTabContent
                  content={content}
                  readOnly={readOnly}
                  showHidden={showHidden}
                  isResponse={isResponse}
                  searchQuery={showSearch ? searchQuery : ""}
                  activeMatchIndex={activeSearchMatch}
                  onMatchCountChange={setSearchMatchCount}
                  onChange={onContentChange}
                />
              </div>
            )}
            {activeTab === 'render' && (
              <div className="flex-1 min-h-0 flex flex-col">
                <RenderView content={content} url={url} />
              </div>
            )}
          </>
        )}
      </div>

      {showSearch && (
        <div className="flex items-center h-10 px-3 border-t border-border/40 bg-[#0A0A0C]/80 backdrop-blur-xl shrink-0 gap-3 shadow-2xl">
          <Search className="size-4 text-[var(--accent)] transition-transform opacity-70" />
          <input
            className="bg-transparent text-xs border-0 outline-none flex-1 font-mono text-foreground placeholder:text-muted-foreground/30 min-w-0"
            placeholder="Search in message..."
            autoFocus
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setActiveSearchMatch(0) }}
            onKeyDown={handleSearchKeyDown}
          />
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[9px] font-mono text-muted-foreground/50 mr-1 tabular-nums">
              {searchMatchCount > 0 ? activeSearchMatch + 1 : 0}/{searchMatchCount}
            </span>
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="size-6 hover:bg-white/5" onClick={() => navigateSearch(-1)}>
                <ChevronUp className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-6 hover:bg-white/5" onClick={() => navigateSearch(1)}>
                <ChevronDown className="size-3.5" />
              </Button>
            </div>
            <div className="w-px h-3 bg-border/40 mx-1" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="size-6 hover:bg-white/5">
                  <Settings2 className="size-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={6} className="w-auto p-3 space-y-2">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold opacity-60 mb-2">Search Options</p>
                <div className="flex items-center gap-2">
                  <Checkbox checked={searchUseRegex} onCheckedChange={(v) => setSearchUseRegex(v === true)} className="scale-[0.8] border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" />
                  <span className="text-[10px]">Regular Expression</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={searchCaseSensitive} onCheckedChange={(v) => setSearchCaseSensitive(v === true)} className="scale-[0.8] border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" />
                  <span className="text-[10px]">Case Sensitive</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={searchWholeWord} onCheckedChange={(v) => setSearchWholeWord(v === true)} className="scale-[0.8] border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" />
                  <span className="text-[10px]">Whole Words</span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={searchDiacritics} onCheckedChange={(v) => setSearchDiacritics(v === true)} className="scale-[0.8] border-muted-foreground/50 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500" />
                  <span className="text-[10px]">Diacritics Sensitive</span>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="size-6 ml-1" onClick={() => { setShowSearch(false); setSearchQuery("") }}>
              <X className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
})

