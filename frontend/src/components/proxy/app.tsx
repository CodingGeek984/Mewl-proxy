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
import { WebSocketProvider } from "@/lib/proxy-store"

const moduleIcons: Record<ModuleId, typeof LayoutDashboard | typeof Cat> = {
  dashboard: LayoutDashboard,
  map: Target,
  proxy: Network,
  repeater: Repeat2,
  iterator: Zap,
  extensions: Puzzle,
  settings: Settings,
}

const moduleLabels: Record<ModuleId, string> = {
  dashboard: "Dashboard",
  map: "Map",
  proxy: "Proxy",
  repeater: "Repeater",
  iterator: "Iterator",
  extensions: "Extensions",
  settings: "Settings",
}

import { WindowControls } from "@/components/proxy/window-controls"
import { useTheme } from "@/lib/theme"

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
      {/* Ambient Background — Dark themes only */}
      {isDark && !hasBg && (
        <div className="ambient-bg">
          <div className="ambient-blob ambient-blob-1" />
          <div className="ambient-blob ambient-blob-2" />
          <div className="ambient-blob ambient-blob-3" />
        </div>
      )}

      {/* Noise Texture Overlay */}
      {isDark && <div className="noise-overlay" />}

      {/* Window Border */}
      <div className="meowl-window-border active" />

      {/* Custom Titlebar — Frosted Glass */}
      <div className="custom-titlebar flex items-center shrink-0 h-8 z-50 select-none">
        <div className="flex items-center gap-2 px-3 no-drag pointer-events-none">
          <Cat className="size-3.5" style={{ color: 'var(--accent)' }} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--foreground-muted)' }}>Meowl</span>
        </div>

        {/* Module Indicator — Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
          <ActiveIcon className="size-3" style={{ color: 'var(--accent)', opacity: 0.5 }} />
          <span className="text-[9px] uppercase tracking-[0.2em] font-medium" style={{ color: 'var(--foreground-muted)', opacity: 0.6 }}>{moduleLabels[activeModule]}</span>
        </div>

        <WindowControls />
      </div>

      <SidebarProvider defaultOpen={false}>
        <AppSidebar activeModule={activeModule} onModuleChange={setActiveModule} />
        <SidebarInset className={`flex flex-col h-full overflow-hidden ${hasBg ? 'bg-transparent' : ''}`}
          style={{ background: hasBg ? 'transparent' : 'var(--background-base)' }}
        >
          {/* Module content */}
          <div className="flex-1 overflow-hidden relative z-10">
            {activeModule === "dashboard" && <DashboardModule />}
            {activeModule === "map" && <MapModule />}
            {activeModule === "proxy" && <ProxyModule />}
            {activeModule === "repeater" && <RepeaterModule />}
            {activeModule === "iterator" && <IteratorModule />}
            {activeModule === "extensions" && <ExtensionsModule />}
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
