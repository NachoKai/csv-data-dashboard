import { describe, it, expect } from "vitest";
import {
  formatColumnName,
  formatCSVValue,
  createWorkspaceDataset,
  inferMetadata,
  toChartRows,
  datasetFromLegacy,
} from "@/lib/utils/csv";
import { EMPTY_DATASET, DEFAULT_DATASET_NAME, EDITING_SENTINEL } from "@/lib/constants/csv";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe("constants", () => {
  it("DEFAULT_DATASET_NAME is 'Untitled CSV'", () => {
    expect(DEFAULT_DATASET_NAME).toBe("Untitled CSV");
  });

  it("EDITING_SENTINEL is '__editing__'", () => {
    expect(EDITING_SENTINEL).toBe("__editing__");
  });

  it("EMPTY_DATASET has no rows or columns", () => {
    expect(EMPTY_DATASET.rows).toEqual([]);
    expect(EMPTY_DATASET.metadata.columns).toEqual([]);
    expect(EMPTY_DATASET.metadata.dateColumn).toBeNull();
    expect(EMPTY_DATASET.metadata.numericColumns).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// formatColumnName
// ---------------------------------------------------------------------------

describe("formatColumnName", () => {
  it("converts snake_case: capitalizes first letter, not each word", () => {
    expect(formatColumnName("revenue_total")).toBe("Revenue total");
  });

  it("uppercases known acronyms embedded in snake_case", () => {
    expect(formatColumnName("revenue_usd")).toBe("Revenue USD");
  });

  it("converts camelCase to Title Case", () => {
    expect(formatColumnName("conversionRate")).toBe("Conversion Rate");
  });

  it("converts kebab-case: capitalizes first letter, not each word", () => {
    expect(formatColumnName("order-total")).toBe("Order total");
  });

  it("uppercases known acronyms in isolation", () => {
    expect(formatColumnName("total_usd")).toBe("Total USD");
    expect(formatColumnName("api_key")).toBe("API key");
    expect(formatColumnName("csv_url")).toBe("CSV URL");
    expect(formatColumnName("id")).toBe("ID");
    expect(formatColumnName("roi")).toBe("ROI");
  });

  it("handles a single-word column name", () => {
    expect(formatColumnName("month")).toBe("Month");
  });

  it("handles already clean names", () => {
    expect(formatColumnName("Revenue")).toBe("Revenue");
  });

  it("collapses extra whitespace", () => {
    expect(formatColumnName("  some___column  ")).toBe("Some column");
  });
});

// ---------------------------------------------------------------------------
// formatCSVValue
// ---------------------------------------------------------------------------

describe("formatCSVValue", () => {
  it("returns em-dash for null/undefined/empty", () => {
    expect(formatCSVValue(null)).toBe("—");
    expect(formatCSVValue(undefined)).toBe("—");
    expect(formatCSVValue("")).toBe("—");
  });

  it("returns string representation for non-numeric text", () => {
    expect(formatCSVValue("hello")).toBe("hello");
  });

  it("formats numeric values with locale formatting when numeric flag is true", () => {
    // es-AR locale uses . as thousands separator
    const result = formatCSVValue(12400, true);
    expect(result).toBe("12.400");
  });

  it("does not format numbers when numeric flag is false", () => {
    expect(formatCSVValue(12400, false)).toBe("12400");
  });

  it("formats string-enclosed numbers when numeric is true", () => {
    const result = formatCSVValue("31200", true);
    expect(result).toBe("31.200");
  });

  it("returns string for NaN and Infinity (not finite)", () => {
    // NaN and Infinity are not finite, so the numeric formatting branch is skipped
    expect(formatCSVValue(NaN, true)).toBe("NaN");
    expect(formatCSVValue(Infinity, true)).toBe("Infinity");
  });

  it("truncates to 2 decimal places", () => {
    const result = formatCSVValue(1234.567, true);
    expect(result).toBe("1.234,57");
  });
});

// ---------------------------------------------------------------------------
// createWorkspaceDataset
// ---------------------------------------------------------------------------

describe("createWorkspaceDataset", () => {
  it("creates a dataset with a generated id", () => {
    const ds = createWorkspaceDataset();
    expect(ds.id).toBeTruthy();
    expect(typeof ds.id).toBe("string");
  });

  it("uses the provided name or default", () => {
    expect(createWorkspaceDataset().name).toBe(DEFAULT_DATASET_NAME);
    expect(createWorkspaceDataset("My CSV").name).toBe("My CSV");
  });

  it("sets createdAt and updatedAt timestamps", () => {
    const before = Date.now();
    const ds = createWorkspaceDataset();
    const after = Date.now();
    expect(ds.createdAt).toBeGreaterThanOrEqual(before);
    expect(ds.createdAt).toBeLessThanOrEqual(after);
    expect(ds.updatedAt).toBe(ds.createdAt);
  });

  it("uses the provided dataset or EMPTY_DATASET", () => {
    const empty = createWorkspaceDataset();
    expect(empty.rows).toEqual([]);
    expect(empty.metadata.columns).toEqual([]);

    const custom = createWorkspaceDataset("X", {
      rows: [{ a: 1 }],
      metadata: { columns: ["a"], dateColumn: null, numericColumns: ["a"] },
    });
    expect(custom.rows).toHaveLength(1);
  });

  it("generates unique ids for each call", () => {
    const a = createWorkspaceDataset();
    const b = createWorkspaceDataset();
    expect(a.id).not.toBe(b.id);
  });
});

// ---------------------------------------------------------------------------
// inferMetadata
// ---------------------------------------------------------------------------

describe("inferMetadata", () => {
  it("returns empty metadata for an empty array", () => {
    const meta = inferMetadata([]);
    expect(meta.columns).toEqual([]);
    expect(meta.numericColumns).toEqual([]);
    expect(meta.dateColumn).toBeNull();
  });

  it("detects numeric columns", () => {
    const rows = [
      { name: "Alice", score: "95" },
      { name: "Bob", score: "80" },
    ];
    const meta = inferMetadata(rows);
    expect(meta.columns).toEqual(["name", "score"]);
    expect(meta.numericColumns).toEqual(["score"]);
  });

  it("detects date columns by name pattern", () => {
    const rows = [
      { date: "2024-01", revenue: "100" },
      { date: "2024-02", revenue: "200" },
    ];
    const meta = inferMetadata(rows);
    expect(meta.dateColumn).toBe("date");
  });

  it("detects 'Month' as a date column", () => {
    const rows = [{ Month: "Jan", Revenue: "100" }];
    const meta = inferMetadata(rows);
    expect(meta.dateColumn).toBe("Month");
  });

  it("returns null dateColumn when no date-like column exists", () => {
    const rows = [
      { product: "A", quantity: "5" },
      { product: "B", quantity: "10" },
    ];
    const meta = inferMetadata(rows);
    expect(meta.dateColumn).toBeNull();
  });

  it("treats mixed-type columns as non-numeric", () => {
    const rows = [
      { status: "active", count: "1" },
      { status: "123", count: "2" },
    ];
    const meta = inferMetadata(rows);
    // "status" has "active" in first row → not numeric
    expect(meta.numericColumns).toEqual(["count"]);
  });
});

// ---------------------------------------------------------------------------
// toChartRows
// ---------------------------------------------------------------------------

describe("toChartRows", () => {
  const rows = [
    { Month: "Jan", Revenue: "100", Orders: "10" },
    { Month: "Feb", Revenue: "200", Orders: "20" },
  ];
  const metadata = {
    columns: ["Month", "Revenue", "Orders"],
    dateColumn: "Month",
    numericColumns: ["Revenue", "Orders"],
  };

  it("uses the date column as label", () => {
    const chartData = toChartRows(rows, metadata);
    expect(chartData[0].label).toBe("Jan");
    expect(chartData[1].label).toBe("Feb");
  });

  it("includes numeric values as numbers", () => {
    const chartData = toChartRows(rows, metadata) as Record<string, unknown>[];
    expect(chartData[0]["Revenue"]).toBe(100);
    expect(chartData[0]["Orders"]).toBe(10);
  });

  it("uses first non-numeric column as fallback label", () => {
    const fallbackRows = [
      { product: "Widget", revenue: "100" },
      { product: "Gadget", revenue: "200" },
    ];
    const fallbackMeta = {
      columns: ["product", "revenue"],
      dateColumn: null,
      numericColumns: ["revenue"],
    };
    const chartData = toChartRows(fallbackRows, fallbackMeta);
    expect(chartData[0].label).toBe("Widget");
  });

  it("uses fallback label when no label column and fewer than 2 numeric cols", () => {
    const rows = [
      { a: "10" },
      { a: "30" },
    ];
    const meta = {
      columns: ["a"],
      dateColumn: null,
      numericColumns: ["a"],
    };
    const chartData = toChartRows(rows, meta);
    // Only 1 numeric column, fallback joins first 2 → just the one value
    expect(chartData[0].label).toBe("10");
    expect(chartData[1].label).toBe("30");
  });

  it("uses Registro fallback when label is empty", () => {
    const rows = [
      { a: "" },
    ];
    const meta = {
      columns: ["a"],
      dateColumn: null,
      numericColumns: [],
    };
    const chartData = toChartRows(rows, meta);
    expect(chartData[0].label).toBe("Registro 1");
  });

  it("builds a multi-column fallback label from first 2 numeric columns", () => {
    const rows = [
      { rev: "100", orders: "10", conv: "5" },
    ];
    const meta = {
      columns: ["rev", "orders", "conv"],
      dateColumn: null,
      numericColumns: ["rev", "orders", "conv"],
    };
    const chartData = toChartRows(rows, meta);
    // label should use first 2 non-empty numeric values joined by ' · '
    expect(chartData[0].label).toBe("100 · 10");
  });

  it("sorts rows by date (DD/MM/YYYY) when dateColumn is set", () => {
    const dateRows = [
      { "Fecha pago": "22/07/2026", Monto: "40145" },
      { "Fecha pago": "19/12/2025", Monto: "25894" },
      { "Fecha pago": "19/03/2026", Monto: "43657" },
      { "Fecha pago": "19/01/2026", Monto: "47059" },
      { "Fecha pago": "18/08/2025", Monto: "34105" },
    ];
    const meta = {
      columns: ["Fecha pago", "Monto"],
      dateColumn: "Fecha pago",
      numericColumns: ["Monto"],
    };
    const chartData = toChartRows(dateRows, meta);
    // Should be sorted oldest → newest
    expect(chartData.map((r) => r.label)).toEqual([
      "18/08/2025",
      "19/12/2025",
      "19/01/2026",
      "19/03/2026",
      "22/07/2026",
    ]);
  });

  it("sorts rows by date (YYYY-MM-DD) when dateColumn is set", () => {
    const dateRows = [
      { date: "2026-03-01", val: "10" },
      { date: "2025-12-01", val: "20" },
      { date: "2026-01-01", val: "30" },
    ];
    const meta = {
      columns: ["date", "val"],
      dateColumn: "date",
      numericColumns: ["val"],
    };
    const chartData = toChartRows(dateRows, meta);
    expect(chartData.map((r) => r.label)).toEqual([
      "2025-12-01",
      "2026-01-01",
      "2026-03-01",
    ]);
  });

  it("does not sort when no dateColumn is set", () => {
    const rows2 = [
      { product: "C", revenue: "300" },
      { product: "A", revenue: "100" },
      { product: "B", revenue: "200" },
    ];
    const meta = {
      columns: ["product", "revenue"],
      dateColumn: null,
      numericColumns: ["revenue"],
    };
    const chartData = toChartRows(rows2, meta);
    // Original order preserved (fallback label, no date sort)
    expect(chartData.map((r) => r.label)).toEqual(["C", "A", "B"]);
  });
});

// ---------------------------------------------------------------------------
// datasetFromLegacy
// ---------------------------------------------------------------------------

describe("datasetFromLegacy", () => {
  it("wraps a legacy single-dataset object into an array", () => {
    const legacy = {
      rows: [{ a: 1 }],
      metadata: { columns: ["a"], dateColumn: null, numericColumns: ["a"] },
    };
    const result = datasetFromLegacy(legacy);
    expect(result).toHaveLength(1);
    expect(result[0].rows).toEqual(legacy.rows);
    expect(result[0].name).toBe(DEFAULT_DATASET_NAME);
  });

  it("passes through an array of WorkspaceDatasets unchanged", () => {
    const datasets = [
      createWorkspaceDataset("DS1"),
      createWorkspaceDataset("DS2"),
    ];
    const result = datasetFromLegacy(datasets);
    expect(result).toBe(datasets);
  });

  it("returns a default dataset for null/undefined input", () => {
    const result = datasetFromLegacy(null);
    expect(result).toHaveLength(1);
    expect(result[0].rows).toEqual([]);
  });

  it("returns a default dataset for an empty string", () => {
    const result = datasetFromLegacy("");
    expect(result).toHaveLength(1);
    expect(result[0].rows).toEqual([]);
  });
});
