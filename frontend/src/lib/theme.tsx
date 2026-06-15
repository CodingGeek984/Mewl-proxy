"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

export type Theme = 'midnight' | 'aurora' | 'sakura' | 'solar' | 'daylight'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const themeConfigs: Record<Theme, {
  name: string
  description: string
  isDark: boolean
  colors: {
    accent: string
    accentBright: string
    accentGlow: string
    background: string
    backgroundDeep: string
    backgroundBase: string
    backgroundElevated: string
    foreground: string
    foregroundMuted: string
    surface: string
    surfaceHover: string
    border: string
    borderHover: string
    borderAccent: string
    card: string
    muted: string
    input: string
    sidebar: string
    sidebarAccent: string
    statusSuccess: string
    statusInfo: string
    statusWarning: string
    statusError: string
    methodGet: string
    methodPost: string
    methodPut: string
    methodDelete: string
    methodPatch: string
    methodOptions: string
  }
}> = {
  midnight: {
    name: 'Midnight',
    description: 'Deep indigo — cinematic dark',
    isDark: true,
    colors: {
      accent: '#5E6AD2',
      accentBright: '#6872D9',
      accentGlow: 'rgba(94,106,210,0.30)',
      background: '#0A0A0C',
      backgroundDeep: '#020203',
      backgroundBase: '#050506',
      backgroundElevated: '#0A0A0C',
      foreground: '#EDEDEF',
      foregroundMuted: '#8A8F98',
      surface: 'rgba(255,255,255,0.05)',
      surfaceHover: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.06)',
      borderHover: 'rgba(255,255,255,0.10)',
      borderAccent: 'rgba(94,106,210,0.30)',
      card: '#111114',
      muted: '#141417',
      input: '#0F0F12',
      sidebar: '#0A0A0C',
      sidebarAccent: 'rgba(255,255,255,0.05)',
      statusSuccess: '#4ADE80',
      statusInfo: '#818CF8',
      statusWarning: '#FBBF24',
      statusError: '#F87171',
      methodGet: '#4ADE80',
      methodPost: '#818CF8',
      methodPut: '#FBBF24',
      methodDelete: '#F87171',
      methodPatch: '#A78BFA',
      methodOptions: '#8A8F98',
    }
  },
  aurora: {
    name: 'Aurora',
    description: 'Emerald glow — hacker feel',
    isDark: true,
    colors: {
      accent: '#10B981',
      accentBright: '#34D399',
      accentGlow: 'rgba(16,185,129,0.25)',
      background: '#070A09',
      backgroundDeep: '#020303',
      backgroundBase: '#050706',
      backgroundElevated: '#0A0D0C',
      foreground: '#E2F0E8',
      foregroundMuted: '#7A9A88',
      surface: 'rgba(16,185,129,0.04)',
      surfaceHover: 'rgba(16,185,129,0.08)',
      border: 'rgba(16,185,129,0.10)',
      borderHover: 'rgba(16,185,129,0.18)',
      borderAccent: 'rgba(16,185,129,0.30)',
      card: '#0C100F',
      muted: '#0E1210',
      input: '#0A0E0C',
      sidebar: '#070A09',
      sidebarAccent: 'rgba(16,185,129,0.08)',
      statusSuccess: '#4ADE80',
      statusInfo: '#34D399',
      statusWarning: '#FBBF24',
      statusError: '#F87171',
      methodGet: '#4ADE80',
      methodPost: '#34D399',
      methodPut: '#FBBF24',
      methodDelete: '#F87171',
      methodPatch: '#A78BFA',
      methodOptions: '#7A9A88',
    }
  },
  sakura: {
    name: 'Sakura',
    description: 'Vibrant pink — expressive',
    isDark: true,
    colors: {
      accent: '#EC4899',
      accentBright: '#F472B6',
      accentGlow: 'rgba(236,72,153,0.25)',
      background: '#0C070A',
      backgroundDeep: '#030203',
      backgroundBase: '#060406',
      backgroundElevated: '#0C080B',
      foreground: '#F0E2EA',
      foregroundMuted: '#9A7A8A',
      surface: 'rgba(236,72,153,0.04)',
      surfaceHover: 'rgba(236,72,153,0.08)',
      border: 'rgba(236,72,153,0.10)',
      borderHover: 'rgba(236,72,153,0.18)',
      borderAccent: 'rgba(236,72,153,0.30)',
      card: '#110C10',
      muted: '#120E11',
      input: '#0F0A0E',
      sidebar: '#0C070A',
      sidebarAccent: 'rgba(236,72,153,0.08)',
      statusSuccess: '#4ADE80',
      statusInfo: '#F472B6',
      statusWarning: '#FBBF24',
      statusError: '#F87171',
      methodGet: '#4ADE80',
      methodPost: '#F472B6',
      methodPut: '#FBBF24',
      methodDelete: '#F87171',
      methodPatch: '#A78BFA',
      methodOptions: '#9A7A8A',
    }
  },
  solar: {
    name: 'Solar',
    description: 'Warm amber — golden glow',
    isDark: true,
    colors: {
      accent: '#F59E0B',
      accentBright: '#FBBF24',
      accentGlow: 'rgba(245,158,11,0.25)',
      background: '#0C0A07',
      backgroundDeep: '#030302',
      backgroundBase: '#060504',
      backgroundElevated: '#0C0B08',
      foreground: '#F0EAE2',
      foregroundMuted: '#9A8E7A',
      surface: 'rgba(245,158,11,0.04)',
      surfaceHover: 'rgba(245,158,11,0.08)',
      border: 'rgba(245,158,11,0.10)',
      borderHover: 'rgba(245,158,11,0.18)',
      borderAccent: 'rgba(245,158,11,0.30)',
      card: '#110F0C',
      muted: '#12100E',
      input: '#0F0D0A',
      sidebar: '#0C0A07',
      sidebarAccent: 'rgba(245,158,11,0.08)',
      statusSuccess: '#4ADE80',
      statusInfo: '#FBBF24',
      statusWarning: '#FBBF24',
      statusError: '#F87171',
      methodGet: '#4ADE80',
      methodPost: '#FBBF24',
      methodPut: '#FB923C',
      methodDelete: '#F87171',
      methodPatch: '#A78BFA',
      methodOptions: '#9A8E7A',
    }
  },
  daylight: {
    name: 'Daylight',
    description: 'Clean light — minimal',
    isDark: false,
    colors: {
      accent: '#5E6AD2',
      accentBright: '#6872D9',
      accentGlow: 'rgba(94,106,210,0.15)',
      background: '#F7F7F8',
      backgroundDeep: '#EBEBEF',
      backgroundBase: '#F7F7F8',
      backgroundElevated: '#FFFFFF',
      foreground: '#1A1A2E',
      foregroundMuted: '#6C6F85',
      surface: 'rgba(0,0,0,0.03)',
      surfaceHover: 'rgba(0,0,0,0.05)',
      border: 'rgba(0,0,0,0.08)',
      borderHover: 'rgba(0,0,0,0.12)',
      borderAccent: 'rgba(94,106,210,0.25)',
      card: '#FFFFFF',
      muted: '#F0F0F3',
      input: '#FFFFFF',
      sidebar: '#F0F0F3',
      sidebarAccent: 'rgba(0,0,0,0.04)',
      statusSuccess: '#16A34A',
      statusInfo: '#5E6AD2',
      statusWarning: '#D97706',
      statusError: '#DC2626',
      methodGet: '#16A34A',
      methodPost: '#5E6AD2',
      methodPut: '#D97706',
      methodDelete: '#DC2626',
      methodPatch: '#7C3AED',
      methodOptions: '#6C6F85',
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { setTheme: setNextTheme } = useNextTheme()
  const [theme, setTheme] = useState<Theme>('midnight')

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('meowl-theme') as Theme
    const themeToUse = (saved && themeConfigs[saved]) ? saved : 'midnight'
    setTheme(themeToUse)

    const config = themeConfigs[themeToUse]
    const root = document.documentElement
    if (config.isDark) {
      root.classList.add('dark')
      setNextTheme('dark')
    } else {
      root.classList.remove('dark')
      setNextTheme('light')
    }
  }, [setNextTheme])

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('meowl-theme', newTheme)

    const config = themeConfigs[newTheme]
    if (config.isDark) {
      setNextTheme('dark')
    } else {
      setNextTheme('light')
    }
  }

  // Apply CSS variables when theme changes
  useEffect(() => {
    const config = themeConfigs[theme]
    const root = document.documentElement

    // Core shadcn tokens
    root.style.setProperty('--primary', config.colors.accent)
    root.style.setProperty('--primary-foreground', '#FFFFFF')
    root.style.setProperty('--accent', config.colors.accent)
    root.style.setProperty('--accent-foreground', '#FFFFFF')
    root.style.setProperty('--accent-bright', config.colors.accentBright)
    root.style.setProperty('--accent-glow', config.colors.accentGlow)
    root.style.setProperty('--background', config.colors.background)
    root.style.setProperty('--foreground', config.colors.foreground)
    root.style.setProperty('--muted', config.colors.muted)
    root.style.setProperty('--muted-foreground', config.colors.foregroundMuted)
    root.style.setProperty('--border', config.colors.border)
    root.style.setProperty('--input', config.colors.input)
    root.style.setProperty('--ring', config.colors.accent)
    root.style.setProperty('--card', config.colors.card)
    root.style.setProperty('--card-foreground', config.colors.foreground)
    root.style.setProperty('--popover', config.colors.card)
    root.style.setProperty('--popover-foreground', config.colors.foreground)

    // Linear extended tokens
    root.style.setProperty('--background-deep', config.colors.backgroundDeep)
    root.style.setProperty('--background-base', config.colors.backgroundBase)
    root.style.setProperty('--background-elevated', config.colors.backgroundElevated)
    root.style.setProperty('--surface', config.colors.surface)
    root.style.setProperty('--surface-hover', config.colors.surfaceHover)
    root.style.setProperty('--foreground-muted', config.colors.foregroundMuted)
    root.style.setProperty('--foreground-subtle', config.isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.45)')
    root.style.setProperty('--border-default', config.colors.border)
    root.style.setProperty('--border-hover', config.colors.borderHover)
    root.style.setProperty('--border-accent', config.colors.borderAccent)

    // Sidebar tokens
    root.style.setProperty('--sidebar', config.colors.sidebar)
    root.style.setProperty('--sidebar-foreground', config.colors.foreground)
    root.style.setProperty('--sidebar-primary', config.colors.accent)
    root.style.setProperty('--sidebar-primary-foreground', '#FFFFFF')
    root.style.setProperty('--sidebar-accent', config.colors.sidebarAccent)
    root.style.setProperty('--sidebar-accent-foreground', config.colors.accent)
    root.style.setProperty('--sidebar-border', config.colors.border)
    root.style.setProperty('--sidebar-ring', config.colors.accent)

    // Status & method colors
    root.style.setProperty('--status-success', config.colors.statusSuccess)
    root.style.setProperty('--status-info', config.colors.statusInfo)
    root.style.setProperty('--status-warning', config.colors.statusWarning)
    root.style.setProperty('--status-error', config.colors.statusError)
    root.style.setProperty('--method-get', config.colors.methodGet)
    root.style.setProperty('--method-post', config.colors.methodPost)
    root.style.setProperty('--method-put', config.colors.methodPut)
    root.style.setProperty('--method-delete', config.colors.methodDelete)
    root.style.setProperty('--method-patch', config.colors.methodPatch)
    root.style.setProperty('--method-options', config.colors.methodOptions)

    // Theme class management
    root.classList.remove('midnight', 'aurora', 'sakura', 'solar', 'daylight')
    root.classList.add(theme)

    if (config.isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function getThemeConfig(theme: Theme) {
  return themeConfigs[theme]
}

export function getAllThemes() {
  return Object.entries(themeConfigs).map(([key, config]) => ({
    id: key as Theme,
    ...config
  }))
}