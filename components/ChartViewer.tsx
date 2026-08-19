"use client";

import { useRef, useState } from "react";
import { Download } from "lucide-react";
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
import { formatColumnName, formatCSVValue, toChartRows } from "@/lib/types/csv";

type Kind = "line" | "bar" | "area" | "pie";
const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function ChartViewer({
  rows,
  metadata,
  datasetName = "csv",
}: {
  rows: CSVRow[];
  metadata: CSVMetadata;
  datasetName?: string;
}) {
  const [kind, setKind] = useState<Kind[]>(["line"]);
  const [hidden, setHidden] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const data = toChartRows(rows, metadata);
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
              {(["line", "area", "bar", "pie"] as Kind[]).map(item => (
                <ToggleGroupItem key={item} value={item} className="capitalize">
                  {item}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {!metadata.numericColumns.length ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Add a numeric column to visualize your data.
          </div>
        ) : (
          <div ref={ref} className="min-h-80 flex-1 rounded-xl bg-muted/30 p-2 pt-5">
            <ResponsiveContainer width="100%" height={350}>
              {kind[0] === "pie" ? (
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={data}
                    dataKey={metadata.numericColumns[0]}
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
                  {metadata.numericColumns.map(
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
                  {metadata.numericColumns.map(
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
                  {metadata.numericColumns.map(
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
      <Tooltip
        formatter={(value, name) => [
          formatCSVValue(value as number, true),
          formatColumnName(String(name)),
        ]}
      />
    </>
  );
}
