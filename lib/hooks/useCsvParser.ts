import Papa from 'papaparse'
import type { CSVRow, Dataset } from '@/lib/types/csv'
import { inferMetadata } from '@/lib/types/csv'

export function parseCsv(csvText: string): Dataset {
  if (!csvText.trim()) throw new Error('Paste or upload a CSV file first.')
  const result = Papa.parse<CSVRow>(csvText.trim(), { header: true, skipEmptyLines: true, transform: (value) => value.trim() })
  if (result.errors.length) throw new Error(result.errors[0].message)
  const rows = result.data.filter((row) => Object.values(row).some((value) => value !== ''))
  if (!rows.length || !Object.keys(rows[0]).length) throw new Error('Your CSV needs a header row and at least one data row.')
  return { rows, metadata: inferMetadata(rows) }
}

export function useCsvParser() {
  return { parseCsv }
}

export function coerceRows(rows: CSVRow[], numericColumns: string[]) {
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, numericColumns.includes(key) ? Number(value) || 0 : value])))
} 
