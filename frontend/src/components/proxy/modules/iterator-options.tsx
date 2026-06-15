import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import type { AttackOptions } from "./iterator-types"

interface Props {
  options: AttackOptions
  onChange: (opts: AttackOptions) => void
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--foreground-muted)' }}>{label}</span>
      {children}
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors" style={{ background: checked ? 'var(--accent-glow)' : 'transparent' }}>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-semibold" style={{ color: 'var(--foreground)' }}>{label}</span>
        <span className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>{desc}</span>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function OptionsTab({ options, onChange }: Props) {
  const u = (overrides: Partial<AttackOptions>) => onChange({ ...options, ...overrides })

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        {/* Connection */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--accent)' }}>Connection</h3>
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
            <Field label="Threads">
              <Input type="number" min={1} max={500} value={options.threads} onChange={e => u({ threads: parseInt(e.target.value) || 1 })}
                className="h-8 text-xs font-mono" style={{ background: 'var(--background-elevated)', borderColor: 'var(--border-default)' }} />
            </Field>
            <Field label="Timeout (s)">
              <Input type="number" min={1} max={120} value={options.timeout} onChange={e => u({ timeout: parseInt(e.target.value) || 10 })}
                className="h-8 text-xs font-mono" style={{ background: 'var(--background-elevated)', borderColor: 'var(--border-default)' }} />
            </Field>
            <Field label="Throttle / Delay (ms)">
              <Input type="number" min={0} max={60000} step={50} value={options.delay} onChange={e => u({ delay: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs font-mono" style={{ background: 'var(--background-elevated)', borderColor: 'var(--border-default)' }} />
            </Field>
            <Field label="Max Retries">
              <Input type="number" min={0} max={10} value={options.maxRetries} onChange={e => u({ maxRetries: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs font-mono" style={{ background: 'var(--background-elevated)', borderColor: 'var(--border-default)' }} />
            </Field>
          </div>
        </section>

        {/* Behavior */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'var(--accent)' }}>Behavior</h3>
          <div className="flex flex-col gap-1 p-2 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-default)' }}>
            <Toggle label="Follow Redirects" desc="Follow 3xx redirect responses" checked={options.followRedirects} onChange={v => u({ followRedirects: v })} />
            {options.followRedirects && (
              <div className="pl-6 pb-2">
                <Field label="Max Redirect Depth">
                  <Input type="number" min={1} max={20} value={options.maxRedirects} onChange={e => u({ maxRedirects: parseInt(e.target.value) || 5 })}
                    className="h-7 w-20 text-xs font-mono" style={{ background: 'var(--background-elevated)', borderColor: 'var(--border-default)' }} />
                </Field>
              </div>
            )}
            <Toggle label="Update Content-Length" desc="Automatically recalculate body length header" checked={options.updateContentLength} onChange={v => u({ updateContentLength: v })} />
            <Toggle label="Keep-Alive" desc="Use persistent connections for speed" checked={options.keepAlive} onChange={v => u({ keepAlive: v })} />
            <Toggle label="Cookie Handling" desc="Update cookies from server responses (CSRF bypass)" checked={options.cookieHandling} onChange={v => u({ cookieHandling: v })} />
          </div>
        </section>
      </div>
    </div>
  )
}
