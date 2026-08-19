'use client'

import { useRef, useState } from 'react'
import { CheckCircle2, RotateCcw } from 'lucide-react'
import { FileUp, ClipboardPaste, Play, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Dataset } from '@/lib/types/csv'
import { SAMPLE_CSV } from '@/lib/types/csv'
import { parseCsv } from '@/lib/hooks/useCsvParser'

export function CsvInput({ onParsed }: { onParsed: (dataset: Dataset) => void }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  function parse(value = text) {
    try {
      setError('')
      const dataset = parseCsv(value)
      onParsed(dataset)
      setText('')
      if (inputRef.current) inputRef.current.value = ''
      setSuccess(`Imported ${dataset.rows.length} rows and ${dataset.metadata.columns.length} columns`)
      requestAnimationFrame(() => textareaRef.current?.focus())
    } catch (e) {
      setSuccess('')
      setError(e instanceof Error ? e.message : 'Could not parse CSV')
    }
  }
  return <section className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Start here</p><h2 className="mt-1 font-mono text-lg font-semibold">Bring in your data</h2></div><ClipboardPaste className="size-5 text-muted-foreground" /></div>
    <textarea ref={textareaRef} value={text} onChange={(e) => { setText(e.target.value); setSuccess('') }} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); parse() } }} placeholder="Paste CSV content here…" className="min-h-40 w-full resize-y rounded-xl border bg-background px-4 py-3 font-mono text-xs leading-6 outline-none transition focus:ring-2 focus:ring-ring" aria-label="CSV content" />
    <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground"><span>{text.length.toLocaleString('es-AR')} caracteres · {text ? text.split(/\\r?\\n/).length : 0} líneas</span><span>Atajo: Ctrl/Cmd + Enter</span></div>
    {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
    {success && <div className="flex items-center justify-between gap-3 rounded-lg bg-chart-2/10 px-3 py-2 text-sm text-chart-2"><span className="flex items-center gap-2"><CheckCircle2 className="size-4" />{success}</span><button className="flex items-center gap-1 text-xs underline-offset-4 hover:underline" onClick={() => { setSuccess(''); textareaRef.current?.focus() }}><RotateCcw className="size-3" />Paste another</button></div>}
    <div className="flex flex-wrap gap-2"><Button onClick={() => parse()} disabled={!text.trim()}><Play data-icon="inline-start" />Parse CSV</Button><Button variant="outline" onClick={() => inputRef.current?.click()}><FileUp data-icon="inline-start" />Upload file</Button><input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const file = e.target.files?.[0]; if (file) file.text().then((value) => { setText(value); parse(value) }).catch(() => setError('Could not read that file')) }} /></div>
    <button className="flex items-center gap-2 text-left text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => { setText(SAMPLE_CSV); parse(SAMPLE_CSV) }}><Sparkles className="size-3.5" />Try a sample dataset</button>
  </section>
} 
