import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeProvider as CustomThemeProvider } from '@/lib/theme'
import { ProxyApp } from "./components/proxy/app"
import './index.css'

// Ensure dark class is set on root element immediately
document.documentElement.classList.add('dark')

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'monospace', background: '#000', height: '100vh', overflow: 'auto' }}>
          <h2>React Crash!</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.stack || this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <CustomThemeProvider>
          <ProxyApp />
        </CustomThemeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
