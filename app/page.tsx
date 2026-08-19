"use client";

import { useEffect, useMemo, useState } from "react";
import { Database, FileSpreadsheet, Rows3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CsvInput } from "@/components/CsvInput";
import { ChartViewer } from "@/components/ChartViewer";
import { DataTable } from "@/components/DataTable";
import { DatasetTabs } from "@/components/DatasetTabs";
import { useIndexedDB } from "@/lib/hooks/useIndexedDB";
import {
  createWorkspaceDataset,
  EMPTY_DATASET,
  type Dataset,
  type WorkspaceDataset,
} from "@/lib/types/csv";

export default function Page() {
  const storage = useIndexedDB();
  const [datasets, setDatasets] = useState<WorkspaceDataset[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storage.load().then(saved => {
      setDatasets(saved);
      setActiveId(saved[0]?.id ?? "");
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) storage.save(datasets);
  }, [datasets, loaded]);

  const active =
    datasets.find(dataset => dataset.id === activeId) ??
    datasets[0] ??
    createWorkspaceDataset();
  const dataset: Dataset = active;

  const updateActive = (next: Dataset) =>
    setDatasets(items =>
      items.map(item =>
        item.id === active.id ? { ...item, ...next, updatedAt: Date.now() } : item,
      ),
    );

  const stats = useMemo(
    () => [
      { label: "Rows", value: dataset.rows.length, icon: Rows3 },
      { label: "Columns", value: dataset.metadata.columns.length, icon: Database },
      {
        label: "Numeric fields",
        value: dataset.metadata.numericColumns.length,
        icon: FileSpreadsheet,
      },
    ],
    [dataset],
  );

  function addDataset() {
    const next = createWorkspaceDataset();
    setDatasets(items => [...items, next]);
    setActiveId(next.id);
  }

  function parseIntoActive(next: Dataset, fileName?: string) {
    updateActive(next);
    if (fileName)
      setDatasets(items =>
        items.map(item =>
          item.id === active.id
            ? { ...item, name: fileName.replace(/\.csv$/i, "") || "Untitled CSV" }
            : item,
        ),
      );
  }

  function rename(id: string, name: string) {
    setDatasets(items =>
      items.map(item =>
        item.id === id
          ? {
              ...item,
              name: name === "__editing__" ? "__editing__" : name || "Untitled CSV",
              updatedAt: Date.now(),
            }
          : item,
      ),
    );
  }

  function remove(id: string) {
    if (datasets.length === 1) {
      if (!window.confirm("Delete this CSV and start with a blank workspace?")) return;
      const next = createWorkspaceDataset();
      setDatasets([next]);
      setActiveId(next.id);
      return;
    }
    const remaining = datasets.filter(item => item.id !== id);
    setDatasets(remaining);
    if (id === activeId) setActiveId(remaining[0].id);
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-360 items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="font-mono text-sm font-bold tracking-tight">tabular</p>
              <p className="text-xs text-muted-foreground">CSV data workbench</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="secondary">
              <span className="size-1.5 rounded-full bg-chart-2" />
              Local-first workspace
            </Badge>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-360 px-5 py-8 lg:px-8">
        <div className="mb-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Badge variant="secondary" className="mb-2">
              Data, made legible
            </Badge>
            <h1 className="max-w-2xl text-balance font-mono text-3xl font-bold tracking-tight md:text-5xl">
              See the shape of your CSV.
            </h1>
            <p className="mt-3 max-w-xl text-pretty leading-6 text-muted-foreground">
              Keep separate datasets in their own tabs, then paste, chart, edit, and
              export without leaving your browser.
            </p>
          </div>
          <div className="flex gap-2">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="px-4 py-3">
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="size-3.5" />
                    <span className="text-xs uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="mt-1 font-mono text-xl font-semibold">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <DatasetTabs
          datasets={datasets.length ? datasets : [active]}
          activeId={active.id}
          onSelect={setActiveId}
          onNew={addDataset}
          onRename={rename}
          onDelete={remove}
        />
        <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="default" className="size-2 rounded-full p-0" />
          Editing{" "}
          <strong className="text-foreground">
            {active.name === "__editing__" ? "Untitled CSV" : active.name}
          </strong>
        </div>
        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <CsvInput onParsed={next => parseIntoActive(next)} />
          <ChartViewer
            rows={dataset.rows}
            metadata={dataset.metadata}
            datasetName={active.name}
          />
        </div>
        <Separator className="my-5" />
        <DataTable
          rows={dataset.rows}
          metadata={dataset.metadata}
          onChange={rows => updateActive({ ...dataset, rows })}
        />
      </div>
    </main>
  );
}
