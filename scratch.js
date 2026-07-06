const fs = require('fs');
const path = 'frontend/src/components/proxy/modules/target.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  { p: /bg-background(?!\/)/g, r: 'bg-[var(--tokyo-panel)]' },
  { p: /bg-background\/[0-9]+/g, r: 'bg-transparent' },
  { p: /bg-muted\/5/g, r: 'bg-[var(--tokyo-panel-2)]' },
  { p: /bg-muted\/10/g, r: 'bg-[var(--tokyo-panel-2)]' },
  { p: /bg-muted\/20/g, r: 'bg-[var(--tokyo-cyan-soft)]' },
  { p: /border-border\/[0-9]+/g, r: 'border-[var(--tokyo-border-cyan)]' },
  { p: /text-muted-foreground\/[0-9]+/g, r: 'text-[var(--tokyo-cyan)]/50' },
  { p: /text-muted-foreground/g, r: 'text-[var(--tokyo-cyan)]/50' },
  { p: /bg-sky-500\/10/g, r: 'bg-[var(--tokyo-cyan-soft)]' },
  { p: /bg-sky-500\/20/g, r: 'bg-[var(--tokyo-cyan-soft)]' },
  { p: /bg-sky-500/g, r: 'bg-[var(--tokyo-cyan)]' },
  { p: /border-sky-500\/[0-9]+/g, r: 'border-[var(--tokyo-cyan)]' },
  { p: /border-sky-500/g, r: 'border-[var(--tokyo-cyan)]' },
  { p: /text-amber-[0-9]+/g, r: 'text-[var(--tokyo-magenta)]' },
  { p: /bg-amber-[0-9]+/g, r: 'bg-[var(--tokyo-magenta)]' },
  { p: /border-amber-[0-9]+\/[0-9]+/g, r: 'border-[var(--tokyo-border-magenta)]' },
  { p: /text-rose-[0-9]+/g, r: 'text-red-500' },
  { p: /bg-rose-[0-9]+/g, r: 'bg-red-500' },
  { p: /text-foreground\/[0-9]+/g, r: 'text-[var(--tokyo-cyan)]' },
  { p: /text-foreground/g, r: 'text-[var(--tokyo-cyan)]' },
];

replacements.forEach(({p, r}) => {
  content = content.replace(p, r);
});

fs.writeFileSync(path, content);
console.log('Replaced tokens in target.tsx');
