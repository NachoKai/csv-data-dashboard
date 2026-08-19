export type CSVValue = string | number
export type CSVRow = Record<string, CSVValue>

export type CSVMetadata = {
  columns: string[]
  dateColumn: string | null
  numericColumns: string[]
}

export type Dataset = { rows: CSVRow[]; metadata: CSVMetadata }

export type WorkspaceDataset = Dataset & {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

const numberFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 })

export function formatColumnName(column: string) {
  return column
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(usd|ars|eur|gbp|roi|id|api|csv|url)\b/gi, (match) => match.toUpperCase())
    .replace(/^./, (match) => match.toUpperCase())
}

export function formatCSVValue(value: CSVValue | null | undefined, numeric = false) {
  if (value === null || value === undefined || value === '') return '—'
  if (numeric && Number.isFinite(Number(value))) return numberFormatter.format(Number(value))
  return String(value)
}

export const EMPTY_DATASET: Dataset = { rows: [], metadata: { columns: [], dateColumn: null, numericColumns: [] } }

export function createWorkspaceDataset(name = 'Untitled CSV', dataset: Dataset = EMPTY_DATASET): WorkspaceDataset {
  return { ...dataset, id: crypto.randomUUID(), name, createdAt: Date.now(), updatedAt: Date.now() }
}

export const SAMPLE_CSV = `Month,Revenue,Orders,Conversion Rate\nJan 2024,12400,186,3.8\nFeb 2024,13800,204,4.1\nMar 2024,15200,229,4.6\nApr 2024,14900,218,4.3\nMay 2024,17600,267,5.2\nJun 2024,19300,291,5.6\nJul 2024,22100,328,6.1\nAug 2024,24800,374,6.8\nSep 2024,23600,352,6.4\nOct 2024,27900,419,7.2\nNov 2024,31200,468,7.9\nDec 2024,35600,534,8.6}`

export function inferMetadata(rows: CSVRow[]): CSVMetadata {
  const columns = rows.length ? Object.keys(rows[0]) : []
  const numericColumns = columns.filter((column) => rows.length > 0 && rows.every((row) => row[column] !== '' && Number.isFinite(Number(row[column]))))
  const dateColumn = columns.find((column) => /date|month|time|year/i.test(column)) ?? null
  return { columns, dateColumn, numericColumns }
}

export function toChartRows(rows: CSVRow[], metadata: CSVMetadata) {
  const labelColumn = metadata.dateColumn ?? metadata.columns.find((column) => !metadata.numericColumns.includes(column)) ?? null
  return rows.map((row, index) => {
    const rawLabel = labelColumn ? String(row[labelColumn] ?? '').trim() : ''
    const fallback = metadata.numericColumns.map((column) => String(row[column] ?? '')).filter(Boolean).slice(0, 2).join(' · ')
    return { label: rawLabel || fallback || `Registro ${index + 1}`, ...Object.fromEntries(metadata.numericColumns.map((column) => [column, Number(row[column]) || 0])) }
  })
}

export function datasetFromLegacy(value: unknown): WorkspaceDataset[] {
  if (Array.isArray(value)) return value as WorkspaceDataset[]
  if (value && typeof value === 'object' && 'rows' in value && 'metadata' in value) return [createWorkspaceDataset('Untitled CSV', value as Dataset)]
  return [createWorkspaceDataset()]
}
