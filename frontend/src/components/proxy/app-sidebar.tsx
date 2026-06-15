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
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"

export type ModuleId = "dashboard" | "map" | "proxy" | "repeater" | "iterator" | "extensions" | "settings"

const DEFAULT_MODULES: { id: ModuleId; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map", label: "Map", icon: FolderTree },
  { id: "proxy", label: "Proxy", icon: Network },
  { id: "repeater", label: "Repeater", icon: Repeat2 },
  { id: "iterator", label: "Iterator", icon: Bomb },
  { id: "extensions", label: "Extensions", icon: Puzzle },
]

interface AppSidebarProps {
  activeModule: ModuleId
  onModuleChange: (id: ModuleId) => void
}

export function AppSidebar({ activeModule, onModuleChange }: AppSidebarProps) {
  const [modules, setModules] = useState(DEFAULT_MODULES)
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null)
  const { toggleSidebar, state } = useSidebar()

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

  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="top-8 h-[calc(100vh-32px)] select-none"
      style={{ background: 'var(--background-elevated)', borderRight: '1px solid var(--border-default)' }}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="transition-all duration-300 group/meowl-header relative overflow-hidden"
              tooltip="Meowl"
              style={{ borderRadius: '10px' }}
            >
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-xl transition-all duration-300"
                style={{
                  background: 'var(--accent-glow)',
                  color: 'var(--accent)',
                  boxShadow: '0 0 20px var(--accent-glow)'
                }}
              >
                <Cat className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight ml-2 truncate group-data-[collapsible=icon]:hidden">
                <span className="truncate font-black tracking-tight" style={{ color: 'var(--foreground)' }}>Meowl</span>
                <span className="truncate text-[10px] uppercase tracking-widest" style={{ color: 'var(--foreground-muted)', opacity: 0.6 }}>v1.0.0-beta</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel style={{ color: 'var(--foreground-muted)', opacity: 0.5 }}>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
                      className="transition-all duration-200 group/btn relative overflow-hidden"
                      style={{
                        borderRadius: '8px',
                        ...(isActive ? {
                          background: 'var(--accent-glow)',
                          boxShadow: `0 0 12px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.06)`,
                        } : {})
                      }}
                    >
                      {/* Active indicator bar */}
                      <div
                        className="absolute inset-y-0 left-0 w-[2px] transition-all duration-300"
                        style={{
                          background: 'var(--accent)',
                          opacity: isActive ? 1 : 0,
                          borderRadius: '0 2px 2px 0',
                          boxShadow: isActive ? '0 0 8px var(--accent-glow)' : 'none',
                        }}
                      />
                      <mod.icon
                        className="size-4 transition-all duration-200"
                        style={{
                          color: isActive ? 'var(--accent)' : 'var(--foreground-muted)',
                        }}
                      />
                      <span
                        className="transition-all duration-200"
                        style={{
                          color: isActive ? 'var(--accent)' : 'var(--foreground-muted)',
                          fontWeight: isActive ? 600 : 400,
                        }}
                      >{mod.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={toggleSidebar}
              tooltip={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="transition-all duration-200 group/toggle"
              style={{ borderRadius: '8px' }}
            >
              {isCollapsed
                ? <ChevronsRight className="size-4" style={{ color: 'var(--foreground-muted)' }} />
                : <ChevronsLeft className="size-4" style={{ color: 'var(--foreground-muted)' }} />
              }
              <span style={{ color: 'var(--foreground-muted)' }}>Collapse</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeModule === "settings"}
              onClick={() => onModuleChange("settings")}
              tooltip="Settings"
              className="transition-all duration-200"
              style={{
                borderRadius: '8px',
                ...(activeModule === "settings" ? {
                  background: 'var(--accent-glow)',
                } : {})
              }}
            >
              <Settings className="size-4" style={{ color: activeModule === "settings" ? 'var(--accent)' : 'var(--foreground-muted)' }} />
              <span style={{ color: activeModule === "settings" ? 'var(--accent)' : 'var(--foreground-muted)' }}>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
