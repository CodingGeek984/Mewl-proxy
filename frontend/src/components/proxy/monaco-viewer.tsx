import Editor, { useMonaco } from "@monaco-editor/react"
import { useEffect, useState } from "react"
import prettier from "prettier/standalone"
import * as babelPlugin from "prettier/plugins/babel"
import * as estreePlugin from "prettier/plugins/estree"

interface MonacoViewerProps {
    content: string
    readOnly?: boolean
    language?: string
    wordWrap?: boolean
    isPretty?: boolean
    className?: string
    onChange?: (val: string | undefined) => void
    onMount?: (editor: any, monaco: any) => void
}

export function MonacoViewer({
    content,
    readOnly = true,
    language = "plaintext",
    wordWrap = false,
    isPretty = false,
    className = "",
    onChange,
    onMount
}: MonacoViewerProps) {
    const monaco = useMonaco()
    const [displayContent, setDisplayContent] = useState(content)

    useEffect(() => {
        if (monaco) {
            monaco.editor.defineTheme("cyber-strict", {
                base: "vs-dark",
                inherit: true,
                rules: [
                    { token: "string.key.json", foreground: "38bdf8" }, // [var(--accent)]
                    { token: "string.value.json", foreground: "34d399" }, // emerald-400
                    { token: "number", foreground: "c084fc" }, // purple-400
                    { token: "keyword", foreground: "fbbf24" }, // amber-400
                ],
                colors: {
                    "editor.background": "#00000000", // Transparent for our UI
                    "editor.lineHighlightBackground": "#0ea5e91a", // sky-500/10
                    "editorLineNumber.foreground": "#52525b", // zinc-600
                    "editorIndentGuide.background": "#27272a", // zinc-800
                }
            })
            monaco.editor.setTheme("cyber-strict")
        }
    }, [monaco])

    // Try to prettier-format if requested
    useEffect(() => {
        if (isPretty && content) {
            const format = async () => {
                try {
                    // Attempt to format body if it's JSON
                    const parts = content.split(/\r?\n\r?\n/)
                    if (parts.length > 1) {
                        const headArr = parts[0]
                        const bodyArr = parts.slice(1).join("\n\n")
                        if (bodyArr.trim().startsWith("{") || bodyArr.trim().startsWith("[")) {
                            const formattedBody = await prettier.format(bodyArr, {
                                parser: "json",
                                plugins: [babelPlugin, estreePlugin],
                                printWidth: 60,
                            })
                            setDisplayContent(headArr + "\n\n" + formattedBody.trim())
                            return
                        }
                    }
                } catch { }
            }
            format()
        } else {
            setDisplayContent(content)
        }
    }, [content, isPretty])

    // Simple auto-detect language based on content (mostly for HTTP responses)
    const detectLanguage = () => {
        if (language !== "plaintext") return language
        if (displayContent.startsWith("HTTP/1.") || displayContent.startsWith("GET ") || displayContent.startsWith("POST ")) return "http"
        if (displayContent.trim().startsWith("{") || displayContent.trim().startsWith("[")) return "json"
        if (displayContent.trim().startsWith("<")) return "html"
        return "plaintext"
    }

    return (
        <div className={`w-full h-full relative ${className}`}>
            <Editor
                value={displayContent}
                language={detectLanguage()}
                theme="cyber-strict"
                onChange={onChange}
                onMount={onMount}
                options={{
                    readOnly,
                    wordWrap: wordWrap ? "on" : "off",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 11,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineHeight: 18,
                    renderWhitespace: "selection",
                    contextmenu: false,
                    scrollbar: {
                        verticalScrollbarSize: 8,
                        horizontalScrollbarSize: 8,
                    },
                    padding: { top: 8, bottom: 8 },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    matchBrackets: "never",
                    renderLineHighlight: "all",
                    automaticLayout: true,
                }}
                loading={<div className="flex items-center justify-center h-full text-[10px] text-muted-foreground/30 font-mono">LOADING EDITOR...</div>}
            />
        </div>
    )
}
