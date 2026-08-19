import type {
  CSVMetadata,
  CSVRow,
  CSVValue,
  Dataset,
  WorkspaceDataset,
} from "@/lib/types/csv";
import { DEFAULT_DATASET_NAME, EMPTY_DATASET } from "@/lib/constants/csv";

const numberFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

/** Format a column name for display (snake_case/camelCase → Title Case) */
export function formatColumnName(column: string) {
  return column
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b(usd|ars|eur|gbp|roi|id|api|csv|url)\b/gi, match => match.toUpperCase())
    .replace(/^./, match => match.toUpperCase());
}

/** Format a CSV cell value for display, optionally applying numeric formatting */
export function formatCSVValue(value: CSVValue | null | undefined, numeric = false) {
  if (value === null || value === undefined || value === "") return "—";
  if (numeric && Number.isFinite(Number(value)))
    return numberFormatter.format(Number(value));
  return String(value);
}

/** Create a new WorkspaceDataset with generated id and timestamps */
export function createWorkspaceDataset(
  name = DEFAULT_DATASET_NAME,
  dataset: Dataset = EMPTY_DATASET,
): WorkspaceDataset {
  return {
    ...dataset,
    id: crypto.randomUUID(),
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** Reconstruct raw CSV text from rows and metadata */
export function toRawCsv(rows: CSVRow[], metadata: CSVMetadata): string {
  if (!metadata.columns.length) return "";
  const escape = (val: CSVValue | undefined) => {
    const s = String(val ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}` + '"'
      : s;
  };
  const header = metadata.columns.map(escape).join(",");
  const body = rows.map(row => metadata.columns.map(c => escape(row[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

/** Infer column metadata (numeric, date) from a set of CSV rows */
export function inferMetadata(rows: CSVRow[]): CSVMetadata {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const numericColumns = columns.filter(
    column =>
      rows.length > 0 &&
      rows.every(row => row[column] !== "" && Number.isFinite(Number(row[column]))),
  );
  const dateColumn =
    columns.find(column => /date|month|time|year|fecha|pago/i.test(column)) ?? null;
  return { columns, dateColumn, numericColumns };
}

/** Parse a date string in DD/MM/YYYY or YYYY-MM-DD format */
function parseDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();

  // DD/MM/YYYY format
  const dmyMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    const [_, day, month, year] = dmyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // YYYY-MM-DD format
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const [_, year, month, day] = ymdMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  // Try native Date parsing as fallback
  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Auto-detect a date column from row data by checking if a non-numeric
 * column contains values that parse as dates.
 */
function autoDetectDateColumn(
  rows: CSVRow[],
  numericColumns: string[],
): string | null {
  const candidates = Object.keys(rows[0] ?? {}).filter(
    c => !numericColumns.includes(c),
  );
  for (const col of candidates) {
    // A column is a date column if the majority of its values parse as dates
    const parsed = rows.map(row => parseDate(String(row[col] ?? "")));
    const valid = parsed.filter(d => d !== null).length;
    if (valid > rows.length * 0.5) return col;
  }
  return null;
}

/** Transform CSV rows into a shape suitable for chart rendering */
export function toChartRows(rows: CSVRow[], metadata: CSVMetadata) {
  // Detect the effective date column: prefer metadata, fallback to auto-detect
  const dateColumn =
    metadata.dateColumn ?? (rows.length ? autoDetectDateColumn(rows, metadata.numericColumns) : null);

  const labelColumn =
    dateColumn ??
    metadata.columns.find(column => !metadata.numericColumns.includes(column)) ??
    null;

  // Build chart rows
  const chartRows = rows.map((row, index) => {
    const rawLabel = labelColumn ? String(row[labelColumn] ?? "").trim() : "";
    const fallback = metadata.numericColumns
      .map(column => String(row[column] ?? ""))
      .filter(Boolean)
      .slice(0, 2)
      .join(" · ");

    return {
      label: rawLabel || fallback || `Registro ${index + 1}`,
      _date: dateColumn ? parseDate(String(row[dateColumn] ?? "")) : null,
      ...Object.fromEntries(
        metadata.numericColumns.map(column => [column, Number(row[column]) || 0]),
      ),
    };
  });

  // Sort by date if we detected a date column
  if (dateColumn) {
    chartRows.sort((a, b) => {
      if (a._date && b._date) return a._date.getTime() - b._date.getTime();
      if (a._date) return -1;
      if (b._date) return 1;
      return 0;
    });
  }

  // Remove _date helper field before returning
  return chartRows.map(({ _date, ...rest }) => rest);
}

/** Migrate legacy single-dataset format into the current multi-dataset format */
export function datasetFromLegacy(value: unknown): WorkspaceDataset[] {
  if (Array.isArray(value)) return value as WorkspaceDataset[];
  if (value && typeof value === "object" && "rows" in value && "metadata" in value)
    return [createWorkspaceDataset(DEFAULT_DATASET_NAME, value as Dataset)];
  return [createWorkspaceDataset()];
}
