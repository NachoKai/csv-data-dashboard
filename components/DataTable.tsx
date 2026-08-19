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
  formatColumnName,
  formatCSVValue,
  type CSVMetadata,
  type CSVRow,
} from "@/lib/types/csv";
export function DataTable({
  rows,
  metadata,
  onChange,
}: {
  rows: CSVRow[];
  metadata: CSVMetadata;
  onChange: (rows: CSVRow[]) => void;
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
    return rows
      .map((row, index) => ({ row, index }))
      .sort((a, b) => {
        const left = a.row[sort.column];
        const right = b.row[sort.column];
        const comparison = numeric
          ? Number(left) - Number(right)
          : String(left ?? "").localeCompare(String(right ?? ""), "es-AR", {
              numeric: true,
              sensitivity: "base",
            });
        return comparison === 0
          ? a.index - b.index
          : sort.direction === "asc"
            ? comparison
            : -comparison;
      });
  }, [rows, metadata.numericColumns, sort]);

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
    <section className="rounded-2xl border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Raw records
          </p>
          <h2 className="mt-1 font-mono text-lg font-semibold">Data table</h2>
        </div>
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
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              {metadata.columns.map(c => (
                <th key={c} className="px-4 py-3 font-medium">
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
                        <input
                          value={String(draft[c] ?? "")}
                          onChange={e => setDraft({ ...draft, [c]: e.target.value })}
                          className="w-full rounded border bg-background px-2 py-1 text-xs"
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
                          onClick={() => onChange(rows.filter((_, index) => index !== i))}
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
                <input
                  value={String(draft[c] ?? "")}
                  onChange={e => setDraft({ ...draft, [c]: e.target.value })}
                  className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm"
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
    </section>
  );
}
