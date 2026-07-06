import os
import glob
import re

directory = '/home/danik/Desktop/meowl/frontend/src/components/proxy/modules'

replacements = [
    # Enhance active tabs specifically
    (r'data-\[state=active\]:bg-\[var\(--primary\)\] data-\[state=active\]:text-black data-\[state=active\]:shadow-\[0_0_15px_var\(--primary\)\]', r'data-[state=active]:bg-sky-500'),
    (r'data-\[state=active\]:bg-\[var\(--status-warning\)\] data-\[state=active\]:text-black data-\[state=active\]:shadow-\[0_0_15px_var\(--status-warning\)\]', r'data-[state=active]:bg-amber-500'),
    (r'data-\[state=active\]:bg-\[var\(--accent\)\] data-\[state=active\]:text-white data-\[state=active\]:shadow-\[0_0_15px_var\(--accent\)\]', r'data-[state=active]:bg-purple-500'),
    (r'data-\[state=active\]:bg-\[var\(--status-error\)\] data-\[state=active\]:text-white data-\[state=active\]:shadow-\[0_0_15px_var\(--status-error\)\]', r'data-[state=active]:bg-rose-500'),
    
    # Text glow
    (r'text-\[var\(--primary\)\] drop-shadow-\[0_0_8px_var\(--primary\)\]', r'text-sky-400'),
    (r'text-\[var\(--status-success\)\] drop-shadow-\[0_0_8px_var\(--status-success\)\]', r'text-emerald-400'),
    (r'text-\[var\(--status-warning\)\] drop-shadow-\[0_0_8px_var\(--status-warning\)\]', r'text-amber-400'),
    (r'text-\[var\(--status-error\)\] drop-shadow-\[0_0_8px_var\(--status-error\)\]', r'text-red-400'),
    (r'text-\[var\(--accent\)\] drop-shadow-\[0_0_8px_var\(--accent\)\]', r'text-[var(--accent)]'),

    # Background glows
    (r'bg-\[var\(--primary\)\]/10 shadow-\[0_0_10px_var\(--primary\)_inset\]', r'bg-sky-500/10'),
    (r'bg-\[var\(--status-success\)\]/10 shadow-\[0_0_10px_var\(--status-success\)_inset\]', r'bg-emerald-500/10'),
    (r'bg-\[var\(--status-error\)\]/10 shadow-\[0_0_10px_var\(--status-error\)_inset\]', r'bg-red-500/10'),
    
    # Borders
    (r'border-\[var\(--primary\)\]/(\d+)', r'border-sky-500/\1'),
    (r'border-\[var\(--status-success\)\]/(\d+)', r'border-emerald-500/\1'),
    (r'border-\[var\(--status-error\)\]/(\d+)', r'border-red-500/\1'),
]

for filename in glob.glob(f'{directory}/**/*.tsx', recursive=True):
    with open(filename, 'r') as f:
        content = f.read()
    
    original = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
        
    if content != original:
        with open(filename, 'w') as f:
            f.write(content)
        print(f'Reverted {filename}')

