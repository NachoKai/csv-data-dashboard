"use client";

import * as React from "react";
import { Check, FileSpreadsheet, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { WorkspaceDataset } from "@/lib/types/csv";

type Props = {
  datasets: WorkspaceDataset[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
};

export function DatasetTabs({
  datasets,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: Props) {
  return (
    <Card aria-label="CSV datasets" className="mb-6">
      <div className="flex items-center justify-end border-b p-2">
        <Button size="sm" variant="outline" onClick={onNew}>
          <Plus data-icon="inline-start" />
          New CSV
        </Button>
      </div>
      <div
        role="tablist"
        aria-label="CSV datasets"
        className="flex min-w-0 items-center gap-1 overflow-x-auto p-2"
      >
        {datasets.map(dataset => (
          <DatasetTab
            key={dataset.id}
            dataset={dataset}
            active={dataset.id === activeId}
            onSelect={() => onSelect(dataset.id)}
            onRename={name => onRename(dataset.id, name)}
            onDelete={() => onDelete(dataset.id)}
          />
        ))}
      </div>
    </Card>
  );
}

function DatasetTab({
  dataset,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  dataset: WorkspaceDataset;
  active: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="tab"
      aria-selected={active}
      className={`group flex shrink-0 items-center gap-1 rounded-xl border px-2 py-1.5 transition ${active ? "border-primary/30 bg-primary/10" : "border-transparent hover:bg-muted"}`}
    >
      <button
        onClick={onSelect}
        className="flex min-w-0 items-center gap-2 px-1 text-left"
      >
        <FileSpreadsheet className="size-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-medium">{dataset.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {dataset.rows.length}
        </span>
      </button>
      <RenameButton name={dataset.name} onRename={onRename} />
      <Button
        size="icon-xs"
        variant="ghost"
        onClick={onDelete}
        aria-label={`Delete ${dataset.name}`}
      >
        <X />
      </Button>
    </div>
  );
}

function RenameButton({
  name,
  onRename,
}: {
  name: string;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  if (editing)
    return (
      <form
        className="flex items-center gap-1"
        onSubmit={event => {
          event.preventDefault();
          const value = new FormData(event.currentTarget).get("name")?.toString().trim();
          onRename(value || "Untitled CSV");
          setEditing(false);
        }}
      >
        <Input
          autoFocus
          name="name"
          defaultValue={name}
          className="h-7 w-28 text-xs"
          aria-label="Dataset name"
        />
        <Button type="submit" size="icon-xs" variant="ghost" aria-label="Save name">
          <Check />
        </Button>
      </form>
    );
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      onClick={() => setEditing(true)}
      aria-label={`Rename ${name}`}
    >
      <Pencil />
    </Button>
  );
}
