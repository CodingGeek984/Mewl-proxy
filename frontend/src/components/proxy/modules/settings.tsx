import { useState, useEffect } from "react"
import { useTheme, getAllThemes } from "@/lib/theme"
import { 
  RotateCw, Radio, Lock, Download, RefreshCw, 
  Palette, Type, Info, Keyboard, Cat, Settings2,
  Shield, UploadCloud, Copy, Check
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { MonoInput } from "@/components/proxy/ui/mono-input"

// @ts-ignore
import * as App from "@wailsjs/go/backend/App"

type SettingsSection = "connection" | "ssl" | "matching" | "interface" | "hotkeys" | "about"

function ConnectionSection() {
  const [isRestarting, setIsRestarting] = useState(false)
  const [proxyPort, setProxyPort] = useState<number>(8081)
  const [isApplying, setIsApplying] = useState(false)
  const [appliedMsg, setAppliedMsg] = useState(false)

  useEffect(() => {
    if (App.GetProxySettings) {
      App.GetProxySettings().then((s: any) => {
        if (s && s.port) setProxyPort(Number(s.port))
      })
    }
  }, [])

  const handleApplyPort = async () => {
    setIsApplying(true)
    try {
      if (App.SetProxySettings) {
        await App.SetProxySettings(proxyPort)
        setAppliedMsg(true)
        setTimeout(() => setAppliedMsg(false), 3000)
      }
    } finally {
      setIsApplying(false)
    }
  }

  async function handleRestartProxy() {
    setIsRestarting(true)
    try {
      if (App.RestartProxy) {
        await App.RestartProxy()
      } else {
        await fetch("http://127.0.0.1:8000/api/restart-proxy", { method: "POST" })
      }
    } catch {
      // ignore
    } finally {
      setTimeout(() => setIsRestarting(false), 1500)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Radio className="size-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90">Proxy Listener</h3>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 max-w-lg">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Bind Address</Label>
            <MonoInput defaultValue="127.0.0.1" className="h-9" disabled />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Port</Label>
            <div className="flex gap-2">
              <MonoInput 
                type="number" 
                value={proxyPort} 
                onChange={e => setProxyPort(parseInt(e.target.value))}
                className="h-9 flex-1" 
              />
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest border-sky-500/30 text-[var(--accent)] hover:bg-sky-500/10"
                onClick={handleApplyPort}
                disabled={isApplying}
              >
                {isApplying ? <RotateCw className="size-3 animate-spin mr-2" /> : null}
                {appliedMsg ? "Applied" : "Apply"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-border/20" />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <RotateCw className="size-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90">Service Controls</h3>
        </div>
        <div className="flex flex-col gap-4 max-w-lg">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border/20 bg-muted/5">
            <div>
              <Label className="text-xs font-bold text-foreground/80">Proxy Engine</Label>
              <p className="text-[10px] text-muted-foreground mt-1">Restart the core interceptor daemon</p>
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" 
              onClick={handleRestartProxy} 
              disabled={isRestarting}
            >
              <RefreshCw className={`size-3.5 mr-2 ${isRestarting ? 'animate-spin' : ''}`} />
              {isRestarting ? "Restarting..." : "Restart Engine"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SSLSection() {
  const handleDownloadCA = async () => {
    if (App.GetCACert) {
      const pem = await App.GetCACert()
      const blob = new Blob([pem], { type: 'application/x-x509-ca-cert' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'meowl_ca.crt'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const [caPem, setCaPem] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (App.GetCACert) {
      App.GetCACert().then(setCaPem)
    }
  }, [])

  const handleCopyCA = () => {
    navigator.clipboard.writeText(caPem)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerateCA = async () => {
    if (App.RegenerateCA) {
      if (confirm("Are you sure you want to regenerate the Root CA? This will invalidate existing intercepted traffic signatures.")) {
        await App.RegenerateCA()
        alert("CA regenerated successfully. Please download and re-install it.")
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lock className="size-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90">CA Certificate</h3>
        </div>
        <div className="flex flex-col gap-4 max-w-lg">
          <div className="flex items-center justify-between rounded-lg border border-border/20 p-4 bg-muted/5">
            <div>
              <p className="text-xs font-bold text-foreground/80">Meowl Root CA</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-1">Status: Trusted for Interception</p>
            </div>
            <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-widest text-[var(--accent)] border-sky-500/30">Active</Badge>
          </div>
          <div className="flex gap-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest border-border/40 hover:bg-sky-500/10 hover:text-[var(--accent)]"
              onClick={handleDownloadCA}
            >
              <Download className="size-3.5 mr-2" /> Download CRT
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest border-border/40 hover:bg-sky-500/10 hover:text-[var(--accent)]"
              onClick={handleCopyCA}
            >
              {copied ? <Check className="size-3.5 mr-2 text-emerald-400" /> : <Copy className="size-3.5 mr-2" />}
              {copied ? "Copied" : "Copy PEM"}
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-9 px-4 text-[10px] uppercase font-bold tracking-widest text-red-400 hover:bg-red-500/10 hover:text-red-400"
              onClick={handleRegenerateCA}
            >
              Regenerate
            </Button>
          </div>

          {caPem && (
            <div className="mt-2 group relative">
              <ScrollArea className="h-32 w-full rounded-md border border-border/10 bg-muted/10 p-3 font-mono text-[9px] text-muted-foreground/70 leading-relaxed overflow-hidden">
                <pre>{caPem}</pre>
              </ScrollArea>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge variant="outline" className="text-[8px] bg-background/50 backdrop-blur-sm border-sky-500/30 text-[var(--accent)]">PEM Encoded</Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-border/20" />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="size-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90">TLS Enforcement</h3>
        </div>
        <div className="flex flex-col gap-4 max-w-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground/80">Verify Certificates</Label>
              <p className="text-[10px] text-muted-foreground whitespace-normal">Reject upstream servers with invalid or expired certs</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-xs font-bold text-foreground/80">Minimal TLS 1.2</Label>
              <p className="text-[10px] text-muted-foreground whitespace-normal">Disallow legacy SSL/TLS versions for security</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>
    </div>
  )
}


function InterfaceSection() {
  const { setTheme, theme } = useTheme()
  const allThemes = getAllThemes()
  const [bgUrl, setBgUrl] = useState(() => localStorage.getItem("proxy_bg_url") ?? "")
  const [bgOpacity, setBgOpacity] = useState(() => Number(localStorage.getItem("proxy_bg_opacity") ?? 0.15))
  const [bgDarkness, setBgDarkness] = useState(() => Number(localStorage.getItem("proxy_bg_darkness") ?? 0.6))
  const [previewUrl, setPreviewUrl] = useState(bgUrl)

  function updateBg(url: string, opacity: number, darkness: number) {
    localStorage.setItem("proxy_bg_url", url)
    localStorage.setItem("proxy_bg_opacity", String(opacity))
    localStorage.setItem("proxy_bg_darkness", String(darkness))
    window.dispatchEvent(new CustomEvent("proxy-bg-update"))
  }

  function handleApplyBg() {
    setBgUrl(previewUrl)
    updateBg(previewUrl, bgOpacity, bgDarkness)
  }

  function handleClearBg() {
    setPreviewUrl(""); setBgUrl("")
    updateBg("", bgOpacity, bgDarkness)
  }

  async function handleUploadBg() {
    if (App.SelectImage) {
      const b64 = await App.SelectImage()
      if (b64) {
        setPreviewUrl(b64)
        setBgUrl(b64)
        updateBg(b64, bgOpacity, bgDarkness)
      }
    }
  }

  useEffect(() => { 
    if (bgUrl) updateBg(bgUrl, bgOpacity, bgDarkness) 
  }, [bgOpacity, bgDarkness, bgUrl])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="size-4 text-[var(--accent)]" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90">Visual Interface</h3>
        </div>
        
        <div className="space-y-6 max-w-xl">
          {/* Theme Selection — Premium Cards */}
          <div className="space-y-3">
            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Color Theme</Label>
            <div className="grid grid-cols-5 gap-2">
              {allThemes.map(t => {
                const isActive = theme === t.id
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center transition-all duration-200 group"
                    style={{
                      borderColor: isActive ? t.colors.accent : 'var(--border-default)',
                      background: isActive ? `${t.colors.accentGlow}` : 'var(--surface)',
                      boxShadow: isActive ? `0 0 20px ${t.colors.accentGlow}` : 'none',
                    }}
                  >
                    {/* Color swatch */}
                    <div
                      className="size-8 rounded-lg border transition-transform duration-200 group-hover:scale-110"
                      style={{
                        background: `linear-gradient(135deg, ${t.colors.background} 0%, ${t.colors.accent} 100%)`,
                        borderColor: isActive ? t.colors.accent : 'var(--border-default)',
                        boxShadow: isActive ? `0 0 12px ${t.colors.accentGlow}` : 'none',
                      }}
                    />
                    <div>
                      <p className="text-[10px] font-bold" style={{ color: isActive ? t.colors.accent : 'var(--foreground)' }}>{t.name}</p>
                      <p className="text-[8px] leading-tight" style={{ color: 'var(--foreground-muted)', opacity: 0.7 }}>{t.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <Separator className="bg-border/10" />

          {/* Background Wallpaper */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Background Matrix</Label>
              {bgUrl && (
                <Badge variant="outline" className="text-[8px] uppercase tracking-tighter text-emerald-400 border-emerald-500/30">Active</Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              <MonoInput
                value={previewUrl.startsWith("data:") ? "Local Image Uploaded" : previewUrl}
                onChange={e => setPreviewUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="h-9 flex-1 text-[11px]"
                readOnly={previewUrl.startsWith("data:")}
              />
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 px-3 text-[10px] uppercase font-bold gap-2 border-sky-500/30 text-[var(--accent)] hover:bg-sky-500/10"
                onClick={handleUploadBg}
              >
                <UploadCloud className="size-3.5" />
                Upload
              </Button>
              <Button size="sm" variant="outline" className="h-9 px-3 text-[10px] uppercase font-bold" onClick={handleApplyBg}>Set</Button>
              {bgUrl && <Button size="sm" variant="ghost" className="h-9 px-3 text-[10px] uppercase font-bold text-red-400" onClick={handleClearBg}>Reset</Button>}
            </div>

            {bgUrl && (
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>Intensity (Opacity)</span>
                    <span>{Math.round(bgOpacity * 100)}%</span>
                  </div>
                  <Slider value={[bgOpacity * 100]} min={0} max={100} step={1} onValueChange={([v]) => setBgOpacity(v / 100)} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                    <span>Overlay Darkness</span>
                    <span>{Math.round(bgDarkness * 100)}%</span>
                  </div>
                  <Slider value={[bgDarkness * 100]} min={0} max={100} step={1} onValueChange={([v]) => setBgDarkness(v / 100)} />
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-border/10" />

          {/* Typography */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Type className="size-3.5 text-muted-foreground" />
              <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Global Scaling</Label>
            </div>
            <Select 
              defaultValue="13" 
              onValueChange={v => { 
                document.documentElement.style.fontSize = `${v}px`
                localStorage.setItem("proxy_font_size", v)
              }}
            >
              <SelectTrigger className="h-9 text-xs font-mono border-border/20 bg-muted/5">
                <SelectValue placeholder="Font Size" />
              </SelectTrigger>
              <SelectContent>
                {["11", "12", "13", "14", "15"].map(s => (
                  <SelectItem key={s} value={s} className="text-xs font-mono">{s}px {s === "13" ? "(Default)" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

function HotkeysSection() {
  const hotkeys = [
    { action: "Toggle Sidebar", keys: "Ctrl + B" },
    { action: "Toggle Intercept", keys: "Ctrl + I" },
    { action: "Send Request (Repeater)", keys: "Ctrl + Enter" },
    { action: "Forward Request", keys: "Ctrl + F" },
    { action: "Drop Request", keys: "Ctrl + D" },
    { action: "Send to Repeater", keys: "Ctrl + R" },
    { action: "Search / Filter", keys: "Ctrl + K" },
    { action: "Switch Module", keys: "Ctrl + 1-6" },
    { action: "Toggle Theme", keys: "Ctrl + Shift + T" },
    { action: "New Sandbox", keys: "Ctrl + N" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="size-4 text-[var(--accent)]" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground/90">Keyboard Shortcuts</h3>
      </div>
      <div className="max-w-lg border border-border/20 rounded-lg overflow-hidden bg-muted/5">
        <div className="grid grid-cols-2 bg-muted/20 border-b border-border/20 px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80">
          <span>Action</span>
          <span className="text-right">Shortcut</span>
        </div>
        <div className="divide-y divide-border/10">
          {hotkeys.map((hk) => (
            <div key={hk.action} className="grid grid-cols-2 px-4 py-2.5 items-center hover:bg-accent/10 transition-colors">
              <span className="text-[11px] text-foreground/80">{hk.action}</span>
              <div className="text-right">
                <kbd className="inline-flex items-center gap-1 rounded-sm border border-border/30 bg-muted px-1.5 py-0.5 font-mono text-[9px] text-[var(--accent)]/90 shadow-sm">
                  {hk.keys}
                </kbd>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AboutSection() {
  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-xl bg-sky-500/10 border border-[var(--accent)]/20 flex items-center justify-center">
          <Cat className="size-7 text-[var(--accent)]" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight text-foreground">Meowl</h3>
          <p className="text-xs text-muted-foreground font-medium">Enterprise Interception Ecosystem</p>
        </div>
      </div>

      <div className="grid gap-px rounded-lg border border-border/20 bg-border/10 overflow-hidden shadow-sm">
        <div className="flex justify-between items-center bg-background px-4 py-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Version</span>
          <Badge variant="outline" className="text-[10px] font-mono border-border/40">1.0.0-BETA</Badge>
        </div>
        <div className="flex justify-between items-center bg-background px-4 py-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Build Target</span>
          <span className="text-[11px] font-mono text-foreground/80">Windows-x64-Wails</span>
        </div>
        <div className="flex justify-between items-center bg-background px-4 py-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Frontend Engine</span>
          <span className="text-[11px] font-mono text-foreground/80">React 18 / Tailwind v3</span>
        </div>
        <div className="flex justify-between items-center bg-background px-4 py-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">Backend Daemon</span>
          <span className="text-[11px] font-mono text-foreground/80">Python 3.12 (Twisted/Asy)</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
          "The fastest cat in the network stack."
        </p>
        <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
          Designed for security professionals and bug bounty hunters who demand speed and precision. 
          Meowl provides high-performance traffic interception with a minimalist, hacker-first aesthetic.
        </p>
      </div>

      <div className="pt-4 flex gap-4">
        <Button size="sm" variant="link" className="h-auto p-0 text-[10px] text-[var(--accent)] uppercase font-bold tracking-widest">Documentation</Button>
        <Button size="sm" variant="link" className="h-auto p-0 text-[10px] text-[var(--accent)] uppercase font-bold tracking-widest">Github</Button>
        <Button size="sm" variant="link" className="h-auto p-0 text-[10px] text-[var(--accent)] uppercase font-bold tracking-widest">Changelog</Button>
      </div>
    </div>
  )
}

export function SettingsModule() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("connection")

  const sections: { id: SettingsSection; label: string; icon: any }[] = [
    { id: "connection", label: "Connection", icon: Radio },
    { id: "ssl", label: "SSL / TLS", icon: Lock },
    { id: "interface", label: "Appearance", icon: Palette },
    { id: "hotkeys", label: "Hotkeys", icon: Keyboard },
    { id: "about", label: "About", icon: Info },
  ]

  return (
    <CyberPanel className="flex h-full overflow-hidden">
      <div className="flex w-52 shrink-0 flex-col border-r border-border/20 bg-muted/5">
        <div className="p-4 border-b border-border/20">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
            <Settings2 className="size-3" /> System Config
          </h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="flex flex-col p-2 gap-1">
            {sections.map((sec) => (
              <button
                key={sec.id}
                className={`flex items-center gap-3 px-3 py-2 text-left rounded-md transition-all group ${
                  activeSection === sec.id 
                    ? "bg-sky-500/10 text-[var(--accent)] font-bold" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground/80"
                }`}
                onClick={() => setActiveSection(sec.id)}
              >
                <sec.icon className={`size-3.5 ${activeSection === sec.id ? "text-[var(--accent)]" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`} />
                <span className="text-[11px] tracking-wide">{sec.label}</span>
                {activeSection === sec.id && (
                  <div className="ml-auto size-1 rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <ScrollArea className="flex-1 bg-background/30">
        <div className="p-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-xl font-bold tracking-tight text-foreground/90 uppercase">
              {sections.find(s => s.id === activeSection)?.label}
            </h1>
            <p className="text-xs text-muted-foreground mt-2 border-l-2 border-sky-500/30 pl-3">
              Configure your environment and service parameters.
            </p>
          </div>
          
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeSection === "connection" && <ConnectionSection />}
            {activeSection === "ssl" && <SSLSection />}
            {activeSection === "interface" && <InterfaceSection />}
            {activeSection === "hotkeys" && <HotkeysSection />}
            {activeSection === "about" && <AboutSection />}
          </div>
        </div>
      </ScrollArea>
    </CyberPanel>
  )
}
