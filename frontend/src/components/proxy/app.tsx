import { useState, useEffect, useCallback } from "react"
import {
  LayoutDashboard,
  Target,
  Network,
  Repeat2,
  Zap,
  Puzzle,
  Settings,
  Cat,
  Shield,
  Search,
  Bell,
  ChevronDown,
  Radio,
  Moon,
  Sun,
  Braces,
  Columns3,
  ScrollText,
  KeyRound,
} from "lucide-react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar, type ModuleId } from "@/components/proxy/app-sidebar"
import { StatusBar } from "@/components/proxy/status-bar"
import { DashboardModule } from "@/components/proxy/modules/dashboard"
import { MapModule } from "@/components/proxy/modules/target"
import { ProxyModule } from "@/components/proxy/modules/proxy"
import { RepeaterModule } from "@/components/proxy/modules/repeater"
import { IteratorModule } from "@/components/proxy/modules/iterator"
import { ExtensionsModule } from "@/components/proxy/modules/extensions"
import { SettingsModule } from "@/components/proxy/modules/settings"
import { DecoderModule } from "@/components/proxy/modules/decoder"
import { ComparerModule } from "@/components/proxy/modules/comparer"
import { CertificatesModule } from "@/components/proxy/modules/certificates"
import { LogsModule } from "@/components/proxy/modules/logs"
import { WebSocketProvider } from "@/lib/proxy-store"

const moduleIcons: Record<ModuleId, typeof LayoutDashboard | typeof Cat> = {
  dashboard: LayoutDashboard,
  map: Target,
  proxy: Network,
  intercept: Shield,
  history: ScrollText,
  repeater: Repeat2,
  intruder: Zap,
  decoder: Braces,
  comparer: Columns3,
  extensions: Puzzle,
  certificates: KeyRound,
  logs: ScrollText,
  settings: Settings,
}

const moduleLabels: Record<ModuleId, string> = {
  dashboard: "Dashboard",
  map: "Map",
  proxy: "Proxy",
  intercept: "Intercept",
  history: "HTTP History",
  repeater: "Repeater",
  intruder: "Intruder",
  decoder: "Decoder",
  comparer: "Comparer",
  extensions: "Extensions",
  certificates: "Certificates",
  logs: "Logs",
  settings: "Settings",
}

import { WindowControls } from "@/components/proxy/window-controls"
import { useTheme } from "@/lib/theme"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useProxyWebsocket } from "@/lib/proxy-store"

