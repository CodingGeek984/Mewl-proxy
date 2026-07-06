import { KeyRound, Download, Info } from "lucide-react"
import { CyberPanel } from "@/components/proxy/ui/cyber-panel"
import { Button } from "@/components/ui/button"

export function CertificatesModule() {
  const handleDownload = async () => {
    try {
      // @ts-ignore
      if (window.go?.backend?.App?.SaveCACertToDisk) {
        // @ts-ignore
        const result = await window.go.backend.App.SaveCACertToDisk()
        if (result && result !== "cancelled") {
          alert(`Certificate successfully saved to:\n${result}`)
        }
      } else {
        // Fallback for normal browser mode (React + Vite dev server)
        window.location.href = "http://127.0.0.1:8000/api/cert"
      }
    } catch (e) {
      console.error(e)
      alert(`Error saving CA certificate: ${e}`)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden p-6 items-center justify-center bg-[var(--background-base)]">
      <div className="w-full max-w-2xl">
        <CyberPanel
          title="CA Certificate Installation"
          icon={<KeyRound className="size-4" />}
          className="shadow-2xl border-[var(--tokyo-border-cyan)]"
        >
          <div className="p-8 flex flex-col items-center text-center gap-6 bg-[var(--tokyo-panel-2)]">
            <div className="size-20 rounded-full bg-[var(--tokyo-cyan-soft)] flex items-center justify-center border-2 border-[var(--tokyo-cyan)]/30 mb-2">
              <KeyRound className="size-10 text-[var(--tokyo-cyan)]" />
            </div>
            
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest text-[var(--foreground)] mb-2">Meowl Proxy CA Certificate</h2>
              <p className="text-xs font-mono text-[var(--foreground-muted)] max-w-md mx-auto leading-relaxed">
                To intercept HTTPS traffic, you must install the Meowl Proxy CA Certificate as a trusted root in your browser or operating system.
              </p>
            </div>

            <Button 
              size="lg" 
              onClick={handleDownload}
              className="h-12 px-8 bg-[var(--tokyo-cyan)] text-black hover:bg-[var(--tokyo-cyan)] hover:brightness-110 font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_20px_rgba(115,218,202,0.4)] transition-all active:scale-95"
            >
              <Download className="size-5 mr-3" />
              Download CA Certificate
            </Button>

            <div className="w-full text-left bg-[var(--tokyo-panel)] border border-[var(--tokyo-border-cyan)] rounded-lg p-5 mt-4">
              <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--tokyo-magenta)] mb-4">
                <Info className="size-4" /> Installation Instructions
              </h3>
              <div className="space-y-4 text-[11px] font-mono text-[var(--foreground-muted)]">
                <div>
                  <strong className="text-[var(--tokyo-cyan)] block mb-1">Firefox:</strong>
                  Settings → Privacy & Security → Certificates → View Certificates → Authorities → Import. Select the downloaded certificate and check "Trust this CA to identify websites".
                </div>
                <div>
                  <strong className="text-[var(--tokyo-cyan)] block mb-1">Chrome / Edge (Windows):</strong>
                  Settings → Security → Manage certificates. Import the certificate into the "Trusted Root Certification Authorities" store.
                </div>
                <div>
                  <strong className="text-[var(--tokyo-cyan)] block mb-1">macOS:</strong>
                  Double-click the downloaded certificate to open Keychain Access. Drag it into the "System" keychain. Double-click it, expand "Trust", and select "Always Trust".
                </div>
              </div>
            </div>
          </div>
        </CyberPanel>
      </div>
    </div>
  )
}
