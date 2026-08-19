'use client'

import * as React from 'react'
import { Check, FileSpreadsheet, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { WorkspaceDataset } from '@/lib/types/csv'

type Props = { datasets: WorkspaceDataset[]; activeId: string; onSelect: (id: string) => void; onNew: () => void; onRename: (id: string, name: string) => void; onDelete: (id: string) => void }

export function DatasetTabs({ datasets, activeId, onSelect, onNew, onRename, onDelete }: Props) {
  return <section aria-label="CSV datasets" className="mb-6 rounded-2xl border bg-card p-2 shadow-sm"><div className="flex items-center gap-2 overflow-x-auto"><div role="tablist" aria-label="CSV datasets" className="flex min-w-0 flex-1 items-center gap-1">{datasets.map((dataset) => <DatasetTab key={dataset.id} dataset={dataset} active={dataset.id === activeId} onSelect={() => onSelect(dataset.id)} onRename={(name) => onRename(dataset.id, name)} onDelete={() => onDelete(dataset.id)} />)}</div><Button size="sm" variant="outline" onClick={onNew} className="shrink-0"><Plus data-icon="inline-start" />New CSV</Button></div></section>
}

function DatasetTab({ dataset, active, onSelect, onRename, onDelete }: { dataset: WorkspaceDataset; active: boolean; onSelect: () => void; onRename: (name: string) => void; onDelete: () => void }) {
  return <div role="tab" aria-selected={active} className={`group flex max-w-[240px] shrink-0 items-center gap-1 rounded-xl border px-2 py-1.5 transition ${active ? 'border-primary/30 bg-primary/10' : 'border-transparent hover:bg-muted'}`}><button onClick={onSelect} className="flex min-w-0 items-center gap-2 px-1 text-left"><FileSpreadsheet className="size-4 shrink-0 text-primary" /><span className="truncate text-sm font-medium">{dataset.name}</span><span className="shrink-0 text-[11px] text-muted-foreground">{dataset.rows.length}</span></button><RenameButton name={dataset.name} onRename={onRename} /><Button size="icon-xs" variant="ghost" onClick={onDelete} aria-label={`Delete ${dataset.name}`}><X /></Button></div>
}

function RenameButton({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [editing, setEditing] = React.useState(false)
  if (editing) return <form className="flex items-center gap-1" onSubmit={(event) => { event.preventDefault(); const value = new FormData(event.currentTarget).get('name')?.toString().trim(); onRename(value || 'Untitled CSV'); setEditing(false) }}><input autoFocus name="name" defaultValue={name} className="h-7 w-28 rounded-md border bg-background px-2 text-xs outline-none focus:ring-2 focus:ring-ring" aria-label="Dataset name" /><Button type="submit" size="icon-xs" variant="ghost" aria-label="Save name"><Check /></Button></form>
  return <Button size="icon-xs" variant="ghost" onClick={() => setEditing(true)} aria-label={`Rename ${name}`}><Pencil /></Button>
}
