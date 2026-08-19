"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Pencil,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { CSVMetadata, CSVRow } from "@/lib/types/csv";
import { formatColumnName, formatCSVValue } from "@/lib/utils/csv";

/** Parse a date string into a sortable timestamp */
function parseSortDate(dateStr: string): number {
  const trimmed = dateStr.trim();
  // DD/MM/YYYY
  const dmy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])).getTime();
  // YYYY-MM-DD
  const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])).getTime();
  // Fallback: try native parsing
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export function DataTable({
  rows,
  metadata,
  onChange,
  onRemoveColumn,
}: {
  rows: CSVRow[];
  metadata: CSVMetadata;
  onChange: (rows: CSVRow[]) => void;
  onRemoveColumn?: (column: string) => void;
}) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<CSVRow>({});
  const [adding, setAdding] = useState(false);
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" } | null>(
    null,
  );

  const visibleRows = useMemo(() => {
    if (!sort) return rows.map((row, index) => ({ row, index }));
    const numeric = metadata.numericColumns.includes(sort.column);
    const isDate = sort.column === metadata.dateColumn;
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const left = a.row[sort.column];
        const right = b.row[sort.column];
        let comparison: number;
        if (numeric) {
          comparison = Number(left) - Number(right);
        } else if (isDate) {
          // Parse DD/MM/YYYY or YYYY-MM-DD for chronological sort
          const dl = parseSortDate(String(left ?? ""));
          const dr = parseSortDate(String(right ?? ""));
          comparison = dl - dr;
        } else {
          comparison = String(left ?? "").localeCompare(String(right ?? ""), "es-AR", {
              numeric: true,
              sensitivity: "base",
            });
        }
        return comparison === 0
          ? a.index - b.index
          : sort.direction === "asc"
            ? comparison
            : -comparison;
      });
  }, [rows, metadata.numericColumns, metadata.dateColumn, sort]);

  const toggleSort = (column: string) =>
    setSort(current =>
      current?.column === column
        ? { column, direction: current.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" },
    );

  const start = (i: number) => {
    setEditing(i);
    setDraft({ ...rows[i] });
  };

  const save = () => {
    if (editing === null) return;
    const next = [...rows];
    next[editing] = draft;
    onChange(next);
    setEditing(null);
  };

  const add = () => {
    onChange([...rows, draft]);
    setDraft({});
    setAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardDescription>Raw records</CardDescription>
          <CardTitle className="mt-1 font-mono">Data table</CardTitle>
        </div>
        <CardAction>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setDraft(Object.fromEntries(metadata.columns.map(c => [c, ""])));
              setAdding(true);
            }}
          >
            <Plus data-icon="inline-start" />
            Add row
          </Button>
        </CardAction>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                {metadata.columns.map(c => (
                  <th key={c} className="px-4 py-3 font-medium">
                    <div className="inline-flex items-center gap-1">
                      <button
                        className="inline-flex items-center gap-1.5 hover:text-foreground"
                        onClick={() => toggleSort(c)}
                      >
                        {formatColumnName(c)}
                        {sort?.column === c ? (
                          sort.direction === "asc" ? (
                            <ArrowUp />
                          ) : (
                            <ArrowDown />
                          )
                        ) : (
                          <ChevronsUpDown />
                        )}
                      </button>
                      {onRemoveColumn && metadata.columns.length > 1 && (
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => onRemoveColumn(c)}
                          aria-label={`Remove column ${formatColumnName(c)}`}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X />
                        </Button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ row, index: i }) => (
                <tr key={i} className="border-t">
                  <>
                    {metadata.columns.map(c => (
                      <td key={c} className="px-4 py-3">
                        {editing === i ? (
                          <Input
                            value={String(draft[c] ?? "")}
                            onChange={e => setDraft({ ...draft, [c]: e.target.value })}
                            className="h-8 text-xs"
                          />
                        ) : (
                          formatCSVValue(row[c], metadata.numericColumns.includes(c))
                        )}
                      </td>
                    ))}
                  </>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {editing === i ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={save}
                            aria-label="Save row"
                          >
                            <Check />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditing(null)}
                            aria-label="Cancel editing"
                          >
                            <X />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => start(i)}
                            aria-label="Edit row"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              onChange(rows.filter((_, index) => index !== i))
                            }
                            aria-label="Delete row"
                          >
                            <Trash2 />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {adding && (
          <div className="border-t bg-muted/20 p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {metadata.columns.map(c => (
                <label key={c} className="text-xs font-medium">
                  {formatColumnName(c)}
                  <Input
                    value={String(draft[c] ?? "")}
                    onChange={e => setDraft({ ...draft, [c]: e.target.value })}
                    className="mt-1"
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={add}>
                Add row
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