function AppTopBar({ activeModule, onModuleChange }: { activeModule: ModuleId; onModuleChange: (module: ModuleId) => void }) {
  const { isConnected, requests, telemetry } = useProxyWebsocket()
  const { theme, setTheme } = useTheme()
  const isDark = theme !== "daylight"

  return (
    <div className="app-topbar no-drag">
      <div className="flex min-w-0 items-center gap-3">
        <div className="app-logo-mark">
          <Cat className="size-4" />
        </div>
        <div className="hidden min-w-0 flex-col xl:flex">
          <div className="text-[11px] font-semibold tracking-wide text-[var(--foreground)]">Meowl Proxy</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Professional interception suite</div>
        </div>
        <button className="topbar-pill min-w-[150px] justify-between">
          <span className="truncate">Default Project</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
        <div className="topbar-pill hidden max-w-[360px] xl:flex">
          <Target className="size-3 text-[var(--status-info)]" />
          <span className="truncate font-mono">Target: all traffic</span>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center px-3">
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[var(--foreground-muted)]" />
          <Input
            className="h-8 rounded-[10px] border-[var(--border-default)] bg-[var(--surface)] pl-9 pr-3 text-xs text-[var(--foreground)] shadow-inner placeholder:text-[var(--foreground-muted)]/60"
            placeholder="Search history, hosts, headers, bodies..."
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className={`connection-chip ${isConnected ? "is-online" : "is-offline"}`}>
          <span className="size-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
          <span className="hidden font-mono opacity-60 2xl:inline">{telemetry?.rps ?? 0} r/s</span>
        </div>
        <button className="topbar-icon" title="Proxy listener" onClick={() => onModuleChange("proxy")}>
          <Radio className="size-4" />
        </button>
        <button className="topbar-icon" title={`${requests.length} captured requests`} onClick={() => onModuleChange("history")}>
          <ScrollText className="size-4" />
        </button>
        <button className="topbar-icon" title="Notifications">
          <Bell className="size-4" />
        </button>
        <button
          className="topbar-icon"
          title="Toggle theme"
          onClick={() => setTheme(isDark ? "daylight" : "midnight")}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </button>
        <Button variant="ghost" size="icon" className="topbar-icon" onClick={() => onModuleChange("settings")}>
          <Settings className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function PlaceholderModule({ icon: Icon, title, detail }: { icon: typeof Shield; title: string; detail: string }) {
  return (
    <div className="module-canvas">
      <div className="empty-workspace">
        <Icon className="size-10 text-[var(--accent)]" />
        <div>
          <h2>{title}</h2>
          <p>{detail}</p>
        </div>
      </div>
    </div>
  )
}

function ProxyAppContent() {
  const [activeModule, setActiveModule] = useState<ModuleId>("proxy")
  const ActiveIcon = moduleIcons[activeModule]
  const { theme } = useTheme()

  const [hasBg, setHasBg] = useState(false)
  const isDark = theme !== 'daylight'

  const applyBg = useCallback(() => {
    const url = localStorage.getItem("proxy_bg_url") || ""
    const opacity = Number(localStorage.getItem("proxy_bg_opacity") || 0.15)
    const darkness = Number(localStorage.getItem("proxy_bg_darkness") || 0.6)

    const STYLE_ID = "proxy-bg-style"
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!el) {
      el = document.createElement("style")
      el.id = STYLE_ID
      document.head.appendChild(el)
    }

    if (url) {
      el.textContent = `
        body::before {
          content: '';
          position: fixed; inset: 0; z-index: -10;
          background-image: url(${JSON.stringify(url)});
          background-size: cover; background-position: center;
          background-attachment: fixed;
          opacity: ${opacity};
          pointer-events: none;
        }
        body::after {
          content: '';
          position: fixed; inset: 0; z-index: -10;
          background: rgba(0,0,0,${darkness});
          pointer-events: none;
        }
        #root, body { background: transparent !important; }
      `
      setHasBg(true)
    } else {
      el.textContent = ""
      setHasBg(false)
    }
  }, [])

  useEffect(() => {
    applyBg()
    window.addEventListener("proxy-bg-update", applyBg)
    return () => window.removeEventListener("proxy-bg-update", applyBg)
  }, [applyBg])

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden relative proxy-root-container ${hasBg ? 'proxy-has-bg bg-transparent' : ''}`}
      style={{ background: hasBg ? 'transparent' : 'var(--background-base)' }}
    >
      {isDark && !hasBg && <div className="tokyo-grid-bg" />}

      {/* Noise Texture Overlay */}
      {isDark && <div className="noise-overlay" />}

      {/* Window Border */}
      <div className="meowl-window-border active" />

      <div className="custom-titlebar flex items-center shrink-0 h-8 z-50 select-none px-2 relative">
        <div className="flex items-center h-full">
          <WindowControls />
        </div>

        {/* Title — Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <span className="text-[11px] font-semibold tracking-wide text-[var(--foreground)]">Meowl Proxy</span>
        </div>
      </div>

      <SidebarProvider defaultOpen={false}>
        <AppSidebar activeModule={activeModule} onModuleChange={setActiveModule} />
        <SidebarInset className={`flex flex-col h-full overflow-hidden ${hasBg ? 'bg-transparent' : ''}`}
          style={{ background: hasBg ? 'transparent' : 'var(--background-base)' }}
        >
          <AppTopBar activeModule={activeModule} onModuleChange={setActiveModule} />

          <div className="flex-1 overflow-hidden relative z-10">
            {activeModule === "dashboard" && <DashboardModule />}
            {activeModule === "map" && <MapModule />}
            {activeModule === "proxy" && <ProxyModule key="proxy-overview" defaultTab="overview" />}
            {activeModule === "history" && <ProxyModule key="proxy-history" defaultTab="history" />}
            {activeModule === "intercept" && <ProxyModule key="proxy-intercept" defaultTab="intercept" />}
            {activeModule === "repeater" && <RepeaterModule />}
            {activeModule === "intruder" && <IteratorModule />}
            {activeModule === "decoder" && <DecoderModule />}
            {activeModule === "comparer" && <ComparerModule />}
            {activeModule === "extensions" && <ExtensionsModule />}
            {activeModule === "certificates" && <CertificatesModule />}
            {activeModule === "logs" && <LogsModule />}
            {activeModule === "settings" && <SettingsModule />}
          </div>

          {/* Status bar */}
          <StatusBar />
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

export function ProxyApp() {
  return (
    <WebSocketProvider>
      <ProxyAppContent />
    </WebSocketProvider>
  )
}
