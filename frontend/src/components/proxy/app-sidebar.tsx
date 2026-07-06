import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  FolderTree,
  Network,
  Repeat2,
  Bomb,
  Puzzle,
  Settings,
  Cat,
  Shield,
  ScrollText,
  Braces,
  Columns3,
  KeyRound,
  Terminal,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export type ModuleId =
  | "dashboard"
  | "map"
  | "proxy"
  | "intercept"
  | "history"
  | "repeater"
  | "intruder"
  | "decoder"
  | "comparer"
  | "extensions"
  | "certificates"
  | "logs"
  | "settings"

const DEFAULT_MODULES: { id: ModuleId; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "proxy", label: "Proxy", icon: Network },
  { id: "intercept", label: "Intercept", icon: Shield },
  { id: "history", label: "HTTP History", icon: ScrollText },
  { id: "repeater", label: "Repeater", icon: Repeat2 },
  { id: "intruder", label: "Intruder", icon: Bomb },
  { id: "decoder", label: "Decoder", icon: Braces },
  { id: "comparer", label: "Comparer", icon: Columns3 },
  { id: "extensions", label: "Extensions", icon: Puzzle },
  { id: "certificates", label: "Certificates", icon: KeyRound },
  { id: "logs", label: "Logs", icon: Terminal },
  { id: "map", label: "Target Map", icon: FolderTree },
]

const FOOTER_MODULES: { id: ModuleId; label: string; icon: any }[] = [
  { id: "extensions", label: "Extensions", icon: Puzzle },
  { id: "settings", label: "Settings", icon: Settings },
]

interface AppSidebarProps {
  activeModule: ModuleId
  onModuleChange: (id: ModuleId) => void
}

export function AppSidebar({ activeModule, onModuleChange }: AppSidebarProps) {
  const [modules, setModules] = useState(DEFAULT_MODULES)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)

  // Load saved order
  useEffect(() => {
    const saved = localStorage.getItem("meowl_sidebar_order")
    if (saved) {
      try {
        const order = JSON.parse(saved) as ModuleId[]
        const sorted = [...DEFAULT_MODULES].sort((a, b) => {
          const ia = order.indexOf(a.id)
          const ib = order.indexOf(b.id)
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        })
        setModules(sorted)
      } catch (e) { console.error("Failed to load sidebar order", e) }
    }
  }, [])

  const saveOrder = (newModules: typeof DEFAULT_MODULES) => {
    localStorage.setItem("meowl_sidebar_order", JSON.stringify(newModules.map(m => m.id)))
  }

  const handleDragStart = (idx: number) => setDraggedIdx(idx)

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggedIdx === null || draggedIdx === idx) return
    const newModules = [...modules]
    const item = newModules.splice(draggedIdx, 1)[0]
    newModules.splice(idx, 0, item)
    setModules(newModules)
    setDraggedIdx(idx)
  }

  const handleDragEnd = () => {
    setDraggedIdx(null)
    saveOrder(modules)
  }

  return (
    <Sidebar collapsible="none" className="top-8 h-[calc(100vh-32px)] w-[64px] select-none"
      style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      <SidebarHeader className="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="icon"
              className="mx-auto size-10 transition-all duration-300 group/meowl-header relative overflow-hidden"
              tooltip="Meowl"
              style={{ borderRadius: '14px', background: 'linear-gradient(135deg, rgba(122,162,247,0.18), rgba(187,154,247,0.14))', border: '1px solid rgba(122,162,247,0.24)' }}
            >
              <Cat className="size-5 text-[var(--accent)]" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {modules.map((mod, idx) => {
                const isActive = activeModule === mod.id
                return (
                  <SidebarMenuItem
                    key={mod.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`transition-all duration-200 ${draggedIdx === idx ? 'opacity-20 cursor-grabbing' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onModuleChange(mod.id)}
                      tooltip={mod.label}
                      size="icon"
                      className="mx-auto size-10 transition-all duration-200 group/btn relative overflow-hidden"
                      style={{
                        borderRadius: '12px',
                        ...(isActive ? {
                          background: 'linear-gradient(135deg, rgba(187,154,247,0.25), rgba(157,124,216,0.10))',
                          boxShadow: `0 0 20px rgba(187,154,247,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
                          border: '1px solid rgba(187,154,247,0.4)',
                        } : {})
                      }}
                    >
                      {/* Active indicator bar */}
                      <div
                        className="absolute inset-y-2 left-0 w-[3px] transition-all duration-300"
                        style={{
                          background: 'var(--accent)',
                          opacity: isActive ? 1 : 0,
                          borderRadius: '0 999px 999px 0',
                          boxShadow: isActive ? '0 0 8px var(--accent-glow)' : 'none',
                        }}
                      />
                      <mod.icon
                        className="size-4 transition-all duration-200"
                        style={{
                          color: isActive ? 'var(--accent)' : 'var(--foreground-muted)',
                        }}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
      </SidebarContent>

      <SidebarFooter className="px-2 pb-3">
        <SidebarMenu className="gap-1">
          {FOOTER_MODULES.map((mod) => {
            const isActive = activeModule === mod.id
            return (
          <SidebarMenuItem key={mod.id}>
            <SidebarMenuButton
              isActive={isActive}
              onClick={() => onModuleChange(mod.id)}
              tooltip={mod.label}
              size="icon"
              className="mx-auto size-10 transition-all duration-200"
              style={{
                borderRadius: '12px',
                ...(isActive ? {
                  background: 'var(--accent-glow)',
                } : {})
              }}
            >
              <mod.icon className="size-4" style={{ color: isActive ? 'var(--accent)' : 'var(--foreground-muted)' }} />
            </SidebarMenuButton>
          </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
