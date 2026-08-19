"use client";

import { useRef, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { FileUp, ClipboardPaste, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import type { Dataset } from "@/lib/types/csv";
import { SAMPLE_CSV } from "@/lib/types/csv";
import { parseCsv } from "@/lib/hooks/useCsvParser";

export function CsvInput({ onParsed }: { onParsed: (dataset: Dataset) => void }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function parse(value = text) {
    try {
      setError("");
      const dataset = parseCsv(value);
      onParsed(dataset);
      setText("");
      if (inputRef.current) inputRef.current.value = "";
      setSuccess(
        `Imported ${dataset.rows.length} rows and ${dataset.metadata.columns.length} columns`,
      );
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (e) {
      setSuccess("");
      setError(e instanceof Error ? e.message : "Could not parse CSV");
    }
  }

  return (
    <Card className="flex flex-col gap-5">
      <CardHeader>
        <div>
          <CardDescription>Start here</CardDescription>
          <CardTitle className="mt-1 font-mono">Bring in your data</CardTitle>
        </div>
        <CardAction>
          <ClipboardPaste className="size-5 text-muted-foreground" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={e => {
            setText(e.target.value);
            setSuccess("");
          }}
          onKeyDown={e => {
            if (
              e.key === "Enter" &&
              (e.metaKey || e.ctrlKey) &&
              !e.nativeEvent.isComposing &&
              e.keyCode !== 229
            ) {
              e.preventDefault();
              parse();
            }
          }}
          placeholder="Paste CSV content here…"
          className="min-h-40 w-full resize-y font-mono text-xs leading-6"
          aria-label="CSV content"
        />
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            {text.length.toLocaleString("es-AR")} caracteres ·{" "}
            {text ? text.split(/\\r?\\n/).length : 0} líneas
          </span>
          <span>Atajo: Ctrl/Cmd + Enter</span>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-3">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mt-3">
            <CheckCircle2 />
            <AlertDescription className="flex items-center justify-between gap-3 text-chart-2">
              <span>{success}</span>
            </AlertDescription>
            <AlertAction>
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSuccess("");
                  textareaRef.current?.focus();
                }}
              >
                <RotateCcw className="size-3" />
                Paste another
              </Button>
            </AlertAction>
          </Alert>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => parse()} disabled={!text.trim()}>
            <Play data-icon="inline-start" />
            Parse CSV
          </Button>
          <Button variant="outline" onClick={() => inputRef.current?.click()}>
            <FileUp data-icon="inline-start" />
            Upload file
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file)
                file
                  .text()
                  .then(value => {
                    setText(value);
                    parse(value);
                  })
                  .catch(() => setError("Could not read that file"));
            }}
          />
        </div>
        <Button
          variant="link"
          size="sm"
          className="mt-3 justify-start px-0 text-muted-foreground"
          onClick={() => {
            setText(SAMPLE_CSV);
            parse(SAMPLE_CSV);
          }}
        >
          <Sparkles className="size-3.5" />
          Try a sample dataset
        </Button>
      </CardContent>
    </Card>
  );
}
