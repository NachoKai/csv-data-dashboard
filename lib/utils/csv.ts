import type { CSVMetadata, CSVRow, CSVValue, Dataset, WorkspaceDataset } from "@/lib/types/csv";
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
    .replace(/\b(usd|ars|eur|gbp|roi|id|api|csv|url)\b/gi, (match) =>
      match.toUpperCase(),
    )
    .replace(/^./, (match) => match.toUpperCase());
}

/** Format a CSV cell value for display, optionally applying numeric formatting */
export function formatCSVValue(
  value: CSVValue | null | undefined,
  numeric = false,
) {
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

/** Infer column metadata (numeric, date) from a set of CSV rows */
export function inferMetadata(rows: CSVRow[]): CSVMetadata {
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const numericColumns = columns.filter(
    (column) =>
      rows.length > 0 &&
      rows.every(
        (row) => row[column] !== "" && Number.isFinite(Number(row[column])),
      ),
  );
  const dateColumn =
    columns.find((column) => /date|month|time|year/i.test(column)) ?? null;
  return { columns, dateColumn, numericColumns };
}

/** Transform CSV rows into a shape suitable for chart rendering */
export function toChartRows(rows: CSVRow[], metadata: CSVMetadata) {
  const labelColumn =
    metadata.dateColumn ??
    metadata.columns.find(
      (column) => !metadata.numericColumns.includes(column),
    ) ??
    null;

  return rows.map((row, index) => {
    const rawLabel = labelColumn ? String(row[labelColumn] ?? "").trim() : "";
    const fallback = metadata.numericColumns
      .map((column) => String(row[column] ?? ""))
      .filter(Boolean)
      .slice(0, 2)
      .join(" · ");

    return {
      label: rawLabel || fallback || `Registro ${index + 1}`,
      ...Object.fromEntries(
        metadata.numericColumns.map((column) => [
          column,
          Number(row[column]) || 0,
        ]),
      ),
    };
  });
}

/** Migrate legacy single-dataset format into the current multi-dataset format */
export function datasetFromLegacy(value: unknown): WorkspaceDataset[] {
  if (Array.isArray(value)) return value as WorkspaceDataset[];
  if (
    value &&
    typeof value === "object" &&
    "rows" in value &&
    "metadata" in value
  )
    return [
      createWorkspaceDataset(DEFAULT_DATASET_NAME, value as Dataset),
    ];
  return [createWorkspaceDataset()];
}
