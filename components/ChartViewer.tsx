"use client";

import { useMemo, useRef, useState } from "react";
import { Copy, Download, X } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { CSVMetadata, CSVRow } from "@/lib/types/csv";
import { formatColumnName, formatCSVValue, toRawCsv } from "@/lib/utils/csv";

type Kind = "line" | "bar" | "area" | "pie" | "raw";
const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 text-sm shadow-md">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-foreground">
            {formatCSVValue(entry.value, true)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ChartViewer({
  rows,
  metadata,
  datasetName = "csv",
  rawCsv,
}: {
  rows: CSVRow[];
  metadata: CSVMetadata;
  datasetName?: string;
  rawCsv?: string;
}) {
  const [kind, setKind] = useState<Kind[]>(["line"]);
  const [hidden, setHidden] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  // Axis selection state
  const defaultXColumn =
    metadata.dateColumn ??
    metadata.columns.find(c => !metadata.numericColumns.includes(c)) ??
    metadata.columns[0] ??
    "";
  const [xColumn, setXColumn] = useState(defaultXColumn);
  const [yColumns, setYColumns] = useState<string[]>([...metadata.numericColumns]);

  // Reset selections when metadata changes
  const prevMetadataRef = useRef(metadata);
  if (prevMetadataRef.current !== metadata) {
    prevMetadataRef.current = metadata;
    const newX =
      metadata.dateColumn ??
      metadata.columns.find(c => !metadata.numericColumns.includes(c)) ??
      metadata.columns[0] ??
      "";
    setXColumn(newX);
    setYColumns([...metadata.numericColumns]);
    setHidden([]);
  }

  // Available columns for each axis
  const xOptions = metadata.columns;
  const yOptions = metadata.numericColumns;

  // Toggle a Y column on/off
  const toggleY = (col: string) =>
    setYColumns(items =>
      items.includes(col) ? items.filter(c => c !== col) : [...items, col],
    );

  // Build chart data based on selected columns
  const data = useMemo(() => {
    const labelCol = xColumn || metadata.columns[0];
    const isDateCol = labelCol === metadata.dateColumn;
    const sortedRows = [...rows];
    if (isDateCol) {
      sortedRows.sort((a, b) => {
        const da = new Date(String(a[labelCol] ?? "")).getTime();
        const db = new Date(String(b[labelCol] ?? "")).getTime();
        return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
      });
    }
    return sortedRows.map((row, index) => ({
      label: String(row[labelCol] ?? "").trim() || `Row ${index + 1}`,
      ...Object.fromEntries(
        yColumns.map(col => [col, Number(row[col]) || 0]),
      ),
    }));
  }, [rows, metadata, xColumn, yColumns]);

  const toggle = (key: string) =>
    setHidden(items =>
      items.includes(key) ? items.filter(item => item !== key) : [...items, key],
    );
  async function download() {
    if (!ref.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(ref.current, { backgroundColor: "#f8fafc" });
    const link = document.createElement("a");
    link.download = `${datasetName.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "csv"}-chart.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
  return (
    <Card className="flex min-h-127.5 flex-col">
      <CardHeader>
        <div>
          <CardDescription>Signal view</CardDescription>
          <CardTitle className="mt-1 font-mono">Patterns over time</CardTitle>
        </div>
        <CardAction>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={download}>
              <Download data-icon="inline-start" />
              PNG
            </Button>
            <ToggleGroup
              value={kind}
              onValueChange={value => { if (value.length) setKind([value[value.length - 1]] as Kind[]); }}
              variant="outline"
              size="sm"
            >
              {(["line", "area", "bar", "pie", "raw"] as Kind[]).map(item => (
                <ToggleGroupItem key={item} value={item} className="capitalize">
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {/* Axis selectors */}
        <div className="mb-4 flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              X axis
            </span>
            <div className="flex flex-wrap gap-1">
              {xOptions.map(col => (
                <Button
                  key={col}
                  size="xs"
                  variant={xColumn === col ? "default" : "outline"}
                  onClick={() => setXColumn(col)}
                >
                  {formatColumnName(col)}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Y axis
            </span>
            <div className="flex flex-wrap gap-1">
              {yOptions.map(col => (
                <Button
                  key={col}
                  size="xs"
                  variant={yColumns.includes(col) ? "default" : "outline"}
                  onClick={() => toggleY(col)}
                >
                  {formatColumnName(col)}
                  {yColumns.includes(col) && (
                    <X className="ml-1 size-3" />
                  )}
                </Button>
              ))}
              {!yOptions.length && (
                <span className="text-xs text-muted-foreground">No numeric columns</span>
              )}
            </div>
          </div>
        </div>

        {kind[0] === "raw" ? (
          <RawCsvView rawCsv={rawCsv ?? toRawCsv(rows, metadata)} />
        ) : !yColumns.length ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select at least one Y axis column to visualize.
          </div>
        ) : (
          <div ref={ref} className="min-h-80 flex-1 rounded-xl bg-muted/30 p-2 pt-5">
            <ResponsiveContainer width="100%" height={350}>
              {kind[0] === "pie" ? (
                <PieChart>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Pie
                    data={data}
                    dataKey={yColumns[0]}
                    nameKey="label"
                    outerRadius={125}
                  >
                    {data.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              ) : kind[0] === "bar" ? (
                <BarChart data={data}>
                  <ChartFrame />
                  <Legend />
                  {yColumns.map(
                    (key, i) =>
                      !hidden.includes(key) && (
                        <Bar
                          key={key}
                          dataKey={key}
                          name={formatColumnName(key)}
                          fill={colors[i % colors.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      ),
                  )}
                </BarChart>
              ) : kind[0] === "area" ? (
                <AreaChart data={data}>
                  <ChartFrame />
                  <Legend onClick={e => toggle(String(e.dataKey))} />
                  {yColumns.map(
                    (key, i) =>
                      !hidden.includes(key) && (
                        <Area
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={formatColumnName(key)}
                          stroke={colors[i % colors.length]}
                          fill={colors[i % colors.length]}
                          fillOpacity={0.18}
                        />
                      ),
                  )}
                </AreaChart>
              ) : (
                <LineChart data={data}>
                  <ChartFrame />
                  <Legend onClick={e => toggle(String(e.dataKey))} />
                  {yColumns.map(
                    (key, i) =>
                      !hidden.includes(key) && (
                        <Line
                          key={key}
                          type="monotone"
                          dataKey={key}
                          name={formatColumnName(key)}
                          stroke={colors[i % colors.length]}
                          strokeWidth={2.5}
                          dot={false}
                        />
                      ),
                  )}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
function ChartFrame() {
  return (
    <>
      <CartesianGrid vertical={false} strokeDasharray="4 4" />
      <XAxis dataKey="label" tickLine={false} axisLine={false} />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickFormatter={value => formatCSVValue(value, true)}
      />
      <Tooltip content={<ChartTooltip />} />
    </>
  );
}

function RawCsvView({ rawCsv }: { rawCsv: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(rawCsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lineCount = rawCsv.split("\n").length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {lineCount} lines · {rawCsv.length.toLocaleString()} chars
        </span>
        <Button size="xs" variant="outline" onClick={copy}>
          <Copy data-icon="inline-start" />
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <pre className="flex-1 overflow-auto rounded-xl bg-muted/30 p-4 font-mono text-xs leading-6">
        {rawCsv}
      </pre>
    </div>
  );
}
